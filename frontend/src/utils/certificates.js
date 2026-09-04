export const CERTIFICATES_KEY = 'osintargy:certificates:v1'
export const LINKEDIN_ADD_URL = 'https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME'

export function gradeLocalAssessment(assessment, answers) {
  if (!Array.isArray(answers) || answers.length !== assessment.questions.length || assessment.questions.some((question, index) =>
    !Number.isInteger(answers[index]) || answers[index] < 0 || answers[index] >= question.options.length)) {
    throw new Error('Respondé todas las preguntas antes de entregar.')
  }
  const score = Math.round(assessment.questions.filter((question, index) => question.answer === answers[index]).length / assessment.questions.length * 100)
  return { score, passed: score >= assessment.passingScore }
}

export function createLocalCertificate(assessment, learnerName, answers) {
  const name = learnerName.trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 100) throw new Error('Ingresá un nombre de entre 2 y 100 caracteres.')
  const result = gradeLocalAssessment(assessment, answers)
  if (!result.passed) throw new Error('Necesitás al menos 80% para aprobar.')
  return {
    id: `LOCAL-${crypto.randomUUID()}`, version: 1, learnerName: name,
    courseId: assessment.id, courseTitle: assessment.title, issuer: 'OSINTArgy',
    issuedAt: new Date().toISOString(), score: result.score, kind: 'local',
    verified: false, verificationUrl: null,
  }
}

export function loadCertificates(storage) {
  try {
    const target = storage ?? globalThis.localStorage
    const data = JSON.parse(target?.getItem(CERTIFICATES_KEY) || '[]')
    return Array.isArray(data) ? data.filter(item => item && typeof item.id === 'string'
      && /^(LOCAL|OSA)-[a-f0-9-]{36}$/.test(item.id)
      && typeof item.learnerName === 'string' && item.learnerName.length >= 2 && item.learnerName.length <= 100
      && typeof item.courseTitle === 'string' && item.courseTitle.length <= 200
      && typeof item.courseId === 'string' && typeof item.issuer === 'string' && item.issuer === 'OSINTArgy'
      && Number.isInteger(item.score) && item.score >= 80 && item.score <= 100
      && ['local', 'assessment'].includes(item.kind) && Number.isFinite(Date.parse(item.issuedAt))) : []
  } catch { return [] }
}

export function saveCertificate(certificate, storage = globalThis.localStorage) {
  const certificates = [certificate, ...loadCertificates(storage).filter(item => item.id !== certificate.id)]
  storage.setItem(CERTIFICATES_KEY, JSON.stringify(certificates))
  return certificates
}

export const certificateTitle = certificate => `${certificate.kind === 'local' ? 'Constancia de aprendizaje' : 'Evaluación aprobada'}: ${certificate.courseTitle}`

export function safeVerificationUrl(certificate) {
  if (certificate.kind !== 'assessment') return null
  try {
    const url = new URL(certificate.verificationUrl)
    if (url.protocol !== 'https:' || url.username || url.password || !url.hostname.includes('.')
      || url.hostname.endsWith('.local') || url.hostname.endsWith('.localhost') || /^[\d.]+$/.test(url.hostname)) return null
    return url.href
  } catch { return null }
}

export const linkedinFields = certificate => [
  ['Nombre', certificateTitle(certificate)], ['Organización emisora', certificate.issuer],
  ['Fecha de expedición', new Date(certificate.issuedAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric', timeZone: 'UTC' })],
  ['ID de la credencial', certificate.id], ['URL de la credencial', safeVerificationUrl(certificate) || 'Sin URL pública; dejar vacío'],
]

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])

export function certificateDocument(certificate) {
  const local = certificate.kind === 'local'
  const date = new Date(certificate.issuedAt).toLocaleDateString('es-AR', { dateStyle: 'long', timeZone: 'UTC' })
  const url = safeVerificationUrl(certificate)
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(certificateTitle(certificate))}</title><style>
  *{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#12283d;font:16px/1.6 system-ui,sans-serif;padding:32px}article{max-width:1000px;margin:auto;background:white;border:2px solid #24465d;padding:60px;position:relative}article:before{content:"";display:block;width:70px;height:6px;background:#147d96;margin-bottom:36px}.brand{font-weight:800;letter-spacing:.2em}.eyebrow{margin-top:40px;color:#426176;text-transform:uppercase;letter-spacing:.12em}h1{font:42px/1.15 Georgia,serif;margin:20px 0}h2{font:32px/1.2 Georgia,serif}small{display:block;color:#426176}footer{border-top:1px solid #ccd8e0;margin-top:40px;padding-top:18px;font-size:12px;overflow-wrap:anywhere}a{color:#12647a}button{display:block;margin:20px auto;padding:12px 20px;cursor:pointer}@media(max-width:600px){body{padding:12px}article{padding:26px}h1{font-size:32px}}@media print{@page{size:A4 landscape;margin:12mm}body{padding:0;background:white}article{max-width:none;padding:12mm;break-inside:avoid}button{display:none}h1{font-size:32px}.eyebrow{margin-top:20px}footer{margin-top:24px}}
  </style><article><div class="brand">OSINTARGY / ACADEMIA</div><p class="eyebrow">${local ? 'Constancia de aprendizaje local' : 'Certificado de evaluación aprobada'}</p><h1>${escapeHtml(certificate.learnerName)}</h1><p>Completó la evaluación de conocimientos de</p><h2>${escapeHtml(certificate.courseTitle)}</h2><p>Resultado: <strong>${escapeHtml(certificate.score)}%</strong> · Aprobación: 80%</p><p>Emitido el ${escapeHtml(date)}</p><small>${local ? 'Constancia generada en el navegador a partir de progreso y evaluación locales. No tiene verificación pública.' : 'Evaluación corregida por OSINTArgy. La firma y la vigencia se consultan en la URL de verificación.'} Formación no reglada; no acredita identidad ni habilitación profesional.</small><footer>Emisor: OSINTArgy<br>ID: ${escapeHtml(certificate.id)}${url ? `<br><a href="${escapeHtml(url)}">Verificar credencial: ${escapeHtml(url)}</a>` : ''}</footer></article><button onclick="window.print()">Imprimir / guardar como PDF</button></html>`
}

export function downloadCertificate(certificate) {
  const blob = new Blob([certificateDocument(certificate)], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `OSINTArgy-${certificate.courseId}-${certificate.id}.html`
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
