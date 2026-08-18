import { expect, test } from '@playwright/test'
import { mockCamera } from './camera-mock.ts'

test('le choix du rôle pilote l’indicateur « à l’image »', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/setup/cuisine')

  // Par défaut on joue le premier rôle ; on choisit l'autre
  await page.getByRole('button', { name: 'Le serveur' }).click()
  await page.getByRole('button', { name: 'Moteur…' }).click()

  // La réplique active est celle du râleur → c'est lui à l'image, pas toi
  await expect(page).toHaveURL(/role=serveur/)
  await expect(page.getByText(/À l’image : Le râleur/)).toBeVisible()
})

test('sans choix, tu joues le premier rôle et ta réplique est active', async ({ page }) => {
  await mockCamera(page)
  await page.goto('/plateau/cuisine')

  await expect(page.getByText(/À l’image : toi/)).toBeVisible()
  await expect(page.getByText('À toi')).toBeVisible()
})
