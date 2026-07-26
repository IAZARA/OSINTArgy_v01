import { getFlowchartById } from '../data/flowcharts.js'

export const INVESTIGATION_SCHEMA_VERSION = 2
export const LEGACY_INVESTIGATION_STORAGE_KEY = 'osintargy-investigation-project-v1'
export const INVESTIGATION_STORAGE_KEY = LEGACY_INVESTIGATION_STORAGE_KEY

export const ENTITY_TYPES = Object.freeze([
  { id: 'person', label: 'Persona', color: '#60a5fa' },
  { id: 'alias', label: 'Alias / usuario', color: '#a78bfa' },
  { id: 'email', label: 'Email', color: '#fb7185' },
  { id: 'phone', label: 'Teléfono', color: '#34d399' },
  { id: 'domain', label: 'Dominio / IP', color: '#22d3ee' },
  { id: 'organization', label: 'Organización', color: '#fbbf24' },
  { id: 'vehicle', label: 'Vehículo', color: '#f97316' },
  { id: 'other', label: 'Otro', color: '#94a3b8' }
])

export const OBJECTIVE_TYPES = Object.freeze([
  { id: 'domain', label: 'Dominio', description: 'Infraestructura, historial y presencia web.' },
  { id: 'email', label: 'Email', description: 'Exposición, perfiles y señales públicas.' },
  { id: 'location', label: 'Ubicación', description: 'Validación geográfica y contexto del lugar.' },
  { id: 'realname', label: 'Nombre real', description: 'Identidad, actividad y fuentes públicas.' },
  { id: 'telephone', label: 'Teléfono', description: 'Formato, operador y presencia pública.' },
  { id: 'username', label: 'Username', description: 'Perfiles, reutilización y huella social.' },
  { id: 'organization', label: 'Organización', description: 'Estructura, registros y relaciones corporativas.' },
  { id: 'custom', label: 'Caso libre', description: 'Checklist vacío para una metodología propia.' }
])

export const FINDING_VERIFICATION = Object.freeze([
  { id: 'unverified', label: 'Sin verificar' },
  { id: 'corroborated', label: 'Corroborado' },
  { id: 'disputed', label: 'En disputa' }
])

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max)
const safeString = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback
const validDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}
const uniqueStrings = (values) => (
  Array.isArray(values)
    ? [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))]
    : []
)

export const createInvestigationId = (prefix = 'item') => {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const ORGANIZATION_CHECKLIST = [
  ['scope', 'Definir la organización y el alcance'],
  ['registries', 'Consultar registros oficiales'],
  ['people', 'Identificar autoridades y personas relacionadas'],
  ['domains', 'Relevar dominios e infraestructura pública'],
  ['sources', 'Corroborar hallazgos con fuentes independientes'],
  ['gaps', 'Documentar vacíos y próximos pasos']
]

const toChecklistItem = (source, index) => ({
  id: createInvestigationId('step'),
  sourceStepId: source.id || `custom-${index + 1}`,
  label: safeString(source.label, `Paso ${index + 1}`),
  description: safeString(source.description),
  status: 'pending',
  toolNames: uniqueStrings(source.tools),
  internalTool: safeString(source.internal_tool)
})

export const createChecklistForObjective = (objectiveType = 'custom') => {
  if (objectiveType === 'custom') return []

  if (objectiveType === 'organization') {
    return ORGANIZATION_CHECKLIST.map(([id, label], index) => toChecklistItem({ id, label }, index))
  }

  const flowchart = getFlowchartById(objectiveType)
  if (!flowchart) return []

  return flowchart.nodes
    .filter((node) => node.type !== 'start')
    .map(toChecklistItem)
}

export const createEmptyInvestigationProject = (
  name = 'Nueva investigación',
  options = {}
) => {
  const now = new Date().toISOString()
  const objectiveType = OBJECTIVE_TYPES.some((objective) => objective.id === options.objectiveType)
    ? options.objectiveType
    : 'custom'

  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    id: createInvestigationId('case'),
    name: safeString(name, 'Nueva investigación') || 'Nueva investigación',
    description: safeString(options.description),
    objectiveType,
    objective: safeString(options.objective),
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    entities: [],
    relationships: [],
    locations: [],
    findings: [],
    checklist: options.includeChecklist === false ? [] : createChecklistForObjective(objectiveType)
  }
}

