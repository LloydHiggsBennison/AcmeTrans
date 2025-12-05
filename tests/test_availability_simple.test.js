import { describe, it, expect } from 'vitest';
import { ConductorService } from '../src/services/conductorService';
import { ESTADOS } from '../src/config/constants';

describe('ConductorService - Disponibilidad Simple', () => {

    it('debería retornar true si el conductor está disponible', () => {
        console.log('--- Test: Conductor disponible ---');
        const conductor = {
            id: 1,
            estado: ESTADOS.CONDUCTOR.DISPONIBLE,
            bloqueos: []
        };
        const fecha = '2023-10-27';
        console.log(`Verificando disponibilidad para conductor ${conductor.id} en fecha ${fecha}`);
        const resultado = ConductorService.isAvailable(conductor, fecha);
        console.log(`Resultado esperado: true, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(true);
    });

    it('debería retornar false si el conductor está inactivo', () => {
        console.log('--- Test: Conductor inactivo ---');
        const conductor = {
            id: 2,
            estado: ESTADOS.CONDUCTOR.INACTIVO,
            bloqueos: []
        };
        const fecha = '2023-10-27';
        console.log(`Verificando disponibilidad para conductor inactivo ${conductor.id}`);
        const resultado = ConductorService.isAvailable(conductor, fecha);
        console.log(`Resultado esperado: false, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(false);
    });

    it('debería retornar false si el conductor tiene un bloqueo clásico/legacy en la fecha indicada', () => {
        console.log('--- Test: Bloqueo legacy ---');
        const fecha = '2023-10-27';
        const conductor = {
            id: 3,
            estado: ESTADOS.CONDUCTOR.DISPONIBLE,
            bloqueos: [{ fecha: fecha }]
        };
        console.log(`Verificando bloqueo legacy para fecha ${fecha}`);
        const resultado = ConductorService.isAvailable(conductor, fecha);
        console.log(`Resultado esperado: false, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(false);
    });

    it('debería retornar true si el conductor tiene bloqueos pero no para la fecha indicada', () => {
        console.log('--- Test: Bloqueo en otra fecha ---');
        const fecha = '2023-10-27';
        const conductor = {
            id: 4,
            estado: ESTADOS.CONDUCTOR.DISPONIBLE,
            bloqueos: [{ fecha: '2023-10-28' }]
        };
        console.log(`Verificando disponibilidad en ${fecha} con bloqueo en otra fecha`);
        const resultado = ConductorService.isAvailable(conductor, fecha);
        console.log(`Resultado esperado: true, Resultado obtenido: ${resultado}`);
        expect(resultado).toBe(true);
    });

});
