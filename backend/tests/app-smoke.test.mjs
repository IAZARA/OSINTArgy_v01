import assert from 'node:assert/strict'
import test from 'node:test'
import request from 'supertest'

process.env.NODE_ENV = 'test'
process.env.JWT_SECRET = 'test-only-secret-with-more-than-32-characters'
process.env.FRONTEND_URL = 'http://localhost:5173'

const { default: app } = await import('../src/app.js')

test('health endpoint responds without requiring MongoDB', async () => {
  const response = await request(app)
    .get('/api/health')
    .expect(200)

  assert.equal(response.body.status, 'OK')
  assert.equal(response.body.environment, 'test')
})

test('root endpoint exposes API metadata', async () => {
  const response = await request(app)
    .get('/')
    .expect(200)

  assert.equal(response.body.message, 'OSINTArgy API')
  assert.equal(response.body.version, '1.0.0')
})

test('tools search validates short queries before database access', async () => {
  const response = await request(app)
    .get('/api/tools/search?q=a')
    .expect(400)

  assert.equal(response.body.success, false)
  assert.match(response.body.message, /al menos 2 caracteres/)
})
