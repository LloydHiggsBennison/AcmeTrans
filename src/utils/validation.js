/**
 * Módulo de validación centralizado
 * Schemas de validación para todas las entidades
 * @module utils/validation
 */

import { LIMITS, REGEX, ERROR_MESSAGES, TRUCK_TYPES, ESTADOS } from '../config/constants.js';
import { sanitizeString, sanitizeNumber } from './security.js';

// ============================================
// VALIDADORES BASE
// ============================================

/**
 * Resultado de validación
 * @typedef {Object} ValidationResult
 * @property {boolean} valid - Si la validación pasó
 * @property {Object} errors - Errores por campo
 * @property {Object} sanitized - Datos sanitizados
 */

/**
 * Crea un resultado de validación exitoso
 * @param {Object} sanitized - Datos sanitizados
 * @returns {ValidationResult}
 */
function validResult(sanitized) {
    return { valid: true, errors: {}, sanitized };
}

/**
 * Crea un resultado de validación con errores
 * @param {Object} errors - Errores encontrados
 * @returns {ValidationResult}
 */
function invalidResult(errors) {
    return { valid: false, errors, sanitized: null };
}

// ============================================
// VALIDACIÓN DE CONDUCTORES
// ============================================

/**
 * Valida los datos de un conductor
 * @param {Object} conductor - Datos del conductor
 * @returns {ValidationResult}
 */
export function validateConductor(conductor) {
    const errors = {};
    const sanitized = {};

    // Nombre
    if (!conductor.nombre || typeof conductor.nombre !== 'string') {
        errors.nombre = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        const nombre = sanitizeString(conductor.nombre).trim();
        if (nombre.length < LIMITS.CONDUCTOR_NOMBRE_MIN || nombre.length > LIMITS.CONDUCTOR_NOMBRE_MAX) {
            errors.nombre = ERROR_MESSAGES.CONDUCTOR_NOMBRE_INVALID;
        } else if (!REGEX.SOLO_LETRAS.test(nombre)) {
            errors.nombre = 'El nombre solo puede contener letras';
        } else {
            sanitized.nombre = nombre;
        }
    }

    // Licencia
    if (!conductor.licencia) {
        errors.licencia = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        const licencia = sanitizeString(conductor.licencia).toUpperCase();
        if (!['A4', 'A5'].includes(licencia)) {
            errors.licencia = ERROR_MESSAGES.CONDUCTOR_LICENCIA_INVALID;
        } else {
            sanitized.licencia = licencia;
        }
    }

    // Teléfono
    if (!conductor.telefono) {
        errors.telefono = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        const telefono = sanitizeString(conductor.telefono).trim();
        if (!REGEX.TELEFONO_CHILE.test(telefono)) {
            errors.telefono = ERROR_MESSAGES.CONDUCTOR_TELEFONO_INVALID;
        } else {
            sanitized.telefono = telefono;
        }
    }

    // Origen
    if (!conductor.origen) {
        errors.origen = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.origen = sanitizeString(conductor.origen);
    }

    // Estado (opcional)
    if (conductor.estado) {
        const estado = conductor.estado.toLowerCase();
        if (Object.values(ESTADOS.CONDUCTOR).includes(estado)) {
            sanitized.estado = estado;
        } else {
            sanitized.estado = ESTADOS.CONDUCTOR.DISPONIBLE;
        }
    }

    // Bloqueos (opcional)
    sanitized.bloqueos = Array.isArray(conductor.bloqueos) ? conductor.bloqueos : [];

    // ID (si existe, preservar)
    if (conductor.id !== undefined) {
        sanitized.id = conductor.id;
    }

    return Object.keys(errors).length > 0 ? invalidResult(errors) : validResult(sanitized);
}

// ============================================
// VALIDACIÓN DE VIAJES
// ============================================

/**
 * Valida los datos de un viaje
 * @param {Object} viaje - Datos del viaje
 * @returns {ValidationResult}
 */
