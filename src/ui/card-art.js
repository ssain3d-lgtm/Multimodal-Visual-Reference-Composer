/**
 * Procedural card art.
 *
 * The seed library stores no image bytes, so each card is drawn from the very
 * attributes it advertises. That is not a workaround — it is the point. A user
 * who does not know what "low angle" means can see the horizon drop, and the
 * picture can never drift out of sync with the metadata, because it IS the
 * metadata.
 */

const PALETTES = {
  'time.night': ['#10131c', '#1d2437', '#38455f'],
  'time.blue_hour': ['#16233b', '#27406b', '#4d6fa4'],
  'time.golden_hour': ['#3a2418', '#8a4f24', '#e2a457'],
  'time.midday': ['#7ba7d0', '#a9c9e6', '#e8f1f8'],
  'time.dawn': ['#2b2440', '#6a4b6b', '#d2a0a0'],
  'color.teal_and_orange': ['#0f2b30', '#1d5b63', '#d98247'],
  'color.monochrome': ['#181818', '#4a4a4a', '#c9c9c9'],
  'color.pastel': ['#cfd9e8', '#e6d5e0', '#f6ece2'],
  'color.desaturated': ['#2a2c2b', '#5c605e', '#a8aca9'],
  'color.warm_tone': ['#33211a', '#7a4a2e', '#d69a63'],
  'color.cool_tone': ['#1a2430', '#365068', '#8fb2cc'],
  'color.neutral_tone': ['#242424', '#5a5a5a', '#bdbdbd'],
  'color.high_saturation': ['#1b1030', '#5c1e7a', '#e0407a'],
  default: ['#1e2129', '#3d434f', '#8b93a3'],
}

/** Horizon height, as a fraction from the top. A low angle puts it low. */
const HORIZON = {
  'camera_angle.worms_eye': 0.86, 'camera_angle.low_angle': 0.74, 'camera_angle.eye_level': 0.56,
  'camera_angle.high_angle': 0.34, 'camera_angle.birds_eye': 0.16, 'camera_angle.top_down': 0.08,
}

/** How much of the body is in frame: [topFraction, bottomFraction] of the figure. */
const CROP = {
  'framing.extreme_wide_shot': [0.0, 1.0, 0.30], 'framing.wide_shot': [0.0, 1.0, 0.45],
  'framing.full_body': [0.0, 1.0, 0.72], 'framing.knee_up': [0.0, 0.78, 1.05],
  'framing.thigh_up': [0.0, 0.68, 1.2], 'framing.waist_up': [0.0, 0.55, 1.45],
  'framing.medium_shot': [0.0, 0.58, 1.4], 'framing.chest_up': [0.0, 0.42, 1.9],
  'framing.medium_close_up': [0.0, 0.38, 2.1], 'framing.close_up': [0.0, 0.26, 3.0],
  'framing.extreme_close_up': [0.0, 0.15, 5.0],
}

/** Where the key light sits, as a fraction of the frame. */
const LIGHT = {
  'lighting.backlighting': [0.5, 0.35, 0.55], 'lighting.rim_lighting': [0.72, 0.3, 0.4],
  'lighting.front_lighting': [0.5, 0.2, 0.7], 'lighting.direct_flash': [0.5, 0.42, 0.85],
  'lighting.on_camera_flash': [0.5, 0.45, 0.8], 'lighting.side_lighting': [0.16, 0.34, 0.5],
  'lighting.natural_window_light': [0.2, 0.28, 0.6], 'lighting.studio_softbox': [0.35, 0.22, 0.65],
  'lighting.neon': [0.78, 0.24, 0.45], 'lighting.practical_lights': [0.24, 0.3, 0.4],
  'lighting.golden_hour_sun': [0.5, 0.62, 0.6], 'lighting.overcast_soft': [0.5, 0.1, 0.9],
  'lighting.hard_light': [0.68, 0.16, 0.5], 'lighting.soft_light': [0.4, 0.24, 0.75],
}

