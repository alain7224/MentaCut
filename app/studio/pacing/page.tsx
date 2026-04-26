'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type DurationMode = 'equal' | 'keep-ratio'

function normalizeTimeline(project: LocalProject, durations: number[]): LocalProject {
  let cursor = 0
  return {
    ...project,
    clips: project.clips.map((clip, index) => {
      const nextDuration = Math.max(0.5, Number(durations[index].toFixed(2)))
      const start = Number(cursor.toFixed(2))
      const end = Number((cursor + nextDuration).toFixed(2))
      cursor = end
      return {
        ...clip,
        start,
        end,
      }
    }),
  }
}

export default function StudioPacingPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [targetDuration, setTargetDuration] = useState(20)
  const [mode, setMode] = useState<DurationMode>('equal')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])

  const currentDurations = useMemo(
    () => active?.clips.map((clip) => Math.max(0.5, clip.end - clip.start)) ?? [],
    [active],
  )

  const currentTotal = useMemo(
    () => currentDurations.reduce((sum, value) => sum + value, 0),
    [currentDurations],
  )

  useEffect(() => {
    if (currentTotal > 0) {
      setTargetDuration(Number(currentTotal.toFixed(1)))
    }
  }, [activeId, currentTotal])

  const previewDurations = useMemo(() => {
    if (!active || active.clips.length === 0) return []

    const safeTarget = Math.max(active.clips.length * 0.5, targetDuration)

    if (mode === 'equal') {
      const each = safeTarget / active.clips.length
      return active.clips.map(() => Number(each.toFixed(2)))
    }

    const baseTotal = currentDurations.reduce((sum, value) => sum + value, 0)
    if (baseTotal <= 0) {
      const each = safeTarget / active.clips.length
      return active.clips.map(() => Number(each.toFixed(2)))
    }

    return currentDurations.map((value) => Number(((value / baseTotal) * safeTarget).toFixed(2)))
  }, [active, currentDurations, mode, targetDuration])

  const previewProject = useMemo(() => {
    if (!active) return null
    return normalizeTimeline(active, previewDurations)
  }, [active, previewDurations])

  function persist(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function applyPreview() {
    if (!active || !previewProject) return
    persist(active.id, () => previewProject, 'Ritmo del proyecto actualizado')
  }

  function applyPreset(seconds: number) {
    setTargetDuration(seconds)
    setStatus(`Objetivo ajustado a ${seconds}s`)
  }

  function updateSingleDuration(index: number, value: number) {
    if (!active) return
    const nextDurations = currentDurations.map((item, currentIndex) => currentIndex === index ? Math.max(0.5, value) : item)
    const normalized = normalizeTimeline(active, nextDurations)
    persist(active.id, () => normalized, 'Duración individual del clip actualizada')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Pacing</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/qa" className="nav-link">QA</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Ajuste de ritmo y pacing</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Rebalancea duraciones sin pelearte con la timeline.</h1>
            <p className="sub">
              Esta pantalla redistribuye el tiempo total del proyecto para acelerar, compactar o estirar la secuencia de clips de forma rápida y ordenada.
            </p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
              <button className="btn" onClick={applyPreview} disabled={!previewProject}>Aplicar preview</button>
            </div>
            <div className="timeline-label">{status || 'Primero elige proyecto y duración objetivo.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configurar pacing</h2>
                <div className="timeline-label">Proyecto y objetivo</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <label className="form">
                  <span className="timeline-label">Duración actual: {currentTotal.toFixed(1)} s</span>
                  <input className="input" type="range" min={Math.max((active?.clips.length ?? 1) * 0.5, 2)} max={120} step="0.5" value={targetDuration} onChange={(event) => setTargetDuration(Number(event.target.value))} />
                </label>
                <div className="preset-chip-wrap">
                  {[10, 15, 20, 30, 45, 60].map((seconds) => (
                    <button key={seconds} className="preset-chip" onClick={() => applyPreset(seconds)}>{seconds}s</button>
                  ))}
                </div>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as DurationMode)}>
                  <option value="equal">Igualar todos los clips</option>
                  <option value="keep-ratio">Mantener proporciones actuales</option>
                </select>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen del preview</h2>
                <div className="timeline-label">Aplicación no destructiva hasta confirmar</div>
              </div>
              {previewProject ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{previewProject.clips.length}</strong></p></article>
                  <article className="panel card"><h3>Objetivo</h3><p><strong>{targetDuration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Modo</h3><p><strong>{mode === 'equal' ? 'Igualado' : 'Proporcional'}</strong></p></article>
                  <article className="panel card"><h3>Último fin</h3><p><strong>{previewProject.clips[previewProject.clips.length - 1]?.end.toFixed(1) ?? '0.0'} s</strong></p></article>
                </div>
              ) : <div className="empty">Selecciona un proyecto para generar preview.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Duraciones actuales y preview</h2>
              <div className="timeline-label">Clip por clip</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {active?.clips.length ? active.clips.map((clip, index) => (
                <article key={clip.id} className="panel card">
                  <h3>{clip.title}</h3>
                  <p><strong>Actual:</strong> {(clip.end - clip.start).toFixed(2)} s</p>
                  <p><strong>Preview:</strong> {(previewDurations[index] ?? 0).toFixed(2)} s</p>
                  <p><strong>Nuevo rango:</strong> {previewProject?.clips[index] ? `${previewProject.clips[index].start.toFixed(1)}s → ${previewProject.clips[index].end.toFixed(1)}s` : '—'}</p>
                  <label className="form">
                    <span className="timeline-label">Ajuste directo individual</span>
                    <input className="input" type="range" min="0.5" max="20" step="0.5" value={Math.max(0.5, clip.end - clip.start)} onChange={(event) => updateSingleDuration(index, Number(event.target.value))} />
                  </label>
                </article>
              )) : <div className="empty">No hay clips para ajustar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
