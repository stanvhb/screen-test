// Fausses données pour S1/S2 : les vraies scènes (tournées par nos comédiens)
// arriveront via public/scenes/manifest.json en S3/S7.
// Répliques inventées — les vrais textes seront décidés côté humain (droits).
export type Character = { id: string; name: string }

export type MockCue = { text: string; character: string }

export type MockScene = {
  id: string
  title: string
  film: string
  durationS: number
  characters: [Character, Character]
  cues: MockCue[]
}

export type KaraokeLine = { text: string; speaker: string; isYou: boolean }

export const mockScenes: MockScene[] = [
  {
    id: 'cuisine',
    title: 'La dégustation',
    film: 'Film culte n° 1',
    durationS: 42,
    characters: [
      { id: 'raleur', name: 'Le râleur' },
      { id: 'serveur', name: 'Le serveur' },
    ],
    cues: [
      { text: 'Tu appelles ça un café ? Moi j’appelle ça un accident.', character: 'raleur' },
      { text: 'C’est la maison qui l’a inventé. On en est fiers.', character: 'serveur' },
      { text: 'Sers-m’en un deuxième, pour vérifier.', character: 'raleur' },
      { text: 'Vous en êtes déjà au sixième.', character: 'serveur' },
    ],
  },
  {
    id: 'bureau',
    title: 'L’interrogatoire',
    film: 'Film culte n° 2',
    durationS: 35,
    characters: [
      { id: 'inspecteur', name: 'L’inspecteur' },
      { id: 'suspect', name: 'Le suspect' },
    ],
    cues: [
      { text: 'Répète un peu, mais lentement. Et en me regardant.', character: 'inspecteur' },
      { text: 'Je n’ai rien dit. C’est bien le problème.', character: 'suspect' },
      {
        text: 'Alors on va rester là jusqu’à ce que rien devienne quelque chose.',
        character: 'inspecteur',
      },
    ],
  },
  {
    id: 'diner',
    title: 'Le dîner',
    film: 'Film culte n° 3',
    durationS: 28,
    characters: [
      { id: 'hote', name: 'L’hôte' },
      { id: 'invite', name: 'L’invité' },
    ],
    cues: [
      { text: 'Et là, il me dit : « c’est vous l’invité ? »', character: 'invite' },
      { text: 'Non. C’était pire.', character: 'hote' },
      { text: 'Pire que quoi ? On n’a pas encore mangé.', character: 'invite' },
    ],
  },
  {
    id: 'parking',
    title: 'Les adieux',
    film: 'Film culte n° 4',
    durationS: 51,
    characters: [
      { id: 'partant', name: 'Celui qui part' },
      { id: 'restant', name: 'Celle qui reste' },
    ],
    cues: [
      { text: 'Pars. Et ne te retourne pas.', character: 'restant' },
      { text: 'C’est un parking, il y a des caméras partout.', character: 'partant' },
      { text: 'Alors joue-la pour les caméras.', character: 'restant' },
    ],
  },
]

export function getScene(id: string | undefined): MockScene {
  return mockScenes.find((s) => s.id === id) ?? mockScenes[0]
}

export function getCharacter(scene: MockScene, roleId: string | null): Character {
  return scene.characters.find((c) => c.id === roleId) ?? scene.characters[0]
}

export function otherCharacter(scene: MockScene, roleId: string | null): Character {
  const you = getCharacter(scene, roleId)
  return scene.characters.find((c) => c.id !== you.id) ?? scene.characters[1]
}

function toLine(scene: MockScene, cue: MockCue, roleId: string | null): KaraokeLine {
  const you = getCharacter(scene, roleId)
  const speaker = scene.characters.find((c) => c.id === cue.character)
  return {
    text: cue.text,
    speaker: speaker?.name ?? '',
    isYou: cue.character === you.id,
  }
}

// Mock S1/S2 : la « réplique active » est la première, la suivante la deuxième.
// La vraie synchro (start/end ms) arrive en S3.
export function karaokeLines(
  scene: MockScene,
  roleId: string | null,
): { active: KaraokeLine; next: KaraokeLine } {
  return {
    active: toLine(scene, scene.cues[0], roleId),
    next: toLine(scene, scene.cues[1], roleId),
  }
}
