import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useParams, useNavigate } from '@/lib/router'
import DOMPurify from 'dompurify'
import { corporateLessons } from '../data/corporateAcademy'
import { markAcademyModuleCompleted } from '@/utils/academyProgress'
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Play,
  Search,
  Globe,
  Shield,
  User,
  Eye,
  Target,
  Mail,
  Server,
  Lock,
  Database,
  AlertTriangle
} from 'lucide-react'
import './LessonViewer.css'
import { useAcademyProgress } from '../useAcademyProgress'

const LessonViewer = () => {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const {
    progress: academyProgress,
    visitSlide,
    recordQuiz,
    completeModule
  } = useAcademyProgress()
  const [currentSlide, setCurrentSlide] = useState(() => (
    academyProgress.modules[lessonId]?.lastSlide || 0
  ))
  const [quizResults, setQuizResults] = useState({})
  const [showQuizResults, setShowQuizResults] = useState(false)
  const [revealedItems, setRevealedItems] = useState([])

  // Contenido de los módulos OSINT - Nueva estructura de 5 módulos
  const lessons = {
    ...corporateLessons,
    modulo1: {
      title: "Módulo 1: Introducción a OSINT",
      description: "Fundamentos de la inteligencia de fuentes abiertas",
      totalSlides: 7, // 6 slides educativas + 1 autoevaluación
      slides: [
        {
          id: 1,
          title: "¿Qué es OSINT?",
          content: `
            <h2>Open Source Intelligence</h2>
            <p><strong>OSINT</strong> significa <em>Open Source Intelligence</em> o Inteligencia de Fuentes Abiertas.</p>
            <p>Es la disciplina que se encarga de <strong>recopilar, analizar y utilizar información</strong> que está disponible públicamente para obtener conocimiento útil.</p>
            <div class="highlight-box">
              <p><strong>Punto clave:</strong> OSINT trabaja con fuentes abiertas y accesos autorizados; no habilita a evadir controles ni acceder a información privada.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Search, label: 'Búsqueda' },
              { icon: Eye, label: 'Observación' },
              { icon: Globe, label: 'Fuentes Públicas' },
              { icon: BookOpen, label: 'Análisis' }
            ]
          }
        },
        {
          id: 2,
          title: "Fuentes de Información OSINT",
          content: `
            <h2>¿Dónde encontramos información OSINT?</h2>
            <p>Las fuentes OSINT abarcan todo tipo de información disponible públicamente:</p>
            <ul>
              <li><strong>🌐 Internet:</strong> Sitios web, blogs, foros, archivos públicos</li>
              <li><strong>📱 Redes Sociales:</strong> Facebook, Twitter, Instagram, LinkedIn, TikTok</li>
              <li><strong>📰 Medios de Comunicación:</strong> Periódicos, revistas, noticias online</li>
              <li><strong>📚 Fuentes Académicas:</strong> Papers, investigaciones, tesis públicas</li>
              <li><strong>🏛️ Registros Oficiales:</strong> Documentos gubernamentales, registros públicos</li>
              <li><strong>📊 Bases de Datos Públicas:</strong> Censo, empresas, dominios</li>
            </ul>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Internet General', percentage: 35 },
              { label: 'Redes Sociales', percentage: 30 },
              { label: 'Medios', percentage: 20 },
              { label: 'Registros Oficiales', percentage: 15 }
            ]
          }
        },
        {
          id: 3,
          title: "Aplicaciones Profesionales de OSINT",
          content: `
            <h2>¿Quién usa OSINT y para qué?</h2>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🔒 Ciberseguridad</h3>
                <p>Detección de amenazas, análisis de malware, investigación de incidentes</p>
              </div>
              <div class="app-card">
                <h3>📰 Periodismo</h3>
                <p>Verificación de noticias, investigación de fuentes, fact-checking</p>
              </div>
              <div class="app-card">
                <h3>🏢 Inteligencia Empresarial</h3>
                <p>Análisis de competencia, due diligence, investigación de mercado</p>
              </div>
              <div class="app-card">
                <h3>⚖️ Investigación Legal</h3>
                <p>Búsqueda de evidencias, localización de testigos, verificación de hechos</p>
              </div>
              <div class="app-card">
                <h3>🛡️ Seguridad Nacional</h3>
                <p>Monitoreo de amenazas, análisis geopolítico, contrainteligencia</p>
              </div>
              <div class="app-card">
                <h3>🕵️ Investigación Privada</h3>
                <p>Localización de personas, verificación de antecedentes, fraudes</p>
              </div>
            </div>
          `,
          interactive: {
            type: 'click_reveal',
            items: [
              { trigger: 'Ciberseguridad', content: 'Los analistas OSINT detectan campañas de phishing, perfiles falsos, infrastructure maliciosa y amenazas emergentes' },
              { trigger: 'Periodismo', content: 'Los periodistas verifican fuentes, investigan historias complejas y realizan fact-checking de información viral' },
              { trigger: 'Empresarial', content: 'Las empresas analizan competencia, realizan due diligence de socios y estudian tendencias de mercado' },
              { trigger: 'Legal', content: 'Los abogados localizan testigos, verifican testimonios y buscan evidencias digitales para casos legales' }
            ]
          }
        },
        {
          id: 4,
          title: "Ciclo de Vida de la Investigación OSINT",
          content: `
            <h2>Proceso Sistemático de Investigación</h2>
            <p>Una metodología estructurada mejora la trazabilidad, reduce errores y hace que los hallazgos puedan verificarse:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Definir Requisitos</h3>
                <p>¿Qué información específica necesitamos? ¿Para qué propósito?</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Planificar Fuentes</h3>
                <p>¿Dónde es más probable encontrar la información? ¿Qué herramientas usar?</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Recopilar Datos</h3>
                <p>Búsqueda sistemática, captura de evidencias, documentación</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Procesar y Analizar</h3>
                <p>Filtrar, correlacionar, verificar credibilidad de la información</p>
              </div>
              <div class="step">
                <span class="step-number">5</span>
                <h3>Producir Inteligencia</h3>
                <p>Crear informes accionables, conclusiones basadas en evidencia</p>
              </div>
            </div>
          `,
          interactive: {
            type: 'methodology_flow',
            steps: 5
          }
        },
        {
          id: 5,
          title: "Consideraciones Éticas y Legales",
          content: `
            <h2>OSINT Responsable</h2>
            <p>Es fundamental practicar OSINT de manera ética y legal:</p>
            <div class="ethics-rules">
              <div class="rule-item good">
                <h3>✅ Principios Fundamentales</h3>
                <ul>
                  <li>Usar fuentes abiertas y accesos expresamente autorizados</li>
                  <li>Respetar la privacidad de las personas</li>
                  <li>Verificar múltiples fuentes antes de concluir</li>
                  <li>Documentar fuentes y métodos utilizados</li>
                  <li>Cumplir con las leyes locales e internacionales</li>
                  <li>Mantener objetividad y evitar sesgos</li>
                </ul>
              </div>
              <div class="rule-item bad">
                <h3>❌ Líneas Rojas - NUNCA</h3>
                <ul>
                  <li>Acceder a cuentas privadas o sistemas protegidos</li>
                  <li>Usar ingeniería social o engaños</li>
                  <li>Acosar, intimidar o amenazar a personas</li>
                  <li>Divulgar información personal sin consentimiento</li>
                  <li>Manipular o fabricar evidencias</li>
                  <li>Violar términos de servicio de plataformas</li>
                </ul>
              </div>
            </div>
          `,
          interactive: {
            type: 'ethics_quiz',
            questions: [
              {
                question: "¿Qué condición vuelve responsable el análisis de un perfil público?",
                correct: "Tener un propósito legítimo, minimizar el daño y respetar la ley",
                options: ["Que el perfil aparezca en Google", "Tener un propósito legítimo, minimizar el daño y respetar la ley", "Guardar todo por si resulta útil"]
              }
            ]
          }
        },
        {
          id: 6,
          title: "Herramientas Básicas para Empezar",
          content: `
            <h2>Tu Kit de Herramientas OSINT Inicial</h2>
            <p>Estas herramientas gratuitas te permitirán comenzar inmediatamente:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🔍 Google Search</strong>
                <p>Motor de búsqueda de amplio alcance con operadores avanzados</p>
              </div>
              <div class="tool-item">
                <strong>🖼️ Google Images</strong>
                <p>Búsqueda reversa de imágenes para verificación</p>
              </div>
              <div class="tool-item">
                <strong>🗺️ Google Maps/Earth</strong>
                <p>Geolocalización, Street View, imágenes satelitales</p>
              </div>
              <div class="tool-item">
                <strong>🌐 Motores Alternativos</strong>
                <p>DuckDuckGo, Bing, Yandex para diferentes perspectivas</p>
              </div>
              <div class="tool-item">
                <strong>📱 Búsquedas Nativas</strong>
                <p>Usar funciones de búsqueda integradas en redes sociales</p>
              </div>
              <div class="tool-item">
                <strong>🔧 Mi Generador de Dorks</strong>
                <p>Crea consultas avanzadas automáticamente con interfaz visual</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>💡 <strong>Consejo:</strong> Domina las herramientas básicas antes de avanzar a las especializadas</p>
            </div>
          `,
          interactive: {
            type: 'tool_demo',
            tools: ['google', 'images', 'maps', 'social']
          }
        },
        {
          id: 7,
          title: "Autoevaluación - Módulo 1",
          content: `
            <h2>🎯 Evalúa tu Conocimiento</h2>
            <p>Responde estas preguntas para verificar tu comprensión del módulo:</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué significa OSINT?",
                options: ["Open Source Intelligence", "Online Security Intelligence", "Operational Systems Intelligence"],
                correct: 0,
                explanation: "OSINT significa Open Source Intelligence o Inteligencia de Fuentes Abiertas."
              },
              {
                question: "¿Cuál es una característica fundamental de OSINT?",
                options: ["Requiere vulnerar sistemas", "Trabaja con fuentes abiertas y accesos autorizados", "Necesita acceso privilegiado"],
                correct: 1,
                explanation: "OSINT trabaja con información abierta o legítimamente accesible, sin evadir controles de acceso."
              },
              {
                question: "¿Cuál es el primer paso en una investigación OSINT?",
                options: ["Recopilar todos los datos posibles", "Definir qué información necesitamos", "Elegir las herramientas a usar"],
                correct: 1,
                explanation: "Siempre debemos comenzar definiendo claramente qué información específica necesitamos."
              },
              {
                question: "¿Qué criterio debe aplicarse al analizar un perfil público?",
                options: ["Recolectar todo porque es público", "Propósito legítimo, minimización y respeto por la ley", "Publicar los datos sin contexto"],
                correct: 1,
                explanation: "Que un dato sea público no elimina la obligación de justificar el propósito, reducir daños y respetar normas y términos aplicables."
              },
              {
                question: "¿Qué hace reproducible un hallazgo OSINT?",
                options: ["Confiar en la memoria", "Documentar fuente, fecha, contexto y método", "Guardar sólo la conclusión"],
                correct: 1,
                explanation: "Registrar fuente, fecha, contexto y método permite que otra persona revise y reproduzca el hallazgo."
              }
            ]
          }
        }
      ]
    },
    modulo2: {
      title: "Módulo 2: Google Dorks y Búsqueda Avanzada",
      description: "Domina Google Dorks con nuestro generador automático de consultas",
      totalSlides: 7,
      slides: [
        {
          id: 1,
          title: "Google: Más que una Búsqueda Simple",
          content: `
            <h2>Consultas con menos ruido</h2>
            <p>Un buscador indexa una parte enorme de la web pública, pero una consulta amplia suele mezclar resultados relevantes, duplicados y contenido fuera de contexto.</p>
            <p>Los operadores permiten delimitar la fuente, el formato, las palabras exactas y el período antes de evaluar un resultado.</p>
            <div class="highlight-box">
              <p><strong>Principio práctico:</strong> formula una hipótesis, limita la consulta y registra exactamente qué buscaste.</p>
            </div>
            <ul>
              <li><strong>Consultas precisas:</strong> reduce ambigüedad con frases y exclusiones</li>
              <li><strong>Filtros avanzados:</strong> limita por archivo, fecha o sitio</li>
              <li><strong>Google Dorks:</strong> combina operadores sobre contenido públicamente indexado</li>
              <li><strong>Trazabilidad:</strong> conserva consulta, fecha y resultado relevante</li>
            </ul>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Search, label: 'Precisión' },
              { icon: Target, label: 'Enfoque' },
              { icon: Globe, label: 'Alcance' },
              { icon: BookOpen, label: 'Profundidad' }
            ]
          }
        },
        {
          id: 2,
          title: "Operadores Básicos de Búsqueda",
          content: `
            <h2>Fundamentos de Búsqueda Avanzada</h2>
            <p>Estos operadores básicos transformarán inmediatamente tus búsquedas:</p>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>"frase exacta"</code>
                <p>Busca la frase exacta entre comillas</p>
              </div>
              <div class="dork-example">
                <code>palabra1 OR palabra2</code>
                <p>Busca cualquiera de las dos palabras</p>
              </div>
              <div class="dork-example">
                <code>palabra1 -palabra2</code>
                <p>Incluye palabra1 pero excluye palabra2</p>
              </div>
              <div class="dork-example">
                <code>palabra*</code>
                <p>Wildcard: completa automáticamente la palabra</p>
              </div>
              <div class="dork-example">
                <code>palabra1..palabra2</code>
                <p>Busca rangos de números entre dos valores</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Ejemplo práctico:</strong> "ciberseguridad 2026" -curso busca la frase y excluye resultados centrados en cursos.</p>
            </div>
          `,
          interactive: {
            type: 'dork_builder',
            examples: [
              '"data breach" 2026 -blog',
              'phishing OR malware site:gov',
              'cybersecurity budget 2025..2026'
            ]
          }
        },
        {
          id: 3,
          title: "Google Dorks Avanzados",
          content: `
            <h2>Operadores Especializados</h2>
            <p>Estos operadores te dan acceso a información específica y poderosa:</p>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>site:ejemplo.com</code>
                <p>Busca solo dentro del sitio especificado</p>
              </div>
              <div class="dork-example">
                <code>filetype:pdf</code>
                <p>Busca solo archivos del tipo especificado</p>
              </div>
              <div class="dork-example">
                <code>intitle:"informe anual"</code>
                <p>Busca páginas con esas palabras en el título</p>
              </div>
              <div class="dork-example">
                <code>inurl:login</code>
                <p>Busca páginas con esa palabra en la URL</p>
              </div>
              <div class="dork-example">
                <code>before:2026-01-01</code>
                <p>Limita resultados anteriores a una fecha</p>
              </div>
              <div class="dork-example">
                <code>related:ejemplo.com</code>
                <p>Encuentra sitios similares al especificado</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>⚠️ <strong>Importante:</strong> Usa estos operadores de forma ética y respetando los términos de servicio</p>
            </div>
          `,
          interactive: {
            type: 'dork_builder',
            examples: [
              'site:argentina.gob.ar filetype:pdf "presupuesto"',
              'intitle:"informe anual" filetype:pdf',
              'site:who.int inurl:publications'
            ]
          }
        },
        {
          id: 4,
          title: "Búsqueda de Documentos y Archivos",
          content: `
            <h2>Encontrar Información en Documentos</h2>
            <p>Los documentos públicos contienen información valiosa para investigaciones:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>📄 PDFs</strong>
                <p>Reportes, manuales, documentos oficiales</p>
                <code>filetype:pdf "informe anual 2023"</code>
              </div>
              <div class="tool-item">
                <strong>📊 Excel/CSV</strong>
                <p>Datos, listas, bases de datos públicas</p>
                <code>filetype:xlsx "lista empleados"</code>
              </div>
              <div class="tool-item">
                <strong>📝 Word</strong>
                <p>Documentos, propuestas, contratos</p>
                <code>filetype:docx "contrato" site:gov</code>
              </div>
              <div class="tool-item">
                <strong>📋 PowerPoint</strong>
                <p>Presentaciones, conferencias, entrenamientos</p>
                <code>filetype:pptx "cybersecurity training"</code>
              </div>
              <div class="tool-item">
                <strong>💾 Archivos de Configuración</strong>
                <p>Archivos de sistema, configuraciones</p>
                <code>filetype:conf OR filetype:cfg</code>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Ejemplo seguro:</strong> combina operadores sobre fuentes públicas: site:argentina.gob.ar filetype:pdf "informe anual"</p>
            </div>
          `,
          interactive: {
            type: 'file_search_demo',
            examples: ['pdf', 'xlsx', 'docx', 'pptx', 'txt']
          }
        },
        {
          id: 5,
          title: "Búsquedas por Fecha y Tiempo",
          content: `
            <h2>Investigación Temporal</h2>
            <p>El factor tiempo es crucial en investigaciones OSINT:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Herramientas de Fecha</h3>
                <p>Ir a Herramientas → Cualquier fecha → Personalizado</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Operadores Temporales</h3>
                <p>Usar rangos: after:2025-01-01 before:2026-01-01</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Archivo Histórico</h3>
                <p>Consultar Wayback Machine u otro archivo web y registrar la fecha de captura</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>after:2026-06-01 before:2026-07-01</code>
                <p>Busca contenido de junio de 2026</p>
              </div>
              <div class="dork-example">
                <code>"data breach" after:2026-01-01</code>
                <p>Reportes públicos de incidentes publicados desde 2026</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>📅 <strong>Caso de uso:</strong> Investigar la evolución de un tema específico a lo largo del tiempo</p>
            </div>
          `,
          interactive: {
            type: 'temporal_search',
            examples: ['recent', 'historical', 'trends']
          }
        },
        {
          id: 6,
          title: "Mi Generador de Google Dorks",
          content: `
            <h2>Herramienta Avanzada de Generación de Queries</h2>
            <p>Mi aplicación incluye un <strong>generador de Google Dorks</strong> profesional que automatiza la creación de consultas complejas:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🎯 Generación Automática</strong>
                <p>Crea consultas avanzadas con interfaz visual - sin memorizar sintaxis</p>
              </div>
              <div class="tool-item">
                <strong>🌐 Múltiples Motores</strong>
                <p>Genera queries para Google, Bing, Yandex y DuckDuckGo simultáneamente</p>
              </div>
              <div class="tool-item">
                <strong>📂 Tipos Especializados</strong>
                <p>Plantillas para usernames, emails, documentos, imágenes, videos y redes sociales</p>
              </div>
              <div class="tool-item">
                <strong>📥 Exportación</strong>
                <p>Descarga resultados en archivo de texto, copia URLs individuales</p>
              </div>
              <div class="tool-item">
                <strong>🚀 Lotes Múltiples</strong>
                <p>Abre todas las búsquedas en pestañas separadas para investigación eficiente</p>
              </div>
              <div class="tool-item">
                <strong>📚 Guía Integrada</strong>
                <p>Tutorial completo con ejemplos y mejores prácticas incluido</p>
              </div>
            </div>
            <div class="next-steps">
              <h3>¡Usa el Generador Ahora!</h3>
              <a href="/dorks" class="action-button">
                Abrir Generador de Dorks
              </a>
            </div>
            <div class="highlight-box">
              <p>🚀 <strong>Ventaja profesional:</strong> Lo que tomaría horas crear manualmente, el generador lo hace en segundos</p>
            </div>
          `,
          interactive: {
            type: 'generator_preview',
            features: ['automatic_generation', 'multi_engine', 'templates', 'export_options']
          }
        },
        {
          id: 7,
          title: "Autoevaluación - Módulo 2",
          content: `
            <h2>🎯 Evalúa tu Dominio de Google Dorks</h2>
            <p>Demuestra tu comprensión de las técnicas de búsqueda avanzada:</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué operador usarías para buscar solo archivos PDF?",
                options: ["type:pdf", "filetype:pdf", "format:pdf"],
                correct: 1,
                explanation: "El operador correcto es 'filetype:pdf' para buscar archivos de un tipo específico."
              },
              {
                question: "¿Cómo buscarías solo en un sitio web específico?",
                options: ["site:ejemplo.com", "website:ejemplo.com", "domain:ejemplo.com"],
                correct: 0,
                explanation: "El operador 'site:' limita la búsqueda a un dominio específico."
              },
              {
                question: "¿Qué significa el operador 'intitle:' en Google?",
                options: ["Busca en el contenido", "Busca en el título de la página", "Busca en la URL"],
                correct: 1,
                explanation: "'intitle:' busca páginas que contengan las palabras especificadas en el título."
              },
              {
                question: "¿Cómo excluirías una palabra de tu búsqueda?",
                options: ["palabra !excluir", "palabra -excluir", "palabra NOT excluir"],
                correct: 1,
                explanation: "El operador '-' (menos) excluye palabras de los resultados de búsqueda."
              },
              {
                question: "¿Qué ventaja principal tiene mi generador de Dorks?",
                options: ["Es más rápido que Google", "Automatiza la creación de queries complejas", "Tiene más información que Google"],
                correct: 1,
                explanation: "El generador automatiza la creación de consultas complejas con interfaz visual, ahorrando tiempo y eliminando errores de sintaxis."
              }
            ]
          }
        }
      ]
    },
    modulo3: {
      title: "Módulo 3: Búsqueda Avanzada en Redes Sociales",
      description: "Técnicas especializadas para investigación en plataformas sociales",
      totalSlides: 7,
      slides: [
        {
          id: 1,
          title: "El Ecosistema de Redes Sociales",
          content: `
            <h2>Mapeo del Universo Social Digital</h2>
            <p>Cada plataforma expone señales diferentes y cambia sus funciones con frecuencia. Antes de recolectar, define qué dato necesitas y qué limitaciones tiene la fuente:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>📘 Facebook</h3>
                <p>Perfiles, páginas, grupos y publicaciones visibles según privacidad</p>
                <p>Útil para contexto; la visibilidad no implica consentimiento para difundir</p>
              </div>
              <div class="app-card">
                <h3>🐦 Twitter/X</h3>
                <p>Publicaciones, listas, conversaciones y eventos de rápida evolución</p>
                <p>Requiere archivar pronto y distinguir testimonio de verificación</p>
              </div>
              <div class="app-card">
                <h3>💼 LinkedIn</h3>
                <p>Trayectorias declaradas, organizaciones y relaciones profesionales</p>
                <p>Los datos son autorreportados y deben contrastarse</p>
              </div>
              <div class="app-card">
                <h3>📸 Instagram</h3>
                <p>Imágenes, videos, etiquetas, menciones y ubicaciones declaradas</p>
                <p>El contexto visual suele ser más útil que los metadatos descargados</p>
              </div>
              <div class="app-card">
                <h3>🎵 TikTok</h3>
                <p>Videos, sonidos, hashtags y redes de reutilización</p>
                <p>Conserva URL, autor y fecha antes de que el contenido cambie</p>
              </div>
              <div class="app-card">
                <h3>👻 Snapchat</h3>
                <p>Contenido efímero y mapas sujetos a configuración de privacidad</p>
                <p>No infieras ubicación actual sin corroboración independiente</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Regla de trabajo:</strong> una publicación es una pieza de evidencia, no una conclusión. Captura contexto y verifica con fuentes independientes.</p>
            </div>
          `,
          interactive: {
            type: 'platform_stats',
            platforms: ['facebook', 'twitter', 'linkedin', 'instagram', 'tiktok', 'snapchat']
          }
        },
        {
          id: 2,
          title: "Facebook: Búsquedas Avanzadas",
          content: `
            <h2>Búsqueda pública y verificación en Facebook</h2>
            <p>La búsqueda y los filtros disponibles dependen de la sesión, la región y la privacidad de cada contenido. Trabaja sólo con resultados legítimamente visibles:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Definir identificadores</h3>
                <p>Nombre, alias, organización y ubicación declarada</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Aplicar filtros visibles</h3>
                <p>Personas, páginas, grupos, publicaciones y fecha cuando estén disponibles</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Buscar fuera de la plataforma</h3>
                <p>Usar site:facebook.com con términos públicos, sabiendo que la indexación es parcial</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Documentar y contrastar</h3>
                <p>Guardar URL, fecha y captura; validar identidad con otra fuente</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>"Nombre Apellido" "Organización"</code>
                <p>Combina identificadores antes de atribuir un perfil</p>
              </div>
              <div class="dork-example">
                <code>site:facebook.com "evento público" "Buenos Aires"</code>
                <p>Busca páginas indexadas; no reemplaza la verificación dentro de la plataforma</p>
              </div>
              <div class="dork-example">
                <code>URL + fecha + captura + fuente de contraste</code>
                <p>Registra evidencia suficiente para una revisión posterior</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Precaución:</strong> coincidencia de nombre no equivale a identidad. Exige dos o más atributos independientes antes de atribuir.</p>
            </div>
          `,
          interactive: {
            type: 'facebook_search_demo',
            examples: ['people_search', 'post_search', 'location_search']
          }
        },
        {
          id: 3,
          title: "Twitter/X: Búsqueda en Tiempo Real",
          content: `
            <h2>Búsqueda avanzada en X</h2>
            <p>X puede aportar testimonios y señales tempranas sobre eventos. Sus operadores ayudan a reducir ruido, pero cada publicación debe verificarse:</p>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>from:usuario</code>
                <p>Publicaciones de un usuario específico</p>
              </div>
              <div class="dork-example">
                <code>to:usuario</code>
                <p>Respuestas dirigidas a un usuario específico</p>
              </div>
              <div class="dork-example">
                <code>"frase exacta"</code>
                <p>Publicaciones que contienen la frase exacta</p>
              </div>
              <div class="dork-example">
                <code>#hashtag</code>
                <p>Publicaciones con un hashtag específico</p>
              </div>
              <div class="dork-example">
                <code>since:2024-01-01 until:2024-01-31</code>
                <p>Publicaciones en un rango de fechas específico</p>
              </div>
              <div class="dork-example">
                <code>filter:media lang:es</code>
                <p>Filtra contenido multimedia publicado en español</p>
              </div>
            </div>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🎯 Ejemplo Complejo</strong>
                <p><code>from:cuenta "término" since:2026-01-01 filter:media</code></p>
                <p>Combina autor, frase, fecha y tipo de contenido</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Verificación:</strong> en un evento en desarrollo, separa hora de publicación, hora del hecho y ubicación confirmada.</p>
            </div>
          `,
          interactive: {
            type: 'twitter_search_demo',
            examples: ['user_search', 'hashtag_search', 'temporal_search', 'location_search']
          }
        },
        {
          id: 4,
          title: "LinkedIn: Inteligencia Profesional",
          content: `
            <h2>Investigación Profesional Avanzada</h2>
            <p>LinkedIn puede aportar contexto empresarial y profesional declarado por sus usuarios. Contrasta roles, fechas y organizaciones con registros o fuentes primarias:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🏢 Por Empresa</h3>
                <p>Empleados actuales y anteriores</p>
                <p>Estructura organizacional</p>
              </div>
              <div class="app-card">
                <h3>🎓 Por Educación</h3>
                <p>Alumni de universidades específicas</p>
                <p>Conexiones académicas</p>
              </div>
              <div class="app-card">
                <h3>📍 Por Ubicación</h3>
                <p>Profesionales en ciudades específicas</p>
                <p>Mercados laborales locales</p>
              </div>
              <div class="app-card">
                <h3>💼 Por Función</h3>
                <p>Roles específicos en industrias</p>
                <p>Trayectorias profesionales</p>
              </div>
            </div>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Búsqueda Booleana</h3>
                <p>"Analista AND Ciberseguridad NOT Practicante"</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Filtros Combinados</h3>
                <p>Empresa + Ubicación + Años de experiencia</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Sales Navigator</h3>
                <p>Herramientas avanzadas de búsqueda premium</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Uso responsable:</strong> limita la recolección al objetivo de investigación y respeta las restricciones de acceso y automatización de la plataforma.</p>
            </div>
          `,
          interactive: {
            type: 'linkedin_search_demo',
            examples: ['company_search', 'role_search', 'education_search']
          }
        },
        {
          id: 5,
          title: "Instagram: Investigación Visual y Geográfica",
          content: `
            <h2>Análisis de Contenido Visual</h2>
            <p>Instagram aporta señales visuales y contextuales. Las etiquetas y ubicaciones son declarativas y deben comprobarse con elementos observables:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>📍 Búsqueda por Ubicación</strong>
                <p>Revisa publicaciones asociadas a lugares públicos</p>
                <p>Compara arquitectura, paisaje y luz; no asumas presencia actual</p>
              </div>
              <div class="tool-item">
                <strong>#️⃣ Hashtags Estratégicos</strong>
                <p>Descubre comunidades e intereses</p>
                <p>Contrasta etiquetas con el contenido visual y la fecha</p>
              </div>
              <div class="tool-item">
                <strong>👥 Análisis de Seguidores</strong>
                <p>Observa interacciones públicas relevantes</p>
                <p>No atribuyas relaciones personales sólo por un seguimiento</p>
              </div>
              <div class="tool-item">
                <strong>🕐 Stories y Highlights</strong>
                <p>Contenido temporal o seleccionado por la cuenta</p>
                <p>Registra URL, fecha y contexto cuando el uso sea legítimo</p>
              </div>
            </div>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Geolocalización</h3>
                <p>Buscar por lugares específicos en el mapa</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Analizar señales visuales</h3>
                <p>Las plataformas suelen eliminar EXIF; prioriza indicios visibles y la fuente original</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Cross-Reference</h3>
                <p>Correlacionar con otras plataformas</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Técnica de verificación:</strong> usa búsqueda inversa para rastrear versiones anteriores y confirmar si la imagen fue reutilizada fuera de contexto.</p>
            </div>
          `,
          interactive: {
            type: 'instagram_search_demo',
            examples: ['location_search', 'hashtag_analysis', 'visual_analysis']
          }
        },
        {
          id: 6,
          title: "Herramientas y Técnicas Cross-Platform",
          content: `
            <h2>Estrategias Integradas de Investigación</h2>
            <p>La verdadera potencia viene de combinar información de múltiples plataformas:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🔄 Cross-Referencing</h3>
                <p>Confirmar identidad en múltiples plataformas</p>
                <p>Detectar inconsistencias en perfiles</p>
              </div>
              <div class="app-card">
                <h3>📈 Timeline Reconstruction</h3>
                <p>Crear líneas de tiempo de actividades</p>
                <p>Correlacionar eventos entre plataformas</p>
              </div>
              <div class="app-card">
                <h3>🕸️ Network Mapping</h3>
                <p>Mapear conexiones y relaciones</p>
                <p>Identificar patrones de comportamiento</p>
              </div>
              <div class="app-card">
                <h3>🎭 Persona Analysis</h3>
                <p>Crear perfiles completos de individuos</p>
                <p>Detectar múltiples identidades</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>Username Pivoting</code>
                <p>Usar el mismo username en diferentes plataformas</p>
              </div>
              <div class="dork-example">
                <code>Email Address Search</code>
                <p>Buscar email en múltiples redes sociales</p>
              </div>
              <div class="dork-example">
                <code>Phone Number Lookup</code>
                <p>Correlacionar números de teléfono entre plataformas</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>🧩 <strong>Metodología:</strong> Siempre verifica información en al menos 2-3 fuentes diferentes</p>
            </div>
          `,
          interactive: {
            type: 'cross_platform_demo',
            techniques: ['username_pivot', 'email_search', 'timeline_correlation']
          }
        },
        {
          id: 7,
          title: "Autoevaluación - Módulo 3",
          content: `
            <h2>🎯 Evalúa tu Dominio de Redes Sociales</h2>
            <p>Demuestra tu comprensión de las técnicas de investigación en redes sociales:</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué operador de Twitter busca tweets de un usuario específico?",
                options: ["@usuario", "from:usuario", "user:usuario"],
                correct: 1,
                explanation: "El operador 'from:' busca tweets publicados por un usuario específico."
              },
              {
                question: "¿Cuál es la principal ventaja de LinkedIn para OSINT?",
                options: ["Información personal privada", "Información profesional verificada", "Contenido multimedia"],
                correct: 1,
                explanation: "LinkedIn es valioso por su información profesional, que tiende a ser más verificada y estructurada."
              },
              {
                question: "¿Qué técnica permite confirmar identidad en múltiples plataformas?",
                options: ["Cross-referencing", "Hashtag analysis", "Timeline creation"],
                correct: 0,
                explanation: "El cross-referencing permite verificar y confirmar identidades comparando información entre plataformas."
              },
              {
                question: "¿Qué información única proporciona Instagram?",
                options: ["Solo texto", "Geolocalización y contenido visual", "Información profesional"],
                correct: 1,
                explanation: "Instagram es especialmente valioso por su contenido visual y capacidades de geolocalización."
              },
              {
                question: "¿Cuántas fuentes deberías verificar mínimo?",
                options: ["1 fuente es suficiente", "2-3 fuentes diferentes", "5 o más fuentes"],
                correct: 1,
                explanation: "La verificación cruzada requiere al menos 2-3 fuentes diferentes para confirmar información."
              }
            ]
          }
        }
      ]
    },
    modulo4: {
      title: "Módulo 4: Análisis de Imágenes y Geolocalización",
      description: "Técnicas avanzadas para verificar y analizar contenido visual",
      totalSlides: 7,
      slides: [
        {
          id: 1,
          title: "El Poder del Contenido Visual",
          content: `
            <h2>Leer una imagen como evidencia</h2>
            <p>Una imagen puede aportar señales visuales, técnicas y contextuales, pero también puede haber sido recomprimida, editada o publicada con una descripción falsa:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>📊 Contexto de publicación</h3>
                <p>Cuenta, URL, fecha, texto asociado y versión del archivo</p>
                <p>Preserva esos datos antes de iniciar el análisis</p>
              </div>
              <div class="app-card">
                <h3>🔍 Metadatos disponibles</h3>
                <p>Algunos archivos conservan EXIF o XMP; muchas plataformas los eliminan</p>
                <p>Los metadatos son indicios y también pueden modificarse</p>
              </div>
              <div class="app-card">
                <h3>⚠️ Desafíos</h3>
                <p>Deepfakes y manipulación digital</p>
                <p>Desinformación visual masiva</p>
              </div>
              <div class="app-card">
                <h3>🎯 Oportunidades OSINT</h3>
                <p>Verificación de noticias</p>
                <p>Investigación de ubicaciones y eventos</p>
              </div>
            </div>
            <div class="highlight-box">
              <p><strong>Principio:</strong> la ausencia de metadatos no invalida una imagen y su presencia no demuestra autenticidad por sí sola.</p>
            </div>
            <div class="highlight-box">
              <p>🔧 <strong>Herramienta Integrada:</strong> OSINTArgy incluye su propio analizador de metadatos para extraer información de imágenes y documentos de forma fácil y rápida</p>
              <div class="tool-access-button">
                <a href="/file-analysis" class="internal-tool-button">
                  🔍 Abrir Análisis de Archivos
                </a>
              </div>
            </div>
            <ul>
              <li><strong>🗺️ Geolocalización:</strong> coordenadas cuando existan o comparación de señales visibles</li>
              <li><strong>📅 Temporal:</strong> timestamp disponible, sombras, clima y contexto de publicación</li>
              <li><strong>📱 Técnica:</strong> dispositivo o software sólo cuando el archivo conserva esos campos</li>
              <li><strong>🔍 Análisis:</strong> Reverse image search, similitudes</li>
            </ul>
          `,
          interactive: {
            type: 'visual_stats',
            items: [
              { icon: Globe, label: 'Ubicación' },
              { icon: Search, label: 'Búsqueda' },
              { icon: Eye, label: 'Análisis' },
              { icon: Shield, label: 'Verificación' }
            ]
          }
        },
        {
          id: 2,
          title: "Metadatos EXIF: El ADN Digital",
          content: `
            <h2>Extrayendo Información de Metadatos</h2>
            <p>Los metadatos EXIF (Exchangeable Image File Format) son información invisible embebida en imágenes:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>📱 Información del Dispositivo</strong>
                <p>Marca, modelo, versión del software</p>
                <p>Útil para verificar autenticidad</p>
              </div>
              <div class="tool-item">
                <strong>📍 Geolocalización GPS</strong>
                <p>Latitud, longitud, altitud</p>
                <p>Ubicación exacta donde se tomó la foto</p>
              </div>
              <div class="tool-item">
                <strong>⏰ Timestamp</strong>
                <p>Fecha y hora exacta</p>
                <p>Zona horaria del dispositivo</p>
              </div>
              <div class="tool-item">
                <strong>📸 Configuración Técnica</strong>
                <p>ISO, apertura, velocidad de obturación</p>
                <p>Flash, modo de enfoque</p>
              </div>
              <div class="tool-item">
                <strong>🔧 Software de Edición</strong>
                <p>Photoshop, Lightroom, aplicaciones móviles</p>
                <p>Indicadores de manipulación</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>ExifTool</code>
                <p>Herramienta profesional de línea de comandos</p>
              </div>
              <div class="dork-example">
                <code>Jeffrey's Exif Viewer</code>
                <p>Interfaz web fácil de usar</p>
              </div>
              <div class="dork-example">
                <code>PhotoME</code>
                <p>Software de escritorio con análisis avanzado</p>
              </div>
              <div class="dork-example highlight-internal">
                <code>🔧 OSINTArgy - Análisis de Archivos</code>
                <p>Herramienta integrada con análisis completo de metadatos</p>
                <div class="tool-access-button">
                  <a href="/file-analysis" class="internal-tool-button">
                    🚀 Usar Ahora
                  </a>
                </div>
              </div>
            </div>
            <div class="highlight-box">
              <p>⚠️ <strong>Importante:</strong> Muchas redes sociales eliminan metadatos por privacidad</p>
            </div>
            <div class="highlight-box">
              <p>🎯 <strong>Práctica Inmediata:</strong> Puedes probar ahora mismo el análisis de metadatos usando la herramienta integrada de OSINTArgy</p>
              <div class="tool-access-button">
                <a href="/file-analysis" class="internal-tool-button">
                  📷 Practicar Análisis de Metadatos
                </a>
              </div>
            </div>
          `,
          interactive: {
            type: 'exif_analysis_demo',
            examples: ['gps_extraction', 'device_identification', 'timestamp_analysis']
          }
        },
        {
          id: 3,
          title: "Búsqueda Reversa de Imágenes",
          content: `
            <h2>Encontrar el Origen y Historia de Imágenes</h2>
            <p>La búsqueda reversa es fundamental para verificar autenticidad y encontrar fuentes originales:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Google Images</h3>
                <p>El más completo, reconoce objetos y lugares</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>TinEye</h3>
                <p>Especializado en encontrar duplicados exactos</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Yandex Images</h3>
                <p>Excelente para rostros y variaciones</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Bing Visual Search</h3>
                <p>Bueno para productos y objetos</p>
              </div>
            </div>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🔍 Casos de Uso</h3>
                <p>Verificar noticias falsas</p>
                <p>Encontrar imagen original</p>
                <p>Detectar manipulación</p>
              </div>
              <div class="app-card">
                <h3>📈 Técnicas Avanzadas</h3>
                <p>Recortar secciones específicas</p>
                <p>Ajustar resolución y contraste</p>
                <p>Buscar por colores dominantes</p>
              </div>
              <div class="app-card">
                <h3>🎯 Estrategia Multi-Motor</h3>
                <p>Usar varios motores simultáneamente</p>
                <p>Comparar resultados diferentes</p>
                <p>Triangular información</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>💡 <strong>Tip profesional:</strong> Si una imagen no da resultados, intenta recortar diferentes secciones</p>
            </div>
          `,
          interactive: {
            type: 'reverse_search_demo',
            engines: ['google', 'tineye', 'yandex', 'bing']
          }
        },
        {
          id: 4,
          title: "Geolocalización: Del Pixel al Lugar Real",
          content: `
            <h2>Técnicas de Identificación de Ubicaciones</h2>
            <p>La geolocalización es una de las habilidades más poderosas en OSINT visual:</p>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🗺️ Google Earth</strong>
                <p>Imágenes satelitales históricas</p>
                <p>Modelos 3D de ciudades</p>
              </div>
              <div class="tool-item">
                <strong>🚶 Google Street View</strong>
                <p>Vistas a nivel de calle</p>
                <p>Comparación directa con fotos</p>
              </div>
              <div class="tool-item">
                <strong>📍 What3Words</strong>
                <p>Sistema de coordenadas de 3 palabras</p>
                <p>Precisión de 3x3 metros</p>
              </div>
              <div class="tool-item">
                <strong>🌍 Wikimapia</strong>
                <p>Información detallada de ubicaciones</p>
                <p>Contribuciones de la comunidad</p>
              </div>
            </div>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Identificar Pistas</h3>
                <p>Arquitectura, señales, vegetación, idiomas</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Buscar Landmarks</h3>
                <p>Edificios únicos, monumentos, características geográficas</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Triangular Ubicación</h3>
                <p>Usar múltiples referencias para precisión</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Verificar con Street View</h3>
                <p>Confirmar ubicación exacta</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>🎯 <strong>Técnica experta:</strong> Analiza sombras para determinar dirección y hora aproximada</p>
            </div>
          `,
          interactive: {
            type: 'geolocation_demo',
            techniques: ['landmark_identification', 'shadow_analysis', 'architectural_clues']
          }
        },
        {
          id: 5,
          title: "Detección de Manipulación Digital",
          content: `
            <h2>Identificando Deepfakes y Contenido Alterado</h2>
            <p>En la era de la manipulación digital, verificar autenticidad es crucial:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🔍 Análisis Técnico</h3>
                <p>Inconsistencias en compresión</p>
                <p>Artefactos de edición</p>
                <p>Patrones de ruido anómalos</p>
              </div>
              <div class="app-card">
                <h3>👁️ Análisis Visual</h3>
                <p>Sombras inconsistentes</p>
                <p>Perspectiva incorrecta</p>
                <p>Iluminación imposible</p>
              </div>
              <div class="app-card">
                <h3>🧠 Deepfake Detection</h3>
                <p>Parpadeo antinatural</p>
                <p>Movimientos faciales raros</p>
                <p>Bordes difusos en rostros</p>
              </div>
              <div class="app-card">
                <h3>📊 Herramientas Especializadas</h3>
                <p>FotoForensics (Error Level Analysis)</p>
                <p>Deepware Scanner</p>
                <p>InVID Verification Plugin</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>Error Level Analysis (ELA)</code>
                <p>Detecta áreas con diferentes niveles de compresión</p>
              </div>
              <div class="dork-example">
                <code>Copy-Move Detection</code>
                <p>Identifica elementos duplicados en la imagen</p>
              </div>
              <div class="dork-example">
                <code>Noise Analysis</code>
                <p>Analiza patrones de ruido digital</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>🚨 <strong>Alerta:</strong> Los deepfakes mejoran constantemente, siempre combina múltiples técnicas de verificación</p>
            </div>
          `,
          interactive: {
            type: 'manipulation_detection',
            techniques: ['ela_analysis', 'shadow_verification', 'noise_analysis']
          }
        },
        {
          id: 6,
          title: "Herramientas y Workflow Profesional",
          content: `
            <h2>Flujo de Trabajo para Análisis de Imágenes</h2>
            <p>Un enfoque sistemático reduce omisiones y permite revisar cada inferencia:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Preservación</h3>
                <p>Guardar imagen original, documentar fuente</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Extracción de Metadatos</h3>
                <p>EXIF, geolocalización, timestamps</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Búsqueda Reversa</h3>
                <p>Multiple motores, variaciones</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Análisis de Autenticidad</h3>
                <p>Detección de manipulación</p>
              </div>
              <div class="step">
                <span class="step-number">5</span>
                <h3>Geolocalización</h3>
                <p>Identificar ubicación exacta si es posible</p>
              </div>
              <div class="step">
                <span class="step-number">6</span>
                <h3>Documentación</h3>
                <p>Crear reporte con evidencias</p>
              </div>
            </div>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🔧 Kit de Herramientas Esencial</strong>
                <p>ExifTool, Google Images, TinEye</p>
                <p>FotoForensics, Google Earth</p>
                <p><strong>OSINTArgy:</strong> Análisis integrado de metadatos</p>
                <div class="tool-access-button">
                  <a href="/file-analysis" class="internal-tool-button">
                    🔧 Acceder a Herramienta
                  </a>
                </div>
              </div>
              <div class="tool-item">
                <strong>📱 Apps Móviles</strong>
                <p>Reverse Image Search App</p>
                <p>GPS Essentials, What3Words</p>
              </div>
              <div class="tool-item">
                <strong>🌐 Extensions de Navegador</strong>
                <p>InVID Verification Plugin</p>
                <p>RevEye Reverse Image Search</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>📋 <strong>Checklist profesional:</strong> Siempre documenta cada paso y guarda evidencias</p>
            </div>
          `,
          interactive: {
            type: 'workflow_demo',
            steps: ['preservation', 'metadata', 'reverse_search', 'authentication', 'geolocation', 'documentation']
          }
        },
        {
          id: 7,
          title: "Autoevaluación - Módulo 4",
          content: `
            <h2>🎯 Evalúa tu Dominio de Análisis Visual</h2>
            <p>Demuestra tu comprensión de las técnicas de análisis de imágenes y geolocalización:</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué información NO se encuentra típicamente en metadatos EXIF?",
                options: ["Coordenadas GPS", "Modelo de cámara", "Contenido de la imagen"],
                correct: 2,
                explanation: "Los metadatos EXIF contienen información técnica sobre cómo se tomó la foto, no sobre el contenido visual."
              },
              {
                question: "¿Cuál es la ventaja principal de usar múltiples motores de búsqueda reversa?",
                options: ["Es más rápido", "Cada motor tiene fortalezas diferentes", "Es más barato"],
                correct: 1,
                explanation: "Cada motor de búsqueda tiene diferentes algoritmos y bases de datos, proporcionando resultados complementarios."
              },
              {
                question: "¿Qué indica típicamente el Error Level Analysis (ELA)?",
                options: ["La edad de la imagen", "Áreas posiblemente manipuladas", "La cámara usada"],
                correct: 1,
                explanation: "ELA detecta inconsistencias en la compresión que pueden indicar manipulación digital."
              },
              {
                question: "¿Cuál es el primer paso en un análisis profesional de imágenes?",
                options: ["Búsqueda reversa", "Preservar la imagen original", "Extraer metadatos"],
                correct: 1,
                explanation: "Siempre debemos preservar la imagen original y documentar su fuente antes de cualquier análisis."
              },
              {
                question: "¿Qué NO es una pista útil para geolocalización?",
                options: ["Arquitectura local", "Señales de tráfico", "Marca de la cámara"],
                correct: 2,
                explanation: "La marca de la cámara no proporciona información sobre la ubicación donde se tomó la foto."
              }
            ]
          }
        }
      ]
    },
    modulo5: {
      title: "Módulo 5: Cómo Piensa el Analista OSINT",
      description: "Desarrolla la mentalidad y metodología del investigador profesional",
      totalSlides: 7,
      slides: [
        {
          id: 1,
          title: "La Mentalidad del Investigador OSINT",
          content: `
            <h2>Desarrollando el Pensamiento Analítico</h2>
            <p>Ser un analista OSINT efectivo va más allá de conocer herramientas. Requiere una forma específica de pensar:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🧠 Pensamiento Crítico</h3>
                <p>Cuestionar todo, verificar siempre</p>
                <p>No asumir, validar con evidencias</p>
              </div>
              <div class="app-card">
                <h3>🔍 Curiosidad Sistemática</h3>
                <p>Seguir cada pista metodicamente</p>
                <p>Explorar conexiones no obvias</p>
              </div>
              <div class="app-card">
                <h3>📊 Pensamiento Estructurado</h3>
                <p>Organizar información de forma lógica</p>
                <p>Documentar cada paso del proceso</p>
              </div>
              <div class="app-card">
                <h3>⚖️ Objetividad</h3>
                <p>Separar hechos de opiniones</p>
                <p>Evitar sesgos cognitivos</p>
              </div>
              <div class="app-card">
                <h3>🎯 Orientación a Objetivos</h3>
                <p>Mantener foco en la pregunta original</p>
                <p>No perderse en tangentes irrelevantes</p>
              </div>
              <div class="app-card">
                <h3>🧩 Pensamiento de Conexiones</h3>
                <p>Ver patrones y relaciones ocultas</p>
                <p>Correlacionar información dispersa</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>💡 <strong>Principio fundamental:</strong> "Datos sin análisis son solo ruido; análisis sin datos son solo opiniones"</p>
            </div>
          `,
          interactive: {
            type: 'mindset_assessment',
            traits: ['critical_thinking', 'systematic_curiosity', 'structured_approach', 'objectivity']
          }
        },
        {
          id: 2,
          title: "El Ciclo de Hipótesis y Validación",
          content: `
            <h2>Metodología Científica en OSINT</h2>
            <p>Los analistas OSINT profesionales siguen un proceso científico riguroso:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Observación Inicial</h3>
                <p>¿Qué vemos? ¿Qué llama la atención?</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Formular Hipótesis</h3>
                <p>Crear teorías basadas en evidencia inicial</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Diseñar Pruebas</h3>
                <p>¿Qué evidencia confirmaría o refutaría la hipótesis?</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Recopilar Evidencia</h3>
                <p>Búsqueda dirigida y sistemática</p>
              </div>
              <div class="step">
                <span class="step-number">5</span>
                <h3>Evaluar Resultados</h3>
                <p>¿La evidencia soporta la hipótesis?</p>
              </div>
              <div class="step">
                <span class="step-number">6</span>
                <h3>Refinar o Descartar</h3>
                <p>Ajustar teoría o crear nueva hipótesis</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>Ejemplo: Perfil Sospechoso</code>
                <p><strong>Hipótesis:</strong> Este perfil es falso</p>
                <p><strong>Pruebas:</strong> Buscar imágenes, verificar consistencia temporal, analizar conexiones</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>🧪 <strong>Principio clave:</strong> Una hipótesis que no puede ser refutada no es útil</p>
            </div>
          `,
          interactive: {
            type: 'hypothesis_cycle',
            scenarios: ['fake_profile', 'location_verification', 'timeline_analysis']
          }
        },
        {
          id: 3,
          title: "Gestión de Sesgos Cognitivos",
          content: `
            <h2>Los Enemigos Invisibles del Analista</h2>
            <p>Nuestro cerebro tiene atajos que pueden sabotear investigaciones. Los analistas deben conocerlos:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>🎯 Sesgo de Confirmación</h3>
                <p>Buscar solo evidencia que confirme nuestras creencias</p>
                <p><strong>Antídoto:</strong> Buscar activamente evidencia contraria</p>
              </div>
              <div class="app-card">
                <h3>⚓ Sesgo de Anclaje</h3>
                <p>Dar demasiado peso a la primera información</p>
                <p><strong>Antídoto:</strong> Evaluar múltiples fuentes antes de concluir</p>
              </div>
              <div class="app-card">
                <h3>📈 Sesgo de Disponibilidad</h3>
                <p>Sobrevalorar información fácil de recordar</p>
                <p><strong>Antídoto:</strong> Buscar sistemáticamente, no solo lo obvio</p>
              </div>
              <div class="app-card">
                <h3>👥 Sesgo de Grupo</h3>
                <p>Seguir la opinión mayoritaria sin análisis</p>
                <p><strong>Antídoto:</strong> Análisis independiente antes de consultar</p>
              </div>
            </div>
            <div class="ethics-rules">
              <div class="rule-item good">
                <h3>✅ Técnicas Anti-Sesgo</h3>
                <ul>
                  <li>Red Team: asignar alguien que refute hipótesis</li>
                  <li>Lista de verificación estructurada</li>
                  <li>Análisis de fuentes alternativas</li>
                  <li>Documentar proceso de pensamiento</li>
                  <li>Pausas reflexivas antes de concluir</li>
                </ul>
              </div>
              <div class="rule-item bad">
                <h3>⚠️ Señales de Alarma</h3>
                <ul>
                  <li>"Esto confirma lo que pensaba"</li>
                  <li>Evitar fuentes que contradicen</li>
                  <li>Conclusiones muy rápidas</li>
                  <li>No documentar razonamiento</li>
                  <li>Ignorar evidencia incómoda</li>
                </ul>
              </div>
            </div>
            <div class="highlight-box">
              <p>🧠 <strong>Regla de oro:</strong> La mejor evidencia es la que te sorprende o contradice tus expectativas</p>
            </div>
          `,
          interactive: {
            type: 'bias_training',
            scenarios: ['confirmation_bias', 'anchoring_bias', 'availability_bias']
          }
        },
        {
          id: 4,
          title: "Análisis de Fuentes y Credibilidad",
          content: `
            <h2>Evaluando la Confiabilidad de la Información</h2>
            <p>No toda información es igual. Los analistas deben evaluar credibilidad sistemáticamente:</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <h3>Identificar la Fuente</h3>
                <p>¿Quién publicó? ¿Cuándo? ¿Dónde?</p>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <h3>Evaluar Competencia</h3>
                <p>¿La fuente tiene experiencia en el tema?</p>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <h3>Analizar Motivación</h3>
                <p>¿Qué intereses puede tener la fuente?</p>
              </div>
              <div class="step">
                <span class="step-number">4</span>
                <h3>Verificar Consistencia</h3>
                <p>¿Coincide con otras fuentes independientes?</p>
              </div>
              <div class="step">
                <span class="step-number">5</span>
                <h3>Evaluar Método</h3>
                <p>¿Cómo obtuvo la información?</p>
              </div>
            </div>
            <div class="tools-showcase">
              <div class="tool-item">
                <strong>🥇 Fuentes Primarias</strong>
                <p>Testigos directos, documentos originales</p>
                <p>Mayor credibilidad, menor interpretación</p>
              </div>
              <div class="tool-item">
                <strong>🥈 Fuentes Secundarias</strong>
                <p>Análisis de fuentes primarias</p>
                <p>Útiles pero pueden incluir interpretación</p>
              </div>
              <div class="tool-item">
                <strong>🥉 Fuentes Terciarias</strong>
                <p>Resúmenes de fuentes secundarias</p>
                <p>Menos confiables, más interpretación</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>📊 <strong>Matriz de credibilidad:</strong> Cruzar confiabilidad de fuente con veracidad de información</p>
            </div>
          `,
          interactive: {
            type: 'source_evaluation',
            examples: ['primary_source', 'secondary_source', 'tertiary_source', 'anonymous_source']
          }
        },
        {
          id: 5,
          title: "Documentación y Cadena de Custodia",
          content: `
            <h2>Preservando la Integridad de la Investigación</h2>
            <p>La documentación meticulosa separa al analista amateur del profesional:</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>📝 Documentación en Tiempo Real</h3>
                <p>Registrar cada paso mientras lo realizas</p>
                <p>Timestamps, URLs, capturas de pantalla</p>
              </div>
              <div class="app-card">
                <h3>🔗 Cadena de Custodia</h3>
                <p>Demostrar que la evidencia no fue alterada</p>
                <p>Hashes, metadatos, fuentes originales</p>
              </div>
              <div class="app-card">
                <h3>🗂️ Organización Sistemática</h3>
                <p>Estructura consistente para todos los casos</p>
                <p>Fácil de revisar y auditar</p>
              </div>
              <div class="app-card">
                <h3>📊 Reporting Estructurado</h3>
                <p>Formato estándar para conclusiones</p>
                <p>Separar hechos de interpretaciones</p>
              </div>
            </div>
            <div class="dorks-examples">
              <div class="dork-example">
                <code>Estructura de Carpetas</code>
                <p>YYYY-MM-DD_CaseName/01_Sources/02_Evidence/03_Analysis/04_Report</p>
              </div>
              <div class="dork-example">
                <code>Naming Convention</code>
                <p>YYYY-MM-DD_HH-MM_Source_Description</p>
              </div>
              <div class="dork-example">
                <code>Metadata Logging</code>
                <p>URL, timestamp, hash, tool used, analyst</p>
              </div>
            </div>
            <div class="ethics-rules">
              <div class="rule-item good">
                <h3>✅ Mejores Prácticas</h3>
                <ul>
                  <li>Documentar en tiempo real, no después</li>
                  <li>Incluir información que permita replicar</li>
                  <li>Separar claramente hechos de análisis</li>
                  <li>Usar herramientas de hash para integridad</li>
                  <li>Backup múltiple de evidencia crítica</li>
                </ul>
              </div>
            </div>
            <div class="highlight-box">
              <p>⚖️ <strong>Principio legal:</strong> Si no está documentado, no ocurrió</p>
            </div>
          `,
          interactive: {
            type: 'documentation_practice',
            elements: ['evidence_capture', 'metadata_logging', 'chain_custody', 'report_structure']
          }
        },
        {
          id: 6,
          title: "Ética y Responsabilidad Profesional",
          content: `
            <h2>El Peso de la Información</h2>
            <p>Con gran poder analítico viene gran responsabilidad. Los analistas OSINT manejan información que puede afectar vidas:</p>
            <div class="ethics-rules">
              <div class="rule-item good">
                <h3>✅ Responsabilidades Éticas</h3>
                <ul>
                  <li><strong>Precisión:</strong> Verificar múltiples veces antes de reportar</li>
                  <li><strong>Proporcionalidad:</strong> Usar mínima intrusión necesaria</li>
                  <li><strong>Transparencia:</strong> Documentar métodos y limitaciones</li>
                  <li><strong>Confidencialidad:</strong> Proteger información sensible</li>
                  <li><strong>Objetividad:</strong> Presentar hechos, no interpretaciones sesgadas</li>
                </ul>
              </div>
              <div class="rule-item bad">
                <h3>❌ Líneas Rojas Profesionales</h3>
                <ul>
                  <li>Nunca publicar información personal sin justificación</li>
                  <li>No usar métodos ilegales o no éticos</li>
                  <li>No permitir que sesgos afecten análisis</li>
                  <li>No exagerar certeza de conclusiones</li>
                  <li>No omitir evidencia contradictoria</li>
                </ul>
              </div>
            </div>
            <div class="applications-grid">
              <div class="app-card">
                <h3>⚖️ Dilemas Éticos Comunes</h3>
                <p>Información que podría dañar a inocentes</p>
                <p>Presión para conclusiones rápidas</p>
                <p>Conflicto entre transparencia y privacidad</p>
              </div>
              <div class="app-card">
                <h3>🛡️ Marco de Decisión Ética</h3>
                <p>1. ¿Es legal? 2. ¿Es ético? 3. ¿Es necesario?</p>
                <p>4. ¿Minimiza daño? 5. ¿Puedo defenderlo públicamente?</p>
              </div>
            </div>
            <div class="highlight-box">
              <p>🎯 <strong>Regla fundamental:</strong> Tu reputación profesional es tu activo más valioso</p>
            </div>
          `,
          interactive: {
            type: 'ethical_scenarios',
            dilemmas: ['privacy_vs_truth', 'source_protection', 'incomplete_evidence', 'time_pressure']
          }
        },
        {
          id: 7,
          title: "Autoevaluación - Módulo 5",
          content: `
            <h2>🎯 Evalúa tu Mentalidad de Analista OSINT</h2>
            <p>Demuestra tu comprensión de la metodología y ética del análisis profesional:</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Cuál es el primer paso en el ciclo de hipótesis?",
                options: ["Formular teorías", "Observación inicial", "Recopilar evidencia"],
                correct: 1,
                explanation: "Siempre debemos comenzar con observación cuidadosa antes de formular hipótesis."
              },
              {
                question: "¿Qué caracteriza al sesgo de confirmación?",
                options: ["Buscar solo evidencia que confirme nuestras creencias", "Dar peso excesivo a la primera información", "Seguir la opinión mayoritaria"],
                correct: 0,
                explanation: "El sesgo de confirmación nos lleva a buscar solo información que apoye lo que ya creemos."
              },
              {
                question: "¿Qué tipo de fuente tiene mayor credibilidad?",
                options: ["Fuentes secundarias", "Fuentes primarias", "Fuentes anónimas"],
                correct: 1,
                explanation: "Las fuentes primarias (testigos directos, documentos originales) tienen mayor credibilidad."
              },
              {
                question: "¿Cuándo debes documentar tu investigación?",
                options: ["Al final del análisis", "En tiempo real mientras investigas", "Solo los resultados importantes"],
                correct: 1,
                explanation: "La documentación debe ser en tiempo real para mantener precisión y cadena de custodia."
              },
              {
                question: "¿Cuál es la pregunta ética más importante?",
                options: ["¿Es rápido?", "¿Es legal y ético?", "¿Es fácil?"],
                correct: 1,
                explanation: "Siempre debemos evaluar la legalidad y ética de nuestros métodos antes de proceder."
              }
            ]
          }
        }
      ]
    },
    infra1: {
      academyId: "infrastructure",
      title: "Módulo 1: Huella Digital Pública",
      description: "Alcance, ética y mapa inicial de exposición pública",
      totalSlides: 5,
      slides: [
        {
          id: 1,
          title: "Qué es una huella digital pública",
          content: `
            <h2>La superficie visible desde afuera</h2>
            <p>La huella digital pública es el conjunto de señales que una organización deja en internet sin requerir acceso privado: dominios, subdominios, certificados, registros DNS, correos, documentos, tecnologías y menciones.</p>
            <p>En una investigación defensiva, el objetivo no es explotar nada. El objetivo es <strong>ver lo que otros podrían ver</strong>, ordenar evidencias y proponer mejoras.</p>
            <div class="highlight-box">
              <p>🎯 <strong>Idea clave:</strong> una buena auditoría OSINT empieza por alcance, permisos y documentación.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Globe, label: 'Dominios' },
              { icon: Mail, label: 'Email' },
              { icon: Server, label: 'Infraestructura' },
              { icon: Shield, label: 'Riesgo' }
            ]
          }
        },
        {
          id: 2,
          title: "Categorías de exposición",
          content: `
            <h2>Qué conviene mirar primero</h2>
            <p>La exposición pública se vuelve manejable cuando se agrupa por familias. Esto evita perseguir datos sueltos y ayuda a priorizar hallazgos.</p>
            <ul>
              <li><strong>🌐 Identidad técnica:</strong> dominios, DNS, certificados y proveedores.</li>
              <li><strong>📧 Identidad de correo:</strong> MX, SPF, DKIM, DMARC y dominios parecidos.</li>
              <li><strong>🧩 Assets públicos:</strong> subdominios, paneles, entornos de prueba y documentación.</li>
              <li><strong>📄 Información publicada:</strong> PDFs, metadatos, repositorios y menciones.</li>
            </ul>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Dominios y DNS', percentage: 30 },
              { label: 'Email y reputación', percentage: 25 },
              { label: 'Subdominios y servicios', percentage: 25 },
              { label: 'Documentos y menciones', percentage: 20 }
            ]
          }
        },
        {
          id: 3,
          title: "Alcance responsable",
          content: `
            <h2>Antes de investigar</h2>
            <p>Un alcance claro define qué dominios se pueden revisar, qué fuentes están permitidas, qué acciones quedan fuera y cómo se reportarán los hallazgos.</p>
            <div class="ethics-rules">
              <div class="rule-item good">
                <h3>✅ Permitido</h3>
                <ul>
                  <li>Consultar fuentes públicas.</li>
                  <li>Documentar URLs, fechas y evidencias.</li>
                  <li>Usar datos agregados para priorizar riesgos.</li>
                  <li>Reportar recomendaciones defensivas.</li>
                </ul>
              </div>
              <div class="rule-item bad">
                <h3>❌ Fuera de alcance</h3>
                <ul>
                  <li>Intentar autenticación en sistemas reales.</li>
                  <li>Probar credenciales filtradas.</li>
                  <li>Forzar formularios o endpoints.</li>
                  <li>Publicar datos sensibles de terceros.</li>
                </ul>
              </div>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: BookOpen, label: 'Alcance' },
              { icon: Shield, label: 'Permiso' },
              { icon: Eye, label: 'Evidencia' },
              { icon: Target, label: 'Prioridad' }
            ]
          }
        },
        {
          id: 4,
          title: "Triage inicial",
          content: `
            <h2>Convertir señales en prioridades</h2>
            <p>No todos los hallazgos tienen el mismo peso. La tarea del analista es estimar impacto, probabilidad y facilidad de remediación.</p>
            <div class="methodology-steps">
              <div class="step">
                <span class="step-number">1</span>
                <div>
                  <h3>Inventariar</h3>
                  <p>Listar dominios, subdominios y servicios observables.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-number">2</span>
                <div>
                  <h3>Verificar</h3>
                  <p>Confirmar evidencia con más de una fuente cuando sea posible.</p>
                </div>
              </div>
              <div class="step">
                <span class="step-number">3</span>
                <div>
                  <h3>Priorizar</h3>
                  <p>Separar información útil, hardening pendiente y riesgos altos.</p>
                </div>
              </div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Inventario', percentage: 35 },
              { label: 'Verificación', percentage: 30 },
              { label: 'Priorización', percentage: 25 },
              { label: 'Reporte', percentage: 10 }
            ]
          }
        },
        {
          id: 5,
          title: "Autoevaluación - Huella Digital",
          content: `
            <h2>🎯 Evalúa tu criterio inicial</h2>
            <p>Responde estas preguntas antes de avanzar a dominios y DNS.</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Cuál es el objetivo de una auditoría OSINT defensiva?",
                options: ["Explotar servicios públicos", "Ver y reducir exposición pública", "Evitar documentar fuentes"],
                correct: 1,
                explanation: "La auditoría defensiva busca entender exposición pública y proponer mejoras sin intrusión."
              },
              {
                question: "¿Qué debería definirse antes de investigar?",
                options: ["Alcance y permisos", "Un exploit", "Una cuenta falsa"],
                correct: 0,
                explanation: "El alcance evita abusos, ruido operativo y conclusiones fuera de contexto."
              },
              {
                question: "¿Qué convierte una señal pública en hallazgo útil?",
                options: ["Que sea llamativa", "Que tenga evidencia, impacto y recomendación", "Que aparezca en una sola búsqueda"],
                correct: 1,
                explanation: "Un hallazgo necesita evidencia verificable, impacto razonado y acción sugerida."
              }
            ]
          }
        }
      ]
    },
    infra2: {
      academyId: "infrastructure",
      title: "Módulo 2: Dominios, WHOIS y DNS",
      description: "Lectura de registros públicos y configuración de correo",
      totalSlides: 5,
      slides: [
        {
          id: 1,
          title: "El dominio como punto de partida",
          content: `
            <h2>Identidad técnica principal</h2>
            <p>Un dominio concentra muchas señales: registrador, nameservers, hosting, correo, subdominios y proveedores externos.</p>
            <p>El análisis empieza con preguntas simples: quién resuelve DNS, qué servicios se anuncian y qué registros ayudan o debilitan la postura defensiva.</p>
            <div class="highlight-box">
              <p>🔎 <strong>Clave:</strong> DNS no solo dice dónde está algo; también revela cómo está organizada una parte del ecosistema técnico.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Globe, label: 'Dominio' },
              { icon: Database, label: 'DNS' },
              { icon: Mail, label: 'MX' },
              { icon: Shield, label: 'Políticas' }
            ]
          }
        },
        {
          id: 2,
          title: "Registros que importan",
          content: `
            <h2>Leer DNS con intención</h2>
            <p>Cada registro responde una pregunta distinta. No hace falta memorizar todo; sí entender qué evidencia aporta cada tipo.</p>
            <div class="tools-showcase">
              <div class="tool-item"><strong>A / AAAA</strong><p>Direcciones IPv4 o IPv6 asociadas a un host.</p></div>
              <div class="tool-item"><strong>CNAME</strong><p>Alias hacia otro nombre, útil para detectar proveedores.</p></div>
              <div class="tool-item"><strong>MX</strong><p>Servidores responsables del correo del dominio.</p></div>
              <div class="tool-item"><strong>TXT</strong><p>Políticas, verificaciones y señales como SPF o DMARC.</p></div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Resolución web', percentage: 30 },
              { label: 'Correo', percentage: 30 },
              { label: 'Proveedores', percentage: 25 },
              { label: 'Verificaciones', percentage: 15 }
            ]
          }
        },
        {
          id: 3,
          title: "SPF, DKIM y DMARC",
          content: `
            <h2>Autenticación de correo</h2>
            <p>Los registros de correo ayudan a reducir suplantación. Una configuración incompleta puede facilitar phishing con apariencia legítima.</p>
            <ul>
              <li><strong>SPF:</strong> indica qué servidores pueden enviar correo por el dominio.</li>
              <li><strong>DKIM:</strong> firma mensajes para validar integridad y origen.</li>
              <li><strong>DMARC:</strong> define qué hacer si SPF o DKIM fallan y entrega reportes.</li>
            </ul>
            <div class="highlight-box">
              <p>📧 <strong>Priorización:</strong> DMARC ausente o demasiado permisivo suele ser más sensible que un TXT informativo.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Mail, label: 'SPF' },
              { icon: Lock, label: 'DKIM' },
              { icon: Shield, label: 'DMARC' },
              { icon: AlertTriangle, label: 'Spoofing' }
            ]
          }
        },
        {
          id: 4,
          title: "Interpretar sin sobreactuar",
          content: `
            <h2>Contexto antes de severidad</h2>
            <p>Un registro extraño no siempre es una vulnerabilidad. Puede ser legado, proveedor, migración o configuración temporal.</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>Señales útiles</h3>
                <p>Nameservers externos, múltiples proveedores de correo, TXT antiguos, dominios estacionados y CNAMEs a SaaS.</p>
              </div>
              <div class="app-card">
                <h3>Preguntas de control</h3>
                <p>¿Está en uso? ¿Pertenece a la organización? ¿Tiene impacto real? ¿Hay evidencia repetida?</p>
              </div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Evidencia', percentage: 40 },
              { label: 'Contexto', percentage: 30 },
              { label: 'Impacto', percentage: 20 },
              { label: 'Recomendación', percentage: 10 }
            ]
          }
        },
        {
          id: 5,
          title: "Autoevaluación - DNS",
          content: `
            <h2>🎯 Revisa lo aprendido</h2>
            <p>Comprueba si puedes leer registros públicos con criterio defensivo.</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué registro indica servidores de correo?",
                options: ["MX", "AAAA", "CNAME"],
                correct: 0,
                explanation: "MX define los servidores responsables de recibir correo del dominio."
              },
              {
                question: "¿Qué política ayuda a decidir qué hacer cuando falla la autenticación de correo?",
                options: ["CNAME", "DMARC", "NS"],
                correct: 1,
                explanation: "DMARC define políticas y reportes para fallos de SPF o DKIM."
              },
              {
                question: "¿Cuál es una buena práctica al interpretar DNS?",
                options: ["Reportar todo como crítico", "Validar contexto e impacto", "Ignorar registros TXT"],
                correct: 1,
                explanation: "DNS requiere contexto; no toda señal implica riesgo alto."
              }
            ]
          }
        }
      ]
    },
    infra3: {
      academyId: "infrastructure",
      title: "Módulo 3: Subdominios y Certificados",
      description: "Descubrimiento de assets públicos y lectura de Certificate Transparency",
      totalSlides: 5,
      slides: [
        {
          id: 1,
          title: "Subdominios como inventario vivo",
          content: `
            <h2>Assets que aparecen y quedan</h2>
            <p>Los subdominios revelan aplicaciones, proveedores, entornos de prueba, regiones, APIs y convenciones internas.</p>
            <p>El valor defensivo está en detectar lo que sigue visible, lo que ya no debería existir y lo que no tiene propietario claro.</p>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Server, label: 'Apps' },
              { icon: Globe, label: 'APIs' },
              { icon: Lock, label: 'Certificados' },
              { icon: Target, label: 'Dueño' }
            ]
          }
        },
        {
          id: 2,
          title: "Certificate Transparency",
          content: `
            <h2>Certificados como fuente OSINT</h2>
            <p>Los logs de Certificate Transparency permiten observar certificados emitidos para un dominio. Esto puede revelar subdominios aunque no estén enlazados desde la web principal.</p>
            <div class="highlight-box">
              <p>📜 <strong>Importante:</strong> un certificado histórico no confirma que el servicio siga activo. Siempre hay que verificar estado actual.</p>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Certificados activos', percentage: 35 },
              { label: 'Certificados históricos', percentage: 30 },
              { label: 'Wildcards', percentage: 20 },
              { label: 'Falsos positivos', percentage: 15 }
            ]
          }
        },
        {
          id: 3,
          title: "Patrones de nombres",
          content: `
            <h2>Lo que dice el naming</h2>
            <p>Los nombres de subdominios pueden exponer propósito, entorno o proveedor: <strong>vpn</strong>, <strong>dev</strong>, <strong>staging</strong>, <strong>jira</strong>, <strong>api</strong>, <strong>sso</strong>.</p>
            <div class="dorks-examples">
              <div class="dork-example"><code>staging.empresa.com</code><p>Posible entorno de prueba.</p></div>
              <div class="dork-example"><code>vpn.empresa.com</code><p>Acceso remoto o portal corporativo.</p></div>
              <div class="dork-example"><code>old-api.empresa.com</code><p>Servicio legado o transición.</p></div>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: AlertTriangle, label: 'Staging' },
              { icon: Lock, label: 'VPN' },
              { icon: Server, label: 'API' },
              { icon: Database, label: 'Legado' }
            ]
          }
        },
        {
          id: 4,
          title: "Priorizar hallazgos",
          content: `
            <h2>No todos los subdominios pesan igual</h2>
            <p>La prioridad sube cuando un asset está activo, expone autenticación, parece no estar mantenido o pertenece a un entorno no productivo.</p>
            <div class="methodology-steps">
              <div class="step"><span class="step-number">1</span><div><h3>Activo</h3><p>Resuelve y responde actualmente.</p></div></div>
              <div class="step"><span class="step-number">2</span><div><h3>Sensible</h3><p>Indica login, admin, VPN, SSO, API o staging.</p></div></div>
              <div class="step"><span class="step-number">3</span><div><h3>Remediable</h3><p>Tiene dueño, proveedor o camino claro de corrección.</p></div></div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Activo', percentage: 35 },
              { label: 'Sensible', percentage: 35 },
              { label: 'Expuesto', percentage: 20 },
              { label: 'Sin dueño', percentage: 10 }
            ]
          }
        },
        {
          id: 5,
          title: "Autoevaluación - Subdominios",
          content: `
            <h2>🎯 Evalúa tu análisis de assets</h2>
            <p>Clasifica señales típicas de subdominios y certificados.</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué permite descubrir Certificate Transparency?",
                options: ["Contraseñas", "Certificados emitidos y posibles subdominios", "Mensajes privados"],
                correct: 1,
                explanation: "Los logs CT muestran certificados emitidos, que pueden revelar nombres de host."
              },
              {
                question: "¿Qué subdominio suele requerir revisión prioritaria?",
                options: ["www", "staging", "cdn"],
                correct: 1,
                explanation: "staging puede indicar un entorno de prueba expuesto públicamente."
              },
              {
                question: "¿Un certificado histórico confirma que el servicio sigue activo?",
                options: ["Sí, siempre", "No, hay que verificar estado actual", "Solo si es wildcard"],
                correct: 1,
                explanation: "Los certificados históricos son pistas, no confirmación de exposición actual."
              }
            ]
          }
        }
      ]
    },
    infra4: {
      academyId: "infrastructure",
      title: "Módulo 4: Email y Phishing Defensivo",
      description: "Señales públicas para evaluar suplantación, brechas y reputación",
      totalSlides: 5,
      slides: [
        {
          id: 1,
          title: "Correo como vector de abuso",
          content: `
            <h2>Identidad, confianza y fraude</h2>
            <p>El email combina identidad técnica y percepción humana. Un dominio mal protegido o un dominio parecido puede ser suficiente para engañar a usuarios o clientes.</p>
            <div class="highlight-box">
              <p>📧 <strong>Objetivo defensivo:</strong> reducir la facilidad de suplantación y detectar señales tempranas de abuso.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Mail, label: 'Remitente' },
              { icon: Globe, label: 'Dominio' },
              { icon: Shield, label: 'Política' },
              { icon: AlertTriangle, label: 'Phishing' }
            ]
          }
        },
        {
          id: 2,
          title: "Dominios parecidos",
          content: `
            <h2>Typosquatting y confusión visual</h2>
            <p>Los dominios similares aprovechan errores de tipeo, caracteres parecidos o palabras agregadas para parecer legítimos.</p>
            <div class="dorks-examples">
              <div class="dork-example"><code>empresa-seguridad.com</code><p>Agrega una palabra confiable.</p></div>
              <div class="dork-example"><code>ernpresa.com</code><p>Cambia letras visualmente similares.</p></div>
              <div class="dork-example"><code>empresa.co</code><p>Usa otro TLD para confundir.</p></div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'TLD alternativo', percentage: 30 },
              { label: 'Palabra agregada', percentage: 30 },
              { label: 'Letra parecida', percentage: 25 },
              { label: 'Guiones', percentage: 15 }
            ]
          }
        },
        {
          id: 3,
          title: "Brechas y exposición de cuentas",
          content: `
            <h2>Qué aporta una búsqueda de brechas</h2>
            <p>Encontrar un correo en una brecha no significa que la cuenta actual esté comprometida. Sí indica que puede existir riesgo de reutilización de contraseñas, spam dirigido o intentos de acceso.</p>
            <div class="applications-grid">
              <div class="app-card">
                <h3>Señal útil</h3>
                <p>Fecha de brecha, tipo de datos comprometidos y volumen afectado.</p>
              </div>
              <div class="app-card">
                <h3>Acción defensiva</h3>
                <p>Revisión de MFA, rotación de credenciales y concientización puntual.</p>
              </div>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Database, label: 'Brecha' },
              { icon: Mail, label: 'Cuenta' },
              { icon: Lock, label: 'MFA' },
              { icon: Shield, label: 'Rotación' }
            ]
          }
        },
        {
          id: 4,
          title: "Headers y reputación",
          content: `
            <h2>Leer señales sin invadir</h2>
            <p>El análisis de headers permite revisar rutas de entrega, autenticación y alineación de dominios en mensajes disponibles para el analista.</p>
            <ul>
              <li><strong>Received:</strong> ruta declarada por servidores.</li>
              <li><strong>Authentication-Results:</strong> resultado de SPF, DKIM y DMARC.</li>
              <li><strong>Return-Path:</strong> dominio de rebote y alineación.</li>
              <li><strong>Reply-To:</strong> desvíos sospechosos de respuesta.</li>
            </ul>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Autenticación', percentage: 40 },
              { label: 'Alineación', percentage: 25 },
              { label: 'Ruta', percentage: 20 },
              { label: 'Contenido', percentage: 15 }
            ]
          }
        },
        {
          id: 5,
          title: "Autoevaluación - Email",
          content: `
            <h2>🎯 Evalúa señales de phishing</h2>
            <p>Demuestra criterio para priorizar hallazgos de correo.</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué significa encontrar un email en una brecha?",
                options: ["Compromiso actual confirmado", "Señal de riesgo que requiere contexto", "Nada útil"],
                correct: 1,
                explanation: "Una brecha es señal de riesgo, pero debe interpretarse con fecha, tipo de datos y controles actuales."
              },
              {
                question: "¿Qué control reduce suplantación de dominio por correo?",
                options: ["DMARC", "robots.txt", "CNAME"],
                correct: 0,
                explanation: "DMARC ayuda a indicar qué hacer ante mensajes que fallan autenticación."
              },
              {
                question: "¿Qué dominio parece más sospechoso para una marca llamada empresa.com?",
                options: ["blog.empresa.com", "empresa-seguridad.com", "cdn.empresa.com"],
                correct: 1,
                explanation: "empresa-seguridad.com es un dominio parecido pero independiente, típico de suplantación."
              }
            ]
          }
        }
      ]
    },
    infra5: {
      academyId: "infrastructure",
      title: "Módulo 5: SSL, Headers y Tecnologías",
      description: "Hardening visible, fingerprinting tecnológico y reporte ejecutivo",
      totalSlides: 5,
      slides: [
        {
          id: 1,
          title: "Configuración visible",
          content: `
            <h2>Lo que una web revela al responder</h2>
            <p>Sin autenticarse ni interactuar de forma invasiva, una respuesta web puede revelar TLS, headers de seguridad, tecnologías, redirecciones y patrones operativos.</p>
            <div class="highlight-box">
              <p>🛡️ <strong>Foco:</strong> observar configuración pública, estimar riesgo y recomendar hardening.</p>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Lock, label: 'TLS' },
              { icon: Shield, label: 'Headers' },
              { icon: Server, label: 'Stack' },
              { icon: Target, label: 'Prioridad' }
            ]
          }
        },
        {
          id: 2,
          title: "TLS y HSTS",
          content: `
            <h2>Transporte seguro</h2>
            <p>Un certificado válido no es toda la historia. También importan versiones TLS, redirecciones HTTPS y políticas como HSTS.</p>
            <ul>
              <li><strong>Certificado válido:</strong> identidad y vigencia del sitio.</li>
              <li><strong>TLS moderno:</strong> evita protocolos obsoletos.</li>
              <li><strong>HSTS:</strong> ayuda a forzar navegación HTTPS.</li>
            </ul>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Certificado válido', percentage: 35 },
              { label: 'TLS moderno', percentage: 30 },
              { label: 'Redirección HTTPS', percentage: 20 },
              { label: 'HSTS', percentage: 15 }
            ]
          }
        },
        {
          id: 3,
          title: "Headers de seguridad",
          content: `
            <h2>Pequeñas políticas, gran efecto</h2>
            <p>Los headers no reemplazan una arquitectura segura, pero reducen clases comunes de abuso del navegador.</p>
            <div class="tools-showcase">
              <div class="tool-item"><strong>Content-Security-Policy</strong><p>Limita orígenes permitidos para scripts y recursos.</p></div>
              <div class="tool-item"><strong>X-Frame-Options</strong><p>Reduce riesgo de clickjacking.</p></div>
              <div class="tool-item"><strong>Referrer-Policy</strong><p>Controla cuánto contexto viaja en enlaces.</p></div>
              <div class="tool-item"><strong>Permissions-Policy</strong><p>Restringe APIs del navegador.</p></div>
            </div>
          `,
          interactive: {
            type: 'icons',
            items: [
              { icon: Shield, label: 'CSP' },
              { icon: Eye, label: 'Frame' },
              { icon: Globe, label: 'Referrer' },
              { icon: Lock, label: 'Permisos' }
            ]
          }
        },
        {
          id: 4,
          title: "Tecnologías y reporte",
          content: `
            <h2>De fingerprinting a remediación</h2>
            <p>Detectar tecnologías sirve para orientar revisión, no para exagerar riesgo. Versiones, frameworks y proveedores deben conectarse con impacto real.</p>
            <div class="methodology-steps">
              <div class="step"><span class="step-number">1</span><div><h3>Hallazgo</h3><p>Qué se observó y dónde.</p></div></div>
              <div class="step"><span class="step-number">2</span><div><h3>Impacto</h3><p>Por qué importa para la organización.</p></div></div>
              <div class="step"><span class="step-number">3</span><div><h3>Acción</h3><p>Qué cambio defensivo se recomienda.</p></div></div>
            </div>
          `,
          interactive: {
            type: 'progress_bar',
            items: [
              { label: 'Evidencia', percentage: 35 },
              { label: 'Impacto', percentage: 30 },
              { label: 'Recomendación', percentage: 25 },
              { label: 'Dueño', percentage: 10 }
            ]
          }
        },
        {
          id: 5,
          title: "Autoevaluación - Hardening",
          content: `
            <h2>🎯 Cierre del curso</h2>
            <p>Valida tu criterio antes de pasar al laboratorio simulado.</p>
          `,
          interactive: {
            type: 'quiz',
            questions: [
              {
                question: "¿Qué indica HSTS?",
                options: ["Política para forzar HTTPS", "Servidor de correo", "Alias DNS"],
                correct: 0,
                explanation: "HSTS ayuda a que el navegador use HTTPS de forma estricta para el dominio."
              },
              {
                question: "¿Qué debería tener un buen hallazgo?",
                options: ["Solo una captura", "Evidencia, impacto y recomendación", "Una opinión fuerte"],
                correct: 1,
                explanation: "Un reporte útil conecta evidencia verificable con impacto y acción."
              },
              {
                question: "¿Detectar una tecnología siempre implica vulnerabilidad?",
                options: ["Sí", "No, requiere versión, contexto e impacto", "Solo si es JavaScript"],
                correct: 1,
                explanation: "El fingerprinting orienta revisión, pero no prueba riesgo por sí solo."
              }
            ]
          }
        }
      ]
    }
  }

  const currentLesson = lessons[lessonId]
  const hasCurrentLesson = Boolean(currentLesson)
  const currentSlideData = currentLesson?.slides?.[currentSlide]
  const safeSlideContent = useMemo(
    () => DOMPurify.sanitize(currentSlideData?.content || ''),
    [currentSlideData?.content]
  )

  useEffect(() => {
    const savedSlide = academyProgress.modules[lessonId]?.lastSlide || 0
    const lastAvailableSlide = (currentLesson?.totalSlides || 1) - 1
    setCurrentSlide(Math.min(savedSlide, lastAvailableSlide))
    setQuizResults({})
    setShowQuizResults(false)
    setRevealedItems([])
  }, [lessonId])

  useEffect(() => {
    if (!hasCurrentLesson) return
    visitSlide(lessonId, currentSlide)
    setRevealedItems([])
    globalThis.scrollTo?.({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [currentSlide, hasCurrentLesson, lessonId, reduceMotion, visitSlide])

  const slideProgress = currentLesson
    ? Math.round(((currentSlide + 1) / currentLesson.totalSlides) * 100)
    : 0

  const handleNext = () => {
    if (currentSlide < currentLesson.totalSlides - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      if (currentSlideData?.interactive?.type === 'quiz' && !showQuizResults) return
      completeModule(lessonId, calculateQuizScore())
      markAcademyModuleCompleted(lessonId)
      navigate('/academy', { state: { selectedAcademy: currentLesson.academyId || 'osint' } })
    }
  }

  const handleQuizAnswer = (questionIndex, selectedAnswer) => {
    const newResults = { ...quizResults }
    newResults[questionIndex] = selectedAnswer
    setQuizResults(newResults)
  }

  const toggleRevealedItem = (itemIndex) => {
    setRevealedItems(current => current.includes(itemIndex)
      ? current.filter(index => index !== itemIndex)
      : [...current, itemIndex])
  }

  const submitQuiz = () => {
    const score = calculateQuizScore()
    setShowQuizResults(true)
    recordQuiz(lessonId, score)
  }

  const calculateQuizScore = () => {
    if (!currentSlideData?.interactive || currentSlideData.interactive.type !== 'quiz') return 0
    
    const questions = currentSlideData.interactive.questions
    let correct = 0
    
    questions.forEach((question, index) => {
      if (quizResults[index] === question.correct) {
        correct++
      }
    })
    
    return Math.round((correct / questions.length) * 100)
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleBackToAcademy = () => {
    navigate('/academy', { state: { selectedAcademy: currentLesson?.academyId || 'osint' } })
  }

  const handleContentLinkClick = (event) => {
    const link = event.target.closest('a[href^="/"]')
    if (!link) return
    event.preventDefault()
    navigate(link.getAttribute('href'))
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target?.tagName?.toLowerCase()
      if (['input', 'textarea', 'select', 'button', 'a'].includes(tagName)) return

      if (event.key === 'ArrowLeft' && currentSlide > 0) {
        setCurrentSlide(slide => slide - 1)
      }

      if (event.key === 'ArrowRight' && currentSlide < (currentLesson?.totalSlides || 1) - 1) {
        setCurrentSlide(slide => slide + 1)
      }
    }

    globalThis.addEventListener?.('keydown', handleKeyDown)
    return () => globalThis.removeEventListener?.('keydown', handleKeyDown)
  }, [currentLesson?.totalSlides, currentSlide])

  if (!currentLesson) {
    return (
      <div className="lesson-error">
        <h2>Lección no encontrada</h2>
        <button onClick={handleBackToAcademy}>Volver a la Academia</button>
      </div>
    )
  }

  return (
    <div className="lesson-viewer">
      <div className="lesson-header">
        <button onClick={handleBackToAcademy} className="back-button">
          <ChevronLeft size={20} />
          Volver a la Academia
        </button>
        <div className="lesson-info">
          <h1>{currentLesson.title}</h1>
          <p>{currentLesson.description}</p>
        </div>
        <div className="lesson-progress" aria-label={`Progreso de la lección: ${slideProgress}%`}>
          <div className="lesson-progress__meta">
            <span>Diapositiva {currentSlide + 1} de {currentLesson.totalSlides}</span>
            <strong>{slideProgress}%</strong>
          </div>
          <div
            className="lesson-progress__track"
            role="progressbar"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={slideProgress}
          >
            <i
              className="lesson-progress__fill"
              style={{ width: `${slideProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="lesson-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            className="slide"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="slide-content">
              <div 
                className="slide-text"
                onClick={handleContentLinkClick}
                dangerouslySetInnerHTML={{ __html: safeSlideContent }}
              />
              
              {currentSlideData.interactive && (
                <div className="interactive-section">
                  {renderInteractiveComponent(currentSlideData.interactive)}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="lesson-navigation">
        <button 
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="nav-button prev"
        >
          <ChevronLeft size={20} />
          Anterior
        </button>
        
        <div className="slide-indicators">
          {Array.from({ length: currentLesson.totalSlides }).map((_, index) => (
            <button
              type="button"
              key={index}
              className={`indicator ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'completed' : ''}`}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir a la diapositiva ${index + 1}`}
              aria-current={index === currentSlide ? 'step' : undefined}
              title={`Diapositiva ${index + 1}`}
            />
          ))}
        </div>

        <button 
          onClick={handleNext}
          className="nav-button next"
          disabled={currentSlide === currentLesson.totalSlides - 1
            && currentSlideData?.interactive?.type === 'quiz'
            && !showQuizResults}
        >
          {currentSlide === currentLesson.totalSlides - 1
            ? (showQuizResults ? 'Finalizar módulo' : 'Completá la evaluación')
            : 'Siguiente'}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )

  function renderInteractiveComponent(interactive) {
    switch (interactive.type) {
      case 'icons':
        return (
          <div className="icons-showcase">
            {interactive.items.map((item, index) => (
              <motion.div
                key={index}
                className="icon-item"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.08, duration: reduceMotion ? 0 : 0.3 }}
              >
                <item.icon size={48} />
                <span>{item.label}</span>
              </motion.div>
            ))}
          </div>
        )
      
      case 'progress_bar':
        return (
          <div className="stats-bars">
            {interactive.items.map((item, index) => (
              <div key={index} className="stat-bar">
                <div className="stat-label">
                  <span>{item.label}</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="bar">
                  <motion.div
                    className="bar-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ delay: reduceMotion ? 0 : index * 0.12, duration: reduceMotion ? 0 : 0.7 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'quiz':
        return (
          <div className="quiz-container">
            {!showQuizResults ? (
              <>
                {interactive.questions.map((question, questionIndex) => (
                  <div key={questionIndex} className="quiz-question">
                    <h4>Pregunta {questionIndex + 1}:</h4>
                    <p>{question.question}</p>
                    <div className="quiz-options">
                      {question.options.map((option, optionIndex) => (
                        <label key={optionIndex} className="quiz-option">
                          <input
                            type="radio"
                            name={`question-${questionIndex}`}
                            value={optionIndex}
                            onChange={() => handleQuizAnswer(questionIndex, optionIndex)}
                            checked={quizResults[questionIndex] === optionIndex}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <button 
                  className="quiz-submit"
                  onClick={submitQuiz}
                  disabled={Object.keys(quizResults).length < interactive.questions.length}
                >
                  Enviar Respuestas
                </button>
              </>
            ) : (
              <div className="quiz-results">
                <h3>🎯 Resultados de la Autoevaluación</h3>
                <div className="score-display">
                  <div className="score-circle">
                    <span className="score-number">{calculateQuizScore()}%</span>
                  </div>
                  <p className="score-text">
                    {calculateQuizScore() >= 80 
                      ? "¡Excelente! Dominas este módulo" 
                      : calculateQuizScore() >= 60 
                      ? "Bien, pero puedes mejorar" 
                      : "Necesitas repasar el contenido"}
                  </p>
                </div>
                <div className="quiz-review">
                  {interactive.questions.map((question, questionIndex) => {
                    const isCorrect = quizResults[questionIndex] === question.correct
                    return (
                      <div key={questionIndex} className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}>
                        <h4>{question.question}</h4>
                        <p className="user-answer">
                          Tu respuesta: {question.options[quizResults[questionIndex]]}
                        </p>
                        {!isCorrect && (
                          <p className="correct-answer">
                            Respuesta correcta: {question.options[question.correct]}
                          </p>
                        )}
                        <p className="explanation">{question.explanation}</p>
                      </div>
                    )
                  })}
                </div>
                {calculateQuizScore() < 80 && (
                  <button 
                    className="retry-quiz"
                    onClick={() => {
                      setQuizResults({})
                      setShowQuizResults(false)
                    }}
                  >
                    Intentar de Nuevo
                  </button>
                )}
              </div>
            )}
          </div>
        )
      
      case 'dork_builder':
        return (
          <div className="interactive-section">
            <h4>🔍 Ejemplos de Google Dorks:</h4>
            <div className="dorks-examples">
              {interactive.examples.map((example, index) => (
                <div key={index} className="dork-example">
                  <code>{example}</code>
                  <p>Ejemplo de consulta avanzada</p>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'click_reveal':
        return (
          <div className="interactive-section">
            <h4>Explorá cada ámbito profesional</h4>
            <div className="reveal-grid">
              {interactive.items.map((item, index) => (
                <button
                  type="button"
                  key={item.trigger}
                  className={`reveal-card ${revealedItems.includes(index) ? 'is-open' : ''}`}
                  onClick={() => toggleRevealedItem(index)}
                  aria-expanded={revealedItems.includes(index)}
                >
                  <strong>{item.trigger}</strong>
                  <span>{revealedItems.includes(index) ? item.content : 'Ver aplicación'}</span>
                </button>
              ))}
            </div>
          </div>
        )
      
      case 'methodology_flow':
        return (
          <div className="interactive-section">
            <h4>Secuencia de trabajo</h4>
            <div className="workflow-steps workflow-steps--compact">
              {['Definir', 'Planificar', 'Recopilar', 'Analizar', 'Comunicar']
                .slice(0, interactive.steps)
                .map((step, index) => (
                  <div key={step} className="workflow-step">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{step}</strong>
                  </div>
                ))}
            </div>
          </div>
        )
      
      case 'ethics_quiz':
        return (
          <div className="interactive-section">
            <h4>Decisión ética guiada</h4>
            {interactive.questions.map((q, index) => (
              <div key={index} className="ethics-question">
                <p><strong>{q.question}</strong></p>
                <p>Respuesta recomendada: {q.correct}</p>
              </div>
            ))}
          </div>
        )
      
      case 'tool_demo':
        return (
          <div className="interactive-section">
            <h4>🛠️ Herramientas Destacadas:</h4>
            <div className="tools-showcase">
              {interactive.tools.map((tool, index) => (
                <div key={index} className="tool-item">
                  <strong>🔧 {tool}</strong>
                  <p>Herramienta esencial para OSINT</p>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'temporal_search':
        return (
          <div className="interactive-section">
            <h4>📅 Tipos de Búsqueda Temporal:</h4>
            <div className="search-types">
              {interactive.examples.map((type, index) => (
                <div key={index} className="search-type">
                  <span>🕒 {type}</span>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'generator_preview':
        return (
          <div className="interactive-section">
            <h4>⚡ Características del Generador:</h4>
            <div className="features-grid">
              {interactive.features.map((feature, index) => (
                <div key={index} className="feature-item">
                  <span>✨ {feature.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )
      
      case 'visual_stats':
        return (
          <div className="icons-showcase">
            {interactive.items?.map((item) => (
              <div key={item.label} className="icon-item">
                <item.icon size={32} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )

      case 'platform_stats':
        return (
          <div className="interactive-section">
            <h4>📊 Estadísticas de Plataformas:</h4>
            <div className="stats-showcase">
              {interactive.platforms?.map((platform, index) => (
                <div key={index} className="stat-item">
                  <strong>{platform.name}</strong>
                  <span>{platform.users} usuarios</span>
                </div>
              )) || <p>Datos de estadísticas de plataformas sociales</p>}
            </div>
          </div>
        )
      
      case 'facebook_search_demo':
      case 'twitter_search_demo':
      case 'instagram_search_demo':
      case 'linkedin_search_demo':
      case 'cross_platform_demo':
        return (
          <div className="interactive-section">
            <h4>🔍 Demo de Búsqueda en Redes Sociales:</h4>
            <div className="demo-content">
              <p>Técnicas específicas para buscar en esta plataforma social</p>
              <div className="search-tips">
                {interactive.techniques?.map((technique, index) => (
                  <div key={index} className="tip-item">
                    <span>💡 {technique}</span>
                  </div>
                )) || (
                  <div className="tip-item">
                    <span>💡 Usa operadores específicos de la plataforma</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'file_search_demo':
      case 'documentation_practice':
        return (
          <div className="interactive-section">
            <h4>📁 Demo de Búsqueda de Archivos:</h4>
            <div className="file-demo">
              <p>Ejemplos de búsqueda especializada de documentos</p>
              <div className="file-types">
                {interactive.fileTypes?.map((type, index) => (
                  <div key={index} className="file-type">
                    <code>filetype:{type}</code>
                  </div>
                )) || (
                  <div className="file-type">
                    <code>filetype:pdf</code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'exif_analysis_demo':
      case 'reverse_search_demo':
      case 'geolocation_demo':
      case 'manipulation_detection':
        return (
          <div className="interactive-section">
            <h4>🖼️ Análisis de Imágenes:</h4>
            <div className="image-analysis">
              <p>Técnicas avanzadas de verificación de imágenes</p>
              <div className="analysis-tools">
                {interactive.techniques?.map((technique, index) => (
                  <div key={index} className="analysis-tool">
                    <span>🔧 {technique.replace(/_/g, ' ')}</span>
                  </div>
                )) || interactive.engines?.map((engine, index) => (
                  <div key={index} className="analysis-tool">
                    <span>🌐 {engine}</span>
                  </div>
                )) || (
                  <div className="analysis-tool">
                    <span>🔧 Análisis de metadatos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'mindset_assessment':
      case 'source_evaluation':
      case 'ethical_scenarios':
      case 'bias_training':
        return (
          <div className="interactive-section">
            <h4>🧠 Desarrollo del Pensamiento Analítico:</h4>
            <div className="mindset-content">
              <p>Ejercicios para desarrollar habilidades de análisis crítico</p>
              <div className="mindset-principles">
                {interactive.principles?.map((principle, index) => (
                  <div key={index} className="principle-item">
                    <span>🎯 {principle}</span>
                  </div>
                )) || interactive.scenarios?.map((scenario, index) => (
                  <div key={index} className="principle-item">
                    <span>📋 {scenario}</span>
                  </div>
                )) || (
                  <div className="principle-item">
                    <span>🎯 Mantén objetividad en el análisis</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      
      case 'workflow_demo':
      case 'hypothesis_cycle':
        return (
          <div className="interactive-section">
            <h4>🔄 Flujo de Trabajo OSINT:</h4>
            <div className="workflow-content">
              <p>Metodología sistemática para investigaciones efectivas</p>
              <div className="workflow-steps">
                {interactive.steps?.map((step, index) => (
                  <div key={index} className="workflow-step">
                    <span>{index + 1}. {step}</span>
                  </div>
                )) || (
                  <div className="workflow-step">
                    <span>1. Planificar → 2. Recopilar → 3. Analizar → 4. Verificar</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }
}

export default LessonViewer
