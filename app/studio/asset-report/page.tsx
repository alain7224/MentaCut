'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { buildProjectAssetReport } from '@/lib/project-asset-report'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioAssetReportPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const rows = useMemo(() => activeProject ? buildProjectAssetReport(activeProject, library) : [], [activeProject, library])
  const totalSize = useMemo(() => rows.reduce((sum, row) => sum + row.size, 0), [rows])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Asset Report</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/dependencies" className="nav-link">Dependencies</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Asset report del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Ve qué recursos usa el montaje.</h1>
            <p className="sub">Esta zona resume qué medias están siendo usadas por el proyecto, cuántas veces aparecen y cuánto pesan.</p>
            <div className="action-row">
              <Link href="/studio/media" className="btn btn-primary">Abrir media</Link>
              <Link href="/studio/dependencies" className="btn">Abrir dependencies</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base del reporte</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Assets</h3><p><strong>{rows.length}</strong></p></article>
                <article className="panel card"><h3>Tamaño total</h3><p><strong>{(totalSize / (1024 * 1024)).toFixed(2)} MB</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Recursos usados</h2><div className="timeline-label">{rows.length} item(s)</div></div>
              <div className="project-list">
                {rows.length === 0 ? <div className="empty">No se detectan assets usados en este proyecto.</div> : null}
                {rows.map((row) => (
                  <div key={row.assetId} className="project-item">
                    <strong>{row.name}</strong>
                    <div className="timeline-label">Tipo: {row.kind} · Uso: {row.usedByClips}</div>
                    <div className="timeline-label">Peso: {(row.size / (1024 * 1024)).toFixed(2)} MB · Duración: {row.duration?.toFixed(2) ?? '—'} s</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
