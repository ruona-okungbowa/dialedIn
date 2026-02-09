import '../index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HallOfFameScreen } from './HallOfFameScreen';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HallOfFameScreen />
  </StrictMode>
);

