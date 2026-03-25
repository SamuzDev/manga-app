/**
 * Tipos TypeScript para YupManga
 */

export interface YupMangaSeries {
  id: string;
  title: string;
  coverUrl: string;
  description: string;
  status: 'ongoing' | 'completed' | 'hiatus' | 'cancelled';
  genres: string[];
  tags: string[];
  author: string;
  readingDirection: string;
  rating: number;
  totalVolumes: number;
  volumes: YupVolume[];
  lastUpdated: string;
}

export interface YupVolume {
  id: string;
  title: string;
  number: string;
  coverUrl: string;
  pages: number;
  publishedDate: string;
}

export interface YupVolumePage {
  volumeId: string;
  pageUrl: string;
  pageNumber: number;
  imageUrl: string;
}

export interface YupSeriesListItem {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
  type: string;
  totalVolumes: number;
}

export interface YupSearchResult {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
}
