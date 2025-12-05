// src/services/mapService.js
import { estimateRoute } from "../utils/routeEstimator";

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";
const OSRM_BASE_URL = "https://router.project-osrm.org/route/v1/driving";

/**
 * Busca las coordenadas de un lugar usando Nominatim
 * @param {string} lugar 
 * @returns {Promise<{lat: number, lon: number}>}
 */
export async function buscarCoordenadas(lugar) {
    try {
        const url = `${NOMINATIM_BASE_URL}?format=json&q=${encodeURIComponent(lugar + ", Chile")}`;
        const res = await fetch(url, { headers: { "Accept-Language": "es" } });
        if (!res.ok) throw new Error("Error en servicio de geocodificación");

        const data = await res.json();
        if (!Array.isArray(data) || !data.length) {
            throw new Error(`No se encontraron coordenadas para: ${lugar}`);
        }

        const { lat, lon } = data[0];
        return { lat: Number(lat), lon: Number(lon) };
    } catch (error) {
        console.error("Error buscarCoordenadas:", error);
        throw error;
    }
}

/**
 * Obtiene ruta y distancia desde OSRM
 * @param {string} origen 
 * @param {string} destino 
 * @returns {Promise<{distanciaKm: number, duracionHoras: number}>}
 */
export async function obtenerRuta(origen, destino) {
    if (!origen || !destino) {
        throw new Error("Origen y destino son requeridos");
    }

    try {
        const coordOrigen = await buscarCoordenadas(origen);
        const coordDestino = await buscarCoordenadas(destino);

        const url = `${OSRM_BASE_URL}/${coordOrigen.lon},${coordOrigen.lat};${coordDestino.lon},${coordDestino.lat}?overview=false&alternatives=false&steps=false`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Error en servicio de rutas OSRM");

        const data = await res.json();
        if (!data.routes || !data.routes.length) {
            throw new Error("No se pudo obtener ruta desde OSRM.");
        }

        const ruta = data.routes[0];
        return {
            distanciaKm: +(ruta.distance / 1000).toFixed(1),
            duracionHoras: +(ruta.duration / 3600).toFixed(1),
        };
    } catch (error) {
        console.warn("OSRM falló, usando estimación local:", error);
        // Fallback to local estimator
        return estimateRoute(origen, destino);
    }
}
