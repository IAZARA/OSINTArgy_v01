import {
  BookOpen,
  Brain,
  Headphones,
  Play,
  Search,
  Target
} from 'lucide-react'

export const ACADEMY_MODULES = [
  {
    id: 'modulo1',
    order: 1,
    title: 'Introducción a OSINT',
    description: 'Fundamentos, fuentes públicas, metodología y límites éticos de una investigación.',
    icon: BookOpen,
    durationMinutes: 20,
    difficulty: 'principiante',
    slideCount: 7,
    topics: ['Fundamentos', 'Fuentes abiertas', 'Ética']
  },
  {
    id: 'modulo2',
    order: 2,
    title: 'Búsqueda avanzada y Google Dorks',
    description: 'Operadores, consultas combinadas y una práctica segura con búsquedas especializadas.',
    icon: Search,
    durationMinutes: 25,
    difficulty: 'intermedio',
    slideCount: 7,
    topics: ['Operadores', 'Archivos', 'Consultas']
  },
  {
    id: 'modulo3',
    order: 3,
    title: 'Investigación en redes sociales',
    description: 'Búsqueda de perfiles, verificación cruzada y análisis responsable entre plataformas.',
    icon: Target,
    durationMinutes: 30,
    difficulty: 'intermedio',
    slideCount: 7,
    topics: ['Perfiles', 'Verificación', 'Cruce de fuentes']
  },
  {
    id: 'modulo4',
    order: 4,
    title: 'Análisis de imágenes',
    description: 'Metadatos, búsqueda inversa, geolocalización y detección de manipulación visual.',
    icon: Search,
    durationMinutes: 35,
    difficulty: 'avanzado',
    slideCount: 7,
    topics: ['EXIF', 'Geolocalización', 'Verificación']
  },
  {
    id: 'modulo5',
    order: 5,
    title: 'Mentalidad del analista',
    description: 'Hipótesis, evaluación de fuentes, sesgos y documentación reproducible de hallazgos.',
    icon: Brain,
    durationMinutes: 25,
    difficulty: 'avanzado',
    slideCount: 7,
    topics: ['Hipótesis', 'Sesgos', 'Documentación']
  }
]

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
  }
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
