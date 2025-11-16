import { useState } from "react";
import { estimateRoute } from "../utils/routeEstimator";

export function Rutas({ origenes, regiones, onRouteCalculated }) {
  const [origen, setOrigen] = useState(origenes[1]?.nombre || "Santiago");
  const [destino, setDestino] = useState("");
  const [resultado, setResultado] = useState(null);

  const handleCalcular = () => {
    if (!origen || !destino) return;
    const { distanciaKm, duracionHoras } = estimateRoute(origen, destino);
    const res = {
      origen,
      destino,
      distancia: distanciaKm,
      duracion: duracionHoras,
    };
    setResultado(res);
    onRouteCalculated?.(res);
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">🗺️</span> Optimización de Rutas
          </h1>
          <p className="page-subtitle">
            Calcula una ruta estimada entre origen y destino.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div>
          <div className="label">Punto de Origen</div>
          <select
            className="select"
            value={origen}
            onChange={(e) => setOrigen(e.target.value)}
          >
            {origenes.map((o) => (
              <option key={o.id} value={o.nombre}>
                {o.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <div className="label">Punto de Destino (Región)</div>
          <select
            className="select"
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
          >
            <option value="">Seleccione región...</option>
            {regiones.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleCalcular}>
        🧮 Calcular Ruta Óptima
      </button>

      <div style={{ marginTop: 18 }} className="placeholder-panel">
        {!resultado ? (
          <>El mapa de ruta se mostrará aquí (placeholder).</>
        ) : (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {resultado.origen} → {resultado.destino}
            </div>
            <div style={{ fontSize: 13 }}>
              Distancia estimada: {resultado.distancia} km
            </div>
            <div style={{ fontSize: 13 }}>
              Tiempo estimado: {resultado.duracion} horas
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
              * Esta información también se usa como referencia en Seguimiento.
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }} className="card card-muted">
        <div className="card-header">
          <span>Capacidad por base</span>
        </div>
        <div style={{ fontSize: 13 }}>
          {origenes.map((o) => (
            <div key={o.id}>
              <strong>{o.nombre}</strong>: {o.gc} GC · {o.mc} MC
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
