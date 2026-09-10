/**
 * The Unified Visual Explorer.
 *
 * One surface. Text, image, video and browse are input MODES, not screens, and
 * switching between them never clears the intent, the pins or the mix — that
 * invariant is the whole reason this is a single module with a single state
 * object rather than a router.
 */

import { loadConstants } from '../core/constants.js'
import { Taxonomy } from '../core/taxonomy.js'
import { Library, licenseBadge } from '../reference/library.js'
import { createIntent, addChip, removeChip, toggleLock, allChips, isEmpty } from '../core/intent.js'
import { createMix, setContribution, contributionOf, mixToChips, detectConflicts, effectiveContributions } from '../core/mix.js'
import { search, explain } from '../search/search.js'
import { toStructuredPrompt, formatPrompt, provenance } from '../prompt/compose.js'
import { renderCard } from './card-art.js'
import * as analyzer from '../ai/analyzer.js'

const $ = (id) => document.getElementById(id)
const el = (tag, props = {}, children = []) => {
  const node = Object.assign(document.createElement(tag), props)
  for (const child of [].concat(children)) node.append(child)
  return node
}

const MODES = [
  { id: 'text', label: 'Text' },
  { id: 'image', label: 'Image' },
  { id: 'video', label: 'Video' },
  { id: 'browse', label: 'Browse' },
]

const state = {
  mode: 'text',
  // Every mode keeps its own payload, so switching away and back restores what
  // was there. Nothing is discarded on a mode change.
  query: { text: '', image: null, video: null },
  intent: createIntent(),
  mix: createMix(),
  results: [],
  selected: null,
  anchor: null,
  keep: [],
  change: [],
  resolutions: {},
  note: '',
}

let taxonomy, library, constants

async function loadJson(path) {
  const res = await fetch(new URL(`../../${path}`, import.meta.url))
  if (!res.ok) throw new Error(`cannot load ${path}: ${res.status}`)
  return res.json()
}

// ---------------------------------------------------------------- rendering

function renderModes() {
  const nav = $('modes')
  nav.replaceChildren(...MODES.map((m) => {
    const b = el('button', { type: 'button', textContent: m.label, role: 'tab' })
    b.setAttribute('aria-selected', String(state.mode === m.id))
    b.onclick = () => { state.mode = m.id; render() }
    return b
  }))
}

function renderModePanel() {
  const host = $('mode-panel')
  host.replaceChildren()

  if (state.mode === 'text' || state.mode === 'browse') {
    const input = el('input', {
      type: 'search',
      placeholder: state.mode === 'browse' ? 'Filter the library…' : 'night street, low angle, flash…',
      value: state.query.text,
      'aria-label': 'Search',
    })
    input.oninput = debounce(() => { state.query.text = input.value; runSearch(); renderResults() }, 140)
    host.append(input)
    if (state.mode === 'text') {
      const btn = el('button', { className: 'ghost', type: 'button', textContent: 'Add these as chips' })
      btn.style.marginTop = '8px'
      btn.onclick = () => {
        for (const p of analyzer.analyzeText(state.query.text, taxonomy)) {
          addChip(state.intent, { ...p, label: taxonomy.label(p.value) })
        }
        render()
      }
      host.append(btn)
    }
  } else {
    host.append(buildDropZone(state.mode))
  }

  if (state.note) host.append(el('p', { className: 'empty', textContent: state.note }))
}

function buildDropZone(kind) {
  const zone = el('div', { className: 'drop', tabIndex: 0, role: 'button' }, [
    el('strong', { textContent: kind === 'image' ? 'Drop an image' : 'Drop a video' }),
    el('span', { textContent: 'or click to choose — it stays in this browser' }),
  ])
  const picker = el('input', { type: 'file', accept: kind === 'image' ? 'image/*' : 'video/*', hidden: true })
  picker.onchange = () => picker.files[0] && ingest(picker.files[0], kind)
  zone.onclick = () => picker.click()
  zone.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); picker.click() } }
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add('over') }
  zone.ondragleave = () => zone.classList.remove('over')
  zone.ondrop = (e) => {
    e.preventDefault(); zone.classList.remove('over')
    const file = e.dataTransfer.files[0]
    if (file) ingest(file, kind)
  }

  const wrap = el('div', {}, [zone, picker])
  const current = state.query[kind]
  if (current) {
    const media = kind === 'image'
      ? el('img', { src: current.url, alt: 'Uploaded reference' })
      : el('video', { src: current.url, controls: true, muted: true })
    wrap.append(el('div', { className: 'preview' }, [media]))
  }
  return wrap
}

