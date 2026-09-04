import React, { useState } from 'react'
import { ArrowLeft, Award, BookOpen, CheckCircle, Lock } from 'lucide-react'
import { Link } from '@/lib/router'
import { ACADEMY_COURSES, ACADEMY_LESSON_CATALOG } from '../data/academyCatalog'
import { useAcademyProgress } from '../useAcademyProgress'
import assessments from '@/data/academy-assessments.json'
import { API_BASE_URL } from '@/utils/constants'
import { createLocalCertificate, gradeLocalAssessment, loadCertificates, saveCertificate } from '@/utils/certificates'
import CertificateCard from './CertificateCard'
import './Certificates.css'

export default function CertificateCenter() {
  const [certificates, setCertificates] = useState(loadCertificates)
  const { progress } = useAcademyProgress()
  const [activeCourse, setActiveCourse] = useState(null)
  const [learnerName, setLearnerName] = useState('')
  const [answers, setAnswers] = useState([])
  const [consent, setConsent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState(false)
  const serverMode = import.meta.env.VITE_CERTIFICATE_MODE === 'server'
  const lessonComplete = id => {
    const state = progress.modules?.[id]
    const lesson = ACADEMY_LESSON_CATALOG.find(item => item.id === id)
    return progress.version >= 2 && state?.completed === true && state.quizSubmitted === true && state.bestScore >= 80
      && lesson && Array.from({ length: lesson.slideCount }, (_, index) => index).every(index => state.viewedSlides?.includes(index))
  }
  const start = course => {
    setActiveCourse(assessments.find(item => item.id === course.id))
    setAnswers([]); setMessage(''); setFeedback(false); setConsent(false)
  }
  const submit = async event => {
    event.preventDefault()
    setBusy(true); setMessage(''); setFeedback(false)
    try {
      let certificate
      if (serverMode) {
        const response = await fetch(`${API_BASE_URL}/certificates/issue`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(12000),
          body: JSON.stringify({ courseId: activeCourse.id, learnerName, answers, publicConsent: consent }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message || 'No se pudo emitir el certificado.')
        certificate = data.certificate
      } else {
        const result = gradeLocalAssessment(activeCourse, answers)
        if (!result.passed) { setFeedback(true); throw new Error(`Resultado: ${result.score}%. Necesitás 80%. Repasá las explicaciones y volvé a intentar.`) }
        certificate = createLocalCertificate(activeCourse, learnerName, answers)
      }
      try { setCertificates(saveCertificate(certificate)) }
      catch { setCertificates(current => [certificate, ...current]); setMessage('Certificado generado. El navegador no permite guardarlo: descargalo antes de salir.') }
      setActiveCourse(null)
    } catch (error) {
      setMessage(error.name === 'TimeoutError' || error instanceof TypeError ? 'No se pudo conectar con el servicio de certificados. Revisá la conexión e intentá nuevamente.' : error.message)
    } finally { setBusy(false) }
  }
  return <div className="credentials-page">
    <header className="credentials-header"><Link to="/academy"><ArrowLeft size={18} /> Academia</Link><span>OSINTARGY / CREDENCIALES</span></header>
    <section className="credentials-intro"><div><p className="credential-eyebrow">Aprendé · evaluá · compartí</p><h1>Convertí lo aprendido<br />en un logro visible.</h1><p>Completá las lecciones de un trayecto y aprobá su evaluación final con al menos 80%.</p></div><Award size={80} strokeWidth={1} /></section>
    <p className="credentials-mode"><span className="credential-dot" />{serverMode ? 'Emisión pública: tu evaluación se corrige en el servidor. Tu nombre aparecerá en una página verificable.' : 'Modo local: tus constancias se guardan en este navegador y pueden descargarse. La verificación pública se habilitará cuando el sitio esté disponible.'}</p>
    <div role="status" className="credentials-message">{message}</div>
    {activeCourse ? <form className="credential-exam" onSubmit={submit}>
      <button type="button" onClick={() => { setActiveCourse(null); setMessage('') }} disabled={busy}><ArrowLeft size={16} /> Volver a los trayectos</button>
      <p className="credential-eyebrow">Evaluación final · {activeCourse.questions.length} preguntas</p><h2>{activeCourse.title}</h2>
      <label className="credential-name">Nombre que figurará en el certificado<input autoComplete="name" required minLength={2} maxLength={100} value={learnerName} onChange={event => setLearnerName(event.target.value)} placeholder="Tu nombre y apellido" disabled={busy} /></label>
      {activeCourse.questions.map((question, index) => <fieldset key={question.id} disabled={busy}><legend>{index + 1}. {question.prompt}</legend>{question.options.map((option, optionIndex) => <label key={option}><input type="radio" name={question.id} value={optionIndex} required checked={answers[index] === optionIndex} onChange={() => setAnswers(current => { const next = [...current]; next[index] = optionIndex; return next })} />{option}</label>)}{feedback && <p className="credential-explanation">{question.explanation}</p>}</fieldset>)}
      {serverMode && <label className="credential-consent"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)} />Acepto publicar mi nombre, trayecto, fecha y resultado en una página de verificación accesible mediante enlace.</label>}
      <button className="credential-primary" type="submit" disabled={busy}>{busy ? 'Evaluando…' : 'Evaluar y obtener certificado'}</button>
      <p className="credential-caption">Evaluación de conocimientos sin supervisión. El nombre es declarado por quien la realiza.</p>
    </form> : <section aria-label="Trayectos certificables" className="credential-tracks">{ACADEMY_COURSES.map(course => {
      const done = course.moduleIds.filter(lessonComplete).length
      const eligible = done === course.moduleIds.length
      return <article key={course.id}><div className="credential-track-status">{eligible ? <CheckCircle size={20} /> : <Lock size={20} />}<span>{done}/{course.moduleIds.length} lecciones aprobadas</span></div><h2>{course.title}</h2><progress max={course.moduleIds.length} value={done} aria-label={`Progreso de ${course.title}`} />{eligible ? <button className="credential-primary" onClick={() => start(course)}>Rendir evaluación <Award size={16} /></button> : <Link to="/academy" state={{ selectedAcademy: course.id }}><BookOpen size={16} /> Continuar aprendiendo</Link>}</article>
    })}</section>}
    <section className="credential-wallet"><div className="credential-wallet-heading"><h2>Mis certificados</h2><span>{certificates.length} {certificates.length === 1 ? 'credencial' : 'credenciales'}</span></div>{certificates.length ? certificates.map(certificate => <CertificateCard key={certificate.id} certificate={certificate} />) : <div className="credential-empty"><Award size={32} /><p>Tu próximo logro empieza con una lección.</p><span>Al aprobar la evaluación, vas a encontrar acá tu certificado y los datos para LinkedIn.</span></div>}</section>
  </div>
}
