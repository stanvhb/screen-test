import { Link } from 'react-router-dom'
import { APP_NAME, CONTACT_EMAIL } from '../config'
import './About.css'

export function About() {
  return (
    <div className="about">
      <Link to="/" className="about__back">
        ← Bibliothèque
      </Link>
      <h2>C’est quoi, {APP_NAME} ?</h2>
      <p>
        Tu choisis une scène culte, tu choisis ton rôle, tu la rejoues face caméra avec le texte qui
        défile — et tu repars avec le montage : toi dans la scène, plan par plan.
      </p>
      <p>
        Les scènes proposées sont des <strong>parodies</strong> : des re-créations tournées par nos
        comédiens, en hommage aux films qu’elles évoquent. Aucune image ni bande son des œuvres
        originales n’est utilisée.
      </p>
      <p>
        <strong>Ta vidéo ne quitte jamais ton appareil.</strong> Il n’y a pas de serveur : tout se
        passe dans ton navigateur. Tu télécharges ta prise ou elle disparaît, c’est tout.
      </p>
      <p className="about__contact">
        Ayant droit ? Une re-création vous pose problème : écrivez-nous, on la retire —{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>
      <p className="about__signature">Une production Le Studio.</p>
    </div>
  )
}
