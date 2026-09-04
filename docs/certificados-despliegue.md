# Certificados: preparación y despliegue

La academia funciona por defecto en modo local. La aplicación puede generar una constancia descargable y facilitar los datos para LinkedIn sin disponer de un dominio público. La emisión firmada, persistente y verificable requiere configurar y desplegar el backend, MongoDB y un frontend público HTTPS.

Esta preparación no publica el sitio, no registra una entidad certificadora y no valida la identidad del participante. Las credenciales corresponden a una **evaluación final de conocimientos sin supervisión**, con nombre declarado y aprobación mínima del 80%. No constituyen un título oficial ni una habilitación profesional.

## Modos de funcionamiento

| Configuración | Modo local, predeterminado | Modo servidor |
| --- | --- | --- |
| `VITE_CERTIFICATE_MODE` | `local` | `server` |
| Corrección de la evaluación final | Navegador | Backend |
| Identificador | `LOCAL-…` | `OSA-…` |
| Almacenamiento de la credencial | Navegador; descarga HTML imprimible | Registro MongoDB y copia en el navegador |
| Verificación pública | No disponible | Consulta del registro, firma e indicador de revocación |
| `CERTIFICATE_SIGNING_SECRET` | Vacío | Clave independiente y estable de al menos 32 caracteres |
| `CERTIFICATE_PUBLIC_URL` | Vacío | Origen público HTTPS del frontend |

El modo del frontend se incorpora **durante la compilación**. Modificar una variable del contenedor Nginx ya creado no cambia el JavaScript que se sirve: hay que reconstruir el frontend. El backend habilita emisión y verificación cuando sus dos variables están configuradas; `VITE_CERTIFICATE_MODE` no es un interruptor de seguridad de la API.

En local, el progreso y la constancia dependen del navegador. Borrar su almacenamiento elimina esa copia. Una constancia local no se convierte automáticamente en una credencial pública cuando se publica el sitio: para una credencial firmada se realiza la evaluación en modo servidor.

## Configuración de producción

Usá `.env.production.example` como referencia para crear tu archivo de configuración privado. En el archivo de ejemplo, la emisión pública permanece desactivada y no se incluye ninguna clave real.

Para activar la emisión pública, configurá:

```dotenv
VITE_CERTIFICATE_MODE=server
CERTIFICATE_PUBLIC_URL=https://academia.tu-dominio.tld
FRONTEND_URL=https://academia.tu-dominio.tld
```

Configurá además `CERTIFICATE_SIGNING_SECRET` con un valor aleatorio propio de **al menos 32 caracteres**, diferente de las claves JWT, de refresh y de MongoDB. Conservá esa misma clave entre reinicios y reconstrucciones. No la incluyas en Git, argumentos de compilación ni variables `VITE_*`: estas últimas forman parte del contenido público del frontend. El Compose la entrega exclusivamente al proceso del backend.

`CERTIFICATE_PUBLIC_URL` debe contener solo el origen: HTTPS y un dominio público, sin ruta, consulta, fragmento ni credenciales. No se admiten direcciones IP ni dominios locales. La URL debe apuntar al frontend y no a `/api` ni a `/academy`. El dominio del ejemplo es un marcador; el código no configura DNS ni comprueba desde Internet que ese dominio haya sido publicado.

El Compose mantiene MongoDB, backend y frontend publicados únicamente en `127.0.0.1`. Para acceso público hace falta configurar HTTPS en la infraestructura elegida. Esa terminación TLS y el dominio quedan fuera de estos archivos.

## Compilación del frontend en Docker

El contexto del Dockerfile sigue siendo `./frontend`, compatible con los Compose de desarrollo y producción. Los scripts de sincronización del repositorio están fuera de ese contexto; por eso los targets Docker invocan Vite directamente y utilizan los JSON sincronizados que se versionan dentro de `frontend/src/data/`.

Antes de construir una imagen después de editar herramientas o evaluaciones, ejecutá desde la raíz:

