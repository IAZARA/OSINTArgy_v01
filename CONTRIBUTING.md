# Contribuir a OSINTArgy

Gracias por ayudar a mantener OSINTArgy. El objetivo del proyecto es ofrecer un catalogo y herramientas OSINT utiles, verificables y orientadas a uso etico, educativo y defensivo.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker y Docker Compose, opcional para levantar el stack completo.

## Preparar el entorno

```bash
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:3001` si usas el `.env.example`, o el puerto definido en `backend/.env`.

## Validaciones antes de abrir un PR

```bash
npm run sync:data
npm run validate:data
npm test
npm run build
npm audit --omit=dev
cd frontend && npm audit --omit=dev
cd ../backend && npm audit --omit=dev
```

Para revisar links externos del catalogo:

```bash
npm run check:links -- --report-only --output link-check-report.json --markdown link-check-report.md
```

## Agregar herramientas al catalogo

1. Elegi el archivo JSON correcto en `frontend/src/data/tools/`.
2. Usa un `id` unico en kebab-case.
3. Completa todos los campos obligatorios documentados en [docs/catalogo.md](docs/catalogo.md).
4. Evita herramientas orientadas a abuso, intrusiones, doxxing o acceso no autorizado.
5. Ejecuta `npm run sync:data` y `npm run validate:data`.

## Reportar links caidos

Usa la plantilla "Link caido" e incluye:

- nombre de la herramienta;
- URL afectada;
- codigo HTTP o mensaje de error;
- alternativa oficial si existe.

## Pull requests

- Manten los cambios enfocados y revisables.
- Explica el motivo del cambio y como lo validaste.
- No incluyas secretos, tokens, dumps, bases de datos locales ni resultados sensibles.
- Para cambios de seguridad, evita abrir detalles explotables en issues publicos; usa [SECURITY.md](SECURITY.md).
