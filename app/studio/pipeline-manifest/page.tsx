'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readProjectBeatMaps, type ProjectBeatMap } from '@/lib/local-beatmap'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { buildPipelineManifest } from '@/lib/pipeline-manifest'
import { readStickerLayers, type StickerLayerEntry } from '@/lib/local-sticker-layers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTextLayers, type TextLayerEntry } from '@/lib/local-text-layers'

export default function StudioPipelineManifestPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [textLayers, setTextLayers] = useState<TextLayerEntry[]>([])
  const [stickerLayers, setStickerLayers] = useState<StickerLayerEntry[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setTextLayers(readTextLayers())
    setStickerLayers(readStickerLayers())
    setAudioMixes(readProjectAudioMixes())
    setBeatMaps(readProjectBeatMaps())
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const activeBeatMap = useMemo(() => beatMaps.find((item) => item.projectId === activeProjectId) ?? null, [beatMaps, activeProjectId])
  const manifest = useMemo(() => activeProject ? buildPipelineManifest({ project: activeProject, mediaLibrary: library, textLayers, stickerLayers, audioMix: activeAudioMix, beatMap: activeBeatMap }) : null, [activeProject, library, textLayers, stickerLayers, activeAudioMix, activeBeatMap])

  function exportManifest() {
    if (!manifest) return
    const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${manifest.project.name.replace(/\s+/g, '-').toLowerCase()}-pipeline-manifest.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Manifest exportado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Pipeline Manifest</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/render-recipe" className="nav-link">Render recipe</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Pipeline manifest</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Prepara el handoff al worker.</h1>
            <p className="sub">Esta zona empaqueta proyecto, assets, capas, audio mix y beat map en un JSON listo para una tubería de render.</p>
            <div className="action-row">
              <Link href="/studio/render-recipe" className="btn btn-primary">Abrir render recipe</Link>
              <Link href="/studio/export-bundle" className="btn">Abrir export bundle</Link>
              <button className="btn" onClick={exportManifest} disabled={!manifest}>Exportar manifest</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y exporta su manifest.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Base del manifest</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              {manifest ? (
                <div className="cards">
                  <article className="panel card"><h3>Assets</h3><p><strong>{manifest.assets.length}</strong></p></article>
                  <article className="panel card"><h3>Text layers</h3><p><strong>{manifest.textLayers.length}</strong></p></article>
                  <article className="panel card"><h3>Stickers</h3><p><strong>{manifest.stickerLayers.length}</strong></p></article>
                </div>
              ) : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview JSON</h2><div className="timeline-label">Salida</div></div>
              <textarea className="textarea" rows={18} readOnly value={manifest ? JSON.stringify(manifest, null, 2) : ''} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
