# Arquitectura

OSINTArgy separa la experiencia visual, la API y los datos editoriales del catalogo para que el proyecto pueda mantenerse sin mezclar responsabilidades.

## Componentes

| Capa | Ruta | Responsabilidad |
| --- | --- | --- |
| Frontend | `frontend/` | Aplicacion React/Vite, visualizaciones, buscador, modulos OSINT y academia. |
| Backend | `backend/` | API Express, autenticacion, modelos MongoDB, modulos de analisis y endpoints auxiliares. |
| Catalogo | `frontend/src/data/tools/` | Fuente editorial principal de herramientas OSINT por categoria. |
| Automatizacion | `scripts/` | Validacion de catalogo, sincronizacion del fallback y revision de links. |
| Infraestructura | `Dockerfile`, `docker-compose*.yml`, `.github/` | Desarrollo local, produccion, CI, CodeQL y Dependabot. |

## Flujo del catalogo

1. Cada categoria vive en un JSON dentro de `frontend/src/data/tools/`.
2. `frontend/src/data/tools/index.js` importa los JSON y expone funciones de busqueda, filtros, estadisticas y recomendaciones.
3. `frontend/src/hooks/useTools.js` consume ese indice central para que las vistas usen la misma fuente.
4. `frontend/src/data/tools.json` es un fallback completo generado con `npm run sync:data`.
5. `scripts/validate-catalog.mjs` verifica campos obligatorios, tipos, indicadores, categorias, subcategorias, IDs unicos y fallback sincronizado.
6. Los scripts backend de importacion descubren dinamicamente los JSON del catalogo para evitar listas desactualizadas.

## Frontend

La app principal esta en `frontend/src/App.jsx`.

- `Header` y `DisclaimerModal` se cargan en el bundle inicial.
- Vistas pesadas como `GalaxyView`, `DorkGenerator`, `LessonViewer`, `OSINTFlowcharts` y herramientas interactivas usan `React.lazy`.
- Vite separa vendors principales en chunks (`vendor`, `d3`, `icons`) y las rutas se cargan bajo demanda.

## Backend

La API esta en `backend/src/app.js`.

- Exporta `app`, `connectDB` y `startServer`.
- Solo conecta MongoDB cuando se ejecuta como proceso principal.
- Los tests pueden importar `app` sin levantar base de datos.
- `LOG_DIR` permite controlar la ruta de logs, especialmente en Docker.

## Docker

`docker-compose.yml` usa targets de desarrollo:

- `backend` con Node, `npm run dev` y dependencias de desarrollo.
- `frontend` con Vite en `0.0.0.0:5173`.
- `mongodb` y `mongo-express` para entorno local.

`docker-compose.prod.yml` usa targets de produccion:

- backend con `npm ci --omit=dev`;
- frontend compilado y servido por Nginx;
- puertos enlazados a `127.0.0.1` para despliegues detras de proxy.

## CI y seguridad

| Workflow | Archivo | Proposito |
| --- | --- | --- |
| CI | `.github/workflows/ci.yml` | Instala dependencias, sincroniza y valida catalogo, corre tests, build y audits. |
| CodeQL | `.github/workflows/codeql.yml` | Analisis estatico de JavaScript/TypeScript. |
| Link Check | `.github/workflows/link-check.yml` | Revision semanal/manual de URLs externas del catalogo en modo reporte. |
| Dependabot | `.github/dependabot.yml` | PRs semanales para npm, GitHub Actions y Docker. |

## Comandos clave

```bash
npm run sync:data
npm run validate:data
npm run check:links -- --report-only --markdown link-check-report.md
npm test
npm run build
docker compose up --build
docker compose -f docker-compose.prod.yml up --build
```

## Criterios de mantenimiento

- No agregar herramientas que promuevan abuso, intrusiones, doxxing o acceso no autorizado.
- Preferir URLs oficiales, documentacion primaria o repositorios mantenidos.
- Mantener el catalogo como fuente principal y regenerar el fallback despues de cambios.
- Revisar links externos periodicamente, pero no bloquear PRs por fallos transitorios de servicios externos.
