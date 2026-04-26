'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { normalizeImportedProject, parseSingleProjectExport } from '@/lib/project-transfer'

export default function StudioImportPage() {
  const [status, setStatus] = useState('')
  const [preview, setPreview] = useState<LocalProject | null>(null)

  const previewStats = useMemo(() => {
    if (!preview) return null
    return {
      clips: preview.clips.length,
      duration: preview.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
      withMedia: preview.clips.filter((clip) => clip.mediaId).length,
      withAudio: preview.clips.filter((clip) => clip.audioMediaId).length,
    }
  }, [preview])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const raw = await file.text()
      const project = parseSingleProjectExport(raw)
      setPreview(project)
      setStatus(`Archivo leído: ${project.name}`)
    } catch (error) {
      setPreview(null)
      setStatus(error instanceof Error ? error.message : 'No se pudo leer el archivo')
    } finally {
      event.target.value = ''
    }
  }

  function importProject() {
    if (!preview) return
    const existing = readLocalProjects()
    const normalized = normalizeImportedProject(preview)
    writeLocalProjects([normalized, ...existing])
    setStatus(`Proyecto importado: ${normalized.name}`)
    setPreview(normalized)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Importar Proyecto</span>
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
            <span className="eyebrow">Importación individual</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Trae un proyecto JSON al workspace local.</h1>
            <p className="sub">
              Esta zona importa un único proyecto exportado desde el inspector y lo añade a tu lista local sin tocar el backup global completo.
            </p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" accept="application/json" hidden onChange={handleFile} />
                Elegir archivo JSON
              </label>
              <button className="btn" onClick={importProject} disabled={!preview}>Importar proyecto</button>
              <Link href="/studio/inspector" className="btn">Abrir inspector</Link>
            </div>
            <div className="timeline-label">{status || 'Carga un archivo exportado desde el inspector del proyecto.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview del archivo</h2>
                <div className="timeline-label">Antes de importar</div>
              </div>
              {preview ? (
                <div className="project-list">
                  <div className="project-item">
                    <strong>{preview.name}</strong>
                    <div className="timeline-label">{preview.format} · {preview.clips.length} clips · {new Date(preview.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="project-item">
                    <strong>Proyecto importado se guardará como</strong>
                    <div className="timeline-label">{preview.name} importado</div>
                  </div>
                </div>
              ) : <div className="empty">Todavía no hay archivo cargado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen rápido</h2>
                <div className="timeline-label">Chequeo previo</div>
              </div>
              {previewStats ? (
                <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <article className="panel card"><h3>Clips</h3><p><strong>{previewStats.clips}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{previewStats.duration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Con media</h3><p><strong>{previewStats.withMedia}</strong></p></article>
                  <article className="panel card"><h3>Con audio</h3><p><strong>{previewStats.withAudio}</strong></p></article>
                </div>
              ) : <div className="empty">Carga un JSON para ver su resumen.</div>}
            </div>
          </div>
        </section>

        {preview ? (
          <section className="section">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Detalle de clips</h2>
                <div className="timeline-label">Importación individual</div>
              </div>
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {preview.clips.map((clip) => (
                  <article key={clip.id} className="panel card">
                    <h3>{clip.title}</h3>
                    <p><strong>Tiempo:</strong> {clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</p>
                    <p><strong>Headline:</strong> {clip.headlineText || '—'}</p>
                    <p><strong>Caption:</strong> {clip.captionText || '—'}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