export const createDemoInvestigationProject = () => {
  const project = createEmptyInvestigationProject('Caso demostrativo: Faro Sur', {
    objectiveType: 'username',
    objective: 'Corroborar la huella pública del alias @farosur.',
    description: 'Caso completamente ficticio para conocer el flujo de OSINTArgy.'
  })
  const entities = [
    {
      id: 'demo-person',
      type: 'person',
      label: 'Alex R.',
      value: 'Sujeto de interés',
      notes: 'Identidad hipotética para explorar el tablero.',
      confidence: 'medium',
      x: 500,
      y: 280
    },
    {
      id: 'demo-alias',
      type: 'alias',
      label: '@farosur',
      value: 'Perfil público',
      notes: 'El alias aparece en publicaciones geolocalizadas.',
      confidence: 'high',
      x: 280,
      y: 150
    },
    {
      id: 'demo-domain',
      type: 'domain',
      label: 'farosur.example',
      value: 'Dominio de demostración',
      notes: 'El dominio .example evita apuntar a infraestructura real.',
      confidence: 'low',
      x: 720,
      y: 150
    },
    {
      id: 'demo-org',
      type: 'organization',
      label: 'Colectivo Faro',
      value: 'Organización ficticia',
      notes: 'Entidad creada únicamente con fines de demostración.',
      confidence: 'medium',
      x: 500,
      y: 465
    }
  ]

  return {
    ...project,
    entities,
    relationships: [
      {
        id: 'demo-rel-alias',
        sourceId: 'demo-person',
        targetId: 'demo-alias',
        label: 'posible uso',
        confidence: 'medium'
      },
      {
        id: 'demo-rel-domain',
        sourceId: 'demo-alias',
        targetId: 'demo-domain',
        label: 'menciona',
        confidence: 'low'
      },
      {
        id: 'demo-rel-org',
        sourceId: 'demo-person',
        targetId: 'demo-org',
        label: 'vinculado a',
        confidence: 'medium'
      }
    ],
    locations: [
      {
        id: 'demo-location',
        name: 'Plaza de Mayo',
        address: 'Monserrat, Ciudad de Buenos Aires',
        latitude: -34.6083,
        longitude: -58.3712,
        visitedAt: '2026-07-20',
        notes: 'Ubicación pública de ejemplo; no representa actividad real.',
        linkedEntityIds: ['demo-alias']
      }
    ],
    findings: [
      {
        id: 'demo-finding',
        title: 'El alias menciona una organización ficticia',
        url: 'https://example.com/farosur',
        sourceName: 'Sitio de ejemplo',
        toolId: '',
        toolName: 'Navegador web',
        observedAt: '2026-07-20',
        capturedAt: project.createdAt,
        notes: 'Hallazgo demostrativo sin relación con personas reales.',
        verification: 'corroborated',
        entityIds: ['demo-alias', 'demo-org'],
        locationIds: ['demo-location']
      }
    ]
  }
}

const normalizeEntities = (input) => {
  const entityTypes = new Set(ENTITY_TYPES.map((type) => type.id))
  const ids = new Set()

  return (Array.isArray(input) ? input : []).flatMap((entity, index) => {
    if (!entity || typeof entity !== 'object') return []
    const id = safeString(entity.id) || `entity-imported-${index + 1}`
    const label = safeString(entity.label)
    if (!label || ids.has(id)) return []
    ids.add(id)

    return [{
      id,
      type: entityTypes.has(entity.type) ? entity.type : 'other',
      label,
      value: safeString(entity.value),
      notes: safeString(entity.notes),
      confidence: ['low', 'medium', 'high'].includes(entity.confidence)
        ? entity.confidence
        : 'medium',
      x: clamp(entity.x ?? 180 + (index % 4) * 210, 70, 930),
      y: clamp(entity.y ?? 120 + Math.floor(index / 4) * 160, 70, 550)
    }]
  })
}

