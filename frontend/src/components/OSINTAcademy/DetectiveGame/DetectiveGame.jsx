import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trophy,
  Clock,
  Search,
  AlertCircle,
  CheckCircle,
  ArrowLeft
} from 'lucide-react'
import { Link, useNavigate } from '@/lib/router'
import './DetectiveGame.css'
import { useAcademyProgress } from '../useAcademyProgress'

const DetectiveGame = () => {
  const { progress, recordActivity } = useAcademyProgress()
  const canvasRef = useRef(null)
  const [gameState, setGameState] = useState('menu') // menu, playing, paused, completed
  const [currentCase, setCurrentCase] = useState(0)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutos por caso
  const [hints, setHints] = useState(3)
  const [foundClues, setFoundClues] = useState([])
  const [completedCases, setCompletedCases] = useState(() => (
    progress.activities['detective-game']?.completedCases || []
  ))
  const [activeHint, setActiveHint] = useState('')

  // Casos del juego
  const cases = [
    {
      id: 1,
      title: 'El Perfil Perdido',
      description: 'Un usuario reportó que su perfil de redes sociales fue suplantado. Encuentra evidencia del perfil falso.',
      scenario: 'socialMedia',
      clues: [
        { id: 'profile_pic', x: 150, y: 200, radius: 25, hint: 'La foto de perfil parece ser una imagen de stock genérica' },
        { id: 'username', x: 300, y: 245, radius: 25, hint: 'El username contiene ".2024.fake" - muy sospechoso' },
        { id: 'account_age', x: 200, y: 265, radius: 25, hint: 'La cuenta fue creada ayer pero dice tener años de historia' }
      ],
      tools: ['reverse_image_search', 'username_analysis', 'account_verification']
    },
    {
      id: 2,
      title: 'La Imagen Modificada',
      description: 'Una imagen viral parece ser falsa. Usa herramientas OSINT para verificar su autenticidad.',
      scenario: 'imageAnalysis',
      clues: [
        { id: 'metadata', x: 180, y: 130, radius: 25, hint: 'Los metadatos muestran que fue editada con Photoshop' },
        { id: 'shadows', x: 400, y: 225, radius: 25, hint: 'Las sombras son inconsistentes con la iluminación' },
        { id: 'gps_location', x: 250, y: 150, radius: 25, hint: 'Las coordenadas GPS indican París, no donde dice estar' }
      ],
      tools: ['exif_analysis', 'shadow_analysis', 'reverse_image_search']
    },
    {
      id: 3,
      title: 'El Email Sospechoso',
      description: 'Verifica si un email es legítimo o un intento de phishing usando técnicas OSINT.',
      scenario: 'emailVerification',
      clues: [
        { id: 'sender_domain', x: 350, y: 80, radius: 25, hint: 'El dominio bamco-oficial.com no es del banco real' },
        { id: 'suspicious_tld', x: 250, y: 190, radius: 25, hint: 'El enlace usa .tk, un dominio gratuito sospechoso' },
        { id: 'headers_analysis', x: 200, y: 240, radius: 25, hint: 'Los headers muestran origen desde IP extranjera' }
      ],
      tools: ['whois_lookup', 'domain_analysis', 'header_inspection']
    }
  ]

  // Timer del juego
  useEffect(() => {
    let timer
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      handleCaseComplete(false)
    }
    return () => clearInterval(timer)
  }, [gameState, timeLeft])

  // Inicializar canvas
  useEffect(() => {
    if (canvasRef.current && gameState === 'playing') {
      drawScene()
    }
  }, [gameState, currentCase, foundClues])

  useEffect(() => {
    recordActivity('detective-game', {
      completedCases,
      completed: completedCases.length === cases.length
    })
  }, [completedCases, recordActivity])

  const drawScene = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Dibujar fondo según el escenario
    drawBackground(ctx, cases[currentCase].scenario)
    
    // Dibujar pistas (solo las no encontradas)
    cases[currentCase].clues.forEach(clue => {
      if (!foundClues.includes(clue.id)) {
        drawClue(ctx, clue)
      }
    })
    
    // Dibujar pistas encontradas con efecto
    foundClues.forEach(clueId => {
      const clue = cases[currentCase].clues.find(c => c.id === clueId)
      if (clue) {
        drawFoundClue(ctx, clue)
      }
    })
  }

  const drawBackground = (ctx, scenario) => {
    const { width, height } = ctx.canvas
    
    // Gradiente de fondo
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
    
    // Configuración de texto
    ctx.font = '14px Arial'
    ctx.textAlign = 'left'
    
    switch(scenario) {
      case 'socialMedia':
        // Dibujar interfaz de red social más realista
        // Header de la red social
        ctx.fillStyle = '#4267B2'
        ctx.fillRect(0, 0, width, 60)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.fillText('SocialBook', 20, 35)
        
        // Post principal
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(50, 80, width - 100, 120)
        ctx.fillStyle = '#000000'
        ctx.font = '14px Arial'
        ctx.fillText('Juan Pérez', 70, 110)
        ctx.font = '12px Arial'
        ctx.fillStyle = '#65676B'
        ctx.fillText('Publicado hace 2 horas', 70, 130)
        ctx.fillStyle = '#000000'
        ctx.fillText('¡Estoy en París! #vacaciones', 70, 160)
        
        // Foto de perfil (círculo)
        ctx.beginPath()
        ctx.arc(150, 200, 25, 0, Math.PI * 2)
        ctx.fillStyle = '#E4E6EA'
        ctx.fill()
        ctx.strokeStyle = '#BCC0C4'
        ctx.stroke()
        
        // Información sospechosa
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(50, 220, width - 100, 80)
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.fillText('👤 Usuario: juan.perez.2024.fake', 70, 245)
        ctx.fillText('📅 Cuenta creada: Ayer', 70, 265)
        ctx.fillText('📸 Foto: Imagen de stock', 70, 285)
        break
        
      case 'imageAnalysis':
        // Dibujar interfaz de análisis de imagen
        // Marco principal de la imagen
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(100, 60, width - 200, height - 120)
        ctx.strokeStyle = '#000000'
        ctx.lineWidth = 2
        ctx.strokeRect(100, 60, width - 200, height - 120)
        
        // Simular una imagen
        ctx.fillStyle = '#E8F4FD'
        ctx.fillRect(120, 80, width - 240, height - 160)
        
        // Información de metadatos
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.fillText('📷 Cámara: iPhone 13 Pro', 120, 110)
        ctx.fillText('📅 Fecha: 15/03/2023 14:30', 120, 130)
        ctx.fillText('📍 GPS: 48.8566° N, 2.3522° E', 120, 150)
        ctx.fillText('🔧 Editada con Photoshop', 120, 170)
        
        // Sombras inconsistentes
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'
        ctx.fillRect(350, 200, 100, 50)
        ctx.fillStyle = '#ff0000'
        ctx.fillText('⚠️ Sombras inconsistentes', 360, 230)
        break
        
      case 'emailVerification':
        // Dibujar interfaz de email
        // Header del email
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(50, 50, width - 100, 250)
        ctx.strokeStyle = '#E1E3E6'
        ctx.strokeRect(50, 50, width - 100, 250)
        
        // Información del email
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 14px Arial'
        ctx.fillText('De: seguridad@bamco-oficial.com', 70, 80)
        ctx.font = '12px Arial'
        ctx.fillText('Para: usuario@email.com', 70, 100)
        ctx.fillText('Asunto: Verificación de cuenta urgente', 70, 120)
        
        // Contenido sospechoso
        ctx.fillStyle = '#ff0000'
        ctx.font = 'bold 12px Arial'
        ctx.fillText('🚨 URGENTE: Su cuenta será bloqueada', 70, 150)
        ctx.fillStyle = '#000000'
        ctx.font = '12px Arial'
        ctx.fillText('Haga clic aquí para verificar:', 70, 170)
        ctx.fillStyle = '#0066cc'
        ctx.fillText('http://bamco-seguridad.tk/verificar', 70, 190)
        
        // Análisis de headers
        ctx.fillStyle = '#ff6600'
        ctx.font = '10px Arial'
        ctx.fillText('⚠️ Dominio sospechoso (.tk)', 70, 220)
        ctx.fillText('⚠️ Servidor: IP extranjera', 70, 240)
        ctx.fillText('⚠️ No coincide con banco oficial', 70, 260)
        break
    }
  }

  const drawClue = (ctx, clue) => {
    // Efecto de pulsación para pistas visibles
    const pulse = Math.sin(Date.now() * 0.003) * 3
    
    // Círculo pulsante más visible
    ctx.beginPath()
    ctx.arc(clue.x, clue.y, clue.radius + pulse, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(0, 212, 255, 0.2)'
    ctx.fill()
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.8)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Icono en el centro
    ctx.fillStyle = '#00d4ff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🔍', clue.x, clue.y + 5)
    
    // Efecto de brillo
    ctx.beginPath()
    ctx.arc(clue.x, clue.y, clue.radius + pulse + 5, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  const drawFoundClue = (ctx, clue) => {
    // Pista encontrada con check
    ctx.beginPath()
    ctx.arc(clue.x, clue.y, clue.radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(46, 204, 113, 0.3)'
    ctx.fill()
    ctx.strokeStyle = '#2ecc71'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Dibujar checkmark
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(clue.x - 10, clue.y)
    ctx.lineTo(clue.x - 3, clue.y + 7)
    ctx.lineTo(clue.x + 10, clue.y - 7)
    ctx.stroke()
  }

  const handleCanvasClick = (e) => {
    if (gameState !== 'playing') return
    
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (canvas.width / rect.width)
    const y = (e.clientY - rect.top) * (canvas.height / rect.height)
    
    // Verificar si se hizo clic en una pista
    const currentCaseData = cases[currentCase]
    currentCaseData.clues.forEach(clue => {
      if (!foundClues.includes(clue.id)) {
        const distance = Math.sqrt((x - clue.x) ** 2 + (y - clue.y) ** 2)
        if (distance <= clue.radius) {
          handleClueFound(clue)
        }
      }
    })
  }

  const handleClueFound = (clue) => {
    setFoundClues([...foundClues, clue.id])
    
    // Verificar si se encontraron todas las pistas
    if (foundClues.length + 1 === cases[currentCase].clues.length) {
      handleCaseComplete(true)
    }
  }

  const handleCaseComplete = (success) => {
    setGameState('completed')
    
    if (success) {
      setCompletedCases(completed => Array.from(new Set([...completed, currentCase])))
    }
  }

  const startGame = () => {
    setGameState('playing')
    setCurrentCase(0)
    setTimeLeft(300)
    setHints(3)
    setFoundClues([])
    setActiveHint('')
  }

  const nextCase = () => {
    if (currentCase < cases.length - 1) {
      setCurrentCase(currentCase + 1)
      setTimeLeft(300)
      setFoundClues([])
      setActiveHint('')
      setGameState('playing')
    } else {
      // Juego completado
      setGameState('menu')
    }
  }

  const useHint = () => {
    if (hints > 0) {
      setHints(hints - 1)
      // Mostrar pista de una pista no encontrada
      const unFoundClues = cases[currentCase].clues.filter(c => !foundClues.includes(c.id))
      if (unFoundClues.length > 0) {
        setActiveHint(unFoundClues[0].hint)
      }
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const navigate = useNavigate()

  return (
    <div className="detective-game">
      <div className="game-header">
        <div className="game-navigation">
          <button
            onClick={() => navigate('/academy', { state: { selectedAcademy: 'osint' } })}
            className="nav-button"
          >
            <ArrowLeft size={20} />
            <span>Volver a Academia</span>
          </button>
        </div>
        <h1>Detective Digital OSINT</h1>
        {gameState === 'playing' && (
          <div className="game-stats">
            <div className="stat">
              <Clock size={20} />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <div className="stat">
              <AlertCircle size={20} />
              <span>{hints} pistas</span>
            </div>
          </div>
        )}
      </div>

      {gameState === 'menu' && (
        <div className="game-menu">
          <h2>¡Bienvenido al Juego del Detective Digital!</h2>
          <p>
            Usa tus habilidades OSINT para resolver casos reales. 
            Encuentra pistas ocultas, verifica información y conviértete 
            en un experto investigador digital.
          </p>
          <div className="menu-features">
            <div className="feature">
              <Search size={32} />
              <h3>Investiga</h3>
              <p>Busca pistas en diferentes escenarios</p>
            </div>
            <div className="feature">
              <Clock size={32} />
              <h3>Contra el Tiempo</h3>
              <p>Resuelve casos antes de que se acabe el tiempo</p>
            </div>
            <div className="feature">
              <Trophy size={32} />
              <h3>Gana Puntos</h3>
              <p>Mejora tu puntuación y desbloquea nuevos casos</p>
            </div>
          </div>
          <button className="start-button" onClick={startGame}>
            <Play size={20} />
            Comenzar Juego
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="game-area">
          <div className="case-info">
            <h3>Caso {currentCase + 1}: {cases[currentCase].title}</h3>
            <p>{cases[currentCase].description}</p>
            <div className="progress">
              <span>Pistas encontradas: {foundClues.length}/{cases[currentCase].clues.length}</span>
            </div>
          </div>

          <div className="game-canvas-container">
            <canvas
              ref={canvasRef}
              width={700}
              height={400}
              onClick={handleCanvasClick}
              className="game-canvas"
            />
          </div>

          <div className="game-tools">
            <button 
              className="tool-button"
              onClick={useHint}
              disabled={hints === 0}
            >
              <AlertCircle size={16} />
              Usar Pista ({hints})
            </button>
            <button 
              className="tool-button"
              onClick={() => setGameState('paused')}
            >
              <Pause size={16} />
              Pausar
            </button>
          </div>
          {activeHint && <p className="game-hint" role="status">Pista: {activeHint}</p>}
        </div>
      )}

      {gameState === 'completed' && (
        <div className="game-completed">
          <h2>¡Caso Resuelto!</h2>
          <div className="completion-stats">
            <div className="stat-card">
              <Clock size={32} />
              <h3>Tiempo Restante</h3>
              <p>{formatTime(timeLeft)}</p>
            </div>
            <div className="stat-card">
              <CheckCircle size={32} />
              <h3>Pistas Encontradas</h3>
              <p>{foundClues.length}/{cases[currentCase].clues.length}</p>
            </div>
            <div className="stat-card">
              <Trophy size={32} />
              <h3>Casos Completados</h3>
              <p>{completedCases.length + 1}/{cases.length}</p>
            </div>
          </div>
          
          <div className="completion-actions">
            {currentCase < cases.length - 1 ? (
              <button className="next-button" onClick={nextCase}>
                Siguiente Caso
              </button>
            ) : (
              <button className="menu-button" onClick={() => setGameState('menu')}>
                Volver al Menú
              </button>
            )}
          </div>
        </div>
      )}

      {gameState === 'paused' && (
        <div className="game-paused">
          <h2>Juego Pausado</h2>
          <button 
            className="resume-button"
            onClick={() => setGameState('playing')}
          >
            <Play size={20} />
            Continuar
          </button>
          <button 
            className="menu-button"
            onClick={() => setGameState('menu')}
          >
            <RotateCcw size={20} />
            Volver al Menú
          </button>
        </div>
      )}
    </div>
  )
}

export default DetectiveGame
