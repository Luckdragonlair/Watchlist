import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './style.css';
import { initializePwa } from './pwa';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
void initializePwa();
