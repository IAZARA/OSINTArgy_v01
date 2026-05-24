import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const repoRoot = new URL('..', import.meta.url)
const toolsDir = new URL('../frontend/src/data/tools/', import.meta.url)
const categoriesPath = new URL('../frontend/src/data/categories.json', import.meta.url)
const fallbackToolsPath = new URL('../frontend/src/data/tools.json', import.meta.url)

const REQUIRED_FIELDS = [
  'id',
  'name',
  'description',
  'utility',
  'url',
  'category',
  'subcategory',
  'tags',
  'type',
  'indicators',
  'region',
  'language',
  'rating',
  'usage_count',
  'last_updated',
  'status',
  'requires_registration',
  'is_free',
  'difficulty_level'
]

const ALLOWED_TYPES = new Set([
  'web',
  'desktop',
  'mobile',
  'api',
  'browser-extension',
  'extension',
  'tool',
  'dataset',
  'cli',
  'app',
  'internal'
])

const ALLOWED_INDICATORS = new Set(['D', 'R', 'F', 'P', 'A', 'S', 'G', 'T', 'I', 'M', 'V', 'C'])
const ALLOWED_DIFFICULTY = new Set(['beginner', 'intermediate', 'advanced', 'expert'])
const ALLOWED_STATUS = new Set(['active', 'deprecated', 'offline', 'unknown'])
const ALLOWED_LANGUAGES = new Set(['es', 'en', 'pt', 'fr', 'de', 'it', 'ru', 'zh', 'ja', 'ko', 'multi'])
const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

const readJson = async (fileUrl) => JSON.parse(await fs.readFile(fileUrl, 'utf8'))
const normalizeUrl = (url) => String(url || '').trim().replace(/\/$/, '').toLowerCase()
const isValidUrl = (url) => /^https?:\/\/[^\s]+$/i.test(url) || /^\/[a-z0-9][a-z0-9/_-]*$/i.test(url)
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0

const listToolFiles = async () => {
  const entries = await fs.readdir(toolsDir)
  return entries
    .filter(file => file.endsWith('.json'))
    .sort()
}

const validateTool = ({ tool, file, categoryIds, subcategoryIds }) => {
  const errors = []
  const warnings = []
  const label = `${tool.id || '(sin-id)'} (${file})`

  for (const field of REQUIRED_FIELDS) {
    if (tool[field] === undefined || tool[field] === null || tool[field] === '') {
      errors.push(`${label}: falta el campo ${field}`)
    }
  }

  if (tool.id && !ID_PATTERN.test(tool.id)) {
    errors.push(`${label}: id inválido; usar kebab-case alfanumérico`)
  }

  for (const field of ['name', 'description', 'utility', 'category', 'subcategory', 'region', 'language', 'status', 'difficulty_level']) {
    if (tool[field] !== undefined && !isNonEmptyString(tool[field])) {
      errors.push(`${label}: ${field} debe ser texto no vacío`)
    }
  }

  if (tool.url && !isValidUrl(tool.url)) {
    errors.push(`${label}: url inválida (${tool.url})`)
  }

  if (tool.category && !categoryIds.has(tool.category)) {
    errors.push(`${label}: category no existe en categories.json (${tool.category})`)
  }

  if (tool.subcategory && !subcategoryIds.has(tool.subcategory)) {
    errors.push(`${label}: subcategory no existe en categories.json (${tool.subcategory})`)
  }

  if (tool.type && !ALLOWED_TYPES.has(tool.type)) {
    errors.push(`${label}: type no permitido (${tool.type})`)
  }

  if (tool.language && !ALLOWED_LANGUAGES.has(tool.language)) {
    warnings.push(`${label}: language no está en el set recomendado (${tool.language})`)
  }

  if (tool.status && !ALLOWED_STATUS.has(tool.status)) {
    errors.push(`${label}: status no permitido (${tool.status})`)
  }

  if (tool.difficulty_level && !ALLOWED_DIFFICULTY.has(tool.difficulty_level)) {
    errors.push(`${label}: difficulty_level no permitido (${tool.difficulty_level})`)
  }

  if (!Array.isArray(tool.tags) || tool.tags.length === 0) {
    errors.push(`${label}: tags debe ser un array no vacío`)
  } else if (tool.tags.some(tag => !isNonEmptyString(tag))) {
    errors.push(`${label}: tags contiene valores inválidos`)
  }

  if (!Array.isArray(tool.indicators) || tool.indicators.length === 0) {
    errors.push(`${label}: indicators debe ser un array no vacío`)
  } else {
    for (const indicator of tool.indicators) {
      if (!ALLOWED_INDICATORS.has(indicator)) {
        errors.push(`${label}: indicator no permitido (${indicator})`)
      }
    }
  }

  if (typeof tool.rating !== 'number' || tool.rating < 0 || tool.rating > 5) {
    errors.push(`${label}: rating debe ser número entre 0 y 5`)
  }

  if (!Number.isInteger(tool.usage_count) || tool.usage_count < 0) {
    errors.push(`${label}: usage_count debe ser entero no negativo`)
  }

  if (tool.last_updated && !DATE_PATTERN.test(tool.last_updated)) {
    errors.push(`${label}: last_updated debe tener formato YYYY-MM-DD`)
  }

  if (typeof tool.requires_registration !== 'boolean') {
    errors.push(`${label}: requires_registration debe ser boolean`)
  }

  if (typeof tool.is_free !== 'boolean') {
    errors.push(`${label}: is_free debe ser boolean`)
  }

  return { errors, warnings }
}

