# Manga App

Aplicación móvil de manga moderna y minimalista desarrollada con Expo y React Native.

## Características

- **Autenticación segura**: Sistema de login y registro con JWT
- **Diseño minimalista oscuro**: Interfaz elegante con tema dark optimizado para lectura
- **Exploración de manga**: Descubre los mangas más populares de MangaDex
- **Búsqueda avanzada**: Busca tus mangas favoritos por título
- **Biblioteca personal**: Guarda y organiza tus mangas en categorías
- **Detalles completos**: Visualiza información detallada, sinopsis, autores y capítulos
- **Sincronización de cuenta**: Sincroniza tu biblioteca con tu cuenta de MangaDex
- **Gestión de estado**: Zustand para manejo eficiente del estado
- **Almacenamiento seguro**: SecureStore para tokens JWT y AsyncStorage para datos
- **JWT Auth**: Tokens de acceso y refresh con duración de 7 y 30 días
- **API MangaDex**: Integración completa con la API de MangaDex

## Tecnologías

- **Expo SDK 54** - Framework para React Native
- **React Native 0.81** - Framework móvil
- **TypeScript** - Tipado estático
- **Expo Router** - Navegación file-based
- **Zustand** - Gestión de estado
- **React Query** - Data fetching y cache
- **AsyncStorage** - Almacenamiento local
- **Axios** - Cliente HTTP
- **MangaDex API** - Fuente de datos

## Estructura del Proyecto

```
manga-app/
├── app/                    # Rutas y pantallas
│   ├── (tabs)/            # Navegación por tabs
│   │   ├── index.tsx      # Home (Mangas populares)
│   │   ├── search.tsx     # Búsqueda
│   │   ├── library.tsx    # Biblioteca
│   │   └── profile.tsx    # Perfil
│   ├── manga/
│   │   └── [id].tsx       # Detalle de manga
│   └── _layout.tsx        # Layout raíz
├── components/
│   ├── manga/             # Componentes de manga
│   │   └── MangaCard.tsx
│   └── ui/                # Componentes UI
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── Loading.tsx
├── services/
│   ├── api/
│   │   └── mangadex.ts    # Cliente API MangaDex
│   └── storage/
│       └── mmkv.ts        # Utilidades de storage
├── store/                 # Zustand stores
│   ├── authStore.ts
│   ├── libraryStore.ts
│   └── readingStore.ts
├── types/
│   └── manga.ts           # Tipos TypeScript
└── constants/
    └── theme.ts           # Tema y estilos

```

## Instalación

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Iniciar la aplicación**

   ```bash
   npm start
   ```

   También puedes usar:
   ```bash
   npm run android  # Para Android
   npm run ios      # Para iOS
   npm run web      # Para Web
   ```

4. **Escanear el QR** con la app Expo Go (Android/iOS) o usar un emulador

## Uso

### Pantalla Principal (Home)
- Muestra los mangas más populares de MangaDex
- Pull-to-refresh para actualizar la lista
- Tap en cualquier manga para ver los detalles

### Búsqueda
- Busca mangas por título
- Búsqueda con debounce automático
- Resultados en tiempo real

### Detalle de Manga
- Información completa: título, autor, año, sinopsis
- Lista de capítulos disponibles
- Botón para añadir/quitar de biblioteca
- Tags y géneros

### Biblioteca
- Organiza tus mangas en categorías:
  - Leyendo
  - Completados
  - Por leer
  - En espera
  - Abandonados
- Filtros por categoría
- Almacenamiento local persistente

### Perfil
- Estadísticas de lectura
- Configuración de la app
- Información del usuario
- Login y registro
- Cerrar sesión

### Autenticación
- **Login**: Inicia sesión con tu cuenta de MangaDex
- **Registro**: Crea una nueva cuenta directamente en MangaDex
- **Sincronización**: Tus datos se sincronizan automáticamente
- **Tokens seguros**: Los tokens de sesión se guardan de forma segura
- **Auto-refresh**: Los tokens se refrescan automáticamente cuando expiran

## Configuración

### Tema

El tema oscuro está configurado en `constants/theme.ts`. Puedes personalizar:

- Colores (primarios, secundarios, backgrounds)
- Tamaños de fuente
- Espaciado
- Bordes y sombras

### API

La configuración de la API de MangaDex está en `services/api/mangadex.ts`. 

Base URL: `https://api.mangadex.org`

## Características Futuras

- [ ] Lector de capítulos completo
- [x] Autenticación con JWT
- [ ] Sincronización de progreso de lectura
- [ ] Modo offline con caché de imágenes
- [ ] Notificaciones de nuevos capítulos
- [ ] Temas personalizables (Light/Dark)
- [ ] Soporte multi-idioma
- [ ] Descarga de capítulos para lectura offline
- [ ] Historial de lectura
- [ ] Recomendaciones personalizadas

## Requisitos

- Node.js >= 18
- npm o yarn
- Expo CLI (opcional, incluido en el proyecto)
- iOS Simulator (para iOS) o Android Studio (para Android)

## Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run web        # Ejecutar en web
npm run lint       # Ejecutar ESLint
```

## Licencia

MIT

## Créditos

- **MangaDex API**: Fuente de datos de manga
- **Expo**: Framework de desarrollo
- **React Native**: Framework móvil
