# Product Vision — Unified Visual Reference Composer

**Purpose:** the founding document. It defines what this product is, what it is deliberately not, the pipeline that constitutes the whole product, the five identity pillars that must never be lost, and the concrete symptoms that would mean the product has decayed.

> ### 한국어 요약
> 이 제품은 텍스트·이미지·영상·레퍼런스 카드를 **하나의 모달** 안에서 검색하고, 레퍼런스에서 **원하는 시각 요소만 골라 추출**하고, 여러 레퍼런스를 **섞어서** 최종 구조화 프롬프트를 만드는 도구입니다.
> 핵심은 "옵션을 몇 개 골라서 프롬프트를 얻는" 프롬프트 빌더가 **아니라는** 점입니다. 레퍼런스는 사진이 아니라 **타입이 지정된 시각 속성의 묶음**이며, 속성 단위로 상속·혼합되고, 충돌은 자동 해결되지 않고 **사용자에게 드러내어 물어봅니다**.
> AI는 선택 사항이고(AI를 꺼도 완결된 제품), 로컬 우선이며, 라이선스를 검증하고, 특정 모델에 종속되지 않습니다.
> 이 문서와 형제 문서들이 서로 어긋날 경우 `BRIEF.md` (the canonical product brief) → [정본 데이터 모델](./DATA_SCHEMA.md) → 본 문서 순으로 우선합니다.

---

## 1. The one-sentence definition

> **Search with words, images, videos, or references; extract only the visual elements you want, mix them together, and turn the result into a structured generation prompt.**

Four verbs, in order: **search → extract → mix → compose**. A tool that does only the first and the last is a search box with a text field attached. A tool that does only the last is a prompt builder. This product is defined by the two verbs in the middle — **extract** and **mix** — and every design decision in this repository exists to protect them.

---

## 2. The problem: six situations nothing currently serves

The product is not derived from a market gap in the abstract. It is derived from six sentences that a real person says out loud while trying to make an image or a video, and that no existing tool can accept as input. These six are the canonical acceptance set; they are quoted verbatim from the brief's UX north star.

| # | What the user says | What they actually need | Why today's tools fail |
|---|---|---|---|
| S1 | "Same composition as this photo, but the outfit from that one." | Two references, **partial** contribution from each, combined into one prompt. | Every tool takes one image and returns one description of *all* of it. There is no way to say "only the composition of A". |
| S2 | "Same movement as this video, but the camera work of that video." | Two videos, split along the **subject-motion / camera-motion** seam. | Image-to-prompt tools are still-frame tools. Video tools describe content, not the camera. The two axes are never separated. |
| S3 | "I don't know what this lighting is called — let me pick it by looking at pictures." | Retrieval **by appearance**, producing a **named** taxonomy value. | Keyword search demands the vocabulary as input. Reverse image search returns more pictures, never a name. |
| S4 | "I don't know what Low Angle means — let me choose it visually." | A browsable, **thumbnailed** controlled vocabulary. | Prompt builders present dropdowns of jargon; the user must already know the word to pick it. |
| S5 | "Find prompts similar to a photo I already have." | Image → structured intent → **retrieval over other references**, not a one-shot caption. | Interrogator tools output a paragraph and stop. The paragraph is not queryable, editable, or mixable. |
| S6 | "Describe my video's camera movement as a prompt." | Temporal evidence (`dolly in from 1.2 s to 3.4 s`) surviving into a prompt fragment. | Nothing in the still-image tool chain has a time axis at all. |

Three structural failures are visible across the whole table:

1. **All-or-nothing references.** Existing tools treat a reference as one indivisible blob: you get all of it or none of it. S1 and S2 require partial, per-attribute contribution.
2. **Vocabulary as a precondition.** Existing tools require the user to already know the word. S3 and S4 require the *picture* to be the query and the *word* to be the answer.
3. **Terminal output.** Existing tools end at a paragraph of text. S5 and S6 require the output to be a structure you can search with, edit, mix, save, and re-format.

The product's answer to all three is the same object: a **typed, per-attribute, provenance-carrying intent structure** that sits between input and prompt, and that is a first-class, user-editable document rather than an internal detail.

---

## 3. What we are not — the explicit contrast

Four adjacent product categories exist. Each implements exactly one arrow. The product implements the whole pipeline, and the difference is structural, not a matter of features.

| Category | The arrow it implements | Input | Output | Can it do S1 (composition of A + outfit of B)? |
|---|---|---|---|---|
| **Prompt Builder** | Option → Prompt | Dropdown / checkbox selections | Prompt text | **No.** It has no concept of a reference at all. |
| **Image-to-Prompt (interrogator)** | Image → Description | One image | One prose description | **No.** One image in, whole-image description out; no per-attribute selection, no second image. |
| **Reverse Image Search** | Image → Similar Image | One image | More images | **No.** Output is pixels, never a named attribute you can recombine. |
| **Prompt Gallery** | Image → Prompt (looked up) | Browsing / a sample image | Someone else's stored prompt | **No.** The prompt is an opaque string authored elsewhere; you cannot take one third of it. |
| **US — Unified Visual Reference Composer** | **Text / Image / Video / Reference → Visual Intent → Similar-Reference Search → Decomposition → Selective Inheritance → Mixing → Structured Prompt** | Any of four modes, several references at once | An editable structured intent, a reference mix with surfaced conflicts, and a formatter-agnostic structured prompt | **Yes.** It is the primary use case, not an edge case. |

