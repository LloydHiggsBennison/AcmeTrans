import { useState } from "react";
import { Navbar } from "./components/Navbar.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { seedConductores, seedViajes, ORIGENES, REGIONES_CHILE } from "./data/seed.js";

import { Dashboard } from "./pages/Dashboard.jsx";
import { Conductores } from "./pages/Conductores.jsx";
import { Viajes } from "./pages/Viajes.jsx";
import { Rutas } from "./pages/Rutas.jsx";
import { Seguimiento } from "./pages/Seguimiento.jsx";
import { Reportes } from "./pages/Reportes.jsx";

export default function App() {
  const [active, setActive] = useState("dashboard");

  const [conductores, setConductores] = useLocalStorage(
    "ca_conductores",
    seedConductores
  );
  const [viajes, setViajes] = useLocalStorage("ca_viajes", seedViajes);

  const [lastRoute, setLastRoute] = useState(null);

  const handleAddConductor = (nuevo) => {
    setConductores((prev) => {
      const id = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
      return [...prev, { ...nuevo, id, estado: "disponible" }];
    });
  };

  const handleUpdateConductor = (id, actualizado) => {
    setConductores((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
  };

  const hoy = new Date().toISOString().split("T")[0];

  const handleAddViaje = (nuevo) => {
    setViajes((prev) => {
      const id = prev.length ? Math.max(...prev.map((v) => v.id)) + 1 : 1;
      return [
        ...prev,
        {
          id,
          conductorId: Number(nuevo.conductorId),
          origen: nuevo.origen,
          destino: nuevo.destino,
          fecha: hoy,
          estado: "pendiente",
          distanciaKm: Number(nuevo.distanciaKm || 0),
          duracionHoras: Number(nuevo.duracionHoras || 1),
          inicio: new Date().toISOString(),
        },
      ];
    });
  };

  const handleUpdateViaje = (id, actualizado) => {
    setViajes((prev) => prev.map((v) => (v.id === id ? actualizado : v)));
  };

  // Asignar viaje desde el modal de Conductores
  const handleAssignTrip = (conductorId, dataViaje) => {
    setViajes((prev) => {
      const id = prev.length ? Math.max(...prev.map((v) => v.id)) + 1 : 1;
      return [
        ...prev,
        {
          id,
          conductorId,
          origen: dataViaje.origen,
          destino: dataViaje.destino,
          fecha: hoy,
          estado: "en-curso",
          distanciaKm: Number(dataViaje.distanciaKm || 0),
          duracionHoras: Number(dataViaje.duracionHoras || 1),
          inicio: new Date().toISOString(),
        },
      ];
    });

    // marcar conductor como ocupado
    setConductores((prev) =>
      prev.map((c) =>
        c.id === conductorId ? { ...c, estado: "ocupado" } : c
      )
    );
  };

  let page = null;
  if (active === "dashboard")
    page = <Dashboard conductores={conductores} viajes={viajes} />;
  else if (active === "conductores")
    page = (
      <Conductores
        conductores={conductores}
        onAdd={handleAddConductor}
        onUpdate={handleUpdateConductor}
        onAssignTrip={handleAssignTrip}
      />
    );
  else if (active === "viajes")
    page = (
      <Viajes
        viajes={viajes}
        conductores={conductores}
        origenes={ORIGENES}
        regiones={REGIONES_CHILE}
        onAdd={handleAddViaje}
        onUpdate={handleUpdateViaje}
      />
    );
  else if (active === "rutas")
    page = (
      <Rutas
        origenes={ORIGENES}
        regiones={REGIONES_CHILE}
        onRouteCalculated={setLastRoute}
      />
    );
  else if (active === "seguimiento")
    page = <Seguimiento viajes={viajes} lastRoute={lastRoute} />;
  else if (active === "reportes")
    page = <Reportes conductores={conductores} viajes={viajes} />;

  return (
    <div className="app-shell">
      <Navbar active={active} onChange={setActive} />
      {page}
    </div>
  );
}
