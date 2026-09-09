#!/usr/bin/env node
/**
 * JSON Schema integrity checker — dependency-free.
 * Run: node tests/validate-schemas.mjs
 *
 * The seven schemas in docs/schemas/ are the project's contract, and every one of
 * them $refs taxonomy-node.schema.json for the shared $defs. That makes a single
 * malformed construct fatal to all seven, so this runs before anything trusts them.
 *
 * Checks:
 *   - each file parses
 *   - every "pattern" / "patternProperties" key compiles as an ECMA-262 regex
 *     (JSON Schema mandates ECMA-262: inline flags like "(?i)" are NOT legal and
 *     make the whole schema uncompilable under ajv)
 *   - every $ref resolves inside the local registry of $ids — schema.uvrc.dev is an
 *     identifier, not a host, so nothing may depend on a network fetch
 *   - no duplicate $id, no unreachable $defs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIR = path.join(ROOT, 'docs/schemas')
const errors = []
const warnings = []

const docs = new Map()   // filename -> parsed
const byId = new Map()   // $id -> filename

for (const file of fs.readdirSync(DIR).sort()) {
  if (!file.endsWith('.json')) continue
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
    docs.set(file, doc)
    if (!doc.$id) errors.push(`${file}: no $id — cross-file $refs cannot resolve without one`)
    else if (byId.has(doc.$id)) errors.push(`${file}: duplicate $id "${doc.$id}" (also ${byId.get(doc.$id)})`)
    else byId.set(doc.$id, file)
  } catch (e) {
    errors.push(`${file}: invalid JSON — ${e.message}`)
  }
}

/** Walk every node of a schema document, reporting the JSON pointer of each hit. */
function walk(node, ptr, fn) {
  if (node === null || typeof node !== 'object') return
  fn(node, ptr)
  if (Array.isArray(node)) node.forEach((v, i) => walk(v, `${ptr}/${i}`, fn))
  else for (const [k, v] of Object.entries(node)) walk(v, `${ptr}/${k.replace(/~/g, '~0').replace(/\//g, '~1')}`, fn)
}

/** Resolve a JSON pointer inside a parsed document. */
function resolvePointer(doc, pointer) {
  if (pointer === '' || pointer === '#') return doc
  let cur = doc
  for (const raw of pointer.replace(/^#?\//, '').split('/')) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~')
    if (cur === null || typeof cur !== 'object' || !(key in cur)) return undefined
    cur = cur[key]
  }
  return cur
}

const usedDefs = new Set()

for (const [file, doc] of docs) {
  walk(doc, '#', (node, ptr) => {
    // ---- regex legality (ECMA-262 only) ----
    if (typeof node.pattern === 'string') {
      try { new RegExp(node.pattern) } catch (e) {
        errors.push(`${file} ${ptr}/pattern: not a legal ECMA-262 regex — ${e.message}\n      pattern: ${node.pattern}`)
      }
      if (/\(\?[a-zA-Z]+\)/.test(node.pattern))
        errors.push(`${file} ${ptr}/pattern: inline flag group "${node.pattern.match(/\(\?[a-zA-Z]+\)/)[0]}" is not valid in ECMA-262 — JSON Schema requires ECMA-262 regexes`)
    }
    if (node.patternProperties && typeof node.patternProperties === 'object') {
      for (const key of Object.keys(node.patternProperties)) {
        try { new RegExp(key) } catch (e) {
          errors.push(`${file} ${ptr}/patternProperties/${key}: not a legal ECMA-262 regex — ${e.message}`)
        }
      }
    }

    // ---- $ref resolution ----
    if (typeof node.$ref === 'string') {
      const [base, pointer] = node.$ref.split('#')
      const targetFile = base === '' ? file : byId.get(base) || byId.get(base.replace(/#$/, ''))
      if (!targetFile) {
        errors.push(`${file} ${ptr}/$ref: "${node.$ref}" — no local schema declares that $id (network resolution is not allowed)`)
        return
      }
      const target = resolvePointer(docs.get(targetFile), pointer === undefined ? '' : '#' + pointer)
      if (target === undefined) errors.push(`${file} ${ptr}/$ref: "${node.$ref}" — pointer not found in ${targetFile}`)
      else if (pointer) usedDefs.add(`${targetFile}#${pointer}`)
    }
  })
}

// ---- unreachable $defs ----
for (const [file, doc] of docs) {
  for (const name of Object.keys(doc.$defs || {})) {
    const key = `${file}#/$defs/${name}`
    if (!usedDefs.has(key)) warnings.push(`${file}: $defs/${name} is never $ref'd`)
  }
}

// ---- the seven contract files ----
const EXPECTED = ['visual-intent', 'reference', 'reference-mix', 'structured-prompt',
  'taxonomy-node', 'visual-recipe', 'explorer-state']
for (const name of EXPECTED) {
  if (!docs.has(`${name}.schema.json`)) errors.push(`missing contract schema docs/schemas/${name}.schema.json`)
}

console.log(`schemas: ${docs.size} files, ${byId.size} distinct $ids`)
if (warnings.length) {
  console.log(`\n${warnings.length} warning(s):`)
  for (const w of warnings) console.log(`  ! ${w}`)
}
if (errors.length) {
  console.error(`\n${errors.length} ERROR(S):`)
  for (const e of errors) console.error(`  x ${e}`)
  process.exit(1)
}
console.log('\nAll schema invariants hold.')
