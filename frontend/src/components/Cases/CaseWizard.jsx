import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, Briefcase, Check, X } from 'lucide-react'
import { OBJECTIVE_TYPES } from '@utils/investigationProject'
import './Cases.css'

export default function CaseWizard({ onClose, onCreate }) {
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const closeButtonRef = useRef(null)
  const [values, setValues] = useState({
    objectiveType: 'username',
    name: '',
    objective: '',
    description: ''
  })

  const selectedObjective = OBJECTIVE_TYPES.find((objective) => objective.id === values.objectiveType)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!values.name.trim()) return
    setIsSubmitting(true)
    try {
      await onCreate({
        ...values,
        name: values.name.trim(),
        objective: values.objective.trim(),
        description: values.description.trim()
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="case-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="case-wizard"
        role="dialog"
        aria-modal="true"
        aria-labelledby="case-wizard-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="case-wizard__header">
          <div className="case-wizard__mark"><Briefcase size={22} /></div>
          <div>
            <span>Paso {step} de 2</span>
            <h2 id="case-wizard-title">Nueva investigación</h2>
          </div>
          <button ref={closeButtonRef} onClick={onClose} aria-label="Cerrar asistente"><X size={19} /></button>
        </header>

        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <div className="case-wizard__body">
              <div className="case-wizard__intro">
                <h3>¿Cuál es el punto de partida?</h3>
                <p>Prepararemos un checklist editable; nunca te impedirá saltar o agregar pasos.</p>
              </div>
              <div className="case-objective-grid">
                {OBJECTIVE_TYPES.map((objective) => (
                  <button
                    key={objective.id}
                    type="button"
                    className={values.objectiveType === objective.id ? 'is-selected' : ''}
                    onClick={() => setValues((current) => ({ ...current, objectiveType: objective.id }))}
                  >
                    <span>{objective.label}</span>
                    <small>{objective.description}</small>
                    {values.objectiveType === objective.id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="case-wizard__body case-wizard__form">
              <div className="case-wizard__intro">
                <span className="case-wizard__selection">{selectedObjective?.label}</span>
                <h3>Dale contexto al caso</h3>
                <p>Un objetivo concreto ayuda a distinguir hechos, hipótesis y próximos pasos.</p>
              </div>
              <label>
                Nombre del caso
                <input
                  autoFocus
                  required
                  maxLength={100}
                  value={values.name}
                  placeholder="Ej.: Verificación del alias farosur"
                  onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label>
                Objetivo
                <input
                  maxLength={220}
                  value={values.objective}
                  placeholder="¿Qué querés confirmar o descartar?"
                  onChange={(event) => setValues((current) => ({ ...current, objective: event.target.value }))}
                />
              </label>
              <label>
                Descripción opcional
                <textarea
                  rows="4"
                  maxLength={900}
                  value={values.description}
                  placeholder="Alcance, contexto y límites de la investigación."
                  onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
            </div>
          )}

          <footer className="case-wizard__footer">
            {step === 1 ? (
              <>
                <button type="button" className="case-button case-button--quiet" onClick={onClose}>Cancelar</button>
                <button type="button" className="case-button case-button--primary" onClick={() => setStep(2)}>
                  Continuar <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <button type="button" className="case-button case-button--quiet" onClick={() => setStep(1)}>Atrás</button>
                <button
                  type="submit"
                  className="case-button case-button--primary"
                  disabled={!values.name.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Creando…' : 'Crear investigación'} <ArrowRight size={17} />
                </button>
              </>
            )}
          </footer>
        </form>
      </section>
    </div>,
    document.body
  )
}
