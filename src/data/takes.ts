// Prise en mémoire (le temps de la session) — la relecture in-app arrive en S5.
export type Take = { sceneId: string; blob: Blob; extension: string }

let current: Take | null = null

export function setTake(take: Take) {
  current = take
}

export function getTake(sceneId: string): Take | null {
  return current && current.sceneId === sceneId ? current : null
}

export function clearTake() {
  current = null
}
