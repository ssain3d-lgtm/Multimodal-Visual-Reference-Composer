#!/usr/bin/env node
/**
 * Documentation integrity checker.
 * Run: node tests/validate-docs.mjs
 *
 * Checks the things that silently rot in a large doc set: dead relative links,
 * dead anchors, taxonomy ids cited in prose that do not exist in the data,
 * schema files referenced but absent, and the brief-mandated doc set.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const errors = []
const warnings = []

const mdFiles = [
  ...fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => 'docs/' + f),
  ...fs.readdirSync(path.join(ROOT, 'docs/research')).filter((f) => f.endsWith('.md')).map((f) => 'docs/research/' + f),
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.md')),
]

// ------------------------------------------------- brief-mandated doc set
const REQUIRED_DOCS = ['PRODUCT_VISION', 'COMPETITIVE_ANALYSIS', 'ARCHITECTURE', 'DATA_SCHEMA',
  'SEARCH_ARCHITECTURE', 'LICENSE_POLICY', 'THIRD_PARTY_REVIEW', 'ROADMAP']
for (const d of REQUIRED_DOCS) {
  if (!fs.existsSync(path.join(ROOT, `docs/${d}.md`))) errors.push(`brief section 3 requires docs/${d}.md — missing`)
}

// ------------------------------------------------------ anchors per file
const slug = (h) => h.toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-')
const anchors = new Map()
for (const f of mdFiles) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8')
  const set = new Set()
  for (const m of text.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)) set.add(slug(m[1]))
  for (const m of text.matchAll(/<a\s+(?:id|name)="([^"]+)"/g)) set.add(m[1].toLowerCase())
  anchors.set(f, set)
}

// ------------------------------------------------------- link integrity
for (const f of mdFiles) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/\]\((?!https?:|mailto:|data:)([^)\s]+)\)/g)) {
      const raw = m[1]
      const [rel, anchor] = raw.split('#')
      if (rel) {
        const target = path.normalize(path.join(path.dirname(path.join(ROOT, f)), rel))
        if (!fs.existsSync(target)) { errors.push(`${f}:${i + 1} dead link -> ${raw}`); continue }
        if (anchor) {
          const relKey = path.relative(ROOT, target)
          if (anchors.has(relKey) && !anchors.get(relKey).has(anchor.toLowerCase()))
            warnings.push(`${f}:${i + 1} dead anchor -> ${raw}`)
        }
      } else if (anchor && !anchors.get(f).has(anchor.toLowerCase())) {
        warnings.push(`${f}:${i + 1} dead in-page anchor -> #${anchor}`)
      }
    }
  })
}

// -------------------------------------------- taxonomy ids cited in prose
const taxIds = new Set()
const taxCats = new Set()
for (const f of fs.readdirSync(path.join(ROOT, 'data/taxonomy'))) {
  if (!f.endsWith('.json')) continue
  for (const n of JSON.parse(fs.readFileSync(path.join(ROOT, 'data/taxonomy', f), 'utf8')).nodes || []) {
    taxIds.add(n.id); taxCats.add(n.category)
  }
}
// Ids the docs cite *because* they are invalid. INV-LENS-1 forbids asserting a focal
// length, so `lens.35mm` appears throughout as the canonical rejected example.
const COUNTEREXAMPLES = new Set(['lens.35mm'])
// Only inspect ids inside backticks: prose like "the scene.json file" is not a citation.
const ghost = new Map()
for (const f of mdFiles) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    // Backticked prose citations AND quoted ids inside fenced JSON examples: a worked
    // example that cites an id nothing defines is exactly the drift that wastes an
    // implementer's afternoon, so both forms are checked.
    for (const m of line.matchAll(/[`"']([a-z_]+)\.([a-z0-9_]+)[`"']/g)) {
      const [id, cat] = [m[1] + '.' + m[2], m[1]]
      if (!taxCats.has(cat) || taxIds.has(id) || COUNTEREXAMPLES.has(id)) continue
      if (!ghost.has(id)) ghost.set(id, [])
      ghost.get(id).push(`${f}:${i + 1}`)
    }
  })
}
for (const [id, locs] of ghost) errors.push(`taxonomy id \`${id}\` cited in docs but absent from data/taxonomy (${locs.length}x, e.g. ${locs[0]})`)

// ------------------------------------------------- counts stated in prose
// Every merge or addition to data/taxonomy silently falsifies any exact count
// written into a document. Three cases are distinguished:
//   "194 nodes" on a line naming `clothing`  -> checked against that category
//   a number near the whole-taxonomy total    -> checked against the total
//   "a 21-node utility pack" (another project) -> ignored
// Approximate figures ("~750") are engineering budgets and are left alone.
const nodeTotal = taxIds.size
const perCategory = {}
for (const f of fs.readdirSync(path.join(ROOT, 'data/taxonomy'))) {
  if (!f.endsWith('.json')) continue
  for (const n of JSON.parse(fs.readFileSync(path.join(ROOT, 'data/taxonomy', f), 'utf8')).nodes || [])
    perCategory[n.category] = (perCategory[n.category] || 0) + 1
}
const fileTotal = fs.readdirSync(path.join(ROOT, 'data/taxonomy')).filter((f) => f.endsWith('.json')).length
const NUMWORD = { seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 }
for (const f of mdFiles) {
  fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.matchAll(/(~|≈|about |approximately |roughly )?\b(\d{2,4})[ -](?:taxonomy )?nodes?\b/g)) {
      if (m[1]) continue                                   // an explicit approximation
      const claimed = Number(m[2])
      // The category must be named NEXT TO the number. Doc lines run long, and a
      // category mentioned 300 characters later is about something else entirely.
      const near = line.slice(Math.max(0, m.index - 60), m.index + m[0].length + 60)
      const cat = Object.keys(perCategory).find((c) => new RegExp('`' + c + '`|\\b' + c + ' (?:subtree|category|branch)').test(near))
      if (cat) {
        if (claimed !== perCategory[cat]) errors.push(`${f}:${i + 1} states ${claimed} nodes for \`${cat}\`; data/taxonomy holds ${perCategory[cat]}`)
      } else if (claimed > nodeTotal * 0.65 && claimed < nodeTotal * 1.35 && claimed !== nodeTotal) {
        errors.push(`${f}:${i + 1} states ${claimed} taxonomy nodes; data/taxonomy holds ${nodeTotal}`)
      }
    }
    for (const m of line.matchAll(/\b(\d+|seven|eight|nine|ten|eleven|twelve)[ -]taxonomy (?:JSON )?files\b/gi)) {
      const n = NUMWORD[m[1].toLowerCase()] ?? Number(m[1])
      if (n !== fileTotal) errors.push(`${f}:${i + 1} states ${m[1]} taxonomy files; data/taxonomy holds ${fileTotal}`)
    }
  })
}

// ------------------------------------------------- schema files referenced
for (const f of mdFiles) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/`(docs\/schemas\/[\w.-]+\.json)`/g)) {
      if (!fs.existsSync(path.join(ROOT, m[1]))) errors.push(`${f}:${i + 1} references missing schema ${m[1]}`)
    }
  })
}

// ---------------------------------------------------------------- report
console.log(`docs: ${mdFiles.length} markdown files checked`)
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings.slice(0, 40)) console.log(`  ! ${w}`)
  if (warnings.length > 40) console.log(`  ... and ${warnings.length - 40} more`)
}
if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`)
  for (const e of errors.slice(0, 60)) console.error(`  x ${e}`)
  if (errors.length > 60) console.error(`  ... and ${errors.length - 60} more`)
  process.exit(1)
}
console.log('\nAll documentation invariants hold.')
