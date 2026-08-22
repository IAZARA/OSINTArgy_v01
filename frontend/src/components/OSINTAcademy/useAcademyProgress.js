import { useCallback, useMemo, useRef, useState } from 'react'
import { ACADEMY_MODULES } from './academyData.js'

export const ACADEMY_PROGRESS_KEY = 'osintargy:academy-progress:v1'

export const createDefaultAcademyProgress = () => ({
  version: 1,
  lastVisited: null,
  modules: {},
  activities: {},
  audio: {
    currentTime: 0,
    duration: 0,
    completed: false
  },
  updatedAt: null
})

export const normalizeAcademyProgress = (value) => {
  const defaults = createDefaultAcademyProgress()
  if (!value || typeof value !== 'object') return defaults

  return {
    ...defaults,
    ...value,
    modules: value.modules && typeof value.modules === 'object' ? value.modules : {},
    activities: value.activities && typeof value.activities === 'object' ? value.activities : {},
    audio: {
      ...defaults.audio,
      ...(value.audio && typeof value.audio === 'object' ? value.audio : {})
    }
  }
}

export const loadAcademyProgress = (storage = globalThis.localStorage) => {
  if (!storage) return createDefaultAcademyProgress()

  try {
    const stored = storage.getItem(ACADEMY_PROGRESS_KEY)
    return stored ? normalizeAcademyProgress(JSON.parse(stored)) : createDefaultAcademyProgress()
  } catch {
    return createDefaultAcademyProgress()
  }
}

export const calculateAcademySummary = (progress) => {
  const normalized = normalizeAcademyProgress(progress)
  const completedModules = ACADEMY_MODULES.filter(
    module => normalized.modules[module.id]?.completed
  )
  const viewedSlides = ACADEMY_MODULES.reduce((total, module) => {
    const moduleProgress = normalized.modules[module.id]
    return total + Math.min(moduleProgress?.viewedSlides?.length || 0, module.slideCount)
  }, 0)
  const totalSlides = ACADEMY_MODULES.reduce((total, module) => total + module.slideCount, 0)

  return {
    completedCount: completedModules.length,
    completedModuleIds: completedModules.map(module => module.id),
    viewedSlides,
    coursePercent: totalSlides ? Math.round((viewedSlides / totalSlides) * 100) : 0,
    isCourseCompleted: completedModules.length === ACADEMY_MODULES.length
  }
}

const withTimestamp = (progress) => ({
  ...progress,
  updatedAt: new Date().toISOString()
})

export const visitAcademySlide = (progress, moduleId, slideIndex) => {
  const normalized = normalizeAcademyProgress(progress)
  const currentModule = normalized.modules[moduleId] || {}
  const viewedSlides = Array.from(new Set([
    ...(currentModule.viewedSlides || []),
    slideIndex
  ])).sort((a, b) => a - b)

  return withTimestamp({
    ...normalized,
    lastVisited: { moduleId, slideIndex },
    modules: {
      ...normalized.modules,
      [moduleId]: {
        ...currentModule,
        lastSlide: slideIndex,
        viewedSlides
      }
    }
  })
}

export const recordAcademyQuiz = (progress, moduleId, score) => {
  const normalized = normalizeAcademyProgress(progress)
  const currentModule = normalized.modules[moduleId] || {}
  const previousBest = Number.isFinite(currentModule.bestScore) ? currentModule.bestScore : 0

  return withTimestamp({
    ...normalized,
    modules: {
      ...normalized.modules,
      [moduleId]: {
        ...currentModule,
        quizSubmitted: true,
        lastScore: score,
        bestScore: Math.max(previousBest, score)
      }
    }
  })
}

