import { useEffect, useState } from 'react'
import type { Character } from '../data/scenes'
import type { Cue, Shot } from '../lib/sceneEngine'

// Données réelles d'une scène : public/scenes/<id>/ (S3).
// Les scènes mock (S1) n'ont pas de dossier → status 'none', l'écran garde son comportement statique.
export type SceneMedia = {
  videoUrl: string
  title: string
  film: string
  characters: Character[]
  cues: Cue[]
  shots: Shot[]
}

export type SceneDataState =
  { status: 'loading' } | { status: 'none' } | { status: 'ready'; media: SceneMedia }

type SceneMeta = { title: string; film: string; characters: Character[] }

export function useSceneData(sceneId: string): SceneDataState {
  const [state, setState] = useState<SceneDataState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    const base = `/scenes/${sceneId}`
    Promise.all([
      fetch(`${base}/meta.json`),
      fetch(`${base}/cues.json`),
      fetch(`${base}/shots.json`),
    ])
      .then(async ([metaRes, cuesRes, shotsRes]) => {
        if (!metaRes.ok || !cuesRes.ok || !shotsRes.ok) throw new Error('scène sans dossier')
        const meta = (await metaRes.json()) as SceneMeta
        const cues = (await cuesRes.json()) as Cue[]
        const shots = (await shotsRes.json()) as Shot[]
        if (cancelled) return
        setState({
          status: 'ready',
          media: {
            videoUrl: `${base}/video.mp4`,
            title: meta.title,
            film: meta.film,
            characters: meta.characters,
            cues,
            shots,
          },
        })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'none' })
      })
    return () => {
      cancelled = true
    }
  }, [sceneId])

  return state
}
