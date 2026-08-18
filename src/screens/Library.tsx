import { Link } from 'react-router-dom'
import { APP_NAME } from '../config'
import { useLibrary } from '../hooks/useLibrary'
import { SceneCard } from '../components/SceneCard'
import './Library.css'

export function Library() {
  const library = useLibrary()

  return (
    <div className="library">
      <header className="library__header">
        <h1>{APP_NAME}</h1>
        <p className="library__tagline">Rejoue la scène. Garde la prise.</p>
      </header>
      <div className="library__grid">
        {library.scenes.map((scene, index) => (
          <SceneCard key={scene.id} scene={scene} index={index} />
        ))}
      </div>
      {library.status === 'ready' && library.scenes.length === 0 && (
        <p className="library__empty">
          Aucune scène pour l’instant — elles arrivent. Reviens vite !
        </p>
      )}
      <footer className="library__footer">
        <Link to="/a-propos">C’est quoi, {APP_NAME} ?</Link>
      </footer>
    </div>
  )
}
