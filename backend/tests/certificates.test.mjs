import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'
import request from 'supertest'
import { createCertificateRouter } from '../src/routes/certificates.js'
import { assessments, gradeAssessment, publicSiteUrl, verifyCertificate } from '../src/services/certificates.js'

const secret = 'test-only-certificate-key-never-use-in-production'
const course = assessments[0]
const answers = course.questions.map(question => question.answer)
const body = { learnerName: 'Analista de prueba', courseId: course.id, answers, publicConsent: true }
function fixture(options = {}) {
  const records = new Map()
  const app = express()
  app.use(express.json())
  app.use('/api/certificates', createCertificateRouter({
    repository: { save: async value => records.set(value.id, value), find: async id => records.get(id) },
    getSecret: () => secret, getPublicUrl: () => 'https://academy.example.org', ...options,
  }))
  return { app, records }
}

test('assessment grades submitted answers, rejects incomplete and forged score', async () => {
  assert.equal(gradeAssessment(course.id, answers).score, 100)
  assert.throws(() => gradeAssessment(course.id, []), /todas las preguntas/)
  assert.throws(() => gradeAssessment('unknown', answers), /desconocido/)
  const { app, records } = fixture()
  await request(app).post('/api/certificates/issue').send({ ...body, answers: answers.map((answer, index) => (answer + 1) % course.questions[index].options.length), score: 100 }).expect(422)
  await request(app).post('/api/certificates/issue').send({ ...body, answers: [] }).expect(400)
  assert.equal(records.size, 0)
})

test('public assessment omits solutions', async () => {
  const { app } = fixture()
  const response = await request(app).get(`/api/certificates/assessment/${course.id}`).expect(200)
  assert.equal(response.body.questions.length, 5)
  assert.ok(response.body.questions.every(question => !('answer' in question) && !('explanation' in question)))
})

test('issue persists signed evidence and public verification survives a new client', async () => {
  const { app, records } = fixture()
  const issued = await request(app).post('/api/certificates/issue').send(body).expect(201)
  const certificate = issued.body.certificate
  assert.equal(records.size, 1)
  assert.equal(certificate.score, 100)
  assert.equal(certificate.verificationUrl, `https://academy.example.org/certificates/${certificate.id}`)
  assert.equal(verifyCertificate(records.get(certificate.id), secret), true)
  assert.equal(verifyCertificate(records.get(certificate.id), 'another-test-key-that-has-enough-characters'), false)
  const verified = await request(app).get(`/api/certificates/${certificate.id}`).expect(200)
  assert.equal(verified.body.certificate.verified, true)
  assert.equal(verified.body.certificate.learnerName, body.learnerName)
  assert.equal('signature' in verified.body.certificate, false)
  assert.match(verified.headers['cache-control'], /no-store/)
})

test('tampering, revocation and unknown identifiers never verify', async () => {
  const { app, records } = fixture()
  const issued = await request(app).post('/api/certificates/issue').send(body).expect(201)
  const id = issued.body.certificate.id
  const saved = records.get(id)
  records.set(id, { ...saved, learnerName: 'Alterado' })
  await request(app).get(`/api/certificates/${id}`).expect(409)
  records.set(id, { ...saved, revokedAt: new Date() })
  await request(app).get(`/api/certificates/${id}`).expect(410)
  await request(app).get('/api/certificates/OSA-00000000-0000-0000-0000-000000000000').expect(404)
  await request(app).get('/api/certificates/LOCAL-example').expect(404)
})

test('name, consent, storage and production configuration fail closed', async () => {
  const { app } = fixture()
  await request(app).post('/api/certificates/issue').send({ ...body, learnerName: '' }).expect(400)
  await request(app).post('/api/certificates/issue').send({ ...body, publicConsent: false }).expect(400)
  const missingSecret = fixture({ getSecret: () => '' })
  await request(missingSecret.app).post('/api/certificates/issue').send(body).expect(503)
  const offline = fixture({ repository: { save: async () => { throw new Error('Database offline') } } })
  await request(offline.app).post('/api/certificates/issue').send(body).expect(503)
  for (const url of ['http://example.org', 'https://localhost', 'https://127.0.0.1', 'https://192.168.1.20', 'https://user:pass@example.org', 'javascript:alert(1)', 'https://example.org/#x', 'https://example.org/osint']) assert.equal(publicSiteUrl(url), null)
  assert.equal(publicSiteUrl('https://example.org/'), 'https://example.org')
})
