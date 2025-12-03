# 🧪 Plan de QA y Pruebas Unitarias - AcmeTrans

Este documento detalla la estrategia de pruebas unitarias y los casos de prueba esperados para los componentes y utilidades **reales** del sistema AcmeTrans (repositorio `corporativa-acmetrans`).  
Está alineado con la arquitectura actual del proyecto:

- Frontend **Vite + React**
- Lógica de negocio en **servicios JS** (`src/services`)
- Utilidades de validación, seguridad y capacidad en `src/utils`
- Componentes clave de interacción: `SolicitudModal`, `AsignarViajeModal`, `Navbar`, etc.

---

## 🛠️ Configuración Recomendada

Para ejecutar pruebas unitarias en este proyecto (Vite + React), se recomienda la siguiente configuración:

1. **Framework de Testing**: Vitest (compatible nativamente con Vite)
2. **Librería de Testing**: React Testing Library (para componentes)
3. **Entorno**: JSDOM

### Instalación de Dependencias (Ejemplo)

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

---

## 📋 Casos de Prueba Unitarios

A continuación se detallan los componentes y utilidades a probar, las `props` o argumentos necesarios y el resultado esperado.

---

### 1. Componente: `SolicitudModal`

**Ruta**: `src/components/SolicitudModal.jsx`  
**Propósito**: Modal para **gestionar una solicitud existente**, no para crear una nueva.  
Permite:

- Visualizar los datos de la solicitud (`origen`, `destino`, `pesoKg`, `volumenM3`, etc.).
- Calcular ruta y cotización (`🧮 Calcular ruta y cotización`).
- Asignar viaje (`📌 Asignar viaje`).
- Enviar la solicitud a Director generando cotización + evento de calendario (`🧾 Enviar a Director`).

**Props principales a testear**:

- `solicitud` (objeto con datos; si es `null`, el componente no se muestra).
- `conductores` (lista de conductores).
- `onClose`
- `onGestionar`
- `onAsignar`
- `onGenerarCotizacion`
- `onCrearEventoCalendario`

| Caso de Prueba | Props / Configuración | Acción Simulada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **No renderiza sin solicitud** | `solicitud={null}` | Render del componente | El componente retorna `null` (no hay contenido en el DOM). |
| **Muestra datos de la solicitud** | `solicitud={{ id: 1, origen: 'Santiago', destino: 'Osorno', pesoKg: 5000, volumenM3: 20 }}` + `conductores=[]` | Render | Se muestran en pantalla el ID de la solicitud, el origen y destino, peso y volumen. |
| **Filtra y ordena conductores disponibles** | `conductores` con estados mixtos (`activo` / `inactivo`) y distintos orígenes | Render | Solo se muestran conductores con `estado !== "inactivo"` y ordenados según el mapa definido en el componente (`Coquimbo` → `Santiago` → `Osorno` → otros). |
| **Error al calcular sin origen/destino** | `solicitud` sin origen o destino seleccionado en el formulario | Click en botón `🧮 Calcular ruta y cotización` | Se muestra el mensaje de error: `Debe existir origen y destino para estimar la ruta.` |
| **Calcular ruta y cotización válida** | `solicitud` con `pesoKg` y `volumenM3` dentro de los límites y `tipoCamion` seleccionado | Seleccionar origen/destino, tipo de camión y pulsar `🧮 Calcular ruta y cotización` | Se actualizan y muestran: distancia, duración, número de camiones necesarios y costos detallados (combustible, peajes, hospedaje, viáticos, total). No debe haber mensaje de error. |
| **Error al enviar a Director sin cotización** | `solicitud` válida pero sin haber ejecutado antes el cálculo | Click en `🧾 Enviar a Director` | Se muestra el mensaje de error: `Primero debes calcular la ruta y la cotización.` y no se llama a `onGenerarCotizacion`. |
| **Error al enviar a Director sin fechas** | Cotización calculada pero sin `fechaAsignacion` o `fechaRetorno` | Click en `🧾 Enviar a Director` | Se muestran los mensajes de error correspondientes a fechas faltantes o invertidas (retorno < salida) y no se llama a `onGenerarCotizacion`. |
| **Envío a Director exitoso** | `solicitud` válida, cotización calculada, fechas válidas y conductor (opcional) seleccionado | Click en `🧾 Enviar a Director` | Se llama a `onGenerarCotizacion(cotizacionData, eventoData)` con los datos esperados y luego a `onGestionar(id, { estado: "en-curso" })`. Finalmente se ejecuta `onClose`. |
| **Asignar viaje desde el modal** | Cotización calculada, fechas válidas y conductor seleccionado | Click en `📌 Asignar viaje` | Se llama a `onAsignar(id, { conductorId, fechaAsignacion, fechaRetorno, ... })` con los datos correctos y luego `onClose`. |
| **Cerrar modal con botón ✕** | `onClose={mockFn}` | Click en el botón ✕ | Se ejecuta `onClose` exactamente una vez. |

