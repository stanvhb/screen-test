import { describe, expect, it } from 'vitest'
import { toCues, toShots, type Mark } from './timerMarks'

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
