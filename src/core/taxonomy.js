/**
 * Taxonomy index.
 *
 * Loads the ten data/taxonomy files into one lookup, and repairs the two things
 * that cannot be trusted from authored data:
 *   - `children` is recomputed from `parent`, never read from storage
 *   - `conflicts_with` is closed symmetrically, because conflict detection
 *     compares chips pairwise and a one-way edge would fire or not depending on
 *     the order the user happened to add them
 * Deprecated nodes stay in the index so a stored chip still resolves, but they
 * never surface in search results; `resolve()` forwards them to their successor.
 */

const FILES = [
  'camera.json', 'clothing.json', 'framing.json', 'lens.json', 'lighting.json',
  'motion.json', 'pose.json', 'scene.json', 'style.json', 'subject.json',
]

const normalise = (s) => String(s).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()

export class Taxonomy {
  constructor() {
    this.nodes = new Map()
    this.byAlias = new Map()
    this.byCategory = new Map()
  }

  /** @param {(path: string) => Promise<any>} loadJson */
  static async load(loadJson) {
    const tax = new Taxonomy()
    const docs = await Promise.all(FILES.map((f) => loadJson(`data/taxonomy/${f}`)))
    for (const doc of docs) for (const node of doc.nodes || []) tax.nodes.set(node.id, { ...node, children: [] })
    tax.#rebuild()
    return tax
  }

  #rebuild() {
    // children from parent
    for (const node of this.nodes.values()) {
      if (!node.parent) continue
      const parent = this.nodes.get(node.parent)
      if (parent && parent.category === node.category) parent.children.push(node.id)
    }
    // symmetric conflict closure
    for (const node of this.nodes.values()) {
      for (const other of node.conflicts_with || []) {
        const target = this.nodes.get(other)
        if (!target) continue
        target.conflicts_with = target.conflicts_with || []
        if (!target.conflicts_with.includes(node.id)) target.conflicts_with.push(node.id)
      }
    }
    // surface-form index (live nodes only; deprecated ids still resolve by id)
    for (const node of this.nodes.values()) {
      const set = this.byCategory.get(node.category) || []
      set.push(node.id)
      this.byCategory.set(node.category, set)
      if (node.deprecated) continue
      for (const form of [node.label, ...(node.aliases || []), node.id.split('.').slice(1).join('.')]) {
        const key = normalise(form)
        if (!key) continue
        const ids = this.byAlias.get(key) || []
        if (!ids.includes(node.id)) ids.push(node.id)
        this.byAlias.set(key, ids)
      }
    }
  }

  get(id) { return this.nodes.get(id) || null }

  /** Follow `replaced_by` so a chip stored against a deprecated id keeps working. */
  resolve(id) {
    let node = this.nodes.get(id)
    const seen = new Set()
    while (node && node.deprecated && node.replaced_by && !seen.has(node.id)) {
      seen.add(node.id)
      node = this.nodes.get(node.replaced_by)
    }
    return node || null
  }

  label(id) { const n = this.resolve(id); return n ? n.label : id }
  fragment(id) { const n = this.resolve(id); return n ? n.prompt_fragment : null }

  /** Ancestors, nearest first. Used to give partial credit for a parent match. */
  ancestors(id) {
    const out = []
    let node = this.get(id)
    while (node && node.parent) { out.push(node.parent); node = this.get(node.parent) }
    return out
  }

  /** Do these two ids conflict? Symmetric by construction. */
  conflicts(a, b) {
    const na = this.resolve(a), nb = this.resolve(b)
    if (!na || !nb || na.id === nb.id) return false
    if ((na.conflicts_with || []).includes(nb.id)) return true
    // Same exclusivity group means "pick one" even without an explicit edge.
    return Boolean(na.exclusivity_group) && na.exclusivity_group === nb.exclusivity_group
  }

  /**
   * Surface-form lookup for the AI-free search path. Returns scored matches:
   * an exact label or alias hit outranks a prefix hit, which outranks a
   * substring hit. Aliases are what make this work without a model.
   */
  lookup(term, limit = 12) {
    const q = normalise(term)
    if (!q) return []
    const scores = new Map()
    const bump = (id, s) => scores.set(id, Math.max(scores.get(id) || 0, s))
    for (const [form, ids] of this.byAlias) {
      let s = 0
      if (form === q) s = 1
      else if (form.startsWith(q + ' ')) s = 0.75
      else if (form.includes(` ${q} `) || form.endsWith(` ${q}`)) s = 0.5
      else if (q.includes(` ${form} `) || q.startsWith(form + ' ') || q.endsWith(' ' + form)) s = 0.45
      if (!s) continue
      // A partial hit must account for a real share of the surface form, or
      // "street" would score against "street photography lens" as strongly as
      // against "street". Exact matches are exempt.
      if (s < 1) s *= Math.min(1, q.length / form.length)
      for (const id of ids) bump(id, s * (this.get(id).search_boost || 1))
    }
    return [...scores.entries()]
      .map(([id, score]) => ({ id, score, node: this.get(id) }))
      .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
      .slice(0, limit)
  }
}
