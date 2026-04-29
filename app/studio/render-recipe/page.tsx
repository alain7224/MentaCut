'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { buildRenderRecipe } from '@/lib/render-recipe'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readStickerLayers, type StickerLayerEntry } from '@/lib/local-sticker-layers'
import { readTextLayers, type TextLayerEntry } from '@/lib/local-text-layers'

export default function StudioRenderRecipePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [textLayers, setTextLayers] = useState<TextLayerEntry[]>([])
  const [stickerLayers, setStickerLayers] = useState<StickerLayerEntry[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setTextLayers(readTextLayers())
    setStickerLayers(readStickerLayers())
    setAudioMixes(readProjectAudioMixes())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const recipe = useMemo(() => activeProject ? buildRenderRecipe(activeProject, { textLayers, stickerLayers, audioMix: activeAudioMix }) : null, [activeProject, textLayers, stickerLayers, activeAudioMix])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Render Recipe</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/render-queue" className="nav-link">Render queue</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Receta de render/export</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Prepara la salida real del proyecto.</h1>
            <p className="sub">Esta zona arma una receta de render con notas y comando base de FFmpeg para el worker futuro.</p>
            <div className="action-row">
              <Link href="/studio/render-queue" className="btn btn-primary">Abrir render queue</Link>
              <Link href="/studio/export-bundle" className="btn">Abrir export bundle</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base de receta</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Resumen</h2><div className="timeline-label">Receta</div></div>
              {recipe ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{recipe.clips}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{recipe.duration.toFixed(2)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
              <div className="project-list">
                {recipe?.notes.map((note, index) => <div key={index} className="project-item"><div className="timeline-label">{note}</div></div>)}
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Comando FFmpeg base</h2><div className="timeline-label">Worker future-ready</div></div>
              <textarea className="textarea" rows={14} readOnly value={recipe?.ffmpegCommand ?? ''} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
