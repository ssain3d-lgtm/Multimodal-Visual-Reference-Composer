#!/usr/bin/env node
/**
 * Taxonomy integrity checker.
 *
 * Run: node tests/validate-taxonomy.mjs
 *
 * Enforces the invariants the product depends on. These are not style rules:
 * every one of them corresponds to a way the Unified Visual Explorer would
 * visibly break if the data drifted.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'data/taxonomy')
const REQUIRED = ['schema_version', 'id', 'category', 'label', 'aliases', 'related', 'parent', 'description', 'prompt_fragment']

const errors = []
const warnings = []
const err = (m) => errors.push(m)
const warn = (m) => warnings.push(m)
const low = (s) => String(s).toLowerCase().replace(/[_-]/g, ' ').trim()

// ---------------------------------------------------------------- load
const nodes = new Map()
for (const file of fs.readdirSync(DIR).sort()) {
  if (!file.endsWith('.json')) continue
  let doc
  try {
    doc = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  } catch (e) {
    err(`${file}: invalid JSON — ${e.message}`)
    continue
  }
  if (!Array.isArray(doc.nodes)) { err(`${file}: missing "nodes" array`); continue }
  for (const n of doc.nodes) {
    // Globally unique ids: a duplicate id makes a stored VisualIntent ambiguous.
    if (nodes.has(n.id)) err(`duplicate id "${n.id}" in ${file} and ${nodes.get(n.id)._file}`)
    nodes.set(n.id, { ...n, _file: file })
  }
}
const get = (id) => nodes.get(id) || null
const live = [...nodes.values()].filter((n) => !n.deprecated)

// ---------------------------------------------------------------- shape
for (const n of nodes.values()) {
  for (const k of REQUIRED) if (n[k] === undefined) err(`${n._file} ${n.id}: missing required field "${k}"`)
  if (!n.id?.includes('.')) err(`${n._file} ${n.id}: id must be "<category>.<slug>"`)
  else if (n.id.split('.')[0] !== n.category) err(`${n._file} ${n.id}: id prefix does not match category "${n.category}"`)
  if (Array.isArray(n.aliases) && n.aliases.length < 2 && !n.deprecated)
    warn(`${n.id}: only ${n.aliases.length} alias(es) — aliases ARE the AI-free search engine`)
}

// ------------------------------------------------- referential integrity
for (const n of nodes.values()) {
  for (const [key, list] of [['related', n.related], ['conflicts_with', n.conflicts_with], ['children', n.children]]) {
    for (const r of list || []) if (!nodes.has(r)) err(`${n.id}.${key}: dangling reference "${r}"`)
  }
  if (n.parent && !nodes.has(n.parent)) err(`${n.id}.parent: dangling reference "${n.parent}"`)
  if (n.replaced_by && !nodes.has(n.replaced_by)) err(`${n.id}.replaced_by: dangling reference "${n.replaced_by}"`)
  if (n.deprecated && !n.replaced_by) err(`${n.id}: deprecated but no replaced_by — it would vanish from search with no successor`)
}

// -------------------------------------------------- hierarchy coherence
for (const n of nodes.values()) {
  if (n.parent) {
    const p = get(n.parent)
    if (p && p.category !== n.category) err(`${n.id}: parent "${n.parent}" is in a different category`)
    if (p && !(p.children || []).includes(n.id)) err(`${n.id}: parent "${n.parent}" does not list it as a child`)
  }
  for (const c of n.children || []) {
    const cn = get(c)
    if (cn && cn.parent !== n.id) err(`${n.id}: child "${c}" has parent "${cn.parent}"`)
  }
  // cycle detection
  const seen = new Set()
  let cur = n
  while (cur?.parent) {
    if (seen.has(cur.parent)) { err(`${n.id}: parent chain contains a cycle at "${cur.parent}"`); break }
    seen.add(cur.parent)
    cur = get(cur.parent)
  }
}

// ------------------------------------------- conflicts must be symmetric
// Conflict detection compares a mix's chips pairwise; a one-directional edge
// means the warning appears or not depending on insertion order.
for (const n of nodes.values()) {
  for (const c of n.conflicts_with || []) {
    const o = get(c)
    if (o && !(o.conflicts_with || []).includes(n.id)) err(`asymmetric conflict: ${n.id} -> ${c} is not reciprocated`)
    if (c === n.id) err(`${n.id}: conflicts with itself`)
  }
}

// ------------------------------------------------------- the lens rule
// The brief forbids asserting a focal length from a picture: ids are "*_like".
for (const n of nodes.values()) {
  if (n.category === 'lens' && /\d+\s*mm/i.test(n.id) && !n.id.endsWith('_like'))
    err(`${n.id}: lens ids that name a focal length must end in "_like" (perspective is inferred, never measured)`)
}

// ------------------------------------------- one concept, one live node
// Two live nodes with the same label or the same prompt_fragment produce
// duplicate chips in the mixer and a repeated phrase in the output prompt.
for (const key of ['label', 'prompt_fragment']) {
  const seen = new Map()
  for (const n of live) {
    const k = low(n[key] || '')
    if (!k) continue
    if (seen.has(k)) err(`duplicate ${key} "${n[key]}": ${seen.get(k)} and ${n.id} — merge them or disambiguate`)
    else seen.set(k, n.id)
  }
}

// ------------------------------------------------ brief worked examples
// docs/../BRIEF sections 8 and 9 publish literal analyzer payloads. If the
// taxonomy cannot express them, the taxonomy is wrong — not the brief.
const aliasIndex = new Map()
for (const n of live) {
  for (const k of [n.label, ...(n.aliases || []), n.id.split('.').slice(1).join('.')]) {
    const kk = low(k)
    if (!aliasIndex.has(kk)) aliasIndex.set(kk, [])
    aliasIndex.get(kk).push(n.id)
  }
}
const BRIEF_EXAMPLES = [
  ['subject', 'adult woman'], ['framing', 'knee_up'], ['camera_angle', 'three_quarter'],
  ['pose', 'standing'], ['clothing', 'streetwear'], ['scene', 'urban street'], ['time', 'night'],
  ['lighting', 'direct flash'], ['lighting', 'flash'], ['lens', '35mm_like'],
  ['style', 'street fashion'], ['style', 'editorial'], ['framing', 'full_body'],
  ['action', 'dance'], ['motion', 'rhythmic'], ['camera_motion', 'slow_dolly_in'],
  ['camera_angle', 'eye_level'], ['scene', 'studio'], ['lighting', 'rim_light'],
  ['lighting', 'soft front'], ['camera_motion', 'tracking'], ['clothing', 'trench coat'],
  ['props', 'suitcase'], ['scene', 'airport'], ['camera_angle', 'low angle'],
]
for (const [cat, term] of BRIEF_EXAMPLES) {
  const hits = (aliasIndex.get(low(term)) || []).filter((id) => get(id).category === cat)
  if (!hits.length) {
    const other = aliasIndex.get(low(term)) || []
    err(`brief example not reachable: [${cat}] "${term}"${other.length ? ` (only matches ${other.join(', ')})` : ' (no match at all)'}`)
  }
}

// ------------------------------------------- brief section 36 categories
const REQUIRED_CATEGORIES = ['subject', 'appearance', 'framing', 'camera_angle', 'camera_distance', 'lens',
  'pose', 'action', 'motion', 'camera_motion', 'clothing', 'scene', 'lighting', 'composition',
  'color', 'mood', 'style', 'time', 'weather', 'props']
const present = new Set(live.map((n) => n.category))
for (const c of REQUIRED_CATEGORIES) if (!present.has(c)) err(`brief category "${c}" has no live taxonomy node`)
for (const c of present) if (!REQUIRED_CATEGORIES.includes(c)) err(`unknown category "${c}" is not in the brief's category set`)

// ---------------------------------------------------------------- report
const counts = {}
for (const n of live) counts[n.category] = (counts[n.category] || 0) + 1
console.log(`taxonomy: ${nodes.size} nodes (${live.length} live, ${nodes.size - live.length} deprecated) across ${present.size} categories`)
console.log(Object.entries(counts).sort().map(([c, n]) => `  ${c.padEnd(16)} ${n}`).join('\n'))

if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`  ! ${w}`)
}
if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`)
  for (const e of errors) console.error(`  x ${e}`)
  process.exit(1)
}
console.log('\nAll taxonomy invariants hold.')
