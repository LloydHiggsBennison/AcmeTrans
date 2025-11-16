// src/pages/Dashboard.jsx
import { useMemo } from "react";
import { getTripMetrics } from "../utils/tripMetrics";

export function Dashboard({ conductores, viajes }) {
  const hoyStr = new Date().toISOString().split("T")[0];

  const conductoresActivos = conductores.filter(
    (c) => c.estado !== "inactivo"
  ).length;

  const viajesHoy = viajes.filter((v) => v.fecha === hoyStr);
  const viajesEnCurso = viajesHoy.filter((v) => v.estado === "en-curso");
  const viajesCompletados = viajesHoy.filter(
    (v) => v.estado === "completado"
  );

  const viajesEnCursoConMetrics = useMemo(
    () =>
      viajesEnCurso.map((v) => ({
        viaje: v,
        metrics: getTripMetrics(v),
      })),
    [viajesEnCurso]
  );

  const totalKmRecorridosHoy = useMemo(
    () =>
      viajesHoy.reduce((acc, v) => {
        const m = getTripMetrics(v);
        return acc + (m ? m.distanciaRecorrida : 0);
      }, 0),
    [viajesHoy]
  );

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">📊</span> Dashboard Corporativa AcmeTrans
          </h1>
          <p className="page-subtitle">
            Resumen operacional del día y viajes en curso.
          </p>
        </div>
      </div>

      <div className="grid-4" style={{ marginBottom: 18 }}>
        <div className="card">
          <div className="card-header">Conductores activos</div>
          <div className="card-value">{conductoresActivos}</div>
          <div className="card-footnote">
            Estados: disponible u ocupado.
          </div>
        </div>
        <div className="card">
          <div className="card-header">Viajes de hoy</div>
          <div className="card-value">{viajesHoy.length}</div>
          <div className="card-footnote">
            Incluye pendientes, en curso y completados.
          </div>
        </div>
        <div className="card">
          <div className="card-header">Viajes en curso</div>
          <div className="card-value">{viajesEnCurso.length}</div>
          <div className="card-footnote">
            Se actualiza en tiempo real según hora de inicio.
          </div>
        </div>
        <div className="card">
          <div className="card-header">Viajes completados hoy</div>
          <div className="card-value">{viajesCompletados.length}</div>
          <div className="card-footnote">
            Km recorridos estimados: {totalKmRecorridosHoy} km
          </div>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Viajes activos</h3>
        {viajesEnCursoConMetrics.length === 0 ? (
          <div className="placeholder-panel">
            No hay viajes en curso en este momento.
          </div>
        ) : (
          <div className="list">
            {viajesEnCursoConMetrics.map(({ viaje, metrics }) => {
              const pct = metrics ? Math.round(metrics.progreso * 100) : 0;
              return (
                <div key={viaje.id} className="list-item">
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      #{viaje.id} · {viaje.origen} → {viaje.destino}
                    </div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>
                      Inicio: {viaje.fecha} · Distancia: {viaje.distanciaKm} km ·
                      Duración: {viaje.duracionHoras} h
                    </div>
                    {metrics && (
                      <div style={{ marginTop: 6 }}>
                        <div
                          style={{
                            height: 6,
                            borderRadius: 999,
                            background: "#1f2937",
                            overflow: "hidden",
                            marginBottom: 4,
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: "100%",
                              background:
                                "linear-gradient(90deg,#22c55e,#3b82f6,#a855f7)",
                              transition: "width 0.5s linear",
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 11, color: "#9ca3af" }}>
                          Avance: {metrics.distanciaRecorrida} km ·{" "}
                          {metrics.distanciaRestante} km restantes ·{" "}
                          {metrics.horasTranscurridas} h transcurridas ·{" "}
                          {metrics.horasRestantes} h restantes
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
