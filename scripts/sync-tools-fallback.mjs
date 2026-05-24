import fs from 'node:fs/promises'

const toolsDir = new URL('../frontend/src/data/tools/', import.meta.url)
const fallbackToolsPath = new URL('../frontend/src/data/tools.json', import.meta.url)

const PREFERRED_ORDER = [
  'buscadores-generales.json',
  'redes-sociales.json',
  'email.json',
  'dominios-ips.json',
  'geolocalizacion.json',
  'imagenes-videos.json',
  'documentos-metadatos.json',
  'darkweb-amenazas.json',
  'argentina-latam.json',
  'telefonos.json',
  'archivos.json',
  'criptomonedas.json',
  'utilidades-varios.json',
  'analisis-visualizacion.json',
  'sistema-infraestructura.json'
]

const readJson = async (fileUrl) => JSON.parse(await fs.readFile(fileUrl, 'utf8'))

const main = async () => {
  const availableFiles = (await fs.readdir(toolsDir))
    .filter(file => file.endsWith('.json'))
    .sort()

  const orderedFiles = [
    ...PREFERRED_ORDER.filter(file => availableFiles.includes(file)),
    ...availableFiles.filter(file => !PREFERRED_ORDER.includes(file))
  ]

  const tools = []
  for (const file of orderedFiles) {
    const data = await readJson(new URL(file, toolsDir))
    if (Array.isArray(data.tools)) tools.push(...data.tools)
  }

  await fs.writeFile(fallbackToolsPath, `${JSON.stringify({ tools }, null, 2)}\n`)
  console.log(`Fallback sincronizado: ${tools.length} herramientas en frontend/src/data/tools.json`)
}

main().catch(error => {
  console.error('Error sincronizando frontend/src/data/tools.json:', error)
  process.exitCode = 1
})
