import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

async function recordDemoTake(page: import('@playwright/test').Page) {
  await page.goto('/plateau/demo')
  await page.getByRole('button', { name: 'Moteur' }).click()
  await expect(page.getByRole('button', { name: 'Coupez' })).toBeVisible({ timeout: 10_000 })
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()
}

test('Partager passe la vidéo à la feuille de partage native', async ({ page }) => {
  await mockCamera(page)
  await page.addInitScript(() => {
    const shared: { name: string; type: string; size: number }[] = []
    Object.defineProperty(navigator, 'canShare', { value: () => true, configurable: true })
    Object.defineProperty(navigator, 'share', {
      value: (data: ShareData) => {
        for (const file of data.files ?? []) {
          shared.push({ name: file.name, type: file.type, size: file.size })
        }
        ;(window as unknown as { __shared: typeof shared }).__shared = shared
        return Promise.resolve()
      },
      configurable: true,
    })
  })

  await recordDemoTake(page)
  await page.getByRole('button', { name: 'Partager' }).click()

  const shared = await page.evaluate(
    () => (window as unknown as { __shared?: { name: string; size: number }[] }).__shared,
  )
  expect(shared).toHaveLength(1)
  expect(shared![0].name).toMatch(/^prise-demo\.(webm|mp4)$/)
  expect(shared![0].size).toBeGreaterThan(10_000)
})

test('sans partage natif : téléchargement + explication', async ({ page }) => {
  await mockCamera(page)
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true })
  })

  await recordDemoTake(page)
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Partager' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^prise-demo\.(webm|mp4)$/)
  await expect(page.getByText(/Pas de partage direct sur ce navigateur/)).toBeVisible()
})
