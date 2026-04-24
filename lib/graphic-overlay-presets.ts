export type GraphicOverlayPreset = {
  id: string
  name: string
  symbol: string
  style: 'mint' | 'blue' | 'gold' | 'hot'
}

export const GRAPHIC_OVERLAY_PRESETS: GraphicOverlayPreset[] = [
  { id: 'mint-ring', name: 'Mint Ring', symbol: '◌', style: 'mint' },
  { id: 'blue-frame', name: 'Blue Frame', symbol: '▣', style: 'blue' },
  { id: 'gold-star', name: 'Gold Star', symbol: '✦', style: 'gold' },
  { id: 'hot-arrow', name: 'Hot Arrow', symbol: '➜', style: 'hot' },
  { id: 'mint-burst', name: 'Mint Burst', symbol: '✳', style: 'mint' },
  { id: 'blue-underline', name: 'Blue Underline', symbol: '﹏', style: 'blue' },
  { id: 'gold-badge', name: 'Gold Badge', symbol: '⬢', style: 'gold' },
  { id: 'hot-pill', name: 'Hot Pill', symbol: '⬭', style: 'hot' }
]
