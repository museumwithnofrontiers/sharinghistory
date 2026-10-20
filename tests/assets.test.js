import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { describe, expect, it } from 'vitest'

// theme/assets holds files taken byte for byte from the legacy site (D7);
// SOURCES.json says where each one came from. scripts/legacy-assets.js
// compares them with what legacy serves today; this keeps the list and the
// folder in step, offline.
const ROOT = join(import.meta.dirname, '..', 'theme', 'assets')
const entries = JSON.parse(readFileSync(join(ROOT, 'SOURCES.json'), 'utf8'))

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)]
  ))
}

describe('legacy chrome assets', () => {
  it('holds every listed file as legacy served it', () => {
    for (const entry of entries) {
      const bytes = readFileSync(join(ROOT, entry.path))
      expect(bytes.length, entry.path).toBe(entry.bytes)
      expect(createHash('sha256').update(bytes).digest('hex'), entry.path).toBe(entry.sha256)
    }
  })

  it('holds no file the list does not name', () => {
    const listed = new Set(entries.map((entry) => entry.path))
    const unlisted = filesUnder(ROOT)
      .map((file) => relative(ROOT, file).split(sep).join('/'))
      .filter((path) => path !== 'SOURCES.json' && !listed.has(path))
    expect(unlisted).toEqual([])
  })

  it('takes every file from legacy', () => {
    for (const entry of entries) {
      expect(new URL(entry.url).hostname, entry.path).toMatch(/^(sharinghistory|images)\.museumwnf\.org$/)
    }
  })
})
