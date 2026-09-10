/**
 * The reference library.
 *
 * v0.1 reads one local JSON file. A live provider (Openverse, Wikimedia) plugs
 * in behind the same `add()` call, which is why nothing here knows where a
 * reference came from beyond `metadata.source`.
 */

const ALLOWED = new Set(['CC0-1.0', 'PDM-1.0', 'CC-BY-4.0', 'CC-BY-3.0', 'CC-BY-2.0'])
const ALLOWED_OPTIONAL = new Set(['CC-BY-SA-4.0', 'CC-BY-SA-3.0'])

export class Library {
  constructor() { this.byId = new Map() }

  static async load(loadJson) {
    const lib = new Library()
    const doc = await loadJson('data/references.json')
    for (const ref of doc.references || []) lib.add(ref)
    return lib
  }

  add(reference) {
    this.byId.set(reference.id, reference)
    return reference
  }

  get(id) { return this.byId.get(id) || null }
  all() { return [...this.byId.values()] }
  approved() { return this.all().filter((r) => r.status === 'approved') }

  /**
   * License Guard, v0.1 scope: a reference whose licence is not on the allow
   * list, or that is missing attribution metadata, can never reach `approved`.
   */
  static classify(reference, { allowShareAlike = false } = {}) {
    const md = reference.metadata || {}
    if (!md.license || !md.source_url) return { status: 'license_review', reason: 'missing licence or source url' }
    if (ALLOWED.has(md.license)) return { status: 'approved', reason: 'permitted licence' }
    if (ALLOWED_OPTIONAL.has(md.license)) {
      return allowShareAlike
        ? { status: 'approved', reason: 'share-alike allowed by setting' }
        : { status: 'candidate', reason: 'share-alike is off by default' }
    }
    return { status: 'rejected', reason: `licence not permitted: ${md.license}` }
  }
}

/** Short badge text for a card. */
export function licenseBadge(reference) {
  const l = (reference.metadata && reference.metadata.license) || 'unknown'
  return l.replace(/-1\.0$|-4\.0$|-3\.0$|-2\.0$/, '').replace(/^CC0$/, 'CC0')
}