const main = async () => {
  const categoriesData = await readJson(categoriesPath)
  const categories = categoriesData.categories || []
  const categoryIds = new Set(categories.map(category => category.id))
  const subcategoryIds = new Set(categories.flatMap(category => (category.subcategories || []).map(sub => sub.id)))
  const files = await listToolFiles()
  const allTools = []
  const errors = []
  const warnings = []

  for (const file of files) {
    const fileUrl = new URL(file, toolsDir)
    const data = await readJson(fileUrl)

    if (!isNonEmptyString(data.category)) {
      errors.push(`${file}: falta category en la raíz del archivo`)
    }

    if (!Array.isArray(data.tools)) {
      errors.push(`${file}: tools debe ser un array`)
      continue
    }

    for (const tool of data.tools) {
      allTools.push({ tool, file })

      if (data.category && tool.category && data.category !== tool.category) {
        warnings.push(`${tool.id || '(sin-id)'} (${file}): category del archivo (${data.category}) difiere de la herramienta (${tool.category})`)
      }

      const result = validateTool({ tool, file, categoryIds, subcategoryIds })
      errors.push(...result.errors)
      warnings.push(...result.warnings)
    }
  }

  const ids = new Map()
  const urls = new Map()
  for (const entry of allTools) {
    if (entry.tool.id) {
      ids.set(entry.tool.id, [...(ids.get(entry.tool.id) || []), entry.file])
    }
    const normalizedUrl = normalizeUrl(entry.tool.url)
    if (normalizedUrl) {
      urls.set(normalizedUrl, [...(urls.get(normalizedUrl) || []), `${entry.tool.id}@${entry.file}`])
    }
  }

  for (const [id, locations] of ids.entries()) {
    if (locations.length > 1) {
      errors.push(`id duplicado "${id}" en ${locations.join(', ')}`)
    }
  }

  const duplicateUrls = [...urls.entries()].filter(([, locations]) => locations.length > 1)
  for (const [url, locations] of duplicateUrls) {
    warnings.push(`url duplicada "${url}" en ${locations.join(', ')}`)
  }

  const fallbackData = await readJson(fallbackToolsPath)
  if (!Array.isArray(fallbackData.tools)) {
    errors.push('frontend/src/data/tools.json: tools debe ser un array')
  } else {
    const catalogIds = new Set(allTools.map(entry => entry.tool.id).filter(Boolean))
    const fallbackIds = new Set(fallbackData.tools.map(tool => tool.id).filter(Boolean))
    const missingInFallback = [...catalogIds].filter(id => !fallbackIds.has(id)).sort()
    const extraInFallback = [...fallbackIds].filter(id => !catalogIds.has(id)).sort()

    if (missingInFallback.length > 0) {
      errors.push(`frontend/src/data/tools.json no incluye ${missingInFallback.length} herramientas del catálogo: ${missingInFallback.join(', ')}`)
    }

    if (extraInFallback.length > 0) {
      errors.push(`frontend/src/data/tools.json incluye ${extraInFallback.length} herramientas fuera del catálogo: ${extraInFallback.join(', ')}`)
    }
  }

  const summary = {
    files: files.length,
    tools: allTools.length,
    categories: categoryIds.size,
    subcategories: subcategoryIds.size,
    warnings: warnings.length,
    errors: errors.length
  }

  console.log(`Catálogo OSINTArgy: ${summary.tools} herramientas en ${summary.files} archivos`)
  console.log(`Categorías: ${summary.categories}; subcategorías: ${summary.subcategories}`)

  if (warnings.length > 0) {
    console.log('\nAdvertencias:')
    for (const warning of warnings) console.log(`- ${warning}`)
  }

  if (errors.length > 0) {
    console.error('\nErrores:')
    for (const error of errors) console.error(`- ${error}`)
    process.exitCode = 1
    return
  }

  console.log('\nValidación de catálogo completada sin errores.')
}

main().catch(error => {
  console.error(`Error validando catálogo desde ${path.relative(process.cwd(), repoRoot.pathname)}:`, error)
  process.exitCode = 1
})