```bash
npm run sync:data
npm run validate:data
node --test frontend/tests/catalog-smoke.test.mjs frontend/tests/certificates.test.mjs
```

`sync:data` actualiza el catálogo consolidado y copia el temario de evaluación canónico desde `backend/src/data/academy-assessments.json`. Incluí esos archivos generados en el cambio correspondiente; la imagen no corrige una copia desactualizada. El desarrollo local con `npm run dev` y `npm run build` conserva sus hooks de sincronización. En el contenedor de desarrollo, ejecutá la sincronización en el host cuando cambies los datos o las evaluaciones, antes de recargar.

Los argumentos públicos del build son:

| Argumento | Valor en el Compose de producción |
| --- | --- |
| `VITE_API_URL` | `/api`, para usar el mismo origen del frontend |
| `VITE_CERTIFICATE_MODE` | `${VITE_CERTIFICATE_MODE:-local}` |

El Dockerfile rechaza modos distintos de `local` y `server`. Los argumentos de build son apropiados para estas opciones públicas, no para la clave de firma. Referencia: [variables de compilación de Docker](https://docs.docker.com/build/building/variables/).

Para revisar la configuración sin iniciar servicios:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml config --quiet
```

Cuando corresponda construir las imágenes, este comando solo construye y no inicia servicios:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml build frontend backend
```

No publiques la salida completa de `docker compose config`: incluye los valores resueltos de configuración, entre ellos secretos.

## Rutas y proxy

Nginx conserva la ruta `/api` al reenviar las solicitudes a `http://backend:3000`. Esto permite que funcionen `/api/certificates` y las rutas existentes de la API desde el mismo origen. No se agrega una barra al destino de `proxy_pass`, porque quitaría el prefijo al sustituir la ruta. Referencia: [comportamiento de `proxy_pass` en Nginx](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass).

Las páginas `/academy/certificates` y `/certificates/OSA-…` usan el fallback de la SPA a `index.html`. Así, abrir un enlace de verificación directamente o recargarlo entrega la aplicación; esta consulta la API para determinar el estado real. Una respuesta HTML 200 por sí sola no prueba que exista el certificado.

| Ruta | Comportamiento |
| --- | --- |
| `GET /api/certificates/assessment/:courseId` | Temario público sin respuestas correctas en esa respuesta |
| `POST /api/certificates/issue` | Corrige la evaluación final y guarda una credencial si se aprueba y existe consentimiento público |
| `GET /api/certificates/:certificateId` | Devuelve una credencial cuya firma y vigencia fueron verificadas |
| `GET /certificates/:certificateId` | Página pública que muestra el resultado de la consulta a la API |

La API devuelve 404 si el ID no existe, 410 si fue revocado, 409 si la firma no coincide y 503 cuando falta configuración o el registro no puede consultarse. Estos errores se conservan a través del proxy. La API envía `Cache-Control: no-store`; no se debe agregar caché intermedia a las respuestas de certificados.

El Compose configura `TRUST_PROXY=1` porque Express está detrás de **un Nginx de confianza**. Nginx sobrescribe `X-Forwarded-For` con `$remote_addr` y no concatena un encabezado enviado por el visitante. El puerto del backend sigue limitado a loopback; no debe exponerse directamente a Internet con esa confianza activada.

Si la publicación incorpora otro proxy HTTPS o una CDN delante de Nginx, `$remote_addr` será la dirección de ese salto. Las cuotas pueden quedar compartidas entre sus visitantes hasta configurar la IP real con una lista explícita de proxies confiables y validar toda la cadena. No se debe resolver confiando en cualquier `X-Forwarded-For`. Referencia: [Express detrás de proxies](https://expressjs.com/en/guide/behind-proxies/).

## Registro, consentimiento y revocación

Mongoose guarda los certificados en la colección **`certificates`** de la base `osintargy`, usando el volumen persistente `mongodb_data`. El registro incluye ID, nombre declarado, trayecto, fecha, resultado, versión, firma y `revokedAt`. La respuesta pública no expone la clave de firma ni permite modificar el registro.

La emisión pública exige consentimiento explícito para mostrar nombre, trayecto, fecha y resultado en una página accesible mediante enlace. Un enlace difícil de adivinar no reemplaza un control de acceso: quien lo recibe puede abrirlo y compartirlo.

La firma autentica los campos emitidos por el servidor. No prueba la identidad del participante, una cursada supervisada ni la imposibilidad de consultar las respuestas durante la evaluación. El progreso de las lecciones continúa almacenado en el navegador; la comprobación persistente del backend corresponde a la evaluación final.

No existe un endpoint público de administración o revocación. Un administrador de la base puede revocar **un ID exacto** en una sesión autenticada de MongoDB:

```javascript
db.getSiblingDB('osintargy').certificates.updateOne(
  { id: 'OSA-REEMPLAZAR-POR-ID-EXACTO', revokedAt: null },
  { $set: { revokedAt: new Date() } }
)
```

Comprobá que se modificó el registro esperado y que su consulta posterior devuelve 410. Conservar el registro revocado mantiene la trazabilidad; no hace falta borrarlo. Una copia descargada con anterioridad no puede retirarse de dispositivos ajenos: su vigencia debe consultarse en la URL pública.

Conservá respaldos de la base y de la clave de firma por canales apropiados. **Cambiar la clave actual invalida la verificación de todos los registros firmados con la anterior**, porque todavía no hay un anillo de claves ni migración de firmas. Vaciar la configuración deshabilita el servicio de verificación; no equivale a revocar registros individuales. La rotación debe planificarse junto con la recuperación o reemisión de credenciales.

## Agregar a LinkedIn

El botón abre el formulario oficial de LinkedIn y presenta campos copiables: nombre de la credencial, organización emisora, fecha de expedición, ID y URL pública cuando exista. La persona revisa y confirma la publicación dentro de su cuenta.

LinkedIn informa que los datos **no se autocompletan**: sus enlaces actuales llevan a un formulario donde el usuario ingresa la información. Por eso el mecanismo usa una URL estática y campos copiables, sin prometer una publicación automática. Referencia oficial: [preguntas frecuentes de Add to Profile](https://www.linkedin.com/help/linkedin/answer/a528030).

En modo local, el nombre indica que se trata de una constancia de aprendizaje y la URL de credencial se deja vacía. No se debe usar `localhost`, una ruta de archivo ni una URL inventada como verificación pública. Agregar una credencial a LinkedIn no implica acreditación o respaldo de LinkedIn al curso.

## Validación realizada y revisión pendiente

Se validó el Compose en los dos modos con valores temporales de prueba, sin imprimir secretos ni usar el archivo `.env.production` real. Se comprobaron argumentos de compilación, variables de backend y puertos limitados a loopback. También se ejecutó el comando explícito de Vite usado por el Dockerfile para verificar la compilación en modo servidor con API relativa.

No se inició ningún servicio, no se construyó una imagen Docker y no se desplegó el sitio. Nginx y el recorrido público mediante HTTPS todavía requieren verificación en el entorno elegido; una compilación y un `config --quiet` correctos no sustituyen esa comprobación.

Las pruebas automatizadas de certificados del frontend y backend pasaron: **11 de 11**. Pueden ejecutarse con:

```bash
node --test frontend/tests/certificates.test.mjs
node --test backend/tests/certificates.test.mjs
```

Antes de habilitar emisión para visitantes, verificá en el despliegue real: carga directa y recarga de la página de verificación; emisión y consulta con MongoDB; persistencia después de reiniciar; errores por ID inexistente y revocación; límites de intentos con la topología de proxy elegida; descarga e impresión; y transferencia manual de campos al formulario de LinkedIn. Estas comprobaciones de producción permanecen pendientes hasta que exista el servicio publicado.
