export type TemplatePreset = {
  id: string
  name: string
  category: string
  accent: string
  previewGradient: string
  badge: string
  headline: string
  caption: string
}

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  { id: 'hook-crystal', name: 'Hook Crystal', category: 'Hook', accent: '#59ffd3', previewGradient: 'linear-gradient(135deg,#59ffd322,#7bc7ff22)', badge: 'HOOK', headline: 'Corta el scroll', caption: 'Entrada brillante con tipografía fuerte' },
  { id: 'podcast-glow', name: 'Podcast Glow', category: 'Podcast', accent: '#7bc7ff', previewGradient: 'linear-gradient(135deg,#7bc7ff22,#c89bff22)', badge: 'TALK', headline: 'Idea fuerte', caption: 'Marco limpio para talking head y cortes' },
  { id: 'shop-drop', name: 'Shop Drop', category: 'Venta', accent: '#ffcf6b', previewGradient: 'linear-gradient(135deg,#ffcf6b22,#59ffd322)', badge: 'DROP', headline: 'Producto arriba', caption: 'CTA claro con zona de producto destacada' },
  { id: 'sports-snap', name: 'Sports Snap', category: 'Deporte', accent: '#66f0ff', previewGradient: 'linear-gradient(135deg,#66f0ff22,#59ffd322)', badge: 'FAST', headline: 'Momento clave', caption: 'Cortes intensos y foco al centro' },
  { id: 'reaction-card', name: 'Reaction Card', category: 'Reacción', accent: '#ff8bf1', previewGradient: 'linear-gradient(135deg,#ff8bf122,#7bc7ff22)', badge: 'REACT', headline: 'Reacción en marco', caption: 'Espacio para cara + subtítulos fuertes' },
  { id: 'late-night', name: 'Late Night', category: 'Mood', accent: '#8aa2ff', previewGradient: 'linear-gradient(135deg,#8aa2ff22,#10182a)', badge: 'NIGHT', headline: 'Look nocturno', caption: 'Contraste elegante para vídeos oscuros' },
  { id: 'clean-demo', name: 'Clean Demo', category: 'Demo', accent: '#8cffd9', previewGradient: 'linear-gradient(135deg,#8cffd922,#ffffff10)', badge: 'DEMO', headline: 'Muestra el producto', caption: 'Plantilla limpia para demo o tutorial' },
  { id: 'viral-countdown', name: 'Viral Countdown', category: 'Hook', accent: '#ff9366', previewGradient: 'linear-gradient(135deg,#ff936622,#ffcf6b22)', badge: 'COUNT', headline: 'Cuenta atrás', caption: 'Perfecta para listas, pasos o ranking' },
  { id: 'faceless-kinetic', name: 'Faceless Kinetic', category: 'Texto', accent: '#59ffd3', previewGradient: 'linear-gradient(135deg,#59ffd322,#111827)', badge: 'TEXT', headline: 'Texto cinético', caption: 'Pensada para vídeos sin rostro' },
  { id: 'luxury-card', name: 'Luxury Card', category: 'Marca', accent: '#e3c07b', previewGradient: 'linear-gradient(135deg,#e3c07b22,#ffffff10)', badge: 'LUXE', headline: 'Marca premium', caption: 'Marco visual elegante y sobrio' },
  { id: 'duet-split', name: 'Duet Split', category: 'Comparación', accent: '#7bc7ff', previewGradient: 'linear-gradient(135deg,#7bc7ff22,#59ffd322)', badge: 'SPLIT', headline: 'Comparativa clara', caption: 'Layout inicial para mostrar dos ideas' },
  { id: 'adrenaline-cut', name: 'Adrenaline Cut', category: 'Fast', accent: '#ff6b6b', previewGradient: 'linear-gradient(135deg,#ff6b6b22,#ffcf6b22)', badge: 'FAST', headline: 'Energía alta', caption: 'Base agresiva para reels de impacto' },
  { id: 'mini-vlog', name: 'Mini Vlog', category: 'Vlog', accent: '#8ff0ff', previewGradient: 'linear-gradient(135deg,#8ff0ff22,#8aa2ff22)', badge: 'VLOG', headline: 'Día resumido', caption: 'Transiciones suaves para lifestyle y travel' },
  { id: 'market-blitz', name: 'Market Blitz', category: 'Venta', accent: '#ffb86b', previewGradient: 'linear-gradient(135deg,#ffb86b22,#ff6b6b22)', badge: 'SALE', headline: 'Oferta relámpago', caption: 'Ritmo rápido para promo y descuento' },
  { id: 'cinema-pulse', name: 'Cinema Pulse', category: 'Mood', accent: '#9dd6ff', previewGradient: 'linear-gradient(135deg,#9dd6ff22,#0f172a)', badge: 'FILM', headline: 'Ambiente cinematográfico', caption: 'Más aire, contraste y texto elegante' },
  { id: 'coach-cut', name: 'Coach Cut', category: 'Educación', accent: '#75ffb3', previewGradient: 'linear-gradient(135deg,#75ffb322,#7bc7ff22)', badge: 'COACH', headline: 'Aprende esto hoy', caption: 'Pensada para consejos cortos y directos' },
  { id: 'review-stack', name: 'Review Stack', category: 'Review', accent: '#ffd86b', previewGradient: 'linear-gradient(135deg,#ffd86b22,#ffffff10)', badge: 'REVIEW', headline: 'Lo bueno y lo malo', caption: 'Comparativa rápida para opinión o análisis' },
  { id: 'story-burst', name: 'Story Burst', category: 'Story', accent: '#ff8bcb', previewGradient: 'linear-gradient(135deg,#ff8bcb22,#7bc7ff22)', badge: 'STORY', headline: 'Historia en segundos', caption: 'Estructura para contar un mini relato visual' },
  { id: 'food-flash', name: 'Food Flash', category: 'Comida', accent: '#ff9b6b', previewGradient: 'linear-gradient(135deg,#ff9b6b22,#ffcf6b22)', badge: 'FOOD', headline: 'Se ve brutal', caption: 'Pensada para planos apetecibles y close-ups' },
  { id: 'gaming-hit', name: 'Gaming Hit', category: 'Gaming', accent: '#66ffdd', previewGradient: 'linear-gradient(135deg,#66ffdd22,#8a7bff22)', badge: 'GG', headline: 'Jugada fuerte', caption: 'Marco agresivo para highlights de juego' },
  { id: 'news-flash', name: 'News Flash', category: 'Noticias', accent: '#7ec7ff', previewGradient: 'linear-gradient(135deg,#7ec7ff22,#ffffff10)', badge: 'NEWS', headline: 'Titular rápido', caption: 'Perfecta para info breve y datos al punto' },
  { id: 'travel-card', name: 'Travel Card', category: 'Travel', accent: '#78ffd6', previewGradient: 'linear-gradient(135deg,#78ffd622,#7bc7ff22)', badge: 'TRIP', headline: 'Lugar que impresiona', caption: 'Pensada para tomas limpias y paisajes' },
  { id: 'beauty-pop', name: 'Beauty Pop', category: 'Beauty', accent: '#ff9fda', previewGradient: 'linear-gradient(135deg,#ff9fda22,#ffffff10)', badge: 'BEAUTY', headline: 'Resultado final', caption: 'Ideal para before/after y close-up' },
  { id: 'finance-tick', name: 'Finance Tick', category: 'Finanzas', accent: '#73ffb0', previewGradient: 'linear-gradient(135deg,#73ffb022,#0f172a)', badge: 'MONEY', headline: 'Dato clave', caption: 'Pensada para tips y cifras rápidas' },
  { id: 'fitness-core', name: 'Fitness Core', category: 'Fitness', accent: '#ff8e6b', previewGradient: 'linear-gradient(135deg,#ff8e6b22,#ffcf6b22)', badge: 'FIT', headline: 'Haz este ejercicio', caption: 'Estructura para rutinas y progreso' },
  { id: 'recipe-swipe', name: 'Recipe Swipe', category: 'Comida', accent: '#ffc56b', previewGradient: 'linear-gradient(135deg,#ffc56b22,#ff8e6b22)', badge: 'RECIPE', headline: 'Paso rápido', caption: 'Cocina visual con ritmo ligero' },
  { id: 'luxury-reveal', name: 'Luxury Reveal', category: 'Marca', accent: '#e8c58c', previewGradient: 'linear-gradient(135deg,#e8c58c22,#10182a)', badge: 'ELITE', headline: 'Presentación elegante', caption: 'Diseño sobrio para producto premium' },
  { id: 'street-drop', name: 'Street Drop', category: 'Moda', accent: '#89f0ff', previewGradient: 'linear-gradient(135deg,#89f0ff22,#8a7bff22)', badge: 'DROP', headline: 'Nueva pieza', caption: 'Plantilla agresiva para streetwear y moda' },
  { id: 'teach-card', name: 'Teach Card', category: 'Educación', accent: '#8dfcc1', previewGradient: 'linear-gradient(135deg,#8dfcc122,#7bc7ff22)', badge: 'LEARN', headline: 'Concepto clave', caption: 'Didáctica rápida para contenido útil' },
  { id: 'myth-buster', name: 'Myth Buster', category: 'Hook', accent: '#ff897e', previewGradient: 'linear-gradient(135deg,#ff897e22,#ffcf6b22)', badge: 'MYTH', headline: 'Esto es falso', caption: 'Perfecta para desmontar ideas rápidas' },
  { id: 'quote-flow', name: 'Quote Flow', category: 'Texto', accent: '#90e7ff', previewGradient: 'linear-gradient(135deg,#90e7ff22,#ffffff10)', badge: 'QUOTE', headline: 'Frase potente', caption: 'Línea limpia para frases y reflexiones' },
  { id: 'count-up', name: 'Count Up', category: 'Hook', accent: '#77ffd1', previewGradient: 'linear-gradient(135deg,#77ffd122,#7bc7ff22)', badge: 'UP', headline: 'Sube el nivel', caption: 'Pensada para progreso o ranking inverso' },
  { id: 'collage-snap', name: 'Collage Snap', category: 'Story', accent: '#ffaf7a', previewGradient: 'linear-gradient(135deg,#ffaf7a22,#ff8bcb22)', badge: 'GRID', headline: 'Varios momentos', caption: 'Layout rápido para collage visual' },
  { id: 'tech-drop', name: 'Tech Drop', category: 'Tech', accent: '#7ab8ff', previewGradient: 'linear-gradient(135deg,#7ab8ff22,#0f172a)', badge: 'TECH', headline: 'Prueba esto', caption: 'Diseño limpio para gadgets y demos' },
  { id: 'pet-loop', name: 'Pet Loop', category: 'Mascotas', accent: '#ffd77a', previewGradient: 'linear-gradient(135deg,#ffd77a22,#78ffd622)', badge: 'PET', headline: 'Momento adorable', caption: 'Funciona muy bien para clips tiernos y rápidos' },
  { id: 'pod-short', name: 'Pod Short', category: 'Podcast', accent: '#9ea8ff', previewGradient: 'linear-gradient(135deg,#9ea8ff22,#c89bff22)', badge: 'MIC', headline: 'Punto clave', caption: 'Corto vertical para extractos de podcast' },
  { id: 'debate-cut', name: 'Debate Cut', category: 'Comparación', accent: '#ff9b9b', previewGradient: 'linear-gradient(135deg,#ff9b9b22,#7bc7ff22)', badge: 'VS', headline: 'Dos posturas', caption: 'Comparación visual para debate o análisis' },
  { id: 'minimal-hook', name: 'Minimal Hook', category: 'Hook', accent: '#d7f8ff', previewGradient: 'linear-gradient(135deg,#d7f8ff22,#111827)', badge: 'MIN', headline: 'Solo lo importante', caption: 'Plantilla mínima para foco absoluto' },
  { id: 'creator-log', name: 'Creator Log', category: 'Vlog', accent: '#7ff1d8', previewGradient: 'linear-gradient(135deg,#7ff1d822,#10182a)', badge: 'LOG', headline: 'Día de creador', caption: 'Ideal para behind the scenes y progreso' },
  { id: 'flash-opener', name: 'Flash Opener', category: 'Fast', accent: '#ff7f72', previewGradient: 'linear-gradient(135deg,#ff7f7222,#ffcf6b22)', badge: 'OPEN', headline: 'Empieza fuerte', caption: 'Hook con entrada muy rápida y visual' },
]
