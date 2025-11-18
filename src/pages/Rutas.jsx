import { useState } from "react";

export function Rutas({ origenes, regiones, onRouteCalculated }) {
  const [origen, setOrigen] = useState(origenes[1]?.nombre || "Santiago");
  const [destino, setDestino] = useState("");
  const [tipoCamion, setTipoCamion] = useState("GC"); // GC o MC

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCalcular = async () => {
    if (!origen || !destino) return;

    setLoading(true);
    setErrorMsg("");
    try {
      // 1) Ruta real con APIs públicas (Nominatim + OSRM)
      const { distanciaKm, duracionHoras } =
        (await obtenerRutaDesdeOSRM(origen, destino)) ||
        fallbackRoute(origen, destino);

      // 2) Cálculo de costos con las reglas que indicaste
      const costos = calcularCostos(distanciaKm, duracionHoras, tipoCamion);

      const res = {
        origen,
        destino,
        tipoCamion,
        distancia: distanciaKm,
        duracion: duracionHoras,
        costos,
      };

      setResultado(res);
      onRouteCalculated?.(res);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        "No se pudo obtener la ruta en línea. Se usará una estimación básica."
      );

      const fallback = fallbackRoute(origen, destino);
      const costos = calcularCostos(
        fallback.distanciaKm,
        fallback.duracionHoras,
        tipoCamion
      );
      const res = {
        origen,
        destino,
        tipoCamion,
        distancia: fallback.distanciaKm,
        duracion: fallback.duracionHoras,
        costos,
      };
      setResultado(res);
      onRouteCalculated?.(res);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">🗺️</span> Optimización de Rutas
          </h1>
          <p className="page-subtitle">
            Calcula una ruta estimada entre origen y destino y el costo total
            del viaje.
          </p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
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

        <div>
          <div className="label">Tipo de Camión</div>
          <select
            className="select"
            value={tipoCamion}
            onChange={(e) => setTipoCamion(e.target.value)}
          >
            <option value="GC">GC - Camión Gran Capacidad</option>
            <option value="MC">MC - Camión Mediana Capacidad</option>
          </select>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleCalcular}
        disabled={loading}
      >
        {loading ? "Calculando..." : "🧮 Calcular Ruta Óptima"}
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
              Distancia estimada: {resultado.distancia.toFixed(1)} km
            </div>
            <div style={{ fontSize: 13 }}>
              Tiempo estimado: {resultado.duracion.toFixed(1)} horas
            </div>
            {errorMsg && (
              <div
                style={{
                  fontSize: 11,
                  color: "#f97373",
                  marginTop: 6,
                }}
              >
                {errorMsg}
              </div>
            )}
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
              * Esta información también se usa como referencia en Seguimiento.
            </div>
          </div>
        )}
      </div>

      {/* Resumen de costos */}
      {resultado && (
        <div
          className="card"
          style={{
            marginTop: 18,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <div>
            <div className="card-header">Vehículo</div>
            <div className="card-value" style={{ fontSize: 18 }}>
              {resultado.tipoCamion === "GC"
                ? "GC - Gran Capacidad"
                : "MC - Mediana Capacidad"}
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
              Tarifa base: $
              {formatoCLP(resultado.costos.baseVehiculo)}
            </p>
          </div>

          <div>
            <div className="card-header">Gastos de viaje</div>
            <p style={{ fontSize: 13 }}>
              Combustible:{" "}
              <strong>
                {resultado.costos.unidadesCombustible} × $70.000 = $
                {formatoCLP(resultado.costos.combustible)}
              </strong>
            </p>
            <p style={{ fontSize: 13 }}>
              Viáticos: $
              <strong>{formatoCLP(resultado.costos.viaticos)}</strong>
            </p>
            <p style={{ fontSize: 13 }}>
              Hospedaje:{" "}
              {resultado.costos.hospedaje > 0
                ? `$${formatoCLP(resultado.costos.hospedaje)}`
                : "No aplica"}
            </p>
            <p style={{ fontSize: 13 }}>
              Peajes (estimado): $
              <strong>{formatoCLP(resultado.costos.costoPeajes)}</strong>
            </p>
          </div>

          <div>
            <div className="card-header">Costo total estimado</div>
            <div
              className="card-value"
              style={{ fontSize: 22, marginBottom: 6 }}
            >
              ${formatoCLP(resultado.costos.total)}
            </div>
            <p style={{ fontSize: 12, color: "#9ca3af" }}>
              Incluye tarifa base, combustible, viáticos, hospedaje y peajes
              estimados.
            </p>
          </div>
        </div>
      )}

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

/* =========================================================
   AUXILIARES: API PÚBLICAS + COSTOS
   ========================================================= */

/**
 * Busca coordenadas usando Nominatim (OpenStreetMap) – gratuita, sin API key.
 */
async function buscarCoordenadas(lugar) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
    lugar + ", Chile"
  )}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Corporativa-AcmeTrans/1.0 (contacto@example.com)",
    },
  });

  const data = await res.json();
  if (!data.length) throw new Error("No se encontraron coordenadas.");

  return {
    lat: parseFloat(data[0].lat),
    lon: parseFloat(data[0].lon),
  };
}