---

### 2. Componente: `AsignarViajeModal`

**Ruta**: `src/components/AsignarViajeModal.jsx`  
**Propósito**: Modal ligero para **asignar un viaje rápido a un conductor** desde la vista de conductores.

**Props principales**:

- `conductor` (objeto con al menos `origen`).
- `onClose`
- `onSave`

| Caso de Prueba | Props / Configuración | Acción Simulada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Render con datos del conductor** | `conductor={{ id: 1, nombre: "Juan", origen: "Osorno" }}` | Render | El campo de origen se inicializa en `"Osorno"` (o el origen del conductor). |
| **Actualización de estimación al cambiar origen/destino** | `conductor` válido | Cambiar `origen` y `destino` en los `<select>` | Se llama internamente a `estimateRoute` y se actualizan `distanciaKm` y `duracionHoras` mostradas en el modal. |
| **No guarda sin destino** | Dejar `destino` vacío | Submit del formulario | No se llama a `onSave` (la función retorna temprano). |
| **Guardado exitoso** | `conductor` válido, `destino` seleccionado | Cambiar `destino`, luego enviar el formulario (`submit`) | Se llama a `onSave({ origen, destino, distanciaKm, duracionHoras })` con los valores actuales del formulario. |
| **Cerrar modal** | `onClose={mockFn}` | Click en el botón "Cancelar" | Se ejecuta `onClose` y el modal debería desaparecer. |

---

### 3. Utilidad: `validation.js` – Función `validateConductor`

**Ruta**: `src/utils/validation.js`  
**Firma**: `validateConductor(conductor) : { valid, errors, sanitized }`  
**Propósito**: Validar datos del conductor antes de guardarlos o usarlos en servicios (`ConductorService`).

La función **no devuelve solo `true` o `false`**, sino un objeto de resultado:

- `valid: boolean`
- `errors: { campo: mensaje }`
- `sanitized: objetoConductorNormalizado | null`

| Caso de Prueba | Input (Argumentos) | Resultado Esperado |
| :--- | :--- | :--- |
| **Datos válidos** | `{ nombre: 'Ana Pérez', licencia: 'A4', telefono: '+56912345678', origen: 'Osorno', estado: 'DISPONIBLE' }` | `{ valid: true, errors: {}, sanitized: { ... } }` con nombre saneado, licencia en mayúsculas y teléfono normalizado. |
| **Nombre vacío** | `{ nombre: '', licencia: 'A4', telefono: '+56912345678', origen: 'Osorno' }` | `valid === false`, `errors.nombre` definido con `ERROR_MESSAGES.REQUIRED_FIELD`. |
| **Nombre con caracteres inválidos** | `{ nombre: 'Ana123', licencia: 'A4', ... }` | `valid === false` y `errors.nombre` indica que solo se permiten letras. |
| **Licencia inválida** | `{ nombre: 'Ana', licencia: 'B1', ... }` | `valid === false` y `errors.licencia === ERROR_MESSAGES.CONDUCTOR_LICENCIA_INVALID`. |
| **Teléfono chileno inválido** | `{ nombre: 'Ana', licencia: 'A4', telefono: '123', ... }` | `valid === false` y `errors.telefono === ERROR_MESSAGES.CONDUCTOR_TELEFONO_INVALID`. |
| **Origen faltante** | `{ nombre: 'Ana', licencia: 'A4', telefono: '+56912345678' }` | `valid === false` y `errors.origen === ERROR_MESSAGES.REQUIRED_FIELD`. |

