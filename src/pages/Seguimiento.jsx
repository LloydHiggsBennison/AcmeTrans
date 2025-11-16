import { useMemo, useState } from "react";
import { getTripMetrics } from "../utils/tripMetrics";

export function Seguimiento({ viajes, lastRoute }) {
  const [selectedId, setSelectedId] = useState("");

  const viaje = useMemo(
    () => viajes.find((v) => v.id === Number(selectedId)),
    [viajes, selectedId]
  );

  const metrics = getTripMetrics(viaje);
  const rutaCoincide =
    viaje &&
    lastRoute &&
    lastRoute.origen === viaje.origen &&
    lastRoute.destino === viaje.destino;

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">📍</span> Seguimiento en Tiempo Real
          </h1>
          <p className="page-subtitle">
            Visualiza el estado de un viaje y sus métricas dinámicas.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div className="label">Seleccionar viaje</div>
        <select
          className="select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">Seleccione un viaje...</option>
          {viajes.map((v) => (
            <option key={v.id} value={v.id}>
              #{v.id} · {v.origen} → {v.destino}
            </option>
          ))}
        </select>
      </div>

      <div
        className="placeholder-panel"
        style={{ marginBottom: 18, height: 220 }}
      >
        {!viaje ? (
          <>Mapa de seguimiento en tiempo real se mostrará aquí.</>
        ) : (
          <>
            Seguimiento simulado del viaje #{viaje.id}: {viaje.origen} →{" "}
            {viaje.destino}. Aquí iría el mapa real.
          </>
        )}
      </div>

      {rutaCoincide && (
        <div className="card card-muted" style={{ marginBottom: 14 }}>
          <div className="card-header">
            <span>Ruta optimizada asociada</span>
            <span className="tag tag-info">Desde módulo de Rutas</span>
          </div>
          <div style={{ fontSize: 13 }}>
            Distancia: {lastRoute.distancia} km · Tiempo estimado:{" "}
            {lastRoute.duracion} h
          </div>
        </div>
      )}

      <div>
        <h3 style={{ fontSize: 14, marginBottom: 8 }}>Información del viaje</h3>
        {!metrics ? (
          <div className="placeholder-panel">
            Seleccione un viaje para ver sus métricas.
          </div>
        ) : (
          <div className="grid-4">
            <div className="card">
              <div className="card-header">Velocidad aproximada</div>
              <div className="card-value">{metrics.velocidadPromedio}</div>
              <div className="card-footnote">km/h</div>
            </div>
            <div className="card">
              <div className="card-header">Kilómetros recorridos</div>
              <div className="card-value">
                {metrics.distanciaRecorrida}
              </div>
              <div className="card-footnote">
                Restantes: {metrics.distanciaRestante} km
              </div>
            </div>
            <div className="card">
              <div className="card-header">Horas transcurridas</div>
              <div className="card-value">
                {metrics.horasTranscurridas}
              </div>
              <div className="card-footnote">Desde inicio del viaje.</div>
            </div>
            <div className="card">
              <div className="card-header">Horas restantes</div>
              <div className="card-value">
                {metrics.horasRestantes}
              </div>
              <div className="card-footnote">
                Basado en duración planificada.
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
