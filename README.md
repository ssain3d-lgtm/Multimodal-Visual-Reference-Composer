# Unified Visual Reference Composer

Search with words, images, videos, or references; extract only the visual elements you want, mix them together, and turn the result into a structured generation prompt.

> ### 한국어 요약
> 이 저장소는 **통합 비주얼 레퍼런스 컴포저**의 설계와 구현을 담습니다. 텍스트·이미지·비디오·레퍼런스 카드를 **하나의 모달** 안에서 검색하고, 레퍼런스를 사진이 아니라 **타입이 지정된 시각 속성의 묶음**으로 분해하며, "이 사진의 구도 + 저 사진의 옷" 처럼 원하는 속성만 골라 상속·혼합해 최종 구조화 프롬프트를 만듭니다. 여러 레퍼런스가 같은 카테고리에서 다른 값을 줄 때 충돌은 **감지되어 사용자에게 드러나며, 자동 해소되거나 조용히 버려지지 않습니다**. AI는 선택 사항이고(AI를 꺼도 브라우즈·수동 선택·키워드 검색·메타데이터 검색·프롬프트 작성이 모두 동작), 어떤 모델 이름도 코드에 하드코딩하지 않습니다. 현재 상태는 **설계 완료 · v0.1 구현 진행 중**입니다.

This is **not** a prompt builder, not an image-to-prompt interrogator, not a reverse image search, and not a prompt gallery. Those tools answer *"give me some text"*. This one answers *"take **this** from **that**, and **that** from **the other**, and tell me exactly where every word came from."*

---

## The pipeline

The pipeline *is* the product. Remove any stage and what is left is a prompt builder.

```
   TEXT          IMAGE          VIDEO         REFERENCE CARD
     |             |              |                 |
     +------+------+------+-------+--------+--------+
                          v
              [1] UNIFIED VISUAL INTENT           20 categories, chips carry
                  VisualIntent (chips)            value + source + ref_id +
                          |                       confidence + evidence
                          v
              [2] SIMILAR REFERENCE SEARCH        keyword | metadata | semantic
                  hybrid fusion 0.6/0.4           -> optional rerank
                          |
                          v
              [3] REFERENCE DECOMPOSITION         a reference is a bag of typed
                  Reference.visual_attributes     attributes, not a picture
                          |
                          v
              [4] SELECTIVE ATTRIBUTE INHERITANCE EXTRACT: composition, camera,
                  use: ["composition","lens"]     pose, clothing, lighting,
                          |                       scene, style, motion
                          v
              [5] MULTIPLE REFERENCE MIXING       conflicts DETECTED + SURFACED,
                  ReferenceMix + conflicts[]      never auto-resolved
                          |
                          v
              [6] FINAL STRUCTURED PROMPT         13 slots -> formatPrompt(mode)
                  StructuredPrompt -> text        generic | flux | sd | ...
```

Every arrow is a pure, testable function. `applyMix()` and `formatPrompt()` are deterministic: the same inputs produce the same intent, the same conflict ids, and byte-identical prompt text.

**The minimum interop payload, straight from the brief, and valid against our schema unchanged:**

```json
{ "references": [ { "reference_id": "img_A", "use": ["composition", "camera_angle"] } ] }
```

---

## What makes this different

| # | Pillar | What it means in the data |
|---|---|---|
| 1 | **Unified Modal** | Text / Image / Video / Browse are four *input modes of one modal*, not four pages. Switching mode never resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `filters` (INV-EXP-1). The modal never closes mid-exploration. |
| 2 | **Visual Intent** | Every input — a typed sentence, an uploaded photo, a video clip, a clicked card — collapses into the *same* 20-key `VisualIntent`. AI output is a proposal, never a commitment: every chip is editable, lockable and swappable. |
| 3 | **Reference Decomposition** | A reference is a bag of typed attributes (`composition`, `camera_angle`, `framing`, `lens`, `pose`, `motion`, `camera_motion`, `clothing`, `lighting`, `scene`, `color`, `mood`, `style`, …), each traceable back to a taxonomy id. |
| 4 | **Selective Inheritance** | `use: ["clothing"]` takes the outfit and nothing else; `exclude: ["clothing.beanie"]` takes the outfit but not the hat. Every inherited chip stores its `ref_id`, so "remove everything B gave me" is one operation. |
| 5 | **Reference Mixing** | Combining partial attributes of several references is the whole point. Two references disagreeing on `camera_angle` produce a surfaced `Conflict` with both thumbnails side by side — and the prompt slot stays **blocked** until a human chooses. |

