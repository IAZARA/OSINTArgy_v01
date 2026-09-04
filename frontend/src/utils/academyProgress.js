import { ACADEMY_LESSON_CATALOG, ACADEMY_PASS_SCORE, getAcademyLessonDefinition } from '../components/OSINTAcademy/data/academyCatalog.js'

export const ACADEMY_PROGRESS_KEY = 'osintargy:academy-progress:v1'
export const LEGACY_ACADEMY_PROGRESS_KEY = 'osint-academy-progress-v1'
export const ACADEMY_PROGRESS_EVENT = 'osintargy:academy-progress-changed'

export const createDefaultAcademyProgress = () => ({
  version: 2, lastVisited: null, modules: {}, activities: {},
  audio: { currentTime: 0, duration: 0, completed: false }, updatedAt: null
})
const object = value => Boolean(value && typeof value === 'object' && !Array.isArray(value))
const validScore = score => typeof score === 'number' && Number.isFinite(score) && score >= 0 && score <= 100
const now = () => new Date().toISOString()
const withTimestamp = progress => ({ ...progress, updatedAt: now() })
const uniqueSlides = (slides, count) => Array.isArray(slides)
  ? [...new Set(slides.filter(index => Number.isInteger(index) && index >= 0 && index < count))].sort((a, b) => a - b)
  : []

export const normalizeAcademyProgress = (value) => {
  const defaults = createDefaultAcademyProgress()
  if (!object(value)) return defaults
  const modules = {}
  for (const definition of ACADEMY_LESSON_CATALOG) {
    const current = value.modules?.[definition.id]
    if (!object(current)) continue
    const viewedSlides = uniqueSlides(current.viewedSlides, definition.slideCount)
    const currentVersion = value.version === 2
    const bestScore = currentVersion && validScore(current.bestScore) ? current.bestScore : 0
    const quizSubmitted = currentVersion && current.quizSubmitted === true
    const completed = currentVersion && current.completed === true && quizSubmitted
      && bestScore >= ACADEMY_PASS_SCORE && viewedSlides.length === definition.slideCount
    modules[definition.id] = {
      viewedSlides,
      lastSlide: Number.isInteger(current.lastSlide) ? Math.max(0, Math.min(current.lastSlide, definition.slideCount - 1)) : 0,
      quizSubmitted,
      bestScore,
      lastScore: currentVersion && validScore(current.lastScore) ? current.lastScore : null,
      attempts: currentVersion && Number.isInteger(current.attempts) && current.attempts >= 0 ? current.attempts : 0,
      completed,
      completedAt: completed && typeof current.completedAt === 'string' ? current.completedAt : null,
      legacyReviewed: Boolean(current.legacyReviewed || (!currentVersion && current.completed))
    }
  }
  const lastDefinition = getAcademyLessonDefinition(value.lastVisited?.moduleId)
  const lastVisited = lastDefinition && Number.isInteger(value.lastVisited?.slideIndex)
    ? { moduleId: lastDefinition.id, slideIndex: Math.max(0, Math.min(value.lastVisited.slideIndex, lastDefinition.slideCount - 1)) }
    : null
  return {
    ...defaults, modules, lastVisited,
    activities: object(value.activities) ? value.activities : {},
    audio: {
      currentTime: Number.isFinite(value.audio?.currentTime) ? Math.max(0, value.audio.currentTime) : 0,
      duration: Number.isFinite(value.audio?.duration) ? Math.max(0, value.audio.duration) : 0,
      completed: value.audio?.completed === true
    },
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : null
  }
}

export const loadAcademyProgress = (storage) => {
  try {
    const targetStorage = storage || globalThis.localStorage
    if (!targetStorage) return createDefaultAcademyProgress()
    const stored = targetStorage.getItem(ACADEMY_PROGRESS_KEY)
    const result = stored ? normalizeAcademyProgress(JSON.parse(stored)) : createDefaultAcademyProgress()
    // Legacy bare IDs have no assessment evidence. Preserve them as reviewed, never certified.
    let legacy = []
    try { legacy = JSON.parse(targetStorage.getItem(LEGACY_ACADEMY_PROGRESS_KEY) || '[]') } catch { /* Keep valid detailed progress. */ }
    if (Array.isArray(legacy)) {
      for (const id of new Set(legacy.filter(id => typeof id === 'string'))) {
        if (getAcademyLessonDefinition(id) && !result.modules[id]) {
          result.modules[id] = { viewedSlides: [], lastSlide: 0, quizSubmitted: false, bestScore: 0, lastScore: null, attempts: 0, completed: false, completedAt: null, legacyReviewed: true }
        }
      }
    }
    return result
  } catch { return createDefaultAcademyProgress() }
}

