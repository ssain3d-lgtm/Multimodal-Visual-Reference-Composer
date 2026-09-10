#!/usr/bin/env node
/**
 * Documentation integrity checker.
 * Run: node tests/validate-docs.mjs
 *
 * Checks the things that silently rot in a large doc set: dead relative links,
 * dead anchors, taxonomy ids cited in prose that do not exist in the data,
 * node and file counts stated in prose that the data has since moved past,
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
// A citation is an id inside a delimited span — an inline-code span or a quoted string.
// Backticked prose citations AND the quoted ids of fenced JSON examples therefore both
// count (a worked example citing an id nothing defines is exactly the drift that wastes
// an implementer's afternoon), while running prose "the scene.json file" does not. Spans
// are scanned through rather than matched end to end, because one span often carries
// several ids: `motion.walking -> action.walking`.
const SPAN = /`([^`\n]+)`|"([^"\n]*)"|'([^'\n]*)'/g
// Category names double as taxonomy filenames, so a path (`data/taxonomy/scene.json`) and
// a wildcard family (`camera_motion.pan_*`) must not read as ids; FILE_SUFFIX catches the
// bare filename form (`scene.json`) that the boundaries alone would let through.
const CITED_ID = /(?<![\w./-])([a-z_]+)\.([a-z0-9_]+)(?![\w*.-])/g
const FILE_SUFFIX = new Set(['json', 'md', 'js', 'mjs'])
const ghost = new Map()
for (const f of mdFiles) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n')
  lines.forEach((line, i) => {
    for (const s of line.matchAll(SPAN)) {
      for (const m of (s[1] ?? s[2] ?? s[3] ?? '').matchAll(CITED_ID)) {
        const [id, cat] = [m[1] + '.' + m[2], m[1]]
        if (!taxCats.has(cat) || taxIds.has(id) || COUNTEREXAMPLES.has(id)) continue
        if (FILE_SUFFIX.has(m[2])) continue
        if (!ghost.has(id)) ghost.set(id, [])
        ghost.get(id).push(`${f}:${i + 1}`)
      }
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

// --------------------------------------------- fenced JSON blocks are honest
// JSON.parse accepts a duplicate key and silently keeps the last one. A worked
// example that does this is lying about its own output — exactly how a dropped
// `weather` chip survived review. Also catches blocks that do not parse at all.
function duplicateKeys(text) {
  // Track one frame per {} or []. Inside an object, strings alternate key, value,
  // key, value; only the key positions are collected. Getting this wrong reports
  // every repeated *value* as a duplicate key.
  const dups = []
  const stack = []
  let inStr = false, esc = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (esc) { esc = false; continue }
      if (c === '\\') { esc = true; continue }
      if (c !== '"') continue
      inStr = false
      const top = stack[stack.length - 1]
      if (top && top.isObject && top.expectingKey) {
        let j = i - 1, buf = ''
        while (j >= 0 && !(text[j] === '"' && text[j - 1] !== '\\')) { buf = text[j] + buf; j-- }
        if (top.keys.has(buf)) dups.push(buf)
        else top.keys.add(buf)
        top.expectingKey = false
      }
      continue
    }
    if (c === '"') inStr = true
    else if (c === '{') stack.push({ isObject: true, expectingKey: true, keys: new Set() })
    else if (c === '[') stack.push({ isObject: false })
    else if (c === '}' || c === ']') stack.pop()
    else if (c === ',') { const top = stack[stack.length - 1]; if (top && top.isObject) top.expectingKey = true }
  }
  return dups
}
for (const f of mdFiles) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8')
  for (const m of text.matchAll(/```json\n([\s\S]*?)```/g)) {
    const line = text.slice(0, m.index).split('\n').length
    try { JSON.parse(m[1]) } catch (e) {
      errors.push(`${f}:${line} fenced json block does not parse — ${e.message.slice(0, 90)}`)
      continue
    }
    for (const k of new Set(duplicateKeys(m[1])))
      errors.push(`${f}:${line} fenced json block declares "${k}" twice; JSON.parse keeps only the last, so the example silently drops data`)
  }
}

// ------------------------------------------- intra-document section references
// "(see §12.5)" pointing at a section that does not exist sends a reader hunting.
for (const f of mdFiles) {
  const text = fs.readFileSync(path.join(ROOT, f), 'utf8')
  const sections = new Set()
  const lines0 = text.split('\n')
  const headingAt = []
  lines0.forEach((l, idx) => {
    const m = l.match(/^#{2,6}\s+(?:§\s*)?(\d+(?:\.\d+)*)/)
    if (m) { sections.add(m[1]); headingAt.push({ num: m[1], line: idx }) }
  })
  // Some sections number their points as an ordered list rather than as sub-headings,
  // so "§0.4" means item 4 of section 0. Count those items so the reference resolves.
  for (let h = 0; h < headingAt.length; h++) {
    const { num, line } = headingAt[h]
    if (num.includes('.')) continue
    const end = h + 1 < headingAt.length ? headingAt[h + 1].line : lines0.length
    let items = 0
    for (let i = line; i < end; i++) if (/^\s*(\d+)\.\s/.test(lines0[i])) items++
    for (let i = 1; i <= items; i++) sections.add(`${num}.${i}`)
  }
  if (sections.size < 3) continue          // not a numbered document
  text.split('\n').forEach((line, i) => {
    if (/^#{1,6}\s/.test(line)) return
    // "[`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §12.3" is a cross-document citation,
    // resolved by the link, not by a heading in this file.
    if (/\]\([^)]*\.md[^)]*\)/.test(line) || /\b[A-Z_0-9]+\.md\b/.test(line)) return
    for (const m of line.matchAll(/§\s?(\d+(?:\.\d+)*)/g)) {
      if (sections.has(m[1])) continue
      // "DATA_SCHEMA §6.4", "the brief §20", "§3.5 of the search doc" all point
      // elsewhere. Only a bare § with no nearby document word is a self-reference.
      const before = line.slice(Math.max(0, m.index - 60), m.index)
      // the tail of a range: "SEARCH_ARCHITECTURE §7.2-§7.5"
      if (/[-–—]\s*$|\bto\s*$/.test(before)) continue
      const after = line.slice(m.index + m[0].length, m.index + m[0].length + 40)
      if (/[A-Z][A-Z_0-9]{3,}\s*$|\b(?:brief|doc|document|spec|policy|roadmap|model|schema)\b[^.]{0,20}$/i.test(before)) continue
      if (/^\s*of\s+(?:the\s+)?\w+/i.test(after)) continue
      // a bare top-level §7 is fine when §7.1 exists
      if ([...sections].some((s) => s.startsWith(m[1] + '.'))) continue
      warnings.push(`${f}:${i + 1} cites §${m[1]}, which is not a heading in this document`)
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
