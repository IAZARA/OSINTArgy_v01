import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('catalog validation script passes', () => {
  execFileSync('node', ['scripts/validate-catalog.mjs'], {
    cwd: new URL('../..', import.meta.url),
    stdio: 'pipe'
  })
})

test('fallback sync is deterministic', () => {
  const repoRoot = new URL('../..', import.meta.url)
  const fallbackPath = new URL('frontend/src/data/tools.json', repoRoot)
  const before = readFileSync(fallbackPath, 'utf8')

  execFileSync('node', ['scripts/sync-tools-fallback.mjs'], {
    cwd: repoRoot,
    stdio: 'pipe'
  })

  const after = readFileSync(fallbackPath, 'utf8')
  assert.equal(after, before)
})
