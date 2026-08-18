import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getCharacter, getScene, karaokeLines, otherCharacter } from '../data/scenes'
import { setTake } from '../data/takes'
import { KaraokeBar } from '../components/KaraokeBar'
import { Button } from '../components/Button'
import { useCamera } from '../hooks/useCamera'
import { pickRecordingFormat } from '../lib/recorder'
import { formatTimecode } from '../lib/timecode'
import './Plateau.css'

type Phase = 'preview' | 'countdown' | 'recording'

const COUNTDOWN_STEPS = ['3', '2', '1', 'ACTION'] as const
const COUNTDOWN_STEP_MS = 800

export function Plateau() {
  const { id } = useParams()
  const scene = getScene(id)
  const [searchParams] = useSearchParams()
  const roleId = searchParams.get('role')
  const you = getCharacter(scene, roleId)
  const other = otherCharacter(scene, roleId)
  const lines = karaokeLines(scene, roleId)
  const youOnScreen = lines.active.isYou
  const navigate = useNavigate()
  const { status, stream, request } = useCamera()

  const videoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const [phase, setPhase] = useState<Phase>('preview')
  const [countdownStep, setCountdownStep] = useState<string | null>(null)
  const [elapsedS, setElapsedS] = useState(0)
  const [recordError, setRecordError] = useState(false)

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
  }, [navigate, scene.id, stream])

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

  // Coupez : on arrête proprement même si on quitte l'écran
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.ondataavailable = null
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
    }
  }, [])

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

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

  return (
    <div className="plateau">
      <div className="plateau__camera">
        {status === 'ready' ? (
          <video ref={videoRef} className="plateau__video" autoPlay muted playsInline />
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

      {/* Mock du champ/contrechamp : suit la réplique active en attendant shots.json (S3) */}
      <p className={`plateau__shot ${youOnScreen ? 'plateau__shot--you' : ''}`}>
        À l’image : {youOnScreen ? `toi (${you.name})` : other.name}
      </p>

      {countdownStep && (
        <div className="plateau__countdown" aria-live="assertive">
          <span key={countdownStep}>{countdownStep}</span>
        </div>
      )}

      <footer className="plateau__bottom">
        <KaraokeBar active={lines.active} next={lines.next} />
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
