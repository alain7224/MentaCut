'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile } from '@/lib/local-media'
import { createDefaultClipSourceTrimPlan, getClipSourceTrimPlan, readClipSourceTrimPlans, resolveSourceTrim, upsertClipSourceTrimPlan, writeClipSourceTrimPlans, type ClipSourceTrimPlan } from '@/lib/local-source-trim'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioSourceTrimPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [plans, setPlans] = useState<ClipSourceTrimPlan[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState<string>('')
  const [mediaType, setMediaType] = useState<string>('')
  const [mediaDuration, setMediaDuration] = useState<number>(0)
  const [status, setStatus] = useState('')
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setPlans(readClipSourceTrimPlans())
    setActiveProjectId(next[0]?.id ?? null)
    setActiveClipId(next[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])
  const activePlan = useMemo(() => {
    if (!activeProject || !activeClip) return null
    return getClipSourceTrimPlan(plans, activeProject.id, activeClip.id) ?? createDefaultClipSourceTrimPlan(activeProject.id, activeClip.id)
  }, [plans, activeProject, activeClip])

  useEffect(() => {
    if (!activeProject) {
      setActiveClipId(null)
      return
    }
    const exists = activeProject.clips.some((clip) => clip.id === activeClipId)
    if (!exists) setActiveClipId(activeProject.clips[0]?.id ?? null)
  }, [activeProject, activeClipId])

  useEffect(() => {
    let revoke = ''
    async function loadMedia() {
      if (!activeClip?.mediaId) {
        setMediaUrl('')
        setMediaType('')
        setMediaDuration(0)
        return
      }
      const file = await getLocalMediaFile(activeClip.mediaId)
      if (!file) {
        setMediaUrl('')
        setMediaType('')
        setMediaDuration(0)
        return
      }
      const url = URL.createObjectURL(file)
      revoke = url
      setMediaUrl(url)
      setMediaType(file.type)
      setMediaDuration(Number(activeClip.end - activeClip.start) || 0)
    }
    void loadMedia()
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [activeClip])

  function persist(nextPlans: ClipSourceTrimPlan[], nextStatus: string) {
    setPlans(nextPlans)
    writeClipSourceTrimPlans(nextPlans)
    setStatus(nextStatus)
  }

  function updatePlan(patch: Partial<ClipSourceTrimPlan>, nextStatus: string) {
    if (!activePlan) return
    persist(upsertClipSourceTrimPlan(plans, { ...activePlan, ...patch }), nextStatus)
  }

  function handleLoadedMetadata() {
    const element = mediaRef.current
    if (!element) return
    setMediaDuration(Number.isFinite(element.duration) ? element.duration : 0)
  }

  function previewSegment() {
    const element = mediaRef.current
    if (!element || !activePlan || !mediaDuration) return
    const { start, end } = resolveSourceTrim(mediaDuration, activePlan)
    element.currentTime = start
    void element.play()
    const stop = () => {
      if (element.currentTime >= end - 0.03) {
        element.pause()
        element.removeEventListener('timeupdate', stop)
      }
    }
    element.addEventListener('timeupdate', stop)
  }

  const windowInfo = useMemo(() => resolveSourceTrim(mediaDuration || Math.max(0.1, (activeClip?.end ?? 0) - (activeClip?.start ?? 0)), activePlan), [mediaDuration, activeClip, activePlan])
  const isVideo = mediaType.startsWith('video/')
  const isAudio = mediaType.startsWith('audio/')

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Source Trim</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/trim" className="nav-link">Trim</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Source trim real del clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Define in y out del medio fuente.</h1>
            <p className="sub">Esta zona recorta el vídeo o audio fuente del clip, para que el preview use solo el segmento marcado y no todo el archivo.</p>
            <div className="action-row">
              <Link href="/studio/trim" className="btn btn-primary">Abrir trim</Link>
              <Link href="/studio/player" className="btn">Abrir player</Link>
              <button className="btn" onClick={previewSegment} disabled={!mediaUrl || (!isVideo && !isAudio)}>Preview segmento</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona proyecto, clip y ajusta el rango fuente.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y clip</h2><div className="timeline-label">Base activa</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={activeClipId ?? ''} onChange={(event) => setActiveClipId(event.target.value)}>
                  {activeProject?.clips.map((clip) => <option key={clip.id} value={clip.id}>{clip.title}</option>)}
                </select>
              </div>
              {activePlan ? (
                <div className="cards">
                  <article className="panel card"><h3>In</h3><p><strong>{windowInfo.start.toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Out</h3><p><strong>{windowInfo.end.toFixed(3)} s</strong></p></article>
                  <article className="panel card"><h3>Ventana</h3><p><strong>{(windowInfo.end - windowInfo.start).toFixed(3)} s</strong></p></article>
                </div>
              ) : <div className="empty">No hay clip seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview del medio</h2><div className="timeline-label">Fuente real</div></div>
              {mediaUrl ? (
                isVideo ? (
                  <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={mediaUrl} controls onLoadedMetadata={handleLoadedMetadata} style={{ width: '100%', borderRadius: 18 }} />
                ) : isAudio ? (
                  <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} controls onLoadedMetadata={handleLoadedMetadata} style={{ width: '100%' }} />
                ) : (
                  <img src={mediaUrl} alt={activeClip?.title || 'preview'} style={{ width: '100%', borderRadius: 18 }} />
                )
              ) : <div className="empty">Este clip no tiene media fuente válida para preview.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Controles de source trim</h2><div className="timeline-label">Rango fuente</div></div>
            {activePlan ? (
              <div className="form">
                <label className="form">
                  <span className="timeline-label">Media start: {(activePlan.mediaStart ?? 0).toFixed(3)} s</span>
                  <input className="input" type="range" min="0" max={Math.max(0.1, mediaDuration || 0.1)} step="0.05" value={Math.min(activePlan.mediaStart ?? 0, Math.max(0, mediaDuration - 0.05))} onChange={(event) => updatePlan({ mediaStart: Number(event.target.value) }, 'Media start actualizado')} disabled={!mediaUrl || (!isVideo && !isAudio)} />
                </label>
                <label className="form">
                  <span className="timeline-label">Media end: {(activePlan.mediaEnd ?? mediaDuration).toFixed(3)} s</span>
                  <input className="input" type="range" min="0.05" max={Math.max(0.1, mediaDuration || 0.1)} step="0.05" value={Math.max(activePlan.mediaStart + 0.05, activePlan.mediaEnd ?? mediaDuration)} onChange={(event) => updatePlan({ mediaEnd: Number(event.target.value) }, 'Media end actualizado')} disabled={!mediaUrl || (!isVideo && !isAudio)} />
                </label>
                <button className="btn" onClick={() => updatePlan({ mediaStart: 0, mediaEnd: null }, 'Source trim reiniciado')} disabled={!activePlan}>Reiniciar trim</button>
              </div>
            ) : <div className="empty">No hay plan de trim activo.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
