// src/components/SolicitudModal.jsx

import { useState } from "react";

export function SolicitudModal({
  solicitud,
  conductores,
  onClose,
  onGestionar,
  onAsignar,
}) {
  const [conductorId, setConductorId] = useState("");
  const [estado, setEstado] = useState(solicitud.estado || "nuevo");

  const handleGuardar = () => {
    onGestionar(solicitud.id, { estado });
    onClose();
  };

  const handleAsignar = () => {
    if (!conductorId) return;

    onAsignar(solicitud.id, {
      conductorId: Number(conductorId),
      origen: solicitud.origen || "Santiago",
      destino: solicitud.destino || "",
      distanciaKm: solicitud.distanciaKm || 0,
      duracionHoras: solicitud.duracionHoras || 4,
    });

    onGestionar(solicitud.id, { estado: "en-curso" });
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Solicitud: {solicitud.titulo}</h2>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="modal-row">
            <span className="label">Fecha:</span>
            <span>{solicitud.fecha}</span>
          </div>

          {solicitud.destino && (
            <div className="modal-row">
              <span className="label">Destino:</span>
              <span>{solicitud.destino}</span>
            </div>
          )}

          <div className="modal-row">
            <span className="label">Estado:</span>
            <select
              className="select"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="nuevo">nuevo</option>
              <option value="en-curso">en-curso</option>
              <option value="completado">completado</option>
            </select>
          </div>

          <hr className="modal-divider" />

          <h3 style={{ fontSize: 14, marginBottom: 8 }}>
            Asignar a un conductor
          </h3>
          <div className="modal-row">
            <span className="label">Conductor:</span>
            <select
              className="select"
              value={conductorId}
              onChange={(e) => setConductorId(e.target.value)}
            >
              <option value="">Seleccione conductor</option>
              {conductores
                .filter((c) => c.estado !== "ocupado")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} · {c.nombre} ({c.origen} · {c.tipo})
                  </option>
                ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={handleGuardar}>
            💾 Guardar estado
          </button>
          <button className="btn btn-primary" onClick={handleAsignar}>
            🚚 Asignar viaje
          </button>
        </div>
      </div>
    </div>
  );
}
