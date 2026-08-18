import type { KaraokeLine } from '../data/scenes'
import { splitWords } from '../lib/karaoke'
import './KaraokeBar.css'

// Prompteur : visible pendant la prise, jamais dans l'export.
// Le surlignage balaye la réplique mot à mot (litCount = nombre de mots dits).
// litCount absent → ligne entière allumée (scènes mock, aperçu simple).
export function KaraokeBar({
  active,
  next,
  litCount,
}: {
  active: KaraokeLine | null
  next: KaraokeLine | null
  litCount?: number
}) {
  const words = active ? splitWords(active.text) : []
  const lit = litCount ?? words.length

  return (
    <div className="karaoke">
      <p className="karaoke__speaker">{active ? (active.isYou ? 'À toi' : active.speaker) : ' '}</p>
      <p className={`karaoke__active ${active?.isYou ? 'karaoke__active--you' : ''}`}>
        {active
          ? words.map((word, i) => (
              <span key={i} className={`karaoke__word ${i < lit ? 'karaoke__word--lit' : ''}`}>
                {word}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            ))
          : '…'}
      </p>
      <p className="karaoke__next">{next?.text ?? ' '}</p>
    </div>
  )
}
