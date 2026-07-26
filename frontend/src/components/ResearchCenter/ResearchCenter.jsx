import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Clock3,
  Compass,
  FileSearch,
  FolderKanban,
  GitBranch,
  GraduationCap,
  Library,
  Plus,
  Search,
  ShieldCheck,
  Sparkles
} from 'lucide-react'
import { Link, useNavigate } from '@/lib/router'
import { useCases } from '@/context/CaseContext'
import { useFavorites, useToolHistory } from '@hooks/useTools'
import { OBJECTIVE_TYPES, searchInvestigation } from '@utils/investigationProject'
import CaseWizard from '@components/Cases/CaseWizard'
import './ResearchCenter.css'

const formatRelativeDate = (value) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(value))
}

export default function ResearchCenter({ tools = [] }) {
  const {
    activeCase,
    activeCases,
    storageMode,
    createCase,
    setActiveCaseId
  } = useCases()
  const { favorites } = useFavorites()
  const { history: toolHistory, addToHistory } = useToolHistory()
  const navigate = useNavigate()
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchInputRef = useRef(null)

  const favoriteTools = tools.filter((tool) => favorites.includes(tool.id)).slice(0, 4)
  const recentTools = toolHistory.slice(0, 4)
  const recentCases = activeCases.slice(0, 4)
  const activeProgress = activeCase?.checklist.length
    ? Math.round(
      (activeCase.checklist.filter((item) => item.status === 'completed').length / activeCase.checklist.length) * 100
    )
    : 0

  const globalResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    if (term.length < 2) return { cases: [], records: [], tools: [], commands: [] }

    const commands = [
      { id: 'new', label: 'Nueva investigación', detail: 'Abrir el asistente de creación', keywords: 'crear caso nuevo' },
      { id: 'library', label: 'Abrir biblioteca', detail: 'Administrar investigaciones locales', keywords: 'casos investigaciones' },
      { id: 'continue', label: 'Continuar caso activo', detail: activeCase?.name || 'No hay un caso activo', keywords: 'retomar seguir activo', disabled: !activeCase },
      { id: 'explore', label: 'Explorar galaxia', detail: 'Buscar herramientas OSINT', keywords: 'herramientas recursos' },
      { id: 'flows', label: 'Abrir Flowcharts', detail: 'Seguir una metodología guiada', keywords: 'flujos checklist metodología' }
    ].filter((command) => (
      term.startsWith('>')
      && `${command.label} ${command.keywords}`.toLocaleLowerCase('es').includes(term.slice(1).trim())
    ))

    const matchingCases = activeCases.filter((project) => (
      `${project.name} ${project.objective} ${project.description}`.toLocaleLowerCase('es').includes(term)
    )).slice(0, 4)

    const records = activeCases.flatMap((project) => (
      searchInvestigation(project, term).map((result) => ({ ...result, caseId: project.id, caseName: project.name }))
    )).slice(0, 6)

    const matchingTools = tools.filter((tool) => (
      `${tool.name} ${tool.description} ${(tool.tags || []).join(' ')}`.toLocaleLowerCase('es').includes(term)
    )).slice(0, 6)

    return { cases: matchingCases, records, tools: matchingTools, commands }
  }, [activeCase, activeCases, query, tools])

  const hasSearchResults = Object.values(globalResults).some((results) => results.length)

  useEffect(() => {
    const focusGlobalSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', focusGlobalSearch)
    return () => window.removeEventListener('keydown', focusGlobalSearch)
  }, [])

  const handleCreate = async (values) => {
    const project = await createCase(values)
    setIsWizardOpen(false)
    navigate(`/investigation-board/${project.id}`)
  }

  const runCommand = (commandId) => {
    setQuery('')
    if (commandId === 'new') setIsWizardOpen(true)
    if (commandId === 'library') navigate('/investigations')
    if (commandId === 'continue' && activeCase) openCase(activeCase.id)
    if (commandId === 'explore') navigate('/explore')
    if (commandId === 'flows') navigate('/osint-flowcharts')
  }

  const openCase = (caseId, queryString = '') => {
    setActiveCaseId(caseId)
    navigate(`/investigation-board/${caseId}${queryString}`)
  }

  return (
    <div className="research-center">
      <header className="research-center__header">
        <div className="research-center__brand">
          <div className="research-center__brand-mark"><ShieldCheck size={24} /></div>
          <div>
            <span>OSINTArgy</span>
            <strong>Centro de Investigación</strong>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          <Link to="/investigations"><Library size={17} /> Casos</Link>
          <Link to="/explore"><Compass size={17} /> Galaxia</Link>
          <Link to="/osint-flowcharts"><GitBranch size={17} /> Flujos</Link>
          <Link to="/academy"><GraduationCap size={17} /> Academia</Link>
        </nav>
      </header>

      <main className="research-center__main">
        {storageMode === 'localstorage' && (
          <div className="research-center__storage-warning">
            Estás en modo de almacenamiento limitado. Exportá tus casos con frecuencia.
          </div>
        )}

        <section className="research-hero">
          <div className="research-hero__copy">
            <span className="research-kicker"><Sparkles size={14} /> Investigación organizada, evidencia trazable</span>
            <h1>Empezá por la pregunta,<br />no por la herramienta.</h1>
            <p>
              Definí un objetivo, seguí una metodología adaptable y conservá cada hallazgo
              dentro de un caso local.
            </p>
            <div className="research-hero__actions">
              <button className="research-primary-action" onClick={() => setIsWizardOpen(true)}>
                <Plus size={19} /> Nueva investigación
              </button>
              <Link to="/investigations" className="research-secondary-action">
                <FolderKanban size={18} /> Ver biblioteca
              </Link>
            </div>
          </div>

          {activeCase ? (
            <article className="continue-case-card">
              <div className="continue-case-card__topline">
                <span><Clock3 size={14} /> Continuar donde estabas</span>
                <small>{formatRelativeDate(activeCase.lastOpenedAt)}</small>
              </div>
              <h2>{activeCase.name}</h2>
              <p>{activeCase.objective || activeCase.description || 'Caso activo'}</p>
              <div className="continue-case-card__stats">
                <span><strong>{activeCase.findings.length}</strong> hallazgos</span>
                <span><strong>{activeCase.entities.length}</strong> entidades</span>
                <span><strong>{activeProgress}%</strong> checklist</span>
              </div>
              <div className="continue-case-card__progress"><span style={{ width: `${activeProgress}%` }} /></div>
              <button onClick={() => openCase(activeCase.id)}>
                Continuar investigación <ArrowRight size={18} />
              </button>
            </article>
          ) : (
            <article className="continue-case-card continue-case-card--empty">
              <Briefcase size={32} />
              <h2>Tu primer caso empieza acá</h2>
              <p>Se guardará únicamente en este navegador y podrás exportarlo cuando quieras.</p>
              <button onClick={() => setIsWizardOpen(true)}>
                Crear investigación <ArrowRight size={18} />
              </button>
            </article>
          )}
        </section>

        <section className="research-global-search">
          <Search size={20} />
          <input
            ref={searchInputRef}
            value={query}
            aria-label="Buscar en OSINTArgy"
            placeholder="Buscar casos, entidades, hallazgos o herramientas…"
            onChange={(event) => setQuery(event.target.value)}
          />
          <kbd>Ctrl K</kbd>
          {query.trim().length >= 2 && (
            <div className="research-search-results">
              {hasSearchResults ? (
                <>
                  {globalResults.commands.length > 0 && (
                    <section>
                      <h2>Comandos</h2>
                      {globalResults.commands.map((command) => (
                        <button
                          key={command.id}
                          disabled={command.disabled}
                          onClick={() => runCommand(command.id)}
                        >
                          <Sparkles size={16} />
                          <span><strong>{command.label}</strong><small>{command.detail}</small></span>
                        </button>
                      ))}
                    </section>
                  )}
                  {globalResults.cases.length > 0 && (
                    <section>
                      <h2>Casos</h2>
                      {globalResults.cases.map((project) => (
                        <button key={project.id} onClick={() => openCase(project.id)}>
                          <Briefcase size={16} />
                          <span><strong>{project.name}</strong><small>{project.objective || 'Investigación'}</small></span>
                        </button>
                      ))}
                    </section>
                  )}
                  {globalResults.records.length > 0 && (
                    <section>
                      <h2>Dentro de casos</h2>
                      {globalResults.records.map((result) => (
                        <button
                          key={`${result.caseId}-${result.kind}-${result.id}`}
                          onClick={() => openCase(result.caseId, `?view=${result.kind === 'finding' ? 'findings' : result.kind === 'location' ? 'locations' : 'network'}&select=${result.id}`)}
                        >
                          <FileSearch size={16} />
                          <span><strong>{result.label}</strong><small>{result.caseName} · {result.detail}</small></span>
                        </button>
                      ))}
                    </section>
                  )}
                  {globalResults.tools.length > 0 && (
                    <section>
                      <h2>Herramientas</h2>
                      {globalResults.tools.map((tool) => (
                        <a
                          key={tool.id}
                          href={tool.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={() => addToHistory(tool)}
                        >
                          <Compass size={16} />
                          <span><strong>{tool.name}</strong><small>{tool.description}</small></span>
                        </a>
                      ))}
                    </section>
                  )}
                </>
              ) : (
                <div className="research-search-results__empty">No encontramos coincidencias para “{query}”.</div>
              )}
            </div>
          )}
        </section>

        <section className="research-center__grid">
          <div className="research-panel research-panel--cases">
            <header>
              <div>
                <span>Actividad</span>
                <h2>Investigaciones recientes</h2>
              </div>
              <Link to="/investigations">Ver todas <ArrowRight size={15} /></Link>
            </header>
            {recentCases.length ? (
              <div className="research-recent-cases">
                {recentCases.map((project) => {
                  const objective = OBJECTIVE_TYPES.find((item) => item.id === project.objectiveType)
                  return (
                    <button key={project.id} onClick={() => openCase(project.id)}>
                      <span className="research-case-icon"><Briefcase size={18} /></span>
                      <span>
                        <strong>{project.name}</strong>
                        <small>{objective?.label || 'Caso libre'} · {project.findings.length} hallazgos</small>
                      </span>
                      <time>{formatRelativeDate(project.lastOpenedAt)}</time>
                      <ArrowRight size={16} />
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="research-panel__empty">
                <BookOpen size={25} />
                <p>Los casos que crees aparecerán acá para retomarlos rápidamente.</p>
              </div>
            )}
          </div>

          <div className="research-panel">
            <header>
              <div>
                <span>Accesos</span>
                <h2>Elegí cómo avanzar</h2>
              </div>
            </header>
            <div className="research-paths">
              <Link to="/osint-flowcharts"><GitBranch size={21} /><span><strong>Seguir un flujo</strong><small>Metodologías visuales paso a paso</small></span></Link>
              <Link to="/explore"><Compass size={21} /><span><strong>Explorar herramientas</strong><small>459 recursos en la galaxia OSINT</small></span></Link>
              <Link to="/academy"><GraduationCap size={21} /><span><strong>Aprender una técnica</strong><small>Lecciones y laboratorios guiados</small></span></Link>
            </div>
          </div>

          <div className="research-panel">
            <header>
              <div>
                <span>Tu espacio</span>
                <h2>Herramientas guardadas</h2>
              </div>
              <Link to="/explore">Explorar <ArrowRight size={15} /></Link>
            </header>
            <div className="research-tool-list">
              {(favoriteTools.length ? favoriteTools : recentTools).map((tool) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => addToHistory(tool)}
                >
                  <span>{tool.name.slice(0, 2).toUpperCase()}</span>
                  <div><strong>{tool.name}</strong><small>{favoriteTools.length ? 'Favorita' : 'Usada recientemente'}</small></div>
                  <ArrowRight size={15} />
                </a>
              ))}
              {!favoriteTools.length && !recentTools.length && (
                <div className="research-panel__empty">
                  <Compass size={25} />
                  <p>Tus favoritos y herramientas recientes aparecerán acá.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isWizardOpen && <CaseWizard onClose={() => setIsWizardOpen(false)} onCreate={handleCreate} />}
    </div>
  )
}
