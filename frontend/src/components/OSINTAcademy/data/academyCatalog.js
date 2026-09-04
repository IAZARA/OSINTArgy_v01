// Plain curriculum metadata: shared by progress, the dashboard and certificates.
export const ACADEMY_PASS_SCORE = 80

export const ACADEMY_COURSES = [
  {
    id: 'osint', title: 'Academia OSINT',
    description: 'Aprendé a buscar, contrastar perfiles e imágenes y documentar una investigación con criterio.',
    difficulty: 'principiante', color: 'primary',
    moduleIds: ['modulo1', 'modulo2', 'modulo3', 'modulo4', 'modulo5'],
    labIds: ['dork-simulator', 'mindmap', 'detective-game', 'audio'],
    passingScore: ACADEMY_PASS_SCORE, prerequisiteCourseIds: []
  },
  {
    id: 'infrastructure', title: 'Huella Digital e Infraestructura Defensiva',
    description: 'Interpretá dominios, DNS, certificados y correo público dentro de un alcance defensivo.',
    difficulty: 'intermedio', color: 'secondary',
    moduleIds: ['infra1', 'infra2', 'infra3', 'infra4', 'infra5'],
    labIds: ['infra-lab'], passingScore: ACADEMY_PASS_SCORE, prerequisiteCourseIds: []
  },
  {
    id: 'corporate', title: 'Investigación Corporativa y Fuentes Públicas',
    description: 'Conectá registros societarios, contrataciones y documentos públicos con evidencia trazable.',
    difficulty: 'intermedio', color: 'tertiary',
    moduleIds: ['corp1', 'corp2', 'corp3', 'corp4', 'corp5'],
    labIds: ['corp-lab'], passingScore: ACADEMY_PASS_SCORE, prerequisiteCourseIds: []
  },
  {
    id: 'verification', title: 'Verificación y Evidencia Digital',
    description: 'Reconstruí el origen de una afirmación, preservá evidencia y comunicá qué se puede sostener.',
    difficulty: 'intermedio', color: 'verification',
    moduleIds: ['verify1', 'verify2', 'verify3'],
    labIds: [], passingScore: ACADEMY_PASS_SCORE, prerequisiteCourseIds: []
  }
]

const lesson = (id, courseId, title, description, durationMinutes, difficulty, slideCount, topics) => ({
  id, courseId, title, description, durationMinutes, difficulty, slideCount, topics, type: 'lesson'
})

export const ACADEMY_LESSON_CATALOG = [
  lesson('modulo1', 'osint', 'Introducción a OSINT', 'Fundamentos, metodología, fuentes abiertas y límites éticos.', 20, 'principiante', 7, ['Fundamentos', 'Fuentes', 'Ética']),
  lesson('modulo2', 'osint', 'Búsqueda avanzada y Google Dorks', 'Construí consultas precisas y practicá operadores de búsqueda.', 25, 'intermedio', 7, ['Búsqueda', 'Operadores', 'Dorks']),
  lesson('modulo3', 'osint', 'Investigación en redes sociales', 'Contrastá perfiles públicos y evitá atribuciones apresuradas.', 30, 'intermedio', 7, ['Redes', 'Perfiles', 'Verificación']),
  lesson('modulo4', 'osint', 'Análisis de imágenes', 'Explorá metadatos, búsqueda inversa y geolocalización.', 35, 'avanzado', 7, ['EXIF', 'Imágenes', 'Geolocalización']),
  lesson('modulo5', 'osint', 'Mentalidad del analista', 'Poné a prueba hipótesis y reconocé sesgos de investigación.', 25, 'avanzado', 7, ['Hipótesis', 'Sesgos', 'Documentación']),
  lesson('infra1', 'infrastructure', 'Huella digital pública', 'Definí activos y un alcance de revisión responsable.', 18, 'principiante', 5, ['Alcance', 'Activos', 'Defensa']),
  lesson('infra2', 'infrastructure', 'Dominios, WHOIS y DNS', 'Interpretá registros DNS y autenticación de correo.', 22, 'intermedio', 5, ['DNS', 'Dominios', 'Correo']),
  lesson('infra3', 'infrastructure', 'Subdominios y certificados', 'Leé señales de exposición en certificados públicos.', 24, 'intermedio', 5, ['Certificados', 'Subdominios', 'CT']),
  lesson('infra4', 'infrastructure', 'Email y phishing defensivo', 'Evaluá señales de suplantación con contexto.', 24, 'intermedio', 5, ['Phishing', 'Email', 'Defensa']),
  lesson('infra5', 'infrastructure', 'SSL, headers y tecnologías', 'Convertí observaciones web en recomendaciones verificables.', 26, 'avanzado', 5, ['HTTPS', 'Headers', 'Reporte']),
  lesson('corp1', 'corporate', 'Alcance, ética y pregunta', 'Convertí una sospecha en una pregunta investigable.', 20, 'intermedio', 5, ['Alcance', 'Ética', 'Pregunta']),
  lesson('corp2', 'corporate', 'Identidad jurídica y registros', 'Diferenciá razones sociales, jurisdicciones y nombres comerciales.', 24, 'intermedio', 5, ['Sociedades', 'Registros', 'Identidad']),
  lesson('corp3', 'corporate', 'Boletín Oficial y cronologías', 'Reconstruí eventos y cambios societarios con fechas.', 24, 'intermedio', 5, ['Argentina', 'Boletín Oficial', 'Cronología']),
  lesson('corp4', 'corporate', 'Proveedores y contrataciones', 'Interpretá procesos de compra y datos abiertos.', 26, 'avanzado', 5, ['Argentina', 'Compras', 'Proveedores']),
  lesson('corp5', 'corporate', 'Vínculos, contraste e informe', 'Escribí conclusiones defendibles desde una matriz de evidencia.', 26, 'avanzado', 5, ['Vínculos', 'Evidencia', 'Informe']),
  lesson('verify1', 'verification', 'Origen, contexto y contraste', 'Separá una afirmación de sus pruebas y reconocé fuentes que se copian.', 20, 'intermedio', 5, ['Fuentes', 'Verificación', 'Desinformación']),
  lesson('verify2', 'verification', 'Preservación y trazabilidad', 'Registrá URL, fechas, archivos y transformaciones sin perder el contexto.', 25, 'intermedio', 5, ['Evidencia', 'Hash', 'Preservación']),
  lesson('verify3', 'verification', 'Del indicio a la conclusión', 'Resolvé un caso ficticio, contrastá hipótesis y redactá un cierre prudente.', 25, 'intermedio', 5, ['Práctica', 'Hipótesis', 'Informe'])
]

export const getAcademyLessonDefinition = (id) => ACADEMY_LESSON_CATALOG.find(module => module.id === id)