---

### 4. Utilidad: `capacity.js` – Funciones `calcularCamionesNecesarios` y `validarCarga`

**Ruta**: `src/utils/capacity.js`  

#### 4.1. `calcularCamionesNecesarios(tipoCamion, pesoKg, volumenM3)`

**Propósito**: Calcular cuántos camiones se requieren y si el resultado es válido.

Retorno esperado:

```js
{
  camiones: number,
  valido: boolean,
  detalles: {
    porPeso: number,
    porVolumen: number,
    factorLimitante: 'peso' | 'volumen' | 'ninguno',
    capacidadPeso: number,
    capacidadVolumen: number,
    utilizacionPeso: number,
    utilizacionVolumen: number
  },
  error?: string
}
```

| Caso de Prueba | Input | Resultado Esperado |
| :--- | :--- | :--- |
| **Tipo de camión inválido** | `('XX', 1000, 10)` | `camiones === 1`, `valido === false` y `error === 'Tipo de camión inválido'`. |
| **Peso y volumen en 0** | `('GC', 0, 0)` | `camiones === 1`, `valido === true` y `detalles.factorLimitante === 'ninguno'`. |
| **Carga moderada dentro de límites** | `('GC', 10000, 20)` | `camiones` calculado con `porPeso` y `porVolumen` ≥ 1, `valido === true`, `detalles.factorLimitante` según el valor mayor entre `porPeso` y `porVolumen`. |
| **Exceso de camiones máximo** | Valores muy altos de peso/volumen que excedan `LIMITS.CAMIONES_MAX` | `camiones` limitado a `LIMITS.CAMIONES_MAX`, `valido` acorde a los límites y se registra advertencia en `logger`. |

#### 4.2. `validarCarga(tipoCamion, pesoKg, volumenM3)`

**Propósito**: Validar si una carga cabe en un camión específico.

Retorno esperado:

```js
{ cabe: boolean, excedePeso: boolean, excedeVolumen: boolean, error?: string }
```

| Caso de Prueba | Input | Resultado Esperado |
| :--- | :--- | :--- |
| **Capacidad suficiente** | `('GC', 10000, 20)` | `{ cabe: true, excedePeso: false, excedeVolumen: false }`. |
| **Exceso de peso** | `('GC', pesoKg` mayor que `TRUCK_TYPES.GC.capacidadKg`, volumen dentro de rango | `{ cabe: false, excedePeso: true, excedeVolumen: false }`. |
| **Exceso de volumen** | `('GC', peso dentro de rango, volumenM3` mayor que `TRUCK_TYPES.GC.capacidadM3` | `{ cabe: false, excedePeso: false, excedeVolumen: true }`. |
| **Tipo inválido** | `('ZZ', 1000, 10)` | `cabe === false` y `error === 'Tipo inválido'`. |

---

### 5. Componente: `Navbar`

**Ruta**: `src/components/Navbar.jsx`  
**Propósito**: Barra de navegación principal del sistema (Dashboard, Conductores, Rutas, Viajes, Seguimiento, Calendario, Reportes).

**Props**:

- `active` (id de la pestaña activa, por ejemplo `"dashboard"`).
- `onChange` (callback al cambiar de pestaña).
- `userRole`, `userName`
- `onLogout`

