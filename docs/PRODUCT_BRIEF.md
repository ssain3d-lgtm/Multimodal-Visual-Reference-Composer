# Product Brief

The founding specification, in the repository so that anyone — human or agent —
can check a design decision against it without external context.

> **한국어 요약:** 이 프로젝트의 원본 요구사항입니다. 저장소 밖에 두면 나중에 이 레포만
> 보고 작업하는 사람이 원본을 확인할 수 없으므로 안으로 옮겼습니다. 문서 간 충돌 시
> 이 문서가 최우선입니다.

**Precedence.** This document wins over every other document here. Where a design
document appears to add a rule this brief does not contain, the design document is
elaborating, not overriding — and where it contradicts, this brief is right.

---

Search with words, images, videos, or references; extract only the visual elements you want,
mix them together, and turn the result into a structured generation prompt.

## What this is NOT
NOT a generic prompt builder. NOT an image-to-prompt tool. NOT a reverse image search.
NOT a prompt gallery. The product must never degrade into "pick a few options -> get a prompt".

## Core pipeline (the whole product)
TEXT / IMAGE / VIDEO / REFERENCE CARD
  -> UNIFIED VISUAL INTENT
  -> SIMILAR REFERENCE SEARCH
  -> REFERENCE DECOMPOSITION
  -> SELECTIVE ATTRIBUTE INHERITANCE
  -> MULTIPLE REFERENCE MIXING
  -> FINAL STRUCTURED PROMPT

## The 5 identity pillars (never lose these)
1. **Unified Modal** — Text / Image / Video / Browse all operate inside ONE modal.
   No separate image-search page. No separate video-search page. Only the input MODE changes.
   Modal state persists across mode switches; the modal never closes mid-exploration.
2. **Visual Intent** — every input (text, image, video, card) converts to the SAME structured schema.
3. **Reference Decomposition** — a reference is not a picture; it is a bag of typed visual attributes
   (composition, camera angle, framing, lens, pose, motion, clothing, lighting, scene, color, mood, style...).
4. **Selective Inheritance** — take composition from A, clothing from B, lighting from C, motion from video D.
5. **Reference Mixing** — combine partial attributes of several references into one new prompt.
   This is what separates the product from similar-image search.

## VisualIntent schema (canonical field list)
subject, appearance, framing, camera_angle, camera_distance, lens, pose, action, motion,
camera_motion, clothing, scene, lighting, composition, color, mood, style, time, weather, confidence
- All fields except `confidence` are arrays.
- `confidence` maps field -> 0..1 (or per-value confidence).
- VisualIntent is ALWAYS user-editable. AI output is a proposal, never a commitment.
- Lens must never be asserted as fact: render "35mm_like" / "35mm-like perspective", not "35mm".

## ReferenceMix schema
{ "references": [ { "reference_id": "img_A", "use": ["composition","camera_angle"] }, ... ] }
Conflicts (two references contributing different values in the same category) are DETECTED and SURFACED,
never auto-resolved and never silently dropped. UI asks which should be dominant.

## Reference object
{ id, type: image|video, visual_attributes: {...}, metadata: { source, creator, license, license_url,
  source_url, media_url, thumbnail_url, attribution }, status: candidate|approved|rejected|license_review }

## StructuredPrompt (intermediate, before text)
subject, appearance, clothing, action, framing, camera, lens, scene, lighting, composition, style, motion, constraints
-> then formatPrompt(structuredPrompt, mode) produces final text. Mode: generic (MVP), later flux/qwen-image/sd/gpt-image/minimax-h3/krea.

## Explore actions on a reference card
USE (everything) | EXTRACT (composition/camera/pose/clothing/lighting/scene/style/motion only)
EXPLORE (find similar, same composition, same lighting, same outfit, same pose, same camera, same scene,
similar video, similar image)

## Search by Difference (key differentiator)
User marks KEEP categories and CHANGE categories.
e.g. Keep composition+lighting+camera, Change clothing -> find same framing/lighting/camera, different outfit.

## Search architecture
Hybrid: semantic (multimodal embedding) + structured metadata match -> fusion ranking
(default ~60/40, configurable) -> optional reranker.
Retrieval and analysis are SEPARATE modules. Analyzer understands; retriever ranks.

## AI is optional
AI OFF must be a complete product: browse cards, manual selection, keyword search (tags/aliases/related),
metadata search, prompt composer.
AI ON adds: image analysis, video analysis, semantic search, query expansion, reranking.
Model names/backends must NEVER be hardcoded. Adapters: analyzer-adapter, embedding-adapter, reranker-adapter.
Candidate local models (evaluate, do not hardcode): Qwen3.5-9B class for analysis,
Qwen3-VL-Embedding ~2B for retrieval, 8B as "enhanced search mode".

## License policy
Sources priority: 1) Wikimedia Commons 2) Openverse.
Allowed by default: Public Domain, CC0, CC BY. Optional: CC BY-SA.
Excluded by default: CC BY-NC, CC BY-NC-SA, CC BY-ND, Unknown.
License Guard pipeline: LICENSE CHECK -> SOURCE VALIDATION -> ATTRIBUTION METADATA -> REFERENCE APPROVAL.
Unverified license can never reach `approved`.
Do NOT store media binaries in the repo — store URL, thumbnail URL, metadata, embedding, visual attributes only.

## Hard prohibitions
- No bulk storage of unknown-license images
- No Pinterest scraping, no Instagram media copying, no TikTok video DB
- No wholesale copying of prompt DBs or external repository code
- No AI-model-dependent architecture
- No coupling of UI with prompt engine
- No coupling of search with prompt composer

