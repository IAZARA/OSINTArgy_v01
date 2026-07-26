import {
  LEGACY_INVESTIGATION_STORAGE_KEY,
  normalizeInvestigationProject,
  parseInvestigationProject
} from '../utils/investigationProject.js'

export const CASES_FALLBACK_STORAGE_KEY = 'osintargy-investigation-cases-v2'
export const ACTIVE_CASE_STORAGE_KEY = 'osintargy-active-case-v2'

const DATABASE_NAME = 'osintargy-investigations'
const DATABASE_VERSION = 1
const CASES_STORE = 'cases'

const requestResult = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result)
  request.onerror = () => reject(request.error || new Error('Falló una operación de almacenamiento.'))
})

const transactionDone = (transaction) => new Promise((resolve, reject) => {
  transaction.oncomplete = () => resolve()
  transaction.onerror = () => reject(transaction.error || new Error('Falló la transacción.'))
  transaction.onabort = () => reject(transaction.error || new Error('La transacción fue cancelada.'))
})

const readFallbackCases = (storage) => {
  if (!storage) return []
  try {
    const parsed = JSON.parse(storage.getItem(CASES_FALLBACK_STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((project) => {
      try {
        return [normalizeInvestigationProject(project)]
      } catch {
        return []
      }
    })
  } catch {
    return []
  }
}

const writeFallbackCases = (storage, cases) => {
  if (!storage) throw new Error('El navegador no permite almacenamiento persistente.')
  storage.setItem(CASES_FALLBACK_STORAGE_KEY, JSON.stringify(cases))
}

export const createCaseRepository = ({
  indexedDB = globalThis.indexedDB,
  storage = globalThis.localStorage
} = {}) => {
  let databasePromise = null
  let mode = indexedDB ? 'indexeddb' : 'localstorage'
  let lastError = null

  const openDatabase = () => {
    if (!indexedDB) return Promise.reject(new Error('IndexedDB no está disponible.'))
    if (databasePromise) return databasePromise

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(CASES_STORE)) {
          const store = database.createObjectStore(CASES_STORE, { keyPath: 'id' })
          store.createIndex('updatedAt', 'updatedAt')
          store.createIndex('status', 'status')
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        databasePromise = null
        reject(request.error || new Error('No se pudo abrir IndexedDB.'))
      }
      request.onblocked = () => reject(new Error('La base local está bloqueada por otra pestaña.'))
    })

    return databasePromise
  }

  const activateFallback = (error) => {
    mode = 'localstorage'
    lastError = error instanceof Error ? error : new Error(String(error))
  }

  const runWithFallback = async (indexedAction, fallbackAction) => {
    if (mode === 'indexeddb') {
      try {
        return await indexedAction()
      } catch (error) {
        activateFallback(error)
      }
    }
    try {
      return await fallbackAction()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      throw lastError
    }
  }

  const listCases = () => runWithFallback(
    async () => {
      const database = await openDatabase()
      const transaction = database.transaction(CASES_STORE, 'readonly')
      const cases = await requestResult(transaction.objectStore(CASES_STORE).getAll())
      return cases.map(normalizeInvestigationProject)
    },
    () => readFallbackCases(storage)
  )

  const getCase = (id) => runWithFallback(
    async () => {
      const database = await openDatabase()
      const transaction = database.transaction(CASES_STORE, 'readonly')
      const result = await requestResult(transaction.objectStore(CASES_STORE).get(id))
      return result ? normalizeInvestigationProject(result) : null
    },
    () => readFallbackCases(storage).find((project) => project.id === id) || null
  )

  const putCase = (project) => {
    const normalized = normalizeInvestigationProject(project)
    return runWithFallback(
      async () => {
        const database = await openDatabase()
        const transaction = database.transaction(CASES_STORE, 'readwrite')
        transaction.objectStore(CASES_STORE).put(normalized)
        await transactionDone(transaction)
        return normalized
      },
      () => {
        const cases = readFallbackCases(storage)
        const index = cases.findIndex((item) => item.id === normalized.id)
        if (index >= 0) cases[index] = normalized
        else cases.push(normalized)
        writeFallbackCases(storage, cases)
        return normalized
      }
    )
  }

  const deleteCase = (id) => runWithFallback(
    async () => {
      const database = await openDatabase()
      const transaction = database.transaction(CASES_STORE, 'readwrite')
      transaction.objectStore(CASES_STORE).delete(id)
      await transactionDone(transaction)
      return true
    },
    () => {
      const cases = readFallbackCases(storage).filter((project) => project.id !== id)
      writeFallbackCases(storage, cases)
      return true
    }
  )

  const migrateLegacyProject = async () => {
    if (!storage) return null
    const rawProject = storage.getItem(LEGACY_INVESTIGATION_STORAGE_KEY)
    if (!rawProject) return null

    const migrated = parseInvestigationProject(rawProject)
    await putCase(migrated)
    const verified = await getCase(migrated.id)
    if (!verified) throw new Error('No se pudo verificar la migración del proyecto anterior.')
    storage.removeItem(LEGACY_INVESTIGATION_STORAGE_KEY)
    return verified.id
  }

  const initialize = async () => {
    if (mode === 'indexeddb') {
      try {
        await openDatabase()
      } catch (error) {
        activateFallback(error)
      }
    }

    let migratedCaseId = null
    try {
      migratedCaseId = await migrateLegacyProject()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
    }

    return { mode, migratedCaseId, error: lastError }
  }

  return {
    initialize,
    listCases,
    getCase,
    putCase,
    deleteCase,
    getMode: () => mode,
    getLastError: () => lastError
  }
}

export const caseRepository = createCaseRepository()
