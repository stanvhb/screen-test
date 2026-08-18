import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

test('on navigue Bibliothèque → Setup → Plateau → Dailies', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/')

  // Bibliothèque → Setup
  await page.getByRole('link', { name: /La dégustation/ }).click()
  await expect(page.getByRole('heading', { name: 'La dégustation' })).toBeVisible()

  // Setup → Plateau
  await page.getByRole('button', { name: 'Moteur…' }).click()
  await expect(page.getByText('REC')).toBeVisible()

  // Plateau → Dailies (on tourne une mini-prise)
  await page.getByRole('button', { name: 'Moteur' }).click()
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()

  // Retour bibliothèque
  await page.getByRole('link', { name: /Bibliothèque/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
