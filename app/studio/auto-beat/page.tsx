'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { detectBeatsFromAudioBuffer } from '@/lib/beat-detection'
import { createDefaultBeatMap, readProjectBeatMaps, upsertProjectBeatMap, writeProjectBeatMaps, type ProjectBeatMap } from '@/lib/local-beatmap'
import { getLocalMediaFile, listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioAutoBeatPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [audioLibrary, setAudioLibrary] = useState<LocalMediaRecord[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [audioId, setAudioId] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setBeatMaps(readProjectBeatMaps())
    setActiveProjectId(nextProjects[0]?.id ?? null)
    void listLocalMedia().then((items) => setAudioLibrary(items.filter((item) => item.kind === 'audio'))).catch(() => setAudioLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeBeatMap = useMemo(() => beatMaps.find((item) => item.projectId === activeProjectId) ?? null, [beatMaps, activeProjectId])

  useEffect(() => {
    if (activeBeatMap?.audioMediaId) setAudioId(activeBeatMap.audioMediaId)
  }, [activeBeatMap])

  async function runDetection() {
    if (!activeProjectId || !audioId) return
    const file = await getLocalMediaFile(audioId)
    if (!file) {
      setStatus('No se encontró el audio seleccionado')
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const context = new AudioContext()
      const decoded = await context.decodeAudioData(buffer.slice(0))
      const result = detectBeatsFromAudioBuffer(decoded.getChannelData(0), decoded.sampleRate)
      const current = activeBeatMap ?? createDefaultBeatMap(activeProjectId)
      const nextMap: ProjectBeatMap = {
        ...current,
        audioMediaId: audioId,
        bpm: result.bpm,
        markers: result.markers,
        source: 'generated',
      }
      const nextBeatMaps = upsertProjectBeatMap(beatMaps, nextMap)
      setBeatMaps(nextBeatMaps)
      writeProjectBeatMaps(nextBeatMaps)
      setStatus(`Beat detection completada: ${result.markers.length} markers · ${result.bpm} BPM`)
      await context.close()
    } catch {
      setStatus('No se pudo analizar el audio')
    }
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Auto Beat</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/beatmap" className="nav-link">Beat map</Link>
          <Link href="/studio/waveform" className="nav-link">Waveform</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Detección automática de beats</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Analiza el audio y propone markers.</h1>
            <p className="sub">Esta zona procesa el audio real del proyecto, calcula un BPM aproximado y genera markers automáticos.</p>
            <div className="action-row">
              <Link href="/studio/beatmap" className="btn btn-primary">Abrir beat map</Link>
              <Link href="/studio/waveform" className="btn">Abrir waveform</Link>
              <button className="btn" onClick={runDetection} disabled={!activeProjectId || !audioId}>Detectar beats</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona proyecto y audio para detectar markers.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto y audio</h2><div className="timeline-label">Entrada</div></div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
                </select>
                <select className="input" value={audioId} onChange={(event) => setAudioId(event.target.value)}>
                  <option value="">Selecciona audio</option>
                  {audioLibrary.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Resultado actual</h2><div className="timeline-label">Beat map</div></div>
              <div className="cards">
                <article className="panel card"><h3>BPM</h3><p><strong>{activeBeatMap?.bpm ?? '—'}</strong></p></article>
                <article className="panel card"><h3>Markers</h3><p><strong>{activeBeatMap?.markers.length ?? 0}</strong></p></article>
                <article className="panel card"><h3>Source</h3><p><strong>{activeBeatMap?.source ?? '—'}</strong></p></article>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
