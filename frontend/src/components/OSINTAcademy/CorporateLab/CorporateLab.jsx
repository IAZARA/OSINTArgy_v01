import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Building2,
  CalendarDays,
  CheckCircle,
  ClipboardCheck,
  Download,
  FileSearch,
  FileText,
  Link2,
  RotateCcw,
  Scale,
  ShieldCheck
} from 'lucide-react'
import { useNavigate } from '@/lib/router'
import { useAcademyProgress } from '../useAcademyProgress'
import { ACADEMY_PASS_SCORE } from '../data/academyCatalog'
import {
  calculateCorporateLabScore,
  claimExercises,
  claimOptions,
  classificationLabels,
  generateCorporateReport,
  isCorporateLabComplete,
  isTimelineCorrect,
  relationshipExercises,
  relationshipOptions,
  sourceExercises,
  sourceOptions,
  timelineEvents
} from './corporateLabData'
import './CorporateLab.css'

const stages = [
  { id: 'sources', label: 'Fuentes', icon: FileSearch },
  { id: 'relationships', label: 'Vínculos', icon: Link2 },
  { id: 'timeline', label: 'Cronología', icon: CalendarDays },
  { id: 'claims', label: 'Conclusiones', icon: Scale },
  { id: 'report', label: 'Informe', icon: FileText }
]

