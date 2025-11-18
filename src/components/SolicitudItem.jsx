// src/components/SolicitudItem.jsx

export function SolicitudItem({ solicitud, onClick }) {
  const { titulo, nombre, fecha, estado, destino } = solicitud;
  const label = titulo || nombre || "Solicitud sin título";

  const estadoLabel =
    estado === "nuevo"
      ? "Nuevo"
      : estado === "en-curso"
      ? "En curso"
      : "Completado";

  return (
    <button className="solicitud-card" onClick={onClick}>
      <div className="solicitud-left">
        <div className="solicitud-icon">📁</div>
        <div className="solicitud-texts">
          <div className="solicitud-title">{label}</div>
          <div className="solicitud-meta">
            <span>{fecha}</span>
            {destino && <span>· {destino}</span>}
          </div>
        </div>
      </div>

      <div className={`solicitud-status solicitud-status-${estado}`}>
        {estadoLabel}
      </div>
    </button>
  );
}
