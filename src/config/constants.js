/**
 * Constantes de configuración centralizada
 * @module config/constants
 */

// ============================================
// LÍMITES Y VALIDACIÓN
// ============================================

export const LIMITS = {
  // Conductores
  CONDUCTOR_NOMBRE_MIN: 3,
  CONDUCTOR_NOMBRE_MAX: 100,
  TELEFONO_LENGTH: 12, // +56 9 XXXX XXXX

  // Viajes
  DISTANCIA_MIN: 1,
  DISTANCIA_MAX: 5000, // km
  DURACION_MIN: 0.5,
  DURACION_MAX: 72, // horas
  PESO_MIN: 1,
  PESO_MAX: 50000, // kg
  VOLUMEN_MIN: 0.1,
  VOLUMEN_MAX: 100, // m³
  CAMIONES_MIN: 1,
  CAMIONES_MAX: 10,

  // LocalStorage
  STORAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB

  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 60,
  MAX_ROUTE_CALCULATIONS_PER_HOUR: 100,
};

// ============================================
// CAPACIDADES DE CAMIONES
// ============================================

export const TRUCK_TYPES = {
  GC: {
    nombre: 'Gran Camión',
    capacidadKg: 28000,
    capacidadM3: 60,
    codigo: 'GC',
  },
  MC: {
    nombre: 'Mediano Camión',
    capacidadKg: 14000,
    capacidadM3: 35,
    codigo: 'MC',
  },
};

// ============================================
// ESTADOS
// ============================================

export const ESTADOS = {
  CONDUCTOR: {
    DISPONIBLE: 'disponible',
    OCUPADO: 'ocupado',
    INACTIVO: 'inactivo',
  },
  VIAJE: {
    PENDIENTE: 'pendiente',
    EN_CURSO: 'en-curso',
    COMPLETADO: 'completado',
    CANCELADO: 'cancelado',
  },
  SOLICITUD: {
    NUEVO: 'nuevo',
    EN_CURSO: 'en-curso',
    COMPLETADO: 'completado',
    RECHAZADO: 'rechazado',
  },
  COTIZACION: {
    PENDIENTE: 'pendiente',
    APROBADA: 'aprobada',
    RECHAZADA: 'rechazada',
  },
};

// ============================================
// TARIFAS Y COSTOS
// ============================================

export const TARIFAS = {
  GC: {
    baseKm: 550,
    combustibleKm: 450,
    peajeKm: 120,
    mantencionKm: 180,
  },
  MC: {
    baseKm: 380,
    combustibleKm: 280,
    peajeKm: 80,
    mantencionKm: 120,
  },
  MARGEN: 0.18,
  IVA: 0.19,
};

// ============================================
// MENSAJES DE ERROR
// ============================================

export const ERROR_MESSAGES = {
  // Validación general
  REQUIRED_FIELD: 'Este campo es obligatorio',
  INVALID_FORMAT: 'Formato inválido',

  // Conductores
  CONDUCTOR_NOMBRE_INVALID: `El nombre debe tener entre ${LIMITS.CONDUCTOR_NOMBRE_MIN} y ${LIMITS.CONDUCTOR_NOMBRE_MAX} caracteres`,
  CONDUCTOR_TELEFONO_INVALID: 'El teléfono debe tener el formato +56 9 XXXX XXXX',
  CONDUCTOR_LICENCIA_INVALID: 'La licencia debe ser A4 o A5',

  // Viajes
  DISTANCIA_INVALID: `La distancia debe estar entre ${LIMITS.DISTANCIA_MIN} y ${LIMITS.DISTANCIA_MAX} km`,
  DURACION_INVALID: `La duración debe estar entre ${LIMITS.DURACION_MIN} y ${LIMITS.DURACION_MAX} horas`,
  PESO_INVALID: `El peso debe estar entre ${LIMITS.PESO_MIN} y ${LIMITS.PESO_MAX} kg`,
  VOLUMEN_INVALID: `El volumen debe estar entre ${LIMITS.VOLUMEN_MIN} y ${LIMITS.VOLUMEN_MAX} m³`,
  CAMIONES_INVALID: `La cantidad de camiones debe estar entre ${LIMITS.CAMIONES_MIN} y ${LIMITS.CAMIONES_MAX}`,

  // LocalStorage
  STORAGE_QUOTA_EXCEEDED: 'Se ha excedido el límite de almacenamiento',
  STORAGE_CORRUPT_DATA: 'Los datos almacenados están corruptos',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Has excedido el límite de solicitudes. Intenta nuevamente en unos minutos.',

  // General
  UNEXPECTED_ERROR: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
};

// ============================================
// EXPRESIONES REGULARES
// ============================================

export const REGEX = {
  TELEFONO_CHILE: /^\+56\s9\s?[\d\s]{6,12}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  SOLO_LETRAS: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/,
  SOLO_NUMEROS: /^\d+$/,
  ALFANUMERICO: /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/,
};

// ============================================
// CONFIGURACIÓN DE SEGURIDAD
// ============================================

export const SECURITY_CONFIG = {
  // CSP
  ALLOWED_ORIGINS: [
    "'self'",
    'https://router.project-osrm.org',
    'https://nominatim.openstreetmap.org',
  ],

  // Encryption
  ENCRYPTION_ENABLED: true,
  ENCRYPTION_KEY_PREFIX: 'acmetrans_secure_',

  // Audit Log
  AUDIT_LOG_ENABLED: true,
  MAX_AUDIT_ENTRIES: 1000,

  // Session
  SESSION_TIMEOUT_MINUTES: 30,
};

// ============================================
// API ENDPOINTS
// ============================================

export const API_ENDPOINTS = {
  OSRM_ROUTE: 'https://router.project-osrm.org/route/v1/driving',
  NOMINATIM_SEARCH: 'https://nominatim.openstreetmap.org/search',
};

// ============================================
// CONFIGURACIÓN DE APLICACIÓN
// ============================================

export const APP_CONFIG = {
  NAME: 'AcmeTrans',
  VERSION: '1.0.0',
  ENVIRONMENT: (import.meta.env && import.meta.env.MODE) || 'development',
  DEBUG: (import.meta.env && import.meta.env.DEV) || false,
};
