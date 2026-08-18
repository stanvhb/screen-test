// Génère public/scenes/demo/ : une vidéo mire (perso A / perso B en alternance,
// chrono incrusté) + cues.json / shots.json alignés dessus.
// Usage : node tools/make-demo-scene.mjs
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'scenes', 'demo')
mkdirSync(outDir, { recursive: true })

const DURATION_MS = 20_000
const SEGMENT_MS = 2_500 // A puis B, en alternance

const browser = await chromium.launch()
const page = await browser.newPage()

const { b64, mime } = await page.evaluate(
  async ({ durationMs, segmentMs }) => {
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 1280
    const ctx = canvas.getContext('2d')
    const stream = canvas.captureStream(30)

    const candidates = ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp8']
    const mime = candidates.find((c) => MediaRecorder.isTypeSupported(c))
    if (!mime) throw new Error('aucun format MediaRecorder supporté')

    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_000_000 })
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    const stopped = new Promise((resolve) => {
      recorder.onstop = resolve
    })

    const start = performance.now()
    recorder.start()
    await new Promise((resolve) => {
      function draw() {
        const t = performance.now() - start
        const segment = Math.floor(t / segmentMs)
        const isA = segment % 2 === 0
        ctx.fillStyle = isA ? '#5a2320' : '#1f2a4a'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = '#f4f1ea'
        ctx.textAlign = 'center'
        ctx.font = '900 260px sans-serif'
        ctx.fillText(isA ? 'A' : 'B', 360, 620)
        ctx.font = '400 56px monospace'
        ctx.fillText(`${(t / 1000).toFixed(1)} s`, 360, 780)
        ctx.font = '400 40px monospace'
        ctx.fillText(`réplique ${segment + 1}`, 360, 860)
        if (t < durationMs) {
          requestAnimationFrame(draw)
        } else {
          recorder.stop()
          resolve()
        }
      }
      draw()
    })
    await stopped

    const blob = new Blob(chunks, { type: mime })
    const bytes = new Uint8Array(await blob.arrayBuffer())
    let binary = ''
    const CHUNK = 0x8000
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
    }
    return { b64: btoa(binary), mime }
  },
  { durationMs: DURATION_MS, segmentMs: SEGMENT_MS },
)

await browser.close()

if (!mime.startsWith('video/mp4')) {
  throw new Error(
    `MP4 indisponible dans chromium headless (obtenu : ${mime}) — Safari ne lira pas la réf.`,
  )
}

writeFileSync(join(outDir, 'video.mp4'), Buffer.from(b64, 'base64'))

const characters = [
  { id: 'a', name: 'Perso A' },
  { id: 'b', name: 'Perso B' },
]

const segments = Math.floor(DURATION_MS / SEGMENT_MS)
const cues = Array.from({ length: segments }, (_, i) => ({
  text: `Réplique ${i + 1} — ${i % 2 === 0 ? 'Perso A' : 'Perso B'} parle.`,
  character: i % 2 === 0 ? 'a' : 'b',
  startMs: i * SEGMENT_MS,
  endMs: (i + 1) * SEGMENT_MS - 200, // petit silence entre les répliques
}))
const shots = Array.from({ length: segments }, (_, i) => ({
  character: i % 2 === 0 ? 'a' : 'b',
  startMs: i * SEGMENT_MS,
  endMs: (i + 1) * SEGMENT_MS,
}))

writeFileSync(
  join(outDir, 'meta.json'),
  JSON.stringify(
    {
      title: 'La scène témoin',
      film: 'Mire de test (générée)',
      credits: 'Générée par tools/make-demo-scene.mjs',
      characters,
    },
    null,
    2,
  ),
)
writeFileSync(join(outDir, 'cues.json'), JSON.stringify(cues, null, 2))
writeFileSync(join(outDir, 'shots.json'), JSON.stringify(shots, null, 2))

console.log(`OK — ${outDir} (video.mp4 ${mime}, ${segments} cues/shots)`)
