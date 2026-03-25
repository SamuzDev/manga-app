/**
 * Manga Reader Screen - Lector de manga con modo cascada
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { mangadexAPI } from '@/services/api/mangadex';
import type { Chapter } from '@/types/manga';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ReadingMode = 'cascade' | 'left-to-right' | 'right-to-left' | 'vertical';

interface PageData {
  uri: string;
  width: number;
  height: number;
  index: number;
}

export default function ChapterReaderScreen() {
  const { chapterId, mangaId } = useLocalSearchParams<{ chapterId: string; mangaId: string }>();
  const router = useRouter();
  
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [readingMode, setReadingMode] = useState<ReadingMode>('cascade');
  const [showSettings, setShowSettings] = useState(false);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadChapterPages();
  }, [chapterId]);

  const loadChapterPages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [pagesData, chapterData] = await Promise.all([
        mangadexAPI.getChapterPages(chapterId as string),
        mangadexAPI.getChapters(mangaId as string, { limit: 1 }),
      ]);

      const pageUrls = pagesData.chapter.data.map((fileName) =>
        mangadexAPI.getPageUrl(pagesData.baseUrl, pagesData.chapter.hash, fileName)
      );

      const pageDataArray: PageData[] = pageUrls.map((uri, index) => ({
        uri,
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH * 1.5,
        index,
      }));

      setPages(pageDataArray);
      setChapter(chapterData.data[0] || null);
    } catch (err) {
      console.error('Error loading chapter pages:', err);
      setError('Error al cargar las páginas del capítulo');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleControls = useCallback(() => {
    setShowControls((prev) => !prev);
  }, []);

  const goToPage = useCallback((index: number) => {
    if (index >= 0 && index < pages.length) {
      setCurrentPage(index);
      if (readingMode === 'cascade') {
        flatListRef.current?.scrollToIndex({ index, animated: false });
      }
    }
  }, [pages.length, readingMode]);

  const handlePreviousPage = useCallback(() => {
    if (readingMode === 'cascade') {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage, readingMode]);

  const handleNextPage = useCallback(() => {
    if (readingMode === 'cascade') {
      goToPage(currentPage + 1);
    }
  }, [currentPage, goToPage, readingMode]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentPage(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderCascadePage = useCallback(({ item, index }: { item: PageData; index: number }) => (
    <TouchableWithoutFeedback onPress={toggleControls}>
      <View style={styles.cascadePageContainer}>
        <ExpoImage
          source={{ uri: item.uri }}
          style={styles.cascadeImage}
          contentFit="contain"
          transition={200}
          priority={index <= currentPage + 2 ? 'high' : 'low'}
        />
      </View>
    </TouchableWithoutFeedback>
  ), [currentPage, toggleControls]);

  const getItemLayout = useCallback((_: any, index: number) => ({
    length: SCREEN_WIDTH * 1.5,
    offset: SCREEN_WIDTH * 1.5 * index,
    index,
  }), []);

  if (isLoading) {
    return <Loading fullScreen message="Cargando capítulo..." />;
  }

  if (error || pages.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error || 'No se pudieron cargar las páginas'}</Text>
        <Button title="Reintentar" onPress={loadChapterPages} />
        <Button title="Volver" onPress={() => router.back()} variant="secondary" />
      </View>
    );
  }

  const chapterTitle = chapter?.attributes.chapter
    ? `Capítulo ${chapter.attributes.chapter}`
    : 'Capítulo';

  return (
    <View style={styles.container}>
      <StatusBar hidden={!showControls} />
      
      {readingMode === 'cascade' ? (
        <FlatList
          ref={flatListRef}
          data={pages}
          renderItem={renderCascadePage}
          keyExtractor={(item) => item.uri}
          pagingEnabled={false}
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          initialNumToRender={3}
          maxToRenderPerBatch={5}
          windowSize={10}
          removeClippedSubviews={true}
        />
      ) : (
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {pages.map((page, index) => (
            <TouchableWithoutFeedback key={page.uri} onPress={toggleControls}>
              <View style={styles.pageContainer}>
                <ExpoImage
                  source={{ uri: page.uri }}
                  style={styles.pageImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>
            </TouchableWithoutFeedback>
          ))}
        </ScrollView>
      )}

      {showControls && (
        <>
          <Stack.Screen options={{ headerShown: false }} />
          
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.chapterTitle} numberOfLines={1}>
                {chapterTitle}
              </Text>
              <Text style={styles.pageIndicator}>
                {currentPage + 1} / {pages.length}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </TouchableOpacity>
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
              <Text
                style={[
                  styles.navButtonText,
                  currentPage === pages.length - 1 && styles.disabled,
                ]}
              >
                Siguiente ▶
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Modal
        visible={showSettings}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowSettings(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.settingsPanel}>
                <View style={styles.settingsHeader}>
                  <Text style={styles.settingsTitle}>Configuración de lectura</Text>
                  <TouchableOpacity onPress={() => setShowSettings(false)}>
                    <Text style={styles.closeButton}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.settingLabel}>Modo de lectura</Text>
                <View style={styles.modeButtons}>
                  {[
                    { key: 'cascade', label: 'Cascada' },
                    { key: 'vertical', label: 'Vertical' },
                  ].map((mode) => (
                    <TouchableOpacity
                      key={mode.key}
                      style={[
                        styles.modeButton,
                        readingMode === mode.key && styles.modeButtonActive,
                      ]}
                      onPress={() => {
                        setReadingMode(mode.key as ReadingMode);
                        setShowSettings(false);
                      }}
                    >
                      <Text
                        style={[
                          styles.modeButtonText,
                          readingMode === mode.key && styles.modeButtonTextActive,
                        ]}
                      >
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.settingLabel}>Navegación</Text>
                <Text style={styles.settingHint}>
                  Toca la pantalla para mostrar/ocultar controles
                </Text>
                <Text style={styles.settingHint}>
                  Desliza verticalmente para navegar en modo cascada
                </Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  },
  pageContainer: {
    width: SCREEN_WIDTH,
    alignItems: 'center',
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.5,
  },
  cascadePageContainer: {
    width: SCREEN_WIDTH,
    minHeight: SCREEN_HEIGHT * 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cascadeImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.5,
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
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
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
  settingsButton: {
    padding: Spacing.sm,
  },
  settingsIcon: {
    color: '#fff',
    fontSize: 24,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  settingsPanel: {
    backgroundColor: Theme.backgroundSecondary,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: 50,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  settingsTitle: {
    color: Theme.text,
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
  },
  closeButton: {
    color: Theme.textSecondary,
    fontSize: 24,
    padding: Spacing.sm,
  },
  settingLabel: {
    color: Theme.text,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  settingHint: {
    color: Theme.textTertiary,
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  modeButton: {
    flex: 1,
    backgroundColor: Theme.backgroundTertiary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: Theme.primary,
  },
  modeButtonText: {
    color: Theme.textSecondary,
    fontSize: FontSizes.base,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: '#fff',
  },
  errorText: {
    color: Theme.error,
    fontSize: FontSizes.lg,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
