import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  createEmptyInvestigationProject,
  createInvestigationId,
  duplicateInvestigationProject,
  normalizeInvestigationProject,
  parseInvestigationProject
} from '@utils/investigationProject'
import {
  ACTIVE_CASE_STORAGE_KEY,
  caseRepository
} from '@services/caseRepository'

const CaseContext = createContext(null)

const sortCases = (cases) => [...cases].sort(
  (a, b) => new Date(b.lastOpenedAt || b.updatedAt) - new Date(a.lastOpenedAt || a.updatedAt)
)

export function CaseProvider({ children }) {
  const [cases, setCases] = useState([])
  const [activeCaseId, setActiveCaseIdState] = useState(
    () => globalThis.localStorage?.getItem(ACTIVE_CASE_STORAGE_KEY) || null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [storageMode, setStorageMode] = useState('indexeddb')
  const [storageError, setStorageError] = useState(null)

  const refreshCases = useCallback(async () => {
    const storedCases = sortCases(await caseRepository.listCases())
    setCases(storedCases)
    setStorageMode(caseRepository.getMode())
    setStorageError(caseRepository.getLastError())
    return storedCases
  }, [])

  useEffect(() => {
    let cancelled = false

    const initialize = async () => {
      try {
        const result = await caseRepository.initialize()
        const storedCases = sortCases(await caseRepository.listCases())
        if (cancelled) return

        setCases(storedCases)
        setStorageMode(result.mode)
        setStorageError(result.error)
        setActiveCaseIdState((current) => {
          const preferred = result.migratedCaseId || current
          if (preferred && storedCases.some((project) => project.id === preferred)) return preferred
          return storedCases.find((project) => project.status === 'active')?.id || null
        })
      } catch (error) {
        if (!cancelled) setStorageError(error)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    initialize()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!globalThis.localStorage) return
    if (activeCaseId) globalThis.localStorage.setItem(ACTIVE_CASE_STORAGE_KEY, activeCaseId)
    else globalThis.localStorage.removeItem(ACTIVE_CASE_STORAGE_KEY)
  }, [activeCaseId])

  const setActiveCaseId = useCallback((caseId) => {
    setActiveCaseIdState(caseId || null)
  }, [])

  const saveCase = useCallback(async (project, options = {}) => {
    const normalized = normalizeInvestigationProject({
      ...project,
      updatedAt: new Date().toISOString(),
      lastOpenedAt: options.touch === false ? project.lastOpenedAt : new Date().toISOString()
    })
    const saved = await caseRepository.putCase(normalized)
    setCases((current) => sortCases([
      saved,
      ...current.filter((item) => item.id !== saved.id)
    ]))
    setStorageMode(caseRepository.getMode())
    setStorageError(caseRepository.getLastError())
    if (options.activate !== false) setActiveCaseIdState(saved.id)
    return saved
  }, [])

  const createCase = useCallback(async (values = {}) => {
    const project = createEmptyInvestigationProject(values.name, values)
    return saveCase(project)
  }, [saveCase])

  const createDemoCase = useCallback(async (projectFactory) => {
    const project = projectFactory()
    return saveCase(project)
  }, [saveCase])

  const importCase = useCallback(async (contents) => {
    const imported = parseInvestigationProject(contents)
    const existing = cases.some((project) => project.id === imported.id)
    const project = existing
      ? {
        ...imported,
        id: createInvestigationId('case'),
        name: `${imported.name} — importado`,
        createdAt: new Date().toISOString()
      }
      : imported
    return saveCase(project)
  }, [cases, saveCase])

  const duplicateCase = useCallback(async (caseId) => {
    const source = cases.find((project) => project.id === caseId)
    if (!source) throw new Error('No se encontró el caso para duplicar.')
    return saveCase(duplicateInvestigationProject(source))
  }, [cases, saveCase])

  const updateCaseMetadata = useCallback(async (caseId, patch) => {
    const source = cases.find((project) => project.id === caseId)
    if (!source) throw new Error('No se encontró el caso.')
    return saveCase({ ...source, ...patch }, { activate: false, touch: false })
  }, [cases, saveCase])

  const archiveCase = useCallback(
    (caseId) => updateCaseMetadata(caseId, { status: 'archived' }),
    [updateCaseMetadata]
  )

  const restoreCase = useCallback(
    (caseId) => updateCaseMetadata(caseId, { status: 'active' }),
    [updateCaseMetadata]
  )

  const deleteCase = useCallback(async (caseId) => {
    const source = cases.find((project) => project.id === caseId)
    if (!source || source.status !== 'archived') {
      throw new Error('Solo se pueden eliminar permanentemente casos archivados.')
    }
    await caseRepository.deleteCase(caseId)
    setCases((current) => current.filter((project) => project.id !== caseId))
    setActiveCaseIdState((current) => current === caseId ? null : current)
  }, [cases])

  const addFindingFromTool = useCallback(async (tool, values = {}) => {
    const targetId = values.caseId || activeCaseId
    const project = cases.find((item) => item.id === targetId)
    if (!project) throw new Error('Elegí un caso activo antes de registrar el hallazgo.')

    const finding = {
      id: createInvestigationId('finding'),
      title: values.title || `Revisar con ${tool.name}`,
      url: values.url ?? tool.url ?? '',
      sourceName: values.sourceName || tool.name,
      toolId: tool.id || '',
      toolName: tool.name || '',
      observedAt: values.observedAt || new Date().toISOString().slice(0, 10),
      capturedAt: new Date().toISOString(),
      notes: values.notes || tool.description || '',
      verification: values.verification || 'unverified',
      entityIds: values.entityIds || [],
      locationIds: values.locationIds || []
    }

    const saved = await saveCase(
      { ...project, findings: [...project.findings, finding] },
      { activate: true }
    )
    return { project: saved, finding }
  }, [activeCaseId, cases, saveCase])

  const activeCase = cases.find((project) => project.id === activeCaseId) || null
  const activeCases = useMemo(() => cases.filter((project) => project.status === 'active'), [cases])
  const archivedCases = useMemo(() => cases.filter((project) => project.status === 'archived'), [cases])

  const value = useMemo(() => ({
    cases,
    activeCases,
    archivedCases,
    activeCase,
    activeCaseId,
    isLoading,
    storageMode,
    storageError,
    setActiveCaseId,
    refreshCases,
    createCase,
    createDemoCase,
    importCase,
    saveCase,
    duplicateCase,
    updateCaseMetadata,
    archiveCase,
    restoreCase,
    deleteCase,
    addFindingFromTool,
    getCaseById: (caseId) => cases.find((project) => project.id === caseId) || null
  }), [
    cases,
    activeCases,
    archivedCases,
    activeCase,
    activeCaseId,
    isLoading,
    storageMode,
    storageError,
    setActiveCaseId,
    refreshCases,
    createCase,
    createDemoCase,
    importCase,
    saveCase,
    duplicateCase,
    updateCaseMetadata,
    archiveCase,
    restoreCase,
    deleteCase,
    addFindingFromTool
  ])

  return <CaseContext.Provider value={value}>{children}</CaseContext.Provider>
}

export function useCases() {
  const context = useContext(CaseContext)
  if (!context) throw new Error('useCases debe utilizarse dentro de CaseProvider.')
  return context
}
