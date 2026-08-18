import { describe, expect, it } from 'vitest'
import { computeCoverRect, wrapText } from './compositor'

describe('computeCoverRect', () => {
  it('rogne les côtés d’une source paysage pour un cadre portrait', () => {
    const r = computeCoverRect(1920, 1080, 720, 1280)
    expect(r.sh).toBe(1080)
    expect(r.sw).toBeCloseTo(1080 * (720 / 1280))
    expect(r.sx).toBeGreaterThan(0)
    expect(r.sy).toBe(0)
  })

  it('ne rogne rien quand les proportions correspondent', () => {
    const r = computeCoverRect(720, 1280, 720, 1280)
    expect(r).toEqual({ sx: 0, sy: 0, sw: 720, sh: 1280 })
  })

  it('reste sain avec une source vide (vidéo pas prête)', () => {
    const r = computeCoverRect(0, 0, 720, 1280)
    expect(r.sw).toBe(0)
  })
})

describe('wrapText', () => {
  const measure = (text: string) => text.length * 10

  it('coupe aux mots pour tenir dans la largeur', () => {
    expect(wrapText(measure, 'un deux trois quatre', 100)).toEqual(['un deux', 'trois', 'quatre'])
  })

  it('garde une seule ligne quand ça tient', () => {
    expect(wrapText(measure, 'court', 100)).toEqual(['court'])
  })

  it('ne perd jamais un mot trop long', () => {
    expect(wrapText(measure, 'mot interminablement-long fin', 100)).toEqual([
      'mot',
      'interminablement-long',
      'fin',
    ])
  })
})
