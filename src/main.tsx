import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './components/ThemeProvider';
import { CertificateVerification } from './components/CertificateVerification';

const certificateId = new URLSearchParams(window.location.search).get('certificate');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light">
      {certificateId !== null ? <CertificateVerification id={certificateId} /> : <App />}
    </ThemeProvider>
  </StrictMode>,
);
