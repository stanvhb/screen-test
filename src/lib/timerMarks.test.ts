import { describe, expect, it } from 'vitest'
import { fromJson, hasUnassigned, toCues, toShots, type Mark } from './timerMarks'

const marks: Mark[] = [
  { track: 'cues', character: 'b', startMs: 2500.4, endMs: 4300.9 },
  { track: 'cues', character: 'a', startMs: 100.2, endMs: 2300.7 },
  { track: 'shots', character: 'a', startMs: 0, endMs: 2600 },
  { track: 'cues', character: 'a', startMs: 5000, endMs: 5000 }, // vide → ignorée
]

describe('toCues', () => {
  it('trie par temps, numérote et arrondit', () => {
    expect(toCues(marks)).toEqual([
      { text: 'Réplique 1 — à remplacer', character: 'a', startMs: 100, endMs: 2301 },
      { text: 'Réplique 2 — à remplacer', character: 'b', startMs: 2500, endMs: 4301 },
    ])
  })
})

describe('toShots', () => {
  it('ne prend que la piste plans', () => {
    expect(toShots(marks)).toEqual([{ character: 'a', startMs: 0, endMs: 2600 }])
  })
})

describe('toCues avec texte importé', () => {
  it('préserve le texte de la transcription', () => {
    const withText: Mark[] = [
      { track: 'cues', character: 'a', startMs: 0, endMs: 1000, text: 'Bonjour toi.' },
    ]
    expect(toCues(withText)[0].text).toBe('Bonjour toi.')
  })
})

describe('fromJson / hasUnassigned', () => {
  it('importe un brouillon et signale les personnages à attribuer', () => {
    const imported = fromJson('cues', [
      { text: 'Salut.', character: '?', startMs: 0, endMs: 900 },
      { character: 'b', startMs: 1000, endMs: 2000 },
    ])
    expect(imported).toHaveLength(2)
    expect(imported[0].track).toBe('cues')
    expect(imported[0].text).toBe('Salut.')
    expect(hasUnassigned(imported, 'cues')).toBe(true)
    expect(hasUnassigned([{ ...imported[1] }], 'cues')).toBe(false)
  })

  it('refuse un format inattendu', () => {
    expect(() => fromJson('cues', { pas: 'une liste' })).toThrow()
    expect(() => fromJson('shots', [{ startMs: 'zéro' }])).toThrow()
  })
})
