import { expect, test } from '@playwright/test'
import { mockCamera, mockCameraDenied } from './camera-mock.ts'

test('décompte 3-2-1 → ACTION, prise, puis téléchargement dispo', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/plateau/cuisine')

  // La fausse caméra démarre, le bouton Moteur devient actif
  const moteur = page.getByRole('button', { name: 'Moteur' })
  await expect(moteur).toBeEnabled()
  await moteur.click()

  // Décompte vérifié étape par étape
  await expect(page.getByText('3', { exact: true })).toBeVisible()
  await expect(page.getByText('2', { exact: true })).toBeVisible()
  await expect(page.getByText('1', { exact: true })).toBeVisible()
  await expect(page.getByText('ACTION', { exact: true })).toBeVisible()

  // On enregistre : le timecode avance
  await expect(page.getByText('00:00:01')).toBeVisible({ timeout: 5000 })

  // Coupez → Dailies avec la prise téléchargeable
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()
  const download = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger ta prise' }).click()
  expect((await download).suggestedFilename()).toMatch(/^prise-cuisine\.(webm|mp4)$/)
})

test('refus caméra : message clair et bouton réessayer', async ({ page }) => {
  await mockCameraDenied(page)
  await page.goto('/plateau/cuisine')

  await expect(page.getByRole('heading', { name: 'Pas de caméra, pas de scène' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Réessayer' })).toBeVisible()
})
