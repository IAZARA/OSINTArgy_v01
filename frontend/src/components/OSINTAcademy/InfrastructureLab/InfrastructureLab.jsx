import React, { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ClipboardCheck,
  FileText,
  Globe,
  HelpCircle,
  Lock,
  Mail,
  RotateCcw,
  Shield,
  Trophy,
  XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import './InfrastructureLab.css'

const severityLabels = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
  critical: 'Crítico'
}

const severityOrder = ['low', 'medium', 'high', 'critical']

const findings = [
  {
    id: 'dmarc-none',
    title: 'DMARC ausente',
    category: 'Email',
    icon: Mail,
    evidence: 'El dominio tiene SPF, pero no publica un registro DMARC en _dmarc.acme-latam.test.',
    impact: 'Aumenta el riesgo de spoofing y campañas de phishing que usen el dominio como remitente.',
    correctSeverity: 'high',
    points: 160,
    hint: 'Piensa en impacto reputacional y abuso de correo, no solo en disponibilidad del sitio.',
    recommendation: 'Publicar DMARC con monitoreo inicial p=none, revisar reportes y avanzar hacia quarantine o reject.'
  },
  {
    id: 'wildcard-cert',
    title: 'Certificado wildcard muy amplio',
    category: 'Certificados',
    icon: Lock,
    evidence: 'Certificate Transparency muestra *.acme-latam.test usado por apps internas y públicas.',
    impact: 'Complica segmentación, inventario y respuesta si una clave privada se expone.',
    correctSeverity: 'medium',
    points: 120,
    hint: 'No todo certificado wildcard es crítico; el riesgo depende de alcance y controles.',
    recommendation: 'Separar certificados por entorno, rotar claves y documentar propietarios por subdominio.'
  },
  {
    id: 'staging-open',
    title: 'Subdominio staging accesible',
    category: 'Subdominios',
    icon: Globe,
    evidence: 'staging.acme-latam.test responde públicamente y muestra una pantalla de autenticación de prueba.',
    impact: 'Puede filtrar nombres de tecnologías, rutas internas o endpoints no endurecidos.',
    correctSeverity: 'high',
    points: 170,
    hint: 'Un entorno de prueba público suele exponer más contexto que la aplicación principal.',
    recommendation: 'Restringir acceso por VPN o allowlist, agregar autenticación fuerte y revisar robots, logs y endpoints.'
  },
  {
    id: 'missing-hsts',
    title: 'HSTS no configurado',
    category: 'Headers',
    icon: Shield,
    evidence: 'La respuesta HTTPS no incluye Strict-Transport-Security.',
    impact: 'Deja margen para downgrade o navegación insegura en ciertos escenarios.',
    correctSeverity: 'medium',
    points: 110,
    hint: 'Es una mejora de hardening importante, pero rara vez supera a un asset expuesto.',
    recommendation: 'Agregar HSTS con max-age gradual, includeSubDomains cuando el inventario esté controlado.'
  },
  {
    id: 'public-doc-metadata',
    title: 'Documento público con metadatos internos',
    category: 'Documentos',
    icon: FileText,
    evidence: 'Un PDF público contiene autor interno, ruta de red y nombre de plantilla corporativa.',
    impact: 'Facilita enumeración de usuarios, convenciones internas y pretextos para ingeniería social.',
    correctSeverity: 'medium',
    points: 130,
    hint: 'No es explotación directa, pero sí aumenta la calidad de una campaña dirigida.',
    recommendation: 'Limpiar metadatos antes de publicar, revisar documentos históricos y definir checklist editorial.'
  }
]

const severityGuide = [
  {
    severity: 'critical',
    label: 'Crítico',
    description: 'Exposición explotable con impacto inmediato o datos sensibles accesibles.'
  },
  {
    severity: 'high',
    label: 'Alto',
    description: 'Riesgo claro para abuso, suplantación o acceso a entornos no pensados para internet.'
  },
  {
    severity: 'medium',
    label: 'Medio',
    description: 'Hardening incompleto o información que mejora el reconocimiento de un atacante.'
  },
  {
    severity: 'low',
    label: 'Bajo',
    description: 'Hallazgo informativo, higiene operativa o mejora de documentación.'
  }
]

