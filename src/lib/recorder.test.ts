import { describe, expect, it } from 'vitest'
import { pickRecordingFormat } from './recorder'

describe('pickRecordingFormat', () => {
  it('préfère le MP4 quand il est supporté', () => {
    const format = pickRecordingFormat(() => true)
    expect(format).toEqual({ mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', extension: 'mp4' })
  })

  it('retombe sur le WebM (VP8) quand le MP4 est absent', () => {
    const format = pickRecordingFormat((type) => type.startsWith('video/webm'))
    expect(format).toEqual({ mimeType: 'video/webm;codecs=vp8,opus', extension: 'webm' })
  })

  it('rend null quand rien n’est supporté', () => {
    expect(pickRecordingFormat(() => false)).toBeNull()
  })
})
