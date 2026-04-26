'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, writeLocalProjects, type LocalProject, type ProjectFormat } from '@/lib/local-store'
import { createProjectVariant, type VariantStrategy } from '@/lib/project-variants'

const FORMATS: ProjectFormat[] = ['9:16', '1:1', '4:5', '16:9']
const STRATEGIES: Array<{ value: VariantStrategy; label: string; help: string }> = [
  { value: 'keep', label: 'Mantener encuadre', help: 'Duplica el proyecto manteniendo el scale actual.' },
  { value: 'fit', label: 'Encajar mejor', help: 'Reduce un poco el scale para dar más aire al nuevo formato.' },
  { value: 'fill', label: 'Llenar más', help: 'Aumenta un poco el scale para llenar mejor el cuadro.' },
]

export default function StudioVariantsPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [targetFormat, setTargetFormat] = useState<ProjectFormat>('1:1')
  const [strategy, setStrategy] = useState<VariantStrategy>('keep')
  const [suffix, setSuffix] = useState('variante')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveId(next[0]?.id ?? null)
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const selectedStrategy = useMemo(() => STRATEGIES.find((item) => item.value === strategy) ?? STRATEGIES[0], [strategy])

  const preview = useMemo(() => {
    if (!active) return null
    return createProjectVariant(active, targetFormat, strategy, suffix || targetFormat)
  }, [active, targetFormat, strategy, suffix])

  const stats = useMemo(() => {
    if (!active || !preview) return null
    return {
      clips: preview.clips.length,
      sourceFormat: active.format,
      targetFormat: preview.format,
      duration: preview.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
      avgScaleBefore: active.clips.length ? active.clips.reduce((sum, clip) => sum + clip.frameScale, 0) / active.clips.length : 0,
      avgScaleAfter: preview.clips.length ? preview.clips.reduce((sum, clip) => sum + clip.frameScale, 0) / preview.clips.length : 0,
    }
  }, [active, preview])

  function createVariantProject() {
    if (!active || !preview) return
    const existing = readLocalProjects()
    writeLocalProjects([preview, ...existing])
    setProjects([preview, ...existing])
    setStatus(`Variante creada: ${preview.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Variants</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/compare" className="nav-link">Comparar</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Generador de variantes por formato</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Duplica un proyecto para otra relación de aspecto.</h1>
            <p className="sub">
              Esta zona sirve para sacar una versión nueva del proyecto base en otro formato, conservando tiempos, clips y estructura sin empezar desde cero.
            </p>
            <div className="action-row">
              <Link href="/studio/projects" className="btn btn-primary">Abrir proyectos</Link>
              <Link href="/studio/compare" className="btn">Abrir comparar</Link>
              <button className="btn" onClick={createVariantProject} disabled={!preview}>Crear variante</button>
            </div>
            <div className="timeline-label">{status || 'Elige proyecto base, formato destino y estrategia visual.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configurar variante</h2>
                <div className="timeline-label">Proyecto de origen</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={targetFormat} onChange={(event) => setTargetFormat(event.target.value as ProjectFormat)}>
                  {FORMATS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input" value={strategy} onChange={(event) => setStrategy(event.target.value as VariantStrategy)}>
                  {STRATEGIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
                <input className="input" value={suffix} onChange={(event) => setSuffix(event.target.value)} placeholder="Sufijo del nuevo proyecto" />
                <div className="timeline-label">{selectedStrategy.help}</div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen de la variante</h2>
                <div className="timeline-label">Preview del duplicado</div>
              </div>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Origen</h3><p><strong>{stats.sourceFormat}</strong></p></article>
                  <article className="panel card"><h3>Destino</h3><p><strong>{stats.targetFormat}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{stats.duration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Scale medio origen</h3><p><strong>{stats.avgScaleBefore.toFixed(2)}</strong></p></article>
                  <article className="panel card"><h3>Scale medio destino</h3><p><strong>{stats.avgScaleAfter.toFixed(2)}</strong></p></article>
                </div>
              ) : <div className="empty">No hay preview disponible todavía.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Clips del preview</h2>
              <div className="timeline-label">Variante generada</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {preview?.clips.length ? preview.clips.map((clip, index) => (
                <article key={clip.id} className="panel card">
                  <h3>#{index + 1} · {clip.title}</h3>
                  <p><strong>Tiempo:</strong> {clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</p>
                  <p><strong>Scale:</strong> {clip.frameScale.toFixed(3)}</p>
                  <p><strong>Headline:</strong> {clip.headlineText || '—'}</p>
                </article>
              )) : <div className="empty">Selecciona un proyecto para ver la variante.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