export const normalizeInvestigationProject = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('El archivo no contiene un proyecto válido.')
  }

  const now = new Date().toISOString()
  const entities = normalizeEntities(input.entities)
  const entityIds = new Set(entities.map((entity) => entity.id))
  const relationshipIds = new Set()
  const locationIds = new Set()
  const findingIds = new Set()
  const objectiveType = OBJECTIVE_TYPES.some((objective) => objective.id === input.objectiveType)
    ? input.objectiveType
    : 'custom'

  const relationships = (Array.isArray(input.relationships) ? input.relationships : []).flatMap(
    (relationship, index) => {
      if (!relationship || typeof relationship !== 'object') return []
      const id = safeString(relationship.id) || `relationship-imported-${index + 1}`
      const sourceId = safeString(relationship.sourceId)
      const targetId = safeString(relationship.targetId)
      if (
        relationshipIds.has(id)
        || !entityIds.has(sourceId)
        || !entityIds.has(targetId)
        || sourceId === targetId
      ) return []

      relationshipIds.add(id)
      return [{
        id,
        sourceId,
        targetId,
        label: safeString(relationship.label, 'relacionado con') || 'relacionado con',
        confidence: ['low', 'medium', 'high'].includes(relationship.confidence)
          ? relationship.confidence
          : 'medium'
      }]
    }
  )

  const locations = (Array.isArray(input.locations) ? input.locations : []).flatMap(
    (location, index) => {
      if (!location || typeof location !== 'object') return []
      const latitude = Number(location.latitude)
      const longitude = Number(location.longitude)
      const name = safeString(location.name)
      const id = safeString(location.id) || `location-imported-${index + 1}`
      if (
        !name
        || locationIds.has(id)
        || !Number.isFinite(latitude)
        || !Number.isFinite(longitude)
        || latitude < -90
        || latitude > 90
        || longitude < -180
        || longitude > 180
      ) return []

      locationIds.add(id)
      return [{
        id,
        name,
        address: safeString(location.address),
        latitude,
        longitude,
        visitedAt: safeString(location.visitedAt),
        notes: safeString(location.notes),
        linkedEntityIds: uniqueStrings(location.linkedEntityIds).filter((entityId) => entityIds.has(entityId))
      }]
    }
  )

  const findings = (Array.isArray(input.findings) ? input.findings : []).flatMap(
    (finding, index) => {
      if (!finding || typeof finding !== 'object') return []
      const id = safeString(finding.id) || `finding-imported-${index + 1}`
      const title = safeString(finding.title)
      if (!title || findingIds.has(id)) return []
      findingIds.add(id)

      return [{
        id,
        title,
        url: safeString(finding.url),
        sourceName: safeString(finding.sourceName),
        toolId: safeString(finding.toolId),
        toolName: safeString(finding.toolName),
        observedAt: safeString(finding.observedAt),
        capturedAt: validDate(finding.capturedAt) || now,
        notes: safeString(finding.notes),
        verification: ['unverified', 'corroborated', 'disputed'].includes(finding.verification)
          ? finding.verification
          : 'unverified',
        entityIds: uniqueStrings(finding.entityIds).filter((entityId) => entityIds.has(entityId)),
        locationIds: uniqueStrings(finding.locationIds).filter((locationId) => locationIds.has(locationId))
      }]
    }
  )

  const checklist = (Array.isArray(input.checklist) ? input.checklist : []).flatMap((item, index) => {
    if (!item || typeof item !== 'object') return []
    const label = safeString(item.label)
    if (!label) return []
    return [{
      id: safeString(item.id) || `step-imported-${index + 1}`,
      sourceStepId: safeString(item.sourceStepId),
      label,
      description: safeString(item.description),
      status: ['pending', 'completed', 'skipped'].includes(item.status) ? item.status : 'pending',
      toolNames: uniqueStrings(item.toolNames),
      internalTool: safeString(item.internalTool)
    }]
  })

  const normalizedChecklist = checklist.length || Number(input.schemaVersion) >= 2
    ? checklist
    : createChecklistForObjective(objectiveType)

  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    id: safeString(input.id) || createInvestigationId('case'),
    name: safeString(input.name, 'Investigación importada') || 'Investigación importada',
    description: safeString(input.description),
    objectiveType,
    objective: safeString(input.objective),
    status: input.status === 'archived' ? 'archived' : 'active',
    createdAt: validDate(input.createdAt) || now,
    updatedAt: validDate(input.updatedAt) || now,
    lastOpenedAt: validDate(input.lastOpenedAt) || validDate(input.updatedAt) || now,
    entities,
    relationships,
    locations,
    findings,
    checklist: normalizedChecklist
  }
}

export const parseInvestigationProject = (contents) => {
  let parsed
  try {
    parsed = JSON.parse(contents)
  } catch {
    throw new Error('El archivo JSON no se pudo leer.')
  }
  return normalizeInvestigationProject(parsed)
}

export const serializeInvestigationProject = (project) => JSON.stringify(
  {
    ...normalizeInvestigationProject(project),
    updatedAt: new Date().toISOString()
  },
  null,
  2
)

export const duplicateInvestigationProject = (project) => {
  const duplicated = normalizeInvestigationProject(project)
  const now = new Date().toISOString()
  return {
    ...duplicated,
    id: createInvestigationId('case'),
    name: `${duplicated.name} — copia`,
    status: 'active',
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now
  }
}

export const getEntityType = (typeId) => (
  ENTITY_TYPES.find((type) => type.id === typeId)
  || ENTITY_TYPES[ENTITY_TYPES.length - 1]
)

