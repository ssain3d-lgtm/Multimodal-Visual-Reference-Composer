/**
 * ReferenceMix — take composition from A, clothing from B, lighting from C.
 *
 * Conflict handling follows two rules that pull against each other, so both are
 * made explicit:
 *   - the brief forbids silently dropping a value, so nothing is ever deleted
 *   - a user who just wants a prompt should still get one
 * So conflicts are graded. A HARD conflict (two mutually exclusive physical
 * facts: low angle vs high angle) resolves to a deterministic winner that the UI
 * shows and the user can flip. A SOFT conflict (two values that merely sit oddly
 * together) is surfaced as a warning and both values are emitted. Generation is
 * never blocked.
 */

import { conflictId, mintId } from './id.js'

export function createMix() {
  return { schema_version: '1.0', id: mintId('mix'), references: [] }
}

/** Add or replace one reference's contribution. `use` is a list of EXTRACT groups. */
export function setContribution(mix, referenceId, use) {
  const entry = mix.references.find((r) => r.reference_id === referenceId)
  if (!use.length) {
    mix.references = mix.references.filter((r) => r.reference_id !== referenceId)
    return mix
  }
  if (entry) entry.use = [...use]
  else mix.references.push({ reference_id: referenceId, use: [...use] })
  return mix
}

export function contributionOf(mix, referenceId) {
  const entry = mix.references.find((r) => r.reference_id === referenceId)
  return entry ? entry.use : []
}

/**
 * Expand the mix into chips, in mix order. Earlier entries win a hard conflict,
 * which makes "the first reference you added is the base" the mental model.
 */
export function mixToChips(mix, library, constants) {
  const out = []
  mix.references.forEach((entry, order) => {
    const ref = library.get(entry.reference_id)
    if (!ref) return
    for (const group of entry.use) {
      const categories = group === '*' ? Object.keys(ref.visual_attributes) : (constants.EXTRACT_GROUP_MAP[group] || [])
      for (const category of categories) {
        for (const value of ref.visual_attributes[category] || []) {
          out.push({ value, category, refId: ref.id, group, order })
        }
      }
    }
  })
  return out
}

/**
 * Find conflicts among a set of {value, category, refId, order} contributions.
 * Returns one record per clash, with a default winner already chosen.
 */
export function detectConflicts(contributions, taxonomy, constants, resolutions = {}) {
  const byCategory = new Map()
  for (const c of contributions) {
    const list = byCategory.get(c.category) || []
    list.push(c)
    byCategory.set(c.category, list)
  }

  const conflicts = []
  for (const [category, items] of byCategory) {
    if (items.length < 2) continue
    const arity = constants.CATEGORY_ARITY[category] || 'multi'
    const clusters = new Map()
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].value === items[j].value) continue
        if (!taxonomy.conflicts(items[i].value, items[j].value)) continue
        const node = taxonomy.resolve(items[i].value)
        const group = node ? node.exclusivity_group : null
        const key = `${category}|${group ?? ''}`
        const cluster = clusters.get(key) || { category, group, values: new Set() }
        cluster.values.add(items[i].value)
        cluster.values.add(items[j].value)
        clusters.set(key, cluster)
      }
    }
    for (const cluster of clusters.values()) {
      const values = [...cluster.values]
      const id = conflictId(cluster.category, cluster.group, values)
      const members = items.filter((it) => values.includes(it.value))
      // Earliest contributor wins unless a human said otherwise.
      const byOrder = [...members].sort((a, b) => a.order - b.order)
      conflicts.push({
        id,
        category: cluster.category,
        group: cluster.group,
        severity: arity === 'single_dominant' ? 'hard' : 'soft',
        values,
        contributors: members.map((m) => ({ value: m.value, refId: m.refId })),
        dominant: resolutions[id] && values.includes(resolutions[id]) ? resolutions[id] : byOrder[0].value,
        resolvedByUser: Boolean(resolutions[id]),
      })
    }
  }
  return conflicts
}

/**
 * The contributions that actually reach the prompt. Nothing is removed from the
 * mix itself — this is a view. Only a HARD conflict suppresses a value, and only
 * the losing side of it.
 */
export function effectiveContributions(contributions, conflicts) {
  const suppressed = new Set()
  for (const c of conflicts) {
    if (c.severity !== 'hard') continue
    for (const v of c.values) if (v !== c.dominant) suppressed.add(`${c.category}|${v}`)
  }
  return contributions.filter((c) => !suppressed.has(`${c.category}|${c.value}`))
}