export function validateViaje(viaje) {
    const errors = {};
    const sanitized = {};

    // Conductor ID
    if (!viaje.conductorId && viaje.conductorId !== 0) {
        errors.conductorId = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        const conductorId = sanitizeNumber(viaje.conductorId, 0);
        if (conductorId === null) {
            errors.conductorId = 'ID de conductor inválido';
        } else {
            sanitized.conductorId = conductorId;
        }
    }

    // Origen
    if (!viaje.origen) {
        errors.origen = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.origen = sanitizeString(viaje.origen);
    }

    // Destino
    if (!viaje.destino) {
        errors.destino = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.destino = sanitizeString(viaje.destino);
    }

    // Distancia
    if (viaje.distanciaKm !== undefined) {
        const distancia = sanitizeNumber(viaje.distanciaKm, LIMITS.DISTANCIA_MIN, LIMITS.DISTANCIA_MAX);
        if (distancia === null) {
            errors.distanciaKm = ERROR_MESSAGES.DISTANCIA_INVALID;
        } else {
            sanitized.distanciaKm = Math.round(distancia * 10) / 10; // 1 decimal
        }
    } else {
        sanitized.distanciaKm = 0;
    }

    // Duración
    if (viaje.duracionHoras !== undefined) {
        const duracion = sanitizeNumber(viaje.duracionHoras, LIMITS.DURACION_MIN, LIMITS.DURACION_MAX);
        if (duracion === null) {
            errors.duracionHoras = ERROR_MESSAGES.DURACION_INVALID;
        } else {
            sanitized.duracionHoras = Math.round(duracion * 10) / 10; // 1 decimal
        }
    } else {
        sanitized.duracionHoras = 1;
    }

    // Peso
    if (viaje.pesoKg !== undefined) {
        const peso = sanitizeNumber(viaje.pesoKg, LIMITS.PESO_MIN, LIMITS.PESO_MAX);
        if (peso === null) {
            errors.pesoKg = ERROR_MESSAGES.PESO_INVALID;
        } else {
            sanitized.pesoKg = Math.round(peso);
        }
    } else {
        sanitized.pesoKg = 0;
    }

    // Volumen
    if (viaje.volumenM3 !== undefined) {
        const volumen = sanitizeNumber(viaje.volumenM3, LIMITS.VOLUMEN_MIN, LIMITS.VOLUMEN_MAX);
        if (volumen === null) {
            errors.volumenM3 = ERROR_MESSAGES.VOLUMEN_INVALID;
        } else {
            sanitized.volumenM3 = Math.round(volumen * 10) / 10; // 1 decimal
        }
    } else {
        sanitized.volumenM3 = 0;
    }

    // Tipo de camión
    if (viaje.tipoCamion) {
        const tipo = viaje.tipoCamion.toUpperCase();
        if (TRUCK_TYPES[tipo]) {
            sanitized.tipoCamion = tipo;
        } else {
            sanitized.tipoCamion = 'GC'; // Default
        }
    } else {
        sanitized.tipoCamion = 'GC';
    }

    // Camiones necesarios
    if (viaje.camionesNecesarios !== undefined) {
        const camiones = sanitizeNumber(viaje.camionesNecesarios, LIMITS.CAMIONES_MIN, LIMITS.CAMIONES_MAX);
        if (camiones === null) {
            errors.camionesNecesarios = ERROR_MESSAGES.CAMIONES_INVALID;
        } else {
            sanitized.camionesNecesarios = Math.round(camiones);
        }
    } else {
        sanitized.camionesNecesarios = 1;
    }

    // Fecha
    if (viaje.fecha) {
        sanitized.fecha = sanitizeString(viaje.fecha);
    } else {
        sanitized.fecha = new Date().toISOString().split('T')[0];
    }

    // Estado
    if (viaje.estado) {
        const estado = viaje.estado.toLowerCase();
        if (Object.values(ESTADOS.VIAJE).includes(estado)) {
            sanitized.estado = estado;
        } else {
            sanitized.estado = ESTADOS.VIAJE.PENDIENTE;
        }
    } else {
        sanitized.estado = ESTADOS.VIAJE.PENDIENTE;
    }

    // Inicio (timestamp)
    if (viaje.inicio) {
        sanitized.inicio = viaje.inicio;
    }

    // ID (si existe, preservar)
    if (viaje.id !== undefined) {
        sanitized.id = viaje.id;
    }

    return Object.keys(errors).length > 0 ? invalidResult(errors) : validResult(sanitized);
}

