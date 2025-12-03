// src/components/Navbar.jsx

const TABS = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "conductores", label: "Conductores", emoji: "🧑‍✈️" },
  { id: "rutas", label: "Rutas", emoji: "🗺️" },
  { id: "viajes", label: "Viajes", emoji: "🚚" },
  { id: "seguimiento", label: "Seguimiento", emoji: "📍" },
  { id: "calendario", label: "Calendario", emoji: "📅" },
  { id: "reportes", label: "Reportes", emoji: "📑" },
];

export function Navbar({ active, onChange, userRole, userName, onLogout }) {
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

      <div className="navbar-right">
        <div className="user-section">
          <div className="user-avatar">
            {userRole === 'director' ? '👔' : '👤'}
          </div>
          <div className="user-info">
            <span className="user-name">{userName}</span>
            <span className="user-role">{userRole === 'director' ? 'Director' : 'Usuario General'}</span>
          </div>
        </div>
        <button className="btn-logout" onClick={onLogout} title="Cerrar sesión">
          <span className="logout-icon">🚪</span>
          <span>Salir</span>
        </button>
      </div>
    </header>
  );
}
