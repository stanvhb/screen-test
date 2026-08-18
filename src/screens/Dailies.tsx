import { Link, useNavigate, useParams } from 'react-router-dom'
import { getScene } from '../data/scenes'
import { getTake } from '../data/takes'
import { Button } from '../components/Button'
import './Dailies.css'

export function Dailies() {
  const { id } = useParams()
  const scene = getScene(id)
  const navigate = useNavigate()
  const take = getTake(scene.id)

  const downloadTake = () => {
    if (!take) return
    const url = URL.createObjectURL(take.blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `prise-${scene.id}.${take.extension}`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return (
    <div className="dailies">
      <div className="dailies__screen" aria-hidden="true">
        <span className="dailies__play">▶</span>
        <p>Ta prise se rejouera ici</p>
      </div>

      <header className="dailies__top">
        <h2>Tes dailies</h2>
        <p className="dailies__meta">
          {scene.title} · d’après {scene.film}
        </p>
      </header>

      <footer className="dailies__actions">
        {take ? (
          <Button onClick={downloadTake}>Télécharger ta prise</Button>
        ) : (
          <Button disabled>Pas encore de prise</Button>
        )}
        <div className="dailies__secondary">
          <Button variant="ghost" onClick={() => navigate(`/plateau/${scene.id}`)}>
            Une autre ?
          </Button>
          <Button variant="ghost" onClick={() => alert('Bientôt : partage direct.')}>
            Partager
          </Button>
        </div>
        <Link to="/" className="dailies__back">
          ← Bibliothèque
        </Link>
      </footer>
    </div>
  )
}
