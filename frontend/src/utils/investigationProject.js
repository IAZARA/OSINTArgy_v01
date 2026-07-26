export const INVESTIGATION_SCHEMA_VERSION = 1
export const INVESTIGATION_STORAGE_KEY = 'osintargy-investigation-project-v1'

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

const clamp = (value, min, max) => Math.min(Math.max(Number(value) || 0, min), max)
const safeString = (value, fallback = '') => typeof value === 'string' ? value.trim() : fallback
const validDate = (value) => {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export const createInvestigationId = (prefix = 'item') => {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const createEmptyInvestigationProject = (name = 'Nueva investigación') => {
  const now = new Date().toISOString()

  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    id: createInvestigationId('case'),
    name: safeString(name, 'Nueva investigación') || 'Nueva investigación',
    createdAt: now,
    updatedAt: now,
    entities: [],
    relationships: [],
    locations: []
  }
}

export const createDemoInvestigationProject = () => {
  const project = createEmptyInvestigationProject('Caso demostrativo: Faro Sur')
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
    ]
  }
}

export const normalizeInvestigationProject = (input) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('El archivo no contiene un proyecto válido.')
  }

  const now = new Date().toISOString()
  const entityTypes = new Set(ENTITY_TYPES.map((type) => type.id))
  const rawEntities = Array.isArray(input.entities) ? input.entities : []
  const entityIds = new Set()

  const entities = rawEntities.flatMap((entity, index) => {
    if (!entity || typeof entity !== 'object') return []

    const id = safeString(entity.id) || `entity-imported-${index + 1}`
    const label = safeString(entity.label)
    if (!label || entityIds.has(id)) return []

    entityIds.add(id)
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

  const relationshipIds = new Set()
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
      ) {
        return []
      }

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

  const locationIds = new Set()
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
      ) {
        return []
      }

      locationIds.add(id)
      return [{
        id,
        name,
        address: safeString(location.address),
        latitude,
        longitude,
        visitedAt: safeString(location.visitedAt),
        notes: safeString(location.notes),
        linkedEntityIds: Array.isArray(location.linkedEntityIds)
          ? [...new Set(location.linkedEntityIds.filter((entityId) => entityIds.has(entityId)))]
          : []
      }]
    }
  )

  return {
    schemaVersion: INVESTIGATION_SCHEMA_VERSION,
    id: safeString(input.id) || createInvestigationId('case'),
    name: safeString(input.name, 'Investigación importada') || 'Investigación importada',
    createdAt: validDate(input.createdAt) || now,
    updatedAt: validDate(input.updatedAt) || now,
    entities,
    relationships,
    locations
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

export const loadInvestigationProject = (storage = globalThis.localStorage) => {
  if (!storage) return null

  try {
    const value = storage.getItem(INVESTIGATION_STORAGE_KEY)
    return value ? parseInvestigationProject(value) : null
  } catch {
    return null
  }
}

export const saveInvestigationProject = (project, storage = globalThis.localStorage) => {
  if (!storage) return false

  try {
    storage.setItem(INVESTIGATION_STORAGE_KEY, serializeInvestigationProject(project))
    return true
  } catch {
    return false
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
