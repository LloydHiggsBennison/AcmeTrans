// src/pages/Director.jsx
import { useState } from "react";

export function Director({ cotizaciones, onAprobar, onRechazar }) {
  const [filtro, setFiltro] = useState("todas");

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
        ${
          c.solicitudId
            ? `<div><strong>Solicitud:</strong> #${c.solicitudId}</div>`
            : ""
        }
      </div>
    </div>

    <div class="section-title">Datos del servicio</div>
    <div class="grid">
      <div><span class="label">Origen:</span> <span class="value">${
        c.origen
      }</span></div>
      <div><span class="label">Destino:</span> <span class="value">${
        c.destino
      }</span></div>
      <div><span class="label">Tipo camión:</span> <span class="value">${
        c.tipoCamion || "N/D"
      }</span></div>
      <div><span class="label">Camiones necesarios:</span> <span class="value">${
        c.camionesNecesarios || 1
      }</span></div>
      <div><span class="label">Peso total:</span> <span class="value">${
        c.pesoKg || 0
      } kg</span></div>
      <div><span class="label">Volumen total:</span> <span class="value">${
        c.volumenM3 || 0
      } m³</span></div>
      <div><span class="label">Distancia estimada:</span> <span class="value">${
        c.distanciaKm
      } km</span></div>
      <div><span class="label">Duración estimada:</span> <span class="value">${
        c.duracionHoras
      } h</span></div>
    </div>

    <div class="section-title">Detalle de costos</div>
    <div>
      ${
        c.detalleCostos
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
    </section>
  );
}