Two more commitments that are not pillars but are equally non-negotiable:

- **Honest optics.** Lens values are hedged: `lens.35mm_like` → `"35mm-like perspective"`. `lens.35mm` is rejected by the schema in three separate places. The product never asserts EXIF it cannot know.
- **Honest media.** A single still may never author a `camera_motion` value (INV-VID-1); implied subject motion from a still is capped at confidence 0.6 and must carry `evidence.kind: "implied"` (INV-VID-3).

---

## Current status

**Design phase: complete. v0.1 implementation: in progress.**

| Area | State | Detail |
|---|---|---|
| Canonical data model | **Done** | 7 JSON Schemas (draft 2020-12), all meta-valid and cross-referenced; 37 numbered invariants; a 57-case instance matrix passes. |
| Taxonomy data | **Done (v1 seed)** | 740 nodes across 10 files covering all 20 categories, with `aliases`, `related`, `parent`, `prompt_fragment`, `exclusivity_group`. |
| Taxonomy integrity checker | **Done** | `node tests/validate-taxonomy.mjs` — passes; enforces id grammar, namespace agreement, the lens rule, `camera_motion` media scope, parent cycles, alias collisions. |
| Design documentation | **Done** | 10 design documents + 8 research dossiers, ~16k lines. All nine brief questions answered in [docs/DESIGN_QUESTIONS.md](docs/DESIGN_QUESTIONS.md). |
| `src/**` runtime modules | **Not written** | Directories exist and are empty. Public API signatures are fixed in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). |
| `app/index.html` | **Not written** | The v0.1 shell (Text + Browse modes, cards, mixer, composer) is specified in [docs/UNIFIED_MODAL_STATE.md](docs/UNIFIED_MODAL_STATE.md). |
| `data/presets.json`, `data/references.json` | **Not written** | Seed content lands with v0.1. |
| Live providers (Openverse, Wikimedia) | **Not written** | v0.2. Provider port is `search / getMetadata / getPreview`. |
| Image analysis, embeddings, video analysis | **Not written** | v0.2 / v0.3 / v0.4. v0.1 ships the upload UI with `analysis_status: "mocked"` as a first-class state. |

Honest summary: **nothing in `src/` or `app/` runs yet.** What exists today is a complete, validated specification plus the taxonomy the whole product indexes against. The one executable artefact is the taxonomy checker. See [docs/ROADMAP.md](docs/ROADMAP.md) for what unblocks what and for the promotion gate the web MVP must pass before a ComfyUI node is written.

---

## How to run

The app is a **static ES-module app**. No build step, no bundler, no runtime dependencies.

```bash
# from the repository root
python3 -m http.server 8000

# then open
http://localhost:8000/app/index.html
```

**An HTTP server is required.** ES modules are fetched under CORS rules, so opening `app/index.html` directly as a `file://` URL fails to load `src/**` and `data/**`. Any static server works (`python3 -m http.server`, `npx serve`, `php -S`); serve from the **repository root**, not from `app/`, because the app reads `../data/taxonomy/*.json`.

Until `app/index.html` lands, the only thing to run is the taxonomy checker:

```bash
node tests/validate-taxonomy.mjs      # exits non-zero on any broken invariant
```

Node.js is used for tests and tooling only. It is never required to *serve* the app.

---

## Repository layout

`✓` = present in the tree today · `○` = specified, not yet written

```
Multimodal-Visual-Reference-Composer/
├─ app/
│  └─ index.html                 ○ the single-page shell (Unified Visual Explorer Modal)
├─ src/
│  ├─ core/                      ○ visual-intent, reference-mix, taxonomy,
│  │                               explorer-state, visual-recipe        (imports NOTHING)
│  ├─ search/                    ○ query-builder, metadata-search,
│  │                               semantic-search, fusion-ranker
│  ├─ prompt/                    ○ prompt-engine, formatter-generic
│  ├─ reference/                 ○ reference-manager, license-guard
│  ├─ providers/                 ○ openverse, wikimedia, local
│  │                               port: search / getMetadata / getPreview
│  ├─ ai/                        ○ analyzer, embedding, reranker  (ADAPTERS ONLY —
│  │                               no model name is ever hardcoded)
│  └─ ui/                        ○ explorer-modal, reference-card, reference-detail,
│                                  reference-mixer, intent-chips
├─ data/
│  ├─ taxonomy/                  ✓ 10 files, 740 nodes, all 20 categories
│  │   camera · clothing · framing · lens · lighting · motion · pose · scene ·
│  │   style · subject
│  ├─ presets.json               ○
│  └─ references.json            ○
├─ docs/                         ✓ design documents, research dossiers, JSON Schemas
├─ tests/
│  └─ validate-taxonomy.mjs      ✓ taxonomy integrity checker
├─ LICENSE                       ✓ MIT (code only)
├─ THIRD_PARTY_NOTICES.md        ✓
└─ README.md                     ✓ this file
```

