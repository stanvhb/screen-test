// Moteur de synchro : qui parle et qui est à l'image à l'instant t.
// Fonctions pures — la source du temps (video.currentTime) reste dehors.
export type Cue = { text: string; character: string; startMs: number; endMs: number }
export type Shot = { character: string; startMs: number; endMs: number }

type Timed = { startMs: number; endMs: number }

function at<T extends Timed>(items: T[], tMs: number): T | null {
  return items.find((item) => tMs >= item.startMs && tMs < item.endMs) ?? null
}

export function cueAt(cues: Cue[], tMs: number): Cue | null {
  return at(cues, tMs)
}

export function cueAfter(cues: Cue[], tMs: number): Cue | null {
  const active = cueAt(cues, tMs)
  const from = active ? active.endMs : tMs
  return cues.find((cue) => cue.startMs >= from) ?? null
}

export function shotAt(shots: Shot[], tMs: number): Shot | null {
  return at(shots, tMs)
}
