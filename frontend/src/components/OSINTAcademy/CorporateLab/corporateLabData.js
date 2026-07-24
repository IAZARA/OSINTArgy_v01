export const classificationLabels = {
  official: 'Fuente oficial primaria',
  secondary: 'Fuente secundaria identificada',
  selfPublished: 'Fuente propia de la entidad',
  unverified: 'Fuente no verificada',
  supported: 'Relación respaldada',
  unsupported: 'Relación no respaldada',
  needsMore: 'Requiere más evidencia',
  fact: 'Hecho',
  hypothesis: 'Hipótesis',
  insufficient: 'Información insuficiente'
}

export const sourceExercises = [
  {
    id: 'src-registry',
    title: 'Registro Nacional de Sociedades',
    detail: 'Ficha descargada el 12/04/2026 con razón social, jurisdicción y fecha de actualización.',
    correct: 'official',
    explanation: 'Es una fuente oficial primaria para los campos que publica, sujeta a sus propias advertencias de actualización.'
  },
  {
    id: 'src-news',
    title: 'Investigación de Diario del Litoral',
    detail: 'Nota firmada que enlaza documentos y explica su metodología de consulta.',
    correct: 'secondary',
    explanation: 'Es una fuente secundaria identificada; sirve para orientar y contextualizar, pero sus afirmaciones deben volver a las fuentes citadas.'
  },
  {
    id: 'src-company',
    title: 'Sitio institucional de Río Claro',
    detail: 'Página “Quiénes somos” con clientes, equipo y fecha de actualización no informada.',
    correct: 'selfPublished',
    explanation: 'Es útil para conocer cómo se presenta la entidad, pero no constituye corroboración independiente.'
  },
  {
    id: 'src-forum',
    title: 'Captura anónima en un foro',
    detail: 'Publicación sin autor verificable que afirma vínculos societarios y no adjunta documentos.',
    correct: 'unverified',
    explanation: 'Puede generar una pregunta, pero no respalda una afirmación hasta encontrar evidencia verificable.'
  }
]

export const sourceOptions = ['official', 'secondary', 'selfPublished', 'unverified']

export const relationshipExercises = [
  {
    id: 'rel-director',
    from: 'Río Claro Servicios S.A.',
    to: 'Elena Ruiz',
    relation: 'Directora titular desde 2024',
    evidence: 'Publicación societaria RC-02 y acta de designación RC-03.',
    correct: 'supported',
    explanation: 'Dos documentos identificados sostienen el cargo y su fecha de inicio.'
  },
  {
    id: 'rel-contract',
    from: 'Agencia Regional del Agua',
    to: 'Río Claro Servicios S.A.',
    relation: 'Adjudicación del proceso AR-2025-014',
    evidence: 'Resolución de adjudicación CT-01 con razón social e identificador coincidentes.',
    correct: 'supported',
    explanation: 'El proceso y la entidad están identificados en un documento de adjudicación.'
  },
  {
    id: 'rel-consultancy',
    from: 'Elena Ruiz',
    to: 'Nexa Consultores S.R.L.',
    relation: 'Socia o autoridad',
    evidence: 'Ambas entidades utilizaron el mismo estudio contable en documentos de años distintos.',
    correct: 'needsMore',
    explanation: 'Compartir un prestador no demuestra control, participación societaria ni vínculo personal.'
  },
  {
    id: 'rel-group',
    from: 'Río Claro Servicios S.A.',
    to: 'Nexa Consultores S.R.L.',
    relation: 'Integran el mismo grupo económico',
    evidence: 'Una publicación anónima lo afirma, sin documentos ni identificadores relacionados.',
    correct: 'unsupported',
    explanation: 'La afirmación no está respaldada por la evidencia disponible.'
  }
]

export const relationshipOptions = ['supported', 'needsMore', 'unsupported']

export const timelineEvents = [
  {
    id: 'event-foundation',
    date: '2022-03-18',
    label: 'Constitución de Río Claro Servicios S.A.',
    evidenceId: 'RC-01'
  },
  {
    id: 'event-director',
    date: '2024-08-02',
    label: 'Designación de Elena Ruiz como directora titular',
    evidenceId: 'RC-03'
  },
  {
    id: 'event-tender',
    date: '2025-09-10',
    label: 'Publicación del proceso AR-2025-014',
    evidenceId: 'CT-00'
  },
  {
    id: 'event-award',
    date: '2025-11-21',
    label: 'Adjudicación del proceso a Río Claro Servicios S.A.',
    evidenceId: 'CT-01'
  }
]

export const correctTimelineOrder = timelineEvents.map((event) => event.id)

export const claimExercises = [
  {
    id: 'claim-award',
    statement: 'Río Claro Servicios S.A. fue adjudicataria del proceso AR-2025-014.',
    correct: 'fact',
    explanation: 'La resolución CT-01 identifica proceso, entidad y adjudicación.'
  },
  {
    id: 'claim-favor',
    statement: 'La adjudicación fue resultado de favoritismo.',
    correct: 'insufficient',
    explanation: 'La evidencia disponible no permite atribuir motivación ni conducta irregular.'
  },
  {
    id: 'claim-concentration',
    statement: 'La baja cantidad de oferentes podría justificar comparar procesos similares.',
    correct: 'hypothesis',
    explanation: 'Es una línea de análisis razonable, formulada como hipótesis y con una verificación concreta pendiente.'
  },
  {
    id: 'claim-group',
    statement: 'Nexa Consultores S.R.L. pertenece al mismo grupo económico que Río Claro.',
    correct: 'insufficient',
    explanation: 'No hay documentos societarios ni contractuales que respalden esa relación.'
  }
]

