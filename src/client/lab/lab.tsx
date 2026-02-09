import '../index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SpectrumLabScreen } from './SpectrumLabScreen';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SpectrumLabScreen />
  </StrictMode>
);
