import {
  BookOpen,
  Brain,
  Headphones,
  Play,
  Search,
  Target
} from 'lucide-react'

import { ACADEMY_LESSON_CATALOG } from './data/academyCatalog.js'

export const ACADEMY_MODULES = ACADEMY_LESSON_CATALOG.map((module, index) => ({
  ...module, order: index + 1, icon: module.courseId === 'osint' ? BookOpen : Target
}))

export const ACADEMY_LABS = [
  {
    id: 'dork-simulator',
    title: 'Simulador de Dorks',
    description: 'Resuelve desafíos de búsqueda sin ejecutar consultas sensibles.',
    route: '/academy/dork-simulator',
    icon: Search,
    meta: '8 desafíos'
  },
  {
    id: 'mindmap',
    title: 'Mapa de conocimiento',
    description: 'Explora técnicas, fuentes y relaciones dentro del ecosistema OSINT.',
    route: '/academy/mindmap',
    icon: Brain,
    meta: 'Exploración libre'
  },
  {
    id: 'detective-game',
    title: 'Casos de investigación',
    description: 'Identifica indicios y aplica una metodología de verificación por etapas.',
    route: '/academy/detective-game',
    icon: Target,
    meta: '3 casos'
  },
  {
    id: 'audio',
    title: 'Resumen en audio',
    description: 'Repasa conceptos esenciales en un formato breve y descargable.',
    route: '/academy/audio',
    icon: Headphones,
    meta: '7 min'
  },
  { id: 'infra-lab', title: 'Auditoría simulada', description: 'Clasificá exposición pública y priorizá recomendaciones defensivas.', route: '/academy/infrastructure-lab', icon: Target, meta: '20 min' },
  { id: 'corp-lab', title: 'Expediente Río Claro', description: 'Resolvé un caso corporativo ficticio y redactá un informe.', route: '/academy/corporate-lab', icon: BookOpen, meta: '15 min' }
]

export const ACADEMY_STATS = {
  moduleCount: ACADEMY_MODULES.length,
  lessonCount: ACADEMY_MODULES.reduce((total, module) => total + module.slideCount, 0),
  durationMinutes: ACADEMY_MODULES.reduce((total, module) => total + module.durationMinutes, 0),
  labCount: ACADEMY_LABS.length
}

export const getAcademyModule = (moduleId) => (
  ACADEMY_MODULES.find(module => module.id === moduleId)
)

export const formatAcademyDuration = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (!hours) return `${remainingMinutes} min`
  if (!remainingMinutes) return `${hours} h`
  return `${hours} h ${remainingMinutes} min`
}

export const AcademyPlayIcon = Play
