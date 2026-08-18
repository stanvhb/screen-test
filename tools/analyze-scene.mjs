// Analyse automatique d'une vidéo de référence — tout en local, rien ne sort du Mac.
//   1. Détection des coupes (ffmpeg)            → shots.draft.json (personnages à attribuer)
//   2. Transcription locale (whisper-cli)        → cues.draft.json (texte + temps réels)
//      Fallback sans whisper : détection de parole (ffmpeg silencedetect), texte placeholder.
// Les brouillons s'importent ensuite dans /timer pour attribuer A/B et ajuster.
//
// Usage : node tools/analyze-scene.mjs <video> [dossier-sortie] [--seuil=0.1] [--scene=<id>]
//   --seuil : sensibilité de détection des coupes (défaut 0.1 — surdétecte plutôt
//             que de rater ; les fausses coupes se suppriment en un geste dans /timer)
//   --scene : intégration complète — crée public/scenes/<id>/ (vidéo, meta, cues,
//             shots + brouillons) et ajoute la scène au manifest : jouable direct.
// Modèle whisper attendu dans ~/.cache/whisper-cpp/ggml-base.bin (ou $WHISPER_MODEL).
// Attribution a/b : séparation des deux voix par hauteur ; A↔B se permute dans /timer.
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const seuil = Number(process.argv.find((a) => a.startsWith('--seuil='))?.split('=')[1] ?? '0.1')
const sceneId = process.argv.find((a) => a.startsWith('--scene='))?.split('=')[1] ?? null
const video = args[0]
if (!video || !existsSync(video)) {
  console.error('Usage : node tools/analyze-scene.mjs <video> [dossier-sortie] [--seuil=0.1]')
  process.exit(1)
}
const outDir = args[1] ?? '.'
mkdirSync(outDir, { recursive: true })

function run(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
}

// ffmpeg écrit ses analyses (showinfo, silencedetect) sur stderr, même en succès
function ffmpegStderr(args) {
  const result = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return result.stderr ?? ''
}

const durationS = Number(
  run('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=nw=1:nk=1',
    video,
  ]).trim(),
)
const durationMs = Math.round(durationS * 1000)

// ---- 1. Plans : détection de coupes -----------------------------------------
const sceneOut = ffmpegStderr([
  '-i',
  video,
  '-vf',
  `select='gt(scene,${seuil})',showinfo`,
  '-an',
  '-f',
  'null',
  '-',
])
const cutTimes = [...sceneOut.matchAll(/pts_time:([0-9.]+)/g)]
  .map((m) => Math.round(Number(m[1]) * 1000))
  .filter((t, i, arr) => t > 100 && (i === 0 || t - arr[i - 1] > 200))

const bounds = [0, ...cutTimes, durationMs]
const shots = []
for (let i = 0; i < bounds.length - 1; i++) {
  if (bounds[i + 1] - bounds[i] > 150) {
    shots.push({ character: '?', startMs: bounds[i], endMs: bounds[i + 1] })
  }
}

// ---- 2. Répliques : transcription (whisper) ou détection de parole ----------
const wav = join(tmpdir(), `analyze-${Date.now()}.wav`)
run('ffmpeg', ['-y', '-v', 'error', '-i', video, '-ar', '16000', '-ac', '1', wav])

let cues = []
const model = process.env.WHISPER_MODEL ?? join(homedir(), '.cache', 'whisper-cpp', 'ggml-base.bin')
let whisperUsed = false
try {
  if (existsSync(model)) {
    const jsonBase = join(tmpdir(), `analyze-${Date.now()}`)
    run('whisper-cli', ['-m', model, '-l', 'fr', '-oj', '-of', jsonBase, '-np', wav])
    const result = JSON.parse(readFileSync(`${jsonBase}.json`, 'utf8'))
    cues = (result.transcription ?? [])
      .map((seg) => ({
        text: (seg.text ?? '').trim(),
        character: '?',
        startMs: Math.max(0, seg.offsets?.from ?? 0),
        endMs: Math.min(durationMs, seg.offsets?.to ?? 0),
      }))
      .filter((c) => c.text && c.endMs > c.startMs)
    whisperUsed = cues.length > 0
    rmSync(`${jsonBase}.json`, { force: true })
  }
} catch {
  // whisper indisponible ou en échec : on retombe sur la détection de parole
}

