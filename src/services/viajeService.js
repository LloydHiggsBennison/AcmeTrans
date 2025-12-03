/**
 * Servicio de lógica de negocio para Viajes
 * @module services/viajeService
 */

import { validateViaje } from '../utils/validation.js';
import { ESTADOS, TARIFAS } from '../config/constants.js';
import { logger, auditLog } from '../utils/errorHandler.js';

/**
 * Servicio de viajes
 */
export class ViajeService {
    /**
     * Crear un nuevo viaje
     * @param {Object} viajeData - Datos del viaje
     * @param {Array} existingViajes - Lista de viajes existentes
     * @returns {Object} Viaje creado
     * @throws {Error} Si la validación falla
     */
    static create(viajeData, existingViajes = []) {
        // Validar datos
        const validation = validateViaje(viajeData);

        if (!validation.valid) {
            const errorMsg = Object.values(validation.errors).join(', ');
            logger.warn('Viaje validation failed', validation.errors);
            throw new Error(errorMsg);
        }

        // Generar ID
        const id = existingViajes.length
            ? Math.max(...existingViajes.map(v => v.id || 0)) + 1
            : 1;

        const viaje = {
            ...validation.sanitized,
            id,
            fecha: validation.sanitized.fecha || new Date().toISOString().split('T')[0],
            estado: ESTADOS.VIAJE.PENDIENTE,
            inicio: new Date().toISOString(),
        };

        auditLog.log('CREATE', 'Viaje', {
            id,
            conductorId: viaje.conductorId,
            origen: viaje.origen,
            destino: viaje.destino
        });

        logger.info('Viaje created', { id });

        return viaje;
    }

    /**
     * Actualizar un viaje existente
     * @param {number} id - ID del viaje
     * @param {Object} updates - Actualizaciones
     * @param {Array} viajes - Lista actual de viajes
     * @returns {Object} Viaje actualizado
     * @throws {Error} Si la validación falla
     */
    static update(id, updates, viajes) {
        const existing = viajes.find(v => v.id === id);

        if (!existing) {
            throw new Error('Viaje no encontrado');
        }

        // Merge con datos existentes
        const merged = { ...existing, ...updates, id };

        // Validar
        const validation = validateViaje(merged);

        if (!validation.valid) {
            const errorMsg = Object.values(validation.errors).join(', ');
            logger.warn('Viaje update validation failed', validation.errors);
            throw new Error(errorMsg);
        }

        const updated = { ...merged, ...validation.sanitized };

        auditLog.log('UPDATE', 'Viaje', { id, changes: Object.keys(updates) });
        logger.info('Viaje updated', { id });

        return updated;
    }

    /**
     * Calcular costo de un viaje
     * @param {Object} viaje - Datos del viaje
     * @returns {Object} Desglose de costos
     */
    static calculateCost(viaje) {
        const tipoCamion = viaje.tipoCamion || 'GC';
        const tarifa = TARIFAS[tipoCamion] || TARIFAS.GC;
        const distancia = viaje.distanciaKm || 0;
        const camiones = viaje.camionesNecesarios || 1;

        // Costos base
        const costoBase = Math.round(tarifa.baseKm * distancia * camiones);
        const costoCombustible = Math.round(tarifa.combustibleKm * distancia * camiones);
        const costoPeajes = Math.round(tarifa.peajeKm * distancia * camiones);
        const costoMantencion = Math.round(tarifa.mantencionKm * distancia * camiones);

        const subtotal = costoBase + costoCombustible + costoPeajes + costoMantencion;
        const margen = Math.round(subtotal * TARIFAS.MARGEN);
        const baseConMargen = subtotal + margen;
        const iva = Math.round(baseConMargen * TARIFAS.IVA);
        const total = baseConMargen + iva;

        return {
            costoBase,
            costoCombustible,
            costoPeajes,
            costoMantencion,
            subtotal,
            margen,
            iva,
            total,
            distanciaKm: distancia,
            tipoCamion,
            camiones,
        };
    }

    /**
     * Marcar viaje como en curso
     * @param {Object} viaje - Viaje
     * @returns {Object} Viaje actualizado
     */
    static startTrip(viaje) {
        const updated = {
            ...viaje,
            estado: ESTADOS.VIAJE.EN_CURSO,
            inicio: viaje.inicio || new Date().toISOString(),
        };

        auditLog.log('START_TRIP', 'Viaje', { id: viaje.id });

        return updated;
    }

