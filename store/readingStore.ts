/**
 * Reading Store - Gestión de progreso de lectura
 */

import { create } from 'zustand';
import type { ReadingProgress } from '@/types/manga';
import { storageUtils, StorageKeys } from '@/services/storage/mmkv';

interface ReadingState {
  readingProgress: Record<string, ReadingProgress>; // Key: mangaId
  
  // Actions
  loadProgress: () => Promise<void>;
  updateProgress: (mangaId: string, progress: Omit<ReadingProgress, 'mangaId' | 'lastReadAt'>) => Promise<void>;
  getProgress: (mangaId: string) => ReadingProgress | undefined;
  clearProgress: (mangaId: string) => Promise<void>;
  clearAllProgress: () => Promise<void>;
}

export const useReadingStore = create<ReadingState>((set, get) => ({
  readingProgress: {},

  // Cargar progreso desde storage
  loadProgress: async () => {
    try {
      const progress = await storageUtils.getObject<Record<string, ReadingProgress>>(
        StorageKeys.READING_PROGRESS
      );
      set({ readingProgress: progress || {} });
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  },

  // Actualizar progreso de lectura
  updateProgress: async (mangaId: string, progress) => {
    const { readingProgress } = get();
    
    const updatedProgress: ReadingProgress = {
      mangaId,
      ...progress,
      lastReadAt: new Date().toISOString(),
    };

    const newReadingProgress = {
      ...readingProgress,
      [mangaId]: updatedProgress,
    };

    set({ readingProgress: newReadingProgress });
    await storageUtils.setObject(StorageKeys.READING_PROGRESS, newReadingProgress);
  },

  // Obtener progreso de un manga
  getProgress: (mangaId: string) => {
    const { readingProgress } = get();
    return readingProgress[mangaId];
  },

  // Limpiar progreso de un manga
  clearProgress: async (mangaId: string) => {
    const { readingProgress } = get();
    const { [mangaId]: removed, ...rest } = readingProgress;

    set({ readingProgress: rest });
    await storageUtils.setObject(StorageKeys.READING_PROGRESS, rest);
  },

  // Limpiar todo el progreso
  clearAllProgress: async () => {
    set({ readingProgress: {} });
    await storageUtils.delete(StorageKeys.READING_PROGRESS);
  },
}));
