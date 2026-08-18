// Génère public/og.png (1200x630) — l'image de partage des liens.
// Usage : node tools/make-og-image.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const browser = await chromium.launch()
const page = await browser.newPage()

const b64 = await page.evaluate(async () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0a0a0b'
  ctx.fillRect(0, 0, 1200, 630)
  ctx.fillStyle = '#ff3b30'
  ctx.beginPath()
  ctx.arc(112, 120, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#f4f1ea'
  ctx.font = '500 34px monospace'
  ctx.fillText('REC', 164, 132)
  ctx.font = '900 130px sans-serif'
  ctx.fillText('SCREEN TEST', 86, 350)
  ctx.fillStyle = 'rgba(244, 241, 234, 0.6)'
  ctx.font = '400 44px sans-serif'
  ctx.fillText('Rejoue la scène. Garde la prise.', 92, 450)
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
})

await browser.close()
writeFileSync(join(root, 'public', 'og.png'), Buffer.from(b64, 'base64'))
console.log('OK — public/og.png')
