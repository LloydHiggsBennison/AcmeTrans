// src/App.jsx
import { useState, lazy, Suspense, useEffect } from "react";
import { Navbar } from "./components/Navbar.jsx";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import {
  seedConductores,
  seedViajes,
  ORIGENES,
  REGIONES_CHILE,
  SOLICITUDES,
} from "./data/seed.js";
import { Login } from "./pages/Login.jsx";

// Services
import { ConductorService } from "./services/conductorService.js";
import { ViajeService } from "./services/viajeService.js";
import { authService } from "./services/authService.js";
import { logger, auditLog, handleError } from "./utils/errorHandler.js";
import { ESTADOS } from "./config/constants.js";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard.jsx').then(m => ({ default: m.Dashboard })));
const Conductores = lazy(() => import('./pages/Conductores.jsx').then(m => ({ default: m.Conductores })));
const Rutas = lazy(() => import('./pages/Rutas.jsx').then(m => ({ default: m.Rutas })));
const Viajes = lazy(() => import('./pages/Viajes.jsx').then(m => ({ default: m.Viajes })));
const Seguimiento = lazy(() => import('./pages/Seguimiento.jsx').then(m => ({ default: m.Seguimiento })));
const Reportes = lazy(() => import('./pages/Reportes.jsx').then(m => ({ default: m.Reportes })));
const Calendario = lazy(() => import('./pages/Calendario.jsx').then(m => ({ default: m.Calendario })));
const Director = lazy(() => import('./pages/Director.jsx').then(m => ({ default: m.Director })));

// Loading component
function LoadingFallback() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Cargando...</p>
    </div>
  );
}

