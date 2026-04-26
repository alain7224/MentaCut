'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject, type LocalClip } from '@/lib/local-store'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'

type QaIssue = {
  clipId: string
  clipTitle: string
  severity: 'high' | 'medium' | 'low'
  message: string
}

function evaluateClip(clip: LocalClip, mediaMap: Map<string, LocalMediaRecord>): QaIssue[] {
  const issues: QaIssue[] = []
  const duration = clip.end - clip.start

  if (clip.end <= clip.start) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El clip tiene un rango de tiempo inválido.' })
  }

  if (!clip.mediaId && !clip.audioMediaId) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El clip no tiene media visual ni audio asignado.' })
  }

  if (!clip.mediaId) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'El clip no tiene media visual asignada.' })
  } else if (!mediaMap.has(clip.mediaId)) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'La media visual asignada no existe en la librería local.' })
  }

  if (clip.audioMediaId && !mediaMap.has(clip.audioMediaId)) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'high', message: 'El audio asignado no existe en la librería local.' })
  }

  if (!clip.headlineText || clip.headlineText.trim().length < 4) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'El headline del clip es muy corto o está vacío.' })
  }

  if (!clip.captionText || clip.captionText.trim().length < 8) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'low', message: 'La caption del clip es muy corta o está vacía.' })
  }

  if (duration > 12) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'low', message: 'La duración del clip es larga para formato corto.' })
  }

  if (duration < 1) {
    issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'La duración del clip es demasiado corta.' })
  }

  return issues
}

export default function StudioQaPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const mediaMap = useMemo(() => new Map(media.map((item) => [item.id, item])), [media])

  const report = useMemo(() => {
    if (!active) {
      return {
        issues: [] as QaIssue[],
        health: 'Sin proyecto',
        score: 0,
      }
    }

    const issues: QaIssue[] = []

    if (active.clips.length === 0) {
      issues.push({ clipId: 'project', clipTitle: active.name, severity: 'high', message: 'El proyecto no tiene clips.' })
    }

    for (let i = 0; i < active.clips.length; i += 1) {
      const clip = active.clips[i]
      issues.push(...evaluateClip(clip, mediaMap))

      const next = active.clips[i + 1]
      if (next && clip.end > next.start) {
        issues.push({ clipId: clip.id, clipTitle: clip.title, severity: 'medium', message: 'Este clip se solapa con el siguiente en la timeline.' })
      }
    }

    const penalty = issues.reduce((sum, issue) => sum + (issue.severity === 'high' ? 18 : issue.severity === 'medium' ? 10 : 4), 0)
    const score = Math.max(0, 100 - penalty)
    const health = score >= 85 ? 'Buena' : score >= 65 ? 'Mejorable' : 'Crítica'

    return { issues, health, score }
  }, [active, mediaMap])

  const grouped = useMemo(() => ({
    high: report.issues.filter((issue) => issue.severity === 'high'),
    medium: report.issues.filter((issue) => issue.severity === 'medium'),
    low: report.issues.filter((issue) => issue.severity === 'low'),
  }), [report])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut QA</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/inspector" className="nav-link">Inspector</Link>
          <Link href="/studio/import" className="nav-link">Importar</Link>
          <Link href="/studio/search" className="nav-link">Buscar</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Chequeo de calidad local</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Revisa problemas antes de seguir.</h1>
            <p className="sub">
              Esta pantalla analiza el proyecto actual y te avisa de clips rotos, media faltante, textos flojos, duraciones raras o solapes en la timeline.
            </p>
            <div className="action-row">
              <Link href="/studio/inspector" className="btn btn-primary">Abrir inspector</Link>
              <Link href="/studio/search" className="btn">Abrir búsqueda</Link>
              <Link href="/studio/media-audit" className="btn">Auditar media</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Seleccionar proyecto</h2>
                <div className="timeline-label">{projects.length} proyecto(s)</div>
              </div>
              <div className="project-list">
                {projects.length === 0 ? <div className="empty">No hay proyectos locales todavía.</div> : null}
                {projects.map((project) => (
                  <button key={project.id} className={`project-item ${project.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(project.id)}>
                    <strong>{project.name}</strong>
                    <div className="timeline-label">{project.format} · {project.clips.length} clips</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Estado general</h2>
                <div className="timeline-label">{active?.name ?? 'Sin selección'}</div>
              </div>
              {active ? (
                <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                  <article className="panel card"><h3>Salud</h3><p><strong>{report.health}</strong></p></article>
                  <article className="panel card"><h3>Puntuación</h3><p><strong>{report.score}/100</strong></p></article>
                  <article className="panel card"><h3>Problemas altos</h3><p><strong>{grouped.high.length}</strong></p></article>
                  <article className="panel card"><h3>Problemas medios</h3><p><strong>{grouped.medium.length}</strong></p></article>
                  <article className="panel card"><h3>Problemas bajos</h3><p><strong>{grouped.low.length}</strong></p></article>
                  <article className="panel card"><h3>Clips revisados</h3><p><strong>{active.clips.length}</strong></p></article>
                </div>
              ) : <div className="empty">Selecciona un proyecto.</div>}
            </div>
          </div>
        </section>

        {active ? (
          <section className="section">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Lista de incidencias</h2>
                <div className="timeline-label">{report.issues.length} incidencia(s)</div>
              </div>
              <div className="project-list">
                {report.issues.length === 0 ? <div className="empty">No se detectaron incidencias en este proyecto.</div> : null}
                {report.issues.map((issue, index) => (
                  <div key={`${issue.clipId}-${index}`} className="project-item">
                    <strong>{issue.severity === 'high' ? 'Alta' : issue.severity === 'medium' ? 'Media' : 'Baja'} · {issue.clipTitle}</strong>
                    <div className="timeline-label">{issue.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  )
}
