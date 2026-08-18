import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

test('la scène témoin défile : karaoké calé et champ/contrechamp', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/plateau/demo') // rôle par défaut : Perso A

  // Avant la prise : début de scène (plan de Perso A, à toi)
  await expect(page.getByText(/À l’image : toi \(Perso A\)/)).toBeVisible()

  await page.getByRole('button', { name: 'Moteur' }).click()

  // Réplique 1 active (0 → 2,3 s de la réf)
  const active = page.locator('.karaoke__active')
  await expect(active).toHaveText('Réplique 1 — Perso A parle.', { timeout: 10_000 })

  // La réf avance : réplique 2 (2,5 s) et plan de Perso B → contrechamp
  await expect(active).toHaveText('Réplique 2 — Perso B parle.', { timeout: 10_000 })
  await expect(page.getByText(/À l’image : Perso B/)).toBeVisible()

  // Plan de réaction (3,6 s) : B parle TOUJOURS, mais l'image coupe sur toi.
  // Parole (cues) et image (shots) sont bien deux pistes indépendantes.
  await expect(page.getByText(/À l’image : toi \(Perso A\)/)).toBeVisible({ timeout: 5_000 })
  await expect(active).toHaveText('Réplique 2 — Perso B parle.')

  // Coupez → Dailies avec la prise
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()
})

test('l’export composité se télécharge et pèse son poids', async ({ page }, testInfo) => {
  await mockCamera(page)
  await page.goto('/plateau/demo')

  await page.getByRole('button', { name: 'Moteur' }).click()
  const active = page.locator('.karaoke__active')
  await expect(active).toHaveText('Réplique 2 — Perso B parle.', { timeout: 15_000 })
  await page.getByRole('button', { name: 'Coupez' }).click()

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger ta prise' }).click()
  const download = await downloadPromise
  const filename = download.suggestedFilename()
  expect(filename).toMatch(/^prise-demo\.(webm|mp4)$/)

  // Copie inspectable par tools/verify-export.sh
  const outPath = testInfo.outputPath(`export-sample-${filename}`)
  await download.saveAs(outPath)
  const { statSync } = await import('node:fs')
  // Un export composité de quelques secondes ne peut pas être minuscule
  expect(statSync(outPath).size).toBeGreaterThan(80_000)
})
