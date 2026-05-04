'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readProjectBeatMaps, type ProjectBeatMap } from '@/lib/local-beatmap'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readStickerLayers, type StickerLayerEntry } from '@/lib/local-sticker-layers'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTextLayers, type TextLayerEntry } from '@/lib/local-text-layers'
import { readTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'
import { buildDeliveryPack } from '@/lib/delivery-pack'

export default function StudioDeliveryPackPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [textLayers, setTextLayers] = useState<TextLayerEntry[]>([])
  const [stickerLayers, setStickerLayers] = useState<StickerLayerEntry[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [beatMaps, setBeatMaps] = useState<ProjectBeatMap[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [transitions, setTransitions] = useState<ClipTransitionPlan[]>([])
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
    setRoles(readClipRoles())
    setTransitions(readTransitionPlans())
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const activeBeatMap = useMemo(() => beatMaps.find((item) => item.projectId === activeProjectId) ?? null, [beatMaps, activeProjectId])
  const projectRoles = useMemo(() => roles.filter((item) => item.projectId === activeProjectId), [roles, activeProjectId])
  const projectTransitions = useMemo(() => transitions.filter((item) => item.projectId === activeProjectId), [transitions, activeProjectId])

  const pack = useMemo(() => activeProject ? buildDeliveryPack({
    project: activeProject,
    mediaLibrary: library,
    textLayers,
    stickerLayers,
    audioMix: activeAudioMix,
    beatMap: activeBeatMap,
    roles: projectRoles,
    transitions: projectTransitions,
  }) : null, [activeProject, library, textLayers, stickerLayers, activeAudioMix, activeBeatMap, projectRoles, projectTransitions])

  function exportPack() {
    if (!pack) return
    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${pack.projectName.replace(/\s+/g, '-').toLowerCase()}-delivery-pack.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Delivery pack exportado')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Delivery Pack</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/final-pass" className="nav-link">Final pass</Link>
          <Link href="/studio/pipeline-manifest" className="nav-link">Pipeline manifest</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Delivery pack</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Empaqueta salida, chequeo y pipeline.</h1>
            <p className="sub">Esta zona junta el pase final, la receta de render y el manifest del pipeline en un único JSON de entrega técnica.</p>
            <div className="action-row">
              <Link href="/studio/final-pass" className="btn btn-primary">Abrir final pass</Link>
              <Link href="/studio/pipeline-manifest" className="btn">Abrir pipeline manifest</Link>
              <button className="btn" onClick={exportPack} disabled={!pack}>Exportar delivery pack</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y exporta su pack técnico.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Pack</div></div>
              <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
              </select>
              {pack ? <div className="cards">
                <article className="panel card"><h3>Pass</h3><p><strong>{pack.finalPass.passed ? 'OK' : 'Bloqueado'}</strong></p></article>
                <article className="panel card"><h3>Assets</h3><p><strong>{pack.manifest.assets.length}</strong></p></article>
                <article className="panel card"><h3>Clips</h3><p><strong>{pack.recipe.clips}</strong></p></article>
              </div> : <div className="empty">No hay proyecto seleccionado.</div>}
            </div>
            <div className="panel timeline">
              <div className="row-head"><h2 className="section-title">Preview JSON</h2><div className="timeline-label">Salida</div></div>
              <textarea className="textarea" rows={18} readOnly value={pack ? JSON.stringify(pack, null, 2) : ''} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
