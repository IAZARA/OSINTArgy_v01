import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  gradeLocalAssessment, createLocalCertificate, loadCertificates, saveCertificate,
  certificateDocument, linkedinFields, safeVerificationUrl, LINKEDIN_ADD_URL,
} from '../src/utils/certificates.js'
import { ACADEMY_COURSES } from '../src/components/OSINTAcademy/data/academyCatalog.js'

const assessments = JSON.parse(readFileSync(new URL('../src/data/academy-assessments.json', import.meta.url)))
const course = assessments[0]
const answers = course.questions.map(question => question.answer)
const storage = () => { const values = new Map(); return { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) } }

test('every course has a synchronized final assessment with valid solutions', () => {
  const server = JSON.parse(readFileSync(new URL('../../backend/src/data/academy-assessments.json', import.meta.url)))
  assert.deepEqual(assessments, server)
  assert.deepEqual(assessments.map(item => item.id).sort(), ACADEMY_COURSES.map(item => item.id).sort())
  for (const assessment of assessments) {
    assert.equal(assessment.title, ACADEMY_COURSES.find(item => item.id === assessment.id).title)
    assert.ok(assessment.questions.length >= 5)
    assert.equal(assessment.passingScore, 80)
    for (const question of assessment.questions) assert.ok(question.options[question.answer])
  }
})

test('local assessment rejects missing answers and awards only passing evaluations', () => {
  assert.equal(gradeLocalAssessment(course, answers).score, 100)
  assert.throws(() => gradeLocalAssessment(course, new Array(5)), /todas las preguntas/)
  assert.throws(() => gradeLocalAssessment(course, []), /todas las preguntas/)
  assert.throws(() => gradeLocalAssessment(course, answers.map(() => null)), /todas las preguntas/)
  assert.throws(() => createLocalCertificate(course, 'Test', answers.map(answer => (answer + 1) % 3)), /80%/)
  assert.throws(() => createLocalCertificate(course, ' ', answers), /nombre/)
  const certificate = createLocalCertificate(course, 'Nombre <de> prueba', answers)
  assert.equal(certificate.kind, 'local')
  assert.equal(certificate.verified, false)
  assert.equal(certificate.verificationUrl, null)
  assert.match(certificate.id, /^LOCAL-/)
})

test('saved credentials survive reload, are deduplicated, and malformed storage is ignored', () => {
  const target = storage()
  const certificate = createLocalCertificate(course, 'Test Student', answers)
  saveCertificate(certificate, target)
  saveCertificate(certificate, target)
  assert.equal(loadCertificates(target).length, 1)
  assert.deepEqual(loadCertificates(target)[0], certificate)
  assert.deepEqual(loadCertificates({ getItem: () => '{broken' }), [])
  assert.throws(() => saveCertificate(certificate, { getItem: () => null, setItem: () => { throw new Error('Full') } }), /Full/)
})

test('LinkedIn handoff opens official form and never presents a local URL as verification', () => {
  const certificate = createLocalCertificate(course, 'Test Student', answers)
  assert.equal(new URL(LINKEDIN_ADD_URL).hostname, 'www.linkedin.com')
  assert.equal(new URL(LINKEDIN_ADD_URL).searchParams.get('startTask'), 'CERTIFICATION_NAME')
  assert.equal(safeVerificationUrl({ ...certificate, verificationUrl: 'https://example.org/fake' }), null)
  assert.match(linkedinFields(certificate).at(-1)[1], /dejar vacío/)
  assert.equal(safeVerificationUrl({ ...certificate, kind: 'assessment', verificationUrl: 'javascript:alert(1)' }), null)
})

test('denied localStorage getter leaves the wallet usable', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Denied') } })
  try { assert.deepEqual(loadCertificates(), []) }
  finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original)
    else delete globalThis.localStorage
  }
})

test('downloadable certificate escapes user data and includes print/PDF affordance', () => {
  const certificate = createLocalCertificate(course, '<script>alert(1)</script>', answers)
  const html = certificateDocument(certificate)
  assert.ok(!html.includes('<script>alert(1)</script>'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.match(html, /guardar como PDF/)
  assert.match(html, /No tiene verificación pública/)
  assert.ok(!html.includes('href="javascript:'))
  assert.deepEqual(loadCertificates({ getItem: () => JSON.stringify([{ ...certificate, score: '<img src=x onerror=alert(1)>' }]) }), [])
  assert.ok(!certificateDocument({ ...certificate, score: '<img src=x onerror=alert(1)>' }).includes('<img src=x'))
})
