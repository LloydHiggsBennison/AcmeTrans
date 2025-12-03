/**
 * Calculadora de capacidad de camiones
 * @module utils/capacity
 */

import { TRUCK_TYPES, LIMITS } from '../config/constants.js';
import { sanitizeNumber } from './security.js';
import { logger } from './errorHandler.js';

// Re-exportar capacidades desde constants
export const CAPACIDAD_CAMION = {
  GC: {
    pesoKg: TRUCK_TYPES.GC.capacidadKg,
    volumenM3: TRUCK_TYPES.GC.capacidadM3,
  },
  MC: {
    pesoKg: TRUCK_TYPES.MC.capacidadKg,
    volumenM3: TRUCK_TYPES.MC.capacidadM3,
  },
};

/**
 * Calcula cuántos camiones se requieren según el tipo, peso y volumen.
 * @param {string} tipoCamion - Tipo de camión (GC o MC)
 * @param {number} pesoKg - Peso de la carga en kg
 * @param {number} volumenM3 - Volumen de la carga en m³
 * @returns {Object} { camiones: número, valido: boolean, detalles: Object }
 */
export function calcularCamionesNecesarios(tipoCamion, pesoKg, volumenM3) {
  // Validar tipo de camión
  const tipo = String(tipoCamion || 'GC').toUpperCase();
  const cap = CAPACIDAD_CAMION[tipo];

  if (!cap) {
    logger.warn('calcularCamionesNecesarios: Invalid truck type', { tipoCamion });
    return {
      camiones: 1,
      valido: false,
      error: 'Tipo de camión inválido'
    };
  }

  // Sanitizar y validar inputs numéricos
  const peso = sanitizeNumber(pesoKg, LIMITS.PESO_MIN, LIMITS.PESO_MAX) || 0;
  const volumen = sanitizeNumber(volumenM3, LIMITS.VOLUMEN_MIN, LIMITS.VOLUMEN_MAX) || 0;

  // Validar que al menos uno de los valores sea mayor a 0
  if (peso === 0 && volumen === 0) {
    logger.warn('calcularCamionesNecesarios: Both peso and volumen are 0');
    return {
      camiones: 1,
      valido: true,
      detalles: {
        porPeso: 1,
        porVolumen: 1,
        factorLimitante: 'ninguno'
      }
    };
  }

  // Calcular camiones necesarios por peso y volumen
  // Prevención de división por cero
  const porPeso = peso > 0 && cap.pesoKg > 0
    ? Math.ceil(peso / cap.pesoKg)
    : 1;

  const porVolumen = volumen > 0 && cap.volumenM3 > 0
    ? Math.ceil(volumen / cap.volumenM3)
    : 1;

  // El número de camiones es el máximo entre ambos
  const camiones = Math.max(porPeso, porVolumen, 1);

  // Limitar al máximo permitido
  const camionesLimitados = Math.min(camiones, LIMITS.CAMIONES_MAX);

  if (camionesLimitados !== camiones) {
    logger.warn('calcularCamionesNecesarios: Exceeded max trucks', {
      calculado: camiones,
      limitado: camionesLimitados
    });
  }

  const valido = camionesLimitados >= LIMITS.CAMIONES_MIN &&
    camionesLimitados <= LIMITS.CAMIONES_MAX;

  return {
    camiones: camionesLimitados,
    valido,
    detalles: {
      porPeso,
      porVolumen,
      factorLimitante: porPeso > porVolumen ? 'peso' : 'volumen',
      capacidadPeso: cap.pesoKg,
      capacidadVolumen: cap.volumenM3,
      utilizacionPeso: peso > 0 ? Math.round((peso / (camionesLimitados * cap.pesoKg)) * 100) : 0,
      utilizacionVolumen: volumen > 0 ? Math.round((volumen / (camionesLimitados * cap.volumenM3)) * 100) : 0,
    }
  };
}

/**
 * Valida si una carga cabe en un tipo de camión específico
 * @param {string} tipoCamion - Tipo de camión
 * @param {number} pesoKg - Peso de la carga
 * @param {number} volumenM3 - Volumen de la carga
 * @returns {Object} { cabe: boolean, excedePeso: boolean, excedeVolumen: boolean }
 */
export function validarCarga(tipoCamion, pesoKg, volumenM3) {
  const tipo = String(tipoCamion || 'GC').toUpperCase();
  const cap = CAPACIDAD_CAMION[tipo];

  if (!cap) {
    return { cabe: false, excedePeso: false, excedeVolumen: false, error: 'Tipo inválido' };
  }

  const peso = sanitizeNumber(pesoKg, 0) || 0;
  const volumen = sanitizeNumber(volumenM3, 0) || 0;

  const excedePeso = peso > cap.pesoKg;
  const excedeVolumen = volumen > cap.volumenM3;
  const cabe = !excedePeso && !excedeVolumen;

  return { cabe, excedePeso, excedeVolumen };
}

