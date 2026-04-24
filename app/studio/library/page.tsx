'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS, TEXT_PRESET_SUGGESTIONS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'
import { readLocalLibraryFavorites, toggleFavoriteId, writeLocalLibraryFavorites, type LocalLibraryFavorites } from '@/lib/local-library'

type TabKey = 'templates' | 'stickers' | 'overlays' | 'texts'

export default function StudioLibraryPage() {
  const [tab, setTab] = useState<TabKey>('templates')
  const [query, setQuery] = useState('')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState<LocalLibraryFavorites>({
    templateIds: [],
    stickerIds: [],
    overlayIds: [],
    textValues: [],
  })

  useEffect(() => {
    setFavorites(readLocalLibraryFavorites())
  }, [])

  const normalized = query.trim().toLowerCase()

  const templateCategories = useMemo(() => ['Todas', ...Array.from(new Set(TEMPLATE_PRESETS.map((item) => item.category)))], [])
  const [templateCategory, setTemplateCategory] = useState('Todas')

  function persistFavorites(next: LocalLibraryFavorites) {
    setFavorites(next)
    writeLocalLibraryFavorites(next)
  }

  function toggleTemplateFavorite(id: string) {
    persistFavorites({ ...favorites, templateIds: toggleFavoriteId(favorites.templateIds, id) })
  }

  function toggleStickerFavorite(id: string) {
    persistFavorites({ ...favorites, stickerIds: toggleFavoriteId(favorites.stickerIds, id) })
  }

  function toggleOverlayFavorite(id: string) {
    persistFavorites({ ...favorites, overlayIds: toggleFavoriteId(favorites.overlayIds, id) })
  }

  function toggleTextFavorite(value: string) {
    persistFavorites({ ...favorites, textValues: toggleFavoriteId(favorites.textValues, value) })
  }

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_PRESETS.filter((item) => {
      const matchesCategory = templateCategory === 'Todas' || item.category === templateCategory
      const matchesQuery = !normalized || `${item.name} ${item.category} ${item.headline} ${item.caption}`.toLowerCase().includes(normalized)
      const matchesFavorite = !favoritesOnly || favorites.templateIds.includes(item.id)
      return matchesCategory && matchesQuery && matchesFavorite
    })
  }, [normalized, templateCategory, favoritesOnly, favorites.templateIds])

  const filteredStickers = useMemo(() => {
    return STICKER_PRESETS.filter((item) => {
      const matchesQuery = !normalized || `${item.label} ${item.emoji}`.toLowerCase().includes(normalized)
      const matchesFavorite = !favoritesOnly || favorites.stickerIds.includes(item.id)
      return matchesQuery && matchesFavorite
    })
  }, [normalized, favoritesOnly, favorites.stickerIds])

  const filteredOverlays = useMemo(() => {
    return GRAPHIC_OVERLAY_PRESETS.filter((item) => {
      const matchesQuery = !normalized || `${item.name} ${item.symbol} ${item.style}`.toLowerCase().includes(normalized)
      const matchesFavorite = !favoritesOnly || favorites.overlayIds.includes(item.id)
      return matchesQuery && matchesFavorite
    })
  }, [normalized, favoritesOnly, favorites.overlayIds])

  const filteredTexts = useMemo(() => {
    return TEXT_PRESET_SUGGESTIONS.filter((item) => {
      const matchesQuery = !normalized || item.toLowerCase().includes(normalized)
      const matchesFavorite = !favoritesOnly || favorites.textValues.includes(item)
      return matchesQuery && matchesFavorite
    })
  }, [normalized, favoritesOnly, favorites.textValues])

  const favoriteCount = favorites.templateIds.length + favorites.stickerIds.length + favorites.overlayIds.length + favorites.textValues.length

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Biblioteca</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/backup" className="nav-link">Backup</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Biblioteca visual del estudio</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Explora material real del editor.</h1>
            <p className="sub">
              Aquí puedes revisar la base de plantillas, stickers, overlays y textos reutilizables que ya viven dentro de MentaCut.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/media" className="btn">Abrir media</Link>
              <Link href="/studio/backup" className="btn">Abrir backup</Link>
              <button className={`btn ${favoritesOnly ? 'btn-primary' : ''}`} onClick={() => setFavoritesOnly((current) => !current)}>
                {favoritesOnly ? 'Mostrando favoritos' : `Favoritos (${favoriteCount})`}
              </button>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="action-row" style={{ marginBottom: 12 }}>
              <button className={`btn ${tab === 'templates' ? 'btn-primary' : ''}`} onClick={() => setTab('templates')}>Plantillas ({TEMPLATE_PRESETS.length})</button>
              <button className={`btn ${tab === 'stickers' ? 'btn-primary' : ''}`} onClick={() => setTab('stickers')}>Stickers ({STICKER_PRESETS.length})</button>
              <button className={`btn ${tab === 'overlays' ? 'btn-primary' : ''}`} onClick={() => setTab('overlays')}>Overlays ({GRAPHIC_OVERLAY_PRESETS.length})</button>
              <button className={`btn ${tab === 'texts' ? 'btn-primary' : ''}`} onClick={() => setTab('texts')}>Textos ({TEXT_PRESET_SUGGESTIONS.length})</button>
            </div>

            <div className="editor-grid-2" style={{ marginBottom: 12 }}>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría, frase o etiqueta" />
              {tab === 'templates' ? (
                <select className="input" value={templateCategory} onChange={(event) => setTemplateCategory(event.target.value)}>
                  {templateCategories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              ) : <div className="input input-readonly">Filtrado activo: {favoritesOnly ? 'solo favoritos' : (query.trim() || 'sin filtro')}</div>}
            </div>

            {tab === 'templates' ? (
              <div className="template-grid">
                {filteredTemplates.map((template) => (
                  <article key={template.id} className="template-card">
                    <div className="template-preview" style={{ background: template.previewGradient }}>
                      <div className="template-badge" style={{ borderColor: template.accent }}>{template.badge}</div>
                      <div className="template-copy-top">{template.headline}</div>
                      <div className="template-copy-bottom">{template.caption}</div>
                    </div>
                    <strong>{template.name}</strong>
                    <div className="timeline-label">{template.category}</div>
                    <button className={`btn ${favorites.templateIds.includes(template.id) ? 'btn-primary' : ''}`} onClick={() => toggleTemplateFavorite(template.id)}>
                      {favorites.templateIds.includes(template.id) ? '★ Favorita' : '☆ Guardar'}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'stickers' ? (
              <div className="sticker-grid">
                {filteredStickers.map((sticker) => (
                  <article key={sticker.id} className="sticker-card">
                    <span>{sticker.emoji}</span>
                    <strong>{sticker.label}</strong>
                    <button className={`btn ${favorites.stickerIds.includes(sticker.id) ? 'btn-primary' : ''}`} onClick={() => toggleStickerFavorite(sticker.id)}>
                      {favorites.stickerIds.includes(sticker.id) ? '★ Favorito' : '☆ Guardar'}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'overlays' ? (
              <div className="overlay-grid">
                {filteredOverlays.map((overlay) => (
                  <article key={overlay.id} className="overlay-card">
                    <span className={`overlay-symbol overlay-${overlay.style}`}>{overlay.symbol}</span>
                    <strong>{overlay.name}</strong>
                    <div className="timeline-label">{overlay.style}</div>
                    <button className={`btn ${favorites.overlayIds.includes(overlay.id) ? 'btn-primary' : ''}`} onClick={() => toggleOverlayFavorite(overlay.id)}>
                      {favorites.overlayIds.includes(overlay.id) ? '★ Favorito' : '☆ Guardar'}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'texts' ? (
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {filteredTexts.map((text) => (
                  <article key={text} className="panel card">
                    <p style={{ margin: 0 }}>{text}</p>
                    <button className={`btn ${favorites.textValues.includes(text) ? 'btn-primary' : ''}`} onClick={() => toggleTextFavorite(text)}>
                      {favorites.textValues.includes(text) ? '★ Favorito' : '☆ Guardar'}
                    </button>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>
    </div>
  )
}
