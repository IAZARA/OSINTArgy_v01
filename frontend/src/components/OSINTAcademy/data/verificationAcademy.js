// Original teaching scenarios. All entities and events in the exercises are fictional.
const references = {
  berkeley: { title: 'Berkeley Protocol · Berkeley / OHCHR', url: 'https://humanrights.berkeley.edu/publications/berkeley-protocol-on-digital-open-source-investigations/' },
  hash: { title: 'Función hash · NIST', url: 'https://csrc.nist.gov/glossary/term/hash_function' },
  provenance: { title: 'Procedencia y Content Credentials · C2PA', url: 'https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html' },
  imagery: { title: 'Evaluación de imágenes · Berkeley Human Rights Center', url: 'https://humanrights.berkeley.edu/publications/evaluating-digital-open-source-imagery-a-guide-for-judges-and-fact-finders/' }
}
const question = (question, options, correct, explanation) => ({ question, options, correct, explanation })
const assessment = questions => ({ id: 5, title: 'Evaluación aplicada', content: '<h2>Poné a prueba tu criterio</h2><p>Respondé las cinco situaciones. Necesitás al menos cuatro respuestas correctas (80%) y haber recorrido todas las lecciones. Podés volver a intentar después de leer las explicaciones.</p>', interactive: { type: 'quiz', questions } })

