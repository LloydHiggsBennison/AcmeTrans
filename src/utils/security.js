/**
 * Utilidades de seguridad
 * Implementa controles OWASP y ISO 27001
 * @module utils/security
 */

import { SECURITY_CONFIG, ERROR_MESSAGES, LIMITS } from '../config/constants.js';

// ============================================
// SANITIZACIÓN DE ENTRADAS (XSS Prevention)
// ============================================

/**
 * Sanitiza una cadena de texto eliminando caracteres potencialmente peligrosos
 * @param {string} input - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export function sanitizeString(input) {
    if (typeof input !== 'string') return '';

    // Eliminar tags HTML y scripts
    let sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');

    // Escapar caracteres especiales
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
    };

    sanitized = sanitized.replace(/[&<>"'/]/g, (char) => map[char] || char);

    // Limitar longitud para prevenir buffer overflow
    return sanitized.slice(0, 1000);
}

/**
 * Sanitiza un número asegurando que sea válido
 * @param {any} input - Valor a sanitizar
 * @param {number} min - Valor mínimo permitido
 * @param {number} max - Valor máximo permitido
 * @returns {number|null} Número sanitizado o null si es inválido
 */
export function sanitizeNumber(input, min = -Infinity, max = Infinity) {
    const num = Number(input);

    if (isNaN(num) || !isFinite(num)) return null;
    if (num < min || num > max) return null;

    return num;
}

/**
 * Sanitiza un objeto completo recursivamente
 * @param {Object} obj - Objeto a sanitizar
 * @returns {Object} Objeto sanitizado
 */
export function sanitizeObject(obj) {
    if (obj === null || typeof obj !== 'object') {
        return typeof obj === 'string' ? sanitizeString(obj) : obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = sanitizeString(key);
        sanitized[sanitizedKey] = sanitizeObject(value);
    }

    return sanitized;
}

// ============================================
// ENCRIPTACIÓN SIMPLE (LocalStorage)
// ============================================

/**
 * Encripta un string usando Base64 y simple XOR cipher
 * Nota: No es criptográficamente seguro, solo ofuscación básica
 * @param {string} text - Texto a encriptar
 * @returns {string} Texto encriptado
 */
export function encrypt(text) {
    if (!SECURITY_CONFIG.ENCRYPTION_ENABLED) return text;

    try {
        const key = SECURITY_CONFIG.ENCRYPTION_KEY_PREFIX;
        let encrypted = '';

        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            encrypted += String.fromCharCode(charCode);
        }

        // Encode to UTF-8 before btoa to support Unicode
        const utf8Encoded = encodeURIComponent(encrypted).replace(/%([0-9A-F]{2})/g, (match, p1) => {
            return String.fromCharCode('0x' + p1);
        });

        return btoa(utf8Encoded);
    } catch (error) {
        console.error('Encryption error:', error);
        return text;
    }
}

/**
 * Desencripta un string encriptado con encrypt()
 * @param {string} encrypted - Texto encriptado
 * @returns {string} Texto desencriptado
 */
export function decrypt(encrypted) {
    if (!SECURITY_CONFIG.ENCRYPTION_ENABLED) return encrypted;

    try {
        const key = SECURITY_CONFIG.ENCRYPTION_KEY_PREFIX;

        // Decode from UTF-8 after atob to support Unicode
        const decoded = atob(encrypted);
        const utf8Decoded = decodeURIComponent(decoded.split('').map((c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        let decrypted = '';
        for (let i = 0; i < utf8Decoded.length; i++) {
            const charCode = utf8Decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            decrypted += String.fromCharCode(charCode);
        }

        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return encrypted;
    }
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map();

/**
 * Implementa rate limiting simple basado en tiempo
 * @param {string} key - Identificador único para la acción
 * @param {number} maxRequests - Máximo de solicitudes permitidas
 * @param {number} windowMs - Ventana de tiempo en milisegundos
 * @returns {boolean} true si está permitido, false si excede el límite
 */
export function checkRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const record = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset si la ventana de tiempo expiró
    if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
    }

    // Incrementar contador
    record.count++;
    rateLimitStore.set(key, record);

    // Verificar límite
    if (record.count > maxRequests) {
        return false;
    }

    return true;
}

/**
 * Limpiar entradas antiguas del rate limit store
 */
export function cleanRateLimitStore() {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}

// Limpiar automáticamente cada 5 minutos
if (typeof window !== 'undefined') {
    setInterval(cleanRateLimitStore, 5 * 60 * 1000);
}

// ============================================
// VALIDACIÓN DE DATOS
// ============================================

/**
 * Valida que un valor no esté vacío
 * @param {any} value - Valor a validar
 * @returns {boolean} true si es válido
 */
export function isNotEmpty(value) {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return true;
}

/**
 * Valida el tamaño de los datos en LocalStorage
 * @param {string} data - Datos a validar
 * @returns {boolean} true si el tamaño es aceptable
 */
export function validateStorageSize(data) {
    const size = new Blob([data]).size;
    return size <= LIMITS.STORAGE_MAX_SIZE;
}

// ============================================
// HASH SIMPLE (Para IDs)
// ============================================

/**
 * Genera un hash simple de un string
 * @param {string} str - String a hashear
 * @returns {string} Hash hexadecimal
 */
export function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}

// ============================================
// PREVENCIÓN DE DOBLE SUBMIT
// ============================================

const submitTimestamps = new Map();

/**
 * Previene doble submit de formularios
 * @param {string} formId - ID del formulario
 * @param {number} cooldownMs - Tiempo de espera en ms (default: 2000)
 * @returns {boolean} true si se permite el submit
 */
export function allowSubmit(formId, cooldownMs = 2000) {
    const now = Date.now();
    const lastSubmit = submitTimestamps.get(formId) || 0;

    if (now - lastSubmit < cooldownMs) {
        return false;
    }

    submitTimestamps.set(formId, now);
    return true;
}

// ============================================
// ESCAPE DE SQL/NOSQL (Prevención de inyección)
// ============================================

/**
 * Escapa caracteres peligrosos para prevenir inyección
 * @param {string} input - String a escapar
 * @returns {string} String escapado
 */
export function escapeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/'/g, "''")
        .replace(/"/g, '""')
        .replace(/\\/g, '\\\\')
        .replace(/\0/g, '\\0')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\x1a/g, '\\Z');
}

// ============================================
// GENERACIÓN SEGURA DE IDS
// ============================================

/**
 * Genera un ID único y seguro
 * @returns {string} ID único
 */
export function generateSecureId() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `${timestamp}-${randomPart}`;
}
