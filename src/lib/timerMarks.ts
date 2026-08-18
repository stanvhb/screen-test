// Conversion des marquages de l'outil /timer vers cues.json / shots.json.
export type Track = 'cues' | 'shots'

export type Mark = {
  track: Track
  character: string
  startMs: number
  endMs: number
}

function sorted(marks: Mark[], track: Track): Mark[] {
  return marks
    .filter((m) => m.track === track && m.endMs > m.startMs)
    .sort((a, b) => a.startMs - b.startMs)
}

export function toCues(
  marks: Mark[],
): { text: string; character: string; startMs: number; endMs: number }[] {
  return sorted(marks, 'cues').map((m, i) => ({
    text: `Réplique ${i + 1} — à remplacer`,
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
