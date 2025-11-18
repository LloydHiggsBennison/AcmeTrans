// Definición de orígenes y capacidad de camiones
const origenesDef = [
  { id: "osorno", nombre: "Osorno", gc: 3, mc: 6 },
  { id: "santiago", nombre: "Santiago", gc: 5, mc: 8 },
  { id: "coquimbo", nombre: "Coquimbo", gc: 3, mc: 4 },
];

export const ORIGENES = origenesDef;

// Regiones oficiales de Chile (puedes ajustar nombres si tu profe usa otra nomenclatura)
export const REGIONES_CHILE = [
  "Región de Arica y Parinacota",
  "Región de Tarapacá",
  "Región de Antofagasta",
  "Región de Atacama",
  "Región de Coquimbo",
  "Región de Valparaíso",
  "Región Metropolitana de Santiago",
  "Región del Libertador General Bernardo O'Higgins",
  "Región del Maule",
  "Región de Ñuble",
  "Región del Biobío",
  "Región de La Araucanía",
  "Región de Los Ríos",
  "Región de Los Lagos",
  "Región de Aysén del General Carlos Ibáñez del Campo",
  "Región de Magallanes y de la Antártica Chilena",
];

// Generamos conductores para TODOS los camiones (GC + MC)
let idCounter = 1;
export const seedConductores = [];

origenesDef.forEach((o) => {
  // GC
  for (let i = 1; i <= o.gc; i++) {
    seedConductores.push({
      id: idCounter++,
      nombre: `Conductor ${o.nombre} GC ${i}`,
      licencia: `LC-${o.id.toUpperCase()}-GC-${i.toString().padStart(2, "0")}`,
      telefono: "+56 9 0000 0000",
      estado: "disponible",
      vehiculo: "Camión de Gran Capacidad",
      tipo: "GC",
      origen: o.nombre,
    });
  }
  // MC
  for (let i = 1; i <= o.mc; i++) {
    seedConductores.push({
      id: idCounter++,
      nombre: `Conductor ${o.nombre} MC ${i}`,
      licencia: `LC-${o.id.toUpperCase()}-MC-${i.toString().padStart(2, "0")}`,
      telefono: "+56 9 1111 1111",
      estado: "disponible",
      vehiculo: "Camión de Mediana Capacidad",
      tipo: "MC",
      origen: o.nombre,
    });
  }
});

// Un viaje de ejemplo
export const seedViajes = [
  {
    id: 1,
    conductorId: 1,
    origen: "Osorno",
    destino: "Región Metropolitana de Santiago",
    fecha: new Date().toISOString().split("T")[0],
    estado: "en-curso",
    distanciaKm: 920,
    duracionHoras: 12,
    inicio: new Date().toISOString(),
  },
];

export const SOLICITUDES = [
  { id: 1, titulo: "Traslado urgente", fecha: "2025-11-21", estado: "nuevo",  destino: "Región de Valparaíso" },
  { id: 2, titulo: "Carga refrigerada", fecha: "2025-11-22", estado: "nuevo",  destino: "Región de Atacama" },
  { id: 3, titulo: "Despacho cadena logística", fecha: "2025-11-22", estado: "en-curso",  destino: "Región de Coquimbo" },
  { id: 4, titulo: "Traslado interregional", fecha: "2025-11-23", estado: "completado", destino: "Región de Los Ríos" },
  { id: 5, titulo: "Solicitud interna", fecha: "2025-11-24", estado: "en-curso",  destino: "Región de Los Lagos" },
];