export const claimOptions = ['fact', 'hypothesis', 'insufficient']

const countCorrectAnswers = (exercises, answers) => (
  exercises.reduce(
    (total, exercise) => total + (answers[exercise.id] === exercise.correct ? 1 : 0),
    0
  )
)

export const isTimelineCorrect = (timelineOrder) => (
  correctTimelineOrder.every((eventId, index) => timelineOrder[index] === eventId)
)

export const calculateCorporateLabScore = ({
  sourceAnswers = {},
  relationshipAnswers = {},
  timelineOrder = [],
  claimAnswers = {}
}) => {
  const correctSources = countCorrectAnswers(sourceExercises, sourceAnswers)
  const correctRelationships = countCorrectAnswers(relationshipExercises, relationshipAnswers)
  const correctClaims = countCorrectAnswers(claimExercises, claimAnswers)
  const correctTimeline = isTimelineCorrect(timelineOrder) ? 1 : 0
  const correct = correctSources + correctRelationships + correctClaims + correctTimeline
  const total = sourceExercises.length + relationshipExercises.length + claimExercises.length + 1

  return {
    correct,
    total,
    percentage: Math.round((correct / total) * 100)
  }
}

export const isCorporateLabComplete = ({
  sourceAnswers = {},
  relationshipAnswers = {},
  claimAnswers = {},
  timelineSubmitted = false
}) => (
  sourceExercises.every((exercise) => sourceAnswers[exercise.id])
  && relationshipExercises.every((exercise) => relationshipAnswers[exercise.id])
  && claimExercises.every((exercise) => claimAnswers[exercise.id])
  && timelineSubmitted
)

const renderAnswerSection = (title, exercises, answers) => {
  const lines = exercises.map((exercise) => {
    const selected = classificationLabels[answers[exercise.id]] || 'Sin respuesta'
    const expected = classificationLabels[exercise.correct]
    const status = answers[exercise.id] === exercise.correct ? 'Correcto' : `Revisar: ${expected}`
    const label = (exercise.title || exercise.statement).replace(/[.:]+$/, '')
    return `- **${label}:** ${selected} — ${status}.`
  })

  return [`## ${title}`, '', ...lines, ''].join('\n')
}

export const generateCorporateReport = ({
  sourceAnswers = {},
  relationshipAnswers = {},
  timelineOrder = correctTimelineOrder,
  claimAnswers = {}
}, generatedAt = new Date()) => {
  const score = calculateCorporateLabScore({
    sourceAnswers,
    relationshipAnswers,
    timelineOrder,
    claimAnswers
  })
  const orderedEvents = timelineOrder
    .map((eventId) => timelineEvents.find((event) => event.id === eventId))
    .filter(Boolean)
    .map((event) => `- ${event.date} — ${event.label} (${event.evidenceId})`)

  const supportedRelationships = relationshipExercises
    .filter((exercise) => exercise.correct === 'supported')
    .map((exercise) => `- ${exercise.from} → ${exercise.relation} → ${exercise.to} (${exercise.evidence})`)

  const facts = claimExercises
    .filter((exercise) => exercise.correct === 'fact')
    .map((exercise) => `- ${exercise.statement}`)

  const hypotheses = claimExercises
    .filter((exercise) => exercise.correct === 'hypothesis')
    .map((exercise) => `- ${exercise.statement}`)

  const gaps = claimExercises
    .filter((exercise) => exercise.correct === 'insufficient')
    .map((exercise) => `- ${exercise.statement}`)

  return [
    '# Informe de debida diligencia — Expediente Río Claro',
    '',
    '> Caso educativo completamente ficticio. No representa personas, empresas ni contrataciones reales.',
    '',
    `**Generado:** ${generatedAt.toISOString()}`,
    `**Puntaje metodológico:** ${score.correct}/${score.total} (${score.percentage}%)`,
    '',
    '## Pregunta y alcance',
    '',
    'Identificar relaciones societarias y contractuales públicamente documentadas en el expediente ficticio Río Claro, entre 2022 y 2025. Se excluyen datos personales no pertinentes y cualquier forma de acceso no autorizado.',
    '',
    renderAnswerSection('Evaluación de fuentes', sourceExercises, sourceAnswers),
    '## Relaciones respaldadas',
    '',
    ...supportedRelationships,
    '',
    '## Cronología documentada',
    '',
    ...orderedEvents,
    '',
    renderAnswerSection('Clasificación de afirmaciones', claimExercises, claimAnswers),
    '## Hechos',
    '',
    ...facts,
    '',
    '## Hipótesis',
    '',
    ...hypotheses,
    '',
    '## Vacíos de información',
    '',
    ...gaps,
    '',
    '## Próximos pasos',
    '',
    '- Verificar actos societarios posteriores para confirmar la vigencia de autoridades.',
    '- Comparar el proceso AR-2025-014 con contrataciones equivalentes del mismo organismo.',
    '- Buscar documentación primaria que permita confirmar o descartar vínculos con Nexa Consultores S.R.L.',
    '- Conservar URL, fecha de consulta y copia de cada evidencia utilizada.',
    '',
    '## Limitaciones',
    '',
    '- El expediente es una simulación educativa y no consulta sistemas externos.',
    '- Una coincidencia de nombres, proveedores o domicilios profesionales no demuestra control societario.',
    '- Las hipótesis requieren corroboración independiente antes de publicarse como hallazgos.',
    ''
  ].join('\n')
}
