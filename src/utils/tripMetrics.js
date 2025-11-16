// Calcula métricas dinámicas de un viaje según su inicio y duración.
export function getTripMetrics(viaje) {
  if (!viaje) return null;

  const inicio = viaje.inicio ? new Date(viaje.inicio) : new Date();
  const ahora = new Date();

  const transMs = Math.max(0, ahora - inicio);
  const transH = transMs / 1000 / 60 / 60;
  const totalH = viaje.duracionHoras || 1;

  const progreso = Math.min(1, transH / totalH);
  const distanciaTotal = viaje.distanciaKm || 0;
  const recorrida = distanciaTotal * progreso;
  const restante = distanciaTotal - recorrida;

  return {
    progreso, // 0–1
    velocidadPromedio:
      totalH > 0 ? Math.round((distanciaTotal / totalH) * 10) / 10 : 0,
    distanciaRecorrida: Math.round(recorrida),
    distanciaRestante: Math.max(0, Math.round(restante)),
    horasTranscurridas: transH.toFixed(1),
    horasRestantes: Math.max(0, (totalH - transH).toFixed(1)),
  };
}
