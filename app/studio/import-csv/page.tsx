'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { applyCopyCsvToProject, parseCopyCsv } from '@/lib/clip-copy-csv-import'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type CsvRow = Record<string, string>

export default function StudioImportCsvPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [rows, setRows] = useState<CsvRow[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const raw = await file.text()
      const parsed = parseCopyCsv(raw)
      setRows(parsed)
      setStatus(`CSV leído: ${parsed.length} fila(s)`)
    } catch {
      setRows([])
      setStatus('No se pudo leer el CSV')
    } finally {
      event.target.value = ''
    }
  }

  function applyCsv() {
    if (!activeProject || rows.length === 0) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject(applyCopyCsvToProject(project, rows)) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Copy importado por CSV en ${activeProject.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Import CSV</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/text-tools" className="nav-link">Text tools</Link>
          <Link href="/studio/csv-export" className="nav-link">CSV export</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Importar copy por CSV</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Actualiza títulos, headlines y captions desde tabla.</h1>
            <p className="sub">Esta zona carga un CSV con columnas title, headline y caption y lo aplica por orden de fila a los clips del proyecto.</p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" accept=".csv,text/csv" hidden onChange={handleFile} />
                Elegir CSV
              </label>
              <button className="btn" onClick={applyCsv} disabled={!activeProject || rows.length === 0}>Aplicar CSV</button>
              <Link href="/studio/csv-export" className="btn">Abrir CSV export</Link>
            </div>
            <div className="timeline-label">{status || 'Carga un CSV con columnas title, headline y caption.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Destino del CSV</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Clips</h3><p><strong>{activeProject?.clips.length ?? 0}</strong></p></article>
                <article className="panel card"><h3>Filas CSV</h3><p><strong>{rows.length}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Ejemplo esperado</h2><div className="timeline-label">Cabeceras</div></div>
              <textarea className="textarea" rows={10} readOnly value={'title,headline,caption\nEscena 1,Hook corto,Caption de la primera escena\nEscena 2,Problema,Caption de la segunda escena'} />
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Preview de filas</h2><div className="timeline-label">{rows.length} fila(s)</div></div>
            <div className="project-list">
              {rows.length === 0 ? <div className="empty">Todavía no hay CSV cargado.</div> : null}
              {rows.map((row, index) => (
                <div key={index} className="project-item">
                  <strong>Fila {index + 1}</strong>
                  <div className="timeline-label">Título: {row.title || '—'}</div>
                  <div className="timeline-label">Headline: {row.headline || '—'}</div>
                  <div className="timeline-label">Caption: {row.caption || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
