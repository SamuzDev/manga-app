/**
 * Profile Screen - Pantalla de perfil de usuario
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Theme, FontSizes, Spacing, BorderRadius } from '@/constants/theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';

export default function ProfileScreen() {
  const { user, isAuthenticated, loadSession } = useAuthStore();
  const { library } = useLibraryStore();

  useEffect(() => {
    loadSession();
  }, []);

  // Estadísticas
  const stats = {
    total: library.length,
    reading: library.filter((m) => m.category === 'reading').length,
    completed: library.filter((m) => m.category === 'completed').length,
    planToRead: library.filter((m) => m.category === 'plan_to_read').length,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Info */}
        <Card style={styles.card}>
          {isAuthenticated && user ? (
            <View>
              <Text style={styles.username}>{user.username}</Text>
              {user.email && <Text style={styles.email}>{user.email}</Text>}
            </View>
          ) : (
            <View>
              <Text style={styles.username}>Usuario Invitado</Text>
              <Text style={styles.email}>Inicia sesión para sincronizar tus datos</Text>
            </View>
          )}
        </Card>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estadísticas</Text>
          
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.reading}</Text>
              <Text style={styles.statLabel}>Leyendo</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{stats.planToRead}</Text>
              <Text style={styles.statLabel}>Por Leer</Text>
            </Card>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configuración</Text>
          
          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>Tema</Text>
            <Text style={styles.settingValue}>Oscuro</Text>
          </Card>
          
          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>Idioma preferido</Text>
            <Text style={styles.settingValue}>Español</Text>
          </Card>
          
          <Card style={styles.settingCard}>
            <Text style={styles.settingLabel}>Versión</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </Card>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          {!isAuthenticated ? (
            <>
              <Button
                title="Iniciar Sesión"
                onPress={() => {
                  const { router } = require('expo-router');
                  router.push('/(auth)/login' as any);
                }}
                variant="primary"
                fullWidth
                style={styles.actionButton}
              />
              <Button
                title="Crear Cuenta"
                onPress={() => {
                  const { router } = require('expo-router');
                  router.push('/(auth)/register' as any);
                }}
                variant="outline"
                fullWidth
              />
            </>
          ) : (
            <Button
              title="Cerrar Sesión"
              onPress={async () => {
                const { logout } = useAuthStore.getState();
                await logout();
              }}
              variant="outline"
              fullWidth
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Manga App v1.0.0</Text>
          <Text style={styles.footerText}>Desarrollado con React Native</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.background,
  },
  scrollView: {
    flex: 1,
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
  },
  card: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
  },
  username: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Theme.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statValue: {
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    color: Theme.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSizes.sm,
    color: Theme.textSecondary,
  },
  settingCard: {
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: FontSizes.base,
    color: Theme.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: FontSizes.base,
    color: Theme.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  footerText: {
    fontSize: FontSizes.sm,
    color: Theme.textTertiary,
    marginBottom: 4,
  },
  actionButton: {
    marginBottom: Spacing.sm,
  },
});
