# Catálogo de herramientas

El catálogo principal vive en `frontend/src/data/tools/`. Cada archivo JSON representa una categoría editorial y contiene un array `tools`.

## Validación

Ejecutá:

```bash
npm run validate:data
```

Si agregás o quitás herramientas, sincronizá también el fallback usado por el frontend:

```bash
npm run sync:data
```

Para revisar disponibilidad de URLs externas:

```bash
npm run check:links -- --report-only --output link-check-report.json --markdown link-check-report.md
```

El validador revisa:

- campos obligatorios por herramienta;
- sincronización de `frontend/src/data/tools.json` con los JSON por categoría;
- IDs únicos en todo el catálogo;
- URLs HTTP/HTTPS o rutas internas válidas;
- categorías y subcategorías existentes en `frontend/src/data/categories.json`;
- tipos, indicadores, estado y dificultad permitidos;
- rating numérico entre 0 y 5;
- fechas `YYYY-MM-DD`;
- booleanos reales en `requires_registration` e `is_free`.

Las URLs duplicadas se informan como advertencia para permitir casos editoriales donde un mismo servicio aparece con usos claramente distintos.

## Campos mínimos

```json
{
  "id": "herramienta-unica",
  "name": "Nombre de la herramienta",
  "description": "Descripción breve",
  "utility": "Para qué sirve en una investigación OSINT",
  "url": "https://ejemplo.com",
  "category": "categoria-id",
  "subcategory": "subcategoria-id",
  "tags": ["osint", "tag"],
  "type": "web",
  "indicators": ["D"],
  "region": "internacional",
  "language": "es",
  "rating": 0,
  "usage_count": 0,
  "last_updated": "2026-01-01",
  "status": "active",
  "requires_registration": false,
  "is_free": true,
  "difficulty_level": "beginner"
}
```

## Criterios editoriales

- Evitar duplicados por `id`; si una herramienta sirve para dos categorías, elegir la categoría primaria.
- Usar subcategorías declaradas en `categories.json`.
- Preferir descripciones concretas y verificables.
- Mantener `status` actualizado: `active`, `deprecated`, `offline` o `unknown`.
- No incluir servicios que promuevan abuso, doxxing, intrusión o acceso no autorizado.
- Las herramientas internas pueden usar rutas como `/infrastructure-scanner` y `type: "internal"`.

## Link checker

`scripts/check-links.mjs` revisa las URLs del catálogo con concurrencia y timeout configurables. Las rutas internas y servicios `.onion` se omiten. Los estados `401`, `403`, `405` y `429` se consideran alcanzables porque suelen indicar autenticación, protecciones anti-bot o rate limiting.

Ejemplos:

```bash
npm run check:links -- --report-only
npm run check:links -- --concurrency 4 --timeout 12000 --markdown link-check-report.md
```

## Revisión de fuentes de septiembre de 2026

La [revisión de fuentes y accesos](catalogo-fuentes-2026-09.md) documenta las 32 nuevas entradas, sus enlaces primarios y los resultados del control HTTP. El catálogo sincronizado contiene 485 herramientas y fuentes.

Al incorporar fuentes nuevas:

- Usar `rating: 0` y `usage_count: 0` cuando no hay valoraciones ni actividad medidas.
- Interpretar `last_updated` como fecha de revisión editorial, no como fecha de actualización del proveedor.
- Indicar en `utility` las limitaciones de cuenta, cuotas, descargas o funciones de pago. `is_free: true` significa que la modalidad descrita tiene acceso gratuito, no que todas las funciones del proveedor sean gratuitas.
- Usar `region: "argentina"` o `"latam"` para cobertura regional y agregar el país a las etiquetas. La región describe los datos, no el lugar donde está alojado el servicio.
- Describir fuentes institucionales por la información que publican; no prometer acceso a expedientes, beneficios, identidad o datos reservados a partir de una página institucional.
- Para repositorios, enlazar el proyecto original y verificar que la misma URL no exista ya en otra categoría; documentar instalación, permisos y servicios adicionales cuando sean necesarios.
