// Clasificamos las regiones de Chile en zonas para aproximar distancias.
const ZONA_REGION = {
  "Región de Arica y Parinacota": "norte",
  "Región de Tarapacá": "norte",
  "Región de Antofagasta": "norte",
  "Región de Atacama": "norte",
  "Región de Coquimbo": "centro-norte",
  "Región de Valparaíso": "centro-norte",
  "Región Metropolitana de Santiago": "centro",
  "Región del Libertador General Bernardo O'Higgins": "centro",
  "Región del Maule": "centro-sur",
  "Región de Ñuble": "centro-sur",
  "Región del Biobío": "centro-sur",
  "Región de La Araucanía": "sur",
  "Región de Los Ríos": "sur",
  "Región de Los Lagos": "sur",
  "Región de Aysén del General Carlos Ibáñez del Campo": "austral",
  "Región de Magallanes y de la Antártica Chilena": "austral",
};

// Distancias aproximadas (km) según origen y zona destino.
// No son exactas, pero son coherentes para la simulación.
const BASE_DIST = {
  Santiago: {
    norte: 1700,
    "centro-norte": 460,
    centro: 50,
    "centro-sur": 350,
    sur: 950,
    austral: 2200,
  },
  Coquimbo: {
    norte: 1400,
    "centro-norte": 200,
    centro: 460,
    "centro-sur": 650,
    sur: 1200,
    austral: 2400,
  },
  Osorno: {
    norte: 2200,
    "centro-norte": 1400,
    centro: 950,
    "centro-sur": 650,
    sur: 200,
    austral: 1400,
  },
};

export function estimateRoute(origen, destinoRegion) {
  if (!origen || !destinoRegion) {
    return { distanciaKm: 0, duracionHoras: 0 };
  }

  const zona = ZONA_REGION[destinoRegion] || "centro";
  const origenKey = origen in BASE_DIST ? origen : "Santiago";
  const base = BASE_DIST[origenKey][zona] ?? 500;

  const distanciaKm = base;
  const duracionHoras = +(base / 80).toFixed(1); // 80 km/h promedio

  return { distanciaKm, duracionHoras };
}
