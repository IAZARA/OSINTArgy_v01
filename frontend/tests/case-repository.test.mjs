import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CASES_FALLBACK_STORAGE_KEY,
  createCaseRepository
} from '../src/services/caseRepository.js'
import {
  LEGACY_INVESTIGATION_STORAGE_KEY,
  createEmptyInvestigationProject
} from '../src/utils/investigationProject.js'

const createMemoryStorage = () => {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    has: (key) => values.has(key)
  }
}

test('uses localStorage when IndexedDB is unavailable and supports CRUD', async () => {
  const storage = createMemoryStorage()
  const repository = createCaseRepository({ indexedDB: null, storage })
  const project = createEmptyInvestigationProject('Caso local', { objectiveType: 'domain' })

  const initialized = await repository.initialize()
  assert.equal(initialized.mode, 'localstorage')

  await repository.putCase(project)
  assert.equal((await repository.listCases()).length, 1)
  assert.equal((await repository.getCase(project.id)).name, 'Caso local')
  assert.ok(storage.getItem(CASES_FALLBACK_STORAGE_KEY))

  await repository.deleteCase(project.id)
  assert.equal((await repository.listCases()).length, 0)
})

test('migrates a v1 project and only clears the legacy value after verification', async () => {
  const storage = createMemoryStorage()
  storage.setItem(LEGACY_INVESTIGATION_STORAGE_KEY, JSON.stringify({
    schemaVersion: 1,
    id: 'legacy-case',
    name: 'Proyecto anterior',
    entities: [{ id: 'entity-1', type: 'alias', label: '@anterior' }],
    relationships: [],
    locations: []
  }))
  const repository = createCaseRepository({ indexedDB: null, storage })

  const result = await repository.initialize()
  assert.equal(result.migratedCaseId, 'legacy-case')
  assert.equal(storage.has(LEGACY_INVESTIGATION_STORAGE_KEY), false)
  assert.equal((await repository.getCase('legacy-case')).schemaVersion, 2)
})

test('keeps an invalid legacy import in place and exposes the error', async () => {
  const storage = createMemoryStorage()
  storage.setItem(LEGACY_INVESTIGATION_STORAGE_KEY, '{not-json')
  const repository = createCaseRepository({ indexedDB: null, storage })

  const result = await repository.initialize()
  assert.ok(result.error)
  assert.equal(storage.has(LEGACY_INVESTIGATION_STORAGE_KEY), true)
  assert.equal((await repository.listCases()).length, 0)
})

test('surfaces quota errors from fallback storage', async () => {
  const storage = {
    getItem: () => null,
    removeItem: () => {},
    setItem: () => {
      const error = new Error('Cuota excedida')
      error.name = 'QuotaExceededError'
      throw error
    }
  }
  const repository = createCaseRepository({ indexedDB: null, storage })

  await assert.rejects(
    repository.putCase(createEmptyInvestigationProject('Caso sin espacio')),
    /Cuota excedida/
  )
  assert.equal(repository.getLastError().name, 'QuotaExceededError')
})
