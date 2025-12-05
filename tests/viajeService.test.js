import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ViajeService } from '../src/services/viajeService';
import { ESTADOS, TARIFAS } from '../src/config/constants';

describe('ViajeService', () => {
    let viajesMock;

    beforeEach(() => {
        viajesMock = [];
    });

    describe('create', () => {
        it('debería crear un viaje válido', () => {
            const viajeData = {
                conductorId: 1,
                origen: 'Santiago',
                destino: 'Valparaíso',
                distanciaKm: 120,
                duracionHoras: 2,
                pesoKg: 1000,
                volumenM3: 10,
                tipoCamion: 'GC'
            };

            const nuevoViaje = ViajeService.create(viajeData, viajesMock);

            expect(nuevoViaje).toBeDefined();
            expect(nuevoViaje.id).toBe(1);
            expect(nuevoViaje.estado).toBe(ESTADOS.VIAJE.PENDIENTE);
            expect(nuevoViaje.fecha).toBeDefined();
        });

        it('debería lanzar error si faltan datos requeridos', () => {
            const viajeIncompleto = {
                origen: 'Santiago'
                // Falta conductor, destino, etc.
            };

            expect(() => ViajeService.create(viajeIncompleto, viajesMock)).toThrow();
        });
    });

    describe('update', () => {
        it('debería actualizar un viaje existente', () => {
            const viajeExistente = {
                id: 1,
                estado: ESTADOS.VIAJE.PENDIENTE,
                origen: 'A',
                conductorId: 1,
                destino: 'B'
            };
            const updates = { origen: 'C' };

            const actualizado = ViajeService.update(1, updates, [viajeExistente]);

            expect(actualizado.origen).toBe('C');
            expect(actualizado.id).toBe(1);
        });

        it('debería lanzar error si el viaje no existe', () => {
            expect(() => ViajeService.update(999, {}, [])).toThrow('Viaje no encontrado');
        });
    });

    describe('calculateCost', () => {
        it('debería calcular costos correctamente', () => {
            const viaje = {
                tipoCamion: 'GC',
                distanciaKm: 100,
                camionesNecesarios: 1
            };

            const costos = ViajeService.calculateCost(viaje);

            expect(costos.costoBase).toBeGreaterThan(0);
            expect(costos.total).toBeGreaterThan(costos.subtotal);
            expect(costos.iva).toBeDefined();
        });

        it('debería escalar costos con múltiples camiones', () => {
            const viaje1 = { tipoCamion: 'GC', distanciaKm: 100, camionesNecesarios: 1 };
            const viaje2 = { tipoCamion: 'GC', distanciaKm: 100, camionesNecesarios: 2 };

            const costos1 = ViajeService.calculateCost(viaje1);
            const costos2 = ViajeService.calculateCost(viaje2);

            // Aproximadamente el doble, permitiendo pequeñas diferencias por redondeo
            expect(costos2.subtotal).toBeCloseTo(costos1.subtotal * 2, -1);
        });
    });

    describe('State transitions', () => {
        it('startTrip debería cambiar estado a EN_CURSO', () => {
            const viaje = { id: 1, estado: ESTADOS.VIAJE.PENDIENTE };
            const iniciado = ViajeService.startTrip(viaje);
            expect(iniciado.estado).toBe(ESTADOS.VIAJE.EN_CURSO);
            expect(iniciado.inicio).toBeDefined();
        });

        it('completeTrip debería cambiar estado a COMPLETADO', () => {
            const viaje = { id: 1, estado: ESTADOS.VIAJE.EN_CURSO };
            const completado = ViajeService.completeTrip(viaje);
            expect(completado.estado).toBe(ESTADOS.VIAJE.COMPLETADO);
            expect(completado.fin).toBeDefined();
        });

        it('cancelTrip debería cambiar estado a CANCELADO', () => {
            const viaje = { id: 1, estado: ESTADOS.VIAJE.PENDIENTE };
            const cancelado = ViajeService.cancelTrip(viaje, 'Motivo X');
            expect(cancelado.estado).toBe(ESTADOS.VIAJE.CANCELADO);
            expect(cancelado.motivoCancelacion).toBe('Motivo X');
        });
    });
});
