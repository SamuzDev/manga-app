/**
 * YupManga Series Detail Screen - Pantalla de detalle de serie con tomos
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { yupMangaAPI } from '@/services/api/yupmanga';
import { useLibraryStore } from '@/store/libraryStore';
import type { YupMangaSeries } from '@/types/yupmanga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function YupSeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [series, setSeries] = useState<YupMangaSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const { addToLibrary, removeFromLibrary, isInLibrary } = useLibraryStore();
  const inLibrary = series ? isInLibrary(series.id) : false;

  useEffect(() => {
    loadSeriesDetails();
  }, [id]);

  const loadSeriesDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading series with id:', id);
      const data = await yupMangaAPI.getSeriesById(id as string);
      console.log('Series loaded, coverUrl:', data.coverUrl);
      console.log('Total volumes:', data.volumes.length);
      if (data.volumes.length > 0) {
        console.log('First volume cover:', data.volumes[0].coverUrl);
      }
      setSeries(data);
    } catch (err) {
      console.error('Error loading series details:', err);
      setError('Error al cargar los detalles de la serie');
    } finally {
      setIsLoading(false);
    }
  };

  const reloadSeries = async () => {
    await loadSeriesDetails();
  };

  const handleToggleLibrary = () => {
    if (!series) return;

    if (inLibrary) {
      removeFromLibrary(series.id);
    } else {
      addToLibrary({
        id: series.id,
        title: series.title,
        coverUrl: series.coverUrl,
        description: series.description,
        status: series.status,
        year: null,
        tags: [...series.genres, ...series.tags],
        contentRating: 'safe',
        addedAt: new Date().toISOString(),
        category: 'reading',
      });
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Finalizado';
      case 'ongoing': return 'En curso';
      case 'hiatus': return 'En hiato';
      default: return status;
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando serie..." />;
  }

  if (error || !series) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'Serie no encontrada'}</Text>
        <Button title="Reintentar" onPress={loadSeriesDetails} />
        <Button title="Volver" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: series.title,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cover Image */}
        <View style={styles.coverContainer}>
          <ExpoImage
            source={{ 
              uri: (series.coverUrl || (series.volumes[0]?.coverUrl))
                ? yupMangaAPI.getFullUrl(series.coverUrl || series.volumes[0]?.coverUrl || '')
                : undefined 
            }}
            style={styles.coverImage}
            contentFit="cover"
            placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
            transition={200}
          />
          {(series.coverUrl || series.volumes[0]?.coverUrl) && <View style={styles.coverOverlay} />}
        </View>

        {/* Header Content */}
        <View style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <View style={styles.backButtonInner}>
              <Text style={styles.backButtonIcon}>‹</Text>
            </View>
          </TouchableOpacity>

          {/* Title */}
          <Text style={styles.title}>{series.title}</Text>

          {/* Metadata Row */}
          <View style={styles.metadataRow}>
            <View style={[styles.statusBadge, series.status === 'completed' && styles.statusCompleted]}>
              <Text style={styles.statusText}>{getStatusLabel(series.status)}</Text>
            </View>
            {series.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>★ {series.rating.toFixed(1)}</Text>
              </View>
            )}
          </View>

          {/* Author & Direction */}
          <View style={styles.secondaryMetadata}>
            <Text style={styles.metaText}>📖 {series.author}</Text>
            <Text style={styles.metaText}>→ {series.readingDirection}</Text>
          </View>

          {/* Genres */}
          <View style={styles.genresContainer}>
            {series.genres.slice(0, 4).map((genre, index) => (
              <View key={index} style={styles.genreTag}>
                <Text style={styles.genreText}>{genre}</Text>
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
            <Text 
              style={styles.description}
              numberOfLines={showFullDescription ? undefined : 3}
            >
              {series.description}
            </Text>
            {series.description.length > 150 && (
              <TouchableOpacity onPress={() => setShowFullDescription(!showFullDescription)}>
                <Text style={styles.showMoreText}>
                  {showFullDescription ? 'Mostrar menos' : 'Mostrar más'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Volumes */}
          <View style={styles.section}>
            <View style={styles.volumeHeader}>
              <Text style={styles.sectionTitle}>
                Tomos ({series.volumes.length})
              </Text>
              <TouchableOpacity onPress={reloadSeries}>
                <Text style={styles.reloadText}>↻</Text>
              </TouchableOpacity>
            </View>
            
            {series.volumes.length === 0 ? (
              <Text style={styles.emptyText}>No hay tomos disponibles</Text>
            ) : (
              <View style={styles.volumesGrid}>
                {series.volumes.map((volume, index) => (
                  <TouchableOpacity
                    key={volume.id}
                    style={styles.volumeCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/read-yup/${volume.id}?seriesId=${id}` as any)}
                  >
                    <View style={styles.volumeImageContainer}>
                      <ExpoImage
                        source={{ uri: volume.coverUrl || yupMangaAPI.getCoverProxyUrl(volume.id) }}
                        style={styles.volumeImage}
                        contentFit="cover"
                        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
                      />
                      <View style={styles.volumeNumber}>
                        <Text style={styles.volumeNumberText}>
                          {volume.number}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.volumeInfo}>
                      <Text style={styles.volumeTitle} numberOfLines={2}>
                        {volume.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing['2xl'],
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  coverContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.backgroundTertiary,
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    backgroundImage: 'linear-gradient(to bottom, transparent 0%, rgba(10,10,10,0.5) 50%, rgba(10,10,10,1) 100%)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  headerContent: {
    marginTop: -SCREEN_WIDTH * 0.5,
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.xl + 20,
    left: Spacing.md,
    zIndex: 10,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButtonIcon: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
    marginTop: -2,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    backgroundColor: Theme.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusCompleted: {
    backgroundColor: Theme.success,
  },
  statusText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  ratingBadge: {
    backgroundColor: Theme.warning,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  ratingText: {
    color: '#000',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  secondaryMetadata: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  metaText: {
    fontSize: FontSizes.sm,
    color: Theme.textSecondary,
  },
  genresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  genreTag: {
    backgroundColor: Theme.primaryDark,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  genreText: {
    color: '#fff',
    fontSize: FontSizes.xs,
  },
  actions: {
    marginBottom: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Theme.text,
  },
  reloadText: {
    fontSize: FontSizes.xl,
    color: Theme.primary,
    padding: Spacing.xs,
  },
  description: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
    lineHeight: 24,
  },
  showMoreText: {
    color: Theme.primary,
    fontSize: FontSizes.sm,
    marginTop: Spacing.xs,
  },
  volumesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  volumeCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 3) / 4,
    backgroundColor: Theme.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  volumeImageContainer: {
    position: 'relative',
    aspectRatio: 2 / 3,
  },
  volumeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.backgroundTertiary,
  },
  volumeNumber: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  volumeNumberText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  volumeInfo: {
    padding: Spacing.xs,
  },
  volumeTitle: {
    fontSize: FontSizes.xs,
    color: Theme.text,
    textAlign: 'center',
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
    marginBottom: Spacing.md,
  },
});