/**
 * Calcula ruta real usando OSRM (router.project-osrm.org) – público y gratuito.
 */
async function obtenerRutaDesdeOSRM(origen, destino) {
  const coordOrigen = await buscarCoordenadas(origen);
  const coordDestino = await buscarCoordenadas(destino);

  const url = `https://router.project-osrm.org/route/v1/driving/${coordOrigen.lon},${coordOrigen.lat};${coordDestino.lon},${coordDestino.lat}?overview=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No se pudo obtener ruta desde OSRM.");
  }

  const ruta = data.routes[0];

  return {
    distanciaKm: ruta.distance / 1000, // metros → km
    duracionHoras: ruta.duration / 3600, // segundos → horas
  };
}

/**
 * Fallback muy simple si las APIs fallan.
 */
function fallbackRoute(origen, destino) {
  // Aquí puedes anotar algunas combinaciones típicas si quieres algo más preciso
  // Por defecto: 300 km y 4 horas.
  return {
    distanciaKm: 300,
    duracionHoras: 4,
  };
}

/**
 * Cálculo de costos:
 * - GC = $250.000 por viaje
 * - MC = $175.000 por viaje
 * - Combustible: bloques de $70.000 (aprox. 400 km por bloque)
 * - Hospedaje = $45.000 si duración >= 4 h
 * - Viáticos = $20.000 si duración < 4 h, $60.000 si duración >= 4 h
 * - Peajes (estimado): 1 peaje por cada 200 km, $8.000 c/u
 */
function calcularCostos(distanciaKm, duracionHoras, tipoCamion) {
  const TARIFA_GC = 250000;
  const TARIFA_MC = 175000;
  const HOSPEDAJE = 45000;
  const VIATICOS_MENOR_4H = 20000;
  const VIATICOS_MAYOR_4H = 60000;
  const COMBUSTIBLE_UNIT = 70000;

  const baseVehiculo = tipoCamion === "GC" ? TARIFA_GC : TARIFA_MC;

  const necesitaHospedaje = duracionHoras >= 4;
  const hospedaje = necesitaHospedaje ? HOSPEDAJE : 0;

  const viaticos =
    duracionHoras < 4 ? VIATICOS_MENOR_4H : VIATICOS_MAYOR_4H;

  // Supuesto: ~400 km por cada carga de combustible
  const KM_POR_COMBUSTIBLE = 400;
  const unidadesCombustible = Math.max(
    1,
    Math.ceil(distanciaKm / KM_POR_COMBUSTIBLE)
  );
  const combustible = unidadesCombustible * COMBUSTIBLE_UNIT;

  // Supuesto simple de peajes
  const PEAJE_VALOR = 8000;
  const peajes = Math.ceil(distanciaKm / 200);
  const costoPeajes = peajes * PEAJE_VALOR;

  const total =
    baseVehiculo + hospedaje + viaticos + combustible + costoPeajes;

  return {
    baseVehiculo,
    hospedaje,
    viaticos,
    combustible,
    unidadesCombustible,
    costoPeajes,
    total,
  };
}

/**
 * Formato CLP con separador de miles.
 */
function formatoCLP(valor) {
  return valor.toLocaleString("es-CL");
}
