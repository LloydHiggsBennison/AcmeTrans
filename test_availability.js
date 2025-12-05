
import { ConductorService } from './src/services/conductorService.js';
import { ESTADOS } from './src/config/constants.js';

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

const eventosCalendario = []; // Empty for this test

function testScenario(name, fechaInicio, fechaFin) {
    console.log(`\n--- Escenario: ${name} (${fechaInicio} al ${fechaFin}) ---`);

    const disponibles = conductores.filter(c =>
        ConductorService.isAvailableForRange(c, fechaInicio, fechaFin, viajes, eventosCalendario)
    );

    console.log("Conductores disponibles:");
    if (disponibles.length === 0) {
        console.log("  (Ninguno)");
    } else {
        disponibles.forEach(c => console.log(`  - ${c.nombre}`));
    }
}

console.log("=== SIMULACIÓN DE DISPONIBILIDAD ===");
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