The dependency rule is one line and is enforced by review: **UI → (Search | Prompt | Reference | Providers | AI) → Core → Data.** Core imports nothing. **Search and Prompt never import each other.** No module imports a concrete AI backend.

---

## Documentation index

### Design documents

| Document | What it fixes |
|---|---|
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | What the product is, what it is deliberately not, the five pillars, and the symptoms of decay. |
| [docs/COMPETITIVE_ANALYSIS.md](docs/COMPETITIVE_ANALYSIS.md) | The prior-art register; why no existing system occupies this cell; what may be borrowed and what may never be copied. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layer boundaries, dependency rule, module inventory with API signatures, adapter ports, the three canonical data flows, ComfyUI reuse plan. |
| [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md) | The reference manual for every persisted structure: nine objects, shared enums, id grammars, invariants, worked payloads. |
| [docs/UNIFIED_MODAL_STATE.md](docs/UNIFIED_MODAL_STATE.md) | One modal, four modes: layout regions, state shape, event table, mode-switch invariant matrix, history model, conflict UI, a11y. |
| [docs/SEARCH_ARCHITECTURE.md](docs/SEARCH_ARCHITECTURE.md) | Query construction, keyword/metadata/semantic matching, fusion, diversification, explainability, Search by Difference, evaluation. |
| [docs/LICENSE_POLICY.md](docs/LICENSE_POLICY.md) | Which media may enter, the four-stage License Guard, attribution rendering, forbidden sources, remediation. |
| [docs/THIRD_PARTY_REVIEW.md](docs/THIRD_PARTY_REVIEW.md) | Provenance record: every external project examined, its licence, what was taken (concepts only), what was left behind. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | v0.1 → v0.5, the dependency graph, the ComfyUI promotion gate, the risk register. |
| [docs/DESIGN_QUESTIONS.md](docs/DESIGN_QUESTIONS.md) | The brief's nine required questions, each answered against an actual field, invariant or module boundary. |

### JSON Schemas — `docs/schemas/` (draft 2020-12)

All shared `$defs` (category enums, id grammars, licence ids, formatter modes, prompt slots, the arity table, the category→slot map) live in `taxonomy-node.schema.json`, which has zero external `$ref`s. Never redefine a shared enum locally.

| Schema | Object |
|---|---|
| [taxonomy-node.schema.json](docs/schemas/taxonomy-node.schema.json) | `TaxonomyNode` + every shared `$def` |
| [visual-intent.schema.json](docs/schemas/visual-intent.schema.json) | `VisualIntent` (20 keys) and `IntentChip` |
| [reference.schema.json](docs/schemas/reference.schema.json) | `Reference`, `ReferenceMetadata`, `ReferenceSnapshot` |
| [reference-mix.schema.json](docs/schemas/reference-mix.schema.json) | `ReferenceMix`, `MixEntry`, `Conflict`, `Resolution` |
| [structured-prompt.schema.json](docs/schemas/structured-prompt.schema.json) | `StructuredPrompt` (13 slots), `PromptFragment` |
| [explorer-state.schema.json](docs/schemas/explorer-state.schema.json) | `ExplorerState` — the Unified Modal state machine |
| [visual-recipe.schema.json](docs/schemas/visual-recipe.schema.json) | `VisualRecipe` — a saved *combination*, not a prompt preset |

### Research dossiers — `docs/research/`

Background surveys, each written before the corresponding design decision. Every external claim inside them is marked with its verification state.

| Dossier | Feeds |
|---|---|
| [cinematic-camera-taxonomy.md](docs/research/cinematic-camera-taxonomy.md) | `framing`, `camera_angle`, `camera_distance`, `motion`, `camera_motion` |
| [fashion-wardrobe-styling.md](docs/research/fashion-wardrobe-styling.md) | the `clothing` subtree (194 nodes, the densest branch) |
| [image-to-prompt-interrogators.md](docs/research/image-to-prompt-interrogators.md) | what we must *not* be: one image in → one text blob out |
| [comfyui-prompt-builders.md](docs/research/comfyui-prompt-builders.md) | the ComfyUI node phase and its shared-module contract |
| [visual-prompt-galleries.md](docs/research/visual-prompt-galleries.md) | browse-by-looking UX; Midjourney `--sref`/`--oref` as the closest prior art |
| [license-safe-media-apis.md](docs/research/license-safe-media-apis.md) | Wikimedia Commons and Openverse provider design |
| [multimodal-embedding-retrieval.md](docs/research/multimodal-embedding-retrieval.md) | v0.3 embeddings and hybrid ranking |
| [video-analysis-and-local-runtimes.md](docs/research/video-analysis-and-local-runtimes.md) | v0.4 video analysis and local VLM runtimes |

