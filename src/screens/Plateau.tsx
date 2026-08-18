import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import fixWebmDuration from 'fix-webm-duration'
import { getScene, karaokeLines, type KaraokeLine } from '../data/scenes'
import { setTake } from '../data/takes'
import { KaraokeBar } from '../components/KaraokeBar'
import { Button } from '../components/Button'
import { useCamera } from '../hooks/useCamera'
import { useSceneData } from '../hooks/useSceneData'
import { AudioMix, type AudioMode } from '../lib/audioMix'
import {
  CANVAS_H,
  CANVAS_W,
  drawFrame,
  type CompositorScene,
  type FramePhase,
} from '../lib/compositor'
import { pickRecordingFormat } from '../lib/recorder'
import { cueAfter, cueAt, shotAt, type Cue, type Shot } from '../lib/sceneEngine'
import { formatTimecode } from '../lib/timecode'
import './Plateau.css'

type Phase = 'preview' | 'countdown' | 'recording' | 'endcard'

const COUNTDOWN_STEPS = ['3', '2', '1', 'ACTION'] as const
const COUNTDOWN_STEP_MS = 800
const END_CARD_MS = 1800

type SyncView = { active: Cue | null; next: Cue | null; shot: Shot | null }

export function Plateau() {
  const { id } = useParams()
  const scene = getScene(id)
  const sceneData = useSceneData(scene.id)
  const media = sceneData.status === 'ready' ? sceneData.media : null
  const [searchParams] = useSearchParams()
  const roleId = searchParams.get('role')
  const mode: AudioMode = searchParams.get('mode') === 'solo' ? 'solo' : 'playback'
  const navigate = useNavigate()
  const { status, stream, request } = useCamera()

  const characters = media?.characters ?? scene.characters
  const you = characters.find((c) => c.id === roleId) ?? characters[0]
  const other = characters.find((c) => c.id !== you.id) ?? characters[1]

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const refVideoRef = useRef<HTMLVideoElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioMixRef = useRef<AudioMix | null>(null)
  const phaseRef = useRef<Phase>('preview')
  const recordStartRef = useRef(0)

  const [phase, setPhase] = useState<Phase>('preview')
  const [countdownStep, setCountdownStep] = useState<string | null>(null)
  const [elapsedS, setElapsedS] = useState(0)
  const [recordError, setRecordError] = useState(false)
  const [interrupted, setInterrupted] = useState(false)
  const [syncView, setSyncView] = useState<SyncView | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const compositorScene: CompositorScene | null = useMemo(() => {
    if (!media) return null
    return {
      cues: media.cues,
      shots: media.shots,
      youId: you.id,
      speakerName: (characterId) => media.characters.find((c) => c.id === characterId)?.name ?? '',
      filmCredit: `d’après ${scene.film}`,
    }
  }, [media, you.id, scene.film])

  // Aperçu caméra : le flux alimente une <video> cachée, dessinée sur le canvas
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  // Boucle de rendu : le canvas est l'écran ET la vidéo exportée (WYSIWYG)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    let raf = 0
    const tick = () => {
      const tMs = (refVideoRef.current?.currentTime ?? 0) * 1000
      const framePhase: FramePhase =
        phaseRef.current === 'recording'
          ? 'recording'
          : phaseRef.current === 'endcard'
            ? 'endcard'
            : 'preview'
      drawFrame(
        ctx,
        { cam: videoRef.current, ref: refVideoRef.current },
        compositorScene,
        tMs,
        framePhase,
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [compositorScene])

  const finishRecording = useCallback(() => {
    refVideoRef.current?.pause()
    recorderRef.current?.stop()
  }, [])

  const startRecording = useCallback(() => {
    const format = pickRecordingFormat()
    const canvas = canvasRef.current
    if (!format || !stream || !canvas) {
      setRecordError(true)
      setPhase('preview')
      return
    }
    chunksRef.current = []

    const mix = audioMixRef.current
    const tracks = [...canvas.captureStream(30).getVideoTracks(), ...(mix?.audioTracks ?? [])]
    const recorder = new MediaRecorder(new MediaStream(tracks), {
      mimeType: format.mimeType,
      videoBitsPerSecond: 4_000_000,
    })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      let blob = new Blob(chunksRef.current, { type: format.mimeType })
      // Bug connu MediaRecorder : durée absente du WebM → on la réécrit dans l'en-tête
      if (format.extension === 'webm') {
        const durationMs = Date.now() - recordStartRef.current
        try {
          blob = await fixWebmDuration(blob, durationMs, { logger: false })
        } catch {
          // en-tête irréparable : on garde le blob brut
        }
      }
      setTake({ sceneId: scene.id, blob, extension: format.extension })
      navigate({ pathname: `/dailies/${scene.id}`, search: searchParams.toString() })
    }
    recorder.start()
    recorderRef.current = recorder
    recordStartRef.current = Date.now()
    setElapsedS(0)
    setPhase('recording')

    const ref = refVideoRef.current
    if (ref) {
      ref.currentTime = 0
      // Le son de la réf passe par le mixage WebAudio, pas par l'élément
      ref.muted = false
      ref.play().catch(() => {})
    }
  }, [navigate, scene.id, stream, searchParams, setPhase, setRecordError, setElapsedS])

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

  // Synchro karaoké/plans (affichage DOM) + niveaux audio (ducking Playback)
  useEffect(() => {
    if (phase !== 'recording' || !media) return
    let raf = 0
    const tick = () => {
      const tMs = (refVideoRef.current?.currentTime ?? 0) * 1000
      const active = cueAt(media.cues, tMs)
      const next = cueAfter(media.cues, tMs)
      const shot = shotAt(media.shots, tMs)
      audioMixRef.current?.setLevels(mode, active?.character === you.id)
      setSyncView((prev) =>
        prev && prev.active === active && prev.next === next && prev.shot === shot
          ? prev
          : { active, next, shot },
      )
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, media, mode, you.id])

  // Fin de la référence → carton de fin (mention parodie) → Coupez automatique
  useEffect(() => {
    if (phase !== 'recording' || !media) return
    const ref = refVideoRef.current
    if (!ref) return
    const onEnded = () => setPhase('endcard')
    ref.addEventListener('ended', onEnded)
    return () => ref.removeEventListener('ended', onEnded)
  }, [phase, media, setPhase])

  useEffect(() => {
    if (phase !== 'endcard') return
    const timeout = setTimeout(finishRecording, END_CARD_MS)
    return () => clearTimeout(timeout)
  }, [phase, finishRecording])

  // Onglet masqué pendant la prise = enregistrement mort (le canvas ne se
  // dessine plus). On annule proprement et on prévient, plutôt que de
  // laisser croire que la prise continue.
  useEffect(() => {
    if (phase !== 'recording' && phase !== 'endcard') return
    const onVisibilityChange = () => {
      if (!document.hidden) return
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') {
        recorder.ondataavailable = null
        recorder.onstop = null
        recorder.stop()
      }
      refVideoRef.current?.pause()
      setInterrupted(true)
      setPhase('preview')
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [phase, setPhase, setInterrupted])

  // On arrête proprement même si on quitte l'écran
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.ondataavailable = null
        recorderRef.current.onstop = null
        recorderRef.current.stop()
      }
      audioMixRef.current?.close()
      audioMixRef.current = null
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

  const isRecording = phase === 'recording' || phase === 'endcard'

  const toLine = (cue: Cue | null): KaraokeLine | null =>
    cue && {
      text: cue.text,
      speaker: characters.find((c) => c.id === cue.character)?.name ?? '',
      isYou: cue.character === you.id,
    }

  // Avec média : synchro réelle (aperçu = début de scène). Sans : mock statique (S1).
  const mockLines = karaokeLines(scene, roleId)
  const activeLine = media
    ? toLine(phase === 'recording' ? (syncView?.active ?? null) : cueAt(media.cues, 0))
    : mockLines.active
  const nextLine = media
    ? toLine(phase === 'recording' ? (syncView?.next ?? null) : cueAfter(media.cues, 0))
    : mockLines.next

  const youOnScreen = media
    ? phase === 'recording'
      ? syncView?.shot?.character === you.id
      : (shotAt(media.shots, 0)?.character ?? you.id) === you.id
    : (activeLine?.isYou ?? true)

  const onMoteur = () => {
    setInterrupted(false)
    // Tout ce qui exige un geste utilisateur s'amorce ici (autoplay + WebAudio Safari)
    if (!audioMixRef.current) {
      audioMixRef.current = new AudioMix()
      if (stream) audioMixRef.current.attachMic(stream)
      if (refVideoRef.current) audioMixRef.current.attachRef(refVideoRef.current)
    }
    audioMixRef.current.resume()
    audioMixRef.current.setLevels(mode, false)
    const ref = refVideoRef.current
    if (ref) {
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
  }

  return (
    <div className="plateau">
      <div className="plateau__camera">
        <canvas ref={canvasRef} className="plateau__canvas" width={CANVAS_W} height={CANVAS_H} />
        {media && (
          <video
            ref={refVideoRef}
            src={media.videoUrl}
            className="plateau__source"
            playsInline
            preload="auto"
          />
        )}
        {status === 'ready' ? (
          <video ref={videoRef} className="plateau__source" autoPlay muted playsInline />
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
        {/* Le karaoké visible est dessiné sur le canvas ; cette copie DOM reste
            pour les lecteurs d'écran et les tests (masquée visuellement). */}
        <div className={media ? 'plateau__karaoke-sr' : undefined}>
          <KaraokeBar active={activeLine} next={nextLine} />
        </div>
        {recordError && (
          <p className="plateau__record-error">Ta vidéo n’a pas pu démarrer. Réessaie.</p>
        )}
        {interrupted && (
          <p className="plateau__record-error">
            Onglet quitté pendant la prise : elle est perdue. Moteur pour la refaire ?
          </p>
        )}
        {isRecording ? (
          <button
            type="button"
            className="plateau__stop"
            aria-label="Coupez"
            onClick={finishRecording}
          >
            <span className="plateau__stop-square" aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="plateau__stop"
            aria-label="Moteur"
            disabled={status !== 'ready' || phase === 'countdown'}
            onClick={onMoteur}
          >
            <span className="plateau__rec-circle" aria-hidden="true" />
          </button>
        )}
      </footer>
    </div>
  )
}
