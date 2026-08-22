import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACADEMY_PROGRESS_KEY,
  getCompletedAcademyModules,
  isAcademyModuleCompleted,
  markAcademyModuleCompleted
} from '../src/utils/academyProgress.js'
import {
  calculateAcademySummary,
  completeAcademyModule,
  createDefaultAcademyProgress,
  loadAcademyProgress,
  recordAcademyActivity,
  recordAcademyAudio,
  recordAcademyQuiz,
  visitAcademySlide
} from '../src/components/OSINTAcademy/useAcademyProgress.js'

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

test('academy progress records unique slides and resumes the last visit', () => {
  let progress = createDefaultAcademyProgress()
  progress = visitAcademySlide(progress, 'modulo1', 0)
  progress = visitAcademySlide(progress, 'modulo1', 1)
  progress = visitAcademySlide(progress, 'modulo1', 1)

  assert.deepEqual(progress.modules.modulo1.viewedSlides, [0, 1])
  assert.deepEqual(progress.lastVisited, { moduleId: 'modulo1', slideIndex: 1 })
  assert.equal(calculateAcademySummary(progress).viewedSlides, 2)
})

test('academy quiz keeps the best score and module completion fills every slide', () => {
  let progress = createDefaultAcademyProgress()
  progress = recordAcademyQuiz(progress, 'modulo2', 80)
  progress = recordAcademyQuiz(progress, 'modulo2', 60)
  progress = completeAcademyModule(progress, 'modulo2', 90)

  assert.equal(progress.modules.modulo2.lastScore, 90)
  assert.equal(progress.modules.modulo2.bestScore, 90)
  assert.equal(progress.modules.modulo2.completed, true)
  assert.equal(progress.modules.modulo2.viewedSlides.length, 7)
})

test('academy activities and audio completion persist independently', () => {
  let progress = recordAcademyActivity(createDefaultAcademyProgress(), 'mindmap', {
    exploredNodes: ['osint', 'fuentes']
  })
  progress = recordAcademyAudio(progress, 90, 100)

  assert.equal(progress.activities.mindmap.visited, true)
  assert.deepEqual(progress.activities.mindmap.exploredNodes, ['osint', 'fuentes'])
  assert.equal(progress.audio.completed, true)
  assert.equal(progress.audio.currentTime, 100)
  assert.equal(progress.activities.audio.completed, true)
})

test('academy storage loading tolerates corrupted data', () => {
  const corruptedStorage = { getItem: () => '{not-json' }
  const progress = loadAcademyProgress(corruptedStorage)

  assert.deepEqual(progress, createDefaultAcademyProgress())
})
