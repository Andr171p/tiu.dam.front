import '@fontsource-variable/inter-tight';
import './styles/index.scss';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSession } from '@entities/session';
import { isPublicPath } from '@shared/config/routes';
import { App } from './App';

// Публичные порталы открываются без входа; остальное — только после Keycloak
void initSession({ required: !isPublicPath(window.location.pathname) });

const root = document.getElementById('root');
if (!root) throw new Error('Не найден контейнер #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
