import { useState } from "react";
import { ORIGENES, REGIONES_CHILE } from "../data/seed";
import { estimateRoute } from "../utils/routeEstimator";

export function AsignarViajeModal({ conductor, onClose, onSave }) {
  const [origen, setOrigen] = useState(conductor.origen || "Osorno");
  const [destino, setDestino] = useState("");
  const [distanciaKm, setDistanciaKm] = useState("");
  const [duracionHoras, setDuracionHoras] = useState("");

  const actualizarEstimacion = (nuevoOrigen, nuevoDestino) => {
    const { distanciaKm, duracionHoras } = estimateRoute(
      nuevoOrigen,
      nuevoDestino
    );
    setDistanciaKm(distanciaKm || "");
    setDuracionHoras(duracionHoras || "");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!destino) return;
    onSave({
      origen,
      destino,
      distanciaKm,
      duracionHoras,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>Asignar viaje a {conductor.nombre}</h2>
          <button className="btn btn-soft" type="button" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="label">Origen</div>
          <select
            className="select"
            value={origen}
            onChange={(e) => {
              const value = e.target.value;
              setOrigen(value);
              actualizarEstimacion(value, destino);
            }}
          >
            {ORIGENES.map((o) => (
              <option key={o.id} value={o.nombre}>
                {o.nombre}
              </option>
            ))}
          </select>

          <div className="label" style={{ marginTop: 10 }}>
            Destino (Región)
          </div>
          <select
            className="select"
            value={destino}
            onChange={(e) => {
              const value = e.target.value;
              setDestino(value);
              actualizarEstimacion(origen, value);
            }}
          >
            <option value="">Seleccione región...</option>
            {REGIONES_CHILE.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <div className="grid-2" style={{ marginTop: 10 }}>
            <div>
              <div className="label">Distancia estimada (km)</div>
              <input
                className="input"
                type="number"
                min="0"
                value={distanciaKm}
                readOnly
              />
            </div>
            <div>
              <div className="label">Duración estimada (horas)</div>
              <input
                className="input"
                type="number"
                min="0"
                step="0.1"
                value={duracionHoras}
                readOnly
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              className="btn btn-soft"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              🚚 Asignar viaje
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
