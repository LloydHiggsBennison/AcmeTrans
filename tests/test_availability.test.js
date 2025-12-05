import { describe, it, expect } from 'vitest';
import { ConductorService } from '../src/services/conductorService';
import { ESTADOS } from '../src/config/constants';

describe('ConductorService - Disponibilidad por Rango de Fechas', () => {

    const conductorBase = {
        id: 1,
        estado: ESTADOS.CONDUCTOR.DISPONIBLE,
        bloqueos: []
    };

    it('debería retornar true cuando no existen conflictos', () => {
        console.log('--- Test: Disponibilidad sin conflictos ---');
        const fechaInicio = '2023-11-01';
        const fechaFin = '2023-11-05';
        console.log(`Verificando disponibilidad para rango: ${fechaInicio} a ${fechaFin}`);
        const resultado = ConductorService.isAvailableForRange(conductorBase, fechaInicio, fechaFin);
        console.log(`Resultado esperado: true, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(true);
    });

    it('debería retornar false cuando existe traslape con un viaje', () => {
        console.log('--- Test: Conflicto con viaje ---');
        const fechaInicio = '2023-11-01';
        const fechaFin = '2023-11-05';
        const viajes = [
            {
                conductorId: 1,
                estado: ESTADOS.VIAJE.PENDIENTE,
                fecha: '2023-11-02',
                fechaRetorno: '2023-11-03'
            }
        ];
        console.log(`Verificando conflicto con viaje del ${viajes[0].fecha} al ${viajes[0].fechaRetorno}`);
        const resultado = ConductorService.isAvailableForRange(conductorBase, fechaInicio, fechaFin, viajes);
        console.log(`Resultado esperado: false, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(false);
    });

    it('debería retornar false cuando existe traslape con un evento de calendario', () => {
        console.log('--- Test: Conflicto con evento de calendario ---');
        const fechaInicio = '2023-11-01';
        const fechaFin = '2023-11-05';
        const eventos = [
            {
                conductorId: 1,
                fecha: '2023-11-04',
                fechaRetorno: '2023-11-04'
            }
        ];
        console.log(`Verificando conflicto con evento del ${eventos[0].fecha}`);
        const resultado = ConductorService.isAvailableForRange(conductorBase, fechaInicio, fechaFin, [], eventos);
        console.log(`Resultado esperado: false, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(false);
    });

    it('debería retornar true si el viaje está cancelado', () => {
        console.log('--- Test: Viaje cancelado no bloquea ---');
        const fechaInicio = '2023-11-01';
        const fechaFin = '2023-11-05';
        const viajes = [
            {
                conductorId: 1,
                estado: ESTADOS.VIAJE.CANCELADO,
                fecha: '2023-11-02',
                fechaRetorno: '2023-11-03'
            }
        ];
        console.log('Verificando que viaje cancelado sea ignorado');
        const resultado = ConductorService.isAvailableForRange(conductorBase, fechaInicio, fechaFin, viajes);
        console.log(`Resultado esperado: true, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(true);
    });

    it('debería manejar correctamente revisiones de un solo día', () => {
        console.log('--- Test: Revisión de un solo día ---');
        const fecha = '2023-11-01';
        const viajes = [
            {
                conductorId: 1,
                estado: ESTADOS.VIAJE.PENDIENTE,
                fecha: '2023-11-01',
                fechaRetorno: '2023-11-01'
            }
        ];
        console.log(`Verificando conflicto para el día ${fecha}`);
        const resultado = ConductorService.isAvailableForRange(conductorBase, fecha, fecha, viajes);
        console.log(`Resultado esperado: false, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(false);
    });

});