---

## AI is optional

**AI OFF is a complete product, not a degraded mode** (INV-AI-1). With `ai.enabled: false` you still get: visual browse cards, manual chip authoring, keyword search over `label` + `aliases` + `related` + `description`, structured metadata search over `visual_attributes`, reference decomposition, selective inheritance, mixing with full conflict detection, and the prompt composer. Ranking falls back to `metadata_only` / `keyword_only`. Alias and `related`-hop query expansion keeps working, because it needs no model.

**AI ON adds** image analysis, video analysis, semantic search, and reranking — as *proposals*. Every generated chip is editable, lockable and deletable.

**No model name is ever hardcoded** (INV-AI-2). `analyzer`, `embedding` and `reranker` are adapter ports resolved at runtime by opaque instance id; embeddings are model-keyed (`"<family>_<size>@<rev>"`) so several coexist and any one can be swapped with no migration. Candidate local models are recorded in the research dossiers as *candidates to evaluate*, never as dependencies.

**Privacy is local-first.** `external_transmission.allowed` defaults to `false`; any transmission of user media must be disclosed in the UI before it happens, and a reference marked `privacy.local_only` must be refused by every remote adapter. Uploads get a `upl_` handle, which never implies bytes left the device.

---

## Licensing

**Two separate layers. They never imply each other.**

| Layer | Terms |
|---|---|
| **This code** | MIT — see [LICENSE](LICENSE). Dependencies (currently zero) are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). |
| **Reference media** | Per-item, carried in `Reference.metadata.license` + `license_url` + `attribution`. Governed by [docs/LICENSE_POLICY.md](docs/LICENSE_POLICY.md). |
| **Generated output** | Governed by whatever model you run the prompt through. This repository makes no claim about it. |

Reference-media policy in brief: sources are **1) Wikimedia Commons, 2) Openverse**. Allowed by default: Public Domain, PDM, CC0, CC BY, and your own uploads. Opt-in: CC BY-SA. Excluded by default: CC BY-NC, CC BY-NC-SA, CC BY-ND, CC BY-NC-ND, proprietary, unknown. The **License Guard** pipeline is `LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → APPROVAL`, and **an unverified licence can never reach `approved`** — the default search filter is `status: ["approved"]`, so an unverified reference never reaches a normal result set.

**No media binaries are stored in this repository, and the schema enforces it**: `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` are declared `false`, so a document carrying any of them is invalid. Only URLs, thumbnail URLs, metadata, embeddings and visual attributes are ever persisted. Attribution is stored as *text*, never as a computed link, so credit survives a dead media URL.

This is engineering policy, not legal advice.

---

## Contributing

1. **Read [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) first.** A change that makes the product more like a prompt builder is rejected regardless of its quality.
2. **The canonical data model wins.** Field names, enum members, category keys and id prefixes come from [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md) and `docs/schemas/`. Do not invent a synonym for an existing name.
3. **Respect the dependency rule.** Core imports nothing. Search and Prompt never import each other. UI never reaches past its layer. No module imports a concrete AI backend.
4. **Never break an invariant silently.** The `INV-*` ids in the docs are the contract. If a change requires relaxing one, change the doc in the same commit and say why.
5. **Taxonomy changes must pass the checker.** Run `node tests/validate-taxonomy.mjs` before committing anything under `data/taxonomy/`. New ids are exactly two dotted segments — hierarchy lives in `parent`, never in the id, so re-parenting never invalidates a stored intent.
6. **Never commit media binaries** or references with an unverified licence.
7. **Schema changes are versioned.** MAJOR = breaking; MINOR = additive only. Readers must ignore unknown properties from a higher MINOR.

---

## Non-goals

Not a generic prompt builder, not an image-to-prompt interrogator, not a reverse image search, not a prompt gallery, not a model zoo, not a media host — and never a system that scrapes Pinterest, copies Instagram media, builds a TikTok video database, bulk-stores unknown-licence images, hardcodes an AI backend, couples the UI to the prompt engine, couples search to the composer, or silently resolves a conflict on the user's behalf.
