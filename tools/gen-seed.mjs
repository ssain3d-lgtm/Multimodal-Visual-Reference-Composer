#!/usr/bin/env node
/**
 * Generates data/references.json — the v0.1 seed library.
 *
 * Two rules shape this file:
 *   1. No media bytes, ever. These references carry no image URL at all; the app
 *      draws each card procedurally from its own attributes. That makes the seed
 *      library work offline, keeps the repository free of binaries, and means a
 *      card literally cannot disagree with the attributes it advertises.
 *   2. Every attribute is written here as a human term and RESOLVED against the
 *      shipped taxonomy. An unresolvable term is a build failure, so the seed can
 *      never reference an id that does not exist.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Taxonomy } from '../src/core/taxonomy.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const loadJson = async (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const tax = await Taxonomy.load(loadJson)

const unresolved = []
/** Resolve a human term inside one category to a live taxonomy id. */
function id(category, term) {
  const hits = tax.lookup(term, 8).filter((h) => h.node.category === category && !h.node.deprecated)
  if (!hits.length) { unresolved.push(`${category}: "${term}"`); return null }
  return hits[0].id
}

const S = (scene) => scene

// Each scenario is a coherent shot: the attributes genuinely co-occur, so mixing
// two of them produces a meaningful contrast rather than noise.
const SCENARIOS = [
  { key: 'night-flash-street', title: 'Night street, direct flash', tags: ['street', 'night', 'flash', 'fashion'],
    a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['low angle'], camera_distance: ['near'],
      lens: ['35mm-like'], pose: ['standing'], clothing: ['streetwear', 'leather jacket', 'sneakers'],
      scene: ['urban street'], time: ['night'], lighting: ['direct flash'], composition: ['centered'],
      color: ['high saturation'], mood: ['energetic'], style: ['street fashion'] } },
  { key: 'golden-hour-portrait', title: 'Golden hour portrait, backlit', tags: ['portrait', 'golden hour', 'warm'],
    a: { subject: ['adult woman'], framing: ['waist up'], camera_angle: ['eye level'], camera_distance: ['near'],
      lens: ['85mm-like', 'shallow depth of field'], pose: ['looking at camera'], clothing: ['knit sweater'],
      scene: ['open field'], time: ['golden hour'], lighting: ['rim lighting', 'backlighting'],
      composition: ['rule of thirds'], color: ['warm tone'], mood: ['calm'], style: ['portrait'] } },
  { key: 'studio-editorial', title: 'Studio editorial, soft key', tags: ['studio', 'editorial', 'clean'],
    a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'], camera_distance: ['medium'],
      lens: ['50mm-like'], pose: ['contrapposto'], clothing: ['tailored blazer', 'trousers'],
      scene: ['studio'], lighting: ['studio softbox', 'soft light'], composition: ['centered'],
      color: ['muted'], mood: ['dramatic'], style: ['fashion editorial'] } },
  { key: 'airport-travel', title: 'Airport terminal, travel look', tags: ['airport', 'travel', 'walking'],
    a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'], camera_distance: ['far'],
      lens: ['35mm-like'], pose: ['mid stride'], action: ['walking'], clothing: ['trench coat', 'sneakers'],
      scene: ['airport terminal'], props: ['suitcase'], lighting: ['overcast'], composition: ['leading lines'],
      color: ['neutral'], mood: ['calm'], style: ['documentary'] } },
  { key: 'rain-neon-alley', title: 'Rainy alley, neon', tags: ['rain', 'neon', 'night', 'cinematic'],
    a: { subject: ['adult man'], framing: ['medium shot'], camera_angle: ['low angle'], camera_distance: ['near'],
      lens: ['35mm-like'], pose: ['standing'], clothing: ['hooded jacket'],
      scene: ['alley'], time: ['night'], weather: ['rain'], lighting: ['neon'],
      composition: ['framing within a frame'], color: ['teal and orange'], mood: ['moody'], style: ['cinematic'] } },
  { key: 'beach-resort', title: 'Beach at midday, resort wear', tags: ['beach', 'summer', 'bright'],
    a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'], camera_distance: ['far'],
      lens: ['28mm-like'], pose: ['walking pose'], clothing: ['linen', 'sandals', 'resort'],
      scene: ['beach'], time: ['midday'], weather: ['clear'], lighting: ['hard light'],
      composition: ['low horizon'], color: ['pastel'], mood: ['playful'], style: ['lookbook'] } },
  { key: 'techwear-rooftop', title: 'Rooftop, techwear, blue hour', tags: ['techwear', 'rooftop', 'blue hour'],
    a: { subject: ['adult man'], framing: ['full body'], camera_angle: ['worms eye'], camera_distance: ['near'],
      lens: ['24mm-like'], pose: ['arms crossed'], clothing: ['techwear', 'cargo pants'],
      scene: ['rooftop'], time: ['blue hour'], lighting: ['practical lights'],
      composition: ['negative space'], color: ['cool tone'], mood: ['tense'], style: ['cinematic'] } },
  { key: 'y2k-digicam', title: 'Y2K digicam party snapshot', tags: ['y2k', 'flash', 'snapshot'],
    a: { subject: ['small group'], framing: ['medium shot'], camera_angle: ['eye level'], camera_distance: ['near'],
      lens: ['28mm-like'], pose: ['looking at camera'], clothing: ['y2k'],
      scene: ['home interior'], time: ['night'], lighting: ['on-camera flash'],
      composition: ['tight crop'], color: ['high saturation'], mood: ['playful'], style: ['snapshot'] } },
  { key: 'office-formal', title: 'Office window light, formal', tags: ['office', 'formal', 'window'],
    a: { subject: ['adult man'], framing: ['waist up'], camera_angle: ['eye level'], camera_distance: ['near'],
      lens: ['50mm-like'], pose: ['standing'], clothing: ['suit', 'necktie'],
      scene: ['office'], lighting: ['natural window light', 'side lighting'],
      composition: ['rule of thirds'], color: ['muted'], mood: ['calm'], style: ['documentary'] } },
  { key: 'winter-street', title: 'Snowy street, winter layers', tags: ['winter', 'snow', 'layered'],
    a: { subject: ['adult woman'], framing: ['knee up'], camera_angle: ['eye level'], camera_distance: ['near'],
      lens: ['50mm-like'], pose: ['hands in pockets'], clothing: ['puffer jacket', 'scarf', 'boots'],
      scene: ['urban street'], weather: ['snow'], lighting: ['overcast'],
      composition: ['centered'], color: ['desaturated'], mood: ['melancholic'], style: ['documentary'] } },
  { key: 'gallery-minimal', title: 'Gallery interior, minimal', tags: ['gallery', 'minimal', 'clean'],
    a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'], camera_distance: ['far'],
      lens: ['35mm-like'], pose: ['standing'], clothing: ['minimal'],
      scene: ['gallery'], lighting: ['soft light'], composition: ['negative space', 'symmetry'],
      color: ['neutral'], mood: ['calm'], style: ['fine art photography'] } },
  { key: 'crosswalk-topdown', title: 'Crosswalk from above', tags: ['crosswalk', 'top down', 'graphic'],
    a: { subject: ['crowd'], framing: ['wide shot'], camera_angle: ['top down'], camera_distance: ['very far'],
      lens: ['telephoto-like'], scene: ['crosswalk'], time: ['midday'], lighting: ['hard light'],
      composition: ['symmetry', 'diagonal'], color: ['monochrome'], mood: ['energetic'], style: ['documentary'] } },
]

