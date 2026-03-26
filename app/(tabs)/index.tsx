/**
 * Home Screen - Pantalla principal con series de YupManga (español)
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { yupMangaAPI } from '@/services/api/yupmanga';
import type { YupSeriesListItem } from '@/types/yupmanga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 3) / 2;

export default function HomeScreen() {
  const router = useRouter();
  const [series, setSeries] = useState<YupSeriesListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSeries = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await yupMangaAPI.getPopularSeries();
      setSeries(data);
    } catch (err) {
      console.error('Error loading series:', err);
      setError('Error al cargar las series. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, []);

  const onRefresh = () => {
    loadSeries(true);
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

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => loadSeries()}>
          <Text style={styles.retryText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>YupManga</Text>
        <Text style={styles.subtitle}>Manga en español</Text>
      </View>

      <TouchableOpacity 
        style={styles.searchBarContainer}
        activeOpacity={0.8}
        onPress={() => router.push('/(tabs)/search' as any)}
      >
        <View style={styles.searchBar}>
          <View style={styles.searchIconCircle} />
          <Text style={styles.searchPlaceholder}>Buscar manga...</Text>
        </View>
      </TouchableOpacity>

      <FlatList
        data={series}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={renderSeriesCard}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
            colors={[Theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay series disponibles</Text>
          </View>
        }
      />
    </SafeAreaView>
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
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
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
  searchBarContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.backgroundSecondary,
    borderRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  searchIconCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.textTertiary,
    marginRight: Spacing.sm,
  },
  searchPlaceholder: {
    color: Theme.textTertiary,
    fontSize: FontSizes.base,
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.lg,
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
