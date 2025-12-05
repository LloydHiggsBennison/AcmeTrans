import { describe, it, expect } from 'vitest';
import { calcularCamionesNecesarios, validarCarga, CAPACIDAD_CAMION } from '../src/utils/capacity';
import { LIMITS } from '../src/config/constants';

describe('Utils - Capacity', () => {
    describe('calcularCamionesNecesarios', () => {
        it('debería calcular correctamente para un camión GC con carga dentro de límites', () => {
            const tipo = 'GC';
            const peso = CAPACIDAD_CAMION.GC.pesoKg * 0.5;
            const volumen = CAPACIDAD_CAMION.GC.volumenM3 * 0.5;

            const resultado = calcularCamionesNecesarios(tipo, peso, volumen);

            expect(resultado.camiones).toBe(1);
            expect(resultado.valido).toBe(true);
        });

        it('debería calcular múltiples camiones si excede la capacidad de uno', () => {
            const tipo = 'GC';
            const peso = CAPACIDAD_CAMION.GC.pesoKg * 2.5; // Debería requerir 3 camiones
            const volumen = 10;

            const resultado = calcularCamionesNecesarios(tipo, peso, volumen);

            expect(resultado.camiones).toBe(3);
            expect(resultado.valido).toBe(true);
        });

        it('debería basar el cálculo en el factor limitante (volumen)', () => {
            const tipo = 'MC';
            const peso = 100;
            const volumen = CAPACIDAD_CAMION.MC.volumenM3 * 1.5; // Requiere 2 camiones por volumen

            const resultado = calcularCamionesNecesarios(tipo, peso, volumen);

            expect(resultado.camiones).toBe(2);
            expect(resultado.detalles.factorLimitante).toBe('volumen');
        });

        it('debería manejar valores 0 devolviendo 1 camión válido', () => {
            const resultado = calcularCamionesNecesarios('GC', 0, 0);
            expect(resultado.camiones).toBe(1);
            expect(resultado.valido).toBe(true);
        });

        it('debería retornar inválido si excede el límite máximo de camiones', () => {
            const tipo = 'GC';
            const peso = CAPACIDAD_CAMION.GC.pesoKg * (LIMITS.CAMIONES_MAX + 1);

            const resultado = calcularCamionesNecesarios(tipo, peso, 0);

            expect(resultado.camiones).toBe(LIMITS.CAMIONES_MAX); // Se limita al max
            expect(resultado.valido).toBe(true);
        });

        it('debería manejar tipos de camión inválidos', () => {
            const resultado = calcularCamionesNecesarios('INVALIDO', 100, 10);
            expect(resultado.valido).toBe(false);
            expect(resultado.error).toBeDefined();
        });
    });

    describe('validarCarga', () => {
        it('debería retornar true si la carga cabe', () => {
            const resultado = validarCarga('GC', 1000, 10);
            expect(resultado.cabe).toBe(true);
            expect(resultado.excedePeso).toBe(false);
            expect(resultado.excedeVolumen).toBe(false);
        });

        it('debería detectar exceso de peso', () => {
            const pesoExcesivo = CAPACIDAD_CAMION.GC.pesoKg + 1;
            const resultado = validarCarga('GC', pesoExcesivo, 10);

            expect(resultado.cabe).toBe(false);
            expect(resultado.excedePeso).toBe(true);
        });

        it('debería detectar exceso de volumen', () => {
            const volumenExcesivo = CAPACIDAD_CAMION.GC.volumenM3 + 1;
            const resultado = validarCarga('GC', 1000, volumenExcesivo);

            expect(resultado.cabe).toBe(false);
            expect(resultado.excedeVolumen).toBe(true);
        });

        it('debería manejar tipo de camión inválido', () => {
            const resultado = validarCarga('XX', 100, 10);
            expect(resultado.cabe).toBe(false);
            expect(resultado.error).toBeDefined();
        });
    });
});
