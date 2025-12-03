/**
 * Hook personalizado para LocalStorage seguro
 * Utiliza el servicio de almacenamiento con encriptación
 */
import { useEffect, useState } from "react";
import { storageService } from "../services/storageService.js";
import { logger } from "../utils/errorHandler.js";

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      // Intentar cargar desde storage seguro
      const stored = storageService.get(key);

      if (stored !== null) {
        return stored;
      }

      // Si no existe, usar valor inicial
      return initialValue;
    } catch (error) {
      logger.error(`useLocalStorage: Error loading ${key}`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      // Guardar en storage seguro
      storageService.set(key, value);
    } catch (error) {
      logger.error(`useLocalStorage: Error saving ${key}`, error);
      // Si falla (ej: cuota excedida), notificar al usuario
      if (error.message.includes('cuota') || error.message.includes('quota')) {
        alert('Error: Se ha excedido el límite de almacenamiento. Algunos datos no se guardaron.');
      }
    }
  }, [key, value]);

  return [value, setValue];
}

