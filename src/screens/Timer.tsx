import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { formatTimecode } from '../lib/timecode'
import { fromJson, hasUnassigned, toCues, toShots, type Mark, type Track } from '../lib/timerMarks'
import './Timer.css'

// Outil de calage : marquer à la main (A/B tenues) OU importer les brouillons de
// l'analyse automatique (tools/analyze-scene.mjs), attribuer, ajuster, exporter.
export function Timer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pendingRef = useRef<{ character: string; startMs: number } | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [track, setTrack] = useState<Track>('cues')
  const [marks, setMarks] = useState<Mark[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [heldCharacter, setHeldCharacter] = useState<string | null>(null)
  const [importError, setImportError] = useState(false)
  const [timeS, setTimeS] = useState(0)

  // Timecode affiché
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeS(videoRef.current?.currentTime ?? 0)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // Clavier : espace lecture/pause · A/B tenues = marquer · marque sélectionnée :
  // A/B attribue, flèches ajustent le début (Maj = la fin), X supprime, Échap désélectionne
  useEffect(() => {
    const nudge = (index: number, edge: 'startMs' | 'endMs', deltaMs: number) => {
      setMarks((prev) =>
        prev.map((mark, i) =>
          i === index ? { ...mark, [edge]: Math.max(0, mark[edge] + deltaMs) } : mark,
        ),
      )
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return
      const video = videoRef.current
      if (event.key === ' ') {
        event.preventDefault()
        if (!video) return
        if (video.paused) void video.play()
        else video.pause()
        return
      }
      if (selected !== null) {
        if (event.key === 'a' || event.key === 'b') {
          setMarks((prev) =>
            prev.map((mark, i) => (i === selected ? { ...mark, character: event.key } : mark)),
          )
          return
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          const delta = event.key === 'ArrowLeft' ? -100 : 100
          nudge(selected, event.shiftKey ? 'endMs' : 'startMs', delta)
          return
        }
        if (event.key === 'x' || event.key === 'Backspace') {
          setMarks((prev) => prev.filter((_, i) => i !== selected))
          setSelected(null)
          return
        }
        if (event.key === 'Escape') {
          setSelected(null)
          return
        }
      }
      if (!video || event.repeat) return
      const character = event.key === 'a' ? 'a' : event.key === 'b' ? 'b' : null
      if (!character || pendingRef.current) return
      pendingRef.current = { character, startMs: video.currentTime * 1000 }
      setHeldCharacter(character)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      const video = videoRef.current
      const pending = pendingRef.current
      if (!video || !pending) return
      if (event.key !== pending.character) return
      pendingRef.current = null
      setHeldCharacter(null)
      setMarks((prev) => [
        ...prev,
        {
          track,
          character: pending.character,
          startMs: pending.startMs,
          endMs: video.currentTime * 1000,
        },
      ])
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [track, selected])

  const loadFile = (file: File | null) => {
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setMarks([])
    setSelected(null)
  }

  const importDraft = async (file: File | null) => {
    if (!file) return
    setImportError(false)
    try {
      const data: unknown = JSON.parse(await file.text())
      const isShots = file.name.includes('shots')
      const importedTrack: Track = isShots ? 'shots' : 'cues'
      const imported = fromJson(importedTrack, data)
      setMarks((prev) => [...prev.filter((m) => m.track !== importedTrack), ...imported])
      setTrack(importedTrack)
      setSelected(null)
    } catch {
      setImportError(true)
    }
  }

  const download = (name: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  const trackMarks = marks
    .map((mark, index) => ({ mark, index }))
    .filter(({ mark }) => mark.track === track)
  const cuesBlocked = hasUnassigned(marks, 'cues')
  const shotsBlocked = hasUnassigned(marks, 'shots')

  return (
    <div className="timer">
      <Link to="/" className="timer__back">
        ← Bibliothèque
      </Link>
      <h2>Caler une scène</h2>
      <p className="timer__help">
        <strong>Espace</strong> : lecture/pause. Maintiens <strong>A</strong>/<strong>B</strong>{' '}
        pour marquer à la volée. Ou importe les brouillons de l’analyse automatique (
        <code>node tools/analyze-scene.mjs ta-video.mp4</code>) puis clique une ligne :{' '}
        <strong>A</strong>/<strong>B</strong> attribue, <strong>←→</strong> ajuste le début (
        <strong>Maj</strong> : la fin), <strong>X</strong> supprime.
      </p>

      <div className="timer__source">
        <label className="timer__file">
          Vidéo :
          <input
            type="file"
            accept="video/*"
            aria-label="Charger une vidéo"
            onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          type="button"
          className="timer__demo"
          onClick={() => setVideoUrl('/scenes/demo/video.mp4')}
        >
          ou utiliser la scène témoin
        </button>
        <label className="timer__file">
          Importer un brouillon (cues/shots .json) :
          <input
            type="file"
            accept="application/json,.json"
            aria-label="Importer un brouillon"
            onChange={(e) => {
              void importDraft(e.target.files?.[0] ?? null)
              e.target.value = ''
            }}
          />
        </label>
        {importError && <p className="timer__error">Fichier illisible — exporté par l’analyse ?</p>}
      </div>

      {videoUrl && (
        <div className="timer__stage">
          <video ref={videoRef} src={videoUrl} className="timer__video" playsInline controls />
          <p className="timer__timecode">
            {formatTimecode(timeS)}
            {heldCharacter && (
              <span className="timer__held"> · {heldCharacter.toUpperCase()} en cours…</span>
            )}
          </p>
        </div>
      )}

      <div className="timer__tracks" role="radiogroup" aria-label="Piste">
        <button
          type="button"
          className={`timer__track ${track === 'cues' ? 'timer__track--selected' : ''}`}
          onClick={() => setTrack('cues')}
        >
          Répliques (qui parle)
        </button>
        <button
          type="button"
          className={`timer__track ${track === 'shots' ? 'timer__track--selected' : ''}`}
          onClick={() => setTrack('shots')}
        >
          Plans (qui est à l’image)
        </button>
      </div>

      <ul className="timer__marks">
        {trackMarks.map(({ mark, index }) => (
          <li key={index}>
            <button
              type="button"
              className={`timer__mark ${selected === index ? 'timer__mark--selected' : ''} ${
                mark.character === '?' ? 'timer__mark--unassigned' : ''
              }`}
              onClick={() => setSelected(selected === index ? null : index)}
            >
              <span className="timer__mark-char">{mark.character.toUpperCase()}</span>{' '}
              {formatTimecode(mark.startMs / 1000)} → {formatTimecode(mark.endMs / 1000)}
              {mark.text ? ` · ${mark.text.slice(0, 40)}` : ''}
            </button>
          </li>
        ))}
        {trackMarks.length === 0 && (
          <li className="timer__empty">Aucune marque sur cette piste.</li>
        )}
      </ul>

      <div className="timer__actions">
        <Button
          variant="ghost"
          onClick={() =>
            setMarks((prev) =>
              prev.map((mark) =>
                mark.track === track
                  ? {
                      ...mark,
                      character:
                        mark.character === 'a'
                          ? 'b'
                          : mark.character === 'b'
                            ? 'a'
                            : mark.character,
                    }
                  : mark,
              ),
            )
          }
          disabled={trackMarks.length === 0}
        >
          Permuter A ↔ B ({track === 'cues' ? 'répliques' : 'plans'})
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setMarks((prev) => prev.slice(0, -1))
            setSelected(null)
          }}
          disabled={marks.length === 0}
        >
          Annuler la dernière
        </Button>
        <Button
          onClick={() => download('cues.json', toCues(marks))}
          disabled={marks.length === 0 || cuesBlocked}
        >
          Exporter cues.json
        </Button>
        <Button
          onClick={() => download('shots.json', toShots(marks))}
          disabled={marks.length === 0 || shotsBlocked}
        >
          Exporter shots.json
        </Button>
        {(cuesBlocked || shotsBlocked) && (
          <p className="timer__error">
            Des marques « ? » restent à attribuer (clique la ligne puis A ou B) avant d’exporter.
          </p>
        )}
      </div>
      <p className="timer__help">
        Les textes des répliques s’éditent ensuite dans <code>cues.json</code>. Mode d’emploi
        complet : <code>public/scenes/README.md</code>.
      </p>
    </div>
  )
}
