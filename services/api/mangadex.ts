/**
 * MangaDex API Client
 * Documentación: https://api.mangadex.org/docs/
 */

import axios, { AxiosInstance } from 'axios';
import type {
  Manga,
  MangaListResponse,
  MangaResponse,
  Chapter,
  ChapterListResponse,
  ChapterPagesResponse,
  MangaFilters,
  SimpleManga,
  Cover,
} from '@/types/manga';

const BASE_URL = 'https://api.mangadex.org';
const COVER_BASE_URL = 'https://uploads.mangadex.org/covers';

class MangaDexAPI {
  private client: AxiosInstance;
  private sessionToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para añadir token a las peticiones
    this.client.interceptors.request.use((config) => {
      if (this.sessionToken) {
        config.headers.Authorization = `Bearer ${this.sessionToken}`;
      }
      return config;
    });
  }

  /**
   * Establecer tokens de autenticación
   */
  setTokens(sessionToken: string, refreshToken: string) {
    this.sessionToken = sessionToken;
    this.refreshToken = refreshToken;
  }

  /**
   * Limpiar tokens
   */
  clearTokens() {
    this.sessionToken = null;
    this.refreshToken = null;
  }

  /**
   * Login con MangaDex
   */
  async login(username: string, password: string) {
    try {
      const response = await this.client.post('/auth/login', {
        username,
        password,
      });

      if (response.data.result === 'ok') {
        this.setTokens(
          response.data.token.session,
          response.data.token.refresh
        );
        return response.data;
      } else {
        throw new Error(response.data.errors?.[0]?.detail || 'Error al iniciar sesión');
      }
    } catch (error: any) {
      if (error.response?.data?.errors?.[0]?.detail) {
        throw new Error(error.response.data.errors[0].detail);
      }
      throw new Error('Error al iniciar sesión. Verifica tus credenciales.');
    }
  }

  /**
   * Crear cuenta en MangaDex
   */
  async register(username: string, email: string, password: string) {
    try {
      const response = await this.client.post('/account/create', {
        username,
        email,
        password,
      });

      if (response.data.result === 'ok') {
        return response.data;
      } else {
        throw new Error(response.data.errors?.[0]?.detail || 'Error al registrarse');
      }
    } catch (error: any) {
      if (error.response?.data?.errors?.[0]?.detail) {
        throw new Error(error.response.data.errors[0].detail);
      }
      throw new Error('Error al crear la cuenta. Intenta de nuevo.');
    }
  }

  /**
   * Obtener información del usuario autenticado
   */
  async getMe() {
    try {
      const response = await this.client.get('/user/me');
      if (response.data.result === 'ok') {
        return response.data.data;
      }
      throw new Error('Error al obtener información del usuario');
    } catch (error) {
      throw new Error('Error al obtener información del usuario');
    }
  }

  /**
   * Logout
   */
  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Refresh token
   */
  async refreshSession() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.client.post('/auth/refresh', {
        token: this.refreshToken,
      });

      if (response.data.result === 'ok') {
        this.setTokens(
          response.data.token.session,
          response.data.token.refresh
        );
        return response.data;
      }
      throw new Error('Error al refrescar sesión');
    } catch (error) {
      this.clearTokens();
      throw new Error('Error al refrescar sesión');
    }
  }

  /**
   * Obtener lista de mangas con filtros
   */
  async getMangaList(filters?: MangaFilters): Promise<MangaListResponse> {
    const params: any = {
      limit: filters?.limit || 20,
      offset: filters?.offset || 0,
      includes: ['cover_art', 'author', 'artist'],
      contentRating: ['safe', 'suggestive'],
      'order[followedCount]': 'desc',
    };

    if (filters?.title) {
      params.title = filters.title;
    }

    if (filters?.includedTags && filters.includedTags.length > 0) {
      params.includedTags = filters.includedTags;
    }

    if (filters?.excludedTags && filters.excludedTags.length > 0) {
      params.excludedTags = filters.excludedTags;
    }

    if (filters?.status && filters.status.length > 0) {
      params.status = filters.status;
    }

    if (filters?.year) {
      params.year = filters.year;
    }

    const response = await this.client.get<MangaListResponse>('/manga', {
      params,
    });

    return response.data;
  }

  /**
   * Obtener manga por ID
   */
  async getMangaById(id: string): Promise<Manga> {
    const response = await this.client.get<MangaResponse>(`/manga/${id}`, {
      params: {
        includes: ['cover_art', 'author', 'artist'],
      },
    });
    return response.data.data;
  }

  /**
   * Obtener capítulos de un manga
   */
  async getChapters(
    mangaId: string,
    options?: {
      limit?: number;
      offset?: number;
      translatedLanguage?: string[];
    }
  ): Promise<ChapterListResponse> {
    const response = await this.client.get<ChapterListResponse>(
      `/manga/${mangaId}/feed`,
      {
        params: {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          translatedLanguage: options?.translatedLanguage || ['en', 'es'],
          'order[chapter]': 'asc',
          includes: ['scanlation_group', 'user'],
        },
      }
    );
    return response.data;
  }

  /**
   * Obtener páginas de un capítulo
   */
  async getChapterPages(chapterId: string): Promise<ChapterPagesResponse> {
    const response = await this.client.get<ChapterPagesResponse>(
      `/at-home/server/${chapterId}`
    );
    return response.data;
  }

  /**
   * Buscar manga por título
   */
  async searchManga(query: string, limit = 20): Promise<MangaListResponse> {
    return this.getMangaList({
      title: query,
      limit,
      offset: 0,
    });
  }

  /**
   * Obtener mangas populares/trending
   */
  async getPopularManga(limit = 20): Promise<MangaListResponse> {
    return this.getMangaList({
      limit,
      offset: 0,
      order: {
        followedCount: 'desc',
      },
    });
  }

  /**
   * Obtener últimas actualizaciones
   */
  async getLatestUpdates(limit = 20): Promise<MangaListResponse> {
    return this.getMangaList({
      limit,
      offset: 0,
      order: {
        latestUploadedChapter: 'desc',
      },
    });
  }

  /**
   * Convertir Manga completo a SimpleManga
   */
  mangaToSimple(manga: Manga): SimpleManga {
    const title = this.getTitle(manga.attributes.title);
    const description = this.getDescription(manga.attributes.description);
    const coverArt = manga.relationships.find((rel) => rel.type === 'cover_art');
    const coverUrl = coverArt
      ? this.getCoverUrl(manga.id, (coverArt as any).attributes?.fileName)
      : '';

    return {
      id: manga.id,
      title,
      coverUrl,
      description,
      status: manga.attributes.status,
      year: manga.attributes.year,
      tags: manga.attributes.tags.map((tag) => this.getTitle(tag.attributes.name)),
      contentRating: manga.attributes.contentRating,
    };
  }

  /**
   * Obtener título en el idioma preferido
   */
  private getTitle(titles: Record<string, string>): string {
    return titles.en || titles.es || Object.values(titles)[0] || 'Sin título';
  }

  /**
   * Obtener descripción en el idioma preferido
   */
  private getDescription(descriptions: Record<string, string>): string {
    return (
      descriptions.en ||
      descriptions.es ||
      Object.values(descriptions)[0] ||
      'Sin descripción disponible'
    );
  }

  /**
   * Construir URL de cover
   */
  getCoverUrl(mangaId: string, fileName: string, size: '256' | '512' = '512'): string {
    if (!fileName) return '';
    return `${COVER_BASE_URL}/${mangaId}/${fileName}.${size}.jpg`;
  }

  /**
   * Construir URL de página de capítulo
   */
  getPageUrl(baseUrl: string, chapterHash: string, fileName: string, quality: 'data' | 'data-saver' = 'data'): string {
    return `${baseUrl}/${quality}/${chapterHash}/${fileName}`;
  }
}

export const mangadexAPI = new MangaDexAPI();
export default mangadexAPI;
