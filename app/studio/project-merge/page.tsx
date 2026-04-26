'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { mergeProjectClips, type ClipTransferMode } from '@/lib/project-clip-transfer'

export default function StudioProjectMergePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null)
  const [sourceProjectId, setSourceProjectId] = useState<string | null>(null)
  const [mode, setMode] = useState<ClipTransferMode>('append')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setTargetProjectId(next[0]?.id ?? null)
    setSourceProjectId(next[1]?.id ?? next[0]?.id ?? null)
  }, [])

  const targetProject = useMemo(() => projects.find((item) => item.id === targetProjectId) ?? null, [projects, targetProjectId])
  const sourceProject = useMemo(() => projects.find((item) => item.id === sourceProjectId) ?? null, [projects, sourceProjectId])

  const preview = useMemo(() => {
    if (!targetProject || !sourceProject) return null
    const incomingDuration = sourceProject.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
    return {
      incomingCount: sourceProject.clips.length,
      incomingDuration,
      targetCount: targetProject.clips.length,
      resultCount: targetProject.clips.length + sourceProject.clips.length,
    }
  }, [targetProject, sourceProject])

  function applyMerge() {
    if (!targetProject || !sourceProject) return

    const updated = projects.map((project) => {
      if (project.id !== targetProject.id) return project
      return touchProject(mergeProjectClips(project, sourceProject, mode))
    })

    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(`Proyecto fusionado: ${sourceProject.name} → ${targetProject.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Project Merge</span>
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
            <span className="eyebrow">Fusión de proyectos locales</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Añade clips de un proyecto dentro de otro.</h1>
            <p className="sub">
              Esta zona sirve para unir proyectos locales sin exportar nada fuera, útil para consolidar versiones, pruebas o bloques narrativos en un solo montaje.
            </p>
            <div className="action-row">
              <Link href="/studio/projects" className="btn btn-primary">Abrir proyectos</Link>
              <Link href="/studio/compare" className="btn">Abrir comparar</Link>
              <button className="btn" onClick={applyMerge} disabled={!targetProject || !sourceProject}>Fusionar proyectos</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto origen y otro destino.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Origen y destino</h2>
                <div className="timeline-label">Fusión interna</div>
              </div>
              <div className="form">
                <select className="input" value={targetProjectId ?? ''} onChange={(event) => setTargetProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>Destino · {project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={sourceProjectId ?? ''} onChange={(event) => setSourceProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>Origen · {project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={mode} onChange={(event) => setMode(event.target.value as ClipTransferMode)}>
                  <option value="append">Pegar al final del destino</option>
                  <option value="prepend">Pegar al inicio del destino</option>
                </select>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Resultado esperado</div>
              </div>
              {preview ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips origen</h3><p><strong>{preview.incomingCount}</strong></p></article>
                  <article className="panel card"><h3>Duración origen</h3><p><strong>{preview.incomingDuration.toFixed(2)} s</strong></p></article>
                  <article className="panel card"><h3>Clips destino</h3><p><strong>{preview.targetCount}</strong></p></article>
                  <article className="panel card"><h3>Total tras fusión</h3><p><strong>{preview.resultCount}</strong></p></article>
                </div>
              ) : <div className="empty">Selecciona dos proyectos para ver el resumen.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