const CorporateLab = () => {
  const navigate = useNavigate()
  const { recordActivity } = useAcademyProgress()
  const [stageIndex, setStageIndex] = useState(0)
  const [sourceAnswers, setSourceAnswers] = useState({})
  const [relationshipAnswers, setRelationshipAnswers] = useState({})
  const [timelineOrder, setTimelineOrder] = useState([
    'event-tender',
    'event-foundation',
    'event-award',
    'event-director'
  ])
  const [timelineSubmitted, setTimelineSubmitted] = useState(false)
  const [claimAnswers, setClaimAnswers] = useState({})
  const [report, setReport] = useState('')

  const score = useMemo(
    () => calculateCorporateLabScore({
      sourceAnswers,
      relationshipAnswers,
      timelineOrder,
      claimAnswers
    }),
    [sourceAnswers, relationshipAnswers, timelineOrder, claimAnswers]
  )

  const isComplete = isCorporateLabComplete({
    sourceAnswers,
    relationshipAnswers,
    claimAnswers,
    timelineSubmitted
  })

  useEffect(() => {
    if (report && isComplete) {
      recordActivity('corp-lab', { score: score.percentage, completed: score.percentage >= ACADEMY_PASS_SCORE })
    }
  }, [report, isComplete, score.percentage, recordActivity])

  const currentStage = stages[stageIndex]
  const completedSources = sourceExercises.every((exercise) => sourceAnswers[exercise.id])
  const completedRelationships = relationshipExercises.every(
    (exercise) => relationshipAnswers[exercise.id]
  )
  const completedClaims = claimExercises.every((exercise) => claimAnswers[exercise.id])

  const canContinue = (
    currentStage.id === 'sources' ? completedSources
      : currentStage.id === 'relationships' ? completedRelationships
        : currentStage.id === 'timeline' ? timelineSubmitted
          : currentStage.id === 'claims' ? completedClaims
            : true
  )

  const handleAnswer = (setter, exerciseId, answer) => {
    setter((current) => ({ ...current, [exerciseId]: answer }))
  }

  const moveTimelineItem = (index, direction) => {
    const nextIndex = index + direction
    if (nextIndex < 0 || nextIndex >= timelineOrder.length) return

    setTimelineOrder((currentOrder) => {
      const nextOrder = [...currentOrder]
      const [movedItem] = nextOrder.splice(index, 1)
      nextOrder.splice(nextIndex, 0, movedItem)
      return nextOrder
    })
  }

  const goToNextStage = () => {
    if (!canContinue) return

    if (currentStage.id === 'claims') {
      setReport(generateCorporateReport({
        sourceAnswers,
        relationshipAnswers,
        timelineOrder,
        claimAnswers
      }))
      setStageIndex(stages.length - 1)
      return
    }

    setStageIndex((current) => Math.min(current + 1, stages.length - 1))
  }

  const resetLab = () => {
    setStageIndex(0)
    setSourceAnswers({})
    setRelationshipAnswers({})
    setTimelineOrder([
      'event-tender',
      'event-foundation',
      'event-award',
      'event-director'
    ])
    setTimelineSubmitted(false)
    setClaimAnswers({})
    setReport('')
  }

  const downloadReport = () => {
    if (!report) return

    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const downloadUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    link.download = 'expediente-rio-claro.md'
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(downloadUrl)
  }

  return (
    <div className="corporate-lab">
      <header className="corporate-lab__header">
        <button
          type="button"
          className="corporate-lab__back"
          onClick={() => navigate('/academy', { state: { selectedAcademy: 'corporate' } })}
        >
          <ArrowLeft size={19} />
          Volver a la academia
        </button>

        <div className="corporate-lab__identity">
          <span className="corporate-lab__mark" aria-hidden="true">
            <Building2 size={34} />
          </span>
          <div>
            <span className="corporate-lab__eyebrow">Caso educativo ficticio</span>
            <h1>Expediente Río Claro</h1>
            <p>Convertí fuentes dispersas en un informe trazable de debida diligencia.</p>
          </div>
        </div>

        <div className="corporate-lab__score" aria-label={`Puntaje actual ${score.correct} de ${score.total}`}>
          <ClipboardCheck size={18} />
          <span>{score.correct}/{score.total}</span>
        </div>
      </header>

      <div className="corporate-lab__notice">
        <ShieldCheck size={18} />
        <p>
          Todos los nombres, documentos, identificadores y procesos de este ejercicio son inventados.
          No representan personas ni organizaciones reales.
        </p>
      </div>

      <nav className="corporate-lab__stages" aria-label="Etapas del laboratorio">
        {stages.map((stage, index) => {
          const StageIcon = stage.icon
          const isActive = index === stageIndex
          const isVisited = index < stageIndex
          return (
            <button
              type="button"
              key={stage.id}
              className={`${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`}
              onClick={() => index <= stageIndex && setStageIndex(index)}
              disabled={index > stageIndex}
              aria-current={isActive ? 'step' : undefined}
            >
              <StageIcon size={18} />
              <span>{stage.label}</span>
            </button>
          )
        })}
      </nav>

      <main className="corporate-lab__workspace">
        <AnimatePresence mode="wait">
          <motion.section
            key={currentStage.id}
            className="corporate-lab__panel"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.24 }}
          >
            {currentStage.id === 'sources' && (
              <SourceStage
                answers={sourceAnswers}
                onAnswer={(exerciseId, answer) => (
                  handleAnswer(setSourceAnswers, exerciseId, answer)
                )}
              />
            )}

            {currentStage.id === 'relationships' && (
              <RelationshipStage
                answers={relationshipAnswers}
                onAnswer={(exerciseId, answer) => (
                  handleAnswer(setRelationshipAnswers, exerciseId, answer)
                )}
              />
            )}

            {currentStage.id === 'timeline' && (
              <TimelineStage
                order={timelineOrder}
                submitted={timelineSubmitted}
                onMove={moveTimelineItem}
                onSubmit={() => setTimelineSubmitted(true)}
              />
            )}

            {currentStage.id === 'claims' && (
              <ClaimStage
                answers={claimAnswers}
                onAnswer={(exerciseId, answer) => (
                  handleAnswer(setClaimAnswers, exerciseId, answer)
                )}
              />
            )}

            {currentStage.id === 'report' && (
              <ReportStage
                report={report}
                score={score}
                onDownload={downloadReport}
                onReset={resetLab}
              />
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {currentStage.id !== 'report' && (
        <footer className="corporate-lab__navigation">
          <button
            type="button"
            className="corporate-lab__secondary"
            onClick={() => setStageIndex((current) => Math.max(current - 1, 0))}
            disabled={stageIndex === 0}
          >
            <ArrowLeft size={18} />
            Anterior
          </button>

          <div className="corporate-lab__progress">
            <span>Etapa {stageIndex + 1} de {stages.length - 1}</span>
            <div>
              <span style={{ width: `${((stageIndex + 1) / (stages.length - 1)) * 100}%` }} />
            </div>
          </div>

          <button
            type="button"
            className="corporate-lab__primary"
            onClick={goToNextStage}
            disabled={!canContinue}
          >
            {currentStage.id === 'claims' ? 'Generar informe' : 'Continuar'}
            <ArrowRight size={18} />
          </button>
        </footer>
      )}
    </div>
  )
}

