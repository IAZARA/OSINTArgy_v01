import React, { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  FileText,
  Filter,
  Link2,
  ListChecks,
  MapPin,
  Network,
  Plus,
  Search,
  SkipForward,
  Trash2,
  X
} from 'lucide-react'
import {
  FINDING_VERIFICATION,
  OBJECTIVE_TYPES,
  buildInvestigationTimeline,
  createInvestigationId
} from '@utils/investigationProject'

const statusIcon = {
  pending: Circle,
  completed: CheckCircle2,
  skipped: SkipForward
}

export function CaseOverview({ project, onNavigate }) {
  const completed = project.checklist.filter((item) => item.status === 'completed').length
  const progress = project.checklist.length ? Math.round((completed / project.checklist.length) * 100) : 0
  const objective = OBJECTIVE_TYPES.find((item) => item.id === project.objectiveType)
  const nextStep = project.checklist.find((item) => item.status === 'pending')
  const corroborated = project.findings.filter((item) => item.verification === 'corroborated').length

  return (
    <div className="case-overview">
      <header className="case-overview__hero">
        <div>
          <span>{objective?.label || 'Caso libre'}</span>
          <h2>{project.name}</h2>
          <p>{project.objective || 'Definí el objetivo del caso para mantener el alcance visible.'}</p>
        </div>
        <div className="case-overview__score">
          <strong>{progress}%</strong>
          <span>avance metodológico</span>
        </div>
      </header>

      <section className="case-overview__metrics">
        <button onClick={() => onNavigate('network')}>
          <Network size={20} />
          <span><strong>{project.entities.length}</strong> entidades</span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate('findings')}>
          <FileText size={20} />
          <span><strong>{project.findings.length}</strong> hallazgos</span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate('locations')}>
          <MapPin size={20} />
          <span><strong>{project.locations.length}</strong> ubicaciones</span>
          <ArrowRight size={16} />
        </button>
        <button onClick={() => onNavigate('checklist')}>
          <ListChecks size={20} />
          <span><strong>{completed}/{project.checklist.length}</strong> pasos</span>
          <ArrowRight size={16} />
        </button>
      </section>

      <section className="case-overview__columns">
        <article>
          <span className="workspace-section-kicker">Próximo paso</span>
          {nextStep ? (
            <>
              <h3>{nextStep.label}</h3>
              <p>{nextStep.description || 'Continuá la investigación y documentá el resultado.'}</p>
              <button onClick={() => onNavigate('checklist')}>Abrir checklist <ArrowRight size={16} /></button>
            </>
          ) : (
            <>
              <h3>Checklist completo</h3>
              <p>Revisá vacíos, corroborá hallazgos y prepará el informe.</p>
              <button onClick={() => onNavigate('findings')}>Revisar hallazgos <ArrowRight size={16} /></button>
            </>
          )}
        </article>
        <article>
          <span className="workspace-section-kicker">Calidad de evidencia</span>
          <h3>{corroborated} hallazgos corroborados</h3>
          <p>
            {project.findings.length - corroborated} elementos todavía requieren validación
            o están marcados en disputa.
          </p>
          <button onClick={() => onNavigate('findings')}>Validar evidencia <ArrowRight size={16} /></button>
        </article>
      </section>
    </div>
  )
}

export function ChecklistView({ checklist, onChange }) {
  const [newStep, setNewStep] = useState('')
  const grouped = {
    pending: checklist.filter((item) => item.status === 'pending'),
    completed: checklist.filter((item) => item.status === 'completed'),
    skipped: checklist.filter((item) => item.status === 'skipped')
  }

  const updateItem = (itemId, patch) => {
    onChange(checklist.map((item) => item.id === itemId ? { ...item, ...patch } : item))
  }

  const addStep = (event) => {
    event.preventDefault()
    const label = newStep.trim()
    if (!label) return
    onChange([
      ...checklist,
      {
        id: createInvestigationId('step'),
        sourceStepId: '',
        label,
        description: '',
        status: 'pending',
        toolNames: [],
        internalTool: ''
      }
    ])
    setNewStep('')
  }

  return (
    <div className="workspace-list-view">
      <header className="workspace-view-header">
        <div>
          <span className="workspace-section-kicker">Metodología adaptable</span>
          <h2>Checklist de investigación</h2>
          <p>Completá, omití o agregá pasos sin bloquear el avance del caso.</p>
        </div>
        <div className="workspace-view-header__stats">
          <strong>{grouped.completed.length}</strong>
          <span>de {checklist.length} completados</span>
        </div>
      </header>

      <form className="checklist-add" onSubmit={addStep}>
        <input
          value={newStep}
          maxLength={140}
          placeholder="Agregar un paso propio…"
          onChange={(event) => setNewStep(event.target.value)}
        />
        <button type="submit"><Plus size={17} /> Agregar</button>
      </form>

      <div className="checklist-groups">
        {['pending', 'completed', 'skipped'].map((status) => (
          <section key={status}>
            <h3>
              {status === 'pending' ? 'Pendientes' : status === 'completed' ? 'Completados' : 'Omitidos'}
              <span>{grouped[status].length}</span>
            </h3>
            {grouped[status].map((item) => {
              const StatusIcon = statusIcon[item.status] || Circle
              return (
                <article className={`checklist-item checklist-item--${item.status}`} key={item.id}>
                  <StatusIcon size={19} />
                  <div>
                    <input
                      aria-label="Nombre del paso"
                      value={item.label}
                      onChange={(event) => updateItem(item.id, { label: event.target.value })}
                    />
                    {item.description && <p>{item.description}</p>}
                    {item.toolNames.length > 0 && <small>{item.toolNames.join(' · ')}</small>}
                  </div>
                  <select
                    aria-label={`Estado de ${item.label}`}
                    value={item.status}
                    onChange={(event) => updateItem(item.id, { status: event.target.value })}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="completed">Completado</option>
                    <option value="skipped">Omitido</option>
                  </select>
                  <button
                    aria-label={`Eliminar ${item.label}`}
                    onClick={() => onChange(checklist.filter((candidate) => candidate.id !== item.id))}
                  >
                    <Trash2 size={15} />
                  </button>
                </article>
              )
            })}
            {!grouped[status].length && <p className="workspace-empty-row">No hay pasos en este estado.</p>}
          </section>
        ))}
      </div>
    </div>
  )
}

