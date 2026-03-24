# Guía de Autenticación - Manga App

## Descripción General

La app implementa autenticación completa con la API de MangaDex, permitiendo a los usuarios:
- Crear cuentas nuevas en MangaDex
- Iniciar sesión con credenciales existentes
- Mantener la sesión activa con tokens
- Sincronizar su biblioteca con su cuenta

## Flujo de Autenticación

### 1. Registro de Nuevos Usuarios

**Pantalla:** `app/(auth)/register.tsx`

**Campos requeridos:**
- Username (3-64 caracteres)
- Email (válido)
- Password (mínimo 8 caracteres)
- Confirmación de contraseña

**Proceso:**
1. Usuario completa el formulario
2. Se validan los campos localmente
3. Se envía petición POST a `/account/create` en MangaDex API
4. Si es exitoso, se hace login automáticamente
5. Se guardan los tokens en SecureStore
6. Se redirige al usuario a la app

**Manejo de errores:**
- Username duplicado
- Email ya registrado
- Contraseña débil
- Errores de red

### 2. Inicio de Sesión

**Pantalla:** `app/(auth)/login.tsx`

**Campos requeridos:**
- Username o email
- Password

**Proceso:**
1. Usuario ingresa credenciales
2. Se envía petición POST a `/auth/login` en MangaDex API
3. Se reciben tokens de sesión y refresh
4. Se guardan tokens en SecureStore de forma segura
5. Se obtiene información del usuario con `/user/me`
6. Se guarda información del usuario
7. Se actualiza el estado global (Zustand)

**Tokens:**
- **Session Token**: Token de acceso de corta duración
- **Refresh Token**: Token para renovar la sesión

### 3. Mantener la Sesión

**Archivo:** `store/authStore.ts`

La app mantiene la sesión activa mediante:

1. **Carga de sesión al iniciar:**
   - Lee tokens de SecureStore
   - Restaura información del usuario
   - Configura tokens en el cliente API

2. **Auto-refresh:**
   - Si el token de sesión expira
   - Se usa el refresh token para obtener uno nuevo
   - El proceso es transparente para el usuario

3. **Validación de sesión:**
   - Al cargar, se verifica la sesión con `/user/me`
   - Si falla, se intenta refrescar
   - Si todo falla, se cierra la sesión

### 4. Cerrar Sesión

**Proceso:**
1. Se envía petición POST a `/auth/logout`
2. Se eliminan tokens de SecureStore
3. Se limpia el estado global
4. Se limpian tokens del cliente API
5. Usuario vuelve a estado no autenticado

## Estructura de Código

### AuthStore (`store/authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}
```

### MangaDex API Client (`services/api/mangadex.ts`)

Métodos de autenticación:
- `login(username, password)` - Iniciar sesión
- `register(username, email, password)` - Crear cuenta
- `getMe()` - Obtener info del usuario
- `logout()` - Cerrar sesión
- `refreshSession()` - Renovar token
- `setTokens(session, refresh)` - Establecer tokens
- `clearTokens()` - Limpiar tokens

### Interceptor de Requests

El cliente Axios incluye un interceptor que:
- Añade automáticamente el token a todas las peticiones
- Header: `Authorization: Bearer {sessionToken}`
- Se ejecuta en cada petición HTTP

## Seguridad

### SecureStore

Los tokens se guardan usando `expo-secure-store`:
- Encriptación a nivel de SO
- iOS: Keychain
- Android: KeyStore

**Keys utilizadas:**
- `manga_app_session` - Token de sesión
- `manga_app_refresh` - Token de refresh
- `manga_app_user` - Info del usuario (JSON)

### Mejores Prácticas

1. **Nunca exponer tokens:**
   - No se imprimen en logs
   - No se envían a analytics
   - No se guardan en AsyncStorage normal

2. **Validación de input:**
   - Validación en cliente antes de enviar
   - Mensajes de error claros
   - Prevención de inyecciones

3. **Manejo de errores:**
   - Errores específicos según tipo
   - No revelar información sensible
   - Timeout de sesión apropiado

## UI/UX

### Feedback Visual

**Toast Notifications:**
- Éxito: "¡Bienvenido de nuevo!" / "¡Cuenta creada!"
- Error: Mensajes específicos según el problema
- Duración: 3 segundos (éxito) / 4 segundos (error)

**Estados de Loading:**
- Botones deshabilitados durante peticiones
- Indicador de carga en botones
- Inputs bloqueados mientras se procesa

**Validación en tiempo real:**
- Errores se muestran debajo de cada campo
- Se limpian al corregir el input
- Colores: rojo para errores

## Navegación

### Flujo de Navegación

```
Profile Screen
  ↓ (tap "Iniciar Sesión")
