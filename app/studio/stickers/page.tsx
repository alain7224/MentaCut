'use client'

import Link from 'next/link'
import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile } from '@/lib/local-media'
import { createStickerLayer, readStickerLayers, removeStickerLayer, upsertStickerLayer, writeStickerLayers, type StickerLayerEntry, type StickerPreset } from '@/lib/local-sticker-layers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

const PRESETS: StickerPreset[] = ['🔥', '⭐', '✅', '⚡', '💥', '🎯', '❤️', '🚀']

export default function StudioStickersPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [layers, setLayers] = useState<StickerLayerEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState('')
  const [dragging, setDragging] = useState(false)
  const [status, setStatus] = useState('')
  const frameRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setLayers(readStickerLayers())
    setActiveProjectId(next[0]?.id ?? null)
    setActiveClipId(next[0]?.clips[0]?.id ?? null)
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeClip = useMemo(() => activeProject?.clips.find((clip) => clip.id === activeClipId) ?? null, [activeProject, activeClipId])
  const clipLayers = useMemo(() => layers.filter((item) => item.projectId === activeProjectId && item.clipId === activeClipId), [layers, activeProjectId, activeClipId])
  const selectedLayer = useMemo(() => clipLayers.find((item) => item.id === selectedLayerId) ?? clipLayers[0] ?? null, [clipLayers, selectedLayerId])

  useEffect(() => {
    if (!activeProject) {
      setActiveClipId(null)
      return
    }
    const exists = activeProject.clips.some((clip) => clip.id === activeClipId)
    if (!exists) setActiveClipId(activeProject.clips[0]?.id ?? null)
  }, [activeProject, activeClipId])

  useEffect(() => {
    if (selectedLayerId && clipLayers.some((item) => item.id === selectedLayerId)) return
    setSelectedLayerId(clipLayers[0]?.id ?? null)
  }, [clipLayers, selectedLayerId])

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

  function persist(nextLayers: StickerLayerEntry[], nextStatus: string) {
    setLayers(nextLayers)
    writeStickerLayers(nextLayers)
    setStatus(nextStatus)
  }

  function addLayer(preset: StickerPreset) {
    if (!activeProjectId || !activeClipId) return
    const layer = createStickerLayer(activeProjectId, activeClipId, preset)
    persist([layer, ...layers], 'Sticker añadido')
    setSelectedLayerId(layer.id)
  }

  function updateLayer(layer: StickerLayerEntry, patch: Partial<StickerLayerEntry>, nextStatus: string) {
    persist(upsertStickerLayer(layers, { ...layer, ...patch }), nextStatus)
  }

  function deleteLayer(layerId: string) {
    persist(removeStickerLayer(layers, layerId), 'Sticker eliminado')
    if (selectedLayerId === layerId) setSelectedLayerId(null)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || !frameRef.current || !selectedLayer) return
    const rect = frameRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    updateLayer(selectedLayer, { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }, 'Posición del sticker actualizada')
  }

  const isVideo = mediaType.startsWith('video/')

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Stickers</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio/text-layers" className="nav-link">Text layers</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Stickers y overlays reales</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Inserta, mueve, escala y rota stickers.</h1>
            <p className="sub">Esta zona añade stickers por clip con posición, escala y rotación sobre el preview real del medio.</p>
            <div className="action-row">
              <Link href="/studio/player" className="btn btn-primary">Abrir player</Link>
              <Link href="/studio/text-layers" className="btn">Abrir text layers</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un clip y añade stickers.'}</div>
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
              <div className="preset-chip-wrap">
                {PRESETS.map((preset) => <button key={preset} className="preset-chip" onClick={() => addLayer(preset)}>{preset}</button>)}
              </div>
              <div className="project-list">
                {clipLayers.length === 0 ? <div className="empty">Este clip todavía no tiene stickers.</div> : null}
                {clipLayers.map((layer, index) => (
                  <div key={layer.id} className="project-item" style={{ outline: selectedLayerId === layer.id ? '1px solid rgba(255,255,255,.22)' : 'none' }}>
                    <strong>Sticker {index + 1} · {layer.preset}</strong>
                    <div className="action-row">
                      <button className="btn btn-primary" onClick={() => setSelectedLayerId(layer.id)}>Editar</button>
                      <button className="btn" onClick={() => deleteLayer(layer.id)}>Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Controles</h2><div className="timeline-label">Sticker seleccionado</div></div>
              {selectedLayer ? (
                <div className="form">
                  <select className="input" value={selectedLayer.preset} onChange={(event) => updateLayer(selectedLayer, { preset: event.target.value as StickerPreset }, 'Sticker actualizado')}>
                    {PRESETS.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
                  </select>
                  <label className="form">
                    <span className="timeline-label">Scale: {selectedLayer.scale.toFixed(2)}</span>
                    <input className="input" type="range" min="0.4" max="3" step="0.05" value={selectedLayer.scale} onChange={(event) => updateLayer(selectedLayer, { scale: Number(event.target.value) }, 'Scale actualizada')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Rotación: {selectedLayer.rotation.toFixed(0)}°</span>
                    <input className="input" type="range" min="-180" max="180" step="1" value={selectedLayer.rotation} onChange={(event) => updateLayer(selectedLayer, { rotation: Number(event.target.value) }, 'Rotación actualizada')} />
                  </label>
                </div>
              ) : <div className="empty">Selecciona o crea un sticker.</div>}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Preview interactivo</h2><div className="timeline-label">Arrastra el sticker</div></div>
            {activeClip ? (
              <div className="panel" style={{ minHeight: 520, display: 'grid', placeItems: 'center' }}>
                <div
                  ref={frameRef}
                  onPointerDown={() => setDragging(true)}
                  onPointerUp={() => setDragging(false)}
                  onPointerLeave={() => setDragging(false)}
                  onPointerMove={handlePointerMove}
                  style={{ position: 'relative', width: '68%', aspectRatio: '9 / 16', borderRadius: 24, overflow: 'hidden', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', touchAction: 'none', cursor: dragging ? 'grabbing' : 'grab' }}
                >
                  {mediaUrl ? (
                    isVideo ? <video src={mediaUrl} autoPlay muted loop playsInline style={{ position: 'absolute', width: `${activeClip.frameScale * 100}%`, height: `${activeClip.frameScale * 100}%`, left: `${activeClip.frameX}%`, top: `${activeClip.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} /> : <img src={mediaUrl} alt={activeClip.title} style={{ position: 'absolute', width: `${activeClip.frameScale * 100}%`, height: `${activeClip.frameScale * 100}%`, left: `${activeClip.frameX}%`, top: `${activeClip.frameY}%`, transform: 'translate(-50%, -50%)', objectFit: 'cover' }} />
                  ) : null}
                  {clipLayers.map((layer) => (
                    <div
                      key={layer.id}
                      style={{ position: 'absolute', left: `${layer.x}%`, top: `${layer.y}%`, transform: `translate(-50%, -50%) scale(${layer.scale}) rotate(${layer.rotation}deg)`, fontSize: 48, lineHeight: 1, filter: 'drop-shadow(0 6px 12px rgba(0,0,0,.35))', outline: selectedLayerId === layer.id ? '1px solid rgba(255,255,255,.3)' : 'none' }}
                      onClick={() => setSelectedLayerId(layer.id)}
                    >
                      {layer.preset}
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="empty">No hay preview disponible.</div>}
          </div>
        </section>
      </main>
    </div>
  )
}
