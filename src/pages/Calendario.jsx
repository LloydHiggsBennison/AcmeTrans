// src/pages/Calendario.jsx
import { useMemo, useState } from "react";
import "../Calendario.css";
import { EventDetailModal } from "../components/EventDetailModal";

export function Calendario({ viajes = [], conductores = [], eventosCalendario = [], onLiberarViaje, onEliminarEvento, onEditarEvento, onEliminarViaje, onEditarViaje }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [selectedEvento, setSelectedEvento] = useState(null);

  const monthName = currentMonth.toLocaleString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );
  const startWeekday = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // -------- AGRUPAR VIAJES Y EVENTOS POR DÍA --------
  const eventosPorDia = useMemo(() => {
    const map = {};

    // Agregar viajes
    viajes.forEach((v) => {
      if (!v.fecha) return;

      const conductor =
        conductores.find((c) => c.id === Number(v.conductorId))?.nombre ||
        "Sin asignar";

      const hospedaje = (v.duracionHoras || 0) >= 4;

      const inicio = v.inicio ? new Date(v.inicio) : null;
      const hora =
        inicio && !Number.isNaN(inicio.getTime())
          ? inicio.toTimeString().slice(0, 5)
          : "—";

      // Parsear fechas como hora local
      const parseLocalDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const fechaInicio = parseLocalDate(v.fecha);
      const fechaFin = v.fechaRetorno ? parseLocalDate(v.fechaRetorno) : fechaInicio;

      // Generar viaje para cada día en el rango
      const currentDate = new Date(fechaInicio);
      while (currentDate <= fechaFin) {
        // Solo agregar si está en el mes actual
        if (
          currentDate.getFullYear() === currentMonth.getFullYear() &&
          currentDate.getMonth() === currentMonth.getMonth()
        ) {
          const dateStr = `${currentDate.getFullYear()}-${String(
            currentDate.getMonth() + 1
          ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

          const evento = {
            id: v.id,
            tipo: "viaje",
            conductorId: v.conductorId,
            conductor,
            origen: v.origen,
            destino: v.destino,
            hora,
            duracionHoras: v.duracionHoras || 0,
            hospedaje,
            tipoCamion: v.tipoCamion || "N/D",
            fecha: v.fecha,
            fechaRetorno: v.fechaRetorno,
            descripcion: v.descripcion || "",
            isMultiDay: v.fechaRetorno && v.fechaRetorno !== v.fecha,
          };

          if (!map[dateStr]) map[dateStr] = [];
          map[dateStr].push(evento);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Agregar eventos de calendario
    eventosCalendario.forEach((ev) => {
      if (!ev.fecha) return;

      const d = new Date(ev.fecha);
      if (
        d.getFullYear() !== currentMonth.getFullYear() ||
        d.getMonth() !== currentMonth.getMonth()
      ) {
        return;
      }

      const conductorNombre = ev.conductorId
        ? conductores.find((c) => c.id === Number(ev.conductorId))?.nombre || ev.conductorNombre || "Sin asignar"
        : "Sin asignar";

      // Calcular rango de fechas si tiene fechaRetorno
      // Parsear fechas como hora local para evitar offset de zona horaria
      const parseLocalDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const fechaInicio = parseLocalDate(ev.fecha);
      const fechaFin = ev.fechaRetorno ? parseLocalDate(ev.fechaRetorno) : fechaInicio;

      // Generar evento para cada día en el rango
      const currentDate = new Date(fechaInicio);
      while (currentDate <= fechaFin) {
        const dateStr = `${currentDate.getFullYear()}-${String(
          currentDate.getMonth() + 1
        ).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

        // Solo agregar si está en el mes actual
        if (
          currentDate.getFullYear() === currentMonth.getFullYear() &&
          currentDate.getMonth() === currentMonth.getMonth()
        ) {
          const evento = {
            id: ev.id,
            tipo: "calendario",
            cotizacionId: ev.cotizacionId,
            solicitudId: ev.solicitudId,
            conductorId: ev.conductorId,
            conductor: conductorNombre,
            origen: ev.origen || "N/D",
            destino: ev.destino || "N/D",
            hora: "—",
            descripcion: ev.descripcion,
            estado: ev.estado,
            tipoCamion: ev.tipoCamion || "N/D",
            hospedaje: false,
            fecha: ev.fecha,
            fechaRetorno: ev.fechaRetorno,
            // Indicar si es multi-día
            isMultiDay: ev.fechaRetorno && ev.fechaRetorno !== ev.fecha,
          };

          if (!map[dateStr]) map[dateStr] = [];
          map[dateStr].push(evento);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    return map;
  }, [viajes, eventosCalendario, conductores, currentMonth]);

  // -------- NAVEGACIÓN MESES --------
  const handlePrevMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  // -------- CLICK EN EVENTO → ABRIR MODAL --------
  const handleClickEvento = (ev) => {
    // Abrir modal de detalles para cualquier tipo de evento
    setSelectedEvento(ev);
  };

  // -------- CELDAS DEL CALENDARIO --------
  const celdas = [];
  for (let i = 0; i < startWeekday; i++) celdas.push(null);
  for (let day = 1; day <= daysInMonth; day++) celdas.push(day);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📅 Calendario de viajes</h1>
          <p className="page-subtitle">
            Visualiza los viajes asignados a los conductores en vista mensual.
          </p>
        </div>
      </div>

      <div className="card calendar-card">
        <div className="calendar-header">
          <button className="btn btn-ghost" onClick={handlePrevMonth}>
            ‹
          </button>
          <div className="calendar-title">{monthName}</div>
          <button className="btn btn-ghost" onClick={handleNextMonth}>
            ›
          </button>
        </div>

        <div className="calendar-grid">
          {["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"].map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}

          {celdas.map((day, idx) => {
            if (day === null) {
              return (
                <div key={`empty-${idx}`} className="calendar-cell empty" />
              );
            }

            const dateStr = `${currentMonth.getFullYear()}-${String(
              currentMonth.getMonth() + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const eventos = eventosPorDia[dateStr] || [];

            return (
              <div key={dateStr} className="calendar-cell">
                <div className="calendar-day-number">{day}</div>

                <div className="calendar-events">
                  {eventos.map((ev) => {
                    // Determinar clase CSS según tipo y estado
                    let eventoClass = "calendar-event";
                    if (ev.hospedaje) {
                      eventoClass += " calendar-event-hospedaje";
                    }
                    if (ev.tipo === "calendario") {
                      if (ev.estado === "pendiente") {
                        eventoClass += " calendar-event-pendiente";
                      } else if (ev.estado === "aprobada") {
                        eventoClass += " calendar-event-aprobada";
                      }
                    }

                    const tipoLabel = ev.tipo === "viaje" ? "Viaje" : "Cotización";

                    return (
                      <div
                        key={`${dateStr}-${ev.tipo}-${ev.id}`}
                        className={eventoClass}
                        onClick={() => handleClickEvento(ev)}
                        title={`[${tipoLabel}] ${ev.conductor} · ${ev.origen} → ${ev.destino
                          } · ${ev.hora} · ${ev.tipoCamion}${ev.tipo === "calendario"
                            ? ` · ${ev.estado === "pendiente" ? "Pendiente" : "Aprobada"}`
                            : ""
                          }`}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="calendar-event-main">
                          <span className="calendar-event-time">{ev.hora}</span>
                          <span className="calendar-event-text">
                            {ev.conductor}
                          </span>
                        </div>
                        <div className="calendar-event-sub">
                          {ev.origen} → {ev.destino}
                          {ev.hospedaje && " · Hospedaje"}
                          {ev.tipo === "calendario" && ` · ${ev.tipoCamion}`}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span className="badge badge-normal" />
          <span>Viaje normal</span>
          <span className="badge badge-hospedaje" />
          <span>Viaje con hospedaje</span>
          <span className="badge badge-pendiente" />
          <span>Cotización pendiente</span>
          <span className="badge badge-aprobada" />
          <span>Cotización aprobada</span>
        </div>
      </div>

      {/* Modal de detalle de evento */}
      {selectedEvento && (
        <EventDetailModal
          evento={selectedEvento}
          conductores={conductores}
          onClose={() => setSelectedEvento(null)}
          onDelete={onEliminarEvento}
          onEdit={onEditarEvento}
          onDeleteViaje={onEliminarViaje}
          onEditViaje={onEditarViaje}
          onLiberarViaje={onLiberarViaje}
        />
      )}
    </section>
  );
}
