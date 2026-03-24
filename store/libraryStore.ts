/**
 * Library Store - Gestión de favoritos y biblioteca
 */

import { create } from 'zustand';
import type { LibraryManga } from '@/types/manga';
import { storageUtils, StorageKeys } from '@/services/storage/mmkv';

interface LibraryState {
  library: LibraryManga[];
  isLoading: boolean;
  
  // Actions
  loadLibrary: () => Promise<void>;
  addToLibrary: (manga: LibraryManga) => Promise<void>;
  removeFromLibrary: (mangaId: string) => Promise<void>;
  updateCategory: (mangaId: string, category: LibraryManga['category']) => Promise<void>;
  isInLibrary: (mangaId: string) => boolean;
  getByCategory: (category: LibraryManga['category']) => LibraryManga[];
  clearLibrary: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  library: [],
  isLoading: false,

  // Cargar biblioteca desde storage
  loadLibrary: async () => {
    set({ isLoading: true });
    try {
      const library = await storageUtils.getObject<LibraryManga[]>(StorageKeys.LIBRARY);
      set({ library: library || [], isLoading: false });
    } catch (error) {
      console.error('Error loading library:', error);
      set({ isLoading: false });
    }
  },

  // Agregar manga a la biblioteca
  addToLibrary: async (manga: LibraryManga) => {
    const { library } = get();
    
    // Verificar si ya existe
    const exists = library.some((m) => m.id === manga.id);
    if (exists) {
      console.log('Manga already in library');
      return;
    }

    const updatedLibrary = [
      ...library,
      { ...manga, addedAt: new Date().toISOString() },
    ];

    set({ library: updatedLibrary });
    await storageUtils.setObject(StorageKeys.LIBRARY, updatedLibrary);
  },

  // Eliminar manga de la biblioteca
  removeFromLibrary: async (mangaId: string) => {
    const { library } = get();
    const updatedLibrary = library.filter((m) => m.id !== mangaId);

    set({ library: updatedLibrary });
    await storageUtils.setObject(StorageKeys.LIBRARY, updatedLibrary);
  },

  // Actualizar categoría de un manga
  updateCategory: async (mangaId: string, category: LibraryManga['category']) => {
    const { library } = get();
    const updatedLibrary = library.map((m) =>
      m.id === mangaId ? { ...m, category } : m
    );

    set({ library: updatedLibrary });
    await storageUtils.setObject(StorageKeys.LIBRARY, updatedLibrary);
  },

  // Verificar si un manga está en la biblioteca
  isInLibrary: (mangaId: string) => {
    const { library } = get();
    return library.some((m) => m.id === mangaId);
  },

  // Obtener mangas por categoría
  getByCategory: (category: LibraryManga['category']) => {
    const { library } = get();
    return library.filter((m) => m.category === category);
  },

  // Limpiar biblioteca
  clearLibrary: async () => {
    set({ library: [] });
    await storageUtils.delete(StorageKeys.LIBRARY);
  },
}));
