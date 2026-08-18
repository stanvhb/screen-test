// Négociation explicite du format d'enregistrement (CLAUDE.md : pas de VP9 supposé,
// Safari ne sait pas produire de WebM — il sortira du MP4).
export type RecordingFormat = { mimeType: string; extension: 'webm' | 'mp4' }

const CANDIDATES: RecordingFormat[] = [
  { mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' },
  { mimeType: 'video/webm', extension: 'webm' },
  { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' },
  { mimeType: 'video/mp4', extension: 'mp4' },
]

export function pickRecordingFormat(
  isSupported: (type: string) => boolean = (type) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type),
): RecordingFormat | null {
  return CANDIDATES.find((candidate) => isSupported(candidate.mimeType)) ?? null
}
