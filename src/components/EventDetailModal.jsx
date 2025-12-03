// src/components/EventDetailModal.jsx

import { useState } from "react";

export function EventDetailModal({
    evento,
    conductores = [],
    onClose,
    onDelete,
    onEdit,
    onDeleteViaje,
    onEditViaje,
    onLiberarViaje,
}) {
    if (!evento) return null;

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        fecha: evento.fecha || "",
        fechaRetorno: evento.fechaRetorno || "",
        origen: evento.origen || "",
        destino: evento.destino || "",
        tipoCamion: evento.tipoCamion || "GC",
        conductorId: evento.conductorId || "",
        descripcion: evento.descripcion || "",
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.fecha || !formData.fechaRetorno) {
            alert("Las fechas de salida y retorno son obligatorias");
            return;
        }

        if (formData.fechaRetorno < formData.fecha) {
            alert("La fecha de retorno debe ser posterior a la fecha de salida");
            return;
        }

        // Llamar al handler correcto según el tipo
        if (evento.tipo === "viaje") {
            onEditViaje?.(evento.id, formData);
        } else {
            onEdit?.(evento.id, formData);
        }
        setIsEditing(false);
        onClose?.();
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleDeleteClick = () => {
        console.log('DELETE BUTTON CLICKED - showing confirmation');
        setShowDeleteConfirm(true);
    };

    const handleConfirmDelete = () => {
        console.log('Delete confirmed, calling delete handler with:', evento.id);
        // Llamar al handler correcto según el tipo
        if (evento.tipo === "viaje") {
            onDeleteViaje?.(evento.id);
        } else {
            onDelete?.(evento.id);
        }
        if (onClose) {
            onClose();
        }
    };

    const handleCancelDelete = () => {
        console.log('Delete cancelled');
        setShowDeleteConfirm(false);
    };

    const conductorNombre = evento.conductorId
        ? (conductores || []).find(c => c.id === evento.conductorId)?.nombre || `ID: ${evento.conductorId}`
        : "Sin asignar";

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>📅 Detalle del Evento</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            fontSize: "20px",
                            cursor: "pointer",
                            padding: "4px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "32px",
                            height: "32px",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = "#334155";
                            e.target.style.color = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = "transparent";
                            e.target.style.color = "#64748b";
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    {!isEditing ? (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div className="card-header">Información del evento</div>
                            <div style={{ fontSize: 13, marginTop: 10 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Descripción:</strong> {evento.descripcion || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Origen:</strong> {evento.origen || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Destino:</strong> {evento.destino || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Fecha de salida:</strong> {evento.fecha || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Fecha de retorno:</strong> {evento.fechaRetorno || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Tipo de camión:</strong> {evento.tipoCamion || "N/D"}
                                </div>
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Conductor:</strong> {conductorNombre}
                                </div>
                                {evento.solicitudId && (
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Solicitud ID:</strong> #{evento.solicitudId}
                                    </div>
                                )}
                                {evento.cotizacionId && (
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Cotización ID:</strong> #{evento.cotizacionId}
                                    </div>
                                )}
                                <div style={{ marginBottom: 8 }}>
                                    <strong>Estado:</strong>{" "}
                                    {evento.tipo === "viaje" ? (
                                        <span className="cotizacion-estado aprobada">
                                            En curso
                                        </span>
                                    ) : (
                                        <span className={`cotizacion-estado ${evento.estado}`}>
                                            {evento.estado === "pendiente" ? "Pendiente" : evento.estado}
                                        </span>
                                    )}
                                </div>
                                {evento.hora && evento.hora !== "—" && (
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Hora:</strong> {evento.hora}
                                    </div>
                                )}
                                {evento.hospedaje && (
                                    <div style={{ marginBottom: 8 }}>
                                        <strong>Hospedaje:</strong> Sí
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ marginBottom: 12 }}>
                            <div className="card-header">Editar evento</div>
                            <div style={{ marginTop: 10 }}>
                                <div className="grid-2" style={{ marginBottom: 12 }}>
                                    <div>
                                        <div className="label">Origen</div>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.origen}
                                            onChange={(e) => handleChange("origen", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <div className="label">Destino</div>
                                        <input
                                            type="text"
                                            className="input"
                                            value={formData.destino}
                                            onChange={(e) => handleChange("destino", e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid-2" style={{ marginBottom: 12 }}>
                                    <div>
                                        <div className="label">Fecha de salida *</div>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formData.fecha}
                                            onChange={(e) => handleChange("fecha", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <div className="label">Fecha de retorno *</div>
                                        <input
                                            type="date"
                                            className="input"
                                            value={formData.fechaRetorno}
                                            onChange={(e) => handleChange("fechaRetorno", e.target.value)}
                                            min={formData.fecha}
                                        />
                                    </div>
                                </div>

                                <div className="grid-2" style={{ marginBottom: 12 }}>
                                    <div>
                                        <div className="label">Tipo de camión</div>
                                        <select
                                            className="select"
                                            value={formData.tipoCamion}
                                            onChange={(e) => handleChange("tipoCamion", e.target.value)}
                                        >
                                            <option value="GC">GC · Gran Capacidad</option>
                                            <option value="MC">MC · Mediana Capacidad</option>
                                        </select>
                                    </div>
                                    <div>
                                        <div className="label">Conductor</div>
                                        <select
                                            className="select"
                                            value={formData.conductorId}
                                            onChange={(e) => handleChange("conductorId", e.target.value)}
                                        >
                                            <option value="">Sin asignar</option>
                                            {(conductores || [])
                                                .filter(c => c.estado !== "inactivo")
                                                .sort((a, b) => {
                                                    const orden = { "Coquimbo": 1, "Santiago": 2, "Osorno": 3 };
                                                    const ordenA = orden[a.origen] || 999;
                                                    const ordenB = orden[b.origen] || 999;
                                                    return ordenA - ordenB;
                                                })
                                                .map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        #{c.id} · {c.nombre}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginBottom: 12 }}>
                                    <div className="label">Descripción</div>
                                    <input
                                        type="text"
                                        className="input"
                                        value={formData.descripcion}
                                        onChange={(e) => handleChange("descripcion", e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {showDeleteConfirm && (
                    <div style={{
                        backgroundColor: "#fee2e2",
                        border: "2px solid #ef4444",
                        borderRadius: "8px",
                        padding: "16px",
                        margin: "16px",
                        textAlign: "center"
                    }}>
                        <div style={{ marginBottom: "12px", fontWeight: "600", color: "#991b1b" }}>
                            ⚠️ ¿Estás seguro de eliminar este evento?
                        </div>
                        <div style={{ marginBottom: "16px", fontSize: "13px", color: "#666" }}>
                            Esto rechazará la cotización asociada y no se puede deshacer.
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                            <button
                                className="btn btn-secondary"
                                onClick={handleCancelDelete}
                            >
                                Cancelar
                            </button>
                            <button
                                className="btn"
                                onClick={handleConfirmDelete}
                                style={{
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none"
                                }}
                            >
                                Sí, eliminar
                            </button>
                        </div>
                    </div>
                )}

                <div className="modal-footer">
                    {!isEditing ? (
                        <>
                            <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>
                                ✏️ Editar
                            </button>
                            <button
                                className="btn"
                                onClick={handleDeleteClick}
                                style={{
                                    backgroundColor: "#ef4444",
                                    color: "white",
                                    border: "none"
                                }}
                            >
                                🗑️ Eliminar
                            </button>
                            {evento.tipo === "viaje" && evento.conductorId && onLiberarViaje && (
                                <button
                                    className="btn"
                                    onClick={() => {
                                        if (window.confirm(`¿Liberar al conductor ${conductorNombre} del viaje?`)) {
                                            onLiberarViaje(evento.id, evento.conductorId);
                                            onClose?.();
                                        }
                                    }}
                                    style={{
                                        backgroundColor: "#f59e0b",
                                        color: "white",
                                        border: "none"
                                    }}
                                >
                                    🔓 Liberar Conductor
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                                Cancelar
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                💾 Guardar cambios
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
