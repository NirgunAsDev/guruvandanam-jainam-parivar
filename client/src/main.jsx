import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BRAND } from './lang';
import './index.css';

document.title = `${BRAND.name} | ${BRAND.nameHi}`;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
