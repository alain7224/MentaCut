'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { exportProjectClipsCsv } from '@/lib/project-csv-export'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioCsvExportPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const csvText = useMemo(() => activeProject ? exportProjectClipsCsv(activeProject) : '', [activeProject])

  function exportCsv() {
    if (!activeProject) return
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-clips.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Proyecto exportado en CSV')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut CSV Export</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/shot-list" className="nav-link">Shot list</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Exportación CSV del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca los clips a formato tabla.</h1>
            <p className="sub">Esta zona exporta los clips del proyecto a CSV para abrirlos en hojas de cálculo o revisarlos fuera de la app.</p>
            <div className="action-row">
              <Link href="/studio/shot-list" className="btn btn-primary">Abrir shot list</Link>
              <Link href="/studio/export-bundle" className="btn">Abrir export bundle</Link>
              <button className="btn" onClick={exportCsv} disabled={!activeProject}>Exportar CSV</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y expórtalo en tabla.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base del CSV</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Preview CSV</h2><div className="timeline-label">Salida exportable</div></div>
            <textarea className="textarea" rows={22} value={csvText} readOnly />
          </div>
        </section>
      </main>
    </div>
  )
}
