export const EMPTY_FILTERS = Object.freeze({
  region: '', type: '', cost: '', registration: '', difficulty: '', language: '', repositoriesOnly: false
});

export const TYPE_LABELS = {
  web: 'Sitio web', tool: 'Herramienta', api: 'API', cli: 'Línea de comandos', app: 'Aplicación',
  'browser-extension': 'Extensión de navegador', extension: 'Extensión', desktop: 'Escritorio',
  dataset: 'Datos abiertos', internal: 'Recurso de OSINTArgy'
};
export const DIFFICULTY_LABELS = { beginner: 'Inicial', intermediate: 'Intermedio', advanced: 'Avanzado' };
export const LANGUAGE_LABELS = { es: 'Español', en: 'Inglés', multi: 'Multilingüe', pt: 'Portugués', zh: 'Chino', ko: 'Coreano', ru: 'Ruso', ja: 'Japonés' };
export const SHORT_CATEGORY_NAMES = {
  'buscadores-generales': 'Buscadores', 'redes-sociales': 'Redes sociales', email: 'Correo electrónico',
  'dominios-ips': 'Dominios e IPs', geolocalizacion: 'Geolocalización', 'imagenes-videos': 'Imágenes y videos',
  'documentos-metadatos': 'Metadatos', 'darkweb-amenazas': 'Amenazas', 'analisis-visualizacion': 'Análisis de datos',
  'utilidades-varios': 'Utilidades', 'argentina-latam': 'Argentina / LATAM', telefonos: 'Teléfonos',
  archivos: 'Archivos web', criptomonedas: 'Blockchain'
};

export const normalizeSearch = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').trim();

export function isRepository(tool) {
  try {
    return ['github.com', 'gitlab.com', 'codeberg.org', 'bitbucket.org'].includes(new URL(tool.url).hostname.toLowerCase());
  } catch { return false; }
}

export function safeToolUrl(url) {
  if (typeof url !== 'string') return null;
  if (/^\/(?!\/)/.test(url) && !url.includes('\\')) return url;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}

export function filterCatalog(tools, { query = '', category = '', ...filters } = {}) {
  const terms = normalizeSearch(query).split(/\s+/).filter(Boolean);
  return tools.filter((tool) => {
    if (category && tool.category !== category) return false;
    if (filters.region && tool.region !== filters.region) return false;
    if (filters.type && tool.type !== filters.type) return false;
    if (filters.language && tool.language !== filters.language) return false;
    if (filters.difficulty && tool.difficulty_level !== filters.difficulty) return false;
    if (filters.cost && tool.is_free !== (filters.cost === 'free')) return false;
    if (filters.registration && tool.requires_registration !== (filters.registration === 'required')) return false;
    if (filters.repositoriesOnly && !isRepository(tool)) return false;
    if (!terms.length) return true;
    const haystack = normalizeSearch([tool.name, tool.description, tool.utility, tool.url, ...(tool.tags || [])].filter(Boolean).join(' '));
    return terms.every((term) => haystack.includes(term));
  });
}

export function sortCatalog(tools, sort = 'name') {
  const byName = (a, b) => (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
  const timestamp = (tool) => Date.parse(tool.last_updated) || 0;
  return [...tools].sort((a, b) => {
    if (sort === 'name-desc') return byName(b, a);
    if (sort === 'updated') return timestamp(b) - timestamp(a) || byName(a, b);
    if (sort === 'rating') return (Number(b.rating) || 0) - (Number(a.rating) || 0) || byName(a, b);
    return byName(a, b);
  });
}

export function catalogFacets(tools, field) {
  return [...new Set(tools.map((tool) => tool[field]).filter((value) => typeof value === 'string' && value))]
    .sort((a, b) => a.localeCompare(b, 'es'));
}

// Positions are stable as filters change: a constellation keeps its place in the map.
export function buildConstellations(categories, tools, compact = false) {
  const columns = compact ? 2 : categories.length <= 6 ? 3 : 5;
  const rows = Math.ceil(categories.length / columns);
  const byCategory = new Map(categories.map((category) => [category.id, []]));
  for (const tool of tools) byCategory.get(tool.category)?.push(tool);
  return categories.map((category, index) => {
    const row = Math.floor(index / columns);
    const rowCount = Math.min(columns, categories.length - row * columns);
    const cellWidth = compact ? 240 : 1120 / columns;
    return {
      ...category,
      x: (compact ? 240 : 600) + (index % columns - (rowCount - 1) / 2) * cellWidth,
      y: compact ? 70 + row * 137 : 110 + row * (470 / Math.max(1, rows - 1)),
      tools: byCategory.get(category.id),
      shortName: SHORT_CATEGORY_NAMES[category.id] || category.name
    };
  });
}

export function starPosition(index, total, focused = false) {
  const angle = index * 2.399963229728653; // Golden angle prevents aligned overlapping rings.
  const radius = focused ? 42 + Math.sqrt((index + 1) / Math.max(total, 1)) * 222 : 19 + Math.sqrt(index + 1) * 9.8;
  return { x: Math.cos(angle) * radius * (focused ? 1.58 : 1), y: Math.sin(angle) * radius * (focused ? 0.86 : 0.72) };
}
