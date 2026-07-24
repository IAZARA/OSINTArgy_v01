import {
  Building2,
  CalendarDays,
  ClipboardCheck,
  Database,
  FileSearch,
  FileText,
  Landmark,
  Link2,
  Network,
  Scale,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react'

export const corporateAcademy = {
  id: 'corporate',
  title: 'Investigación Corporativa y Fuentes Públicas',
  description: 'Transformá registros societarios, contrataciones y documentos públicos en investigaciones trazables',
  icon: Building2,
  modules: 6,
  duration: '2.5 horas',
  difficulty: 'intermedio',
  color: 'tertiary'
}

export const corporateModules = [
  {
    id: 'corp1',
    title: 'Módulo 1: Alcance, Ética y Pregunta',
    description: 'Definí una pregunta investigable, límites claros y un registro reproducible del trabajo',
    icon: ShieldCheck,
    duration: '20 min',
    difficulty: 'intermedio',
    type: 'lesson'
  },
  {
    id: 'corp2',
    title: 'Módulo 2: Identidad Jurídica y Registros',
    description: 'Diferenciá nombres comerciales, razones sociales, jurisdicciones y registros oficiales',
    icon: Landmark,
    duration: '24 min',
    difficulty: 'intermedio',
    type: 'lesson'
  },
  {
    id: 'corp3',
    title: 'Módulo 3: Boletín Oficial y Cronologías',
    description: 'Reconstruí autoridades, cambios societarios y eventos con contexto temporal',
    icon: CalendarDays,
    duration: '24 min',
    difficulty: 'intermedio',
    type: 'lesson'
  },
  {
    id: 'corp4',
    title: 'Módulo 4: Proveedores y Contrataciones',
    description: 'Leé procesos de compra, adjudicaciones y datos abiertos sin confundir señales con pruebas',
    icon: Database,
    duration: '26 min',
    difficulty: 'avanzado',
    type: 'lesson'
  },
  {
    id: 'corp5',
    title: 'Módulo 5: Vínculos, Contraste e Informe',
    description: 'Construí una matriz de evidencia y redactá conclusiones defendibles',
    icon: Network,
    duration: '26 min',
    difficulty: 'avanzado',
    type: 'lesson'
  },
  {
    id: 'corp-lab',
    title: 'Laboratorio: Expediente Río Claro',
    description: 'Resolvé un caso ficticio y generá un informe de debida diligencia en Markdown',
    icon: ClipboardCheck,
    duration: '15 min',
    difficulty: 'intermedio',
    type: 'corporate-lab'
  }
]

export const corporateLessons = {
  corp1: {
    academyId: 'corporate',
    title: 'Módulo 1: Alcance, Ética y Pregunta de Investigación',
    description: 'Cómo convertir una sospecha amplia en una investigación responsable y verificable',
    totalSlides: 5,
    slides: [
      {
        id: 1,
        title: 'Empezar por una pregunta',
        content: `
          <h2>Una investigación no empieza por una persona</h2>
          <p>Empieza por una <strong>pregunta concreta</strong> que pueda responderse con fuentes públicas. Por ejemplo: “¿Qué entidades aparecen formalmente vinculadas con una contratación determinada entre enero y junio?”.</p>
          <p>Una pregunta bien formulada define período, entidades, jurisdicción y tipo de evidencia. También evita recolectar información personal que no aporta al objetivo.</p>
          <div class="highlight-box">
            <p>🎯 <strong>Regla práctica:</strong> si no podés explicar por qué un dato es necesario, no lo recolectes.</p>
          </div>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Search, label: 'Pregunta' },
            { icon: Building2, label: 'Entidad' },
            { icon: CalendarDays, label: 'Período' },
            { icon: Scale, label: 'Límite' }
          ]
        }
      },
      {
        id: 2,
        title: 'Alcance y criterios de exclusión',
        content: `
          <h2>Escribir el alcance antes de abrir pestañas</h2>
          <p>El alcance debe dejar por escrito qué se busca, qué fuentes están permitidas, qué período se revisa y qué acciones quedan fuera.</p>
          <ul>
            <li><strong>Incluido:</strong> registros oficiales, sitios institucionales, archivos públicos y medios identificados.</li>
            <li><strong>Excluido:</strong> accesos no autorizados, credenciales, engaño, contacto encubierto y datos familiares irrelevantes.</li>
            <li><strong>Criterio de cierre:</strong> evidencia suficiente, contradicción no resoluble o agotamiento de fuentes razonables.</li>
          </ul>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Pregunta y período', percentage: 30 },
            { label: 'Fuentes permitidas', percentage: 25 },
            { label: 'Exclusiones', percentage: 25 },
            { label: 'Criterio de cierre', percentage: 20 }
          ]
        }
      },
      {
        id: 3,
        title: 'Privacidad y minimización',
        content: `
          <h2>Que un dato sea público no lo vuelve automáticamente pertinente</h2>
          <p>Una investigación corporativa puede encontrar domicilios, documentos o relaciones personales. El trabajo ético consiste en conservar sólo lo necesario para demostrar un hecho relevante.</p>
          <div class="ethics-rules">
            <div class="rule-item good">
              <h3>✅ Documentar</h3>
              <ul>
                <li>Cargo y período de una autoridad.</li>
                <li>Fuente, URL y fecha de consulta.</li>
                <li>Relación societaria expresamente publicada.</li>
              </ul>
            </div>
            <div class="rule-item bad">
              <h3>❌ Evitar</h3>
              <ul>
                <li>Datos de familiares sin relevancia.</li>
                <li>Domicilios particulares en el informe final.</li>
                <li>Afirmaciones sobre identidad basadas sólo en homónimos.</li>
              </ul>
            </div>
          </div>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: ShieldCheck, label: 'Minimizar' },
            { icon: Scale, label: 'Justificar' },
            { icon: FileText, label: 'Documentar' },
            { icon: Users, label: 'Proteger' }
          ]
        }
      },
      {
        id: 4,
        title: 'Bitácora reproducible',
        content: `
          <h2>Registrar para poder explicar</h2>
          <p>Una bitácora mínima incluye consulta realizada, fuente, fecha y hora, resultado, captura o archivo y observaciones. Esto permite repetir el camino y distinguir lo visto de lo inferido.</p>
          <ol>
            <li>Asigná un identificador corto a cada evidencia.</li>
            <li>Guardá el enlace exacto y la fecha de acceso.</li>
            <li>Registrá qué afirmación respalda y qué no demuestra.</li>
            <li>Anotá cambios, errores y búsquedas sin resultado.</li>
          </ol>
          <div class="highlight-box">
            <p>🧭 Una búsqueda sin resultado también es información metodológica, pero nunca prueba que algo no exista.</p>
          </div>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Fuente y fecha', percentage: 30 },
            { label: 'Captura o archivo', percentage: 25 },
            { label: 'Afirmación respaldada', percentage: 30 },
            { label: 'Limitaciones', percentage: 15 }
          ]
        }
      },
      {
        id: 5,
        title: 'Autoevaluación: alcance',
        content: `
          <h2>Comprobá tu criterio inicial</h2>
          <p>Elegí la respuesta que mantiene la investigación enfocada y defendible.</p>
        `,
        interactive: {
          type: 'quiz',
          questions: [
            {
              question: '¿Cuál es la mejor pregunta de investigación?',
              options: [
                'Encontrar todo sobre los directores de una empresa',
                'Identificar vínculos societarios publicados durante un período definido',
                'Buscar datos personales hasta encontrar algo llamativo'
              ],
              correct: 1,
              explanation: 'La segunda opción define objeto, evidencia y alcance sin recolectar información indiscriminada.'
            },
            {
              question: '¿Qué debería incluir una bitácora?',
              options: ['Sólo la conclusión', 'Fuente, fecha, consulta y resultado', 'Únicamente capturas sin contexto'],
              correct: 1,
              explanation: 'La trazabilidad exige poder reconstruir cómo se llegó a cada hallazgo.'
            },
            {
              question: '¿Qué significa no encontrar un registro?',
              options: [
                'La entidad no existe',
                'La búsqueda no produjo resultado en esa fuente y momento',
                'La entidad ocultó información'
              ],
              correct: 1,
              explanation: 'La ausencia de resultado debe describirse sin convertirla en una afirmación absoluta.'
            }
          ]
        }
      }
    ]
  },
  corp2: {
    academyId: 'corporate',
    title: 'Módulo 2: Identidad Jurídica y Registros Oficiales',
    description: 'Cómo distinguir entidades y leer fuentes registrales con contexto',
    totalSlides: 5,
    slides: [
      {
        id: 1,
        title: 'Nombre comercial no es razón social',
        content: `
          <h2>Resolver la identidad antes de conectar datos</h2>
          <p>Una marca, un dominio y una razón social pueden pertenecer a entidades diferentes. Antes de atribuir una contratación o una autoridad, verificá la denominación completa, jurisdicción y período.</p>
          <ul>
            <li><strong>Nombre comercial:</strong> cómo se presenta una organización.</li>
            <li><strong>Razón social:</strong> denominación jurídica registrada.</li>
            <li><strong>Identificador fiscal:</strong> ayuda a separar homónimos.</li>
            <li><strong>Jurisdicción:</strong> determina dónde buscar el registro primario.</li>
          </ul>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Building2, label: 'Razón social' },
            { icon: FileSearch, label: 'Identificador' },
            { icon: Landmark, label: 'Jurisdicción' },
            { icon: Link2, label: 'Marca' }
          ]
        }
      },
      {
        id: 2,
        title: 'Registro Nacional de Sociedades',
        content: `
          <h2>Una puerta de entrada, no una respuesta final</h2>
          <p>El <a href="https://www.argentina.gob.ar/justicia/registro-nacional-sociedades" target="_blank" rel="noopener noreferrer">Registro Nacional de Sociedades</a> permite consultar personas jurídicas por CUIT/CDI o razón social.</p>
          <p>La propia fuente informa fechas y condiciones de actualización. Por eso, cada resultado debe registrarse con fecha de consulta y contrastarse con la jurisdicción o publicación que corresponda.</p>
          <div class="highlight-box">
            <p>📌 Anotá siempre la denominación exacta devuelta por la fuente y cualquier advertencia de actualización.</p>
          </div>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Denominación exacta', percentage: 30 },
            { label: 'Identificador', percentage: 25 },
            { label: 'Jurisdicción', percentage: 25 },
            { label: 'Fecha de actualización', percentage: 20 }
          ]
        }
      },
      {
        id: 3,
        title: 'Identificadores y homónimos',
        content: `
          <h2>No unir entidades sólo porque comparten un nombre</h2>
          <p>Las coincidencias de nombres son pistas. Para afirmar identidad se necesitan atributos adicionales compatibles: identificador, jurisdicción, domicilio legal institucional, autoridades o secuencia temporal.</p>
          <div class="applications-grid">
            <div class="app-card">
              <h3>Coincidencia fuerte</h3>
              <p>Misma razón social e identificador en dos fuentes oficiales contemporáneas.</p>
            </div>
            <div class="app-card">
              <h3>Coincidencia débil</h3>
              <p>Mismo nombre abreviado en una red social y una nota periodística.</p>
            </div>
          </div>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Search, label: 'Coincidencia' },
            { icon: Link2, label: 'Corroboración' },
            { icon: Scale, label: 'Confianza' },
            { icon: FileText, label: 'Evidencia' }
          ]
        }
      },
      {
        id: 4,
        title: 'Matriz de identidad',
        content: `
          <h2>Comparar atributos antes de fusionar registros</h2>
          <p>Creá una fila por fuente y columnas para denominación, identificador, jurisdicción, estado, domicilio legal institucional y fecha. Marcá coincidencias, diferencias y campos ausentes.</p>
          <p>Si dos registros no pueden reconciliarse, mantenelos como entidades separadas y documentá la duda. Una investigación confiable conserva incertidumbre cuando la evidencia no alcanza.</p>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Identificador', percentage: 35 },
            { label: 'Jurisdicción', percentage: 25 },
            { label: 'Temporalidad', percentage: 25 },
            { label: 'Nombre', percentage: 15 }
          ]
        }
      },
      {
        id: 5,
        title: 'Autoevaluación: identidad',
        content: `
          <h2>Comprobá si podés distinguir entidades</h2>
          <p>Priorizá identificadores y contexto por encima de similitudes superficiales.</p>
        `,
        interactive: {
          type: 'quiz',
          questions: [
            {
              question: '¿Qué atributo separa mejor dos sociedades homónimas?',
              options: ['El color del logo', 'El identificador fiscal y la jurisdicción', 'La cantidad de seguidores'],
              correct: 1,
              explanation: 'Los identificadores y la jurisdicción aportan una base registral mucho más sólida.'
            },
            {
              question: '¿Cómo debe tratarse una advertencia de actualización?',
              options: ['Ignorarla', 'Documentarla y corroborar con otra fuente', 'Asumir que todo el registro es falso'],
              correct: 1,
              explanation: 'Las limitaciones de la fuente modifican la confianza y deben formar parte del análisis.'
            },
            {
              question: '¿Una marca prueba por sí sola qué sociedad opera un servicio?',
              options: ['Sí', 'No, requiere atribución adicional', 'Sólo si tiene sitio web'],
              correct: 1,
              explanation: 'Marca, dominio y persona jurídica pueden no coincidir.'
            }
          ]
        }
      }
    ]
  },
  corp3: {
    academyId: 'corporate',
    title: 'Módulo 3: Boletín Oficial y Cronologías Societarias',
    description: 'Cómo reconstruir eventos, cargos y cambios sin perder el contexto temporal',
    totalSlides: 5,
    slides: [
      {
        id: 1,
        title: 'Publicaciones como eventos',
        content: `
          <h2>Leer una publicación en su fecha</h2>
          <p>Una constitución, designación o modificación publicada describe un evento concreto. No demuestra automáticamente que la misma situación siga vigente años después.</p>
          <p>Registrá fecha del acto, fecha de publicación, entidad, personas mencionadas, rol y duración declarada. Separar estas fechas evita presentar una autoridad histórica como actual.</p>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: CalendarDays, label: 'Fecha del acto' },
            { icon: FileText, label: 'Publicación' },
            { icon: Users, label: 'Autoridades' },
            { icon: Building2, label: 'Entidad' }
          ]
        }
      },
      {
        id: 2,
        title: 'Construir una cronología',
        content: `
          <h2>De documentos aislados a secuencia verificable</h2>
          <ol>
            <li>Normalizá todas las fechas al mismo formato.</li>
            <li>Separá fecha del documento, publicación y vigencia.</li>
            <li>Vinculá cada evento con su evidencia.</li>
            <li>Marcá períodos sin información como vacíos, no como continuidad.</li>
          </ol>
          <div class="highlight-box">
            <p>🕒 Una cronología muestra cambios y también revela qué períodos necesitan más búsqueda.</p>
          </div>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Normalizar fechas', percentage: 25 },
            { label: 'Ordenar eventos', percentage: 25 },
            { label: 'Vincular evidencia', percentage: 30 },
            { label: 'Marcar vacíos', percentage: 20 }
          ]
        }
      },
      {
        id: 3,
        title: 'Roles y vigencia',
        content: `
          <h2>Nombrado, vigente y vinculado no son sinónimos</h2>
          <p>Una persona puede aparecer como accionista, director, gerente, apoderado o firmante. Cada rol tiene un significado diferente y debe describirse con las palabras de la fuente.</p>
          <p>Para afirmar vigencia, buscá actos posteriores, duración del mandato y posibles reemplazos. Si sólo existe una publicación histórica, redactá: “fue designado en…” en lugar de “es director”.</p>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Users, label: 'Rol' },
            { icon: CalendarDays, label: 'Vigencia' },
            { icon: FileSearch, label: 'Acto posterior' },
            { icon: Scale, label: 'Redacción' }
          ]
        }
      },
      {
        id: 4,
        title: 'Archivo y trazabilidad',
        content: `
          <h2>Preservar sin alterar</h2>
          <p>Guardá el documento o captura con nombre consistente, URL, fecha de consulta y referencia interna. Si una publicación puede cambiar o desaparecer, agregá una copia archivada cuando la fuente y sus términos lo permitan.</p>
          <p>No recortes una captura de modo que elimine fecha, encabezado o contexto. El archivo debe permitir que otra persona entienda qué estaba viendo.</p>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Documento original', percentage: 35 },
            { label: 'URL y fecha', percentage: 30 },
            { label: 'Contexto visible', percentage: 20 },
            { label: 'Referencia interna', percentage: 15 }
          ]
        }
      },
      {
        id: 5,
        title: 'Autoevaluación: cronología',
        content: `
          <h2>Revisá temporalidad y lenguaje</h2>
          <p>Elegí conclusiones que no excedan lo publicado.</p>
        `,
        interactive: {
          type: 'quiz',
          questions: [
            {
              question: 'Una designación publicada en 2021 permite afirmar que la persona sigue en el cargo hoy?',
              options: ['Sí, siempre', 'No sin revisar vigencia y actos posteriores', 'Sí, si aparece el nombre completo'],
              correct: 1,
              explanation: 'La publicación prueba un evento histórico, no necesariamente el estado actual.'
            },
            {
              question: '¿Cómo se trata un período sin documentos?',
              options: ['Como continuidad automática', 'Como un vacío de información', 'Como prueba de renuncia'],
              correct: 1,
              explanation: 'La ausencia de evidencia debe conservarse como una limitación.'
            },
            {
              question: '¿Qué fecha debe conservarse?',
              options: ['Sólo la de descarga', 'Acto, publicación y consulta cuando estén disponibles', 'La más reciente'],
              correct: 1,
              explanation: 'Cada fecha responde una pregunta temporal distinta.'
            }
          ]
        }
      }
    ]
  },
  corp4: {
    academyId: 'corporate',
    title: 'Módulo 4: Proveedores y Contrataciones Públicas',
    description: 'Cómo interpretar procesos, adjudicaciones y patrones sin sobredimensionar señales',
    totalSlides: 5,
    slides: [
      {
        id: 1,
        title: 'El ciclo de una contratación',
        content: `
          <h2>No mirar sólo el monto final</h2>
          <p>Una contratación puede incluir convocatoria, pliegos, ofertas, evaluación, adjudicación, contrato y ejecución. Cada etapa responde preguntas diferentes.</p>
          <p>El portal <a href="https://www.argentina.gob.ar/comprar" target="_blank" rel="noopener noreferrer">COMPR.AR</a> publica y gestiona procesos de contratación electrónica de la Administración Pública Nacional.</p>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Convocatoria', percentage: 15 },
            { label: 'Ofertas', percentage: 20 },
            { label: 'Evaluación', percentage: 25 },
            { label: 'Adjudicación y contrato', percentage: 40 }
          ]
        }
      },
      {
        id: 2,
        title: 'Datos abiertos y contexto',
        content: `
          <h2>Comparar procesos con una estructura común</h2>
          <p>El <a href="https://www.argentina.gob.ar/node/178068" target="_blank" rel="noopener noreferrer">Estándar de Datos para las Contrataciones Abiertas</a> busca conectar datos de las distintas etapas y facilitar su reutilización.</p>
          <p>Antes de comparar montos, verificá moneda, fecha, organismo, procedimiento, estado y alcance. Una cifra sin esos atributos puede llevar a conclusiones incorrectas.</p>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Database, label: 'Datos abiertos' },
            { icon: CalendarDays, label: 'Fecha' },
            { icon: Landmark, label: 'Organismo' },
            { icon: FileText, label: 'Procedimiento' }
          ]
        }
      },
      {
        id: 3,
        title: 'Atribuir al proveedor correcto',
        content: `
          <h2>Volver a resolver identidad</h2>
          <p>La adjudicación debe vincularse con la entidad jurídica correcta. Contrastá razón social, identificador, jurisdicción y estado del proceso.</p>
          <p>Si el nombre aparece abreviado o con errores, registrá la variante y explicá cómo resolviste la equivalencia. No atribuyas contratos por similitud de nombre.</p>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Identificador', percentage: 35 },
            { label: 'Razón social', percentage: 25 },
            { label: 'Proceso', percentage: 25 },
            { label: 'Jurisdicción', percentage: 15 }
          ]
        }
      },
      {
        id: 4,
        title: 'Patrones no son irregularidades',
        content: `
          <h2>Formular hipótesis comprobables</h2>
          <p>Repetición de adjudicaciones, pocos oferentes o montos cercanos pueden justificar nuevas preguntas, pero no prueban por sí solos una irregularidad.</p>
          <div class="applications-grid">
            <div class="app-card">
              <h3>Hecho</h3>
              <p>La fuente registra tres adjudicaciones a la misma entidad en el período analizado.</p>
            </div>
            <div class="app-card">
              <h3>Hipótesis</h3>
              <p>La concentración podría requerir comparar competencia, objeto y condiciones de cada proceso.</p>
            </div>
          </div>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Database, label: 'Hecho' },
            { icon: Search, label: 'Patrón' },
            { icon: Link2, label: 'Contraste' },
            { icon: Scale, label: 'Hipótesis' }
          ]
        }
      },
      {
        id: 5,
        title: 'Autoevaluación: contrataciones',
        content: `
          <h2>Interpretá sin sobreactuar</h2>
          <p>Elegí la afirmación respaldada por la evidencia disponible.</p>
        `,
        interactive: {
          type: 'quiz',
          questions: [
            {
              question: '¿Qué debe verificarse antes de comparar dos montos?',
              options: ['Sólo el proveedor', 'Moneda, fecha, alcance y estado', 'El diseño del portal'],
              correct: 1,
              explanation: 'Los montos sólo son comparables cuando comparten contexto suficiente.'
            },
            {
              question: '¿Tres adjudicaciones prueban una irregularidad?',
              options: ['Sí', 'No, son un patrón que requiere contexto', 'Sólo si son del mismo año'],
              correct: 1,
              explanation: 'La repetición puede orientar nuevas búsquedas, pero no demuestra por sí sola conducta indebida.'
            },
            {
              question: '¿Cómo se atribuye correctamente una adjudicación?',
              options: ['Por nombre parecido', 'Con identificador y datos del proceso', 'Por una publicación en redes'],
              correct: 1,
              explanation: 'La atribución necesita resolver identidad y conservar la referencia del proceso.'
            }
          ]
        }
      }
    ]
  },
  corp5: {
    academyId: 'corporate',
    title: 'Módulo 5: Vínculos, Contraste e Informe',
    description: 'Cómo pasar de evidencias dispersas a conclusiones transparentes',
    totalSlides: 5,
    slides: [
      {
        id: 1,
        title: 'Grafo con evidencia',
        content: `
          <h2>Cada vínculo necesita respaldo</h2>
          <p>En un mapa relacional, los nodos representan entidades y las aristas representan relaciones. Una línea sin fuente es sólo una idea visual.</p>
          <p>Etiquetá cada relación con tipo, período, fuente y nivel de confianza. Mantené separadas las relaciones societarias, contractuales, laborales y de coincidencia.</p>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Building2, label: 'Entidad' },
            { icon: Users, label: 'Persona' },
            { icon: Link2, label: 'Relación' },
            { icon: FileSearch, label: 'Fuente' }
          ]
        }
      },
      {
        id: 2,
        title: 'Hecho, hipótesis y vacío',
        content: `
          <h2>Tres categorías para pensar mejor</h2>
          <ul>
            <li><strong>Hecho:</strong> afirmación directamente respaldada por evidencia identificada.</li>
            <li><strong>Hipótesis:</strong> explicación posible que todavía requiere pruebas.</li>
            <li><strong>Vacío:</strong> pregunta relevante para la que no hay información suficiente.</li>
          </ul>
          <div class="highlight-box">
            <p>🧠 Una buena investigación no es la que elimina toda duda, sino la que muestra con precisión dónde empieza.</p>
          </div>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Hechos trazables', percentage: 45 },
            { label: 'Hipótesis explícitas', percentage: 25 },
            { label: 'Vacíos documentados', percentage: 20 },
            { label: 'Próximos pasos', percentage: 10 }
          ]
        }
      },
      {
        id: 3,
        title: 'Triangulación',
        content: `
          <h2>Fuentes diferentes para preguntas diferentes</h2>
          <p>Dos páginas que copian el mismo comunicado no son dos confirmaciones independientes. Buscá fuentes con origen y función distintos: registro, documento contractual, sitio institucional, archivo y cobertura periodística.</p>
          <p>Cuando las fuentes discrepan, no elijas silenciosamente una. Registrá la contradicción, compará fechas y explicá cuál resulta más adecuada para la afirmación.</p>
        `,
        interactive: {
          type: 'icons',
          items: [
            { icon: Landmark, label: 'Registro' },
            { icon: FileText, label: 'Documento' },
            { icon: Database, label: 'Dataset' },
            { icon: Search, label: 'Contraste' }
          ]
        }
      },
      {
        id: 4,
        title: 'Estructura del informe',
        content: `
          <h2>Escribir para que otra persona pueda verificar</h2>
          <ol>
            <li><strong>Pregunta y alcance:</strong> qué se investigó y qué quedó fuera.</li>
            <li><strong>Metodología:</strong> fuentes, período y limitaciones.</li>
            <li><strong>Hallazgos:</strong> hechos con referencias concretas.</li>
            <li><strong>Hipótesis y vacíos:</strong> sin presentarlos como certezas.</li>
            <li><strong>Próximos pasos:</strong> verificaciones específicas y proporcionales.</li>
          </ol>
          <p>Usá lenguaje descriptivo. Evitá adjetivos acusatorios y conclusiones sobre intención cuando las fuentes sólo muestran relaciones o eventos.</p>
        `,
        interactive: {
          type: 'progress_bar',
          items: [
            { label: 'Alcance', percentage: 20 },
            { label: 'Metodología', percentage: 20 },
            { label: 'Hallazgos', percentage: 35 },
            { label: 'Límites y próximos pasos', percentage: 25 }
          ]
        }
      },
      {
        id: 5,
        title: 'Autoevaluación: informe',
        content: `
          <h2>Elegí conclusiones defendibles</h2>
          <p>La precisión del lenguaje es parte de la calidad de la evidencia.</p>
        `,
        interactive: {
          type: 'quiz',
          questions: [
            {
              question: '¿Qué necesita una relación en un grafo?',
              options: ['Un color llamativo', 'Tipo, período y evidencia', 'Dos nombres similares'],
              correct: 1,
              explanation: 'La visualización debe conservar la trazabilidad de cada vínculo.'
            },
            {
              question: '¿Cómo se presenta una explicación todavía no comprobada?',
              options: ['Como hecho probable', 'Como hipótesis y con pruebas pendientes', 'Se omite'],
              correct: 1,
              explanation: 'Nombrar la incertidumbre evita que una inferencia se convierta en una acusación.'
            },
            {
              question: '¿Dos notas que reproducen el mismo comunicado son corroboración independiente?',
              options: ['Sí', 'No, comparten el mismo origen', 'Sí, si tienen títulos distintos'],
              correct: 1,
              explanation: 'La independencia depende del origen de la información, no de la cantidad de páginas.'
            }
          ]
        }
      }
    ]
  }
}

export const corporateLessonIds = Object.keys(corporateLessons)
