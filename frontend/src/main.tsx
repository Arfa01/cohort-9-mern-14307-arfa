// starts React application inside the root element of index.html
// it wraps the App component in BrowserRouter and AuthProvider. then imports glabal css
// strict mode can cause two /me reqs but the provider ignores the stale one. 

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'

import App from './App.tsx'
import { AuthProvider } from './auth/AuthProvider.tsx'  // checks who is signied in
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
