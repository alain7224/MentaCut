'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readProjectAudioMixes, writeProjectAudioMixes, type ProjectAudioMix } from '@/lib/local-audio-mix'
import { readClipRoles, writeClipRoles, type ClipRoleEntry } from '@/lib/local-clip-roles'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'
import { parsePublishBundle, normalizeImportedPublishBundle } from '@/lib/publish-bundle-import'
import { readProjectSubtitleStyles, writeProjectSubtitleStyles, type ProjectSubtitleStyle } from '@/lib/local-subtitle-style'
import { readTransitionPlans, writeTransitionPlans, type ClipTransitionPlan } from '@/lib/local-transitions'

export default function StudioImportBundlePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [roles, setRoles] = useState<ClipRoleEntry[]>([])
  const [transitions, setTransitions] = useState<ClipTransitionPlan[]>([])
  const [audioMixes, setAudioMixes] = useState<ProjectAudioMix[]>([])
  const [subtitleStyles, setSubtitleStyles] = useState<ProjectSubtitleStyle[]>([])
  const [bundlePreview, setBundlePreview] = useState<ReturnType<typeof normalizeImportedPublishBundle> | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    setProjects(readLocalProjects())
    setRoles(readClipRoles())
    setTransitions(readTransitionPlans())
    setAudioMixes(readProjectAudioMixes())
    setSubtitleStyles(readProjectSubtitleStyles())
  }, [])

  const stats = useMemo(() => {
    if (!bundlePreview) return null
    const duration = bundlePreview.project.clips.reduce((sum, clip) => sum + Math.max(0, clip.end - clip.start), 0)
    return {
      clips: bundlePreview.project.clips.length,
      duration,
      roles: bundlePreview.roles.length,
      transitions: bundlePreview.transitions.length,
      audio: bundlePreview.audioMix ? 'Sí' : 'No',
      subtitleStyle: bundlePreview.subtitleStyle ? 'Sí' : 'No',
    }
  }, [bundlePreview])

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const raw = await file.text()
      const parsed = parsePublishBundle(raw)
      const normalized = normalizeImportedPublishBundle(parsed)
      setBundlePreview(normalized)
      setStatus(`Bundle leído: ${normalized.project.name}`)
    } catch (error) {
      setBundlePreview(null)
      setStatus(error instanceof Error ? error.message : 'No se pudo leer el bundle')
    } finally {
      event.target.value = ''
    }
  }

  function importBundle() {
    if (!bundlePreview) return

    const nextProjects = [bundlePreview.project, ...projects]
    const nextRoles = [...bundlePreview.roles, ...roles]
    const nextTransitions = [...bundlePreview.transitions, ...transitions]
    const nextAudioMixes = bundlePreview.audioMix ? [bundlePreview.audioMix, ...audioMixes] : audioMixes
    const nextSubtitleStyles = bundlePreview.subtitleStyle ? [bundlePreview.subtitleStyle, ...subtitleStyles] : subtitleStyles

    setProjects(nextProjects)
    setRoles(nextRoles)
    setTransitions(nextTransitions)
    setAudioMixes(nextAudioMixes)
    setSubtitleStyles(nextSubtitleStyles)

    writeLocalProjects(nextProjects)
    writeClipRoles(nextRoles)
    writeTransitionPlans(nextTransitions)
    writeProjectAudioMixes(nextAudioMixes)
    writeProjectSubtitleStyles(nextSubtitleStyles)

    setStatus(`Bundle importado: ${bundlePreview.project.name}`)
    setBundlePreview(null)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Import Bundle</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/export-bundle" className="nav-link">Export bundle</Link>
          <Link href="/studio/import" className="nav-link">Importar</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Importación de publish bundle</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Recupera un proyecto con su contexto.</h1>
            <p className="sub">
              Esta zona importa un bundle exportado desde MentaCut y restaura no solo el proyecto, sino también roles, transiciones, mezcla y estilo de subtítulos.
            </p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" accept="application/json" hidden onChange={handleFile} />
                Elegir bundle JSON
              </label>
              <button className="btn" onClick={importBundle} disabled={!bundlePreview}>Importar bundle</button>
              <Link href="/studio/export-bundle" className="btn">Abrir export bundle</Link>
            </div>
            <div className="timeline-label">{status || 'Carga un JSON exportado desde la zona de bundle.'}</div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preview del bundle</h2>
                <div className="timeline-label">Antes de importar</div>
              </div>
              {bundlePreview ? (
                <div className="project-list">
                  <div className="project-item">
                    <strong>{bundlePreview.project.name}</strong>
                    <div className="timeline-label">{bundlePreview.project.format} · {bundlePreview.project.clips.length} clips</div>
                  </div>
                </div>
              ) : <div className="empty">Todavía no hay bundle cargado.</div>}
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Resumen</h2>
                <div className="timeline-label">Bloques que entrarán</div>
              </div>
              {stats ? (
                <div className="cards">
                  <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong></p></article>
                  <article className="panel card"><h3>Duración</h3><p><strong>{stats.duration.toFixed(2)} s</strong></p></article>
                  <article className="panel card"><h3>Roles</h3><p><strong>{stats.roles}</strong></p></article>
                  <article className="panel card"><h3>Transitions</h3><p><strong>{stats.transitions}</strong></p></article>
                  <article className="panel card"><h3>Audio mix</h3><p><strong>{stats.audio}</strong></p></article>
                  <article className="panel card"><h3>Subtitle style</h3><p><strong>{stats.subtitleStyle}</strong></p></article>
                </div>
              ) : <div className="empty">Carga un bundle para ver su resumen.</div>}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
