import { expect, test } from '@playwright/test'

test('/timer : on marque une réplique et on exporte cues.json', async ({ page }) => {
  await page.goto('/timer')
  await page.getByRole('button', { name: 'ou utiliser la scène témoin' }).click()
  await expect(page.locator('.timer__video')).toBeVisible()

  // Lecture (espace), marque A tenue ~600 ms, pause
  await page.keyboard.press(' ')
  await page.waitForTimeout(300)
  await page.keyboard.down('a')
  await page.waitForTimeout(600)
  await page.keyboard.up('a')
  await page.keyboard.press(' ')

  // La marque apparaît dans la liste
  await expect(page.locator('.timer__marks li')).toHaveCount(1)
  await expect(page.locator('.timer__mark-char')).toHaveText('A')

  // Export : un cues.json avec la réplique marquée
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter cues.json' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toBe('cues.json')
  const content = JSON.parse(
    await (await import('node:fs/promises')).readFile(await download.path(), 'utf8'),
  ) as { character: string; startMs: number; endMs: number }[]
  expect(content).toHaveLength(1)
  expect(content[0].character).toBe('a')
  expect(content[0].endMs).toBeGreaterThan(content[0].startMs)
})