const InfrastructureLab = () => {
  const navigate = useNavigate()
  const [activeFindingId, setActiveFindingId] = useState(findings[0].id)
  const [answers, setAnswers] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [showHint, setShowHint] = useState(false)

  const activeFinding = findings.find((finding) => finding.id === activeFindingId)

  const completedCount = Object.keys(answers).length
  const totalScore = useMemo(
    () => findings.reduce((score, finding) => {
      return answers[finding.id]?.isCorrect ? score + finding.points : score
    }, 0),
    [answers]
  )
  const maxScore = findings.reduce((score, finding) => score + finding.points, 0)
  const isComplete = completedCount === findings.length

  const handleSeveritySelect = (severity) => {
    const isCorrect = severity === activeFinding.correctSeverity
    const nextAnswers = {
      ...answers,
      [activeFinding.id]: {
        selectedSeverity: severity,
        isCorrect
      }
    }

    setAnswers(nextAnswers)
    setFeedback({
      type: isCorrect ? 'success' : 'error',
      title: isCorrect ? 'Clasificación correcta' : 'Clasificación para revisar',
      message: isCorrect
        ? `Sumaste ${activeFinding.points} puntos.`
        : `La severidad esperada era ${severityLabels[activeFinding.correctSeverity]}.`
    })

    const nextFinding = findings.find((finding) => !nextAnswers[finding.id])
    if (nextFinding) {
      window.setTimeout(() => {
        setActiveFindingId(nextFinding.id)
        setFeedback(null)
        setShowHint(false)
      }, 1400)
    }
  }

  const handleFindingSelect = (findingId) => {
    setActiveFindingId(findingId)
    setFeedback(null)
    setShowHint(false)
  }

  const resetLab = () => {
    setActiveFindingId(findings[0].id)
    setAnswers({})
    setFeedback(null)
    setShowHint(false)
  }

  const handleBack = () => {
    navigate('/academy', { state: { selectedAcademy: 'infrastructure' } })
  }

  return (
    <div className="infrastructure-lab">
      <header className="infra-lab-header">
        <button type="button" className="infra-back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          Volver a la Academia
        </button>
        <div className="infra-lab-title">
          <Shield size={36} />
          <div>
            <h1>Laboratorio de Auditoría Simulada</h1>
            <p>Clasifica hallazgos públicos de un dominio ficticio y arma un reporte defensivo.</p>
          </div>
        </div>
        <div className="infra-score">
          <Trophy size={18} />
          <span>{totalScore}/{maxScore}</span>
        </div>
      </header>

      <main className="infra-lab-grid">
        <section className="case-panel">
          <div className="case-header">
            <Globe size={22} />
            <div>
              <span>Dominio ficticio</span>
              <strong>acme-latam.test</strong>
            </div>
          </div>
          <div className="case-metrics">
            <div>
              <span>Hallazgos</span>
              <strong>{completedCount}/{findings.length}</strong>
            </div>
            <div>
              <span>Precisión</span>
              <strong>
                {completedCount === 0
                  ? '0%'
                  : `${Math.round((Object.values(answers).filter((answer) => answer.isCorrect).length / completedCount) * 100)}%`}
              </strong>
            </div>
          </div>

          <div className="finding-list">
            {findings.map((finding) => {
              const Icon = finding.icon
              const answer = answers[finding.id]
              return (
                <button
                  type="button"
                  key={finding.id}
                  className={`finding-list-item ${finding.id === activeFindingId ? 'active' : ''} ${answer ? 'answered' : ''} ${answer?.isCorrect ? 'correct' : ''} ${answer && !answer.isCorrect ? 'incorrect' : ''}`}
                  onClick={() => handleFindingSelect(finding.id)}
                >
                  <Icon size={18} />
                  <span>{finding.title}</span>
                  {answer?.isCorrect && <CheckCircle size={16} />}
                  {answer && !answer.isCorrect && <XCircle size={16} />}
                </button>
              )
            })}
          </div>
        </section>

        <section className="finding-panel">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFinding.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.24 }}
            >
              <div className="finding-heading">
                <div>
                  <span className="finding-category">{activeFinding.category}</span>
                  <h2>{activeFinding.title}</h2>
                </div>
                <span className="finding-points">{activeFinding.points} pts</span>
              </div>

              <div className="evidence-box">
                <h3>Evidencia</h3>
                <p>{activeFinding.evidence}</p>
              </div>

              <div className="impact-box">
                <h3>Impacto</h3>
                <p>{activeFinding.impact}</p>
              </div>

              <div className="severity-actions">
                {severityOrder.map((severity) => (
                  <button
                    type="button"
                    key={severity}
                    className={`severity-button ${severity}`}
                    onClick={() => handleSeveritySelect(severity)}
                    disabled={Boolean(answers[activeFinding.id])}
                  >
                    {severityLabels[severity]}
                  </button>
                ))}
              </div>

              <div className="finding-actions">
                <button type="button" className="hint-button" onClick={() => setShowHint(!showHint)}>
                  <HelpCircle size={16} />
                  {showHint ? 'Ocultar pista' : 'Ver pista'}
                </button>
              </div>

              <AnimatePresence>
                {showHint && (
                  <motion.div
                    className="hint-panel"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {activeFinding.hint}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    className={`lab-feedback ${feedback.type}`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                  >
                    {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                    <div>
                      <strong>{feedback.title}</strong>
                      <span>{feedback.message}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </section>

        <aside className="guide-panel">
          <h2>Guía de Severidad</h2>
          <div className="severity-guide">
            {severityGuide.map((item) => (
              <div key={item.severity} className={`guide-item ${item.severity}`}>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>

      {isComplete && (
        <section className="report-panel">
          <div className="report-heading">
            <ClipboardCheck size={28} />
            <div>
              <h2>Reporte defensivo</h2>
              <p>Resumen de hallazgos priorizados para remediación.</p>
            </div>
          </div>

          <div className="report-grid">
            {findings.map((finding) => {
              const answer = answers[finding.id]
              return (
                <div key={finding.id} className={`report-card ${finding.correctSeverity}`}>
                  <div className="report-card-header">
                    <strong>{finding.title}</strong>
                    <span>{severityLabels[finding.correctSeverity]}</span>
                  </div>
                  <p>{finding.recommendation}</p>
                  <small>
                    Tu clasificación: {severityLabels[answer.selectedSeverity]} · {answer.isCorrect ? 'correcta' : 'ajustada'}
                  </small>
                </div>
              )
            })}
          </div>

          <div className="report-actions">
            <button type="button" className="reset-button" onClick={resetLab}>
              <RotateCcw size={18} />
              Rehacer laboratorio
            </button>
          </div>
        </section>
      )}
    </div>
  )
}

export default InfrastructureLab
