'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'
import { TEMPLATE_PRESETS } from '@/lib/template-presets'
import { STICKER_PRESETS, TEXT_PRESET_SUGGESTIONS } from '@/lib/overlay-presets'
import { GRAPHIC_OVERLAY_PRESETS } from '@/lib/graphic-overlay-presets'
import { readLocalPreferences, type LocalPreferences } from '@/lib/local-preferences'
import { readLocalLibraryFavorites, type LocalLibraryFavorites } from '@/lib/local-library'

const EMPTY_PREFERENCES: LocalPreferences = {
  startupRoute: '/studio/workspace',
  uiDensity: 'comfortable',
  defaultProjectFormat: '9:16',
  reducedMotion: false,
  autoplayPreview: false,
  snapTimeline: true,
  showTips: true,
}

const EMPTY_FAVORITES: LocalLibraryFavorites = {
  templateIds: [],
  stickerIds: [],
  overlayIds: [],
  textValues: [],
}

export default function StudioWorkspacePage() {
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])
  const [preferences, setPreferences] = useState<LocalPreferences>(EMPTY_PREFERENCES)
  const [favorites, setFavorites] = useState<LocalLibraryFavorites>(EMPTY_FAVORITES)

  useEffect(() => {
    setProjects(readLocalProjects())
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
    setPreferences(readLocalPreferences())
    setFavorites(readLocalLibraryFavorites())
  }, [])

  const stats = useMemo(() => {
    const clips = projects.reduce((sum, project) => sum + project.clips.length, 0)
    const video = media.filter((item) => item.kind === 'video').length
    const image = media.filter((item) => item.kind === 'image').length
    const audio = media.filter((item) => item.kind === 'audio').length
    const favoriteCount = favorites.templateIds.length + favorites.stickerIds.length + favorites.overlayIds.length + favorites.textValues.length
    return {
      projects: projects.length,
      clips,
      media: media.length,
      video,
      image,
      audio,
      templates: TEMPLATE_PRESETS.length,
      stickers: STICKER_PRESETS.length,
      overlays: GRAPHIC_OVERLAY_PRESETS.length,
      texts: TEXT_PRESET_SUGGESTIONS.length,
      favoriteCount,
    }
  }, [projects, media, favorites])

  const recentProjects = useMemo(() => [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5), [projects])
  const recentMedia = useMemo(() => [...media].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), [media])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Workspace</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/open" className="nav-link">Abrir según ajuste</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/new" className="nav-link">Nuevo</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/library" className="nav-link">Biblioteca</Link>
          <Link href="/studio/settings" className="nav-link">Ajustes</Link>
          <Link href="/studio/backup" className="nav-link">Backup</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Resumen local del producto</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Todo tu workspace en un vistazo.</h1>
            <p className="sub">
              Esta zona resume el estado local de MentaCut para que no tengas que entrar a cada pantalla a ciegas.
              Sirve como hub rápido entre proyectos, media, biblioteca y backup.
            </p>
            <div className="action-row">
              <Link href="/studio/open" className="btn btn-primary">Abrir según ajuste</Link>
              <Link href="/studio/new" className="btn">Nuevo proyecto</Link>
              <Link href="/studio/settings" className="btn">Abrir ajustes</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
              <Link href="/studio/media" className="btn">Abrir media</Link>
              <Link href="/studio/library" className="btn">Abrir biblioteca</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Proyectos</h3><p><strong>{stats.projects}</strong> guardados</p></article>
            <article className="panel card"><h3>Clips</h3><p><strong>{stats.clips}</strong> en total</p></article>
            <article className="panel card"><h3>Media local</h3><p><strong>{stats.media}</strong> archivos</p></article>
            <article className="panel card"><h3>Favoritos</h3><p><strong>{stats.favoriteCount}</strong> guardados</p></article>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Estado del contenido</h2>
                <div className="timeline-label">Base usable del estudio</div>
              </div>
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <article className="panel card"><h3>Vídeo</h3><p><strong>{stats.video}</strong> elementos</p></article>
                <article className="panel card"><h3>Imagen</h3><p><strong>{stats.image}</strong> elementos</p></article>
                <article className="panel card"><h3>Audio</h3><p><strong>{stats.audio}</strong> elementos</p></article>
                <article className="panel card"><h3>Stickers</h3><p><strong>{stats.stickers}</strong> presets</p></article>
                <article className="panel card"><h3>Overlays</h3><p><strong>{stats.overlays}</strong> presets</p></article>
                <article className="panel card"><h3>Textos</h3><p><strong>{stats.texts}</strong> sugerencias</p></article>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Accesos rápidos</h2>
                <div className="timeline-label">Flujo de trabajo</div>
              </div>
              <div className="project-list">
                <Link href="/studio/open" className="project-item"><strong>Arranque inteligente</strong><div className="timeline-label">Abre tu ruta favorita según ajustes locales</div></Link>
                <Link href="/studio/new" className="project-item"><strong>Nuevo proyecto</strong><div className="timeline-label">Crea un proyecto desde una base visual</div></Link>
                <Link href="/studio/projects" className="project-item"><strong>Gestionar proyectos</strong><div className="timeline-label">Crear, duplicar, renombrar y borrar</div></Link>
                <Link href="/studio/media" className="project-item"><strong>Gestionar media</strong><div className="timeline-label">Subir, filtrar, previsualizar y borrar</div></Link>
                <Link href="/studio/library" className="project-item"><strong>Explorar biblioteca</strong><div className="timeline-label">Plantillas, textos, stickers y overlays</div></Link>
                <Link href="/studio/settings" className="project-item"><strong>Ajustes locales</strong><div className="timeline-label">Configura ruta de inicio, formato y comportamiento</div></Link>
                <Link href="/studio/backup" className="project-item"><strong>Backup local</strong><div className="timeline-label">Exportar e importar el estado local</div></Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preferencias activas</h2>
                <div className="timeline-label">Leídas desde tu navegador</div>
              </div>
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <article className="panel card"><h3>Ruta inicial</h3><p>{preferences.startupRoute}</p></article>
                <article className="panel card"><h3>Formato por defecto</h3><p>{preferences.defaultProjectFormat}</p></article>
                <article className="panel card"><h3>Densidad UI</h3><p>{preferences.uiDensity}</p></article>
                <article className="panel card"><h3>Reducir movimiento</h3><p>{preferences.reducedMotion ? 'Sí' : 'No'}</p></article>
                <article className="panel card"><h3>Autoplay preview</h3><p>{preferences.autoplayPreview ? 'Sí' : 'No'}</p></article>
                <article className="panel card"><h3>Snap timeline</h3><p>{preferences.snapTimeline ? 'Sí' : 'No'}</p></article>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Favoritos guardados</h2>
                <div className="timeline-label">Biblioteca personal</div>
              </div>
              <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                <article className="panel card"><h3>Plantillas</h3><p><strong>{favorites.templateIds.length}</strong> favoritas</p></article>
                <article className="panel card"><h3>Stickers</h3><p><strong>{favorites.stickerIds.length}</strong> favoritos</p></article>
                <article className="panel card"><h3>Overlays</h3><p><strong>{favorites.overlayIds.length}</strong> favoritos</p></article>
                <article className="panel card"><h3>Textos</h3><p><strong>{favorites.textValues.length}</strong> favoritos</p></article>
              </div>
              <div className="action-row" style={{ marginTop: 12 }}>
                <Link href="/studio/library" className="btn btn-primary">Abrir biblioteca</Link>
                <Link href="/studio/settings" className="btn">Abrir ajustes</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Proyectos recientes</h2>
                <div className="timeline-label">Hasta 5 elementos</div>
              </div>
              <div className="project-list">
                {recentProjects.length === 0 ? <div className="empty">No hay proyectos locales todavía.</div> : null}
                {recentProjects.map((project) => (
                  <div key={project.id} className="project-item">
                    <strong>{project.name}</strong>
                    <div className="timeline-label">{project.format} · {project.clips.length} clips · {new Date(project.updatedAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Media reciente</h2>
                <div className="timeline-label">Hasta 5 elementos</div>
              </div>
              <div className="project-list">
                {recentMedia.length === 0 ? <div className="empty">No hay media local todavía.</div> : null}
                {recentMedia.map((item) => (
                  <div key={item.id} className="project-item">
                    <strong>{item.name}</strong>
                    <div className="timeline-label">{item.kind} · {item.duration ? `${item.duration.toFixed(1)}s` : `${Math.round(item.size / 1024)} KB`} · {new Date(item.createdAt).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
