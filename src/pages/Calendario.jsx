// src/pages/Calendario.jsx
import { useMemo, useState } from "react";
import "../Calendario.css";

export function Calendario({ viajes = [], conductores = [] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

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
  const startWeekday = firstDay.getDay(); // 0 = domingo
  const daysInMonth = lastDay.getDate();

  // --- Agrupar viajes por día del mes actual ---
  const eventosPorDia = useMemo(() => {
    const map = {};
    viajes.forEach((v) => {
      if (!v.fecha) return;

      const d = new Date(v.fecha);
      if (
        d.getFullYear() !== currentMonth.getFullYear() ||
        d.getMonth() !== currentMonth.getMonth()
      ) {
        return;
      }

      const conductor =
        conductores.find((c) => c.id === Number(v.conductorId))?.nombre ||
        "Sin asignar";

      // Hospedaje si dura 4h o más
      const hospedaje = (v.duracionHoras || 0) >= 4;

      const inicio = v.inicio ? new Date(v.inicio) : null;
      const hora =
        inicio && !Number.isNaN(inicio.getTime())
          ? inicio.toTimeString().slice(0, 5)
          : "—";

      const evento = {
        id: v.id,
        conductor,
        origen: v.origen,
        destino: v.destino,
        hora,
        duracionHoras: v.duracionHoras || 0,
        hospedaje,
      };

      if (!map[v.fecha]) map[v.fecha] = [];
      map[v.fecha].push(evento);
    });
    return map;
  }, [viajes, conductores, currentMonth]);

  // --- Celdas del calendario (huecos + días) ---
  const celdas = [];
  for (let i = 0; i < startWeekday; i++) celdas.push(null);
  for (let day = 1; day <= daysInMonth; day++) celdas.push(day);

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
                  {eventos.map((ev) => (
                    <div
                      key={ev.id}
                      className={
                        "calendar-event" +
                        (ev.hospedaje ? " calendar-event-hospedaje" : "")
                      }
                      title={`${ev.conductor} · ${ev.origen} → ${
                        ev.destino
                      } · ${ev.hora} · ${ev.duracionHoras.toFixed(1)} h`}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span className="badge badge-normal" />
          <span>Viaje normal</span>
          <span className="badge badge-hospedaje" />
          <span>Viaje con hospedaje (día completo)</span>
        </div>
      </div>
    </section>
  );
}
