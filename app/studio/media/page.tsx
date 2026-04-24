'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getLocalMediaFile, listLocalMedia, removeLocalMedia, saveLocalMedia, type LocalMediaKind, type LocalMediaRecord } from '@/lib/local-media'

const MEDIA_FILTERS: Array<'all' | LocalMediaKind> = ['all', 'video', 'image', 'audio']

export default function StudioMediaPage() {
  const [items, setItems] = useState<LocalMediaRecord[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | LocalMediaKind>('all')
  const [query, setQuery] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    void refresh()
  }, [])

  useEffect(() => {
    let revokeUrl: string | null = null
    async function loadPreview() {
      if (!selectedId) {
        setPreviewUrl(null)
        return
      }
      const file = await getLocalMediaFile(selectedId)
      if (!file) {
        setPreviewUrl(null)
        return
      }
      const url = URL.createObjectURL(file)
      revokeUrl = url
      setPreviewUrl(url)
    }
    void loadPreview()
    return () => {
      if (revokeUrl) URL.revokeObjectURL(revokeUrl)
    }
  }, [selectedId])

  async function refresh() {
    const next = await listLocalMedia()
    setItems(next)
    setSelectedId((current) => current ?? next[0]?.id ?? null)
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    for (const file of files) {
      await saveLocalMedia(file)
    }
    event.target.value = ''
    setStatus(`${files.length} archivo(s) añadido(s)`)
    await refresh()
  }

  async function handleDelete() {
    if (!selectedId) return
    await removeLocalMedia(selectedId)
    setStatus('Archivo eliminado de la librería local')
    setSelectedId(null)
    setPreviewUrl(null)
    await refresh()
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return items.filter((item) => {
      const matchesFilter = filter === 'all' || item.kind === filter
      const matchesQuery = !normalized || `${item.name} ${item.kind} ${item.type}`.toLowerCase().includes(normalized)
      return matchesFilter && matchesQuery
    })
  }, [items, filter, query])

  const selected = useMemo(() => items.find((item) => item.id === selectedId) ?? null, [items, selectedId])
  const counts = useMemo(() => ({
    all: items.length,
    video: items.filter((item) => item.kind === 'video').length,
    image: items.filter((item) => item.kind === 'image').length,
    audio: items.filter((item) => item.kind === 'audio').length,
  }), [items])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Media</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/library" className="nav-link">Biblioteca</Link>
          <Link href="/studio/backup" className="nav-link">Backup</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Media local del navegador</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Gestiona tu librería local.</h1>
            <p className="sub">
              Aquí puedes revisar la media ya guardada, filtrar por tipo, previsualizar, borrar y cargar nuevos archivos sin mezclarlo todo dentro del estudio principal.
            </p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" multiple accept="video/*,image/*,audio/*" hidden onChange={handleUpload} />
                Subir media local
              </label>
              <button className="btn" onClick={handleDelete} disabled={!selectedId}>Borrar seleccionada</button>
              <Link href="/studio" className="btn">Volver al estudio</Link>
            </div>
            <div className="timeline-label">{status || 'La media se guarda en la capa local del navegador.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Total</h3><p><strong>{counts.all}</strong> archivos</p></article>
            <article className="panel card"><h3>Vídeo</h3><p><strong>{counts.video}</strong> elementos</p></article>
            <article className="panel card"><h3>Imagen</h3><p><strong>{counts.image}</strong> elementos</p></article>
            <article className="panel card"><h3>Audio</h3><p><strong>{counts.audio}</strong> elementos</p></article>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="editor-grid-2" style={{ marginBottom: 12 }}>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o tipo" />
              <select className="input" value={filter} onChange={(event) => setFilter(event.target.value as 'all' | LocalMediaKind)}>
                {MEDIA_FILTERS.map((item) => (
                  <option key={item} value={item}>{item === 'all' ? 'Todos' : item}</option>
                ))}
              </select>
            </div>

            <div className="studio-grid-2">
              <div className="panel stage media-library-panel">
                <div className="row-head">
                  <h2 className="section-title">Librería</h2>
                  <div className="timeline-label">{filtered.length} resultado(s)</div>
                </div>
                <div className="media-list">
                  {filtered.length === 0 ? <div className="empty">No hay media que coincida con el filtro.</div> : null}
                  {filtered.map((item) => (
                    <button key={item.id} className={`project-item ${item.id === selectedId ? 'active' : ''}`} onClick={() => setSelectedId(item.id)}>
                      <strong>{item.name}</strong>
                      <div className="timeline-label">{item.kind} · {item.duration ? `${item.duration.toFixed(1)}s` : `${Math.round(item.size / 1024)} KB`}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel stage">
                <div className="row-head">
                  <h2 className="section-title">Preview</h2>
                  <div className="timeline-label">{selected?.type ?? 'Sin selección'}</div>
                </div>
                <div className="stage-preview media-preview-box">
                  {selected?.kind === 'video' && previewUrl ? <video className="media-preview" src={previewUrl} controls playsInline /> : null}
                  {selected?.kind === 'image' && previewUrl ? <img className="media-preview" src={previewUrl} alt={selected.name} /> : null}
                  {selected?.kind === 'audio' && previewUrl ? <audio className="audio-preview" src={previewUrl} controls /> : null}
                  {!previewUrl ? <div className="empty">Selecciona un elemento para verlo aquí.</div> : null}
                </div>
                {selected ? (
                  <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                    <article className="panel card"><h3>Nombre</h3><p>{selected.name}</p></article>
                    <article className="panel card"><h3>Tipo</h3><p>{selected.kind}</p></article>
                    <article className="panel card"><h3>Tamaño</h3><p>{Math.round(selected.size / 1024)} KB</p></article>
                    <article className="panel card"><h3>Duración</h3><p>{selected.duration ? `${selected.duration.toFixed(1)} s` : '—'}</p></article>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
