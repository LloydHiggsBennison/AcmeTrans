# 🧪 Plan de QA y Pruebas Unitarias - AcmeTrans

Este documento detalla la estrategia de pruebas unitarias y los casos de prueba esperados para los componentes críticos del sistema AcmeTrans.

## 🛠️ Configuración Recomendada

Para ejecutar pruebas unitarias en este proyecto (Vite + React), se recomienda la siguiente configuración:

1.  **Framework de Testing**: Vitest (compatible nativamente con Vite)
2.  **Librería de Testing**: React Testing Library (para componentes)
3.  **Entorno**: JSDOM

### Instalación de Dependencias (Ejemplo)

```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom
```

---

## 📋 Casos de Prueba Unitarios

A continuación se detallan los componentes a probar, las `props` necesarias y el resultado esperado.

### 1. Componente: `SolicitudModal`

**Propósito**: Formulario para crear nuevas solicitudes de viaje.

| Caso de Prueba | Props / Configuración | Acción Simulada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Renderizado Inicial** | `isOpen={true}`, `onClose={fn}`, `onSubmit={fn}` | Renderizar componente | El modal debe ser visible. Los campos deben estar vacíos o con valores por defecto. |
| **Validación de Campos Vacíos** | `isOpen={true}` | Click en "Guardar" sin llenar datos | No se debe llamar a `onSubmit`. Deben aparecer mensajes de error en los campos requeridos (Origen, Destino, Fecha). |
| **Envío Exitoso** | `isOpen={true}`, `onSubmit={mockFn}` | Llenar todos los campos válidos y click en "Guardar" | Se debe llamar a `onSubmit` con un objeto que contenga los datos del formulario. El modal debe cerrarse (si la lógica lo dicta). |
| **Cerrar Modal** | `isOpen={true}`, `onClose={mockFn}` | Click en botón "Cancelar" o "X" | Se debe llamar a `onClose`. |

### 2. Componente: `AsignarViajeModal`

**Propósito**: Asignar un conductor y vehículo a una solicitud aprobada.

| Caso de Prueba | Props / Configuración | Acción Simulada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Mostrar Datos de Solicitud** | `isOpen={true}`, `solicitud={origen: 'Santiago', destino: 'Valpo'}` | Renderizar componente | Debe mostrar "Santiago" y "Valpo" en los detalles de la solicitud (readonly). |
| **Lista de Conductores** | `conductores={[{id: 1, nombre: 'Juan'}]}` | Abrir dropdown de conductores | Debe aparecer "Juan" en la lista de opciones. |
| **Asignación Válida** | `onSubmit={mockFn}`, `conductores={...}` | Seleccionar conductor y click "Asignar" | Se debe llamar a `onSubmit` con el ID de la solicitud y el ID del conductor seleccionado. |

### 3. Utilidad: `validation.js` (Función `validateConductor`)

**Propósito**: Validar datos del conductor antes de guardar.

| Caso de Prueba | Input (Argumentos) | Resultado Esperado |
| :--- | :--- | :--- |
| **Datos Válidos** | `{ nombre: 'Ana', licencia: 'A1', estado: 'DISPONIBLE' }` | Retorna `{ valid: true }` (o similar, sin lanzar error). |
| **Nombre Vacío** | `{ nombre: '', licencia: 'A1' }` | Lanza error o retorna `{ valid: false, error: 'Nombre requerido' }`. |
| **Licencia Inválida** | `{ nombre: 'Ana', licencia: '' }` | Lanza error indicando que la licencia es obligatoria. |

### 4. Utilidad: `capacity.js` (Función `calcularCapacidad`)

**Propósito**: Verificar si un vehículo soporta la carga/pasajeros.

| Caso de Prueba | Input (Argumentos) | Resultado Esperado |
| :--- | :--- | :--- |
| **Capacidad Suficiente** | `vehiculoCapacidad: 1000`, `cargaSolicitada: 500` | Retorna `true` (o indicador de éxito). |
| **Exceso de Carga** | `vehiculoCapacidad: 500`, `cargaSolicitada: 600` | Retorna `false` o lanza error de "Capacidad excedida". |
| **Carga Negativa** | `vehiculoCapacidad: 1000`, `cargaSolicitada: -10` | Retorna error de validación "Carga inválida". |

### 5. Componente: `Navbar`

**Propósito**: Navegación principal.

| Caso de Prueba | Props / Configuración | Acción Simulada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **Navegación Activa** | `currentPath='/viajes'` | Renderizar componente | El enlace "Viajes" debe tener la clase CSS de activo/resaltado. |
| **Links Correctos** | N/A | Click en "Dashboard" | Debe navegar a la ruta `/` (o llamar al router push). |

---

## 📝 Estructura de un Test Unitario (Ejemplo)

```javascript
// Ejemplo con Vitest + React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SolicitudModal from './SolicitudModal';

describe('SolicitudModal', () => {
  it('debe llamar a onSubmit cuando el formulario es válido', () => {
    const mockOnSubmit = vi.fn();
    render(<SolicitudModal isOpen={true} onSubmit={mockOnSubmit} onClose={() => {}} />);
    
    // Simular llenado de campos
    fireEvent.change(screen.getByLabelText(/Origen/i), { target: { value: 'Santiago' } });
    fireEvent.change(screen.getByLabelText(/Destino/i), { target: { value: 'Valparaíso' } });
    
    // Simular envío
    fireEvent.click(screen.getByText(/Guardar/i));
    
    // Verificación
    expect(mockOnSubmit).toHaveBeenCalled();
  });
});
```

## 🎯 Criterios de Aceptación para QA

1.  **Cobertura**: Al menos el 80% de las funciones críticas de negocio (servicios y utilidades) deben tener tests unitarios.
2.  **Paso de Tests**: El 100% de los tests deben pasar antes de cualquier despliegue a producción.
3.  **Independencia**: Los tests no deben depender de servicios externos reales (usar mocks para APIs).
