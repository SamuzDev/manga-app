/**
 * Tipos TypeScript para Manga (basados en MangaDex API)
 */

// Tipos base
export interface Manga {
  id: string;
  type: 'manga';
  attributes: MangaAttributes;
  relationships: Relationship[];
}

export interface MangaAttributes {
  title: Record<string, string>; // Títulos en diferentes idiomas
  altTitles: Record<string, string>[];
  description: Record<string, string>;
  isLocked: boolean;
  links: Record<string, string>;
  originalLanguage: string;
  lastVolume: string;
  lastChapter: string;
  publicationDemographic: string | null;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  year: number | null;
  contentRating: 'safe' | 'suggestive' | 'erotica' | 'pornographic';
  tags: Tag[];
  state: string;
  chapterNumbersResetOnNewVolume: boolean;
  createdAt: string;
  updatedAt: string;
  version: number;
  availableTranslatedLanguages: string[];
  latestUploadedChapter: string;
}

export interface Tag {
  id: string;
  type: 'tag';
  attributes: {
    name: Record<string, string>;
    description: Record<string, string>;
    group: string;
    version: number;
  };
  relationships: Relationship[];
}

export interface Relationship {
  id: string;
  type: string;
  related?: string;
  attributes?: any;
}

// Chapter
export interface Chapter {
  id: string;
  type: 'chapter';
  attributes: ChapterAttributes;
  relationships: Relationship[];
}

export interface ChapterAttributes {
  title: string | null;
  volume: string | null;
  chapter: string | null;
  pages: number;
  translatedLanguage: string;
  uploader: string;
  externalUrl: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  publishAt: string;
  readableAt: string;
}

// Cover
export interface Cover {
  id: string;
  type: 'cover_art';
  attributes: {
    description: string;
    volume: string;
    fileName: string;
    locale: string;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
  relationships: Relationship[];
}

// Author/Artist
export interface Author {
  id: string;
  type: 'author' | 'artist';
  attributes: {
    name: string;
    imageUrl: string | null;
    biography: Record<string, string>;
    twitter: string | null;
    pixiv: string | null;
    melonBook: string | null;
    fanBox: string | null;
    booth: string | null;
    namicomi: string | null;
    nicoVideo: string | null;
    skeb: string | null;
    fantia: string | null;
    tumblr: string | null;
    youtube: string | null;
    weibo: string | null;
    naver: string | null;
    website: string | null;
    createdAt: string;
    updatedAt: string;
    version: number;
  };
}

// API Response types
export interface MangaListResponse {
  result: 'ok' | 'error';
  response: string;
  data: Manga[];
  limit: number;
  offset: number;
  total: number;
}

export interface MangaResponse {
  result: 'ok' | 'error';
  response: string;
  data: Manga;
}

export interface ChapterListResponse {
  result: 'ok' | 'error';
  response: string;
  data: Chapter[];
  limit: number;
  offset: number;
  total: number;
}

export interface ChapterPagesResponse {
  result: 'ok' | 'error';
  baseUrl: string;
  chapter: {
    hash: string;
    data: string[];
    dataSaver: string[];
  };
}

// Tipos locales para la app
export interface SimpleManga {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  status: string;
  year: number | null;
  tags: string[];
  contentRating: string;
}

export interface ReadingProgress {
  mangaId: string;
  lastChapterId: string;
  lastChapterNumber: string;
  lastReadAt: string;
  progress: number; // 0-100
}

export interface LibraryManga extends SimpleManga {
  addedAt: string;
  category: 'reading' | 'completed' | 'plan_to_read' | 'on_hold' | 'dropped';
  progress?: ReadingProgress;
}

// Filtros y búsqueda
export interface MangaFilters {
  title?: string;
  authors?: string[];
  artists?: string[];
  year?: number;
  includedTags?: string[];
  excludedTags?: string[];
  status?: ('ongoing' | 'completed' | 'hiatus' | 'cancelled')[];
  contentRating?: ('safe' | 'suggestive' | 'erotica' | 'pornographic')[];
  order?: {
    [key: string]: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

// User (para autenticación)
export interface User {
  id: string;
  username: string;
  email?: string;
  roles: string[];
}

export interface AuthResponse {
  result: 'ok' | 'error';
  token: {
    session: string;
    refresh: string;
  };
}
