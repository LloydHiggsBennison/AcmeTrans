import { describe, it, expect, beforeEach } from 'vitest';
import { ConductorService } from '../src/services/conductorService';
import { ESTADOS } from '../src/config/constants';

describe('ConductorService', () => {
    let conductoresMock;

    beforeEach(() => {
        conductoresMock = [];
    });

    describe('create', () => {
        it('debería crear un conductor válido', () => {
            const conductorData = {
                nombre: 'Juan Perez',
                rut: '12.345.678-9',
                licencia: 'A5',
                origen: 'Santiago',
                telefono: '+56 9 1234 5678'
            };

            const nuevo = ConductorService.create(conductorData, conductoresMock);

            expect(nuevo.id).toBe(1);
            expect(nuevo.estado).toBe(ESTADOS.CONDUCTOR.DISPONIBLE);
            expect(nuevo.nombre).toBe('Juan Perez');
        });
    });

    describe('isAvailable', () => {
        it('debería retornar true si está disponible y sin bloqueos', () => {
            const conductor = { estado: ESTADOS.CONDUCTOR.DISPONIBLE, bloqueos: [] };
            expect(ConductorService.isAvailable(conductor, '2023-12-01')).toBe(true);
        });

        it('debería retornar false si está inactivo', () => {
            const conductor = { estado: ESTADOS.CONDUCTOR.INACTIVO };
            expect(ConductorService.isAvailable(conductor, '2023-12-01')).toBe(false);
        });

        it('debería retornar false si tiene bloqueo en la fecha', () => {
            const conductor = {
                estado: ESTADOS.CONDUCTOR.DISPONIBLE,
                bloqueos: [{ fecha: '2023-12-01' }]
            };
            expect(ConductorService.isAvailable(conductor, '2023-12-01')).toBe(false);
        });
    });

    describe('isAvailableForRange', () => {
        const conductor = { id: 1, estado: ESTADOS.CONDUCTOR.DISPONIBLE };

        it('debería detectar conflicto con viaje existente', () => {
            const viajes = [{
                conductorId: 1,
                fecha: '2023-12-01',
                fechaRetorno: '2023-12-05',
                estado: ESTADOS.VIAJE.PENDIENTE
            }];

            const disponible = ConductorService.isAvailableForRange(
                conductor,
                '2023-12-02',
                '2023-12-03',
                viajes
            );

            expect(disponible).toBe(false);
        });

        it('debería estar disponible si no hay conflictos', () => {
            const disponible = ConductorService.isAvailableForRange(
                conductor,
                '2023-12-01',
                '2023-12-05',
                []
            );
            expect(disponible).toBe(true);
        });
    });

    describe('assignTrip', () => {
        it('debería cambiar estado a OCUPADO', () => {
            const conductor = { id: 1, estado: ESTADOS.CONDUCTOR.DISPONIBLE };
            const actualizado = ConductorService.assignTrip(conductor, {});
            expect(actualizado.estado).toBe(ESTADOS.CONDUCTOR.OCUPADO);
        });
    });

    describe('markAvailable', () => {
        it('debería cambiar estado a DISPONIBLE', () => {
            const conductor = { id: 1, estado: ESTADOS.CONDUCTOR.OCUPADO };
            const actualizado = ConductorService.markAvailable(conductor);
            expect(actualizado.estado).toBe(ESTADOS.CONDUCTOR.DISPONIBLE);
        });
    });
});