The distinguishing test, applied to any candidate feature: **can it take one third of reference A and one half of reference B and tell you, per word of the output prompt, where that word came from?** If the answer is no, the feature belongs to one of the four categories above, not to this product.

A detailed category-by-category examination, including named products, lives in [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) and the primary-source notes under [`research/`](./research/). This document deliberately stays at the category level so that it never depends on a claim about a specific third-party product that may change.

---

## 4. The core pipeline

The pipeline **is** the product. Every module in [`ARCHITECTURE.md`](./ARCHITECTURE.md) exists to serve one stage of it, and no stage may be removed and still leave the product intact.

```
                     +===========================================+
                     |      ONE MODAL  --  FOUR INPUT MODES      |
                     |   TEXT     IMAGE     VIDEO     BROWSE     |
                     +===========================================+
                                      |
                       every mode produces the same object
                                      v
  (1) +-------------------------------------------------------------------+
      |  UNIFIED VISUAL INTENT                       VisualIntent          |
      |  20 keys: 19 category arrays of IntentChip + confidence            |
      |  every chip carries: value, source, ref_id, confidence, evidence   |
      |  ALWAYS user-editable. AI output is a proposal, never a commitment |
      +-------------------------------------------------------------------+
             |                                              ^
             |  intent -> query                             |  chips flow back in
             v                                              |
  (2) +---------------------------+                         |
      |  SIMILAR REFERENCE SEARCH |                         |
      |  hybrid: semantic 0.6     |                         |
      |        + metadata 0.4     |                         |
      |        -> fusion -> rerank|                         |
      |  AI OFF: keyword+metadata |                         |
      +---------------------------+                         |
             |  ResultSet (ranked reference ids)            |
             v                                              |
  (3) +-------------------------------------------------+   |
      |  REFERENCE DECOMPOSITION            Reference   |   |
      |  a reference is NOT a picture; it is a bag of   |   |
      |  typed visual attributes across 20 categories   |   |
      |  visual_attributes: { framing:[...], ... }      |   |
      +-------------------------------------------------+   |
             |  USE (everything) | EXTRACT (8 groups) | EXPLORE
             v                                              |
  (4) +-------------------------------------------------+   |
      |  SELECTIVE ATTRIBUTE INHERITANCE   MixEntry     |   |
      |  use:["composition","framing"]  exclude:[...]   |   |
      |  only:[...]  weight  priority  pinned  role     |   |
      +-------------------------------------------------+   |
             |                                              |
             v                                              |
  (5) +-------------------------------------------------+   |
      |  MULTIPLE REFERENCE MIXING       ReferenceMix   |---+
      |  applyMix(mix, refs, base_intent, taxonomy)     |
      |  CONFLICTS ARE DETECTED AND SURFACED            |
      |  never auto-resolved, never silently dropped    |
      +-------------------------------------------------+
             |
             v
  (6) +-------------------------------------------------+
      |  FINAL STRUCTURED PROMPT      StructuredPrompt  |
      |  13 slots of PromptFragment, each traceable to  |
      |  the chip, the category and the reference       |
      +-------------------------------------------------+
             |
             +--> formatPrompt(prompt, "generic")  -> text
             +--> formatPrompt(prompt, "flux" | "sd" | ...) -> text
             +--> exports: prompt | structured_prompt | visual_intent | reference_mix
             +--> save as VisualRecipe  (the combination, not the string)
```

Read the diagram twice, once forwards and once backwards:

- **Forwards** it is a funnel: many possible inputs, one intent, one prompt.
- **Backwards** it is a provenance chain: every word of the final text traces to a `PromptFragment`, which traces to an `IntentChip`, which traces to a `ref_id`, which traces to a `Reference` with a licence and an attribution string. **A product that cannot be read backwards is a prompt builder.**

Stage (5) feeds back into stage (1): a mix does not produce a prompt directly, it produces *chips in the intent*, which the user may then edit, lock, or delete. This loop is what makes exploration iterative rather than a one-shot transaction.

---

## 5. The five identity pillars

These five are non-negotiable. Each is stated, then made concrete with a worked example using real taxonomy ids from [`../data/taxonomy/`](../data/taxonomy/).

### Pillar 1 — Unified Modal

**Statement.** Text, Image, Video and Browse all operate inside **one** modal. There is no separate image-search page and no separate video-search page. Only the input *mode* changes. Modal state persists across mode switches, and the modal never closes mid-exploration.

**Structural expression.** `ExplorerState.query` holds **all four mode payloads simultaneously** — `{ text, image, video, browse, filters, expansion }` — rather than one polymorphic payload that is replaced on switch. Going text → image → text restores the typed text untouched, because it was never discarded.

**INV-EXP-1 (the central invariant):** switching `mode` NEVER resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `filters`. A mode switch changes which input surface is visible and nothing else. It MAY reset `results` (a new mode implies new retrieval) and `ui.active_panel`. Nothing else.

**Worked example.** The user types `golden hour alley`, gets results, pins one card, then drags in a photo from their desktop to search by image. The pinned card is still pinned, the licence filter is still set, the chips they had already accepted are still in the intent, and the words `golden hour alley` are still in the text box when they switch back. In a two-page design this session would be destroyed twice.

### Pillar 2 — Visual Intent

**Statement.** Every input — typed text, an uploaded image, an uploaded video, a browsed taxonomy tile, a reference card — converts to the **same** structured schema: `VisualIntent`. It is always user-editable. **AI output is a proposal, never a commitment.**

