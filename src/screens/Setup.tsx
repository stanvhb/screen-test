import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScene } from '../data/scenes'
import { useSceneData } from '../hooks/useSceneData'
import { Button } from '../components/Button'
import './Setup.css'

export function Setup() {
  const { id } = useParams()
  const scene = getScene(id)
  const sceneData = useSceneData(id ?? scene.id)
  const media = sceneData.status === 'ready' ? sceneData.media : null
  const navigate = useNavigate()
  // Vraies métadonnées quand la scène a son dossier, mock sinon
  const title = media?.title ?? scene.title
  const film = media?.film ?? scene.film
  const characters = media?.characters ?? scene.characters
  const [roleId, setRoleId] = useState<string | null>(null)
  const selectedRole = characters.find((c) => c.id === roleId)?.id ?? characters[0].id
  const [mode, setMode] = useState<'playback' | 'solo'>('playback')

  return (
    <div className="setup">
      <Link to="/" className="setup__back">
        ← Bibliothèque
      </Link>
      <h2 className="setup__title">{title}</h2>
      <p className="setup__film">d’après {film}</p>

      <h3 className="setup__section">Tu joues qui ?</h3>
      <div className="setup__roles">
        {characters.map((character) => (
          <button
            key={character.id}
            type="button"
            className={`setup__role ${selectedRole === character.id ? 'setup__role--selected' : ''}`}
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
        <button
          type="button"
          className={`setup__mode ${mode === 'playback' ? 'setup__mode--selected' : ''}`}
          onClick={() => setMode('playback')}
        >
          <h3>Playback</h3>
          <p>La bande son joue, tu joues par-dessus.</p>
        </button>
        <button
          type="button"
          className={`setup__mode ${mode === 'solo' ? 'setup__mode--selected' : ''}`}
          onClick={() => setMode('solo')}
        >
          <h3>Solo</h3>
          <p>Rien que ta voix, la réf en muet.</p>
        </button>
      </div>

      <p className="setup__hint">On te demandera ta caméra au moment de tourner.</p>
      <Button
        onClick={() => navigate(`/plateau/${id ?? scene.id}?role=${selectedRole}&mode=${mode}`)}
      >
        Moteur…
      </Button>
    </div>
  )
}
