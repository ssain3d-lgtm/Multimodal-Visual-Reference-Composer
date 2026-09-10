/**
 * Prompt composition, kept separate from search on purpose.
 *
 * Two stages, because the structured form is the reusable artefact and the text
 * is only one way of rendering it: intent + mix -> StructuredPrompt -> text.
 * A ComfyUI node, a shot list or a video-model prompt would reuse stage one and
 * replace stage two.
 */

import { SLOT_ORDER } from '../core/constants.js'

/** Group taxonomy ids into the 13 StructuredPrompt slots. */
export function toStructuredPrompt(contributions, taxonomy, constants) {
  const slots = {}
  for (const slot of constants.PROMPT_SLOTS) slots[slot] = []

  for (const c of contributions) {
    const slot = c.negate ? 'constraints' : constants.CATEGORY_TO_SLOT[c.category]
    if (!slot) continue
    const node = taxonomy.resolve(c.value)
    const text = c.negate
      ? (node && node.negative_fragment) || `no ${node ? node.label.toLowerCase() : c.value}`
      : (node && node.prompt_fragment) || (node ? node.label.toLowerCase() : c.value)
    if (!text) continue
    if (slots[slot].some((f) => f.text === text)) continue
    slots[slot].push({ text, value: c.value, category: c.category, refId: c.refId || null, hedged: c.category === 'lens' })
  }
  return slots
}

/**
 * Generic natural-language rendering. Fragments are authored to read as clauses,
 * so joining them with commas in slot order produces a sentence rather than a
 * bag of keywords.
 */
export function formatPrompt(structured, { mode = 'generic' } = {}) {
  const parts = []
  for (const slot of SLOT_ORDER) {
    const fragments = structured[slot]
    if (!fragments || !fragments.length) continue
    if (slot === 'constraints') continue
    parts.push(fragments.map((f) => f.text).join(', '))
  }
  let text = parts.join(', ')
  const constraints = (structured.constraints || []).map((f) => f.text)
  if (constraints.length) text += `. Avoid: ${constraints.join(', ')}`
  if (mode !== 'generic') text = `${text}`
  return text.replace(/\s+/g, ' ').trim()
}

/** Which reference contributed which part of the final text — the provenance view. */
export function provenance(structured) {
  const rows = []
  for (const slot of SLOT_ORDER) {
    for (const f of structured[slot] || []) {
      if (!f.refId) continue
      rows.push({ slot, text: f.text, refId: f.refId, category: f.category })
    }
  }
  return rows
}
