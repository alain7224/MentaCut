'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

type BrokenRef = {
  clipId: string
  clipTitle: string
  field: 'mediaId' | 'audioMediaId'
  missingId: string
}

export default function StudioRelinkPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [replacements, setReplacements] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const mediaMap = useMemo(() => new Map(media.map((item) => [item.id, item])), [media])

  const brokenRefs = useMemo<BrokenRef[]>(() => {
    if (!active) return []
    const rows: BrokenRef[] = []

    for (const clip of active.clips) {
      if (clip.mediaId && !mediaMap.has(clip.mediaId)) {
        rows.push({ clipId: clip.id, clipTitle: clip.title, field: 'mediaId', missingId: clip.mediaId })
      }
      if (clip.audioMediaId && !mediaMap.has(clip.audioMediaId)) {
        rows.push({ clipId: clip.id, clipTitle: clip.title, field: 'audioMediaId', missingId: clip.audioMediaId })
      }
    }

    return rows
  }, [active, mediaMap])

  const visualChoices = useMemo(
    () => media.filter((item) => item.kind === 'video' || item.kind === 'image'),
    [media],
  )

  const audioChoices = useMemo(
    () => media.filter((item) => item.kind === 'audio'),
    [media],
  )

  function persistProject(projectId: string, updater: (project: LocalProject) => LocalProject, nextStatus: string) {
    const updated = projects.map((project) => {
      if (project.id !== projectId) return project
      return touchProject(updater(project))
    })
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function applyRelink(ref: BrokenRef) {
    if (!active) return
    const key = `${ref.clipId}:${ref.field}`
    const replacementId = replacements[key]
    if (!replacementId) return

    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => {
          if (clip.id !== ref.clipId) return clip
          return {
            ...clip,
            [ref.field]: replacementId,
          }
        }),
      }),
      `Referencia reparada en clip: ${ref.clipTitle}`,
    )
  }

  function applyAllRelinks() {
    if (!active || brokenRefs.length === 0) return

    let applied = 0

    persistProject(
      active.id,
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => {
          const updates: Partial<typeof clip> = {}
          for (const ref of brokenRefs) {
            if (ref.clipId !== clip.id) continue
            const key = `${ref.clipId}:${ref.field}`
            const replacementId = replacements[key]
            if (replacementId) {
              updates[ref.field] = replacementId as never
              applied += 1
            }
          }
          return Object.keys(updates).length ? { ...clip, ...updates } : clip
        }),
      }),
      applied > 0 ? `Relinks aplicados: ${applied}` : 'No había replacements listos para aplicar',
    )
  }

  const stats = useMemo(() => {
    return {
      broken: brokenRefs.length,
      visualChoices: visualChoices.length,
      audioChoices: audioChoices.length,
      ready: brokenRefs.filter((ref) => replacements[`${ref.clipId}:${ref.field}`]).length,
    }
  }, [brokenRefs, visualChoices.length, audioChoices.length, replacements])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Relink</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/import" className="nav-link">Importar</Link>
          <Link href="/studio/media-audit" className="nav-link">Media audit</Link>
          <Link href="/studio/qa" className="nav-link">QA</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Reparación de referencias rotas</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Reconecta media perdida sin rehacer el proyecto.</h1>
            <p className="sub">
              Esta pantalla detecta clips con vídeo, imagen o audio roto y te deja reasignar archivos locales válidos de forma rápida, especialmente útil tras importaciones o limpieza de librería.
            </p>
            <div className="action-row">
              <Link href="/studio/import" className="btn btn-primary">Abrir importar</Link>
              <Link href="/studio/media-audit" className="btn">Abrir media audit</Link>
              <button className="btn" onClick={applyAllRelinks} disabled={!active || stats.ready === 0}>Aplicar relinks listos</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona replacements y aplica uno por uno o todos juntos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto activo</h2>
                <div className="timeline-label">Base a reparar</div>
              </div>
              <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Referencias rotas</h3><p><strong>{stats.broken}</strong></p></article>
                <article className="panel card"><h3>Visuales válidas</h3><p><strong>{stats.visualChoices}</strong></p></article>
                <article className="panel card"><h3>Audios válidos</h3><p><strong>{stats.audioChoices}</strong></p></article>
                <article className="panel card"><h3>Listas para aplicar</h3><p><strong>{stats.ready}</strong></p></article>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Cuándo usar relink</h2>
                <div className="timeline-label">Casos típicos</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>Importación individual</strong><div className="timeline-label">Cuando el proyecto entra bien pero sus IDs de media no existen en este navegador.</div></div>
                <div className="project-item"><strong>Limpieza de librería</strong><div className="timeline-label">Si borraste archivos y luego quieres reasignar otros sin rehacer el clip.</div></div>
                <div className="project-item"><strong>Reemplazo rápido</strong><div className="timeline-label">Cuando quieres cambiar un visual o audio roto por otro recurso local compatible.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Referencias detectadas</h2>
              <div className="timeline-label">{brokenRefs.length} referencia(s)</div>
            </div>
            <div className="project-list">
              {brokenRefs.length === 0 ? <div className="empty">No se detectaron referencias rotas en este proyecto.</div> : null}
              {brokenRefs.map((ref) => {
                const key = `${ref.clipId}:${ref.field}`
                const choices = ref.field === 'mediaId' ? visualChoices : audioChoices
                return (
                  <div key={key} className="project-item" style={{ display: 'grid', gap: 10 }}>
                    <div>
                      <strong>{ref.clipTitle}</strong>
                      <div className="timeline-label">Campo roto: {ref.field === 'mediaId' ? 'media visual' : 'audio'} · ID perdida: {ref.missingId}</div>
                    </div>
                    <select className="input" value={replacements[key] ?? ''} onChange={(event) => setReplacements((current) => ({ ...current, [key]: event.target.value }))}>
                      <option value="">Selecciona un archivo local</option>
                      {choices.map((item) => (
                        <option key={item.id} value={item.id}>{item.name} · {item.kind}</option>
                      ))}
                    </select>
                    <div className="action-row">
                      <button className="btn btn-primary" onClick={() => applyRelink(ref)} disabled={!replacements[key]}>Aplicar este relink</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
