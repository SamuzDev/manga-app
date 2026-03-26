/**
 * Search Screen - Búsqueda en YupManga
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
  TextInput,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { yupMangaAPI } from '@/services/api/yupmanga';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2;

interface SearchResult {
  id: string;
  title: string;
  coverUrl: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
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
      console.log('Searching yupmanga for:', searchQuery);
      const response = await yupMangaAPI.searchSeries(searchQuery);
      console.log('Yupmanga response:', response.length, 'results');
      const searchResults: SearchResult[] = response.map((series) => ({
        id: series.id,
        title: series.title,
        coverUrl: series.coverUrl,
      }));
      console.log('Setting results:', searchResults.length);
      setResults(searchResults);
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

  const handlePress = (item: SearchResult) => {
    router.push(`/series/yup/${item.id}` as any);
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
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <View style={styles.searchIconContainer}>
            <View style={styles.searchIconDot} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar manga..."
            placeholderTextColor={Theme.textTertiary}
            value={query}
            onChangeText={onChangeText}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }}
            >
              <View style={styles.clearIcon}>
                <View style={[styles.clearIconDot, styles.clearIconDot1]} />
                <View style={[styles.clearIconDot, styles.clearIconDot2]} />
              </View>
            </TouchableOpacity>
          )}
        </View>
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
          keyExtractor={(item) => item.id}
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
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.text,
  },
  searchContainer: {
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
  searchIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  searchIconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Theme.textTertiary,
  },
  searchInput: {
    flex: 1,
    color: Theme.text,
    fontSize: FontSizes.base,
    paddingVertical: Spacing.xs,
  },
  clearButton: {
    padding: Spacing.xs,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIcon: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearIconDot: {
    position: 'absolute',
    width: 14,
    height: 2,
    backgroundColor: Theme.textTertiary,
    borderRadius: 1,
  },
  clearIconDot1: {
    transform: [{ rotate: '45deg' }],
  },
  clearIconDot2: {
    transform: [{ rotate: '-45deg' }],
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