// ============================================
// VALIDACIÓN DE SOLICITUDES
// ============================================

/**
 * Valida los datos de una solicitud
 * @param {Object} solicitud - Datos de la solicitud
 * @returns {ValidationResult}
 */
export function validateSolicitud(solicitud) {
    const errors = {};
    const sanitized = {};

    // Título
    if (!solicitud.titulo) {
        errors.titulo = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        const titulo = sanitizeString(solicitud.titulo).trim();
        if (titulo.length < 3 || titulo.length > 200) {
            errors.titulo = 'El título debe tener entre 3 y 200 caracteres';
        } else {
            sanitized.titulo = titulo;
        }
    }

    // Origen
    if (!solicitud.origen) {
        errors.origen = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.origen = sanitizeString(solicitud.origen);
    }

    // Destino
    if (!solicitud.destino) {
        errors.destino = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.destino = sanitizeString(solicitud.destino);
    }

    // Peso
    if (solicitud.pesoKg !== undefined) {
        const peso = sanitizeNumber(solicitud.pesoKg, LIMITS.PESO_MIN, LIMITS.PESO_MAX);
        if (peso === null) {
            errors.pesoKg = ERROR_MESSAGES.PESO_INVALID;
        } else {
            sanitized.pesoKg = Math.round(peso);
        }
    }

    // Volumen
    if (solicitud.volumenM3 !== undefined) {
        const volumen = sanitizeNumber(solicitud.volumenM3, LIMITS.VOLUMEN_MIN, LIMITS.VOLUMEN_MAX);
        if (volumen === null) {
            errors.volumenM3 = ERROR_MESSAGES.VOLUMEN_INVALID;
        } else {
            sanitized.volumenM3 = Math.round(volumen * 10) / 10;
        }
    }

    // Fecha
    if (solicitud.fecha) {
        sanitized.fecha = sanitizeString(solicitud.fecha);
    }

    // Estado
    if (solicitud.estado) {
        const estado = solicitud.estado.toLowerCase();
        if (Object.values(ESTADOS.SOLICITUD).includes(estado)) {
            sanitized.estado = estado;
        } else {
            sanitized.estado = ESTADOS.SOLICITUD.NUEVO;
        }
    }

    // ID
    if (solicitud.id !== undefined) {
        sanitized.id = solicitud.id;
    }

    return Object.keys(errors).length > 0 ? invalidResult(errors) : validResult(sanitized);
}

// ============================================
// VALIDACIÓN DE COTIZACIONES
// ============================================

/**
 * Valida los datos de una cotización
 * @param {Object} cotizacion - Datos de la cotización
 * @returns {ValidationResult}
 */
