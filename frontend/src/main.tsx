import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthLayout } from './components/AuthLayout'
import './index.css'
const rootElement = document.getElementById('root')

if (rootElement === null) {
  throw new Error('Root element was not found.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthLayout
      eyebrow="Frontend foundation"
      title="Notes App"
      description="The React application foundation is ready for authentication."
      footer="Authentication will be added in the next feature."
    >
      <div className="rounded-xl border border-brand-200 bg-brand-100 px-4 py-3 text-sm text-stone-800">
        Vite, TypeScript, Tailwind CSS, and Jest are configured.
      </div>
    </AuthLayout>
  </StrictMode>,
)
