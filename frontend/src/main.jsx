import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from '@/lib/router'
import { AuthProvider } from '@hooks/useAuth'
import App from './App.jsx'
import './styles/variables.css'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
