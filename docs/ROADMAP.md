# Roadmap — Unified Visual Reference Composer

The sequenced delivery plan: what ships in v0.1 through v0.5, what unblocks what, the named gate the web MVP must pass before a ComfyUI node is written, and the risks that could turn this product back into a prompt builder.

> ## 한국어 요약
>
> 이 문서는 제품의 배포 순서를 확정한다. v0.1은 AI 없이도 완결된 제품(통합 모달, 브라우즈, 키워드 검색, 레퍼런스 믹스, 충돌 표시, 프롬프트 작성기, 라이선스 배지)을 출시하고, v0.2는 Openverse·Wikimedia 실검색과 라이선스 가드 및 실제 이미지 분석, v0.3은 멀티모달 임베딩과 하이브리드 랭킹, v0.4는 비디오 분석과 카메라 모션 믹싱, v0.5는 Search by Difference를 추가한다.
> ComfyUI 노드는 웹 MVP가 5개 정체성 기둥을 명시된 합격 기준으로 증명한 뒤에만 착수하며, 노드는 UI가 아니라 순수 코어(taxonomy, visual intent, reference mix, prompt engine, formatter)만 노출한다.
> 각 마일스톤은 목표 / 범위 / 명시적 제외 범위 / 완료 정의 / 위험을 갖는다. 완료 정의를 만족하지 못한 마일스톤은 다음 마일스톤을 시작할 수 없다.
> 이 로드맵의 최우선 방어 목표는 제품이 "옵션 몇 개 골라서 프롬프트 뽑는 도구"로 퇴화하지 않도록 막는 것이다.

---

## 0. Document contract and precedence

