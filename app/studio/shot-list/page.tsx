'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readClipNotes, type ClipNoteEntry } from '@/lib/local-clip-notes'
import { readClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { buildShotList, exportShotListTxt } from '@/lib/shot-list-utils'

export default function StudioShotListPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [notes, setNotes] = useState<ClipNoteEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setRoles(readClipRoles())
    setNotes(readClipNotes())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])
  const rows = useMemo(() => activeProject ? buildShotList(activeProject, roles, notes) : [], [activeProject, roles, notes])

  function exportTxt() {
    if (!activeProject) return
    const blob = new Blob([exportShotListTxt(rows, activeProject.name)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-shot-list.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Shot list exportada en TXT')
  }

  function exportJson() {
    if (!activeProject) return
    const payload = {
      app: 'MentaCut',
      kind: 'shot-list',
      exportedAt: new Date().toISOString(),
      projectId: activeProject.id,
      projectName: activeProject.name,
      rows,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${activeProject.name.replace(/\s+/g, '-').toLowerCase()}-shot-list.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setStatus('Shot list exportada en JSON')
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Shot List</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/clip-notes" className="nav-link">Clip notes</Link>
          <Link href="/studio/roles" className="nav-link">Roles</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Shot list del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Saca una lista clara de lo que hay que grabar o revisar.</h1>
            <p className="sub">Esta zona cruza clips, roles y notas para crear una shot list exportable en TXT o JSON.</p>
            <div className="action-row">
              <Link href="/studio/clip-notes" className="btn btn-primary">Abrir clip notes</Link>
              <Link href="/studio/roles" className="btn">Abrir roles</Link>
              <button className="btn" onClick={exportTxt} disabled={!activeProject}>Exportar TXT</button>
              <button className="btn" onClick={exportJson} disabled={!activeProject}>Exportar JSON</button>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y exporta su shot list.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Proyecto</h2><div className="timeline-label">Base activa</div></div>
            <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name} · {project.format}</option>)}
            </select>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Filas del shot list</h2><div className="timeline-label">{rows.length} ítem(s)</div></div>
            <div className="project-list">
              {rows.length === 0 ? <div className="empty">No hay filas para mostrar.</div> : null}
              {rows.map((row, index) => (
                <div key={row.clipId} className="project-item">
                  <strong>#{index + 1} · {row.title}</strong>
                  <div className="timeline-label">{row.start.toFixed(2)}s → {row.end.toFixed(2)}s · {row.duration.toFixed(2)}s</div>
                  <div className="timeline-label">Rol: {row.role}</div>
                  <div className="timeline-label">Shot idea: {row.shotIdea || '—'}</div>
                  <div className="timeline-label">Nota: {row.note || '—'}</div>
                  <div className="timeline-label">Reshoot: {row.reshoot ? 'Sí' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
