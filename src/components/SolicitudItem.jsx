// src/components/SolicitudItem.jsx

export function SolicitudItem({ solicitud, onClick }) {
  const {
    id,
    titulo,
    descripcion,
    cliente,
    fecha,
    estado,
    origen,
    destino,
    pesoKg,
    volumenM3,
  } = solicitud;

  // Texto principal de la solicitud (qué se pidió)
  const tituloMostrar =
    titulo || descripcion || cliente || `Solicitud #${id}`;

  const estadoLabel =
    estado === "nuevo"
      ? "Nuevo"
      : estado === "en-curso"
      ? "En curso"
      : estado === "completado"
      ? "Completado"
      : "Sin estado";

  return (
    <button
      type="button"
      className="solicitud-card"
      onClick={onClick}
    >
      {/* IZQUIERDA */}
      <div className="solicitud-left">
        <div className="solicitud-icon">📨</div>

        <div className="solicitud-texts">
          {/* Qué se pidió */}
          <div className="solicitud-title">{tituloMostrar}</div>

          {/* Fecha */}
          {fecha && (
            <div className="solicitud-meta">
              <span>{fecha}</span>
            </div>
          )}

          {/* Ruta: origen → destino */}
          <div className="solicitud-meta">
            <span>
              <strong>Ruta:</strong>{" "}
              {origen || "—"} → {destino || "—"}
            </span>
          </div>

          {/* Carga: peso y volumen */}
          <div className="solicitud-meta">
            <span>
              <strong>Carga:</strong>{" "}
              {pesoKg ? `${pesoKg} kg` : "—"}
            </span>
            <span>
              {" · "}
              <strong>Volumen:</strong>{" "}
              {volumenM3 ? `${volumenM3} m³` : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* DERECHA: estado pill */}
      <div
        className={
          "solicitud-status " +
          (estado === "nuevo"
            ? "solicitud-status-nuevo"
            : estado === "en-curso"
            ? "solicitud-status-en-curso"
            : estado === "completado"
            ? "solicitud-status-completado"
            : "")
        }
      >
        {estadoLabel}
      </div>
    </button>
  );
}
