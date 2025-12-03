// src/pages/Rutas.jsx
import { useState } from "react";
import { estimateRoute } from "../utils/routeEstimator";
import { calcularCamionesNecesarios } from "../utils/capacity";

export function Rutas({
  origenes,
  regiones,
  conductores,
  onRouteCalculated,
  onGenerarCotizacion,
  onCrearEventoCalendario,
}) {
  const [origen, setOrigen] = useState(origenes[1]?.nombre || "Santiago");
  const [destino, setDestino] = useState("");
  const [tipoCamion, setTipoCamion] = useState("GC");
  const [pesoKg, setPesoKg] = useState("");
  const [volumenM3, setVolumenM3] = useState("");
  const [fechaEstimada, setFechaEstimada] = useState("");
  const [fechaRetorno, setFechaRetorno] = useState("");
  const [conductorId, setConductorId] = useState("");

  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [enviadoADirector, setEnviadoADirector] = useState(false);

  const handleCalcular = async () => {
    if (!origen || !destino) return;

    setLoading(true);
    setErrorMsg("");
    setEnviadoADirector(false); // si recalculas, se reinicia el estado

    try {
      let distanciaKm = 0;
      let duracionHoras = 0;

      try {
        const osrm = await obtenerRutaDesdeOSRM(origen, destino);
        distanciaKm = osrm.distanciaKm;
        duracionHoras = osrm.duracionHoras;
      } catch (err) {
        console.warn("OSRM falló, usando estimador local:", err);
        const fallback = estimateRoute(origen, destino);
        distanciaKm = fallback.distanciaKm;
        duracionHoras = fallback.duracionHoras;
        setErrorMsg(
          "No se pudo obtener la ruta en línea. Se usó una estimación local."
        );
      }

      // Cálculo de camiones necesarios según peso / volumen
      const {
        camiones,
        capacidadTotalKg,
        capacidadTotalM3,
        okPeso,
        okVolumen,
      } = calcularCamionesNecesarios(tipoCamion, pesoKg, volumenM3);

      const distancia = distanciaKm || 0;
      const duracion = duracionHoras || 0;

      const hospRequerido = duracion >= 4;

      // ==== MODELO DE COSTOS (alineado con SolicitudModal / Director) ====
      const camionesNecesarios = camiones || 1;

      // Tarifa base por camión
      const tarifaBaseUnit = tipoCamion === "GC" ? 250000 : 175000;
      const basePorViaje = tarifaBaseUnit * camionesNecesarios;

      // Combustible: 1 carga cada 400km, $70.000 por carga
      const combustibles = Math.max(1, Math.ceil(distancia / 400));
      const combustibleUnit = 70000;
      const totalCombustible =
        combustibles * combustibleUnit * camionesNecesarios;

      // Peajes: 1 peaje cada 150 km, $10.000 cada uno
      const peajesCant = Math.round(distancia / 150);
      const peajeUnit = 10000;
      const totalPeajes = peajesCant * peajeUnit * camionesNecesarios;

      // Viáticos: 20.000 (<4h) o 60.000 (>=4h) por camión
      const viaticoUnit = duracion >= 4 ? 60000 : 20000;
      const totalViaticos = viaticoUnit * camionesNecesarios;

      // Hospedaje: 45.000 por camión si dura >=4h
      const hospedajeUnit = 45000;
      const totalHospedaje = hospRequerido
        ? hospedajeUnit * camionesNecesarios
        : 0;

      const costoTotal =
        basePorViaje +
        totalCombustible +
        totalPeajes +
        totalHospedaje +
        totalViaticos;

      const res = {
        origen,
        destino,
        tipoCamion,
        pesoKg: Number(pesoKg || 0),
        volumenM3: Number(volumenM3 || 0),
        distanciaKm: +distancia.toFixed(1),
        duracionHoras: +duracion.toFixed(1),
        hospRequerido,
        camionesNecesarios,
        // info de capacidad
        capacidadTotalKg,
        capacidadTotalM3,
        okPeso,
        okVolumen,
        // componentes de costo
        combustibles,
        basePorViaje,
        totalCombustible,
        totalPeajes,
        totalHospedaje,
        totalViaticos,
        costoTotal,
        detalleCostos: {
          basePorViaje,
          combustible: totalCombustible,
          peajes: totalPeajes,
          hospedaje: totalHospedaje,
          viaticos: totalViaticos,
        },
      };

      setResultado(res);
      onRouteCalculated?.(res);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarADirector = () => {
    if (!resultado || !onGenerarCotizacion) return;

    if (!fechaEstimada) {
      alert("Debes seleccionar una fecha estimada para el viaje.");
      return;
    }

    if (!fechaRetorno) {
      alert("Debes seleccionar una fecha de retorno.");
      return;
    }

    if (fechaRetorno < fechaEstimada) {
      alert("La fecha de retorno debe ser posterior a la fecha de salida.");
      return;
    }

    const cotizacionData = {
      solicitudId: null, // viene desde Rutas, no está ligada a una solicitud
      origen: resultado.origen,
      destino: resultado.destino,
      distanciaKm: resultado.distanciaKm,
      duracionHoras: resultado.duracionHoras,
      tipoCamion: resultado.tipoCamion,
      pesoKg: resultado.pesoKg,
      volumenM3: resultado.volumenM3,
      camionesNecesarios: resultado.camionesNecesarios,
      costoTotal: resultado.costoTotal,
      detalleCostos: resultado.detalleCostos,
      conductorId: conductorId ? Number(conductorId) : null,
      fechaEvento: fechaEstimada,
    };

    const eventoData = {
      cotizacionId: null, // Se actualizará después de crear la cotización
      solicitudId: null,
      fecha: fechaEstimada,
      fechaRetorno: fechaRetorno,
      origen: resultado.origen,
      destino: resultado.destino,
      tipoCamion: resultado.tipoCamion,
      conductorId: conductorId ? Number(conductorId) : null,
      conductorNombre: conductorId ? "Por asignar" : "Sin asignar",
      descripcion: `Ruta: ${resultado.origen} → ${resultado.destino}`,
      tipo: "cotizacion",
      estado: "pendiente",
    };

    onGenerarCotizacion(cotizacionData, eventoData);

    setEnviadoADirector(true);
  };

  const { camiones: camionesPreview } = calcularCamionesNecesarios(
    tipoCamion,
    pesoKg,
    volumenM3
  );

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">🗺️</span> Optimización de Rutas y Cotización
          </h1>
          <p className="page-subtitle">
            Calcula la ruta estimada, valida capacidad de camión y genera una
            cotización para que el Director la apruebe.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">Parámetros de ruta</div>

        <div className="grid-2" style={{ marginTop: 10, marginBottom: 10 }}>
          <div>
            <div className="label">Origen</div>
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
            <div className="label">Destino (Región)</div>
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

        <div className="grid-3" style={{ marginBottom: 10 }}>
          <div>
            <div className="label">Tipo de camión</div>
            <select
              className="select"
              value={tipoCamion}
              onChange={(e) => setTipoCamion(e.target.value)}
            >
              <option value="GC">GC · Gran Capacidad</option>
              <option value="MC">MC · Mediana Capacidad</option>
            </select>
          </div>
          <div>
            <div className="label">Peso total (kg)</div>
            <input
              className="input"
              type="number"
              min="0"
              value={pesoKg}
              onChange={(e) => setPesoKg(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Volumen total (m³)</div>
            <input
              className="input"
              type="number"
              min="0"
              value={volumenM3}
              onChange={(e) => setVolumenM3(e.target.value)}
            />
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: 10 }}>
          <div>
            <div className="label">Fecha de salida *</div>
            <input
              type="date"
              className="input"
              value={fechaEstimada}
              onChange={(e) => setFechaEstimada(e.target.value)}
            />
          </div>
          <div>
            <div className="label">Fecha de retorno *</div>
            <input
              type="date"
              className="input"
              value={fechaRetorno}
              onChange={(e) => setFechaRetorno(e.target.value)}
              min={fechaEstimada}
            />
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 10 }}>
          <div>
            <div className="label">Conductor (opcional)</div>
            <select
              className="select"
              value={conductorId}
              onChange={(e) => setConductorId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {(conductores || []).filter(c => c.estado !== "inactivo").map((c) => (
                <option key={c.id} value={c.id}>
                  #{c.id} · {c.nombre} ({c.origen} · {c.tipo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {pesoKg || volumenM3 ? (
          <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
            Se requieren aproximadamente {camionesPreview} camión(es) tipo{" "}
            {tipoCamion} para esta carga.
          </div>
        ) : null}

        <button
          className="btn btn-primary"
          onClick={handleCalcular}
          disabled={loading}
        >
          {loading ? "Calculando..." : "🧮 Calcular ruta y cotización"}
        </button>

        {errorMsg && (
          <div
            style={{
              marginTop: 8,
              fontSize: 12,
              color: "#f97316",
            }}
          >
            {errorMsg}
          </div>
        )}
      </div>

      <div style={{ marginTop: 18 }} className="placeholder-panel">
        {!resultado ? (
          <>El detalle de la ruta y la cotización aparecerán aquí.</>
        ) : (
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {resultado.origen} → {resultado.destino}
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Distancia estimada: {resultado.distanciaKm} km · Tiempo estimado:{" "}
              {resultado.duracionHoras} h
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Carga: {resultado.pesoKg} kg · {resultado.volumenM3} m³ ·
              Camiones necesarios: {resultado.camionesNecesarios} (
              {resultado.tipoCamion})
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Combustible: {resultado.combustibles} carga(s) · $
              {resultado.totalCombustible.toLocaleString("es-CL")}
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Peajes aprox.: $
              {resultado.totalPeajes.toLocaleString("es-CL")} · Viáticos: $
              {resultado.totalViaticos.toLocaleString("es-CL")} · Hospedaje: $
              {resultado.totalHospedaje.toLocaleString("es-CL")}
            </div>
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Tarifa base total: $
              {resultado.basePorViaje.toLocaleString("es-CL")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>
              Costo total estimado: $
              {resultado.costoTotal.toLocaleString("es-CL")}
            </div>

            <div style={{ marginTop: 12, fontSize: 13 }}>
              Estado para Director:{" "}
              {enviadoADirector ? (
                <span style={{ color: "#22c55e" }}>
                  Enviado a Director (pendiente de aprobación)
                </span>
              ) : (
                <span style={{ color: "#facc15" }}>
                  Aún no enviado a Director
                </span>
              )}
            </div>

            {!enviadoADirector && (
              <button
                className="btn btn-secondary"
                style={{ marginTop: 8 }}
                onClick={handleEnviarADirector}
              >
                🧾 Enviar cotización al Director
              </button>
            )}
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

// =========================
// Helpers OSRM
// =========================

async function buscarCoordenadas(lugar) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    lugar + ", Chile"
  )}`;

  const res = await fetch(url, {
    headers: {
      "Accept-Language": "es",
    },
  });
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) {
    throw new Error("No se encontraron coordenadas");
  }

  const { lat, lon } = data[0];
  return { lat: Number(lat), lon: Number(lon) };
}

async function obtenerRutaDesdeOSRM(origen, destino) {
  const coordOrigen = await buscarCoordenadas(origen);
  const coordDestino = await buscarCoordenadas(destino);

  const url = `https://router.project-osrm.org/route/v1/driving/${coordOrigen.lon},${coordOrigen.lat};${coordDestino.lon},${coordDestino.lat}?overview=false&alternatives=false&steps=false`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data.routes || !data.routes.length) {
    throw new Error("No se pudo obtener ruta desde OSRM.");
  }

  const ruta = data.routes[0];

  return {
    distanciaKm: ruta.distance / 1000,
    duracionHoras: ruta.duration / 3600,
  };
}
