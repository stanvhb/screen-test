// Prise en mémoire (le temps de la session) — rien ne quitte l'appareil.
// L'URL de lecture vit aussi longtemps que la prise : créée à la demande,
// révoquée quand une nouvelle prise la remplace.
export type Take = { sceneId: string; blob: Blob; extension: string }

let current: Take | null = null
let currentUrl: string | null = null

function revokeUrl() {
  if (currentUrl) {
    URL.revokeObjectURL(currentUrl)
    currentUrl = null
  }
}

export function setTake(take: Take) {
  revokeUrl()
  current = take
}

export function getTake(sceneId: string): Take | null {
  return current && current.sceneId === sceneId ? current : null
}

export function getTakeUrl(sceneId: string): string | null {
  const take = getTake(sceneId)
  if (!take) return null
  if (!currentUrl) currentUrl = URL.createObjectURL(take.blob)
  return currentUrl
}

export function clearTake() {
  revokeUrl()
  current = null
}
