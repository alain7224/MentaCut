'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalClip, type LocalProject } from '@/lib/local-store'
import { importClipsIntoProject, parseSelectedClipsImport, type ClipTransferMode } from '@/lib/project-clip-transfer'

export default function StudioClipImportPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [mode, setMode] = useState<ClipTransferMode>('append')
  const [importedClips, setImportedClips] = useState<LocalClip[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  const preview = useMemo(() => ({
    count: importedClips.length,
    duration: importedClips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
  }), [importedClips])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const raw = await file.text()
      const clips = parseSelectedClipsImport(raw)
      setImportedClips(clips)
      setStatus(`Archivo leído: ${clips.length} clip(s)`)
    } catch (error) {
      setImportedClips([])
      setStatus(error instanceof Error ? error.message : 'No se pudo leer el archivo')
    } finally {
      event.target.value = ''
    }
  }

  function applyImport() {
    if (!activeProject || importedClips.length === 0) return

    const updated = projects.map((project) => {
      if (project.id !== activeProject.id) return project
      return touchProject(importClipsIntoProject(project, importedClips, mode))
    })

    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Clips importados en ${activeProject.name}: ${importedClips.length}`)
    setImportedClips([])
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Clip Import</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/clip-batch" className="nav-link">Clip batch</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Importación de clips por JSON</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Trae una selección de clips a un proyecto.</h1>
            <p className="sub">
              Esta zona importa un JSON exportado desde la multiselección de clips para añadirlo a otro proyecto sin rehacer tiempos ni copiar a mano.
            </p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" accept="application/json" hidden onChange={handleFile} />
                Elegir JSON de clips
              </label>
              <button className="btn" onClick={applyImport} disabled={!activeProject || importedClips.length === 0}>Importar clips</button>
              <Link href="/studio/clip-batch" className="btn">Abrir clip batch</Link>
            </div>
            <div className="timeline-label">{status || 'Carga un JSON de clips exportado desde la app.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Destino del import</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as ClipTransferMode)}>
                  <option value="append">Añadir al final</option>
                  <option value="prepend">Añadir al principio</option>
                </select>
              </div>
              {activeProject ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips actuales</h3><p><strong>{activeProject.clips.length}</strong></p></article>
                  <article className="panel card"><h3>Proyecto</h3><p><strong>{activeProject.name}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview del archivo</h2>
                <div className="timeline-label">Lote importado</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Clips</h3><p><strong>{preview.count}</strong></p></article>
                <article className="panel card"><h3>Duración</h3><p><strong>{preview.duration.toFixed(2)} s</strong></p></article>
                <article className="panel card"><h3>Modo</h3><p><strong>{mode === 'append' ? 'Final' : 'Inicio'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Clips del archivo</h2>
              <div className="timeline-label">{importedClips.length} clip(s)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {importedClips.length === 0 ? <div className="empty">Todavía no hay clips cargados.</div> : null}
              {importedClips.map((clip) => (
                <article key={clip.id} className="panel card">
                  <h3>{clip.title}</h3>
                  <p><strong>Tiempo original:</strong> {clip.start.toFixed(2)}s → {clip.end.toFixed(2)}s</p>
                  <p><strong>Headline:</strong> {clip.headlineText || '—'}</p>
                  <p><strong>Caption:</strong> {clip.captionText || '—'}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
