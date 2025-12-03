/**
 * Estimador de rutas y distancias
 * Clasificación de regiones y cálculo de distancias aproximadas
 * @module utils/routeEstimator
 */

import { sanitizeString, sanitizeNumber } from './security.js';
import { LIMITS } from '../config/constants.js';
import { logger } from './errorHandler.js';

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

/**
 * Estima la ruta entre origen y destino
 * @param {string} origen - Ciudad de origen
 * @param {string} destinoRegion - Región de destino
 * @returns {Object} { distanciaKm, duracionHoras }
 */
export function estimateRoute(origen, destinoRegion) {
  // Validar y sanitizar inputs
  if (!origen || !destinoRegion) {
    logger.warn('estimateRoute: Missing origen or destino');
    return { distanciaKm: 0, duracionHoras: 0 };
  }

  const origenClean = sanitizeString(origen);
  const destinoClean = sanitizeString(destinoRegion);

  // Obtener zona del destino
  const zona = ZONA_REGION[destinoClean] || "centro";

  // Determinar origen válido
  const origenKey = origenClean in BASE_DIST ? origenClean : "Santiago";

  // Obtener distancia base
  const base = BASE_DIST[origenKey][zona] ?? 500;

  // Calcular distancia y duración
  const distanciaKm = Math.min(base, LIMITS.DISTANCIA_MAX);
  const duracionHoras = Math.min(
    +(distanciaKm / 80).toFixed(1), // 80 km/h promedio
    LIMITS.DURACION_MAX
  );

  logger.debug('Route estimated', {
    origen: origenKey,
    destino: destinoClean,
    distanciaKm,
    duracionHoras
  });

  return { distanciaKm, duracionHoras };
}

/**
 * Verifica si una región es válida
 * @param {string} region - Región a verificar
 * @returns {boolean} true si es válida
 */
export function isValidRegion(region) {
  if (!region || typeof region !== 'string') return false;
  return region in ZONA_REGION;
}

/**
 * Obtiene todas las regiones disponibles
 * @returns {string[]} Lista de regiones
 */
export function getAvailableRegions() {
  return Object.keys(ZONA_REGION);
}

/**
 * Obtiene todos los orígenes disponibles
 * @returns {string[]} Lista de orígenes
 */
export function getAvailableOrigins() {
  return Object.keys(BASE_DIST);
}

