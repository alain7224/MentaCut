'use client'

import Link from 'next/link'
import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react'
import { getLocalMediaFile } from '@/lib/local-media'
import { createTextLayer, readTextLayers, removeTextLayer, upsertTextLayer, writeTextLayers, type TextLayerEntry } from '@/lib/local-text-layers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioTextLayersPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [layers, setLayers] = useState<TextLayerEntry[]>([])
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
    setLayers(readTextLayers())
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

  function persist(nextLayers: TextLayerEntry[], nextStatus: string) {
    setLayers(nextLayers)
    writeTextLayers(nextLayers)
    setStatus(nextStatus)
  }

  function addLayer() {
    if (!activeProjectId || !activeClipId) return
    const layer = createTextLayer(activeProjectId, activeClipId)
    persist([layer, ...layers], 'Capa de texto añadida')
    setSelectedLayerId(layer.id)
  }

  function updateLayer(layer: TextLayerEntry, patch: Partial<TextLayerEntry>, nextStatus: string) {
    persist(upsertTextLayer(layers, { ...layer, ...patch }), nextStatus)
  }

  function deleteLayer(layerId: string) {
    persist(removeTextLayer(layers, layerId), 'Capa de texto eliminada')
    if (selectedLayerId === layerId) setSelectedLayerId(null)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragging || !frameRef.current || !selectedLayer) return
    const rect = frameRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))
    updateLayer(selectedLayer, { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }, 'Posición de texto actualizada')
  }

  const isVideo = mediaType.startsWith('video/')

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Text Layers</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/player" className="nav-link">Player</Link>
          <Link href="/studio/direct-framing" className="nav-link">Direct framing</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Capas de texto por clip</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Edita texto sobre el preview real.</h1>
            <p className="sub">Esta zona añade capas de texto al clip, con posición, tamaño, color, fondo y animación de entrada/salida.</p>
            <div className="action-row">
              <Link href="/studio/player" className="btn btn-primary">Abrir player</Link>
              <Link href="/studio/direct-framing" className="btn">Abrir direct framing</Link>
              <button className="btn" onClick={addLayer} disabled={!activeClip}>Añadir texto</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un clip y añade capas de texto.'}</div>
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
              <div className="project-list">
                {clipLayers.length === 0 ? <div className="empty">Este clip todavía no tiene capas de texto.</div> : null}
                {clipLayers.map((layer, index) => (
                  <div key={layer.id} className="project-item" style={{ outline: selectedLayerId === layer.id ? '1px solid rgba(255,255,255,.22)' : 'none' }}>
                    <strong>Capa {index + 1}</strong>
                    <div className="timeline-label">{layer.text}</div>
                    <div className="action-row">
                      <button className="btn btn-primary" onClick={() => setSelectedLayerId(layer.id)}>Editar</button>
                      <button className="btn" onClick={() => deleteLayer(layer.id)}>Borrar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Controles</h2><div className="timeline-label">Capa seleccionada</div></div>
              {selectedLayer ? (
                <div className="form">
                  <input className="input" value={selectedLayer.text} onChange={(event) => updateLayer(selectedLayer, { text: event.target.value }, 'Texto actualizado')} placeholder="Texto" />
                  <div className="editor-grid-2">
                    <input className="input" value={selectedLayer.color} onChange={(event) => updateLayer(selectedLayer, { color: event.target.value }, 'Color actualizado')} placeholder="#FFFFFF" />
                    <input className="input" value={selectedLayer.background} onChange={(event) => updateLayer(selectedLayer, { background: event.target.value }, 'Fondo actualizado')} placeholder="rgba(0,0,0,0.35)" />
                  </div>
                  <label className="form">
                    <span className="timeline-label">Font size: {selectedLayer.fontSize}px</span>
                    <input className="input" type="range" min="14" max="72" step="1" value={selectedLayer.fontSize} onChange={(event) => updateLayer(selectedLayer, { fontSize: Number(event.target.value) }, 'Tamaño actualizado')} />
                  </label>
                  <label className="form">
                    <span className="timeline-label">Scale: {selectedLayer.scale.toFixed(2)}</span>
                    <input className="input" type="range" min="0.5" max="2.5" step="0.05" value={selectedLayer.scale} onChange={(event) => updateLayer(selectedLayer, { scale: Number(event.target.value) }, 'Scale actualizado')} />
                  </label>
                  <div className="editor-grid-2">
                    <select className="input" value={selectedLayer.enter} onChange={(event) => updateLayer(selectedLayer, { enter: event.target.value as TextLayerEntry['enter'] }, 'Animación de entrada actualizada')}>
                      <option value="none">Entrada: none</option>
                      <option value="fade">Entrada: fade</option>
                      <option value="slide-up">Entrada: slide-up</option>
                      <option value="zoom">Entrada: zoom</option>
                    </select>
                    <select className="input" value={selectedLayer.exit} onChange={(event) => updateLayer(selectedLayer, { exit: event.target.value as TextLayerEntry['exit'] }, 'Animación de salida actualizada')}>
                      <option value="none">Salida: none</option>
                      <option value="fade">Salida: fade</option>
                      <option value="slide-down">Salida: slide-down</option>
                      <option value="zoom">Salida: zoom</option>
                    </select>
                  </div>
                </div>
              ) : <div className="empty">Selecciona o crea una capa.</div>}
            </div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Preview interactivo</h2><div className="timeline-label">Arrastra el texto</div></div>
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
                      style={{ position: 'absolute', left: `${layer.x}%`, top: `${layer.y}%`, transform: `translate(-50%, -50%) scale(${layer.scale})`, color: layer.color, background: layer.background, padding: '8px 12px', borderRadius: 12, fontWeight: 800, fontSize: `${layer.fontSize}px`, maxWidth: '80%', textAlign: 'center', outline: selectedLayerId === layer.id ? '1px solid rgba(255,255,255,.3)' : 'none' }}
                      onClick={() => setSelectedLayerId(layer.id)}
                    >
                      {layer.text}
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