async function ingest(file, kind) {
  const url = URL.createObjectURL(file)
  state.query[kind] = { url, name: file.name }
  state.note = 'Analysing…'
  render()
  try {
    const result = kind === 'image'
      ? await analyzer.analyzeImage(await toDataUrl(file), taxonomy)
      : await analyzer.analyzeVideo(file, taxonomy)
    for (const p of result.proposals || []) {
      addChip(state.intent, { ...p, label: taxonomy.label(p.value) })
    }
    state.note = result.note || `${(result.proposals || []).length} attribute(s) proposed — edit or remove any that are wrong.`
  } catch (err) {
    state.note = `Analyzer failed: ${err.message}`
  }
  render()
}

const toDataUrl = (file) => new Promise((resolve, reject) => {
  const fr = new FileReader()
  fr.onload = () => resolve(fr.result)
  fr.onerror = () => reject(fr.error)
  fr.readAsDataURL(file)
})

function renderIntent() {
  const host = $('intent')
  const chips = allChips(state.intent)
  if (!chips.length) {
    host.replaceChildren(el('p', { className: 'empty', textContent: 'No chips yet. Search, drop an image, or take attributes from a card.' }))
    return
  }
  host.replaceChildren(...chips.map((chip) => {
    const node = el('span', { className: 'chip' })
    node.dataset.locked = String(chip.locked)
    node.append(
      el('span', { className: 'cat', textContent: chip.category.replace(/_/g, ' ') }),
      el('span', { textContent: chip.label || taxonomy.label(chip.value) }),
    )
    if (chip.confidence < 0.6) node.append(el('span', { className: 'low', textContent: `${Math.round(chip.confidence * 100)}%`, title: 'Low confidence — check this one' }))
    const lock = el('button', { type: 'button', textContent: chip.locked ? '🔒' : '🔓', title: chip.locked ? 'Unlock' : 'Lock so search and mixes keep it' })
    lock.onclick = () => { toggleLock(state.intent, chip.id); render() }
    const drop = el('button', { type: 'button', textContent: '×', title: 'Remove' })
    drop.onclick = () => { removeChip(state.intent, chip.id); render() }
    node.append(lock, drop)
    return node
  }))
}

function renderDifference() {
  const host = $('difference')
  host.replaceChildren()
  if (!state.anchor) return
  const ref = library.get(state.anchor)
  if (!ref) return
  host.append(el('h2', { className: 'pane-title', textContent: 'Search by difference' }))
  host.append(el('p', { className: 'empty', textContent: `Anchored to “${ref.title}”. Keep what should stay the same, change what should differ.` }))
  for (const axis of ['keep', 'change']) {
    const row = el('div', { className: 'row' }, [el('strong', { textContent: axis })])
    const actions = el('div', { className: 'actions' })
    for (const group of constants.EXTRACT_GROUPS) {
      const on = state[axis].includes(group)
      const b = el('button', { type: 'button', textContent: group })
      b.setAttribute('aria-pressed', String(on))
      b.onclick = () => {
        state[axis] = on ? state[axis].filter((g) => g !== group) : [...state[axis], group]
        // A category cannot be both kept and changed; the other axis yields.
        const other = axis === 'keep' ? 'change' : 'keep'
        state[other] = state[other].filter((g) => g !== group)
        runSearch(); render()
      }
      actions.append(b)
    }
    row.append(actions)
    host.append(row)
  }
  const clear = el('button', { className: 'ghost', type: 'button', textContent: 'Clear anchor' })
  clear.onclick = () => { state.anchor = null; state.keep = []; state.change = []; runSearch(); render() }
  host.append(clear)
}

