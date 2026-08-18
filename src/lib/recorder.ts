// Négociation explicite du format d'enregistrement (CLAUDE.md : pas de VP9 supposé).
// MP4 d'abord (décision du 18/08 : lisible partout, Photos iOS compris),
// WebM/VP8 en secours pour les navigateurs qui ne savent pas produire de MP4.
export type RecordingFormat = { mimeType: string; extension: 'webm' | 'mp4' }

const CANDIDATES: RecordingFormat[] = [
  { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
  { mimeType: 'video/mp4', extension: 'mp4' },
  { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
  { mimeType: 'video/webm', extension: 'webm' },
]

export function pickRecordingFormat(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type),
): RecordingFormat | null {
  return CANDIDATES.find((candidate) => isSupported(candidate.mimeType)) ?? null
}
