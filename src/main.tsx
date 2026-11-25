import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {LanguageProvider} from './contexts/LanguageContext.tsx';
import './index.css';
import { installRafFallback } from './utils/rafFallback';

installRafFallback();

createRoot(document.getElementById('root')!).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>
);