| Caso de Prueba | Configuración | Acción | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Render básico** | `active="dashboard"` | Render | Se muestran las pestañas definidas en `TABS` con sus labels y emojis. |
| **Marca pestaña activa** | `active="conductores"` | Render | La pestaña `"Conductores"` aparece con la clase o estilo de activa. |
| **Cambio de pestaña** | `onChange={mockFn}` | Click en la pestaña `"Viajes"` | Se llama a `onChange('viajes')`. |
| **Mostrar usuario y rol** | `userName="Director"`, `userRole="director"` | Render | En la parte derecha aparece el nombre del usuario y/o el rol. |
| **Logout** | `onLogout={mockFn}` | Click en el botón de cerrar sesión | Se ejecuta `onLogout`. |

---

## 🧩 Servicios y Utilidades de Negocio a Cubrir

Para cumplir el criterio de **“al menos 80% de funciones críticas de negocio con tests unitarios”**, además de los componentes y utilidades anteriores, se consideran prioritarios:

- `src/services/ViajeService`  
  - Métodos como `create`, `update`, `startTrip`, `completeTrip`, `cancelTrip`, filtros de viajes (`getByConductor`, `getByEstado`, `getActive`) y `getMetrics`, además del manejo de errores cuando la validación falla.
- `src/services/ConductorService`  
  - Métodos como `create`, `update`, `isAvailable`, `getAvailable`, `assignTrip`, `markAvailable`, manejo de bloqueos (`addBloqueo`, `removeBloqueo`) y estadísticas (`getStats`), usando `validateConductor` y `generateSecureId`.
- `src/services/authService`  
  - `login`, `logout`, recuperación de usuario actual desde `storageService`, manejo de credenciales inválidas.
- `src/utils/routeEstimator.js`  
  - Cálculo de distancias y duraciones según regiones de Chile, manejo de entradas inválidas y sanitización.
- `src/utils/tripMetrics.js`  
  - `getTripMetrics(viaje)` para calcular progreso, distancia recorrida/restante y protección frente a fechas inválidas.
- `src/utils/security.js`  
  - Funciones de sanitización de strings y números (`sanitizeString`, `sanitizeNumber`) y validadores auxiliares, además de utilidades como `checkRateLimit`, `escapeInput`, `generateSecureId`, etc.

No es necesario detallar todos los casos en este documento, pero **sí** dejar explícito que estos módulos forman parte del alcance mínimo de QA.

---

## 🧪 Ejemplo de Test Unitario (Vitest + RTL)

Ejemplo sencillo para `validateConductor`:

```js
import { describe, it, expect } from "vitest";
import { validateConductor } from "../src/utils/validation";

describe("validateConductor", () => {
  it("retorna válido con un conductor correcto", () => {
    const result = validateConductor({
      nombre: "Ana Pérez",
      licencia: "A4",
      telefono: "+56912345678",
      origen: "Osorno",
      estado: "DISPONIBLE",
    });

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
    expect(result.sanitized).toBeTruthy();
    expect(result.sanitized.nombre).toBe("Ana Pérez");
    expect(result.sanitized.licencia).toBe("A4");
  });

  it("marca errores cuando faltan campos obligatorios", () => {
    const result = validateConductor({
      nombre: "",
      licencia: "",
      telefono: "123",
      origen: "",
    });

    expect(result.valid).toBe(false);
    expect(result.errors.nombre).toBeDefined();
    expect(result.errors.licencia).toBeDefined();
    expect(result.errors.telefono).toBeDefined();
    expect(result.errors.origen).toBeDefined();
  });
});
```

---

## 🎯 Criterios de Aceptación para QA

1. **Cobertura**:  
   - Al menos el **80% de las funciones críticas de negocio** (servicios y utilidades descritos en este documento) deben tener tests unitarios implementados y medidos con un reporte de cobertura.
2. **Paso de Tests**:  
   - El **100% de los tests** deben pasar antes de cualquier despliegue a producción (por ejemplo, como requisito del pipeline de CI/CD).
3. **Independencia**:  
   - Los tests **no deben depender de servicios externos reales** (Supabase, APIs HTTP, etc.).  
   - Se deben usar **mocks** o stubs para llamadas a servicios externos y para accesos a almacenamiento (`storageService`), de forma que las pruebas sean determinísticas y reproducibles.
