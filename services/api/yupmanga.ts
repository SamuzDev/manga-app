/**
 * YupManga API Client - Web Scraping
 * https://www.yupmanga.com/
 */

import axios, { AxiosInstance } from 'axios';
import type { YupMangaSeries, YupVolume, YupSearchResult, YupSeriesListItem } from '@/types/yupmanga';

const BASE_URL = 'https://www.yupmanga.com';

interface VolumePages {
  pages: string[];
  totalPages: number;
  token: string;
}

class YupMangaAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });
  }

  private parseSeriesId(url: string): string {
    const match = url.match(/series\.php\?id=([^&]+)/);
    return match ? match[1] : url;
  }

  private parseChapterId(url: string): string {
    const match = url.match(/chapter=([^&]+)/);
    return match ? match[1] : '';
  }

  private extractCoverFromJsonLd(html: string): { coverUrl: string; chapters: Array<{ id: string; title: string; number: string; url: string }> } {
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (!jsonLdMatch) {
      return { coverUrl: '', chapters: [] };
    }

    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      const coverUrl = jsonLd.image || '';
      const chapters: Array<{ id: string; title: string; number: string; url: string }> = [];

      if (jsonLd.episode) {
        jsonLd.episode.forEach((ep: any) => {
          const url = ep.url || '';
          const chapterId = this.parseChapterId(url);
          chapters.push({
            id: chapterId,
            title: ep.name || '',
            number: this.extractVolumeNumber(ep.name || ''),
            url,
          });
        });
      }

      return { coverUrl, chapters };
    } catch {
      return { coverUrl: '', chapters: [] };
    }
  }

  private extractVolumeNumber(title: string): string {
    const match = title.match(/Tomo\s*-\s*(\d+)/i);
    return match ? match[1] : '0';
  }

  private parseSeriesFromHtml(html: string, seriesId: string): YupMangaSeries | null {
    const { coverUrl, chapters } = this.extractCoverFromJsonLd(html);
    
    const titleMatch = html.match(/<h1[^>]*class="[^"]*font-bold[^"]*"[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descriptionMatch = html.match(/<p[^>]*id="synopsisText"[^>]*>([\s\S]*?)<\/p>/);
    const description = descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const statusMatch = html.match(/<i[^>]*class="[^"]*fa-circle-check[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const statusStr = statusMatch ? statusMatch[1].trim().toLowerCase() : '';
    const status = statusStr.includes('finalizado') ? 'completed' : 
                   statusStr.includes('activo') ? 'ongoing' : 
                   statusStr.includes('hiato') ? 'hiatus' : 'ongoing';

    const authorMatch = html.match(/<i[^>]*class="[^"]*fa-user[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const author = authorMatch ? authorMatch[1].trim() : '';

    const directionMatch = html.match(/<i[^>]*class="[^"]*fa-arrow-down[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const readingDirection = directionMatch ? directionMatch[1].trim() : 'Webtoon';

    const genres: string[] = [];
    const genreMatches = html.matchAll(/<a[^>]*href="\/genero\/[^"]*"[^>]*>([^<]+)<\/a>/g);
    for (const match of genreMatches) {
      genres.push(match[1].trim());
    }

    const tags: string[] = [];
    const tagMatches = html.matchAll(/<a[^>]*href="\/tag\/[^"]*"[^>]*>([^<]+)<\/a>/g);
    for (const match of tagMatches) {
      tags.push(match[1].trim());
    }

    const ratingMatch = html.match(/<button[^>]*id="ratingButton"[^>]*class="[^"]*bg-green[^"]*"[^>]*>\s*(\d+(?:\.\d+)?)\s*<\/button>/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    const volumes: YupVolume[] = chapters.map((ch) => ({
      id: ch.id,
      title: ch.title,
      number: ch.number,
      coverUrl: coverUrl,
      pages: 0,
      publishedDate: '',
    }));

    return {
      id: seriesId,
      title,
      coverUrl,
      description,
      status: status as YupMangaSeries['status'],
      genres,
      tags,
      author,
      readingDirection,
      rating,
      totalVolumes: volumes.length,
      volumes,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getSeriesById(seriesId: string): Promise<YupMangaSeries> {
    const response = await this.client.get(`/series.php?id=${seriesId}`);
    const series = this.parseSeriesFromHtml(response.data, seriesId);
    
    if (!series) {
      throw new Error('No se pudo obtener la información de la serie');
    }

    return series;
  }

  async getPopularSeries(page = 1): Promise<YupSeriesListItem[]> {
    const response = await this.client.get('/');
    return this.parseSeriesListFromHtml(response.data);
  }

  async searchSeries(query: string): Promise<YupSearchResult[]> {
    const searchUrl = `/busqueda-avanzada?q=${encodeURIComponent(query)}`;
    const response = await this.client.get(searchUrl);
    return this.parseSearchResultsFromHtml(response.data);
  }

  async getVolumePages(volumeId: string): Promise<VolumePages> {
    try {
      // Primero obtenemos el reader para extraer el token y el número de páginas
      const readerUrl = `/reader_v2.php?chapter=${volumeId}&page=1`;
      const response = await this.client.get(readerUrl);
      const html = response.data;
      
      // Extraer el token de la URL de las imágenes
      const tokenMatch = html.match(/token=([^&"]+)/);
      const token = tokenMatch ? tokenMatch[1] : '';
      
      // Extraer el número total de páginas
      const totalPagesMatch = html.match(/Página\s+\d+\s+de\s+(\d+)/);
      const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1], 10) : 0;
      
      // Generar las URLs de las páginas con el token
      const pages: string[] = [];
      for (let i = 1; i <= totalPages; i++) {
        pages.push(`${BASE_URL}/image-proxy-v2.php?chapter=${volumeId}&page=${i}&token=${token}&context=reader`);
      }
      
      return { pages, totalPages, token };
    } catch (error) {
      console.error('Error getting volume pages:', error);
      return { pages: [], totalPages: 0, token: '' };
    }
  }

  private parseSeriesListFromHtml(html: string): YupSeriesListItem[] {
    const series: YupSeriesListItem[] = [];
    const cardRegex = /<div class="comic-card group">([\s\S]*?)<\/div>\s*<\/div>/g;
    
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const cardHtml = match[1];
      
      const linkMatch = cardHtml.match(/href="([^"]*series\.php\?id=[^"]+)"/);
      const imgMatch = cardHtml.match(/src="([^"]*image-proxy[^"]*)"[^>]*>/);
      const titleMatch = cardHtml.match(/alt="([^"]+)"/);
      const countMatch = cardHtml.match(/<span[^>]*class="[^"]*text-\[11px\][^"]*"[^>]*>\s*(\d+)\s*<\/span>/);
      
      const id = linkMatch ? this.parseSeriesId(linkMatch[1]) : '';
      let title = titleMatch ? titleMatch[1] : '';
      let coverUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : '';
      
      if (coverUrl && coverUrl.startsWith('/')) {
        coverUrl = `${BASE_URL}${coverUrl}`;
      }
      
      const totalVolumes = countMatch ? parseInt(countMatch[1]) : 0;
      
      const statusMatch = cardHtml.match(/bg-green|bg-orange|bg-red/i);
      const status = statusMatch ? 
        (statusMatch[0].includes('green') ? 'finalizado' : 
         statusMatch[0].includes('orange') ? 'activo' : 'cancelado') : '';
      
      const typeMatch = cardHtml.match(/MANhwa|MANga/i);
      const type = typeMatch ? typeMatch[0].toLowerCase() : 'manga';

      if (id && title) {
        series.push({ id, title, coverUrl, status, type, totalVolumes });
      }
    }

    return series;
  }

  private parseSearchResultsFromHtml(html: string): YupSearchResult[] {
    const results: YupSearchResult[] = [];
    const cardRegex = /<div class="comic-card group">([\s\S]*?)<\/div>\s*<\/div>/g;
    
    let match;
    while ((match = cardRegex.exec(html)) !== null) {
      const cardHtml = match[1];
      
      const linkMatch = cardHtml.match(/href="([^"]*series\.php\?id=[^"]+)"/);
      const imgMatch = cardHtml.match(/src="([^"]*image-proxy[^"]*)"[^>]*>/);
      const titleMatch = cardHtml.match(/alt="([^"]+)"/);
      
      const id = linkMatch ? this.parseSeriesId(linkMatch[1]) : '';
      let title = titleMatch ? titleMatch[1] : '';
      let coverUrl = imgMatch ? imgMatch[1].replace(/&amp;/g, '&') : '';
      
      if (coverUrl && coverUrl.startsWith('/')) {
        coverUrl = `${BASE_URL}${coverUrl}`;
      }
      
      const statusMatch = cardHtml.match(/bg-green|bg-orange|bg-red/i);
      const status = statusMatch ? 
        (statusMatch[0].includes('green') ? 'finalizado' : 
         statusMatch[0].includes('orange') ? 'activo' : 'cancelado') : '';

      if (id && title) {
        results.push({ id, title, coverUrl, status });
      }
    }

    return results;
  }

  getCoverProxyUrl(chapterId: string, page: number = 1): string {
    return `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=${page}&context=cover`;
  }

  getFullUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `${BASE_URL}${path}`;
  }
}

export const yupMangaAPI = new YupMangaAPI();
export default yupMangaAPI;
