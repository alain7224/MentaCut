'use client'

import Link from 'next/link'
import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile } from '@/lib/local-media'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioDirectFramingPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('')
  const frameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setActiveClipId(next[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])

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
        return
      }
      const file = await getLocalMediaFile(activeClip.mediaId)
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
  }, [activeClip])

  function persist(update: (project: LocalProject) => LocalProject, nextStatus: string) {
    if (!activeProject) return
    const updated = projects.map((project) => project.id === activeProject.id ? touchProject(update(project)) : project)
    setProjects(updated)
    writeLocalProjects(updated)
    setStatus(nextStatus)
  }

  function updateClipPosition(x: number, y: number) {
    if (!activeClip || !activeProject) return
    persist(
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => clip.id === activeClip.id ? { ...clip, frameX: x, frameY: y } : clip),
      }),
      'Framing actualizado por arrastre',
    )
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || !frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    updateClipPosition(Number(x.toFixed(2)), Number(y.toFixed(2)))
  }

  function handleWheel(delta: number) {
    if (!activeClip || !activeProject) return
    const nextScale = Math.max(0.5, Math.min(2.5, activeClip.frameScale + delta))
    persist(
      (project) => ({
        ...project,
        clips: project.clips.map((clip) => clip.id === activeClip.id ? { ...clip, frameScale: Number(nextScale.toFixed(3)) } : clip),
      }),
      'Scale actualizado con rueda',
    )
  }

  const isVideo = mediaType.startsWith('video/')

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Direct Framing</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/framing" className="nav-link">Framing</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Framing directo con arrastre</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Toca, arrastra y rueda para reencuadrar.</h1>
            <p className="sub">Esta zona usa la media real del clip y te deja moverla con puntero o dedo dentro del frame, además de cambiar scale con rueda.</p>
            <div className="action-row">
              <Link href="/studio/framing" className="btn btn-primary">Abrir framing</Link>
              <Link href="/studio/player" className="btn">Abrir player</Link>
            </div>
            <div className="timeline-label">{status || 'Arrastra sobre el preview para reposicionar el clip.'}</div>
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
              {activeClip ? (
                <div className="cards">
                  <article className="panel card"><h3>X</h3><p><strong>{activeClip.frameX.toFixed(2)}%</strong></p></article>
                  <article className="panel card"><h3>Y</h3><p><strong>{activeClip.frameY.toFixed(2)}%</strong></p></article>
                  <article className="panel card"><h3>Scale</h3><p><strong>{activeClip.frameScale.toFixed(2)}</strong></p></article>
                </div>
              ) : <div className="empty">No hay clip seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Ayuda rápida</h2><div className="timeline-label">Gestos</div></div>
              <div className="project-list">
                <div className="project-item"><strong>Arrastrar</strong><div className="timeline-label">Mueve el centro visual del clip.</div></div>
                <div className="project-item"><strong>Rueda</strong><div className="timeline-label">Acerca o aleja el contenido.</div></div>
                <div className="project-item"><strong>Soltar</strong><div className="timeline-label">Guarda el framing en el proyecto.</div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Preview interactivo</h2><div className="timeline-label">Arrastra dentro del frame</div></div>
            {activeClip ? (
              <div className="panel" style={{ minHeight: 520, display: 'grid', placeItems: 'center' }}>
                <div
                  ref={frameRef}
                  onPointerDown={() => setDragging(true)}
                  onPointerUp={() => setDragging(false)}
                  onPointerLeave={() => setDragging(false)}
                  onPointerMove={handlePointerMove}
                  onWheel={(event) => {
                    event.preventDefault()
                    handleWheel(event.deltaY > 0 ? -0.04 : 0.04)
                  }}
                  style={{ position: 'relative', width: '68%', aspectRatio: '9 / 16', borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
                >
                  {mediaUrl ? (
                    isVideo ? (
                      <video src={mediaUrl} autoPlay muted loop playsInline style={{ position: 'absolute', width: `${activeClip.frameScale * 100}%`, height: `${activeClip.frameScale * 100}%`, left: `${activeClip.frameX}%`, top: `${activeClip.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
                    ) : (
                      <img src={mediaUrl} alt={activeClip.title} style={{ position: 'absolute', width: `${activeClip.frameScale * 100}%`, height: `${activeClip.frameScale * 100}%`, left: `${activeClip.frameX}%`, top: `${activeClip.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
                    )
                  ) : (
                    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><span className="timeline-label">Sin media visual</span></div>
                  )}
                  <div style={{ position: 'absolute', inset: '8%', border: '1px dashed rgba(255,255,255,.18)', borderRadius: 18 }} />
                </div>
              </div>
            ) : <div className="empty">No hay preview disponible.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