// Un seul segment qui couvre presque tout ? Suspect pour un dialogue (sons non
// parlés, hallucination) : la détection de parole fera mieux.
if (whisperUsed && cues.length === 1 && cues[0].endMs - cues[0].startMs > durationMs * 0.8) {
  whisperUsed = false
}

if (!whisperUsed) {
  const silenceOut = ffmpegStderr([
    '-i',
    wav,
    '-af',
    'silencedetect=noise=-35dB:d=0.35',
    '-f',
    'null',
    '-',
  ])
  const starts = [...silenceOut.matchAll(/silence_start: ([0-9.]+)/g)].map(
    (m) => Number(m[1]) * 1000,
  )
  const ends = [...silenceOut.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]) * 1000)
  // la parole vit entre les silences
  const speech = []
  let cursor = 0
  const silences = starts.map((s, i) => [s, ends[i] ?? durationMs])
  for (const [s, e] of silences) {
    if (s - cursor > 250) speech.push([cursor, s])
    cursor = e
  }
  if (durationMs - cursor > 250) speech.push([cursor, durationMs])
  cues = speech.map(([startMs, endMs], i) => ({
    text: `Réplique ${i + 1} — à remplacer`,
    character: '?',
    startMs: Math.round(startMs),
    endMs: Math.round(endMs),
  }))
}

// ---- 3. Qui parle ? Séparation des deux voix par hauteur --------------------
function readWavMono16(path) {
  const buf = readFileSync(path)
  let offset = 12
  while (offset + 8 <= buf.length) {
    const id = buf.toString('ascii', offset, offset + 4)
    const size = buf.readUInt32LE(offset + 4)
    if (id === 'data') {
      const count = Math.floor(size / 2)
      const samples = new Float32Array(count)
      for (let i = 0; i < count; i++) samples[i] = buf.readInt16LE(offset + 8 + i * 2) / 32768
      return samples
    }
    offset += 8 + size + (size % 2)
  }
  return new Float32Array(0)
}

const SAMPLE_RATE = 16000
// Hauteur (Hz) d'une fenêtre par autocorrélation — 60 à 500 Hz (voix humaine)
function windowPitch(samples, start) {
  const N = 1024
  if (start + 2 * N > samples.length) return null
  let energy = 0
  for (let i = 0; i < N; i++) energy += samples[start + i] * samples[start + i]
  if (energy / N < 1e-5) return null // silence
  const minLag = Math.floor(SAMPLE_RATE / 500)
  const maxLag = Math.floor(SAMPLE_RATE / 60)
  const corrs = new Float64Array(maxLag + 1)
  let bestCorr = 0
  for (let lag = minLag; lag <= maxLag; lag++) {
    let corr = 0
    for (let i = 0; i < N; i++) corr += samples[start + i] * samples[start + i + lag]
    corrs[lag] = corr
    if (corr > bestCorr) bestCorr = corr
  }
  if (bestCorr / energy < 0.3) return null
  // Sons périodiques : des pics quasi égaux à chaque multiple de la période —
  // la vraie hauteur est le PLUS PETIT décalage parmi les meilleurs.
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (corrs[lag] >= 0.9 * bestCorr) return SAMPLE_RATE / lag
  }
  return null
}

function segmentPitch(samples, startMs, endMs) {
  const from = Math.floor((startMs / 1000) * SAMPLE_RATE)
  const to = Math.floor((endMs / 1000) * SAMPLE_RATE)
  const pitches = []
  for (let pos = from; pos + 2048 < to; pos += 800) {
    const p = windowPitch(samples, pos)
    if (p) pitches.push(p)
  }
  if (pitches.length === 0) return null
  pitches.sort((x, y) => x - y)
  return pitches[Math.floor(pitches.length / 2)] // médiane
}

