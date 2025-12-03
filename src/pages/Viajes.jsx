// src/pages/Viajes.jsx
import { useMemo, useState } from "react";
import { estimateRoute } from "../utils/routeEstimator";
import { getTripMetrics } from "../utils/tripMetrics";
import { calcularCamionesNecesarios } from "../utils/capacity";

const ESTADOS = ["todos", "pendiente", "en-curso", "completado"];

export function Viajes({
  viajes,
  conductores,
  origenes,
  regiones,
  onAdd,
  onUpdate,
}) {
  const [form, setForm] = useState({
    conductorId: "",
    tipoCamion: "GC",
    origen: origenes[1]?.nombre || "Santiago",
    destino: "",
    fecha: new Date().toISOString().split('T')[0],
    fechaRetorno: "",
    descripcion: "",
    distanciaKm: "",
    duracionHoras: "",
    pesoKg: "",
    volumenM3: "",
  });
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const conductoresDisponibles = useMemo(
    () => {
      const orden = { "Coquimbo": 1, "Santiago": 2, "Osorno": 3 };
      return conductores
        .filter((c) => c.estado !== "ocupado")
        .sort((a, b) => {
          const ordenA = orden[a.origen] || 999;
          const ordenB = orden[b.origen] || 999;
          return ordenA - ordenB;
        });
    },
    [conductores]
  );

  const filtrados = useMemo(() => {
    if (filtroEstado === "todos") return viajes;
    return viajes.filter((v) => v.estado === filtroEstado);
  }, [viajes, filtroEstado]);

  const actualizarEstimacion = (nuevoOrigen, nuevoDestino) => {
    if (!nuevoOrigen || !nuevoDestino) {
      setForm((f) => ({ ...f, distanciaKm: "", duracionHoras: "" }));
      return;
    }
    const { distanciaKm, duracionHoras } = estimateRoute(
      nuevoOrigen,
      nuevoDestino
    );
    setForm((f) => ({
      ...f,
      distanciaKm,
      duracionHoras,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.conductorId || !form.origen || !form.destino) return;

    const { camiones } = calcularCamionesNecesarios(
      form.tipoCamion,
      form.pesoKg,
      form.volumenM3
    );

    onAdd({
      ...form,
      camionesNecesarios: camiones,
    });

    setForm({
      conductorId: "",
      tipoCamion: "GC",
      origen: origenes[1]?.nombre || "Santiago",
      destino: "",
      fecha: new Date().toISOString().split('T')[0],
      fechaRetorno: "",
      descripcion: "",
      distanciaKm: "",
      duracionHoras: "",
      pesoKg: "",
      volumenM3: "",
    });
  };

  const getConductorName = (id) =>
    conductores.find((c) => c.id === Number(id))?.nombre ?? "N/D";

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">🚚</span> Gestión de Viajes
          </h1>
          <p className="page-subtitle">
            Registra nuevos viajes, valida capacidad de camión y controla su
            avance.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <span>Registrar nuevo viaje</span>
            <span className="tag tag-info">Capacidad y ruta estimada</span>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Conductor</div>
              <select
                className="select"
                value={form.conductorId}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = conductoresDisponibles.find(
                    (x) => x.id === Number(id)
                  );
                  setForm((f) => ({
                    ...f,
                    conductorId: id,
                    tipoCamion: c?.tipo || f.tipoCamion,
                  }));
                }}
              >
                <option value="">Seleccione conductor</option>
                {conductoresDisponibles.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} · {c.nombre} ({c.origen} · {c.tipo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="label">Tipo de camión</div>
              <select
                className="select"
                value={form.tipoCamion}
                onChange={(e) =>
                  setForm((f) => ({ ...f, tipoCamion: e.target.value }))
                }
              >
                <option value="GC">GC · Gran Capacidad</option>
                <option value="MC">MC · Mediana Capacidad</option>
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Origen</div>
              <select
                className="select"
                value={form.origen}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, origen: value }));
                  actualizarEstimacion(value, form.destino);
                }}
              >
                {origenes.map((o) => (
                  <option key={o.id} value={o.nombre}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="label">Destino (Región)</div>
              <select
                className="select"
                value={form.destino}
                onChange={(e) => {
                  const value = e.target.value;
                  setForm((f) => ({ ...f, destino: value }));
                  actualizarEstimacion(form.origen, value);
                }}
              >
                <option value="">Seleccione región...</option>
                {regiones.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Fecha de salida *</div>
              <input
                type="date"
                className="input"
                value={form.fecha}
                onChange={(e) => setForm((f) => ({ ...f, fecha: e.target.value }))}
                required
              />
            </div>
            <div>
              <div className="label">Fecha de retorno *</div>
              <input
                type="date"
                className="input"
                value={form.fechaRetorno}
                onChange={(e) => setForm((f) => ({ ...f, fechaRetorno: e.target.value }))}
                min={form.fecha}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div className="label">Descripción (opcional)</div>
            <input
              className="input"
              type="text"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Descripción del viaje..."
            />
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Peso total (kg)</div>
              <input
                className="input"
                type="number"
                min="0"
                value={form.pesoKg}
                onChange={(e) =>
                  setForm((f) => ({ ...f, pesoKg: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="label">Volumen total (m³)</div>
              <input
                className="input"
                type="number"
                min="0"
                value={form.volumenM3}
                onChange={(e) =>
                  setForm((f) => ({ ...f, volumenM3: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Distancia estimada (km)</div>
              <input
                className="input"
                type="number"
                min="0"
                value={form.distanciaKm}
                readOnly
              />
              <div className="helper-text">
                Calculado automáticamente según origen y región.
              </div>
            </div>

            <div>
              <div className="label">Duración estimada (horas)</div>
              <input
                className="input"
                type="number"
                min="0"
                step="0.1"
                value={form.duracionHoras}
                readOnly
              />
            </div>
          </div>

          {form.pesoKg || form.volumenM3 ? (
            <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 10 }}>
              {
                calcularCamionesNecesarios(
                  form.tipoCamion,
                  form.pesoKg,
                  form.volumenM3
                ).camiones
              }{" "}
              camión(es) necesarios según capacidad seleccionada.
            </div>
          ) : null}

          <button className="btn btn-primary" type="submit">
            ➕ Registrar viaje
          </button>
        </form>

        <div className="card">
          <div className="card-header">
            <span>Filtro por estado</span>
          </div>
          <div>
            <div className="label">Estado</div>
            <select
              className="select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {ESTADOS.map((e) => (
                <option key={e} value={e}>
                  {e === "todos" ? "Todos los estados" : e}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="list">
        {filtrados.map((v) => {
          const metrics = getTripMetrics(v);
          const progresoPct = metrics ? Math.round(metrics.progreso * 100) : 0;

          return (
            <div key={v.id} className="list-item">
              <div>
                <div style={{ fontWeight: 600 }}>
                  #{v.id} · {v.origen} → {v.destino}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Conductor: {getConductorName(v.conductorId)} · Fecha:{" "}
                  {v.fecha}
                </div>
                <div style={{ fontSize: 12, color: "#9ca3af" }}>
                  Tipo camión: {v.tipoCamion || "N/D"} · Carga:{" "}
                  {v.pesoKg || 0} kg · {v.volumenM3 || 0} m³ · Camiones:{" "}
                  {v.camionesNecesarios || 1}
                </div>

                {metrics && (
                  <div style={{ marginTop: 6 }}>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 999,
                        background: "#1f2937",
                        overflow: "hidden",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          width: `${progresoPct}%`,
                          height: "100%",
                          background:
                            "linear-gradient(90deg,#38bdf8,#a855f7,#f97316)",
                          transition: "width 0.5s linear",
                        }}
                      />
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>
                      Avance: {metrics.distanciaRecorrida} km recorridos ·{" "}
                      {metrics.distanciaRestante} km restantes ·{" "}
                      {metrics.horasTranscurridas} h /{" "}
                      {metrics.horasRestantes} h restantes
                    </div>
                  </div>
                )}
              </div>
              <div style={{ textAlign: "right", minWidth: 160 }}>
                <select
                  className="select"
                  value={v.estado}
                  onChange={(e) =>
                    onUpdate(v.id, { ...v, estado: e.target.value })
                  }
                >
                  <option value="pendiente">pendiente</option>
                  <option value="en-curso">en-curso</option>
                  <option value="completado">completado</option>
                </select>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>
                  {v.distanciaKm ?? 0} km · {v.duracionHoras ?? 0} h
                </div>
              </div>
            </div>
          );
        })}
        {filtrados.length === 0 && (
          <div className="placeholder-panel">
            No hay viajes que coincidan con el filtro seleccionado.
          </div>
        )}
      </div>
    </section>
  );
}
