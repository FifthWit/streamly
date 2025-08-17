import './app.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router'
import Homepage from './pages/Homepage'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <StrictMode>
      <Routes>
        <Route path="/" element={<Homepage />} />
      </Routes>
    </StrictMode>
  </BrowserRouter>
)
