import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/archivo-black'
import '@fontsource/archivo/400.css'
import '@fontsource/archivo/600.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import './index.css'
import App from './App.tsx'
import { APP_NAME } from './config'

document.title = APP_NAME

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
