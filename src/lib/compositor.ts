// Compositeur : dessine chaque frame de la vidéo finale sur un canvas unique 9:16.
// Source plein cadre selon le plan (réf ↔ webcam miroir), filigrane, carton de fin.
// Le karaoké n'apparaît JAMAIS ici : c'est un prompteur d'écran, pas un élément du film.
import { APP_NAME } from '../config'
import { shotAt, type Shot } from './sceneEngine'

export const CANVAS_W = 720
export const CANVAS_H = 1280

const COLORS = {
  bg: '#0a0a0b',
  ink: '#f4f1ea',
  ink50: 'rgba(244, 241, 234, 0.5)',
}

// Cadrage « cover » : remplit dst en gardant les proportions de src (crop centré).
export function computeCoverRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { sx: number; sy: number; sw: number; sh: number } {
  if (srcW <= 0 || srcH <= 0) return { sx: 0, sy: 0, sw: srcW, sh: srcH }
  const scale = Math.max(dstW / srcW, dstH / srcH)
  const sw = dstW / scale
  const sh = dstH / scale
  return { sx: (srcW - sw) / 2, sy: (srcH - sh) / 2, sw, sh }
}

export type CompositorScene = {
  shots: Shot[]
  youId: string
  filmCredit: string
}

export type FrameSources = {
  cam: HTMLVideoElement | null
  ref: HTMLVideoElement | null
}

function drawSource(ctx: CanvasRenderingContext2D, video: HTMLVideoElement, mirrored: boolean) {
  const { sx, sy, sw, sh } = computeCoverRect(
    video.videoWidth,
    video.videoHeight,
    CANVAS_W,
    CANVAS_H,
  )
  if (!sw || !sh) return
  ctx.save()
  if (mirrored) {
    ctx.translate(CANVAS_W, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H)
  ctx.restore()
}

function drawWatermark(ctx: CanvasRenderingContext2D, filmCredit: string) {
  ctx.save()
  ctx.globalAlpha = 0.85
  ctx.textAlign = 'left'
  ctx.font = '400 34px "Archivo Black", Archivo, sans-serif'
  ctx.fillStyle = COLORS.ink
  ctx.fillText(APP_NAME, 32, CANVAS_H - 88)
  ctx.font = '400 20px "JetBrains Mono", monospace'
  ctx.fillStyle = COLORS.ink50
  ctx.fillText(filmCredit, 32, CANVAS_H - 52)
  ctx.restore()
}

function drawEndCard(ctx: CanvasRenderingContext2D, filmCredit: string) {
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
  ctx.textAlign = 'center'
  ctx.font = '400 64px "Archivo Black", Archivo, sans-serif'
  ctx.fillStyle = COLORS.ink
  ctx.fillText(APP_NAME, CANVAS_W / 2, CANVAS_H / 2 - 40)
  ctx.font = '400 26px "JetBrains Mono", monospace'
  ctx.fillStyle = COLORS.ink50
  ctx.fillText(`Parodie — ${filmCredit}`, CANVAS_W / 2, CANVAS_H / 2 + 24)
  ctx.fillText('recréée par nos comédiens', CANVAS_W / 2, CANVAS_H / 2 + 64)
}

export type FramePhase = 'preview' | 'recording' | 'endcard'

// Dessine une frame complète. tMs = temps de la référence (0 en preview sans réf).
export function drawFrame(
  ctx: CanvasRenderingContext2D,
  sources: FrameSources,
  scene: CompositorScene | null,
  tMs: number,
  phase: FramePhase,
) {
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

  if (phase === 'endcard') {
    drawEndCard(ctx, scene?.filmCredit ?? '')
    return
  }

  const shot = scene && phase === 'recording' ? shotAt(scene.shots, tMs) : null
  const showRef =
    phase === 'recording' && scene !== null && sources.ref !== null && shot !== null
      ? shot.character !== scene.youId
      : false

  if (showRef && sources.ref) {
    drawSource(ctx, sources.ref, false)
  } else if (sources.cam && sources.cam.readyState >= 2) {
    drawSource(ctx, sources.cam, true)
  }

  if (scene) {
    drawWatermark(ctx, scene.filmCredit)
  }
}
