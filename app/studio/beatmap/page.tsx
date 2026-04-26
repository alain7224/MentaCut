'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, touchProject, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import {
  createDefaultBeatMap,
  generateBeatMarkers,
  parseManualMarkers,
  readProjectBeatMaps,
  upsertProjectBeatMap,
  writeProjectBeatMaps,
  type ProjectBeatMap,
} from '@/lib/local-beatmap'

export default function StudioBeatMapPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [manualMarkersText, setManualMarkersText] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveId(nextProjects[0]?.id ?? null)
    setBeatMaps(readProjectBeatMaps())
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const audioLibrary = useMemo(() => media.filter((item) => item.kind === 'audio'), [media])

  const activeBeatMap = useMemo(() => {
    if (!active) return null
    return beatMaps.find((item) => item.projectId === active.id) ?? createDefaultBeatMap(active.id)
  }, [beatMaps, active])

  const projectDuration = useMemo(
    () => active?.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0) ?? 0,
    [active],
  )

  function persistBeatMap(nextBeatMap: ProjectBeatMap, nextStatus: string) {
    const next = upsertProjectBeatMap(beatMaps, nextBeatMap)
    setBeatMaps(next)
    writeProjectBeatMaps(next)
    setStatus(nextStatus)
  }

  function updateBeatMap(patch: Partial<ProjectBeatMap>, nextStatus: string) {
    if (!activeBeatMap) return
    persistBeatMap({ ...activeBeatMap, ...patch }, nextStatus)
  }

  function generateFromBpm() {
    if (!activeBeatMap) return
    const markers = generateBeatMarkers(projectDuration, activeBeatMap.bpm, activeBeatMap.offsetSeconds)
    const nextBeatMap = {
      ...activeBeatMap,
      markers,
      source: 'generated' as const,
    }
    persistBeatMap(nextBeatMap, `Markers generados por BPM: ${markers.length}`)
    setManualMarkersText(markers.join('\n'))
  }

  function applyManualMarkers() {
    if (!activeBeatMap) return
    const markers = parseManualMarkers(manualMarkersText)
    const nextBeatMap = {
      ...activeBeatMap,
      markers,
      source: 'manual' as const,
    }
    persistBeatMap(nextBeatMap, `Markers manuales guardados: ${markers.length}`)
  }

  function alignClipsToMarkers() {
    if (!active || !activeBeatMap || activeBeatMap.markers.length === 0) return

    const markers = [...activeBeatMap.markers].sort((a, b) => a - b)
    const updated = projects.map((project) => {
      if (project.id !== active.id) return project

      const clips = project.clips.map((clip, index) => {
        const duration = Math.max(0.5, clip.end - clip.start)
        const start = markers[index] ?? clip.start
        const end = Number((start + duration).toFixed(3))
        return {
          ...clip,
          start: Number(start.toFixed(3)),
          end,
        }
      })

      return touchProject({ ...project, clips })
    })

    setProjects(updated)
    writeLocalProjects(updated)
    setStatus('Clips alineados a markers del beat map')
  }

  const stats = useMemo(() => {
    if (!active || !activeBeatMap) return null
    return {
      clips: active.clips.length,
      markers: activeBeatMap.markers.length,
      bpm: activeBeatMap.bpm,
      duration: projectDuration,
      source: activeBeatMap.source,
    }
  }, [active, activeBeatMap, projectDuration])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Beat Map</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/audio-mix" className="nav-link">Audio mix</Link>
          <Link href="/studio/pacing" className="nav-link">Pacing</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Mapa de ritmo del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Marca pulsos y alinea clips al beat.</h1>
            <p className="sub">
              Esta pantalla te deja generar o escribir markers de ritmo y usarlos como puntos de entrada de los clips, útil para montaje musical o edición más rítmica.
            </p>
            <div className="action-row">
              <Link href="/studio/audio-mix" className="btn btn-primary">Abrir audio mix</Link>
              <Link href="/studio/pacing" className="btn">Abrir pacing</Link>
              <button className="btn" onClick={alignClipsToMarkers} disabled={!activeBeatMap || activeBeatMap.markers.length === 0}>Alinear clips a markers</button>
            </div>
            <div className="timeline-label">{status || 'Genera markers por BPM o pega markers manuales en segundos.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y parámetros</h2>
                <div className="timeline-label">Base de ritmo</div>
              </div>
              <div className="form">
                <select className="input" value={activeId ?? ''} onChange={(event) => setActiveId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <select className="input" value={activeBeatMap?.audioMediaId ?? ''} onChange={(event) => updateBeatMap({ audioMediaId: event.target.value || null }, 'Audio del beat map actualizado')}>
                  <option value="">Sin audio vinculado</option>
                  {audioLibrary.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
                <label className="form">
                  <span className="timeline-label">BPM: {activeBeatMap?.bpm ?? 120}</span>
                  <input className="input" type="range" min="40" max="220" step="1" value={activeBeatMap?.bpm ?? 120} onChange={(event) => updateBeatMap({ bpm: Number(event.target.value) }, 'BPM actualizado')} />
                </label>
                <label className="form">
                  <span className="timeline-label">Offset: {(activeBeatMap?.offsetSeconds ?? 0).toFixed(2)} s</span>
                  <input className="input" type="range" min="0" max="5" step="0.05" value={activeBeatMap?.offsetSeconds ?? 0} onChange={(event) => updateBeatMap({ offsetSeconds: Number(event.target.value) }, 'Offset actualizado')} />
                </label>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={generateFromBpm} disabled={!activeBeatMap}>Generar por BPM</button>
                  <button className="btn" onClick={applyManualMarkers} disabled={!activeBeatMap}>Guardar manuales</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Proyecto activo</div>
              </div>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Markers</h3><p><strong>{stats.markers}</strong></p></article>
                  <article className="panel card"><h3>BPM</h3><p><strong>{stats.bpm}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{stats.duration.toFixed(1)} s</strong></p></article>
                  <article className="panel card"><h3>Fuente</h3><p><strong>{stats.source === 'generated' ? 'Generado' : 'Manual'}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Markers manuales</h2>
                <div className="timeline-label">Un segundo por línea o separados por coma</div>
              </div>
              <textarea className="textarea" rows={18} value={manualMarkersText} onChange={(event) => setManualMarkersText(event.target.value)} placeholder="0\n0.5\n1.0\n1.5\n..." />
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview de markers</h2>
                <div className="timeline-label">Beat map actual</div>
              </div>
              <div className="project-list">
                {(activeBeatMap?.markers.length ?? 0) === 0 ? <div className="empty">Todavía no hay markers generados o guardados.</div> : null}
                {activeBeatMap?.markers.map((marker, index) => (
                  <div key={`${marker}-${index}`} className="project-item">
                    <strong>Beat #{index + 1}</strong>
                    <div className="timeline-label">{marker.toFixed(3)} s</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
