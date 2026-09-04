# Ampliación del catálogo — 4 de septiembre de 2026

El catálogo pasa de **453 a 485 entradas** con **32 incorporaciones**: 7 fuentes argentinas, 5 de otros países de Latinoamérica y 20 internacionales. Se amplían 7 categorías e ingresan 9 repositorios de código abierto para análisis, documentación y preservación. Ninguna de las nuevas entradas duplica un ID o una URL normalizada del catálogo previo.

## Cómo se verificó

- Se revisaron páginas de los organismos y proyectos responsables, documentación oficial y repositorios originales. Los enlaces de cada fila son la fuente primaria de su descripción.
- Se realizó una solicitud HTTP GET por destino con redirecciones, 4 conexiones concurrentes, 5 segundos para conexión y 15 segundos de límite total. No se enviaron consultas sobre personas ni se crearon cuentas.
- Resultado: **27 respuestas HTTP 200 completas**, **1 respuesta 200 parcial por timeout**, **3 respuestas restringidas (403, 405 y 406)** y **1 timeout durante TLS**. Estas restricciones no se confundieron con una prueba de funcionamiento integral.
- Las fuentes con restricciones HTTP tienen respaldo en contenido consultado del organismo o su documentación; no se reemplazaron por dominios de terceros.
- La API pública de GitHub confirmó que los 9 repositorios nuevos no estaban archivados ni deshabilitados al momento de la revisión. Las licencias deben verificarse en el archivo del proyecto antes de reutilizar código.
- No se ejecutaron ni instalaron las herramientas del catálogo. La verificación editorial y de disponibilidad no certifica que todos sus flujos, descargas o servicios funcionen.
- `last_updated` indica la fecha de revisión editorial. `rating: 0` y `usage_count: 0` evitan atribuir valoraciones o uso que no se midieron.
- `is_free` y `requires_registration` describen la modalidad incluida: consulta pública o software local. Funciones opcionales, infraestructura propia, APIs, cuotas y almacenamiento pueden tener condiciones adicionales.

## Fuentes incorporadas

