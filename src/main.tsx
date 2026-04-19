import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import SellerDashboard from './SellerDashboard.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/admin" element={<SellerDashboard />} />
        <Route path="/seller" element={<SellerDashboard />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
