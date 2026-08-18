// Marquages de l'outil /timer ↔ cues.json / shots.json.
// character '?' = pas encore attribué (brouillons de l'analyse automatique).
export type Track = 'cues' | 'shots'

export type Mark = {
  track: Track
  character: string
  startMs: number
  endMs: number
  text?: string
}

function sorted(marks: Mark[], track: Track): Mark[] {
  return marks
    .filter((m) => m.track === track && m.endMs > m.startMs)
    .sort((a, b) => a.startMs - b.startMs)
}

export function hasUnassigned(marks: Mark[], track: Track): boolean {
  return sorted(marks, track).some((m) => m.character === '?')
}

export function toCues(
  marks: Mark[],
): { text: string; character: string; startMs: number; endMs: number }[] {
  return sorted(marks, 'cues').map((m, i) => ({
    text: m.text ?? `Réplique ${i + 1} — à remplacer`,
    character: m.character,
    startMs: Math.round(m.startMs),
    endMs: Math.round(m.endMs),
  }))
}

export function toShots(marks: Mark[]): { character: string; startMs: number; endMs: number }[] {
  return sorted(marks, 'shots').map((m) => ({
    character: m.character,
    startMs: Math.round(m.startMs),
    endMs: Math.round(m.endMs),
  }))
}

// Import d'un fichier cues.json / shots.json (final ou brouillon *.draft.json)
export function fromJson(track: Track, data: unknown): Mark[] {
  if (!Array.isArray(data)) throw new Error('format inattendu')
  return data.map((item) => {
    const obj = item as { character?: string; startMs?: number; endMs?: number; text?: string }
    if (typeof obj.startMs !== 'number' || typeof obj.endMs !== 'number') {
      throw new Error('format inattendu')
    }
    return {
      track,
      character: obj.character || '?',
      startMs: obj.startMs,
      endMs: obj.endMs,
      ...(typeof obj.text === 'string' ? { text: obj.text } : {}),
    }
  })
}
