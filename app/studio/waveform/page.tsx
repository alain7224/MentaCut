'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile, listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readProjectBeatMaps } from '@/lib/local-beatmap'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioWaveformPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [audioLibrary, setAudioLibrary] = useState<LocalMediaRecord[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeAudioId, setActiveAudioId] = useState<string>('')
  const [audioUrl, setAudioUrl] = useState('')
  const [duration, setDuration] = useState(0)
  const [samples, setSamples] = useState<number[]>([])
  const [status, setStatus] = useState('')
  const [markerTimes, setMarkerTimes] = useState<number[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then((items) => setAudioLibrary(items.filter((item) => item.kind === 'audio'))).catch(() => setAudioLibrary([]))
    const beatMaps = readProjectBeatMaps()
    const firstBeatMap = beatMaps.find((item) => item.projectId === nextProjects[0]?.id)
    if (firstBeatMap?.audioMediaId) setActiveAudioId(firstBeatMap.audioMediaId)
    setMarkerTimes(firstBeatMap?.markers ?? [])
  }, [])

  useEffect(() => {
    const beatMaps = readProjectBeatMaps()
    const beatMap = beatMaps.find((item) => item.projectId === activeProjectId)
    if (beatMap?.audioMediaId) setActiveAudioId(beatMap.audioMediaId)
    setMarkerTimes(beatMap?.markers ?? [])
  }, [activeProjectId])

  useEffect(() => {
    let revoke = ''
    async function loadAudio() {
      if (!activeAudioId) {
        setAudioUrl('')
        setSamples([])
        setDuration(0)
        return
      }
      const file = await getLocalMediaFile(activeAudioId)
      if (!file) {
        setAudioUrl('')
        setSamples([])
        setDuration(0)
        return
      }
      const url = URL.createObjectURL(file)
      revoke = url
      setAudioUrl(url)
      setStatus('Analizando audio...')

      try {
        const buffer = await file.arrayBuffer()
        const context = new AudioContext()
        const decoded = await context.decodeAudioData(buffer.slice(0))
        const channel = decoded.getChannelData(0)
        const bins = 300
        const block = Math.max(1, Math.floor(channel.length / bins))
        const nextSamples: number[] = []
        for (let i = 0; i < bins; i += 1) {
          const start = i * block
          const end = Math.min(channel.length, start + block)
          let max = 0
          for (let j = start; j < end; j += 1) {
            const v = Math.abs(channel[j])
            if (v > max) max = v
          }
          nextSamples.push(max)
        }
        setSamples(nextSamples)
        setDuration(decoded.duration)
        setStatus('Waveform generada')
        await context.close()
      } catch {
        setSamples([])
        setDuration(0)
        setStatus('No se pudo generar la waveform')
      }
    }
    void loadAudio()
    return () => {
      if (revoke) URL.revokeObjectURL(revoke)
    }
  }, [activeAudioId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const width = canvas.width
    const height = canvas.height
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(0, 0, width, height)

    if (!samples.length) return

    const barWidth = width / samples.length
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    samples.forEach((sample, index) => {
      const h = Math.max(2, sample * height * 0.9)
      const x = index * barWidth
      const y = (height - h) / 2
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), h)
    })

    if (duration > 0 && markerTimes.length) {
      ctx.strokeStyle = 'rgba(255, 120, 120, 0.85)'
      ctx.lineWidth = 2
      markerTimes.forEach((time) => {
        const x = (time / duration) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()
      })
    }
  }, [samples, duration, markerTimes])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Waveform</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/beatmap" className="nav-link">Beat map</Link>
          <Link href="/studio/audio-mix" className="nav-link">Audio mix</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Waveform real del audio</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Ve la forma de onda del archivo real.</h1>
            <p className="sub">Esta zona analiza el audio subido, dibuja su waveform y superpone markers del beat map del proyecto cuando existen.</p>
            <div className="action-row">
              <Link href="/studio/beatmap" className="btn btn-primary">Abrir beat map</Link>
              <Link href="/studio/audio-mix" className="btn">Abrir audio mix</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto o un audio para ver su waveform.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y audio</h2><div className="timeline-label">Fuente</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={activeAudioId} onChange={(event) => setActiveAudioId(event.target.value)}>
                  <option value="">Selecciona audio</option>
                  {audioLibrary.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
              <div className="cards">
                <article className="panel card"><h3>Proyecto</h3><p><strong>{activeProject?.name ?? '—'}</strong></p></article>
                <article className="panel card"><h3>Duración audio</h3><p><strong>{duration.toFixed(2)} s</strong></p></article>
                <article className="panel card"><h3>Markers</h3><p><strong>{markerTimes.length}</strong></p></article>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview audio</h2><div className="timeline-label">Escucha</div></div>
              {audioUrl ? <audio controls src={audioUrl} style={{ width: '100%' }} /> : <div className="empty">Selecciona un audio para escuchar.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Waveform</h2><div className="timeline-label">Canvas real</div></div>
            <canvas ref={canvasRef} width={1200} height={260} style={{ width: '100%', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)' }} />
          </div>
        </section>
      </main>
    </div>
  )
}
