/**
 * Auth Service - Sistema de autenticación con JWT
 * 
 * Este servicio maneja toda la autenticación localmente en el dispositivo.
 * No requiere servidor externo - usa JWT para tokens y AsyncStorage para persistencia.
 * 
 * Para producción, esto se conectaría a un backend real.
 */

import jwt from 'jsonwebtoken';
import * as SecureStore from 'expo-secure-store';
import { storageUtils, StorageKeys } from '@/services/storage/mmkv';

// Configuración de JWT
const JWT_SECRET = 'manga-app-secret-key-2024'; // En producción, usar variable de entorno
const TOKEN_EXPIRY = '7d'; // 7 días
const REFRESH_TOKEN_EXPIRY = '30d'; // 30 días

// Tipos
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Keys de storage
const USER_KEY = 'manga_app_user';
const TOKENS_KEY = 'manga_app_tokens';

// Generar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generar tokens JWT
const generateTokens = (user: User): AuthTokens => {
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  const refreshToken = jwt.sign(
    { userId: user.id, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return { accessToken, refreshToken };
};

// Verificar token JWT
const verifyToken = (token: string): { userId: string; username?: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    return null;
  }
};

// Base de datos de usuarios en memoria (para desarrollo)
// En producción, esto se reemplazaría con llamadas a un backend
const usersDB = new Map<string, { user: User; passwordHash: string }>();

// Clase de autenticación
class AuthService {
  // Registrar nuevo usuario
  async register(username: string, email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Validar que el usuario no existe
    const existingUser = Array.from(usersDB.values()).find(
      (u) => u.user.username.toLowerCase() === username.toLowerCase() || u.user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      throw new Error('El usuario o email ya está registrado');
    }

    // Validar longitud de contraseña
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres');
    }

    // Crear usuario
    const user: User = {
      id: generateId(),
      username: username.trim(),
      email: email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    // Hash simple de contraseña (en producción, usar bcrypt)
    const passwordHash = this.simpleHash(password);

    // Guardar usuario
    usersDB.set(user.id, { user, passwordHash });

    // Generar tokens
    const tokens = generateTokens(user);

    // Guardar en storage seguro
    await this.saveTokens(tokens);
    await this.saveUser(user);

    return { user, tokens };
  }

  // Iniciar sesión
  async login(usernameOrEmail: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
    // Buscar usuario
    const userRecord = Array.from(usersDB.values()).find(
      (u) =>
        u.user.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        u.user.email.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!userRecord) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Verificar contraseña
    const passwordHash = this.simpleHash(password);
    if (userRecord.passwordHash !== passwordHash) {
      throw new Error('Usuario o contraseña incorrectos');
    }

    // Generar tokens
    const tokens = generateTokens(userRecord.user);

    // Guardar en storage seguro
    await this.saveTokens(tokens);
    await this.saveUser(userRecord.user);

    return { user: userRecord.user, tokens };
  }

  // Cerrar sesión
  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync(TOKENS_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  }

  // Verificar sesión actual
  async getSession(): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      const tokensJson = await SecureStore.getItemAsync(TOKENS_KEY);
      const userJson = await SecureStore.getItemAsync(USER_KEY);

      if (!tokensJson || !userJson) {
        return null;
      }

      const tokens: AuthTokens = JSON.parse(tokensJson);
      const user: User = JSON.parse(userJson);

      // Verificar que el token no ha expirado
      const decoded = verifyToken(tokens.accessToken);
      if (!decoded) {
        // Token expirado, intentar refresh
        const refreshed = await this.refreshSession(tokens.refreshToken);
        if (refreshed) {
          return refreshed;
        }
        // Refresh falló, limpiar sesión
        await this.logout();
        return null;
      }

      return { user, tokens };
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Refrescar sesión
  async refreshSession(refreshToken: string): Promise<{ user: User; tokens: AuthTokens } | null> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as any;

      if (decoded.type !== 'refresh') {
        return null;
      }

      // Buscar usuario
      const userRecord = usersDB.get(decoded.userId);
      if (!userRecord) {
        return null;
      }

      // Generar nuevos tokens
      const tokens = generateTokens(userRecord.user);

      // Guardar nuevos tokens
      await this.saveTokens(tokens);

      return { user: userRecord.user, tokens };
    } catch (error) {
      return null;
    }
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User | null> {
    const userJson = await SecureStore.getItemAsync(USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson);
  }

  // Guardar tokens en storage seguro
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
  }

  // Guardar usuario en storage
  private async saveUser(user: User): Promise<void> {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  }

  // Hash simple de contraseña (NO usar en producción)
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }
}

// Exportar instancia única
export const authService = new AuthService();
export default authService;
