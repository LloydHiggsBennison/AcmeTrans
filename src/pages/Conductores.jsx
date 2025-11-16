import { useMemo, useState } from "react";
import { AsignarViajeModal } from "../components/AsignarViajeModal";
import { ORIGENES } from "../data/seed";

const ESTADOS = ["todos", "disponible", "ocupado", "inactivo"];

export function Conductores({ conductores, onAdd, onUpdate, onAssignTrip }) {
  const [form, setForm] = useState({
    nombre: "",
    licencia: "",
    telefono: "",
    vehiculo: "Camión de Mediana Capacidad",
    tipo: "MC",
    origen: "Santiago",
  });
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modalConductor, setModalConductor] = useState(null);

  const filtrados = useMemo(() => {
    if (filtroEstado === "todos") return conductores;
    return conductores.filter((c) => c.estado === filtroEstado);
  }, [conductores, filtroEstado]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.licencia) return;
    onAdd(form);
    setForm({
      nombre: "",
      licencia: "",
      telefono: "",
      vehiculo: "Camión de Mediana Capacidad",
      tipo: "MC",
      origen: "Santiago",
    });
  };

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <span className="icon">🧑‍✈️</span> Gestión de Conductores
          </h1>
          <p className="page-subtitle">
            Registra nuevos conductores, filtra por estado y asigna viajes.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 18 }}>
        <form className="card" onSubmit={handleSubmit}>
          <div className="card-header">
            <span>Agregar nuevo conductor</span>
            <span className="tag tag-success">Alta rápida</span>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Nombre</div>
              <input
                className="input"
                value={form.nombre}
                onChange={(e) =>
                  setForm((f) => ({ ...f, nombre: e.target.value }))
                }
                placeholder="Nombre completo"
              />
            </div>
            <div>
              <div className="label">Licencia</div>
              <input
                className="input"
                value={form.licencia}
                onChange={(e) =>
                  setForm((f) => ({ ...f, licencia: e.target.value }))
                }
                placeholder="Código de licencia"
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Teléfono</div>
              <input
                className="input"
                value={form.telefono}
                onChange={(e) =>
                  setForm((f) => ({ ...f, telefono: e.target.value }))
                }
                placeholder="+56 9 ..."
              />
            </div>
            <div>
              <div className="label">Origen (Base)</div>
              <select
                className="select"
                value={form.origen}
                onChange={(e) =>
                  setForm((f) => ({ ...f, origen: e.target.value }))
                }
              >
                {ORIGENES.map((o) => (
                  <option key={o.id} value={o.nombre}>
                    {o.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 10 }}>
            <div>
              <div className="label">Tipo de camión</div>
              <select
                className="select"
                value={form.tipo}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    tipo: e.target.value,
                    vehiculo:
                      e.target.value === "GC"
                        ? "Camión de Gran Capacidad"
                        : "Camión de Mediana Capacidad",
                  }))
                }
              >
                <option value="GC">GC · Gran Capacidad</option>
                <option value="MC">MC · Mediana Capacidad</option>
              </select>
            </div>
            <div>
              <div className="label">Descripción vehículo</div>
              <input
                className="input"
                value={form.vehiculo}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehiculo: e.target.value }))
                }
              />
            </div>
          </div>

          <button className="btn btn-primary" type="submit">
            ➕ Registrar conductor
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

      <div className="grid-2">
        {filtrados.map((c) => (
          <div key={c.id} className="card">
            <div className="card-header">
              <span>
                #{c.id} · {c.nombre}
              </span>
              <span
                className={
                  c.estado === "disponible"
                    ? "tag tag-success"
                    : c.estado === "ocupado"
                    ? "tag tag-warning"
                    : "tag tag-muted"
                }
              >
                {c.estado}
              </span>
            </div>
            <div style={{ fontSize: 13 }}>
              <div>Licencia: {c.licencia}</div>
              <div>Teléfono: {c.telefono}</div>
              <div>Base: {c.origen}</div>
              <div>
                Vehículo: {c.vehiculo} (
                {c.tipo === "GC" ? "GC" : "MC"})
              </div>
            </div>
            <div
              style={{
                marginTop: 10,
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <button
                className="btn btn-soft"
                type="button"
                onClick={() => setModalConductor(c)}
              >
                🚚 Asignar viaje
              </button>
              <select
                className="select"
                style={{ maxWidth: 150 }}
                value={c.estado}
                onChange={(e) =>
                  onUpdate(c.id, { ...c, estado: e.target.value })
                }
              >
                <option value="disponible">disponible</option>
                <option value="ocupado">ocupado</option>
                <option value="inactivo">inactivo</option>
              </select>
            </div>
          </div>
        ))}
        {filtrados.length === 0 && (
          <div className="placeholder-panel">
            No hay conductores que coincidan con el filtro seleccionado.
          </div>
        )}
      </div>

      {modalConductor && (
        <AsignarViajeModal
          conductor={modalConductor}
          onClose={() => setModalConductor(null)}
          onSave={(dataViaje) => {
            onAssignTrip(modalConductor.id, dataViaje);
            setModalConductor(null);
          }}
        />
      )}
    </section>
  );
}
