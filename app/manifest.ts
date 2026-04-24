import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MentaCut',
    short_name: 'MentaCut',
    description: 'Editor de vídeo local-first para clips cortos.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070b14',
    theme_color: '#0b1220',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  }
}
