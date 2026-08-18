// Balayage mot à mot du prompteur : combien de mots sont « allumés » à t donné.
// v1 : répartition linéaire des mots sur la durée de la réplique.
// (S7c fournira des timings réels par mot ; cette fonction restera le fallback.)
export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

export function litWordCount(text: string, tMs: number, startMs: number, endMs: number): number {
  const words = splitWords(text).length
  if (words === 0) return 0
  if (endMs <= startMs) return words
  const progress = (tMs - startMs) / (endMs - startMs)
  if (progress <= 0) return 0
  return Math.min(words, Math.ceil(progress * words))
}
