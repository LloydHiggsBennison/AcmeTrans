// src/pages/Dashboard.jsx

import { useState, useMemo } from "react";
import { getTripMetrics } from "../utils/tripMetrics";
import { SolicitudItem } from "../components/SolicitudItem";
import { SolicitudModal } from "../components/SolicitudModal";
import "../Dashboard.css";

export function Dashboard({
  conductores,
  viajes,
  solicitudes,
  onGestionarSolicitud,
  onAsignarSolicitud,
  onGenerarCotizacion, // ← NUEVO
}) {
  const hoyStr = new Date().toISOString().split("T")[0];

  const [modalSolicitud, setModalSolicitud] = useState(null);
  const [filtro, setFiltro] = useState("nuevo");

  const conductoresActivos = conductores.filter(
    (c) => c.estado !== "inactivo"
  ).length;

  const viajesHoy = viajes.filter((v) => v.fecha === hoyStr);
  const viajesEnCurso = viajesHoy.filter((v) => v.estado === "en-curso");
  const viajesCompletados = viajesHoy.filter((v) => v.estado === "completado");

  const viajesEnCursoConMetrics = useMemo(
    () =>
      viajesEnCurso.map((v) => ({
        viaje: v,
        metrics: getTripMetrics(v),
      })),
    [viajesEnCurso]
  );

  const solicitudesFiltradas = solicitudes.filter((s) => s.estado === filtro);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Dashboard Corporativa AcmeTrans</h1>
          <p className="page-subtitle">
            Resumen del día y gestión rápida de solicitudes.
          </p>
        </div>
      </div>

      <div className="dashboard-container">
        {/* IZQUIERDA */}
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
                    {metrics.distanciaRecorrida} km avanzados ·{" "}
                    {metrics.horasTranscurridas} h transcurridas
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DERECHA: SOLICITUDES */}
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
      </div>

      {modalSolicitud && (
        <SolicitudModal
          solicitud={modalSolicitud}
          conductores={conductores}
          onClose={() => setModalSolicitud(null)}
          onGestionar={onGestionarSolicitud}
          onAsignar={onAsignarSolicitud}
          onGenerarCotizacion={onGenerarCotizacion}
        />
      )}
    </section>
  );
}
