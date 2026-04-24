export type StickerPreset = {
  id: string
  label: string
  emoji: string
}

export const STICKER_PRESETS: StickerPreset[] = [
  { id: 'wow', label: 'WOW', emoji: '🔥' },
  { id: 'sale', label: 'SALE', emoji: '💸' },
  { id: 'star', label: 'TOP', emoji: '⭐' },
  { id: 'mint', label: 'MINT', emoji: '💎' },
  { id: 'hook', label: 'HOOK', emoji: '🎯' },
  { id: 'fast', label: 'FAST', emoji: '⚡' },
  { id: 'trend', label: 'TREND', emoji: '📈' },
  { id: 'cut', label: 'CUT', emoji: '✂️' },
  { id: 'react', label: 'REACT', emoji: '😮' },
  { id: 'win', label: 'WIN', emoji: '🏆' },
  { id: 'shop', label: 'SHOP', emoji: '🛍️' },
  { id: 'play', label: 'PLAY', emoji: '▶️' }
]

export const TEXT_PRESET_SUGGESTIONS = [
  'Gancho fuerte en 3 segundos',
  'Antes de seguir mira esto',
  'El error que casi todos cometen',
  'Mira cómo cambia el resultado',
  'Texto secundario editable',
  'Llamada a la acción clara y corta',
  'Subtítulo potente y visible',
  'Comparativa rápida antes y después',
  'Oferta directa sin rodeos',
  'Tutorial corto paso a paso',
  'Reacción en grande arriba',
  'Frase final para cerrar el clip'
]
