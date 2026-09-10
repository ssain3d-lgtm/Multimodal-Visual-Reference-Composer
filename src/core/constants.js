/**
 * The canonical constants, read from the schema rather than retyped here.
 *
 * `taxonomy-node.schema.json` carries the shared $defs: the category enum, the
 * arity table, the category -> prompt-slot map, the EXTRACT groups. Copying them
 * into JavaScript would create a second source of truth that drifts silently the
 * first time either side is edited, so this module loads the schema instead.
 */

let cache = null

/** @param {(path: string) => Promise<any>} loadJson */
export async function loadConstants(loadJson) {
  if (cache) return cache
  const schema = await loadJson('docs/schemas/taxonomy-node.schema.json')
  const defs = schema.$defs || {}
  const constOf = (name) => {
    const d = defs[name]
    if (!d || d.const === undefined) throw new Error(`taxonomy-node.schema.json is missing $defs/${name}.const`)
    return d.const
  }
  cache = {
    CATEGORIES: defs.visual_category.enum,
    PROMPT_SLOTS: defs.prompt_slot.enum,
    EXTRACT_GROUPS: defs.extract_group.enum,
    EXTRACT_GROUP_MAP: constOf('extract_group_map'),
    CATEGORY_TO_SLOT: constOf('category_to_prompt_slot_map'),
    CATEGORY_ARITY: constOf('category_arity_map'),
  }
  return cache
}

/**
 * Slot emit order for the generic formatter. Reads as a sentence: who, wearing
 * what, doing what, shot how, where, lit how, styled how.
 */
export const SLOT_ORDER = [
  'subject', 'appearance', 'clothing', 'action', 'motion',
  'framing', 'camera', 'lens', 'composition', 'scene', 'lighting', 'style', 'constraints',
]
