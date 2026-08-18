import { APP_NAME } from '../config'
import { mockScenes } from '../data/scenes'
import { SceneCard } from '../components/SceneCard'
import './Library.css'

export function Library() {
  return (
    <div className="library">
      <header className="library__header">
        <h1>{APP_NAME}</h1>
        <p className="library__tagline">Rejoue la scène. Garde la prise.</p>
      </header>
      <div className="library__grid">
        {mockScenes.map((scene, index) => (
          <SceneCard key={scene.id} scene={scene} index={index} />
        ))}
      </div>
    </div>
  )
}
