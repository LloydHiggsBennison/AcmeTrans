# 🚛 AcmeTrans - Sistema de Gestión de Transporte

Sistema corporativo de gestión de transporte y logística construido con **React 19** y **Vite**. Implementa las mejores prácticas de seguridad según **OWASP Top 10** e **ISO 27001**.

## ✨ Características

### 🔒 Seguridad
- ✅ **Content Security Policy (CSP)** - Prevención XSS
- ✅ **Sanitización de entradas** - Protección contra inyección
- ✅ **Validación de datos** - Schemas robustos de validación
- ✅ **Encriptación LocalStorage** - Datos protegidos en cliente
- ✅ **Rate Limiting** - Protección contra abuso
- ✅ **Audit Log** - Trazabilidad completa de acciones
- ✅ **Headers de seguridad HTTP** - X-Frame-Options, X-XSS-Protection, etc.
- ✅ **Manejo seguro de errores** - Sin exposición de información sensible

### 📦 Funcionalidades
- **Dashboard** - Vista general de operaciones
- **Conductores** - Gestión completa de conductores y disponibilidad
- **Viajes** - Creación, seguimiento y administración de viajes
- **Rutas** - Calculador de rutas con integración OSRM
- **Cotizaciones** - Sistema de cotización y aprobación
- **Calendario** - Visualización y gestión de agendas
- **Seguimiento** - Tracking en tiempo real de viajes
- **Reportes** - Métricas y estadísticas de operaciones

### 🏗️ Arquitectura
- **Lazy Loading** - Code splitting para mejor rendimiento
- **Servicios de negocio** - Lógica centralizada y reutilizable
- **Almacenamiento seguro** - Wrapper sobre LocalStorage con encriptación
- **Validación centralizada** - Schemas de validación consistentes
- **Logger y Audit Trail** - Sistema completo de logging

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 18+ 
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/LloydHiggsBennison/AcmeTrans

# Navegar al directorio
cd corporativa-acmetrans

# Instalar dependencias
npm install
```

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# La aplicación estará disponible en http://localhost:5173
```

### Producción

```bash
# Construir para producción
npm run build

# Previsualizar build
npm run preview

# Ejecutar linter
npm run lint
```

## 📁 Estructura del Proyecto

```
AcmeTrans-master/
├── src/
│   ├── config/
│   │   └── constants.js          # Configuración centralizada
│   ├── services/
│   │   ├── storageService.js     # Almacenamiento seguro
│   │   ├── conductorService.js   # Lógica de conductores
│   │   └── viajeService.js       # Lógica de viajes
│   ├── utils/
│   │   ├── security.js           # Utilidades de seguridad
│   │   ├── validation.js         # Validación de datos
│   │   ├── errorHandler.js       # Manejo de errores
│   │   ├── routeEstimator.js     # Estimación de rutas
│   │   └── capacity.js           # Cálculo de capacidad
│   ├── hooks/
│   │   └── useLocalStorage.js    # Hook de almacenamiento
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── SolicitudModal.jsx
│   │   └── AsignarViajeModal.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   ├── Conductores.jsx
│   │   ├── Viajes.jsx
│   │   ├── Rutas.jsx
│   │   ├── Calendario.jsx
│   │   ├── Seguimiento.jsx
│   │   ├── Reportes.jsx
│   │   └── Director.jsx
│   ├── data/
│   │   └── seed.js               # Datos iniciales
│   ├── App.jsx                   # Componente principal
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Estilos globales
├── index.html                    # HTML con CSP
├── vite.config.js                # Configuración Vite
└── package.json
```

## 🔐 Seguridad

### Cumplimiento OWASP Top 10

| Vulnerabilidad | Mitigación |
|----------------|------------|
| A01:2021 - Broken Access Control | Validación de permisos en acciones críticas |
| A02:2021 - Cryptographic Failures | Encriptación de datos sensibles en LocalStorage |
| A03:2021 - Injection | Sanitización completa de entradas |
| A04:2021 - Insecure Design | Arquitectura con separación de responsabilidades |
| A05:2021 - Security Misconfiguration | CSP, headers HTTP, configuración segura |
| A06:2021 - Vulnerable Components | Dependencias actualizadas |
| A07:2021 - Identification Failures | Sistema preparado para autenticación |
| A08:2021 - Data Integrity Failures | Validación de datos en todas las capas |
| A09:2021 - Logging Failures | Logger y Audit Trail implementados |
| A10:2021 - SSRF | Validación de URLs externas |

### ISO 27001 - Controles Implementados

- **A.8.2** - Protección de datos sensibles
- **A.9.2** - Gestión de acceso de usuarios (preparado)
- **A.12.1** - Procedimientos operativos seguros
- **A.12.4** - Logging y monitoreo
- **A.14.1** - Requisitos de seguridad en desarrollo

## 🛠️ Tecnologías

- **React 19.2** - Framework UI
- **Vite 7.2** - Build tool y dev server
- **jsPDF 3.0** - Generación de PDFs
- **OSRM** - Cálculo de rutas
- **Nominatim** - Geocodificación

## 📊 Características de Rendimiento

- ⚡ **Code Splitting** - Carga diferida de páginas
- 📦 **Bundle Optimization** - Chunks separados para vendors
- 🗜️ **Minification** - Terser en producción
- 🚀 **Tree Shaking** - Eliminación de código muerto
- 💾 **Caching** - Optimización de headers

## 🧪 Testing

```bash
# Ejecutar linter
npm run lint

# Build de producción (valida sintaxis)
npm run build
```

## 📝 Validación de Datos

Todos los formularios implementan validación en múltiples capas:

1. **Validación de cliente** - Feedback inmediato
2. **Sanitización** - Prevención XSS
3. **Schemas de validación** - Reglas de negocio
4. **Validación de servicios** - Lógica de negocio

### Ejemplo de uso:

```javascript
import { validateConductor } from './utils/validation.js';
import { ConductorService } from './services/conductorService.js';

// Validar y crear conductor
try {
  const conductor = ConductorService.create(formData, existingConductores);
  // Éxito
} catch (error) {
  // Manejar errores de validación
  console.error(error.message);
}
```

## 🔍 Audit Log

El sistema registra todas las acciones críticas:

```javascript
import { auditLog } from './utils/errorHandler.js';

// Las acciones se registran automáticamente
auditLog.log('CREATE', 'Conductor', { id: 123, nombre: 'Juan Pérez' });

// Consultar logs
const logs = auditLog.getEntries();
const filtered = auditLog.getFiltered({ action: 'CREATE', entity: 'Conductor' });
```

## 🌐 APIs Externas

### OSRM (Rutas)
- Endpoint: `https://router.project-osrm.org`
- Uso: Cálculo de rutas y distancias
- Rate Limit: Implementado en cliente

### Nominatim (Geocoding)  
- Endpoint: `https://nominatim.openstreetmap.org`
- Uso: Búsqueda de coordenadas
- Rate Limit: Implementado en cliente

## 📄 Licencia

Proyecto AcmeTrans.

## 👥 Contribución

Para contribuir al proyecto:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

**⚠️ IMPORTANTE**: Este sistema maneja datos de operaciones de transporte. Asegúrese de seguir las políticas de seguridad de la organización al desplegar en producción.

**🔒 Seguridad en Producción**:
- Habilite HTTPS
- Configure CSP apropiado para el dominio
- Implemente autenticación de usuarios
- Configure backups regulares
- Monitoree los logs de auditoría
- Actualice dependencias regularmente
