import type { KaraokeLine } from '../data/scenes'
import './KaraokeBar.css'

// Ta réplique active = jaune gaffer ; celle de l'autre = claire.
// Lignes nullables : silences entre répliques, fin de scène.
export function KaraokeBar({
  active,
  next,
}: {
  active: KaraokeLine | null
  next: KaraokeLine | null
}) {
  return (
    <div className="karaoke">
      <p className="karaoke__speaker">{active ? (active.isYou ? 'À toi' : active.speaker) : ' '}</p>
      <p className={`karaoke__active ${active?.isYou ? 'karaoke__active--you' : ''}`}>
        {active?.text ?? '…'}
      </p>
      <p className="karaoke__next">{next?.text ?? ' '}</p>
    </div>
  )
}
