/**
 * Manga Detail Screen - Pantalla de detalle de un manga
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { mangadexAPI } from '@/services/api/mangadex';
import { useLibraryStore } from '@/store/libraryStore';
import type { Manga, Chapter } from '@/types/manga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function MangaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryStore();
  const inLibrary = manga ? isInLibrary(manga.id) : false;

  useEffect(() => {
    loadMangaDetails();
  }, [id]);

  const loadMangaDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setOffset(0);

      const mangaData = await mangadexAPI.getMangaById(id as string);
      const chaptersData = await mangadexAPI.getChapters(id as string, { 
        limit: 100, 
        offset: 0 
      });

      setManga(mangaData);
      setChapters(chaptersData.data);
      setHasMore(chaptersData.data.length === 100);
      setOffset(100);
    } catch (err) {
      console.error('Error loading manga details:', err);
      setError('Error al cargar los detalles del manga');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreChapters = async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const chaptersData = await mangadexAPI.getChapters(id as string, { 
        limit: 100, 
        offset 
      });

      if (chaptersData.data.length > 0) {
        setChapters(prev => [...prev, ...chaptersData.data]);
        setOffset(prev => prev + 100);
        setHasMore(chaptersData.data.length === 100);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more chapters:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleToggleLibrary = () => {
    if (!manga) return;

    if (inLibrary) {
      removeFromLibrary(manga.id);
    } else {
      const simpleManga = mangadexAPI.mangaToSimple(manga);
      addToLibrary({
        ...simpleManga,
        addedAt: new Date().toISOString(),
        category: 'reading',
      });
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando detalles..." />;
  }

  if (error || !manga) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Manga no encontrado'}</Text>
      </View>
    );
  }

  const coverArt = manga.relationships.find((rel) => rel.type === 'cover_art');
  const coverUrl = coverArt
    ? mangadexAPI.getCoverUrl(manga.id, (coverArt as any).attributes?.fileName)
    : '';

  const title = mangadexAPI['getTitle'](manga.attributes.title);
  const description = mangadexAPI['getDescription'](manga.attributes.description);
  const author = manga.relationships.find((rel) => rel.type === 'author');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Cover Image */}
      <Image
        source={{ uri: coverUrl }}
        style={styles.coverImage}
        contentFit="cover"
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>{title}</Text>

        {/* Metadata */}
        <View style={styles.metadata}>
          {author && (
            <Text style={styles.metaText}>
              Autor: {(author as any).attributes?.name || 'Desconocido'}
            </Text>
          )}
          {manga.attributes.year && (
            <Text style={styles.metaText}>Año: {manga.attributes.year}</Text>
          )}
          <Text style={styles.metaText}>
            Estado: {manga.attributes.status === 'ongoing' ? 'En curso' : 'Completado'}
          </Text>
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          {manga.attributes.tags.slice(0, 5).map((tag) => (
            <View key={tag.id} style={styles.tag}>
              <Text style={styles.tagText}>
                {tag.attributes.name.en || Object.values(tag.attributes.name)[0]}
              </Text>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title={inLibrary ? 'En Biblioteca' : 'Añadir a Biblioteca'}
            onPress={handleToggleLibrary}
            variant={inLibrary ? 'secondary' : 'primary'}
            fullWidth
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sinopsis</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {/* Chapters */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Capítulos ({chapters.length})
            </Text>
            <TouchableOpacity onPress={loadMangaDetails} style={styles.reloadButton}>
              <Text style={styles.reloadText}>↻</Text>
            </TouchableOpacity>
          </View>
          {chapters.length === 0 ? (
            <Text style={styles.emptyText}>No hay capítulos disponibles</Text>
          ) : (
            chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter.id}
                style={styles.chapterItem}
                activeOpacity={0.7}
                onPress={() => router.push(`/read/${chapter.id}?mangaId=${id}` as any)}
              >
                <View style={styles.chapterInfo}>
                  <Text style={styles.chapterTitle}>
                    {chapter.attributes.chapter
                      ? `Capítulo ${chapter.attributes.chapter}`
                      : 'Capítulo sin número'}
                  </Text>
                  {chapter.attributes.title && (
                    <Text style={styles.chapterSubtitle}>
                      {chapter.attributes.title}
                    </Text>
                  )}
                </View>
                <Text style={styles.chapterLang}>
                  {chapter.attributes.translatedLanguage.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))
          )}
          {hasMore && (
            <TouchableOpacity 
              style={styles.loadMoreButton} 
              onPress={loadMoreChapters}
              disabled={isLoadingMore}
            >
              <Text style={styles.loadMoreText}>
                {isLoadingMore ? 'Cargando...' : 'Cargar más capítulos'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  coverImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.4,
    backgroundColor: Theme.backgroundTertiary,
  },
  content: {
    padding: Spacing.md,
  },
  title: {
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: Spacing.sm,
  },
  metadata: {
    marginBottom: Spacing.md,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Theme.textSecondary,
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  tag: {
    backgroundColor: Theme.backgroundTertiary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    fontSize: FontSizes.xs,
    color: Theme.textSecondary,
  },
  actions: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  reloadButton: {
    padding: Spacing.xs,
  },
  reloadText: {
    fontSize: FontSizes.xl,
    color: Theme.textSecondary,
  },
  loadMoreButton: {
    backgroundColor: Theme.backgroundTertiary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  loadMoreText: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
    lineHeight: 24,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Theme.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  chapterInfo: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: FontSizes.base,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: 2,
  },
  chapterSubtitle: {
    fontSize: FontSizes.sm,
    color: Theme.textSecondary,
  },
  chapterLang: {
    fontSize: FontSizes.xs,
    color: Theme.textTertiary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: FontSizes.base,
    color: Theme.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.lg,
    textAlign: 'center',
  },
});
