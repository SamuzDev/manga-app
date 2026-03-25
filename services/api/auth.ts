/**
 * Auth Service - Sistema de autenticación con JWT usando jose
 * 
 * Este servicio maneja toda la autenticación localmente en el dispositivo.
 * No requiere servidor externo - usa JWT para tokens y AsyncStorage para persistencia.
 * 
 * jose es compatible con React Native (no requiere crypto nativo).
 */

import * as jose from 'jose';
import * as SecureStore from 'expo-secure-store';

// Configuración de JWT
const JWT_SECRET = new TextEncoder().encode('manga-app-secret-key-2024');
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 días en segundos
const REFRESH_TOKEN_EXPIRY = 60 * 60 * 24 * 30; // 30 días en segundos

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

// Base de datos de usuarios en memoria
const usersDB = new Map<string, { user: User; passwordHash: string }>();

// Generar ID único
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Generar tokens JWT
const generateTokens = async (user: User): Promise<AuthTokens> => {
  const accessToken = await new jose.SignJWT({ userId: user.id, username: user.username })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const refreshToken = await new jose.SignJWT({ userId: user.id, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
};

// Verificar token JWT
const verifyToken = async (token: string): Promise<{ userId: string; username?: string } | null> => {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    return payload as { userId: string; username?: string };
  } catch (error) {
    return null;
  }
};

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

    // Hash simple de contraseña
    const passwordHash = this.simpleHash(password);

    // Guardar usuario
    usersDB.set(user.id, { user, passwordHash });

    // Generar tokens
    const tokens = await generateTokens(user);

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
    const tokens = await generateTokens(userRecord.user);

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
      const decoded = await verifyToken(tokens.accessToken);
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
      const decoded = await verifyToken(refreshToken);

      if (!decoded || (decoded as any).type !== 'refresh') {
        return null;
      }

      // Buscar usuario
      const userRecord = usersDB.get(decoded.userId);
      if (!userRecord) {
        return null;
      }

      // Generar nuevos tokens
      const tokens = await generateTokens(userRecord.user);

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

  // Hash simple de contraseña
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
