/**
 * YupManga Reader Screen - Usa WebView para extraer y mostrar páginas
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import { Image as ExpoImage } from 'expo-image';
import { Theme, FontSizes, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface PageData {
  uri: string;
  index: number;
}

export default function YupReaderScreen() {
  const { volumeId } = useLocalSearchParams<{ volumeId: string }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  
  const [pages, setPages] = useState<PageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNativeReader, setShowNativeReader] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const readerUrl = `https://www.yupmanga.com/reader_v2.php?chapter=${volumeId}&page=1`;

  const extractPagesJS = `
    (function() {
      // Extraer todas las URLs de las imágenes del reader
      const images = document.querySelectorAll('img.page-image');
      const pages = [];
      images.forEach((img, index) => {
        if (img.src) {
          pages.push(img.src);
        }
      });
      
      // Obtener el título del capítulo
      const chapterTitle = document.querySelector('.chapter-title')?.textContent || 'Tomo';
      
      // Responder con los datos
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'PAGES_EXTRACTED',
        pages: pages,
        chapterTitle: chapterTitle
      }));
    })();
    true;
  `;

  const hideUIJS = `
    (function() {
      // Ocultar navegación para lectura inmersiva
      const header = document.querySelector('.reader-header');
      if (header) header.style.display = 'none';
      
      // Ocultar footer si existe
      const footer = document.querySelector('footer');
      if (footer) footer.style.display = 'none';
      
      // Poner fondo negro
      document.body.style.backgroundColor = '#000';
      document.body.style.margin = '0';
      document.body.style.padding = '0';
      
      // Ajustar el contenedor
      const container = document.querySelector('.reader-container');
      if (container) {
        container.style.padding = '0';
        container.style.margin = '0';
        container.style.maxWidth = '100%';
      }
    })();
    true;
  `;

  const handleMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'PAGES_EXTRACTED' && data.pages.length > 0) {
        console.log('Pages extracted:', data.pages.length);
        setPages(data.pages.map((uri: string, index: number) => ({
          uri,
          index,
        })));
        setShowNativeReader(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  }, []);

  const handleWebViewLoad = useCallback(() => {
    // Después de cargar, extraer las páginas
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(extractPagesJS);
    }, 1000);
  }, []);

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

  if (showNativeReader && pages.length > 0) {
    return (
      <View style={styles.container}>
        <StatusBar hidden={!showControls} />
        
        <Stack.Screen options={{ headerShown: false }} />
        
        {showControls && (
          <SafeAreaView style={styles.topBarContainer}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => router.back()}
              >
                <Text style={styles.headerButtonText}>←</Text>
              </TouchableOpacity>
              <View style={styles.titleContainer}>
                <Text style={styles.chapterTitle} numberOfLines={1}>
                  Tomo
                </Text>
                <Text style={styles.pageIndicator}>
                  {currentPage + 1} / {pages.length}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setShowSettings(true)}
              >
                <Text style={styles.headerButtonText}>⚙</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}

        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          onScroll={(e) => {
            const pageHeight = SCREEN_WIDTH * 1.5;
            const page = Math.round(e.nativeEvent.contentOffset.y / pageHeight);
            if (page >= 0 && page < pages.length) {
              setCurrentPage(page);
            }
          }}
          scrollEventThrottle={16}
        >
          {pages.map((page, index) => (
            <TouchableOpacity 
              key={page.uri + index} 
              activeOpacity={1}
              onPress={toggleControls}
            >
              <View style={styles.pageContainer}>
                <ExpoImage
                  source={{ uri: page.uri }}
                  style={styles.pageImage}
                  contentFit="contain"
                  transition={200}
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showControls && (
          <SafeAreaView style={styles.bottomBarContainer}>
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
          </SafeAreaView>
        )}

        <View style={styles.settingsOverlay}>
          {showSettings && (
            <TouchableOpacity 
              style={styles.settingsBackdrop} 
              onPress={() => setShowSettings(false)}
            />
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <Stack.Screen options={{ headerShown: false }} />
      
      <SafeAreaView style={styles.topBarContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.chapterTitle}>Cargando...</Text>
          </View>
          <View style={styles.headerButton} />
        </View>
      </SafeAreaView>

      <WebView
        ref={webViewRef}
        source={{ uri: readerUrl }}
        style={styles.webView}
        onMessage={handleMessage}
        onLoadEnd={handleWebViewLoad}
        injectedJavaScript={hideUIJS}
        allowsBackForwardNavigationGestures={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Theme.primary} />
            <Text style={styles.loadingText}>Cargando lector...</Text>
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Theme.primary} />
          <Text style={styles.loadingText}>Extrayendo páginas...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  topBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
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
  webView: {
    flex: 1,
    backgroundColor: '#000',
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
  },
  pageImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.5,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 5,
  },
  loadingText: {
    color: '#fff',
    fontSize: FontSizes.base,
    marginTop: Spacing.md,
  },
  settingsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  settingsBackdrop: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
