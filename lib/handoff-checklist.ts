import type { FinalPassResult } from '@/lib/final-pass'

export type HandoffChecklistItem = {
  label: string
  state: 'done' | 'needs-attention'
}

export function buildHandoffChecklist(finalPass: FinalPassResult): HandoffChecklistItem[] {
  return [
    { label: 'No hay bloqueos críticos', state: finalPass.blocking.length === 0 ? 'done' : 'needs-attention' },
    { label: 'Readiness aceptable', state: finalPass.readinessScore >= 55 ? 'done' : 'needs-attention' },
    { label: 'Proyecto listo para empaquetar', state: finalPass.passed ? 'done' : 'needs-attention' },
    { label: 'Avisos revisados', state: finalPass.warnings.length === 0 ? 'done' : 'needs-attention' },
  ]
}

export function exportHandoffChecklistTxt(projectName: string, items: HandoffChecklistItem[]): string {
  const lines = [`Handoff checklist · ${projectName}`, '']
  items.forEach((item) => lines.push(`- [${item.state === 'done' ? 'x' : ' '}] ${item.label}`))
  return lines.join('\n')
}