const EMPTY_FINDING = {
  title: '',
  url: '',
  sourceName: '',
  toolId: '',
  toolName: '',
  observedAt: new Date().toISOString().slice(0, 10),
  notes: '',
  verification: 'unverified',
  entityIds: [],
  locationIds: []
}

export function FindingsView({
  project,
  onAdd,
  onUpdate,
  onDelete,
  initialOpen = false,
  initialDraft = {}
}) {
  const [isFormOpen, setIsFormOpen] = useState(initialOpen)
  const [draft, setDraft] = useState(() => ({ ...EMPTY_FINDING, ...initialDraft }))
  const [query, setQuery] = useState('')
  const [verification, setVerification] = useState('all')
  const [selectedIds, setSelectedIds] = useState([])

  const findings = useMemo(() => project.findings.filter((finding) => {
    const matchesStatus = verification === 'all' || finding.verification === verification
    const term = query.trim().toLocaleLowerCase('es')
    const matchesQuery = !term || `${finding.title} ${finding.sourceName} ${finding.url} ${finding.notes}`
      .toLocaleLowerCase('es')
      .includes(term)
    return matchesStatus && matchesQuery
  }), [project.findings, query, verification])

  const submitFinding = (event) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    onAdd({
      ...draft,
      id: createInvestigationId('finding'),
      title: draft.title.trim(),
      sourceName: draft.sourceName.trim(),
      url: draft.url.trim(),
      notes: draft.notes.trim(),
      capturedAt: new Date().toISOString()
    })
    setDraft({ ...EMPTY_FINDING })
    setIsFormOpen(false)
  }

  const toggleLinked = (field, id) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((value) => value !== id)
        : [...current[field], id]
    }))
  }

  const toggleSelected = (findingId) => {
    setSelectedIds((current) => (
      current.includes(findingId)
        ? current.filter((id) => id !== findingId)
        : [...current, findingId]
    ))
  }

  return (
    <div className="workspace-list-view">
      <header className="workspace-view-header">
        <div>
          <span className="workspace-section-kicker">Evidencia trazable</span>
          <h2>Hallazgos</h2>
          <p>Registrá fuente, fecha y estado de verificación; vinculá cada dato con el caso.</p>
        </div>
        <button className="workspace-primary-button" onClick={() => setIsFormOpen((value) => !value)}>
          {isFormOpen ? <X size={17} /> : <Plus size={17} />}
          {isFormOpen ? 'Cerrar' : 'Nuevo hallazgo'}
        </button>
      </header>

      {isFormOpen && (
        <form className="finding-form" onSubmit={submitFinding}>
          <label>
            Título
            <input
              autoFocus
              required
              value={draft.title}
              maxLength={160}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            />
          </label>
          <div className="finding-form__row">
            <label>
              Fuente
              <input
                value={draft.sourceName}
                maxLength={120}
                placeholder="Sitio, registro o herramienta"
                onChange={(event) => setDraft((current) => ({ ...current, sourceName: event.target.value }))}
              />
            </label>
            <label>
              Fecha observada
              <input
                type="date"
                value={draft.observedAt}
                onChange={(event) => setDraft((current) => ({ ...current, observedAt: event.target.value }))}
              />
            </label>
          </div>
          <label>
            URL
            <input
              type="url"
              value={draft.url}
              placeholder="https://…"
              onChange={(event) => setDraft((current) => ({ ...current, url: event.target.value }))}
            />
          </label>
          <label>
            Estado de verificación
            <select
              value={draft.verification}
              onChange={(event) => setDraft((current) => ({ ...current, verification: event.target.value }))}
            >
              {FINDING_VERIFICATION.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label>
            Notas
            <textarea
              rows="4"
              value={draft.notes}
              maxLength={1600}
              onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            />
          </label>
          {(project.entities.length > 0 || project.locations.length > 0) && (
            <div className="finding-form__links">
              {project.entities.length > 0 && (
                <fieldset>
                  <legend>Entidades</legend>
                  {project.entities.map((entity) => (
                    <label key={entity.id}>
                      <input
                        type="checkbox"
                        checked={draft.entityIds.includes(entity.id)}
                        onChange={() => toggleLinked('entityIds', entity.id)}
                      />
                      {entity.label}
                    </label>
                  ))}
                </fieldset>
              )}
              {project.locations.length > 0 && (
                <fieldset>
                  <legend>Ubicaciones</legend>
                  {project.locations.map((location) => (
                    <label key={location.id}>
                      <input
                        type="checkbox"
                        checked={draft.locationIds.includes(location.id)}
                        onChange={() => toggleLinked('locationIds', location.id)}
                      />
                      {location.name}
                    </label>
                  ))}
                </fieldset>
              )}
            </div>
          )}
          <button className="workspace-primary-button" type="submit"><Check size={17} /> Guardar hallazgo</button>
        </form>
      )}

      <div className="finding-toolbar">
        <label><Search size={16} /><input value={query} placeholder="Buscar hallazgos…" onChange={(event) => setQuery(event.target.value)} /></label>
        <label><Filter size={16} />
          <select value={verification} onChange={(event) => setVerification(event.target.value)}>
            <option value="all">Todos los estados</option>
            {FINDING_VERIFICATION.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        {selectedIds.length > 0 && (
          <div className="finding-bulk-actions">
            <span>{selectedIds.length} seleccionados</span>
            <button onClick={() => {
              selectedIds.forEach((id) => onUpdate(id, { verification: 'corroborated' }))
              setSelectedIds([])
            }}>Corroborar</button>
            <button onClick={() => {
              selectedIds.forEach(onDelete)
              setSelectedIds([])
            }}>Eliminar</button>
          </div>
        )}
      </div>

      <div className="finding-list">
        {findings.map((finding) => {
          const state = FINDING_VERIFICATION.find((item) => item.id === finding.verification)
          return (
            <article key={finding.id} className={`finding-card finding-card--${finding.verification}`}>
              <input
                type="checkbox"
                aria-label={`Seleccionar ${finding.title}`}
                checked={selectedIds.includes(finding.id)}
                onChange={() => toggleSelected(finding.id)}
              />
              <div className="finding-card__body">
                <div className="finding-card__topline">
                  <span>{state?.label}</span>
                  <time>{finding.observedAt || finding.capturedAt.slice(0, 10)}</time>
                </div>
                <h3>{finding.title}</h3>
                <p>{finding.notes || finding.sourceName || 'Sin notas adicionales.'}</p>
                <div className="finding-card__meta">
                  {finding.sourceName && <span>{finding.sourceName}</span>}
                  {finding.entityIds.length > 0 && <span><Link2 size={13} /> {finding.entityIds.length} entidades</span>}
                  {finding.locationIds.length > 0 && <span><MapPin size={13} /> {finding.locationIds.length} lugares</span>}
                </div>
              </div>
              <select
                aria-label={`Verificación de ${finding.title}`}
                value={finding.verification}
                onChange={(event) => onUpdate(finding.id, { verification: event.target.value })}
              >
                {FINDING_VERIFICATION.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              {finding.url && (
                <a href={finding.url} target="_blank" rel="noreferrer" aria-label={`Abrir fuente de ${finding.title}`}>
                  <ExternalLink size={16} />
                </a>
              )}
              <button onClick={() => onDelete(finding.id)} aria-label={`Eliminar ${finding.title}`}>
                <Trash2 size={16} />
              </button>
            </article>
          )
        })}
        {!findings.length && (
          <div className="workspace-view-empty">
            <FileText size={30} />
            <h3>{project.findings.length ? 'No hay coincidencias' : 'Todavía no hay hallazgos'}</h3>
            <p>Registrá una fuente o agregá una herramienta desde la galaxia.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function TimelineView({ project }) {
  const timeline = buildInvestigationTimeline(project)

  return (
    <div className="workspace-list-view">
      <header className="workspace-view-header">
        <div>
          <span className="workspace-section-kicker">Secuencia temporal</span>
          <h2>Línea de tiempo</h2>
          <p>Orden automático de hallazgos y ubicaciones con fecha documentada.</p>
        </div>
        <div className="workspace-view-header__stats">
          <strong>{timeline.length}</strong>
          <span>eventos fechados</span>
        </div>
      </header>

      {timeline.length ? (
        <ol className="case-timeline">
          {timeline.map((event) => (
            <li key={event.id}>
              <span className={`case-timeline__dot case-timeline__dot--${event.type}`}>
                {event.type === 'finding' ? <FileText size={15} /> : <MapPin size={15} />}
              </span>
              <div>
                <time><CalendarDays size={14} /> {new Date(event.date).toLocaleDateString('es-AR')}</time>
                <h3>{event.title}</h3>
                <p>{event.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <div className="workspace-view-empty">
          <CalendarDays size={30} />
          <h3>No hay eventos con fecha</h3>
          <p>Agregá fechas a los hallazgos o ubicaciones para construir la secuencia.</p>
        </div>
      )}
    </div>
  )
}
