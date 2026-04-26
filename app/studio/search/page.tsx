'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'

type SearchHit = {
  projectId: string
  projectName: string
  projectFormat: string
  clipId: string | null
  clipTitle: string | null
  headline: string | null
  caption: string | null
  mediaName: string | null
  templateName: string | null
  kind: 'project' | 'clip'
}

export default function StudioSearchPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    setProjects(readLocalProjects())
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const mediaMap = useMemo(() => new Map(media.map((item) => [item.id, item.name])), [media])
  const templateMap = useMemo(() => new Map(TEMPLATE_PRESETS.map((item) => [item.id, item.name])), [])

  const allHits = useMemo<SearchHit[]>(() => {
    const hits: SearchHit[] = []

    for (const project of projects) {
      hits.push({
        projectId: project.id,
        projectName: project.name,
        projectFormat: project.format,
        clipId: null,
        clipTitle: null,
        headline: null,
        caption: null,
        mediaName: null,
        templateName: null,
        kind: 'project',
      })

      for (const clip of project.clips) {
        hits.push({
          projectId: project.id,
          projectName: project.name,
          projectFormat: project.format,
          clipId: clip.id,
          clipTitle: clip.title,
          headline: clip.headlineText,
          caption: clip.captionText,
          mediaName: clip.mediaId ? mediaMap.get(clip.mediaId) ?? 'Media no encontrada' : null,
          templateName: clip.templateId ? templateMap.get(clip.templateId) ?? clip.templateId : null,
          kind: 'clip',
        })
      }
    }

    return hits
  }, [projects, mediaMap, templateMap])

  const normalized = query.trim().toLowerCase()

  const filtered = useMemo(() => {
    if (!normalized) return allHits
    return allHits.filter((hit) => {
      const haystack = [
        hit.projectName,
        hit.projectFormat,
        hit.clipTitle,
        hit.headline,
        hit.caption,
        hit.mediaName,
        hit.templateName,
        hit.kind,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalized)
    })
  }, [allHits, normalized])

  const stats = useMemo(() => ({
    totalProjects: projects.length,
    totalClips: projects.reduce((sum, project) => sum + project.clips.length, 0),
    results: filtered.length,
  }), [projects, filtered])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Search</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/inspector" className="nav-link">Inspector</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Búsqueda global del workspace</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Encuentra proyectos y clips rápido.</h1>
            <p className="sub">
              Busca por nombre del proyecto, título del clip, headline, caption, media o plantilla para localizar contenido sin entrar uno por uno.
            </p>
            <div className="action-row">
              <Link href="/studio/workspace" className="btn btn-primary">Abrir workspace</Link>
              <Link href="/studio/inspector" className="btn">Abrir inspector</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Proyectos</h3><p><strong>{stats.totalProjects}</strong></p></article>
            <article className="panel card"><h3>Clips</h3><p><strong>{stats.totalClips}</strong></p></article>
            <article className="panel card"><h3>Resultados</h3><p><strong>{stats.results}</strong></p></article>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Buscar</h2>
              <div className="timeline-label">Nombre, texto, media o plantilla</div>
            </div>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Busca por ejemplo: gancho, 9:16, promo, hook crystal, nombre del proyecto..." />
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Resultados</h2>
              <div className="timeline-label">{filtered.length} coincidencia(s)</div>
            </div>
            <div className="project-list">
              {filtered.length === 0 ? <div className="empty">No se encontraron coincidencias.</div> : null}
              {filtered.map((hit, index) => (
                <div key={`${hit.kind}-${hit.projectId}-${hit.clipId ?? index}`} className="project-item">
                  <strong>{hit.kind === 'project' ? `Proyecto · ${hit.projectName}` : `Clip · ${hit.clipTitle ?? 'Sin título'}`}</strong>
                  <div className="timeline-label">{hit.projectFormat} · {hit.projectName}</div>
                  {hit.kind === 'clip' ? (
                    <>
                      <div className="timeline-label">Headline: {hit.headline || '—'}</div>
                      <div className="timeline-label">Caption: {hit.caption || '—'}</div>
                      <div className="timeline-label">Media: {hit.mediaName || 'Sin media'}</div>
                      <div className="timeline-label">Plantilla: {hit.templateName || 'Sin plantilla'}</div>
                    </>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
