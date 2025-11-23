// src/App.jsx
import { useState } from "react";
import { Navbar } from "./components/Navbar.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import {
  seedConductores,
  seedViajes,
  ORIGENES,
  REGIONES_CHILE,
  SOLICITUDES,
} from "./data/seed.js";

import { Dashboard } from "./pages/Dashboard.jsx";
import { Conductores } from "./pages/Conductores.jsx";
import { Rutas } from "./pages/Rutas.jsx";
import { Viajes } from "./pages/Viajes.jsx";
import { Seguimiento } from "./pages/Seguimiento.jsx";
import { Reportes } from "./pages/Reportes.jsx";
import { Calendario } from "./pages/Calendario.jsx";
import { Director } from "./pages/Director.jsx";

export default function App() {
  const [active, setActive] = useState("dashboard");

  const [conductores, setConductores] = useLocalStorage(
    "ca_conductores",
    seedConductores
  );
  const [viajes, setViajes] = useLocalStorage("ca_viajes", seedViajes);

  const [solicitudes, setSolicitudes] = useLocalStorage(
    "ca_solicitudes",
    SOLICITUDES
  );

  // Cotizaciones generadas desde los modales (pendientes/aprobadas/rechazadas)
  const [cotizaciones, setCotizaciones] = useLocalStorage(
    "ca_cotizaciones",
    []
  );

  const [lastRoute, setLastRoute] = useState(null);

  const hoy = new Date().toISOString().split("T")[0];

  /****************************************************
   * CONDUCTORES
   ****************************************************/
  const handleAddConductor = (nuevo) => {
    setConductores((prev) => {
      const id = prev.length ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
      return [...prev, { ...nuevo, id, estado: "disponible", bloqueos: [] }];
    });
  };

  const handleUpdateConductor = (id, actualizado) => {
    setConductores((prev) => prev.map((c) => (c.id === id ? actualizado : c)));
  };

  /****************************************************
   * VIAJES
   ****************************************************/
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
          tipoCamion: nuevo.tipoCamion || "GC",
          pesoKg: Number(nuevo.pesoKg || 0),
          volumenM3: Number(nuevo.volumenM3 || 0),
          camionesNecesarios: Number(nuevo.camionesNecesarios || 1),
        },
      ];
    });
  };

  const handleUpdateViaje = (id, actualizado) => {
    setViajes((prev) => prev.map((v) => (v.id === id ? actualizado : v)));
  };

  // Asignar viaje rápido desde Conductores
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
          tipoCamion: dataViaje.tipoCamion || dataViaje.tipo || "GC",
          pesoKg: Number(dataViaje.pesoKg || 0),
          volumenM3: Number(dataViaje.volumenM3 || 0),
          camionesNecesarios: Number(dataViaje.camionesNecesarios || 1),
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

  /****************************************************
   * LIBERAR VIAJE DESDE CALENDARIO
   ****************************************************/
  const handleLiberarViaje = (viajeId, conductorId) => {
    // 1) quitar el viaje de la lista
    const viajesRestantes = viajes.filter((v) => v.id !== viajeId);
    setViajes(viajesRestantes);

    // 2) ver si el conductor aún tiene viajes en curso
    const sigueConViajesEnCurso = viajesRestantes.some(
      (v) => v.conductorId === conductorId && v.estado === "en-curso"
    );

    // 3) si ya no tiene, pasarlo a disponible
    if (!sigueConViajesEnCurso) {
      setConductores((prev) =>
        prev.map((c) =>
          c.id === conductorId ? { ...c, estado: "disponible" } : c
        )
      );
    }
  };

  /****************************************************
   * SOLICITUDES (bandeja lateral Dashboard)
   ****************************************************/
  const handleGestionarSolicitud = (id, data) => {
    const nuevoEstado = data?.estado || "en-curso";
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, estado: nuevoEstado } : s
      )
    );
  };

  const handleAsignarSolicitud = ({
    solicitudId,
    conductorId,
    fecha,
    tipoCamion,
    pesoKg,
    volumenM3,
    camionesNecesarios,
  }) => {
    // Bloqueo en calendario del conductor (reserva)
    setConductores((prev) =>
      prev.map((c) =>
        c.id === Number(conductorId)
          ? {
              ...c,
              bloqueos: [
                ...(c.bloqueos || []),
                {
                  fecha,
                  motivo: `Solicitud ${solicitudId}`,
                  tipoCamion,
                  pesoKg,
                  volumenM3,
                  camiones: camionesNecesarios,
                },
              ],
              estado: "ocupado",
            }
          : c
      )
    );

    // Marcar solicitud como en curso
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === solicitudId ? { ...s, estado: "en-curso" } : s
      )
    );
  };

  /****************************************************
   * COTIZACIONES (generadas desde los modales / rutas)
   ****************************************************/
  const handleGenerarCotizacion = (cotizacionBase) => {
    setCotizaciones((prev) => {
      const nuevoId = prev.length
        ? Math.max(...prev.map((c) => c.id || 0)) + 1
        : 1;

      const cotizacion = {
        ...cotizacionBase,
        id: nuevoId,
        estado: "pendiente",
        fechaCreacion: new Date().toISOString(),
      };

      return [...prev, cotizacion];
    });
  };

  const handleAprobarCotizacion = (cotizacionId) => {
    setCotizaciones((prev) => {
      const updated = prev.map((c) =>
        c.id === cotizacionId ? { ...c, estado: "aprobada" } : c
      );

      const aprobada = updated.find((c) => c.id === cotizacionId);
      if (aprobada) {
        setLastRoute({
          origen: aprobada.origen,
          destino: aprobada.destino,
          distancia: aprobada.distanciaKm,
          duracion: aprobada.duracionHoras,
        });
      }

      return updated;
    });

    // Aquí podrías también:
    // - Crear un viaje en "viajes"
    // - Generar el PDF en Director.jsx al momento de aprobar
  };

  const handleRechazarCotizacion = (cotizacionId) => {
    setCotizaciones((prev) =>
      prev.map((c) =>
        c.id === cotizacionId ? { ...c, estado: "rechazada" } : c
      )
    );
  };

  /****************************************************
   * ROUTING SIMPLE
   ****************************************************/
  let page = null;

  if (active === "dashboard")
    page = (
      <Dashboard
        conductores={conductores}
        viajes={viajes}
        solicitudes={solicitudes}
        onGestionarSolicitud={handleGestionarSolicitud}
        onAsignarSolicitud={handleAsignarSolicitud}
        onGenerarCotizacion={handleGenerarCotizacion}
      />
    );
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
        onGenerarCotizacion={handleGenerarCotizacion}
      />
    );
  else if (active === "calendario")
    page = (
      <Calendario
        viajes={viajes}
        conductores={conductores}
        onLiberarViaje={handleLiberarViaje}
      />
    );
  else if (active === "seguimiento")
    page = <Seguimiento viajes={viajes} lastRoute={lastRoute} />;
  else if (active === "reportes")
    page = <Reportes conductores={conductores} viajes={viajes} />;
  else if (active === "director")
    page = (
      <Director
        cotizaciones={cotizaciones}
        onAprobar={handleAprobarCotizacion}
        onRechazar={handleRechazarCotizacion}
      />
    );

  return (
    <div className="app-shell">
      <Navbar active={active} onChange={setActive} />
      {page}
    </div>
  );
}
