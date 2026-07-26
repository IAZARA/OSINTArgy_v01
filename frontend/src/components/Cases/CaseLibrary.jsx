import React, { useMemo, useRef, useState } from 'react'
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Copy,
  Download,
  FileSearch,
  FolderOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Link, useNavigate } from '@/lib/router'
import { useCases } from '@/context/CaseContext'
import {
  OBJECTIVE_TYPES,
  buildSafeFilename,
  serializeInvestigationProject
} from '@utils/investigationProject'
import CaseWizard from './CaseWizard'
import './Cases.css'

const downloadCase = (project) => {
  const url = URL.createObjectURL(new Blob(
    [serializeInvestigationProject(project)],
    { type: 'application/json' }
  ))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = buildSafeFilename(project.name)
  anchor.click()
  URL.revokeObjectURL(url)
}

const formatDate = (value) => new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
}).format(new Date(value))

export default function CaseLibrary() {
  const {
    activeCases,
    archivedCases,
    storageMode,
    createCase,
    importCase,
    duplicateCase,
    updateCaseMetadata,
    archiveCase,
    restoreCase,
    deleteCase,
    setActiveCaseId
  } = useCases()
  const navigate = useNavigate()
  const importRef = useRef(null)
  const [view, setView] = useState('active')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('recent')
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)

  const sourceCases = view === 'active' ? activeCases : archivedCases
  const filteredCases = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('es')
    const matches = term
      ? sourceCases.filter((project) => (
        `${project.name} ${project.objective} ${project.description}`.toLocaleLowerCase('es').includes(term)
      ))
      : sourceCases

    return [...matches].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'es')
      if (sort === 'created') return new Date(b.createdAt) - new Date(a.createdAt)
      return new Date(b.lastOpenedAt || b.updatedAt) - new Date(a.lastOpenedAt || a.updatedAt)
    })
  }, [query, sort, sourceCases])

  const openCase = (project) => {
    setActiveCaseId(project.id)
    navigate(`/investigation-board/${project.id}`)
  }

  const handleCreate = async (values) => {
    const project = await createCase(values)
    setIsWizardOpen(false)
    navigate(`/investigation-board/${project.id}`)
  }

  const handleImport = async (event) => {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) return
    try {
      const project = await importCase(await file.text())
      toast.success('Caso importado y validado.')
      openCase(project)
    } catch (error) {
      toast.error(error.message)
    }
  }

  const saveRename = async (project) => {
    const name = editingName.trim()
    if (!name) return
    await updateCaseMetadata(project.id, { name })
    setEditingId(null)
    toast.success('Caso renombrado.')
  }

  const handleDelete = async (project, exportFirst = false) => {
    try {
      if (exportFirst) downloadCase(project)
      await deleteCase(project.id)
      setPendingDelete(null)
      toast.success('Caso eliminado permanentemente.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  return (
    <div className="case-library">
      <header className="case-page-header">
        <Link to="/" className="case-page-header__back" aria-label="Volver al centro">
          <ArrowLeft size={19} />
        </Link>
        <div>
          <span>Espacio local</span>
          <h1>Biblioteca de investigaciones</h1>
          <p>Retomá, respaldá y organizá casos sin enviar datos fuera del navegador.</p>
        </div>
        <button className="case-button case-button--primary" onClick={() => setIsWizardOpen(true)}>
          <Plus size={18} /> Nueva investigación
        </button>
      </header>

      {storageMode === 'localstorage' && (
        <div className="case-storage-warning" role="status">
          El navegador está usando almacenamiento limitado. Exportá respaldos con frecuencia.
        </div>
      )}

      <main className="case-library__content">
        <div className="case-library__toolbar">
          <div className="case-library__tabs" role="tablist" aria-label="Estado de casos">
            <button
              role="tab"
              aria-selected={view === 'active'}
              className={view === 'active' ? 'is-active' : ''}
              onClick={() => setView('active')}
            >
              Activos <span>{activeCases.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={view === 'archived'}
              className={view === 'archived' ? 'is-active' : ''}
              onClick={() => setView('archived')}
            >
              Archivados <span>{archivedCases.length}</span>
            </button>
          </div>
          <label className="case-search">
            <Search size={17} />
            <input
              value={query}
              placeholder="Buscar por nombre, objetivo o contexto…"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <select aria-label="Ordenar casos" value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="recent">Actividad reciente</option>
            <option value="created">Fecha de creación</option>
            <option value="name">Nombre</option>
          </select>
          <button className="case-button case-button--secondary" onClick={() => importRef.current?.click()}>
            <Upload size={17} /> Importar
          </button>
          <input ref={importRef} hidden type="file" accept=".json,.osintargy.json" onChange={handleImport} />
        </div>

        {filteredCases.length ? (
          <section className="case-card-grid" aria-label={`Casos ${view === 'active' ? 'activos' : 'archivados'}`}>
            {filteredCases.map((project) => {
              const objective = OBJECTIVE_TYPES.find((item) => item.id === project.objectiveType)
              const completed = project.checklist.filter((item) => item.status === 'completed').length
              const progress = project.checklist.length
                ? Math.round((completed / project.checklist.length) * 100)
                : 0
              return (
                <article className="case-card" key={project.id}>
                  <div className="case-card__topline">
                    <span>{objective?.label || 'Caso libre'}</span>
                    <time dateTime={project.updatedAt}>{formatDate(project.updatedAt)}</time>
                  </div>
                  {editingId === project.id ? (
                    <form
                      className="case-card__rename"
                      onSubmit={(event) => {
                        event.preventDefault()
                        saveRename(project)
                      }}
                    >
                      <input
                        autoFocus
                        value={editingName}
                        maxLength={100}
                        onChange={(event) => setEditingName(event.target.value)}
                      />
                      <button type="submit">Guardar</button>
                      <button type="button" onClick={() => setEditingId(null)}>Cancelar</button>
                    </form>
                  ) : (
                    <h2>{project.name}</h2>
                  )}
                  <p>{project.objective || project.description || 'Sin objetivo documentado.'}</p>
                  <div className="case-card__metrics">
                    <span><strong>{project.entities.length}</strong> entidades</span>
                    <span><strong>{project.findings.length}</strong> hallazgos</span>
                    <span><strong>{project.locations.length}</strong> lugares</span>
                  </div>
                  <div className="case-card__progress">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <div className="case-card__progress-label">
                    <span>Checklist</span>
                    <strong>{completed}/{project.checklist.length || 0}</strong>
                  </div>
                  <div className="case-card__actions">
                    {view === 'active' ? (
                      <>
                        <button className="case-card__open" onClick={() => openCase(project)}>
                          <FolderOpen size={17} /> Continuar
                        </button>
                        <button
                          aria-label={`Renombrar ${project.name}`}
                          title="Renombrar"
                          onClick={() => {
                            setEditingId(project.id)
                            setEditingName(project.name)
                          }}
                        ><Pencil size={16} /></button>
                        <button
                          aria-label={`Duplicar ${project.name}`}
                          title="Duplicar"
                          onClick={async () => {
                            await duplicateCase(project.id)
                            toast.success('Caso duplicado.')
                          }}
                        ><Copy size={16} /></button>
                        <button
                          aria-label={`Exportar ${project.name}`}
                          title="Exportar"
                          onClick={() => downloadCase(project)}
                        ><Download size={16} /></button>
                        <button
                          aria-label={`Archivar ${project.name}`}
                          title="Archivar"
                          onClick={async () => {
                            await archiveCase(project.id)
                            toast.success('Caso archivado.')
                          }}
                        ><Archive size={16} /></button>
                      </>
                    ) : (
                      <>
                        <button
                          className="case-card__open"
                          onClick={async () => {
                            await restoreCase(project.id)
                            toast.success('Caso restaurado.')
                            setView('active')
                          }}
                        ><ArchiveRestore size={17} /> Restaurar</button>
                        <button
                          aria-label={`Exportar ${project.name}`}
                          title="Exportar antes de eliminar"
                          onClick={() => downloadCase(project)}
                        ><Download size={16} /></button>
                        <button
                          className="case-card__delete"
                          aria-label={`Eliminar permanentemente ${project.name}`}
                          title="Eliminar permanentemente"
                          onClick={() => setPendingDelete(project)}
                        ><Trash2 size={16} /></button>
                      </>
                    )}
                  </div>
                </article>
              )
            })}
          </section>
        ) : (
          <section className="case-library__empty">
            <FileSearch size={38} />
            <h2>{query ? 'No encontramos coincidencias' : view === 'active' ? 'Todavía no hay investigaciones' : 'No hay casos archivados'}</h2>
            <p>
              {query
                ? 'Probá con otro nombre, objetivo o palabra clave.'
                : view === 'active'
                  ? 'Creá un caso para empezar con objetivo, checklist y espacio de hallazgos.'
                  : 'Los casos archivados aparecerán acá y podrán restaurarse o eliminarse.'}
            </p>
            {!query && view === 'active' && (
              <button className="case-button case-button--primary" onClick={() => setIsWizardOpen(true)}>
                <Plus size={18} /> Crear primer caso
              </button>
            )}
          </section>
        )}
      </main>

      {isWizardOpen && <CaseWizard onClose={() => setIsWizardOpen(false)} onCreate={handleCreate} />}
      {pendingDelete && (
        <div className="case-confirm-backdrop" role="presentation" onMouseDown={() => setPendingDelete(null)}>
          <section
            className="case-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="case-delete-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Trash2 size={25} />
            <h2 id="case-delete-title">Eliminar permanentemente</h2>
            <p>
              Vas a eliminar “{pendingDelete.name}”. Esta acción no se puede deshacer.
              Podés descargar un respaldo antes de continuar.
            </p>
            <div>
              <button onClick={() => setPendingDelete(null)}>Cancelar</button>
              <button onClick={() => handleDelete(pendingDelete, true)}>
                <Download size={16} /> Exportar y eliminar
              </button>
              <button className="case-confirm__danger" onClick={() => handleDelete(pendingDelete)}>
                Eliminar sin exportar
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
