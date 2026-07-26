import assert from 'node:assert/strict'
import test from 'node:test'
import {
  INVESTIGATION_SCHEMA_VERSION,
  INVESTIGATION_STORAGE_KEY,
  buildSafeFilename,
  createDemoInvestigationProject,
  loadInvestigationProject,
  normalizeInvestigationProject,
  parseInvestigationProject,
  saveInvestigationProject,
  serializeInvestigationProject
} from '../src/utils/investigationProject.js'

const createMemoryStorage = () => {
  const values = new Map()

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

test('investigation projects round-trip through the local format', () => {
  const project = createDemoInvestigationProject()
  const restored = parseInvestigationProject(serializeInvestigationProject(project))

  assert.equal(restored.schemaVersion, INVESTIGATION_SCHEMA_VERSION)
  assert.equal(restored.name, project.name)
  assert.equal(restored.entities.length, 4)
  assert.equal(restored.relationships.length, 3)
  assert.equal(restored.locations.length, 1)
  assert.equal(restored.findings.length, 1)
  assert.ok(restored.checklist.length > 0)
  assert.deepEqual(restored.locations[0].linkedEntityIds, ['demo-alias'])
})

test('imports v1 and v2 files into schema v2', () => {
  const legacy = parseInvestigationProject(JSON.stringify({
    schemaVersion: 1,
    name: 'Legado',
    objectiveType: 'email',
    entities: [],
    relationships: [],
    locations: []
  }))
  const current = parseInvestigationProject(serializeInvestigationProject(
    createDemoInvestigationProject()
  ))

  assert.equal(legacy.schemaVersion, 2)
  assert.ok(legacy.checklist.length > 0)
  assert.equal(current.schemaVersion, 2)
})

test('rejects invalid imports', () => {
  assert.throws(() => parseInvestigationProject('{invalid'), /no se pudo leer/i)
  assert.throws(() => parseInvestigationProject('[]'), /proyecto válido/i)
})

test('normalization removes dangling relationships and invalid linked entities', () => {
  const normalized = normalizeInvestigationProject({
    name: 'Caso importado',
    entities: [
      { id: 'known', type: 'person', label: 'Entidad conocida', x: 200, y: 200 },
      { id: 'known', type: 'alias', label: 'Duplicada' },
      { id: 'empty', type: 'alias', label: '' }
    ],
    relationships: [
      { id: 'valid', sourceId: 'known', targetId: 'known', label: 'autovínculo' },
      { id: 'dangling', sourceId: 'known', targetId: 'missing', label: 'inválida' }
    ],
    locations: [
      {
        id: 'place',
        name: 'Punto válido',
        latitude: -34.6,
        longitude: -58.4,
        linkedEntityIds: ['known', 'missing', 'known']
      },
      { id: 'bad-place', name: 'Fuera del planeta', latitude: 140, longitude: 20 }
    ]
  })

  assert.equal(normalized.entities.length, 1)
  assert.equal(normalized.relationships.length, 0)
  assert.equal(normalized.locations.length, 1)
  assert.deepEqual(normalized.locations[0].linkedEntityIds, ['known'])
})

test('local persistence tolerates malformed data and uses one scoped key', () => {
  const storage = createMemoryStorage()
  storage.setItem(INVESTIGATION_STORAGE_KEY, '{broken')
  assert.equal(loadInvestigationProject(storage), null)

  const project = createDemoInvestigationProject()
  assert.equal(saveInvestigationProject(project, storage), true)
  assert.equal(loadInvestigationProject(storage).id, project.id)
})

test('exports use a stable safe filename', () => {
  assert.equal(buildSafeFilename('Caso: Río Claro / 2026'), 'caso-rio-claro-2026.osintargy.json')
  assert.equal(buildSafeFilename('  '), 'investigacion.osintargy.json')
})
