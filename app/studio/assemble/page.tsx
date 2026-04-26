'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, writeLocalProjects, type LocalClip, type LocalProject, type ProjectFormat } from '@/lib/local-store'

const FORMATS: ProjectFormat[] = ['9:16', '1:1', '4:5', '16:9']

function sanitizeTitle(name: string) {
  return name.replace(/\.[^.]+$/, '').trim() || 'Clip'
}

export default function StudioAssemblePage() {
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [projectName, setProjectName] = useState('Montaje automático MentaCut')
  const [format, setFormat] = useState<ProjectFormat>('9:16')
  const [fallbackDuration, setFallbackDuration] = useState(3.5)
  const [selectedVisualIds, setSelectedVisualIds] = useState<string[]>([])
  const [soundtrackId, setSoundtrackId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    void listLocalMedia().then((items) => {
      setLibrary(items)
      const defaultVisuals = items.filter((item) => item.kind === 'image' || item.kind === 'video').slice(0, 4).map((item) => item.id)
      setSelectedVisualIds((current) => current.length ? current : defaultVisuals)
    }).catch(() => setLibrary([]))
  }, [])

  const visuals = useMemo(
    () => library.filter((item) => item.kind === 'image' || item.kind === 'video'),
    [library],
  )

  const audios = useMemo(
    () => library.filter((item) => item.kind === 'audio'),
    [library],
  )

  const selectedVisuals = useMemo(
    () => visuals.filter((item) => selectedVisualIds.includes(item.id)),
    [visuals, selectedVisualIds],
  )

  const totalDuration = useMemo(
    () => selectedVisuals.reduce((sum, item) => {
      if (item.kind === 'video' && item.duration && item.duration > 0) return sum + item.duration
      return sum + fallbackDuration
    }, 0),
    [selectedVisuals, fallbackDuration],
  )

  function toggleVisual(id: string) {
    setSelectedVisualIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])
  }

  function moveSelected(id: string, direction: 'up' | 'down') {
    setSelectedVisualIds((current) => {
      const index = current.indexOf(id)
      if (index < 0) return current
      const target = direction === 'up' ? Math.max(0, index - 1) : Math.min(current.length - 1, index + 1)
      if (target === index) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  function createProjectFromSelection() {
    if (selectedVisuals.length === 0) {
      setStatus('Selecciona al menos una imagen o vídeo para montar el proyecto.')
      return
    }

    let cursor = 0
    const clips: LocalClip[] = selectedVisualIds
      .map((id) => visuals.find((item) => item.id === id) ?? null)
      .filter(Boolean)
      .map((item, index) => {
        const asset = item as LocalMediaRecord
        const duration = asset.kind === 'video' && asset.duration && asset.duration > 0 ? asset.duration : fallbackDuration
        const start = Number(cursor.toFixed(2))
        const end = Number((cursor + Math.max(0.5, duration)).toFixed(2))
        cursor = end
        return {
          id: crypto.randomUUID(),
          title: sanitizeTitle(asset.name),
          start,
          end,
          mediaId: asset.id,
          audioMediaId: soundtrackId || null,
          templateId: 'hook-crystal',
          frameX: 50,
          frameY: 50,
          frameScale: 1,
          headlineText: sanitizeTitle(asset.name),
          captionText: `Clip ${index + 1} generado desde media local`,
          stickerId: null,
          graphicOverlayId: null,
        }
      })

    const project: LocalProject = {
      id: crypto.randomUUID(),
      name: projectName.trim() || 'Montaje automático MentaCut',
      format,
      updatedAt: new Date().toISOString(),
      clips,
    }

    const existing = readLocalProjects()
    writeLocalProjects([project, ...existing])
    setStatus(`Proyecto creado desde ${clips.length} recurso(s): ${project.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Assemble</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/planner" className="nav-link">Planner</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Montaje automático desde librería local</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Convierte media subida en un proyecto secuencial.</h1>
            <p className="sub">
              Esta pantalla te deja escoger imágenes y vídeos ya guardados en el navegador, ordenarlos rápido y generar un proyecto listo para entrar al estudio.
            </p>
            <div className="action-row">
              <Link href="/studio/media" className="btn btn-primary">Abrir media</Link>
              <Link href="/studio/planner" className="btn">Abrir planner</Link>
              <button className="btn" onClick={createProjectFromSelection}>Crear proyecto automático</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona recursos visuales, ordénalos y genera el proyecto.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configuración del montaje</h2>
                <div className="timeline-label">Base del proyecto</div>
              </div>
              <div className="form">
                <input className="input" value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="Nombre del proyecto" />
                <select className="input" value={format} onChange={(event) => setFormat(event.target.value as ProjectFormat)}>
                  {FORMATS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <label className="form">
                  <span className="timeline-label">Duración fallback para imágenes: {fallbackDuration.toFixed(1)} s</span>
                  <input className="input" type="range" min="1" max="10" step="0.5" value={fallbackDuration} onChange={(event) => setFallbackDuration(Number(event.target.value))} />
                </label>
                <select className="input" value={soundtrackId} onChange={(event) => setSoundtrackId(event.target.value)}>
                  <option value="">Sin audio global</option>
                  {audios.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen del montaje</h2>
                <div className="timeline-label">Preview</div>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Recursos elegidos</h3><p><strong>{selectedVisuals.length}</strong></p></article>
                <article className="panel card"><h3>Duración total</h3><p><strong>{totalDuration.toFixed(1)} s</strong></p></article>
                <article className="panel card"><h3>Formato</h3><p><strong>{format}</strong></p></article>
                <article className="panel card"><h3>Audio global</h3><p><strong>{soundtrackId ? (audios.find((item) => item.id === soundtrackId)?.name ?? 'Asignado') : 'No'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Librería visual</h2>
                <div className="timeline-label">{visuals.length} recurso(s)</div>
              </div>
              <div className="project-list">
                {visuals.length === 0 ? <div className="empty">No hay imágenes o vídeos locales todavía.</div> : null}
                {visuals.map((item) => (
                  <button key={item.id} className={`project-item ${selectedVisualIds.includes(item.id) ? 'active' : ''}`} onClick={() => toggleVisual(item.id)}>
                    <strong>{item.name}</strong>
                    <div className="timeline-label">{item.kind} · {item.duration ? `${item.duration.toFixed(1)}s` : `${Math.round(item.size / 1024)} KB`}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Orden del montaje</h2>
                <div className="timeline-label">{selectedVisualIds.length} seleccionado(s)</div>
              </div>
              <div className="project-list">
                {selectedVisualIds.length === 0 ? <div className="empty">Selecciona recursos para crear el orden.</div> : null}
                {selectedVisualIds.map((id, index) => {
                  const item = visuals.find((entry) => entry.id === id)
                  if (!item) return null
                  return (
                    <div key={id} className="project-item" style={{ display: 'grid', gap: 10 }}>
                      <div>
                        <strong>#{index + 1} · {sanitizeTitle(item.name)}</strong>
                        <div className="timeline-label">{item.kind} · {item.kind === 'video' && item.duration ? `${item.duration.toFixed(1)} s` : `${fallbackDuration.toFixed(1)} s`}</div>
                      </div>
                      <div className="action-row">
                        <button className="btn" onClick={() => moveSelected(id, 'up')} disabled={index === 0}>Subir</button>
                        <button className="btn" onClick={() => moveSelected(id, 'down')} disabled={index === selectedVisualIds.length - 1}>Bajar</button>
                        <button className="btn" onClick={() => toggleVisual(id)}>Quitar</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
