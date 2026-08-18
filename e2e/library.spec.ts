import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

test('la bibliothèque vient du manifest — les deux scènes réelles sont là', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('link', { name: /La scène témoin/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /La contre-mire/ })).toBeVisible()
})

test('ajouter une scène = zéro code : demo2 se joue de bout en bout', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/')

  // La 2e scène (ajoutée uniquement par dossier + manifest) est jouable
  await page.getByRole('link', { name: /La contre-mire/ }).click()
  await expect(page.getByRole('heading', { name: 'La contre-mire' })).toBeVisible()
  await page.getByRole('button', { name: 'Moteur…' }).click()

  await page.getByRole('button', { name: 'Moteur' }).click()
  await expect(page.locator('.karaoke__active')).toHaveText('Réplique 1 — Perso A parle.', {
    timeout: 10_000,
  })
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()
  await expect(page.getByText(/La contre-mire · d’après Mire de test n° 2/)).toBeVisible()
})
