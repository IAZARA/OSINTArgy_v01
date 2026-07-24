import React from 'react'
import { useNavigate } from '@/lib/router'
import osintEyeLogo from '../../assets/osint-eye-logo.svg'
import './FloatingHomeButton.css'

const FloatingHomeButton = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/')
  }

  return (
    <button 
      className="floating-home-button"
      onClick={handleClick}
      aria-label="Ir a Inicio"
    >
      <img 
        src={osintEyeLogo} 
        alt="OSINT Logo" 
        className="floating-button-logo"
      />
    </button>
  )
}

export default FloatingHomeButton
