import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const toolsDir = new URL('../frontend/src/data/tools/', import.meta.url)

const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_CONCURRENCY = 8
const REACHABLE_RESTRICTED_STATUSES = new Set([401, 403, 405, 429])
const TRANSIENT_STATUSES = new Set([408, 425])
const BROKEN_STATUSES = new Set([404, 410, 451])

const parseArgs = () => {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    timeout: DEFAULT_TIMEOUT_MS,
    reportOnly: false,
    output: null,
    markdown: null,
    limit: null
  }

  const args = process.argv.slice(2)
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    const next = args[index + 1]

    if (arg === '--report-only') options.reportOnly = true
    if (arg === '--concurrency' && next) {
      options.concurrency = Number.parseInt(next, 10)
      index += 1
    }
    if (arg === '--timeout' && next) {
      options.timeout = Number.parseInt(next, 10)
      index += 1
    }
    if (arg === '--output' && next) {
      options.output = next
      index += 1
    }
    if (arg === '--markdown' && next) {
      options.markdown = next
      index += 1
    }
    if (arg === '--limit' && next) {
      options.limit = Number.parseInt(next, 10)
      index += 1
    }
  }

  options.concurrency = Number.isFinite(options.concurrency) && options.concurrency > 0
    ? options.concurrency
    : DEFAULT_CONCURRENCY
  options.timeout = Number.isFinite(options.timeout) && options.timeout > 0
    ? options.timeout
    : DEFAULT_TIMEOUT_MS

  return options
}

const readJson = async (fileUrl) => JSON.parse(await fs.readFile(fileUrl, 'utf8'))

const listTools = async () => {
  const files = (await fs.readdir(toolsDir))
    .filter(file => file.endsWith('.json'))
    .sort()

  const tools = []
  for (const file of files) {
    const data = await readJson(new URL(file, toolsDir))
    for (const tool of data.tools || []) {
      tools.push({
        id: tool.id,
        name: tool.name,
        url: tool.url,
        category: tool.category,
        file
      })
    }
  }

  return tools
}

const shouldSkip = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return 'URL vacía'
  if (rawUrl.startsWith('/')) return 'ruta interna'

  try {
    const url = new URL(rawUrl)
    if (url.hostname.endsWith('.onion')) return 'servicio onion'
    if (!['http:', 'https:'].includes(url.protocol)) return `protocolo no soportado (${url.protocol})`
    return null
  } catch {
    return 'URL inválida'
  }
}

const classifyStatus = (status) => {
  if (status >= 200 && status < 400) return 'ok'
  if (REACHABLE_RESTRICTED_STATUSES.has(status)) return 'ok'
  if (BROKEN_STATUSES.has(status)) return 'broken'
  if (TRANSIENT_STATUSES.has(status) || status >= 500) return 'warning'
  if (status >= 400) return 'warning'
  return 'warning'
}

const request = async ({ method, url, timeout }) => {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(timeout),
    headers: {
      'user-agent': 'OSINTArgy link checker (+https://github.com/IAZARA/OSINTArgy_v01)'
    }
  })

  await response.body?.cancel?.()

  return {
    status: response.status,
    finalUrl: response.url
  }
}

const checkUrl = async (tool, options) => {
  const skipReason = shouldSkip(tool.url)
  if (skipReason) {
    return {
      ...tool,
      result: 'skipped',
      reason: skipReason
    }
  }

  try {
    let response = await request({ method: 'HEAD', url: tool.url, timeout: options.timeout })

    const shouldRetryWithGet = [405, 501].includes(response.status)
      || (response.status >= 400 && !REACHABLE_RESTRICTED_STATUSES.has(response.status))

    if (shouldRetryWithGet) {
      response = await request({ method: 'GET', url: tool.url, timeout: options.timeout })
    }

    return {
      ...tool,
      result: classifyStatus(response.status),
      status: response.status,
      finalUrl: response.finalUrl
    }
  } catch (error) {
    return {
      ...tool,
      result: 'warning',
      reason: error?.name === 'TimeoutError' ? 'timeout' : error.message
    }
  }
}

const runPool = async (items, worker, concurrency) => {
  const results = []
  let nextIndex = 0

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await worker(items[currentIndex])
    }
  })

  await Promise.all(workers)
  return results
}

const summarize = (results) => {
  const summary = {
    total: results.length,
    ok: results.filter(result => result.result === 'ok').length,
    broken: results.filter(result => result.result === 'broken').length,
    warning: results.filter(result => result.result === 'warning').length,
    skipped: results.filter(result => result.result === 'skipped').length
  }

  return {
    generatedAt: new Date().toISOString(),
    summary,
    results
  }
}

const markdownReport = ({ generatedAt, summary, results }) => {
  const rows = [
    '# OSINTArgy Link Check',
    '',
    `Generado: ${generatedAt}`,
    '',
    '| Estado | Cantidad |',
    '| --- | ---: |',
    `| OK | ${summary.ok} |`,
    `| Advertencias | ${summary.warning} |`,
    `| Rotos | ${summary.broken} |`,
    `| Omitidos | ${summary.skipped} |`,
    `| Total | ${summary.total} |`,
    ''
  ]

  const notable = results.filter(result => ['broken', 'warning'].includes(result.result))
  if (notable.length > 0) {
    rows.push('## Revisar', '')
    rows.push('| Resultado | HTTP | Herramienta | URL | Motivo |')
    rows.push('| --- | ---: | --- | --- | --- |')
    for (const result of notable.slice(0, 100)) {
      rows.push(`| ${result.result} | ${result.status || ''} | ${result.id} | ${result.url} | ${result.reason || result.finalUrl || ''} |`)
    }
    if (notable.length > 100) rows.push(`| ... | | ${notable.length - 100} entradas adicionales | | |`)
  }

  return `${rows.join('\n')}\n`
}

const main = async () => {
  const options = parseArgs()
  let tools = await listTools()
  if (options.limit) tools = tools.slice(0, options.limit)

  console.log(`Revisando ${tools.length} URLs del catálogo con concurrencia ${options.concurrency}`)

  const results = await runPool(
    tools,
    tool => checkUrl(tool, options),
    options.concurrency
  )
  const report = summarize(results)

  console.log(`OK: ${report.summary.ok}`)
  console.log(`Advertencias: ${report.summary.warning}`)
  console.log(`Rotos: ${report.summary.broken}`)
  console.log(`Omitidos: ${report.summary.skipped}`)

  if (options.output) {
    await fs.writeFile(options.output, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`Reporte JSON: ${path.relative(process.cwd(), options.output)}`)
  }

  if (options.markdown) {
    await fs.writeFile(options.markdown, markdownReport(report))
    console.log(`Reporte Markdown: ${path.relative(process.cwd(), options.markdown)}`)
  }

  if (report.summary.broken > 0 && !options.reportOnly) {
    process.exitCode = 1
  }
}

main().catch(error => {
  console.error('Error revisando links del catálogo:', error)
  process.exitCode = 1
})
