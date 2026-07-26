import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Download,
  FilePlus2,
  GitFork,
  HelpCircle,
  Link2,
  Map,
  MapPin,
  Network,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  X
} from 'lucide-react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import toast from 'react-hot-toast'
import { Link } from '@/lib/router'
import {
  ENTITY_TYPES,
  buildSafeFilename,
  createDemoInvestigationProject,
  createEmptyInvestigationProject,
  createInvestigationId,
  getEntityType,
  loadInvestigationProject,
  parseInvestigationProject,
  saveInvestigationProject,
  serializeInvestigationProject
} from '@utils/investigationProject'
import 'leaflet/dist/leaflet.css'
import './InvestigationBoard.css'

const CONFIDENCE_OPTIONS = [
  { id: 'low', label: 'Baja' },
  { id: 'medium', label: 'Media' },
  { id: 'high', label: 'Alta' }
]

const DEFAULT_LOCATION_DRAFT = {
  name: '',
  address: '',
  latitude: '-34.6037',
  longitude: '-58.3816',
  visitedAt: '',
  notes: '',
  linkedEntityIds: []
}

const getEffectiveEntity = (entity, dragPreview) => (
  dragPreview[entity.id] ? { ...entity, ...dragPreview[entity.id] } : entity
)

function MapClickCapture({ onPick }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng)
    }
  })

  return null
}

function MapFocus({ location }) {
  const map = useMap()

  useEffect(() => {
    if (location) {
      map.flyTo([location.latitude, location.longitude], Math.max(map.getZoom(), 13), {
        duration: 0.65
      })
    }
  }, [location, map])

  return null
}

