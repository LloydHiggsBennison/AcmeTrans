// src/pages/Dashboard.jsx
import { useState } from "react";
import "../Dashboard.css";
import { exportarCotizacionesExcel } from "../utils/excelExport";
import { SolicitudModal } from "../components/SolicitudModal";
import { useTripProgress } from "../hooks/useTripProgress";
import { useNotification } from "../context/NotificationContext";

function SolicitudItem({ solicitud, onClick }) {
  const getStatusClass = (estado) => {
    switch (estado) {
      case "nuevo": return "solicitud-status-nuevo";
      case "en-curso": return "solicitud-status-en-curso";
      case "completado": return "solicitud-status-completado";
      default: return "";
    }
  };

  const getStatusLabel = (estado) => {
    switch (estado) {
      case "nuevo": return "Nuevo";
      case "en-curso": return "En curso";
      case "completado": return "Completado";
      default: return estado;
    }
  };

  return (
    <div className="solicitud-card" onClick={onClick}>
      <div className="solicitud-left">
        <div className="solicitud-icon">📦</div>
        <div className="solicitud-texts">
          <div className="solicitud-title">#{solicitud.id} - {solicitud.titulo || 'Sin título'}</div>
          <div className="solicitud-meta">
            <span>{solicitud.origen} → {solicitud.destino}</span>
          </div>
        </div>
      </div>
      <div className={`solicitud-status ${getStatusClass(solicitud.estado)}`}>
        {getStatusLabel(solicitud.estado)}
      </div>
    </div>
  );
}

