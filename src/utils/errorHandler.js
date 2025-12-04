/**
 * Manejo centralizado de errores y logging
 * @module utils/errorHandler
 */

import { SECURITY_CONFIG, ERROR_MESSAGES } from '../config/constants.js';

// ============================================
// LOGGER
// ============================================

const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
};

class Logger {
    constructor() {
        this.level = import.meta.env.DEV ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
        this.logs = [];
        this.maxLogs = 100;
    }

    /**
     * Log a debug message
     * @param {string} message - Mensaje
     * @param {any} data - Datos adicionales
     */
    debug(message, data = null) {
        if (this.level <= LOG_LEVELS.DEBUG) {
            console.log(`[DEBUG] ${message}`, data || '');
            this._addLog('DEBUG', message, data);
        }
    }

    /**
     * Log an info message
     * @param {string} message - Mensaje
     * @param {any} data - Datos adicionales
     */
    info(message, data = null) {
        if (this.level <= LOG_LEVELS.INFO) {
            console.info(`[INFO] ${message}`, data || '');
            this._addLog('INFO', message, data);
        }
    }

    /**
     * Log a warning
     * @param {string} message - Mensaje
     * @param {any} data - Datos adicionales
     */
    warn(message, data = null) {
        if (this.level <= LOG_LEVELS.WARN) {
            console.warn(`[WARN] ${message}`, data || '');
            this._addLog('WARN', message, data);
        }
    }

    /**
     * Log an error
     * @param {string} message - Mensaje
     * @param {Error|any} error - Error
     */
    error(message, error = null) {
        if (this.level <= LOG_LEVELS.ERROR) {
            console.error(`[ERROR] ${message}`, error || '');
            this._addLog('ERROR', message, error);
        }
    }

    /**
     * Añadir log al historial
     * @private
     */
    _addLog(level, message, data) {
        this.logs.push({
            level,
            message,
            data,
            timestamp: new Date().toISOString(),
        });

        // Mantener solo los últimos N logs
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
    }

    /**
     * Obtener todos los logs
     * @returns {Array} Logs
     */
    getLogs() {
        return [...this.logs];
    }

    /**
     * Limpiar logs
     */
    clear() {
        this.logs = [];
    }
}

export const logger = new Logger();

// ============================================
// AUDIT LOG
// ============================================

class AuditLog {
    constructor() {
        this.enabled = SECURITY_CONFIG.AUDIT_LOG_ENABLED;
        this.entries = this._loadFromStorage();
        this.maxEntries = SECURITY_CONFIG.MAX_AUDIT_ENTRIES;
    }

    /**
     * Registrar una acción en el audit log
     * @param {string} action - Acción realizada
     * @param {string} entity - Entidad afectada
     * @param {any} details - Detalles adicionales
     */
    log(action, entity, details = null) {
        if (!this.enabled) return;

        const entry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action,
            entity,
            details,
            userAgent: navigator.userAgent,
        };

        this.entries.push(entry);

        // Mantener solo las últimas N entradas
        if (this.entries.length > this.maxEntries) {
            this.entries = this.entries.slice(-this.maxEntries);
        }

        this._saveToStorage();