export const verificationLessons = {
  verify1: {
    academyId: 'verification', title: 'Origen, contexto y contraste',
    description: 'Cómo pasar de un contenido viral a una afirmación verificable', totalSlides: 5,
    sources: [references.berkeley, references.imagery],
    slides: [
      {
        id: 1, title: 'Una afirmación por vez',
        content: `<h2>Desarmá la afirmación antes de buscar</h2><p>“Este video prueba que hoy cerró el puente de Puerto Norte” combina una ubicación, una fecha, un evento y una interpretación. El primer paso de este ejercicio es separarlos.</p><ul><li><strong>Qué:</strong> un cierre total del puente.</li><li><strong>Dónde:</strong> un puente identificable de Puerto Norte.</li><li><strong>Cuándo:</strong> la fecha local a la que se refiere “hoy”.</li><li><strong>Con qué evidencia:</strong> un video y el texto que lo acompaña.</li></ul><div class="highlight-box"><p>Caso ficticio de esta ruta: todas las localidades, cuentas y documentos de los ejercicios fueron creados para aprender.</p></div><p>Escribí qué observación podría refutar cada parte. Un clip auténtico de otra fecha puede no sostener el texto que lo acompaña.</p>`
      },
      {
        id: 2, title: 'Seguí el origen de la publicación',
        content: `<h2>Reconstruí el recorrido, no cuentes repeticiones</h2><p>En el caso de Puerto Norte, una cuenta publica el clip, un portal lo incrusta y otras dos cuentas comparten la nota. Para este análisis tenés <strong>una cadena de difusión</strong>; todavía no son cuatro observaciones independientes.</p><p>Armá una tabla con cada URL, autor visible, fecha y contenido que cita. Si no encontrás el original, registrá “primera publicación localizada”, sin convertirla en “primera publicación existente”.</p><div class="highlight-box"><p>Práctica: A comparte a B y B cita a C. Dibujá A → B → C. Buscá ahora una fuente D que tenga evidencia propia, como una fotografía desde otro punto o un aviso del operador del puente.</p></div><p>Conservá también lo que contradice tu hipótesis: una publicación inconveniente puede ser la pieza más útil de la investigación.</p>`
      },
      {
        id: 3, title: 'Fecha, lugar y contenido',
        content: `<h2>Tres preguntas distintas</h2><p>Para evaluar una imagen conviene revisar su origen, metadatos y señales de lugar y tiempo. Una fecha de publicación no demuestra por sí misma la fecha de captura.</p><ul><li><strong>Lugar:</strong> anotá rasgos observables y comparalos con referencias identificadas; no alcanza una apariencia similar.</li><li><strong>Tiempo:</strong> distinguí captura, publicación y momento de consulta.</li><li><strong>Contenido:</strong> separá lo visible de lo que agregó el epígrafe.</li></ul><p>En el ejercicio, el video muestra una barrera baja. Eso sostiene “se ve una barrera baja”, pero no determina la duración del cierre ni su motivo. Pedí evidencia específica para cada salto de interpretación.</p>`
      },
      {
        id: 4, title: 'Elegí el siguiente paso',
        content: `<h2>Investigá lo que cambia la conclusión</h2><p>Tenés veinte minutos para revisar el caso. Priorizá estas acciones: localizar una publicación anterior, identificar el puente y buscar un aviso del operador con fecha. Coleccionar cien republicaciones aporta menos a las preguntas pendientes.</p><p>Registrá el resultado de cada intento, incluso si fue negativo: consulta, fuente, fecha y límite. “No encontré un aviso con estas consultas” es un resultado acotado; “no hubo aviso” necesita otra evidencia.</p><div class="highlight-box"><p>Ficha propuesta: afirmación · evidencia que la apoya · evidencia que la contradice · vacíos · próxima comprobación.</p></div>`,
        interactive: { type: 'click_reveal', items: [
          { trigger: 'El portal y la cuenta muestran el mismo clip', content: 'Rastreá a quién citan. La repetición del mismo material no agrega una captura independiente.' },
          { trigger: 'Una foto antigua tiene el mismo puente', content: 'Sirve para estudiar el lugar; su fecha antigua no determina cuándo se filmó el nuevo clip.' },
          { trigger: 'El operador anuncia obras para otro día', content: 'Es una discrepancia que investigar. No la borres para acomodar el relato.' }
        ] }
      },
      assessment([
        question('Cuatro portales citan el mismo video de una cuenta. ¿Qué tenés por ahora?', ['Cuatro testigos independientes', 'Una cadena de difusión que necesita contraste', 'Prueba de que el video es falso'], 1, 'Distintas páginas pueden depender de una sola fuente. Seguí el material hasta su origen.'),
        question('El clip se publicó hoy. ¿Qué fecha queda establecida?', ['La fecha de publicación observada', 'La fecha de captura del video', 'La fecha de cierre del puente'], 0, 'Publicación, captura y evento son momentos diferentes. El texto no reemplaza evidencia temporal.'),
        question('Encontraste un video idéntico publicado el año anterior. ¿Qué cambia?', ['Todo lo que dice esa cuenta es falso', 'El lugar necesariamente es otro', 'La atribución del clip al evento de hoy necesita corregirse'], 2, 'La aparición anterior contradice que el clip sea una captura exclusiva del evento actual; no permite generalizar sobre la cuenta.'),
        question('Una búsqueda no devuelve un aviso del operador. ¿Qué escribís?', ['El operador nunca emitió avisos', 'No localicé avisos con las consultas y fuentes registradas', 'El puente no existe'], 1, 'La ausencia en tu búsqueda describe su alcance y sus límites, no demuestra inexistencia universal.'),
        question('¿Qué evidencia aporta más independencia?', ['Otro sitio que incrusta el mismo clip', 'Una captura del mismo tuit', 'Una fotografía original identificable desde otro punto'], 2, 'Una observación distinta puede contrastar el hecho. Igual requiere verificar su propio lugar, tiempo y procedencia.')
      ])
    ]
  },
  verify2: {
    academyId: 'verification', title: 'Preservación y trazabilidad',
    description: 'Cómo mantener el contexto y distinguir integridad de veracidad', totalSlides: 5,
    sources: [references.berkeley, references.hash, references.provenance],
    slides: [
      {
        id: 1, title: 'Una ficha por evidencia',
        content: `<h2>Guardá el contexto junto al material</h2><p>El Protocolo de Berkeley propone procedimientos para recopilar, analizar y preservar información digital. El contexto y los metadatos acompañan al material conservado.</p><p>Para el ejercicio, creá la ficha <strong>PN-001</strong> con estos campos:</p><ul><li>URL exacta y título visible.</li><li>Autor o cuenta tal como aparece, sin dar su identidad por confirmada.</li><li>Fecha visible en la fuente y fecha de consulta, con zona horaria cuando la conozcas.</li><li>Archivo guardado, formato y método de obtención.</li><li>Relación con la afirmación y limitaciones.</li></ul><p>La ficha propuesta es una ayuda de aprendizaje. La aceptación de material en un procedimiento concreto depende de sus requisitos, no de completar esta plantilla.</p>`
      },
      {
        id: 2, title: 'Originales y copias de trabajo',
        content: `<h2>No mezcles lo recibido con lo que editaste</h2><p>En el caso simulado guardás <code>PN-001-original.jpg</code>. Para señalar un cartel, generás <code>PN-001-anotada.png</code> y anotás la operación: “flecha y recuadro agregados para explicar la ubicación”.</p><p>Conservá un inventario de archivos relacionados y evitá sobrescribir el original. Un recorte puede ser útil para explicar un detalle, pero el lector también necesita la escena completa.</p><div class="highlight-box"><p>Registro de trabajo: evidencia PN-001 · entrada original.jpg · salida anotada.png · operación: anotación visual · responsable · fecha.</p></div><p>Antes de compartir, prepará una copia que omita datos personales irrelevantes. Registrá la edición y compartí solo el material necesario para la pregunta.</p>`
      },
      {
        id: 3, title: 'Qué demuestra una huella hash',
        content: `<h2>Integridad del archivo ≠ verdad de la escena</h2><p>Una función hash calcula un valor a partir del contenido de un archivo. Comparar huellas criptográficas ayuda a detectar cambios entre copias. El hash no identifica al fotógrafo ni prueba cuándo o dónde ocurrió la escena.</p><p>Ejercicio: calculás SHA-256 del archivo descargado y de una copia posterior. Si difieren, investigá si hubo recomposición, recodificación, edición o corrupción. No asumas una intención a partir del cambio.</p><div class="highlight-box"><p>Un archivo inventado también puede conservarse sin cambios y tener una huella estable. La autenticidad contextual se evalúa con otras comprobaciones.</p></div>`
      },
      {
        id: 4, title: 'Credenciales de procedencia',
        content: `<h2>Una señal adicional, con alcance limitado</h2><p>Content Credentials, basadas en C2PA, pueden aportar información firmada sobre la procedencia y las acciones declaradas sobre un archivo. Complementan la verificación del contenido; no resuelven por sí mismas si la escena representa lo que afirma una publicación.</p><p>La falta de una credencial no permite concluir que el archivo es falso. Registrá qué herramienta y versión usaste, qué credencial encontraste y cuál fue el resultado de la validación.</p><div class="highlight-box"><p>Práctica: una imagen tiene una credencial válida y un epígrafe que señala otra ciudad. Investigá el lugar: la validación de procedencia no confirma el epígrafe.</p></div><p>Cerrá la ficha diferenciando “sin dato”, “no comprobado” y “comprobado dentro de este alcance”.</p>`
      },
      assessment([
        question('¿Qué falta si guardaste solo una captura sin URL ni fecha de consulta?', ['Nada: toda captura se explica sola', 'Color y tipografía de la página', 'Contexto para ubicar y reproducir la observación'], 2, 'La ficha relaciona el material con su fuente, momento de consulta y alcance.'),
        question('Necesitás agregar una flecha a una foto. ¿Cómo lo hacés?', ['Con una copia de trabajo y registro de la modificación', 'Sobrescribiendo el original', 'Editando también la fecha visible de la fuente'], 0, 'Separá el original de la versión explicativa y documentá cómo se relacionan.'),
        question('Dos copias tienen el mismo SHA-256. ¿Qué respalda esa comparación?', ['Que la escena ocurrió ayer', 'Que los contenidos comparados coinciden, con las propiedades de ese hash', 'Que el autor de la publicación es quien tomó la foto'], 1, 'El hash ayuda a comprobar integridad entre contenidos; no confirma la historia que los acompaña.'),
        question('Una imagen no tiene Content Credentials. ¿Qué conclusión corresponde?', ['Es falsa', 'Es una foto de cámara sin editar', 'La ausencia no determina su veracidad'], 2, 'La procedencia firmada es una señal posible. Su ausencia no reemplaza el análisis de fuentes y contexto.'),
        question('Dos consultas usaron zonas horarias distintas. ¿Qué hacés al comparar fechas?', ['Preservo los valores originales y documento una normalización con zona', 'Borro una de las fechas', 'Asumo que todas las fechas ya estaban en hora argentina'], 0, 'Hacé explícitas las conversiones y las zonas desconocidas, conservando el registro de origen.')
      ])
    ]
  },
  verify3: {
    academyId: 'verification', title: 'Del indicio a la conclusión',
    description: 'Resolvé el expediente ficticio del puente de Puerto Norte', totalSlides: 5,
    sources: [references.berkeley],
    slides: [
      {
        id: 1, title: 'Expediente Puerto Norte',
        content: `<h2>Tu encargo: evaluar una afirmación concreta</h2><p>Una publicación dice: “El puente de Puerto Norte estuvo cerrado todo el día por una falla estructural”. Tenés cuatro piezas ficticias:</p><ul><li><strong>E1:</strong> clip de 12 segundos con una barrera baja, sin metadatos de captura.</li><li><strong>E2:</strong> aviso del operador: mantenimiento programado de 09:00 a 10:00 del 14 de abril.</li><li><strong>E3:</strong> foto fechada a las 10:20, con vehículos sobre un puente parecido; ubicación aún sin contrastar.</li><li><strong>E4:</strong> tres portales que citan E1.</li></ul><div class="highlight-box"><p>Trabajá exclusivamente con estas piezas simuladas. El objetivo es razonar sobre evidencia, no investigar una persona ni un evento real.</p></div>`
      },
      {
        id: 2, title: 'Armá hipótesis alternativas',
        content: `<h2>Buscá diferencias que puedan comprobarse</h2><p><strong>H1:</strong> cierre total del día por falla. <strong>H2:</strong> interrupción breve por mantenimiento. <strong>H3:</strong> el video pertenece a otro día o lugar.</p><p>E1 es compatible con varias hipótesis: no permite elegir una. E2 favorece que se planificó mantenimiento, pero no demuestra por sí solo cuánto duró la interrupción real. E3 podría limitar la duración del cierre si se verifican su fecha y ubicación.</p><p>Tu siguiente paso propuesto: contrastar los rasgos del puente en E3 y buscar un registro operativo de reapertura. Escribí cómo cada resultado cambiaría tu conclusión.</p><div class="highlight-box"><p>Una hipótesis es una explicación que ponés a prueba. No la conviertas en hecho por ser la primera o la más atractiva.</p></div>`
      },
      {
        id: 3, title: 'Escribí la conclusión mínima',
        content: `<h2>Separá observación, interpretación y vacío</h2><p><strong>Observación:</strong> E2 anuncia mantenimiento para una franja de una hora. <strong>Interpretación:</strong> ofrece una explicación alternativa a la supuesta falla. <strong>Vacío:</strong> no hay evidencia suficiente aquí para establecer la causa real ni la duración total del cierre.</p><p>Redacción propuesta: “El aviso E2 documenta un mantenimiento programado de 09:00 a 10:00. El clip E1 muestra una barrera baja, sin fecha de captura verificada. Con las piezas disponibles no podemos sostener un cierre de todo el día ni atribuirlo a una falla estructural”.</p><p>La conclusión responde a la pregunta y deja explícito qué falta. Evitá asignar un porcentaje de confianza si no tenés un método que justifique ese número.</p>`
      },
      {
        id: 4, title: 'Entrega y correcciones',
        content: `<h2>Dejá un resultado que otra persona pueda revisar</h2><p>Entregá una página con pregunta, alcance temporal, conclusión, tabla de evidencias, contradicciones, vacíos y próximos pasos. Adjuntá las referencias necesarias para revisar cada afirmación.</p><p>Si una nueva pieza cambia el análisis, publicá una versión corregida con fecha y motivo. No borres silenciosamente la conclusión previa del registro de trabajo.</p><div class="highlight-box"><p>Tu miniinforme: escribí una conclusión de tres oraciones, citá E1 y E2, explicá por qué E4 no agrega independencia y proponé qué dato resolvería la duración del cierre.</p></div>`,
        interactive: { type: 'click_reveal', items: [
          { trigger: 'Ver una conclusión desmedida', content: '“Se comprobó una falla estructural durante todo el día”. Ninguna pieza permite sostener causa y duración juntas.' },
          { trigger: 'Ver una conclusión revisable', content: '“Existe un aviso de mantenimiento programado (E2). E1 no tiene fecha de captura verificada. La duración real y la causa del cierre siguen pendientes de contraste”.' },
          { trigger: 'Ver el próximo paso', content: 'Solicitar o localizar un registro público del operador sobre la reapertura, con fecha y hora, y verificar E3 antes de usarla como límite temporal.' }
        ] }
      },
      assessment([
        question('¿Qué sostiene E2 directamente?', ['Que la interrupción real duró exactamente una hora', 'Que se anunció una ventana de mantenimiento', 'Que no hubo ninguna falla'], 1, 'Un aviso de planificación no es necesariamente un registro de ejecución.'),
        question('¿Qué le falta a E3 antes de usarla para limitar el cierre?', ['Un filtro de mayor contraste', 'Más republicaciones', 'Verificar lugar, fecha y relación con el puente del caso'], 2, 'Una apariencia similar y una fecha impresa no sustituyen las comprobaciones de contexto.'),
        question('¿Qué aporta E4 a la independencia de la evidencia?', ['No agrega una observación propia al citar E1', 'Tres capturas distintas del hecho', 'Una confirmación de la causa estructural'], 0, 'Los portales repiten la misma pieza, aunque sí documentan su circulación.'),
        question('¿Cuál es la conclusión defendible con este expediente?', ['El puente estuvo abierto todo el día', 'Hubo una falla comprobada', 'La causa y la duración reales no están establecidas por estas piezas'], 2, 'El conjunto permite describir observaciones y una planificación, dejando pendientes los hechos no demostrados.'),
        question('Llega un registro que cambia tu conclusión. ¿Qué hacés?', ['Lo ignorás para mantener coherencia', 'Revisás la conclusión y registrás la nueva versión y su motivo', 'Borrás la evidencia que usaste antes'], 1, 'Una investigación revisable permite conocer qué cambió, por qué y con qué evidencia.')
      ])
    ]
  }
}
