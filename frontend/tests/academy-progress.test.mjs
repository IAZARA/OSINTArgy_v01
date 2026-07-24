import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACADEMY_PROGRESS_KEY,
  getCompletedAcademyModules,
  isAcademyModuleCompleted,
  markAcademyModuleCompleted
} from '../src/utils/academyProgress.js'

const createMemoryStorage = (initialValue = null) => {
  const values = new Map()
  if (initialValue !== null) {
    values.set(ACADEMY_PROGRESS_KEY, initialValue)
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  }
}

test('academy progress tolerates malformed or unexpected stored data', () => {
  assert.deepEqual(getCompletedAcademyModules(createMemoryStorage('{broken')), [])
  assert.deepEqual(getCompletedAcademyModules(createMemoryStorage('{"module":"corp1"}')), [])
})

test('academy progress normalizes duplicate and invalid module ids', () => {
  const storage = createMemoryStorage(JSON.stringify(['corp1', 'corp1', '', null, 'infra1']))

  assert.deepEqual(getCompletedAcademyModules(storage), ['corp1', 'infra1'])
})

test('marking academy progress is idempotent and queryable', () => {
  const storage = createMemoryStorage()

  assert.deepEqual(markAcademyModuleCompleted('corp1', storage), ['corp1'])
  assert.deepEqual(markAcademyModuleCompleted('corp1', storage), ['corp1'])
  assert.deepEqual(markAcademyModuleCompleted('corp-lab', storage), ['corp1', 'corp-lab'])
  assert.equal(isAcademyModuleCompleted('corp1', storage), true)
  assert.equal(isAcademyModuleCompleted('corp2', storage), false)
})
