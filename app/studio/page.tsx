'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createProject, readLocalProjects, touchProject, type LocalClip, type LocalProject, writeLocalProjects } from '@/lib/local-store'
import { getLocalMediaFile, listLocalMedia, removeLocalMedia, saveLocalMedia, type LocalMediaRecord } from '@/lib/local-media'

export default function StudioPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [library, setLibrary] = useState<LocalMediaRecord[]>([])
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [name, setName] = useState('Proyecto MentaCut')
  const [format, setFormat] = useState<LocalProject['format']>('9:16')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)

  useEffect(() => {
    const initialProjects = readLocalProjects()
    setProjects(initialProjects)
    setActiveId(initialProjects[0]?.id ?? null)
    void refreshLibrary()
  }, [])

  useEffect(() => {
    let revokedUrl: string | null = null
    async function loadPreview() {
      if (!selectedMediaId) {
        setPreviewUrl(null)
        return
      }
      const file = await getLocalMediaFile(selectedMediaId)
      if (!file) {
        setPreviewUrl(null)
        return
      }
      const url = URL.createObjectURL(file)
      revokedUrl = url
      setPreviewUrl(url)
    }
    void loadPreview()
    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl)
    }
  }, [selectedMediaId])

  const active = useMemo(() => projects.find((item) => item.id === activeId) ?? null, [projects, activeId])
  const selectedMedia = useMemo(() => library.find((item) => item.id === selectedMediaId) ?? null, [library, selectedMediaId])

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
    setPreviewUrl(null)
    await refreshLibrary()
  }

  function updateActiveProject(mutator: (project: LocalProject) => LocalProject) {
    if (!active) return
    const updated = projects.map((project) => {
      if (project.id !== active.id) return project
      return touchProject(mutator(project))
    })
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
      mediaId: selectedMedia.id,
    }
    updateActiveProject((project) => ({ ...project, clips: [...project.clips, nextClip] }))
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
    }
    updateActiveProject((project) => ({ ...project, clips: [...project.clips, nextClip] }))
  }

  function deleteClip(clipId: string) {
    updateActiveProject((project) => ({ ...project, clips: project.clips.filter((clip) => clip.id !== clipId) }))
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
              <button key={project.id} className={`project-item ${project.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(project.id)}>
                <strong>{project.name}</strong>
                <div className="timeline-label">{project.format} · {project.clips.length} clips</div>
              </button>
            ))}
          </div>
        </aside>

        <section className="studio-main">
          <div className="panel toolbar">
            <div>
              <div className="eyebrow">Base local-first</div>
              <h1 className="section-title">{active?.name ?? 'Sin proyecto activo'}</h1>
            </div>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" multiple accept="video/*,image/*,audio/*" hidden onChange={handleUpload} />
                Subir media local
              </label>
              <button className="btn" onClick={addClipFromSelectedMedia} disabled={!active || !selectedMedia}>Añadir clip desde media</button>
              <button className="btn" onClick={addEmptyClip} disabled={!active}>Añadir clip vacío</button>
            </div>
          </div>

          <div className="studio-grid-2">
            <div className="panel stage">
              <div className="stage-preview media-preview-box">
                {selectedMedia?.kind === 'video' && previewUrl ? <video className="media-preview" src={previewUrl} controls playsInline /> : null}
                {selectedMedia?.kind === 'image' && previewUrl ? <img className="media-preview" src={previewUrl} alt={selectedMedia.name} /> : null}
                {selectedMedia?.kind === 'audio' && previewUrl ? <audio className="audio-preview" src={previewUrl} controls /> : null}
                {!selectedMedia ? <div className="empty media-empty">Sube un vídeo, imagen o audio y quedará guardado localmente en este navegador.</div> : null}
              </div>
              <div className="kv">
                <div className="panel metric"><div className="eyebrow">Formato</div><strong>{active?.format ?? '—'}</strong></div>
                <div className="panel metric"><div className="eyebrow">Media local</div><strong>{library.length}</strong></div>
              </div>
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
            </div>
          </div>

          <div className="panel timeline">
            <h2 className="section-title">Timeline editable base</h2>
            {(active?.clips ?? []).map((clip) => (
              <div key={clip.id} className="timeline-edit-row">
                <input className="input" value={clip.title} onChange={(event) => updateClip(clip.id, { title: event.target.value })} />
                <input className="input" type="number" step="0.1" value={clip.start} onChange={(event) => updateClip(clip.id, { start: Number(event.target.value) })} />
                <input className="input" type="number" step="0.1" value={clip.end} onChange={(event) => updateClip(clip.id, { end: Number(event.target.value) })} />
                <div className="timeline-bar"><span style={{ left: `${clip.start * 4}%`, width: `${Math.max((clip.end - clip.start) * 4, 12)}%` }} /></div>
                <button className="btn" onClick={() => deleteClip(clip.id)}>Borrar</button>
              </div>
            ))}
            {!active ? <div className="empty">Crea un proyecto local para empezar.</div> : null}
          </div>
        </section>
      </main>
    </div>
  )
}
