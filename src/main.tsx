import React from 'react';
import { createRoot } from 'react-dom/client';
import { lazy, Suspense } from 'react';
import './style.css';
import { initializePwa } from './pwa';
const App=import.meta.env.MODE==='hosted'
  ? lazy(()=>import('./CloudBootstrap'))
  : lazy(()=>import('./App').then(module=>({default:module.App})));
createRoot(document.getElementById('root')!).render(<React.StrictMode><Suspense fallback={<p>Opening Watchlist…</p>}><App /></Suspense></React.StrictMode>);
void initializePwa();
