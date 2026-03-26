/**
 * Storage - Almacenamiento local para favoritos, progreso y configuraciones
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys de storage
export const StorageKeys = {
  LIBRARY: 'library',
  READING_PROGRESS: 'reading_progress',
  FAVORITES: 'favorites',
  RECENT_SEARCHES: 'recent_searches',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Helper functions para trabajar con objetos JSON
export const storageUtils = {
  // Guardar objeto como JSON
  setObject: async <T>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  // Obtener objeto desde JSON
  getObject: async <T>(key: string): Promise<T | null> => {
    const value = await AsyncStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  // Guardar string
  setString: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },

  // Obtener string
  getString: async (key: string): Promise<string | null> => {
    return await AsyncStorage.getItem(key);
  },

  // Guardar número
  setNumber: async (key: string, value: number): Promise<void> => {
    await AsyncStorage.setItem(key, value.toString());
  },

  // Obtener número
  getNumber: async (key: string): Promise<number | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? parseFloat(value) : null;
  },

  // Guardar boolean
  setBoolean: async (key: string, value: boolean): Promise<void> => {
    await AsyncStorage.setItem(key, value.toString());
  },

  // Obtener boolean
  getBoolean: async (key: string): Promise<boolean | null> => {
    const value = await AsyncStorage.getItem(key);
    return value ? value === 'true' : null;
  },

  // Eliminar key
  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },

  // Verificar si existe una key
  contains: async (key: string): Promise<boolean> => {
    const value = await AsyncStorage.getItem(key);
    return value !== null;
  },

  // Limpiar todo el storage (usar con cuidado)
  clearAll: async (): Promise<void> => {
    await AsyncStorage.clear();
  },

  // Obtener todas las keys
  getAllKeys: async (): Promise<readonly string[]> => {
    return await AsyncStorage.getAllKeys();
  },
};

export default AsyncStorage;
