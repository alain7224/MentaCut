import type { LocalProject } from '@/lib/local-store'

type CsvRow = Record<string, string>

function parseCsvLine(line: string): string[] {
  const cells: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      cells.push(current)
      current = ''
      continue
    }

    current += char
  }

  cells.push(current)
  return cells.map((item) => item.trim())
}

export function parseCopyCsv(raw: string): CsvRow[] {
  const lines = raw.replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean)
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map((item) => item.toLowerCase())
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const row: CsvRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    return row
  })
}

export function applyCopyCsvToProject(project: LocalProject, rows: CsvRow[]): LocalProject {
  return {
    ...project,
    clips: project.clips.map((clip, index) => {
      const row = rows[index] ?? {}
      return {
        ...clip,
        title: row.title?.trim() || clip.title,
        headlineText: row.headline?.trim() || clip.headlineText,
        captionText: row.caption?.trim() || clip.captionText,
      }
    }),
  }
}
