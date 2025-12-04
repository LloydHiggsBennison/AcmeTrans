// src/pages/Director.jsx
import { useState } from "react";
import { exportarCotizacionesExcel } from "../utils/excelExport";
import { useNotification } from "../context/NotificationContext";

export function Director({ cotizaciones, conductores = [], onAprobar, onRechazar, onEditar }) {
  const [filtro, setFiltro] = useState("todas");
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({});
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estadoExport, setEstadoExport] = useState("todas");
  const { showNotification } = useNotification();

  const filtradas =
    filtro === "todas"
      ? cotizaciones
      : cotizaciones.filter((c) => c.estado === filtro);

  const getEstadoLabel = (estado) => {
    if (estado === "pendiente") return "Pendiente";
    if (estado === "aprobada") return "Aprobada";
    if (estado === "rechazada") return "Rechazada";
    return estado;
  };

  const handleIniciarEdicion = (c) => {
    setEditando(c.id);
    setFormData({
      origen: c.origen || "",
      destino: c.destino || "",
      distanciaKm: c.distanciaKm || 0,
      duracionHoras: c.duracionHoras || 0,
      tipoCamion: c.tipoCamion || "GC",
      pesoKg: c.pesoKg || 0,
      volumenM3: c.volumenM3 || 0,
      camionesNecesarios: c.camionesNecesarios || 1,
      conductorId: c.conductorId || "",
      fechaEvento: c.fechaEvento || "",
      basePorViaje: c.detalleCostos?.basePorViaje || 0,
      combustible: c.detalleCostos?.combustible || 0,
      peajes: c.detalleCostos?.peajes || 0,
      hospedaje: c.detalleCostos?.hospedaje || 0,
      viaticos: c.detalleCostos?.viaticos || 0,
    });
  };

  const handleGuardarEdicion = () => {
    if (!onEditar || !editando) return;

    const costoTotal =
      Number(formData.basePorViaje || 0) +
      Number(formData.combustible || 0) +
      Number(formData.peajes || 0) +
      Number(formData.hospedaje || 0) +
      Number(formData.viaticos || 0);

    onEditar(editando, {
      origen: formData.origen,
      destino: formData.destino,
      distanciaKm: Number(formData.distanciaKm),
      duracionHoras: Number(formData.duracionHoras),
      tipoCamion: formData.tipoCamion,
      pesoKg: Number(formData.pesoKg),
      volumenM3: Number(formData.volumenM3),
      camionesNecesarios: Number(formData.camionesNecesarios),
      conductorId: formData.conductorId ? Number(formData.conductorId) : null,
      fechaEvento: formData.fechaEvento,
      costoTotal,
      detalleCostos: {
        basePorViaje: Number(formData.basePorViaje),
        combustible: Number(formData.combustible),
        peajes: Number(formData.peajes),
        hospedaje: Number(formData.hospedaje),
        viaticos: Number(formData.viaticos),
      },
    });

    setEditando(null);
    setFormData({});
  };

  const handleCancelarEdicion = () => {
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

  const handleExportarExcel = () => {
    const result = exportarCotizacionesExcel(cotizaciones, {
      fechaDesde,
      fechaHasta,
      estado: estadoExport,
    });

    if (result.success) {
      showNotification(`✅ Archivo exportado exitosamente: ${result.nombreArchivo}\n\nTotal de registros: ${result.total}`);
    } else {
      showNotification(`❌ Error al exportar: ${result.error}`);
    }
  };

  const handleVoucher = (c) => {
    const win = window.open("", "_blank");
    if (!win) return;

    const fecha = new Date().toLocaleString("es-CL");

    const html = `
<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Voucher Cotización #${c.id}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #f3f4f6;
      color: #111827;
      padding: 24px;
    }
    .voucher {
      max-width: 720px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      border: 1px solid #e5e7eb;
      padding: 24px 28px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
    }
    .voucher-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    .voucher-title {
      font-size: 20px;
      font-weight: 700;
    }
    .voucher-sub {
      font-size: 12px;
      color: #6b7280;
    }
    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-top: 16px;
      margin-bottom: 6px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px 18px;
      font-size: 13px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      margin: 2px 0;
    }
    .label {
      color: #6b7280;
    }
    .value {
      font-weight: 500;
    }
    .total {
      font-size: 18px;
      font-weight: 700;
      margin-top: 12px;
    }
    .footer {
      margin-top: 20px;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="voucher-header">
      <div>
        <div class="voucher-title">Voucher de Cotización</div>
        <div class="voucher-sub">Corporativa AcmeTrans · ${fecha}</div>
      </div>
      <div style="text-align:right;font-size:12px;">
        <div><strong>N° Cotización:</strong> #${c.id}</div>
        ${c.solicitudId
        ? `<div><strong>Solicitud:</strong> #${c.solicitudId}</div>`
        : ""
      }
      </div>
    </div>

    <div class="section-title">Datos del servicio</div>
    <div class="grid">
      <div><span class="label">Origen:</span> <span class="value">${c.origen
      }</span></div>
      <div><span class="label">Destino:</span> <span class="value">${c.destino
      }</span></div>
      <div><span class="label">Tipo camión:</span> <span class="value">${c.tipoCamion || "N/D"
      }</span></div>
      <div><span class="label">Camiones necesarios:</span> <span class="value">${c.camionesNecesarios || 1
      }</span></div>
      <div><span class="label">Peso total:</span> <span class="value">${c.pesoKg || 0
      } kg</span></div>
      <div><span class="label">Volumen total:</span> <span class="value">${c.volumenM3 || 0
      } m³</span></div>
      <div><span class="label">Distancia estimada:</span> <span class="value">${c.distanciaKm
      } km</span></div>
      <div><span class="label">Duración estimada:</span> <span class="value">${c.duracionHoras
      } h</span></div>
    </div>

    <div class="section-title">Detalle de costos</div>
    <div>
      ${c.detalleCostos
        ? `
      <div class="row">
        <div class="label">Base por viaje:</div>
        <div class="value">$${c.detalleCostos.basePorViaje?.toLocaleString?.("es-CL") || 0}</div>
      </div>
      <div class="row">
        <div class="label">Combustible:</div>
        <div class="value">$${c.detalleCostos.combustible?.toLocaleString?.("es-CL") || 0}</div>
      </div>
      <div class="row">
        <div class="label">Peajes:</div>
        <div class="value">$${c.detalleCostos.peajes?.toLocaleString?.("es-CL") || 0}</div>
      </div>
      <div class="row">
        <div class="label">Hospedaje:</div>
        <div class="value">$${c.detalleCostos.hospedaje?.toLocaleString?.("es-CL") || 0}</div>
      </div>
      <div class="row">
        <div class="label">Viáticos:</div>
        <div class="value">$${c.detalleCostos.viaticos?.toLocaleString?.("es-CL") || 0}</div>
      </div>
      `
        : `<div class="row"><div class="label">Detalle:</div><div class="value">No disponible</div></div>`
      }
    </div>

    <div class="total">
      Total cotización: $${(c.costoTotal || 0).toLocaleString("es-CL")}
    </div>

    <div class="footer">
      Este documento no constituye factura. La presente cotización es referencial y válida según
      las condiciones acordadas con Corporativa AcmeTrans.
    </div>
  </div>

  <script>
    window.print();
  </script>
</body>
</html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">🧾 Panel del Director</h1>
          <p className="page-subtitle">
            Revisión y aprobación de cotizaciones generadas desde operaciones.
          </p>
        </div>
      </div>

      {/* Export Section */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          📊 Exportar a Excel
        </div>
        <div className="grid-3" style={{ marginBottom: 12 }}>
          <div>
            <div className="label">Desde</div>
            <input
              type="date"
              className="input"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Hasta</div>
            <input
              type="date"
              className="input"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Estado</div>
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
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleExportarExcel}
          style={{ width: '100%' }}
        >
          📥 Exportar a Excel
        </button>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="card-header" style={{ marginBottom: 10 }}>
          Filtro de cotizaciones
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["todas", "pendiente", "aprobada", "rechazada"].map((f) => (
            <button
              key={f}
              className={`btn-tab ${filtro === f ? "active" : ""}`}
              onClick={() => setFiltro(f)}
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
      </div>

      {filtradas.length === 0 ? (
        <div className="placeholder-panel">
          No hay cotizaciones para el filtro seleccionado.
        </div>
      ) : (
        <div className="list">
          {filtradas.map((c) => (
            <div key={c.id} className="list-item">
              <div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Cotización #{c.id} · {c.origen} → {c.destino}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  {c.tipoCamion} · {c.camionesNecesarios || 1} camión(es) ·{" "}
                  {c.pesoKg || 0} kg · {c.volumenM3 || 0} m³ ·{" "}
                  {c.distanciaKm} km / {c.duracionHoras} h
                </div>
                <div style={{ fontSize: 13, marginTop: 4 }}>
                  Total estimado:{" "}
                  <strong>
                    $
                    {(c.costoTotal || 0).toLocaleString("es-CL")}
                  </strong>{" "}
                  · Estado: <strong>{getEstadoLabel(c.estado)}</strong>
                </div>
              </div>

              <div style={{ textAlign: "right", minWidth: 180 }}>
                {c.estado === "pendiente" && (
                  <>
                    <button
                      className="btn btn-ghost"
                      style={{ marginBottom: 6, width: "100%" }}
                      onClick={() => handleIniciarEdicion(c)}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      className="btn btn-primary"
                      style={{ marginBottom: 6, width: "100%" }}
                      onClick={() => onAprobar && onAprobar(c.id)}
                    >
                      ✔ Aprobar
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ width: "100%" }}
                      onClick={() => onRechazar && onRechazar(c.id)}
                    >
                      ✖ Rechazar
                    </button>
                  </>
                )}

                {c.estado === "aprobada" && (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 6, width: "100%" }}
                    onClick={() => handleVoucher(c)}
                  >
                    🧾 Generar voucher PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      {editando && (
        <div className="modal-backdrop" onMouseDown={(e) => {
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
                      value={formData.origen}
                      onChange={(e) => handleCampoChange("origen", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Destino</div>
                    <input
                      className="input"
                      value={formData.destino}
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
                      value={formData.distanciaKm}
                      onChange={(e) => handleCampoChange("distanciaKm", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Duración (h)</div>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.duracionHoras}
                      onChange={(e) => handleCampoChange("duracionHoras", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Tipo camión</div>
                    <select
                      className="select"
                      value={formData.tipoCamion}
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
                      value={formData.pesoKg}
                      onChange={(e) => handleCampoChange("pesoKg", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Volumen (m³)</div>
                    <input
                      type="number"
                      step="0.1"
                      className="input"
                      value={formData.volumenM3}
                      onChange={(e) => handleCampoChange("volumenM3", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Camiones necesarios</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.camionesNecesarios}
                      onChange={(e) => handleCampoChange("camionesNecesarios", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2" style={{ marginBottom: 10 }}>
                  <div>
                    <div className="label">Conductor</div>
                    <select
                      className="select"
                      value={formData.conductorId}
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
                      value={formData.fechaEvento}
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
                      value={formData.basePorViaje}
                      onChange={(e) => handleCampoChange("basePorViaje", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Combustible ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.combustible}
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
                      value={formData.peajes}
                      onChange={(e) => handleCampoChange("peajes", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Hospedaje ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.hospedaje}
                      onChange={(e) => handleCampoChange("hospedaje", e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="label">Viáticos ($)</div>
                    <input
                      type="number"
                      className="input"
                      value={formData.viaticos}
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
    </section>
  );
}
