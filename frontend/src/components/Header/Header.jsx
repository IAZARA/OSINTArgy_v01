import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from '@/lib/router'
import { Search, Menu, X, Target, Wrench, ChevronDown, Mail, Upload, User, Shield, Clock, TrendingUp, Info, GraduationCap, GitBranch, Network, Briefcase, FolderKanban, Plus } from 'lucide-react'
import { debounce } from '@utils/helpers'
import { SEARCH } from '@utils/constants'
import { useTools } from '@hooks/useTools'
import { useSearchSuggestions } from '@hooks/useSearchSuggestions'
import { useCases } from '@/context/CaseContext'
import CaseWizard from '@components/Cases/CaseWizard'
import logoImage from '@/assets/images/OSINTA2.png'
import './Header.css'

/**
 * Componente Header principal de OSINTArgy
 * @param {Object} props - Propiedades del componente
 * @param {Function} props.onSearch - Función para realizar búsqueda
 * @param {string} props.searchQuery - Query de búsqueda actual
 */
const Header = ({
  onSearch,
  searchQuery
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false)
  const [searchValue, setSearchValue] = useState(searchQuery || '')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [isCaseWizardOpen, setIsCaseWizardOpen] = useState(false)

  const searchInputRef = useRef(null)
  const systemMenuRef = useRef(null)
  const suggestionsRef = useRef(null)
  const navigate = useNavigate()
  const { activeCase, activeCases, setActiveCaseId, createCase } = useCases()

  // Hooks para datos y sugerencias
  const { tools, categories } = useTools()
  const { 
    generateSuggestions, 
    addToRecentSearches, 
    getTrendingSuggestions,
    recentSearches,
    isReady 
  } = useSearchSuggestions(tools, categories)

  // Estado de sugerencias
  const [currentSuggestions, setCurrentSuggestions] = useState([])

  // Debounced function para generar sugerencias
  const debouncedGenerateSuggestions = React.useMemo(
    () => debounce((query) => {
      if (isReady) {
        const suggestions = generateSuggestions(query, 8)
        setCurrentSuggestions(suggestions)
        setActiveSuggestionIndex(-1)
      }
    }, 200),
    [generateSuggestions, isReady]
  )

  // Debounced search function
  const debouncedSearch = React.useMemo(
    () => debounce((query) => {
      if (onSearch) {
        onSearch(query)
      }
    }, SEARCH.DEBOUNCE_DELAY),
    [onSearch]
  )

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchValue(value)
    
    // Generar sugerencias
    if (isReady) {
      debouncedGenerateSuggestions(value)
      setShowSuggestions(true)
    }
    
    // Realizar búsqueda si cumple criterios
    if (value.trim().length >= SEARCH.MIN_QUERY_LENGTH) {
      debouncedSearch(value)
    } else {
      debouncedSearch.cancel?.()
      onSearch?.('')
    }
  }

  // Manejar submit del formulario de búsqueda
  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmedValue = searchValue.trim()
    
    if (trimmedValue.length >= SEARCH.MIN_QUERY_LENGTH) {
      // Agregar al historial de búsquedas
      addToRecentSearches(trimmedValue)
      
      if (onSearch) {
        onSearch(trimmedValue)
      }
      navigate('/explore')
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      
      // Quitar foco del input
      searchInputRef.current?.blur()
    }
  }

  // Manejar selección de sugerencia
  const handleSuggestionSelect = (suggestion) => {
    setSearchValue(suggestion)
    addToRecentSearches(suggestion)
    
    if (onSearch) {
      onSearch(suggestion)
    }
    navigate('/explore')
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    searchInputRef.current?.blur()
  }

  // Manejar teclas de navegación
  const handleKeyDown = (e) => {
    if (!showSuggestions || currentSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev < currentSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : currentSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeSuggestionIndex >= 0) {
          handleSuggestionSelect(currentSuggestions[activeSuggestionIndex])
        } else {
          handleSearchSubmit(e)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
        searchInputRef.current?.blur()
        break
    }
  }

  // Limpiar búsqueda
  const handleClearSearch = () => {
    setSearchValue('')
    setShowSuggestions(false)
    setCurrentSuggestions([])
    setActiveSuggestionIndex(-1)
    if (onSearch) {
      onSearch('')
    }
  }

  // Manejar foco del input
  const handleInputFocus = () => {
    if (isReady) {
      const suggestions = generateSuggestions(searchValue, 8)
      setCurrentSuggestions(suggestions)
      setShowSuggestions(true)
    }
  }

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (systemMenuRef.current && !systemMenuRef.current.contains(event.target)) {
        setIsSystemMenuOpen(false)
      }
      
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        setShowSuggestions(false)
        setActiveSuggestionIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Sincronizar searchValue con searchQuery prop
  useEffect(() => {
    setSearchValue(searchQuery || '')
  }, [searchQuery])

  useEffect(() => () => {
    debouncedGenerateSuggestions.cancel?.()
    debouncedSearch.cancel?.()
  }, [debouncedGenerateSuggestions, debouncedSearch])

  const handleCreateCase = async (values) => {
    const project = await createCase(values)
    setIsCaseWizardOpen(false)
    navigate(`/investigation-board/${project.id}`)
  }

  return (
    <header className="header">
      <div className="header__container">
        {/* Logo y título */}
        <div className="header__brand">
          <Link to="/" className="header__logo">
            <img 
              src={logoImage} 
              alt="OSINT Argy Logo" 
              className="header__logo-image"
            />
          </Link>
        </div>

        {/* Barra de búsqueda */}
        <div className="header__search">
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-container">
              <Search className="search-icon" size={20} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar herramientas OSINT..."
                value={searchValue}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                className="search-input"
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-activedescendant={activeSuggestionIndex >= 0 ? `suggestion-${activeSuggestionIndex}` : undefined}
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="search-clear"
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sugerencias de búsqueda */}
            {showSuggestions && (
              <div 
                ref={suggestionsRef}
                className="search-suggestions"
                role="listbox"
              >
                {currentSuggestions.length > 0 ? (
                  <>
                    {currentSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        id={`suggestion-${index}`}
                        type="button"
                        className={`search-suggestion ${index === activeSuggestionIndex ? 'search-suggestion--active' : ''}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        role="option"
                        aria-selected={index === activeSuggestionIndex}
                      >
                        <Search size={16} />
                        <span className="search-suggestion-text">{suggestion}</span>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="search-suggestions-empty">
                    {/* Mostrar búsquedas recientes si no hay sugerencias */}
                    {recentSearches.length > 0 && (
                      <>
                        <div className="search-suggestions-section">
                          <div className="search-suggestions-header">
                            <Clock size={14} />
                            <span>Búsquedas recientes</span>
                          </div>
                          {recentSearches.slice(0, 5).map((recent, index) => (
                            <button
                              key={`recent-${index}`}
                              type="button"
                              className="search-suggestion search-suggestion--recent"
                              onClick={() => handleSuggestionSelect(recent)}
                            >
                              <Clock size={16} />
                              <span className="search-suggestion-text">{recent}</span>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    
                    {/* Mostrar sugerencias trending */}
                    {getTrendingSuggestions().length > 0 && (
                      <div className="search-suggestions-section">
                        <div className="search-suggestions-header">
                          <TrendingUp size={14} />
                          <span>Populares</span>
                        </div>
                        {getTrendingSuggestions().slice(0, 4).map((trending, index) => (
                          <button
                            key={`trending-${index}`}
                            type="button"
                            className="search-suggestion search-suggestion--trending"
                            onClick={() => handleSuggestionSelect(trending)}
                          >
                            <TrendingUp size={16} />
                            <span className="search-suggestion-text">{trending}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Menú de Herramientas del Sistema y Acerca de */}
        <div className="header__system">
          <button
            type="button"
            className="header-new-case"
            onClick={() => setIsCaseWizardOpen(true)}
            aria-label="Crear nueva investigación"
          >
            <Plus size={18} />
            <span>Nueva investigación</span>
          </button>

          <div className="header-case-switcher">
            <Briefcase size={18} />
            <select
              aria-label="Caso activo"
              value={activeCase?.id || ''}
              onChange={(event) => {
                const caseId = event.target.value
                setActiveCaseId(caseId)
                if (caseId) navigate(`/investigation-board/${caseId}`)
              }}
            >
              <option value="">Sin caso activo</option>
              {activeCases.map((project) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>

          {/* Botón Academia */}
          <Link to="/academy" className="academy-button" aria-label="Academia OSINT">
            <GraduationCap size={20} />
            <span className="academy-button__text">Academia</span>
          </Link>

          {/* Botón Acerca de */}
          <Link to="/about" className="about-button" aria-label="Acerca de OSINT Argy">
            <Info size={20} />
            <span className="about-button__text">Acerca de</span>
          </Link>

          <div className="system-menu" ref={systemMenuRef}>
            <button
              className="system-menu__trigger"
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              aria-label="Herramientas del Sistema"
              aria-expanded={isSystemMenuOpen}
              aria-haspopup="menu"
            >
              <Wrench size={20} />
              <span className="system-menu__text">Herramientas del Sistema</span>
              <ChevronDown size={16} className={`system-menu__arrow ${isSystemMenuOpen ? 'rotated' : ''}`} />
            </button>

            {isSystemMenuOpen && (
              <div className="system-menu__dropdown">
                <div className="system-menu__header">
                  <Wrench size={20} />
                  <span>Herramientas del Sistema</span>
                </div>

                <div className="system-menu__section">
                  <Link
                    to="/research"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <FolderKanban size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Centro de investigación</span>
                      <span className="system-menu__item-description">Casos recientes, hallazgos, favoritos y accesos rápidos</span>
                    </div>
                  </Link>

                  <Link
                    to={activeCase ? `/investigation-board/${activeCase.id}` : '/investigations'}
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <Network size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Tablero de Investigación</span>
                      <span className="system-menu__item-description">Conecta entidades, relaciones y ubicaciones en un caso local</span>
                    </div>
                  </Link>

                  <Link
                    to="/osint-flowcharts"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <GitBranch size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">OSINT Flowcharts</span>
                      <span className="system-menu__item-description">Guías interactivas paso a paso para investigaciones</span>
                    </div>
                  </Link>

                  <Link
                    to="/dorks"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <Target size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Generador de Dorks</span>
                      <span className="system-menu__item-description">Crea consultas avanzadas para motores de búsqueda</span>
                    </div>
                  </Link>

                  <Link
                    to="/email-osint"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <Mail size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">OSINT de Emails</span>
                      <span className="system-menu__item-description">Verifica emails en múltiples plataformas y brechas</span>
                    </div>
                  </Link>

                  <Link
                    to="/file-analysis"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <Upload size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Análisis de Archivos</span>
                      <span className="system-menu__item-description">Extrae metadatos de imágenes y documentos</span>
                    </div>
                  </Link>

                  <Link
                    to="/username-osint"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <User size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Búsqueda de Usernames</span>
                      <span className="system-menu__item-description">Encuentra perfiles en múltiples plataformas</span>
                    </div>
                  </Link>

                  <Link
                    to="/infrastructure-scanner"
                    className="system-menu__item"
                    onClick={() => setIsSystemMenuOpen(false)}
                  >
                    <Shield size={16} />
                    <div className="system-menu__item-content">
                      <span className="system-menu__item-title">Scanner de Infraestructura</span>
                      <span className="system-menu__item-description">Análisis defensivo de superficie de ataque</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menú móvil */}
        <button
          className="header__mobile-menu"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Menú móvil expandido */}
      {isMenuOpen && (
        <div className="header__mobile-nav">
          <div className="mobile-search">
            <form onSubmit={handleSearchSubmit} className="search-form">
              <div className="search-input-container">
                <Search className="search-icon" size={20} />
                <input
                  type="text"
                  placeholder="Buscar herramientas..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="search-clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="mobile-system-menu">
            <div className="mobile-system-header">
              <Wrench size={20} />
              <span>Herramientas del Sistema</span>
            </div>
            <div className="mobile-system-actions">
              <button
                type="button"
                className="mobile-system-action mobile-system-action--primary"
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsCaseWizardOpen(true)
                }}
              >
                <Plus size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Nueva investigación</span>
                  <span className="mobile-system-action-description">Crear un caso guiado</span>
                </div>
              </button>
              <Link
                to="/research"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <FolderKanban size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Centro de investigación</span>
                  <span className="mobile-system-action-description">Retomá casos y hallazgos recientes</span>
                </div>
              </Link>
              <Link
                to="/academy"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <GraduationCap size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Academia OSINT</span>
                  <span className="mobile-system-action-description">Aprende OSINT de forma interactiva</span>
                </div>
              </Link>
              <Link
                to="/about"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Info size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Acerca de</span>
                  <span className="mobile-system-action-description">Información sobre OSINT Argy</span>
                </div>
              </Link>
              <Link
                to={activeCase ? `/investigation-board/${activeCase.id}` : '/investigations'}
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Network size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Tablero de Investigación</span>
                  <span className="mobile-system-action-description">
                    {activeCase ? `Continuar ${activeCase.name}` : 'Organiza entidades, vínculos y lugares'}
                  </span>
                </div>
              </Link>

              <Link
                to="/osint-flowcharts"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <GitBranch size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">OSINT Flowcharts</span>
                  <span className="mobile-system-action-description">Guías paso a paso</span>
                </div>
              </Link>

              <Link
                to="/dorks"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Target size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Generador de Dorks</span>
                  <span className="mobile-system-action-description">Crea consultas avanzadas</span>
                </div>
              </Link>

              <Link
                to="/email-osint"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Mail size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">OSINT de Emails</span>
                  <span className="mobile-system-action-description">Verifica emails en plataformas</span>
                </div>
              </Link>

              <Link
                to="/file-analysis"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Upload size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Análisis de Archivos</span>
                  <span className="mobile-system-action-description">Extrae metadatos de archivos</span>
                </div>
              </Link>

              <Link
                to="/username-osint"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <User size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Búsqueda de Usernames</span>
                  <span className="mobile-system-action-description">Encuentra perfiles de usuario</span>
                </div>
              </Link>

              <Link
                to="/infrastructure-scanner"
                className="mobile-system-action"
                onClick={() => setIsMenuOpen(false)}
              >
                <Shield size={16} />
                <div className="mobile-system-action-content">
                  <span className="mobile-system-action-title">Scanner de Infraestructura</span>
                  <span className="mobile-system-action-description">Análisis defensivo OSINT</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}
      {isCaseWizardOpen && (
        <CaseWizard
          onClose={() => setIsCaseWizardOpen(false)}
          onCreate={handleCreateCase}
        />
      )}
    </header>
  )
}

export default Header
