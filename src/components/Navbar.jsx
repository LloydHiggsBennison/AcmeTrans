// src/components/Navbar.jsx

const TABS = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "conductores", label: "Conductores", emoji: "🧑‍✈️" },
  { id: "viajes", label: "Viajes", emoji: "🚚" },

  // 🔥 Nuevo botón Calendario agregado aquí
  { id: "calendario", label: "Calendario", emoji: "📅" },

  { id: "rutas", label: "Rutas", emoji: "🗺️" },
  { id: "seguimiento", label: "Seguimiento", emoji: "📍" },
  { id: "reportes", label: "Reportes", emoji: "📑" },
];

export function Navbar({ active, onChange }) {
  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="nav-logo">CA</div>
        <div className="nav-title">
          <span className="nav-title-main">Corporativa AcmeTrans</span>
          <span className="nav-title-sub">
            Gestión de flotas, rutas y seguimiento en tiempo real
          </span>
        </div>
      </div>

      <nav className="nav-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${active === tab.id ? "active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="emoji">{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