function WorkspaceMap({ locations, selectedLocationId, onSelectLocation, onPickCoordinates }) {
  const selectedLocation = locations.find((location) => location.id === selectedLocationId)
  const center = selectedLocation
    ? [selectedLocation.latitude, selectedLocation.longitude]
    : locations.length
      ? [locations[0].latitude, locations[0].longitude]
      : [-34.6037, -58.3816]

  return (
    <MapContainer
      center={center}
      zoom={locations.length ? 12 : 11}
      className="investigation-map"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickCapture onPick={onPickCoordinates} />
      <MapFocus location={selectedLocation} />
      {locations.map((location) => (
        <CircleMarker
          key={location.id}
          center={[location.latitude, location.longitude]}
          radius={location.id === selectedLocationId ? 11 : 8}
          pathOptions={{
            color: location.id === selectedLocationId ? '#f8fafc' : '#0f172a',
            fillColor: location.id === selectedLocationId ? '#38bdf8' : '#f59e0b',
            fillOpacity: 0.92,
            weight: 2
          }}
          eventHandlers={{ click: () => onSelectLocation(location.id) }}
        >
          <Popup>
            <strong>{location.name}</strong>
            {location.address && <><br />{location.address}</>}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}

const Stat = ({ label, value }) => (
  <span className="investigation-stat">
    <strong>{value}</strong>
    {label}
  </span>
)

function InvestigationBoard() {
  const [history, setHistory] = useState(() => ({
    past: [],
    present: loadInvestigationProject() || createEmptyInvestigationProject(),
    future: []
  }))
  const [activeTab, setActiveTab] = useState('network')
  const [selectedEntityId, setSelectedEntityId] = useState(null)
  const [selectedLocationId, setSelectedLocationId] = useState(null)
  const [isEntityFormOpen, setIsEntityFormOpen] = useState(false)
  const [isLocationFormOpen, setIsLocationFormOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [saveState, setSaveState] = useState('saved')
  const [dragPreview, setDragPreview] = useState({})
  const [entityDraft, setEntityDraft] = useState({
    type: 'person',
    label: '',
    value: '',
    notes: '',
    confidence: 'medium'
  })
  const [relationshipDraft, setRelationshipDraft] = useState({
    sourceId: '',
    targetId: '',
    label: 'relacionado con',
    confidence: 'medium'
  })
  const [locationDraft, setLocationDraft] = useState(DEFAULT_LOCATION_DRAFT)
  const fileInputRef = useRef(null)
  const graphRef = useRef(null)
  const dragRef = useRef(null)
  const project = history.present

  const commitProject = useCallback((updater) => {
    setHistory((current) => {
      const candidate = typeof updater === 'function' ? updater(current.present) : updater
      const next = { ...candidate, updatedAt: new Date().toISOString() }

      if (JSON.stringify(next) === JSON.stringify(current.present)) return current

      return {
        past: [...current.past.slice(-39), current.present],
        present: next,
        future: []
      }
    })
  }, [])

  useEffect(() => {
    setSaveState('saving')
    const timeoutId = window.setTimeout(() => {
      setSaveState(saveInvestigationProject(project) ? 'saved' : 'error')
    }, 350)

    return () => window.clearTimeout(timeoutId)
  }, [project])

  useEffect(() => {
    if (selectedEntityId && !project.entities.some((entity) => entity.id === selectedEntityId)) {
      setSelectedEntityId(null)
    }
    if (selectedLocationId && !project.locations.some((location) => location.id === selectedLocationId)) {
      setSelectedLocationId(null)
    }
  }, [project.entities, project.locations, selectedEntityId, selectedLocationId])

  const selectedEntity = project.entities.find((entity) => entity.id === selectedEntityId)
  const selectedLocation = project.locations.find((location) => location.id === selectedLocationId)

  const replaceProject = (nextProject) => {
    commitProject(nextProject)
    setSelectedEntityId(null)
    setSelectedLocationId(null)
    setDragPreview({})
  }

  const undo = () => {
    setHistory((current) => {
      if (!current.past.length) return current
      const previous = current.past[current.past.length - 1]
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future].slice(0, 40)
      }
    })
  }

  const redo = () => {
    setHistory((current) => {
      if (!current.future.length) return current
      const next = current.future[0]
      return {
        past: [...current.past.slice(-39), current.present],
        present: next,
        future: current.future.slice(1)
      }
    })
  }

  const addEntity = (event) => {
    event.preventDefault()
    const label = entityDraft.label.trim()
    if (!label) {
      toast.error('Ingresá un nombre o identificador.')
      return
    }

    const index = project.entities.length
    const entity = {
      id: createInvestigationId('entity'),
      ...entityDraft,
      label,
      value: entityDraft.value.trim(),
      notes: entityDraft.notes.trim(),
      x: 190 + (index % 4) * 205,
      y: 130 + (Math.floor(index / 4) % 3) * 185
    }

    commitProject((current) => ({ ...current, entities: [...current.entities, entity] }))
    setEntityDraft({
      type: 'person',
      label: '',
      value: '',
      notes: '',
      confidence: 'medium'
    })
    setSelectedEntityId(entity.id)
    setIsEntityFormOpen(false)
    toast.success('Entidad agregada al tablero.')
  }

  const updateEntity = (entityId, patch) => {
    commitProject((current) => ({
      ...current,
      entities: current.entities.map((entity) => (
        entity.id === entityId ? { ...entity, ...patch } : entity
      ))
    }))
  }

  const deleteEntity = (entityId) => {
    commitProject((current) => ({
      ...current,
      entities: current.entities.filter((entity) => entity.id !== entityId),
      relationships: current.relationships.filter(
        (relationship) => relationship.sourceId !== entityId && relationship.targetId !== entityId
      ),
      locations: current.locations.map((location) => ({
        ...location,
        linkedEntityIds: location.linkedEntityIds.filter((linkedId) => linkedId !== entityId)
      }))
    }))
    setSelectedEntityId(null)
    toast.success('Entidad y vínculos asociados eliminados.')
  }

  const addRelationship = (event) => {
    event.preventDefault()
    const { sourceId, targetId } = relationshipDraft

    if (!sourceId || !targetId || sourceId === targetId) {
      toast.error('Elegí dos entidades diferentes.')
      return
    }

    const duplicate = project.relationships.some((relationship) => (
      (relationship.sourceId === sourceId && relationship.targetId === targetId)
      || (relationship.sourceId === targetId && relationship.targetId === sourceId)
    ))

    if (duplicate) {
      toast.error('Estas entidades ya están conectadas.')
      return
    }

    commitProject((current) => ({
      ...current,
      relationships: [
        ...current.relationships,
        {
          id: createInvestigationId('relationship'),
          ...relationshipDraft,
          label: relationshipDraft.label.trim() || 'relacionado con'
        }
      ]
    }))
    setRelationshipDraft({
      sourceId: '',
      targetId: '',
      label: 'relacionado con',
      confidence: 'medium'
    })
    toast.success('Relación creada.')
  }

  const deleteRelationship = (relationshipId) => {
    commitProject((current) => ({
      ...current,
      relationships: current.relationships.filter((relationship) => relationship.id !== relationshipId)
    }))
  }

  const addLocation = (event) => {
    event.preventDefault()
    const latitude = Number(locationDraft.latitude)
    const longitude = Number(locationDraft.longitude)

    if (!locationDraft.name.trim()) {
      toast.error('Ingresá un nombre para la ubicación.')
      return
    }

    if (
      !Number.isFinite(latitude)
      || !Number.isFinite(longitude)
      || latitude < -90
      || latitude > 90
      || longitude < -180
      || longitude > 180
    ) {
      toast.error('Revisá las coordenadas ingresadas.')
      return
    }

    const location = {
      ...locationDraft,
      id: createInvestigationId('location'),
      name: locationDraft.name.trim(),
      address: locationDraft.address.trim(),
      notes: locationDraft.notes.trim(),
      latitude,
      longitude
    }

    commitProject((current) => ({ ...current, locations: [...current.locations, location] }))
    setLocationDraft(DEFAULT_LOCATION_DRAFT)
    setSelectedLocationId(location.id)
    setIsLocationFormOpen(false)
    toast.success('Ubicación agregada al mapa.')
  }

  const updateLocation = (locationId, patch) => {
    commitProject((current) => ({
      ...current,
      locations: current.locations.map((location) => (
        location.id === locationId ? { ...location, ...patch } : location
      ))
    }))
  }

  const deleteLocation = (locationId) => {
    commitProject((current) => ({
      ...current,
      locations: current.locations.filter((location) => location.id !== locationId)
    }))
    setSelectedLocationId(null)
    toast.success('Ubicación eliminada.')
  }

  const pickCoordinates = ({ lat, lng }) => {
    setLocationDraft((current) => ({
      ...current,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6)
    }))
    setIsLocationFormOpen(true)
  }

  const toggleLocationEntity = (entityId) => {
    setLocationDraft((current) => ({
      ...current,
      linkedEntityIds: current.linkedEntityIds.includes(entityId)
        ? current.linkedEntityIds.filter((id) => id !== entityId)
        : [...current.linkedEntityIds, entityId]
    }))
  }

  const downloadProject = () => {
    const blob = new Blob([serializeInvestigationProject(project)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = buildSafeFilename(project.name)
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success('Proyecto exportado.')
  }

  const importProject = async (event) => {
    const [file] = event.target.files || []
    event.target.value = ''
    if (!file) return

    try {
      const imported = parseInvestigationProject(await file.text())
      replaceProject(imported)
      toast.success('Proyecto importado y validado.')
    } catch (error) {
      toast.error(error.message)
    }
  }

  const loadDemo = () => {
    replaceProject(createDemoInvestigationProject())
    setActiveTab('network')
    toast.success('Caso de ejemplo cargado.')
  }

  const resetProject = () => {
    if (!window.confirm('¿Crear una investigación vacía? Podés exportar la actual antes de continuar.')) return
    replaceProject(createEmptyInvestigationProject())
    toast.success('Nuevo proyecto listo.')
  }

  const graphCoordinates = (event) => {
    const bounds = graphRef.current.getBoundingClientRect()
    return {
      x: Math.min(930, Math.max(70, ((event.clientX - bounds.left) / bounds.width) * 1000)),
      y: Math.min(550, Math.max(70, ((event.clientY - bounds.top) / bounds.height) * 620))
    }
  }

  const startDraggingEntity = (event, entity) => {
    event.preventDefault()
    graphRef.current?.setPointerCapture(event.pointerId)
    dragRef.current = {
      id: entity.id,
      pointerId: event.pointerId,
      start: { x: entity.x, y: entity.y },
      current: { x: entity.x, y: entity.y }
    }
    setSelectedEntityId(entity.id)
  }

  const moveDraggingEntity = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    const next = graphCoordinates(event)
    dragRef.current.current = next
    setDragPreview({ [dragRef.current.id]: next })
  }

  const stopDraggingEntity = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return
    const { id, start, current } = dragRef.current
    dragRef.current = null
    setDragPreview({})

    if (start.x !== current.x || start.y !== current.y) {
      updateEntity(id, current)
    }
  }

  const entityById = useMemo(
    () => Object.fromEntries(project.entities.map((entity) => [entity.id, entity])),
    [project.entities]
  )

  const selectedEntityRelationships = selectedEntity
    ? project.relationships.filter(
      (relationship) => relationship.sourceId === selectedEntity.id || relationship.targetId === selectedEntity.id
    )
    : []

  const saveLabel = saveState === 'saving'
    ? 'Guardando…'
    : saveState === 'error'
      ? 'No se pudo guardar'
      : 'Guardado local'

  return (
    <div className="investigation-board">
      <header className="investigation-toolbar">
        <Link to="/" className="investigation-toolbar__back" aria-label="Volver al inicio">
          <ArrowLeft size={18} />
        </Link>

        <div className="investigation-toolbar__identity">
          <span className="investigation-toolbar__eyebrow">Espacio de trabajo local</span>
          <input
            aria-label="Nombre de la investigación"
            value={project.name}
            maxLength={100}
            onChange={(event) => commitProject((current) => ({ ...current, name: event.target.value }))}
          />
        </div>

        <div className={`investigation-save-state investigation-save-state--${saveState}`}>
          {saveState === 'saved' ? <Check size={15} /> : <Save size={15} />}
          <span>{saveLabel}</span>
        </div>

        <div className="investigation-toolbar__actions">
          <button onClick={undo} disabled={!history.past.length} title="Deshacer" aria-label="Deshacer">
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={!history.future.length} title="Rehacer" aria-label="Rehacer">
            <Redo2 size={18} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Importar JSON">
            <Upload size={18} />
            <span>Importar</span>
          </button>
          <button onClick={downloadProject} title="Exportar JSON">
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button onClick={resetProject} title="Nueva investigación">
            <FilePlus2 size={18} />
            <span>Nuevo</span>
          </button>
          <button onClick={() => setIsHelpOpen(true)} title="Ayuda" aria-label="Ayuda del tablero">
            <HelpCircle size={18} />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.osintargy.json,application/json"
          hidden
          onChange={importProject}
        />
      </header>

      <main className="investigation-layout">
        <aside className="investigation-sidebar">
          <div className="investigation-tabs" role="tablist" aria-label="Vistas de investigación">
            <button
              role="tab"
              aria-selected={activeTab === 'network'}
              className={activeTab === 'network' ? 'is-active' : ''}
              onClick={() => setActiveTab('network')}
            >
              <Network size={17} /> Red
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'locations'}
              className={activeTab === 'locations' ? 'is-active' : ''}
              onClick={() => setActiveTab('locations')}
            >
              <Map size={17} /> Mapa
            </button>
          </div>

          <div className="investigation-summary">
            <Stat label="entidades" value={project.entities.length} />
            <Stat label="relaciones" value={project.relationships.length} />
            <Stat label="lugares" value={project.locations.length} />
          </div>

          {activeTab === 'network' ? (
            <>
              <div className="investigation-section-heading">
                <div>
                  <span>Inventario</span>
                  <h2>Entidades</h2>
                </div>
                <button
                  className="investigation-icon-button"
                  onClick={() => setIsEntityFormOpen((value) => !value)}
                  aria-label="Agregar entidad"
                >
                  {isEntityFormOpen ? <X size={18} /> : <Plus size={18} />}
                </button>
              </div>

              {isEntityFormOpen && (
                <form className="investigation-form" onSubmit={addEntity}>
                  <label>
                    Tipo
                    <select
                      value={entityDraft.type}
                      onChange={(event) => setEntityDraft((current) => ({ ...current, type: event.target.value }))}
                    >
                      {ENTITY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                  </label>
                  <label>
                    Nombre o identificador
                    <input
                      autoFocus
                      value={entityDraft.label}
                      maxLength={80}
                      placeholder="@usuario, dominio, persona…"
                      onChange={(event) => setEntityDraft((current) => ({ ...current, label: event.target.value }))}
                    />
                  </label>
                  <label>
                    Dato principal
                    <input
                      value={entityDraft.value}
                      maxLength={140}
                      placeholder="URL, número, rol o referencia"
                      onChange={(event) => setEntityDraft((current) => ({ ...current, value: event.target.value }))}
                    />
                  </label>
                  <label>
                    Confianza
                    <select
                      value={entityDraft.confidence}
                      onChange={(event) => setEntityDraft((current) => ({ ...current, confidence: event.target.value }))}
                    >
                      {CONFIDENCE_OPTIONS.map((option) => (
                        <option key={option.id} value={option.id}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <button className="investigation-primary-button" type="submit">
                    <Plus size={17} /> Agregar al tablero
                  </button>
                </form>
              )}

              <div className="investigation-entity-list">
                {project.entities.length ? project.entities.map((entity) => {
                  const type = getEntityType(entity.type)
                  return (
                    <button
                      key={entity.id}
                      className={entity.id === selectedEntityId ? 'is-selected' : ''}
                      onClick={() => setSelectedEntityId(entity.id)}
                    >
                      <span className="investigation-entity-dot" style={{ '--entity-color': type.color }} />
                      <span>
                        <strong>{entity.label}</strong>
                        <small>{type.label}</small>
                      </span>
                    </button>
                  )
                }) : (
                  <div className="investigation-empty-list">
                    <Network size={24} />
                    <p>Agregá una entidad o cargá el caso de ejemplo.</p>
                    <button onClick={loadDemo}>Cargar ejemplo</button>
                  </div>
                )}
              </div>

              {project.entities.length >= 2 && (
                <form className="investigation-relation-form" onSubmit={addRelationship}>
                  <div className="investigation-section-heading investigation-section-heading--compact">
                    <div>
                      <span>Conexiones</span>
                      <h2>Nueva relación</h2>
                    </div>
                    <GitFork size={18} />
                  </div>
                  <select
                    aria-label="Entidad de origen"
                    value={relationshipDraft.sourceId}
                    onChange={(event) => setRelationshipDraft((current) => ({ ...current, sourceId: event.target.value }))}
                  >
                    <option value="">Origen…</option>
                    {project.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
                  </select>
                  <input
                    aria-label="Descripción de la relación"
                    value={relationshipDraft.label}
                    maxLength={60}
                    onChange={(event) => setRelationshipDraft((current) => ({ ...current, label: event.target.value }))}
                  />
                  <select
                    aria-label="Entidad de destino"
                    value={relationshipDraft.targetId}
                    onChange={(event) => setRelationshipDraft((current) => ({ ...current, targetId: event.target.value }))}
                  >
                    <option value="">Destino…</option>
                    {project.entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.label}</option>)}
                  </select>
                  <button type="submit"><Link2 size={16} /> Conectar</button>
                </form>
              )}
            </>
          ) : (
            <>
              <div className="investigation-section-heading">
                <div>
                  <span>Geolocalización</span>
                  <h2>Ubicaciones</h2>
                </div>
                <button
                  className="investigation-icon-button"
                  onClick={() => setIsLocationFormOpen((value) => !value)}
                  aria-label="Agregar ubicación"
                >
                  {isLocationFormOpen ? <X size={18} /> : <Plus size={18} />}
                </button>
              </div>

              {isLocationFormOpen && (
                <form className="investigation-form investigation-location-form" onSubmit={addLocation}>
                  <label>
                    Nombre
                    <input
                      autoFocus
                      value={locationDraft.name}
                      maxLength={100}
                      placeholder="Lugar, domicilio o punto"
                      onChange={(event) => setLocationDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                  </label>
                  <label>
                    Dirección o referencia
                    <input
                      value={locationDraft.address}
                      maxLength={180}
                      onChange={(event) => setLocationDraft((current) => ({ ...current, address: event.target.value }))}
                    />
                  </label>
                  <div className="investigation-form__row">
                    <label>
                      Latitud
                      <input
                        inputMode="decimal"
                        value={locationDraft.latitude}
                        onChange={(event) => setLocationDraft((current) => ({ ...current, latitude: event.target.value }))}
                      />
                    </label>
                    <label>
                      Longitud
                      <input
                        inputMode="decimal"
                        value={locationDraft.longitude}
                        onChange={(event) => setLocationDraft((current) => ({ ...current, longitude: event.target.value }))}
                      />
                    </label>
                  </div>
                  <label>
                    Fecha observada
                    <input
                      type="date"
                      value={locationDraft.visitedAt}
                      onChange={(event) => setLocationDraft((current) => ({ ...current, visitedAt: event.target.value }))}
                    />
                  </label>
                  {project.entities.length > 0 && (
                    <fieldset>
                      <legend>Vincular entidades</legend>
                      <div className="investigation-checkboxes">
                        {project.entities.map((entity) => (
                          <label key={entity.id}>
                            <input
                              type="checkbox"
                              checked={locationDraft.linkedEntityIds.includes(entity.id)}
                              onChange={() => toggleLocationEntity(entity.id)}
                            />
                            {entity.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  )}
                  <button className="investigation-primary-button" type="submit">
                    <MapPin size={17} /> Guardar ubicación
                  </button>
                </form>
              )}

              <div className="investigation-location-list">
                {project.locations.length ? project.locations.map((location) => (
                  <button
                    key={location.id}
                    className={location.id === selectedLocationId ? 'is-selected' : ''}
                    onClick={() => setSelectedLocationId(location.id)}
                  >
                    <MapPin size={17} />
                    <span>
                      <strong>{location.name}</strong>
                      <small>
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </small>
                    </span>
                  </button>
                )) : (
                  <div className="investigation-empty-list">
                    <MapPin size={24} />
                    <p>Hacé clic en el mapa o ingresá coordenadas.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </aside>

        <section className="investigation-stage">
          {activeTab === 'network' ? (
            <div className="investigation-graph-shell">
              <div className="investigation-stage__caption">
                <div>
                  <span>Mapa relacional</span>
                  <strong>Arrastrá nodos para organizar la hipótesis</strong>
                </div>
                <span className="investigation-local-badge"><ShieldCheck size={15} /> Solo en este navegador</span>
              </div>
              <svg
                ref={graphRef}
                className="investigation-graph"
                viewBox="0 0 1000 620"
                role="img"
                aria-label="Grafo de entidades de la investigación"
                onPointerMove={moveDraggingEntity}
                onPointerUp={stopDraggingEntity}
                onPointerCancel={stopDraggingEntity}
              >
                <defs>
                  <pattern id="investigation-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                    <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(148,163,184,.08)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="1000" height="620" fill="url(#investigation-grid)" />
                <g className="investigation-graph__relationships">
                  {project.relationships.map((relationship) => {
                    const sourceRaw = entityById[relationship.sourceId]
                    const targetRaw = entityById[relationship.targetId]
                    if (!sourceRaw || !targetRaw) return null
                    const source = getEffectiveEntity(sourceRaw, dragPreview)
                    const target = getEffectiveEntity(targetRaw, dragPreview)
                    const centerX = (source.x + target.x) / 2
                    const centerY = (source.y + target.y) / 2
                    return (
                      <g key={relationship.id}>
                        <line
                          x1={source.x}
                          y1={source.y}
                          x2={target.x}
                          y2={target.y}
                          className={`confidence-${relationship.confidence}`}
                        />
                        <text x={centerX} y={centerY - 9} textAnchor="middle">
                          {relationship.label}
                        </text>
                      </g>
                    )
                  })}
                </g>
                <g className="investigation-graph__entities">
                  {project.entities.map((rawEntity) => {
                    const entity = getEffectiveEntity(rawEntity, dragPreview)
                    const type = getEntityType(entity.type)
                    const selected = entity.id === selectedEntityId
                    return (
                      <g
                        key={entity.id}
                        transform={`translate(${entity.x} ${entity.y})`}
                        className={selected ? 'is-selected' : ''}
                        role="button"
                        tabIndex="0"
                        aria-label={`${type.label}: ${entity.label}`}
                        onPointerDown={(event) => startDraggingEntity(event, entity)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') setSelectedEntityId(entity.id)
                        }}
                      >
                        <circle r="49" className="investigation-node-halo" style={{ '--node-color': type.color }} />
                        <circle r="40" className="investigation-node-core" style={{ '--node-color': type.color }} />
                        <text y="5" textAnchor="middle" className="investigation-node-symbol">
                          {entity.label.slice(0, 2).toUpperCase()}
                        </text>
                        <rect x="-84" y="52" width="168" height="42" rx="9" />
                        <text y="70" textAnchor="middle" className="investigation-node-label">
                          {entity.label.length > 22 ? `${entity.label.slice(0, 21)}…` : entity.label}
                        </text>
                        <text y="85" textAnchor="middle" className="investigation-node-type">{type.label}</text>
                      </g>
                    )
                  })}
                </g>
              </svg>
              {!project.entities.length && (
                <div className="investigation-stage-empty">
                  <Network size={36} />
                  <h2>Empezá por una entidad</h2>
                  <p>Documentá personas, alias, dominios y otras pistas; después conectalas sin salir del navegador.</p>
                  <div>
                    <button onClick={() => setIsEntityFormOpen(true)}><Plus size={17} /> Agregar entidad</button>
                    <button onClick={loadDemo}><RotateCcw size={17} /> Ver caso de ejemplo</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="investigation-map-shell">
              <div className="investigation-stage__caption">
                <div>
                  <span>Mapa de ubicaciones</span>
                  <strong>Hacé clic para capturar coordenadas</strong>
                </div>
                <span className="investigation-local-badge"><MapPin size={15} /> OpenStreetMap</span>
              </div>
              <WorkspaceMap
                locations={project.locations}
                selectedLocationId={selectedLocationId}
                onSelectLocation={setSelectedLocationId}
                onPickCoordinates={pickCoordinates}
              />
            </div>
          )}
        </section>

        <aside className="investigation-inspector">
          {activeTab === 'network' && selectedEntity ? (
            <>
              <div className="investigation-inspector__header">
                <div>
                  <span>Ficha de entidad</span>
                  <h2>{selectedEntity.label}</h2>
                </div>
                <button onClick={() => setSelectedEntityId(null)} aria-label="Cerrar ficha"><X size={18} /></button>
              </div>
              <div className="investigation-inspector__body" key={selectedEntity.id}>
                <label>
                  Tipo
                  <select
                    value={selectedEntity.type}
                    onChange={(event) => updateEntity(selectedEntity.id, { type: event.target.value })}
                  >
                    {ENTITY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                  </select>
                </label>
                <label>
                  Nombre
                  <input
                    defaultValue={selectedEntity.label}
                    maxLength={80}
                    onBlur={(event) => {
                      const label = event.target.value.trim()
                      if (label) updateEntity(selectedEntity.id, { label })
                    }}
                  />
                </label>
                <label>
                  Dato principal
                  <input
                    defaultValue={selectedEntity.value}
                    maxLength={140}
                    onBlur={(event) => updateEntity(selectedEntity.id, { value: event.target.value.trim() })}
                  />
                </label>
                <label>
                  Confianza
                  <select
                    value={selectedEntity.confidence}
                    onChange={(event) => updateEntity(selectedEntity.id, { confidence: event.target.value })}
                  >
                    {CONFIDENCE_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Notas
                  <textarea
                    defaultValue={selectedEntity.notes}
                    rows="5"
                    maxLength={1200}
                    placeholder="Fuente, contexto y próximos pasos…"
                    onBlur={(event) => updateEntity(selectedEntity.id, { notes: event.target.value.trim() })}
                  />
                </label>

                <section className="investigation-inspector__links">
                  <h3>Relaciones <span>{selectedEntityRelationships.length}</span></h3>
                  {selectedEntityRelationships.length ? selectedEntityRelationships.map((relationship) => {
                    const otherId = relationship.sourceId === selectedEntity.id
                      ? relationship.targetId
                      : relationship.sourceId
                    return (
                      <div key={relationship.id}>
                        <span>
                          <strong>{relationship.label}</strong>
                          <small>{entityById[otherId]?.label}</small>
                        </span>
                        <button
                          onClick={() => deleteRelationship(relationship.id)}
                          aria-label={`Eliminar relación ${relationship.label}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    )
                  }) : <p>Esta entidad todavía no tiene conexiones.</p>}
                </section>

                <button
                  className="investigation-danger-button"
                  onClick={() => deleteEntity(selectedEntity.id)}
                >
                  <Trash2 size={16} /> Eliminar entidad
                </button>
              </div>
            </>
          ) : activeTab === 'locations' && selectedLocation ? (
            <>
              <div className="investigation-inspector__header">
                <div>
                  <span>Ficha de ubicación</span>
                  <h2>{selectedLocation.name}</h2>
                </div>
                <button onClick={() => setSelectedLocationId(null)} aria-label="Cerrar ficha"><X size={18} /></button>
              </div>
              <div className="investigation-inspector__body" key={selectedLocation.id}>
                <label>
                  Nombre
                  <input
                    defaultValue={selectedLocation.name}
                    maxLength={100}
                    onBlur={(event) => {
                      const name = event.target.value.trim()
                      if (name) updateLocation(selectedLocation.id, { name })
                    }}
                  />
                </label>
                <label>
                  Dirección o referencia
                  <input
                    defaultValue={selectedLocation.address}
                    maxLength={180}
                    onBlur={(event) => updateLocation(selectedLocation.id, { address: event.target.value.trim() })}
                  />
                </label>
                <label>
                  Fecha observada
                  <input
                    type="date"
                    value={selectedLocation.visitedAt}
                    onChange={(event) => updateLocation(selectedLocation.id, { visitedAt: event.target.value })}
                  />
                </label>
                <label>
                  Notas
                  <textarea
                    defaultValue={selectedLocation.notes}
                    rows="5"
                    maxLength={1200}
                    onBlur={(event) => updateLocation(selectedLocation.id, { notes: event.target.value.trim() })}
                  />
                </label>
                <div className="investigation-coordinates">
                  <span>Latitud<strong>{selectedLocation.latitude.toFixed(6)}</strong></span>
                  <span>Longitud<strong>{selectedLocation.longitude.toFixed(6)}</strong></span>
                </div>
                <section className="investigation-inspector__links">
                  <h3>Entidades vinculadas <span>{selectedLocation.linkedEntityIds.length}</span></h3>
                  {selectedLocation.linkedEntityIds.length ? selectedLocation.linkedEntityIds.map((entityId) => (
                    <button
                      key={entityId}
                      className="investigation-linked-entity"
                      onClick={() => {
                        setActiveTab('network')
                        setSelectedEntityId(entityId)
                      }}
                    >
                      <Link2 size={14} /> {entityById[entityId]?.label}
                    </button>
                  )) : <p>La ubicación no está vinculada a entidades.</p>}
                </section>
                <a
                  className="investigation-map-link"
                  href={`https://www.openstreetmap.org/?mlat=${selectedLocation.latitude}&mlon=${selectedLocation.longitude}#map=16/${selectedLocation.latitude}/${selectedLocation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={16} /> Abrir en OpenStreetMap
                </a>
                <button
                  className="investigation-danger-button"
                  onClick={() => deleteLocation(selectedLocation.id)}
                >
                  <Trash2 size={16} /> Eliminar ubicación
                </button>
              </div>
            </>
          ) : (
            <div className="investigation-inspector-empty">
              {activeTab === 'network' ? <Network size={30} /> : <MapPin size={30} />}
              <h2>{activeTab === 'network' ? 'Seleccioná una entidad' : 'Seleccioná una ubicación'}</h2>
              <p>La ficha concentra notas, nivel de confianza y conexiones para mantener el contexto visible.</p>
            </div>
          )}
        </aside>
      </main>

      {isHelpOpen && (
        <div className="investigation-modal-backdrop" role="presentation" onMouseDown={() => setIsHelpOpen(false)}>
          <section
            className="investigation-help-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="investigation-help-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="investigation-inspector__header">
              <div>
                <span>Guía rápida</span>
                <h2 id="investigation-help-title">Tablero de investigación</h2>
              </div>
              <button onClick={() => setIsHelpOpen(false)} aria-label="Cerrar ayuda"><X size={18} /></button>
            </div>
            <div className="investigation-help-modal__body">
              <ol>
                <li><strong>Registrá entidades.</strong> Separá hechos, alias, dominios y organizaciones.</li>
                <li><strong>Conectá evidencia.</strong> Indicá la relación y ajustá su nivel de confianza.</li>
                <li><strong>Ubicá observaciones.</strong> Hacé clic en el mapa y vinculá el lugar con una o más entidades.</li>
                <li><strong>Conservá el caso.</strong> El autoguardado es local; exportá JSON para respaldo o intercambio.</li>
              </ol>
              <p>
                No cargues datos sensibles sin base legal. Documentá fuentes y diferenciá siempre hechos,
                hipótesis e inferencias.
              </p>
              <button className="investigation-primary-button" onClick={() => setIsHelpOpen(false)}>
                Entendido
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default InvestigationBoard