export default function App() {
  const [active, setActive] = useState("dashboard");

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const [conductores, setConductores] = useLocalStorage(
    "conductores",
    seedConductores
  );
  const [viajes, setViajes] = useLocalStorage("viajes", seedViajes);

  const [solicitudes, setSolicitudes] = useLocalStorage(
    "solicitudes",
    SOLICITUDES
  );

  // Cotizaciones generadas desde los modales (pendientes/aprobadas/rechazadas)
  const [cotizaciones, setCotizaciones] = useLocalStorage(
    "cotizaciones",
    []
  );

  // Eventos de calendario generados desde cotizaciones
  const [eventosCalendario, setEventosCalendario] = useLocalStorage(
    "eventosCalendario",
    []
  );

  const [lastRoute, setLastRoute] = useState(null);

  const hoy = new Date().toISOString().split("T")[0];

  /****************************************************
   * AUTHENTICATION HANDLERS
   ****************************************************/
  const handleLogin = (username, password) => {
    const user = authService.login(username, password);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setActive("dashboard");
  };

  /****************************************************
   * CONDUCTORES - Con validación y servicios
   ****************************************************/
  const handleAddConductor = (nuevo) => {
    try {
      const conductor = ConductorService.create(nuevo, conductores);
      setConductores((prev) => [...prev, conductor]);
      logger.info('Conductor added successfully', { id: conductor.id });
    } catch (error) {
      const message = handleError(error, 'Agregar conductor');
      alert(message);
    }
  };

  const handleUpdateConductor = (id, actualizado) => {
    try {
      const updated = ConductorService.update(id, actualizado, conductores);
      setConductores((prev) => prev.map((c) => (c.id === id ? updated : c)));
      logger.info('Conductor updated successfully', { id });
    } catch (error) {
      const message = handleError(error, 'Actualizar conductor');
      alert(message);
    }
  };


  /****************************************************
   * VIAJES - Con validación y servicios
   ****************************************************/
  const handleAddViaje = (nuevo) => {
    try {
      const viaje = ViajeService.create(nuevo, viajes);
      setViajes((prev) => [...prev, viaje]);
      logger.info('Viaje added successfully', { id: viaje.id });
    } catch (error) {
      const message = handleError(error, 'Agregar viaje');
      alert(message);
    }
  };

  const handleUpdateViaje = (id, actualizado) => {
    try {
      const updated = ViajeService.update(id, actualizado, viajes);
      setViajes((prev) => prev.map((v) => (v.id === id ? updated : v)));
      logger.info('Viaje updated successfully', { id });
    } catch (error) {
      const message = handleError(error, 'Actualizar viaje');
      alert(message);
    }
  };

  // Asignar viaje rápido desde Conductores
  const handleAssignTrip = (conductorId, dataViaje) => {
    try {
      // Crear viaje con estado "en-curso"
      const viajeData = {
        ...dataViaje,
        conductorId,
        estado: ESTADOS.VIAJE.EN_CURSO,
        fecha: hoy,
      };

      const viaje = ViajeService.create(viajeData, viajes);
      setViajes((prev) => [...prev, viaje]);

      // Marcar conductor como ocupado
      setConductores((prev) =>
        prev.map((c) =>
          c.id === conductorId ? { ...c, estado: ESTADOS.CONDUCTOR.OCUPADO } : c
        )
      );

      auditLog.log('ASSIGN_TRIP', 'Viaje', {
        viajeId: viaje.id,
        conductorId
      });

      logger.info('Trip assigned successfully', { viajeId: viaje.id, conductorId });
    } catch (error) {
      const message = handleError(error, 'Asignar viaje');
      alert(message);
    }
  };

  /****************************************************
   * LIBERAR VIAJE DESDE CALENDARIO
   ****************************************************/
  const handleLiberarViaje = (viajeId, conductorId) => {
    try {
      // 1) quitar el viaje de la lista
      const viajesRestantes = viajes.filter((v) => v.id !== viajeId);
      setViajes(viajesRestantes);

      // 2) ver si el conductor aún tiene viajes en curso
      const sigueConViajesEnCurso = viajesRestantes.some(
        (v) => v.conductorId === conductorId && v.estado === ESTADOS.VIAJE.EN_CURSO
      );

      // 3) si ya no tiene, pasarlo a disponible
      if (!sigueConViajesEnCurso) {
        setConductores((prev) =>
          prev.map((c) =>
            c.id === conductorId ? { ...c, estado: ESTADOS.CONDUCTOR.DISPONIBLE } : c
          )
        );
      }

      auditLog.log('LIBERAR_VIAJE', 'Viaje', { viajeId, conductorId });
      logger.info('Trip released', { viajeId, conductorId });
    } catch (error) {
      const message = handleError(error, 'Liberar viaje');
      alert(message);
    }
  };

  /****************************************************
   * SOLICITUDES (bandeja lateral Dashboard)
   ****************************************************/
  const handleGestionarSolicitud = (id, data) => {
    try {
      const nuevoEstado = data?.estado || ESTADOS.SOLICITUD.EN_CURSO;
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, estado: nuevoEstado } : s
        )
      );

      auditLog.log('GESTIONAR_SOLICITUD', 'Solicitud', { id, estado: nuevoEstado });
    } catch (error) {
      const message = handleError(error, 'Gestionar solicitud');
      alert(message);
    }
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
    try {
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
              estado: ESTADOS.CONDUCTOR.OCUPADO,
            }
            : c
        )
      );

      // Marcar solicitud como en curso
      setSolicitudes((prev) =>
        prev.map((s) =>
          s.id === solicitudId ? { ...s, estado: ESTADOS.SOLICITUD.EN_CURSO } : s
        )
      );

      auditLog.log('ASIGNAR_SOLICITUD', 'Solicitud', { solicitudId, conductorId });
      logger.info('Request assigned', { solicitudId, conductorId });
    } catch (error) {
      const message = handleError(error, 'Asignar solicitud');
      alert(message);
    }
  };

  /****************************************************
   * COTIZACIONES (generadas desde los modales / rutas)
   ****************************************************/
  const handleGenerarCotizacion = (cotizacionBase) => {
    try {
      setCotizaciones((prev) => {
        const nuevoId = prev.length
          ? Math.max(...prev.map((c) => c.id || 0)) + 1
          : 1;

        const cotizacion = {
          ...cotizacionBase,
          id: nuevoId,
          estado: ESTADOS.COTIZACION.PENDIENTE,
          fechaCreacion: new Date().toISOString(),
        };

        // Si la cotización viene con fechaEvento, actualizar el evento de calendario asociado
        if (cotizacionBase.fechaEvento) {
          // Buscar el último evento sin cotizacionId para esta solicitud
          setEventosCalendario((prevEventos) =>
            prevEventos.map((ev) => {
              if (
                ev.solicitudId === cotizacionBase.solicitudId &&
                ev.cotizacionId === null
              ) {
                return { ...ev, cotizacionId: nuevoId };
              }
              return ev;
            })
          );
        }

        return [...prev, cotizacion];
      });

      auditLog.log('GENERAR_COTIZACION', 'Cotizacion', cotizacionBase);
      logger.info('Quote generated');
    } catch (error) {
      const message = handleError(error, 'Generar cotización');
      alert(message);
    }
  };

  const handleAprobarCotizacion = (cotizacionId) => {
    try {
      setCotizaciones((prev) => {
        const updated = prev.map((c) =>
          c.id === cotizacionId ? { ...c, estado: ESTADOS.COTIZACION.APROBADA } : c
        );

        const aprobada = updated.find((c) => c.id === cotizacionId);
        if (aprobada) {
          setLastRoute({
            origen: aprobada.origen,
            destino: aprobada.destino,
            distancia: aprobada.distanciaKm,
            duracion: aprobada.duracionHoras,
          });

          // Crear viaje automáticamente cuando se aprueba la cotización
          const nuevoViajeId = viajes.length > 0
            ? Math.max(...viajes.map(v => v.id || 0)) + 1
            : 1;

          const nuevoViaje = {
            id: nuevoViajeId,
            conductorId: aprobada.conductorId || null,
            camionId: null, // Se puede asignar después
            origen: aprobada.origen,
            destino: aprobada.destino,
            fecha: aprobada.fechaEvento || new Date().toISOString().split('T')[0],
            estado: ESTADOS.VIAJE.EN_CURSO,
            distanciaKm: aprobada.distanciaKm,
            duracionHoras: aprobada.duracionHoras,
            inicio: new Date().toISOString(), // Iniciar ahora
            pesoKg: aprobada.pesoKg || 0,
            volumenM3: aprobada.volumenM3 || 0,
            camionesNecesarios: aprobada.camionesNecesarios || 1,
            cotizacionId: cotizacionId,
            solicitudId: aprobada.solicitudId || null,
          };

          setViajes((prevViajes) => [...prevViajes, nuevoViaje]);

          // Si hay conductor asignado, marcarlo como ocupado
          if (aprobada.conductorId) {
            setConductores((prevConductores) =>
              prevConductores.map((c) =>
                c.id === aprobada.conductorId
                  ? { ...c, estado: ESTADOS.CONDUCTOR.OCUPADO }
                  : c
              )
            );
          }

          // Actualizar solicitud a completado si existe
          if (aprobada.solicitudId) {
            setSolicitudes((prevSolicitudes) =>
              prevSolicitudes.map((s) =>
                s.id === aprobada.solicitudId
                  ? { ...s, estado: ESTADOS.SOLICITUD.COMPLETADO }
                  : s
              )
            );
          }

          logger.info('Trip created from approved quote', {
            viajeId: nuevoViajeId,
            cotizacionId
          });
        }

        return updated;
      });

      auditLog.log('APROBAR_COTIZACION', 'Cotizacion', { cotizacionId });
      logger.info('Quote approved', { cotizacionId });
    } catch (error) {
      const message = handleError(error, 'Aprobar cotización');
      alert(message);
    }
  };

  const handleRechazarCotizacion = (cotizacionId) => {
    try {
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.id === cotizacionId ? { ...c, estado: ESTADOS.COTIZACION.RECHAZADA } : c
        )
      );

      // Eliminar evento del calendario asociado a esta cotización
      setEventosCalendario((prev) =>
        prev.filter((ev) => ev.cotizacionId !== cotizacionId)
      );

      auditLog.log('RECHAZAR_COTIZACION', 'Cotizacion', { cotizacionId });
      logger.info('Quote rejected', { cotizacionId });
    } catch (error) {
      const message = handleError(error, 'Rechazar cotización');
      alert(message);
    }
  };

  /****************************************************
   * EVENTOS DE CALENDARIO
   ****************************************************/
  const handleCrearEventoCalendario = (evento) => {
    try {
      setEventosCalendario((prev) => {
        const nuevoId = prev.length
          ? Math.max(...prev.map((e) => e.id || 0)) + 1
          : 1;

        const eventoCompleto = {
          ...evento,
          id: nuevoId,
          fechaCreacion: new Date().toISOString(),
        };

        return [...prev, eventoCompleto];
      });

      auditLog.log('CREAR_EVENTO_CALENDARIO', 'EventoCalendario', evento);
      logger.info('Calendar event created');
    } catch (error) {
      const message = handleError(error, 'Crear evento de calendario');
      alert(message);
    }
  };

  const handleEliminarEventoCalendario = (eventoId) => {
    try {
      // Encontrar el evento para obtener la cotización asociada
      const evento = eventosCalendario.find(ev => ev.id === eventoId);

      // Si el evento tiene una cotización asociada, rechazarla
      if (evento && evento.cotizacionId) {
        setCotizaciones((prev) =>
          prev.map((c) =>
            c.id === evento.cotizacionId
              ? { ...c, estado: ESTADOS.COTIZACION.RECHAZADA }
              : c
          )
        );
        logger.info('Quote rejected due to calendar event deletion', {
          cotizacionId: evento.cotizacionId,
          eventoId
        });
      }

      // Eliminar el evento del calendario
      setEventosCalendario((prev) =>
        prev.filter((ev) => ev.id !== eventoId)
      );

      auditLog.log('ELIMINAR_EVENTO_CALENDARIO', 'EventoCalendario', { eventoId });
      logger.info('Calendar event deleted', { eventoId });
    } catch (error) {
      const message = handleError(error, 'Eliminar evento de calendario');
      alert(message);
    }
  };

  const handleEditarCotizacion = (cotizacionId, datosActualizados) => {
    try {
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.id === cotizacionId ? { ...c, ...datosActualizados } : c
        )
      );

      // Actualizar evento de calendario asociado si existe
      setEventosCalendario((prev) =>
        prev.map((ev) => {
          if (ev.cotizacionId === cotizacionId) {
            return {
              ...ev,
              origen: datosActualizados.origen || ev.origen,
              destino: datosActualizados.destino || ev.destino,
              tipoCamion: datosActualizados.tipoCamion || ev.tipoCamion,
              conductorId: datosActualizados.conductorId !== undefined
                ? datosActualizados.conductorId
                : ev.conductorId,
              fecha: datosActualizados.fechaEvento || ev.fecha,
            };
          }
          return ev;
        })
      );

      auditLog.log('EDITAR_COTIZACION', 'Cotizacion', { cotizacionId, datosActualizados });
      logger.info('Quote edited', { cotizacionId });
    } catch (error) {
      const message = handleError(error, 'Editar cotización');
      alert(message);
    }
  };

  const handleEditarEventoCalendario = (eventoId, datosActualizados) => {
    try {
      setEventosCalendario((prev) =>
        prev.map((ev) =>
          ev.id === eventoId ? { ...ev, ...datosActualizados } : ev
        )
      );

      auditLog.log('EDITAR_EVENTO_CALENDARIO', 'EventoCalendario', { eventoId, datosActualizados });
      logger.info('Calendar event edited', { eventoId });
    } catch (error) {
      const message = handleError(error, 'Editar evento de calendario');
      alert(message);
    }
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
        cotizaciones={cotizaciones}
        userRole={currentUser?.role}
        onGestionarSolicitud={handleGestionarSolicitud}
        onAsignarSolicitud={handleAsignarSolicitud}
        onGenerarCotizacion={handleGenerarCotizacion}
        onCrearEventoCalendario={handleCrearEventoCalendario}
        onAprobar={handleAprobarCotizacion}
        onRechazar={handleRechazarCotizacion}
        onEditar={handleEditarCotizacion}
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
        conductores={conductores}
        onRouteCalculated={setLastRoute}
        onGenerarCotizacion={handleGenerarCotizacion}
        onCrearEventoCalendario={handleCrearEventoCalendario}
      />
    );
  else if (active === "calendario")
    page = (
      <Calendario
        viajes={viajes}
        conductores={conductores}
        eventosCalendario={eventosCalendario}
        onLiberarViaje={handleLiberarViaje}
        onEliminarEvento={handleEliminarEventoCalendario}
        onEditarEvento={handleEditarEventoCalendario}
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
        conductores={conductores}
        onAprobar={handleAprobarCotizacion}
        onRechazar={handleRechazarCotizacion}
        onEditar={handleEditarCotizacion}
      />
    );

  // Show login page if not authenticated
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-shell">
      <Navbar
        active={active}
        onChange={setActive}
        userRole={currentUser?.role}
        userName={currentUser?.nombre}
        onLogout={handleLogout}
      />
      <Suspense fallback={<LoadingFallback />}>
        {page}
      </Suspense>
    </div>
  );
}
