import { useState } from "react";
import { obtenerRuta } from "../services/mapService";
import { calcularCamionesNecesarios } from "../utils/capacity";
import { useNotification } from "../context/NotificationContext";
import { ConductorService } from "../services/conductorService";

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
  const { showNotification } = useNotification();

  const handleCalcular = async () => {
    if (!origen || !destino) return;

    setLoading(true);
    setErrorMsg("");
    setEnviadoADirector(false);

    try {
      // Validar inputs
      if (!tipoCamion) throw new Error("Seleccione tipo de camión");

      if (!pesoKg || !volumenM3) {
        throw new Error("Debe ingresar peso y volumen para el cálculo exacto de la cotización.");
      }

      if (!fechaEstimada || !fechaRetorno) {
        throw new Error("Debe seleccionar fechas de salida y retorno.");
      }

      let distanciaKm = 0;
      let duracionHoras = 0;

      try {
        const ruta = await obtenerRuta(origen, destino);
        distanciaKm = ruta.distanciaKm;
        duracionHoras = ruta.duracionHoras;
      } catch (err) {
        throw new Error("No se pudo obtener la ruta: " + err.message);
      }

      // Cálculo de camiones necesarios
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

      // ==== MODELO DE COSTOS ====
      const camionesNecesarios = camiones || 1;

      // Tarifa base
      const tarifaBaseUnit = tipoCamion === "GC" ? 250000 : 175000;
      const basePorViaje = tarifaBaseUnit * camionesNecesarios;

      // Combustible
      const combustibles = Math.max(1, Math.ceil(distancia / 400));
      const combustibleUnit = 70000;
      const totalCombustible =
        combustibles * combustibleUnit * camionesNecesarios;

      // Peajes
      const peajesCant = Math.round(distancia / 150);
      const peajeUnit = 10000;
      const totalPeajes = peajesCant * peajeUnit * camionesNecesarios;

      // Viáticos
      const viaticoUnit = duracion >= 4 ? 60000 : 20000;
      const totalViaticos = viaticoUnit * camionesNecesarios;

      // Hospedaje
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
        capacidadTotalKg,
        capacidadTotalM3,
        okPeso,
        okVolumen,
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

    } catch (err) {
      console.warn("handleCalcular error:", err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarADirector = () => {
    if (!resultado || !onGenerarCotizacion) return;

    if (!fechaEstimada) {
      showNotification("Debes seleccionar una fecha estimada para el viaje.");
      return;
    }

    if (!fechaRetorno) {
      showNotification("Debes seleccionar una fecha de retorno.");
      return;
    }

    if (fechaRetorno < fechaEstimada) {
      showNotification("La fecha de retorno debe ser posterior a la fecha de salida.");
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

            {/* Warning de disponibilidad */}
            {(() => {
              const check = ConductorService.checkAvailabilityByOrigin(
                conductores,
                resultado.origen,
                resultado.camionesNecesarios,
                fechaEstimada,
                fechaRetorno,
                [], // Rutas no tiene acceso a todos los viajes por ahora
                []  // ni eventos
              );

              if (check.faltantes > 0) {
                return (
                  <div
                    style={{
                      marginBottom: 8,
                      padding: 8,
                      background: "#fee2e2",
                      border: "1px solid #ef4444",
                      borderRadius: 6,
                      color: "#991b1b",
                      fontSize: 12,
                      fontWeight: 500
                    }}
                  >
                    ⚠️ Atenci&#243;n: Faltan {check.faltantes} conductores en {resultado.origen}.
                    (Disponibles: {check.disponibles} de {check.totalOrigen})
                    <div style={{ fontWeight: 400, fontSize: 11, marginTop: 2 }}>
                      * Nota: No incluye validación de calendario detallado en esta vista.
                    </div>
                  </div>
                );
              }
              return null;
            })()}

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


