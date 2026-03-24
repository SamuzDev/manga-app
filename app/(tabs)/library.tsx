/**
 * Library Screen - Pantalla de biblioteca/favoritos
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { MangaCard } from '@/components/manga/MangaCard';
import { useLibraryStore } from '@/store/libraryStore';
import type { LibraryManga } from '@/types/manga';

type CategoryType = 'all' | LibraryManga['category'];

const CATEGORIES: { key: CategoryType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'reading', label: 'Leyendo' },
  { key: 'completed', label: 'Completados' },
  { key: 'plan_to_read', label: 'Por Leer' },
  { key: 'on_hold', label: 'En Espera' },
  { key: 'dropped', label: 'Abandonados' },
];

export default function LibraryScreen() {
  const { library, loadLibrary } = useLibraryStore();
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('all');
  const [filteredMangas, setFilteredMangas] = useState<LibraryManga[]>([]);

  useEffect(() => {
    loadLibrary();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredMangas(library);
    } else {
      setFilteredMangas(library.filter((m) => m.category === selectedCategory));
    }
  }, [library, selectedCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.title}>Mi Biblioteca</Text>
        <Text style={styles.subtitle}>{library.length} mangas</Text>
      </View>

      {/* Category Filter */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.key && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.key && styles.categoryChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Library Content */}
      {library.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Tu biblioteca está vacía</Text>
          <Text style={styles.emptySubtext}>
            Añade mangas desde la pantalla de detalles
          </Text>
        </View>
      ) : filteredMangas.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No hay mangas en esta categoría
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMangas}
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
    paddingBottom: Spacing.sm,
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
  categoriesContainer: {
    marginBottom: Spacing.md,
  },
  categoriesList: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Theme.backgroundTertiary,
    borderWidth: 1,
    borderColor: Theme.border,
  },
  categoryChipActive: {
    backgroundColor: Theme.primary,
    borderColor: Theme.primary,
  },
  categoryChipText: {
    fontSize: FontSizes.sm,
    fontWeight: '600',
    color: Theme.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emptyText: {
    color: Theme.textSecondary,
    fontSize: FontSizes.xl,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    color: Theme.textTertiary,
    fontSize: FontSizes.base,
    textAlign: 'center',
  },
});
