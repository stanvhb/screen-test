import { useNavigate, useParams } from 'react-router-dom'
import { getScene } from '../data/scenes'
import { KaraokeBar } from '../components/KaraokeBar'
import './Plateau.css'

export function Plateau() {
  const { id } = useParams()
  const scene = getScene(id)
  const navigate = useNavigate()

  return (
    <div className="plateau">
      <div className="plateau__camera" aria-hidden="true">
        <p>Ta caméra apparaîtra ici</p>
      </div>

      <header className="plateau__top">
        <span className="plateau__rec">
          <span className="plateau__rec-dot" aria-hidden="true" />
          REC
        </span>
        <span className="plateau__timecode">00:00:12</span>
      </header>

      <footer className="plateau__bottom">
        <KaraokeBar activeCue={scene.activeCue} nextCue={scene.nextCue} />
        <button
          type="button"
          className="plateau__stop"
          aria-label="Coupez"
          onClick={() => navigate(`/dailies/${scene.id}`)}
        >
          <span aria-hidden="true" />
        </button>
      </footer>
    </div>
  )
}
