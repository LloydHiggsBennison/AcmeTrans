
// Mock Constants
const ESTADOS = {
    CONDUCTOR: {
        DISPONIBLE: 'disponible',
        OCUPADO: 'ocupado',
        INACTIVO: 'inactivo',
    },
    VIAJE: {
        PENDIENTE: 'pendiente',
        EN_CURSO: 'en-curso',
        COMPLETADO: 'completado',
        CANCELADO: 'cancelado',
    }
};

// Logic to test (Copied from ConductorService)
function isAvailableForRange(conductor, fechaInicio, fechaFin, viajes = [], eventosCalendario = []) {
    if (conductor.estado === ESTADOS.CONDUCTOR.INACTIVO) {
        return false;
    }

    if (!fechaInicio) return true;
    const start = new Date(fechaInicio);
    const end = fechaFin ? new Date(fechaFin) : start;

    // Helper para verificar superposición de rangos
    const isOverlapping = (s1, e1, s2, e2) => {
        const start1 = new Date(s1);
        const end1 = e1 ? new Date(e1) : start1;
        const start2 = new Date(s2);
        const end2 = e2 ? new Date(e2) : start2;
        return start1 <= end2 && start2 <= end1;
    };

    // Verificar conflictos con viajes
    const tieneViaje = viajes.some(v =>
        v.conductorId === conductor.id &&
        v.estado !== ESTADOS.VIAJE.CANCELADO &&
        v.estado !== ESTADOS.VIAJE.COMPLETADO &&
        isOverlapping(fechaInicio, fechaFin, v.fecha, v.fechaRetorno)
    );

    if (tieneViaje) return false;

    // Verificar conflictos con eventos de calendario
    const tieneEvento = eventosCalendario.some(e =>
        e.conductorId === conductor.id &&
        isOverlapping(fechaInicio, fechaFin, e.fecha, e.fechaRetorno)
    );

    if (tieneEvento) return false;

    // Verificar bloqueos manuales (legacy)
    if (conductor.bloqueos?.some(b => isOverlapping(fechaInicio, fechaFin, b.fecha, b.fecha))) {
        return false;
    }

    return true;
}

// Mock Data
const conductores = [
    { id: 1, nombre: "Juan (Ocupado con viaje)", estado: "ocupado", origen: "Santiago" },
    { id: 2, nombre: "Pedro (Disponible)", estado: "disponible", origen: "Santiago" },
    { id: 3, nombre: "Diego (Inactivo)", estado: "inactivo", origen: "Santiago" }
];

const viajes = [
    {
        id: 100,
        conductorId: 1,
        fecha: "2025-11-20",
        fechaRetorno: "2025-11-25",
        estado: "en-curso"
    }
];

const eventosCalendario = [];

function testScenario(name, fechaInicio, fechaFin) {
    console.log(`\n--- Escenario: ${name} (${fechaInicio} al ${fechaFin}) ---`);

    const disponibles = conductores.filter(c =>
        isAvailableForRange(c, fechaInicio, fechaFin, viajes, eventosCalendario)
    );

    console.log("Conductores disponibles:");
    if (disponibles.length === 0) {
        console.log("  (Ninguno)");
    } else {
        disponibles.forEach(c => console.log(`  - ${c.nombre}`));
    }
}

console.log("=== SIMULACIÓN DE DISPONIBILIDAD (Lógica Nueva) ===");
console.log("Datos:");
console.log("- Juan tiene viaje del 2025-11-20 al 2025-11-25");
console.log("- Pedro está libre");
console.log("- Diego está inactivo");

// Case 1: Overlap
testScenario("Conflicto con viaje de Juan", "2025-11-22", "2025-11-24");

// Case 2: No Overlap (After)
testScenario("Fechas libres (después del viaje)", "2025-11-26", "2025-11-30");

// Case 3: No Overlap (Before)
testScenario("Fechas libres (antes del viaje)", "2025-11-10", "2025-11-15");
