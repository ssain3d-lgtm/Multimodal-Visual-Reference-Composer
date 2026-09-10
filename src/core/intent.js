/**
 * VisualIntent — the one structure every input converts to.
 *
 * Chips are objects, not bare strings, because the product has to answer
 * "where did this come from?" for every element: which reference contributed it,
 * how confident the analyzer was, whether the user has pinned it. A bare string
 * makes selective inheritance and the conflict UI impossible to build.
 */

import { mintId } from './id.js'

export const EMPTY_CATEGORIES = [
  'subject', 'appearance', 'framing', 'camera_angle', 'camera_distance', 'lens',
  'pose', 'action', 'motion', 'camera_motion', 'clothing', 'scene', 'lighting',
  'composition', 'color', 'mood', 'style', 'time', 'weather',
]

export function createIntent() {
  const intent = { confidence: {} }
  for (const c of EMPTY_CATEGORIES) intent[c] = []
  return intent
}

/**
 * Add a chip. `props.origin_category` carries `props` values, which ride in
 * `scene` so VisualIntent keeps exactly the brief's key set while a reference
 * round-trip stays lossless.
 */
export function addChip(intent, { value, category, source = 'user', confidence = 1, refId = null, label = null }) {
  const target = category === 'props' ? 'scene' : category
  if (!intent[target]) return intent
  const existing = intent[target].find((c) => c.value === value)
  if (existing) {
    // Two references agreeing is agreement, not collision: keep the stronger
    // confidence and remember both contributors.
    existing.confidence = Math.max(existing.confidence, confidence)
    if (refId && !existing.contributors.includes(refId)) existing.contributors.push(refId)
    return intent
  }
  intent[target].push({
    id: mintId('chip', value),
    value,
    label,
    source,
    confidence,
    ref_id: refId,
    locked: false,
    negate: false,
    contributors: refId ? [refId] : [],
    ...(category === 'props' ? { origin_category: 'props' } : {}),
  })
  return intent
}

export function removeChip(intent, chipId) {
  for (const c of EMPTY_CATEGORIES) intent[c] = intent[c].filter((chip) => chip.id !== chipId)
  return intent
}

export function toggleLock(intent, chipId) {
  for (const c of EMPTY_CATEGORIES) {
    const chip = intent[c].find((x) => x.id === chipId)
    if (chip) { chip.locked = !chip.locked; return intent }
  }
  return intent
}

/** Drop every chip contributed by one reference, except chips the user locked. */
export function removeByReference(intent, refId) {
  for (const c of EMPTY_CATEGORIES) {
    intent[c] = intent[c].filter((chip) => {
      if (chip.locked) return true
      chip.contributors = chip.contributors.filter((r) => r !== refId)
      return chip.ref_id !== refId && chip.contributors.length > 0 || chip.source === 'user'
    })
  }
  return intent
}

export function allChips(intent) {
  return EMPTY_CATEGORIES.flatMap((c) => intent[c].map((chip) => ({ ...chip, category: c })))
}

export function isEmpty(intent) {
  return EMPTY_CATEGORIES.every((c) => intent[c].length === 0)
}
