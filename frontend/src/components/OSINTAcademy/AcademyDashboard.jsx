import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  BookOpen, 
  Target, 
  Brain, 
  Search, 
  Clock,
  Unlock,
  Play,
  Shield,
  Globe,
  Server,
  Mail,
  Lock,
  Activity
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import './AcademyDashboard.css'

const panelVariants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.08
    }
  },
  exit: {
    opacity: 0,
    y: -12,
    filter: 'blur(6px)',
    transition: { duration: 0.24, ease: 'easeInOut' }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
  }
}

const AcademyDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [completedModules] = useState([])
  const [selectedAcademy, setSelectedAcademy] = useState(location.state?.selectedAcademy || null)

  // Academias disponibles
  const academies = [
    {
      id: 'osint',
      title: 'Academia OSINT',
      description: 'Aprende las técnicas de inteligencia de fuentes abiertas de forma interactiva',
      icon: Search,
      modules: 5,
      duration: '2.5 horas',
      difficulty: 'principiante',
      color: 'primary'
    },
    {
      id: 'infrastructure',
      title: 'Huella Digital e Infraestructura Defensiva',
      description: 'Aprende a mapear dominios, emails, DNS, certificados y riesgos públicos con foco defensivo',
      icon: Shield,
      modules: 6,
      duration: '2 horas',
      difficulty: 'intermedio',
      color: 'secondary'
    }
  ]

  // Módulos OSINT
  const osintModules = [
    {
      id: 'modulo1',
      title: 'Módulo 1: Introducción a OSINT',
      description: 'Fundamentos de la inteligencia de fuentes abiertas - qué es y para qué sirve',
      icon: BookOpen,
      duration: '20 min',
      difficulty: 'principiante',
      type: 'lesson'
    },
    {
      id: 'modulo2',
      title: 'Módulo 2: Google Dorks y Búsqueda Avanzada',
      description: 'Domina Google Dorks con mi generador automático de consultas avanzadas',
      icon: Search,
      duration: '25 min',
      difficulty: 'intermedio',
      type: 'lesson'
    },
    {
      id: 'modulo3',
      title: 'Módulo 3: Búsqueda en Redes Sociales',
      description: 'Técnicas avanzadas de investigación en plataformas sociales con ejemplos interactivos',
      icon: Target,
      duration: '30 min',
      difficulty: 'intermedio',
      type: 'lesson'
    },
    {
      id: 'modulo4',
      title: 'Módulo 4: Análisis de Imágenes',
      description: 'Geolocalización y verificación de imágenes usando herramientas OSINT',
      icon: Brain,
      duration: '35 min',
      difficulty: 'avanzado',
      type: 'lesson'
    },
    {
      id: 'modulo5',
      title: 'Módulo 5: Mentalidad del Analista',
      description: 'Cómo piensa y trabaja un analista OSINT profesional',
      icon: Brain,
      duration: '25 min',
      difficulty: 'avanzado',
      type: 'lesson'
    },
    {
      id: 'audio-resumen',
      title: 'Audio Resumen',
      description: 'Podcast resumen sobre técnicas y metodologías OSINT',
      icon: Play,
      duration: '7 min',
      difficulty: 'principiante',
      type: 'audio'
    }
  ]

  const infrastructureModules = [
    {
      id: 'infra1',
      title: 'Módulo 1: Huella Digital Pública',
      description: 'Entiende qué expone una organización en fuentes abiertas y cómo definir un alcance responsable',
      icon: Shield,
      duration: '18 min',
      difficulty: 'principiante',
      type: 'lesson'
    },
    {
      id: 'infra2',
      title: 'Módulo 2: Dominios, WHOIS y DNS',
      description: 'Interpreta registros DNS, servidores de correo, SPF, DKIM, DMARC y señales de configuración',
      icon: Globe,
      duration: '22 min',
      difficulty: 'intermedio',
      type: 'lesson'
    },
    {
      id: 'infra3',
      title: 'Módulo 3: Subdominios y Certificados',
      description: 'Descubre assets públicos con Certificate Transparency y analiza patrones de exposición',
      icon: Server,
      duration: '24 min',
      difficulty: 'intermedio',
      type: 'lesson'
    },
    {
      id: 'infra4',
      title: 'Módulo 4: Email y Phishing Defensivo',
      description: 'Evalúa correos, dominios parecidos, brechas y señales visibles de suplantación',
      icon: Mail,
      duration: '24 min',
      difficulty: 'intermedio',
      type: 'lesson'
    },
    {
      id: 'infra5',
      title: 'Módulo 5: SSL, Headers y Tecnologías',
      description: 'Lee configuraciones web públicas, prioriza riesgos y convierte hallazgos en recomendaciones',
      icon: Lock,
      duration: '26 min',
      difficulty: 'avanzado',
      type: 'lesson'
    },
    {
      id: 'infra-lab',
      title: 'Laboratorio: Auditoría Simulada',
      description: 'Clasifica hallazgos de un dominio ficticio, usa pistas y arma un reporte defensivo',
      icon: Activity,
      duration: '20 min',
      difficulty: 'intermedio',
      type: 'lab'
    }
  ]

  const modulesByAcademy = {
    osint: osintModules,
    infrastructure: infrastructureModules
  }

  const selectedAcademyData = academies.find((academy) => academy.id === selectedAcademy)
  const selectedModules = modulesByAcademy[selectedAcademy] || []

  const handleAcademyClick = (academy) => {
    setSelectedAcademy(academy.id)
  }

  const handleModuleClick = (module) => {
    if (module.type === 'audio') {
      navigate('/academy/audio')
    } else if (module.type === 'lab') {
      navigate('/academy/infrastructure-lab')
    } else {
      navigate(`/academy/lesson/${module.id}`)
    }
  }

  const handleBackToAcademies = () => {
    setSelectedAcademy(null)
  }

  const isModuleCompleted = (moduleId) => {
    return completedModules.includes(moduleId)
  }

  return (
    <div className="academy-dashboard">
      <AnimatePresence mode="wait">
      {!selectedAcademy ? (
        // Vista principal de academias
        <motion.section
          key="academies"
          className="academy-view"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="academy-header" variants={itemVariants}>
            <div className="academy-header-aura" aria-hidden="true" />
            <h1>Academias</h1>
            <p>Elige una academia para comenzar tu formación especializada</p>
          </motion.div>

          <motion.div className="modules-section" variants={itemVariants}>
            <div className="academies-container">
              {academies.map((academy) => (
                <motion.button
                  type="button"
                  key={academy.id}
                  className="academy-banner"
                  onClick={() => handleAcademyClick(academy)}
                  variants={itemVariants}
                  whileHover={{ y: -6, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="banner-icon">
                    <academy.icon size={48} />
                  </div>
                  
                  <div className="banner-content">
                    <h3>{academy.title}</h3>
                    <p>{academy.description}</p>
                  </div>
                  
                  <div className="banner-arrow">
                    →
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.section>
      ) : (
        // Vista de módulos de la academia seleccionada
        <motion.section
          key="modules"
          className="academy-view"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div className="academy-header" variants={itemVariants}>
            <div className="academy-header-aura" aria-hidden="true" />
            <div className="academy-navigation">
              <button 
                onClick={handleBackToAcademies}
                className="back-button"
              >
                ← Volver a Academias
              </button>
            </div>
            <h1>{selectedAcademyData?.title}</h1>
            <p>{selectedAcademyData?.description}</p>
          </motion.div>

          <motion.div className="modules-section" variants={itemVariants}>
            <div className="modules-grid">
              {selectedModules.map((module, index) => (
                <motion.button
                  type="button"
                  key={module.id}
                  className={`module-card ${isModuleCompleted(module.id) ? 'completed' : ''}`}
                  onClick={() => handleModuleClick(module)}
                  variants={itemVariants}
                  whileHover={{ y: -8, scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <span className="module-index">{String(index + 1).padStart(2, '0')}</span>
                  <div className="module-header">
                    <div className="module-icon">
                      <module.icon size={32} />
                    </div>
                    <div className={`difficulty-badge ${module.difficulty}`}>
                      {module.difficulty}
                    </div>
                  </div>
                  
                  <h3>{module.title}</h3>
                  <p>{module.description}</p>

                  <div className="module-meta">
                    <span>
                      <Clock size={16} />
                      {module.duration}
                    </span>
                  </div>
                  
                  {isModuleCompleted(module.id) && (
                    <div className="completed-indicator">
                      <Unlock size={16} />
                      <span>Completado</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.section>
      )}
      </AnimatePresence>
    </div>
  )
}

export default AcademyDashboard