function renderResults() {
  const grid = $('grid')
  $('results-meta').textContent = `${state.results.length} of ${library.approved().length}`
  if (!state.results.length) {
    grid.replaceChildren(el('p', { className: 'empty', textContent: 'Nothing matched. Try fewer chips, or clear the KEEP filters.' }))
    return
  }
  grid.replaceChildren(...state.results.map((result) => {
    const ref = result.reference
    const card = el('button', { className: 'card', type: 'button' })
    card.dataset.type = ref.type
    card.setAttribute('aria-pressed', String(state.selected === ref.id))
    const art = el('div', { className: 'art' })
    // One aspect for every card: a ragged grid makes titles impossible to scan,
    // and the duration badge already says which references are video.
    art.innerHTML = renderCard(ref, { width: 300, height: 400 })
    const why = explain(result, taxonomy)
    card.append(art, el('div', { className: 'body' }, [
      el('div', { className: 'title', textContent: ref.title }),
      el('div', { className: 'why', textContent: why || 'in the library' }),
      el('div', { className: 'foot' }, [
        ...(result.score > 0 ? [el('span', { className: 'score', textContent: `${Math.round(result.score * 100)}%` })] : []),
        el('span', { className: `badge${ref.type === 'video' ? ' video' : ''}`, textContent: ref.type === 'video' ? `${ref.media.duration_s}s video` : 'image' }),
        el('span', { className: 'badge', textContent: licenseBadge(ref) }),
        el('span', { textContent: ref.metadata.source }),
      ]),
    ]))
    card.onclick = () => { state.selected = state.selected === ref.id ? null : ref.id; render() }
    return card
  }))
}

function renderDetail() {
  const host = $('detail')
  const ref = state.selected && library.get(state.selected)
  if (!ref) { host.hidden = true; host.replaceChildren(); return }
  host.hidden = false

  const used = contributionOf(state.mix, ref.id)
  const counts = {}
  for (const group of constants.EXTRACT_GROUPS) {
    counts[group] = (constants.EXTRACT_GROUP_MAP[group] || [])
      .reduce((n, c) => n + (ref.visual_attributes[c] || []).length, 0)
  }

  const extract = el('div', { className: 'actions' })
  for (const group of constants.EXTRACT_GROUPS) {
    if (!counts[group]) continue
    const on = used.includes(group)
    const b = el('button', { type: 'button' })
    b.append(document.createTextNode(group), el('span', { className: 'n', textContent: counts[group] }))
    b.setAttribute('aria-pressed', String(on))
    b.onclick = () => {
      setContribution(state.mix, ref.id, on ? used.filter((g) => g !== group) : [...used, group])
      render()
    }
    extract.append(b)
  }

  const useAll = el('button', { type: 'button', textContent: 'Use everything' })
  useAll.setAttribute('aria-pressed', String(used.includes('*')))
  useAll.onclick = () => {
    setContribution(state.mix, ref.id, used.includes('*') ? [] : ['*'])
    render()
  }

  const explore = el('div', { className: 'actions' })
  const similar = el('button', { type: 'button', textContent: 'Find similar' })
  similar.onclick = () => {
    state.anchor = ref.id; state.keep = []; state.change = []
    for (const [category, ids] of Object.entries(ref.visual_attributes)) {
      for (const value of ids) addChip(state.intent, { value, category, source: 'reference', confidence: 0.8, refId: ref.id, label: taxonomy.label(value) })
    }
    runSearch(); render()
  }
  explore.append(similar)
  for (const group of ['camera', 'lighting', 'clothing', 'composition', 'pose', 'scene', 'motion']) {
    if (!counts[group]) continue
    const b = el('button', { type: 'button', textContent: `Same ${group}` })
    b.onclick = () => {
      state.anchor = ref.id
      state.keep = [group]
      state.change = state.change.filter((g) => g !== group)
      runSearch(); render()
    }
    explore.append(b)
  }
  const change = el('button', { type: 'button', textContent: 'Keep all but clothing' })
  change.onclick = () => {
    state.anchor = ref.id
    state.keep = ['composition', 'camera', 'lighting']
    state.change = ['clothing']
    runSearch(); render()
  }
  explore.append(change)

  const attrs = el('div', { className: 'chips' })
  for (const [category, ids] of Object.entries(ref.visual_attributes)) {
    for (const value of ids) {
      attrs.append(el('span', { className: 'chip' }, [
        el('span', { className: 'cat', textContent: category.replace(/_/g, ' ') }),
        el('span', { textContent: taxonomy.label(value) }),
      ]))
    }
  }

  host.replaceChildren(
    el('h3', { textContent: ref.title }),
    el('p', { className: 'sub', textContent: `${ref.description} · ${ref.metadata.license} · ${ref.metadata.attribution}` }),
    el('div', { className: 'action-group' }, [el('h4', { textContent: 'Use' }), el('div', { className: 'actions' }, [useAll])]),
    el('div', { className: 'action-group' }, [el('h4', { textContent: 'Extract only' }), extract]),
    el('div', { className: 'action-group' }, [el('h4', { textContent: 'Explore' }), explore]),
    el('div', { className: 'action-group' }, [el('h4', { textContent: 'Attributes' }), attrs]),
  )
}

