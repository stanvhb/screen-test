import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { APP_NAME } from '../config'
import { getScene } from '../data/scenes'
import { useSceneData } from '../hooks/useSceneData'
import { getTake, getTakeUrl } from '../data/takes'
import { Button } from '../components/Button'
import './Dailies.css'

export function Dailies() {
  const { id } = useParams()
  const scene = getScene(id)
  // id de la route : ne jamais retomber sur l'id du mock pour une scène inconnue des mocks
  const sceneId = id ?? scene.id
  const sceneData = useSceneData(sceneId)
  const media = sceneData.status === 'ready' ? sceneData.media : null
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const take = getTake(sceneId)
  // La prise se rejoue depuis la mémoire — rien n'est envoyé nulle part.
  const videoUrl = getTakeUrl(sceneId)
  const [shareFallback, setShareFallback] = useState(false)

  const downloadTake = () => {
    if (!take || !videoUrl) return
    const link = document.createElement('a')
    link.href = videoUrl
    link.download = `prise-${sceneId}.${take.extension}`
    link.click()
  }

  // Partage natif (feuille de partage iPhone) ; sinon : téléchargement + explication.
  const shareTake = async () => {
    if (!take) return
    const file = new File([take.blob], `prise-${sceneId}.${take.extension}`, {
      type: take.blob.type,
    })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: APP_NAME })
      } catch {
        // partage annulé par l'utilisateur : rien à faire
      }
    } else {
      downloadTake()
      setShareFallback(true)
    }
  }

  const anotherTake = () => {
    navigate({ pathname: `/plateau/${sceneId}`, search: searchParams.toString() })
  }

  return (
    <div className="dailies">
      {videoUrl ? (
        <video className="dailies__video" src={videoUrl} controls playsInline />
      ) : (
        <div className="dailies__screen" aria-hidden="true">
          <span className="dailies__play">▶</span>
          <p>Ta prise se rejouera ici</p>
        </div>
      )}

      <header className="dailies__top">
        <h2>Tes dailies</h2>
        <p className="dailies__meta">
          {media?.title ?? scene.title} · d’après {media?.film ?? scene.film}
        </p>
      </header>

      <footer className="dailies__actions">
        {take ? (
          <Button onClick={downloadTake}>Télécharger ta prise</Button>
        ) : (
          <Button disabled>Pas encore de prise</Button>
        )}
        <div className="dailies__secondary">
          <Button variant="ghost" onClick={anotherTake}>
            Une autre ?
          </Button>
          <Button variant="ghost" onClick={shareTake} disabled={!take}>
            Partager
          </Button>
        </div>
        {shareFallback && (
          <p className="dailies__hint">
            Pas de partage direct sur ce navigateur : ta vidéo est téléchargée, envoie-la depuis tes
            fichiers.
          </p>
        )}
        <Link to="/" className="dailies__back">
          ← Bibliothèque
        </Link>
      </footer>
    </div>
  )
}
