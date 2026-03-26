/**
 * Root Layout - Configuración global de la app
 */

import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Theme } from '@/constants/theme';

export const unstable_settings = {
  anchor: '(tabs)',
};

// Crear QueryClient para React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// Tema personalizado basado en DarkTheme
const CustomDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: Theme.primary,
    background: Theme.background,
    card: Theme.card,
    text: Theme.text,
    border: Theme.border,
    notification: Theme.primary,
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Forzar modo oscuro
    SystemUI.setBackgroundColorAsync(Theme.background);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={CustomDarkTheme}>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: Theme.backgroundSecondary,
            },
            headerTintColor: Theme.text,
            headerShadowVisible: false,
            contentStyle: {
              backgroundColor: Theme.background,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="series/yup/[id]" 
            options={{ 
              headerShown: true,
              title: 'Serie',
              headerBackTitle: 'Atrás',
            }} 
          />
          <Stack.Screen 
            name="read-yup/[volumeId]" 
            options={{ 
              headerShown: false,
            }} 
          />
          <Stack.Screen 
            name="manga/[id]" 
            options={{ 
              headerShown: true,
              title: 'Detalle',
              headerBackTitle: 'Atrás',
            }} 
          />
          <Stack.Screen 
            name="(auth)/login" 
            options={{ 
              headerShown: true,
              title: 'Iniciar Sesión',
              headerBackTitle: 'Atrás',
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="(auth)/register" 
            options={{ 
              headerShown: true,
              title: 'Registrarse',
              headerBackTitle: 'Atrás',
              presentation: 'modal',
            }} 
          />
          <Stack.Screen 
            name="modal" 
            options={{ 
              presentation: 'modal', 
              title: 'Modal',
            }} 
          />
        </Stack>
        <StatusBar style="light" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
