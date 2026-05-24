import React, { useState, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Componentes
import Header from '@components/Header/Header'
import GalaxyView from '@components/GalaxyView/GalaxyView'
import Loading from '@components/Common/Loading'
import OSINTFlowcharts from '@components/OSINTFlowcharts/OSINTFlowcharts'
import DorkGenerator from '@components/DorkGenerator/DorkGenerator'
import EmailOSINT from '@components/EmailOSINT/EmailOSINT'
import FileAnalysis from '@components/FileAnalysis/FileAnalysis'
import UsernameOSINT from '@components/UsernameOSINT/UsernameOSINT'
import InfrastructureScanner from '@components/InfrastructureScanner/InfrastructureScanner'
import DisclaimerModal from '@components/DisclaimerModal/DisclaimerModal'
import About from '@components/About/About'
import AcademyDashboard from '@components/OSINTAcademy/AcademyDashboard'
import DetectiveGame from '@components/OSINTAcademy/DetectiveGame/DetectiveGame'
import OSINTMindMap from '@components/OSINTAcademy/MindMap/OSINTMindMap'
import DorkSimulator from '@components/OSINTAcademy/Simulator/DorkSimulator'
import LessonViewer from '@components/OSINTAcademy/Lessons/LessonViewer'
import AudioPlayer from '@components/OSINTAcademy/Audio/AudioPlayer'
import FloatingHomeButton from '@components/Common/FloatingHomeButton'

// Hooks
import { useTools } from '@hooks/useTools'
import { useDisclaimer } from '@hooks/useDisclaimer'

// Estilos
import './App.css'
import './styles/maltego-theme.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const location = useLocation()

  const { tools, categories, isLoading: toolsLoading, error } = useTools()
  const { 
    isAccepted: disclaimerAccepted, 
    isLoading: disclaimerLoading, 
    acceptDisclaimer, 
    declineDisclaimer 
  } = useDisclaimer()

  // Determinar si estamos en una ruta de Academy o OSINT Flowcharts
  const isAcademyRoute = location.pathname.startsWith('/academy')
  const isFlowchartsRoute = location.pathname.startsWith('/osint-flowcharts')
  const shouldHideNavbar = isAcademyRoute || isFlowchartsRoute

  // Manejar búsqueda
  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  // Manejar selección de categoría
  const handleCategorySelect = (category) => {
    setSelectedCategory(category)
  }

  // Filtrar herramientas basado en búsqueda y categoría
  const filteredTools = React.useMemo(() => {
    if (!tools) return []
    
    let filtered = tools
    
    // Filtrar por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Filtrar por categoría
    if (selectedCategory) {
      filtered = filtered.filter(tool => tool.category === selectedCategory.id)
    }
    
    return filtered
  }, [tools, searchQuery, selectedCategory])

  // Mostrar loading si está cargando disclaimer o herramientas
  if (disclaimerLoading || toolsLoading) {
    return (
      <div className="app-loading">
        <Loading />
        <p>Cargando OSINTArgy...</p>
      </div>
    )
  }

  // Mostrar disclaimer si no ha sido aceptado
  if (!disclaimerAccepted) {
    return (
      <DisclaimerModal
        onAccept={acceptDisclaimer}
        onDecline={declineDisclaimer}
      />
    )
  }

  // Mostrar error si hay algún problema
  if (error) {
    return (
      <div className="app-error">
        <h2>Error al cargar la aplicación</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="app">
      {/* Header principal - Solo mostrar si no estamos en Academy o Flowcharts */}
      {!shouldHideNavbar && (
        <Header
          onSearch={handleSearch}
          searchQuery={searchQuery}
        />
      )}

      {/* Contenido principal */}
      <main className="app-main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="app-content">
                <GalaxyView
                  tools={filteredTools}
                  categories={categories}
                  onCategorySelect={handleCategorySelect}
                  selectedCategory={selectedCategory}
                  searchQuery={searchQuery}
                />
              </div>
            }
          />

          <Route path="/osint-flowcharts" element={<OSINTFlowcharts />} />
          <Route path="/dorks" element={<DorkGenerator />} />
          <Route path="/email-osint" element={<EmailOSINT />} />
          <Route path="/file-analysis" element={<FileAnalysis />} />
          <Route path="/username-osint" element={<UsernameOSINT />} />
          <Route path="/infrastructure-scanner" element={<InfrastructureScanner />} />
          <Route path="/about" element={<About />} />
          <Route path="/academy" element={<AcademyDashboard />} />
          <Route path="/academy/detective-game" element={<DetectiveGame />} />
          <Route path="/academy/mindmap" element={<OSINTMindMap />} />
          <Route path="/academy/dork-simulator" element={<DorkSimulator />} />
          <Route path="/academy/lesson/:lessonId" element={<LessonViewer />} />
          <Route path="/academy/audio" element={<AudioPlayer />} />
        </Routes>
      </main>

      {/* Botón flotante para volver al inicio - Solo mostrar en Academy y Flowcharts */}
      {shouldHideNavbar && <FloatingHomeButton />}

      {/* Notificaciones toast */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--white)',
            color: 'var(--gray-900)',
            border: '1px solid var(--gray-200)',
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          },
          success: {
            iconTheme: {
              primary: 'var(--accent-green)',
              secondary: 'var(--white)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-red)',
              secondary: 'var(--white)',
            },
          },
        }}
      />
    </div>
  )
}

export default App
