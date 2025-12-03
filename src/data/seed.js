// ===============================
// ORÍGENES Y CAPACIDAD POR BASE
// ===============================
export const ORIGENES = [
  { id: "osorno", nombre: "Osorno", gc: 3, mc: 6 },
  { id: "santiago", nombre: "Santiago", gc: 5, mc: 8 },
  { id: "coquimbo", nombre: "Coquimbo", gc: 3, mc: 4 },
];

// ===============================
// REGIONES DE CHILE
// ===============================
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

// ========================================================
// CAMIONES Y CHÓFERES (se generan juntos pero son separables)
// ========================================================
let autoId = 1;

export const seedCamiones = ORIGENES.flatMap((origen) => {
  const camiones = [];

  for (let i = 1; i <= origen.gc; i++) {
    camiones.push({
      id: `GC-${origen.id}-${i}`,
      origen: origen.nombre,
      tipo: "GC",
      nombre: `Camión GC ${origen.nombre} ${i}`,
      capacidadKg: 28000,
      capacidadM3: 60,
      estado: "disponible",
    });
  }

  for (let i = 1; i <= origen.mc; i++) {
    camiones.push({
      id: `MC-${origen.id}-${i}`,
      origen: origen.nombre,
      tipo: "MC",
      nombre: `Camión MC ${origen.nombre} ${i}`,
      capacidadKg: 14000,
      capacidadM3: 35,
      estado: "disponible",
    });
  }

  return camiones;
});

// ========================================================
// CONDUCTORES (sin camión fijo, asignación es dinámica)
// ========================================================
export const seedConductores = ORIGENES.flatMap((origen) => {
  const lista = [];

  for (let i = 1; i <= origen.gc + origen.mc; i++) {
    lista.push({
      id: autoId++,
      nombre: `Conductor ${origen.nombre} ${i}`,
      licencia: i <= origen.gc ? "A5" : "A4",
      telefono: `+56 9 8${i}00${String(i).padStart(2, "0")}`,
      estado: "disponible",
      origen: origen.nombre,
      bloqueos: [],
    });
  }

  return lista;
});

// ========================================================
// VIAJES DE EJEMPLO
// ========================================================
const hoyStr = new Date().toISOString().split("T")[0];

export const seedViajes = [
  {
    id: 1,
    conductorId: 1,
    camionId: "GC-osorno-1",
    origen: "Osorno",
    destino: "Región Metropolitana de Santiago",
    fecha: hoyStr,
    estado: "en-curso",
    distanciaKm: 920,
    duracionHoras: 12,
    inicio: new Date().toISOString(),

    // datos logísticos
    pesoKg: 18000,
    volumenM3: 40,
    camionesNecesarios: 1,
  },
  {
    id: 2,
    conductorId: 5,
    camionId: "MC-santiago-2",
    origen: "Santiago",
    destino: "Región de Coquimbo",
    fecha: hoyStr,
    estado: "pendiente",
    distanciaKm: 470,
    duracionHoras: 6,
    inicio: new Date().toISOString(),

    pesoKg: 8000,
    volumenM3: 20,
    camionesNecesarios: 1,
  },
];

// ========================================================
// SOLICITUDES (BANDEJA LATERAL)
// ========================================================
export const SOLICITUDES = [
  {
    id: 1,
    titulo: "Traslado urgente retail",
    fecha: "2025-11-21",
    fechaRetorno: "2025-11-25",
    estado: "nuevo",
    origen: "Santiago",
    destino: "Región de Valparaíso",
    pesoKg: 12000,
    volumenM3: 25,
  },
  {
    id: 2,
    titulo: "Carga refrigerada alimentos",
    fecha: "2025-11-22",
    fechaRetorno: "2025-11-28",
    estado: "nuevo",
    origen: "Osorno",
    destino: "Región de Atacama",
    pesoKg: 26000,
    volumenM3: 50,
  },
  {
    id: 3,
    titulo: "Despacho cadena logística",
    fecha: "2025-11-22",
    fechaRetorno: "2025-11-24",
    estado: "en-curso",
    origen: "Coquimbo",
    destino: "Región de Coquimbo",
    pesoKg: 8000,
    volumenM3: 18,
  },
  {
    id: 4,
    titulo: "Traslado interregional minería",
    fecha: "2025-11-23",
    fechaRetorno: "2025-11-30",
    estado: "completado",
    origen: "Santiago",
    destino: "Región de Antofagasta",
    pesoKg: 30000,
    volumenM3: 55,
  },
  {
    id: 5,
    titulo: "Solicitud interna centros de distribución",
    fecha: "2025-11-24",
    fechaRetorno: "2025-11-27",
    estado: "en-curso",
    origen: "Osorno",
    destino: "Región de Los Lagos",
    pesoKg: 6000,
    volumenM3: 12,
  },
];