const StageHeading = ({ eyebrow, title, description }) => (
  <div className="corporate-stage__heading">
    <span>{eyebrow}</span>
    <h2>{title}</h2>
    <p>{description}</p>
  </div>
)

const AnswerButtons = ({ options, selected, onSelect }) => (
  <div className="corporate-answer-options">
    {options.map((option) => (
      <button
        type="button"
        key={option}
        className={selected === option ? 'selected' : ''}
        onClick={() => onSelect(option)}
        aria-pressed={selected === option}
      >
        {classificationLabels[option]}
      </button>
    ))}
  </div>
)

const ExerciseFeedback = ({ exercise, selected }) => {
  if (!selected) return null
  const isCorrect = selected === exercise.correct

  return (
    <div className={`corporate-feedback ${isCorrect ? 'success' : 'review'}`} aria-live="polite">
      {isCorrect ? <CheckCircle size={18} /> : <Scale size={18} />}
      <p>
        <strong>{isCorrect ? 'Clasificación correcta.' : `Revisá: ${classificationLabels[exercise.correct]}.`}</strong>
        {' '}{exercise.explanation}
      </p>
    </div>
  )
}

const SourceStage = ({ answers, onAnswer }) => (
  <>
    <StageHeading
      eyebrow="Etapa 1"
      title="Evaluá las fuentes"
      description="Clasificá cada evidencia por su origen. La categoría indica qué puede demostrar y cuánto contraste necesita."
    />
    <div className="corporate-exercise-list">
      {sourceExercises.map((exercise) => (
        <article className="corporate-exercise-card" key={exercise.id}>
          <div className="corporate-exercise-card__title">
            <FileSearch size={21} />
            <div>
              <h3>{exercise.title}</h3>
              <p>{exercise.detail}</p>
            </div>
          </div>
          <AnswerButtons
            options={sourceOptions}
            selected={answers[exercise.id]}
            onSelect={(answer) => onAnswer(exercise.id, answer)}
          />
          <ExerciseFeedback exercise={exercise} selected={answers[exercise.id]} />
        </article>
      ))}
    </div>
  </>
)

const RelationshipStage = ({ answers, onAnswer }) => (
  <>
    <StageHeading
      eyebrow="Etapa 2"
      title="Conectá entidades con evidencia"
      description="Decidí si cada vínculo está respaldado, necesita más evidencia o no tiene sustento."
    />
    <div className="corporate-exercise-list">
      {relationshipExercises.map((exercise) => (
        <article className="corporate-exercise-card" key={exercise.id}>
          <div className="corporate-relation">
            <span>{exercise.from}</span>
            <div>
              <Link2 size={18} />
              <strong>{exercise.relation}</strong>
            </div>
            <span>{exercise.to}</span>
          </div>
          <p className="corporate-relation__evidence">
            <strong>Evidencia disponible:</strong> {exercise.evidence}
          </p>
          <AnswerButtons
            options={relationshipOptions}
            selected={answers[exercise.id]}
            onSelect={(answer) => onAnswer(exercise.id, answer)}
          />
          <ExerciseFeedback exercise={exercise} selected={answers[exercise.id]} />
        </article>
      ))}
    </div>
  </>
)

