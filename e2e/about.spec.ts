import { expect, test } from '@playwright/test'

test('la page « c’est quoi » existe : parodie, vie privée, contact retrait', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: /C’est quoi/ }).click()

  await expect(page.getByRole('heading', { name: /C’est quoi/ })).toBeVisible()
  await expect(page.getByText(/parodies/)).toBeVisible()
  await expect(page.getByText(/ne quitte jamais ton appareil/)).toBeVisible()
  await expect(page.getByText(/retirée sur simple demande/)).toBeVisible()
  // Aucune adresse personnelle dans la page (contact à venir)
  await expect(page.locator('.about')).not.toContainText('@')
})

test('une adresse inconnue ramène à la bibliothèque', async ({ page }) => {
  await page.goto('/nimporte-quoi')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})