const samples = readWavMono16(wav)
const pitches = cues.map((c) => segmentPitch(samples, c.startMs, c.endMs))
const known = pitches.filter((p) => p !== null)
let voicesSeparated = false
if (known.length >= 2) {
  // Regroupement en 2 voix (2-moyennes en une dimension)
  let low = Math.min(...known)
  let high = Math.max(...known)
  for (let iter = 0; iter < 10; iter++) {
    const groupLow = known.filter((p) => Math.abs(p - low) <= Math.abs(p - high))
    const groupHigh = known.filter((p) => Math.abs(p - low) > Math.abs(p - high))
    if (groupLow.length === 0 || groupHigh.length === 0) break
    low = groupLow.reduce((a, b) => a + b, 0) / groupLow.length
    high = groupHigh.reduce((a, b) => a + b, 0) / groupHigh.length
  }
  const separation = (high - low) / ((high + low) / 2)
  if (separation > 0.12) {
    voicesSeparated = true
    cues.forEach((cue, i) => {
      const p = pitches[i]
      if (p !== null) {
        cue.character = Math.abs(p - low) <= Math.abs(p - high) ? 'a' : 'b'
      }
    })
    // segments sans hauteur détectée : on suit le voisin précédent
    cues.forEach((cue, i) => {
      if (cue.character === '?') cue.character = cues[i - 1]?.character ?? 'a'
    })
  }
}
if (!voicesSeparated) {
  // Voix trop proches : alternance simple, à vérifier dans /timer
  cues.forEach((cue, i) => {
    cue.character = i % 2 === 0 ? 'a' : 'b'
  })
}

// ---- 4. Plans : préremplis par « le plan montre celui qui parle » ------------
function overlapMs(a1, a2, b1, b2) {
  return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1))
}
let lastCharacter = 'a'
for (const shot of shots) {
  let best = null
  let bestOverlap = 0
  for (const cue of cues) {
    const o = overlapMs(shot.startMs, shot.endMs, cue.startMs, cue.endMs)
    if (o > bestOverlap) {
      bestOverlap = o
      best = cue
    }
  }
  shot.character = best ? best.character : lastCharacter
  lastCharacter = shot.character
}

rmSync(wav, { force: true })

const cuesPath = join(outDir, 'cues.draft.json')
const shotsPath = join(outDir, 'shots.draft.json')
writeFileSync(cuesPath, JSON.stringify(cues, null, 2))
writeFileSync(shotsPath, JSON.stringify(shots, null, 2))

console.log(`Analyse de ${basename(video)} (${(durationMs / 1000).toFixed(1)} s) :`)
console.log(`- ${shots.length} plans détectés → ${shotsPath}`)
console.log(
  `- ${cues.length} répliques ${whisperUsed ? 'transcrites (whisper)' : 'détectées (parole, texte à remplacer)'} → ${cuesPath}`,
)
console.log(
  voicesSeparated
    ? '- voix séparées automatiquement (a = voix grave, b = voix aiguë) — vérifie et permute A↔B dans /timer si inversé'
    : '- ⚠ voix trop proches pour être séparées : attribution en alternance, à vérifier dans /timer',
)

// ---- 5. Intégration complète (--scene=<id>) ---------------------------------
if (sceneId) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  const sceneDir = join(root, 'public', 'scenes', sceneId)
  mkdirSync(sceneDir, { recursive: true })
  copyFileSync(video, join(sceneDir, 'video.mp4'))
  writeFileSync(join(sceneDir, 'cues.json'), JSON.stringify(cues, null, 2))
  writeFileSync(join(sceneDir, 'shots.json'), JSON.stringify(shots, null, 2))
  const metaPath = join(sceneDir, 'meta.json')
  if (!existsSync(metaPath)) {
    writeFileSync(
      metaPath,
      JSON.stringify(
        {
          title: sceneId,
          film: 'À compléter',
          credits: 'À compléter',
          durationS: Math.round(durationMs / 1000),
          characters: [
            { id: 'a', name: 'Perso A' },
            { id: 'b', name: 'Perso B' },
          ],
        },
        null,
        2,
      ),
    )
  }
  const manifestPath = join(root, 'public', 'scenes', 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  if (!manifest.scenes.includes(sceneId)) {
    manifest.scenes.push(sceneId)
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
  }
  console.log(`→ Scène « ${sceneId} » intégrée : ${sceneDir} + manifest. Jouable immédiatement.`)
  console.log('  Reste : titre/film/personnages dans meta.json, textes dans cues.json.')
} else {
  console.log('→ Importe ces brouillons dans /timer pour vérifier, ou relance avec --scene=<id>.')
}