    /**
     * Marcar viaje como completado
     * @param {Object} viaje - Viaje
     * @returns {Object} Viaje actualizado
     */
    static completeTrip(viaje) {
        const updated = {
            ...viaje,
            estado: ESTADOS.VIAJE.COMPLETADO,
            fin: new Date().toISOString(),
        };

        auditLog.log('COMPLETE_TRIP', 'Viaje', { id: viaje.id });

        return updated;
    }

    /**
     * Cancelar viaje
     * @param {Object} viaje - Viaje
     * @param {string} motivo - Motivo de cancelación
     * @returns {Object} Viaje actualizado
     */
    static cancelTrip(viaje, motivo = '') {
        const updated = {
            ...viaje,
            estado: ESTADOS.VIAJE.CANCELADO,
            motivoCancelacion: motivo,
            fechaCancelacion: new Date().toISOString(),
        };

        auditLog.log('CANCEL_TRIP', 'Viaje', { id: viaje.id, motivo });

        return updated;
    }

    /**
     * Obtener viajes de un conductor
     * @param {Array} viajes - Todos los viajes
     * @param {number} conductorId - ID del conductor
     * @returns {Array} Viajes del conductor
     */
    static getByConductor(viajes, conductorId) {
        return viajes.filter(v => v.conductorId === conductorId);
    }

    /**
     * Obtener viajes por estado
     * @param {Array} viajes - Todos los viajes
     * @param {string} estado - Estado a filtrar
     * @returns {Array} Viajes filtrados
     */
    static getByEstado(viajes, estado) {
        return viajes.filter(v => v.estado === estado);
    }

    /**
     * Obtener viajes activos (pendientes o en curso)
     * @param {Array} viajes - Todos los viajes
     * @returns {Array} Viajes activos
     */
    static getActive(viajes) {
        return viajes.filter(v =>
            v.estado === ESTADOS.VIAJE.PENDIENTE ||
            v.estado === ESTADOS.VIAJE.EN_CURSO
        );
    }

    /**
     * Calcular métricas de viajes
     * @param {Array} viajes - Viajes a analizar
     * @returns {Object} Métricas
     */
    static getMetrics(viajes) {
        const total = viajes.length;
        const completados = viajes.filter(v => v.estado === ESTADOS.VIAJE.COMPLETADO).length;
        const enCurso = viajes.filter(v => v.estado === ESTADOS.VIAJE.EN_CURSO).length;
        const pendientes = viajes.filter(v => v.estado === ESTADOS.VIAJE.PENDIENTE).length;
        const cancelados = viajes.filter(v => v.estado === ESTADOS.VIAJE.CANCELADO).length;

        const totalKm = viajes.reduce((sum, v) => sum + (v.distanciaKm || 0), 0);
        const totalHoras = viajes.reduce((sum, v) => sum + (v.duracionHoras || 0), 0);
        const totalPeso = viajes.reduce((sum, v) => sum + (v.pesoKg || 0), 0);

        // Calcular ingresos totales
        let ingresosTotales = 0;
        viajes.forEach(v => {
            if (v.estado === ESTADOS.VIAJE.COMPLETADO) {
                const costos = this.calculateCost(v);
                ingresosTotales += costos.total;
            }
        });

        return {
            total,
            completados,
            enCurso,
            pendientes,
            cancelados,
            totalKm: Math.round(totalKm),
            totalHoras: Math.round(totalHoras * 10) / 10,
            totalPeso: Math.round(totalPeso),
            ingresosTotales: Math.round(ingresosTotales),
            tasaCompletitud: total > 0 ? Math.round((completados / total) * 100) : 0,
        };
    }

    /**
     * Validar capacidad del camión para un viaje
     * @param {Object} viaje - Viaje
     * @param {Object} camion - Datos del camión
     * @returns {Object} Resultado de validación
     */
    static validateCapacity(viaje, camion) {
        const errors = [];

        if (viaje.pesoKg > camion.capacidadKg) {
            errors.push(`Peso excede capacidad (${camion.capacidadKg} kg)`);
        }

        if (viaje.volumenM3 > camion.capacidadM3) {
            errors.push(`Volumen excede capacidad (${camion.capacidadM3} m³)`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}
