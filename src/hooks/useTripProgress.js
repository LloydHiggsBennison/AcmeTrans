/**
 * Custom hook para calcular el progreso de viajes en tiempo real
 * @module hooks/useTripProgress
 */

import { useState, useEffect, useRef } from 'react';

/**
 * Hook que calcula y actualiza el progreso de viajes en tiempo real
 * @param {Array} viajes - Array de viajes en curso
 * @param {number} updateInterval - Intervalo de actualización en milisegundos (default: 10000 = 10 segundos)
 * @returns {Array} Array de objetos con viaje y métricas calculadas
 */
export function useTripProgress(viajes, updateInterval = 10000) {
    const [viajesConMetrics, setViajesConMetrics] = useState([]);
    const viajesRef = useRef(viajes);

    // Actualizar ref cuando viajes cambia
    useEffect(() => {
        viajesRef.current = viajes;
    }, [viajes]);

    useEffect(() => {
        // Función para calcular el progreso de un viaje
        const calcularProgreso = (viaje) => {
            if (!viaje.inicio || !viaje.distanciaKm || !viaje.duracionHoras) {
                return {
                    distanciaRecorrida: 0,
                    horasTranscurridas: 0,
                    distanciaRestante: viaje.distanciaKm || 0,
                    horasRestantes: viaje.duracionHoras || 0
                };
            }

            const inicioTime = new Date(viaje.inicio).getTime();
            const ahora = Date.now();
            const tiempoTranscurrido = ahora - inicioTime;

            const horasTranscurridas = tiempoTranscurrido / (1000 * 60 * 60);
            const velocidadPromedio = viaje.distanciaKm / viaje.duracionHoras;
            let distanciaRecorrida = velocidadPromedio * horasTranscurridas;

            distanciaRecorrida = Math.min(distanciaRecorrida, viaje.distanciaKm);
            const horasLimitadas = Math.min(horasTranscurridas, viaje.duracionHoras);

            const distanciaRestante = Math.max(0, viaje.distanciaKm - distanciaRecorrida);
            const horasRestantes = Math.max(0, viaje.duracionHoras - horasLimitadas);

            return {
                distanciaRecorrida: Math.floor(distanciaRecorrida),
                horasTranscurridas: Math.floor(horasLimitadas * 10) / 10,
                distanciaRestante: Math.floor(distanciaRestante),
                horasRestantes: Math.floor(horasRestantes * 10) / 10
            };
        };

        // Función para actualizar todos los viajes
        const actualizarViajes = () => {
            const viajesActualizados = viajesRef.current.map(viaje => ({
                viaje,
                metrics: calcularProgreso(viaje)
            }));
            setViajesConMetrics(viajesActualizados);
        };

        // Actualizar inmediatamente
        actualizarViajes();

        // Configurar intervalo de actualización
        const intervalId = setInterval(actualizarViajes, updateInterval);

        // Limpiar intervalo al desmontar
        return () => clearInterval(intervalId);
    }, [updateInterval]); // Solo depende de updateInterval

    return viajesConMetrics;
}
