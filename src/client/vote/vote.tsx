import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../index.css';
import { VoteScreen } from './VoteScreen';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
  <StrictMode>
    <VoteScreen />
  </StrictMode>
);
