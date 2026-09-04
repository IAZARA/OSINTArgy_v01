import { readFile, writeFile } from 'node:fs/promises'

// La API mantiene el temario de evaluación; la copia permite estudiar sin servidor.
const source = new URL('../backend/src/data/academy-assessments.json', import.meta.url)
const target = new URL('../frontend/src/data/academy-assessments.json', import.meta.url)
await writeFile(target, await readFile(source))
