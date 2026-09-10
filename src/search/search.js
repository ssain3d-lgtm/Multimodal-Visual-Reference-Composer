/**
 * Search, AI-free.
 *
 * Two signals, fused. Neither needs a model:
 *   keyword  — the query text against taxonomy surface forms and reference text
 *   metadata — how much of the current VisualIntent a reference actually carries
 * Every result keeps its score breakdown, because the product promises to show
 * WHY something matched rather than asserting a number.
 */

const DEFAULT_WEIGHTS = { keyword: 0.4, metadata: 0.6 }

const normalise = (s) => String(s || '').toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()

/** Turn free text into taxonomy targets, so "airport fashion" becomes real categories. */
export function expandQuery(text, taxonomy) {
  const targets = []
  const seen = new Set()
  const push = (id, weight, why) => {
    if (seen.has(id)) return
    seen.add(id)
    const node = taxonomy.resolve(id)
    if (node) targets.push({ value: node.id, category: node.category, weight, why })
  }

  const words = normalise(text).split(' ').filter(Boolean)
  // Longest phrases first: "golden hour" should beat "golden" + "hour".
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(' ')
      for (const hit of taxonomy.lookup(phrase, 3)) {
        if (hit.score < 0.5) continue
        push(hit.id, 0.6 * hit.score * (n > 1 ? 1.2 : 1), `matched "${phrase}"`)
      }
    }
  }
  // One hop along `related`, discounted, so a query nudges without steering.
  for (const t of [...targets]) {
    const node = taxonomy.resolve(t.value)
    for (const rel of (node.related || []).slice(0, 3)) push(rel, t.weight * 0.35, `related to ${node.label}`)
  }
  return targets
}

/** Targets the intent itself asserts. A chip the user placed carries full weight. */
export function intentTargets(intent, taxonomy) {
  const out = []
  for (const [category, chips] of Object.entries(intent)) {
    if (!Array.isArray(chips)) continue
    for (const chip of chips) {
      if (chip.negate) continue
      const node = taxonomy.resolve(chip.value)
      if (!node) continue
      out.push({
        value: node.id,
        category: node.category,
        weight: chip.locked || chip.source === 'user' ? 1 : chip.confidence,
        why: chip.locked ? 'locked chip' : 'intent chip',
      })
    }
  }
  return out
}

function keywordScore(reference, text, taxonomy) {
  const q = normalise(text)
  if (!q) return 0
  const haystack = normalise([
    reference.title, reference.description,
    ...(reference.tags || []),
    ...Object.values(reference.visual_attributes || {}).flat().map((id) => {
      const n = taxonomy.resolve(id)
      return n ? `${n.label} ${(n.aliases || []).join(' ')}` : id
    }),
  ].join(' '))
  const words = q.split(' ').filter(Boolean)
  if (!words.length) return 0
  let hit = 0
  for (const w of words) if (haystack.includes(w)) hit += 1
  return hit / words.length
}

/**
 * Weighted coverage of the target set, with partial credit for a parent match:
 * a reference tagged `clothing.hoodie` should still answer a query for
 * `clothing.tops`, just less strongly than an exact hit.
 */
function metadataScore(reference, targets, taxonomy) {
  if (!targets.length) return { score: 0, matched: [] }
  const owned = new Set(Object.values(reference.visual_attributes || {}).flat())
  let earned = 0, possible = 0
  const matched = []
  for (const t of targets) {
    possible += t.weight
    if (owned.has(t.value)) { earned += t.weight; matched.push({ ...t, credit: 1 }); continue }
    let credit = 0
    for (const id of owned) {
      if (taxonomy.ancestors(id).includes(t.value)) { credit = Math.max(credit, 0.5); continue }
      if (taxonomy.ancestors(t.value).includes(id)) credit = Math.max(credit, 0.35)
      const node = taxonomy.resolve(id)
      if (node && (node.related || []).includes(t.value)) credit = Math.max(credit, 0.25)
    }
    if (credit) { earned += t.weight * credit; matched.push({ ...t, credit }) }
  }
  return { score: possible ? earned / possible : 0, matched }
}

/**
 * KEEP / CHANGE. KEEP is a hard requirement pinned to the anchor's values;
 * CHANGE is a penalty for sameness plus a requirement that the category is
 * present at all — never a filter, or the result set collapses to near-nothing.
 */
function differenceAdjustment(reference, anchor, keep, change, constants) {
  if (!anchor || (!keep.length && !change.length)) return { ok: true, delta: 0, notes: [] }
  const notes = []
  const catsOf = (groups) => groups.flatMap((g) => constants.EXTRACT_GROUP_MAP[g] || [])
  const own = reference.visual_attributes || {}
  const anch = anchor.visual_attributes || {}

  for (const category of catsOf(keep)) {
    const want = anch[category] || []
    if (!want.length) continue
    const have = own[category] || []
    if (!want.every((v) => have.includes(v))) return { ok: false, delta: 0, notes: [`missing kept ${category}`] }
  }

  let delta = 0
  for (const category of catsOf(change)) {
    const was = anch[category] || []
    const now = own[category] || []
    if (!now.length) return { ok: false, delta: 0, notes: [`no ${category} to change`] }
    const overlap = now.filter((v) => was.includes(v)).length
    const penalty = was.length ? overlap / was.length : 0
    delta -= penalty * 0.5
    if (penalty === 0) notes.push(`different ${category}`)
  }
  return { ok: true, delta, notes }
}

export function search(references, {
  text = '', intent = null, taxonomy, constants,
  anchor = null, keep = [], change = [],
  weights = DEFAULT_WEIGHTS, limit = 24,
} = {}) {
  const targets = [
    ...(text ? expandQuery(text, taxonomy) : []),
    ...(intent ? intentTargets(intent, taxonomy) : []),
  ]

  const scored = []
  for (const reference of references) {
    if (anchor && reference.id === anchor.id) continue
    const diff = differenceAdjustment(reference, anchor, keep, change, constants)
    if (!diff.ok) continue

    const kw = text ? keywordScore(reference, text, taxonomy) : 0
    const meta = metadataScore(reference, targets, taxonomy)

    // Renormalise rather than zeroing: with no query text, a reference is judged
    // on metadata at full weight instead of being punished for a missing signal.
    const active = { keyword: text ? weights.keyword : 0, metadata: targets.length ? weights.metadata : 0 }
    const total = active.keyword + active.metadata
    const fused = total ? (kw * active.keyword + meta.score * active.metadata) / total : 0
    const score = Math.max(0, Math.min(1, fused + diff.delta))
    // With a query on screen, a 3%-relevant result is noise pretending to be an
    // answer. Without one, everything is shown, because that is browsing.
    if ((text || targets.length) && score < 0.03) continue

    scored.push({
      reference,
      score,
      breakdown: { keyword: kw, metadata: meta.score, difference: diff.delta, weights: active },
      matched: meta.matched,
      notes: diff.notes,
    })
  }

  scored.sort((a, b) => b.score - a.score || a.reference.id.localeCompare(b.reference.id))
  return scored.slice(0, limit)
}

/** One-line explanation of a result, for the card. */
export function explain(result, taxonomy) {
  const bits = []
  if (result.breakdown.keyword) bits.push(`text ${(result.breakdown.keyword * 100) | 0}%`)
  const top = result.matched.slice().sort((a, b) => b.weight * b.credit - a.weight * a.credit).slice(0, 3)
  for (const m of top) bits.push(`${taxonomy.label(m.value)}${m.credit < 1 ? ' (related)' : ''}`)
  for (const n of result.notes) bits.push(n)
  return bits.join(' · ')
}
