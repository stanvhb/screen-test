import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Library } from './screens/Library'
import { Setup } from './screens/Setup'
import { Plateau } from './screens/Plateau'
import { Dailies } from './screens/Dailies'
import { Timer } from './screens/Timer'
import { About } from './screens/About'

function App() {
  return (
    <BrowserRouter>
      <div className="frame">
        <Routes>
          <Route path="/" element={<Library />} />
          <Route path="/setup/:id" element={<Setup />} />
          <Route path="/plateau/:id" element={<Plateau />} />
          <Route path="/dailies/:id" element={<Dailies />} />
          <Route path="/timer" element={<Timer />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
