'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readProjectBeatMaps, type ProjectBeatMap } from '@/lib/local-beatmap'
import { buildProjectScorecard } from '@/lib/project-scorecard'
import { readStickerLayers, type StickerLayerEntry } from '@/lib/local-sticker-layers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTextLayers, type TextLayerEntry } from '@/lib/local-text-layers'

export default function StudioScorecardPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [textLayers, setTextLayers] = useState<TextLayerEntry[]>([])
  const [stickerLayers, setStickerLayers] = useState<StickerLayerEntry[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setTextLayers(readTextLayers())
    setStickerLayers(readStickerLayers())
    setBeatMaps(readProjectBeatMaps())
    setAudioMixes(readProjectAudioMixes())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeBeatMap = useMemo(() => beatMaps.find((item) => item.projectId === activeProjectId) ?? null, [beatMaps, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const scorecard = useMemo(() => activeProject ? buildProjectScorecard({ project: activeProject, textLayers, stickerLayers, beatMap: activeBeatMap, audioMix: activeAudioMix }) : null, [activeProject, textLayers, stickerLayers, activeBeatMap, activeAudioMix])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Scorecard</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/final-pass" className="nav-link">Final pass</Link>
          <Link href="/studio/delivery-pack" className="nav-link">Delivery pack</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Scorecard operativo</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Lee el estado general del proyecto.</h1>
            <p className="sub">Esta zona resume cifras clave del montaje para tener una visión rápida antes de seguir editando o sacar una entrega.</p>
            <div className="action-row">
              <Link href="/studio/final-pass" className="btn btn-primary">Abrir final pass</Link>
              <Link href="/studio/delivery-pack" className="btn">Abrir delivery pack</Link>
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Scorecard</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          {scorecard ? <div className="cards">
            <article className="panel card"><h3>Clips</h3><p><strong>{scorecard.clips}</strong></p></article>
            <article className="panel card"><h3>Duración</h3><p><strong>{scorecard.duration.toFixed(2)} s</strong></p></article>
            <article className="panel card"><h3>Text layers</h3><p><strong>{scorecard.textLayers}</strong></p></article>
            <article className="panel card"><h3>Stickers</h3><p><strong>{scorecard.stickers}</strong></p></article>
            <article className="panel card"><h3>Beat map</h3><p><strong>{scorecard.hasBeatMap ? 'Sí' : 'No'}</strong></p></article>
            <article className="panel card"><h3>Audio mix</h3><p><strong>{scorecard.hasAudioMix ? 'Sí' : 'No'}</strong></p></article>
          </div> : <div className="panel empty">No hay scorecard disponible.</div>}
        </section>
      </main>
    </div>
  )
}