export function validateCotizacion(cotizacion) {
    const errors = {};
    const sanitized = {};

    // Origen
    if (!cotizacion.origen) {
        errors.origen = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.origen = sanitizeString(cotizacion.origen);
    }

    // Destino
    if (!cotizacion.destino) {
        errors.destino = ERROR_MESSAGES.REQUIRED_FIELD;
    } else {
        sanitized.destino = sanitizeString(cotizacion.destino);
    }

    // Distancia
    const distancia = sanitizeNumber(cotizacion.distanciaKm, LIMITS.DISTANCIA_MIN, LIMITS.DISTANCIA_MAX);
    if (distancia === null) {
        errors.distanciaKm = ERROR_MESSAGES.DISTANCIA_INVALID;
    } else {
        sanitized.distanciaKm = Math.round(distancia * 10) / 10;
    }

    // Duración
    const duracion = sanitizeNumber(cotizacion.duracionHoras, LIMITS.DURACION_MIN, LIMITS.DURACION_MAX);
    if (duracion === null) {
        errors.duracionHoras = ERROR_MESSAGES.DURACION_INVALID;
    } else {
        sanitized.duracionHoras = Math.round(duracion * 10) / 10;
    }

    // Costos (opcionales pero deben ser números válidos si existen)
    const costFields = ['costoBase', 'costoCombustible', 'costoPeajes', 'costoMantencion', 'subtotal', 'margen', 'iva', 'total'];
    for (const field of costFields) {
        if (cotizacion[field] !== undefined) {
            const value = sanitizeNumber(cotizacion[field], 0);
            if (value !== null) {
                sanitized[field] = Math.round(value);
            }
        }
    }

    // Tipo de camión
    if (cotizacion.tipoCamion) {
        const tipo = cotizacion.tipoCamion.toUpperCase();
        if (TRUCK_TYPES[tipo]) {
            sanitized.tipoCamion = tipo;
        }
    }

    // Estado
    if (cotizacion.estado) {
        const estado = cotizacion.estado.toLowerCase();
        if (Object.values(ESTADOS.COTIZACION).includes(estado)) {
            sanitized.estado = estado;
        } else {
            sanitized.estado = ESTADOS.COTIZACION.PENDIENTE;
        }
    }

    // Otros campos
    ['id', 'fechaCreacion', 'pesoKg', 'volumenM3', 'camionesNecesarios'].forEach(field => {
        if (cotizacion[field] !== undefined) {
            sanitized[field] = cotizacion[field];
        }
    });

    return Object.keys(errors).length > 0 ? invalidResult(errors) : validResult(sanitized);
}

// ============================================
// VALIDADORES DE FORMULARIOS
// ============================================

/**
 * Valida que un campo no esté vacío
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateRequired(value, fieldName = 'Este campo') {
    if (value === null || value === undefined || value === '') {
        return `${fieldName} es obligatorio`;
    }
    if (typeof value === 'string' && value.trim() === '') {
        return `${fieldName} es obligatorio`;
    }
    return null;
}

/**
 * Valida un rango numérico
 * @param {number} value - Valor a validar
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @param {string} fieldName - Nombre del campo
 * @returns {string|null} Mensaje de error o null
 */
export function validateRange(value, min, max, fieldName = 'El valor') {
    const num = Number(value);
    if (isNaN(num)) {
        return `${fieldName} debe ser un número válido`;
    }
    if (num < min || num > max) {
        return `${fieldName} debe estar entre ${min} y ${max}`;
    }
    return null;
}

/**
 * Valida el formato de un email
 * @param {string} email - Email a validar
 * @returns {string|null} Mensaje de error o null
 */
export function validateEmail(email) {
    if (!email || typeof email !== 'string') {
        return 'Email inválido';
    }
    if (!REGEX.EMAIL.test(email.trim())) {
        return 'Formato de email inválido';
    }
    return null;
}

/**
 * Valida el formato de teléfono chileno
 * @param {string} telefono - Teléfono a validar
 * @returns {string|null} Mensaje de error o null
 */
export function validateTelefonoChile(telefono) {
    if (!telefono || typeof telefono !== 'string') {
        return ERROR_MESSAGES.CONDUCTOR_TELEFONO_INVALID;
    }
    if (!REGEX.TELEFONO_CHILE.test(telefono.trim())) {
        return ERROR_MESSAGES.CONDUCTOR_TELEFONO_INVALID;
    }
    return null;
}