export const completeAcademyModule = (progress, moduleId, score) => {
  const withQuiz = recordAcademyQuiz(progress, moduleId, score)
  const currentModule = withQuiz.modules[moduleId] || {}
  const moduleDefinition = ACADEMY_MODULES.find(module => module.id === moduleId)
  const viewedSlides = moduleDefinition
    ? Array.from({ length: moduleDefinition.slideCount }, (_, index) => index)
    : currentModule.viewedSlides || []

  return withTimestamp({
    ...withQuiz,
    modules: {
      ...withQuiz.modules,
      [moduleId]: {
        ...currentModule,
        viewedSlides,
        completed: true,
        completedAt: currentModule.completedAt || new Date().toISOString()
      }
    }
  })
}

export const recordAcademyActivity = (progress, activityId, details = {}) => {
  const normalized = normalizeAcademyProgress(progress)
  return withTimestamp({
    ...normalized,
    activities: {
      ...normalized.activities,
      [activityId]: {
        ...normalized.activities[activityId],
        ...details,
        visited: true,
        updatedAt: new Date().toISOString()
      }
    }
  })
}

export const recordAcademyAudio = (progress, currentTime, duration, completed = false) => {
  const normalized = normalizeAcademyProgress(progress)
  const reachedCompletion = completed || (duration > 0 && currentTime / duration >= 0.9)

  return withTimestamp({
    ...normalized,
    activities: {
      ...normalized.activities,
      audio: {
        ...normalized.activities.audio,
        visited: true,
        completed: normalized.activities.audio?.completed || reachedCompletion,
        updatedAt: new Date().toISOString()
      }
    },
    audio: {
      currentTime: reachedCompletion ? duration : currentTime,
      duration,
      completed: normalized.audio.completed || reachedCompletion
    }
  })
}

export const useAcademyProgress = () => {
  const [progress, setProgress] = useState(() => loadAcademyProgress())
  const progressRef = useRef(progress)

  const commit = useCallback((updater) => {
    const next = normalizeAcademyProgress(updater(progressRef.current))
    progressRef.current = next
    try {
      globalThis.localStorage?.setItem(ACADEMY_PROGRESS_KEY, JSON.stringify(next))
    } catch {
      // La academia sigue funcionando aunque el navegador bloquee el almacenamiento.
    }
    setProgress(next)
    return next
  }, [])

  const visitSlide = useCallback((moduleId, slideIndex) => {
    commit(current => visitAcademySlide(current, moduleId, slideIndex))
  }, [commit])

  const recordQuiz = useCallback((moduleId, score) => {
    commit(current => recordAcademyQuiz(current, moduleId, score))
  }, [commit])

  const completeModule = useCallback((moduleId, score) => {
    commit(current => completeAcademyModule(current, moduleId, score))
  }, [commit])

  const recordActivity = useCallback((activityId, details = {}) => {
    commit(current => recordAcademyActivity(current, activityId, details))
  }, [commit])

  const recordAudio = useCallback((currentTime, duration, completed = false) => {
    commit(current => recordAcademyAudio(current, currentTime, duration, completed))
  }, [commit])

  const resetProgress = useCallback(() => {
    const next = createDefaultAcademyProgress()
    progressRef.current = next
    try {
      globalThis.localStorage?.removeItem(ACADEMY_PROGRESS_KEY)
    } catch {
      // Sin almacenamiento, sólo se restablece el estado en memoria.
    }
    setProgress(next)
  }, [])

  const summary = useMemo(() => calculateAcademySummary(progress), [progress])

  const getModuleProgress = useCallback((moduleId, slideCount = 7) => {
    const moduleProgress = progress.modules[moduleId]
    const viewed = Math.min(moduleProgress?.viewedSlides?.length || 0, slideCount)
    return {
      ...moduleProgress,
      viewed,
      percent: moduleProgress?.completed
        ? 100
        : Math.round((viewed / slideCount) * 100)
    }
  }, [progress.modules])

  return {
    progress,
    summary,
    visitSlide,
    recordQuiz,
    completeModule,
    recordActivity,
    recordAudio,
    resetProgress,
    getModuleProgress
  }
}

export default useAcademyProgress
