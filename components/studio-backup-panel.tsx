'use client'

import { useRef, useState } from 'react'
import { exportLocalProjectsBackup, parseLocalProjectsBackup, type LocalProject } from '@/lib/local-store'

type Props = {
  projects: LocalProject[]
  onImportProjects: (projects: LocalProject[]) => void
}

export default function StudioBackupPanel({ projects, onImportProjects }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState<string>('')

  function handleExport() {
    try {
      const json = exportLocalProjectsBackup(projects)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `mentacut-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setStatus('Backup exportado')
    } catch {
      setStatus('No se pudo exportar el backup')
    }
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const raw = await file.text()
      const imported = parseLocalProjectsBackup(raw)
      onImportProjects(imported)
      setStatus(`Backup importado: ${imported.length} proyecto(s)`)
    } catch {
      setStatus('Archivo de backup no válido')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="panel backup-panel">
      <div className="row-head">
        <div>
          <div className="eyebrow">Backup local</div>
          <h2 className="section-title">Exportar e importar proyectos</h2>
        </div>
      </div>
      <div className="action-row">
        <button className="btn" onClick={handleExport} disabled={projects.length === 0}>Exportar JSON</button>
        <button className="btn" onClick={() => inputRef.current?.click()}>Importar JSON</button>
        <input ref={inputRef} type="file" accept="application/json" hidden onChange={handleImport} />
      </div>
      <div className="timeline-label">{status || 'Guarda una copia del estado local del editor en tu dispositivo.'}</div>
    </div>
  )
}
