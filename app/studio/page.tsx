'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import './studio.css'
import { createProject, touchProject, readLocalProjects, type LocalClip, type LocalProject, writeLocalProjects } from '@/lib/local-store'
import { getLocalMediaFile, listLocalMedia, removeLocalMedia, saveLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS, TEXT_PRESET_SUGGESTIONS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'
import { duplicateClip, moveItem, splitClip } from '@/lib/timeline-utils'

export default function StudioPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [libraryPreviewUrl, setLibraryPreviewUrl] = useState<string | null>(null)
  const [stageMediaUrl, setStageMediaUrl] = useState<string | null>(null)
  const [stageAudioUrl, setStageAudioUrl] = useState<string | null>(null)
  const [name, setName] = useState('Proyecto MentaCut')
  const [format, setFormat] = useState<LocalProject['format']>('9:16')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [timelineZoom, setTimelineZoom] = useState(4)
  const [playhead, setPlayhead] = useState(0)

  useEffect(() => {
    const initialProjects = readLocalProjects()
    setProjects(initialProjects)
    setActiveId(initialProjects[0]?.id ?? null)
    setSelectedClipId(initialProjects[0]?.clips[0]?.id ?? null)
    setPlayhead(initialProjects[0]?.clips[0]?.start ?? 0)
    void refreshLibrary()
  }, [])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const selectedMedia = useMemo(() => library.find((item) => item.id === selectedMediaId) ?? null, [library, selectedMediaId])
  const selectedClip = useMemo(() => active?.clips.find((clip) => clip.id === selectedClipId) ?? active?.clips[0] ?? null, [active, selectedClipId])
  const selectedTemplate = useMemo(() => TEMPLATE_PRESETS.find((item) => item.id === selectedClip?.templateId) ?? TEMPLATE_PRESETS[0], [selectedClip])
  const selectedSticker = useMemo(() => STICKER_PRESETS.find((item) => item.id === selectedClip?.stickerId) ?? null, [selectedClip])
  const selectedGraphicOverlay = useMemo(() => GRAPHIC_OVERLAY_PRESETS.find((item) => item.id === selectedClip?.graphicOverlayId) ?? null, [selectedClip])
  const selectedClipMedia = useMemo(() => library.find((item) => item.id === selectedClip?.mediaId) ?? null, [library, selectedClip])
  const timelineDuration = useMemo(() => Math.max(15, ...(active?.clips.map((clip) => clip.end) ?? [0])), [active])
  const timelinePixelsPerSecond = timelineZoom * 18
  const timelineContentWidth = Math.max(720, Math.round(timelineDuration * timelinePixelsPerSecond) + 80)
  const rulerMarks = useMemo(() => Array.from({ length: Math.ceil(timelineDuration) + 1 }, (_, index) => index), [timelineDuration])

  useEffect(() => {
    if (!active) return
    if (playhead > timelineDuration) {
      setPlayhead(timelineDuration)
    }
  }, [active, playhead, timelineDuration])

  useEffect(() => {
    let revokedUrl: string | null = null
    async function loadPreview() {
      if (!selectedMediaId) {
        setLibraryPreviewUrl(null)
        return
      }
      const file = await getLocalMediaFile(selectedMediaId)
      if (!file) {
        setLibraryPreviewUrl(null)
        return
      }
      const url = URL.createObjectURL(file)
      revokedUrl = url
      setLibraryPreviewUrl(url)
    }
    void loadPreview()
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl)
    }
  }, [selectedMediaId])

  useEffect(() => {
    let revokedMedia: string | null = null
    let revokedAudio: string | null = null
    async function loadStage() {
      if (!selectedClip?.mediaId) {
        setStageMediaUrl(null)
      } else {
        const mediaFile = await getLocalMediaFile(selectedClip.mediaId)
        if (mediaFile) {
          const url = URL.createObjectURL(mediaFile)
          revokedMedia = url
          setStageMediaUrl(url)
        } else {
          setStageMediaUrl(null)
        }
      }
      if (!selectedClip?.audioMediaId) {
        setStageAudioUrl(null)
      } else {
        const audioFile = await getLocalMediaFile(selectedClip.audioMediaId)
        if (audioFile) {
          const url = URL.createObjectURL(audioFile)
          revokedAudio = url
          setStageAudioUrl(url)
        } else {
          setStageAudioUrl(null)
        }
      }
    }
    void loadStage()
    return () => {
      if (revokedMedia) URL.revokeObjectURL(revokedMedia)
      if (revokedAudio) URL.revokeObjectURL(revokedAudio)
    }
  }, [selectedClip])

  async function refreshLibrary() {
    const items = await listLocalMedia()
    setLibrary(items)
    setSelectedMediaId((current) => current ?? items[0]?.id ?? null)
  }

  function persistProjects(updated: LocalProject[]) {
    setProjects(updated)
    writeLocalProjects(updated)
  }

  function createLocalProject() {
    const next = createProject(name.trim() || 'Proyecto MentaCut', format)
    const updated = [next, ...projects]
    persistProjects(updated)
    setActiveId(next.id)
    setSelectedClipId(next.clips[0]?.id ?? null)
    setPlayhead(next.clips[0]?.start ?? 0)
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    for (const file of files) {
      await saveLocalMedia(file)
    }
    event.target.value = ''
    await refreshLibrary()
  }

  async function deleteSelectedMedia() {
    if (!selectedMediaId) return
    await removeLocalMedia(selectedMediaId)
    setSelectedMediaId(null)
    setLibraryPreviewUrl(null)
    await refreshLibrary()
  }

  function updateActiveProject(mutator: (project: LocalProject) => LocalProject) {
    if (!active) return
    const updated = projects.map((project) => project.id !== active.id ? project : touchProject(mutator(project)))
    persistProjects(updated)
  }

  function updateClip(clipId: string, patch: Partial<LocalClip>) {
    updateActiveProject((project) => ({
      ...project,
      clips: project.clips.map((clip) => clip.id === clipId ? { ...clip, ...patch } : clip),
    }))
  }

  function addClipFromSelectedMedia() {
    if (!active || !selectedMedia) return
    const lastEnd = active.clips[active.clips.length - 1]?.end ?? 0
    const duration = selectedMedia.duration && selectedMedia.duration > 0 ? Math.min(selectedMedia.duration, 8) : 5
    const nextClip: LocalClip = {
      id: crypto.randomUUID(),
      title: selectedMedia.name.replace(/\.[^.]+$/, ''),
      start: Number(lastEnd.toFixed(2)),
      end: Number((lastEnd + duration).toFixed(2)),
      mediaId: selectedMedia.kind === 'audio' ? null : selectedMedia.id,
      audioMediaId: selectedMedia.kind === 'audio' ? selectedMedia.id : null,
      templateId: 'hook-crystal',
      frameX: 50,
      frameY: 50,
      frameScale: 1,
      headlineText: 'Gancho fuerte',
      captionText: 'Texto editable del clip',
      stickerId: null,
      graphicOverlayId: null,
    }
    updateActiveProject((project) => ({ ...project, clips: [...project.clips, nextClip] }))
    setSelectedClipId(nextClip.id)
    setPlayhead(nextClip.start)
  }

  function addEmptyClip() {
    if (!active) return
    const lastEnd = active.clips[active.clips.length - 1]?.end ?? 0
    const nextClip: LocalClip = {
      id: crypto.randomUUID(),
      title: `Clip ${active.clips.length + 1}`,
      start: Number(lastEnd.toFixed(2)),
      end: Number((lastEnd + 4).toFixed(2)),
      mediaId: null,
      audioMediaId: null,
      templateId: 'hook-crystal',
      frameX: 50,
      frameY: 50,
      frameScale: 1,
      headlineText: 'Gancho fuerte',
      captionText: 'Texto editable del clip',
      stickerId: null,
      graphicOverlayId: null,
    }
    updateActiveProject((project) => ({ ...project, clips: [...project.clips, nextClip] }))
    setSelectedClipId(nextClip.id)
    setPlayhead(nextClip.start)
  }

  function deleteClip(clipId: string) {
    if (!active) return
    const remaining = active.clips.filter((clip) => clip.id !== clipId)
    updateActiveProject((project) => ({ ...project, clips: remaining }))
    setSelectedClipId(remaining[0]?.id ?? null)
    setPlayhead(remaining[0]?.start ?? 0)
  }

  function assignSelectedMediaToClip() {
    if (!selectedClip || !selectedMedia) return
    if (selectedMedia.kind === 'audio') {
      updateClip(selectedClip.id, { audioMediaId: selectedMedia.id })
      return
    }
    updateClip(selectedClip.id, { mediaId: selectedMedia.id, title: selectedMedia.name.replace(/\.[^.]+$/, '') })
  }

  function duplicateSelectedClip() {
    if (!active || !selectedClip) return
    const index = active.clips.findIndex((clip) => clip.id === selectedClip.id)
    const copy = { ...duplicateClip(selectedClip), graphicOverlayId: selectedClip.graphicOverlayId ?? null }
    updateActiveProject((project) => ({
      ...project,
      clips: [...project.clips.slice(0, index + 1), copy, ...project.clips.slice(index + 1)],
    }))
    setSelectedClipId(copy.id)
    setPlayhead(copy.start)
  }

  function splitSelectedClip(splitTime?: number) {
    if (!active || !selectedClip) return
    const index = active.clips.findIndex((clip) => clip.id === selectedClip.id)
    const fallback = Number(((selectedClip.start + selectedClip.end) / 2).toFixed(2))
    const at = splitTime ?? fallback
    const [first, second] = splitClip(selectedClip, at)
    updateActiveProject((project) => ({
      ...project,
      clips: [...project.clips.slice(0, index), first, second, ...project.clips.slice(index + 1)],
    }))
    setSelectedClipId(first.id)
    setPlayhead(first.end)
  }

  function splitAtPlayhead() {
    if (!selectedClip) return
    const safe = Math.min(Math.max(playhead, selectedClip.start + 0.1), selectedClip.end - 0.1)
    splitSelectedClip(Number(safe.toFixed(2)))
  }

  function moveSelectedClip(direction: 'left' | 'right') {
    if (!active || !selectedClip) return
    const index = active.clips.findIndex((clip) => clip.id === selectedClip.id)
    const nextIndex = direction === 'left' ? Math.max(0, index - 1) : Math.min(active.clips.length - 1, index + 1)
    if (nextIndex === index) return
    updateActiveProject((project) => ({ ...project, clips: moveItem(project.clips, index, nextIndex) }))
  }

  function zoomWidth(clip: LocalClip) {
    return `${Math.max((clip.end - clip.start) * timelinePixelsPerSecond, 56)}px`
  }

  function zoomLeft(clip: LocalClip) {
    return `${clip.start * timelinePixelsPerSecond}px`
  }

  function startFrameDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!selectedClip || !stageMediaUrl) return
    const rect = event.currentTarget.getBoundingClientRect()
    const move = (clientX: number, clientY: number) => {
      const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100))
      updateClip(selectedClip.id, { frameX: Number(x.toFixed(1)), frameY: Number(y.toFixed(1)) })
    }
    move(event.clientX, event.clientY)
    const onMove = (nextEvent: PointerEvent) => move(nextEvent.clientX, nextEvent.clientY)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const trimMax = selectedClip ? Math.max(selectedClip.end + 5, 15) : 15
  const trimLeft = selectedClip ? `${(selectedClip.start / trimMax) * 100}%` : '0%'
  const trimWidth = selectedClip ? `${Math.max(((selectedClip.end - selectedClip.start) / trimMax) * 100, 6)}%` : '0%'
  const trimEndLeft = selectedClip ? `${(selectedClip.end / trimMax) * 100}%` : '0%'

  function startTrimHandleDrag(side: 'start' | 'end', event: React.PointerEvent<HTMLButtonElement>) {
    if (!selectedClip) return
    const bar = event.currentTarget.parentElement
    if (!bar) return
    const rect = bar.getBoundingClientRect()
    const move = (clientX: number) => {
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
      const time = Number((ratio * trimMax).toFixed(2))
      if (side === 'start') {
        updateClip(selectedClip.id, { start: Math.min(time, Number((selectedClip.end - 0.1).toFixed(2))) })
      } else {
        updateClip(selectedClip.id, { end: Math.max(time, Number((selectedClip.start + 0.1).toFixed(2))) })
      }
    }
    move(event.clientX)
    const onMove = (nextEvent: PointerEvent) => move(nextEvent.clientX)
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const playheadLeft = `${Math.min(playhead, timelineDuration) * timelinePixelsPerSecond}px`

  function setPlayheadFromPointer(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
    setPlayhead(Number((ratio * timelineDuration).toFixed(2)))
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Studio</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <button className="btn btn-primary" onClick={createLocalProject}>Crear proyecto local</button>
        </nav>
      </header>

      <main className="main studio-layout">
        <aside className="panel sidebar">
          <h2 className="section-title">Nuevo proyecto</h2>
          <div className="form">
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" />
            <select className="input" value={format} onChange={(event) => setFormat(event.target.value as LocalProject['format'])}>
              <option value="9:16">9:16</option>
              <option value="1:1">1:1</option>
              <option value="4:5">4:5</option>
              <option value="16:9">16:9</option>
            </select>
            <button className="btn btn-primary" onClick={createLocalProject}>Guardar en navegador</button>
          </div>
          <div className="project-list">
            {projects.length === 0 ? <div className="empty">Aún no hay proyectos locales.</div> : null}
            {projects.map((project) => (
              <button key={project.id} className={`project-item ${project.id === activeId ? 'active' : ''}`} onClick={() => { setActiveId(project.id); setSelectedClipId(project.clips[0]?.id ?? null); setPlayhead(project.clips[0]?.start ?? 0) }}>
                <strong>{project.name}</strong>
                <div className="timeline-label">{project.format} · {project.clips.length} clips</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="studio-main">
          <div className="panel toolbar">
            <div>
              <div className="eyebrow">Editor local-first</div>
              <h1 className="section-title">{active?.name ?? 'Sin proyecto activo'}</h1>
            </div>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" multiple accept="video/*,image/*,audio/*" hidden onChange={handleUpload} />
                Subir media local
              </label>
              <button className="btn" onClick={assignSelectedMediaToClip} disabled={!selectedClip || !selectedMedia}>Asignar al clip</button>
              <button className="btn" onClick={addClipFromSelectedMedia} disabled={!active || !selectedMedia}>Añadir clip desde media</button>
              <button className="btn" onClick={addEmptyClip} disabled={!active}>Añadir clip vacío</button>
            </div>
          </div>

          <div className="studio-grid-2">
            <div className="panel stage">
              <div className="row-head">
                <h2 className="section-title">Preview del clip</h2>
                <div className="timeline-label">{selectedTemplate?.name ?? 'Sin plantilla'}</div>
              </div>
              <div className="stage-preview stage-frame" onPointerDown={startFrameDrag}>
                {selectedClip && stageMediaUrl ? (
                  <div className="stage-media-layer" style={{ left: `${selectedClip.frameX}%`, top: `${selectedClip.frameY}%`, transform: `translate(-50%, -50%) scale(${selectedClip.frameScale})` }}>
                    {selectedClipMedia?.kind === 'image' ? <img className="media-preview" src={stageMediaUrl} alt={selectedClip.title} /> : <video className="media-preview" src={stageMediaUrl} controls playsInline />}
                  </div>
                ) : <div className="empty media-empty">Selecciona un clip y asígnale media para ver el encuadre real.</div>}
                <div className="stage-caption panel-template-badge" style={{ borderColor: selectedTemplate?.accent ?? '#59ffd3' }}>{selectedTemplate?.badge ?? 'TEMPLATE'}</div>
                {selectedClip ? <div className="headline-overlay">{selectedClip.headlineText}</div> : null}
                {selectedClip ? <div className="caption-overlay">{selectedClip.captionText}</div> : null}
                {selectedSticker ? <div className="sticker-overlay">{selectedSticker.emoji} {selectedSticker.label}</div> : null}
                {selectedGraphicOverlay ? <div className={`graphic-overlay graphic-${selectedGraphicOverlay.style}`}>{selectedGraphicOverlay.symbol}</div> : null}
              </div>
              {selectedClip?.audioMediaId && stageAudioUrl ? <audio className="audio-preview" src={stageAudioUrl} controls /> : null}
              {selectedClip ? (
                <>
                  <div className="editor-grid-2">
                    <label className="form"><span className="timeline-label">Reencuadre X</span><input className="input" type="range" min="0" max="100" value={selectedClip.frameX} onChange={(event) => updateClip(selectedClip.id, { frameX: Number(event.target.value) })} /></label>
                    <label className="form"><span className="timeline-label">Reencuadre Y</span><input className="input" type="range" min="0" max="100" value={selectedClip.frameY} onChange={(event) => updateClip(selectedClip.id, { frameY: Number(event.target.value) })} /></label>
                    <label className="form"><span className="timeline-label">Escala</span><input className="input" type="range" min="0.6" max="1.8" step="0.01" value={selectedClip.frameScale} onChange={(event) => updateClip(selectedClip.id, { frameScale: Number(event.target.value) })} /></label>
                    <label className="form"><span className="timeline-label">Audio del clip</span><div className="input input-readonly">{selectedClip.audioMediaId ? (library.find((item) => item.id === selectedClip.audioMediaId)?.name ?? 'Audio asignado') : 'Sin audio asignado'}</div></label>
                  </div>
                  <div className="trim-panel">
                    <div className="row-head"><h3 className="mini-title">Trim visual</h3><div className="timeline-label">{selectedClip.start.toFixed(1)}s → {selectedClip.end.toFixed(1)}s</div></div>
                    <div className="trim-bar interactive-trim">
                      <span style={{ left: trimLeft, width: trimWidth }} />
                      <button type="button" className="trim-handle trim-handle-start" style={{ left: trimLeft }} onPointerDown={(event) => startTrimHandleDrag('start', event)} aria-label="Mover inicio" />
                      <button type="button" className="trim-handle trim-handle-end" style={{ left: trimEndLeft }} onPointerDown={(event) => startTrimHandleDrag('end', event)} aria-label="Mover fin" />
                    </div>
                    <div className="editor-grid-2">
                      <label className="form"><span className="timeline-label">Inicio</span><input className="input" type="range" min="0" max={Math.max(selectedClip.end - 0.1, 0)} step="0.1" value={selectedClip.start} onChange={(event) => updateClip(selectedClip.id, { start: Number(event.target.value) })} /></label>
                      <label className="form"><span className="timeline-label">Fin</span><input className="input" type="range" min={selectedClip.start + 0.1} max={trimMax} step="0.1" value={selectedClip.end} onChange={(event) => updateClip(selectedClip.id, { end: Number(event.target.value) })} /></label>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="panel stage media-library-panel">
              <div className="row-head">
                <h2 className="section-title">Biblioteca local</h2>
                <button className="btn" onClick={deleteSelectedMedia} disabled={!selectedMediaId}>Borrar media</button>
              </div>
              <div className="media-list">
                {library.length === 0 ? <div className="empty">Aún no hay media local guardada.</div> : null}
                {library.map((item) => (
                  <button key={item.id} className={`project-item ${item.id === selectedMediaId ? 'active' : ''}`} onClick={() => setSelectedMediaId(item.id)}>
                    <strong>{item.name}</strong>
                    <div className="timeline-label">{item.kind} · {item.duration ? `${item.duration.toFixed(1)}s` : `${Math.round(item.size / 1024)} KB`}</div>
                  </button>
                ))}
              </div>
              <div className="stage-preview media-preview-box small-preview-box">
                {selectedMedia?.kind === 'video' && libraryPreviewUrl ? <video className="media-preview" src={libraryPreviewUrl} controls playsInline /> : null}
                {selectedMedia?.kind === 'image' && libraryPreviewUrl ? <img className="media-preview" src={libraryPreviewUrl} alt={selectedMedia.name} /> : null}
                {selectedMedia?.kind === 'audio' && libraryPreviewUrl ? <audio className="audio-preview" src={libraryPreviewUrl} controls /> : null}
              </div>
            </div>
          </div>

          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Timeline editable</h2>
              <div className="timeline-readout">Playhead: {playhead.toFixed(2)}s</div>
            </div>
            <div className="clip-command-row">
              <button className="btn" onClick={() => moveSelectedClip('left')} disabled={!selectedClip}>Mover izquierda</button>
              <button className="btn" onClick={() => moveSelectedClip('right')} disabled={!selectedClip}>Mover derecha</button>
              <button className="btn" onClick={duplicateSelectedClip} disabled={!selectedClip}>Duplicar</button>
              <button className="btn" onClick={() => splitSelectedClip()} disabled={!selectedClip}>Dividir centro</button>
              <button className="btn" onClick={splitAtPlayhead} disabled={!selectedClip}>Dividir en playhead</button>
              <button className="btn" onClick={() => setPlayhead(selectedClip?.start ?? 0)} disabled={!selectedClip}>Ir al clip</button>
              <label className="zoom-control"><span className="timeline-label">Zoom</span><input type="range" min="2" max="12" step="1" value={timelineZoom} onChange={(event) => setTimelineZoom(Number(event.target.value))} /></label>
            </div>
            <div className="timeline-board">
              <div className="timeline-ruler" style={{ width: `${timelineContentWidth}px` }} onPointerDown={setPlayheadFromPointer}>
                {rulerMarks.map((mark) => (
                  <div key={mark} className="ruler-mark" style={{ left: `${mark * timelinePixelsPerSecond}px` }}>
                    <span>{mark}s</span>
                  </div>
                ))}
                <div className="timeline-playhead" style={{ left: playheadLeft }} />
              </div>
              <div className="timeline-lane-row">
                <div className="lane-label">Vídeo</div>
                <div className="lane-track" style={{ width: `${timelineContentWidth}px` }} onPointerDown={setPlayheadFromPointer}>
                  {(active?.clips ?? []).map((clip) => (
                    <button key={clip.id} className={`lane-clip lane-clip-video ${clip.id === selectedClip?.id ? 'active' : ''}`} style={{ left: zoomLeft(clip), width: zoomWidth(clip) }} onClick={() => { setSelectedClipId(clip.id); setPlayhead(clip.start) }}>
                      {clip.title}
                    </button>
                  ))}
                  <div className="timeline-playhead lane-playhead" style={{ left: playheadLeft }} />
                </div>
              </div>
              <div className="timeline-lane-row">
                <div className="lane-label">Audio</div>
                <div className="lane-track" style={{ width: `${timelineContentWidth}px` }} onPointerDown={setPlayheadFromPointer}>
                  {(active?.clips.filter((clip) => clip.audioMediaId) ?? []).map((clip) => (
                    <button key={clip.id} className={`lane-clip lane-clip-audio ${clip.id === selectedClip?.id ? 'active' : ''}`} style={{ left: zoomLeft(clip), width: zoomWidth(clip) }} onClick={() => { setSelectedClipId(clip.id); setPlayhead(clip.start) }}>
                      Audio · {clip.title}
                    </button>
                  ))}
                  <div className="timeline-playhead lane-playhead" style={{ left: playheadLeft }} />
                </div>
              </div>
              <div className="timeline-lane-row">
                <div className="lane-label">Texto</div>
                <div className="lane-track" style={{ width: `${timelineContentWidth}px` }} onPointerDown={setPlayheadFromPointer}>
                  {(active?.clips ?? []).map((clip) => (
                    <button key={clip.id} className={`lane-clip lane-clip-text ${clip.id === selectedClip?.id ? 'active' : ''}`} style={{ left: zoomLeft(clip), width: zoomWidth(clip) }} onClick={() => { setSelectedClipId(clip.id); setPlayhead(clip.start) }}>
                      {clip.headlineText || 'Texto'}
                    </button>
                  ))}
                  <div className="timeline-playhead lane-playhead" style={{ left: playheadLeft }} />
                </div>
              </div>
            </div>
            {selectedClip ? (
              <div className="timeline-edit-row advanced-row">
                <input className="input" value={selectedClip.title} onChange={(event) => updateClip(selectedClip.id, { title: event.target.value })} />
                <input className="input" type="number" step="0.1" value={selectedClip.start} onChange={(event) => updateClip(selectedClip.id, { start: Number(event.target.value) })} />
                <input className="input" type="number" step="0.1" value={selectedClip.end} onChange={(event) => updateClip(selectedClip.id, { end: Number(event.target.value) })} />
                <button className="btn" onClick={() => deleteClip(selectedClip.id)}>Borrar clip</button>
              </div>
            ) : null}
          </div>

          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Copy editable</h2>
                <div className="timeline-label">Textos guardados por clip</div>
              </div>
              {selectedClip ? (
                <div className="form">
                  <input className="input" value={selectedClip.headlineText} onChange={(event) => updateClip(selectedClip.id, { headlineText: event.target.value })} placeholder="Headline" />
                  <textarea className="textarea" value={selectedClip.captionText} onChange={(event) => updateClip(selectedClip.id, { captionText: event.target.value })} rows={3} placeholder="Caption" />
                  <div className="preset-chip-wrap">
                    {TEXT_PRESET_SUGGESTIONS.map((text) => (
                      <button key={text} className="preset-chip" onClick={() => updateClip(selectedClip.id, { headlineText: text })}>{text}</button>
                    ))}
                  </div>
                </div>
              ) : <div className="empty">Selecciona un clip.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Stickers base</h2>
                <div className="timeline-label">Aplicables al clip activo</div>
              </div>
              <div className="sticker-grid">
                {STICKER_PRESETS.map((sticker) => (
                  <button key={sticker.id} className={`sticker-card ${selectedClip?.stickerId === sticker.id ? 'active' : ''}`} onClick={() => selectedClip ? updateClip(selectedClip.id, { stickerId: sticker.id }) : undefined}>
                    <span>{sticker.emoji}</span>
                    <strong>{sticker.label}</strong>
                  </button>
                ))}
                {selectedClip?.stickerId ? <button className="sticker-card clear-card" onClick={() => updateClip(selectedClip.id, { stickerId: null })}>Quitar sticker</button> : null}
              </div>
            </div>
          </div>

          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Overlays gráficos</h2>
              <div className="timeline-label">Aplicables al clip activo</div>
            </div>
            <div className="overlay-grid">
              {GRAPHIC_OVERLAY_PRESETS.map((overlay) => (
                <button key={overlay.id} className={`overlay-card ${selectedClip?.graphicOverlayId === overlay.id ? 'active' : ''}`} onClick={() => selectedClip ? updateClip(selectedClip.id, { graphicOverlayId: overlay.id }) : undefined}>
                  <span className={`overlay-symbol overlay-${overlay.style}`}>{overlay.symbol}</span>
                  <strong>{overlay.name}</strong>
                </button>
              ))}
              {selectedClip?.graphicOverlayId ? <button className="overlay-card clear-card" onClick={() => updateClip(selectedClip.id, { graphicOverlayId: null })}>Quitar overlay</button> : null}
            </div>
          </div>

          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Plantillas base</h2>
              <div className="timeline-label">Previews iniciales aplicables al clip activo</div>
            </div>
            <div className="template-grid">
              {TEMPLATE_PRESETS.map((template) => (
                <button key={template.id} className={`template-card ${selectedClip?.templateId === template.id ? 'active' : ''}`} onClick={() => selectedClip ? updateClip(selectedClip.id, { templateId: template.id }) : undefined}>
                  <div className="template-preview" style={{ background: template.previewGradient }}>
                    <div className="template-badge" style={{ borderColor: template.accent }}>{template.badge}</div>
                    <div className="template-copy-top">{template.headline}</div>
                    <div className="template-copy-bottom">{template.caption}</div>
                  </div>
                  <strong>{template.name}</strong>
                  <div className="timeline-label">{template.category}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
