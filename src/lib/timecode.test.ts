import { describe, expect, it } from 'vitest'
import { formatTimecode } from './timecode'

describe('formatTimecode', () => {
  it('formate en HH:MM:SS', () => {
    expect(formatTimecode(0)).toBe('00:00:00')
    expect(formatTimecode(7.9)).toBe('00:00:07')
    expect(formatTimecode(65)).toBe('00:01:05')
    expect(formatTimecode(3661)).toBe('01:01:01')
  })

  it('ne descend jamais sous zéro', () => {
    expect(formatTimecode(-5)).toBe('00:00:00')
  })
})