| Fuente primaria | Región | Aporte | Acceso incluido | Resultado HTTP |
| --- | --- | --- | --- | --- |
| [Presupuesto Abierto Argentina](https://www.presupuestoabierto.gob.ar/) | argentina | Portal oficial de consulta y descarga de la ejecución presupuestaria nacional. | Consulta o descarga pública gratuita. | 200 completo |
| [INDEC - Bases de datos](https://www.indec.gob.ar/Institucional/Indec/BasesDeDatos) | argentina | Bases estadísticas y documentación metodológica publicadas por el INDEC. | Consulta o descarga pública gratuita. | 200 completo |
| [Buenos Aires Data](https://data.buenosaires.gob.ar/) | argentina | Catálogo de datos abiertos producidos por el Gobierno de la Ciudad de Buenos Aires. | Consulta o descarga pública gratuita. | 200 completo |
| [Datos Abiertos de la Provincia de Buenos Aires](https://catalogo.datos.gba.gob.ar/) | argentina | Catálogo provincial con datos abiertos de administración pública, territorio, economía y otras áreas. | Consulta o descarga pública gratuita. | 200 completo |
| [Brasil - Portal da Transparência](https://portaldatransparencia.gov.br/) | latam | Portal de la Controladoria-Geral da União sobre recursos y contrataciones del Gobierno Federal de Brasil. | Consulta web pública; API con condiciones de acceso propias. | 405; acceso automatizado restringido |
| [Datos Abiertos Colombia](https://www.datos.gov.co/) | latam | Portal nacional colombiano de datos abiertos de entidades públicas. | Consulta o descarga pública gratuita. | 200 parcial; timeout al recibir el cuerpo |
| [ChileCompra - Datos Abiertos](https://datos-abiertos.chilecompra.cl/) | latam | Datos y descargas de compras públicas registradas en Mercado Público de Chile. | Consulta o descarga pública gratuita. | 200 completo |
| [Uruguay - Catálogo Nacional de Datos Abiertos](https://catalogodatos.gub.uy/) | latam | Catálogo de conjuntos de datos abiertos de organizaciones públicas y otras entidades uruguayas. | Consulta o descarga pública gratuita. | 200 completo |
| [Ecuador - Contrataciones Abiertas](https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/) | latam | Buscador y datos abiertos de procedimientos de contratación pública de Ecuador en formato OCDS. | Consulta o descarga pública gratuita. | Sin respuesta; timeout TLS |
| [Georef Argentina](https://www.argentina.gob.ar/georef) | argentina | API oficial para normalizar direcciones y unidades territoriales de Argentina. | Consulta o descarga pública gratuita. | 200 completo |
| [IGN - Geoportal Argentina](https://geoportal.ign.gob.ar/) | argentina | Acceso a mapas, cartografía y servicios geográficos del Instituto Geográfico Nacional. | Consulta o descarga pública gratuita. | 200 completo |
| [IDERA - Catálogo de Metadatos](https://servicios.idera.gob.ar/geonetwork/srv/spa/catalog.search) | argentina | Catálogo federal de metadatos para descubrir información geográfica de Argentina. | Consulta o descarga pública gratuita. | 200 completo |
| [Copernicus Browser](https://dataspace.copernicus.eu/browser/) | internacional | Visor de imágenes Sentinel y otras colecciones del Copernicus Data Space Ecosystem. | Cuenta gratuita obligatoria para usar el visor. | 200 completo; redirección oficial |
| [NASA Worldview](https://worldview.earthdata.nasa.gov/) | internacional | Visor temporal de imágenes y capas satelitales de NASA con herramientas de comparación. | Visor público; algunos productos de origen requieren Earthdata Login. | 200 completo |
| [OpenAerialMap](https://openaerialmap.org/) | internacional | Colección abierta de imágenes aéreas y servicios de mapas con licencias de reutilización. | Consulta o descarga pública gratuita. | 200 completo |
| [Humanitarian Data Exchange (HDX)](https://data.humdata.org/) | internacional | Catálogo de datos humanitarios de OCHA y organizaciones colaboradoras. | Recursos públicos sin cuenta; los restringidos requieren solicitud y la API tabular requiere token. | 406; acceso automatizado restringido |
| [Google Fact Check Explorer](https://toolbox.google.com/factcheck/explorer) | internacional | Buscador de verificaciones de afirmaciones publicadas por organizaciones de fact-checking. | Consulta de verificaciones; cada resultado debe revisarse en su publicación original. | 200 completo |
| [OpenAlex](https://openalex.org/) | internacional | Índice abierto de publicaciones, autores, instituciones y relaciones de citación académica. | Consulta web básica gratuita con cuotas; uso a escala y API sujetos a condiciones. | 403; acceso automatizado restringido |
| [Crossref Metadata Search](https://search.crossref.org/) | internacional | Buscador de metadatos de artículos, libros, datasets y otros trabajos con identificadores DOI. | Metadatos abiertos; el texto completo puede tener restricciones. | 200 completo |
| [ICANN - RDAP Lookup](https://lookup.icann.org/) | internacional | Consulta pública de datos de registro de dominios y recursos de Internet mediante RDAP. | Consulta o descarga pública gratuita. | 200 completo |
| [RIPEstat](https://stat.ripe.net/) | internacional | Servicio de RIPE NCC con información y visualizaciones de direcciones IP, prefijos y sistemas autónomos. | Consulta o descarga pública gratuita. | 200 completo |
| [CISA - Known Exploited Vulnerabilities](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | internacional | Catálogo público de vulnerabilidades con evidencia de explotación conocida mantenido por CISA. | Consulta o descarga pública gratuita. | 200 completo |
| [NIST - National Vulnerability Database](https://nvd.nist.gov/) | internacional | Base pública de vulnerabilidades y referencias técnicas mantenida por NIST. | Consulta o descarga pública gratuita. | 200 completo |
| [GitHub: Datasette](https://github.com/simonw/datasette) | internacional | Software abierto para explorar bases SQLite y publicar colecciones de datos con una interfaz consultable. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: VisiData](https://github.com/saulpw/visidata) | internacional | Herramienta de terminal para explorar y ordenar tablas en formatos como CSV, JSON, SQLite y Excel. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: DuckDB](https://github.com/duckdb/duckdb) | internacional | Motor de análisis SQL local para consultar conjuntos de datos y archivos tabulares. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: Tesseract OCR](https://github.com/tesseract-ocr/tesseract) | internacional | Motor OCR de código abierto para extraer texto de imágenes en múltiples idiomas. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) | internacional | Utilidad abierta que agrega una capa de texto OCR a documentos PDF escaneados. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: yt-dlp](https://github.com/yt-dlp/yt-dlp) | internacional | Utilidad de terminal para descargar audio, video y metadatos de sitios compatibles. | Software local gratuito; consultar requisitos y licencia. | 200 completo |
| [GitHub: Zotero](https://github.com/zotero/zotero) | internacional | Gestor de investigación abierto para recopilar, anotar, organizar y citar fuentes. | Aplicación local gratuita; cuenta y condiciones propias para sincronización y almacenamiento. | 200 completo |
| [GitHub: Uwazi](https://github.com/huridocs/uwazi) | internacional | Plataforma abierta de HURIDOCS para construir colecciones de documentos y entidades relacionadas. | Código gratuito; requiere desplegar y administrar una instancia. | 200 completo |
| [GitHub: Brozzler](https://github.com/internetarchive/brozzler) | internacional | Rastreador de Internet Archive que utiliza un navegador real para preservar páginas web. | Software local gratuito; consultar requisitos y licencia. | 200 completo |

## Respaldo adicional y límites relevantes

- [AGEsIC: Catálogo Nacional de Datos Abiertos](https://www.gub.uy/agencia-gobierno-electronico-sociedad-informacion-conocimiento/soluciones/catalogo-nacional-datos-abiertos) confirma la identidad del portal uruguayo. El navegador de investigación tuvo un timeout inicial; el control HTTP posterior respondió 200.
- [Contrataciones Abiertas de Ecuador](https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/) y su [documentación de API](https://datosabiertos.compraspublicas.gob.ec/PLATAFORMA/datos-abiertos/api) permitieron verificar finalidad y acceso público. El control HTTP local no completó TLS dentro del límite.
- [ChileCompra: alcance de los datos](https://datos-abiertos.chilecompra.cl/datos-abiertos) distingue compromisos de compra de pagos realizados. No deben interpretarse como la misma métrica.
- [Copernicus: documentación del visor](https://documentation.dataspace.copernicus.eu/Applications/Browser.html) establece que se requiere una cuenta gratuita. La URL de entrada redirige a `browser.dataspace.copernicus.eu`.
- [OCHA: cuenta de HDX](https://centre.humdata.org/ufaqs/how-do-i-register-an-account-with-hdx/), [modalidades de acceso](https://centre.humdata.org/ufaqs/how-do-i-share-data-on-hdx/) y [API tabular](https://centre.humdata.org/new-api-access-on-hdx-tabular-data-endpoints/) diferencian descargas públicas, datos bajo solicitud y endpoints con token. El control automático devolvió 406.
- [OpenAlex: autenticación y límites](https://help.openalex.org/api/authentication/) documenta la consulta básica y las cuotas. La aplicación es dinámica y el control local devolvió 403; no se afirma que el acceso masivo sea ilimitado.
- [ICANN: preguntas frecuentes](https://lookup.icann.org/en/faq) aclara el carácter público de RDAP y los campos redactados; no ofrece acceso irrestricto a identidades de titulares.
- [CISA: repositorio oficial de KEV](https://github.com/cisagov/kev-data) permite contrastar la procedencia y los formatos de descarga del catálogo. El navegador de investigación recibió 403 en el sitio principal; el control HTTP local respondió 200.
- [NIST: estado y alcance de NVD](https://www.nist.gov/itl/nvd) describe el enriquecimiento de los registros; no todos tienen el mismo grado de análisis.

## Correcciones de entradas anteriores

- **ARCA**: se conserva el ID `afip-cuit` para mantener favoritos y referencias, se actualizan nombre y URL al organismo actual y se distingue la información pública de los servicios con clave fiscal. Referencia: [portal de ARCA](https://arca.gob.ar/).
- **ANSES**: se elimina la promesa de consultar beneficios personales de terceros. El alcance queda en información de trámites y constancia de CUIL; los servicios personales requieren autenticación del titular. Referencia: [ANSES, constancia de CUIL](https://www.anses.gob.ar/noticias/como-obtener-la-constancia-de-cuil-desde-la-web-de-anses-0).
- **RENAPER**: se elimina la descripción como buscador abierto de DNI o estado civil. Se presenta como portal institucional de trámites y documentación. Referencias: [Renaper](https://www.argentina.gob.ar/interior/renaper) y [modalidades de validación para organizaciones](https://www.argentina.gob.ar/sid/modalidades-y-productos).

## Validación del catálogo

```bash
npm run sync:data
npm run validate:data
node --test frontend/tests/catalog-smoke.test.mjs
```

Validación: 485 entradas en 15 archivos, 0 errores. Las 10 advertencias de URL duplicada ya existían antes de esta ampliación. Pruebas del catálogo: 4 aprobadas de 4. Las URLs se normalizaron a minúsculas y sin barra final para comprobar que no se agregaran duplicados.
