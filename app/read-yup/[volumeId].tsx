/**
 * YupManga Reader Screen - Lector nativo usando API directa
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { yupMangaAPI } from '@/services/api/yupmanga';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

function ImageWithSize({ uri, priority }: { uri: string; priority: boolean }) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  return (
    <Image
      source={{ uri }}
      style={[
        styles.pageImage,
        dimensions ? { width: SCREEN_WIDTH, height: (SCREEN_WIDTH / dimensions.width) * dimensions.height } : {}
      ]}
      resizeMode="contain"
      onLoad={(e) => {
        const { width, height } = e.nativeEvent.source;
        setDimensions({ width, height });
      }}
    />
  );
}

interface PageData {
  uri: string;
  index: number;
}

export default function YupReaderScreen() {
  const { volumeId } = useLocalSearchParams<{ volumeId: string }>();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const chapterIdRef = useRef<string>('');
  const currentTokenRef = useRef<string>('');
  const hasLoadedAllRef = useRef(false);

  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const pagesLengthRef = useRef(0);
  
  const loadMorePages = useCallback(async () => {
    if (isLoadingMore || !chapterIdRef.current) return;
    
    const currentLength = pagesLengthRef.current;
    
    try {
      setIsLoadingMore(true);
      console.log('Loading more pages... current:', currentLength);
      const result = await yupMangaAPI.getVolumePages(chapterIdRef.current);
      console.log('More pages result:', result.pages.length);
      
      if (result.pages.length > currentLength) {
        // Añadir las páginas que faltan
        const newPages = result.pages.slice(currentLength).map((uri, index) => ({
          uri,
          index: currentLength + index,
        }));
        setPages(prev => [...prev, ...newPages]);
        pagesLengthRef.current = result.pages.length;
        console.log('Added', newPages.length, 'new pages. Total:', result.pages.length);
      } else if (result.pages.length > 0 && currentLength === 0) {
        setPages(result.pages.map((uri, index) => ({ uri, index })));
        pagesLengthRef.current = result.pages.length;
        console.log('Set to', result.pages.length, 'pages');
      }
    } catch (err) {
      console.error('Error loading more pages:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore]);

  const lastScrollY = useRef(0);
  
  const handleScroll = useCallback((event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Calcular página actual basada en posición del scroll
    const pageHeight = SCREEN_HEIGHT;
    const page = Math.floor(contentOffset.y / pageHeight);
    if (page >= 0 && page < pages.length) {
      setCurrentPage(page);
    }
  }, [pages.length]);

  const loadPages = useCallback(async (chapterId?: string | any) => {
    if (chapterId && typeof chapterId !== 'string') {
      chapterId = undefined;
    }
    const targetId = chapterId || chapterIdRef.current;
    if (!targetId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading pages for chapter:', targetId);
      const result = await yupMangaAPI.getVolumePages(targetId);
      console.log('Volume pages result:', result.pages.length, 'pages, token:', result.token ? 'yes' : 'no');

      if (result.pages.length === 0) {
        setError('No se encontraron páginas para este tomo');
        return;
      }

      currentTokenRef.current = result.token;
      pagesLengthRef.current = result.pages.length;
      setPages(result.pages.map((uri, index) => ({ uri, index })));
    } catch (err) {
      console.error('Error loading pages:', err);
      setError('Error al cargar las páginas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (volumeId) {
      const chapterId = decodeURIComponent(volumeId);
      chapterIdRef.current = chapterId;
      hasLoadedAllRef.current = false;
      loadPages(chapterId);
    }
  }, [volumeId, loadPages]);

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handleNextPage = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, pages.length]);

  if (isLoading) {
    return <Loading fullScreen message="Cargando páginas..." />;
  }

  if (error || pages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>{error || 'No se pudieron cargar las páginas'}</Text>
        <Button title="Reintentar" onPress={() => loadPages()} />
        <Button title="Volver" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showControls} />
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        ref={flatListRef}
        data={pages}
        keyExtractor={(item, index) => item.uri + index}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={1}
            onPress={toggleControls}
          >
            <View style={styles.pageContainer}>
              <ImageWithSize
                uri={item.uri}
                priority={index <= currentPage + 2}
              />
            </View>
          </TouchableOpacity>
        )}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={50}
        onEndReached={loadMorePages}
        onEndReachedThreshold={0.5}
        ListFooterComponent={isLoadingMore ? (
          <View style={styles.loadingMoreContainer}>
            <Text style={styles.loadingMoreText}>Cargando más páginas...</Text>
          </View>
        ) : null}
      />

      {showControls && (
        <>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
              <Text style={styles.headerButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.chapterTitle} numberOfLines={1}>Tomo</Text>
              <Text style={styles.pageIndicator}>
                {currentPage + 1} / {pages.length}
              </Text>
            </View>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={handlePreviousPage}
              disabled={currentPage === 0}
            >
              <Text style={[styles.navButtonText, currentPage === 0 && styles.disabled]}>
                ◀ Anterior
              </Text>
            </TouchableOpacity>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${((currentPage + 1) / pages.length) * 100}%` },
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextPage}
              disabled={currentPage === pages.length - 1}
            >
              <Text style={[styles.navButtonText, currentPage === pages.length - 1 && styles.disabled]}>
                Siguiente ▶
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 80,
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: undefined,
    resizeMode: 'contain',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chapterTitle: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  pageIndicator: {
    color: Theme.textTertiary,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: 40,
    paddingTop: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 10,
  },
  navButton: {
    padding: Spacing.sm,
  },
  navButtonText: {
    color: Theme.primary,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  disabled: {
    color: Theme.textTertiary,
  },
  progressContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  progressBar: {
    height: 4,
    backgroundColor: Theme.backgroundTertiary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Theme.primary,
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  loadingMoreContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  loadingMoreText: {
    color: Theme.textSecondary,
    fontSize: FontSizes.sm,
  },
});