// Video references: same attribute model, plus what only a moving image can carry.
const VIDEO_SCENARIOS = [
  { key: 'studio-dance', title: 'Studio dance, slow dolly in', tags: ['dance', 'studio', 'dolly'],
    duration: 12, a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'],
      pose: ['standing'], action: ['dancing'], motion: ['rhythmic', 'hair movement'],
      camera_motion: ['dolly in', 'slow camera move'], clothing: ['minimal'],
      scene: ['studio'], lighting: ['front lighting', 'rim lighting'], style: ['fashion editorial'] } },
  { key: 'street-tracking', title: 'Street walk, tracking shot', tags: ['walking', 'tracking', 'street'],
    duration: 18, a: { subject: ['adult woman'], framing: ['full body'], camera_angle: ['eye level'],
      pose: ['mid stride'], action: ['walking'], motion: ['clothing movement'],
      camera_motion: ['tracking', 'moderate camera move'], clothing: ['trench coat'],
      scene: ['urban street'], time: ['golden hour'], lighting: ['backlighting'], style: ['cinematic'] } },
  { key: 'handheld-market', title: 'Market handheld, fast move', tags: ['handheld', 'market', 'documentary'],
    duration: 9, a: { subject: ['crowd'], framing: ['medium shot'], camera_angle: ['eye level'],
      action: ['walking'], motion: ['motion blur'], camera_motion: ['handheld', 'fast camera move'],
      scene: ['storefront'], time: ['midday'], lighting: ['hard light'], style: ['documentary'] } },
  { key: 'orbit-portrait', title: 'Portrait orbit, blue hour', tags: ['orbit', 'portrait', 'blue hour'],
    duration: 14, a: { subject: ['adult man'], framing: ['waist up'], camera_angle: ['eye level'],
      pose: ['looking at camera'], motion: ['fluid'], camera_motion: ['orbit', 'slow camera move'],
      clothing: ['leather jacket'], scene: ['rooftop'], time: ['blue hour'],
      lighting: ['practical lights', 'rim lighting'], style: ['cinematic'] } },
]

