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
  { id: 'hot-pill', name: 'Hot Pill', symbol: '⬭', style: 'hot' },
  { id: 'mint-spark', name: 'Mint Spark', symbol: '✺', style: 'mint' },
  { id: 'blue-waves', name: 'Blue Waves', symbol: '≈', style: 'blue' },
  { id: 'gold-crown', name: 'Gold Crown', symbol: '♛', style: 'gold' },
  { id: 'hot-bolt', name: 'Hot Bolt', symbol: '⚡', style: 'hot' },
  { id: 'mint-cross', name: 'Mint Cross', symbol: '✚', style: 'mint' },
  { id: 'blue-corner', name: 'Blue Corner', symbol: '⌜', style: 'blue' },
  { id: 'gold-sun', name: 'Gold Sun', symbol: '☼', style: 'gold' },
  { id: 'hot-flare', name: 'Hot Flare', symbol: '✹', style: 'hot' }
]