## Providers
src/providers/{openverse,wikimedia,local}.js implementing: search(query, filters), getMetadata(id), getPreview(id)

## Privacy
Local-first. User images/videos processed locally by default. Any external API transmission must be
explicitly disclosed in the UI.

## Milestones
v0.1 Unified modal (Text + Browse modes; Image/Video upload UI with MOCK analysis), visual cards,
     keyword search over tags/aliases/related, reference mix, prompt composer, license badges. NO AI required.
v0.2 Openverse + Wikimedia live search, license filtering, real image analysis, visual intent extraction
v0.3 Multimodal embedding, similar-image search, image-to-reference search, hybrid ranking
v0.4 Video analysis, similar-video search, camera motion extraction, motion reference mixing
v0.5 Search by Difference
later ComfyUI node (only after the web MVP proves the concepts); shared modules: taxonomy, prompt engine,
     reference metadata, visual intent, reference mix, model formatter. Node outputs:
     prompt, structured_prompt, visual_intent, reference_mix.

## Future
Visual Recipe: save the entire reference-combination (not just a prompt preset):
{ name, references: [...], intent: {...}, prompt_mode }
Later exports beyond prompt: storyboard description, shot list, image prompt, video prompt.

## Target repo layout
app/index.html
src/core/{visual-intent,reference-mix,taxonomy}.js
src/search/{query-builder,metadata-search,semantic-search,fusion-ranker}.js
src/prompt/{prompt-engine,formatter-generic}.js
src/reference/{reference-manager,license-guard}.js
src/providers/{openverse,wikimedia,local}.js
src/ai/{analyzer,embedding,reranker}.js
src/ui/{explorer-modal,reference-card,reference-detail,reference-mixer,intent-chips}.js
data/taxonomy/{framing,camera,lens,pose,motion,clothing,scene,lighting,style}.json
data/{presets,references}.json
docs/{PRODUCT_VISION,COMPETITIVE_ANALYSIS,ARCHITECTURE,DATA_SCHEMA,SEARCH_ARCHITECTURE,LICENSE_POLICY,THIRD_PARTY_REVIEW,ROADMAP}.md
LICENSE, THIRD_PARTY_NOTICES.md, README.md

## Taxonomy categories (minimum)
Subject, Appearance, Framing, Camera Angle, Camera Distance, Lens, Pose, Action, Motion, Camera Motion,
Clothing, Scene, Lighting, Composition, Color, Mood, Style, Time, Weather, Props

Clothing subtree: Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories, Materials, Fit, Style
Clothing styles: Casual, Streetwear, Office, Formal, Sport, Techwear, Minimal, Vintage, Y2K, Preppy,
Korean Fashion, Editorial, Resort, Winter, Summer

Camera motion: Static, Pan Left, Pan Right, Tilt Up, Tilt Down, Dolly In, Dolly Out, Tracking, Orbit,
Handheld, Crane, Push In, Pull Out, Zoom In, Zoom Out

Motion: Standing, Walking, Running, Dancing, Turning, Sitting, Jumping, Falling, Gesture,
Hair Movement, Clothing Movement. Speed: Slow, Medium, Fast.

## The 9 questions every design doc set must answer (spec section 70)
1. Why is this different from an existing prompt builder?
2. Why must image search and prompt building live in ONE UI?
3. What are the minimum VisualIntent fields?
4. What data structure lets you take only SOME attributes from one reference?
5. How are conflicts between multiple references handled?
6. Does the product work with no AI at all?
7. Can the AI model be swapped later?
8. Is reference licensing separated from code licensing?
9. Can the web MVP be reused inside ComfyUI?

## UX north star
"User should never need to know where to search."
Success cases the tool must serve:
- "Same composition as this photo, but the outfit from that one."
- "Same movement as this video, but the camera work of that video."
- "I don't know what this lighting is called — let me pick it by looking at pictures."
- "I don't know what Low Angle means — let me choose it visually."
- "Find prompts similar to a photo I already have."
- "Describe my video's camera movement as a prompt."

---

## Amendments

Design decisions taken after the brief was written, recorded here so the brief and
the code do not silently diverge. Each states what changed and why.

### A-1 · Conflicts warn; they do not block generation

The brief (§21) requires that a conflict is surfaced and that nothing is deleted
automatically. An earlier design added a third rule of its own — that an unresolved
conflict blocks the affected prompt slot. In use that is obstructive, so conflicts
are now graded:

| Severity | When | Behaviour |
|---|---|---|
| **hard** | two mutually exclusive facts in a single-valued category (low angle vs worm's-eye) | a deterministic winner is chosen, shown, and can be flipped in one click; the loser stays in the mix |
| **soft** | values that merely sit oddly together (two tops, warm and cool grading) | both are emitted, with a warning |

Nothing is deleted, the conflict is always visible, and a prompt is always produced.

### A-2 · Optional image analysis lands in v0.1, not v0.2

The brief requires the product to be complete with AI switched off (§43, §47). It
does not require AI to be absent. A thin, optional adapter for an OpenAI-compatible
endpoint therefore ships in v0.1: with it off, nothing changes; with it on, dropping
an image proposes chips the user can edit. This puts the product's most distinctive
moment in the first version without weakening the AI-free guarantee.

### A-3 · Ids are stable, not cryptographic

The brief does not ask for cryptographic hashing. An earlier plan wrote SHA-1 and
SHA-256 by hand to keep the core synchronous and free of `node:crypto`. Conflict ids
only need to be stable and order-independent, so `src/core/id.js` uses FNV-1a in a
few lines instead.
