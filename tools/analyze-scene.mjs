// Analyse automatique d'une vidéo de référence — tout en local, rien ne sort du Mac.
//   1. Détection des coupes (ffmpeg)            → shots.draft.json (personnages à attribuer)
//   2. Transcription locale (whisper-cli)        → cues.draft.json (texte + temps réels)
//      Fallback sans whisper : détection de parole (ffmpeg silencedetect), texte placeholder.
// Les brouillons s'importent ensuite dans /timer pour attribuer A/B et ajuster.
//
// Usage : node tools/analyze-scene.mjs <video> [dossier-sortie] [--seuil=0.1]
//   --seuil : sensibilité de détection des coupes (défaut 0.1 — surdétecte plutôt
//             que de rater ; les fausses coupes se suppriment en un geste dans /timer)
// Modèle whisper attendu dans ~/.cache/whisper-cpp/ggml-base.bin (ou $WHISPER_MODEL).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, join } from 'node:path'

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const seuil = Number(process.argv.find((a) => a.startsWith('--seuil='))?.split('=')[1] ?? '0.1')
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
console.log('→ Importe ces brouillons dans /timer pour attribuer A/B et ajuster.')
