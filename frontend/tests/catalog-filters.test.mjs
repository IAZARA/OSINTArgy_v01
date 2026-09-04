import assert from 'node:assert/strict';
import test from 'node:test';
import { buildConstellations, catalogFacets, EMPTY_FILTERS, filterCatalog, isRepository, safeToolUrl, sortCatalog, starPosition } from '../src/components/GalaxyView/catalogModel.js';

const tools = [
  { id: 'a', name: 'Árbol Público', description: 'Información geográfica', tags: ['argentina'], category: 'maps', region: 'argentina', type: 'cli', language: 'es', difficulty_level: 'beginner', is_free: true, requires_registration: false, url: 'https://github.com/example/maps', last_updated: '2026-09-04', rating: 4 },
  { id: 'b', name: 'Beta', description: 'Datos públicos', tags: ['argentina'], category: 'maps', region: 'argentina', type: 'web', language: 'es', difficulty_level: 'intermediate', is_free: false, requires_registration: true, url: 'https://example.org/maps', last_updated: '2025-01-01', rating: 5 },
  { id: 'c', name: 'Gamma', category: 'web', region: 'internacional', type: 'cli', language: 'en', difficulty_level: 'advanced', is_free: true, requires_registration: false, url: 'https://gitlab.com/example/search', last_updated: 'invalid' },
  { id: 'd', name: 'Delta', category: 'web', url: 'https://example.org' }
];
const ids = (items) => items.map((item) => item.id);

test('combines all catalog facets, including repository detection without overriding CLI type', () => {
  const results = filterCatalog(tools, { ...EMPTY_FILTERS, query: 'arbol geografica', category: 'maps', region: 'argentina', type: 'cli', cost: 'free', registration: 'none', difficulty: 'beginner', language: 'es', repositoriesOnly: true });
  assert.deepEqual(ids(results), ['a']);
  assert.deepEqual(ids(filterCatalog(tools, { region: 'argentina', cost: 'paid', registration: 'required' })), ['b']);
  assert.deepEqual(ids(filterCatalog(tools, { region: 'argentina', language: 'en' })), []);
});

test('search is accent insensitive and requires every term across name, description and tags', () => {
  assert.deepEqual(ids(filterCatalog(tools, { query: '  PUBLICO   ARGENTINA ' })), ['a', 'b']);
  assert.deepEqual(ids(filterCatalog(tools, { query: 'arbol github' })), ['a']);
  assert.deepEqual(filterCatalog(tools, { query: 'arbol desconocido' }), []);
  assert.deepEqual(ids(filterCatalog(tools, { query: 'delta' })), ['d']);
  assert.equal(filterCatalog(tools, EMPTY_FILTERS).length, tools.length);
});

test('unknown cost or registration metadata is not advertised as free or without account', () => {
  assert.deepEqual(ids(filterCatalog(tools, { cost: 'free' })), ['a', 'c']);
  assert.deepEqual(ids(filterCatalog(tools, { registration: 'none' })), ['a', 'c']);
});

test('sorts a copy with Spanish collation and stable fallbacks for missing metadata', () => {
  const original = ids(tools);
  assert.deepEqual(ids(sortCatalog(tools)), ['a', 'b', 'd', 'c']);
  assert.deepEqual(ids(sortCatalog(tools, 'name-desc')), ['c', 'd', 'b', 'a']);
  assert.deepEqual(ids(sortCatalog(tools, 'updated')), ['a', 'b', 'd', 'c']);
  assert.deepEqual(ids(sortCatalog(tools, 'rating')), ['b', 'a', 'd', 'c']);
  assert.deepEqual(ids(tools), original);
});

test('repository facet uses the hostname and does not match deceptive paths or suffixes', () => {
  assert.equal(isRepository({ url: 'https://github.com/example/tool' }), true);
  assert.equal(isRepository({ url: 'https://github.com.evil.example/tool' }), false);
  assert.equal(isRepository({ url: 'https://example.org/github.com/tool' }), false);
  assert.equal(isRepository({ url: 'invalid' }), false);
  assert.deepEqual(catalogFacets(tools, 'type'), ['cli', 'web']);
});

test('source URLs allow web and internal tools and reject executable or protocol-relative destinations', () => {
  assert.equal(safeToolUrl('https://example.org/tool'), 'https://example.org/tool');
  assert.equal(safeToolUrl('/academy/dork-simulator'), '/academy/dork-simulator');
  for (const url of ['javascript:alert(1)', 'data:text/html,test', '//example.org', '/\\example.org', null]) assert.equal(safeToolUrl(url), null);
});

test('constellation positions remain stable when search or filters reduce the tools', () => {
  const categories = Array.from({ length: 14 }, (_, index) => ({ id: index === 0 ? 'maps' : `category-${index}`, name: `Category ${index}` }));
  const all = buildConstellations(categories, tools);
  const filtered = buildConstellations(categories, [tools[0]]);
  assert.deepEqual(all.map(({ x, y }) => [x, y]), filtered.map(({ x, y }) => [x, y]));
  assert.equal(all[0].tools.length, 2);
  assert.equal(filtered[0].tools.length, 1);
  assert.equal(new Set(all.map(({ x, y }) => `${x}:${y}`)).size, 14);
  assert.ok(all.every(({ x, y }) => Number.isFinite(x) && Number.isFinite(y) && x > 0 && x < 1200 && y > 0 && y < 720));
});

test('focused constellation includes deterministic positions for every source without a sample cap', () => {
  const positions = Array.from({ length: 150 }, (_, index) => starPosition(index, 150, true));
  assert.equal(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size, 150);
  assert.deepEqual(positions[42], starPosition(42, 150, true));
  assert.ok(positions.every(({ x, y }) => Math.abs(x) < 460 && Math.abs(y) < 240));
});

test('mobile layout uses two readable columns and keeps every constellation within bounds', () => {
  const categories = Array.from({ length: 14 }, (_, index) => ({ id: `category-${index}`, name: `Category ${index}` }));
  const clusters = buildConstellations(categories, [], true);
  assert.deepEqual([...new Set(clusters.map(({ x }) => x))], [120, 360]);
  assert.equal(new Set(clusters.map(({ y }) => y)).size, 7);
  assert.ok(clusters.every(({ x, y }) => x - 104 >= 0 && x + 104 <= 480 && y + 89 < 1050));
});
