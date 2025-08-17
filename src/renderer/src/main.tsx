import './app.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import Homepage from './pages/Homepage'
import Player from './pages/Player'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/player/*" element={<Player />} />
      </Routes>
    </StrictMode>
  </BrowserRouter>
)
