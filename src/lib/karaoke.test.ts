import { describe, expect, it } from 'vitest'
import { litWordCount, splitWords } from './karaoke'

describe('splitWords', () => {
  it('découpe aux espaces, sans vides', () => {
    expect(splitWords('  un deux   trois ')).toEqual(['un', 'deux', 'trois'])
  })
})

describe('litWordCount', () => {
  const text = 'un deux trois quatre' // 4 mots, réplique de 0 à 4000 ms

  it('rien avant le début, tout à la fin', () => {
    expect(litWordCount(text, -100, 0, 4000)).toBe(0)
    expect(litWordCount(text, 0, 0, 4000)).toBe(0)
    expect(litWordCount(text, 4000, 0, 4000)).toBe(4)
    expect(litWordCount(text, 9999, 0, 4000)).toBe(4)
  })

  it('balaye linéairement pendant la réplique', () => {
    expect(litWordCount(text, 500, 0, 4000)).toBe(1)
    expect(litWordCount(text, 1500, 0, 4000)).toBe(2)
    expect(litWordCount(text, 3500, 0, 4000)).toBe(4)
  })

  it('reste sain sur une réplique de durée nulle', () => {
    expect(litWordCount(text, 100, 500, 500)).toBe(4)
  })
})
