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

  // Coupez → Dailies avec la prise
  await page.getByRole('button', { name: 'Coupez' }).click()
  await expect(page.getByRole('heading', { name: 'Tes dailies' })).toBeVisible()
})
