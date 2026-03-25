/**
 * Search Screen - Búsqueda en MangaDex y YupManga
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { mangadexAPI } from '@/services/api/mangadex';
import { yupMangaAPI } from '@/services/api/yupmanga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm * 3) / 2;

type Source = 'mangadex' | 'yupmanga';

interface SearchResult {
  id: string;
  title: string;
  coverUrl: string;
  source: Source;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [source, setSource] = useState<Source>('yupmanga');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      if (source === 'mangadex') {
        const response = await mangadexAPI.searchManga(searchQuery, 20);
        const searchResults: SearchResult[] = response.data.map((manga) => {
          const coverArt = manga.relationships.find((rel) => rel.type === 'cover_art');
          const coverUrl = coverArt
            ? mangadexAPI.getCoverUrl(manga.id, (coverArt as any).attributes?.fileName)
            : '';
          return {
            id: manga.id,
            title: mangadexAPI['getTitle'](manga.attributes.title),
            coverUrl,
            source: 'mangadex',
          };
        });
        setResults(searchResults);
      } else {
        const response = await yupMangaAPI.searchSeries(searchQuery);
        const searchResults: SearchResult[] = response.map((series) => ({
          id: series.id,
          title: series.title,
          coverUrl: series.coverUrl,
          source: 'yupmanga',
        }));
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onChangeText = (text: string) => {
    setQuery(text);

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  };

  const onSourceChange = (newSource: Source) => {
    setSource(newSource);
    if (query.trim().length >= 2) {
      handleSearch(query);
    }
  };

  const handlePress = (item: SearchResult) => {
    if (item.source === 'mangadex') {
      router.push(`/manga/${item.id}`);
    } else {
      router.push(`/series/yup/${item.id}` as any);
    }
  };

  const renderCard = useCallback(({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => handlePress(item)}
    >
      <ExpoImage
        source={{ uri: item.coverUrl }}
        style={styles.coverImage}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
      <View style={styles.sourceBadge}>
        <Text style={styles.sourceText}>
          {item.source === 'mangadex' ? 'MD' : 'Yup'}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
      </View>
    </TouchableOpacity>
  ), [router]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        
        <View style={styles.sourceSelector}>
          <TouchableOpacity
            style={[
              styles.sourceButton,
              source === 'yupmanga' && styles.sourceButtonActive,
            ]}
            onPress={() => onSourceChange('yupmanga')}
          >
            <Text style={[
              styles.sourceButtonText,
              source === 'yupmanga' && styles.sourceButtonTextActive,
            ]}>
              YupManga
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sourceButton,
              source === 'mangadex' && styles.sourceButtonActive,
            ]}
            onPress={() => onSourceChange('mangadex')}
          >
            <Text style={[
              styles.sourceButtonText,
              source === 'mangadex' && styles.sourceButtonTextActive,
            ]}>
              MangaDex
            </Text>
          </TouchableOpacity>
        </View>

        <Input
          placeholder={`Buscar en ${source === 'yupmanga' ? 'YupManga' : 'MangaDex'}...`}
          value={query}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          containerStyle={styles.searchInput}
        />
      </View>

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.primary} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : hasSearched && results.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {query.trim().length < 2
              ? 'Escribe al menos 2 caracteres para buscar'
              : 'No se encontraron resultados'}
          </Text>
        </View>
      ) : !hasSearched ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            Busca tu manga favorito
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.source}-${item.id}`}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={renderCard}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
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
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  sourceSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sourceButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Theme.backgroundSecondary,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.border,
  },
  sourceButtonActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  sourceButtonText: {
    color: Theme.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  sourceButtonTextActive: {
    color: '#fff',
  },
  searchInput: {
    marginBottom: 0,
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
  coverImage: {
    width: '100%',
    aspectRatio: 2 / 3,
    backgroundColor: Theme.backgroundTertiary,
  },
  sourceBadge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  sourceText: {
    color: '#fff',
    fontSize: FontSizes.xs,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Theme.text,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    color: Theme.textSecondary,
    fontSize: FontSizes.base,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Theme.textSecondary,
    fontSize: FontSizes.lg,
    textAlign: 'center',
  },
});
