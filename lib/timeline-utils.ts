import type { LocalClip } from '@/lib/local-store'

export function duplicateClip(clip: LocalClip): LocalClip {
  return {
    ...clip,
    id: crypto.randomUUID(),
    title: `${clip.title} copia`,
  }
}

export function splitClip(clip: LocalClip, at: number): [LocalClip, LocalClip] {
  const safeAt = Math.min(Math.max(at, clip.start + 0.1), clip.end - 0.1)
  return [
    { ...clip, id: crypto.randomUUID(), end: Number(safeAt.toFixed(2)), title: `${clip.title} A` },
    { ...clip, id: crypto.randomUUID(), start: Number(safeAt.toFixed(2)), title: `${clip.title} B` },
  ]
}

export function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items]
  const [item] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, item)
  return next
}
