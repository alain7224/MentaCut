# MentaCut ✂️

> Editor web de vídeo y clips cortos con estilo visual moderno, enfoque mobile-first y base local para proyectos, media, biblioteca y flujo de estudio.

## Qué es MentaCut

MentaCut **no es un acortador de enlaces**.

MentaCut es una aplicación orientada a la **creación y edición de clips de vídeo** con una estructura de producto pensada para evolucionar hacia un editor más completo de formato corto, con:

- editor de estudio
- gestión de proyectos
- gestión de media local
- biblioteca de plantillas, stickers, overlays y textos
- backup local
- ajustes locales
- workspace general del producto

## Estado actual del proyecto

La aplicación ya incluye una base funcional de interfaz en Next.js con varias rutas reales dentro del producto:

- `/studio` — estudio/editor principal
- `/studio/workspace` — vista general del workspace
- `/studio/new` — asistente para crear proyectos nuevos
- `/studio/projects` — gestión de proyectos locales
- `/studio/media` — librería de media local
- `/studio/library` — biblioteca de presets y recursos
- `/studio/backup` — exportación e importación de backups locales
- `/studio/settings` — ajustes locales del estudio
- `/studio/open` — arranque inteligente según preferencias guardadas

## Funciones ya trabajadas en la base actual

### Editor / Studio
- timeline visual
- playhead
- regla de tiempo
- carriles de vídeo, audio y texto
- selección de clips
- split de clips
- trim visual
- mover, duplicar y borrar clips
- copy editable por clip
- overlays gráficos
- stickers
- plantillas base

### Organización del producto
- workspace con resumen del estado local
- proyectos locales con crear, duplicar, renombrar y borrar
- media local con preview y filtros
- biblioteca con búsqueda y favoritos
- backup local JSON
- preferencias locales del estudio

### Personalización local
- favoritos para plantillas, stickers, overlays y textos
- ruta de inicio preferida
- formato por defecto para proyectos nuevos
- opciones de comportamiento del estudio

## Tecnología principal

| Capa | Tecnología |
|------|-----------|
| App web | [Next.js](https://nextjs.org/) |
| UI | React + rutas App Router |
| Persistencia local | `localStorage` + capa local de media del navegador |
| Editor base | Componentes propios del estudio |
| Estilo visual | CSS propio con enfoque moderno / iOS crystal-like |

## Instalación y uso

```bash
npm install
npm run dev
```

Luego abre:

```bash
http://localhost:3000
```

## Scripts principales

```bash
npm run dev
npm run build
npm start
```

## Dirección del producto

La dirección correcta de MentaCut es:

- **editor de vídeo y clips cortos**
- **no** acortador de URLs
- aplicación separada por áreas de trabajo
- evolución hacia un producto de edición más completo

## Nota importante

Si en el historial del repositorio, PRs antiguos o textos automáticos aparece que MentaCut era una app para acortar enlaces, eso corresponde a una interpretación errónea anterior del proyecto y **no describe el enfoque real actual de MentaCut**.

## Licencia

MIT
