'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { createProject, readLocalProjects, writeLocalProjects, type ProjectFormat } from '@/lib/local-store'
import { readLocalPreferences } from '@/lib/local-preferences'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'

const FORMATS: ProjectFormat[] = ['9:16', '1:1', '4:5', '16:9']

export default function NewProjectWizardPage() {
  const [name, setName] = useState('Proyecto MentaCut')
  const [format, setFormat] = useState<ProjectFormat>('9:16')
  const [templateId, setTemplateId] = useState(TEMPLATE_PRESETS[0]?.id ?? '')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const preferences = readLocalPreferences()
    setFormat(preferences.defaultProjectFormat)
  }, [])

  const selectedTemplate = useMemo(
    () => TEMPLATE_PRESETS.find((item) => item.id === templateId) ?? TEMPLATE_PRESETS[0],
    [templateId],
  )

  function handleCreate() {
    const project = createProject(name.trim() || 'Proyecto MentaCut', format)
    const next = {
      ...project,
      clips: project.clips.map((clip, index) => ({
        ...clip,
        templateId: selectedTemplate?.id ?? clip.templateId,
        headlineText: index === 0 ? (selectedTemplate?.headline ?? clip.headlineText) : clip.headlineText,
        captionText: selectedTemplate?.caption ?? clip.captionText,
      })),
    }

    const existing = readLocalProjects()
    writeLocalProjects([next, ...existing])
    setStatus(`Proyecto creado: ${next.name}`)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Nuevo Proyecto</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/settings" className="nav-link">Ajustes</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Asistente de creación</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Crea un proyecto con base visual.</h1>
            <p className="sub">
              Elige nombre, formato y una plantilla inicial para arrancar con una estructura más útil desde el minuto uno.
            </p>
            <div className="timeline-label">{status || 'El formato inicial respeta la preferencia local guardada.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Configurar base</h2>
                <div className="timeline-label">Proyecto inicial</div>
              </div>
              <div className="form">
                <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre del proyecto" />
                <select className="input" value={format} onChange={(event) => setFormat(event.target.value as ProjectFormat)}>
                  {FORMATS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
                <select className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
                  {TEMPLATE_PRESETS.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} · {item.category}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={handleCreate}>Crear proyecto</button>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview base</h2>
                <div className="timeline-label">{selectedTemplate?.category ?? 'Sin categoría'}</div>
              </div>
              {selectedTemplate ? (
                <article className="template-card active">
                  <div className="template-preview" style={{ background: selectedTemplate.previewGradient }}>
                    <div className="template-badge" style={{ borderColor: selectedTemplate.accent }}>{selectedTemplate.badge}</div>
                    <div className="template-copy-top">{selectedTemplate.headline}</div>
                    <div className="template-copy-bottom">{selectedTemplate.caption}</div>
                  </div>
                  <strong>{selectedTemplate.name}</strong>
                  <div className="timeline-label">{selectedTemplate.category}</div>
                </article>
              ) : <div className="empty">No hay plantilla seleccionada.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
