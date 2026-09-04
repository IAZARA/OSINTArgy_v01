import assert from 'node:assert/strict'
import test from 'node:test'
import {
  ACADEMY_PROGRESS_KEY, LEGACY_ACADEMY_PROGRESS_KEY, calculateAcademySummary,
  completeAcademyModule, createDefaultAcademyProgress, getCompletedAcademyModules,
  loadAcademyProgress, normalizeAcademyProgress, recordAcademyActivity,
  recordAcademyAudio, recordAcademyQuiz, saveAcademyProgress, visitAcademySlide
} from '../src/utils/academyProgress.js'
import { ACADEMY_COURSES, ACADEMY_LESSON_CATALOG } from '../src/components/OSINTAcademy/data/academyCatalog.js'

const storageWith = (initialValue, key = ACADEMY_PROGRESS_KEY) => {
  const values = new Map(initialValue === undefined ? [] : [[key, initialValue]])
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }
}
const readAll = (id, progress = createDefaultAcademyProgress()) => {
  const definition = ACADEMY_LESSON_CATALOG.find(module => module.id === id)
  return Array.from({ length: definition.slideCount }, (_, index) => index).reduce((state, index) => visitAcademySlide(state, id, index), progress)
}

test('academy progress tolerates corrupted JSON, unexpected data and inaccessible storage', () => {
  assert.deepEqual(getCompletedAcademyModules(storageWith('{broken')), [])
  assert.deepEqual(getCompletedAcademyModules(storageWith('["corp1"]')), [])
  assert.deepEqual(loadAcademyProgress({ getItem: () => { throw new Error('disabled') } }), createDefaultAcademyProgress())
  assert.deepEqual(saveAcademyProgress(createDefaultAcademyProgress(), { setItem: () => { throw new Error('quota') } }), createDefaultAcademyProgress())
})

test('unverified legacy bare completions remain reviewed and never certify', () => {
  const storage = storageWith(JSON.stringify(['corp1', 'corp1', 'infra1', '__proto__', null]), LEGACY_ACADEMY_PROGRESS_KEY)
  const progress = loadAcademyProgress(storage)
  assert.equal(progress.modules.corp1.legacyReviewed, true)
  assert.equal(progress.modules.infra1.completed, false)
  assert.deepEqual(getCompletedAcademyModules(storage), [])
})

test('v1 detailed progress keeps reading history but requires a fresh assessment', () => {
  const storage = storageWith(JSON.stringify({ version: 1, modules: { modulo1: { completed: true, bestScore: 100, viewedSlides: [0, 1], quizSubmitted: true } } }))
  const progress = loadAcademyProgress(storage)
  assert.equal(progress.version, 2)
  assert.deepEqual(progress.modules.modulo1.viewedSlides, [0, 1])
  assert.equal(progress.modules.modulo1.bestScore, 0)
  assert.equal(progress.modules.modulo1.quizSubmitted, false)
  assert.equal(progress.modules.modulo1.completed, false)
  assert.equal(progress.modules.modulo1.legacyReviewed, true)
})

test('unique valid views resume correctly across every track', () => {
  for (const course of ACADEMY_COURSES) {
    const id = course.moduleIds[0]
    let progress = visitAcademySlide(createDefaultAcademyProgress(), id, 0)
    progress = visitAcademySlide(progress, id, 1)
    progress = visitAcademySlide(progress, id, 1)
    progress = visitAcademySlide(progress, id, -1)
    progress = visitAcademySlide(progress, id, 100)
    assert.deepEqual(progress.modules[id].viewedSlides, [0, 1])
    assert.deepEqual(progress.lastVisited, { moduleId: id, slideIndex: 1 })
    assert.equal(calculateAcademySummary(progress).viewedSlides, 2)
  }
})

