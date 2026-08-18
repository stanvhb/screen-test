import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/Button'
import { formatTimecode } from '../lib/timecode'
import { toCues, toShots, type Mark, type Track } from '../lib/timerMarks'
import './Timer.css'

// Outil de calage : regarder la réf, marquer répliques et plans aux touches,
// exporter cues.json / shots.json prêts pour public/scenes/<id>/.
export function Timer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const pendingRef = useRef<{ character: string; startMs: number } | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [track, setTrack] = useState<Track>('cues')
  const [marks, setMarks] = useState<Mark[]>([])
  const [heldCharacter, setHeldCharacter] = useState<string | null>(null)
  const [timeS, setTimeS] = useState(0)

  // Timecode affiché
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeS(videoRef.current?.currentTime ?? 0)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  // A/B enfoncée = le personnage parle / est à l'image ; relâchée = fin de la marque
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const video = videoRef.current
      if (!video || event.repeat) return
      if (event.key === ' ') {
        event.preventDefault()
        if (video.paused) void video.play()
        else video.pause()
        return
      }
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
  }, [track])

  const loadFile = (file: File | null) => {
    if (!file) return
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(URL.createObjectURL(file))
    setMarks([])
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

  const trackMarks = marks.filter((m) => m.track === track)

  return (
    <div className="timer">
      <Link to="/" className="timer__back">
        ← Bibliothèque
      </Link>
      <h2>Caler une scène</h2>
      <p className="timer__help">
        Charge la vidéo de référence. <strong>Espace</strong> : lecture/pause. Maintiens{' '}
        <strong>A</strong> ou <strong>B</strong> pendant que le personnage parle (piste répliques)
        ou est à l’image (piste plans), relâche à la fin. Exporte les deux fichiers.
      </p>

      <div className="timer__source">
        <input
          type="file"
          accept="video/*"
          aria-label="Charger une vidéo"
          onChange={(e) => loadFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          className="timer__demo"
          onClick={() => setVideoUrl('/scenes/demo/video.mp4')}
        >
          ou utiliser la scène témoin
        </button>
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
        {trackMarks.map((mark, i) => (
          <li key={`${mark.startMs}-${i}`}>
            <span className="timer__mark-char">{mark.character.toUpperCase()}</span>{' '}
            {formatTimecode(mark.startMs / 1000)} → {formatTimecode(mark.endMs / 1000)}
          </li>
        ))}
        {trackMarks.length === 0 && (
          <li className="timer__empty">Aucune marque sur cette piste.</li>
        )}
      </ul>

      <div className="timer__actions">
        <Button
          variant="ghost"
          onClick={() => setMarks((prev) => prev.slice(0, -1))}
          disabled={marks.length === 0}
        >
          Annuler la dernière
        </Button>
        <Button onClick={() => download('cues.json', toCues(marks))} disabled={marks.length === 0}>
          Exporter cues.json
        </Button>
        <Button
          onClick={() => download('shots.json', toShots(marks))}
          disabled={marks.length === 0}
        >
          Exporter shots.json
        </Button>
      </div>
      <p className="timer__help">
        Les textes des répliques s’éditent ensuite dans <code>cues.json</code> (« à remplacer »).
        Mode d’emploi complet : <code>public/scenes/README.md</code>.
      </p>
    </div>
  )
}
