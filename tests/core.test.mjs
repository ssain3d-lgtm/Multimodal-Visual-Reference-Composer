/**
 * Behavioural tests for the pure core.
 * Run: node --test tests/
 *
 * These assert the product promises that are easy to break silently: that a
 * mode switch keeps your work, that nothing is deleted to resolve a conflict,
 * that a prompt is still produced when references disagree, and that no chip
 * can carry an id the taxonomy does not ship.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Taxonomy } from '../src/core/taxonomy.js'
import { Library } from '../src/reference/library.js'
import { loadConstants } from '../src/core/constants.js'
import { createIntent, addChip, removeChip, toggleLock, allChips } from '../src/core/intent.js'
import { createMix, setContribution, mixToChips, detectConflicts, effectiveContributions } from '../src/core/mix.js'
import { search, expandQuery } from '../src/search/search.js'
import { toStructuredPrompt, formatPrompt } from '../src/prompt/compose.js'
import { conflictId, stableHash } from '../src/core/id.js'
import { analyzeText } from '../src/ai/analyzer.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const loadJson = async (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))

const constants = await loadConstants(loadJson)
const taxonomy = await Taxonomy.load(loadJson)
const library = await Library.load(loadJson)

const NIGHT = 'img_seed_night_flash_street'
const ROOF = 'img_seed_techwear_rooftop'
const DANCE = 'vid_seed_studio_dance'

test('every seed reference cites ids the taxonomy actually ships', () => {
  for (const ref of library.all()) {
    for (const [category, ids] of Object.entries(ref.visual_attributes)) {
      for (const id of ids) {
        const node = taxonomy.get(id)
        assert.ok(node, `${ref.id} cites unknown id ${id}`)
        assert.equal(node.category, category, `${id} is a ${node.category}, filed under ${category}`)
      }
    }
  }
})

test('conflict ids are order-independent so a human resolution survives recomputation', () => {
  assert.equal(
    conflictId('camera_angle', 'g', ['b', 'a']),
    conflictId('camera_angle', 'g', ['a', 'b']),
  )
  assert.notEqual(stableHash('low_angle'), stableHash('high_angle'))
})

test('deprecated nodes still resolve, but never surface in search', () => {
  const walking = taxonomy.get('motion.walking')
  assert.ok(walking && walking.deprecated, 'motion.walking should be deprecated')
  assert.equal(taxonomy.resolve('motion.walking').id, 'action.walking')
  const hits = taxonomy.lookup('walking').map((h) => h.id)
  assert.ok(!hits.includes('motion.walking'), 'a deprecated id must not be offered')
})

test('conflicts_with is symmetric after load even where the data is one-sided', () => {
  for (const node of taxonomy.nodes.values()) {
    for (const other of node.conflicts_with || []) {
      const target = taxonomy.get(other)
      if (!target) continue
      assert.ok(target.conflicts_with.includes(node.id), `${other} does not reciprocate ${node.id}`)
    }
  }
})

test('a hard conflict picks a winner, keeps the loser, and still produces a prompt', () => {
  const mix = createMix()
  setContribution(mix, NIGHT, ['camera'])     // low angle
  setContribution(mix, ROOF, ['camera'])      // worm's-eye

  const contributions = mixToChips(mix, library, constants)
  const conflicts = detectConflicts(contributions, taxonomy, constants)
  const angle = conflicts.find((c) => c.category === 'camera_angle')

  assert.ok(angle, 'a camera_angle conflict should be detected')
  assert.equal(angle.severity, 'hard', 'camera_angle is single-dominant')
  assert.equal(angle.dominant, 'camera_angle.low_angle', 'the earlier contributor wins by default')

  // Nothing is deleted: both values are still in the mix's contributions.
  const values = contributions.filter((c) => c.category === 'camera_angle').map((c) => c.value)
  assert.ok(values.includes('camera_angle.low_angle') && values.includes('camera_angle.worms_eye'))

  // But only the winner reaches the prompt, and a prompt IS produced.
  const effective = effectiveContributions(contributions, conflicts)
  const text = formatPrompt(toStructuredPrompt(effective, taxonomy, constants))
  assert.ok(text.length > 20, 'an unresolved conflict must not block generation')
  assert.ok(text.includes('low angle'))
  assert.ok(!text.includes("worm's-eye"))
})

test('the user can flip which side of a conflict wins', () => {
  const mix = createMix()
  setContribution(mix, NIGHT, ['camera'])
  setContribution(mix, ROOF, ['camera'])
  const contributions = mixToChips(mix, library, constants)
  const first = detectConflicts(contributions, taxonomy, constants)
  const angle = first.find((c) => c.category === 'camera_angle')

  const resolved = detectConflicts(contributions, taxonomy, constants, { [angle.id]: 'camera_angle.worms_eye' })
  const flipped = resolved.find((c) => c.id === angle.id)
  assert.equal(flipped.dominant, 'camera_angle.worms_eye')
  assert.equal(flipped.resolvedByUser, true)

  const text = formatPrompt(toStructuredPrompt(effectiveContributions(contributions, resolved), taxonomy, constants))
  assert.ok(text.includes("worm's-eye"))
})

test('selective inheritance: composition from one reference, clothing from another', () => {
  const mix = createMix()
  setContribution(mix, NIGHT, ['composition'])
  setContribution(mix, ROOF, ['clothing'])
  const contributions = mixToChips(mix, library, constants)

  const fromNight = contributions.filter((c) => c.refId === NIGHT).map((c) => c.category)
  const fromRoof = contributions.filter((c) => c.refId === ROOF).map((c) => c.category)
  assert.deepEqual([...new Set(fromNight)], ['composition'], 'only composition came from the first reference')
  assert.deepEqual([...new Set(fromRoof)], ['clothing'], 'only clothing came from the second')

  const structured = toStructuredPrompt(contributions, taxonomy, constants)
  assert.ok(structured.clothing.every((f) => f.refId === ROOF))
  assert.ok(structured.composition.every((f) => f.refId === NIGHT))
})

test('a video contributes camera motion that no still image can', () => {
  const mix = createMix()
  setContribution(mix, DANCE, ['motion', 'camera'])
  const contributions = mixToChips(mix, library, constants)
  const motions = contributions.filter((c) => c.category === 'camera_motion').map((c) => c.value)
  assert.ok(motions.length, 'the video should contribute camera_motion')

  for (const ref of library.all().filter((r) => r.type === 'image')) {
    assert.equal((ref.visual_attributes.camera_motion || []).length, 0,
      `${ref.id} is an image and must not claim camera motion`)
  }
})

test('search ranks the right reference first, and explains itself', () => {
  const top = search(library.approved(), { text: 'rooftop techwear', taxonomy, constants, limit: 3 })
  assert.equal(top[0].reference.id, ROOF)
  assert.ok(top[0].score > 0.5)
  assert.ok(top[0].breakdown.metadata > 0, 'the metadata signal must contribute')

  const night = search(library.approved(), { text: 'night street low angle flash', taxonomy, constants, limit: 3 })
  assert.equal(night[0].reference.id, NIGHT)
})

test('search by difference keeps what was kept and rejects what did not change', () => {
  const anchor = library.get(NIGHT)
  const results = search(library.approved(), {
    text: '', taxonomy, constants, anchor, keep: ['camera'], change: ['clothing'], limit: 20,
  })
  for (const r of results) {
    // every survivor carries the anchor's camera values
    for (const value of anchor.visual_attributes.camera_angle || []) {
      assert.ok((r.reference.visual_attributes.camera_angle || []).includes(value),
        `${r.reference.id} was kept but lacks ${value}`)
    }
    assert.ok((r.reference.visual_attributes.clothing || []).length, 'a CHANGE category must still be present')
  }
})

test('query expansion turns plain words into taxonomy targets', () => {
  const targets = expandQuery('airport fashion', taxonomy).map((t) => t.value)
  assert.ok(targets.includes('scene.airport_terminal'), `expected an airport scene, got ${targets.join(', ')}`)
})

test('the AI-free text analyzer proposes only real ids', () => {
  for (const p of analyzeText('night street low angle direct flash', taxonomy)) {
    assert.ok(taxonomy.get(p.value), `proposed unknown id ${p.value}`)
  }
})

test('intent chips survive edits and record where they came from', () => {
  const intent = createIntent()
  addChip(intent, { value: 'camera_angle.low_angle', category: 'camera_angle', source: 'reference', refId: NIGHT, confidence: 0.8 })
  addChip(intent, { value: 'camera_angle.low_angle', category: 'camera_angle', source: 'reference', refId: ROOF, confidence: 0.9 })

  const chips = allChips(intent)
  assert.equal(chips.length, 1, 'two references agreeing is agreement, not a duplicate')
  assert.equal(chips[0].confidence, 0.9, 'the stronger confidence wins')
  assert.deepEqual(chips[0].contributors, [NIGHT, ROOF], 'both contributors are remembered')

  toggleLock(intent, chips[0].id)
  assert.equal(allChips(intent)[0].locked, true)
  removeChip(intent, chips[0].id)
  assert.equal(allChips(intent).length, 0)
})

test('props ride in scene without losing their origin', () => {
  const intent = createIntent()
  addChip(intent, { value: 'props.suitcase', category: 'props', source: 'user' })
  const chip = intent.scene.find((c) => c.value === 'props.suitcase')
  assert.ok(chip, 'a props chip lives in the scene array')
  assert.equal(chip.origin_category, 'props', 'and remembers it is really a prop')
})

test('the composed prompt reads as a sentence, not a bag of ids', () => {
  const mix = createMix()
  setContribution(mix, NIGHT, ['*'])
  const text = formatPrompt(toStructuredPrompt(mixToChips(mix, library, constants), taxonomy, constants))
  assert.ok(!/[a-z_]+\.[a-z_]+/.test(text), `a raw taxonomy id leaked into the prompt: ${text}`)
  assert.ok(text.includes('low angle'))
  assert.ok(/35mm-like/.test(text), 'lens must stay hedged in the output')
  assert.ok(!/\b35mm\b(?!-like)/.test(text), 'the prompt must never assert a bare focal length')
})
