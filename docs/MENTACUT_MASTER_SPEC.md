# MentaCut · master spec

## Dirección visual
- UI estilo iOS cristal
- todos los botones con animación real
- look premium, no infantil
- inspiración visual propia y moderna
- timeline tipo editor profesional

## Objetivo del producto
App de edición de vídeo real, funcional, orientada a formatos cortos sociales, con editor web moderno, subida de media, timeline, plantillas animadas, subtítulos, overlays, audio y export fiable.

## Plataforma objetivo
- web responsiva real
- escritorio y móvil
- Android móvil
- iPhone usable desde Safari
- PWA/instalable desde Safari como vía práctica inicial
- evitar dependencia de firma de App Store en la primera fase
- arquitectura preparada para que más adelante se pueda separar en app nativa si compensa

## Requisitos recuperados del chat

### Plantillas
- más de 50 plantillas animadas reales
- cada plantilla debe tener preview animada
- el usuario debe ver mockup o vídeo incrustado de cómo se vería un vídeo hecho con esa plantilla
- las plantillas deben ser aplicables de verdad al render, no decorativas

### Texto / stickers / overlays
- más de 50 textos editables
- más de 60 stickers
- overlays reales y editables
- recolocación libre dentro del recuadro
- resize / estirar / encoger
- pegar / cortar / cargar

### Audio
- subir audio propio
- mezcla con audio original
- detector de tiempos y ritmo en el audio
- tiempos/rhythm aplicables a plantillas
- zoom y preview sobre la pista de audio

### Timeline / editor
- línea de tiempo tipo editor avanzado
- preview en audio, vídeo y foto
- zoom en la línea de tiempo
- trim fino
- cortar / mover / duplicar / borrar
- recolocar imagen dentro del encuadre
- formatos 9:16 / 1:1 / 4:5 / 16:9

### Render / backend
- worker FFmpeg real
- cola de exportación real
- base de datos real
- auth real
- storage real
- admin real
- logs reales

## Regla del proyecto
- nada de prototipo
- nada de placeholder
- nada de archivos promesa
- cada bloque que se suba debe ser funcional de verdad

## Plan de construcción por hitos
1. base real del repo y arquitectura
2. auth + DB + subida de media
3. editor real + timeline + trim + zoom
4. plantillas + previews + textos + stickers
5. audio upload + beat/rhythm detection + mezcla
6. worker FFmpeg + export real
7. admin + cola + logs + estabilización
