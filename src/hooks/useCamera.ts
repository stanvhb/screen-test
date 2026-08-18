import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'asking' | 'ready' | 'denied' | 'unavailable'

async function acquireStream(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: true,
    })
  } catch (err) {
    // Pas de micro ? On tourne quand même, en muet.
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      return navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    }
    throw err
  }
}

export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('asking')
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [attempt, setAttempt] = useState(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    acquireStream()
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = media
        setStream(media)
        setStatus('ready')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setStream(null)
        setStatus(
          err instanceof DOMException &&
            (err.name === 'NotAllowedError' || err.name === 'SecurityError')
            ? 'denied'
            : 'unavailable',
        )
      })
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [attempt])

  const request = useCallback(() => {
    setStatus('asking')
    setAttempt((n) => n + 1)
  }, [])

  return { status, stream, request }
}
