import express from 'express'
import rateLimit from 'express-rate-limit'
import Certificate from '../models/Certificate.js'
import {
  assessments, gradeAssessment, publicSiteUrl, createSignedCertificate,
  verifyCertificate, certificateResponse,
} from '../services/certificates.js'

export function createCertificateRouter({
  repository = {
    save: certificate => Certificate.create(certificate),
    find: id => Certificate.findOne({ id }).lean(),
  },
  getSecret = () => process.env.CERTIFICATE_SIGNING_SECRET,
  getPublicUrl = () => process.env.CERTIFICATE_PUBLIC_URL,
} = {}) {
  const router = express.Router()
  router.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    res.set('X-Robots-Tag', 'noindex, nofollow')
    next()
  })
  const config = () => ({ secret: getSecret(), baseUrl: publicSiteUrl(getPublicUrl()) })
  const ready = ({ secret, baseUrl }) => typeof secret === 'string' && secret.length >= 32 && baseUrl

  router.get('/assessment/:courseId', (req, res) => {
    const course = assessments.find(item => item.id === req.params.courseId)
    if (!course) return res.status(404).json({ message: 'Trayecto desconocido.' })
    return res.json({ ...course, questions: course.questions.map(({ answer, explanation, ...question }) => question) })
  })

  router.post('/issue', rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
    message: { message: 'Alcanzaste el límite de intentos. Volvé a intentar en una hora.' } }), async (req, res) => {
    const settings = config()
    if (!ready(settings)) return res.status(503).json({ message: 'La emisión pública todavía no está configurada.' })
    const learnerName = typeof req.body?.learnerName === 'string' ? req.body.learnerName.trim().replace(/\s+/g, ' ') : ''
    if (learnerName.length < 2 || learnerName.length > 100 || /[\x00-\x1f\x7f]/.test(learnerName) || req.body?.publicConsent !== true) {
      return res.status(400).json({ message: 'Ingresá tu nombre y aceptá que aparezca en la verificación pública.' })
    }
    let result
    try { result = gradeAssessment(req.body.courseId, req.body.answers) }
    catch (error) { return res.status(400).json({ message: error.message }) }
    if (!result.passed) return res.status(422).json({ message: 'Necesitás al menos 80% para aprobar.', score: result.score })
    try {
      const certificate = createSignedCertificate({ course: result.course, score: result.score, learnerName }, settings.secret)
      await repository.save(certificate)
      return res.status(201).json({ certificate: certificateResponse(certificate, settings.baseUrl) })
    } catch {
      return res.status(503).json({ message: 'No se pudo guardar el certificado. Intentá nuevamente más tarde.' })
    }
  })

  router.get('/:certificateId', async (req, res) => {
    if (!/^OSA-[a-f0-9-]{36}$/.test(req.params.certificateId)) return res.status(404).json({ message: 'Certificado no encontrado.' })
    const settings = config()
    if (!ready(settings)) return res.status(503).json({ message: 'La verificación pública no está disponible.' })
    try {
      const certificate = await repository.find(req.params.certificateId)
      if (!certificate) return res.status(404).json({ message: 'Certificado no encontrado.' })
      if (certificate.revokedAt) return res.status(410).json({ message: 'Este certificado fue revocado.' })
      if (!verifyCertificate(certificate, settings.secret)) return res.status(409).json({ message: 'No se pudo validar la integridad del certificado.' })
      return res.json({ certificate: certificateResponse(certificate, settings.baseUrl) })
    } catch {
      return res.status(503).json({ message: 'No se pudo consultar el certificado. Intentá más tarde.' })
    }
  })
  return router
}

export default createCertificateRouter()
