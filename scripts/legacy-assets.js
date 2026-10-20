// node scripts/legacy-assets.js [--check]
//
// The chrome assets this website took from the legacy Sharing History site
// (decision D7 of inventory-app#2233: logos, banners, sponsor marks and
// favicons belong to the website's own repository, not to the inventory's
// image management). `theme/assets/SOURCES.json` lists each file, by its path
// in the repository (`theme/assets/…`, and `public/favicon.ico`, which the
// layout leaves to each site), with the legacy address it came from; this
// script downloads every file the list names and records its size and
// SHA-256, byte for byte as legacy serves it.
//
// --check downloads every file again, writes nothing, and fails when legacy
// now serves something other than what the repository holds.
//
// Node runs in a container, never on the host:
//   docker run --rm -v "${PWD}:/app" -w /app node:lts-alpine node scripts/legacy-assets.js
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const ROOT = join(import.meta.dirname, '..')
const MANIFEST = join(ROOT, 'theme', 'assets', 'SOURCES.json')
// The legacy servers are shared: a few requests at a time, and named.
const CONCURRENCY = 3
const HEADERS = { 'user-agent': 'mwnf-sharinghistory-assets/1.0 (read-only)' }

const check = process.argv.includes('--check')
const entries = JSON.parse(readFileSync(MANIFEST, 'utf8'))

async function fetchOne(entry) {
  // A redirect is how legacy answers for a file it doesn't have, so only a
  // direct 200 counts.
  const response = await globalThis.fetch(entry.url, { headers: HEADERS, redirect: 'manual' })
  if (response.status !== 200) throw new Error(`${entry.url}: HTTP ${response.status}`)
  const bytes = new Uint8Array(await response.arrayBuffer())
  return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') }
}

const problems = []
let next = 0
async function worker() {
  while (next < entries.length) {
    const entry = entries[next++]
    try {
      const { bytes, sha256 } = await fetchOne(entry)
      if (check) {
        if (sha256 !== entry.sha256) problems.push(`${entry.path}: legacy now serves ${sha256}, the repository holds ${entry.sha256}`)
      } else {
        const target = join(ROOT, entry.path)
        mkdirSync(dirname(target), { recursive: true })
        writeFileSync(target, bytes)
        entry.bytes = bytes.length
        entry.sha256 = sha256
      }
    } catch (error) {
      problems.push(`${entry.path}: ${error.message}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

if (!check) {
  const lines = entries.map((entry) => `  ${JSON.stringify(entry)}`)
  writeFileSync(MANIFEST, `[\n${lines.join(',\n')}\n]\n`)
}
for (const problem of problems) console.error(problem)
console.log(`${entries.length} files, ${problems.length} problems${check ? ' (checked against legacy)' : ''}`)
process.exitCode = problems.length ? 1 : 0
