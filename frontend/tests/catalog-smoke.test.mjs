import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

const repoRoot = new URL('../..', import.meta.url)
const toolsDir = new URL('frontend/src/data/tools/', repoRoot)
const categoriesPath = new URL('frontend/src/data/categories.json', repoRoot)
const fallbackPath = new URL('frontend/src/data/tools.json', repoRoot)

const readJson = (fileUrl) => JSON.parse(readFileSync(fileUrl, 'utf8'))

test('frontend catalog loads every category file into the fallback dataset', () => {
  const categoryFiles = readdirSync(toolsDir)
    .filter(file => file.endsWith('.json'))
    .sort()

  const tools = categoryFiles.flatMap(file => readJson(join(toolsDir.pathname, file)).tools)
  const fallbackTools = readJson(fallbackPath).tools

  assert.equal(categoryFiles.length, 15)
  assert.ok(tools.length > 0)
  assert.equal(fallbackTools.length, tools.length)
  assert.deepEqual(
    fallbackTools.map(tool => tool.id).sort(),
    tools.map(tool => tool.id).sort()
  )
})

test('frontend catalog keeps ids unique and categories valid', () => {
  const categoryIds = new Set(readJson(categoriesPath).categories.map(category => category.id))
  const categoryFiles = readdirSync(toolsDir).filter(file => file.endsWith('.json'))
  const tools = categoryFiles.flatMap(file => readJson(join(toolsDir.pathname, file)).tools)
  const ids = tools.map(tool => tool.id)

  assert.equal(new Set(ids).size, ids.length)
  for (const tool of tools) {
    assert.ok(categoryIds.has(tool.category), `${tool.id} has unknown category ${tool.category}`)
  }
})

test('newly researched tools render from the frontend dataset', () => {
  const fallbackTools = readJson(fallbackPath).tools
  const ids = new Set(fallbackTools.map(tool => tool.id))

  for (const id of [
    'opencti',
    'intelowl',
    'qgis',
    'dune',
    'datos-gob-ar',
    'social-analyzer',
    'maigret',
    'archivebox',
    'opensanctions',
    'github-repo-web-check',
    'h8mail',
    'subfinder',
    'projectdiscovery-httpx',
    'wayback-google-analytics',
    'bbot',
    'telegram-phone-number-checker',
    'telegago',
    'bellingcat-tiktok-timestamp',
    'bellingcat-tiktok-hashtag-analysis',
    'uniform-timezone',
    'enola',
    'snoop-project'
  ]) {
    assert.ok(ids.has(id), `${id} should be available in the frontend fallback catalog`)
  }
})
