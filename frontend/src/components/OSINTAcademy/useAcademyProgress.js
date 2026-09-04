import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ACADEMY_PROGRESS_KEY, LEGACY_ACADEMY_PROGRESS_KEY, ACADEMY_PROGRESS_EVENT,
  calculateAcademySummary, completeAcademyModule, createDefaultAcademyProgress, loadAcademyProgress,
  normalizeAcademyProgress, recordAcademyActivity, recordAcademyAudio, recordAcademyQuiz,
  saveAcademyProgress, visitAcademySlide
} from '../../utils/academyProgress.js'
import { getAcademyLessonDefinition } from './data/academyCatalog.js'
export * from '../../utils/academyProgress.js'

export const useAcademyProgress = () => {
  const [progress, setProgress] = useState(() => loadAcademyProgress())
  const progressRef = useRef(progress)
  useEffect(() => {
    const sync = event => {
      if (event.type === 'storage' && event.key && ![ACADEMY_PROGRESS_KEY, LEGACY_ACADEMY_PROGRESS_KEY].includes(event.key)) return
      const next = event.detail?.progress ? normalizeAcademyProgress(event.detail.progress) : loadAcademyProgress()
      progressRef.current = next
      setProgress(next)
    }
    globalThis.addEventListener?.('storage', sync)
    globalThis.addEventListener?.(ACADEMY_PROGRESS_EVENT, sync)
    return () => {
      globalThis.removeEventListener?.('storage', sync)
      globalThis.removeEventListener?.(ACADEMY_PROGRESS_EVENT, sync)
    }
  }, [])
  const commit = useCallback(updater => {
    const next = saveAcademyProgress(updater(progressRef.current))
    progressRef.current = next
    setProgress(next)
    globalThis.dispatchEvent?.(new CustomEvent(ACADEMY_PROGRESS_EVENT, { detail: { progress: next } }))
    return next
  }, [])
  const visitSlide = useCallback((id, index) => commit(current => visitAcademySlide(current, id, index)), [commit])
  const recordQuiz = useCallback((id, score) => commit(current => recordAcademyQuiz(current, id, score)), [commit])
  const completeModule = useCallback((id, score) => commit(current => completeAcademyModule(current, id, score)), [commit])
  const recordActivity = useCallback((id, details = {}) => commit(current => recordAcademyActivity(current, id, details)), [commit])
  const recordAudio = useCallback((time, duration, completed = false) => commit(current => recordAcademyAudio(current, time, duration, completed)), [commit])
  const resetProgress = useCallback(() => {
    try { globalThis.localStorage?.removeItem(LEGACY_ACADEMY_PROGRESS_KEY) } catch { /* Storage may be disabled. */ }
    return commit(() => createDefaultAcademyProgress())
  }, [commit])
  const summary = useMemo(() => calculateAcademySummary(progress), [progress])
  const getModuleProgress = useCallback((moduleId, slideCount = getAcademyLessonDefinition(moduleId)?.slideCount || 1) => {
    const moduleProgress = progress.modules[moduleId]
    const viewed = Math.min(moduleProgress?.viewedSlides?.length || 0, slideCount)
    return { ...moduleProgress, viewed, percent: Math.round(viewed / slideCount * 100) }
  }, [progress.modules])
  return { progress, summary, visitSlide, recordQuiz, completeModule, recordActivity, recordAudio, resetProgress, getModuleProgress }
}
export default useAcademyProgress
