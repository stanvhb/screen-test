import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

test('la prise se rejoue dans l’app, sans téléchargement préalable', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/plateau/demo?role=a&mode=playback')

  await page.getByRole('button', { name: 'Moteur' }).click()
  await expect(page.locator('.karaoke__active')).toHaveText('Réplique 2 — Perso B parle.', {
    timeout: 15_000,
  })
  await page.getByRole('button', { name: 'Coupez' }).click()

  // Le lecteur est là, branché sur la prise en mémoire (blob), pas sur un fichier
  const video = page.locator('.dailies__video')
  await expect(video).toBeVisible()
  const src = await video.getAttribute('src')
  expect(src).toMatch(/^blob:/)

  // La lecture avance réellement (le bug historique du proto : plus jamais ça)
  await video.evaluate((v) => {
    const el = v as HTMLVideoElement
    el.muted = true
    return el.play()
  })
  await expect
    .poll(async () => video.evaluate((v) => (v as HTMLVideoElement).currentTime), {
      timeout: 8_000,
    })
    .toBeGreaterThan(0.3)

  // « Une autre ? » garde le rôle et le mode choisis
  await page.getByRole('button', { name: 'Une autre ?' }).click()
  await expect(page).toHaveURL(/plateau\/demo\?role=a&mode=playback/)
})

test('onglet masqué pendant la prise : annulée + avertissement clair', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/plateau/demo')

  await page.getByRole('button', { name: 'Moteur' }).click()
  await expect(page.getByRole('button', { name: 'Coupez' })).toBeVisible({ timeout: 10_000 })

  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))
  })

  await expect(page.getByText(/Onglet quitté pendant la prise/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Moteur' })).toBeVisible()
})
