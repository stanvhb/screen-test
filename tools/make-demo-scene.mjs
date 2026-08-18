// Génère public/scenes/<id>/ : une vidéo mire (perso A / perso B en alternance,
// chrono incrusté) + meta/cues/shots alignés dessus.
// Usage : node tools/make-demo-scene.mjs [demo|demo2]
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const SCENES = {
  demo: {
    title: 'La scène témoin',
    film: 'Mire de test (générée)',
    durationMs: 20_000,
    segmentMs: 2_500,
    colors: ['#5a2320', '#1f2a4a'],
    // Plans écrits à la main : coupes de réaction (image ≠ parole)
    shots: [
      { character: 'a', startMs: 0, endMs: 2500 },
      { character: 'b', startMs: 2500, endMs: 3600 },
      { character: 'a', startMs: 3600, endMs: 5000 },
      { character: 'a', startMs: 5000, endMs: 7500 },
      { character: 'b', startMs: 7500, endMs: 10000 },
      { character: 'b', startMs: 10000, endMs: 11300 },
      { character: 'a', startMs: 11300, endMs: 12500 },
      { character: 'b', startMs: 12500, endMs: 15000 },
      { character: 'a', startMs: 15000, endMs: 17500 },
      { character: 'b', startMs: 17500, endMs: 20000 },
    ],
  },
  demo2: {
    title: 'La contre-mire',
    film: 'Mire de test n° 2 (générée)',
    durationMs: 12_000,
    segmentMs: 2_000,
    colors: ['#1f3a24', '#3a1f38'],
    shots: null, // plans = segments de parole
  },
}

const id = process.argv[2] ?? 'demo'
const config = SCENES[id]
if (!config) {
  console.error(`Scène inconnue « ${id} » — choix : ${Object.keys(SCENES).join(', ')}`)
  process.exit(1)
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'scenes', id)
mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage()

const { b64, mime } = await page.evaluate(
  async ({ durationMs, segmentMs, colors }) => {
    const canvas = document.createElement('canvas')
    canvas.width = 720
    canvas.height = 1280
    const ctx = canvas.getContext('2d')
    const stream = canvas.captureStream(30)

    // Piste audio : bips pendant les « répliques » (A grave, B aigu) pour que
    // l'analyse automatique (détection de parole) ait de la matière.
    const audioCtx = new AudioContext()
    await audioCtx.resume()
    const dest = audioCtx.createMediaStreamDestination()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    gain.gain.value = 0
    osc.connect(gain)
    gain.connect(dest)
    osc.start()
    const segCount = Math.floor(durationMs / segmentMs)
    for (let i = 0; i < segCount; i++) {
      const t0 = audioCtx.currentTime + (i * segmentMs) / 1000
      const t1 = audioCtx.currentTime + ((i + 1) * segmentMs - 400) / 1000
      osc.frequency.setValueAtTime(i % 2 === 0 ? 440 : 660, t0)
      gain.gain.setValueAtTime(0.4, t0)
      gain.gain.setValueAtTime(0, t1)
    }
    stream.addTrack(dest.stream.getAudioTracks()[0])

    const candidates = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm']
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
        ctx.fillStyle = isA ? colors[0] : colors[1]
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
  { durationMs: config.durationMs, segmentMs: config.segmentMs, colors: config.colors },
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

const segments = Math.floor(config.durationMs / config.segmentMs)
const cues = Array.from({ length: segments }, (_, i) => ({
  text: `Réplique ${i + 1} — ${i % 2 === 0 ? 'Perso A' : 'Perso B'} parle.`,
  character: i % 2 === 0 ? 'a' : 'b',
  startMs: i * config.segmentMs,
  endMs: (i + 1) * config.segmentMs - 400, // silence entre les répliques (détectable par l'analyse)
}))

const shots =
  config.shots ??
  Array.from({ length: segments }, (_, i) => ({
    character: i % 2 === 0 ? 'a' : 'b',
    startMs: i * config.segmentMs,
    endMs: (i + 1) * config.segmentMs,
  }))

writeFileSync(
  join(outDir, 'meta.json'),
  JSON.stringify(
    {
      title: config.title,
      film: config.film,
      credits: 'Générée par tools/make-demo-scene.mjs',
      durationS: Math.round(config.durationMs / 1000),
      characters,
    },
    null,
    2,
  ),
)
writeFileSync(join(outDir, 'cues.json'), JSON.stringify(cues, null, 2))
writeFileSync(join(outDir, 'shots.json'), JSON.stringify(shots, null, 2))

console.log(`OK — ${outDir} (video.mp4 ${mime}, ${cues.length} cues, ${shots.length} shots)`)