export const saveAcademyProgress = (progress, storage) => {
  const normalized = normalizeAcademyProgress(progress)
  try { (storage || globalThis.localStorage)?.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(normalized)) } catch { /* In-memory learning remains available. */ }
  return normalized
}

export const calculateAcademySummary = (progress) => {
  const normalized = normalizeAcademyProgress(progress)
  const completed = ACADEMY_LESSON_CATALOG.filter(module => normalized.modules[module.id]?.completed)
  const viewedSlides = ACADEMY_LESSON_CATALOG.reduce((total, module) => total + (normalized.modules[module.id]?.viewedSlides.length || 0), 0)
  const totalSlides = ACADEMY_LESSON_CATALOG.reduce((total, module) => total + module.slideCount, 0)
  return {
    completedCount: completed.length, completedModuleIds: completed.map(module => module.id),
    viewedSlides, totalSlides, totalModules: ACADEMY_LESSON_CATALOG.length,
    coursePercent: Math.round(completed.length / ACADEMY_LESSON_CATALOG.length * 100),
    readingPercent: Math.round(viewedSlides / totalSlides * 100),
    isCourseCompleted: completed.length === ACADEMY_LESSON_CATALOG.length
  }
}

export const visitAcademySlide = (progress, moduleId, slideIndex) => {
  const normalized = normalizeAcademyProgress(progress)
  const definition = getAcademyLessonDefinition(moduleId)
  if (!definition || !Number.isInteger(slideIndex) || slideIndex < 0 || slideIndex >= definition.slideCount) return normalized
  const current = normalized.modules[moduleId] || {}
  return withTimestamp({ ...normalized, lastVisited: { moduleId, slideIndex }, modules: {
    ...normalized.modules, [moduleId]: { ...current, lastSlide: slideIndex, viewedSlides: uniqueSlides([...(current.viewedSlides || []), slideIndex], definition.slideCount) }
  } })
}

export const recordAcademyQuiz = (progress, moduleId, score) => {
  const normalized = normalizeAcademyProgress(progress)
  if (!getAcademyLessonDefinition(moduleId) || !validScore(score)) return normalized
  const current = normalized.modules[moduleId] || { viewedSlides: [], lastSlide: 0 }
  return withTimestamp({ ...normalized, modules: { ...normalized.modules, [moduleId]: {
    ...current, quizSubmitted: true, lastScore: score,
    bestScore: Math.max(current.bestScore || 0, score), attempts: (current.attempts || 0) + 1
  } } })
}

export const completeAcademyModule = (progress, moduleId, score) => {
  // Call with no score after recordAcademyQuiz to avoid recording the same attempt twice.
  const normalized = score === undefined ? normalizeAcademyProgress(progress) : recordAcademyQuiz(progress, moduleId, score)
  const definition = getAcademyLessonDefinition(moduleId)
  const current = normalized.modules[moduleId]
  if (!definition || !current?.quizSubmitted || current.bestScore < ACADEMY_PASS_SCORE
    || current.viewedSlides.length !== definition.slideCount) return normalized
  return withTimestamp({ ...normalized, modules: { ...normalized.modules, [moduleId]: {
    ...current, completed: true, completedAt: current.completedAt || now()
  } } })
}

export const recordAcademyActivity = (progress, activityId, details = {}) => {
  const normalized = normalizeAcademyProgress(progress)
  if (typeof activityId !== 'string' || !activityId || ['__proto__', 'constructor', 'prototype'].includes(activityId)) return normalized
  return withTimestamp({ ...normalized, activities: { ...normalized.activities, [activityId]: {
    ...normalized.activities[activityId], ...details,
    completed: normalized.activities[activityId]?.completed === true || details.completed === true,
    visited: true, updatedAt: now()
  } } })
}

export const recordAcademyAudio = (progress, currentTime, duration, completed = false) => {
  const normalized = normalizeAcademyProgress(progress)
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0 || currentTime < 0) return normalized
  const reachedCompletion = completed || currentTime / duration >= 0.9
  return withTimestamp({ ...recordAcademyActivity(normalized, 'audio', { completed: reachedCompletion }), audio: {
    currentTime: reachedCompletion ? duration : Math.min(currentTime, duration), duration,
    completed: normalized.audio.completed || reachedCompletion
  } })
}

export const getCompletedAcademyModules = storage => calculateAcademySummary(loadAcademyProgress(storage)).completedModuleIds
export const isAcademyModuleCompleted = (moduleId, storage) => getCompletedAcademyModules(storage).includes(moduleId)