const MOTION_GLYPH = {
  'camera_motion.dolly_in': 'M 10 26 L 40 26 M 34 20 L 40 26 L 34 32',
  'camera_motion.dolly_out': 'M 40 26 L 10 26 M 16 20 L 10 26 L 16 32',
  'camera_motion.tracking': 'M 8 26 L 42 26 M 36 20 L 42 26 L 36 32 M 8 18 L 8 34',
  'camera_motion.orbit': 'M 25 12 A 14 14 0 1 1 24.9 12 M 36 14 L 39 12 L 39 17',
  'camera_motion.handheld': 'M 8 30 L 16 22 L 24 32 L 32 20 L 42 28',
  'camera_motion.pan_left': 'M 40 26 L 10 26 M 16 20 L 10 26 L 16 32',
  'camera_motion.pan_right': 'M 10 26 L 40 26 M 34 20 L 40 26 L 34 32',
  'camera_motion.tilt_up': 'M 25 40 L 25 12 M 19 18 L 25 12 L 31 18',
  'camera_motion.tilt_down': 'M 25 12 L 25 40 M 19 34 L 25 40 L 31 34',
  'camera_motion.static': 'M 12 26 L 38 26 M 25 13 L 25 39',
}

const pick = (attrs, category) => (attrs[category] || [])[0] || null
const has = (attrs, category, id) => (attrs[category] || []).includes(id)

function paletteFor(attrs) {
  for (const key of [...(attrs.color || []), ...(attrs.time || [])]) if (PALETTES[key]) return PALETTES[key]
  if (has(attrs, 'lighting', 'lighting.neon')) return PALETTES['color.high_saturation']
  return PALETTES.default
}

