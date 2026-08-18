// Fausses données pour S1 : les vraies scènes (tournées par nos comédiens)
// arriveront via public/scenes/manifest.json en S3/S7.
// Répliques inventées — les vrais textes seront décidés côté humain (droits).
export type MockScene = {
  id: string
  title: string
  film: string
  durationS: number
  activeCue: string
  nextCue: string
}

export const mockScenes: MockScene[] = [
  {
    id: 'cuisine',
    title: 'La dégustation',
    film: 'Film culte n° 1',
    durationS: 42,
    activeCue: 'Tu appelles ça un café ? Moi j’appelle ça un accident.',
    nextCue: 'Sers-m’en un deuxième, pour vérifier.',
  },
  {
    id: 'bureau',
    title: 'L’interrogatoire',
    film: 'Film culte n° 2',
    durationS: 35,
    activeCue: 'Répète un peu, mais lentement. Et en me regardant.',
    nextCue: 'Je n’ai rien dit. C’est bien le problème.',
  },
  {
    id: 'diner',
    title: 'Le dîner',
    film: 'Film culte n° 3',
    durationS: 28,
    activeCue: 'Et là, il me dit : « c’est vous l’invité ? »',
    nextCue: 'Non. C’était pire.',
  },
  {
    id: 'parking',
    title: 'Les adieux',
    film: 'Film culte n° 4',
    durationS: 51,
    activeCue: 'Pars. Et ne te retourne pas.',
    nextCue: 'C’est un parking, il y a des caméras partout.',
  },
]

export function getScene(id: string | undefined): MockScene {
  return mockScenes.find((s) => s.id === id) ?? mockScenes[0]
}
