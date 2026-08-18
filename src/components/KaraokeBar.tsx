import './KaraokeBar.css'

// Version statique (S1) : la synchro arrive en S3.
export function KaraokeBar({ activeCue, nextCue }: { activeCue: string; nextCue: string }) {
  return (
    <div className="karaoke">
      <p className="karaoke__active">{activeCue}</p>
      <p className="karaoke__next">{nextCue}</p>
    </div>
  )
}