1. **The canonical product brief** (`BRIEF.md`, held outside this repository) wins over everything here. Where this document appears to add a feature, it is sequencing an existing brief commitment, not inventing a new one.
2. The canonical data model ([`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/)) fixes every field name, enum value, category key and id convention used below. This roadmap never renames them.
3. [`ARCHITECTURE.md`](./ARCHITECTURE.md) fixes module boundaries and purity classes; [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) fixes retrieval and its evaluation harness; [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) fixes the License Guard; [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §10 fixes the anti-drift symptom list `D1`–`D20`. This roadmap schedules them.
4. **No calendar dates appear in this document.** Team size and availability are unknown here (UNVERIFIED), and a dated roadmap that slips is quietly rewritten, which is how scope drifts. Ordering and exit criteria are binding; duration estimates are relative sizes only.

**Vocabulary used throughout.** `DOD-<milestone>-<n>` = a definition-of-done criterion. `GATE-<pillar>-<letter>` = a ComfyUI promotion-gate criterion. `RSK-<n>` = a risk-register entry. `NG-R<n>` = a roadmap non-goal. These ids are stable; cite them in PR descriptions.

---

## 1. The release map

| Milestone | Theme | AI required? | New network egress? | Relative size | Exit gate |
|---|---|---|---|---|---|
| **v0.1** | The complete AI-free product | **No** — `ai.enabled = false` is the default and is fully functional | **None** (seed library is local JSON) | XL | `DOD-01-1 … -12` |
| **v0.2** | Live providers, License Guard, real image analysis | No (analysis is opt-in) | Openverse, Wikimedia Commons | L | `DOD-02-1 … -9` |
| **v0.3** | Multimodal embedding, similar-image, hybrid ranking | No (semantic is opt-in) | None new (embeddings local by default) | L | `DOD-03-1 … -8` |
| **v0.4** | Video analysis, camera motion, motion mixing | No (analysis is opt-in) | None new | L | `DOD-04-1 … -9` |
| **v0.5** | Search by Difference | No | None new | M | `DOD-05-1 … -6` |
| **ComfyUI phase** | Headless node over the shared core | No | **Node performs zero network access** | M | `GATE-P1 … P5` + `GATE-X` **must already be green** |

Three properties hold at every milestone and are re-tested at every milestone:

- **AI-OFF completeness (INV-AI-1).** Turning `ai.enabled` off never removes a *capability class*, only quality. Browse, manual selection, keyword search, metadata search, mixing, conflict resolution and the prompt composer work at v0.5 exactly as they did at v0.1.
- **No binaries (INV-REF-2).** No milestone introduces media byte storage. Not as a cache, not as a fixture, not inside a recipe.
- **No hardcoded model names (INV-AI-2).** Every model reference lives in an adapter config, at every milestone, including the mock analyzer.

---

## 2. Milestone detail

### 2.1 v0.1 — The complete AI-free product

> The rule that shapes this milestone: **v0.1 is not a prototype of the product, it is the product with the models removed.** Every pillar is demonstrable at v0.1 without a single inference call. If a pillar cannot be shown at v0.1, the pillar was implemented as a model feature, which is the architectural failure this project exists to avoid.

**Goal.** Ship the entire pipeline shape — `TEXT/IMAGE/VIDEO/CARD → VisualIntent → search → decomposition → selective inheritance → mixing → StructuredPrompt` — with `ai.enabled = false`, over a local, licence-clean, metadata-only seed library.

**Scope.**

| Area | What lands |
|---|---|
| Contract | All 7 files in [`schemas/`](./schemas/) frozen at `schema_version: "1.0"`; `data/taxonomy/*.json` covering all 20 `visual_category` values; `data/presets.json` (`pst_*`); `data/references.json` seed library (metadata + URLs + `visual_attributes` only) |
| Core | `src/core/taxonomy.js`, `visual-intent.js` (`normalizeVisualIntent`, `compactVisualIntent`, `aggConfidence`), `reference-mix.js` (`applyMix`, conflict detection, deterministic `cfl_` ids), `explorer-state.js` reducer, `visual-recipe.js` |
| Modal | One `ExplorerState`; four modes (`text`, `image`, `video`, `browse`); `query` holds all four payloads simultaneously; INV-EXP-1 enforced by test |
| Text mode | Free text → taxonomy index → chips: a direct hit carries `source: "user"`, an alias/`related` hop carries `source: "query_expansion"`; unknown terms become `custom: true` chips, never errors. `analyzer_text` is the AI-ON path and does not ship here |
| Browse mode | Category → `parent`/`children` tiles with `visual_hint` thumbnails. This is the answer to *"I don't know what Low Angle means"* and it ships first, not last |
| Image/Video mode | Upload UI complete: `upl_` handle, thumbnail, `query.video.t_start_s/t_end_s` window control, and `analysis_status: "mocked"` returning a deterministic fixture intent. The mock is labelled in the UI as mocked; it never pretends to be analysis |
| Search | Keyword engine: inverted index over `{id, label, aliases[], i18n, description}` + reference `{title, description, tags[], aliases[]}`; the exact score table from the canonical model; one-hop `related[]` expansion; structured metadata search over `visual_attributes`; `ranking.mode` falls back to `keyword_only`/`metadata_only` |
| Cards | `USE` (`use: ["*"]`), `EXTRACT` (the 8 groups, expanded to categories before storage), `EXPLORE` (all nine brief actions: find-similar / same-composition / same-lighting / same-outfit / same-pose / same-camera / same-scene / similar-image / similar-video — implemented as metadata queries, no embeddings needed. The six "same X" write `difference.keep`; the three "similar" run as structured similarity over shared taxonomy ids, with `filters.type` pinned for similar-image / similar-video) |
| Mixing | `ReferenceMix` with `weight`, `priority`, `pinned`, `only`, `exclude`, `role`; `applyMix` merge with AGREEMENT dedupe; conflict detection for all three `kind`s; the resolution UI with both thumbnails side by side; `dominance` memory |
| Composer | `buildStructuredPrompt` → 13 slots with `PromptFragment` provenance; `formatPrompt(…, "generic")`; `blocked[]` rendered as an unresolved *decision*; `negative_text` from `constraints` |
| Licence | Badge on every card and in the composer; `status: ["approved"]` default filter; `license_summary` + `attribution_block` on recipes; seed library is Public Domain / CC0 / CC BY only |
| Persistence | `VisualRecipe` save + load as a local file. Decided deliberately: saving arrives together with the recipe object, never as "save the prompt text", because a save feature that stores a string is symptom `D10` |
| Tests | Schema conformance matrix; `tests/conformance/*.json` golden fixtures (intent + mix → expected `StructuredPrompt` and expected `text`); architecture lint (no `window`/`fetch`/`document` under `src/core/**` or `src/prompt/**`) |

**Explicitly out of scope.**

- Any network call to any provider. `src/providers/*.js` exists as an interface with `local.js` implemented only.
- Any model, any embedding, any vector, any reranker. `src/ai/*.js` ships as ports with a **mock analyzer** and no backend.
- Real image or video analysis. `analysis_status: "mocked"` is the whole feature.
- Search by Difference, CHANGE axis — `difference.change`, `change_targets`, the `strictness` ladder and the diversity boost are v0.5. `difference.keep` does ship, written by the six "same X" EXPLORE actions and executed as hard structured filters; the KEEP/CHANGE bar is a read-only KEEP readout.
- Formatter modes other than `generic`.
- Recipe *sharing*, import of foreign recipes, comparison view, alternative export kinds.
- Localisation beyond the `i18n` field existing on `TaxonomyNode`.

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-01-1` | All 7 schemas pass `Draft202012Validator.check_schema`; the 57-case instance matrix passes; the brief's literal `{ "references": [ { "reference_id": "img_A", "use": ["composition","camera_angle"] } ] }` validates unchanged (INV-MIX-0) |
| `DOD-01-2` | `data/taxonomy/*.json` covers all 20 categories; every node passes INV-TAX-1/2/3/4/5/6; **≥ 90 %** of nodes carry a non-empty `aliases[]` and a `description`, because those two fields *are* the AI-free search engine |
| `DOD-01-3` | Use case S1 (*"same composition as this photo, but the outfit from that one"*) is completed end-to-end by a human, with `ai.enabled = false`, in one modal session, without a page navigation |
| `DOD-01-4` | INV-EXP-1 test: a scripted sequence `text → image → browse → video → text` leaves `intent`, `pinned_reference_ids`, `mix`, `difference` and `query.filters` byte-identical, and restores the originally typed text |
| `DOD-01-5` | Conflict test: two references contributing `camera_angle.low_angle` and `camera_angle.high_angle` both remain present in `intent`, produce one `open` conflict with a deterministic `cfl_` id, and `formatPrompt` returns that category in `blocked[]` — not a picked winner, not a dropped value (INV-MIX-2, `D4`, `D5`) |
| `DOD-01-6` | Determinism test: `formatPrompt` over 100 fixture intents is byte-identical across 100 runs and across two machines (INV-FMT-1) |
| `DOD-01-7` | Provenance test: every fragment in a generated prompt resolves back to `{source_category, value, ref_id, chip_id}`, and deleting one reference's contribution removes exactly its fragments (`D20`) |
| `DOD-01-8` | `normalizeVisualIntent` is idempotent and total over a fuzz corpus of ≥ 500 malformed ingest documents: no throw, unknown ids become `custom: true` chips |
| `DOD-01-9` | Round-trip test: `compact → normalize → compact` is identity for the semantic payload; `custom`/`negate` chip loss emits a warning |
| `DOD-01-10` | Licence test: no seed reference has `license ∈ {unknown, proprietary, cc_by_nc*, cc_by_nd*}`; every `approved` reference satisfies INV-LIC-1/2/3; a reference with a failing guard cannot appear in a default result set |
| `DOD-01-11` | Architecture lint green: `src/core/**` and `src/prompt/**` contain no DOM, network or filesystem reference; `src/search/**` does not import `src/prompt/**`; `src/prompt/**` does not import `src/ui/**` |
| `DOD-01-12` | The word "mock" is visible in the UI wherever `analysis_status === "mocked"`. A mocked analysis is never presented as a real one |

**Risks.**

| Risk | Mitigation |
|---|---|
| The seed library is too small to make browse/EXTRACT feel real, and the demo reads as a toy | Budget the seed library explicitly: **300–600 references**, metadata-only, spread so that every one of the 8 EXTRACT groups has ≥ 30 examples. A thin library invalidates `DOD-01-3` |
| The mock analyzer's fixture output quietly becomes the spec for the real analyzer | The mock returns a *fixed* intent per fixture image, not a plausible-looking generated one, and is stored under `tests/fixtures/`, not `src/ai/` |
| "Ship the modal, add mixing later" pressure | Mixing is in `DOD-01-3` and `DOD-01-5`. v0.1 without mixing is symptom `D3` and does not exit |
| Conflict UI is the hardest UI in the product and lands in the first milestone | Accepted deliberately. It is built early precisely because every later milestone feeds it more conflicts; discovering it is hard at v0.4 would be fatal |

---

### 2.2 v0.2 — Live providers, License Guard, real image analysis

**Goal.** Replace the local seed library with the open web, under a licence pipeline that cannot be bypassed; replace the mock analyzer with a real one behind the `analyzer-adapter` port.

**Scope.**

- `src/providers/openverse.js` and `wikimedia.js` implementing `search(query, filters)`, `getMetadata(id)`, `getPreview(id)`; provider field mapping per [`LICENSE_POLICY.md §6`](./LICENSE_POLICY.md); deterministic id minting (`mintReferenceId`) so the same provider hit dedupes across sessions.
- `src/reference/license-guard.js`: the four-stage state machine `LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → REFERENCE APPROVAL`, with `license_guard.{license_check, source_validation, attribution_metadata, approval}` recorded per reference.
- `query.filters.license` wired to the default allowed set (`public_domain, pdm, cc0, cc_by, user_owned`), with `cc_by_sa` as an explicit opt-in toggle and the excluded set unreachable without an explicit, warned override.
- `src/ai/analyzer.js` port + first adapter producing `IntentChip`s with `source: "analyzer_image"`, per-chip `confidence`, and `evidence.bbox`; results written to `Reference.visual_attributes` (bare ids) + `attribute_meta` (sidecar detail).
- `resolveMedia()` and the R1–R5 URL-rot policy; `media_state` on snapshots.
- Privacy: `external_transmission.allowed` default `false`; the disclosure dialog that must be accepted (and stamps `disclosed_at`) before any user media leaves the device; `privacy.local_only` refused by every remote adapter.

**Explicitly out of scope.**

- Embeddings, vectors, semantic search, reranking (all v0.3).
- Video analysis of any kind (v0.4).
- Any provider beyond Openverse and Wikimedia Commons. Additional providers are a post-v0.5 pluggability exercise, not a v0.2 scope creep.
- Any provider that requires scraping, or whose terms do not permit metadata reuse. Non-negotiable.
- Bulk crawling or pre-indexing of provider catalogues. We query on demand; we do not build a shadow copy of Openverse.

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-02-1` | A live search in text mode returns cards from both providers, each with a correct licence badge, creator, `source_url` and stored `attribution` text |
| `DOD-02-2` | INV-LIC-3 test: a reference whose `license_check`, `source_validation` **or** `attribution_metadata` is not `pass` **cannot** reach `approved` through any code path, including the "add to mix" path |
| `DOD-02-3` | Attribution strings are produced from stored text, not computed links, and a reference with a dead `media_url` still renders a complete credit line (R4) |
| `DOD-02-4` | Analyzer produces a `VisualIntent` for an uploaded image in which **every** chip is user-editable, deletable and lockable; no chip is written to a locked or `source: "user"` chip's slot (`applyMix` step 1) |
| `DOD-02-5` | INV-VID-1/2 enforced on real analyzer output: an image analyzer can never author a `camera_motion` chip, and a `motion` chip it authors carries `evidence.kind: "implied"` with `confidence ≤ 0.6` and only for `still_inferable` nodes |
| `DOD-02-6` | Adapter swap test: replacing the analyzer adapter id in config changes the analyzer with **zero** changes under `src/core/**`, `src/prompt/**` or `src/ui/**` (INV-AI-2) |
| `DOD-02-7` | AI-OFF regression: the entire `DOD-01-*` suite still passes with `ai.enabled = false` against the live provider path |
| `DOD-02-8` | Privacy test: with `external_transmission.allowed = false`, no adapter issues a request carrying user media; the disclosure dialog is required, logged with `disclosed_at`, and revocable |
| `DOD-02-9` | Provider failure test: a provider returning 5xx, rate-limiting, or timing out degrades to the local library with a visible notice, never to an empty screen or a crash |

**Risks.**

| Risk | Mitigation |
|---|---|
| Provider API shape or licence field changes break ingestion silently | Provider adapters are thin and covered by recorded-response fixtures; a schema drift in a provider response fails a test rather than producing an `unknown`-licence reference. See `RSK-02` |
| Real analyzer output is worse than the mock and the demo regresses | The analyzer is a *proposal*. `DOD-02-4` requires every chip to be editable; the milestone's value is the pipeline, not the model's accuracy. Accuracy is tuned against fixtures, not against a demo |
| Licence classification ambiguity (non-CC custom licences) | Handled by [`LICENSE_POLICY.md §3`](./LICENSE_POLICY.md). Anything unclassifiable is `unknown` and is excluded by default; ambiguity resolves toward exclusion, never toward inclusion |
| Rate limits make the app feel broken | Debounce, cache metadata by `(source, source_id)`, and always keep the local library as a fallback result set |

---

### 2.3 v0.3 — Multimodal embedding, similar-image search, hybrid ranking

**Goal.** Add the semantic half of retrieval and the fusion that combines it with structured matching, plus the evaluation harness that makes ranking changes accountable.

**Scope.**

- `src/ai/embedding.js` port; `EmbeddingRecord` written under a model key `"<family>_<size>@<rev>"` with exactly one of `vector` / `vector_ref` (INV-REF-3). References lacking the active key are silently skipped by retrieval, never treated as errors.
- `src/search/semantic-search.js`: typed-array kNN in a Web Worker; `vector_ref` into a sidecar index outside the repository.
- `src/search/fusion-ranker.js`: `weighted_sum` (default `semantic_weight 0.6` / `metadata_weight 0.4`) and `rrf`; MMR near-duplicate collapse; `score_breakdown` populated for every item.
- Image-anchored retrieval: `query.image` with a `reference_id` or an `upl_` upload becomes a first-class query; `EXPLORE → find similar` switches from metadata-only to hybrid.
- `explain()` — the score breakdown surfaced in the UI, reconstructing `items[i].score` to `1e-9`.
- The evaluation harness from [`SEARCH_ARCHITECTURE.md §11`](./SEARCH_ARCHITECTURE.md): `tests/search/golden-queries.json` (≥ 40 graded queries), `eval.mjs`, `--sweep`, `baseline.json`, and the CI regression gate.
- Optional `reranker-adapter`, off by default.

**Explicitly out of scope.**

- Video embeddings and video similarity (v0.4).
- Search by Difference (v0.5) — even though difference *uses* the diversity machinery built here.
- Training, fine-tuning or distilling any model. We consume embeddings; we do not produce them. (`RSK-01`)
- A hosted vector database. The index is local; a remote index is a post-v0.5 deployment question.
- Personalised or learned ranking. Ranking is configurable and explainable, not adaptive.

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-03-1` | `nDCG@10` and `P@5` are computed over the ≥ 40-query golden set and recorded in `tests/search/baseline.json`; CI fails on a drop > 0.02 |
| `DOD-03-2` | **AI-OFF completeness = 100 %**: every non-adversarial golden query still returns a ranked, explained, non-empty list with `ai.enabled = false` (INV-AI-1) |
| `DOD-03-3` | Explanation integrity = 100 %: `Σ contribution_pct = 100` and the reconstructed score matches to `1e-9` |
| `DOD-03-4` | Category coverage@10 ≥ 0.80 on the structured bucket |
| `DOD-03-5` | The 60/40 fusion default is either confirmed or replaced by a number produced by `--sweep` on this corpus, with the sweep output committed. The brief's "~60/40" is a starting point, not a finding |
| `DOD-03-6` | Embedding model swap test: writing a second model key and switching the active `embedding_key` requires **no migration** and no schema change; references carrying only the old key are skipped, not broken |
| `DOD-03-7` | Duplicate rate@10 < 0.10 |
| `DOD-03-8` | Retrieval never writes into `intent`: a test asserts `results` mutation leaves `intent` byte-identical (analysis and retrieval remain separate modules) |

**Risks.**

| Risk | Mitigation |
|---|---|
| Embedding compute cost / latency makes the feature unusable on a laptop | Budgeted: kNN over ≤ 5,000 references at dim ≤ 1,024 in < 150 ms in a worker (an engineering target, UNVERIFIED until benchmarked). Embeddings are computed once per reference and cached; quantization (`f16`/`int8`) is available. See `RSK-03` |
| Tuning to the golden set rather than to reality | Grades are appended before tuning and reviewed in PRs; a ranking change ships only with ≥ 20 blind A/B judgements alongside the metric delta |
| Semantic search quietly becomes required, and AI-OFF rots | `DOD-03-2` is a hard 100 % gate, re-run at v0.4 and v0.5 |
| The vector index tempts someone to store thumbnails alongside it "for speed" | INV-REF-2 is schema-enforced; the sidecar index stores vectors and ids only |

---

### 2.4 v0.4 — Video analysis, similar-video, camera motion, motion mixing

**Goal.** Make the second half of the brief's headline use case real: *"same movement as this video, but the camera work of that video."*

**Scope.**

- `analyzer_video` adapter: shot segmentation → `Reference.media.shot_boundaries` and `.keyframes`; per-chip temporal evidence `evidence.{t_start_s, t_end_s, shot_index}`.
- `camera_motion` extraction as ordered chips (`order: 0, 1, …` with disjoint timespans) — "dolly in, then pan left" is two chips, never one merged value.
- `query.video` window (`t_start_s`, `t_end_s`) so the user analyses *this move*, not the whole clip; filmstrip UI backed by `keyframes`/`shot_boundaries`.
- Similar-video retrieval; `filters.has_camera_motion`, `filters.require_categories: ["camera_motion"]`, `filters.duration_s{min,max}`, `filters.type`.
- Motion mixing: entry A `use: ["motion"]` + entry B `use: ["camera_motion"]` — two categories, therefore no conflict by construction.
- INV-FMT-2 media downgrade: feeding a video-derived intent into a still-image formatter mode drops `camera_motion` fragments **with a warning**, while `motion` fragments survive as implied-motion phrasing.

**Explicitly out of scope.**

- Audio analysis, transcription, music. `has_audio` is metadata only.
- Video editing, trimming, transcoding or export of media. We never touch bytes (INV-REF-2).
- Video *generation*. Non-goal at every milestone.
- Storing keyframe images. `keyframes` holds URLs/offsets, never pixels.
- A separate video page. Video is a **mode**, not a screen (`D7`, Pillar 1).

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-04-1` | Use case S2 completes end-to-end: two video references, `use: ["motion"]` and `use: ["camera_motion"]`, produce one prompt with both, and **zero** conflicts |
| `DOD-04-2` | A `camera_motion` chip authored by the video analyzer carries `t_start_s`/`t_end_s` and `shot_index`, and the UI shows the timespan on the chip |
| `DOD-04-3` | INV-VID-1 test: no code path allows `source: "analyzer_image"` in `camera_motion`; the schema rejects it and the analyzer never attempts it |
| `DOD-04-4` | INV-VID-2 test: an `image` reference cannot carry `camera_motion`, `duration_s`, `fps`, `frame_count`, `has_audio`, `keyframes` or `shot_boundaries` |
| `DOD-04-5` | INV-VID-3 test: `motion` chips from a still carry `evidence.kind: "implied"`, `confidence ≤ 0.6`, and reference only `still_inferable: true` nodes |
| `DOD-04-6` | INV-VID-4 test: a `video` reference with a `media` block always has `duration_s`, so every timespan is checkable |
| `DOD-04-7` | INV-FMT-2 test: a video-derived intent formatted for a still-image mode drops camera-motion fragments and emits a visible warning — never silently |
| `DOD-04-8` | Ordered-sequence test: a compound move round-trips as ≥ 2 chips with ascending `order` and disjoint timespans; `camera_motion.static` conflicts with every other node via `conflicts_with` |
| `DOD-04-9` | The video golden-query bucket (≥ 4 queries) is graded and included in the CI regression gate |

**Risks.**

| Risk | Mitigation |
|---|---|
| Camera-motion detection is genuinely hard and output is noisy | Confidence is per-chip and visible; every chip is editable and deletable; the taxonomy's browse tiles let the user pick the move by looking, with no analyzer at all. The feature degrades to manual selection, which is still a complete product |
| Video analysis is slow and blocks the modal | Analysis is an effect, never awaited in the reducer; every in-flight analysis carries a token and stale results are dropped. Replacing the clip mid-analysis is free |
| Pressure to give video its own page because "the filmstrip needs room" | `D7`. The filmstrip is a panel inside the modal. A video page does not ship |
| Camera motion and subject motion get merged "for simplicity" | `D17`. The seam is the entire video feature; `camera_motion → camera` slot and `motion → motion` slot are frozen in the canonical mapping |

---

### 2.5 v0.5 — Search by Difference

**Goal.** Ship the differentiator: *keep composition + lighting + camera, change clothing.*

**Scope.**

- `ExplorerState.difference`: `{enabled, anchor_reference_id, keep[], change[], change_targets, strictness}`.
- KEEP categories become hard structured filters pinned to the anchor's values at `keep_threshold` (derived from `strictness`); CHANGE categories become a soft overlap penalty (λ = `tuning.change_lambda` = 0.7) plus a hard *presence* requirement via `filters.require_categories` plus MMR diversity on the CHANGE axis — never a filter on values (SEARCH_ARCHITECTURE §7.4, `D9`, INV-SRCH-3); unlisted categories are free.
- `change_targets` for *directed* change ("change clothing **to** streetwear", not merely "not this outfit").
- `strictness` (default `0.8`): `1.0` requires exact taxonomy match on KEEP; lower allows sibling nodes via `parent`/`children`.
- `results.items[].differs_categories[]` populated and rendered, so the user can see *why* a card is a valid alternative.
- INV-EXP-5 enforced in code: `keep` and `change` are disjoint.

**Explicitly out of scope.**

- Cross-modal difference ("keep this image's composition, change to a video"). A useful idea, and it is post-v0.5, not a v0.5 stretch.
- Automatic suggestion of what to change. The user decides what to keep. A suggestion engine is a ranking feature, and it is not scheduled.
- Multi-anchor difference (keep from A, change relative to B). Post-v0.5; the schema does not currently express it and will not be bent to.

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-05-1` | **Change-yield@10 ≥ 0.80** on the difference bucket (≥ 6 golden queries): the top 10 genuinely differ in the CHANGE categories (`overlap < 0.25`) |
| `DOD-05-2` | KEEP fidelity: ≥ 0.90 of the top 10 match the anchor's KEEP values at `strictness = 1.0` |
| `DOD-05-3` | INV-EXP-5 test: setting a category in both `keep` and `change` is rejected at the reducer, with a UI message, not silently coerced |
| `DOD-05-4` | Difference works with `ai.enabled = false` — it is structured filtering over `visual_attributes` and needs no model (INV-AI-1) |
| `DOD-05-5` | Directed change: `change_targets` narrows results to the named target values, and `differs_categories` explains each card |
| `DOD-05-6` | A difference search pushes exactly one `history` entry with `origin: "search_by_difference"`, and `back()` restores it without touching `pinned_reference_ids` or `mix` (INV-EXP-3) |

**Risks.**

| Risk | Mitigation |
|---|---|
| Difference results collapse to "everything" because CHANGE is under-constrained | `strictness` and the diversity boost are tuned against the difference bucket; `change_targets` gives the user a direct handle |
| The corpus is too thin for a meaningful "different outfit, same lighting" answer | Difference quality is corpus-bound. v0.2 live providers exist precisely so that v0.5 has something to search. Measure change-yield against the live path, not the seed library |
| Difference is treated as a filter chip row and loses its identity | It gets its own affordance on the reference card (`EXPLORE → same X, different Y`) because that is where the user's thought actually starts |

---

### 2.6 The ComfyUI phase

Scheduled **after** the promotion gate in §4 is green. Not before, and not partially.

**Goal.** Expose the proven core as a headless node that emits exactly the brief's four outputs, with zero re-implementation.

**Scope.**

- `dist/uvrc-core.mjs` — a single bundled, dependency-free, pure-ESM artefact containing `src/core/**` + `src/prompt/**` + the taxonomy loader. (The bundle name is an [`ARCHITECTURE.md §8.2`](./ARCHITECTURE.md) decision, carried here unchanged.)
- The Python node invoking that bundle through a short-lived Node sidecar over stdin/stdout JSON. Fallback: a Python port of core + prompt, **accepted only when it passes the same `tests/conformance/*.json` fixtures byte-for-byte**.
- Node inputs: a `VisualRecipe` or a `VisualIntentDocument`, optionally a `ReferenceMix`, plus `prompt_mode` and the taxonomy bundle.
- Node outputs: `prompt` (STRING), `structured_prompt` (`StructuredPromptDocument`), `visual_intent` (`VisualIntentDocument`, `form: "full"`), `reference_mix` (persisted `ReferenceMix`).

**Explicitly out of scope — the core-not-UI rule.**

The node exposes the **core**, never the UI. Specifically, the node ships **none** of:

| Not in the node | Why |
|---|---|
| The Unified Modal, browse tiles, cards, chip editor, mixer panel | `src/ui/**` is browser-only; a graph node has no exploration surface |
| Provider search, `src/providers/**`, any network access | The node is a **pure transform**. Retrieval stays in the web app |
| Analyzers, embeddings, rerankers, `src/ai/**` backends | Backends are host-supplied; the node does not smuggle in an inference dependency |
| Interactive conflict resolution | A conflict arrives already resolved in the recipe, or it surfaces as a **visible blocked slot** with its `conflict_id`. The doctrine does not weaken because nobody is watching |
| A prompt-preset library | The node consumes a `VisualRecipe`; it does not host strings (`D10`) |

**Definition of done.**

| Id | Criterion |
|---|---|
| `DOD-CU-1` | Round-trip: `visual_intent` + `reference_mix` exported from the web app, fed into the node, reproduce the **identical** `prompt` string for the same taxonomy version and mode (INV-FMT-1) |
| `DOD-CU-2` | The node passes the full `tests/conformance/*.json` fixture set — the same file the web app passes |
| `DOD-CU-3` | An unresolved conflict produces a visible node warning carrying the `conflict_id` and a `blocked[]` entry; no value is auto-picked and none is dropped (INV-MIX-2) |
| `DOD-CU-4` | The node makes zero network requests, verified by running it with egress blocked |
| `DOD-CU-5` | `taxonomy_version` and `formatter_version` are present in every `structured_prompt` output, so a graph re-run against a newer taxonomy is diagnosable |
| `DOD-CU-6` | Sidecar availability is **probed at node load** and reported in the node's status, never assumed. Whether a given ComfyUI install has a usable Node runtime varies (UNVERIFIED) |

**Risks.**

| Risk | Mitigation |
|---|---|
| The Python fallback drifts from the JS core | Divergence is a conformance test failure, not a field discovery. The fixtures are the contract; neither implementation is allowed to be "the real one" |
| The node grows a UI | This section's out-of-scope table is a merge blocker. A node that browses references is a second product |
| Node ships before the pillars are proven, because a node is a nice demo | The gate in §4 is a precondition, not a checklist to fill in afterwards |

---

## 3. Dependency graph — what unblocks what

```
                    ┌─────────────────────────────────────────────────────────┐
   CONTRACT LAYER   │  docs/schemas/*.json   +   data/taxonomy/*.json         │
   (v0.1, frozen)   │  the cross-language truth; nothing above may fork it    │
                    └───────────────┬─────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        v                           v                           v
 ┌──────────────┐          ┌────────────────┐          ┌────────────────┐
 │ core/        │          │ prompt/        │          │ tests/         │
 │ taxonomy     │─────────>│ prompt-engine  │          │ conformance    │
 │ visual-intent│          │ formatter-     │<─────────│ golden fixtures│
 │ reference-mix│          │   generic      │          └────────────────┘
 │ explorer-    │          └────────────────┘
 │   state      │                  │
 │ visual-recipe│                  │
 └──────┬───────┘                  │
        │                          │
        │  ┌───────────────────────┴──────────────┐
        │  │  v0.1 PROMPT COMPOSER (generic mode) │
        │  └──────────────────────────────────────┘
        v
 ┌──────────────────────┐     ┌──────────────────────┐     ┌───────────────────┐
 │ search/query-builder │────>│ search/metadata-     │────>│ v0.1 KEYWORD +    │
 │ (4 modes, 1 Query)   │     │   search + keyword   │     │ METADATA SEARCH   │
 └──────────────────────┘     └──────────┬───────────┘     └───────────────────┘
                                         │
   ┌─────────────────────────────────────┼──────────────────────────────┐
   │                                     │                              │
   v                                     v                              v
┌──────────────────┐          ┌─────────────────────┐        ┌─────────────────────┐
│ v0.2 providers/  │          │ v0.3 ai/embedding + │        │ v0.5 SEARCH BY      │
│ openverse,       │─────────>│ semantic-search +   │───────>│ DIFFERENCE          │
│ wikimedia        │  corpus  │ fusion-ranker       │ divers-│ (keep / change /    │
│ + license-guard  │          │ + eval harness      │  ity   │  change_targets)    │
└────────┬─────────┘          └──────────┬──────────┘        └─────────────────────┘
         │                               │
         │ approved refs                 │ image-anchored query
         v                               v
┌──────────────────┐          ┌─────────────────────┐
│ v0.2 ai/analyzer │          │ v0.4 analyzer_video │
│ (image)          │─────────>│ shot boundaries,    │
│ attribute_meta   │  ports   │ keyframes, camera   │
└──────────────────┘  reused  │ motion, timespans   │
                              └──────────┬──────────┘
                                         │
                                         v
                              ┌─────────────────────┐
                              │ v0.4 MOTION MIXING  │
                              │ motion ⊕ camera_    │
                              │ motion, no conflict │
                              └─────────────────────┘

              ═══════════ PROMOTION GATE (§4) ═══════════
                                  │
                                  v
                   ┌──────────────────────────────┐
                   │ ComfyUI phase                │
                   │ dist/uvrc-core.mjs + sidecar │
                   │ 4 outputs, zero network      │
                   └──────────────────────────────┘
```

**Hard edges (a violation of any of these is a sequencing bug):**

| Edge | Reason |
|---|---|
| contract → everything | Field names, enums and id grammars are fixed once. A module that invents a synonym has forked the contract |
| `taxonomy` → keyword search | `aliases[]` and `related[]` *are* the AI-free search engine |
| `reference-mix` → prompt composer | `blocked[]` cannot exist without conflict detection |
| v0.2 providers → v0.3 embeddings | Embedding a 400-item seed library measures nothing. Semantic ranking needs a real corpus |
| v0.2 analyzer ports → v0.4 video analyzer | The video analyzer is a second adapter on a proven port, not a new subsystem |
| v0.3 diversity/MMR → v0.5 difference | CHANGE is a diversity problem with an overlap penalty and a presence requirement attached, never a value exclusion (`D9`) |
| v0.1 `visual-recipe` → ComfyUI phase | A recipe is the node's natural input; without it the node has no way to receive a combination |
| **All of v0.1–v0.5 → ComfyUI phase** | §4 |

**Soft edges (parallelisable):** licence badges (v0.1 UI) and the License Guard state machine (v0.2 logic); the eval harness scaffolding (v0.3) and the golden-query authoring (can begin at v0.1); the taxonomy content expansion (continuous, governed by `RSK-04`).

---

## 4. The promotion gate to ComfyUI

> **The rule.** The ComfyUI node is not started until the web MVP has *demonstrated* all five identity pillars against named, testable criteria, plus the cross-cutting criteria in `GATE-X`. "Demonstrated" means a green test and a recorded human walkthrough — not a design intent, not a partially wired panel.

A pillar is either green or the gate is closed. There is no partial credit, because each pillar removed is exactly one step back toward the prompt builder the brief forbids.

### 4.1 GATE-P1 — Unified Modal

| Id | Acceptance criterion | Evidence |
|---|---|---|
| `GATE-P1-a` | Text, image, video and browse all operate inside one modal. The application contains **no** route, page or view dedicated to image search or video search | Route inventory test + `D7` review |
| `GATE-P1-b` | A scripted `text → image → browse → video → text` sequence leaves `intent`, `pinned_reference_ids`, `mix`, `difference`, `query.filters` byte-identical and restores the typed text (INV-EXP-1) | `DOD-01-4` |
| `GATE-P1-c` | The modal does not close on search, on opening a card, or on a mode switch (`D8`) | Scripted UI test |
| `GATE-P1-d` | `back()`/`forward()` restore mode, query, filters and results, and do **not** touch pins, mix, or (by default) intent (INV-EXP-3) | `DOD-05-6` |

### 4.2 GATE-P2 — Visual Intent

| Id | Acceptance criterion | Evidence |
|---|---|---|
| `GATE-P2-a` | All four input kinds (text, image, video, reference card) produce the same 20-key `VisualIntent`, all keys required, `additionalProperties: false` | Schema conformance |
| `GATE-P2-b` | Every chip is editable, deletable, lockable and swappable via `alternatives[]`; a locked chip survives `applyMix`, re-analysis and expansion untouched | Unit + UI test |
| `GATE-P2-c` | `IntentChip` is an object with `source`, `ref_id`, `confidence`, `evidence` — never a bare string (`D6`) | Schema (the type is not expressible as a string) |
| `GATE-P2-d` | Two-level confidence is live: per-chip values and the per-category `confidence` map, recomputed on load, never trusted from storage | `DOD-01-8` + derived-cache test |
| `GATE-P2-e` | Lens is never asserted as fact end to end: `lens.35mm_like` → `"35mm-like perspective"` → `hedged: true` (INV-LENS-1/2, `D16`) | `DOD-01-1` |

### 4.3 GATE-P3 — Reference Decomposition

| Id | Acceptance criterion | Evidence |
|---|---|---|
| `GATE-P3-a` | Every reference card exposes `USE`, the 8 `EXTRACT` groups, and `EXPLORE`; no card is reduced to a single "Use" button (`D2`) | UI inventory test |
| `GATE-P3-b` | EXTRACT groups expand to categories **before** reaching `ReferenceMix.use`; `use` never stores a group name | Unit test |
| `GATE-P3-c` | `subject`, `appearance` and `action` are absent from EXTRACT — EXTRACT takes *how it looks*, not *who is in it* | Constant-table test |
| `GATE-P3-d` | Browse tiles render `visual_hint` thumbnails; the taxonomy is never presented as a text-only tree (`D18`) | UI test + `DOD-01-2` |

### 4.4 GATE-P4 — Selective Inheritance

| Id | Acceptance criterion | Evidence |
|---|---|---|
| `GATE-P4-a` | Use case S1 completes with `ai.enabled = false`: composition from A, clothing from B, in one session, one modal | `DOD-01-3` |
| `GATE-P4-b` | Partial contribution works at sub-category granularity: `exclude: ["clothing.beanie"]` takes the outfit but not the hat; `only[]` applies before `exclude[]` | Unit + UI test |
| `GATE-P4-c` | Every prompt fragment traces to `{ref_id, chip_id, source_category, value}`; removing one reference removes exactly its fragments (`D20`) | `DOD-01-7` |
| `GATE-P4-d` | `source: "user"` and `locked: true` chips are immovable: `applyMix` may add alongside them and may raise a conflict against them, never remove or rewrite them | Unit test |

### 4.5 GATE-P5 — Reference Mixing

| Id | Acceptance criterion | Evidence |
|---|---|---|
| `GATE-P5-a` | ≥ 3 references contribute to one intent simultaneously, each with `weight`, `priority`, `pinned`, `role` | UI walkthrough |
| `GATE-P5-b` | A conflict is **detected, surfaced and human-resolved**: both values remain in the intent, both thumbnails render side by side, the winner is chosen by click (`D4`, `D5`, INV-MIX-2) | `DOD-01-5` |
| `GATE-P5-c` | `auto_resolve` defaults `false`; `on_unresolved` defaults `"block"`; `"highest_priority"` and `"drop"` are opt-in and **visibly indicated** when active | Config + UI test |
| `GATE-P5-d` | `cfl_` ids are deterministic, so a resolution survives recomputation of the mix | Unit test |
| `GATE-P5-e` | `dominance` remembers "which should be dominant?" instead of re-asking on every edit | Unit test |
| `GATE-P5-f` | Motion mixing works across two videos with no conflict, by construction (`use: ["motion"]` ⊕ `use: ["camera_motion"]`) | `DOD-04-1` |

### 4.6 GATE-X — Cross-cutting criteria

These are not pillars but they gate the node just as hard, because the node inherits them.

| Id | Acceptance criterion |
|---|---|
| `GATE-X-1` | **AI-OFF completeness = 100 %** across the golden query set (INV-AI-1). The node must be able to assume a working, model-free core |
| `GATE-X-2` | **No hardcoded model name** anywhere outside adapter config (INV-AI-2), verified by a source scan |
| `GATE-X-3` | **Byte-determinism** of `formatPrompt` across runs and machines (INV-FMT-1). Without this, `DOD-CU-1` is unprovable |
| `GATE-X-4` | **Purity lint green**: nothing under `src/core/**` or `src/prompt/**` touches `window`, `document`, `fetch`, `localStorage`, `node:` or `import.meta.url`. The node is a packaging exercise only if this holds |
| `GATE-X-5` | **Coupling prohibitions hold**: search does not import prompt; prompt does not import UI; UI does not implement prompt logic (`D13`) |
| `GATE-X-6` | **Licence integrity**: INV-LIC-1/2/3 green; no unverified reference in any default result set (`D14`) |
| `GATE-X-7` | **No binaries**: INV-REF-2 green across code, fixtures, recipes and the vector sidecar (`D15`) |
| `GATE-X-8` | `VisualRecipe` save/load round-trips a full combination, including per-chip provenance and frozen snapshots (INV-RCP-1). The recipe is the node's input; if it is lossy, the node inherits the loss |

**If the gate is not green:** the correct response is to finish the web MVP, never to build a node "to prove the concept". A node built over an unproven core is a second implementation of an unsettled contract, and it will fossilise whatever is wrong.

---

## 5. The shared-module contract between web and ComfyUI

The brief names the shared modules: *taxonomy, prompt engine, reference metadata, visual intent, reference mix, model formatter.* This section says exactly what "shared" means, so the node is a packaging step rather than a rewrite.

### 5.1 What is shared, and how

| Shared module | File(s) | Class | Shared as |
|---|---|---|---|
| Taxonomy | `src/core/taxonomy.js` + `data/taxonomy/*.json` | pure + data | Verbatim code and verbatim JSON |
| Visual intent | `src/core/visual-intent.js` | pure | Verbatim |
| Reference mix | `src/core/reference-mix.js` | pure | Verbatim |
| Visual recipe | `src/core/visual-recipe.js` | pure | Verbatim (the node's natural input) |
| Prompt engine | `src/prompt/prompt-engine.js` | pure | Verbatim |
| Model formatter | `src/prompt/formatter-generic.js` (+ future modes) | pure | Verbatim |
| Reference metadata | `src/reference/reference-manager.js`, `license-guard.js` | pure **except** `resolveMedia` / `runSourceValidation` | Verbatim minus those two functions (they need the network) |
| Explorer state | `src/core/explorer-state.js` | pure reducer | Verbatim; usable headlessly for tests and batch runs |
| **Contract** | `docs/schemas/*.json` + `tests/conformance/*.json` | contract | **The authority both sides obey** |

Not shared, ever: `src/ui/**`, `app/index.html`, `src/providers/**`, `src/ai/**` *backends* (the ports are shared; the backends are always host-supplied).

### 5.2 The five contract rules

| Rule | Statement |
|---|---|
| **C1 — One definition** | Every category enum, id grammar, arity entry, category→slot mapping and emit order is defined **once**, in `taxonomy-node.schema.json#/$defs`, and re-exported by `taxonomy.js`. Neither the web app nor the node may redeclare one. A duplicate definition is a merge blocker |
| **C2 — The fixtures are the truth** | `tests/conformance/*.json` maps `(intent, mix, taxonomy_version, mode) → expected StructuredPrompt → expected text`. Both implementations pass the same file byte-for-byte. Divergence is a test failure, never a field discovery |
| **C3 — Purity is machine-checked** | The architecture lint fails the build if shared code touches the DOM, network or filesystem. This is what makes "verbatim" true rather than aspirational |
| **C4 — Versions travel with the payload** | `schema_version` (MAJOR.MINOR), `taxonomy_version` and `formatter_version` are emitted in `StructuredPromptDocument` and stored in `VisualRecipe.integrity`. Readers accept any MINOR within a MAJOR and ignore unknown properties; they refuse or migrate a different MAJOR |
| **C5 — The core never learns about its host** | No `if (isComfyUI)`, no `if (isBrowser)`. Host differences are expressed as injected adapters and injected data, both of which the core receives and never constructs |

### 5.3 Direction of change

```
   schema change  ──> docs/schemas/*.json     (MAJOR/MINOR per §0.1 of the data model)
                        │
                        ├──> tests/conformance/*.json updated in the SAME commit
                        │
                        ├──> src/core/**, src/prompt/**  (both hosts get it for free)
                        │
                        └──> dist/uvrc-core.mjs rebuilt; node picks it up unchanged
```

A schema change that lands without a conformance-fixture update is rejected. This single rule is what keeps two hosts honest without a coordination meeting.

---

## 6. Post-v0.5 direction

Sequenced, but not scheduled. Each of these is a brief commitment ("Future") rather than a new idea, and each has a defined shape already present in the canonical model.

| # | Feature | Shape it already has | Why it is post-v0.5 |
|---|---|---|---|
| **1** | **Visual Recipe sharing** | `VisualRecipe` with `rcp_` id, monotonic `version`, frozen `ReferenceSnapshot[]`, `license_summary.attribution_block`, `integrity.content_hash`. Sharing = exporting that file and importing it elsewhere | Sharing a recipe exports other people's licence obligations. It ships only after the License Guard has been live long enough to trust `license_summary`, and `has_excluded: true` recipes must warn on open and must not export by default |
| **2** | **Reference comparison view** | `results.items[].differs_categories[]`, `matched_categories[]` and `Reference.visual_attributes` already carry everything a two-up or three-up diff needs | It is most valuable *after* difference search exists, because the natural entry point is "show me why these two are different" |
| **3** | **Alternative export formats** | `VisualRecipe.exports[].kind ∈ {prompt, structured_prompt, visual_intent, reference_mix, storyboard, shot_list, image_prompt, video_prompt}` — the last four are exactly this work | Storyboard and shot list are **multi-shot** artefacts, and a shot is a `VisualIntent`. The sequencing question (how several intents relate in time) is not answered by v1 of the data model and must not be improvised into it |
| **4** | **Local reference library indexing** | `PROVIDER_SOURCE` includes `local` and `user_upload`; `Reference.privacy.local_only`; `upl_` handles; `collections[]` | The privacy contract is strictest here: a `local_only` reference must be refused by every remote adapter, and indexing a user's disk is the largest surface for accidentally violating that. It ships after the egress boundary has v0.2–v0.4 of hardening behind it |
| **5** | Additional formatter modes (`flux`, `qwen_image`, `sd`, `gpt_image`, `minimax_h3`, `krea`) | `FORMATTER_MODE` is an open string; a mode is a formatter module plus optional `model_hints` keys on taxonomy nodes | Each mode needs its own conformance fixtures. They are cheap individually and expensive collectively; add them on demand, never speculatively |
| **6** | Additional providers | `PROVIDER_SOURCE` is open; the provider interface is three functions | Only providers whose terms permit metadata reuse. Never a scraper (`RSK-02`, and the brief's hard prohibitions) |

**Explicitly *not* on the post-v0.5 list, and not implied by it:** generation of images or video, multi-user accounts, cloud sync, chat as the primary interface, training or fine-tuning models, likeness/face matching, adaptive or personalised ranking. See §8 and [`PRODUCT_VISION.md §9`](./PRODUCT_VISION.md).

---

## 7. Risk register

Severity × likelihood is judged against the product's identity, not against engineering effort: a risk that costs a week is minor; a risk that turns the product into a prompt builder is critical.

| Id | Risk | Sev | Trigger to watch | Mitigation | Owner milestone |
|---|---|---|---|---|---|
| `RSK-01` | **Model licensing.** A candidate analyzer or embedding model turns out to carry a licence that forbids our use, or its terms change | High | Any model named in a config; any licence marked "research only"; any weights redistributed with the repo | (a) No weights ever live in this repository. (b) Adapters are swappable by config (INV-AI-2), so a model becoming unusable is a config change, not a rewrite. (c) Every adapter records its model licence in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) before it is enabled by default. (d) The AI-OFF path (INV-AI-1) means "no acceptable model exists today" still leaves a complete product | v0.2, v0.3 |
| `RSK-02` | **Provider API instability.** Openverse or Wikimedia change response shape, licence fields, rate limits, or terms | High | A rise in `license: "unknown"`; a spike in `license_review`; 4xx/5xx rates | (a) Thin provider adapters with recorded-response fixtures — drift fails a test instead of producing an unknown-licence reference. (b) Unclassifiable licences resolve to `unknown` and are excluded by default; ambiguity never resolves toward inclusion. (c) Provider failure degrades to the local library with a visible notice (`DOD-02-9`). (d) Identity is `(source, source_id)`, not a URL, so a URL scheme change is survivable (R1) | v0.2 |
| `RSK-03` | **Embedding cost and latency.** Embedding a real corpus is slow on a laptop; a hosted embedding service costs money and breaks local-first | High | kNN > 150 ms at 5,000 refs; first-run embedding time measured in minutes; any pressure to "just call an API" | (a) Embeddings are computed once per reference and cached under a model key; re-embedding is opt-in. (b) `vector_ref` keeps vectors out of documents; quantization (`f16`/`int8`) is a supported field. (c) Embedding is **optional** — `DOD-03-2` requires the whole golden set to work with it off. (d) External transmission requires explicit disclosure (`disclosed_at`), so a hosted embedder can never be enabled quietly | v0.3 |
| `RSK-04` | **Taxonomy sprawl.** The node count grows without bound; browse becomes unusable; conflict detection becomes noisy; two nodes mean the same thing | Med-High | > ~900 nodes; siblings with overlapping `aliases`; a category whose tile grid needs scrolling twice; new nodes without `description`/`prompt_fragment` | (a) A node is added only with `label`, `description`, ≥ 2 `aliases`, a `prompt_fragment`, a `parent` and a `sort_order` — an empty node is rejected in review. (b) `aliases[]` absorbs vocabulary variation; **a synonym is an alias, not a node**. (c) Alias-collision lint: an exact alias matching two nodes is either intentional-and-documented or a bug. (d) Deprecation is a first-class path (`deprecated` + `replaced_by` forces `deprecated: true`), so pruning never breaks stored intents. (e) Hierarchy lives in `parent`, never in ids (INV-TAX-1), so re-parenting during a cleanup costs nothing | continuous |
| `RSK-05` | **Scope creep back into "just a prompt builder".** The single most likely way this project fails | **Critical** | Any of `D1`–`D20`; any of the early-warning phrases in [`PRODUCT_VISION.md §10.2`](./PRODUCT_VISION.md) | (a) `D1`–`D20` are **release blockers**, not preferences. (b) The one-question drift test is applied to every PR: *can a user still take one third of A and one half of B, see the disagreement, decide it, and read the prompt backwards to the source and its licence?* (c) Mixing and conflict UI ship in **v0.1**, not last, so the differentiator can never be the thing that gets cut. (d) §8 of this document lists roadmap-level non-goals so a milestone cannot be re-scoped into a builder | every milestone |
| `RSK-06` | **Media URL rot.** Provider media URLs die; cards go blank; a saved recipe looks broken | Med | Rising `media_state: "gone"` | The five-rule policy: identity is `(source, source_id)`; a rotted recipe still produces the *same prompt* because intent and mix are pixel-free; `resolveMedia` re-resolves via the provider; attribution is stored **text** so credit survives a dead link; rot is never "fixed" by storing bytes (INV-REF-2) | v0.2 |
| `RSK-07` | **Analyzer quality disappoints and erodes trust in the whole product** | Med | Users deleting most proposed chips | AI output is a **proposal**: per-chip confidence, per-chip lock, `alternatives[]` swap menu, and full manual authoring via browse. A weak analyzer degrades to manual selection, which `DOD-01-3` already proves is a complete path | v0.2, v0.4 |
| `RSK-08` | **Evaluation overfitting.** Ranking is tuned to 40 golden queries and gets worse in reality | Med | An nDCG gain with no A/B agreement | Grade before tuning; never grade a result you just watched win; ≥ 20 blind A/B judgements required alongside any metric delta; treat an nDCG@10 difference below ~0.05 as noise (a rule of thumb, **UNVERIFIED** as a computed interval — compute a bootstrap CI before quoting any number externally) | v0.3 |
| `RSK-09` | **ComfyUI runtime variance.** The Node sidecar is unavailable in some installs | Med | Sidecar probe failures | Probe at node load and report in node status, never assume (`DOD-CU-6`); the Python fallback exists and is accepted only on byte-for-byte conformance | ComfyUI phase |
| `RSK-10` | **Privacy incident.** User media is transmitted without disclosure | **Critical** | Any adapter call carrying media with `external_transmission.allowed === false` | Egress boundary is a single choke point; `local_only` references are refused by every remote adapter; disclosure is required *before* transmission and stamps `disclosed_at`; `DOD-02-8` tests it. An `upl_` handle **never** implies bytes left the device | v0.2 onward |
| `RSK-11` | **v0.1 is too large and gets salami-sliced.** "Ship the modal now, mixing in v0.1.1" | High | Any proposal to move mixing, conflict UI or the composer out of v0.1 | v0.1's definition of done is atomic. The milestone is large because the *product* is the pipeline; a partial pipeline is a different, worse product (`D3`). Slice by *reference-library size and taxonomy depth*, never by pipeline stage | v0.1 |

---

## 8. Roadmap non-goals

These exist so the roadmap itself cannot drift. They are additional to — not a replacement for — the product non-goals in [`PRODUCT_VISION.md §9`](./PRODUCT_VISION.md) and the `D1`–`D20` drift symptoms.

| Id | Non-goal | Why |
|---|---|---|
| `NG-R1` | **No milestone is declared done by demo.** A walkthrough is evidence *alongside* a green test suite, never instead of one | Every `DOD-*` above is testable on purpose |
| `NG-R2` | **No milestone may weaken an invariant to ship.** If v0.4 cannot meet INV-VID-1, v0.4 slips; the invariant does not | Invariants are the product's definition, not its budget |
| `NG-R3` | **No milestone introduces a required model.** AI-OFF completeness is re-tested at v0.2, v0.3, v0.4 and v0.5 | `D11`, INV-AI-1 |
| `NG-R4` | **No milestone introduces media byte storage**, in the repo, in a cache, in a fixture, or in a recipe | `D15`, INV-REF-2 |
| `NG-R5` | **No feature is scheduled before the schema expresses it.** Multi-anchor difference and storyboard sequencing are post-v0.5 precisely because v1 of the data model does not express them, and the model will not be improvised into shape mid-milestone | Contract-first (C1, C2) |
| `NG-R6` | **The ComfyUI node is never pulled forward** as a demo, a spike, or a "thin prototype" | §4. A node over an unproven core fossilises the wrong contract |
| `NG-R7` | **No provider is added that requires scraping**, or whose terms do not permit metadata reuse — at any milestone, including post-v0.5 | Brief hard prohibition |
| `NG-R8` | **No "simplified mode"** that hides the mix panel, the conflict UI, or the chip editor to make onboarding easier | `D3`, `D6`. The simplification *is* the competitor |
| `NG-R9` | **No milestone ships a second screen** for image or video | `D7`, Pillar 1 |
| `NG-R10` | **No date is added to this document.** Sequence and exit criteria are the commitment; dates would invite trading criteria for calendar | §0.4 |

---

## 9. Where to go next

| If you want to know… | Read |
|---|---|
| Why this product exists and what it must never become | [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) |
| Exact field names, enums, invariants and worked examples | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`schemas/`](./schemas/) |
| Module boundaries, adapters, the egress boundary, the ComfyUI reuse plan | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Retrieval, fusion, difference search, the evaluation harness | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| Licence classification, the guard state machine, attribution templates | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| How we differ from existing tools, and which patterns we refuse | [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) |
| Third-party code and model licence review | [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |
