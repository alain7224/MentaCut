'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type MatchField = 'title' | 'headlineText' | 'captionText'

type MatchRow = {
  clipId: string
  clipTitle: string
  field: MatchField
  value: string
}

export default function StudioTextToolsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [searchText, setSearchText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [status, setStatus] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const matches = useMemo<MatchRow[]>(() => {
    if (!active || !searchText.trim()) return []

    const needle = caseSensitive ? searchText.trim() : searchText.trim().toLowerCase()
    const rows: MatchRow[] = []

    for (const clip of active.clips) {
      const fields: Array<{ field: MatchField; value: string }> = [
        { field: 'title', value: clip.title || '' },
        { field: 'headlineText', value: clip.headlineText || '' },
        { field: 'captionText', value: clip.captionText || '' },
      ]

      for (const entry of fields) {
        const hay = caseSensitive ? entry.value : entry.value.toLowerCase()
        if (needle && hay.includes(needle)) {
          rows.push({
            clipId: clip.id,
            clipTitle: clip.title,
            field: entry.field,
            value: entry.value,
          })
        }
      }
    }

    return rows
  }, [active, searchText, caseSensitive])

  function persist(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function replaceAll() {
    if (!active || !searchText.trim()) return

    const search = searchText
    const flags = caseSensitive ? 'g' : 'gi'
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, flags)

    persist(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => ({
          ...clip,
          title: (clip.title || '').replace(regex, replaceText),
          headlineText: (clip.headlineText || '').replace(regex, replaceText),
          captionText: (clip.captionText || '').replace(regex, replaceText),
        })),
      }),
      'Reemplazo aplicado en todo el proyecto',
    )
  }

  function clearFields() {
    setSearchText('')
    setReplaceText('')
    setStatus('Campos de búsqueda limpiados')
  }

  const counts = useMemo(() => {
    return {
      clips: active?.clips.length ?? 0,
      matches: matches.length,
      titles: matches.filter((item) => item.field === 'title').length,
      headlines: matches.filter((item) => item.field === 'headlineText').length,
      captions: matches.filter((item) => item.field === 'captionText').length,
    }
  }, [active, matches])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Text Tools</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/search" className="nav-link">Buscar</Link>
          <Link href="/studio/batch" className="nav-link">Batch</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Herramientas globales de texto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Busca y reemplaza copy en todo el proyecto.</h1>
            <p className="sub">
              Esta pantalla te deja localizar palabras o frases en títulos, headlines y captions para corregir, unificar o adaptar el mensaje del proyecto completo.
            </p>
            <div className="action-row">
              <Link href="/studio/search" className="btn btn-primary">Abrir búsqueda</Link>
              <Link href="/studio/storyboard" className="btn">Abrir storyboard</Link>
              <button className="btn" onClick={replaceAll} disabled={!active || !searchText.trim()}>Reemplazar en todo</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto, busca una frase y aplica reemplazo global si hace falta.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configurar reemplazo</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <input className="input" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Texto a buscar" />
                <input className="input" value={replaceText} onChange={(event) => setReplaceText(event.target.value)} placeholder="Texto de reemplazo" />
                <label className="project-item" style={{ cursor: 'pointer' }}>
                  <strong>Coincidencia exacta por mayúsculas</strong>
                  <div className="timeline-label">{caseSensitive ? 'Activa' : 'Inactiva'}</div>
                  <input type="checkbox" checked={caseSensitive} onChange={(event) => setCaseSensitive(event.target.checked)} />
                </label>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={replaceAll} disabled={!active || !searchText.trim()}>Reemplazar en todo</button>
                  <button className="btn" onClick={clearFields}>Limpiar campos</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen de coincidencias</h2>
                <div className="timeline-label">Proyecto completo</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Clips</h3><p><strong>{counts.clips}</strong></p></article>
                <article className="panel card"><h3>Coincidencias</h3><p><strong>{counts.matches}</strong></p></article>
                <article className="panel card"><h3>Títulos</h3><p><strong>{counts.titles}</strong></p></article>
                <article className="panel card"><h3>Headlines</h3><p><strong>{counts.headlines}</strong></p></article>
                <article className="panel card"><h3>Captions</h3><p><strong>{counts.captions}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Resultados</h2>
              <div className="timeline-label">{matches.length} coincidencia(s)</div>
            </div>
            <div className="project-list">
              {matches.length === 0 ? <div className="empty">No hay coincidencias con la búsqueda actual.</div> : null}
              {matches.map((match, index) => (
                <div key={`${match.clipId}-${match.field}-${index}`} className="project-item">
                  <strong>{match.clipTitle}</strong>
                  <div className="timeline-label">Campo: {match.field === 'title' ? 'título' : match.field === 'headlineText' ? 'headline' : 'caption'}</div>
                  <div className="timeline-label">{match.value}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
