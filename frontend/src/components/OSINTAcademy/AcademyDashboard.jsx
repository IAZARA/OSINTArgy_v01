import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Target, Search, Clock, Play, Shield, Building2, CheckCircle2, Layers3, Trophy, Award, RotateCcw, Filter, FileCheck2 } from 'lucide-react'
import { useNavigate, useLocation } from '@/lib/router'
import { ACADEMY_LABS, formatAcademyDuration } from './academyData'
import { ACADEMY_COURSES, ACADEMY_LESSON_CATALOG, ACADEMY_PASS_SCORE } from './data/academyCatalog'
import { useAcademyProgress } from './useAcademyProgress'
import BrandSignature from '@components/Common/BrandSignature'
import './AcademyDashboard.css'

const icons = { osint: Search, infrastructure: Shield, corporate: Building2, verification: FileCheck2 }
const fold = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
const AcademyDashboard = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const reduceMotion = useReducedMotion()
  const [selectedAcademy, setSelectedAcademy] = useState(() => ACADEMY_COURSES.some(course => course.id === location.state?.selectedAcademy) ? location.state.selectedAcademy : null)
  const [query, setQuery] = useState('')
  const [difficulty, setDifficulty] = useState('all')
  const [status, setStatus] = useState('all')
  const { progress, summary, recordActivity } = useAcademyProgress()
  const hasCompleted = id => progress.modules[id]?.completed === true
  const hasStarted = id => Boolean(progress.modules[id]?.viewedSlides?.length || progress.modules[id]?.legacyReviewed)
  const modulesFor = id => ACADEMY_LESSON_CATALOG.filter(module => module.courseId === id)
  const selectedCourse = ACADEMY_COURSES.find(course => course.id === selectedAcademy)
  const selectedModules = selectedCourse ? modulesFor(selectedCourse.id) : []
  const completedCount = selectedModules.filter(module => hasCompleted(module.id)).length
  const percent = selectedModules.length ? Math.round(completedCount / selectedModules.length * 100) : 0
  const lastModule = ACADEMY_LESSON_CATALOG.find(module => module.id === progress.lastVisited?.moduleId && !hasCompleted(module.id))
  const nextModule = selectedModules.find(module => module.id === lastModule?.id) || selectedModules.find(module => !hasCompleted(module.id))
  const resumeModule = lastModule || ACADEMY_LESSON_CATALOG.find(module => !hasCompleted(module.id))
  const legacyCount = ACADEMY_LESSON_CATALOG.filter(module => progress.modules[module.id]?.legacyReviewed && !hasCompleted(module.id)).length
  const motionProps = { initial: { opacity: 0, y: reduceMotion ? 0 : 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: reduceMotion ? 0 : 0.3 } }
  const matchesStatus = ids => status === 'all' || (status === 'completed' ? ids.every(hasCompleted) : status === 'started' ? ids.some(hasStarted) && !ids.every(hasCompleted) : !ids.some(hasStarted))
  const visibleCourses = ACADEMY_COURSES.filter(course => {
    const modules = modulesFor(course.id)
    return (difficulty === 'all' || course.difficulty === difficulty)
      && matchesStatus(course.moduleIds)
      && fold([course.title, course.description, ...modules.flatMap(module => [module.title, ...module.topics])].join(' ')).includes(fold(query.trim()))
  })
  const visibleModules = selectedModules.filter(module => (difficulty === 'all' || difficulty === module.difficulty)
    && matchesStatus([module.id]) && fold([module.title, module.description, ...module.topics].join(' ')).includes(fold(query.trim())))
  const clearFilters = () => { setQuery(''); setDifficulty('all'); setStatus('all') }
  const selectCourse = id => { setSelectedAcademy(id); clearFilters(); globalThis.scrollTo?.({ top: 0, behavior: 'instant' }) }
  const openModule = module => navigate(`/academy/lesson/${module.id}`)
  const openLab = lab => { recordActivity(lab.id); navigate(lab.route) }
  const filterBar = <div className="academy-filters" role="search" aria-label={selectedCourse ? 'Filtrar lecciones' : 'Filtrar rutas de aprendizaje'}>
    <label className="academy-search"><Search size={18} /><span className="academy-sr-only">Buscar en la academia</span><input type="search" placeholder={selectedCourse ? 'Buscar lecciones o temas…' : 'Buscar rutas, técnicas o temas…'} value={query} onChange={event => setQuery(event.target.value)} /></label>
    <label><span><Filter size={14} /> Nivel</span><select value={difficulty} onChange={event => setDifficulty(event.target.value)} aria-label="Filtrar por nivel"><option value="all">Todos los niveles</option><option value="principiante">Principiante</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option></select></label>
    <label><span>Tu avance</span><select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filtrar por avance"><option value="all">Todo el contenido</option><option value="not-started">Sin empezar</option><option value="started">En curso</option><option value="completed">Aprobado</option></select></label>
    {(query || difficulty !== 'all' || status !== 'all') && <button className="academy-filter-clear" onClick={clearFilters}><RotateCcw size={15} /> Limpiar</button>}
  </div>
  const empty = <div className="academy-empty" role="status"><Search size={28} /><h3>No encontramos contenido con estos filtros</h3><p>Probá otro tema o restablecé los filtros para explorar las cuatro rutas.</p><button onClick={clearFilters}>Ver todo el contenido</button></div>

  return <div className="academy-dashboard">
    <header className="academy-topbar">
      <button type="button" className="academy-topbar__back" onClick={() => navigate('/')}><ArrowLeft size={18} /> Volver a la galaxia</button>
      <BrandSignature context="Academia" compact className="academy-topbar__brand" />
      <button type="button" className="academy-certificate-link" onClick={() => navigate('/academy/certificates')}><Award size={18} /> Mis certificados</button>
    </header>
    <motion.div className="academy-view" {...motionProps} key={selectedAcademy || 'catalog'}>
      {!selectedCourse ? <>
        <section className="academy-hero">
          <div className="academy-hero__copy">
            <span className="academy-eyebrow">Academia · Aprendé, investigá, verificá</span>
            <h1><span>Convertí curiosidad en</span><em>criterio analítico.</em></h1>
            <p>Cuatro rutas para aprender a investigar fuentes públicas. Lecciones, casos simulados y evaluaciones que convierten cada paso en una habilidad concreta.</p>
            <div className="academy-hero__benefits"><span><Layers3 size={16} /> 4 rutas</span><span><BookOpen size={16} /> {summary.totalModules} módulos</span><span><Clock size={16} /> {formatAcademyDuration(ACADEMY_LESSON_CATALOG.reduce((sum, module) => sum + module.durationMinutes, 0))} de contenido</span></div>
            <div className="academy-hero-actions"><button onClick={() => openModule(resumeModule || ACADEMY_LESSON_CATALOG[0])}><Play size={17} /> {lastModule ? 'Retomar mi aprendizaje' : summary.completedCount ? 'Continuar aprendiendo' : 'Empezar por los fundamentos'}</button><button className="academy-secondary-action" onClick={() => navigate('/academy/certificates')}><Award size={17} /> Certificados para LinkedIn</button></div>
          </div>
          <aside className="academy-journey-card">
            <span>Tu recorrido</span><strong>{summary.coursePercent}%</strong>
            <div className="academy-journey-card__track" role="progressbar" aria-label="Módulos aprobados" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.coursePercent}><i style={{ width: `${summary.coursePercent}%` }} /></div>
            <p>{summary.completedCount} de {summary.totalModules} módulos aprobados · {summary.viewedSlides} de {summary.totalSlides} páginas recorridas.</p>
            {lastModule && <button className="academy-resume" onClick={() => openModule(lastModule)}><span>Donde te quedaste</span><b>{lastModule.title}</b><small>Página {(progress.modules[lastModule.id]?.lastSlide || 0) + 1} de {lastModule.slideCount} <ArrowRight size={14} /></small></button>}
            <small>El avance se guarda en este navegador.</small>
          </aside>
        </section>
        {legacyCount > 0 && <p className="academy-notice"><RotateCcw size={18} /> Conservamos tu recorrido anterior. {legacyCount} módulos necesitan una nueva evaluación con nota mínima de {ACADEMY_PASS_SCORE}% para acreditar su aprobación.</p>}
        <section className="academy-catalog">
          <header className="academy-section-heading"><div><span>Elegí tu objetivo</span><h2>Rutas de aprendizaje</h2></div><p>Explorá libremente. Cada módulo se aprueba con todas sus páginas recorridas y una evaluación de al menos {ACADEMY_PASS_SCORE}%.</p></header>
          {filterBar}<p className="academy-result-count" role="status">{visibleCourses.length} de {ACADEMY_COURSES.length} rutas</p>
          <div className="academies-container">{visibleCourses.map(course => {
            const Icon = icons[course.id]
            const modules = modulesFor(course.id)
            const completed = modules.filter(module => hasCompleted(module.id)).length
            return <button type="button" key={course.id} className={`academy-banner academy-banner--${course.color}`} onClick={() => selectCourse(course.id)}>
              <div className="academy-banner__topline"><div className="banner-icon"><Icon size={30} /></div><span>{course.id === 'verification' ? 'Nueva ruta' : course.difficulty}</span></div>
              <div className="banner-content"><h3>{course.title}</h3><p>{course.description}</p></div>
              <div className="academy-banner__meta"><span><BookOpen size={15} /> {modules.length} módulos</span><span><Clock size={15} /> {formatAcademyDuration(modules.reduce((sum, module) => sum + module.durationMinutes, 0))}</span></div>
              <div className="academy-course-status"><span>{completed === modules.length ? 'Ruta aprobada' : `${completed}/${modules.length} aprobados`}</span><span>{course.labIds.length ? `${course.labIds.length} ${course.labIds.length === 1 ? 'práctica' : 'prácticas'}` : 'Caso aplicado incluido'}</span></div>
              <div className="academy-mini-track"><i style={{ width: `${completed / modules.length * 100}%` }} /></div>
              <div className="academy-banner__action">{completed ? 'Continuar ruta' : 'Explorar ruta'} <ArrowRight size={17} /></div>
            </button>
          })}</div>{!visibleCourses.length && empty}
        </section>
        <section className="academy-certificate-banner"><Award size={36} /><div><h2>Un aprendizaje que podés mostrar</h2><p>Aprobá una ruta y su evaluación final, generá tu certificado y prepará su incorporación a LinkedIn. Tu centro de certificados explica el alcance de cada credencial.</p></div><button onClick={() => navigate('/academy/certificates')}>Ver certificados <ArrowRight size={17} /></button></section>
      </> : <>
        <section className="academy-track-hero">
          <div className="academy-track-hero__copy"><button onClick={() => selectCourse(null)} className="back-button"><ArrowLeft size={17} /> Todas las academias</button><span className="academy-eyebrow">Ruta especializada · {selectedCourse.difficulty}</span><h1>{selectedCourse.title}</h1><p>{selectedCourse.description}</p><div className="academy-track-hero__meta"><span><BookOpen size={16} /> {selectedModules.length} módulos</span><span><Clock size={16} /> {formatAcademyDuration(selectedModules.reduce((sum, module) => sum + module.durationMinutes, 0))}</span><span><Target size={16} /> Aprobación: {ACADEMY_PASS_SCORE}%</span></div></div>
          <aside className="academy-track-progress"><span>Progreso de la ruta</span><div className="academy-track-progress__value"><strong>{percent}%</strong><small>{completedCount}/{selectedModules.length} aprobados</small></div><div className="academy-track-progress__bar" role="progressbar" aria-label={`Progreso de ${selectedCourse.title}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}><i style={{ width: `${percent}%` }} /></div>{nextModule ? <button onClick={() => openModule(nextModule)}>{hasStarted(nextModule.id) ? 'Retomar módulo' : 'Comenzar siguiente módulo'} <ArrowRight size={17} /></button> : <button onClick={() => navigate('/academy/certificates')}><Trophy size={18} /> Ir a la evaluación final</button>}</aside>
        </section>
        <section className="modules-section"><header className="academy-section-heading"><div><span>Plan de estudio</span><h2>Avanzá paso a paso</h2></div><p>Los módulos están siempre disponibles. La práctica es opcional y complementa las evaluaciones de cada ruta.</p></header>{filterBar}<p className="academy-result-count" role="status">{visibleModules.length} de {selectedModules.length} módulos</p><div className="modules-grid">{visibleModules.map(module => {
          const state = progress.modules[module.id]
          const completed = hasCompleted(module.id)
          const Icon = icons[module.courseId]
          return <button type="button" key={module.id} className={`module-card ${completed ? 'completed' : ''}`} onClick={() => openModule(module)}><span className="module-index">{String(selectedModules.indexOf(module) + 1).padStart(2, '0')}</span><div className="module-header"><div className="module-icon"><Icon size={30} /></div><div className={`difficulty-badge ${module.difficulty}`}>{module.difficulty}</div></div><h3>{module.title}</h3><p>{module.description}</p><div className="academy-module-topics">{module.topics.map(topic => <span key={topic}>{topic}</span>)}</div><div className="academy-module-state"><span>{state?.viewedSlides?.length || 0}/{module.slideCount} páginas</span><span>{state?.quizSubmitted ? `Mejor nota: ${state.bestScore}%` : state?.legacyReviewed ? 'Evaluación pendiente' : 'Evaluación incluida'}</span></div><div className="module-footer"><span><Clock size={15} /> {module.durationMinutes} min</span><strong>{completed ? 'Repasar' : hasStarted(module.id) ? 'Continuar' : 'Comenzar'} <ArrowRight size={16} /></strong></div>{completed && <div className="completed-indicator"><CheckCircle2 size={16} /> Aprobado</div>}</button>
        })}</div>{!visibleModules.length && empty}</section>
        {selectedCourse.labIds.length > 0 && <section className="modules-section academy-practice-section"><header className="academy-section-heading"><div><span>Práctica complementaria</span><h2>Aplicá lo aprendido</h2></div><p>Casos ficticios y recursos de repaso. Su avance se guarda por separado de los módulos evaluados.</p></header><div className="modules-grid">{ACADEMY_LABS.filter(lab => selectedCourse.labIds.includes(lab.id)).map(lab => {
          const Icon = lab.icon
          const completed = progress.activities[lab.id]?.completed
          return <button type="button" key={lab.id} className={`module-card module-card--lab ${completed ? 'completed' : ''}`} onClick={() => openLab(lab)}><div className="module-header"><div className="module-icon"><Icon size={30} /></div><div className="difficulty-badge intermedio">Práctica</div></div><h3>{lab.title}</h3><p>{lab.description}</p><div className="module-footer"><span>{lab.meta}</span><strong>{completed ? 'Revisar' : 'Abrir'} <ArrowRight size={16} /></strong></div>{completed && <div className="completed-indicator"><CheckCircle2 size={16} /> Completado</div>}</button>
        })}</div></section>}
      </>}
    </motion.div>
  </div>
}
export default AcademyDashboard
