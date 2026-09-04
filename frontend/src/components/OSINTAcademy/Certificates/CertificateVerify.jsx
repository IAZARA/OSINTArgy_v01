import React, { useEffect, useState } from 'react'
import { Link, useParams } from '@/lib/router'
import { ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react'
import { API_BASE_URL } from '@/utils/constants'
import CertificateCard from './CertificateCard'
import './Certificates.css'

export default function CertificateVerify() {
  const { certificateId } = useParams()
  const [state, setState] = useState({ loading: true })
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)
    let active = true
    setState({ loading: true })
    const load = async () => {
      try {
        if (!/^OSA-[a-f0-9-]{36}$/.test(certificateId)) { setState({ error: 'Certificado no encontrado.' }); return }
        const response = await fetch(`${API_BASE_URL}/certificates/${encodeURIComponent(certificateId)}`, { signal: controller.signal })
        const data = await response.json()
        if (!active) return
        if (!response.ok) setState({ error: data.message || 'No se pudo verificar la credencial.', retry: response.status >= 500 })
        else if (data.certificate?.verified === true) setState({ certificate: data.certificate })
        else setState({ error: 'La respuesta no acredita una verificación válida.' })
      } catch { if (active) setState({ error: 'El servicio de verificación no está disponible. No pudimos comprobar esta credencial.', retry: true }) }
      finally { clearTimeout(timeout) }
    }
    load()
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [certificateId, attempt])
  return <div className="credentials-page credential-public"><header className="credentials-header"><Link to="/academy"><ArrowLeft size={18} /> Academia</Link><span>OSINTARGY / VERIFICACIÓN</span></header><h1>Verificar una credencial</h1>{state.loading ? <p role="status">Consultando registro y firma…</p> : state.error ? <section className="credential-verify-status" role="alert"><ShieldAlert size={30} /><h2>{state.error}</h2>{state.retry && <button onClick={() => setAttempt(value => value + 1)}>Reintentar</button>}</section> : <><div className="credential-verify-status credential-verified"><CheckCircle size={25} /><div><strong>Certificado válido</strong><p>Registro encontrado, firma íntegra y sin revocación.</p></div></div><CertificateCard certificate={state.certificate} publicView /></>}</div>
}
