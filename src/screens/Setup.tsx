import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScene } from '../data/scenes'
import { Button } from '../components/Button'
import './Setup.css'

export function Setup() {
  const { id } = useParams()
  const scene = getScene(id)
  const navigate = useNavigate()
  const [roleId, setRoleId] = useState(scene.characters[0].id)

  return (
    <div className="setup">
      <Link to="/" className="setup__back">
        ← Bibliothèque
      </Link>
      <h2 className="setup__title">{scene.title}</h2>
      <p className="setup__film">d’après {scene.film}</p>

      <h3 className="setup__section">Tu joues qui ?</h3>
      <div className="setup__roles">
        {scene.characters.map((character) => (
          <button
            key={character.id}
            type="button"
            className={`setup__role ${roleId === character.id ? 'setup__role--selected' : ''}`}
            onClick={() => setRoleId(character.id)}
          >
            {character.name}
          </button>
        ))}
      </div>
      <p className="setup__note">
        La vidéo finale te montre plein cadre sur les plans de ton personnage, la scène d’origine
        sur les autres.
      </p>

      <div className="setup__modes">
        {/* Choix statique — le vrai réglage audio arrive avec la capture (S4) */}
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
      <Button onClick={() => navigate(`/plateau/${scene.id}?role=${roleId}`)}>Moteur…</Button>
    </div>
  )
}