function renderMix(conflicts) {
  const host = $('mix')
  if (!state.mix.references.length) {
    host.replaceChildren(el('p', { className: 'empty', textContent: 'Click a card, then take only the parts you want: composition from one, clothing from another.' }))
  } else {
    host.replaceChildren(...state.mix.references.map((entry) => {
      const ref = library.get(entry.reference_id)
      const drop = el('button', { className: 'drop-btn', type: 'button', textContent: 'Remove', title: 'Remove from mix' })
      drop.onclick = () => { setContribution(state.mix, entry.reference_id, []); render() }
      return el('div', { className: 'mix-entry' }, [
        el('div', { className: 'top' }, [el('span', { className: 'name', textContent: ref ? ref.title : entry.reference_id }), drop]),
        el('div', { className: 'groups', textContent: entry.use.includes('*') ? 'everything' : entry.use.join(' · ') }),
      ])
    }))
  }

  const host2 = $('conflicts')
  if (!conflicts.length) { host2.replaceChildren(); return }
  host2.replaceChildren(...conflicts.map((c) => {
    const box = el('div', { className: `conflict ${c.severity}` })
    box.append(el('h5', { textContent: `${c.severity === 'hard' ? 'Conflict' : 'Tension'} · ${c.category.replace(/_/g, ' ')}` }))
    box.append(el('div', {
      textContent: c.severity === 'hard'
        ? 'These cannot both be true. Pick the one that should win.'
        : 'These sit oddly together. Both are kept — switch the emphasis if you like.',
    }))
    const opts = el('div', { className: 'opts' })
    for (const value of c.values) {
      const from = c.contributors.find((x) => x.value === value)
      const ref = from && library.get(from.refId)
      const b = el('button', { className: 'pill', type: 'button', textContent: `${taxonomy.label(value)}${ref ? ` — ${ref.title.split(',')[0]}` : ''}` })
      b.setAttribute('aria-pressed', String(c.dominant === value))
      if (c.dominant === value) { b.style.borderColor = 'var(--accent)'; b.style.color = 'var(--accent)' }
      b.onclick = () => { state.resolutions[c.id] = value; render() }
      opts.append(b)
    }
    box.append(opts)
    if (c.severity === 'hard') {
      box.append(el('div', { className: 'note', textContent: `Using “${taxonomy.label(c.dominant)}”. Nothing was deleted — the other value stays in the mix.` }))
    }
    return box
  }))
}

function renderComposer(contributions, conflicts) {
  const effective = effectiveContributions(contributions, conflicts)
  // Chips the user placed by hand join the mix contributions, and win ties by
  // being appended last only where they add something new.
  const manual = allChips(state.intent)
    .filter((chip) => !chip.ref_id || chip.locked)
    .map((chip) => ({ value: chip.value, category: chip.category, refId: null, negate: chip.negate }))

  const structured = toStructuredPrompt([...effective, ...manual], taxonomy, constants)
  const text = formatPrompt(structured)
  $('prompt').textContent = text
  $('structured').textContent = JSON.stringify(
    Object.fromEntries(Object.entries(structured).filter(([, v]) => v.length).map(([k, v]) => [k, v.map((f) => f.text)])),
    null, 2)

  const rows = provenance(structured)
  $('provenance').replaceChildren(...rows.slice(0, 14).map((r) => {
    const ref = library.get(r.refId)
    return el('span', { textContent: `${r.slot}: ${ref ? ref.title.split(',')[0] : r.refId}` })
  }))
  return text
}

