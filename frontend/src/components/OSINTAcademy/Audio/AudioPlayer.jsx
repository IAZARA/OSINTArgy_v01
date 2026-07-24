import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  Play, 
  Pause, 
  ArrowLeft,
  Download,
  Clock
} from 'lucide-react'
import { markAcademyModuleCompleted } from '@/utils/academyProgress'
import './AudioPlayer.css'

const AudioPlayer = () => {
  const navigate = useNavigate()
  const audioRef = useRef(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const audioSrc = '/Podcast - OSINT.wav'

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const setAudioData = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)

    const handleAudioEnd = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      markAcademyModuleCompleted('audio-resumen')
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('ended', handleAudioEnd)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('ended', handleAudioEnd)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio) return

    const clickX = e.nativeEvent.offsetX
    const width = e.currentTarget.offsetWidth
    const newTime = (clickX / width) * duration
    
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }


  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const progressPercentage = duration ? (currentTime / duration) * 100 : 0

  const handleBackToAcademy = () => {
    navigate('/academy', { state: { selectedAcademy: 'osint' } })
  }

  return (
    <div className="audio-player-page">
      <div className="audio-player-container">
        {/* Header */}
        <div className="audio-header">
          <button 
            onClick={handleBackToAcademy}
            className="back-button"
          >
            <ArrowLeft size={20} />
            Volver a Academia OSINT
          </button>
          
          <div className="audio-info">
            <h1>Audio Resumen OSINT</h1>
            <p>Podcast completo sobre técnicas y metodologías de inteligencia de fuentes abiertas</p>
          </div>
        </div>

        {/* Audio Player */}
        <motion.div 
          className="audio-player"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <audio ref={audioRef} src={audioSrc} preload="metadata" />
          

          {/* Controls */}
          <div className="player-controls">
            {/* Main Controls */}
            <div className="main-controls">
              <button 
                onClick={togglePlayPause}
                className="control-btn primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="loading-spinner" />
                ) : isPlaying ? (
                  <Pause size={48} />
                ) : (
                  <Play size={48} />
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <span className="time-display">{formatTime(currentTime)}</span>
              
              <div className="progress-bar" onClick={handleSeek}>
                <div className="progress-track">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progressPercentage}%` }}
                  />
                  <div 
                    className="progress-thumb"
                    style={{ left: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              
              <span className="time-display">{formatTime(duration)}</span>
            </div>

          </div>

          {/* Additional Info */}
          <div className="audio-meta">
            <div className="meta-item">
              <Clock size={16} />
              <span>Duración: 7:33 minutos</span>
            </div>
            <div className="meta-item">
              <Download size={16} />
              <a href={audioSrc} download="Podcast-OSINT.wav">
                Descargar audio
              </a>
            </div>
          </div>
        </motion.div>

        {/* Description */}
        <motion.div 
          className="audio-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h2>Sobre este podcast</h2>
          <p>
            Este audio resumen cubre los aspectos fundamentales de OSINT (Open Source Intelligence), 
            proporcionando una visión completa de las técnicas, herramientas y metodologías utilizadas 
            en la investigación de fuentes abiertas.
          </p>
          
          <div className="topics-covered">
            <h3>Temas tratados:</h3>
            <ul>
              <li>Introducción a la inteligencia de fuentes abiertas</li>
              <li>Técnicas de búsqueda avanzada y Google Dorks</li>
              <li>Investigación en redes sociales</li>
              <li>Análisis de imágenes y geolocalización</li>
              <li>Mentalidad y metodología del analista OSINT</li>
              <li>Herramientas y recursos esenciales</li>
              <li>Casos de estudio y aplicaciones prácticas</li>
            </ul>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default AudioPlayer
