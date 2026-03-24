/**
 * Home Screen - Pantalla principal con lista de mangas populares
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme, FontSizes, Spacing } from '@/constants/theme';
import { MangaCard } from '@/components/manga/MangaCard';
import { Loading } from '@/components/ui/Loading';
import { mangadexAPI } from '@/services/api/mangadex';
import type { SimpleManga } from '@/types/manga';

export default function HomeScreen() {
  const [mangas, setMangas] = useState<SimpleManga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMangas = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await mangadexAPI.getPopularManga(20);
      const simpleMangaList = response.data.map((manga) =>
        mangadexAPI.mangaToSimple(manga)
      );

      setMangas(simpleMangaList);
    } catch (err) {
      console.error('Error loading mangas:', err);
      setError('Error al cargar los mangas. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadMangas();
  }, []);

  const onRefresh = () => {
    loadMangas(true);
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando mangas populares..." />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Manga App</Text>
        <Text style={styles.subtitle}>Descubre los mejores mangas</Text>
      </View>

      <FlatList
        data={mangas}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <MangaCard manga={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={Theme.primary}
            colors={[Theme.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
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
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.lg,
    textAlign: 'center',
  },
});
