import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { APP_NAME } from './config'

describe('App', () => {
  it('affiche le nom de l’app', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(APP_NAME)
  })
})
