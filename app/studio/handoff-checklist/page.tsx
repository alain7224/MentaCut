'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { readTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'
import { evaluateFinalPass } from '@/lib/final-pass'
import { buildHandoffChecklist, exportHandoffChecklistTxt } from '@/lib/handoff-checklist'

export default function StudioHandoffChecklistPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [transitions, setTransitions] = useState<ClipTransitionPlan[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const next = readLocalProjects()
    setProjects(next)
    setActiveProjectId(next[0]?.id ?? null)
    setRoles(readClipRoles())
    setTransitions(readTransitionPlans())
    setAudioMixes(readProjectAudioMixes())
    void listLocalMedia().then(setLibrary).catch(() => setLibrary([]))
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const projectRoles = useMemo(() => roles.filter((item) => item.projectId === activeProjectId), [roles, activeProjectId])
  const projectTransitions = useMemo(() => transitions.filter((item) => item.projectId === activeProjectId), [transitions, activeProjectId])
  const activeAudioMix = useMemo(() => audioMixes.find((item) => item.projectId === activeProjectId) ?? null, [audioMixes, activeProjectId])
  const finalPass = useMemo(() => activeProject ? evaluateFinalPass({ project: activeProject, mediaLibrary: library, roles: projectRoles, transitions: projectTransitions, audioMix: activeAudioMix }) : null, [activeProject, library, projectRoles, projectTransitions, activeAudioMix])
  const items = useMemo(() => finalPass ? buildHandoffChecklist(finalPass) : [], [finalPass])

  function exportTxt() {
    if (!activeProject || !items.length) return
    const blob = new Blob([exportHandoffChecklistTxt(activeProject.name, items)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-handoff-checklist.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Checklist exportada en TXT')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Handoff Checklist</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/final-pass" className="nav-link">Final pass</Link>
          <Link href="/studio/delivery-pack" className="nav-link">Delivery pack</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Checklist de entrega</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Convierte el pase final en tareas claras.</h1>
            <p className="sub">Esta zona traduce el final pass a una checklist corta para handoff o revisión final, y la puede exportar en TXT.</p>
            <div className="action-row">
              <Link href="/studio/final-pass" className="btn btn-primary">Abrir final pass</Link>
              <Link href="/studio/delivery-pack" className="btn">Abrir delivery pack</Link>
              <button className="btn" onClick={exportTxt} disabled={!items.length}>Exportar TXT</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y revisa su checklist de handoff.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto activo</h2><div className="timeline-label">Checklist</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Items</h2><div className="timeline-label">{items.length} punto(s)</div></div>
            <div className="project-list">
              {items.length === 0 ? <div className="empty">No hay checklist disponible para este proyecto.</div> : null}
              {items.map((item, index) => (
                <div key={index} className="project-item">
                  <strong>{item.state === 'done' ? 'Hecho' : 'Revisar'} · {item.label}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
