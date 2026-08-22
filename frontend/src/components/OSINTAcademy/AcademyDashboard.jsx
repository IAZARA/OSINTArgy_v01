import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  ArrowLeft,
  ArrowRight,
  BookOpen, 
  Target, 
  Brain, 
  Search, 
  Clock,
  Play,
  Shield,
  Globe,
  Server,
  Mail,
  Lock,
  Activity,
  CheckCircle2,
  Layers3,
  Trophy
} from 'lucide-react'
import { useNavigate, useLocation } from '@/lib/router'
import {
  corporateAcademy,
  corporateModules
} from './data/corporateAcademy'
import { ACADEMY_LABS } from './academyData'
import { useAcademyProgress } from './useAcademyProgress'
import { getCompletedAcademyModules } from '@/utils/academyProgress'
import BrandSignature from '@components/Common/BrandSignature'
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
  const [completedModules] = useState(() => getCompletedAcademyModules())
  const [selectedAcademy, setSelectedAcademy] = useState(location.state?.selectedAcademy || null)
  const {
    progress: detailedProgress,
    recordActivity
  } = useAcademyProgress()

  // Academias disponibles
  const academies = [
    {
      id: 'osint',
      title: 'Academia OSINT',
      description: 'Aprendé técnicas de inteligencia de fuentes abiertas con ejercicios y recursos interactivos.',
      icon: Search,
      modules: 6,
      duration: '2.5 horas',
      difficulty: 'principiante',
      color: 'primary'
    },
    {
      id: 'infrastructure',
      title: 'Huella Digital e Infraestructura Defensiva',
      description: 'Mapeá dominios, emails, DNS, certificados y riesgos públicos con un enfoque defensivo.',
      icon: Shield,
      modules: 6,
      duration: '2 horas',
      difficulty: 'intermedio',
      color: 'secondary'
    },
    corporateAcademy
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
    infrastructure: infrastructureModules,
    corporate: corporateModules
  }

  const selectedAcademyData = academies.find((academy) => academy.id === selectedAcademy)
  const selectedModules = modulesByAcademy[selectedAcademy] || []
  const allModuleIds = Object.values(modulesByAcademy).flat().map((module) => module.id)
  const hasCompletedModule = (moduleId) => (
    completedModules.includes(moduleId)
    || Boolean(detailedProgress.modules[moduleId]?.completed)
    || (moduleId === 'audio-resumen' && detailedProgress.audio.completed)
  )
  const completedCount = allModuleIds.filter(hasCompletedModule).length
  const totalModules = allModuleIds.length
  const overallProgress = totalModules ? Math.round((completedCount / totalModules) * 100) : 0
  const selectedCompletedCount = selectedModules.filter((module) => hasCompletedModule(module.id)).length
  const selectedProgress = selectedModules.length
    ? Math.round((selectedCompletedCount / selectedModules.length) * 100)
    : 0
  const nextModule = selectedModules.find((module) => !hasCompletedModule(module.id))

  const handleAcademyClick = (academy) => {
    setSelectedAcademy(academy.id)
  }

  const handleModuleClick = (module) => {
    if (module.type === 'audio') {
      navigate('/academy/audio')
    } else if (module.type === 'corporate-lab') {
      navigate('/academy/corporate-lab')
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
    return hasCompletedModule(moduleId)
  }

  const handleActivityClick = (activity) => {
    recordActivity(activity.id)
    navigate(activity.route)
  }

  return (
    <div className="academy-dashboard">
      <header className="academy-topbar">
        <button type="button" className="academy-topbar__back" onClick={() => navigate('/')}>
          <ArrowLeft size={18} /> Volver a la galaxia
        </button>
        <BrandSignature context="Academia" compact className="academy-topbar__brand" />
        <div className="academy-topbar__progress" aria-label={`${overallProgress}% de progreso total`}>
          <span>{completedCount}/{totalModules} módulos</span>
          <div
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={overallProgress}
          >
            <i style={{ width: `${overallProgress}%` }} />
          </div>
          <strong>{overallProgress}%</strong>
        </div>
      </header>

      <AnimatePresence mode="wait">
      {!selectedAcademy ? (
        <motion.section
          key="academies"
          className="academy-view academy-view--catalog"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.section className="academy-hero" variants={itemVariants}>
            <div className="academy-hero__copy">
              <span className="academy-eyebrow">Aprendizaje práctico y defensivo</span>
              <h1><span>Convertí curiosidad en</span><em>criterio analítico.</em></h1>
              <p>
                Elegí una ruta, avanzá a tu ritmo y practicá cómo documentar evidencia
                pública de forma ética, trazable y reproducible.
              </p>
              <div className="academy-hero__benefits">
                <span><CheckCircle2 size={16} /> Progreso local</span>
                <span><Layers3 size={16} /> 3 rutas especializadas</span>
                <span><Trophy size={16} /> Laboratorios aplicados</span>
              </div>
            </div>
            <aside className="academy-journey-card">
              <span>Tu recorrido</span>
              <strong>{overallProgress}%</strong>
              <div
                className="academy-journey-card__track"
                role="progressbar"
                aria-label="Progreso total"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={overallProgress}
              >
                <i style={{ width: `${overallProgress}%` }} />
              </div>
              <p>
                {completedCount
                  ? `Completaste ${completedCount} de ${totalModules} módulos.`
                  : 'Empezá por la ruta que mejor responda a tu objetivo.'}
              </p>
              <small>Todo queda guardado en este navegador.</small>
            </aside>
          </motion.section>

          <motion.section className="academy-catalog" variants={itemVariants}>
            <header className="academy-section-heading">
              <div>
                <span>Rutas de aprendizaje</span>
                <h2>¿Qué querés aprender hoy?</h2>
              </div>
              <p>Cada academia combina conceptos, práctica y un cierre aplicable a investigaciones reales.</p>
            </header>
            <div className="academies-container">
              {academies.map((academy) => (
                <motion.button
                  type="button"
                  key={academy.id}
                  className={`academy-banner academy-banner--${academy.color}`}
                  onClick={() => handleAcademyClick(academy)}
                  variants={itemVariants}
                  whileHover={{ y: -7, scale: 1.012 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="academy-banner__topline">
                    <div className="banner-icon">
                      <academy.icon size={30} />
                    </div>
                    <span>{academy.difficulty}</span>
                  </div>
                  <div className="banner-content">
                    <h3>{academy.title}</h3>
                    <p>{academy.description}</p>
                  </div>
                  <div className="academy-banner__meta">
                    <span><BookOpen size={15} /> {academy.modules} módulos</span>
                    <span><Clock size={15} /> {academy.duration}</span>
                  </div>
                  <div className="academy-banner__action">
                    Explorar academia <ArrowRight size={17} />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.section>
        </motion.section>
      ) : (
        <motion.section
          key="modules"
          className="academy-view academy-view--modules"
          variants={panelVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.section className="academy-track-hero" variants={itemVariants}>
            <div className="academy-track-hero__copy">
              <button onClick={handleBackToAcademies} className="back-button">
                <ArrowLeft size={17} /> Todas las academias
              </button>
              <span className="academy-eyebrow">Ruta especializada</span>
              <h1>{selectedAcademyData?.title}</h1>
              <p>{selectedAcademyData?.description}</p>
              <div className="academy-track-hero__meta">
                <span><BookOpen size={16} /> {selectedModules.length} módulos</span>
                <span><Clock size={16} /> {selectedAcademyData?.duration}</span>
                <span><Target size={16} /> {selectedAcademyData?.difficulty}</span>
              </div>
            </div>
            <aside className="academy-track-progress">
              <span>Progreso de la ruta</span>
              <div className="academy-track-progress__value">
                <strong>{selectedProgress}%</strong>
                <small>{selectedCompletedCount}/{selectedModules.length} completados</small>
              </div>
              <div
                className="academy-track-progress__bar"
                role="progressbar"
                aria-label={`Progreso de ${selectedAcademyData?.title}`}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={selectedProgress}
              >
                <i style={{ width: `${selectedProgress}%` }} />
              </div>
              {nextModule ? (
                <button type="button" onClick={() => handleModuleClick(nextModule)}>
                  {selectedCompletedCount ? 'Continuar recorrido' : 'Comenzar recorrido'}
                  <ArrowRight size={17} />
                </button>
              ) : (
                <div className="academy-track-progress__complete"><Trophy size={18} /> Ruta completada</div>
              )}
            </aside>
          </motion.section>

          <motion.section className="modules-section" variants={itemVariants}>
            <header className="academy-section-heading">
              <div>
                <span>Plan de estudio</span>
                <h2>Avanzá paso a paso</h2>
              </div>
              <p>Podés abrir cualquier módulo; la numeración es una guía, no un bloqueo.</p>
            </header>
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
                  <div className="module-footer">
                    <span><Clock size={15} /> {module.duration}</span>
                    <strong>
                      {isModuleCompleted(module.id) ? 'Revisar' : 'Abrir módulo'}
                      <ArrowRight size={16} />
                    </strong>
                  </div>
                  {isModuleCompleted(module.id) && (
                    <div className="completed-indicator">
                      <CheckCircle2 size={16} />
                      <span>Completado</span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>

          {selectedAcademy === 'osint' && (
            <motion.section className="modules-section academy-practice-section" variants={itemVariants}>
              <header className="academy-section-heading">
                <div>
                  <span>Práctica guiada</span>
                  <h2>Aplicá lo aprendido</h2>
                </div>
                <p>Laboratorios simulados para entrenar técnicas y criterio sin afectar objetivos reales.</p>
              </header>
              <div className="modules-grid">
                {ACADEMY_LABS.filter((activity) => activity.id !== 'audio').map((activity, index) => {
                  const ActivityIcon = activity.icon
                  const isCompleted = Boolean(detailedProgress.activities[activity.id]?.completed)

                  return (
                    <motion.button
                      type="button"
                      key={activity.id}
                      className={`module-card module-card--lab ${isCompleted ? 'completed' : ''}`}
                      onClick={() => handleActivityClick(activity)}
                      variants={itemVariants}
                      whileHover={{ y: -8, scale: 1.015 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <span className="module-index">LAB {String(index + 1).padStart(2, '0')}</span>
                      <div className="module-header">
                        <div className="module-icon"><ActivityIcon size={32} /></div>
                        <div className="difficulty-badge intermedio">práctico</div>
                      </div>
                      <h3>{activity.title}</h3>
                      <p>{activity.description}</p>
                      <div className="module-footer">
                        <span><Activity size={15} /> {activity.meta}</span>
                        <strong>Entrar al laboratorio <ArrowRight size={16} /></strong>
                      </div>
                      {isCompleted && (
                        <div className="completed-indicator">
                          <CheckCircle2 size={16} />
                          <span>Completado</span>
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            </motion.section>
          )}
        </motion.section>
      )}
      </AnimatePresence>
    </div>
  )
}

export default AcademyDashboard
