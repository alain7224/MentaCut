export type DetectedBeatMap = {
  bpm: number
  markers: number[]
  threshold: number
}

function median(values: number[]): number {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export function detectBeatsFromAudioBuffer(channel: Float32Array, sampleRate: number): DetectedBeatMap {
  const windowSize = 1024
  const hop = 512
  const envelope: number[] = []

  for (let i = 0; i < channel.length; i += hop) {
    let sum = 0
    const end = Math.min(channel.length, i + windowSize)
    for (let j = i; j < end; j += 1) sum += Math.abs(channel[j])
    envelope.push(sum / Math.max(1, end - i))
  }

  const avg = envelope.reduce((sum, value) => sum + value, 0) / Math.max(1, envelope.length)
  const threshold = avg * 1.6
  const markers: number[] = []
  let lastTime = -1

  for (let i = 1; i < envelope.length - 1; i += 1) {
    const current = envelope[i]
    if (current > threshold && current > envelope[i - 1] && current >= envelope[i + 1]) {
      const time = (i * hop) / sampleRate
      if (lastTime < 0 || time - lastTime >= 0.18) {
        markers.push(Number(time.toFixed(3)))
        lastTime = time
      }
    }
  }

  const intervals = markers.slice(1).map((time, index) => time - markers[index]).filter((value) => value > 0.2 && value < 2)
  const med = median(intervals)
  const bpm = med > 0 ? Math.max(40, Math.min(220, Math.round(60 / med))) : 120

  return {
    bpm,
    markers,
    threshold: Number(threshold.toFixed(6)),
  }
}
