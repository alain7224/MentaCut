'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import StudioBackupPanel from '@/components/studio-backup-panel'
import { readLocalProjects, writeLocalProjects, type LocalProject } from '@/lib/local-store'

export default function StudioBackupPage() {
  const [projects, setProjects] = useState<LocalProject[]>([])

  useEffect(() => {
    setProjects(readLocalProjects())
  }, [])

  function handleImportProjects(imported: LocalProject[]) {
    writeLocalProjects(imported)
    setProjects(imported)
  }

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Backup</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
          <Link href="/studio/projects" className="nav-link">Proyectos</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Backup local · JSON</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Respalda y recupera tus proyectos locales.</h1>
            <p className="sub">
              Esta zona te deja exportar el estado local del editor en JSON e importar un backup válido de MentaCut.
              La media binaria del navegador sigue viviendo en su capa local aparte.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Abrir editor</Link>
              <Link href="/studio/projects" className="btn">Abrir proyectos</Link>
              <Link href="/docs/LOCAL_BACKUP_FORMAT.md" className="btn">Ver formato del backup</Link>
            </div>
          </div>
        </section>

        <section className="section">
          <StudioBackupPanel projects={projects} onImportProjects={handleImportProjects} />
        </section>

        <section className="section">
          <div className="cards">
            <article className="panel card">
              <h3>Exportación simple</h3>
              <p>Genera un JSON del estado local del proyecto para guardarlo fuera del navegador.</p>
            </article>
            <article className="panel card">
              <h3>Importación controlada</h3>
              <p>Solo acepta backups válidos de MentaCut con versión compatible.</p>
            </article>
            <article className="panel card">
              <h3>Base para crecer</h3>
              <p>Esto prepara el editor para copias de seguridad más serias y migraciones futuras.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
