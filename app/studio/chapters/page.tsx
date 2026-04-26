'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readTimelineMarkers, type TimelineMarker } from '@/lib/local-timeline-markers'
import { buildProjectChapters, exportProjectChaptersTxt } from '@/lib/project-chapters'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioChaptersPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [markers, setMarkers] = useState<TimelineMarker[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setRoles(readClipRoles())
    setMarkers(readTimelineMarkers())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const chapters = useMemo(() => activeProject ? buildProjectChapters(activeProject, roles, markers) : [], [activeProject, roles, markers])

  function exportTxt() {
    if (!activeProject) return
    const blob = new Blob([exportProjectChaptersTxt(activeProject.name, chapters)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-chapters.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Chapters exportados en TXT')
  }

  function exportJson() {
    if (!activeProject) return
    const payload = {
      app: 'MentaCut',
      kind: 'project-chapters',
      exportedAt: new Date().toISOString(),
      projectId: activeProject.id,
      projectName: activeProject.name,
      chapters,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-chapters.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Chapters exportados en JSON')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Chapters</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/markers" className="nav-link">Markers</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Chapters del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca capítulos desde roles o markers.</h1>
            <p className="sub">Esta zona construye capítulos del proyecto para navegación, notas o exportación documental.</p>
            <div className="action-row">
              <Link href="/studio/markers" className="btn btn-primary">Abrir markers</Link>
              <Link href="/studio/roles" className="btn">Abrir roles</Link>
              <button className="btn" onClick={exportTxt} disabled={!activeProject}>Exportar TXT</button>
              <button className="btn" onClick={exportJson} disabled={!activeProject}>Exportar JSON</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y exporta sus chapters.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base de chapters</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Chapters</h2><div className="timeline-label">{chapters.length} capítulo(s)</div></div>
            <div className="project-list">
              {chapters.length === 0 ? <div className="empty">No hay chapters disponibles.</div> : null}
              {chapters.map((chapter, index) => (
                <div key={`${chapter.title}-${index}`} className="project-item">
                  <strong>#{index + 1} · {chapter.title}</strong>
                  <div className="timeline-label">{chapter.start.toFixed(3)}s → {chapter.end.toFixed(3)}s</div>
                  <div className="timeline-label">Fuente: {chapter.source}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
