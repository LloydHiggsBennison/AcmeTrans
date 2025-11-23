// src/utils/capacity.js
// Capacidades de referencia para cada tipo de camión
// (puedes ajustar estos valores si tu profe pide otros)

export const CAPACIDAD_CAMION = {
  GC: {
    // Camión de Gran Capacidad
    pesoKg: 28000, // 28 toneladas
    volumenM3: 60,
  },
  MC: {
    // Camión de Mediana Capacidad
    pesoKg: 14000, // 14 toneladas
    volumenM3: 35,
  },
};

/**
 * Calcula cuántos camiones se requieren según el tipo, peso y volumen.
 * Devuelve:
 *  - camiones: número mínimo de camiones necesarios
 *  - valido: true/false según si hay una capacidad definida para ese tipo
 */
export function calcularCamionesNecesarios(tipoCamion, pesoKg, volumenM3) {
  const cap = CAPACIDAD_CAMION[tipoCamion];
  if (!cap) return { camiones: 1, valido: false };

  const peso = Math.max(0, Number(pesoKg) || 0);
  const volumen = Math.max(0, Number(volumenM3) || 0);

  const porPeso = peso > 0 ? Math.ceil(peso / cap.pesoKg) : 1;
  const porVolumen = volumen > 0 ? Math.ceil(volumen / cap.volumenM3) : 1;

  const camiones = Math.max(porPeso, porVolumen, 1);
  const valido = camiones >= 1;

  return { camiones, valido };
}
