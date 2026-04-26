'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import {
  createDefaultProjectAudioMix,
  getClipAudioOverride,
  readProjectAudioMixes,
  setClipAudioOverride,
  upsertProjectAudioMix,
  writeProjectAudioMixes,
  type ProjectAudioMix,
} from '@/lib/local-audio-mix'

export default function StudioAudioMixPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [mixes, setMixes] = useState<ProjectAudioMix[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    setMixes(readProjectAudioMixes())
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const audioLibrary = useMemo(() => media.filter((item) => item.kind === 'audio'), [media])

  const activeMix = useMemo(() => {
    if (!active) return null
    return mixes.find((item) => item.projectId === active.id) ?? createDefaultProjectAudioMix(active.id)
  }, [mixes, active])

  function persistMix(nextMix: ProjectAudioMix, nextStatus: string) {
    const next = upsertProjectAudioMix(mixes, nextMix)
    setMixes(next)
    writeProjectAudioMixes(next)
    setStatus(nextStatus)
  }

  function updateMix(patch: Partial<ProjectAudioMix>, nextStatus: string) {
    if (!activeMix) return
    persistMix({ ...activeMix, ...patch }, nextStatus)
  }

  function updateClipOverride(clipId: string, patch: { volume?: number; mute?: boolean }, nextStatus: string) {
    if (!activeMix) return
    persistMix(setClipAudioOverride(activeMix, clipId, patch), nextStatus)
  }

  const stats = useMemo(() => {
    if (!active || !activeMix) return null
    return {
      clips: active.clips.length,
      soundtrack: activeMix.soundtrackMediaId ? (audioLibrary.find((item) => item.id === activeMix.soundtrackMediaId)?.name ?? 'Asignado') : 'Sin música global',
      overrides: activeMix.clipOverrides.length,
      clipsWithAudio: active.clips.filter((clip) => clip.audioMediaId).length,
      totalDuration: active.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0),
    }
  }, [active, activeMix, audioLibrary])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Audio Mix</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/script" className="nav-link">Script</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Mesa de mezcla del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Planifica música, ducking, fades y niveles.</h1>
            <p className="sub">
              Esta zona te deja definir una mezcla base del proyecto antes del render final: música global, fuerza del audio original, ducking y ajustes por clip.
            </p>
            <div className="action-row">
              <Link href="/studio/media" className="btn btn-primary">Abrir media</Link>
              <Link href="/studio/script" className="btn">Abrir script</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y ajusta su mezcla.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y resumen</h2>
                <div className="timeline-label">Base activa</div>
              </div>
              <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                ))}
              </select>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Con audio clip</h3><p><strong>{stats.clipsWithAudio}</strong></p></article>
                  <article className="panel card"><h3>Overrides</h3><p><strong>{stats.overrides}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{stats.totalDuration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Música global</h3><p><strong>{stats.soundtrack}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Mezcla global</h2>
                <div className="timeline-label">Proyecto completo</div>
              </div>
              {activeMix ? (
                <div className="form">
                  <select className="input" value={activeMix.soundtrackMediaId ?? ''} onChange={(event) => updateMix({ soundtrackMediaId: event.target.value || null }, 'Música global actualizada')}>
                    <option value="">Sin música global</option>
                    {audioLibrary.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                  <label className="form">
                    <span className="timeline-label">Volumen música: {activeMix.soundtrackVolume}%</span>
                    <input className="input" type="range" min="0" max="150" step="5" value={activeMix.soundtrackVolume} onChange={(event) => updateMix({ soundtrackVolume: Number(event.target.value) }, 'Volumen de música actualizado')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Volumen audio original: {activeMix.originalAudioVolume}%</span>
                    <input className="input" type="range" min="0" max="150" step="5" value={activeMix.originalAudioVolume} onChange={(event) => updateMix({ originalAudioVolume: Number(event.target.value) }, 'Volumen original actualizado')} />
                  </label>
                  <label className="project-item" style={{ cursor: 'pointer' }}>
                    <strong>Ducking automático</strong>
                    <div className="timeline-label">{activeMix.duckingEnabled ? 'Activo' : 'Inactivo'}</div>
                    <input type="checkbox" checked={activeMix.duckingEnabled} onChange={(event) => updateMix({ duckingEnabled: event.target.checked }, 'Ducking actualizado')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Reducción por ducking: {activeMix.duckingAmount}%</span>
                    <input className="input" type="range" min="0" max="100" step="5" value={activeMix.duckingAmount} onChange={(event) => updateMix({ duckingAmount: Number(event.target.value) }, 'Fuerza de ducking actualizada')} disabled={!activeMix.duckingEnabled} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Fade in música: {activeMix.fadeInSeconds.toFixed(1)} s</span>
                    <input className="input" type="range" min="0" max="5" step="0.1" value={activeMix.fadeInSeconds} onChange={(event) => updateMix({ fadeInSeconds: Number(event.target.value) }, 'Fade in actualizado')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Fade out música: {activeMix.fadeOutSeconds.toFixed(1)} s</span>
                    <input className="input" type="range" min="0" max="5" step="0.1" value={activeMix.fadeOutSeconds} onChange={(event) => updateMix({ fadeOutSeconds: Number(event.target.value) }, 'Fade out actualizado')} />
                  </label>
                </div>
              ) : <div className="empty">Selecciona un proyecto.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Overrides por clip</h2>
              <div className="timeline-label">Ajuste fino</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {active?.clips.length ? active.clips.map((clip) => {
                const override = activeMix ? getClipAudioOverride(activeMix, clip.id) : null
                return (
                  <article key={clip.id} className="panel card">
                    <div className="row-head">
                      <h3>{clip.title}</h3>
                      <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                    </div>
                    <div className="timeline-label">Audio clip: {clip.audioMediaId ? 'Sí' : 'No'}</div>
                    <label className="form">
                      <span className="timeline-label">Volumen clip: {(override?.volume ?? 100)}%</span>
                      <input className="input" type="range" min="0" max="150" step="5" value={override?.volume ?? 100} onChange={(event) => updateClipOverride(clip.id, { volume: Number(event.target.value) }, `Volumen actualizado en ${clip.title}`)} />
                    </label>
                    <label className="project-item" style={{ cursor: 'pointer' }}>
                      <strong>Mute clip</strong>
                      <div className="timeline-label">{override?.mute ? 'Activo' : 'Inactivo'}</div>
                      <input type="checkbox" checked={override?.mute ?? false} onChange={(event) => updateClipOverride(clip.id, { mute: event.target.checked }, `Mute actualizado en ${clip.title}`)} />
                    </label>
                  </article>
                )
              }) : <div className="empty">No hay clips para mezclar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