        logger.info(`Audit: ${action} on ${entity}`, details);
    }

    /**
     * Obtener todas las entradas del audit log
     * @returns {Array} Entradas
     */
    getEntries() {
        return [...this.entries];
    }

    /**
     * Obtener entradas filtradas
     * @param {Object} filters - Filtros (action, entity, desde, hasta)
     * @returns {Array} Entradas filtradas
     */
    getFiltered(filters = {}) {
        let filtered = [...this.entries];

        if (filters.action) {
            filtered = filtered.filter(e => e.action === filters.action);
        }

        if (filters.entity) {
            filtered = filtered.filter(e => e.entity === filters.entity);
        }

        if (filters.desde) {
            filtered = filtered.filter(e => new Date(e.timestamp) >= new Date(filters.desde));
        }

        if (filters.hasta) {
            filtered = filtered.filter(e => new Date(e.timestamp) <= new Date(filters.hasta));
        }

        return filtered;
    }

    /**
     * Limpiar audit log
     */
    clear() {
        this.entries = [];
        this._saveToStorage();
    }

    /**
     * Cargar desde LocalStorage
     * @private
     */
    _loadFromStorage() {
        try {
            const stored = localStorage.getItem('acmetrans_audit_log');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            logger.error('Error loading audit log', error);
            return [];
        }
    }

    /**
     * Guardar en LocalStorage
     * @private
     */
    _saveToStorage() {
        try {
            localStorage.setItem('acmetrans_audit_log', JSON.stringify(this.entries));
        } catch (error) {
            logger.error('Error saving audit log', error);
        }
    }
}

export const auditLog = new AuditLog();

// ============================================
// ERROR HANDLER
// ============================================

/**
 * Maneja errores de forma centralizada
 * @param {Error} error - Error a manejar
 * @param {string} context - Contexto donde ocurrió el error
 * @returns {string} Mensaje de error user-friendly
 */
export function handleError(error, context = 'Operación') {
    logger.error(`Error in ${context}:`, error);

    // Determinar mensaje apropiado
    let userMessage = ERROR_MESSAGES.UNEXPECTED_ERROR;

    if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        userMessage = ERROR_MESSAGES.NETWORK_ERROR;
    } else if (error.name === 'QuotaExceededError') {
        userMessage = ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED;
    } else if (error.message) {
        // En desarrollo, mostrar el mensaje real
        if (import.meta.env.DEV) {
            userMessage = error.message;
        }
    }

    return userMessage;
}

/**
 * Wrapper para funciones async con manejo de errores
 * @param {Function} fn - Función async
 * @param {string} context - Contexto
 * @returns {Function} Función wrapped
 */
export function withErrorHandling(fn, context) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            const message = handleError(error, context);
            throw new Error(message);
        }
    };
}

// ============================================
// ERROR BOUNDARY HELPER
// ============================================

/**
 * Registra un error de React
 * @param {Error} error - Error
 * @param {Object} errorInfo - Info adicional de React
 */
export function logReactError(error, errorInfo) {
    logger.error('React Error:', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
    });

    auditLog.log('ERROR', 'React Component', {
        error: error.message,
        stack: error.stack?.substring(0, 500),
    });
}

// ============================================
// VALIDACIÓN DE RESPUESTAS DE API
// ============================================

/**
 * Valida una respuesta de API externa
 * @param {Response} response - Respuesta fetch
 * @returns {Promise<any>} Datos parseados
 * @throws {Error} Si la respuesta no es válida
 */
export async function validateApiResponse(response) {
    if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.name = 'NetworkError';
        throw error;
    }

    try {
        const data = await response.json();
        return data;
    } catch (error) {
        logger.error('Error parsing API response', error);
        throw new Error('Respuesta inválida del servidor');
    }
}

// ============================================
// HELPERS DE NOTIFICACIÓN
// ============================================

/**
 * Muestra un mensaje de éxito (puede integrarse con toast library)
 * @param {string} message - Mensaje
 */
export function showSuccess(message) {
    logger.info('Success:', message);
    // TODO: Integrar con sistema de notificaciones toast
    // Por ahora solo logea
}

/**
 * Muestra un mensaje de error (puede integrarse con toast library)
 * @param {string} message - Mensaje
 */
export function showError(message) {
    logger.error('Error shown to user:', message);
    // TODO: Integrar con sistema de notificaciones toast
    // alert(message); // Temporal - Removed in favor of ToastNotification
}

/**
 * Muestra un mensaje de advertencia
 * @param {string} message - Mensaje
 */
export function showWarning(message) {
    logger.warn('Warning shown to user:', message);
    // TODO: Integrar con sistema de notificaciones toast
}
