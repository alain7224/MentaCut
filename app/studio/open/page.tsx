'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { readLocalPreferences } from '@/lib/local-preferences'

export default function StudioOpenPage() {
  const router = useRouter()

  useEffect(() => {
    const preferences = readLocalPreferences()
    const target = preferences.startupRoute || '/studio/workspace'
    const timeout = window.setTimeout(() => {
      router.replace(target)
    }, 250)
    return () => window.clearTimeout(timeout)
  }, [router])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut Launcher</span>
        </div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/settings" className="nav-link">Ajustes</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
        </nav>
      </header>

      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Arranque inteligente</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Abriendo tu ruta preferida…</h1>
            <p className="sub">
              MentaCut está leyendo tus preferencias locales para enviarte automáticamente a la zona del estudio que hayas marcado como inicio.
            </p>
            <div className="action-row">
              <Link href="/studio/workspace" className="btn btn-primary">Ir al workspace</Link>
              <Link href="/studio/settings" className="btn">Cambiar ajustes</Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