function build(scenario, type) {
  const visual_attributes = {}
  for (const [category, terms] of Object.entries(scenario.a)) {
    const ids = terms.map((t) => id(category, t)).filter(Boolean)
    if (ids.length) visual_attributes[category] = ids
  }
  const ref = {
    schema_version: '1.0',
    id: `${type === 'video' ? 'vid' : 'img'}_seed_${scenario.key.replace(/-/g, '_')}`,
    type,
    status: 'approved',
    title: scenario.title,
    description: scenario.description || `${scenario.title}. Seed reference drawn procedurally from its own attributes.`,
    tags: scenario.tags,
    visual_attributes,
    metadata: {
      source: 'local',
      source_id: scenario.key,
      creator: 'Unified Visual Reference Composer seed set',
      license: 'CC0-1.0',
      license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
      source_url: `data/references.json#${scenario.key}`,
      attribution: 'CC0 1.0 — no attribution required',
      license_policy_class: 'allow',
      requires_attribution: false,
      share_alike: false,
    },
    license_guard: { license_check: 'pass', source_validation: 'pass', attribution_metadata: 'pass' },
    media: { width: 1024, height: type === 'video' ? 576 : 1365, orientation: type === 'video' ? 'landscape' : 'portrait',
      ...(type === 'video' ? { duration_s: scenario.duration, fps: 24 } : {}) },
    x_ext: { render: 'procedural' },
  }
  return ref
}

const references = [
  ...SCENARIOS.map((s) => build(s, 'image')),
  ...VIDEO_SCENARIOS.map((s) => build(s, 'video')),
]

if (unresolved.length) {
  console.error(`${unresolved.length} seed term(s) do not resolve in the shipped taxonomy:`)
  for (const u of unresolved) console.error(`  x ${u}`)
  process.exit(1)
}

const out = {
  schema_version: '1.0',
  version: 1,
  note: 'Seed library for v0.1. No media bytes: each card is drawn from its own attributes. Regenerate with `node tools/gen-seed.mjs`.',
  references,
}
fs.writeFileSync(path.join(ROOT, 'data/references.json'), JSON.stringify(out, null, 2) + '\n')
console.log(`wrote data/references.json — ${references.length} references ` +
  `(${references.filter((r) => r.type === 'image').length} image, ${references.filter((r) => r.type === 'video').length} video)`)
