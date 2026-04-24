'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS, TEXT_PRESET_SUGGESTIONS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'

type TabKey = 'templates' | 'stickers' | 'overlays' | 'texts'

export default function StudioLibraryPage() {
  const [tab, setTab] = useState<TabKey>('templates')
  const [query, setQuery] = useState('')

  const normalized = query.trim().toLowerCase()

  const templateCategories = useMemo(() => ['Todas', ...Array.from(new Set(TEMPLATE_PRESETS.map((item) => item.category)))], [])
  const [templateCategory, setTemplateCategory] = useState('Todas')

  const filteredTemplates = useMemo(() => {
    return TEMPLATE_PRESETS.filter((item) => {
      const matchesCategory = templateCategory === 'Todas' || item.category === templateCategory
      const matchesQuery = !normalized || `${item.name} ${item.category} ${item.headline} ${item.caption}`.toLowerCase().includes(normalized)
      return matchesCategory && matchesQuery
    })
  }, [normalized, templateCategory])

  const filteredStickers = useMemo(() => {
    return STICKER_PRESETS.filter((item) => !normalized || `${item.label} ${item.emoji}`.toLowerCase().includes(normalized))
  }, [normalized])

  const filteredOverlays = useMemo(() => {
    return GRAPHIC_OVERLAY_PRESETS.filter((item) => !normalized || `${item.name} ${item.symbol} ${item.style}`.toLowerCase().includes(normalized))
  }, [normalized])

  const filteredTexts = useMemo(() => {
    return TEXT_PRESET_SUGGESTIONS.filter((item) => !normalized || item.toLowerCase().includes(normalized))
  }, [normalized])

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
              ) : <div className="input input-readonly">Filtrado activo: {query.trim() || 'sin filtro'}</div>}
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
                  </article>
                ))}
              </div>
            ) : null}

            {tab === 'texts' ? (
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {filteredTexts.map((text) => (
                  <article key={text} className="panel card">
                    <p style={{ margin: 0 }}>{text}</p>
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
