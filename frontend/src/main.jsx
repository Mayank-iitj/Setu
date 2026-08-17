import { ClerkProvider } from '@clerk/react';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Auth is optional. Without a Clerk key the app still boots and every public
// route renders — the evidence pages (/proof, /benchmark) must never depend on
// a third-party auth service being configured. Throwing here previously took
// down the entire app, including pages that need no login at all.
const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} signInUrl="/login" afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
