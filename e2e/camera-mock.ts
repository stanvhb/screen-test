import type { Page } from '@playwright/test'

// Fausse caméra pour les e2e : un canvas animé transformé en flux vidéo.
// defineProperty : sur WebKit, l'assignation directe de getUserMedia est ignorée.
export async function mockCamera(page: Page) {
  await page.addInitScript(() => {
    const fakeGetUserMedia = async () => {
      const canvas = document.createElement('canvas')
      canvas.width = 360
      canvas.height = 640
      const ctx = canvas.getContext('2d')!
      let frame = 0
      setInterval(() => {
        frame += 1
        ctx.fillStyle = frame % 2 ? '#223' : '#332'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }, 100)
      return canvas.captureStream(15)
    }
    // Patch au niveau du prototype : survit à toute re-création de l'objet mediaDevices.
    if (typeof MediaDevices !== 'undefined') {
      Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
        value: fakeGetUserMedia,
        configurable: true,
      })
    }
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: fakeGetUserMedia },
        configurable: true,
      })
    }
  })
}

export async function mockCameraDenied(page: Page) {
  await page.addInitScript(() => {
    const denied = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError')
    }
    if (typeof MediaDevices !== 'undefined') {
      Object.defineProperty(MediaDevices.prototype, 'getUserMedia', {
        value: denied,
        configurable: true,
      })
    }
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: denied },
        configurable: true,
      })
    }
  })
}
