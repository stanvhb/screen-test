import type { KaraokeLine } from '../data/scenes'
import './KaraokeBar.css'

// Version statique (S1/S2) : la synchro arrive en S3.
// Ta réplique active = jaune gaffer ; celle de l'autre = claire.
export function KaraokeBar({ active, next }: { active: KaraokeLine; next: KaraokeLine }) {
  return (
    <div className="karaoke">
      <p className="karaoke__speaker">{active.isYou ? 'À toi' : active.speaker}</p>
      <p className={`karaoke__active ${active.isYou ? 'karaoke__active--you' : ''}`}>
        {active.text}
      </p>
      <p className="karaoke__next">{next.text}</p>
    </div>
  )
}
