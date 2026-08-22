import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from '@/lib/router'
import { 
  Search, 
  Target, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Lightbulb,
  Code,
  Eye,
  Award,
  Zap,
  ArrowLeft
} from 'lucide-react'
import './DorkSimulator.css'
import { useAcademyProgress } from '../useAcademyProgress'

const DorkSimulator = () => {
  const reduceMotion = useReducedMotion()
  const navigate = useNavigate()
  const { progress, recordActivity } = useAcademyProgress()
  const feedbackTimerRef = useRef(null)
  const [currentQuery, setCurrentQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('basic')
  const [completedChallenges, setCompletedChallenges] = useState(() => (
    progress.activities['dork-simulator']?.completedChallenges || []
  ))
  const [currentChallenge, setCurrentChallenge] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [score, setScore] = useState(() => (
    progress.activities['dork-simulator']?.score || 0
  ))
  const [showHint, setShowHint] = useState(false)

  // Base de conocimientos de Google Dorks
  const dorkCategories = {
    basic: {
      name: 'Básico',
      icon: BookOpen,
      color: '#39b9dc'
    },
    files: {
      name: 'Archivos',
      icon: Eye,
      color: '#39b9dc'
    },
    security: {
      name: 'Seguridad',
      icon: Target,
      color: '#39b9dc'
    },
    social: {
      name: 'Social Media',
      icon: Search,
      color: '#39b9dc'
    }
  }

  const dorkChallenges = {
    basic: [
      {
        id: 'site_operator',
        title: 'Buscar en un sitio específico',
        description: 'Encuentra páginas que contengan "manual" solo en el sitio wikipedia.org',
        expectedPattern: /site:wikipedia\.org.*manual|manual.*site:wikipedia\.org/i,
        hint: 'Usa el operador site: seguido del dominio',
        solution: 'site:wikipedia.org manual',
        points: 100
      },
      {
        id: 'intitle_operator',
        title: 'Buscar en títulos',
        description: 'Encuentra páginas que tengan "login" en el título',
        expectedPattern: /intitle:login|intitle:"login"/i,
        hint: 'Usa el operador intitle: para buscar en los títulos de las páginas',
        solution: 'intitle:login',
        points: 150
      },
      {
        id: 'inurl_operator',
        title: 'Buscar en URLs',
        description: 'Encuentra páginas que tengan "publicaciones" en la URL del dominio who.int',
        expectedPattern: /site:who\.int.*inurl:publications|inurl:publications.*site:who\.int/i,
        hint: 'Combina site: con inurl: para limitar dominio y ruta',
        solution: 'site:who.int inurl:publications',
        points: 150
      }
    ],
    files: [
      {
        id: 'filetype_pdf',
        title: 'Buscar archivos PDF',
        description: 'Encuentra documentos PDF que contengan "manual de usuario"',
        expectedPattern: /filetype:pdf.*manual.*usuario|manual.*usuario.*filetype:pdf/i,
        hint: 'Usa filetype:pdf para buscar solo archivos PDF',
        solution: 'filetype:pdf "manual de usuario"',
        points: 200
      },
      {
        id: 'filetype_excel',
        title: 'Buscar hojas de cálculo',
        description: 'Encuentra archivos Excel (.xlsx) con "presupuesto"',
        expectedPattern: /filetype:xlsx.*presupuesto|presupuesto.*filetype:xlsx/i,
        hint: 'Usa filetype:xlsx para archivos Excel',
        solution: 'filetype:xlsx presupuesto',
        points: 200
      }
    ],
    security: [
      {
        id: 'directory_listing',
        title: 'Auditoría de indexación',
        description: 'Formula una consulta simulada para revisar títulos "Index of" sólo en el dominio de práctica example.com',
        expectedPattern: /site:example\.com.*intitle:"?index of"?|intitle:"?index of"?.*site:example\.com/i,
        hint: 'Limita siempre el alcance con site:example.com',
        solution: 'site:example.com intitle:"Index of"',
        points: 300
      },
      {
        id: 'config_files',
        title: 'Archivos de configuración en laboratorio',
        description: 'Formula una consulta simulada para revisar archivos .config sólo en example.com',
        expectedPattern: /filetype:config.*site:example\.com|site:example\.com.*filetype:config/i,
        hint: 'Combina filetype:config con el dominio reservado example.com',
        solution: 'site:example.com filetype:config',
        points: 350
      }
    ],
    social: [
      {
        id: 'twitter_search',
        title: 'Buscar publicaciones en X',
        description: 'Encuentra páginas públicas de X sobre "OSINT"',
        expectedPattern: /site:(x|twitter)\.com.*osint|osint.*site:(x|twitter)\.com/i,
        hint: 'Usa el operador site: con el dominio x.com',
        solution: 'site:x.com OSINT',
        points: 250
      }
    ]
  }

  // Resultados simulados para demostración
  const simulatedResults = [
    {
      title: 'Manual de Usuario - Wikipedia',
      url: 'https://es.wikipedia.org/wiki/Manual_de_usuario',
      snippet: 'Un manual de usuario es un documento técnico destinado a dar asistencia a las personas que utilizan un sistema en particular...'
    },
    {
      title: 'Publicaciones técnicas',
      url: 'https://www.who.int/publications',
      snippet: 'Catálogo público de informes, guías y publicaciones técnicas de la organización...'
    },
    {
      title: 'Manual de Usuario.pdf',
      url: 'https://empresa.com/docs/manual_usuario.pdf',
      snippet: 'Documento PDF con instrucciones completas para el uso del software...'
    }
  ]

  const totalChallenges = Object.values(dorkChallenges).reduce(
    (total, challenges) => total + challenges.length,
    0
  )

  const simulatedResult = useMemo(() => {
    const normalizedLength = currentQuery.trim().length
    return simulatedResults[normalizedLength % simulatedResults.length]
  }, [currentQuery])

  useEffect(() => {
    if (selectedCategory && dorkChallenges[selectedCategory].length > 0) {
      const uncompletedChallenges = dorkChallenges[selectedCategory].filter(
        challenge => !completedChallenges.includes(challenge.id)
      )
      if (uncompletedChallenges.length > 0) {
        setCurrentChallenge(uncompletedChallenges[0])
      } else {
        setCurrentChallenge(null)
      }
    }
  }, [selectedCategory, completedChallenges])

  useEffect(() => {
    recordActivity('dork-simulator', {
      completedChallenges,
      score,
      completed: completedChallenges.length === totalChallenges
    })
  }, [completedChallenges, recordActivity, score, totalChallenges])

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
  }, [])

  const scheduleFeedbackClear = (onClear) => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(onClear, 3000)
  }

  const handleQuerySubmit = (e) => {
    e.preventDefault()
    if (!currentChallenge || !currentQuery.trim()) return

    const isCorrect = currentChallenge.expectedPattern.test(currentQuery)
    
    if (isCorrect) {
      setFeedback({
        type: 'success',
        message: '¡Excelente! Has resuelto el desafío correctamente.',
        points: currentChallenge.points
      })
      setCompletedChallenges([...completedChallenges, currentChallenge.id])
      setScore(score + currentChallenge.points)
      
      scheduleFeedbackClear(() => {
        setFeedback(null)
        setCurrentQuery('')
        setShowHint(false)
      })
    } else {
      setFeedback({
        type: 'error',
        message: 'No es exactamente lo que buscamos. ¡Sigue intentando!',
        points: 0
      })
      
      scheduleFeedbackClear(() => {
        setFeedback(null)
      })
    }
  }

  const handleHint = () => {
    setShowHint(!showHint)
  }

  const formatQuery = (query) => {
    // Resaltar operadores especiales
    return query.replace(
      /(site:|intitle:|inurl:|filetype:|intext:)/gi,
      '<span class="operator">$1</span>'
    )
  }

  return (
    <div className="dork-simulator">
      <div className="simulator-header">
        <button
          type="button"
          className="simulator-back"
          onClick={() => navigate('/academy', { state: { selectedAcademy: 'osint' } })}
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver a Academia
        </button>
        <h1>Simulador de Google Dorks</h1>
        <p>Aprende y practica técnicas de búsqueda avanzada de forma segura</p>
        <div className="score-display">
          <Award size={20} />
          <span>{score} puntos</span>
        </div>
      </div>

      {/* Categorías */}
      <div className="categories-section">
        <h3>Categorías de Dorks</h3>
        <div className="categories-grid">
          {Object.entries(dorkCategories).map(([key, category]) => (
            <button
              key={key}
              className={`category-card ${selectedCategory === key ? 'active' : ''}`}
              onClick={() => setSelectedCategory(key)}
              style={{ borderColor: category.color }}
            >
              <category.icon size={24} style={{ color: category.color }} />
              <span>{category.name}</span>
              <div className="completed-indicator">
                {dorkChallenges[key].filter(c => completedChallenges.includes(c.id)).length}/
                {dorkChallenges[key].length}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Desafío actual */}
      {currentChallenge && (
        <motion.div
          className="challenge-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="challenge-header">
            <h3>{currentChallenge.title}</h3>
            <div className="challenge-points">
              <Zap size={16} />
              <span>{currentChallenge.points} pts</span>
            </div>
          </div>
          
          <p className="challenge-description">
            {currentChallenge.description}
          </p>

          <form onSubmit={handleQuerySubmit} className="search-form">
            <div className="search-container">
              <div className="google-mockup">
                <div className="google-logo">Google</div>
                <div className="search-input-container">
                  <input
                    type="text"
                    value={currentQuery}
                    onChange={(e) => setCurrentQuery(e.target.value)}
                    placeholder="Introduce tu Google Dork aquí..."
                    className="dork-input"
                  />
                  <button type="submit" className="search-button" aria-label="Evaluar consulta">
                    <Search size={20} />
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="challenge-actions">
            <button 
              type="button" 
              onClick={handleHint}
              className="hint-button"
            >
              <Lightbulb size={16} />
              {showHint ? 'Ocultar Pista' : 'Ver Pista'}
            </button>
          </div>

          <AnimatePresence>
            {showHint && (
              <motion.div
                className="hint-box"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Lightbulb size={16} />
                <span>{currentChallenge.hint}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback */}
          <AnimatePresence>
            {feedback && (
              <motion.div
                className={`feedback ${feedback.type}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle size={20} />
                ) : (
                  <XCircle size={20} />
                )}
                <span>{feedback.message}</span>
                {feedback.points > 0 && (
                  <span className="points">+{feedback.points} pts</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Resultados simulados */}
          {currentQuery && (
            <motion.div
              className="simulated-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <h4>Resultados simulados:</h4>
              <div className="result-item">
                <h5>{simulatedResult.title}</h5>
                <p className="result-url">{simulatedResult.url}</p>
                <p className="result-snippet">{simulatedResult.snippet}</p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Referencia rápida */}
      <div className="reference-section">
        <h3>Referencia Rápida de Operadores</h3>
        <div className="operators-grid">
          <div className="operator-card">
            <code>site:</code>
            <span>Buscar en un sitio específico</span>
            <div className="example">site:wikipedia.org</div>
          </div>
          <div className="operator-card">
            <code>filetype:</code>
            <span>Buscar tipo de archivo específico</span>
            <div className="example">filetype:pdf</div>
          </div>
          <div className="operator-card">
            <code>intitle:</code>
            <span>Buscar en títulos de página</span>
            <div className="example">intitle:login</div>
          </div>
          <div className="operator-card">
            <code>inurl:</code>
            <span>Buscar en URLs</span>
            <div className="example">inurl:publications</div>
          </div>
          <div className="operator-card">
            <code>intext:</code>
            <span>Buscar en contenido de página</span>
            <div className="example">intext:"política de privacidad"</div>
          </div>
          <div className="operator-card">
            <code>" "</code>
            <span>Buscar frase exacta</span>
            <div className="example">"manual de usuario"</div>
          </div>
        </div>
      </div>

      {/* Progreso */}
      <div className="progress-section">
        <h3>Tu Progreso</h3>
        <div className="progress-stats">
          {Object.entries(dorkChallenges).map(([key, challenges]) => {
            const completed = challenges.filter(c => completedChallenges.includes(c.id)).length
            const total = challenges.length
            const percentage = (completed / total) * 100
            
            return (
              <div key={key} className="progress-item">
                <div className="progress-header">
                  <span>{dorkCategories[key].name}</span>
                  <span>{completed}/{total}</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: dorkCategories[key].color 
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default DorkSimulator
