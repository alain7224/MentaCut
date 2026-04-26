'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { readLocalPreferences, type LocalPreferences } from '@/lib/local-preferences'
import { readLocalLibraryFavorites, type LocalLibraryFavorites } from '@/lib/local-library'
import { readLocalProjects, type LocalProject } from '@/lib/local-store'
import { listLocalMedia, type LocalMediaRecord } from '@/lib/local-media'

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

export default function StudioHelpPage() {
  const [preferences, setPreferences] = useState<LocalPreferences>(EMPTY_PREFERENCES)
  const [favorites, setFavorites] = useState<LocalLibraryFavorites>(EMPTY_FAVORITES)
  const [projects, setProjects] = useState<LocalProject[]>([])
  const [media, setMedia] = useState<LocalMediaRecord[]>([])

  useEffect(() => {
    setPreferences(readLocalPreferences())
    setFavorites(readLocalLibraryFavorites())
    setProjects(readLocalProjects())
    void listLocalMedia().then(setMedia).catch(() => setMedia([]))
  }, [])

  const status = useMemo(() => {
    const hasProjects = projects.length > 0
    const hasMedia = media.length > 0
    const hasFavorites = favorites.templateIds.length + favorites.stickerIds.length + favorites.overlayIds.length + favorites.textValues.length > 0
    return { hasProjects, hasMedia, hasFavorites }
  }, [projects, media, favorites])

  const tips = useMemo(() => {
    const list: Array<{ title: string; body: string; href: string; cta: string }> = []

    if (!status.hasProjects) {
      list.push({
        title: 'Empieza creando tu primer proyecto',
        body: 'Antes de editar, crea una base con nombre, formato y estructura inicial para no trabajar en vacío.',
        href: '/studio/new',
        cta: 'Crear proyecto',
      })
    }

    if (!status.hasMedia) {
      list.push({
        title: 'Sube media local al navegador',
        body: 'Carga vídeo, imagen o audio en la librería local para empezar a poblar la timeline y el preview del estudio.',
        href: '/studio/media',
        cta: 'Abrir media',
      })
    }

    if (!status.hasFavorites) {
      list.push({
        title: 'Guarda tus presets favoritos',
        body: 'Marca plantillas, textos, stickers y overlays para acelerar tu flujo cuando empieces a repetir estilo.',
        href: '/studio/library',
        cta: 'Ir a biblioteca',
      })
    }

    if (preferences.showTips) {
      list.push({
        title: 'Mantén los tips activos mientras construyes tu flujo',
        body: 'Las sugerencias visibles ayudan a ordenar mejor el workspace mientras la app sigue creciendo por módulos.',
        href: '/studio/settings',
        cta: 'Ver ajustes',
      })
    }

    if (!preferences.autoplayPreview) {
      list.push({
        title: 'Activa autoplay si quieres revisar más rápido',
        body: 'Si tu flujo es más visual, puedes dejar el preview preparado para una experiencia más directa desde ajustes.',
        href: '/studio/settings',
        cta: 'Configurar autoplay',
      })
    }

    if (!preferences.snapTimeline) {
      list.push({
        title: 'Activa snap de timeline para ajustes más limpios',
        body: 'El ajuste de snap ayuda a mover y alinear clips con una sensación más controlada dentro del estudio.',
        href: '/studio/settings',
        cta: 'Activar snap',
      })
    }

    list.push({
      title: 'Usa el workspace como centro de mando',
      body: 'Desde el workspace puedes ver estado general, favoritos, ajustes activos y entrar rápido en cada zona de trabajo.',
      href: '/studio/workspace',
      cta: 'Abrir workspace',
    })

    return list
  }, [preferences, status])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Ayuda</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/settings" className="nav-link">Ajustes</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Ayuda contextual del estudio</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Consejos útiles según tu estado actual.</h1>
            <p className="sub">
              Esta pantalla te orienta según proyectos, media, favoritos y preferencias locales para que avances con menos fricción dentro de MentaCut.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir estudio</Link>
              <Link href="/studio/workspace" className="btn">Abrir workspace</Link>
              <Link href="/studio/settings" className="btn">Abrir ajustes</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Proyectos</h3><p><strong>{projects.length}</strong> locales</p></article>
            <article className="panel card"><h3>Media</h3><p><strong>{media.length}</strong> archivos</p></article>
            <article className="panel card"><h3>Favoritos</h3><p><strong>{favorites.templateIds.length + favorites.stickerIds.length + favorites.overlayIds.length + favorites.textValues.length}</strong> guardados</p></article>
            <article className="panel card"><h3>Tips visibles</h3><p><strong>{preferences.showTips ? 'Sí' : 'No'}</strong></p></article>
          </div>
        </section>

        <section className="section">
          <div className="cards" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            {tips.map((tip) => (
              <article key={tip.title} className="panel card">
                <h3>{tip.title}</h3>
                <p>{tip.body}</p>
                <div className="action-row">
                  <Link href={tip.href} className="btn btn-primary">{tip.cta}</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="studio-grid-2">
            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Preferencias leídas</h2>
                <div className="timeline-label">Estado local</div>
              </div>
              <div className="project-list">
                <div className="project-item"><strong>Ruta inicial</strong><div className="timeline-label">{preferences.startupRoute}</div></div>
                <div className="project-item"><strong>Densidad UI</strong><div className="timeline-label">{preferences.uiDensity}</div></div>
                <div className="project-item"><strong>Formato por defecto</strong><div className="timeline-label">{preferences.defaultProjectFormat}</div></div>
                <div className="project-item"><strong>Autoplay preview</strong><div className="timeline-label">{preferences.autoplayPreview ? 'Activo' : 'Inactivo'}</div></div>
              </div>
            </div>

            <div className="panel timeline">
              <div className="row-head">
                <h2 className="section-title">Atajos recomendados</h2>
                <div className="timeline-label">Flujo práctico</div>
              </div>
              <div className="project-list">
                <Link href="/studio/new" className="project-item"><strong>Crear proyecto</strong><div className="timeline-label">Arranca con nombre, formato y base visual</div></Link>
                <Link href="/studio/media" className="project-item"><strong>Subir media</strong><div className="timeline-label">Carga vídeo, imagen y audio al navegador</div></Link>
                <Link href="/studio/library" className="project-item"><strong>Elegir presets</strong><div className="timeline-label">Plantillas, stickers, overlays y textos</div></Link>
                <Link href="/studio/backup" className="project-item"><strong>Guardar backup</strong><div className="timeline-label">Exporta el estado local antes de cambios gordos</div></Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
