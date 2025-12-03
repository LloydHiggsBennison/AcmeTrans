/**
 * Utilidad para exportar cotizaciones a Excel
 * @module utils/excelExport
 */

import * as XLSX from 'xlsx';
import { logger } from './errorHandler.js';

/**
 * Exportar cotizaciones a Excel con múltiples hojas por estado
 * @param {Array} cotizaciones - Array de cotizaciones
 * @param {Object} filtros - Filtros opcionales
 * @param {string} filtros.fechaDesde - Fecha desde (YYYY-MM-DD)
 * @param {string} filtros.fechaHasta - Fecha hasta (YYYY-MM-DD)
 * @param {string} filtros.estado - Estado de la cotización (todas/pendiente/aprobada/rechazada)
 */
export function exportarCotizacionesExcel(cotizaciones, filtros = {}) {
    try {
        // Filtrar cotizaciones según los criterios de fecha
        let cotizacionesFiltradas = [...cotizaciones];

        // Filtro por fecha
        if (filtros.fechaDesde) {
            cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
                if (!c.fechaCreacion) return false;
                const fechaCotizacion = new Date(c.fechaCreacion).toISOString().split('T')[0];
                return fechaCotizacion >= filtros.fechaDesde;
            });
        }

        if (filtros.fechaHasta) {
            cotizacionesFiltradas = cotizacionesFiltradas.filter(c => {
                if (!c.fechaCreacion) return false;
                const fechaCotizacion = new Date(c.fechaCreacion).toISOString().split('T')[0];
                return fechaCotizacion <= filtros.fechaHasta;
            });
        }

        // Separar por estado
        const aprobadas = cotizacionesFiltradas.filter(c => c.estado === 'aprobada');
        const rechazadas = cotizacionesFiltradas.filter(c => c.estado === 'rechazada');
        const pendientes = cotizacionesFiltradas.filter(c => c.estado === 'pendiente');

        // Crear libro de Excel
        const workbook = XLSX.utils.book_new();

        // Función helper para convertir cotización a fila de Excel
        const cotizacionToRow = (c) => ({
            'ID': c.id,
            'Fecha Creación': c.fechaCreacion
                ? new Date(c.fechaCreacion).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                })
                : 'N/D',
            'Estado': getEstadoLabel(c.estado),
            'Origen': c.origen || 'N/D',
            'Destino': c.destino || 'N/D',
            'Tipo Camión': c.tipoCamion || 'N/D',
            'Camiones Necesarios': c.camionesNecesarios || 1,
            'Peso (kg)': c.pesoKg || 0,
            'Volumen (m³)': c.volumenM3 || 0,
            'Distancia (km)': c.distanciaKm || 0,
            'Duración (h)': c.duracionHoras || 0,
            'Conductor ID': c.conductorId || 'Sin asignar',
            'Fecha Evento': c.fechaEvento || 'N/D',
            'Base Por Viaje': c.detalleCostos?.basePorViaje || 0,
            'Combustible': c.detalleCostos?.combustible || 0,
            'Peajes': c.detalleCostos?.peajes || 0,
            'Hospedaje': c.detalleCostos?.hospedaje || 0,
            'Viáticos': c.detalleCostos?.viaticos || 0,
            'Costo Total': c.costoTotal || 0,
            'Solicitud ID': c.solicitudId || 'N/D'
        });

        // Anchos de columna estándar
        const columnWidths = [
            { wch: 6 },   // ID
            { wch: 18 },  // Fecha Creación
            { wch: 12 },  // Estado
            { wch: 25 },  // Origen
            { wch: 25 },  // Destino
            { wch: 12 },  // Tipo Camión
            { wch: 18 },  // Camiones Necesarios
            { wch: 12 },  // Peso
            { wch: 12 },  // Volumen
            { wch: 12 },  // Distancia
            { wch: 12 },  // Duración
            { wch: 14 },  // Conductor ID
            { wch: 14 },  // Fecha Evento
            { wch: 15 },  // Base Por Viaje
            { wch: 15 },  // Combustible
            { wch: 12 },  // Peajes
            { wch: 12 },  // Hospedaje
            { wch: 12 },  // Viáticos
            { wch: 15 },  // Costo Total
            { wch: 12 }   // Solicitud ID
        ];

        // Hoja 1: Aprobadas
        if (aprobadas.length > 0) {
            const datosAprobadas = aprobadas.map(cotizacionToRow);
            const wsAprobadas = XLSX.utils.json_to_sheet(datosAprobadas);
            wsAprobadas['!cols'] = columnWidths;
            XLSX.utils.book_append_sheet(workbook, wsAprobadas, 'Aprobadas');
        }

        // Hoja 2: Rechazadas
        if (rechazadas.length > 0) {
            const datosRechazadas = rechazadas.map(cotizacionToRow);
            const wsRechazadas = XLSX.utils.json_to_sheet(datosRechazadas);
            wsRechazadas['!cols'] = columnWidths;
            XLSX.utils.book_append_sheet(workbook, wsRechazadas, 'Rechazadas');
        }

        // Hoja 3: Pendientes
        if (pendientes.length > 0) {
            const datosPendientes = pendientes.map(cotizacionToRow);
            const wsPendientes = XLSX.utils.json_to_sheet(datosPendientes);
            wsPendientes['!cols'] = columnWidths;
            XLSX.utils.book_append_sheet(workbook, wsPendientes, 'Pendientes');
        }

        // Hoja 4: Total (solo aprobadas con suma)
        if (aprobadas.length > 0) {
            const datosTotal = aprobadas.map(cotizacionToRow);

            // Calcular totales
            const totalBasePorViaje = aprobadas.reduce((sum, c) => sum + (c.detalleCostos?.basePorViaje || 0), 0);
            const totalCombustible = aprobadas.reduce((sum, c) => sum + (c.detalleCostos?.combustible || 0), 0);
            const totalPeajes = aprobadas.reduce((sum, c) => sum + (c.detalleCostos?.peajes || 0), 0);
            const totalHospedaje = aprobadas.reduce((sum, c) => sum + (c.detalleCostos?.hospedaje || 0), 0);
            const totalViaticos = aprobadas.reduce((sum, c) => sum + (c.detalleCostos?.viaticos || 0), 0);
            const totalGeneral = aprobadas.reduce((sum, c) => sum + (c.costoTotal || 0), 0);

            // Agregar fila de totales
            const filaTotal = {
                'ID': '',
                'Fecha Creación': '',
                'Estado': '',
                'Origen': '',
                'Destino': '',
                'Tipo Camión': '',
                'Camiones Necesarios': '',
                'Peso (kg)': '',
                'Volumen (m³)': '',
                'Distancia (km)': '',
                'Duración (h)': '',
                'Conductor ID': '',
                'Fecha Evento': 'TOTAL',
                'Base Por Viaje': totalBasePorViaje,
                'Combustible': totalCombustible,
                'Peajes': totalPeajes,
                'Hospedaje': totalHospedaje,
                'Viáticos': totalViaticos,
                'Costo Total': totalGeneral,
                'Solicitud ID': ''
            };

            datosTotal.push(filaTotal);

            const wsTotal = XLSX.utils.json_to_sheet(datosTotal);
            wsTotal['!cols'] = columnWidths;

            XLSX.utils.book_append_sheet(workbook, wsTotal, 'Total');
        }

        // Si no hay datos, crear una hoja vacía con mensaje
        if (workbook.SheetNames.length === 0) {
            const wsVacia = XLSX.utils.json_to_sheet([
                { 'Mensaje': 'No hay cotizaciones que coincidan con los filtros seleccionados' }
            ]);
            XLSX.utils.book_append_sheet(workbook, wsVacia, 'Sin Datos');
        }

        // Generar nombre de archivo con fecha actual
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `Cotizaciones_${fechaActual}.xlsx`;

        // Descargar archivo con opciones explícitas
        XLSX.writeFile(workbook, nombreArchivo, {
            bookType: 'xlsx',
            type: 'binary'
        });

        logger.info('Excel exported successfully', {
            total: cotizacionesFiltradas.length,
            aprobadas: aprobadas.length,
            rechazadas: rechazadas.length,
            pendientes: pendientes.length,
            filtros
        });

        return {
            success: true,
            total: cotizacionesFiltradas.length,
            nombreArchivo,
            desglose: {
                aprobadas: aprobadas.length,
                rechazadas: rechazadas.length,
                pendientes: pendientes.length
            }
        };
    } catch (error) {
        logger.error('Error exporting to Excel', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Obtener etiqueta de estado
 * @private
 */
function getEstadoLabel(estado) {
    const labels = {
        'pendiente': 'Pendiente',
        'aprobada': 'Aprobada',
        'rechazada': 'Rechazada'
    };
    return labels[estado] || estado;
}
