// src/components/SolicitudModal.jsx

import { useState } from "react";
import { estimateRoute } from "../utils/routeEstimator";

export function SolicitudModal({
  solicitud,
  conductores,
  onClose,
  onGestionar,
  onAsignar,
  onGenerarCotizacion,
}) {
  if (!solicitud) return null;

  const {
    id,
    titulo,
    origen,
    destino,
    fecha,
    pesoKg = 0,
    volumenM3 = 0,
    estado,
  } = solicitud;

  const [conductorId, setConductorId] = useState("");
  const [fechaAsignacion, setFechaAsignacion] = useState(fecha || "");
  const [tipoCamion, setTipoCamion] = useState("GC");
  const [cotizacion, setCotizacion] = useState(null);
  const [error, setError] = useState("");

  // capacidades aproximadas por tipo de camión
  const CAPACIDAD = {
    GC: { kg: 26000, m3: 50 },
    MC: { kg: 14000, m3: 30 },
  };

  const conductoresDisponibles = conductores.filter(
    (c) => c.estado !== "inactivo"
  );

  const handleCalcular = () => {
    setError("");

    if (!origen || !destino) {
      setError("Debe existir origen y destino para estimar la ruta.");
      return;
    }

    const { distanciaKm, duracionHoras } = estimateRoute(origen, destino);

    const caps = CAPACIDAD[tipoCamion] || CAPACIDAD.GC;

    const camionesPorPeso =
      pesoKg > 0 ? Math.ceil(pesoKg / caps.kg) : 1;
    const camionesPorVolumen =
      volumenM3 > 0 ? Math.ceil(volumenM3 / caps.m3) : 1;

    const camionesNecesarios = Math.max(
      camionesPorPeso,
      camionesPorVolumen,
      1
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
  };

  const handleEnviarADirector = () => {
    if (!cotizacion) {
      setError("Primero debes calcular la ruta y la cotización.");
      return;
    }

    if (!onGenerarCotizacion) {
      setError("No se ha configurado el flujo de cotizaciones.");
      return;
    }

    onGenerarCotizacion({
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
    });

    // marcar solicitud en curso (o estado que quieras)
    onGestionar?.(id, { estado: "en-curso" });

    onClose?.();
  };

  const handleAsignarViaje = () => {
    if (!conductorId || !fechaAsignacion) {
      setError("Debes seleccionar conductor y fecha.");
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
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>
            📨 Solicitud #{id}{" "}
            {titulo ? `· ${titulo}` : ""}
          </h2>
          <button className="modal-close" onClick={onClose}>
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
              <div className="label">Fecha de asignación</div>
              <input
                type="date"
                className="input"
                value={fechaAsignacion}
                onChange={(e) => setFechaAsignacion(e.target.value)}
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 12 }}>
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
              <div className="helper-text">
                Se calcula automáticamente cuántos camiones se requieren según
                peso y volumen.
              </div>
            </div>

            <div>
              <div className="label">Acciones de cálculo</div>
              <button
                className="btn btn-primary"
                type="button"
                onClick={handleCalcular}
              >
                🧮 Calcular ruta y cotización
              </button>
            </div>
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

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={handleAsignarViaje}
          >
            📌 Asignar viaje
          </button>
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleEnviarADirector}
          >
            🧾 Enviar a Director (cotización)
          </button>
        </div>
      </div>
    </div>
  );
}
