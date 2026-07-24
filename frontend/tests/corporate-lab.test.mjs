import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateCorporateLabScore,
  claimExercises,
  correctTimelineOrder,
  generateCorporateReport,
  isCorporateLabComplete,
  relationshipExercises,
  sourceExercises
} from '../src/components/OSINTAcademy/CorporateLab/corporateLabData.js'

const answersFor = (exercises) => Object.fromEntries(
  exercises.map((exercise) => [exercise.id, exercise.correct])
)

const correctState = {
  sourceAnswers: answersFor(sourceExercises),
  relationshipAnswers: answersFor(relationshipExercises),
  timelineOrder: correctTimelineOrder,
  claimAnswers: answersFor(claimExercises),
  timelineSubmitted: true
}

test('corporate lab calculates a perfect result for the expected methodology', () => {
  assert.deepEqual(calculateCorporateLabScore(correctState), {
    correct: 13,
    total: 13,
    percentage: 100
  })
  assert.equal(isCorporateLabComplete(correctState), true)
})

test('corporate lab distinguishes completion from correctness', () => {
  const completedWithErrors = {
    sourceAnswers: Object.fromEntries(sourceExercises.map((exercise) => [exercise.id, 'unverified'])),
    relationshipAnswers: Object.fromEntries(
      relationshipExercises.map((exercise) => [exercise.id, 'unsupported'])
    ),
    timelineOrder: [...correctTimelineOrder].reverse(),
    claimAnswers: Object.fromEntries(claimExercises.map((exercise) => [exercise.id, 'hypothesis'])),
    timelineSubmitted: true
  }

  assert.equal(isCorporateLabComplete(completedWithErrors), true)
  assert.ok(calculateCorporateLabScore(completedWithErrors).percentage < 100)
  assert.equal(
    isCorporateLabComplete({ ...completedWithErrors, timelineSubmitted: false }),
    false
  )
})

test('corporate report is deterministic, explicit and downloadable as Markdown', () => {
  const report = generateCorporateReport(correctState, new Date('2026-07-24T12:00:00.000Z'))

  assert.match(report, /^# Informe de debida diligencia — Expediente Río Claro/)
  assert.match(report, /Caso educativo completamente ficticio/)
  assert.match(report, /2026-07-24T12:00:00.000Z/)
  assert.match(report, /## Hechos/)
  assert.match(report, /## Hipótesis/)
  assert.match(report, /## Vacíos de información/)
  assert.match(report, /Puntaje metodológico:\*\* 13\/13 \(100%\)/)
})