/** Returns an SVG string sized to the given box. Deterministic for a reference. */
export function renderCard(reference, { width = 300, height = 400 } = {}) {
  const attrs = reference.visual_attributes || {}
  const [deep, mid, light] = paletteFor(attrs)
  const uid = reference.id.replace(/[^a-z0-9]/gi, '')

  const angle = pick(attrs, 'camera_angle')
  const horizon = (HORIZON[angle] ?? 0.56) * height

  const framing = pick(attrs, 'framing')
  const [, bottom, scale] = CROP[framing] || [0, 1, 0.7]

  const lightingId = (attrs.lighting || []).find((l) => LIGHT[l]) || 'lighting.soft_light'
  const [lx, ly, lr] = LIGHT[lightingId]

  // Figure geometry. `scale` grows the body as the crop tightens, so a close-up
  // really does read as a close-up rather than a small person.
  const figureH = height * 0.78 * scale
  const cx = width * (has(attrs, 'composition', 'composition.rule_of_thirds') ? 0.38 : 0.5)
  const feet = horizon + figureH * 0.06
  const headR = figureH * 0.075
  const headY = feet - figureH + headR
  const visibleBottom = feet - figureH * (1 - bottom)

  const noSubject = !(attrs.subject || []).length ||
    has(attrs, 'subject', 'subject.landscape_only') || has(attrs, 'subject', 'subject.object_only')
  const crowd = has(attrs, 'subject', 'subject.crowd') || has(attrs, 'subject', 'subject.small_group') ||
    has(attrs, 'subject', 'subject.people_group')
  // Looking straight down, a standing figure makes no sense and the horizon is
  // near the top edge, so bodies are drawn as forms seen from above instead.
  const overhead = angle === 'camera_angle.top_down' || angle === 'camera_angle.birds_eye'

  let figure = ''
  let dy = 0
  if (noSubject) {
    figure = ''
  } else if (overhead) {
    const spots = [[0.22, 0.42], [0.44, 0.58], [0.68, 0.36], [0.34, 0.74], [0.78, 0.66], [0.56, 0.86]]
    figure = spots.map(([fx, fy], i) => {
      const r = height * (crowd ? 0.026 : 0.045) * (1 + (i % 3) * 0.14)
      return `<g opacity="${0.75 + (i % 3) * 0.08}"><ellipse cx="${width * fx}" cy="${height * fy}" rx="${r}" ry="${r * 1.5}"/></g>`
    }).join('')
  } else if (crowd) {
    figure = [0.24, 0.42, 0.58, 0.76].map((f, i) => {
      const fx = width * f
      const s = 0.55 + (i % 2) * 0.12
      const h = figureH * s
      const top = feet - h
      return `<g opacity="${0.55 + i * 0.1}"><circle cx="${fx}" cy="${top + headR * s}" r="${headR * s}"/>` +
        `<rect x="${fx - h * 0.055}" y="${top + headR * s * 1.9}" width="${h * 0.11}" height="${h * 0.78}" rx="${h * 0.03}"/></g>`
    }).join('')
    // keep the tallest figure inside the frame
    dy = Math.max(0, height * 0.06 - (feet - figureH * 0.67))
  } else {
    figure = `<circle cx="${cx}" cy="${headY}" r="${headR}"/>` +
      `<rect x="${cx - figureH * 0.085}" y="${headY + headR * 1.35}" width="${figureH * 0.17}" height="${figureH * 0.46}" rx="${figureH * 0.055}"/>` +
      `<rect x="${cx - figureH * 0.062}" y="${headY + headR * 1.35 + figureH * 0.44}" width="${figureH * 0.055}" height="${figureH * 0.42}" rx="${figureH * 0.02}"/>` +
      `<rect x="${cx + figureH * 0.008}" y="${headY + headR * 1.35 + figureH * 0.44}" width="${figureH * 0.055}" height="${figureH * 0.42}" rx="${figureH * 0.02}"/>`
    // A tight crop scales the body up until the head leaves the frame. Anchor by
    // the head instead, so a close-up reads as a close-up rather than a neck.
    const headTop = headY - headR
    if (headTop < height * 0.07) dy = height * 0.07 - headTop
  }

  const motion = (attrs.camera_motion || []).find((m) => MOTION_GLYPH[m])

  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeAttr(reference.title)}">
  <defs>
    <linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${mid}"/><stop offset="100%" stop-color="${light}"/>
    </linearGradient>
    <radialGradient id="key${uid}" cx="${lx}" cy="${ly}" r="${lr}">
      <stop offset="0%" stop-color="${light}" stop-opacity="0.95"/>
      <stop offset="60%" stop-color="${light}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${light}" stop-opacity="0"/>
    </radialGradient>
    <!-- clip on an outer group, transform on an inner one: clip-path resolves in the
         element's own transformed space, so combining them would move the crop with
         the figure and cancel out. -->
    <clipPath id="clip${uid}"><rect x="0" y="0" width="${width}" height="${Math.max(8, visibleBottom + dy)}"/></clipPath>
  </defs>
  <rect width="${width}" height="${height}" fill="${deep}"/>
  <rect width="${width}" height="${Math.max(0, horizon)}" fill="url(#sky${uid})"/>
  <rect y="${horizon}" width="${width}" height="${Math.max(0, height - horizon)}" fill="${deep}" opacity="0.92"/>
  <rect width="${width}" height="${height}" fill="url(#key${uid})"/>
  <g clip-path="url(#clip${uid})"><g fill="${deep}" opacity="0.88" transform="translate(0 ${dy.toFixed(1)})">${figure}</g></g>
  <line x1="0" y1="${horizon}" x2="${width}" y2="${horizon}" stroke="${light}" stroke-opacity="0.35" stroke-width="1"/>
  ${motion ? `<g transform="translate(${width - 62} ${height - 62})" fill="none" stroke="${light}" stroke-width="2.4"
      stroke-linecap="round" stroke-linejoin="round" opacity="0.9"><path d="${MOTION_GLYPH[motion]}"/></g>` : ''}
</svg>`
}

function escapeAttr(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
