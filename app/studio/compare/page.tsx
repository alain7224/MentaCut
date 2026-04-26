'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

type ProjectSummary = {
  duration: number
  clips: number
  withMedia: number
  withAudio: number
  templates: number
  stickers: number
  overlays: number
  headlinesFilled: number
  captionsFilled: number
  mediaRefs: Set<string>
}

function summarizeProject(project: LocalProject | null): ProjectSummary | null {
  if (!project) return null

  const mediaRefs = new Set<string>()
  const templates = new Set<string>()
  const stickers = new Set<string>()
  const overlays = new Set<string>()

  let duration = 0
  let withMedia = 0
  let withAudio = 0
  let headlinesFilled = 0
  let captionsFilled = 0

  for (const clip of project.clips) {
    duration += Math.max(0, clip.end - clip.start)
    if (clip.mediaId) {
      withMedia += 1
      mediaRefs.add(clip.mediaId)
    }
    if (clip.audioMediaId) {
      withAudio += 1
      mediaRefs.add(clip.audioMediaId)
    }
    if (clip.templateId) templates.add(clip.templateId)
    if (clip.stickerId) stickers.add(clip.stickerId)
    if (clip.graphicOverlayId) overlays.add(clip.graphicOverlayId)
    if (clip.headlineText?.trim()) headlinesFilled += 1
    if (clip.captionText?.trim()) captionsFilled += 1
  }

  return {
    duration,
    clips: project.clips.length,
    withMedia,
    withAudio,
    templates: templates.size,
    stickers: stickers.size,
    overlays: overlays.size,
    headlinesFilled,
    captionsFilled,
    mediaRefs,
  }
}

export default function StudioComparePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [leftId, setLeftId] = useState<string | null>(null)
  const [rightId, setRightId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setLeftId(next[0]?.id ?? null)
    setRightId(next[1]?.id ?? next[0]?.id ?? null)
  }, [])

  const left = useMemo(() => projects.find((item) => item.id === leftId) ?? null, [projects, leftId])
  const right = useMemo(() => projects.find((item) => item.id === rightId) ?? null, [projects, rightId])

  const leftSummary = useMemo(() => summarizeProject(left), [left])
  const rightSummary = useMemo(() => summarizeProject(right), [right])

  const sharedMediaCount = useMemo(() => {
    if (!leftSummary || !rightSummary) return 0
    let count = 0
    for (const ref of leftSummary.mediaRefs) {
      if (rightSummary.mediaRefs.has(ref)) count += 1
    }
    return count
  }, [leftSummary, rightSummary])

  const comparisonRows = useMemo(() => {
    if (!leftSummary || !rightSummary) return []
    return [
      { label: 'Duración total', left: `${leftSummary.duration.toFixed(1)} s`, right: `${rightSummary.duration.toFixed(1)} s` },
      { label: 'Clips', left: `${leftSummary.clips}`, right: `${rightSummary.clips}` },
      { label: 'Clips con media', left: `${leftSummary.withMedia}`, right: `${rightSummary.withMedia}` },
      { label: 'Clips con audio', left: `${leftSummary.withAudio}`, right: `${rightSummary.withAudio}` },
      { label: 'Plantillas usadas', left: `${leftSummary.templates}`, right: `${rightSummary.templates}` },
      { label: 'Stickers usados', left: `${leftSummary.stickers}`, right: `${rightSummary.stickers}` },
      { label: 'Overlays usados', left: `${leftSummary.overlays}`, right: `${rightSummary.overlays}` },
      { label: 'Headlines rellenos', left: `${leftSummary.headlinesFilled}`, right: `${rightSummary.headlinesFilled}` },
      { label: 'Captions rellenas', left: `${leftSummary.captionsFilled}`, right: `${rightSummary.captionsFilled}` },
      { label: 'Media compartida', left: `${sharedMediaCount}`, right: `${sharedMediaCount}` },
    ]
  }, [leftSummary, rightSummary, sharedMediaCount])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Compare</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/inspector" className="nav-link">Inspector</Link>
          <Link href="/studio/qa" className="nav-link">QA</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Comparación lado a lado</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Compara dos proyectos antes de decidir.</h1>
            <p className="sub">
              Esta pantalla te ayuda a revisar diferencias entre versiones o proyectos paralelos sin abrirlos uno por uno dentro del estudio.
            </p>
            <div className="action-row">
              <Link href="/studio/projects" className="btn btn-primary">Abrir proyectos</Link>
              <Link href="/studio/inspector" className="btn">Abrir inspector</Link>
              <Link href="/studio/qa" className="btn">Abrir QA</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto A</h2>
                <div className="timeline-label">Base izquierda</div>
              </div>
              <select className="input" value={leftId ?? ''} onChange={(event) => setLeftId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {left ? (
                <div className="project-list">
                  <div className="project-item">
                    <strong>{left.name}</strong>
                    <div className="timeline-label">{left.format} · {left.clips.length} clips · {new Date(left.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              ) : <div className="empty">Selecciona un proyecto.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto B</h2>
                <div className="timeline-label">Base derecha</div>
              </div>
              <select className="input" value={rightId ?? ''} onChange={(event) => setRightId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {right ? (
                <div className="project-list">
                  <div className="project-item">
                    <strong>{right.name}</strong>
                    <div className="timeline-label">{right.format} · {right.clips.length} clips · {new Date(right.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
              ) : <div className="empty">Selecciona un proyecto.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Resumen comparativo</h2>
              <div className="timeline-label">Métricas lado a lado</div>
            </div>
            {leftSummary && rightSummary ? (
              <div className="cards" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
                {comparisonRows.map((row) => (
                  <>
                    <article key={`${row.label}-label`} className="panel card"><h3>{row.label}</h3><p>—</p></article>
                    <article key={`${row.label}-left`} className="panel card"><h3>{left?.name ?? 'A'}</h3><p><strong>{row.left}</strong></p></article>
                    <article key={`${row.label}-right`} className="panel card"><h3>{right?.name ?? 'B'}</h3><p><strong>{row.right}</strong></p></article>
                  </>
                ))}
              </div>
            ) : <div className="empty">Necesitas dos proyectos seleccionados para comparar.</div>}
          </div>
        </section>

        {left && right ? (
          <section className="section">
            <div className="studio-grid-2">
              <div className="panel timeline">
                <div className="row-head">
                  <h2 className="section-title">Proyecto A · Clips</h2>
                  <div className="timeline-label">{left.clips.length} clip(s)</div>
                </div>
                <div className="project-list">
                  {left.clips.map((clip) => (
                    <div key={clip.id} className="project-item">
                      <strong>{clip.title}</strong>
                      <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel timeline">
                <div className="row-head">
                  <h2 className="section-title">Proyecto B · Clips</h2>
                  <div className="timeline-label">{right.clips.length} clip(s)</div>
                </div>
                <div className="project-list">
                  {right.clips.map((clip) => (
                    <div key={clip.id} className="project-item">
                      <strong>{clip.title}</strong>
                      <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
