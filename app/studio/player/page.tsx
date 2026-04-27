'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile } from '@/lib/local-media'
import { createDefaultClipSpeedPlan, getClipSpeedPlan, getEffectiveClipDuration, readClipSpeedPlans, type ClipSpeedPlan } from '@/lib/local-clip-speed'
import { createDefaultClipSourceTrimPlan, getClipSourceTrimPlan, readClipSourceTrimPlans, resolveSourceTrim, type ClipSourceTrimPlan } from '@/lib/local-source-trim'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioPlayerPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [speedPlans, setSpeedPlans] = useState<ClipSpeedPlan[]>([])
  const [trimPlans, setTrimPlans] = useState<ClipSourceTrimPlan[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [status, setStatus] = useState('')
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null)
  const imageTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setSpeedPlans(readClipSpeedPlans())
    setTrimPlans(readClipSourceTrimPlans())
    setActiveProjectId(next[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const cues = useMemo(() => {
    if (!activeProject) return []
    return activeProject.clips.map((clip) => {
      const speed = getClipSpeedPlan(speedPlans, activeProject.id, clip.id) ?? createDefaultClipSpeedPlan(activeProject.id, clip.id)
      const trim = getClipSourceTrimPlan(trimPlans, activeProject.id, clip.id) ?? createDefaultClipSourceTrimPlan(activeProject.id, clip.id)
      return {
        ...clip,
        speed: speed.speed,
        trim,
        effectiveDuration: getEffectiveClipDuration(clip.start, clip.end, speed.speed),
      }
    })
  }, [activeProject, speedPlans, trimPlans])
  const currentCue = cues[currentIndex] ?? null

  useEffect(() => {
    setCurrentIndex(0)
    setPlaying(false)
  }, [activeProjectId])

  useEffect(() => {
    let revoke = ''
    async function loadMedia() {
      if (!currentCue?.mediaId) {
        setMediaUrl('')
        setMediaType('')
        return
      }
      const file = await getLocalMediaFile(currentCue.mediaId)
      if (!file) {
        setMediaUrl('')
        setMediaType('')
        return
      }
      const url = URL.createObjectURL(file)
      revoke = url
      setMediaUrl(url)
      setMediaType(file.type)
    }
    void loadMedia()
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [currentCue])

  useEffect(() => {
    if (imageTimerRef.current) {
      window.clearTimeout(imageTimerRef.current)
      imageTimerRef.current = null
    }

    if (!playing || !currentCue) return

    const isImage = mediaType.startsWith('image/') || !mediaUrl
    if (isImage) {
      imageTimerRef.current = window.setTimeout(() => {
        setCurrentIndex((index) => {
          if (index >= cues.length - 1) {
            setPlaying(false)
            return index
          }
          return index + 1
        })
      }, currentCue.effectiveDuration * 1000)
    }

    return () => {
      if (imageTimerRef.current) {
        window.clearTimeout(imageTimerRef.current)
        imageTimerRef.current = null
      }
    }
  }, [playing, currentCue, mediaType, mediaUrl, cues.length])

  function handleLoadedMetadata() {
    const element = mediaRef.current
    if (!element || !currentCue) return
    const { start } = resolveSourceTrim(Number.isFinite(element.duration) ? element.duration : currentCue.end - currentCue.start, currentCue.trim)
    element.currentTime = start
    element.playbackRate = Math.max(0.1, currentCue.speed)
    if (playing) {
      void element.play()
      setStatus(`Reproduciendo ${currentCue.title}`)
    }
  }

  function handleTimeUpdate() {
    const element = mediaRef.current
    if (!element || !currentCue) return
    const { end } = resolveSourceTrim(Number.isFinite(element.duration) ? element.duration : currentCue.end - currentCue.start, currentCue.trim)
    if (element.currentTime >= end - 0.03) {
      element.pause()
      goNext()
    }
  }

  function goNext() {
    setCurrentIndex((index) => {
      if (index >= cues.length - 1) {
        setPlaying(false)
        return index
      }
      return index + 1
    })
  }

  function goPrev() {
    setCurrentIndex((index) => Math.max(0, index - 1))
  }

  function playPause() {
    if (!currentCue) return
    const next = !playing
    setPlaying(next)
    const element = mediaRef.current
    if (element) {
      if (next) void element.play()
      else element.pause()
    }
  }

  const progress = useMemo(() => cues.length ? ((currentIndex + 1) / cues.length) * 100 : 0, [cues.length, currentIndex])
  const isVideo = mediaType.startsWith('video/')
  const isAudio = mediaType.startsWith('audio/')

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Player</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/source-trim" className="nav-link">Source trim</Link>
          <Link href="/studio/speed" className="nav-link">Speed</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Player real del timeline</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Reproduce el montaje clip por clip.</h1>
            <p className="sub">Esta zona usa media real del proyecto y reproduce la secuencia completa teniendo en cuenta speed y source trim del clip activo.</p>
            <div className="action-row">
              <Link href="/studio/source-trim" className="btn btn-primary">Abrir source trim</Link>
              <Link href="/studio/speed" className="btn">Abrir speed</Link>
              <button className="btn" onClick={playPause} disabled={!currentCue}>{playing ? 'Pausar' : 'Reproducir'}</button>
              <button className="btn" onClick={goPrev} disabled={currentIndex === 0}>Anterior</button>
              <button className="btn" onClick={goNext} disabled={currentIndex >= cues.length - 1}>Siguiente</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y reproduce su timeline.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y progreso</h2><div className="timeline-label">Playback</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              <div className="cards">
                <article className="panel card"><h3>Clip actual</h3><p><strong>{currentCue ? `${currentIndex + 1}/${cues.length}` : '—'}</strong></p></article>
                <article className="panel card"><h3>Speed</h3><p><strong>{currentCue ? `${currentCue.speed.toFixed(2)}x` : '—'}</strong></p></article>
                <article className="panel card"><h3>Duración efectiva</h3><p><strong>{currentCue ? `${currentCue.effectiveDuration.toFixed(2)} s` : '—'}</strong></p></article>
              </div>
              <label className="form">
                <span className="timeline-label">Progreso global: {progress.toFixed(0)}%</span>
                <input className="input" type="range" min="0" max={Math.max(0, cues.length - 1)} step="1" value={Math.min(currentIndex, Math.max(0, cues.length - 1))} onChange={(event) => setCurrentIndex(Number(event.target.value))} disabled={!cues.length} />
              </label>
            </div>

            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview</h2><div className="timeline-label">Clip actual</div></div>
              {currentCue ? (
                <div className="panel" style={{ minHeight: 420, display: 'grid', placeItems: 'center' }}>
                  <div style={{ position: 'relative', width: '78%', aspectRatio: '9 / 16', borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)' }}>
                    {mediaUrl ? (
                      isVideo ? (
                        <video ref={mediaRef as React.RefObject<HTMLVideoElement>} src={mediaUrl} muted playsInline onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} style={{ position: 'absolute', width: `${currentCue.frameScale * 100}%`, height: `${currentCue.frameScale * 100}%`, left: `${currentCue.frameX}%`, top: `${currentCue.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
                      ) : isAudio ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                          <audio ref={mediaRef as React.RefObject<HTMLAudioElement>} src={mediaUrl} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} controls style={{ width: '80%' }} />
                        </div>
                      ) : (
                        <img src={mediaUrl} alt={currentCue.title} style={{ position: 'absolute', width: `${currentCue.frameScale * 100}%`, height: `${currentCue.frameScale * 100}%`, left: `${currentCue.frameX}%`, top: `${currentCue.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
                      )
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span className="timeline-label">Sin media visual</span></div>
                    )}
                    <div style={{ position: 'absolute', left: '50%', bottom: '8%', transform: 'translateX(-50%)', maxWidth: '74%', padding: '10px 14px', borderRadius: 14, background: 'rgba(0,0,0,.55)', color: '#fff', textAlign: 'center', fontWeight: 700, backdropFilter: 'blur(6px)' }}>
                      {currentCue.captionText || currentCue.headlineText || currentCue.title}
                    </div>
                  </div>
                </div>
              ) : <div className="empty">No hay clips para reproducir.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
