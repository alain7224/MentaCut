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
]
