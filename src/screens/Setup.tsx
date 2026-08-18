import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScene } from '../data/scenes'
import { Button } from '../components/Button'
import './Setup.css'

export function Setup() {
  const { id } = useParams()
  const scene = getScene(id)
  const navigate = useNavigate()

  return (
    <div className="setup">
      <Link to="/" className="setup__back">
        ← Bibliothèque
      </Link>
      <h2 className="setup__title">{scene.title}</h2>
      <p className="setup__film">d’après {scene.film}</p>

      <div className="setup__modes">
        {/* Choix statique en S1 — le vrai réglage arrive avec la capture (S4) */}
        <div className="setup__mode setup__mode--selected">
          <h3>Playback</h3>
          <p>La bande son joue, tu joues par-dessus.</p>
        </div>
        <div className="setup__mode">
          <h3>Solo</h3>
          <p>Rien que ta voix, la réf en muet.</p>
        </div>
      </div>

      <p className="setup__hint">On te demandera ta caméra au moment de tourner.</p>
      <Button onClick={() => navigate(`/plateau/${scene.id}`)}>Moteur…</Button>
    </div>
  )
}
