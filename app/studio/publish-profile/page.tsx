'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createDefaultPublishProfile, readPublishProfiles, upsertPublishProfile, writePublishProfiles, type PublishProfile } from '@/lib/local-publish-profiles'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioPublishProfilePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [profiles, setProfiles] = useState<PublishProfile[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setProfiles(readPublishProfiles())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeProfile = useMemo(() => {
    if (!activeProject) return null
    return profiles.find((item) => item.projectId === activeProject.id) ?? createDefaultPublishProfile(activeProject.id)
  }, [profiles, activeProject])

  function updateProfile(patch: Partial<PublishProfile>, nextStatus: string) {
    if (!activeProfile) return
    const next = upsertPublishProfile(profiles, { ...activeProfile, ...patch })
    setProfiles(next)
    writePublishProfiles(next)
    setStatus(nextStatus)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Publish Profile</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/publish" className="nav-link">Publish</Link>
          <Link href="/studio/render-queue" className="nav-link">Render queue</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Publish profile del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Guarda título, descripción y salida.</h1>
            <p className="sub">Esta zona guarda la ficha de publicación por proyecto para no perder título, descripción, hashtags, primer comentario y nota de programación.</p>
            <div className="action-row">
              <Link href="/studio/publish" className="btn btn-primary">Abrir publish</Link>
              <Link href="/studio/render-queue" className="btn">Abrir render queue</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y rellena sus datos de salida.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Perfil de publicación</h2><div className="timeline-label">Proyecto activo</div></div>
            {activeProfile ? (
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={activeProfile.platform} onChange={(event) => updateProfile({ platform: event.target.value as PublishProfile['platform'] }, 'Plataforma actualizada')}>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram Reels">Instagram Reels</option>
                  <option value="YouTube Shorts">YouTube Shorts</option>
                  <option value="YouTube">YouTube</option>
                  <option value="Generic">Generic</option>
                </select>
                <input className="input" value={activeProfile.title} onChange={(event) => updateProfile({ title: event.target.value }, 'Título actualizado')} placeholder="Título de publicación" />
                <textarea className="textarea" rows={5} value={activeProfile.description} onChange={(event) => updateProfile({ description: event.target.value }, 'Descripción actualizada')} placeholder="Descripción" />
                <input className="input" value={activeProfile.hashtags} onChange={(event) => updateProfile({ hashtags: event.target.value }, 'Hashtags actualizados')} placeholder="#hashtags" />
                <textarea className="textarea" rows={3} value={activeProfile.firstComment} onChange={(event) => updateProfile({ firstComment: event.target.value }, 'Primer comentario actualizado')} placeholder="Primer comentario" />
                <textarea className="textarea" rows={3} value={activeProfile.scheduleNote} onChange={(event) => updateProfile({ scheduleNote: event.target.value }, 'Nota de programación actualizada')} placeholder="Nota de programación o mejor hora" />
              </div>
            ) : <div className="empty">No hay proyecto seleccionado.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