**Structural expression.** `VisualIntent` has exactly 20 keys, all required: 19 category arrays plus `confidence` (INV-INT-1). Array elements are `IntentChip` **objects**, not bare strings. This is the single most consequential decision in the data model, and it is forced:

| If chips were bare strings… | …this pillar dies |
|---|---|
| no `ref_id` | Selective Inheritance (Pillar 4) is unimplementable — "remove everything B gave me" has nothing to filter on |
| no per-chip `source` | the conflict UI cannot show two competing values *with their sources and thumbnails* |
| no per-chip `confidence` / `locked` / `alternatives` | "a proposal, never a commitment" is unenforceable — you cannot pin one chip and re-roll another |
| no `evidence.t_start_s` | S6 (video camera movement with a timespan) is impossible |

A string-typed intent collapses the product into exactly the "pick a few options → get a prompt" tool the brief forbids.

**Worked example.** One chip, produced by the video analyser:

```json
{ "value": "camera_motion.dolly_in", "label": "Dolly in",
  "source": "analyzer_video", "confidence": 0.82, "ref_id": "vid_b", "order": 0,
  "evidence": { "kind": "observed", "t_start_s": 1.2, "t_end_s": 3.4, "shot_index": 0 } }
```

The user can lock it (`locked: true` — no later mix may touch it), swap it for one of its `alternatives`, delete it, or negate it (`negate: true`, which routes it to the `constraints` slot). Each of those is a per-chip action. None is available on a string.

### Pillar 3 — Reference Decomposition

**Statement.** A reference is not a picture. It is a **bag of typed visual attributes** — composition, camera angle, camera distance, framing, lens, pose, action, motion, camera motion, clothing, scene, lighting, colour, mood, style, time, weather, props, subject, appearance.

**Structural expression.** `Reference.visual_attributes` is a map `visual_category → taxonomy_id[]` across all 20 categories, with analyser detail in the `attribute_meta` sidecar. The UI exposes decomposition as three actions on every card: **USE** (everything), **EXTRACT** (eight buttons), **EXPLORE** (find similar along one axis).

The eight EXTRACT groups, and the deliberate exclusions:

```
composition : [composition]
camera      : [camera_angle, camera_distance, framing, lens, camera_motion]
pose        : [pose]
clothing    : [clothing]
lighting    : [lighting, time]
scene       : [scene, weather, props]
style       : [style, mood, color]
motion      : [motion]

EXCLUDED from EXTRACT (deliberate): subject, appearance, action
```

`subject`, `appearance` and `action` are excluded because **EXTRACT takes *how it looks*, not *who is in it***. Extracting the person from a reference is the failure mode that turns a reference tool into a likeness-copying tool. Those three categories arrive only via explicit USE-everything (`use: ["*"]`) or by the user authoring the chip themselves.

**Worked example.** A single street photograph decomposes to:

```
composition : composition.rule_of_thirds, composition.leading_lines
camera      : camera_angle.low_angle, camera_distance.near,
              framing.medium_shot, lens.35mm_like
lighting    : lighting.golden_hour_sun  +  time.golden_hour
scene       : scene.alley, weather.wet_ground
clothing    : clothing.hoodie, clothing.cargo_pants, clothing.chunky_sneakers
style       : style.street_fashion, mood.intimate, color.muted
```

Six independent things to take, in any combination. To a reverse image search this is one image. To this product it is six.

### Pillar 4 — Selective Inheritance

**Statement.** Take composition from A, clothing from B, lighting from C, motion from video D.

**Structural expression.** `MixEntry` = `{ reference_id, use[], exclude[], only[], weight, priority, pinned, role }`. `use` names categories (or `"*"`); `only` is an allow-list applied first; `exclude` is a deny-list applied second, at taxonomy-id granularity. Group names never reach storage — the UI expands EXTRACT groups to categories before they are written.

**Worked example — S1, "the outfit from that one, but not the hat":**

```json
{ "schema_version": "1.0", "id": "mix_alley1",
  "references": [
    { "reference_id": "img_wikimedia_commons_9f2ab41c",
      "use": ["composition","framing","camera_angle"],
      "priority": 10, "pinned": true, "role": "composition anchor" },
    { "reference_id": "img_openverse_1a2b3c4d",
      "use": ["clothing"], "exclude": ["clothing.beanie"], "role": "outfit" } ],
  "dominance": { "framing": "img_wikimedia_commons_9f2ab41c" },
  "resolution_policy": { "auto_resolve": false, "on_unresolved": "block" } }
```

Note the granularity ladder: **category** (`use: ["clothing"]`) → **single node** (`exclude: ["clothing.beanie"]`). Both levels are required in practice; "take this outfit but not the hat" is an ordinary request, not an exotic one.

**Worked example — S2, the video case:**

```json
{ "references": [ { "reference_id": "vid_a", "use": ["motion"] },
                  { "reference_id": "vid_b", "use": ["camera_motion"] } ] }
```

Subject motion and camera motion are **separate categories on purpose**, precisely so that this request produces **no conflict at all**. The taxonomy split is what makes the headline use case trivially expressible.

### Pillar 5 — Reference Mixing

**Statement.** Combine partial attributes of several references into one new prompt. **This is what separates the product from similar-image search.** Similar-image search returns things that resemble one input. Mixing produces something that has never existed, assembled from named parts of several inputs.

**Structural expression.** `applyMix(mix, referencesById, base_intent, taxonomy) -> { intent, conflicts }`, pure and deterministic. Its non-negotiable clauses:

