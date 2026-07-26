import React from 'react'
import { Compass, GitBranch, GraduationCap, Library } from 'lucide-react'
import { Link } from '@/lib/router'
import BrandSignature from './BrandSignature'
import './SectionNavbar.css'

const NAV_ITEMS = [
  { id: 'cases', to: '/investigations', label: 'Casos', icon: Library },
  { id: 'galaxy', to: '/', label: 'Galaxia', icon: Compass },
  { id: 'flows', to: '/osint-flowcharts', label: 'Flujos', icon: GitBranch },
  { id: 'academy', to: '/academy', label: 'Academia', icon: GraduationCap }
]

export default function SectionNavbar({ context, active }) {
  return (
    <header className="section-navbar">
      <Link to="/" className="section-navbar__brand" aria-label="Ir a la Galaxia de OSINT Argy">
        <BrandSignature context={context} compact />
      </Link>
      <nav aria-label="Navegación principal">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = active === item.id
          return (
            <Link
              key={item.id}
              to={item.to}
              className={isActive ? 'is-active' : ''}
              aria-current={isActive ? 'page' : undefined}
              title={item.label}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
