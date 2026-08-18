import { describe, expect, it } from 'vitest'
import { cueAfter, cueAt, shotAt, type Cue, type Shot } from './sceneEngine'

const cues: Cue[] = [
  { text: 'Première', character: 'a', startMs: 0, endMs: 2000 },
  { text: 'Deuxième', character: 'b', startMs: 2500, endMs: 4500 },
  { text: 'Troisième', character: 'a', startMs: 4500, endMs: 6000 },
]

const shots: Shot[] = [
  { character: 'a', startMs: 0, endMs: 2200 },
  { character: 'b', startMs: 2200, endMs: 4500 },
]

describe('cueAt', () => {
  it('trouve la réplique active à t donné', () => {
    expect(cueAt(cues, 0)?.text).toBe('Première')
    expect(cueAt(cues, 1999)?.text).toBe('Première')
    expect(cueAt(cues, 3000)?.text).toBe('Deuxième')
  })

  it('rend null entre deux répliques et après la fin', () => {
    expect(cueAt(cues, 2200)).toBeNull()
    expect(cueAt(cues, 9999)).toBeNull()
  })

  it('la borne de fin est exclusive, le début inclusif', () => {
    expect(cueAt(cues, 2000)).toBeNull()
    expect(cueAt(cues, 2500)?.text).toBe('Deuxième')
    expect(cueAt(cues, 4500)?.text).toBe('Troisième')
  })
})

describe('cueAfter', () => {
  it('donne la réplique suivante pendant une réplique active', () => {
    expect(cueAfter(cues, 1000)?.text).toBe('Deuxième')
  })

  it('donne la prochaine réplique dans un silence', () => {
    expect(cueAfter(cues, 2200)?.text).toBe('Deuxième')
  })

  it('rend null après la dernière réplique', () => {
    expect(cueAfter(cues, 5000)).toBeNull()
  })
})

describe('shotAt', () => {
  it('suit le plan à t donné', () => {
    expect(shotAt(shots, 0)?.character).toBe('a')
    expect(shotAt(shots, 2200)?.character).toBe('b')
    expect(shotAt(shots, 4499)?.character).toBe('b')
    expect(shotAt(shots, 4500)).toBeNull()
  })
})