- Chips with `source: "user"` or `locked: true` are **immovable**. A mix may add alongside them and may raise a conflict against them; it may never remove or rewrite them.
- Duplicate values from two references are **AGREEMENT**, not conflict: deduplicate, keep max confidence, union `contributors[]`.
- Conflicts are **appended**, participants marked `contested: true`. **Nothing is deleted and nothing is auto-picked.**

**Conflict doctrine (non-negotiable).** `auto_resolve` defaults to `false`; `on_unresolved` defaults to `"block"`. Arity is a *conflict-detection rule, not a cardinality constraint* — no schema sets `maxItems` on a single-dominant category, because **a conflicting state must be representable in order to be surfaced** (INV-MIX-4). The three conflict kinds:

| kind | Trigger | Example |
|---|---|---|
| `arity` | ≥2 distinct non-modifier values in a `single_dominant` category from ≥2 references | `camera_angle.low_angle` vs `camera_angle.high_angle` |
| `exclusivity_group` | ≥2 values sharing a non-null group in a `multi` category | `lighting.high_key` vs `lighting.low_key` (group `key_level`) |
| `explicit` | the taxonomy declares `conflicts_with` between the ids | `camera_motion.static` vs every other camera move |

**Worked example.** Reference A contributes `camera_angle.low_angle` (0.9), reference B contributes `camera_angle.high_angle` (0.8). Both chips stay in the intent. A conflict record appears:

```json
{ "id": "cfl_ab12cd34ef56", "category": "camera_angle", "kind": "arity", "status": "open",
  "candidates": [ { "reference_id": "img_a", "value": "camera_angle.low_angle",  "confidence": 0.9 },
                  { "reference_id": "img_b", "value": "camera_angle.high_angle", "confidence": 0.8 } ] }
```

`formatPrompt` returns `blocked: [{ slot: "camera", category: "camera_angle", reason: "unresolved_conflict", conflict_id: "cfl_ab12cd34ef56" }]` and **emits no camera-angle text at all** until a human chooses. The UI renders this as an unresolved *decision* with two thumbnails side by side — never as an error, and never as a silent omission. The conflict id is deterministic, so the human's answer survives recomputation of the mix.

---

## 6. The end-to-end user story: one modal session

> **Provenance note.** The brief supplied to this repository (`BRIEF.md` (the canonical product brief)) numbers one section explicitly — "the 9 questions every design doc set must answer (spec section 70)". It contains no numbered section 73. The narrative below is the canonical end-to-end story for this repository, constructed from the brief's pipeline, its five pillars, its six success cases and its `v0.1`–`v0.5` milestones. Where it names a screen or a gesture, that is a **design commitment made here**, not a quotation. See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the module boundaries it implies.

Mira is making a key visual for a small streetwear brand. She has one photograph she loves the *look* of, another she loves the *outfit* in, and a short clip of a camera move she wants to imitate. She has never heard the phrase "low angle".

**T0 — Open.** She opens the composer. One modal. Four mode tabs across the top: `TEXT` `IMAGE` `VIDEO` `BROWSE`. `ExplorerState.mode = "text"`, `open = true`. The modal will not close again until she dismisses it explicitly.

