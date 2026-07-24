import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  corporateAcademy,
  corporateLessonIds,
  corporateLessons,
  corporateModules
} from '../src/components/OSINTAcademy/data/corporateAcademy.js'

test('corporate academy exposes six unique and resolvable modules', () => {
  const moduleIds = corporateModules.map((module) => module.id)
  const lessonModuleIds = corporateModules
    .filter((module) => module.type === 'lesson')
    .map((module) => module.id)

  assert.equal(corporateAcademy.id, 'corporate')
  assert.equal(corporateAcademy.modules, 6)
  assert.equal(corporateModules.length, 6)
  assert.equal(new Set(moduleIds).size, moduleIds.length)
  assert.deepEqual(lessonModuleIds, corporateLessonIds)
  assert.equal(corporateModules.at(-1).id, 'corp-lab')
  assert.equal(corporateModules.at(-1).type, 'corporate-lab')
})

test('every corporate lesson has consistent slides and a final quiz', () => {
  Object.entries(corporateLessons).forEach(([lessonId, lesson]) => {
    assert.match(lessonId, /^corp[1-5]$/)
    assert.equal(lesson.academyId, 'corporate')
    assert.equal(lesson.totalSlides, lesson.slides.length)
    assert.equal(lesson.slides.at(-1).interactive.type, 'quiz')
  })
})

test('corporate academy keeps official source links and route integration', async () => {
  const serializedLessons = JSON.stringify(corporateLessons)
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8')

  assert.match(serializedLessons, /registro-nacional-sociedades/)
  assert.match(serializedLessons, /argentina\.gob\.ar\/comprar/)
  assert.match(serializedLessons, /argentina\.gob\.ar\/node\/178068/)
  assert.match(appSource, /path="\/academy\/corporate-lab"/)
})
