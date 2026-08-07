// Must run before anything else: the Midnight SDK packages reference Node
// globals (Buffer/global/process) at module load, which don't exist in the
// browser — without these the whole module graph crashes and the page renders
// blank white.
import './polyfills';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
