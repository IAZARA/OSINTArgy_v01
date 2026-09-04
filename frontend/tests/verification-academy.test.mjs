import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { ACADEMY_COURSES, ACADEMY_LESSON_CATALOG, ACADEMY_PASS_SCORE } from '../src/components/OSINTAcademy/data/academyCatalog.js'
import { verificationLessons } from '../src/components/OSINTAcademy/data/verificationAcademy.js'

test('new verification course resolves to substantial lessons and graded questions', () => {
  const course = ACADEMY_COURSES.find(course => course.id === 'verification')
  assert.deepEqual(course.moduleIds, Object.keys(verificationLessons))
  for (const id of course.moduleIds) {
    const lesson = verificationLessons[id]
    const definition = ACADEMY_LESSON_CATALOG.find(module => module.id === id)
    assert.equal(lesson.academyId, course.id)
    assert.equal(lesson.slides.length, definition.slideCount)
    assert.equal(lesson.totalSlides, definition.slideCount)
    assert.equal(lesson.slides.at(-1).interactive.type, 'quiz')
    const questions = lesson.slides.at(-1).interactive.questions
    assert.equal(questions.length, 5)
    assert.equal(ACADEMY_PASS_SCORE, 80)
    for (const question of questions) {
      assert.ok(question.question.length > 20)
      assert.ok(question.explanation.length > 30)
      assert.ok(question.options[question.correct])
      assert.equal(new Set(question.options).size, question.options.length)
    }
    for (const slide of lesson.slides.slice(0, -1)) assert.ok(slide.content.length > 400)
    for (const source of lesson.sources) assert.match(source.url, /^https:\/\/(humanrights\.berkeley\.edu|csrc\.nist\.gov|c2pa\.org)\//)
  }
})

test('curriculum IDs, course membership and optional lab IDs remain unambiguous', () => {
  const moduleIds = ACADEMY_COURSES.flatMap(course => course.moduleIds)
  assert.equal(new Set(moduleIds).size, moduleIds.length)
  assert.deepEqual(new Set(moduleIds), new Set(ACADEMY_LESSON_CATALOG.map(module => module.id)))
  for (const course of ACADEMY_COURSES) {
    assert.equal(course.passingScore, 80)
    assert.ok(course.moduleIds.every(id => ACADEMY_LESSON_CATALOG.find(module => module.id === id)?.courseId === course.id))
    assert.ok(course.labIds.every(id => !moduleIds.includes(id)))
  }
})

test('new lessons are reachable in the viewer and the dashboard exposes certificates', async () => {
  const viewer = await readFile(new URL('../src/components/OSINTAcademy/Lessons/LessonViewer.jsx', import.meta.url), 'utf8')
  const dashboard = await readFile(new URL('../src/components/OSINTAcademy/AcademyDashboard.jsx', import.meta.url), 'utf8')
  assert.match(viewer, /\.\.\.verificationLessons/)
  assert.match(dashboard, /\/academy\/certificates/)
  assert.doesNotMatch(viewer, /markAcademyModuleCompleted/)
})