Login Screen
  ↓ (tap "Regístrate aquí")
Register Screen
  ↓ (registro exitoso)
← Back to Profile (autenticado)
```

**Configuración de rutas:**
- Login: `/(auth)/login` - Modal presentation
- Register: `/(auth)/register` - Modal presentation
- Ambas con header y botón de cerrar

## Testing de Autenticación

### Caso de Prueba 1: Registro Exitoso

1. Ir a Perfil
2. Tap en "Crear Cuenta"
3. Completar formulario:
   - Username único
   - Email válido
   - Contraseña segura
   - Confirmar contraseña
4. Tap "Registrarse"
5. ✅ Ver toast de éxito
6. ✅ Redirigir a perfil autenticado
7. ✅ Ver nombre de usuario en perfil

### Caso de Prueba 2: Login Exitoso

1. Ir a Perfil
2. Tap en "Iniciar Sesión"
3. Ingresar credenciales válidas
4. Tap "Iniciar Sesión"
5. ✅ Ver toast "¡Bienvenido de nuevo!"
6. ✅ Redirigir a perfil
7. ✅ Ver datos del usuario

### Caso de Prueba 3: Errores de Validación

1. Intentar login con campos vacíos
2. ✅ Ver errores debajo de campos
3. Intentar con contraseña corta
4. ✅ Ver error de validación
5. Intentar con email inválido en registro
6. ✅ Ver error de formato

### Caso de Prueba 4: Persistencia de Sesión

1. Hacer login
2. Cerrar app completamente
3. Abrir app de nuevo
4. ✅ Usuario sigue autenticado
5. ✅ Ver datos en perfil sin hacer login

### Caso de Prueba 5: Logout

1. Estando autenticado
2. Ir a Perfil
3. Tap "Cerrar Sesión"
4. ✅ Ver botones de login/registro
5. ✅ Biblioteca local persiste
6. ✅ Usuario no autenticado

## Troubleshooting

### Error: "Usuario o contraseña incorrectos"
- Verificar credenciales
- Probar en mangadex.org
- Revisar CAPS LOCK

### Error: "Error de conexión"
- Verificar internet
- Revisar que MangaDex esté disponible
- Intentar más tarde

### Error: "Username ya existe"
- Elegir otro nombre de usuario
- Probar con variaciones

### Error: "Email ya registrado"
- Usar otro email
- Verificar si ya tienes cuenta
- Ir a login en lugar de registro

### La sesión expira constantemente
- Verificar conectividad
- Refresh token puede estar inválido
- Hacer logout y login de nuevo

## API Endpoints Usados

```
POST /auth/login
Body: { username, password }
Response: { token: { session, refresh } }

POST /account/create
Body: { username, email, password }
Response: { result: 'ok' }

GET /user/me
Headers: Authorization: Bearer {token}
Response: { data: { id, attributes: { username, email, roles } } }

POST /auth/logout
Headers: Authorization: Bearer {token}
Response: { result: 'ok' }

POST /auth/refresh
Body: { token: refreshToken }
Response: { token: { session, refresh } }
```

## Documentación Adicional

- [MangaDex API Docs](https://api.mangadex.org/docs/)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [Zustand](https://github.com/pmndrs/zustand)
