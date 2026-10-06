import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { HealthProvider } from './features/health/HealthProvider';
import { I18nProvider } from './i18n';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <HealthProvider>
        <App />
      </HealthProvider>
    </I18nProvider>
  </StrictMode>,
);
