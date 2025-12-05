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
import { useNotification } from "./context/NotificationContext.jsx";

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
  const { showNotification } = useNotification();

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

  // Ref to prevent double-click on approve button
  const [processingApproval, setProcessingApproval] = useState(false);

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
      showNotification(message);
    }
  };

  const handleUpdateConductor = (id, actualizado) => {
    try {
      const updated = ConductorService.update(id, actualizado, conductores);
      setConductores((prev) => prev.map((c) => (c.id === id ? updated : c)));
      logger.info('Conductor updated successfully', { id });
    } catch (error) {
      const message = handleError(error, 'Actualizar conductor');
      showNotification(message);
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
      showNotification(message);
    }
  };

  const handleUpdateViaje = (id, actualizado) => {
    console.log('handleUpdateViaje called with:', id, actualizado);
    try {
      const updated = ViajeService.update(id, actualizado, viajes);
      setViajes((prev) => prev.map((v) => (v.id === id ? updated : v)));
      logger.info('Viaje updated successfully', { id });
    } catch (error) {
      const message = handleError(error, 'Actualizar viaje');
      showNotification(message);
    }
  };

  const handleEliminarViaje = (viajeId) => {
    console.log('handleEliminarViaje called with:', viajeId);
    try {
      setViajes((prev) => prev.filter((v) => v.id !== viajeId));
      logger.info('Viaje deleted successfully', { id: viajeId });
      showNotification("Viaje eliminado y conductor liberado");
    } catch (error) {
      const message = handleError(error, 'Eliminar viaje');
      showNotification(message);
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
      showNotification(message);
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
      showNotification("Conductor liberado correctamente");
    } catch (error) {
      const message = handleError(error, 'Liberar viaje');
      showNotification(message);
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
      showNotification(message);
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

      // Crear viaje automáticamente para que aparezca en el calendario
      const nuevoViajeId = viajes.length > 0
        ? Math.max(...viajes.map(v => v.id || 0)) + 1
        : 1;

      const nuevoViaje = {
        id: nuevoViajeId,
        conductorId: Number(conductorId),
        camionId: null,
        origen: "Santiago", // Valor por defecto si no viene en data (aunque debería venir en solicitud)
        destino: "Destino", // Valor por defecto
        fecha: fecha,
        estado: ESTADOS.VIAJE.EN_CURSO,
        distanciaKm: 0,
        duracionHoras: 0,
        inicio: new Date().toISOString(),
        pesoKg: pesoKg || 0,
        volumenM3: volumenM3 || 0,
        camionesNecesarios: camionesNecesarios || 1,
        cotizacionId: null,
        solicitudId: solicitudId,
        tipoCamion: tipoCamion || "GC",
        // Intentar obtener origen/destino de la solicitud si es posible, 
        // pero aquí solo tenemos IDs. Idealmente 'data' debería traer origen/destino.
      };

      // Buscar la solicitud para obtener origen/destino correctos
      const solicitudOriginal = solicitudes.find(s => s.id === solicitudId);
      if (solicitudOriginal) {
        nuevoViaje.origen = solicitudOriginal.origen;
        nuevoViaje.destino = solicitudOriginal.destino;
      }

      setViajes((prev) => [...prev, nuevoViaje]);

    } catch (error) {
      const message = handleError(error, 'Asignar solicitud');
      showNotification(message);
    }
  };

  /****************************************************
   * COTIZACIONES (generadas desde los modales / rutas)
   ****************************************************/
  const handleGenerarCotizacion = (cotizacionBase, eventoData = null) => {
    try {
      let nuevoId;

      // Primero, crear la cotización y obtener su ID
      setCotizaciones((prev) => {
        nuevoId = prev.length
          ? Math.max(...prev.map((c) => c.id || 0)) + 1
          : 1;

        const cotizacion = {
          ...cotizacionBase,
          id: nuevoId,
          estado: ESTADOS.COTIZACION.PENDIENTE,
          fechaCreacion: new Date().toISOString(),
        };

        return [...prev, cotizacion];
      });

      // Luego, crear o actualizar el evento de calendario
      if (eventoData) {
        // Crear nuevo evento vinculado a la cotización
        console.log('[App.jsx] Creating calendar event with data:', eventoData, 'cotizacionId:', nuevoId);
        setEventosCalendario((prev) => {
          const newEventId = prev.length ? Math.max(...prev.map(e => e.id || 0)) + 1 : 1;
          return [...prev, {
            ...eventoData,
            id: newEventId,
            cotizacionId: nuevoId,
            fechaCreacion: new Date().toISOString()
          }];
        });
      } else if (cotizacionBase.fechaEvento) {
        // Buscar el último evento sin cotizacionId para esta solicitud (legacy fallback)
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

      auditLog.log('GENERAR_COTIZACION', 'Cotizacion', cotizacionBase);
      logger.info('Quote generated');

      // Actualizar estado del conductor a OCUPADO
      if (cotizacionBase.conductorId) {
        setConductores((prev) =>
          prev.map((c) =>
            c.id === Number(cotizacionBase.conductorId)
              ? { ...c, estado: ESTADOS.CONDUCTOR.OCUPADO }
              : c
          )
        );
      }
    } catch (error) {
      const message = handleError(error, 'Generar cotización');
      showNotification(message);
    }
  };

  const handleAprobarCotizacion = (cotizacionId) => {
    // Prevent double-click
    if (processingApproval) {
      console.log('[App.jsx] Approval already in progress, ignoring duplicate click');
      return;
    }

    setProcessingApproval(true);
    console.log('[App.jsx] Starting approval for cotizacion:', cotizacionId);

    try {
      // 1. Buscar el evento de calendario asociado ANTES de eliminarlo
      const eventoAsociado = eventosCalendario.find(ev => ev.cotizacionId === cotizacionId);
      console.log('[App.jsx] Found associated event:', eventoAsociado);

      // 2. Encontrar la cotización para obtener sus datos
      const aprobada = cotizaciones.find(c => c.id === cotizacionId);
      if (!aprobada) {
        console.error('[App.jsx] Quote not found:', cotizacionId);
        return;
      }

      // 3. Actualizar estado de la cotización
      setCotizaciones((prev) =>
        prev.map((c) =>
          c.id === cotizacionId ? { ...c, estado: ESTADOS.COTIZACION.APROBADA } : c
        )
      );

      // 4. Actualizar last route
      setLastRoute({
        origen: aprobada.origen,
        destino: aprobada.destino,
        distancia: aprobada.distanciaKm,
        duracion: aprobada.duracionHoras,
      });

      // 5. Crear viaje UNA SOLA VEZ
      const nuevoViajeId = viajes.length > 0
        ? Math.max(...viajes.map(v => v.id || 0)) + 1
        : 1;

      const nuevoViaje = {
        id: nuevoViajeId,
        conductorId: aprobada.conductorId || null,
        camionId: null,
        origen: aprobada.origen,
        destino: aprobada.destino,
        fecha: aprobada.fechaEvento || new Date().toISOString().split('T')[0],
        fechaRetorno: eventoAsociado?.fechaRetorno || null,
        estado: ESTADOS.VIAJE.EN_CURSO,
        distanciaKm: aprobada.distanciaKm,
        duracionHoras: aprobada.duracionHoras,
        inicio: new Date().toISOString(),
        pesoKg: aprobada.pesoKg || 0,
        volumenM3: aprobada.volumenM3 || 0,
        camionesNecesarios: aprobada.camionesNecesarios || 1,
        cotizacionId: cotizacionId,
        solicitudId: aprobada.solicitudId || null,
        tipoCamion: aprobada.tipoCamion || "GC",
      };

      console.log('[App.jsx] Creating viaje from approved quote (ONCE):', nuevoViaje);
      setViajes((prevViajes) => [...prevViajes, nuevoViaje]);

      // 6. Marcar conductor como ocupado si existe
      if (aprobada.conductorId) {
        setConductores((prevConductores) =>
          prevConductores.map((c) =>
            c.id === aprobada.conductorId
              ? { ...c, estado: ESTADOS.CONDUCTOR.OCUPADO }
              : c
          )
        );
      }

      // 7. Actualizar solicitud a completado si existe
      if (aprobada.solicitudId) {
        setSolicitudes((prevSolicitudes) =>
          prevSolicitudes.map((s) =>
            s.id === aprobada.solicitudId
              ? { ...s, estado: ESTADOS.SOLICITUD.COMPLETADO }
              : s
          )
        );
      }

      // Eliminar el evento del calendario asociado a esta cotización para evitar duplicados
      // (ya que ahora existe como Viaje)
      console.log('[App.jsx] Deleting calendar events for cotizacion:', cotizacionId);
      setEventosCalendario((prev) => {
        const filtered = prev.filter((ev) => ev.cotizacionId !== cotizacionId);
        return filtered;
      });

      auditLog.log('APROBAR_COTIZACION', 'Cotizacion', { cotizacionId });
      logger.info('Quote approved', { cotizacionId });
      showNotification("La propuesta ha sido enviada al cliente", "success");
    } catch (error) {
      const message = handleError(error, 'Aprobar cotización');
      showNotification(message, "error");
    } finally {
      // Reset the flag after a short delay
      setTimeout(() => {
        setProcessingApproval(false);
        console.log('[App.jsx] Processing flag reset');
      }, 1000);
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
      const eventosFiltrados = eventosCalendario.filter((ev) => ev.cotizacionId !== cotizacionId);
      setEventosCalendario(eventosFiltrados);

      // Verificar si el conductor queda libre
      const cotizacion = cotizaciones.find(c => c.id === cotizacionId);
      if (cotizacion && cotizacion.conductorId) {
        const conductorId = cotizacion.conductorId;

        // Tiene otros viajes en curso?
        const tieneViajes = viajes.some(v =>
          v.conductorId === conductorId &&
          v.estado === ESTADOS.VIAJE.EN_CURSO
        );

        // Tiene otros eventos en calendario?
        const tieneEventos = eventosFiltrados.some(e =>
          e.conductorId === conductorId
        );

        if (!tieneViajes && !tieneEventos) {
          setConductores((prev) =>
            prev.map((c) =>
              c.id === conductorId ? { ...c, estado: ESTADOS.CONDUCTOR.DISPONIBLE } : c
            )
          );
        }
      }

      auditLog.log('RECHAZAR_COTIZACION', 'Cotizacion', { cotizacionId });
      logger.info('Quote rejected', { cotizacionId });
    } catch (error) {
      const message = handleError(error, 'Rechazar cotización');
      showNotification(message);
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
      showNotification(message);
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
      const eventosRestantes = eventosCalendario.filter((ev) => ev.id !== eventoId);
      setEventosCalendario(eventosRestantes);

      // Verificar si el conductor queda libre
      if (evento && evento.conductorId) {
        const conductorId = evento.conductorId;

        // Tiene otros viajes en curso?
        const tieneViajes = viajes.some(v =>
          v.conductorId === conductorId &&
          v.estado === ESTADOS.VIAJE.EN_CURSO
        );

        // Tiene otros eventos en calendario?
        const tieneEventos = eventosRestantes.some(e =>
          e.conductorId === conductorId
        );

        if (!tieneViajes && !tieneEventos) {
          setConductores((prev) =>
            prev.map((c) =>
              c.id === conductorId ? { ...c, estado: ESTADOS.CONDUCTOR.DISPONIBLE } : c
            )
          );
        }
      }

      auditLog.log('ELIMINAR_EVENTO_CALENDARIO', 'EventoCalendario', { eventoId });
      logger.info('Calendar event deleted', { eventoId });
      showNotification("Evento eliminado y conductor liberado si corresponde");
    } catch (error) {
      const message = handleError(error, 'Eliminar evento de calendario');
      showNotification(message);
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
      showNotification(message);
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
      showNotification(message);
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
        eventosCalendario={eventosCalendario}
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
        onEliminarViaje={handleEliminarViaje}
        onEditarViaje={handleUpdateViaje}
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