**T1 — Text, with no vocabulary.** She types `golden hour alley`. No model runs. The keyword index over `{id, label, aliases[], description}` returns three direct hits, scored in full in [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §3.5: `lighting.golden_hour_sun` (0.665), `time.golden_hour` (0.643) and `scene.alley` (0.396). The two golden-hour nodes tie before `search_boost` and are separated only by it — the right outcome for a query genuinely ambiguous between a time of day and a quality of light, since both surface and she picks. Three chips land in the intent with `source: "user"`, `confidence: 1.0`. One hop through `related[]` proposes `lighting.backlit_haze` at reduced score as a `query_expansion` chip — greyed, low confidence, one click to remove. Results appear, ranked `keyword_only` because AI is off.

**T2 — Browse, because she doesn't know the word.** She still can't describe the *angle* she wants. She switches to `BROWSE`. **The T1 chips do not move; the results panel refreshes, nothing else** (INV-EXP-1). She opens the `camera_angle` category and sees thumbnailed tiles: Eye level, Low angle, Worm's-eye, High angle, Bird's-eye. She recognises the third picture. She clicks it. `camera_angle.low_angle` enters the intent as `source: "user"`. **This is S4 solved: she chose the word by looking at a picture, and she now owns the word.**

**T3 — Image, as a query.** She switches to `IMAGE` and drops in her look reference. `query.image.analysis_status` goes `pending`. (In `v0.1` it goes to `mocked` — the upload surface ships before real analysis, and the state machine says so honestly rather than faking a spinner.) With the analyser on, the still returns proposals: `composition.rule_of_thirds` 0.88, `composition.leading_lines` 0.74, `framing.medium_shot` 0.81, `lens.35mm_like` 0.55, `weather.wet_ground` 0.66. Every one is a **proposal**: greyed until accepted, each with an `alternatives` menu. She accepts three — `composition.rule_of_thirds`, `composition.leading_lines`, `framing.medium_shot` — rejects the lens guess, leaves the wet-ground proposal sitting in the tray undecided, and locks `composition.rule_of_thirds`. A proposal that is neither accepted nor rejected stays in the tray and never reaches the intent.

Note what did *not* happen: the analyser did not overwrite her `camera_angle.low_angle`, and did not touch her two text chips. Analysis adds; the user decides.

**T4 — Decompose a result.** The image query returns similar references. One card is close. She opens the detail panel and sees the reference decomposed into its eight EXTRACT groups with per-attribute confidence. She clicks **EXTRACT → composition** and **EXTRACT → lighting**, then opens the attributes tab and takes the anchor's `lens` on its own — the one optical claim in this session is a value she lifted from a reference by hand, not a guess she accepted. The UI expands the groups (`lighting` → `[lighting, time]`) and writes a `MixEntry`:

```json
{ "reference_id": "img_wikimedia_commons_9f2ab41c",
  "use": ["composition","lighting","time","lens"], "priority": 10, "pinned": true,
  "role": "look anchor" }
```

The reference is added to `pinned_reference_ids` at the same moment (INV-EXP-4): a reference that is contributing to the mix can never vanish from the UI.

**T5 — The second reference.** She switches back to `IMAGE`, drops her outfit photo, and this time uses **EXTRACT → clothing** only. She does not want the model, the location, or the framing — only the garments. The card contributes `clothing.hoodie`, `clothing.cargo_pants`, `clothing.chunky_sneakers`, `clothing.beanie`. She dislikes the beanie and clicks the × on that one chip; the UI writes `exclude: ["clothing.beanie"]` into that entry rather than deleting a chip that the mix would silently re-add on the next recompute. **This is S1 solved.**

**T6 — The conflict.** The outfit photo was shot from above, and she wants that angle weighed against her own, so she pulls `camera_angle` from it too — one category, not the whole `camera` group, so the entry's `use` becomes `["clothing","camera_angle"]`. A mix entry contributes only the categories its `use` names: without that second EXTRACT there would be nothing to disagree with. Now its `camera_angle.high_angle` collides with the `camera_angle.low_angle` she chose in T2. Because `camera_angle` is `single_dominant` and neither value is a modifier, `applyMix` raises an `arity` conflict. The mixer panel shows a two-up: her low-angle tile on the left, marked **from you** and pre-selected; the reference's high-angle thumbnail on the right. The prompt preview shows the `camera` slot greyed with the label *"1 decision pending"*. Nothing was dropped, nothing was picked for her. She clicks her own value. The conflict becomes `status: "resolved"` with `strategy: "user"`. `dominance` records a *reference* per category, and the winner here is her own chip, so nothing is written to it; what persists is the resolution itself, keyed by a `cfl_` id derived from the category and the sorted values, so the answer survives every recomputation and the question is not asked again on the next edit. Had she picked the outfit photo's angle instead, `dominance.camera_angle` would have recorded that reference.

**T7 — Video.** She switches to `VIDEO`, uploads her 6-second clip, and scrubs the filmstrip to the window `1.2 s → 3.4 s` — she wants *that* move, not the whole clip. The video analyser proposes `camera_motion.dolly_in` at 0.82 with `evidence.t_start_s: 1.2, t_end_s: 3.4`. She accepts it, then adds `camera_motion.pan_left` with `order: 1` for the second half: a compound move is two ordered chips, not one merged value. **This is S6 solved.** Had she uploaded a still, `camera_motion` would have been unavailable to the analyser entirely (INV-VID-1): a single frame cannot evidence camera movement, and the product does not assert what the medium cannot show.

**T8 — Search by Difference.** She likes the whole assembly but wants alternatives for the outfit. She marks **KEEP** = `composition, lighting, camera_angle, framing` and **CHANGE** = `clothing`. KEEP categories become hard structured filters pinned to the anchor's values; CHANGE becomes a negative filter against the anchor's clothing plus a diversity boost. She optionally sets a directed target — change clothing *to* `clothing.streetwear` — so the search moves toward something rather than merely away. She browses six alternatives and swaps one in. Her camera, composition and lighting decisions are untouched throughout.

**T9 — The prompt.** The composer panel shows 13 slots, each fragment tagged with its source thumbnail. `buildStructuredPrompt` routed 20 categories onto 13 slots; `formatPrompt(prompt, "generic")` emits, in the generic slot order:

```
a woman, hair worn loose, a hoodie, cargo trousers, chunky-soled sneakers,
walking, in a narrow alley, during golden hour, warm low golden-hour sunlight,
composed on the rule of thirds, with leading lines drawing the eye in, medium
shot, shot from a low angle looking up at the subject, camera dollies in toward
the subject, camera pans left across the scene, 35mm-like perspective,
street-style fashion photograph, intimate, a muted colour palette
```

Every fragment is hoverable and traceable to its chip, its category and its reference. Deleting one contribution of one reference is one click, and it deletes exactly that fragment. Note `35mm-like perspective` — never `35mm`. That fragment is the anchor's own attribute, taken by hand in T4; the analyser's 0.55 lens guess in T3 was rejected and left no trace. The product does not assert optics it cannot know (INV-LENS-1/2), and the hedge is enforced in the taxonomy, in the intent schema and in the fragment, in all three places.

**T10 — Save the combination.** She saves a `VisualRecipe`: the intent with per-chip provenance, the mix with its resolved conflicts, and a **frozen snapshot of every contributing reference** including creator, licence and attribution text (INV-RCP-1). She has not saved a prompt string; she has saved the *combination*. Re-opening it re-derives the prompt. If the taxonomy has moved on since, the recipe shows a "regenerated" notice rather than trusting its cached text; if a `media_url` has rotted, the thumbnail degrades to a placeholder and the **recipe still produces the identical prompt**, because intent, mix and taxonomy ids are pixel-free.

**T11 — Switch formatter.** She changes `prompt_mode` from `generic` to another mode. The same `StructuredPrompt` re-renders under a different formatter module. Nothing about the intent, the mix or the references changed — the formatter is a leaf, not a dependency. She also exports `visual_intent` and `reference_mix` as JSON to hand to a collaborator — two of the same four outputs (`prompt`, `structured_prompt`, `visual_intent`, `reference_mix`) the future ComfyUI node will emit.

**What made this session possible**, in one line each: the modal never closed (P1); every input became the same object (P2); every card was a bag of parts (P3); she took parts, not pictures (P4); the machine surfaced the one real disagreement and asked her (P5).

---

## 7. UX north star

> **"User should never need to know where to search."**

The user brings an *intent* — a look, a movement, a feeling, a picture on their phone. They should never have to first answer the meta-question *"which tool / which tab / which page handles this kind of question?"* before they can ask their actual question.

What the north star **requires**:

| Requirement | Mechanism |
|---|---|
| One entry point for all four input kinds | The Unified Modal; mode tabs, not pages |
| Never lose work when the input kind changes | `query` holds all four payloads; INV-EXP-1 |
| The picture may be the query and the *word* the answer | Browse tiles with thumbnails; `visual_hint` on every browse-reachable taxonomy node |
| The word may be the query and the *picture* the answer | Keyword + metadata search over `aliases`/`related`, AI or no AI |
| Never be dead-ended by vocabulary | `aliases[]` absorb colloquialisms and misspellings; unknown terms become `custom: true` chips, never errors |
| Always be able to go back | Navigation history with `back()`/`forward()` that restores mode, query and filters — and by default does **not** overwrite the live intent (INV-EXP-3): going back to an earlier search must never delete the outfit you already collected |

What the north star **forbids** — these are hard bans, not preferences:

1. **No separate image-search page. No separate video-search page.** Ever. A second page is the north star's exact negation.
2. **No modal that closes on mode switch, on search, on card open, or on error.** The modal closes when the user dismisses it and at no other time.
3. **No "advanced mode" toggle** that hides mixing or conflicts behind an expert flag. The mix panel is the product; it is not an advanced feature.
4. **No dead-end result.** Every card offers USE / EXTRACT / EXPLORE. A card you can only look at is a search engine's card, not ours.
5. **No error where a decision belongs.** Unresolved conflicts, blocked slots and deprecated nodes are rendered as *decisions with options*, never as red error states and never as silence.
6. **No vocabulary gate.** Any screen that can only be operated by someone who already knows the jargon has failed S3 and S4.
7. **No hidden mutation.** Nothing may quietly delete, overwrite or reorder a user-authored or locked chip — not analysis, not a mix, not history navigation, not a formatter switch.

---

## 8. Product principles

Five principles govern every module. They are architectural constraints with schema and code enforcement, not aspirations.

### 8.1 AI-optional

**AI OFF must be a complete product** (INV-AI-1). With `ai.enabled = false` the user still has: browse cards over the full taxonomy, manual chip selection, keyword search across `label`/`aliases`/`related`/`description`, structured metadata search over `Reference.visual_attributes`, reference decomposition, selective inheritance, mixing with full conflict detection, and the prompt composer. `results.ranking.mode` degrades to `metadata_only` / `keyword_only`. Query expansion stays available, because alias and related-hop expansion need no model at all.

AI ON **adds** capability; it is never load-bearing: image analysis, video analysis, semantic embedding search, learned reranking. The `v0.1` milestone ships with **no AI required**, and that is a proof obligation, not a phase.

### 8.2 Local-first

User images and videos are processed locally by default. `ai.external_transmission.allowed` defaults to `false`. Any transmission of user media to an external service must be **explicitly disclosed in the UI before it happens** and recorded in `disclosed_at`. A `Reference` with `privacy.local_only` MUST be refused by every remote adapter. A local upload handle (`upl_`) **never implies that bytes left the device**.

### 8.3 Licence-aware

Sources in priority order: Wikimedia Commons, then Openverse. Allowed by default: Public Domain / PDM / CC0 / CC BY / user-owned. Optional opt-in: CC BY-SA. Excluded by default: CC BY-NC, CC BY-NC-SA, CC BY-ND, CC BY-NC-ND, proprietary, unknown.

The License Guard pipeline is a gate, not a badge: `LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → REFERENCE APPROVAL`. **An unverified licence can never reach `approved`** (INV-LIC-3), and the default search filter is `status: ["approved"]`, so an unverified reference never reaches a normal result set at all.

**No media binaries, schema-enforced.** `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` are declared `false` in the reference schema — a document carrying any of them is invalid (INV-REF-2). We store URLs, thumbnails, metadata, embeddings and visual attributes. Consequently, media URL rot is expected and handled: identity is `(source, source_id)`, not a URL; `attribution` is stored **text** so credit survives a dead link; a recipe with 100% dead media still produces the identical prompt. Rot degrades the *card*, never the *recipe*.

**Reference licensing and code licensing are separate concerns and are never conflated.** `VisualRecipe.license_summary` describes the reference media only; it says nothing about the licence of this code or of the generated output. See [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) and [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md).

### 8.4 Model-agnostic

**No model name is ever hardcoded** (INV-AI-2). Three adapter seams: `analyzer-adapter`, `embedding-adapter`, `reranker-adapter`, resolved at runtime from opaque instance ids in `ai.adapters`. `Evidence.detector` records an adapter instance id (`analyzer-adapter:local@2`), never a model name. Embeddings are **model-keyed** (`"<family>_<size>@<rev>"`), so several embedding models coexist in one library and retrieval silently skips references lacking the active key — swapping models requires no migration. `formatter_mode` is an open string, not an enum of vendors; a new target model is a formatter module plus optional `model_hints` keys on taxonomy nodes.

Candidate local models named in the brief are **candidates to evaluate, never dependencies**; see [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md) and [`research/video-analysis-and-local-runtimes.md`](./research/video-analysis-and-local-runtimes.md).

### 8.5 UI / engine separation

Three couplings are prohibited outright by the brief: **UI ↔ prompt engine**, **search ↔ prompt composer**, and any **AI-model-dependent architecture**.

The engine is a set of pure functions over plain data — `normalizeVisualIntent`, `applyMix`, `buildStructuredPrompt`, `formatPrompt` — none of which touch the DOM, the network, or a model. `formatPrompt` is byte-deterministic: the same `StructuredPrompt` + mode + taxonomy version yields identical text (INV-FMT-1), and the formatter never invents a value absent from the structured prompt (INV-FMT-3). Retrieval and analysis are separate modules — *the analyser understands, the retriever ranks* — and **nothing in `results` ever writes back into `intent`**.

The payoff is concrete and is a milestone: the ComfyUI node reuses `src/core`, `src/prompt` and the taxonomy unchanged and emits the same four outputs (`prompt`, `structured_prompt`, `visual_intent`, `reference_mix`) as the web app's exports. If the engine had a UI dependency, that node would be a rewrite.

---

## 9. Non-goals

Stated so that nobody spends a week building them.

| Non-goal | Why |
|---|---|
| **Generating images or video** | We produce prompts and structured intent. Generation is somebody else's inference stack; coupling to one would violate model-agnosticism. |
| **Being a media library / DAM** | We store metadata, URLs and attributes. We never store media binaries (INV-REF-2). |
| **Being a prompt gallery** | We do not host, rank, or resell other people's prompt strings. A `VisualRecipe` saves a *combination*, not a string. |
| **Scraping closed platforms** | No Pinterest scraping, no Instagram media copying, no TikTok video database. Non-negotiable. |
| **Bulk-collecting unknown-licence images** | Prohibited outright. Unverified licence cannot reach `approved`. |
| **Copying prompt databases or external repository code wholesale** | Prohibited outright. See [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md). |
| **Likeness / face / identity matching** | Out of scope by design. This is why `subject` and `appearance` are excluded from EXTRACT. |
| **Auto-resolving conflicts to "just make it work"** | The disagreement between two references is the user's creative decision. Removing the decision removes the product. |
| **Training our own models** | Not a modelling project. Adapters, not weights. |
| **Multi-user accounts, collaboration, cloud sync (v1)** | Local-first. Sharing happens by exporting a recipe file. |
| **Chat as the primary interface** | The interface is the modal and the chip editor. A prose channel cannot express "take the composition of A but not the hat of B" and cannot render two thumbnails side by side for a decision. |

---

## 10. ANTI-DRIFT

This product has one predictable failure mode: it decays into a generic prompt builder, one reasonable-sounding simplification at a time. Each simplification below is individually defensible and collectively fatal. **Treat every symptom in this list as a release blocker.**

### 10.1 Fatal symptoms — if any of these ships, the product has failed

| # | Symptom | What was actually lost |
|---|---|---|
| D1 | **A dropdown-only screen ships.** Any screen where the user selects from `<select>` lists and receives a prompt, with no reference in sight. | The entire pipeline. This *is* the Prompt Builder category. Fails S1–S6. |
| D2 | **References are reduced to a single "Use" button.** EXTRACT and EXPLORE are dropped as "confusing"; a card contributes all-or-nothing. | Pillars 3 and 4. Without partial contribution, S1 and S2 are inexpressible. |
| D3 | **The mix panel is removed because it is hard.** Only one reference at a time. | Pillar 5 — the thing that distinguishes us from similar-image search. |
| D4 | **Conflicts are auto-resolved** (highest confidence wins, first wins, last wins) with no visible decision. | The conflict doctrine and INV-MIX-2. The user's creative choice was made by a heuristic and hidden. |
| D5 | **Conflicting values are silently dropped** so the prompt "looks clean". | Same. A clean prompt that lost a decision is worse than a blocked slot. |
| D6 | **`IntentChip` is flattened to a bare string** "for simplicity". | `ref_id`, `source`, `confidence`, `locked`, `evidence`, `alternatives` — i.e. Pillars 2, 4 and 5 in one commit. |
| D7 | **Image and video get their own pages.** | Pillar 1 and the UX north star, simultaneously. |
| D8 | **The modal closes on search, on card open, or on mode switch.** | Pillar 1. Exploration becomes a series of transactions. |
| D9 | **A mode switch clears the intent, pins, mix or filters.** | INV-EXP-1, the central invariant. |
| D10 | **The prompt string becomes the saved artefact** and `VisualRecipe` is dropped or reduced to `{name, text}`. | We become a prompt gallery. A prompt cannot be re-mixed; a combination can. |
| D11 | **AI becomes required** — an empty state that says "enable AI to continue", or a search path with no keyword fallback. | INV-AI-1 and the `v0.1` milestone. |
| D12 | **A model name is hardcoded** anywhere outside an adapter config. | INV-AI-2. The architecture becomes a bet on one vendor. |
| D13 | **The formatter reaches into the UI**, or the search module imports the prompt composer. | The two prohibited couplings; the ComfyUI node becomes a rewrite. |
| D14 | **Unverified-licence references appear in normal results**, or `approved` is granted without the guard passing. | INV-LIC-3 and the whole licence stance. |
| D15 | **Media binaries get stored** "just for the cache", in the repo or in a document. | INV-REF-2 and the hard prohibition on bulk storage. |
| D16 | **Lens is asserted as fact** — `35mm` instead of `35mm-like perspective`. | INV-LENS-1/2 and the product's epistemic stance: never assert what the medium cannot evidence. |
| D17 | **`camera_motion` is merged into `motion`**, or camera motion is inferred from a still. | S2 becomes inexpressible and INV-VID-1 is violated. The subject/camera seam is the whole video feature. |
| D18 | **Browse tiles lose their thumbnails** and become a text tree. | S3 and S4. The user is back to needing the vocabulary first. |
| D19 | **Taxonomy hierarchy migrates into ids** (`clothing.tops.hoodie`). | INV-TAX-1. Re-parenting a node would then invalidate every stored intent, mix and recipe. |
| D20 | **Provenance is dropped from prompt fragments** — the prompt becomes an opaque string. | The pipeline can no longer be read backwards. "Why is this word in my prompt?" becomes unanswerable. |

### 10.2 Early-warning phrases

Drift arrives as a sentence in a review, long before it arrives as code. Each of these should trigger a re-read of this document:

- *"Users won't understand the mix panel, let's hide it behind a toggle."* → D3
- *"Let's just pick the higher-confidence value and move on."* → D4
- *"Do we really need the whole chip object? A string array is fine."* → D6
- *"Video is different enough that it deserves its own screen."* → D7
- *"We can save the generated prompt text and reload that."* → D10
- *"Let's just call the API directly here, we can abstract it later."* → D12
- *"`35mm-like` reads awkwardly, let's just say `35mm`."* → D16
- *"Camera motion is basically motion, let's merge them."* → D17
- *"Nested ids would make the tree code simpler."* → D19

### 10.3 The one-question drift test

Before merging any change, ask:

> **Can a user still take one third of reference A and one half of reference B, see the disagreement between them, decide it themselves, and read the resulting prompt backwards to the source and its licence?**

If the change makes that harder, it is drift, whatever else it improves.

---

## 11. The nine questions, answered

The brief requires the doc set to answer nine questions (spec section 70). Short answers here; each links to the document that owns the long one.

| # | Question | Answer | Owner |
|---|---|---|---|
| 1 | Why different from an existing prompt builder? | A prompt builder implements Option→Prompt. We implement search→extract→mix→compose, with references decomposed into typed attributes and partial inheritance. See §3, §10. | [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) |
| 2 | Why must image search and prompt building live in ONE UI? | Because the intent object is the same object at both ends. Splitting them forces the user to serialise a structured intent through a text box and back, losing provenance, locks and conflicts. §5 Pillar 1, §7. | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| 3 | Minimum VisualIntent fields? | Exactly 20 keys: 19 category arrays + `confidence`. All required, `additionalProperties: false`. | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) |
| 4 | What structure takes only SOME attributes from one reference? | `MixEntry { reference_id, use[], only[], exclude[], weight, priority, pinned, role }` over `Reference.visual_attributes`. | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) |
| 5 | How are conflicts handled? | Detected by three kinds (`arity`, `exclusivity_group`, `explicit`), surfaced with deterministic ids, resolved only by a human unless the user explicitly opts into a policy. Never auto-resolved, never dropped. | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) |
| 6 | Does it work with no AI? | Yes, completely: browse, manual selection, keyword search, metadata search, mixing, composer. `v0.1` ships that way. | §8.1, [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| 7 | Can the AI model be swapped later? | Yes: three runtime adapters, opaque model ids, model-keyed embeddings, open `formatter_mode`. No migration required. | §8.4, [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| 8 | Is reference licensing separated from code licensing? | Yes, absolutely and always. `license_summary` covers media only; code licensing is [`../LICENSE`](../LICENSE) and [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| 9 | Can the web MVP be reused inside ComfyUI? | Yes: the engine is pure functions over plain data with no UI dependency; the node emits the same four exports. | §8.5, [`ROADMAP.md`](./ROADMAP.md) |

---

## 12. Where to go next

| Document | What it owns |
|---|---|
| `BRIEF.md` — the canonical product brief | The authoritative source. Wins over every document in this repository. Held with the project spec; not necessarily committed here. |
| [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) | The canonical data model: 20 categories, arity table, category→slot map, all invariants. |
| [`schemas/`](./schemas/) | The seven JSON Schema files that enforce it. |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Module boundaries, the pure-function engine, the adapter seams. |
| [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) | Hybrid retrieval, fusion ranking, Search by Difference, the AI-off path. |
| [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) | The License Guard pipeline, allowed/excluded licences, attribution and URL rot. |
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | The four adjacent categories examined against the six situations. |
| [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) | What we may and may not borrow, and from where. |
| [`ROADMAP.md`](./ROADMAP.md) | `v0.1`–`v0.5` and the ComfyUI node. |
| [`research/`](./research/) | Primary-source notes behind the taxonomy and the retrieval design. |
| [`../data/taxonomy/`](../data/taxonomy/) | Ten taxonomy files, twenty categories, the controlled vocabulary itself. |

**Precedence, when documents disagree:** `BRIEF.md` → `DATA_SCHEMA.md` (the canonical data model) → this document → everything else.
