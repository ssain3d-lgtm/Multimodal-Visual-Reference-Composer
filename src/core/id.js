/**
 * Stable, deterministic ids.
 *
 * Deliberately NOT a cryptographic hash. These ids exist so that a conflict a
 * human resolved is still recognisable after the mix is recomputed; nothing
 * about that needs collision resistance against an adversary. FNV-1a is eight
 * lines, synchronous, and keeps the core free of `node:crypto` (wrong layer)
 * and WebCrypto (async).
 */

const OFFSET = 0x811c9dc5

/** 32-bit FNV-1a, rendered as 8 lowercase hex characters. */
export function stableHash(input) {
  let h = OFFSET
  const s = String(input)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  // A second pass over the length guards the common case of short, similar keys.
  h ^= s.length
  h = Math.imul(h, 0x01000193) >>> 0
  return h.toString(16).padStart(8, '0')
}

/**
 * Id of a conflict, derived only from what the conflict IS: the category, the
 * exclusivity group, and the competing values. Order-independent, so recomputing
 * a mix after an unrelated edit reproduces the same id and the stored resolution
 * survives.
 */
export function conflictId(category, group, values) {
  return 'cfl_' + stableHash(`${category}|${group ?? ''}|${[...values].sort().join(',')}`)
}

let counter = 0
/** Session-unique id with a type-hinting prefix (`img_`, `vid_`, `mix_`, `chip_`). */
export function mintId(prefix, seed) {
  counter += 1
  return `${prefix}_${stableHash(`${seed ?? ''}|${counter}`)}`
}