// ------------------------------------------------------------------ search

function runSearch() {
  const anchor = state.anchor ? library.get(state.anchor) : null
  state.results = search(library.approved(), {
    text: state.query.text,
    intent: state.intent,
    taxonomy,
    constants,
    anchor,
    keep: state.keep,
    change: state.change,
    limit: 24,
  })
  // With no query at all, browsing should still show the library.
  if (!state.results.length && !state.query.text && isEmpty(state.intent) && !anchor) {
    state.results = library.approved().map((reference) => ({
      reference, score: 0, breakdown: { keyword: 0, metadata: 0, difference: 0 }, matched: [], notes: [],
    }))
  }
}

function render() {
  const contributions = mixToChips(state.mix, library, constants)
  const conflicts = detectConflicts(contributions, taxonomy, constants, state.resolutions)
  renderModes()
  renderModePanel()
  renderIntent()
  renderDifference()
  renderResults()
  renderDetail()
  renderMix(conflicts)
  renderComposer(contributions, conflicts)
}

function debounce(fn, ms) {
  let t
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms) }
}

// -------------------------------------------------------------------- boot

async function boot() {
  ;[constants, taxonomy, library] = await Promise.all([
    loadConstants(loadJson), Taxonomy.load(loadJson), Library.load(loadJson),
  ])

  const saved = readSettings()
  if (saved) analyzer.configure(saved)
  $('settings-btn').textContent = `Analyzer: ${analyzer.describe()}`

  $('settings-btn').onclick = () => {
    const form = $('settings').querySelector('form')
    const current = readSettings() || {}
    form.endpoint.value = current.endpoint || ''
    form.model.value = current.model || ''
    form.apiKey.value = current.apiKey || ''
    form.enabled.checked = Boolean(current.enabled)
    $('settings').showModal()
  }
  $('settings').addEventListener('close', () => {
    if ($('settings').returnValue !== 'save') return
    const form = $('settings').querySelector('form')
    const next = {
      endpoint: form.endpoint.value.trim(), model: form.model.value.trim(),
      apiKey: form.apiKey.value, enabled: form.enabled.checked,
    }
    writeSettings(next)
    analyzer.configure(next)
    $('settings-btn').textContent = `Analyzer: ${analyzer.describe()}`
  })

  $('copy').onclick = async () => {
    const text = $('prompt').textContent
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      $('copy').textContent = 'Copied'
      setTimeout(() => { $('copy').textContent = 'Copy prompt' }, 1200)
    } catch {
      // Clipboard access is denied in some contexts; select the text instead so
      // the user can copy it manually rather than being told nothing happened.
      const range = document.createRange()
      range.selectNodeContents($('prompt'))
      const sel = getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
      $('copy').textContent = 'Press ⌘/Ctrl+C'
      setTimeout(() => { $('copy').textContent = 'Copy prompt' }, 2000)
    }
  }
  $('toggle-structured').onclick = () => {
    const pre = $('structured')
    pre.hidden = !pre.hidden
    $('toggle-structured').textContent = pre.hidden ? 'Show structured' : 'Hide structured'
  }

  runSearch()
  render()
}

const SETTINGS_KEY = 'uvrc.analyzer'
function readSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null') } catch { return null }
}
function writeSettings(value) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(value)) } catch { /* private mode */ }
}

boot().catch((err) => {
  document.body.prepend(el('p', {
    style: 'color:#f06a6a;padding:16px;font:14px system-ui',
    textContent: `Failed to start: ${err.message}. Serve the repository over http:// — ES modules do not load from file://.`,
  }))
  throw err
})
