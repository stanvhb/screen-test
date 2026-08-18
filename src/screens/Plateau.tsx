import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getScene, karaokeLines, type KaraokeLine } from '../data/scenes'
import { setTake } from '../data/takes'
import { KaraokeBar } from '../components/KaraokeBar'
import { Button } from '../components/Button'
import { useCamera } from '../hooks/useCamera'
import { useSceneData } from '../hooks/useSceneData'
import { pickRecordingFormat } from '../lib/recorder'
import { cueAfter, cueAt, shotAt, type Cue, type Shot } from '../lib/sceneEngine'
import { formatTimecode } from '../lib/timecode'
import './Plateau.css'

type Phase = 'preview' | 'countdown' | 'recording'

const COUNTDOWN_STEPS = ['3', '2', '1', 'ACTION'] as const
const COUNTDOWN_STEP_MS = 800

type SyncView = { active: Cue | null; next: Cue | null; shot: Shot | null }

export function Plateau() {
  const { id } = useParams()
  const scene = getScene(id)
  const sceneData = useSceneData(scene.id)
  const media = sceneData.status === 'ready' ? sceneData.media : null
  const [searchParams] = useSearchParams()
  const roleId = searchParams.get('role')
  const navigate = useNavigate()
  const { status, stream, request } = useCamera()

  const characters = media?.characters ?? scene.characters
  const you = characters.find((c) => c.id === roleId) ?? characters[0]
  const other = characters.find((c) => c.id !== you.id) ?? characters[1]

  const videoRef = useRef<HTMLVideoElement>(null)
  const refVideoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [phase, setPhase] = useState<Phase>('preview')
  const [countdownStep, setCountdownStep] = useState<string | null>(null)
  const [elapsedS, setElapsedS] = useState(0)
  const [recordError, setRecordError] = useState(false)
  const [syncView, setSyncView] = useState<SyncView | null>(null)

  // Aperçu miroir
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const startRecording = useCallback(() => {
    const format = pickRecordingFormat()
    if (!format || !stream) {
      setRecordError(true)
      setPhase('preview')
      return
    }
    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType: format.mimeType })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: format.mimeType })
      setTake({ sceneId: scene.id, blob, extension: format.extension })
      navigate(`/dailies/${scene.id}`)
    }
    recorder.start()
    recorderRef.current = recorder
    setElapsedS(0)
    setPhase('recording')
    // La référence part avec l'enregistrement (mode Playback : bande son audible)
    const ref = refVideoRef.current
    if (ref) {
      ref.currentTime = 0
      ref.muted = false
      ref.play().catch(() => {})
    }
  }, [navigate, scene.id, stream, setPhase, setRecordError, setElapsedS])

  // Décompte 3-2-1 → ACTION (la première étape est posée au clic sur Moteur)
  useEffect(() => {
    if (phase !== 'countdown') return
    let step = 0
    const interval = setInterval(() => {
      step += 1
      if (step < COUNTDOWN_STEPS.length) {
        setCountdownStep(COUNTDOWN_STEPS[step])
        if (COUNTDOWN_STEPS[step] === 'ACTION') startRecording()
      } else {
        setCountdownStep(null)
        clearInterval(interval)
      }
    }, COUNTDOWN_STEP_MS)
    return () => clearInterval(interval)
  }, [phase, startRecording])

  // Timecode pendant la prise
  useEffect(() => {
    if (phase !== 'recording') return
    const startedAt = Date.now()
    const interval = setInterval(() => {
      setElapsedS((Date.now() - startedAt) / 1000)
    }, 250)
    return () => clearInterval(interval)
  }, [phase])

  // Synchro karaoké + plans : suit le temps de la vidéo de référence
  useEffect(() => {
    if (phase !== 'recording' || !media) return
    let raf = 0
    const tick = () => {
      const tMs = (refVideoRef.current?.currentTime ?? 0) * 1000
      const active = cueAt(media.cues, tMs)
      const next = cueAfter(media.cues, tMs)
      const shot = shotAt(media.shots, tMs)
      setSyncView((prev) =>
        prev && prev.active === active && prev.next === next && prev.shot === shot
          ? prev
          : { active, next, shot },
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, media])

  const stopRecording = useCallback(() => {
    refVideoRef.current?.pause()
    recorderRef.current?.stop()
  }, [])

  // Fin de la référence = fin de la prise ("Coupez !" automatique)
  useEffect(() => {
    if (phase !== 'recording' || !media) return
    const ref = refVideoRef.current
    if (!ref) return
    ref.addEventListener('ended', stopRecording)
    return () => ref.removeEventListener('ended', stopRecording)
  }, [phase, media, stopRecording])

  // On arrête proprement même si on quitte l'écran
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.ondataavailable = null
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
    }
  }, [])

  if (status === 'denied' || status === 'unavailable') {
    return (
      <div className="plateau plateau--error">
        <div className="plateau__error">
          <h2>Pas de caméra, pas de scène</h2>
          <p>
            {status === 'denied'
              ? 'Ton navigateur bloque la caméra. Autorise-la dans les réglages du site, puis réessaie.'
              : 'Impossible de trouver ta caméra. Vérifie qu’aucune autre app ne l’utilise, puis réessaie.'}
          </p>
          <Button onClick={request}>Réessayer</Button>
          <Link to={`/setup/${scene.id}`} className="plateau__back">
            ← Retour
          </Link>
        </div>
      </div>
    )
  }

  const isRecording = phase === 'recording'

  const toLine = (cue: Cue | null): KaraokeLine | null =>
    cue && {
      text: cue.text,
      speaker: characters.find((c) => c.id === cue.character)?.name ?? '',
      isYou: cue.character === you.id,
    }

  // Avec média : synchro réelle (aperçu = début de scène). Sans : mock statique (S1).
  const mockLines = karaokeLines(scene, roleId)
  const activeLine = media
    ? toLine(isRecording ? (syncView?.active ?? null) : cueAt(media.cues, 0))
    : mockLines.active
  const nextLine = media
    ? toLine(isRecording ? (syncView?.next ?? null) : cueAfter(media.cues, 0))
    : mockLines.next

  // Qui est à l'image : shots.json en enregistrement, sinon la réplique active
  const youOnScreen = media
    ? isRecording
      ? syncView?.shot?.character === you.id
      : (shotAt(media.shots, 0)?.character ?? you.id) === you.id
    : (activeLine?.isYou ?? true)
  const showRef = Boolean(media) && isRecording && !youOnScreen

  return (
    <div className="plateau">
      <div className="plateau__camera">
        {media && (
          <video
            ref={refVideoRef}
            src={media.videoUrl}
            className={`plateau__ref ${showRef ? '' : 'plateau__offstage'}`}
            playsInline
            preload="auto"
          />
        )}
        {status === 'ready' ? (
          <video
            ref={videoRef}
            className={`plateau__video ${showRef ? 'plateau__offstage' : ''}`}
            autoPlay
            muted
            playsInline
          />
        ) : (
          <p className="plateau__waiting">Un instant, on allume ta caméra…</p>
        )}
      </div>

      <header className="plateau__top">
        <span className={`plateau__rec ${isRecording ? 'plateau__rec--on' : ''}`}>
          <span className="plateau__rec-dot" aria-hidden="true" />
          REC
        </span>
        <span className="plateau__timecode">{formatTimecode(elapsedS)}</span>
      </header>

      <p className={`plateau__shot ${youOnScreen ? 'plateau__shot--you' : ''}`}>
        À l’image : {youOnScreen ? `toi (${you.name})` : other.name}
      </p>

      {countdownStep && (
        <div className="plateau__countdown" aria-live="assertive">
          <span key={countdownStep}>{countdownStep}</span>
        </div>
      )}

      <footer className="plateau__bottom">
        <KaraokeBar active={activeLine} next={nextLine} />
        {recordError && (
          <p className="plateau__record-error">Ta vidéo n’a pas pu démarrer. Réessaie.</p>
        )}
        {isRecording ? (
          <button
            type="button"
            className="plateau__stop"
            aria-label="Coupez"
            onClick={stopRecording}
          >
            <span className="plateau__stop-square" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="plateau__stop"
            aria-label="Moteur"
            disabled={status !== 'ready' || phase === 'countdown'}
            onClick={() => {
              // Amorce la réf dans le geste utilisateur (autoplay Safari)
              const ref = refVideoRef.current
              if (ref) {
                ref.muted = true
                ref
                  .play()
                  .then(() => {
                    ref.pause()
                    ref.currentTime = 0
                  })
                  .catch(() => {})
              }
              setCountdownStep(COUNTDOWN_STEPS[0])
              setPhase('countdown')
            }}
          >
            <span className="plateau__rec-circle" aria-hidden="true" />
          </button>
        )}
      </footer>
    </div>
  )
}