const TimelineStage = ({ order, submitted, onMove, onSubmit }) => {
  const timelineCorrect = isTimelineCorrect(order)

  return (
    <>
      <StageHeading
        eyebrow="Etapa 3"
        title="Reconstruí la cronología"
        description="Ordená los eventos desde el más antiguo al más reciente. Conservá la referencia de cada documento."
      />
      <ol className="corporate-timeline">
        {order.map((eventId, index) => {
          const event = timelineEvents.find((item) => item.id === eventId)
          return (
            <li key={event.id}>
              <span className="corporate-timeline__position">{index + 1}</span>
              <div className="corporate-timeline__event">
                <strong>{event.label}</strong>
                <span>Documento {event.evidenceId}</span>
              </div>
              <div className="corporate-timeline__actions">
                <button
                  type="button"
                  onClick={() => onMove(index, -1)}
                  disabled={index === 0}
                  aria-label={`Mover ${event.label} hacia arriba`}
                >
                  <ArrowUp size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => onMove(index, 1)}
                  disabled={index === order.length - 1}
                  aria-label={`Mover ${event.label} hacia abajo`}
                >
                  <ArrowDown size={17} />
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      <button type="button" className="corporate-lab__primary timeline-submit" onClick={onSubmit}>
        <CalendarDays size={18} />
        Comprobar cronología
      </button>

      {submitted && (
        <div className={`corporate-feedback ${timelineCorrect ? 'success' : 'review'}`} aria-live="polite">
          {timelineCorrect ? <CheckCircle size={18} /> : <Scale size={18} />}
          <p>
            <strong>{timelineCorrect ? 'La secuencia es correcta.' : 'La secuencia necesita revisión.'}</strong>
            {' '}El orden esperado sigue las fechas de constitución, designación, convocatoria y adjudicación.
          </p>
        </div>
      )}
    </>
  )
}

const ClaimStage = ({ answers, onAnswer }) => (
  <>
    <StageHeading
      eyebrow="Etapa 4"
      title="Separá hechos, hipótesis y vacíos"
      description="Clasificá cada afirmación según lo que realmente permite sostener el expediente."
    />
    <div className="corporate-exercise-list">
      {claimExercises.map((exercise) => (
        <article className="corporate-exercise-card" key={exercise.id}>
          <div className="corporate-claim">
            <Scale size={21} />
            <h3>{exercise.statement}</h3>
          </div>
          <AnswerButtons
            options={claimOptions}
            selected={answers[exercise.id]}
            onSelect={(answer) => onAnswer(exercise.id, answer)}
          />
          <ExerciseFeedback exercise={exercise} selected={answers[exercise.id]} />
        </article>
      ))}
    </div>
  </>
)

const ReportStage = ({ report, score, onDownload, onReset }) => (
  <>
    <StageHeading
      eyebrow="Resultado"
      title="Informe de debida diligencia"
      description="El expediente conserva hechos, hipótesis, vacíos y próximos pasos en un formato verificable."
    />

    <div className="corporate-report__summary">
      <div>
        <ClipboardCheck size={25} />
        <span>Puntaje metodológico</span>
        <strong>{score.percentage}%</strong>
      </div>
      <p>
        El puntaje mide el criterio aplicado durante el ejercicio. El informe muestra las correcciones
        necesarias para que el resultado final siga siendo defendible.
      </p>
    </div>

    <pre className="corporate-report__preview">{report}</pre>

    <div className="corporate-report__actions">
      <button type="button" className="corporate-lab__primary" onClick={onDownload}>
        <Download size={18} />
        Descargar Markdown
      </button>
      <button type="button" className="corporate-lab__secondary" onClick={onReset}>
        <RotateCcw size={18} />
        Rehacer laboratorio
      </button>
    </div>
  </>
)

export default CorporateLab
