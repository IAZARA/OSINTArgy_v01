import React, { useState } from 'react'
import { Award, Copy, Download, ExternalLink, Linkedin } from 'lucide-react'
import { certificateTitle, downloadCertificate, linkedinFields, LINKEDIN_ADD_URL, safeVerificationUrl } from '@/utils/certificates'

export default function CertificateCard({ certificate, publicView = false }) {
  const [copyStatus, setCopyStatus] = useState('')
  const [showLinkedin, setShowLinkedin] = useState(false)
  const url = safeVerificationUrl(certificate)
  const copy = async value => {
    try { await navigator.clipboard.writeText(value); setCopyStatus('Copiado al portapapeles.') }
    catch { setCopyStatus('No se pudo copiar. Podés seleccionar el texto y copiarlo manualmente.') }
  }
  return <article className="credential-card">
    <div className="credential-card__seal"><Award size={36} /><span>OSINTARGY / ACADEMIA</span></div>
    <p className="credential-eyebrow">{certificate.kind === 'local' ? 'Constancia local' : 'Evaluación aprobada'}</p>
    <h2>{certificate.learnerName}</h2>
    <p className="credential-course">{certificate.courseTitle}</p>
    <dl className="credential-facts"><div><dt>Resultado</dt><dd>{certificate.score}%</dd></div><div><dt>Expedición</dt><dd>{new Date(certificate.issuedAt).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</dd></div><div><dt>Emisor</dt><dd>OSINTArgy</dd></div></dl>
    <p className="credential-id">{certificate.id}</p>
    <p className="credential-caption">{certificate.kind === 'local' ? 'Generada con progreso y evaluación locales. No tiene verificación pública.' : 'Evaluación corregida por el servidor. Consultá la verificación para conocer su vigencia.'} Formación no reglada; no acredita identidad ni habilitación profesional.</p>
    <div className="credential-actions">
      <button type="button" onClick={() => downloadCertificate(certificate)}><Download size={17} /> Descargar certificado</button>
      {!publicView && <button type="button" className="credential-primary" aria-expanded={showLinkedin} onClick={() => setShowLinkedin(!showLinkedin)}><Linkedin size={17} /> Agregar a LinkedIn</button>}
      {url && !publicView && <a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={17} /> Verificar</a>}
    </div>
    <p className="credential-caption">La descarga abre un documento imprimible: elegí “Imprimir / guardar como PDF”.</p>
    {showLinkedin && <section className="credential-linkedin" aria-label="Datos para LinkedIn">
      <h3>Tu logro en LinkedIn</h3>
      <p>Abrí el formulario y copiá estos datos. LinkedIn puede pedir que los ingreses manualmente.</p>
      <dl>{linkedinFields(certificate).map(([label, value]) => <div key={label}><dt>{label}</dt><dd><span>{value}</span>{(label !== 'URL de la credencial' || url) && <button type="button" onClick={() => copy(value)} aria-label={`Copiar ${label.toLowerCase()}`}><Copy size={15} /></button>}</dd></div>)}</dl>
      <a className="credential-primary" href={LINKEDIN_ADD_URL} target="_blank" rel="noopener noreferrer"><Linkedin size={17} /> Abrir LinkedIn <ExternalLink size={15} /></a>
      <p className="credential-caption">La publicación se confirma en tu cuenta de LinkedIn. No se agrega automáticamente.</p>
    </section>}
    <p role="status" className="credential-caption">{copyStatus}</p>
  </article>
}
