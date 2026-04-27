'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { findAcrossProjects } from '@/lib/project-finder'
import { readProjectTags, type ProjectTagEntry } from '@/lib/local-project-tags'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioFinderPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [tags, setTags] = useState<ProjectTagEntry[]>([])
  const [query, setQuery] = useState('')

  useEffect(() => {
    setProjects(readLocalProjects())
    setTags(readProjectTags())
  }, [])

  const results = useMemo(() => findAcrossProjects(projects, tags, query), [projects, tags, query])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Finder</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/tags" className="nav-link">Tags</Link>
          <Link href="/studio/text-tools" className="nav-link">Text tools</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Buscador global</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Busca entre proyectos, clips y tags.</h1>
            <p className="sub">Esta zona sirve para encontrar rápido títulos, headlines, captions, nombres de proyecto y tags en toda la librería local.</p>
            <div className="action-row">
              <Link href="/studio/tags" className="btn btn-primary">Abrir tags</Link>
              <Link href="/studio/text-tools" className="btn">Abrir text tools</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Consulta</h2><div className="timeline-label">Búsqueda libre</div></div>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar texto en proyectos, clips y tags" />
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Resultados</h2><div className="timeline-label">{results.length} coincidencia(s)</div></div>
            <div className="project-list">
              {query.trim() && results.length === 0 ? <div className="empty">No se encontraron coincidencias.</div> : null}
              {!query.trim() ? <div className="empty">Escribe algo para buscar.</div> : null}
              {results.map((result, index) => (
                <div key={`${result.projectId}-${result.field}-${index}`} className="project-item">
                  <strong>{result.projectName}{result.clipTitle ? ` · ${result.clipTitle}` : ''}</strong>
                  <div className="timeline-label">Campo: {result.field}</div>
                  <div className="timeline-label">{result.snippet}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
