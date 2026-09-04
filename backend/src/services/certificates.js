import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const assessments = JSON.parse(readFileSync(new URL('../data/academy-assessments.json', import.meta.url), 'utf8'))
export const PASS_SCORE = 80

export function publicSiteUrl(value) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/'
      || !host.includes('.') || host.endsWith('.localhost') || host.endsWith('.local')
      || /^[\d.]+$/.test(host) || host.includes(':')) return null
    return url.href.replace(/\/$/, '')
  } catch { return null }
}

export function gradeAssessment(courseId, answers) {
  const course = assessments.find(item => item.id === courseId)
  if (!course) throw new Error('Trayecto desconocido.')
  if (!Array.isArray(answers) || answers.length !== course.questions.length
    || answers.some((answer, index) => !Number.isInteger(answer) || answer < 0 || answer >= course.questions[index].options.length)) {
    throw new Error('Respondé todas las preguntas de la evaluación.')
  }
  const correct = course.questions.reduce((count, question, index) => count + Number(answers[index] === question.answer), 0)
  const score = Math.round(correct / course.questions.length * 100)
  return { course, score, passed: score >= PASS_SCORE }
}

const signedFields = certificate => ({
  id: certificate.id, version: certificate.version, learnerName: certificate.learnerName,
  courseId: certificate.courseId, courseTitle: certificate.courseTitle, issuer: certificate.issuer,
  issuedAt: certificate.issuedAt, score: certificate.score, kind: certificate.kind,
})

export function signCertificate(certificate, secret) {
  if (typeof secret !== 'string' || secret.length < 32) throw new Error('Falta configurar la clave de certificados.')
  return createHmac('sha256', secret).update(JSON.stringify(signedFields(certificate))).digest('hex')
}

export function verifyCertificate(certificate, secret) {
  try {
    if (!certificate || !/^[a-f0-9]{64}$/.test(certificate.signature)) return false
    const expected = Buffer.from(signCertificate(certificate, secret), 'hex')
    return timingSafeEqual(expected, Buffer.from(certificate.signature, 'hex'))
  } catch { return false }
}

export function createSignedCertificate({ course, learnerName, score }, secret) {
  const certificate = {
    id: `OSA-${randomUUID()}`, version: 1, learnerName, courseId: course.id,
    courseTitle: course.title, issuer: 'OSINTArgy', issuedAt: new Date().toISOString(),
    score, kind: 'assessment',
  }
  return { ...certificate, signature: signCertificate(certificate, secret) }
}

export const certificateResponse = (certificate, baseUrl) => ({
  ...signedFields(certificate),
  verificationUrl: `${baseUrl}/certificates/${certificate.id}`,
  verified: true,
})
