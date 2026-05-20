import ReactDOM from 'react-dom/client';
import App from '../App';
import { AppProviders } from './providers/AppProviders';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found in index.html');
}

ReactDOM.createRoot(rootElement).render(
  <AppProviders>
    <App />
  </AppProviders>,
);
