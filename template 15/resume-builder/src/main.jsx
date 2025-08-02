import React from 'react'
import ReactDOM from 'react-dom/client'
import './style.css'
import App from './App'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PrintResume from './components/PrintResume';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/print" element={<PrintResume />} />
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
