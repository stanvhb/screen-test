import { expect, test } from '@playwright/test'

test('/timer réviseur : importer un brouillon, attribuer A/B, exporter', async ({ page }) => {
  await page.goto('/timer')

  const draft = JSON.stringify([
    { text: 'Salut.', character: '?', startMs: 0, endMs: 900 },
    { text: 'Toi-même.', character: '?', startMs: 1200, endMs: 2100 },
  ])
  await page.getByLabel('Importer un brouillon').setInputFiles({
    name: 'cues.draft.json',
    mimeType: 'application/json',
    buffer: Buffer.from(draft),
  })

  await expect(page.locator('.timer__mark')).toHaveCount(2)
  // Export bloqué tant que des « ? » restent
  await expect(page.getByRole('button', { name: 'Exporter cues.json' })).toBeDisabled()

  await page.locator('.timer__mark').first().click()
  await page.keyboard.press('a')
  await page.locator('.timer__mark').nth(1).click()
  await page.keyboard.press('b')

  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter cues.json' }).click()
  const download = await downloadPromise
  const content = JSON.parse(
    await (await import('node:fs/promises')).readFile(await download.path(), 'utf8'),
  ) as { text: string; character: string }[]
  expect(content[0]).toMatchObject({ character: 'a', text: 'Salut.' })
  expect(content[1].character).toBe('b')
})