export function Dashboard({
  conductores = [],
  viajes = [],
  solicitudes = [],
  cotizaciones = [],
  eventosCalendario = [],
  userRole,
  onGestionarSolicitud,
  onAsignarSolicitud,
  onGenerarCotizacion,
  onCrearEventoCalendario,
  onAprobar,
  onRechazar,
  onEditar,
}) {
  const [filtro, setFiltro] = useState("nuevo");
  const [modalSolicitud, setModalSolicitud] = useState(null);
  const [modalCotizacion, setModalCotizacion] = useState(null);

  // Estados para director panel
  const [filtroDirector, setFiltroDirector] = useState("todas");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estadoExport, setEstadoExport] = useState("todas");
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const { showNotification } = useNotification();

  const conductoresActivos = conductores.filter((c) => c.estado === "activo").length;

  const hoy = new Date().toISOString().split("T")[0];
  const viajesHoy = viajes.filter((v) => v.fechaSalida?.split("T")[0] === hoy);
  const viajesEnCurso = viajes.filter((v) => v.estado === "en-curso");
  const viajesCompletados = viajes.filter((v) => v.estado === "completado");

  // Usar el hook para calcular progreso en tiempo real
  const viajesEnCursoConMetrics = useTripProgress(viajesEnCurso);

  const solicitudesFiltradas = solicitudes.filter((s) => {
    if (filtro === "nuevo") return s.estado === "nuevo";
    if (filtro === "en-curso") return s.estado === "en-curso";
    if (filtro === "completado") return s.estado === "completado";
    return true;
  });

  // Funciones de director
  const getEstadoLabel = (estado) => {
    switch (estado) {
      case "pendiente": return "Pendiente";
      case "aprobada": return "Aprobada";
      case "rechazada": return "Rechazada";
      default: return estado;
    }
  };

  const cotizacionesFiltradas =
    filtroDirector === "todas"
      ? cotizaciones
      : cotizaciones.filter((c) => c.estado === filtroDirector);

  const handleExportarExcel = () => {
    const result = exportarCotizacionesExcel(cotizaciones, {
      fechaDesde,
      fechaHasta,
      estado: estadoExport,
    });

    if (result.success) {
      showNotification(`✅ Archivo exportado: ${result.nombreArchivo}\nRegistros: ${result.total}`);
    } else {
      showNotification(`❌ Error: ${result.error}`);
    }
  };

  const handleIniciarEdicion = (cotizacion) => {
    setEditando(cotizacion.id);
    // Mapear correctamente los datos de la cotización al formato del formulario
    setFormData({
      ...cotizacion,
      // Des-anidar los costos del objeto detalleCostos si existe
      basePorViaje: cotizacion.detalleCostos?.basePorViaje || cotizacion.basePorViaje || 0,
      combustible: cotizacion.detalleCostos?.combustible || cotizacion.combustible || 0,
      peajes: cotizacion.detalleCostos?.peajes || cotizacion.peajes || 0,
      hospedaje: cotizacion.detalleCostos?.hospedaje || cotizacion.hospedaje || 0,
      viaticos: cotizacion.detalleCostos?.viaticos || cotizacion.viaticos || 0,
    });
  };

  const handleCancelarEdicion = () => {
    setEditando(null);
    setFormData({});
  };


  const handleGuardarEdicion = () => {
    if (onEditar) {
      // Restructurar los datos para que coincidan con la estructura de cotización
      const datosParaGuardar = {
        ...formData,
        // Recalcular el total de costos
        costoTotal: costoTotalCalculado,
        // Restructurar detalleCostos con los valores editados
        detalleCostos: {
          basePorViaje: Number(formData.basePorViaje) || 0,
          combustible: Number(formData.combustible) || 0,
          peajes: Number(formData.peajes) || 0,
          hospedaje: Number(formData.hospedaje) || 0,
          viaticos: Number(formData.viaticos) || 0,
          total: costoTotalCalculado,
        },
      };

      onEditar(editando, datosParaGuardar);
    }
    setEditando(null);
    setFormData({});
  };

  const handleCampoChange = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const costoTotalCalculado =
    Number(formData.basePorViaje || 0) +
    Number(formData.combustible || 0) +
    Number(formData.peajes || 0) +
    Number(formData.hospedaje || 0) +
    Number(formData.viaticos || 0);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard Corporativa AcmeTrans</h1>
          <p className="page-subtitle">
            Resumen del día y gestión {userRole === 'director' ? 'de solicitudes y cotizaciones' : 'rápida de solicitudes'}.
          </p>
        </div>
      </div>

      <div className={`dashboard-container ${userRole === 'director' ? 'with-director' : ''}`}>
        {/* COLUMNA PRINCIPAL */}
        <div className="dashboard-main">
          <div className="dashboard-kpis">
            <div className="card">
              <div className="card-header">Conductores activos</div>
              <div className="card-value">{conductoresActivos}</div>
            </div>
            <div className="card">
              <div className="card-header">Viajes de hoy</div>
              <div className="card-value">{viajesHoy.length}</div>
            </div>
            <div className="card">
              <div className="card-header">Viajes en curso</div>
              <div className="card-value">{viajesEnCurso.length}</div>
            </div>
            <div className="card">
              <div className="card-header">Viajes completados</div>
              <div className="card-value">{viajesCompletados.length}</div>
            </div>
          </div>

          <div>
            <h2 className="section-title">Viajes activos</h2>
            {viajesEnCursoConMetrics.length === 0 ? (
              <div className="placeholder-panel">
                No hay viajes en curso en este momento.
              </div>
            ) : (
              viajesEnCursoConMetrics.map(({ viaje, metrics }) => (
                <div key={viaje.id} className="list-item">
                  <strong>
                    #{viaje.id} · {viaje.origen} → {viaje.destino}
                  </strong>
                  <div className="trip-progress">
                    <span>
                      ✅ {metrics.distanciaRecorrida} km avanzados · {metrics.horasTranscurridas} h transcurridas
                    </span>
                    <span style={{ marginLeft: 10, color: '#9ca3af' }}>
                      ⏳ {metrics.distanciaRestante} km restantes · {metrics.horasRestantes} h restantes
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SIDEBAR DE SOLICITUDES */}
        <div className="dashboard-sidebar">
          <h2 className="sidebar-title">📩 Solicitudes</h2>

          <div className="sidebar-filtros">
            <button
              className={`btn-tab ${filtro === "nuevo" ? "active" : ""}`}
              onClick={() => setFiltro("nuevo")}
            >
              🆕 Nuevo
            </button>
            <button
              className={`btn-tab ${filtro === "en-curso" ? "active" : ""}`}
              onClick={() => setFiltro("en-curso")}
            >
              ⏳ En curso
            </button>
            <button
              className={`btn-tab ${filtro === "completado" ? "active" : ""}`}
              onClick={() => setFiltro("completado")}
            >
              ✔ Completos
            </button>
          </div>

          <div className="sidebar-list">
            {solicitudesFiltradas.length === 0 ? (
              <div className="placeholder-panel">Nada por mostrar.</div>
            ) : (
              solicitudesFiltradas.map((s) => (
                <SolicitudItem
                  key={s.id}
                  solicitud={s}
                  onClick={() => setModalSolicitud(s)}
                />
              ))
            )}
          </div>
        </div>

        {/* PANEL DE COTIZACIONES (Solo para directores) */}
        {userRole === 'director' && (
          <div className="dashboard-director">
            <h2 className="sidebar-title">🧾 Cotizaciones</h2>

            {/* Export compact */}
            <div className="export-compact">
              <div className="label">Exportar a Excel</div>
              <input
                type="date"
                className="input"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                placeholder="Desde"
              />
              <input
                type="date"
                className="input"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                placeholder="Hasta"
              />
              <select
                className="select"
                value={estadoExport}
                onChange={(e) => setEstadoExport(e.target.value)}
              >
                <option value="todas">Todas</option>
                <option value="pendiente">Pendiente</option>
                <option value="aprobada">Aprobada</option>
                <option value="rechazada">Rechazada</option>
              </select>
              <button
                className="btn btn-primary"
                onClick={handleExportarExcel}
              >
                📥 Exportar
              </button>
            </div>

            {/* Filtros de visualización */}
            <div className="sidebar-filtros">
              {["todas", "pendiente", "aprobada", "rechazada"].map((f) => (
                <button
                  key={f}
                  className={`btn-tab ${filtroDirector === f ? "active" : ""}`}
                  onClick={() => setFiltroDirector(f)}
                >
                  {f === "todas"
                    ? "Todas"
                    : f === "pendiente"
                      ? "Pendientes"
                      : f === "aprobada"
                        ? "Aprobadas"
                        : "Rechazadas"}
                </button>
              ))}
            </div>

            {/* Lista de cotizaciones */}
            <div className="cotizaciones-list">
              {cotizacionesFiltradas.length === 0 ? (
                <div className="placeholder-panel" style={{ padding: 20 }}>
                  No hay cotizaciones.
                </div>
              ) : (
                cotizacionesFiltradas.map((c) => (
                  <div key={c.id} className="cotizacion-item" onClick={() => setModalCotizacion(c)} style={{ cursor: 'pointer' }}>
                    <div className="cotizacion-header">
                      Cotización #{c.id}
                    </div>
                    <div className="cotizacion-meta">
                      {c.origen} → {c.destino} · {c.tipoCamion} · {c.distanciaKm}km
                    </div>
                    <div className="cotizacion-footer">
                      <span className="cotizacion-precio">
                        ${(c.costoTotal || 0).toLocaleString("es-CL")}
                      </span>
                      <span className={`cotizacion-estado ${c.estado}`}>
                        {getEstadoLabel(c.estado)}
                      </span>
                    </div>
                    {c.estado === "pendiente" && (
                      <div className="cotizacion-actions">
                        <button
                          className="btn btn-ghost"
                          onClick={(e) => { e.stopPropagation(); handleIniciarEdicion(c); }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={(e) => { e.stopPropagation(); onAprobar && onAprobar(c.id); }}
                        >
                          ✔ Aprobar
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={(e) => { e.stopPropagation(); onRechazar && onRechazar(c.id); }}
                        >
                          ✖ Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Solicitud */}
      {modalSolicitud && (
        <SolicitudModal
          solicitud={modalSolicitud}
          conductores={conductores}
          viajes={viajes}
          eventosCalendario={eventosCalendario}
          onClose={() => setModalSolicitud(null)}
          onGestionar={onGestionarSolicitud}
          onAsignar={onAsignarSolicitud}
          onGenerarCotizacion={onGenerarCotizacion}
          onCrearEventoCalendario={onCrearEventoCalendario}
        />
      )}

      {/* Modal ediciónDirector - Completo */}
      {editando && (
        <div className="modal-backdrop" onMouseDown={(e) => {
          // Solo cerrar si hacen click directamente en el backdrop, no en el modal
          if (e.target === e.currentTarget) {
            handleCancelarEdicion();
          }
        }}>
          <div className="modal" style={{ maxWidth: 900 }}>
            <div className="modal-header">
              <h2>✏️ Editar Cotización #{editando}</h2>
              <button
                onClick={handleCancelarEdicion}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#334155";
                  e.target.style.color = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#64748b";
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: 600, overflowY: "auto" }}>
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card-header">Datos del servicio</div>
                <div className="grid-2" style={{ marginTop: 10, marginBottom: 10 }}>
                  <div>
                    <div className="label">Origen</div>
                    <input
                      className="input"
                      value={formData.origen || ''}
                      onChange={(e) => handleCampoChange("origen", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Destino</div>
                    <input
                      className="input"
                      value={formData.destino || ''}
                      onChange={(e) => handleCampoChange("destino", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Distancia (km)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.distanciaKm || ''}
                      onChange={(e) => handleCampoChange("distanciaKm", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Duración (h)</div>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.duracionHoras || ''}
                      onChange={(e) => handleCampoChange("duracionHoras", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Tipo camión</div>
                    <select
                      className="select"
                      value={formData.tipoCamion || 'GC'}
                      onChange={(e) => handleCampoChange("tipoCamion", e.target.value)}
                    >
                      <option value="GC">GC · Gran Capacidad</option>
                      <option value="MC">MC · Mediana Capacidad</option>
                    </select>
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Peso (kg)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.pesoKg || ''}
                      onChange={(e) => handleCampoChange("pesoKg", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Volumen (m³)</div>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.volumenM3 || ''}
                      onChange={(e) => handleCampoChange("volumenM3", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Camiones necesarios</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.camionesNecesarios || ''}
                      onChange={(e) => handleCampoChange("camionesNecesarios", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Conductor</div>
                    <select
                      className="select"
                      value={formData.conductorId || ''}
                      onChange={(e) => handleCampoChange("conductorId", e.target.value)}
                    >
                      <option value="">Sin asignar</option>
                      {conductores.filter(c => c.estado !== "inactivo").map((c) => (
                        <option key={c.id} value={c.id}>
                          #{c.id} · {c.nombre} ({c.origen})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="label">Fecha evento</div>
                    <input
                      type="date"
                      className="input"
                      value={formData.fechaEvento || ''}
                      onChange={(e) => handleCampoChange("fechaEvento", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">Detalle de costos</div>
                <div className="grid-2" style={{ marginTop: 10, marginBottom: 10 }}>
                  <div>
                    <div className="label">Base por viaje ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.basePorViaje || ''}
                      onChange={(e) => handleCampoChange("basePorViaje", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Combustible ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.combustible || ''}
                      onChange={(e) => handleCampoChange("combustible", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Peajes ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.peajes || ''}
                      onChange={(e) => handleCampoChange("peajes", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Hospedaje ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.hospedaje || ''}
                      onChange={(e) => handleCampoChange("hospedaje", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Viáticos ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.viaticos || ''}
                      onChange={(e) => handleCampoChange("viaticos", e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>
                  Total calculado: ${costoTotalCalculado.toLocaleString("es-CL")}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={handleCancelarEdicion}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleGuardarEdicion}>
                💾 Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Cotización */}
      {modalCotizacion && (
        <div className="modal-backdrop" onClick={() => setModalCotizacion(null)}>
          <div className="modal" style={{ maxWidth: 800 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detalle de Cotización #{modalCotizacion.id}</h2>
              <button
                onClick={() => setModalCotizacion(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#64748b",
                  fontSize: "20px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#334155";
                  e.target.style.color = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "transparent";
                  e.target.style.color = "#64748b";
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: 600, overflowY: "auto" }}>
              {/* Información del servicio */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card-header">Información del servicio</div>
                <div className="grid-2" style={{ marginTop: 10, gap: 12, fontSize: 13 }}>
                  <div>
                    <div className="label">Origen</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.origen || 'N/D'}</div>
                  </div>
                  <div>
                    <div className="label">Destino</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.destino || 'N/D'}</div>
                  </div>
                  <div>
                    <div className="label">Distancia</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.distanciaKm || 0} km</div>
                  </div>
                  <div>
                    <div className="label">Duración estimada</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.duracionHoras || 0} horas</div>
                  </div>
                  <div>
                    <div className="label">Tipo de camión</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.tipoCamion || 'N/D'}</div>
                  </div>
                  <div>
                    <div className="label">Estado</div>
                    <div>
                      <span className={`cotizacion-estado ${modalCotizacion.estado}`}>
                        {getEstadoLabel(modalCotizacion.estado)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logística */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card-header">Logística</div>
                <div className="grid-3" style={{ marginTop: 10, gap: 12, fontSize: 13 }}>
                  <div>
                    <div className="label">Peso total</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.pesoKg || 0} kg</div>
                  </div>
                  <div>
                    <div className="label">Volumen total</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.volumenM3 || 0} m³</div>
                  </div>
                  <div>
                    <div className="label">Camiones necesarios</div>
                    <div style={{ fontWeight: 500 }}>{modalCotizacion.camionesNecesarios || 1}</div>
                  </div>
                </div>
              </div>

              {/* Detalle de costos */}
              <div className="card" style={{ marginBottom: 12 }}>
                <div className="card-header">Detalle de costos</div>
                <div style={{ marginTop: 10, fontSize: 13 }}>
                  {modalCotizacion.detalleCostos ? (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <span className="label">Base por viaje:</span>
                        <span style={{ fontWeight: 500 }}>${(modalCotizacion.detalleCostos.basePorViaje || 0).toLocaleString('es-CL')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <span className="label">Combustible:</span>
                        <span style={{ fontWeight: 500 }}>${(modalCotizacion.detalleCostos.combustible || 0).toLocaleString('es-CL')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <span className="label">Peajes:</span>
                        <span style={{ fontWeight: 500 }}>${(modalCotizacion.detalleCostos.peajes || 0).toLocaleString('es-CL')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <span className="label">Hospedaje:</span>
                        <span style={{ fontWeight: 500 }}>${(modalCotizacion.detalleCostos.hospedaje || 0).toLocaleString('es-CL')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <span className="label">Viáticos:</span>
                        <span style={{ fontWeight: 500 }}>${(modalCotizacion.detalleCostos.viaticos || 0).toLocaleString('es-CL')}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ color: '#9ca3af', textAlign: 'center', padding: 10 }}>
                      No hay detalle de costos disponible
                    </div>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 600 }}>Costo Total:</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#3b82f6' }}>
                    ${(modalCotizacion.costoTotal || 0).toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              {/* Información adicional */}
              {(modalCotizacion.solicitudId || modalCotizacion.conductorId || modalCotizacion.fechaEvento || modalCotizacion.fechaCreacion) && (
                <div className="card" style={{ marginTop: 12 }}>
                  <div className="card-header">Información adicional</div>
                  <div className="grid-2" style={{ marginTop: 10, gap: 12, fontSize: 13 }}>
                    {modalCotizacion.solicitudId && (
                      <div>
                        <div className="label">Solicitud ID</div>
                        <div style={{ fontWeight: 500 }}>#{modalCotizacion.solicitudId}</div>
                      </div>
                    )}
                    {modalCotizacion.conductorId && (
                      <div>
                        <div className="label">Conductor asignado</div>
                        <div style={{ fontWeight: 500 }}>
                          {conductores.find(c => c.id === modalCotizacion.conductorId)?.nombre || `ID: ${modalCotizacion.conductorId}`}
                        </div>
                      </div>
                    )}
                    {modalCotizacion.fechaEvento && (
                      <div>
                        <div className="label">Fecha del evento</div>
                        <div style={{ fontWeight: 500 }}>{modalCotizacion.fechaEvento}</div>
                      </div>
                    )}
                    {modalCotizacion.fechaCreacion && (
                      <div>
                        <div className="label">Fecha de creación</div>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(modalCotizacion.fechaCreacion).toLocaleString('es-CL')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModalCotizacion(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
