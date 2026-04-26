'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

type MediaUsage = {
  mediaId: string
  projectId: string
  projectName: string
  clipId: string
  clipTitle: string
  role: 'media' | 'audio'
}

export default function StudioMediaAuditPage() {
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState<'all' | 'used' | 'orphan'>('all')

  useEffect(() => {
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
    setProjects(readLocalProjects())
  }, [])

  const usages = useMemo<MediaUsage[]>(() => {
    const rows: MediaUsage[] = []
    for (const project of projects) {
      for (const clip of project.clips) {
        if (clip.mediaId) {
          rows.push({
            mediaId: clip.mediaId,
            projectId: project.id,
            projectName: project.name,
            clipId: clip.id,
            clipTitle: clip.title,
            role: 'media',
          })
        }
        if (clip.audioMediaId) {
          rows.push({
            mediaId: clip.audioMediaId,
            projectId: project.id,
            projectName: project.name,
            clipId: clip.id,
            clipTitle: clip.title,
            role: 'audio',
          })
        }
      }
    }
    return rows
  }, [projects])

  const usageMap = useMemo(() => {
    const map = new Map<string, MediaUsage[]>()
    for (const usage of usages) {
      const current = map.get(usage.mediaId) ?? []
      current.push(usage)
      map.set(usage.mediaId, current)
    }
    return map
  }, [usages])

  const normalized = query.trim().toLowerCase()

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const itemUsages = usageMap.get(item.id) ?? []
      const used = itemUsages.length > 0
      const matchesMode = mode === 'all' || (mode === 'used' ? used : !used)
      const haystack = [
        item.name,
        item.kind,
        item.type,
        ...itemUsages.map((usage) => `${usage.projectName} ${usage.clipTitle} ${usage.role}`),
      ].join(' ').toLowerCase()
      const matchesQuery = !normalized || haystack.includes(normalized)
      return matchesMode && matchesQuery
    })
  }, [media, usageMap, mode, normalized])

  const stats = useMemo(() => {
    const usedIds = new Set(usages.map((usage) => usage.mediaId))
    const used = media.filter((item) => usedIds.has(item.id)).length
    const orphan = media.length - used
    return {
      total: media.length,
      used,
      orphan,
      refs: usages.length,
    }
  }, [media, usages])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Media Audit</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/search" className="nav-link">Buscar</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Auditoría de activos locales</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Revisa qué media está realmente en uso.</h1>
            <p className="sub">
              Esta pantalla te ayuda a detectar archivos huérfanos, ver referencias reales por proyecto y mantener más limpia la librería local del editor.
            </p>
            <div className="action-row">
              <Link href="/studio/media" className="btn btn-primary">Abrir media</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
              <Link href="/studio/search" className="btn">Abrir búsqueda</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Total media</h3><p><strong>{stats.total}</strong></p></article>
            <article className="panel card"><h3>Usada</h3><p><strong>{stats.used}</strong></p></article>
            <article className="panel card"><h3>Huérfana</h3><p><strong>{stats.orphan}</strong></p></article>
            <article className="panel card"><h3>Referencias</h3><p><strong>{stats.refs}</strong></p></article>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Filtros</h2>
              <div className="timeline-label">Busca por media, proyecto o clip</div>
            </div>
            <div className="editor-grid-2">
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por nombre de archivo, proyecto, clip o tipo" />
              <select className="input" value={mode} onChange={(event) => setMode(event.target.value as 'all' | 'used' | 'orphan')}>
                <option value="all">Toda la media</option>
                <option value="used">Solo usada</option>
                <option value="orphan">Solo huérfana</option>
              </select>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Resultado de auditoría</h2>
              <div className="timeline-label">{filteredMedia.length} archivo(s)</div>
            </div>
            <div className="project-list">
              {filteredMedia.length === 0 ? <div className="empty">No hay resultados con ese filtro.</div> : null}
              {filteredMedia.map((item) => {
                const refs = usageMap.get(item.id) ?? []
                const used = refs.length > 0
                return (
                  <div key={item.id} className="project-item" style={{ display: 'grid', gap: 10 }}>
                    <div className="row-head">
                      <div>
                        <strong>{item.name}</strong>
                        <div className="timeline-label">{item.kind} · {item.duration ? `${item.duration.toFixed(1)}s` : `${Math.round(item.size / 1024)} KB`} · {used ? 'en uso' : 'huérfana'}</div>
                      </div>
                      <div className="timeline-label">{refs.length} referencia(s)</div>
                    </div>
                    {refs.length > 0 ? (
                      <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                        {refs.map((ref) => (
                          <article key={`${ref.projectId}-${ref.clipId}-${ref.role}`} className="panel card">
                            <h3>{ref.projectName}</h3>
                            <p><strong>Clip:</strong> {ref.clipTitle}</p>
                            <p><strong>Uso:</strong> {ref.role === 'audio' ? 'audio' : 'media visual'}</p>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <div className="empty">Este archivo todavía no se usa en ningún clip local.</div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
