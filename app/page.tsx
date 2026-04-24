import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-dot" />
          <span>MentaCut</span>
        </div>
        <nav className="nav">
          <Link href="/studio" className="nav-link">Abrir estudio</Link>
          <a href="https://www.clipshort.co/es" className="nav-link" target="_blank" rel="noreferrer">Referencia visual</a>
        </nav>
      </header>

      <main className="main">
        <section className="hero">
          <div className="panel hero-copy">
            <span className="eyebrow">Local-first · responsive · Safari/PWA</span>
            <h1 className="title">Editor de vídeo real con alma de CapCut y look iOS cristal.</h1>
            <p className="sub">
              MentaCut arranca como aplicación web potente y usable en escritorio, Android e iPhone desde Safari,
              priorizando almacenamiento local, respuesta rápida y evolución hacia pipeline real con render fiable.
            </p>
            <div className="action-row">
              <Link href="/studio" className="btn btn-primary">Entrar al estudio</Link>
              <a href="/docs/MENTACUT_MASTER_SPEC.md" className="btn">Leer dirección del producto</a>
            </div>
          </div>

          <div className="panel hero-preview">
            <div className="preview-card">
              <div className="preview-stage">
                <div className="preview-phone" />
                <div className="preview-timeline">
                  <div className="preview-track"><span /></div>
                  <div className="preview-track"><span style={{ left: '28%', width: '21%' }} /></div>
                  <div className="preview-track"><span style={{ left: '56%', width: '16%' }} /></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Base real ya orientada al producto</h2>
          <div className="cards">
            <article className="panel card">
              <h3>Local-first de verdad</h3>
              <p>Los proyectos podrán vivir localmente primero para que editar sea rápido incluso antes de cerrar toda la parte cloud.</p>
            </article>
            <article className="panel card">
              <h3>Móvil primero sin App Store</h3>
              <p>Dirección clara: web responsiva y uso serio en iPhone vía Safari/PWA antes de pagar firmado nativo.</p>
            </article>
            <article className="panel card">
              <h3>Escalable a pipeline real</h3>
              <p>La base se prepara para subir luego media, worker FFmpeg, cola de exportación, plantillas y timeline completo.</p>
            </article>
          </div>
        </section>
      </main>
    </div>
  )
}
