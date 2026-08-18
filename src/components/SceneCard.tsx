import { Link } from 'react-router-dom'
import type { SceneSummary } from '../hooks/useLibrary'
import './SceneCard.css'

export function SceneCard({ scene, index }: { scene: SceneSummary; index: number }) {
  return (
    <Link to={`/setup/${scene.id}`} className="scene-card">
      <div className="scene-card__thumb" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="scene-card__body">
        <h3 className="scene-card__title">{scene.title}</h3>
        <p className="scene-card__film">d’après {scene.film}</p>
        <p className="scene-card__duration">{scene.durationS} s</p>
      </div>
    </Link>
  )
}
