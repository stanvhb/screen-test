import { describe, expect, it } from 'vitest'
import { getCharacter, getScene, karaokeLines, otherCharacter } from './scenes'

const scene = getScene('cuisine')

describe('rôles', () => {
  it('retombe sur le premier personnage sans rôle choisi', () => {
    expect(getCharacter(scene, null).id).toBe('raleur')
    expect(otherCharacter(scene, null).id).toBe('serveur')
  })

  it('respecte le rôle choisi', () => {
    expect(getCharacter(scene, 'serveur').id).toBe('serveur')
    expect(otherCharacter(scene, 'serveur').id).toBe('raleur')
  })
})

describe('karaokeLines', () => {
  it('marque ta réplique quand ton personnage parle', () => {
    const { active } = karaokeLines(scene, 'raleur')
    expect(active.isYou).toBe(true)
    expect(active.speaker).toBe('Le râleur')
  })

  it('marque la réplique de l’autre quand tu joues l’autre rôle', () => {
    const { active, next } = karaokeLines(scene, 'serveur')
    expect(active.isYou).toBe(false)
    expect(next.isYou).toBe(true)
  })
})
