'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import {
  applyRolePreset,
  createDefaultClipRole,
  getClipRoleEntry,
  readClipRoles,
  upsertClipRole,
  writeClipRoles,
  type ClipRole,
  type ClipRoleEntry,
} from '@/lib/local-clip-roles'

const ROLE_OPTIONS: Array<{ value: ClipRole; label: string; help: string }> = [
  { value: 'hook', label: 'Hook', help: 'Abrir fuerte y captar atención.' },
  { value: 'setup', label: 'Setup', help: 'Contexto o preparación de la idea.' },
  { value: 'problem', label: 'Problema', help: 'Dolor, fricción o conflicto.' },
  { value: 'solution', label: 'Solución', help: 'Respuesta, paso o mejora.' },
  { value: 'proof', label: 'Prueba', help: 'Ejemplo, evidencia o demostración.' },
  { value: 'cta', label: 'CTA', help: 'Cierre y llamada a la acción.' },
  { value: 'b-roll', label: 'B-roll', help: 'Apoyo visual o respiración.' },
]

export default function StudioRolesPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    const nextProjects = readLocalProjects()
    setProjects(nextProjects)
    setActiveProjectId(nextProjects[0]?.id ?? null)
    setRoles(readClipRoles())
  }, [])

  const activeProject = useMemo(() => projects.find((item) => item.id === activeProjectId) ?? null, [projects, activeProjectId])

  function persistRoles(nextRoles: ClipRoleEntry[], nextStatus: string) {
    setRoles(nextRoles)
    writeClipRoles(nextRoles)
    setStatus(nextStatus)
  }

  function updateClipRole(clipId: string, patch: Partial<ClipRoleEntry>, nextStatus: string) {
    if (!activeProject) return
    const current = getClipRoleEntry(roles, activeProject.id, clipId) ?? createDefaultClipRole(activeProject.id, clipId)
    const nextEntry = { ...current, ...patch }
    persistRoles(upsertClipRole(roles, nextEntry), nextStatus)
  }

  function applyPreset(preset: 'hook-body-cta' | 'problem-solution-cta' | 'hook-proof-cta') {
    if (!activeProject) return
    const clipIds = activeProject.clips.map((clip) => clip.id)
    const presetEntries = applyRolePreset(activeProject.id, clipIds, preset)
    const filtered = roles.filter((entry) => entry.projectId !== activeProject.id)
    persistRoles([...presetEntries, ...filtered], 'Preset narrativo aplicado al proyecto')
  }

  const projectRoles = useMemo(() => {
    if (!activeProject) return []
    return activeProject.clips.map((clip) => getClipRoleEntry(roles, activeProject.id, clip.id) ?? createDefaultClipRole(activeProject.id, clip.id))
  }, [activeProject, roles])

  const counts = useMemo(() => {
    const initial = ROLE_OPTIONS.reduce<Record<ClipRole, number>>((acc, item) => {
      acc[item.value] = 0
      return acc
    }, {
      hook: 0,
      setup: 0,
      problem: 0,
      solution: 0,
      proof: 0,
      cta: 0,
      'b-roll': 0,
    })

    projectRoles.forEach((entry) => {
      initial[entry.role] += 1
    })

    return initial
  }, [projectRoles])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Roles</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/storyboard" className="nav-link">Storyboard</Link>
          <Link href="/studio/script" className="nav-link">Script</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Roles narrativos del proyecto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Marca qué función cumple cada clip.</h1>
            <p className="sub">
              Esta pantalla te ayuda a estructurar mejor el storytelling del proyecto, asignando a cada clip un rol narrativo y notas de intención antes de la edición fina.
            </p>
            <div className="action-row">
              <Link href="/studio/storyboard" className="btn btn-primary">Abrir storyboard</Link>
              <Link href="/studio/script" className="btn">Abrir script</Link>
              <Link href="/studio" className="btn">Abrir estudio</Link>
            </div>
            <div className="timeline-label">{status || 'Selecciona un proyecto y organiza su narrativa clip por clip.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyecto y presets</h2>
                <div className="timeline-label">Base narrativa</div>
              </div>
              <div className="form">
                <select className="input" value={activeProjectId ?? ''} onChange={(event) => setActiveProjectId(event.target.value)}>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>{project.name} · {project.format}</option>
                  ))}
                </select>
                <div className="action-row">
                  <button className="btn btn-primary" onClick={() => applyPreset('hook-body-cta')} disabled={!activeProject}>Hook · Body · CTA</button>
                  <button className="btn" onClick={() => applyPreset('problem-solution-cta')} disabled={!activeProject}>Problema · Solución · CTA</button>
                  <button className="btn" onClick={() => applyPreset('hook-proof-cta')} disabled={!activeProject}>Hook · Prueba · CTA</button>
                </div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Reparto de roles</h2>
                <div className="timeline-label">Resumen del proyecto</div>
              </div>
              <div className="cards">
                {ROLE_OPTIONS.map((item) => (
                  <article key={item.value} className="panel card">
                    <h3>{item.label}</h3>
                    <p><strong>{counts[item.value]}</strong></p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="panel timeline">
            <div className="row-head">
              <h2 className="section-title">Clips y función narrativa</h2>
              <div className="timeline-label">{activeProject?.clips.length ?? 0} clip(s)</div>
            </div>
            <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
              {activeProject?.clips.length ? activeProject.clips.map((clip) => {
                const entry = getClipRoleEntry(roles, activeProject.id, clip.id) ?? createDefaultClipRole(activeProject.id, clip.id)
                const selectedRole = ROLE_OPTIONS.find((item) => item.value === entry.role) ?? ROLE_OPTIONS[0]
                return (
                  <article key={clip.id} className="panel card">
                    <div className="row-head">
                      <h3>{clip.title}</h3>
                      <div className="timeline-label">{clip.start.toFixed(1)}s → {clip.end.toFixed(1)}s</div>
                    </div>
                    <div className="form">
                      <select className="input" value={entry.role} onChange={(event) => updateClipRole(clip.id, { role: event.target.value as ClipRole }, `Rol actualizado en ${clip.title}`)}>
                        {ROLE_OPTIONS.map((item) => (
                          <option key={item.value} value={item.value}>{item.label}</option>
                        ))}
                      </select>
                      <div className="timeline-label">{selectedRole.help}</div>
                      <textarea className="textarea" rows={3} value={entry.note} onChange={(event) => updateClipRole(clip.id, { note: event.target.value }, `Nota narrativa actualizada en ${clip.title}`)} placeholder="Nota narrativa o intención del clip" />
                    </div>
                  </article>
                )
              }) : <div className="empty">No hay clips para clasificar.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
