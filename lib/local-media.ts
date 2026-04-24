export type LocalMediaKind = 'video' | 'image' | 'audio'

export type LocalMediaRecord = {
  id: string
  name: string
  kind: LocalMediaKind
  size: number
  type: string
  createdAt: string
  duration: number | null
}

type StoredMedia = LocalMediaRecord & { file: File }

const DB_NAME = 'mentacut-local-db'
const STORE_NAME = 'media'
const VERSION = 1

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function readDuration(file: File, kind: LocalMediaKind): Promise<number | null> {
  if (kind === 'image') return Promise.resolve(null)
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    if (kind === 'audio') {
      const audio = document.createElement('audio')
      audio.preload = 'metadata'
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url)
        resolve(Number.isFinite(audio.duration) ? audio.duration : null)
      }
      audio.onerror = () => {
        URL.revokeObjectURL(url)
        resolve(null)
      }
      audio.src = url
      return
    }
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(video.duration) ? video.duration : null)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    video.src = url
  })
}

export function detectMediaKind(file: File): LocalMediaKind {
  if (file.type.startsWith('audio/')) return 'audio'
  if (file.type.startsWith('image/')) return 'image'
  return 'video'
}

export async function saveLocalMedia(file: File): Promise<LocalMediaRecord> {
  const db = await openDb()
  const kind = detectMediaKind(file)
  const duration = await readDuration(file, kind)
  const record: StoredMedia = {
    id: crypto.randomUUID(),
    name: file.name,
    kind,
    size: file.size,
    type: file.type,
    createdAt: new Date().toISOString(),
    duration,
    file,
  }
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(record)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return record
}

export async function listLocalMedia(): Promise<LocalMediaRecord[]> {
  const db = await openDb()
  const items = await new Promise<StoredMedia[]>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = () => resolve((request.result as StoredMedia[]) ?? [])
    request.onerror = () => reject(request.error)
  })
  return items
    .map(({ file: _file, ...rest }) => rest)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getLocalMediaFile(id: string): Promise<File | null> {
  const db = await openDb()
  const item = await new Promise<StoredMedia | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result as StoredMedia | undefined)
    request.onerror = () => reject(request.error)
  })
  return item?.file ?? null
}

export async function removeLocalMedia(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
