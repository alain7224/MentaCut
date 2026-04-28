'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readClipNotes, type ClipNoteEntry } from '@/lib/local-clip-notes'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

const roleLabel = (roles: ClipRoleEntry[], projectId: string, clipId: string) => roles.find((item) => item.projectId === projectId && item.clipId === clipId)?.role ?? 'setup'
const needsReshoot = (notes: ClipNoteEntry[], projectId: string, clipId: string) => notes.find((item) => item.projectId === projectId && item.clipId === clipId)?.reshoot ?? false

export default function StudioTimelineMapPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [notes, setNotes] = useState<ClipNoteEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setRoles(readClipRoles())
    setNotes(readClipNotes())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const totalDuration = useMemo(() => activeProject?.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0) ?? 0, [activeProject])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Timeline Map</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio/reorder" className="nav-link">Reorder</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Timeline visual con barras</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Lee el montaje de un vistazo.</h1>
            <p className="sub">Esta zona pinta cada clip como una barra proporcional a su duración y añade contexto de roles y reshoots.</p>
            <div className="action-row">
              <Link href="/studio/player" className="btn btn-primary">Abrir player</Link>
              <Link href="/studio/reorder" className="btn">Abrir reorder</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Mapa visual</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
            <div className="cards">
              <article className="panel card"><h3>Clips</h3><p><strong>{activeProject?.clips.length ?? 0}</strong></p></article>
              <article className="panel card"><h3>Duración total</h3><p><strong>{totalDuration.toFixed(2)} s</strong></p></article>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Mapa de barras</h2><div className="timeline-label">Proporcional al tiempo</div></div>
            <div style={{ display: 'grid', gap: 12 }}>
              {activeProject?.clips.length ? activeProject.clips.map((clip, index) => {
                const duration = Math.max(0.1, clip.end - clip.start)
                const width = totalDuration > 0 ? `${(duration / totalDuration) * 100}%` : '0%'
                const role = roleLabel(roles, activeProject.id, clip.id)
                const reshoot = needsReshoot(notes, activeProject.id, clip.id)
                return (
                  <div key={clip.id} style={{ display: 'grid', gap: 8 }}>
                    <div className="row-head"><h3>#{index + 1} · {clip.title}</h3><div className="timeline-label">{clip.start.toFixed(2)}s → {clip.end.toFixed(2)}s</div></div>
                    <div style={{ height: 18, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                      <div style={{ width, height: '100%', borderRadius: 999, background: reshoot ? 'rgba(255,120,120,.9)' : 'rgba(255,255,255,.72)' }} />
                    </div>
                    <div className="timeline-label">Duración: {duration.toFixed(2)} s · Rol: {role} · Reshoot: {reshoot ? 'Sí' : 'No'}</div>
                  </div>
                )
              }) : <div className="empty">No hay clips para mostrar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
