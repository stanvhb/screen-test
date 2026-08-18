import { useEffect, useState } from 'react'
import { mockScenes } from '../data/scenes'

// La bibliothèque vient de public/scenes/manifest.json : ajouter une scène = un
// dossier + une ligne dans le manifest, zéro code. Fallback : scènes mock (dev).
export type SceneSummary = { id: string; title: string; film: string; durationS: number }

type LibraryState = { status: 'loading' | 'ready'; scenes: SceneSummary[] }

type Manifest = { scenes: string[] }
type Meta = { title: string; film: string; durationS?: number }

const mockSummaries: SceneSummary[] = mockScenes.map(({ id, title, film, durationS }) => ({
  id,
  title,
  film,
  durationS,
}))

export function useLibrary(): LibraryState {
  const [state, setState] = useState<LibraryState>({ status: 'loading', scenes: [] })

  useEffect(() => {
    let cancelled = false
    fetch('/scenes/manifest.json')
      .then(async (res) => {
        if (!res.ok) throw new Error('manifest absent')
        const manifest = (await res.json()) as Manifest
        const scenes = await Promise.all(
          manifest.scenes.map(async (id) => {
            const meta = (await (await fetch(`/scenes/${id}/meta.json`)).json()) as Meta
            return { id, title: meta.title, film: meta.film, durationS: meta.durationS ?? 0 }
          }),
        )
        if (!cancelled) setState({ status: 'ready', scenes })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'ready', scenes: mockSummaries })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
