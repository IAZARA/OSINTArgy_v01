export const ACADEMY_PROGRESS_KEY = 'osint-academy-progress-v1'

const resolveStorage = (storage) => {
  if (storage) return storage
  if (typeof globalThis !== 'undefined' && globalThis.localStorage) {
    return globalThis.localStorage
  }
  return null
}

const normalizeCompletedModules = (value) => {
  if (!Array.isArray(value)) return []

  return [...new Set(
    value.filter((moduleId) => typeof moduleId === 'string' && moduleId.trim())
  )]
}

export const getCompletedAcademyModules = (storage) => {
  const targetStorage = resolveStorage(storage)
  if (!targetStorage) return []

  try {
    const storedValue = targetStorage.getItem(ACADEMY_PROGRESS_KEY)
    if (!storedValue) return []
    return normalizeCompletedModules(JSON.parse(storedValue))
  } catch {
    return []
  }
}

export const markAcademyModuleCompleted = (moduleId, storage) => {
  if (typeof moduleId !== 'string' || !moduleId.trim()) {
    return getCompletedAcademyModules(storage)
  }

  const targetStorage = resolveStorage(storage)
  const completedModules = getCompletedAcademyModules(targetStorage)
  if (completedModules.includes(moduleId)) return completedModules

  const nextCompletedModules = [...completedModules, moduleId]

  try {
    targetStorage?.setItem(
      ACADEMY_PROGRESS_KEY,
      JSON.stringify(nextCompletedModules)
    )
  } catch {
    return completedModules
  }

  return nextCompletedModules
}

export const isAcademyModuleCompleted = (moduleId, storage) => (
  getCompletedAcademyModules(storage).includes(moduleId)
)
