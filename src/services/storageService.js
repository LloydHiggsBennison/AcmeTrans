/**
 * Servicio de almacenamiento seguro
 * Wrapper sobre LocalStorage con encriptación y validación
 * @module services/storageService
 */

import { encrypt, decrypt, validateStorageSize } from '../utils/security.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { logger, handleError } from '../utils/errorHandler.js';

/**
 * Servicio de almacenamiento seguro
 */
class StorageService {
    constructor() {
        this.prefix = 'acmetrans_';
        this.encryptionEnabled = true;
    }

    /**
     * Guardar datos en LocalStorage
     * @param {string} key - Clave
     * @param {any} value - Valor a guardar
     * @throws {Error} Si hay error de cuota o validación
     */
    set(key, value) {
        try {
            const fullKey = this.prefix + key;
            const serialized = JSON.stringify(value);

            // Validar tamaño
            if (!validateStorageSize(serialized)) {
                throw new Error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
            }

            // Encriptar si está habilitado
            const data = this.encryptionEnabled ? encrypt(serialized) : serialized;

            localStorage.setItem(fullKey, data);
            logger.debug(`Storage: Saved ${key}`, { size: serialized.length });
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                logger.error('Storage quota exceeded', error);
                throw new Error(ERROR_MESSAGES.STORAGE_QUOTA_EXCEEDED);
            }
            throw error;
        }
    }

    /**
     * Obtener datos de LocalStorage
     * @param {string} key - Clave
     * @param {any} defaultValue - Valor por defecto si no existe
     * @returns {any} Valor almacenado o default
     */
    get(key, defaultValue = null) {
        try {
            const fullKey = this.prefix + key;
            const data = localStorage.getItem(fullKey);

            if (data === null) {
                return defaultValue;
            }

            // Desencriptar si está habilitado
            const decrypted = this.encryptionEnabled ? decrypt(data) : data;

            return JSON.parse(decrypted);
        } catch (error) {
            logger.error(`Storage: Error getting ${key}`, error);
            // Si hay error de parsing, intentar migrar datos antiguos
            return this._attemptMigration(key, defaultValue);
        }
    }

    /**
     * Eliminar datos de LocalStorage
     * @param {string} key - Clave
     */
    remove(key) {
        try {
            const fullKey = this.prefix + key;
            localStorage.removeItem(fullKey);
            logger.debug(`Storage: Removed ${key}`);
        } catch (error) {
            logger.error(`Storage: Error removing ${key}`, error);
        }
    }

    /**
     * Limpiar todo el storage de la app
     */
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            logger.info('Storage: Cleared all app data');
        } catch (error) {
            logger.error('Storage: Error clearing', error);
        }
    }

    /**
     * Obtener todas las claves de la app
     * @returns {string[]} Array de claves
     */
    keys() {
        try {
            const allKeys = Object.keys(localStorage);
            return allKeys
                .filter(key => key.startsWith(this.prefix))
                .map(key => key.replace(this.prefix, ''));
        } catch (error) {
            logger.error('Storage: Error getting keys', error);
            return [];
        }
    }

    /**
     * Verificar si existe una clave
     * @param {string} key - Clave
     * @returns {boolean} true si existe
     */
    has(key) {
        const fullKey = this.prefix + key;
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Obtener tamaño aproximado del storage usado
     * @returns {number} Bytes usados
     */
    getUsedSpace() {
        try {
            let total = 0;
            const keys = Object.keys(localStorage);

            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    const value = localStorage.getItem(key);
                    total += key.length + (value?.length || 0);
                }
            });

            return total;
        } catch (error) {
            logger.error('Storage: Error calculating space', error);
            return 0;
        }
    }

    /**
     * Intentar migrar datos antiguos sin encriptación
     * @private
     * @param {string} key - Clave
     * @param {any} defaultValue - Valor por defecto
     * @returns {any} Datos migrados o default
     */
    _attemptMigration(key, defaultValue) {
        try {
            // Intentar leer la clave antigua sin encriptación
            const oldKey = 'ca_' + key; // Formato antiguo
            const oldData = localStorage.getItem(oldKey);

            if (oldData) {
                const parsed = JSON.parse(oldData);
                logger.info(`Storage: Migrated old key ${oldKey} to ${key}`);

                // Guardar en el nuevo formato
                this.set(key, parsed);

                // Eliminar clave antigua
                localStorage.removeItem(oldKey);

                return parsed;
            }
        } catch (error) {
            logger.warn(`Storage: Migration failed for ${key}`, error);
        }

        return defaultValue;
    }

    /**
     * Exportar todos los datos (útil para backups)
     * @returns {Object} Todos los datos de la app
     */
    export() {
        const exported = {};
        const keys = this.keys();

        keys.forEach(key => {
            exported[key] = this.get(key);
        });

        return exported;
    }

    /**
     * Importar datos (útil para restaurar backups)
     * @param {Object} data - Datos a importar
     * @param {boolean} overwrite - Si sobrescribir datos existentes
     */
    import(data, overwrite = false) {
        Object.entries(data).forEach(([key, value]) => {
            if (overwrite || !this.has(key)) {
                this.set(key, value);
            }
        });

        logger.info('Storage: Imported data', { keys: Object.keys(data).length });
    }
}

// Exportar instancia única (singleton)
export const storageService = new StorageService();

// Exportar clase para testing
export default StorageService;
