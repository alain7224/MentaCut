'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { saveLocalMedia } from '@/lib/local-media'
import { createMediaImportQueueItem, readMediaImportQueue, removeMediaImportQueueItem, upsertMediaImportQueueItem, writeMediaImportQueue, type MediaImportQueueItem } from '@/lib/local-media-import-queue'

export default function StudioImportQueuePage() {
  const [queue, setQueue] = useState<MediaImportQueueItem[]>([])
  const [status, setStatus] = useState('')

  useEffect(() => {
    setQueue(readMediaImportQueue())
  }, [])

  function persist(next: MediaImportQueueItem[], nextStatus: string) {
    setQueue(next)
    writeMediaImportQueue(next)
    setStatus(nextStatus)
  }

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (!files.length) return

    let working = [...queue]

    for (const file of files) {
      let item = createMediaImportQueueItem(file)
      working = upsertMediaImportQueueItem(working, item)
      persist(working, `Archivo en cola: ${file.name}`)

      for (const progress of [15, 35, 60, 85]) {
        item = { ...item, status: 'processing', progress }
        working = upsertMediaImportQueueItem(working, item)
        persist(working, `Importando ${file.name}... ${progress}%`)
        await new Promise((resolve) => window.setTimeout(resolve, 120))
      }

      try {
        await saveLocalMedia(file)
        item = { ...item, status: 'done', progress: 100 }
        working = upsertMediaImportQueueItem(working, item)
        persist(working, `Importación completada: ${file.name}`)
      } catch {
        item = { ...item, status: 'error', progress: item.progress }
        working = upsertMediaImportQueueItem(working, item)
        persist(working, `Error importando: ${file.name}`)
      }
    }
  }

  function removeItem(id: string) {
    persist(removeMediaImportQueueItem(queue, id), 'Elemento eliminado de la cola')
  }

  const stats = useMemo(() => ({
    total: queue.length,
    done: queue.filter((item) => item.status === 'done').length,
    processing: queue.filter((item) => item.status === 'processing').length,
    error: queue.filter((item) => item.status === 'error').length,
  }), [queue])

  return (
    <div className="page-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-dot" /><span>MentaCut Import Queue</span></div>
        <nav className="nav">
          <Link href="/" className="nav-link">Inicio</Link>
          <Link href="/studio/workspace" className="nav-link">Workspace</Link>
          <Link href="/studio/media" className="nav-link">Media</Link>
          <Link href="/studio/import" className="nav-link">Import</Link>
          <Link href="/studio" className="nav-link">Estudio</Link>
        </nav>
      </header>
      <main className="main">
        <section className="section">
          <div className="panel hero-copy">
            <span className="eyebrow">Cola de importación de media</span>
            <h1 className="title" style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>Sube archivos con progreso y estado.</h1>
            <p className="sub">Esta zona organiza la importación local de medios, mostrando progreso, estado y errores por archivo.</p>
            <div className="action-row">
              <label className="btn btn-primary upload-btn">
                <input type="file" multiple hidden onChange={handleFiles} />
                Añadir archivos
              </label>
              <Link href="/studio/media" className="btn">Abrir media</Link>
            </div>
            <div className="timeline-label">{status || 'Añade archivos para ver la cola de importación.'}</div>
          </div>
        </section>
        <section className="section">
          <div className="cards">
            <article className="panel card"><h3>Total</h3><p><strong>{stats.total}</strong></p></article>
            <article className="panel card"><h3>Done</h3><p><strong>{stats.done}</strong></p></article>
            <article className="panel card"><h3>Processing</h3><p><strong>{stats.processing}</strong></p></article>
            <article className="panel card"><h3>Error</h3><p><strong>{stats.error}</strong></p></article>
          </div>
        </section>
        <section className="section">
          <div className="panel timeline">
            <div className="row-head"><h2 className="section-title">Items de la cola</h2><div className="timeline-label">{queue.length} archivo(s)</div></div>
            <div className="project-list">
              {queue.length === 0 ? <div className="empty">No hay archivos en cola.</div> : null}
              {queue.map((item) => (
                <div key={item.id} className="project-item">
                  <strong>{item.name}</strong>
                  <div className="timeline-label">Estado: {item.status} · {item.progress}%</div>
                  <div style={{ height: 10, borderRadius: 999, background: 'rgba(255,255,255,.08)', overflow: 'hidden' }}>
                    <div style={{ width: `${item.progress}%`, height: '100%', borderRadius: 999, background: item.status === 'error' ? 'rgba(255,120,120,.9)' : 'rgba(255,255,255,.72)' }} />
                  </div>
                  <div className="action-row"><button className="btn" onClick={() => removeItem(item.id)}>Quitar</button></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
