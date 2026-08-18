// Mixage audio WebAudio : micro + bande son de la référence → piste unique enregistrable.
// Le micro ne sort JAMAIS sur les haut-parleurs (larsen) ; la réf, si, en mode Playback.
export type AudioMode = 'playback' | 'solo'

export class AudioMix {
  private ctx: AudioContext
  private recDest: MediaStreamAudioDestinationNode
  private refToRec: GainNode
  private refToMonitor: GainNode
  private micToRec: GainNode
  private refAttached = false

  constructor() {
    this.ctx = new AudioContext()
    this.recDest = this.ctx.createMediaStreamDestination()
    this.refToRec = this.ctx.createGain()
    this.refToMonitor = this.ctx.createGain()
    this.micToRec = this.ctx.createGain()
    this.refToRec.connect(this.recDest)
    this.refToMonitor.connect(this.ctx.destination)
    this.micToRec.connect(this.recDest)
  }

  resume() {
    void this.ctx.resume()
  }

  attachRef(video: HTMLVideoElement) {
    if (this.refAttached) return
    this.refAttached = true
    const source = this.ctx.createMediaElementSource(video)
    source.connect(this.refToRec)
    source.connect(this.refToMonitor)
  }

  attachMic(stream: MediaStream) {
    if (stream.getAudioTracks().length === 0) return
    const source = this.ctx.createMediaStreamSource(stream)
    source.connect(this.micToRec)
  }

  // Playback : réf audible, baissée à 20 % dans l'enregistrement pendant TES répliques.
  // Solo : réf muette partout — rien que ta voix.
  setLevels(mode: AudioMode, yourCueActive: boolean) {
    if (mode === 'solo') {
      this.refToRec.gain.value = 0
      this.refToMonitor.gain.value = 0
    } else {
      this.refToRec.gain.value = yourCueActive ? 0.2 : 1
      this.refToMonitor.gain.value = 1
    }
  }

  get audioTracks(): MediaStreamTrack[] {
    return this.recDest.stream.getAudioTracks()
  }

  close() {
    void this.ctx.close()
  }
}
