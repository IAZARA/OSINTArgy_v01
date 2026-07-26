import React from 'react'
import logoImage from '@/assets/images/OSINTA2.png'
import './BrandSignature.css'

export default function BrandSignature({ context, compact = false, className = '' }) {
  return (
    <span className={`brand-signature ${compact ? 'brand-signature--compact' : ''} ${className}`.trim()}>
      <img src={logoImage} alt="OSINT Argy" />
      {context && <small>{context}</small>}
    </span>
  )
}
