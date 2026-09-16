import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// از HashRouter استفاده می‌شه (نه BrowserRouter) چون در نسخه‌ی نصب‌شده‌ی Electron
// صفحه از طریق file:// بارگذاری می‌شه، نه یک سرور واقعی؛ HashRouter در هر دو حالت
// (توسعه و نسخه‌ی نهایی) به‌طور یکسان کار می‌کنه.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
