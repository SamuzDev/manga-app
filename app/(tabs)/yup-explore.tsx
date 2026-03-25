/**
 * YupManga Explore Screen - Exploración de series
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { yupMangaAPI } from '@/services/api/yupmanga';
import type { YupSeriesListItem } from '@/types/yupmanga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 3) / 2;

export default function YupExploreScreen() {
  const router = useRouter();
  const [series, setSeries] = useState<YupSeriesListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPopularSeries();
  }, []);

  const loadPopularSeries = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await yupMangaAPI.getPopularSeries();
      setSeries(data);
    } catch (err) {
      console.error('Error loading series:', err);
      setError('Error al cargar las series');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPopularSeries();
      return;
    }

    try {
      setIsSearching(true);
      setError(null);
      const results = await yupMangaAPI.searchSeries(searchQuery.trim());
      const seriesList: YupSeriesListItem[] = results.map(r => ({
        id: r.id,
        title: r.title,
        coverUrl: r.coverUrl,
        status: r.status,
        type: 'manga',
        totalVolumes: 0,
      }));
      setSeries(seriesList);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Error al buscar series');
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setSearchQuery('');
    await loadPopularSeries();
    setRefreshing(false);
  };

  const renderSeriesCard = useCallback(({ item }: { item: YupSeriesListItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => router.push(`/series/yup/${item.id}` as any)}
    >
      <View style={styles.imageContainer}>
        <ExpoImage
          source={{ uri: item.coverUrl }}
          style={styles.coverImage}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
        <View style={styles.volumeCount}>
          <Text style={styles.volumeCountText}>{item.totalVolumes}</Text>
        </View>
        <View style={[
          styles.typeBadge,
          item.type === 'manhwa' && styles.typeManhwa
        ]}>
          <Text style={styles.typeText}>
            {item.type === 'manhwa' ? 'Manhwa' : 'Manga'}
          </Text>
        </View>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.cardMeta}>
          <View style={[
            styles.statusDot,
            item.status === 'finalizado' && styles.statusFinalizado
          ]} />
          <Text style={styles.statusText}>
            {item.status === 'finalizado' ? 'Finalizado' : 
             item.status === 'activo' ? 'En curso' : item.status}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [router]);

  if (isLoading) {
    return <Loading fullScreen message="Cargando series..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>YupManga</Text>
        <Text style={styles.headerSubtitle}>Series en español</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar series..."
          placeholderTextColor={Theme.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity 
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>🔍</Text>
          )}
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadPopularSeries}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={series}
          renderItem={renderSeriesCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Theme.primary}
              colors={[Theme.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No se encontraron series' : 'No hay series disponibles'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.text,
  },
  headerSubtitle: {
    fontSize: FontSizes.sm,
    color: Theme.textSecondary,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: Theme.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    color: Theme.text,
    fontSize: FontSizes.base,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchButton: {
    width: 48,
    height: 48,
    backgroundColor: Theme.primary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 20,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing['2xl'],
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: Theme.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 2 / 3,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.backgroundTertiary,
  },
  volumeCount: {
    position: 'absolute',
    top: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  volumeCountText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  typeBadge: {
    position: 'absolute',
    bottom: Spacing.xs,
    left: Spacing.xs,
    backgroundColor: Theme.info,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeManhwa: {
    backgroundColor: Theme.primary,
  },
  typeText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.warning,
  },
  statusFinalizado: {
    backgroundColor: Theme.success,
  },
  statusText: {
    fontSize: FontSizes.xs,
    color: Theme.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.base,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  retryText: {
    color: Theme.primary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyText: {
    color: Theme.textTertiary,
    fontSize: FontSizes.base,
  },
});
