/**
 * Search Screen - Pantalla de búsqueda de manga
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme, FontSizes, Spacing } from '@/constants/theme';
import { Input } from '@/components/ui/Input';
import { MangaCard } from '@/components/manga/MangaCard';
import { mangadexAPI } from '@/services/api/mangadex';
import type { SimpleManga } from '@/types/manga';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SimpleManga[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounce para búsqueda automática
  const searchTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const response = await mangadexAPI.searchManga(searchQuery, 20);
      const simpleMangaList = response.data.map((manga) =>
        mangadexAPI.mangaToSimple(manga)
      );
      setResults(simpleMangaList);
    } catch (error) {
      console.error('Error searching manga:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onChangeText = (text: string) => {
    setQuery(text);

    // Limpiar timeout anterior
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    // Crear nuevo timeout para buscar después de 500ms
    searchTimeout.current = setTimeout(() => {
      handleSearch(text);
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Buscar Manga</Text>
        <Input
          placeholder="Buscar por título..."
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
            Busca tu manga favorito por título
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => <MangaCard manga={item} />}
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
  searchInput: {
    marginBottom: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
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
