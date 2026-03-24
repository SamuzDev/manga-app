/**
 * MangaCard Component - Tarjeta para mostrar un manga
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Theme, FontSizes, BorderRadius, Spacing } from '@/constants/theme';
import type { SimpleManga } from '@/types/manga';

interface MangaCardProps {
  manga: SimpleManga;
  width?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 3) / 2; // 2 columnas con espaciado

export const MangaCard: React.FC<MangaCardProps> = ({ manga, width = CARD_WIDTH }) => {
  const handlePress = () => {
    router.push(`/manga/${manga.id}` as any);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: manga.coverUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        {manga.status === 'completed' && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Completado</Text>
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {manga.title}
        </Text>
        
        {manga.year && (
          <Text style={styles.year}>{manga.year}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    backgroundColor: Theme.card,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.7, // Ratio típico de portadas de manga
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: Theme.backgroundTertiary,
  },
  badge: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    backgroundColor: Theme.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.sm,
  },
  title: {
    color: Theme.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 2,
  },
  year: {
    color: Theme.textTertiary,
    fontSize: FontSizes.xs,
  },
});