test('neither reading nor failed evaluation completes a module', () => {
  let progress = readAll('modulo2')
  assert.equal(calculateAcademySummary(progress).coursePercent, 0)
  progress = completeAcademyModule(progress, 'modulo2', 60)
  assert.notEqual(progress.modules.modulo2.completed, true)
  assert.equal(progress.modules.modulo2.attempts, 1)
})

test('passing a quiz cannot fabricate unread slides', () => {
  const progress = completeAcademyModule(createDefaultAcademyProgress(), 'verify1', 100)
  assert.deepEqual(progress.modules.verify1.viewedSlides, [])
  assert.notEqual(progress.modules.verify1.completed, true)
  assert.equal(progress.modules.verify1.bestScore, 100)
})

test('all viewed slides and a passing evaluation complete any curriculum module', () => {
  for (const definition of ACADEMY_LESSON_CATALOG) {
    const result = completeAcademyModule(readAll(definition.id), definition.id, 80)
    assert.equal(result.modules[definition.id].completed, true, definition.id)
    assert.match(result.modules[definition.id].completedAt, /^\d{4}-/)
    assert.equal(result.modules[definition.id].viewedSlides.length, definition.slideCount)
  }
})

test('best passing score and completion survive a later lower result; finalize is idempotent', () => {
  let progress = recordAcademyQuiz(readAll('corp1'), 'corp1', 100)
  progress = completeAcademyModule(progress, 'corp1')
  const completedAt = progress.modules.corp1.completedAt
  progress = recordAcademyQuiz(progress, 'corp1', 40)
  progress = completeAcademyModule(progress, 'corp1')
  assert.equal(progress.modules.corp1.bestScore, 100)
  assert.equal(progress.modules.corp1.lastScore, 40)
  assert.equal(progress.modules.corp1.attempts, 2)
  assert.equal(progress.modules.corp1.completed, true)
  assert.equal(progress.modules.corp1.completedAt, completedAt)
})

test('invalid scores, unknown modules and invalid claimed completions are rejected', () => {
  for (const score of [NaN, Infinity, -1, 101, '100', null]) {
    assert.deepEqual(recordAcademyQuiz(createDefaultAcademyProgress(), 'verify1', score), createDefaultAcademyProgress())
  }
  assert.deepEqual(completeAcademyModule(createDefaultAcademyProgress(), 'unknown', 100), createDefaultAcademyProgress())
  const progress = normalizeAcademyProgress({ version: 2, modules: { verify1: { viewedSlides: [0, 0, 0, 0, 0], quizSubmitted: true, bestScore: 100, completed: true } } })
  assert.equal(progress.modules.verify1.completed, false)
  assert.deepEqual(progress.modules.verify1.viewedSlides, [0])
})

test('persisted detailed progress is the same evidence read by dashboards and certificates', () => {
  const storage = storageWith()
  const progress = completeAcademyModule(readAll('infra3'), 'infra3', 100)
  saveAcademyProgress(progress, storage)
  const reloaded = loadAcademyProgress(storage)
  assert.equal(reloaded.modules.infra3.completed, true)
  assert.deepEqual(getCompletedAcademyModules(storage), ['infra3'])
  assert.equal(calculateAcademySummary(reloaded).completedCount, 1)
})

test('activities and audio are separate from assessed curriculum progress', () => {
  let progress = recordAcademyActivity(createDefaultAcademyProgress(), 'infra-lab', { score: 100, completed: true })
  progress = recordAcademyAudio(progress, 90, 100)
  assert.equal(progress.activities['infra-lab'].completed, true)
  assert.equal(progress.audio.completed, true)
  assert.equal(progress.activities.audio.completed, true)
  assert.equal(calculateAcademySummary(progress).completedCount, 0)
})

test('summary includes every route without counting labs or audio as assessed modules', () => {
  assert.equal(ACADEMY_COURSES.length, 4)
  const summary = calculateAcademySummary(createDefaultAcademyProgress())
  assert.equal(summary.totalModules, 18)
  assert.equal(summary.totalSlides, 100)
})
