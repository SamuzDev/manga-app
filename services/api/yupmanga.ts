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

  private extractCoverFromJsonLd(html: string): { coverUrl: string; chapters: Array<{ id: string; title: string; number: string; url: string; coverUrl: string }> } {
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    let coverUrl = '';
    const chapters: Array<{ id: string; title: string; number: string; url: string; coverUrl: string }> = [];
    const foundIds = new Set<string>();

    // Try to find any JavaScript data that might contain chapters
    const scriptTags = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const script of scriptTags) {
      if (script.includes('chapter') || script.includes('volumes') || script.includes('episodes')) {
        // Look for JSON-like data
        const jsonMatches = script.match(/(\[[\s\S]*?"chapter"[\s\S]*?\])/);
        if (jsonMatches) {
          try {
            const data = JSON.parse(jsonMatches[1]);
            if (Array.isArray(data)) {
              console.log('Found chapter data in script:', data.length);
              data.forEach((ch: any) => {
                const chapterId = ch.chapter || ch.id || ch.chapter_id || ch.chapterId || '';
                const number = ch.number || ch.num || ch.volume || ch.chapter || '0';
                if (chapterId && !foundIds.has(chapterId)) {
                  foundIds.add(chapterId);
                  chapters.push({
                    id: chapterId,
                    title: ch.title || ch.name || `Tomo ${number}`,
                    number: String(number),
                    url: ch.url || `/reader_v2.php?chapter=${chapterId}`,
                    coverUrl: '',
                  });
                }
              });
            }
          } catch (e) {
            // Not valid JSON, continue
          }
        }
      }
    }

    // Try multiple patterns to find the series cover image
    const coverPatterns = [
      /<img[^>]*class="[^"]*cover[^"]*"[^>]*src="([^"]+)"[^>]*>/i,
      /<img[^>]*data-src="([^"]*cover[^"]*)"[^>]*>/i,
      /cover-image["']?\s*[:=]\s*["']([^"']+)["']/i,
      /image["']?\s*[:=]\s*["']([^"']+)["']/i,
      /<img[^>]*src="([^"]*(?:cover|poster|thumbnail)[^"]*)"[^>]*>/i,
      /series-cover["']?\s*[:=]\s*["']([^"']+)["']/i,
      /"posterUrl"["']?\s*[:=]\s*["']([^"']+)["']/i,
    ];
    
    for (const pattern of coverPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let url = match[1].replace(/&amp;/g, '&');
        if (url.startsWith('/')) {
          url = BASE_URL + url;
        }
        if (url.includes('cover') || url.includes('poster') || url.includes('thumbnail') || url.includes('uploads')) {
          console.log('Cover found with pattern:', pattern.toString());
          coverUrl = url;
          break;
        }
        if (!coverUrl) {
          coverUrl = url;
        }
      }
    }
    
    // Try to find image in any img tag with significant size or specific attributes
    if (!coverUrl) {
      const imgMatch = html.match(/<img[^>]*data-src="([^"]+)"[^>]*>/i);
      if (imgMatch && imgMatch[1]) {
        coverUrl = imgMatch[1].startsWith('http') ? imgMatch[1] : BASE_URL + imgMatch[1];
        console.log('Cover from data-src:', coverUrl);
      }
    }
    
    // Also try meta tags
    if (!coverUrl) {
      const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"[^>]*>/i);
      if (ogImage) {
        coverUrl = ogImage[1];
        console.log('Cover from og:image:', coverUrl);
      }
    }
    
    // Try Twitter card image as fallback
    if (!coverUrl) {
      const twitterImage = html.match(/<meta[^>]*name="twitter:image"[^>]*content="([^"]+)"[^>]*>/i);
      if (twitterImage) {
        coverUrl = twitterImage[1];
        console.log('Cover from twitter:image:', coverUrl);
      }
    }
    
    console.log('Final coverUrl:', coverUrl);

    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        console.log('JSON-LD parsed, keys:', Object.keys(jsonLd));
        
        // Try various paths for the cover image
        if (!coverUrl) {
          coverUrl = jsonLd.image || jsonLd.thumbnailUrl || jsonLd['@image'] || 
                     jsonLd.image?.[0] || '';
        }
        console.log('JSON-LD coverUrl:', coverUrl);

        if (jsonLd.episode) {
          console.log('JSON-LD episodes found:', jsonLd.episode.length);
          jsonLd.episode.forEach((ep: any) => {
            const url = ep.url || '';
            const chapterId = this.parseChapterId(url);
            if (!foundIds.has(chapterId)) {
              foundIds.add(chapterId);
              chapters.push({
                id: chapterId,
                title: ep.name || '',
                number: this.extractVolumeNumber(ep.name || ''),
                url,
                coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
              });
            }
          });
        }
      } catch (e) {
        console.log('Error parsing JSON-LD:', e);
      }
    }

    console.log('Trying text-based chapter patterns, found so far:', chapters.length);
    
    const textPatterns = [
      /href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"[^>]*>[\s\S]*?(?:Tomo|Vol\.?|Capítulo|Ch\.?)\s*[\-:]?\s*(\d+)/gi,
      /href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/a>/gi,
      /data-chapter="([^"]+)"[^>]*>[\s\S]*?<span[^>]*>(\d+)<\/span>/gi,
      /chapter["']?\s*[:=]\s*["']?([^&"']+)[^}]*number["']?\s*[:=]\s*["']?(\d+)/gi,
      /<a[^>]+href=["'](\/reader_v2\.php\?[^"']*chapter=([^&"']+)[^"']*)["'][^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<[^>]*>(\d+)/gi,
    ];
    
    for (const pattern of textPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const fullUrl = match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        const chapterId = match[2];
        const number = match[3] || '0';
        if (!foundIds.has(chapterId)) {
          foundIds.add(chapterId);
          chapters.push({
            id: chapterId,
            title: `Tomo - ${number}`,
            number: number,
            url: fullUrl,
            coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
          });
        }
      }
    }
    console.log('Text patterns found, total:', chapters.length);

    if (chapters.length < 5) {
      console.log('Still few chapters, trying more patterns...');
      const anyChapterRegex = /href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"/gi;
      let match;
      while ((match = anyChapterRegex.exec(html)) !== null) {
        const fullUrl = match[1].replace(/&amp;/g, '&');
        const chapterId = match[2];
        if (!foundIds.has(chapterId)) {
          foundIds.add(chapterId);
          const numMatch = fullUrl.match(/chapter[=\/]([^&]+)/);
          chapters.push({
            id: chapterId,
            title: '',
            number: '',
            url: fullUrl,
            coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
          });
        }
      }
    }

    // Try to find chapters in JavaScript variables
    const jsVarPatterns = [
      /chapters\s*=\s*(\[[\s\S]*?\]);/,
      /volumes\s*=\s*(\[[\s\S]*?\]);/,
      /episodes\s*=\s*(\[[\s\S]*?\]);/,
      /chapterList\s*=\s*(\[[\s\S]*?\]);/,
      /window\.chapters\s*=\s*(\[[\s\S]*?\]);/,
      /seriesChapters\s*[:=]\s*(\[[\s\S]*?\])/,
      /allChapters\s*[:=]\s*(\[[\s\S]*?\])/,
    ];
    
    for (const jsPattern of jsVarPatterns) {
      const jsMatch = html.match(jsPattern);
      if (jsMatch && jsMatch[1]) {
        try {
          const chaptersData = JSON.parse(jsMatch[1]);
          if (Array.isArray(chaptersData)) {
            console.log('Found chapters in JS variable:', chaptersData.length);
            chaptersData.forEach((ch: any) => {
              const chapterId = ch.chapter || ch.id || ch.chapter_id || ch.chapterId || '';
              const number = ch.number || ch.num || ch.volume || ch.chapter || '0';
              if (chapterId && !foundIds.has(chapterId)) {
                foundIds.add(chapterId);
                chapters.push({
                  id: chapterId,
                  title: ch.title || ch.name || `Tomo ${number}`,
                  number: String(number),
                  url: ch.url || `/reader_v2.php?chapter=${chapterId}`,
                  coverUrl: '',
                });
              }
            });
          }
        } catch (e) {
          console.log('Failed to parse JS variable:', e);
        }
      }
    }
    
    // ULTIMATE FALLBACK: Extract ALL chapter IDs from anywhere in the HTML
    if (chapters.length < 10) {
      console.log('Trying to find ALL chapter IDs in HTML...');
      const chapterIdPattern = /[?&]chapter=([a-zA-Z0-9]+)/gi;
      let chapterMatch;
      const extractedIds = new Set<string>();
      while ((chapterMatch = chapterIdPattern.exec(html)) !== null) {
        if (chapterMatch[1].length > 5) { // Filter out short random strings
          extractedIds.add(chapterMatch[1]);
        }
      }
      console.log('Found chapter IDs in HTML:', extractedIds.size);
      
      if (extractedIds.size > chapters.length) {
        const chapterArray = Array.from(extractedIds);
        chapterArray.forEach((chapterId, index) => {
          if (!foundIds.has(chapterId)) {
            foundIds.add(chapterId);
            chapters.push({
              id: chapterId,
              title: `Tomo ${index + 1}`,
              number: String(index + 1),
              url: `/reader_v2.php?chapter=${chapterId}`,
              coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
            });
          }
        });
      }
    }
    
    // Also look for data attributes
    const dataAttrPattern = /data-chapter-id="([^"]+)"[^>]*data-chapter-num="([^"]+)"/g;
    let dataMatch;
    while ((dataMatch = dataAttrPattern.exec(html)) !== null) {
      const chapterId = dataMatch[1];
      const number = dataMatch[2];
      if (!foundIds.has(chapterId)) {
        foundIds.add(chapterId);
        chapters.push({
          id: chapterId,
          title: `Tomo ${number}`,
          number: number,
          url: `/reader_v2.php?chapter=${chapterId}`,
          coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
        });
      }
    }
    
    const chapterCardRegex = /<a[^>]+href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"[^>]*>[\s\S]*?<[^>]*>(\d+)[\s\S]*?<\/a>/gi;
    let cardMatch;
    while ((cardMatch = chapterCardRegex.exec(html)) !== null) {
      const fullUrl = cardMatch[1].replace(/&amp;/g, '&');
      const chapterId = cardMatch[2];
      const imgSrc = cardMatch[3];
      const number = cardMatch[4];
      if (!foundIds.has(chapterId)) {
        foundIds.add(chapterId);
        chapters.push({
          id: chapterId,
          title: `Tomo - ${number}`,
          number: number,
          url: fullUrl,
          coverUrl: imgSrc.startsWith('http') ? imgSrc : BASE_URL + imgSrc,
        });
      }
    }
    console.log('Chapter card regex found:', chapters.length);

    if (chapters.length < 5) {
      console.log('Few chapters found, trying more patterns...');
      const patterns = [
        /<a[^>]*href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"[^>]*>[\s\S]*?Tomo[\s\S]*?(\d+)[\s\S]*?<\/a>/gi,
        /<div[^>]*class="[^"]*chapter[^"]*"[^>]*>[\s\S]*?href="(\/reader_v2\.php\?[^"]*chapter=([^&"]+)[^"]*)"[^>]*>[\s\S]*?(\d+)[\s\S]*?<\/div>/gi,
      ];
      
      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const fullUrl = match[1].replace(/&amp;/g, '&');
          const chapterId = match[2];
          const number = match[3];
          if (!foundIds.has(chapterId)) {
            foundIds.add(chapterId);
            chapters.push({
              id: chapterId,
              title: `Tomo - ${number}`,
              number: number,
              url: fullUrl,
              coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
            });
          }
        }
      }
    }

    console.log('Trying simple link regex, found so far:', chapters.length);
    const linkRegex = /<a[^>]*href="(\/reader_v2\.php\?chapter=[^"&]+)"[^>]*>([^<]*Tomo[^<]*)<\/a>/gi;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(html)) !== null) {
      const fullUrl = linkMatch[1].replace(/&amp;/g, '&');
      const chapterId = this.parseChapterId(fullUrl);
      const title = linkMatch[2].trim();
      if (!foundIds.has(chapterId)) {
        foundIds.add(chapterId);
        chapters.push({
          id: chapterId,
          title: title || 'Tomo',
          number: this.extractVolumeNumber(title),
          url: fullUrl,
          coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
        });
      }
    }
    console.log('Simple link regex found, total:', chapters.length);

    chapters.sort((a, b) => {
      const numA = parseInt(a.number || '0', 10) || 0;
      const numB = parseInt(b.number || '0', 10) || 0;
      return numA - numB;
    });

    console.log('Total chapters extracted:', chapters.length);
    return { coverUrl, chapters };
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

    const volumes: YupVolume[] = chapters.map((ch, index) => {
      console.log(`Chapter ${index}: id=${ch.id}, title=${ch.title}, number=${ch.number}, url=${ch.url}, cover=${ch.coverUrl}`);
      return {
        id: ch.id,
        title: ch.title || ch.number || `Capítulo ${index + 1}`,
        number: ch.number || String(index + 1),
        coverUrl: ch.coverUrl || coverUrl || '',
        pages: 0,
        publishedDate: '',
        readerUrl: ch.url,
      };
    });

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
    console.log('Loading series:', seriesId);
    const response = await this.client.get(`/series.php?id=${seriesId}`);
    console.log('HTML received, length:', response.data.length);
    
    let allChapters: Array<{ id: string; title: string; number: string; url: string; coverUrl: string }> = [];
    let coverUrl = '';
    
    // Try to find cover from multiple sources
    const firstPage = this.extractCoverFromJsonLd(response.data);
    allChapters = [...firstPage.chapters];
    coverUrl = firstPage.coverUrl;
    console.log('First page chapters:', allChapters.length);
    
    // If still no cover, try direct HTML parsing
    if (!coverUrl) {
      console.log('No cover from JSON-LD, trying direct HTML...');
      // Look for any large image that might be the cover
      const imgMatch = response.data.match(/<img[^>]+src="(https?:\/\/[^"]+(?:cover|poster|thumbnail|upload)[^"]*)"/i);
      if (imgMatch) {
        coverUrl = imgMatch[1];
        console.log('Cover from direct img:', coverUrl);
      }
    }
    
    // Try to find cover from first chapter's cover
    if (!coverUrl) {
      console.log('No cover found from any method, trying first chapter');
      if (allChapters.length > 0 && allChapters[0].id) {
        coverUrl = `${BASE_URL}/image-proxy-v2.php?chapter=${allChapters[0].id}&page=1&context=cover`;
        console.log('Using first chapter cover:', coverUrl);
      } else {
        // Try to extract any chapter ID from the HTML
        const anyChapterMatch = response.data.match(/reader_v2\.php\?chapter=([a-zA-Z0-9]+)/);
        if (anyChapterMatch) {
          coverUrl = `${BASE_URL}/image-proxy-v2.php?chapter=${anyChapterMatch[1]}&page=1&context=cover`;
          console.log('Found chapter ID from HTML:', anyChapterMatch[1]);
        }
      }
    }
    
    let maxPage = 1;
    
    const paginationContainerMatch = response.data.match(/<nav[^>]*class="[^"]*pagination[^"]*"[^>]*>([\s\S]*?)<\/nav>/i);
    if (paginationContainerMatch) {
      const pageMatches = paginationContainerMatch[1].match(/page=(\d+)/g);
      if (pageMatches) {
        const pages = pageMatches.map((m: string) => parseInt(m.replace('page=', ''), 10));
        maxPage = Math.max(...pages);
        console.log('Found pagination pages:', maxPage);
      }
    }
    
    if (maxPage === 1) {
      const pageMatches = response.data.match(/href="[^"]*page=(\d+)"/);
      if (pageMatches) {
        maxPage = parseInt(pageMatches[1], 10);
        console.log('Found page link:', maxPage);
      }
    }
    
    // Check for "Cargar más" or "Load more" button
    const loadMoreMatch = response.data.match(/data-page="(\d+)"/);
    if (loadMoreMatch) {
      const loadMorePage = parseInt(loadMoreMatch[1], 10);
      maxPage = Math.max(maxPage, loadMorePage);
      console.log('Found load more page:', maxPage);
    }
    
    // Check for any pagination links with numbers - more aggressive
    const allPagePatterns = [
      /\?page=(\d+)/g,
      /\/page\/(\d+)/g,
      /&page=(\d+)/g,
      /data-page="(\d+)"/g,
    ];
    
    for (const pattern of allPagePatterns) {
      const matches = response.data.match(pattern);
      if (matches) {
        const pages = matches.map((m: string) => parseInt(m.replace(/[^0-9]/g, ''), 10));
        const foundMax = Math.max(...pages);
        if (foundMax > maxPage && foundMax < 100) {
          maxPage = foundMax;
          console.log('Found more pages with pattern:', pattern, 'max:', maxPage);
        }
      }
    }
    
    // Check for pagination container more broadly
    const anyPagination = response.data.match(/pagination|pager|page-nav/i);
    if (anyPagination) {
      console.log('Found pagination container!');
    }
    
    // Look for "next" or "more" button text
    const loadMorePatterns = [
      /cargar má?s?/i,
      /load more/i,
      /ver má?s?/i,
      /next/i,
      /<button[^>]*>[^<]*(\d+)[^<]*<\/button>/i,
    ];
    
    for (const pattern of loadMorePatterns) {
      const match = response.data.match(pattern);
      if (match) {
        console.log('Found load more pattern:', pattern);
      }
    }
    
    // Try looking for chapters in any URL in the page
    console.log('Looking for any chapter URLs in HTML...');
    const allChapterUrls = response.data.match(/reader_v2\.php\?chapter=[a-zA-Z0-9]+/g) as string[] | null;
    const foundChapterIds = new Set(allChapters.map(c => c.id));
    if (allChapterUrls) {
      const uniqueUrls = [...new Set(allChapterUrls)];
      console.log('Found total unique chapter URLs:', uniqueUrls.length);
      if (uniqueUrls.length > allChapters.length) {
        for (const url of uniqueUrls) {
          const chapterId = this.parseChapterId(url);
          if (chapterId && !foundChapterIds.has(chapterId)) {
            foundChapterIds.add(chapterId);
            allChapters.push({
              id: chapterId,
              title: '',
              number: '',
              url: url.startsWith('http') ? url : BASE_URL + url,
              coverUrl: `${BASE_URL}/image-proxy-v2.php?chapter=${chapterId}&page=1&context=cover`,
            });
          }
        }
        console.log('Total chapters after URL scan:', allChapters.length);
      }
    }
    
    if (maxPage > 1) {
      console.log('Loading all', maxPage, 'pages...');
      for (let page = 2; page <= maxPage; page++) {
        try {
          console.log('Loading page:', page);
          const pageResponse = await this.client.get(`/series.php?id=${seriesId}&page=${page}`);
          const pageData = this.extractCoverFromJsonLd(pageResponse.data);
          console.log('Page', page, 'chapters:', pageData.chapters.length);
          allChapters = [...allChapters, ...pageData.chapters];
          if (!coverUrl && pageData.coverUrl) {
            coverUrl = pageData.coverUrl;
          }
        } catch (e) {
          console.log('Error loading page', page, ':', e);
        }
      }
    } else {
      console.log('No pagination found, trying pages 2-20 anyway...');
      for (let page = 2; page <= 20; page++) {
        try {
          const pageResponse = await this.client.get(`/series.php?id=${seriesId}&page=${page}`);
          const pageData = this.extractCoverFromJsonLd(pageResponse.data);
          console.log('Page', page, 'chapters:', pageData.chapters.length);
          if (pageData.chapters.length > 0) {
            allChapters = [...allChapters, ...pageData.chapters];
            maxPage = page;
          } else {
            console.log('No more chapters on page', page, '- stopping');
            break;
          }
        } catch (e) {
          console.log('Error loading page', page, ':', e);
          break;
        }
      }
    }
    
    // Also extract from JSON-LD numberOfEpisodes
    const jsonLdMatch = response.data.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    let totalEpisodesInJsonLd = 0;
    if (jsonLdMatch) {
      try {
        const jsonLd = JSON.parse(jsonLdMatch[1]);
        totalEpisodesInJsonLd = jsonLd.numberOfEpisodes || 0;
        console.log('JSON-LD says there are', totalEpisodesInJsonLd, 'episodes');
      } catch {}
    }
    
    if (allChapters.length < 20 && totalEpisodesInJsonLd > allChapters.length) {
      console.log('JSON-LD says', totalEpisodesInJsonLd, 'chapters but we only have', allChapters.length, '- trying AJAX...');
      
      const ajaxEndpoints = [
        `/ajax/chapters_list.php?series_id=${seriesId}`,
        `/ajax/series_chapters.php?id=${seriesId}`,
        `/ajax/get_series_info.php?id=${seriesId}`,
        `/series_ajax.php?action=get_chapters&series_id=${seriesId}`,
        `/ajax/chapters_v2.php?series=${seriesId}`,
        `/series/${seriesId}/chapters`,
        `/api/chapters?series_id=${seriesId}`,
        `/api/v1/series/${seriesId}/chapters`,
        `/ajax/get_series_chapters.php?series=${seriesId}`,
        `/ajax/load_chapters.php?series=${seriesId}`,
        `/series.php?action=chapters&id=${seriesId}`,
        `/ajax/chapters_list_v2.php?series=${seriesId}`,
        `/ajax/get_all_chapters.php?series=${seriesId}`,
        `/series_ajax.php?action=chapters&id=${seriesId}`,
        `/ajax/chapters.php?series=${seriesId}`,
      ];
      
      // Also try with page parameter
      const pageEndpoints = [
        `/ajax/chapters.php?series_id=${seriesId}&page=1`,
        `/ajax/get_chapters.php?series=${seriesId}&page=1`,
        `/series_ajax.php?action=get_chapters&series_id=${seriesId}&page=1`,
      ];
      
      for (const endpoint of pageEndpoints) {
        ajaxEndpoints.push(endpoint);
      }
      
      // Extract CSRF token from HTML if available
      const csrfMatch = response.data.match(/csrf_token"[^>]*value="([^"]+)"/);
      const csrfToken = csrfMatch ? csrfMatch[1] : '';
      console.log('CSRF token:', csrfToken ? 'found' : 'not found');
      
      for (const endpoint of ajaxEndpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          const ajaxHeaders: Record<string, string> = {
            'X-Requested-With': 'XMLHttpRequest',
          };
          if (csrfToken) {
            ajaxHeaders['X-CSRF-Token'] = csrfToken;
            ajaxHeaders['X-CSRFTOKEN'] = csrfToken;
          }
          const ajaxResponse = await this.client.get(endpoint, {
            headers: ajaxHeaders,
          });
          
          console.log('AJAX response status:', ajaxResponse.status);
          
          let ajaxChapters: any[] = [];
          
          if (ajaxResponse.data && typeof ajaxResponse.data === 'string') {
            try {
              const parsed = JSON.parse(ajaxResponse.data);
              ajaxChapters = parsed.chapters || parsed.data || parsed.results || parsed || [];
            } catch {}
          } else if (ajaxResponse.data && ajaxResponse.data.chapters) {
            ajaxChapters = ajaxResponse.data.chapters;
          } else if (Array.isArray(ajaxResponse.data)) {
            ajaxChapters = ajaxResponse.data;
          }
          
          if (ajaxChapters.length > 0) {
            console.log('AJAX chapters found:', ajaxChapters.length);
            const mapped = ajaxChapters.map((ch: any) => ({
              id: ch.chapter_id || ch.id || ch.chapter || ch.chapterId || '',
              title: ch.title || ch.name || '',
              number: ch.number || ch.chapter || ch.volume || ch.num || '0',
              url: ch.url || `/reader_v2.php?chapter=${ch.chapter_id || ch.id || ch.chapter || ch.chapterId || ''}`,
              coverUrl: '',
            })).filter((ch: any) => ch.id);
            
            console.log('Mapped AJAX chapters:', mapped.length);
            allChapters = [...allChapters, ...mapped];
            break;
          }
        } catch (e) {
          console.log('AJAX endpoint failed:', endpoint);
        }
      }
      
      // Try POST requests with different order parameters
      const postEndpoints = [
        { url: '/ajax/get_chapters.php', data: { series_id: seriesId } },
        { url: '/ajax/chapters.php', data: { id: seriesId } },
        { url: '/api/chapters', data: { seriesId } },
        { url: '/ajax/get_chapters.php', data: { series_id: seriesId, order: 'oldest_first' } },
        { url: '/ajax/get_chapters.php', data: { series_id: seriesId, order: 'newest_first' } },
        { url: '/ajax/chapters.php', data: { id: seriesId, order: 'oldest_first' } },
        { url: '/ajax/chapters.php', data: { id: seriesId, sort: 'asc' } },
        { url: '/ajax/chapters.php', data: { id: seriesId, sort: 'desc' } },
      ];
      
      for (const post of postEndpoints) {
        try {
          console.log('Trying POST:', post.url, post.data);
          const ajaxResponse = await this.client.post(post.url, post.data, {
            headers: {
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          console.log('POST response status:', ajaxResponse.status);
          
          let ajaxChapters: any[] = [];
          
          if (ajaxResponse.data && typeof ajaxResponse.data === 'string') {
            try {
              const parsed = JSON.parse(ajaxResponse.data);
              ajaxChapters = parsed.chapters || parsed.data || parsed.results || parsed || [];
            } catch {}
          } else if (ajaxResponse.data && ajaxResponse.data.chapters) {
            ajaxChapters = ajaxResponse.data.chapters;
          } else if (Array.isArray(ajaxResponse.data)) {
            ajaxChapters = ajaxResponse.data;
          }
          
          if (ajaxChapters.length > 0) {
            console.log('POST chapters found:', ajaxChapters.length);
            const mapped = ajaxChapters.map((ch: any) => ({
              id: ch.chapter_id || ch.id || ch.chapter || ch.chapterId || '',
              title: ch.title || ch.name || '',
              number: ch.number || ch.chapter || ch.volume || ch.num || '0',
              url: ch.url || `/reader_v2.php?chapter=${ch.chapter_id || ch.id || ch.chapter || ch.chapterId || ''}`,
              coverUrl: '',
            })).filter((ch: any) => ch.id);
            
            allChapters = [...allChapters, ...mapped];
            break;
          }
        } catch (e) {
          console.log('POST endpoint failed:', post.url);
        }
      }
    }
    
    console.log('Total chapters after AJAX:', allChapters.length);
    
    console.log('Total chapters after all methods:', allChapters.length);
    
    // If still not enough chapters, try with mobile User-Agent to see if site returns more
    if (allChapters.length < 10) {
      console.log('Still not enough chapters, trying with mobile client...');
      try {
        const mobileClient = axios.create({
          baseURL: BASE_URL,
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'es-ES,es;q=0.9',
          },
        });
        
        const mobileResponse = await mobileClient.get(`/series.php?id=${seriesId}`);
        const mobileData = this.extractCoverFromJsonLd(mobileResponse.data);
        
        console.log('Mobile client chapters:', mobileData.chapters.length);
        
        if (mobileData.chapters.length > allChapters.length) {
          allChapters = mobileData.chapters;
          if (!coverUrl && mobileData.coverUrl) {
            coverUrl = mobileData.coverUrl;
          }
        }
      } catch (e) {
        console.log('Mobile client failed:', e);
      }
    }
    
    // Now parse the series
    const { coverUrl: seriesCoverUrl, chapters } = { coverUrl, chapters: allChapters };
    
    const titleMatch = response.data.match(/<h1[^>]*class="[^"]*font-bold[^"]*"[^>]*>([^<]+)<\/h1>/);
    const title = titleMatch ? titleMatch[1].trim() : '';

    const descriptionMatch = response.data.match(/<p[^>]*id="synopsisText"[^>]*>([\s\S]*?)<\/p>/);
    const description = descriptionMatch ? descriptionMatch[1].replace(/<[^>]+>/g, '').trim() : '';

    const statusMatch = response.data.match(/<i[^>]*class="[^"]*fa-circle-check[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const statusStr = statusMatch ? statusMatch[1].trim().toLowerCase() : '';
    const status = statusStr.includes('finalizado') ? 'completed' : 
                   statusStr.includes('activo') ? 'ongoing' : 
                   statusStr.includes('hiato') ? 'hiatus' : 'ongoing';

    const authorMatch = response.data.match(/<i[^>]*class="[^"]*fa-user[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const author = authorMatch ? authorMatch[1].trim() : '';

    const directionMatch = response.data.match(/<i[^>]*class="[^"]*fa-arrow-down[^"]*"[^>]*><\/i>\s*([^<]+)/);
    const readingDirection = directionMatch ? directionMatch[1].trim() : 'Webtoon';

    const genres: string[] = [];
    const genreMatches = response.data.matchAll(/<a[^>]*href="\/genero\/[^"]*"[^>]*>([^<]+)<\/a>/g);
    for (const match of genreMatches) {
      genres.push(match[1].trim());
    }

    const tags: string[] = [];
    const tagMatches = response.data.matchAll(/<a[^>]*href="\/tag\/[^"]*"[^>]*>([^<]+)<\/a>/g);
    for (const match of tagMatches) {
      tags.push(match[1].trim());
    }

    const ratingMatch = response.data.match(/<button[^>]*id="ratingButton"[^>]*class="[^"]*bg-green[^"]*"[^>]*>\s*(\d+(?:\.\d+)?)\s*<\/button>/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : 0;

    // Remove duplicates by ID
    console.log('DEBUG: allChapters before unique:', allChapters.length);
    console.log('DEBUG: allChapters ALL ids:', JSON.stringify(allChapters.map(c => c.id)));
    const uniqueChapters = allChapters.filter((ch, index, self) => 
      index === self.findIndex(c => c.id === ch.id)
    );
    console.log('DEBUG: uniqueChapters:', uniqueChapters.length);
    console.log('DEBUG: uniqueChapters ids:', JSON.stringify(uniqueChapters.map(c => c.id)));

    const volumes: YupVolume[] = uniqueChapters.map((ch, index) => {
      console.log('DEBUG: mapping chapter', index, 'id:', ch.id, 'title:', ch.title);
      return {
        id: ch.id,
        title: ch.title || ch.number || `Capítulo ${index + 1}`,
        number: ch.number || String(index + 1),
        coverUrl: ch.coverUrl || coverUrl || '',
        pages: 0,
        publishedDate: '',
        readerUrl: ch.url,
      };
    });
    
    console.log('DEBUG: volumes mapped, length:', volumes.length);

    const series: YupMangaSeries = {
      id: seriesId,
      title,
      coverUrl: coverUrl,
      description,
      status,
      genres,
      tags,
      author,
      readingDirection,
      rating,
      totalVolumes: volumes.length,
      volumes,
      lastUpdated: new Date().toISOString(),
    };
    
    if (!series.title) {
      throw new Error('No se pudo obtener la información de la serie');
    }

    console.log('Series loaded, volumes:', series.volumes.length);
    return series;
  }

  async getPopularSeries(page = 1): Promise<YupSeriesListItem[]> {
    console.log('Fetching popular series...');
    const response = await this.client.get('/');
    console.log('Home page HTML length:', response.data.length);
    const series = this.parseSeriesListFromHtml(response.data);
    console.log('Parsed series count:', series.length);
    return series;
  }

  async searchSeries(query: string): Promise<YupSearchResult[]> {
    try {
      console.log('Searching for:', query);
      const response = await this.client.get(`/ajax/search_series.php?q=${encodeURIComponent(query)}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      console.log('Search response status:', response.status);
      console.log('Search response type:', typeof response.data);
      
      let seriesArray: any[] = [];
      
      if (typeof response.data === 'string') {
        console.log('Response is string, trying to parse as JSON');
        try {
          const parsed = JSON.parse(response.data);
          seriesArray = parsed.series || parsed.data || parsed.results || [];
        } catch {
          console.log('Failed to parse JSON from string');
          return [];
        }
      } else if (response.data && response.data.series && Array.isArray(response.data.series)) {
        seriesArray = response.data.series;
      } else if (response.data && Array.isArray(response.data)) {
        seriesArray = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        seriesArray = response.data.data;
      }
      
      console.log('Search series array length:', seriesArray.length);
      console.log('Sample item:', seriesArray[0]);
      
      const results = seriesArray.map((item: any) => {
        let coverUrl = item.cover_url || item.cover || item.image || item.coverUrl || item.thumbnail || '';
        if (coverUrl && coverUrl.startsWith('/')) {
          coverUrl = BASE_URL + coverUrl;
        }
        const id = item.id || item.series_id || item.seriesId || '';
        console.log('Search item:', item.title || item.name, 'coverUrl:', coverUrl);
        return {
          id,
          title: item.title || item.name || '',
          coverUrl,
          status: item.status || '',
        };
      });
      
      const validResults = results.filter(r => r.id && r.title);
      console.log('Valid search results:', validResults.length);
      return validResults;
    } catch (error) {
      console.error('Error searching series:', error);
      return [];
    }
  }

  async getToken(chapterId: string): Promise<string> {
    try {
      const response = await this.client.get(`/ajax/get_reader_token.php?chapter=${chapterId}`, {
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (response.data && response.data.token) {
        return response.data.token;
      }
      return '';
    } catch (error) {
      console.error('Error getting token:', error);
      return '';
    }
  }

  async getVolumePages(chapterId: string): Promise<VolumePages> {
    try {
      if (!chapterId || typeof chapterId !== 'string') {
        console.error('Invalid chapterId:', chapterId);
        return { pages: [], totalPages: 0, token: '' };
      }
      
      const chapterIdClean = chapterId.replace(/^chapter=/, '').replace(/&.*$/, '');
      
      const token = await this.getToken(chapterIdClean);
      console.log('Got token:', token ? 'yes' : 'no', token);
      
      if (!token) {
        return { pages: [], totalPages: 0, token: '' };
      }
      
      const readerUrl = `${BASE_URL}/reader_v2.php?chapter=${chapterIdClean}&token=${token}&page=1`;
      console.log('Loading reader URL:', readerUrl);
      
      const response = await this.client.get(readerUrl);
      const html = response.data;
      
      // Buscar el número total de páginas en el HTML
      console.log('Looking for page count in HTML...');
      const pageInfoPatterns = [
        /Página\s+(\d+)\s+de\s+(\d+)/i,
        /(\d+)\s*\/\s*(\d+)/,
        /de\s+(\d+)/i,
        /totalPages["']?\s*[:=]\s*["']?(\d+)/i,
      ];
      
      let reportedTotalPages = 0;
      for (const pattern of pageInfoPatterns) {
        const match = html.match(pattern);
        if (match) {
          reportedTotalPages = parseInt(match[2] || match[1], 10);
          console.log('Found page count with pattern:', pattern, '->', reportedTotalPages);
          break;
        }
      }
      
      if (reportedTotalPages === 0) {
        console.log('No page count found in HTML');
      }
      
      // Extraer páginas del HTML
      const pages: string[] = [];
      
      const imgRegex = /<img[^>]*class="[^"]*page-image[^"]*"[^>]*src="([^"]*context=reader[^"]*)"[^>]*>/g;
      let match;
      while ((match = imgRegex.exec(html)) !== null) {
        const src = match[1].replace(/&amp;/g, '&');
        if (src && src.includes('image-proxy')) {
          const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
          if (!pages.includes(fullUrl)) {
            pages.push(fullUrl);
          }
        }
      }
      
      if (pages.length === 0) {
        const anyImgRegex = /<img[^>]*src="([^"]*image-proxy[^"]*)"[^>]*>/g;
        while ((match = anyImgRegex.exec(html)) !== null) {
          const src = match[1].replace(/&amp;/g, '&');
          if (src && src.includes('context=reader') && !src.includes('context=cover')) {
            const fullUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
            if (!pages.includes(fullUrl)) {
              pages.push(fullUrl);
            }
          }
        }
      }
      
      // Si hay un número reportado de páginas mayor que las encontradas, generar URLs
      let totalPages = pages.length;
      if (reportedTotalPages > pages.length && reportedTotalPages > 1) {
        console.log('Generating URLs for', reportedTotalPages, 'pages');
        const pageUrls: string[] = [];
        // Extraer el token de la primera página encontrada
        const tokenMatch = pages[0]?.match(/token=([^&]+)/);
        const pageToken = tokenMatch ? tokenMatch[1] : '';
        
        for (let i = 1; i <= reportedTotalPages; i++) {
          pageUrls.push(`${BASE_URL}/image-proxy-v2.php?chapter=${chapterIdClean}&page=${i}&token=${pageToken}&context=reader`);
        }
        totalPages = reportedTotalPages;
        console.log('Generated', pageUrls.length, 'page URLs');
        return { pages: pageUrls, totalPages, token: pageToken };
      }
      
      const filteredPages = pages.filter(p => !p.includes('context=cover'));
      console.log('Found pages (raw):', pages.length, 'filtered:', filteredPages.length);
      
      totalPages = filteredPages.length;
      
      return { pages: filteredPages, totalPages, token };
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
