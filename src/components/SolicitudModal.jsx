// src/components/SolicitudModal.jsx

import { useState, useMemo } from "react";
import { obtenerRuta } from "../services/mapService";
import { ConductorService } from "../services/conductorService";
import { calcularCamionesNecesarios } from "../utils/capacity";

export function SolicitudModal({
  solicitud,
  conductores,
  viajes = [],
  eventosCalendario = [],
  onClose,
  onGestionar,
  onAsignar,
  onGenerarCotizacion,
  onCrearEventoCalendario,
}) {
  if (!solicitud) return null;

  const {
    id,
    titulo,
    origen,
    destino,
    fecha,
    fechaRetorno: fechaRetornoInicial,
    pesoKg = 0,
    volumenM3 = 0,
    estado,
  } = solicitud;

  const today = new Date().toISOString().split('T')[0];
  const [conductorId, setConductorId] = useState("");
  const [fechaAsignacion, setFechaAsignacion] = useState(fecha || today);
  const [fechaRetorno, setFechaRetorno] = useState(fechaRetornoInicial || "");
  const [tipoCamion, setTipoCamion] = useState("GC");
  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState("");

  // capacidades aproximadas por tipo de camión
  const CAPACIDAD = {
    GC: { kg: 26000, m3: 50 },
    MC: { kg: 14000, m3: 30 },
  };

  const conductoresDisponibles = useMemo(() => {
    const orden = { "Coquimbo": 1, "Santiago": 2, "Osorno": 3 };

    return conductores
      .filter((c) =>
        ConductorService.isAvailableForRange(
          c,
          fechaAsignacion,
          fechaRetorno,
          viajes,
          eventosCalendario
        )
      )
      .sort((a, b) => {
        const ordenA = orden[a.origen] || 999;
        const ordenB = orden[b.origen] || 999;
        return ordenA - ordenB;
      });
  }, [conductores, fechaAsignacion, fechaRetorno, viajes, eventosCalendario]);

  const handleCalcular = async () => {
    setError("");

    if (!origen || !destino) {
      setError("Debe existir origen y destino para estimar la ruta.");
      return;
    }

    try {
      const { distanciaKm, duracionHoras } = await obtenerRuta(origen, destino);

      const caps = CAPACIDAD[tipoCamion] || CAPACIDAD.GC;

      // Usar utilidad centralizada para consistencia y validación de límites
      const { camiones: camionesNecesarios } = calcularCamionesNecesarios(
        tipoCamion,
        pesoKg,
        volumenM3
      );

      // Reglas de costos
      const basePorViaje =
        (tipoCamion === "GC" ? 250000 : 175000) * camionesNecesarios;

      const hospedaje = duracionHoras >= 4;
      const viaticosUnidad = duracionHoras >= 4 ? 60000 : 20000;

      const distancia = distanciaKm || 1;
      const combustibles = Math.max(1, Math.ceil(distancia / 400));
      const costoCombustible = combustibles * 70000 * camionesNecesarios;

      const costoPeajes =
        Math.ceil(distancia / 200) * 20000 * camionesNecesarios;

      const costoHospedaje = hospedaje
        ? 45000 * camionesNecesarios
        : 0;

      const costoViaticos = viaticosUnidad * camionesNecesarios;

      const total =
        basePorViaje +
        costoCombustible +
        costoPeajes +
        costoHospedaje +
        costoViaticos;

      setCotizacion({
        distanciaKm,
        duracionHoras,
        camionesNecesarios,
        hospedaje,
        costos: {
          basePorViaje,
          combustible: costoCombustible,
          peajes: costoPeajes,
          hospedaje: costoHospedaje,
          viaticos: costoViaticos,
          total,
        },
      });
    } catch (err) {
      console.error(err);
      setError("Error al calcular la ruta: " + err.message);
    }
  };

  const handleEnviarADirector = () => {
    if (!cotizacion) {
      setError("Primero debes calcular la ruta y la cotización.");
      return;
    }

    if (!fechaAsignacion) {
      setError("Debes seleccionar una fecha para la asignación.");
      return;
    }

    if (!fechaRetorno) {
      setError("Debes seleccionar una fecha de retorno.");
      return;
    }

    if (fechaRetorno < fechaAsignacion) {
      setError("La fecha de retorno debe ser posterior a la fecha de salida.");
      return;
    }

    if (!onGenerarCotizacion) {
      setError("No se ha configurado el flujo de cotizaciones.");
      return;
    }

    const cotizacionData = {
      solicitudId: id,
      origen,
      destino,
      distanciaKm: cotizacion.distanciaKm,
      duracionHoras: cotizacion.duracionHoras,
      tipoCamion,
      pesoKg,
      volumenM3,
      camionesNecesarios: cotizacion.camionesNecesarios,
      costoTotal: cotizacion.costos.total,
      detalleCostos: cotizacion.costos,
      conductorId: conductorId ? Number(conductorId) : null,
      fechaEvento: fechaAsignacion,
    };

    const conductorNombre = conductorId
      ? conductores.find((c) => c.id === Number(conductorId))?.nombre || "Sin asignar"
      : "Sin asignar";

    const eventoData = {
      cotizacionId: null, // Se actualizará en App.jsx después de crear la cotización
      solicitudId: id,
      fecha: fechaAsignacion,
      fechaRetorno: fechaRetorno,
      origen,
      destino,
      tipoCamion,
      conductorId: conductorId ? Number(conductorId) : null,
      conductorNombre,
      descripcion: `Solicitud #${id}: ${origen} → ${destino}`,
      tipo: "cotizacion",
      estado: "pendiente",
    };

    onGenerarCotizacion(cotizacionData, eventoData);

    // marcar solicitud en curso (o estado que quieras)
    onGestionar?.(id, { estado: "en-curso" });

    onClose?.();
  };

  const handleAsignarViaje = () => {
    if (!cotizacion) {
      setError("Debes calcular la ruta primero.");
      return;
    }

    if (!conductorId) {
      setError("Debes seleccionar un conductor.");
      return;
    }

    if (!fechaAsignacion || !fechaRetorno) {
      setError("Debes seleccionar fecha de salida y retorno.");
      return;
    }

    if (fechaRetorno < fechaAsignacion) {
      setError("La fecha de retorno debe ser posterior a la fecha de salida.");
      return;
    }

    const camiones =
      cotizacion?.camionesNecesarios && cotizacion.camionesNecesarios > 0
        ? cotizacion.camionesNecesarios
        : 1;

    onAsignar?.({
      solicitudId: id,
      conductorId: Number(conductorId),
      fecha: fechaAsignacion,
      tipoCamion,
      pesoKg,
      volumenM3,
      camionesNecesarios: camiones,
    });

    onGestionar?.(id, { estado: "en-curso" });
    onClose?.();
  };

  return (
    <div className="modal-backdrop" onMouseDown={(e) => {
      if (e.target === e.currentTarget) {
        onClose?.();
      }
    }}>
      <div className="modal">
        <div className="modal-header">
          <h2>
            📨 Solicitud #{id}{" "}
            {titulo ? `· ${titulo}` : ""}
          </h2>
          <button
            onClick={onClose}
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

        <div className="modal-body">
          {/* Datos de la solicitud */}
          <div className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">Datos de la solicitud</div>
            <div style={{ fontSize: 13 }}>
              <div>
                <strong>Origen:</strong> {origen || "N/D"}
              </div>
              <div>
                <strong>Destino:</strong> {destino || "N/D"}
              </div>
              <div>
                <strong>Peso total:</strong> {pesoKg} kg
              </div>
              <div>
                <strong>Volumen total:</strong> {volumenM3} m³
              </div>
              <div>
                <strong>Estado actual:</strong> {estado}
              </div>
            </div>
          </div>

          {/* Configuración de viaje / camión */}
          {/* Fila 1: Conductor y Tipo de Camión */}
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Conductor</div>
              <select
                className="select"
                value={conductorId}
                onChange={(e) => setConductorId(e.target.value)}
              >
                <option value="">Seleccione conductor</option>
                {conductoresDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} · {c.nombre} ({c.origen} · {c.tipo})
                  </option>
                ))}
              </select>
            </div>
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
          </div>

          {/* Fila 2: Fechas */}
          <div className="grid-2" style={{ marginBottom: 12 }}>
            <div>
              <div className="label">Fecha de salida *</div>
              <input
                type="date"
                className="input"
                value={fechaAsignacion}
                onChange={(e) => setFechaAsignacion(e.target.value)}
              />
            </div>
            <div>
              <div className="label">Fecha de retorno *</div>
              <input
                type="date"
                className="input"
                value={fechaRetorno}
                onChange={(e) => setFechaRetorno(e.target.value)}
                min={fechaAsignacion}
              />
            </div>
          </div>

          <div className="helper-text" style={{ marginBottom: 12, marginTop: -8 }}>
            ℹ️ El cálculo de camiones se ajustará automáticamente soportando grandes volúmenes de carga.
          </div>

          {/* Fila 3: Botón de cálculo */}
          <div style={{ marginBottom: 12 }}>
            <div className="label">Acciones de cálculo</div>
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleCalcular}
              style={{ width: "100%" }}
            >
              🧮 Calcular ruta y cotización
            </button>
          </div>

          {cotizacion && (
            <div className="card card-muted" style={{ marginBottom: 12 }}>
              <div className="card-header">
                Resumen de cotización estimada
              </div>
              <div style={{ fontSize: 13 }}>
                <div>
                  <strong>Distancia:</strong> {cotizacion.distanciaKm} km
                </div>
                <div>
                  <strong>Duración:</strong>{" "}
                  {cotizacion.duracionHoras} h
                </div>
                <div>
                  <strong>Camiones necesarios:</strong>{" "}
                  {cotizacion.camionesNecesarios}
                </div>

                {/* Warning de disponibilidad */}
                {(() => {
                  const check = ConductorService.checkAvailabilityByOrigin(
                    conductores,
                    origen,
                    cotizacion.camionesNecesarios,
                    fechaAsignacion,
                    fechaRetorno,
                    viajes,
                    eventosCalendario
                  );

                  if (check.faltantes > 0) {
                    return (
                      <div
                        style={{
                          marginTop: 8,
                          padding: 8,
                          background: "#fee2e2",
                          border: "1px solid #ef4444",
                          borderRadius: 6,
                          color: "#991b1b",
                          fontSize: 12,
                          fontWeight: 500
                        }}
                      >
                        ⚠️ Atenci&#243;n: Faltan {check.faltantes} conductores en {origen} para cubrir esta operaci&#243;n.
                        (Disponibles: {check.disponibles} de {check.totalOrigen})
                      </div>
                    );
                  }
                  return null;
                })()}

                <div style={{ marginTop: 6 }}>
                  <strong>Total estimado:</strong>{" "}
                  $
                  {cotizacion.costos.total.toLocaleString("es-CL")}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#f97373",
                marginBottom: 8,
              }}
            >
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={handleAsignarViaje}
            style={{ justifyContent: "center" }}
          >
            📌 Asignar viaje
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleEnviarADirector}
            style={{ justifyContent: "center" }}
          >
            🧾 Enviar a Director
          </button>
        </div>
      </div>
    </div>
  );
}
