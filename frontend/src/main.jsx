import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AuthProvider } from '@hooks/useAuth'
import { CaseProvider } from '@/context/CaseContext'
import App from './App.jsx'
import './styles/variables.css'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CaseProvider>
          <App />
        </CaseProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
