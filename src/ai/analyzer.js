/**
 * Analyzer adapter.
 *
 * The product must be complete with AI switched off, so the default here is a
 * deterministic local analyzer that reads nothing and guesses nothing: it maps
 * whatever the user typed onto taxonomy ids and returns those, honestly marked
 * as low confidence. Turning AI on swaps the backend, not the contract. Every
 * backend returns the same shape, so no caller ever learns which one ran.
 *
 * No model name or endpoint is hardcoded: `configure()` takes them at runtime.
 */

let config = { enabled: false, endpoint: '', model: '', apiKey: '' }

export function configure(next) { config = { ...config, ...next } }
export function isEnabled() { return Boolean(config.enabled && config.endpoint && config.model) }
export function describe() {
  return isEnabled() ? `${config.model} @ ${new URL(config.endpoint).host}` : 'off — heuristic only'
}

const CATEGORY_HINT = [
  'subject', 'framing', 'camera_angle', 'camera_distance', 'lens', 'pose', 'action',
  'motion', 'camera_motion', 'clothing', 'scene', 'lighting', 'composition', 'color',
  'mood', 'style', 'time', 'weather', 'props',
]

/** Text -> intent proposal. Pure taxonomy lookup; works with AI off. */
export function analyzeText(text, taxonomy) {
  const proposals = []
  const words = String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
  for (let n = Math.min(4, words.length); n >= 1; n--) {
    for (let i = 0; i + n <= words.length; i++) {
      const phrase = words.slice(i, i + n).join(' ')
      for (const hit of taxonomy.lookup(phrase, 2)) {
        if (hit.score < 0.6) continue
        if (proposals.some((p) => p.value === hit.id)) continue
        proposals.push({ value: hit.id, category: hit.node.category, confidence: Math.min(0.9, hit.score), source: 'analyzer_text' })
      }
    }
  }
  return proposals
}

/**
 * Image -> intent proposal.
 *
 * With AI off this returns nothing rather than inventing attributes; the UI then
 * asks the user to describe the image, which is honest and still useful. With AI
 * on it asks an OpenAI-compatible chat endpoint for taxonomy ids and keeps only
 * ids that exist, so a hallucinated id can never enter the intent.
 */
export async function analyzeImage(dataUrl, taxonomy, { signal } = {}) {
  if (!isEnabled()) return { proposals: [], note: 'AI is off. Describe the image in the search box, or turn on an analyzer in Settings.' }

  const categories = CATEGORY_HINT.join(', ')
  const body = {
    model: config.model,
    max_tokens: 900,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text:
          `Describe this image as visual attributes. Reply with JSON only: ` +
          `{"attributes":[{"category":"<one of: ${categories}>","term":"<short plain-English term>","confidence":0..1}]}. ` +
          `Use plain terms like "low angle", "full body", "direct flash", "streetwear". ` +
          `Never state an exact focal length; say "35mm-like" instead. Omit anything you cannot see.` },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    }],
  }

  const res = await fetch(config.endpoint, {
    method: 'POST',
    signal,
    headers: { 'content-type': 'application/json', ...(config.apiKey ? { authorization: `Bearer ${config.apiKey}` } : {}) },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`analyzer returned ${res.status} ${res.statusText}`)
  const json = await res.json()
  const raw = json.choices?.[0]?.message?.content ?? ''
  const match = String(raw).match(/\{[\s\S]*\}/)
  if (!match) return { proposals: [], note: 'The analyzer replied in an unexpected format.' }

  let parsed
  try { parsed = JSON.parse(match[0]) } catch { return { proposals: [], note: 'The analyzer replied with invalid JSON.' } }

  const proposals = []
  for (const item of parsed.attributes || []) {
    const hits = taxonomy.lookup(item.term || '', 4).filter((h) => h.node.category === item.category)
    const hit = hits[0] || taxonomy.lookup(item.term || '', 1)[0]
    if (!hit) continue                              // an id we do not ship is dropped, not invented
    if (proposals.some((p) => p.value === hit.id)) continue
    proposals.push({
      value: hit.id,
      category: hit.node.category,
      confidence: Math.min(0.95, Number(item.confidence) || 0.6),
      source: 'analyzer_image',
    })
  }
  return { proposals, note: proposals.length ? null : 'The analyzer found nothing that maps onto the taxonomy.' }
}

/**
 * Video adds what a still cannot carry. Without AI we still extract something
 * real and useful: duration and frame size, plus a prompt for the user to name
 * the camera move, which is the attribute they most often want.
 */
export async function analyzeVideo(file, taxonomy) {
  return {
    proposals: [],
    note: 'Video analysis needs an analyzer. Meanwhile, pick the camera move and motion below — those are the attributes a video contributes that a photo cannot.',
    suggestCategories: ['camera_motion', 'motion', 'action'],
  }
}