export const buildSafeFilename = (name) => {
  const normalized = safeString(name, 'investigacion')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return `${normalized || 'investigacion'}.osintargy.json`
}

export const buildInvestigationTimeline = (project) => {
  const normalized = normalizeInvestigationProject(project)
  return [
    ...normalized.findings.map((finding) => ({
      id: `finding-${finding.id}`,
      type: 'finding',
      title: finding.title,
      date: finding.observedAt || finding.capturedAt,
      detail: finding.sourceName || finding.url || 'Hallazgo documentado'
    })),
    ...normalized.locations
      .filter((location) => location.visitedAt)
      .map((location) => ({
        id: `location-${location.id}`,
        type: 'location',
        title: location.name,
        date: location.visitedAt,
        detail: location.address || 'Ubicación observada'
      }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export const searchInvestigation = (project, query) => {
  const normalized = normalizeInvestigationProject(project)
  const term = safeString(query).toLocaleLowerCase('es')
  if (!term) return []

  return [
    ...normalized.entities.map((entity) => ({
      kind: 'entity',
      id: entity.id,
      label: entity.label,
      detail: entity.value || getEntityType(entity.type).label
    })),
    ...normalized.findings.map((finding) => ({
      kind: 'finding',
      id: finding.id,
      label: finding.title,
      detail: finding.sourceName || finding.url
    })),
    ...normalized.locations.map((location) => ({
      kind: 'location',
      id: location.id,
      label: location.name,
      detail: location.address
    }))
  ].filter((item) => `${item.label} ${item.detail}`.toLocaleLowerCase('es').includes(term))
}

export const generateInvestigationMarkdown = (project) => {
  const normalized = normalizeInvestigationProject(project)
  const verified = normalized.findings.filter((finding) => finding.verification === 'corroborated')
  const hypotheses = normalized.findings.filter((finding) => finding.verification !== 'corroborated')
  const pending = normalized.checklist.filter((item) => item.status === 'pending')

  const renderFinding = (finding) => [
    `### ${finding.title}`,
    finding.sourceName ? `- Fuente: ${finding.sourceName}` : null,
    finding.url ? `- URL: ${finding.url}` : null,
    finding.observedAt ? `- Fecha observada: ${finding.observedAt}` : null,
    finding.notes ? `- Nota: ${finding.notes}` : null
  ].filter(Boolean).join('\n')

  return [
    `# Informe OSINT — ${normalized.name}`,
    '',
    `**Generado:** ${new Date().toISOString()}`,
    `**Objetivo:** ${normalized.objective || 'Sin objetivo documentado'}`,
    `**Metodología:** ${OBJECTIVE_TYPES.find((item) => item.id === normalized.objectiveType)?.label || 'Caso libre'}`,
    '',
    '## Alcance',
    normalized.description || 'Sin descripción adicional.',
    '',
    '## Hechos corroborados',
    verified.length ? verified.map(renderFinding).join('\n\n') : 'No hay hallazgos corroborados.',
    '',
    '## Hipótesis y datos pendientes de corroboración',
    hypotheses.length ? hypotheses.map(renderFinding).join('\n\n') : 'No hay hipótesis registradas.',
    '',
    '## Entidades',
    normalized.entities.length
      ? normalized.entities.map((entity) => `- **${entity.label}** — ${entity.value || getEntityType(entity.type).label}`).join('\n')
      : 'No hay entidades registradas.',
    '',
    '## Ubicaciones',
    normalized.locations.length
      ? normalized.locations.map((location) => `- **${location.name}** — ${location.latitude}, ${location.longitude}`).join('\n')
      : 'No hay ubicaciones registradas.',
    '',
    '## Vacíos y próximos pasos',
    pending.length ? pending.map((item) => `- ${item.label}`).join('\n') : 'No quedan pasos pendientes.',
    '',
    '> Informe generado localmente. Corroborá los datos y respetá la legislación aplicable.'
  ].join('\n')
}

// Compatibilidad temporal para consumidores v1; la UX v2 usa CaseRepository.
export const loadInvestigationProject = (storage = globalThis.localStorage) => {
  if (!storage) return null
  try {
    const value = storage.getItem(LEGACY_INVESTIGATION_STORAGE_KEY)
    return value ? parseInvestigationProject(value) : null
  } catch {
    return null
  }
}

export const saveInvestigationProject = (project, storage = globalThis.localStorage) => {
  if (!storage) return false
  try {
    storage.setItem(LEGACY_INVESTIGATION_STORAGE_KEY, serializeInvestigationProject(project))
    return true
  } catch {
    return false
  }
}
