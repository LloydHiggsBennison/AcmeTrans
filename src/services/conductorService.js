/**
 * Servicio de lógica de negocio para Conductores
 * @module services/conductorService
 */

import { validateConductor } from '../utils/validation.js';
import { ESTADOS } from '../config/constants.js';
import { logger, auditLog } from '../utils/errorHandler.js';
import { generateSecureId } from '../utils/security.js';

/**
 * Servicio de conductores
 */
export class ConductorService {
    /**
     * Crear un nuevo conductor
     * @param {Object} conductorData - Datos del conductor
     * @param {Array} existingConductores - Lista de conductores existentes
     * @returns {Object} Conductor creado
     * @throws {Error} Si la validación falla
     */
    static create(conductorData, existingConductores = []) {
        // Validar datos
        const validation = validateConductor(conductorData);

        if (!validation.valid) {
            const errorMsg = Object.values(validation.errors).join(', ');
            logger.warn('Conductor validation failed', validation.errors);
            throw new Error(errorMsg);
        }

        // Generar ID
        const id = existingConductores.length
            ? Math.max(...existingConductores.map(c => c.id || 0)) + 1
            : 1;

        const conductor = {
            ...validation.sanitized,
            id,
            estado: ESTADOS.CONDUCTOR.DISPONIBLE,
            bloqueos: [],
        };

        auditLog.log('CREATE', 'Conductor', { id, nombre: conductor.nombre });
        logger.info('Conductor created', { id });

        return conductor;
    }

    /**
     * Actualizar un conductor existente
     * @param {number} id - ID del conductor
     * @param {Object} updates - Actualizaciones
     * @param {Array} conductores - Lista actual de conductores
     * @returns {Object} Conductor actualizado
     * @throws {Error} Si la validación falla
     */
    static update(id, updates, conductores) {
        const existing = conductores.find(c => c.id === id);

        if (!existing) {
            throw new Error('Conductor no encontrado');
        }

        // Merge con datos existentes
        const merged = { ...existing, ...updates, id };

        // Validar
        const validation = validateConductor(merged);

        if (!validation.valid) {
            const errorMsg = Object.values(validation.errors).join(', ');
            logger.warn('Conductor update validation failed', validation.errors);
            throw new Error(errorMsg);
        }

        const updated = { ...merged, ...validation.sanitized };

        auditLog.log('UPDATE', 'Conductor', { id, changes: Object.keys(updates) });
        logger.info('Conductor updated', { id });

        return updated;
    }

    /**
     * Verificar disponibilidad de un conductor
     * @param {Object} conductor - Conductor
     * @param {string} fecha - Fecha a verificar
     * @returns {boolean} true si está disponible
     */
    static isAvailable(conductor, fecha) {
        // Verificar estado
        if (conductor.estado !== ESTADOS.CONDUCTOR.DISPONIBLE) {
            return false;
        }

        // Verificar bloqueos de calendario
        if (conductor.bloqueos && conductor.bloqueos.length > 0) {
            const hayBloqueo = conductor.bloqueos.some(b => b.fecha === fecha);
            if (hayBloqueo) {
                return false;
            }
        }

        return true;
    }

    /**
     * Obtener conductores disponibles para una fecha
     * @param {Array} conductores - Lista de conductores
     * @param {string} fecha - Fecha
     * @param {string} origen - Origen opcional para filtrar
     * @returns {Array} Conductores disponibles
     */
    static getAvailable(conductores, fecha, origen = null) {
        return conductores.filter(c => {
            const available = this.isAvailable(c, fecha);
            const matchesOrigen = !origen || c.origen === origen;
            return available && matchesOrigen;
        });
    }

    /**
     * Asignar viaje a conductor
     * @param {Object} conductor - Conductor
     * @param {Object} viajeData - Datos del viaje
     * @returns {Object} Conductor actualizado
     */
    static assignTrip(conductor, viajeData) {
        const updated = {
            ...conductor,
            estado: ESTADOS.CONDUCTOR.OCUPADO,
        };

        auditLog.log('ASSIGN_TRIP', 'Conductor', {
            conductorId: conductor.id,
            viaje: viajeData
        });

        return updated;
    }

    /**
     * Marcar conductor como disponible
     * @param {Object} conductor - Conductor
     * @returns {Object} Conductor actualizado
     */
    static markAvailable(conductor) {
        const updated = {
            ...conductor,
            estado: ESTADOS.CONDUCTOR.DISPONIBLE,
        };

        auditLog.log('MARK_AVAILABLE', 'Conductor', { conductorId: conductor.id });

        return updated;
    }

    /**
     * Agregar bloqueo de calendario
     * @param {Object} conductor - Conductor
     * @param {Object} bloqueo - Datos del bloqueo
     * @returns {Object} Conductor actualizado
     */
    static addBloqueo(conductor, bloqueo) {
        const bloqueos = [...(conductor.bloqueos || []), bloqueo];

        const updated = {
            ...conductor,
            bloqueos,
            estado: ESTADOS.CONDUCTOR.OCUPADO,
        };

        auditLog.log('ADD_BLOQUEO', 'Conductor', {
            conductorId: conductor.id,
            fecha: bloqueo.fecha
        });

        return updated;
    }

    /**
     * Remover bloqueo de calendario
     * @param {Object} conductor - Conductor
     * @param {string} fecha - Fecha del bloqueo a remover
     * @returns {Object} Conductor actualizado
     */
    static removeBloqueo(conductor, fecha) {
        const bloqueos = (conductor.bloqueos || []).filter(b => b.fecha !== fecha);

        const updated = {
            ...conductor,
            bloqueos,
        };

        auditLog.log('REMOVE_BLOQUEO', 'Conductor', {
            conductorId: conductor.id,
            fecha
        });

        return updated;
    }

    /**
     * Calcular estadísticas de un conductor
     * @param {Object} conductor - Conductor
     * @param {Array} viajes - Todos los viajes
     * @returns {Object} Estadísticas
     */
    static getStats(conductor, viajes) {
        const viajesConductor = viajes.filter(v => v.conductorId === conductor.id);

        const total = viajesConductor.length;
        const completados = viajesConductor.filter(v => v.estado === ESTADOS.VIAJE.COMPLETADO).length;
        const enCurso = viajesConductor.filter(v => v.estado === ESTADOS.VIAJE.EN_CURSO).length;
        const pendientes = viajesConductor.filter(v => v.estado === ESTADOS.VIAJE.PENDIENTE).length;

        const totalKm = viajesConductor.reduce((sum, v) => sum + (v.distanciaKm || 0), 0);
        const totalHoras = viajesConductor.reduce((sum, v) => sum + (v.duracionHoras || 0), 0);

        return {
            totalViajes: total,
            completados,
            enCurso,
            pendientes,
            totalKm: Math.round(totalKm),
            totalHoras: Math.round(totalHoras * 10) / 10,
        };
    }
}
