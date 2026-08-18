import { expect, test } from '@playwright/test'

// On lit APP_NAME depuis la même constante que l'app : une seule source de vérité.
import { APP_NAME } from '../src/config.ts'

test('la page charge et affiche APP_NAME', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(APP_NAME)
  await expect(page).toHaveTitle(APP_NAME)
})
