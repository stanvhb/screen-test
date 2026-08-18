import { describe, expect, it } from 'vitest'
import { pickRecordingFormat } from './recorder'

describe('pickRecordingFormat', () => {
  it('préfère le WebM (VP8) quand il est supporté', () => {
    const format = pickRecordingFormat(() => true)
    expect(format).toEqual({ mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' })
  })

  it('retombe sur le MP4 quand le WebM est absent (cas Safari)', () => {
    const format = pickRecordingFormat((type) => type.startsWith('video/mp4'))
    expect(format?.extension).toBe('mp4')
  })

  it('rend null quand rien n’est supporté', () => {
    expect(pickRecordingFormat(() => false)).toBeNull()
  })
})
