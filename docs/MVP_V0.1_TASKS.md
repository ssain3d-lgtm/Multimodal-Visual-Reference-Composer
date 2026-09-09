# MVP v0.1 — Implementation Task List

**Purpose:** the executable build plan for `v0.1` — 72 numbered tasks with exact file paths, dependencies, acceptance criteria and size estimates — so that the complete AI-free product can be built without re-deriving a single design decision.

> ### 한국어 요약
> 이 문서는 `v0.1`(AI 없이도 완결된 제품)을 만들기 위한 구현 과제 목록입니다. 과제 72개를 모듈별로 묶고, 각 과제마다 **생성/수정할 정확한 파일 경로 · 선행 과제 · 수용 기준 · 규모(S/M/L)** 를 못 박아 두었으므로 설계를 다시 유도할 필요가 없습니다.
> 범위는 통합 모달(텍스트·이미지·비디오·브라우즈 4모드), 택소노미 로더와 키워드/메타데이터 검색, VisualIntent 편집, 레퍼런스 분해와 선택적 상속, 충돌 감지·해결 UI, StructuredPrompt와 generic 포매터, 라이선스 가드, 로컬 프로바이더까지입니다. 모델 호출·임베딩·실제 영상 분석·Search by Difference의 CHANGE 축은 **v0.1에 포함되지 않습니다**.
> 마지막 두 절은 다섯 기둥(5 pillars)에 묶인 **완료 정의 체크리스트**와, [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6의 여정을 그대로 걷는 **수동 QA 스크립트**입니다.

---

## 0. Document contract and precedence

| Rank | Source | Role |
|---|---|---|
| 1 | `BRIEF.md` (the canonical product brief) | product authority; never contradicted |
| 2 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/) | every field name, enum, id grammar and invariant used below |
| 3 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | module boundaries and the public API signatures each task implements |
| 4 | [`ROADMAP.md`](./ROADMAP.md) §2.1 | what belongs in v0.1 at all; `DOD-01-1 … DOD-01-12` |
| 5 | **this document** | the order of work, the file-level breakdown, the per-task acceptance bar |

Depth references used throughout: [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) (regions R1–R12, the 34-event table, conflict copy), [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) (`KEYWORD_SCORES`, `REL`, fusion), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) (`LP-16` … `LP-27`), [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6 (the end-to-end journey the QA script walks).

**This document invents no field, enum value, category key or id prefix.** Names it introduces — task ids, size classes, wave numbers, two added source files, the seed tranches, QA step ids — are listed in §9.

---

## 1. What v0.1 is

> **v0.1 is not a prototype of the product. It is the product with the models removed.** ([`ROADMAP.md`](./ROADMAP.md) §2.1)

Every one of the five pillars is demonstrable at v0.1 with `ai.enabled = false` and zero inference calls, over a local, licence-clean, metadata-only seed library. If a pillar can only be shown with a model attached, the pillar was built as a model feature — the exact failure this repository exists to prevent.

The v0.1 pipeline, end to end, with the AI-free mechanism named at each arrow:

```
 TEXT ──keyword index over aliases/related──┐
 IMAGE ─upload + MOCK analyzer fixture─────┤
 VIDEO ─upload + window + MOCK fixture─────┼──► VisualIntent  (chips, 19 arrays + confidence)
 BROWSE ─taxonomy tiles with thumbnails────┘         │
                                                     ▼
                                   metadata search over visual_attributes
                                   (filters exclude · targets rank · REL credit)
                                                     │
                                                     ▼
                             Reference cards ──► USE / EXTRACT×8 / EXPLORE×9
                                                     │
                                                     ▼
                                  ReferenceMix  (use · only · exclude · priority · weight)
                                                     │  applyMix
                                                     ▼
                             conflicts DETECTED and SURFACED — never auto-picked
                                                     │  human decides
                                                     ▼
                       buildStructuredPrompt → 13 slots → formatPrompt(…, "generic")
                                                     │
                                                     ▼
                                    VisualRecipe (intent + mix + frozen snapshots)
```

---

## 2. Conventions used by every task

| Column | Meaning |
|---|---|
| **ID** | `T-NN`. Stable. Referenced by dependencies, by the DoD table (§7) and by commit messages. |
| **Title** | The unit of work. One task = one reviewable pull request. |
| **Path** | The exact file(s) created or changed. A task that touches no listed file is a task that has not been specified. |
| **Deps** | Task ids that must be **merged** first. `—` means it can start in wave 1. |
| **Size** | `S` ≤ ½ day · `M` 1–2 days · `L` 3–5 days, for one engineer who has read the docs. Estimates, not measurements (UNVERIFIED). |

Acceptance criteria follow each table, keyed by id. Every criterion is **mechanically checkable** — a test name, a lint rule, or an observation a reviewer can make in under a minute — except where a criterion is explicitly a human QA step.

Global rules binding on every task:

1. **No build step.** ES modules, loaded directly. `app/index.html` uses `<script type="module">`.
2. **`src/core/**` and `src/prompt/**` contain no `window`, `document`, `fetch`, `localStorage`, `node:` — checked by T-02.
3. **`src/search/**` never imports `src/prompt/**`, and vice versa** — checked by T-02.
4. **No binaries anywhere in the repository**, including test fixtures. Thumbnails are URLs (INV-REF-2).
5. Every mutator in Core is **immutable** and returns a new root object.
6. A task is done when its tests are in `tests/` and green, not when the code "works locally".

---

## 3. Module map for v0.1

```
app/index.html                          T-04
src/core/taxonomy.js                    T-05 T-06 T-07
src/core/visual-intent.js               T-09 … T-15
src/core/reference-mix.js               T-16 … T-21
src/core/explorer-state.js              T-22 … T-28  T-51
src/core/visual-recipe.js               T-27
src/core/hash.js            (added)     T-03
src/search/query-builder.js             T-34
src/search/metadata-search.js           T-29 T-30 T-31 T-32 T-33
src/search/semantic-search.js           T-35   (NULL path only in v0.1)
src/search/fusion-ranker.js             T-35
src/prompt/prompt-engine.js             T-36 T-37 T-38
src/prompt/formatter-generic.js         T-39
src/reference/reference-manager.js      T-41 T-42 T-43
src/reference/license-guard.js          T-44 T-45 T-46
src/providers/local.js                  T-47
src/providers/{openverse,wikimedia}.js  T-48   (interface only, throws)
src/ai/{analyzer,embedding,reranker}.js T-49 T-50 T-51
src/ui/explorer-modal.js                T-52 T-53 T-54 T-55 T-63
src/ui/intent-chips.js                  T-56
src/ui/reference-card.js                T-57 T-58
src/ui/reference-detail.js              T-59
src/ui/reference-mixer.js               T-60 T-61
data/taxonomy/*.json                    T-08 T-67
data/references.json                    T-65 T-66
data/presets.json                       T-67
tools/ingest-seed.mjs       (added)     T-64
tests/**                                T-01 T-02 and the test half of every task
```

---

## 4. The tasks

### 4.1 Group A — Scaffold and enforcement (4 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-01 | Test harness and npm scripts, no build step | `package.json`, `tests/helpers/{run,assert,fixtures}.mjs`, `README.md` | — | S |
| T-02 | Architecture dependency lint | `tests/arch/dependency-rule.test.mjs` | T-01 | M |
| T-03 | Dependency-free SHA-1 / SHA-256 for the pure core | `src/core/hash.js`, `tests/unit/hash.test.mjs` | T-01 | S |
| T-04 | App shell: the one `<dialog>`, taxonomy fetch, static serve | `app/index.html`, `tests/helpers/serve.mjs` | T-01 | S |

**T-01** — `npm test` runs `node --test tests/**/*.test.mjs` with zero transpilation. `ajv` (draft 2020-12) is the only devDependency; if `npm install` is unavailable the harness falls back to the Python `jsonschema` path already used to validate [`schemas/`](./schemas/) and says so in its output rather than skipping silently. `README.md` states the run command, the no-build-step rule and the AI-off default.

**T-02** — Parses every `import` specifier under `src/**` and fails on: any cell marked `✗` in [`ARCHITECTURE.md`](./ARCHITECTURE.md) §1.3; any `src/ai/**` import outside `src/core`; any occurrence of `window`, `document`, `fetch(`, `localStorage`, `node:` under `src/core/**` or `src/prompt/**`; any import of a concrete AI backend anywhere. The lint runs in `npm test`, not as a separate optional command — a rule that must be remembered is a rule that erodes.

**T-03** — Pure, synchronous, no `node:crypto`, no WebCrypto (async, and Core must stay synchronous and environment-agnostic). Test vectors: the standard SHA-1/SHA-256 empty-string and `"abc"` digests, plus a golden vector for `conflictId("camera_angle", null, ["camera_angle.high_angle","camera_angle.low_angle"])`. Flagged as an added file in §9.

**T-04** — Contains a `<dialog>`, one ESM import of `src/ui/explorer-modal.js`, a `fetch` of the ten `data/taxonomy/*.json` files plus `data/presets.json` and `data/references.json`, and **no product logic**. A reviewer can delete `app/index.html` and every test still passes.

### 4.2 Group B — Core: taxonomy (4 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-05 | The six frozen tables, defined once | `src/core/taxonomy.js`, `tests/unit/taxonomy-tables.test.mjs` | T-01 | S |
| T-06 | `loadTaxonomy` — validation, `children` cache, conflict closure, cycle detection | `src/core/taxonomy.js`, `tests/unit/taxonomy-load.test.mjs` | T-05 | M |
| T-07 | Taxonomy query API and fragment resolution | `src/core/taxonomy.js`, `tests/unit/taxonomy-query.test.mjs` | T-06 | M |
| T-08 | Taxonomy data completion pass + validator extension | `data/taxonomy/*.json`, `tests/validate-taxonomy.mjs` | T-06 | M |

**T-05** — Exports `VISUAL_CATEGORIES` (20, brief order), `INTENT_CATEGORIES` (19), `PROMPT_SLOTS` (13), `CATEGORY_ARITY` (7 `single_dominant` / 13 `multi`), `CATEGORY_TO_PROMPT_SLOT` (20 → 13), `PROMPT_SLOT_EMIT_ORDER`, `EXTRACT_GROUPS` (8 groups covering 17 categories). A test asserts each table is **deep-equal to the `const` carried by `docs/schemas/taxonomy-node.schema.json#/$defs`** — the schema is the source, this module is the mirror, and drift fails the build. All exports `Object.freeze`d.

**T-06** — Validates INV-TAX-1/2/3/4/5/6 on every node and throws with the offending id; recomputes `children` from `parent` and never trusts the stored array (derived-cache rule 0.3); builds the symmetric closure of `conflicts_with`; throws on a `parent` cycle naming the cycle. Loads all 736 shipped nodes in < 50 ms (UNVERIFIED target, measured by T-72).

**T-07** — `get/has/byCategory/roots/children/ancestors/related/resolve/fragment/negativeFragment/arity/exclusivityGroup/conflictsWith/mediaScope/version` per [`ARCHITECTURE.md`](./ARCHITECTURE.md) §2.1. `fragment(id, mode)` resolves `model_hints[mode] ?? prompt_fragment ?? label ?? humanize(id)`; an unknown mode falls back to `prompt_fragment` without throwing. `resolve()` follows the `replaced_by` chain and reports `{rewritten, from}`. `byCategory` sorts `sort_order` asc then id asc, deterministically.

**T-08** — Extends `tests/validate-taxonomy.mjs` with: the lens hedge rule in both directions (INV-TAX-3), `camera_motion ⇒ media_scope ["video"]`, `still_inferable` only in `motion`, `replaced_by ⇒ deprecated`, and an `exclusivity_group` census per category. Data pass: every `single_dominant` category's nodes are explicitly either grouped or declared modifiers (`exclusivity_group: null` is a *decision*, not an omission); ≥ 90 % of nodes carry ≥ 2 aliases and a non-empty `description` (`DOD-01-2`). `visual_hint` wiring is T-67 (it needs the seed library).

### 4.3 Group C — Core: VisualIntent (7 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-09 | `EMPTY_INTENT`, chip construction, `targetArrayFor` | `src/core/visual-intent.js`, `tests/unit/intent-shape.test.mjs` | T-07 | S |
| T-10 | `normalizeVisualIntent` — the 8-step contract | `src/core/visual-intent.js`, `tests/unit/intent-normalize.test.mjs` | T-09 | L |
| T-11 | `aggConfidence` / `recomputeConfidence` | `src/core/visual-intent.js`, `tests/unit/intent-confidence.test.mjs` | T-10 | S |
| T-12 | Chip mutators: add / remove / update / lock / negate / swap | `src/core/visual-intent.js`, `tests/unit/intent-mutators.test.mjs` | T-11 | M |
| T-13 | Provenance operations: `removeContributionsOf`, `diffIntent`, `mergeIntent` | `src/core/visual-intent.js`, `tests/unit/intent-provenance.test.mjs` | T-12 | M |
| T-14 | Compact profile, document envelope, round-trip | `src/core/visual-intent.js`, `tests/unit/intent-profiles.test.mjs` | T-10 | M |
| T-15 | `validateIntent` — the invariant checker | `src/core/visual-intent.js`, `tests/unit/intent-invariants.test.mjs` | T-12 | M |

**T-09** — `EMPTY_INTENT()` returns exactly 20 keys, 19 empty arrays and `confidence: {}`; a test asserts the key set equals `INTENT_CATEGORIES ∪ {confidence}` and that adding or removing one key fails schema validation. `targetArrayFor(category, value)` routes `props.*` to `scene`.

**T-10** — Implements steps 1–8 verbatim. Property tests: **idempotent** (`normalize(normalize(x))` deep-equals `normalize(x)` over the fuzz corpus) and **total** (never throws on any of ≥ 500 malformed ingest documents; an unknown taxonomy id becomes a `custom:true` chip, never an error — `DOD-01-8`). Deduplication is **agreement**: max confidence, unioned `contributors[]`, OR-ed `locked`, earliest `created_at`. Returns `{intent, rewrites, warnings}`; `result.intent` is exactly the canonical `VisualIntent`.

**T-11** — `max`, not mean; `1.0` when any chip in the category is `locked` or `source:"user"`; absent entry for an empty array; rounded to 3 dp. A test asserts confidence is recomputed after every mutator, so a stored value can never be trusted (rule 0.3).

**T-12** — All immutable. `addChip` normalizes on the way in and re-sorts `(order asc, confidence desc, value asc)`. `removeChip` accepts a `chip_id` or `{category,value}`. `swapAlternative` moves the chosen `alternatives` entry into `value`/`label` and demotes the previous value into `alternatives`. **Refusal test:** no mutator except an explicit user action may modify a chip with `locked:true` or `source:"user"`.

**T-13** — `removeContributionsOf(intent, reference_id)` removes exactly the chips whose `ref_id` is that reference *and* strips it from `contributors[]` on shared chips, leaving `user`/`locked` chips untouched. `mergeIntent(base, incoming, policy)` treats `user` and `locked` chips as immovable. `diffIntent` returns `{added, removed, changed}` keyed by category — this is what the history and the "what did this reference give me" UI read.

**T-14** — `compactVisualIntent` drops `custom` and `negate` chips **with a warning** and returns unique values per category. Round-trip test: `compact → normalizeVisualIntent → compactVisualIntent` is byte-identical (`DOD-01-9`). `wrapIntentDocument` emits `VisualIntentDocument` with `form` as the discriminator and `schema_version: "1.0"`.

**T-15** — Returns `Violation[]`, never throws. Covers INV-INT-2/3/4, INV-LENS-1, INV-PROPS-1, INV-VID-1, INV-VID-3. Each violation carries `{code, chip_id, category, message}` so the UI can point at the chip. Runs in dev and in tests; not on every keystroke in production.

### 4.4 Group D — Core: ReferenceMix (6 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-16 | Mix CRUD, `INV-MIX-1`, `expandUse` | `src/core/reference-mix.js`, `tests/unit/mix-crud.test.mjs` | T-09 | M |
| T-17 | `applyMix` — the 7-step merge | `src/core/reference-mix.js`, `tests/unit/mix-apply.test.mjs` | T-16, T-12 | L |
| T-18 | `detectConflicts` — three kinds, modifier escape, dominance first | `src/core/reference-mix.js`, `tests/unit/mix-conflicts.test.mjs` | T-17 | L |
| T-19 | `conflictId` — deterministic and survivable | `src/core/reference-mix.js`, `tests/unit/mix-conflict-id.test.mjs` | T-18, T-03 | S |
| T-20 | `resolveConflict` / `ignoreConflict` / `setDominance` | `src/core/reference-mix.js`, `tests/unit/mix-resolve.test.mjs` | T-19 | M |
| T-21 | `persistMix` and the interop minimum | `src/core/reference-mix.js`, `tests/unit/mix-interop.test.mjs` | T-16 | S |

**T-16** — `addEntry` upserts (repeated EXTRACT on one card **unions `use`**, never creates a second entry, never replaces); `reference_id` unique across entries; `expandUse` resolves `"*"` to the categories that reference actually has values in, **at apply time**, and rejects any group name (`use` never stores a group name).

**T-17** — Pure and deterministic: same inputs ⇒ identical intent and identical conflict ids. Entries processed `(priority DESC, array position ASC)`. Contributed chip confidence is `clamp01((attribute_meta[v].confidence ?? 0.7) × entry.weight)`. `only` applies **before** `exclude`. `props.*` lands in `scene` with `origin_category:"props"`. Step 1 test: chips with `source:"user"` or `locked:true` are never removed or rewritten by any mix.

**T-18** — `arity`: a `single_dominant` category with ≥ 2 distinct **non-modifier** values from ≥ 2 distinct sources. `exclusivity_group`: a `multi` category with ≥ 2 values sharing a non-null group (`group` required on the record). `explicit`: `conflicts_with`, symmetric, may cross categories. Three negative tests are mandatory and named in the suite: the same value from two references is **agreement**; a modifier in a single-dominant category (`weather.fog`, `camera_angle.dutch_tilt`, `pose.arms_crossed`) never conflicts; two different categories never conflict — the brief's second success case (`motion` from video A, `camera_motion` from video B) produces zero conflicts. `dominance` is consulted **first** and suppresses the open conflict. Nothing is deleted and nothing is auto-picked (`DOD-01-5`).

**T-19** — `cfl_ + sha1(category + "|" + (group ?? "") + "|" + sorted(values).join(",")).slice(0,12)`. Test: recomputing the mix after an unrelated edit reproduces the same id, so a human's resolution survives recomputation.

**T-20** — `resolveConflict` refuses any `strategy` other than `"user"` while `auto_resolve === false`; requires `winner_value` unless `strategy === "keep_both"` (INV-MIX-3); materialises a `mix_resolution` chip with `ref_id` = winner and **leaves the losing chip in `intent`, marked unused**. `ignoreConflict` records an explicit human decision to coexist. `setDominance` resolves and remembers.

**T-21** — The brief's literal `{ "references": [ { "reference_id": "img_A", "use": ["composition","camera_angle"] } ] }` validates against `reference-mix.schema.json` **unchanged** (INV-MIX-0, `DOD-01-1`); `persistMix` adds `schema_version` and a `mix_` id and validates against `#/$defs/persisted`.

### 4.5 Group E — Core: ExplorerState (7 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-22 | `initExplorerState` and the full state shape | `src/core/explorer-state.js`, `tests/unit/explorer-init.test.mjs` | T-09, T-16 | M |
| T-23 | Reducer core + events 1–5, 24–26, 30, 34 | `src/core/explorer-state.js`, `tests/unit/explorer-query.test.mjs` | T-22 | L |
| T-24 | Chip and proposal events (6–11) | `src/core/explorer-state.js`, `tests/unit/explorer-chips.test.mjs` | T-23, T-12 | M |
| T-25 | Reference and mix events (12–21) | `src/core/explorer-state.js`, `tests/unit/explorer-mix.test.mjs` | T-24, T-20 | L |
| T-26 | History: push, truncate-forward-tail, back/forward, `restoreEntry` | `src/core/explorer-state.js`, `tests/unit/explorer-history.test.mjs` | T-23 | M |
| T-27 | Compose / preset / recipe events (22–23, 27–29) and `visual-recipe.js` | `src/core/explorer-state.js`, `src/core/visual-recipe.js`, `tests/unit/recipe.test.mjs` | T-25, T-38 | L |
| T-28 | `assertExplorerInvariants` + property run over every event | `src/core/explorer-state.js`, `tests/unit/explorer-invariants.test.mjs` | T-25, T-26 | M |

**T-22** — `query` holds **all four mode payloads at once** (`text`, `image`, `video`, `browse`) plus shared `filters` and `expansion`. Defaults: `mode:"text"`, `open:true`, `filters.status:["approved"]`, `filters.license` = the allowed-by-default set, `prompt_mode:"generic"`, `history.cursor:-1`, `ai.enabled:false`, `ai.external_transmission.allowed:false`, `mix.resolution_policy:{auto_resolve:false, on_unresolved:"block"}`.

**T-23** — `reduceExplorer(state, event, ctx)` is **pure**: never awaits, never fetches, never touches the DOM; every side effect is returned as a descriptor from the frozen kind set `retrieve · analyze · embed_query · index_upsert · resolve_media · provider_call · disclose · persist`. `SET_MODE` changes `mode`, may clear `results` / `selected_reference_id` / reset `ui.active_panel`, **and nothing else**. `RESULTS_ARRIVED` with a stale `query_id` is dropped silently. `disclose` is a barrier: the guarded effect is held by the runner, released or discarded by `DISCLOSURE_ANSWERED` — disclosure precedes transmission by construction.

**T-24** — `ADD_CHIP` enforces INV-INT-2/3/4, INV-LENS-1 and the `props → scene` carrier rule before any write; a violating payload is refused whole with a reason, never partially applied. Analyzer output stages in the mode's proposal tray and reaches `intent` **only** through `ACCEPT_PROPOSAL`. There is no event by which `results` writes into `intent`, and a test asserts no reducer path does so.

**T-25** — `EXTRACT_ATTRIBUTES` receives **categories, never group names**. `ADD_TO_MIX` / `EXTRACT_ATTRIBUTES` add the reference to `pinned_reference_ids` in the same reduction (INV-EXP-4). `UNPIN` is **refused** for a mix contributor. `REMOVE_FROM_MIX` removes contributed chips but not `user`/`locked` chips, and leaves the reference pinned. `EXPLORE_FROM_CARD` touches neither `intent` nor `mix` — a test asserts byte-identity of both across all nine `explore_action` values.

**T-26** — Push truncates the forward tail then appends; `back()`/`forward()` **push nothing** and do **not** touch `pinned_reference_ids`, `mix` or (by default) `intent` (INV-EXP-3); FIFO eviction past `max_entries: 200` adjusts `cursor`; empty history is `cursor: -1`. `restoreEntry(entry, {apply_intent:true})` is the only path by which history may overwrite the live intent. `origin:"back"` is rejected by the schema and by a test.

**T-27** — `SAVE_RECIPE` freezes a `ReferenceSnapshot` for **every** `mix.references[].reference_id` (INV-RCP-1), builds `license_summary` with `attribution_block` from stored text, and marks the session clean. `LOAD_RECIPE` **re-derives** the prompt and treats `prompt_preview` as advisory, emitting a "regenerated" notice on difference; deprecated ids are rewritten via `replaced_by` or kept as custom chips badged "deprecated" — never dropped. A recipe whose snapshots are all `media_state:"gone"` produces the **identical prompt text** (R2 of the media-rot policy).

**T-28** — Runs `assertExplorerInvariants(prev, next, event)` after **every** transition in a scripted stream covering all 34 events, asserting INV-EXP-1/3/4/5. `DOD-01-4` lives here: `text → image → browse → video → text` leaves `intent`, `pinned_reference_ids`, `mix`, `difference` and `query.filters` byte-identical and restores the originally typed text.

### 4.6 Group F — Search (7 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-29 | Normalization, tokenizer, stopwords, `buildIndex` | `src/search/metadata-search.js`, `tests/unit/search-index.test.mjs` | T-07 | L |
| T-30 | `searchTaxonomy` — the canonical score table | `src/search/metadata-search.js`, `tests/unit/search-keyword.test.mjs` | T-29 | L |
| T-31 | `expandRelated` — one-hop, model-free | `src/search/metadata-search.js`, `tests/unit/search-expansion.test.mjs` | T-30 | S |
| T-32 | `filterReferences` — the hard gate | `src/search/metadata-search.js`, `tests/unit/search-filters.test.mjs` | T-29, T-41 | M |
| T-33 | `searchReferences` — targets, `REL` credit, `metadata_match` | `src/search/metadata-search.js`, `tests/unit/search-metadata.test.mjs` | T-32 | L |
| T-34 | `query-builder` — state → `Query` | `src/search/query-builder.js`, `tests/unit/query-builder.test.mjs` | T-33, T-22 | M |
| T-35 | `fusion-ranker` + `ResultSet` + `semantic-search` NULL path | `src/search/fusion-ranker.js`, `src/search/semantic-search.js`, `tests/unit/fusion.test.mjs` | T-34 | M |

**T-29** — Two document kinds (taxonomy nodes, references) on one tier vocabulary (*id · label · alias · description*), exactly per [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §3.3. `Reference.search_text` is **recomputed on load**, never read from storage. Deprecated nodes are excluded from results while stored chips referencing them stay valid. Index build over 736 nodes + the seed library completes in < 300 ms (UNVERIFIED target, T-72).

**T-30** — `KEYWORD_SCORES` frozen at the canonical values (1.00 / 0.95 / 0.90 / 0.70 / 0.50 / 0.35 / 0.30 / 0.20). Phrase pass and token pass, combined by `max`, token pass divided by **all** query tokens. `search_boost` multiplies **last** and is not clamped. **Chip confidence uses the pre-boost `s_raw`** — a tuning constant never masquerades as belief. Golden test: `"golden hour alley"` reproduces the worked example in §3.5 of the search doc, hit for hit.

**T-31** — 0.35 × source score, one hop, `related[]` only. Works with `ai.enabled === false` — expansion needs no model, and a test asserts it runs with the NULL analyzer and NULL embedding registered. Expanded hits become `source:"query_expansion"` chips, low confidence, one click to remove.

**T-32** — Filters **exclude**, they never down-rank. Defaults `status:["approved"]` and the allowed-by-default licence set. An empty pool yields `status:"empty"` with counts (`"0 of 340 matches are CC BY or freer — 218 are excluded by licence."`); silently widening the query is forbidden and a test asserts the filter set in the result equals the filter set in the query.

**T-33** — `REL` frozen at IDENTICAL 1.00 / DESCENDANT 0.60 / ANCESTOR 0.45 / SIBLING 0.30 / RELATED 0.25 / NONE 0.00, with the `0.75^(d-1)` decay and `d ≤ 3`. `metadata_match` normalised 0..1 by construction. Category weights default uniform. Golden test: the four-reference worked example in §4.4 reproduces `1.000 / 0.576 / 0.295 / 0.000`.

**T-34** — Builds `Query` from `ExplorerState` only; asserts INV-EXP-5 (`keep ∩ change === ∅`) before any write; `nextQueryId()` is monotonic. The nine `explore_action` values map to the query shapes in [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) §6.3 — in v0.1 the six "same X" actions set `difference.keep` and are executed as **hard structured filters** only (see §5, decision D-4).

**T-35** — With no embedding adapter, `ranking.mode` falls back to `metadata_only` / `keyword_only` and the results header **shows it**, so nobody believes semantic search silently ran (INV-AI-1). `fuse()` implements min-max weighted sum with defaults 0.6 / 0.4 for the day `v0.3` arrives; in v0.1 the semantic list is empty and fusion degenerates to the metadata list, which the test asserts explicitly. `semantic-search.js` ships as the index + `knn` skeleton with the NULL adapter path only.

### 4.7 Group G — Prompt engine (5 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-36 | `routeChip` + `buildStructuredPrompt` — 20 categories → 13 slots | `src/prompt/prompt-engine.js`, `tests/unit/prompt-routing.test.mjs` | T-07, T-12 | L |
| T-37 | `orderFragments` + `blocked[]` | `src/prompt/prompt-engine.js`, `tests/unit/prompt-blocked.test.mjs` | T-36, T-18 | M |
| T-38 | Formatter registry, `formatPrompt`, `toPromptDocument` | `src/prompt/prompt-engine.js`, `tests/unit/prompt-format.test.mjs` | T-37 | M |
| T-39 | `formatter-generic` — the reference formatter | `src/prompt/formatter-generic.js`, `tests/unit/formatter-generic.test.mjs` | T-38 | M |
| T-40 | Golden conformance fixtures + determinism | `tests/conformance/*.json`, `tests/conformance/prompt.test.mjs` | T-39 | M |

**T-36** — Routing is table-driven from `CATEGORY_TO_PROMPT_SLOT`; a chip with `negate:true` routes to `constraints` **regardless of category**, emitting `negative_fragment ?? "no " + fragment` with `kind:"negative"`. Fragment text resolves `model_hints[mode] → prompt_fragment → label → humanize`; custom chips emit their label verbatim. Every `PromptFragment` carries `{source_category, value, ref_id, chip_id}` — provenance is not optional (`DOD-01-7`). Every fragment in the `lens` slot has `hedged: true` (INV-LENS-2).

**T-37** — `PROMPT_SLOT_EMIT_ORDER` for the five multi-source slots, then `(order asc, confidence desc, value asc)`. A category with an **open** conflict is not emitted while `on_unresolved === "block"`; it appears in `blocked[]` as `{slot, category, reason:"unresolved_conflict", conflict_id}`. Nothing auto-picked, nothing silently dropped.

**T-38** — `registerFormatter(mode, fn)`; an unknown mode falls back to `generic` **with a warning** rather than throwing (`formatter_mode` is an open string by design). `formatPrompt` is pure: same `StructuredPrompt` + mode + taxonomy version ⇒ byte-identical text (INV-FMT-1). It never invents a value absent from the `StructuredPrompt` (INV-FMT-3) — asserted by comparing the emitted token set against the fragment set. Still-image modes drop `camera_motion` fragments with a warning (INV-FMT-2).

**T-39** — `GENERIC_SLOT_ORDER = subject, appearance, clothing, action, motion, scene, lighting, composition, framing, camera, lens, style, constraints`. `negative_text` is assembled from `constraints` items of `kind:"negative"`. Joining rules (separator, casing, empty-slot elision) are fixed in the module and covered by tests, so a formatter change is a visible diff in a golden file.

**T-40** — ≥ 20 fixtures of `{intent, mix, taxonomy_version} → {structured_prompt, text, negative_text, blocked, warnings}`. Determinism run: 100 fixtures × 100 runs byte-identical (`DOD-01-6`); the same fixtures are the ComfyUI port's conformance suite later. Provenance run: deleting one reference's contribution removes exactly its fragments and nothing else (`DOD-01-7`).

### 4.8 Group H — Reference manager and License Guard (6 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-41 | `normalizeReference`, `mintReferenceId`, derived caches | `src/reference/reference-manager.js`, `tests/unit/reference-normalize.test.mjs` | T-03, T-05 | L |
| T-42 | `ReferenceStore` — put / get / getMany / list / query / remove | `src/reference/reference-manager.js`, `tests/unit/reference-store.test.mjs` | T-41 | M |
| T-43 | `snapshot`, `resolveMedia`, `attributeConfidence`, `buildSearchText` | `src/reference/reference-manager.js`, `tests/unit/reference-snapshot.test.mjs` | T-42 | M |
| T-44 | `classifyLicense`, `defaultLicenseFilter`, `runLicenseCheck` | `src/reference/license-guard.js`, `tests/unit/license-check.test.mjs` | T-41 | M |
| T-45 | `buildAttribution`, `approve`, `summarizeLicenses` | `src/reference/license-guard.js`, `tests/unit/license-approve.test.mjs` | T-44 | M |
| T-46 | Guard demotion on load (LP-26) + the licence test suite | `src/reference/reference-manager.js`, `tests/unit/license-demotion.test.mjs` | T-45 | M |

**T-41** — Recomputes **every** derived cache on load: `aspect_ratio`, `orientation`, `search_text`, `license_policy_class`, `requires_attribution`, `share_alike`. Enforces INV-REF-1 (id prefix ⇄ type), INV-REF-2 (a document carrying `media_blob`/`media_base64`/`media_bytes`/`data_uri`/`binary` is **rejected**, not stripped), INV-REF-3, INV-VID-2 and INV-VID-4. `mintReferenceId` is deterministic and case-lowered: the same `(source, source_id)` mints the same id across sessions.

**T-42** — `query` accepts the filter shape of T-32 and returns references in a stable order. The store holds no bytes and no `Blob`s; a test asserts a serialized store round-trips through `JSON.parse(JSON.stringify(...))` unchanged.

**T-43** — `snapshot()` drops embeddings and any binary field. `resolveMedia` follows R3 exactly: `HEAD media_url` → `ok`; on failure `provider.getMetadata(source_id)` → `resolved_media_url` + `moved`; on failure `gone` and **the record is kept**. A `gone` snapshot still renders its full stored credit line (R4). `attributeConfidence` defaults to **0.7** when `attribute_meta` is absent.

**T-44** — The licence matrix as data: allowed `public_domain, pdm, cc0, cc_by, user_owned`; optional `cc_by_sa`; excluded `cc_by_nc, cc_by_nc_sa, cc_by_nd, cc_by_nc_nd, proprietary, unknown`. `unknown` → `manual_review` → `license_review`, **never** `rejected` (LP-18). `license_url` is validated against the canonical deed families for mismatch only, never synthesized (LP-19, LP-20).

**T-45** — `approve()` returns `{reference, violations}` and **refuses** `approved` unless `license_check`, `source_validation` and `attribution_metadata` are all `pass` and INV-LIC-1/2 hold (INV-LIC-3, LP-16). There is no force flag, no override parameter, no admin bypass, and a test asserts the function has no parameter that could serve as one. `attribution` is stored **text**, computed once (LP-25). `summarizeLicenses` sets `has_excluded` and blocks default export.

**T-46** — Editing `license`, `license_url`, `license_version`, `creator`, `source`, `source_id` or `source_url` on an `approved` reference demotes it to `candidate` with all four steps `pending` (LP-26), and `normalizeReference` re-applies the demotion **on load**, so a hand-edited `data/references.json` cannot smuggle a green badge. `DOD-01-10` lives here.

### 4.9 Group I — Providers (2 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-47 | Provider interface, registry, `local.js` over `data/references.json` | `src/providers/local.js`, `tests/unit/provider-local.test.mjs` | T-42 | M |
| T-48 | `openverse.js` / `wikimedia.js` interface stubs | `src/providers/{openverse,wikimedia}.js`, `tests/unit/provider-stubs.test.mjs` | T-47 | S |

**T-47** — Implements `id`, `capabilities()`, `search(query, filters)`, `getMetadata(id)`, `getPreview(id)`. `capabilities().offline === true`. It is the only provider available in v0.1. It also owns local uploads: an `upl_` handle is created **in memory**, never written to `data/`, and never implies bytes left the device.

**T-48** — Present so the interface is real and the seams exist; every method throws `NotImplementedInV01` with a message naming the milestone (v0.2). The lint asserts nothing above `src/providers/` contains the substring `wikimedia` or `openverse` outside a policy constant.

### 4.10 Group J — AI ports (3 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-49 | Ports, registries, `NULL_*` adapters, capability records | `src/ai/{analyzer,embedding,reranker}.js`, `tests/unit/ai-ports.test.mjs` | T-10 | M |
| T-50 | `MOCK_ANALYZER` + façade post-conditions (INV-VID-1/3) | `src/ai/analyzer.js`, `tests/fixtures/mock-analyzer/*.json`, `tests/unit/ai-mock.test.mjs` | T-49, T-15 | M |
| T-51 | Egress gate + `deriveCapabilityProfile` | `src/ai/analyzer.js`, `src/core/explorer-state.js`, `tests/unit/capability-profile.test.mjs` | T-50, T-23 | M |

**T-49** — `capabilities()` is synchronous and cheap — the UI lays itself out before any model loads. No file under `src/ai/` imports a concrete backend; a real backend is registered at runtime and appears as no `import` specifier anywhere in `src/` (INV-AI-2). `NULL_ANALYZER` / `NULL_EMBEDDING` / `NULL_RERANKER` are the AI-OFF path and are the defaults in v0.1.

**T-50** — The mock returns a **fixed** intent per fixture, stored under `tests/fixtures/`, **not** under `src/ai/`, so its output can never quietly become the specification for the real analyzer. It drives `analysis_status: "mocked"`. Façade post-conditions: a `camera_motion` chip sourced `analyzer_image` is **dropped with a warning** (INV-VID-1); a `motion` chip from `analyzer_image` is clamped to `evidence.kind:"implied"`, `confidence ≤ 0.6`, and kept only for nodes flagged `still_inferable` (INV-VID-3). A third-party adapter therefore cannot corrupt the product's epistemic stance.

**T-51** — `assertEgressAllowed` refuses a `local_only` handle **before** the adapter is touched, and refuses any adapter with `requires_external_transmission` while `external_transmission.allowed === false`. `deriveCapabilityProfile` is pure, lives in Core, folds capability records and the user's `ai` toggles into flat booleans, and reports `can_expand_query: true` even with AI off.

### 4.11 Group K — UI (12 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-52 | Modal shell R1: mount, dispatch loop, effect runner, focus trap, layered Escape | `src/ui/explorer-modal.js`, `tests/ui/modal-shell.test.mjs` | T-28, T-04 | L |
| T-53 | Mode bar R2 + TEXT surface R3a + BROWSE surface R3d | `src/ui/explorer-modal.js` | T-52, T-31 | L |
| T-54 | IMAGE R3b / VIDEO R3c surfaces, filmstrip window, proposal tray | `src/ui/explorer-modal.js` | T-53, T-50 | L |
| T-55 | Shared filter bar R4 | `src/ui/explorer-modal.js` | T-53, T-32 | M |
| T-56 | Intent chips R5 | `src/ui/intent-chips.js` | T-53, T-13 | L |
| T-57 | Card grid R6: virtualization, empty / loading / error states | `src/ui/reference-card.js` (`CARD_SIZE`), `src/ui/explorer-modal.js` | T-55, T-35 | M |
| T-58 | Reference card: badges, pin, USE, EXTRACT×8, EXPLORE×9 | `src/ui/reference-card.js` | T-57, T-25 | L |
| T-59 | Detail panel R7: four tabs, all 20 categories | `src/ui/reference-detail.js` | T-58, T-43 | L |
| T-60 | Mixer panel R8: entries, `use`/`only`/`exclude`, dominance | `src/ui/reference-mixer.js` | T-58, T-20 | L |
| T-61 | Conflict decision list — the exact copy | `src/ui/reference-mixer.js` | T-60 | M |
| T-62 | Composer R10: 13 slots, blocked slots, copy / save / export | `src/ui/explorer-modal.js` | T-61, T-27 | L |
| T-63 | Pin tray R11, KEEP readout R9, disclosure gate R12 | `src/ui/explorer-modal.js` | T-62, T-51 | M |

**T-52** — `mountExplorerModal(el, deps) -> {dispatch, getState, subscribe, destroy}`; `deps` carries `{dispatch, taxonomy, capabilities}` and **never a network client**. Effects run **after** the state is committed and rendered, so the user always sees `loading`/`pending` before any I/O. Escape is layered (§9.4 of the modal doc) and never destroys work; closing a dirty session requires explicit confirmation, never Escape alone. Dialog semantics, focus trap, and `aria` roles per §9.1.

**T-53** — Exactly four tabs, always all four, always in brief order, each with a "has content" dot; **no tab is ever hidden, disabled or reordered**. Text search debounced 180 ms, minimum 2 characters, monotonic `query_id`. Browse tiles render `visual_hint` thumbnails with `parent`/`children` navigation — this is the answer to *"I don't know what Low Angle means"* and it ships in the first wave of UI, not the last.

**T-54** — Upload is **never rejected** for lack of an analyzer. The status pill reads `mocked` and the word "mock" is visible wherever `analysis_status === "mocked"` (`DOD-01-12`). The video filmstrip and the `t_start_s`/`t_end_s` window are **player features, not model features**, and work with the NULL analyzer. Proposals stage in the tray, greyed, each with an alternatives menu; nothing reaches `intent` without an explicit accept.

**T-55** — One bar, four modes, **never reset by a mode switch** (INV-EXP-1). Licence chips, type, status, orientation inline; the remaining `filters` keys in an overflow. When the gate empties the pool, the bar states the cause with counts.

**T-56** — 19 chip rows plus the aggregate confidence readout; per-chip source badge, confidence, lock, negate, delete, alternatives, provenance on hover **and on focus**; `contested` badge; per-row conflict count with the accessible name `{category}: {n} decision{s} pending`. `props` chips render under a **Props** heading, read out of `scene` via `origin_category`. A `locked` or `source:"user"` chip is never reordered or deleted by a non-user action.

**T-57** — Fixed card height, virtualized grid; chips and mixer are deliberately **not** virtualized (result counts are unbounded, chip counts are not). Empty, loading and error states per §10 of the modal doc; an error names what failed and offers a retry.

**T-58** — A card with no onward action is forbidden. EXTRACT expands the group name to categories **before** dispatch. Repeated EXTRACT is additive. Clicking × on a chip a mix entry contributes writes `exclude: [<taxonomy_id>]` into that entry — **deleting the chip alone would be undone by the next `applyMix` and reads as a haunted UI**; this is the single most important implementation detail on the card. An EXPLORE action whose categories are empty on that reference is disabled with a reason on hover and focus, never silently returning zero results.

**T-59** — All 20 categories with per-attribute confidence; `subject`, `appearance`, `action` shown as read-only rows with the one-line explanation of why they have no EXTRACT button. Tabs: `attributes · metadata · licence · explore`. The licence tab renders the full stored attribution block, including for a `gone` media state. Selection never implies mix membership.

**T-60** — One block per `MixEntry` with `role`, `use`, `only`, `exclude`, `priority`, `weight`, pin state; the dominance readout; the blocked-slot indicator. `auto_resolve` opt-in, when active, shows the persistent banner naming the strategy.

**T-61** — Copy is **specified, not left to the implementer**, and the strings are taken verbatim from [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) §7.3: `{n} DECISION{S} PENDING`, `Which {category label} should win?`, `( use {A} ) ( use {B} ) ( keep both — I'll decide in the prompt )`. Binding rules, each with a test or a review checklist item: never the words *error / invalid / failed / problem / warning*; never a red destructive style; never "we removed X"; always name both sources; the `from you` candidate is pre-selected and can only lose by an explicit click.

**T-62** — 13 slots in `GENERIC_SLOT_ORDER`; every fragment traceable to its chip, category and reference on hover and focus; a blocked slot renders as a **pending decision with a jump link to R8**, never as an error and never as a silent omission. Exports: `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` — the same four the future ComfyUI node emits.

**T-63** — The pin tray marks mix contributors and replaces their unpin control with "remove from mix" (INV-EXP-4). R9 renders the KEEP readout produced by the six "same X" EXPLORE actions, read-only in v0.1 (decision D-4). R12 names the adapter instance id, the endpoint host and exactly what bytes would leave the device; two buttons, no default, no timeout, and it never grants on Escape or outside click. In v0.1 R12 is reachable only via a test-registered adapter, and a test asserts the barrier holds.

### 4.12 Group L — Seed data (4 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-64 | Maintainer ingest tool + the guard run that produces approvals | `tools/ingest-seed.mjs`, `docs/LICENSE_POLICY.md` (§12.3 checklist link) | T-46 | M |
| T-65 | SEED-A — 40 fixture-grade references | `data/references.json`, `tests/fixtures/references-a.json` | T-64 | M |
| T-66 | SEED-B — the demo library, 300–600 references | `data/references.json` | T-65 | L |
| T-67 | `data/presets.json` + `visual_hint` wiring pass | `data/presets.json`, `data/taxonomy/*.json` | T-66, T-08 | M |

**T-64** — The ingest tool is **not part of `src/`**, is not loaded by `app/index.html`, and is run by a maintainer **with** network access. It fetches provider metadata, mints deterministic ids, runs all four guard stages including SOURCE VALIDATION, and writes `data/references.json` with the full `license_guard` audit trail. This is how the shipped library can contain `approved` records while the shipped **app** makes no network call: LP-21 constrains the runtime, and the runtime still re-validates and demotes on load (T-46). The tool stores metadata, URLs, thumbnails, `visual_attributes` and attribution text — **never bytes**.

**T-65** — 40 references, hand-curated for coverage rather than volume, licence set restricted to Public Domain / PDM / CC0 / CC BY. They are the fixtures for T-32/T-33/T-40 and must include: at least one video with `duration_s`, `shot_boundaries` and `camera_motion` values; one `img_` and one `vid_` pair that produce the T-18 arity conflict; one reference whose `media_url` is deliberately dead, to exercise `media_state:"gone"`.

**T-66** — 300–600 references, spread so **every one of the 8 EXTRACT groups has ≥ 30 examples**. A thinner library invalidates `DOD-01-3`: browse and EXTRACT read as a toy and the demo cannot be completed honestly. Licence census printed by the ingest tool and pasted into the PR description.

**T-67** — `data/presets.json` with `pst_` ids, each preset a set of chips (never a prompt string). `visual_hint` assignment: every node that appears as a browse tile in a `single_dominant` category gets a `visual_hint` pointing at a seed reference, plus `visual_hint_pool` where a single image would mislead. Validator extension: a browse-reachable node without a `visual_hint` is a warning, and the count is reported.

### 4.13 Group M — Tests, QA and performance (5 tasks)

| ID | Title | Path | Deps | Size |
|---|---|---|---|---|
| T-68 | Schema conformance matrix in the Node harness | `tests/conformance/schema-matrix.test.mjs` | T-01 | M |
| T-69 | Cross-module invariant property suite | `tests/invariants/*.test.mjs` | T-28, T-40, T-46 | M |
| T-70 | Golden query set for keyword + metadata search | `tests/golden/queries.json`, `tests/golden/search.test.mjs` | T-33, T-65 | M |
| T-71 | Headless end-to-end journey harness | `tests/e2e/journey.test.mjs` | T-62, T-66 | L |
| T-72 | Performance smoke + the manual QA sign-off run | `tests/perf/smoke.test.mjs`, this document §8 | T-71 | M |

**T-68** — Ports the 57-case instance matrix to the Node harness so schema regressions fail `npm test` on every commit, not only when someone remembers to run the Python validator. Includes the brief's literal `img_A` mix (INV-MIX-0) and the deliberate rejections: `media_blob`, `origin:"back"`, `lens.35mm`, a resolved conflict without a `resolution`, a video reference without `duration_s`.

**T-69** — One suite per invariant family, each test named after its invariant id, so a failure reads `INV-EXP-4: mix contributor was unpinned`. Covers every code-enforced invariant in the index: INV-LIC-3, INV-MIX-1/2, INV-FMT-1/2/3, INV-EXP-1/3/4/5, INV-AI-1/2, INV-RCP-1.

**T-70** — ≥ 30 queries with expected top-k node ids and reference ids, including the two worked examples the search doc already fixes. Metrics reported: precision@5, MRR, and the count of queries whose top hit changed since the last run — the last number is the one that catches accidental scorer drift.

**T-71** — Drives the reducer headlessly through the full §8 journey with `ai.enabled = false` and the mock analyzer: text → browse → image(mocked) → EXTRACT → second reference → conflict → resolve → video(mocked) → compose → save recipe → reload recipe. Asserts the pillar-level outcomes, not pixels. This is the automated half of `DOD-01-3`; the human half is §8.

**T-72** — Targets (UNVERIFIED until measured): taxonomy load < 50 ms; index build < 300 ms; keystroke-to-results < 200 ms on the seed library; `applyMix` + conflict detection over 5 entries < 20 ms; `formatPrompt` < 5 ms. The task fails if a target is missed **or** if the numbers are recorded without being measured.

---

## 5. Decisions taken by this document

| Id | Decision | Rationale |
|---|---|---|
| D-1 | One task = one pull request; a task with no listed file path is unspecified | Prevents the "misc UI polish" task that absorbs scope and hides drift |
| D-2 | `src/core/hash.js` is added to the brief's layout | `cfl_` ids and `mintReferenceId` need SHA-1/SHA-256 inside a **pure, synchronous, environment-agnostic** core; `node:crypto` violates the layer rule and WebCrypto is async |
| D-3 | `tools/ingest-seed.mjs` is added, outside `src/` | The shipped app makes no network call, yet the seed library must carry genuine `approved` records with a real SOURCE VALIDATION run. A maintainer tool resolves this without weakening LP-16 or LP-21 |
| D-4 | v0.1 ships the **KEEP axis only** of `difference` | The six "same X" EXPLORE actions are brief-mandated card actions and they write `difference.keep`. Shipping KEEP as a hard structured filter costs nothing extra; CHANGE, `change_targets`, the `strictness` ladder and the diversity boost stay in v0.5. R9 is a read-only readout in v0.1 |
| D-5 | The seed library lands in two tranches, SEED-A (40, fixtures) then SEED-B (300–600, demo) | Every search and prompt task needs stable fixtures in wave 3; the demo-sized library is a wave-5 content task and must not block engineering |
| D-6 | Conflict-UI copy is fixed strings in the task, not implementer prose | The difference between an error and a decision is entirely in the wording; leaving it open reliably produces "Conflict: invalid camera angle" |
| D-7 | The mock analyzer's fixtures live under `tests/fixtures/`, never `src/ai/` | A fixture inside the shipping source tree becomes the de-facto spec for the real analyzer within one milestone |
| D-8 | Tests are part of the task, not a follow-up task | A test-later task list produces a test-never repository |

---

## 6. Sequencing

Waves are dependency-derived, not calendar-derived. Everything inside a wave is parallelizable.

```
WAVE 1  scaffold + tables            T-01 T-02 T-03 T-04 T-05
   │
WAVE 2  core vocabulary              T-06 T-07 T-08 T-09 T-41 T-49
   │
WAVE 3  core semantics               T-10 T-11 T-12 T-13 T-14 T-15 T-16 T-42 T-43
   │                                 T-44 T-45 T-46 T-47 T-48 T-64 T-65 T-50
   │
WAVE 4  the two engines              T-17 T-18 T-19 T-20 T-21          (mix)
   │                                 T-29 T-30 T-31 T-32 T-33          (search)
   │                                 T-36 T-37 T-38 T-39 T-40          (prompt)
   │
WAVE 5  state machine + queries      T-22 T-23 T-24 T-25 T-26 T-27 T-28
   │                                 T-34 T-35 T-51 T-66 T-67 T-68
   │
WAVE 6  UI                           T-52 T-53 T-54 T-55 T-56 T-57 T-58
   │                                 T-59 T-60 T-61 T-62 T-63
   │
WAVE 7  verification                 T-69 T-70 T-71 T-72 + §8 manual run
```

**Critical path:** `T-01 → T-05 → T-06 → T-09 → T-10 → T-12 → T-17 → T-18 → T-20 → T-25 → T-58 → T-60 → T-61 → T-62 → T-71`. It runs through the mix and the conflict UI, which is deliberate: **the conflict UI is the hardest surface in the product and it lands in the first milestone**, because discovering that it is hard at v0.4 — after three milestones have been built on top of it — would be fatal.

Two scheduling rules that are not negotiable:

1. **Browse mode (T-53) ships in the first UI wave, not the last.** It is the answer to *"I don't know what Low Angle means"* — a pillar-level capability, not a convenience screen.
2. **Mixing (T-17 … T-21, T-60, T-61) may not be deferred out of v0.1.** "Ship the modal, add mixing later" produces a search UI with a text box, which is the documented failure mode.

---

## 7. What v0.1 does NOT include

Stated as prohibitions, so that "we could just quickly add…" has a document to lose an argument to.

| Excluded | Why, and where it lands |
|---|---|
| **Any network call from the shipped app** | `src/providers/{openverse,wikimedia}.js` exist as interfaces and throw `NotImplementedInV01`. Live search is v0.2. The maintainer ingest tool (T-64) is not the app |
| **Any model, embedding, vector or reranker** | `src/ai/*` ships as ports with `NULL_*` adapters and one mock analyzer. Semantic search is v0.3 |
| **Real image or video analysis** | `analysis_status: "mocked"` **is** the feature. The word "mock" is visible in the UI wherever it applies (`DOD-01-12`) |
| **Search by Difference, CHANGE axis** | `difference.change`, `change_targets`, `strictness` ladder, diversity boost and near-duplicate suppression are v0.5. Only KEEP ships, driven by EXPLORE (D-4) |
| **Formatter modes other than `generic`** | The registry exists and is exercised by a test formatter; `flux`, `qwen_image`, `sd`, `gpt_image`, `minimax_h3`, `krea` are later files, never later refactors |
| **Recipe sharing, import, comparison, alternative exports** | Save and load a local recipe file only. `storyboard`, `shot_list`, `image_prompt`, `video_prompt` export kinds are post-v0.5 |
| **Localisation** | `i18n` exists on `TaxonomyNode` and is indexed by search; no second locale ships. `prompt_fragment` is never localized |
| **The ComfyUI node** | Gated behind `GATE-P1 … GATE-P5` in [`ROADMAP.md`](./ROADMAP.md) §4. v0.1 only guarantees the shape: Core and Prompt stay pure so the port is possible |
| **Undo/redo of document edits** | History is **navigation** history (INV-EXP-3). Chip-level undo is a separate feature and is not smuggled into `back()` |
| **Accounts, sync, server-side storage, telemetry** | Local-first. Nothing leaves the device in v0.1, and the disclosure gate exists to keep that true when v0.2 changes it |
| **Any binary in the repository** | Including test fixtures and thumbnails. URLs only (INV-REF-2) |
| **Any auto-resolution of conflicts** | `auto_resolve` defaults `false`; `priority`/`weight`/`first`/`last` strategies are unreachable in v0.1's UI. `on_unresolved` stays `"block"` |

---

## 8. Definition of done for v0.1

Two layers. The first is the pillar checklist — if any row is unchecked, v0.1 has not shipped, regardless of task completion. The second is the manual QA script that produces the evidence.

### 8.1 Pillar checklist

| Pillar | Criterion | Evidence | Tasks |
|---|---|---|---|
| **P1 Unified Modal** | Four modes in ONE modal; a mode switch changes the visible input surface and nothing else; the modal never closes mid-exploration | `DOD-01-4` test + QA-03, QA-06, QA-12 | T-22, T-23, T-28, T-52, T-53 |
| **P1** | R5 (intent), R8 (mix) and R10 (composer) are on screen in **every** mode; no full-screen results view exists | QA-04 visual check | T-52, T-56, T-60, T-62 |
| **P2 Visual Intent** | Text, browse, mocked image and mocked video all produce chips in the **same** 20-key document | QA-02, QA-05, QA-08, QA-14 | T-10, T-24, T-50 |
| **P2** | Every chip is user-editable; every analyzer output is a proposal requiring an explicit accept | QA-09 | T-12, T-24, T-54 |
| **P2** | `normalizeVisualIntent` is idempotent and total over ≥ 500 malformed documents | `DOD-01-8` | T-10 |
| **P3 Reference Decomposition** | A card exposes all 20 categories with per-attribute confidence; 8 EXTRACT groups reach 17 of them; `subject`/`appearance`/`action` are read-only with a stated reason | QA-07 | T-58, T-59 |
| **P3** | No card exists without an onward action | code review + T-58 test | T-57, T-58 |
| **P4 Selective Inheritance** | Composition from A and clothing from B produce one intent with per-chip `ref_id` provenance | QA-10, QA-11 | T-17, T-25, T-58 |
| **P4** | Removing one contributed value writes `exclude`, and the value does not reappear on the next recompute | QA-13 | T-58, T-17 |
| **P4** | "Remove everything B gave me" removes exactly B's contributions and no user or locked chip | `DOD-01-7` | T-13, T-25 |
| **P5 Reference Mixing** | Two references contributing different values in one `single_dominant` category produce **one open conflict**, both values remain in `intent`, the slot is `blocked`, nothing is auto-picked | `DOD-01-5` + QA-15, QA-16 | T-18, T-37, T-61 |
| **P5** | The conflict UI names both sources, pre-selects the user's own value, and uses no error vocabulary | QA-17 copy review | T-61 |
| **P5** | A resolution survives recomputation (deterministic `cfl_` id) and is remembered via `dominance` | QA-18 | T-19, T-20 |
| **Cross** | The whole journey completes with `ai.enabled = false` (INV-AI-1) | QA-01 … QA-24 with the AI pill reading OFF | all |
| **Cross** | `formatPrompt` is byte-deterministic across 100 runs and two machines | `DOD-01-6` | T-38, T-40 |
| **Cross** | Every prompt fragment traces to `{source_category, value, ref_id, chip_id}` | `DOD-01-7` | T-36, T-62 |
| **Cross** | No seed reference carries an excluded licence; no `approved` record bypasses the guard; a hand-edited approval is demoted on load | `DOD-01-10` | T-45, T-46, T-64 |
| **Cross** | Lens values are hedged in the taxonomy, the intent and the fragment; `lens.35mm` is rejected in all three | T-68 rejection cases + QA-21 | T-08, T-15, T-36 |
| **Cross** | Architecture lint green; no binaries; all 7 schemas + the 57-case matrix pass | `DOD-01-1`, `DOD-01-11` | T-02, T-68 |
| **Cross** | "mock" is visible wherever `analysis_status === "mocked"` | `DOD-01-12` + QA-08 | T-54 |

### 8.2 Manual QA script

> **Provenance note.** The assignment refers to "the section-73 journey". **The brief numbers exactly one section — "the 9 questions every design doc set must answer (spec section 70)" — and contains no section 73.** The canonical end-to-end narrative for this repository is [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6 (Mira, T0–T11), traced as a state log in [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) §11. The script below walks that journey in v0.1 terms — mocked analysis instead of real, KEEP-only difference — and is the human half of `DOD-01-3`. Flagged in §9.

Setup: `npm test` green, `npm run serve`, browser at `app/index.html`, `ai.enabled = false` (the default; R1 must read **AI ○ OFF · local-only ✓** for the entire run). One tester, one uninterrupted session, no page reload except where a step says so. Record a pass/fail per step; **any fail blocks the release**.

| Step | Journey | Do | Expect | Fails if |
|---|---|---|---|---|
| QA-01 | T0 | Open the composer | One modal. Four tabs `TEXT IMAGE VIDEO BROWSE`. R5, R8, R10 all visible | Any tab hidden or disabled; the composer is on another page |
| QA-02 | T1 | Type `golden hour alley`, submit | `time.golden_hour` (exact alias) and `scene.alley` (exact label) enter `intent` as `source:"user"`, `confidence: 1.0`; one `query_expansion` chip appears greyed; results header reads `keyword_only` | A model runs; expansion chips are indistinguishable from user chips |
| QA-03 | T2 | Switch to `BROWSE` | The two chips **do not move**; filters unchanged; only the query surface and results change | Any chip, pin, mix entry or filter is lost |
| QA-04 | T2 | Look at the layout | R5, R8, R10 still on screen (collapsed with counts on a narrow viewport is acceptable) | Results occupy the full modal |
| QA-05 | T2 | Open `camera_angle`, click the low-angle tile by its picture | `camera_angle.low_angle` enters `intent` as `source:"user"` | The tile has no thumbnail; the user must know the term to find it |
| QA-06 | T3 | Switch to `IMAGE` | The three chips persist; the previously typed text is still in the TEXT tab | Anything resets |
| QA-07 | T3 | Drop the look reference | Upload accepted; status pill reads **mocked**; the word "mock" is visible | Upload rejected for lack of an analyzer; a fake spinner implies real analysis |
| QA-08 | T3 | Inspect the proposal tray | Proposals greyed, each with an alternatives menu; **none** is in `intent` yet | A proposal auto-merges |
| QA-09 | T3 | Accept three, reject one, lock `composition.rule_of_thirds` | Accepted chips carry the analyzer source; the locked chip shows a lock; the earlier `camera_angle.low_angle` is untouched | Analysis overwrites a user chip |
| QA-10 | T4 | Open a result card's detail panel | All 20 categories with per-attribute confidence; `subject`/`appearance`/`action` read-only with a stated reason | Categories missing; no explanation for the three read-only rows |
| QA-11 | T4 | `EXTRACT → composition`, then `EXTRACT → lighting` on the same card | **One** mix entry with `use: ["composition","lighting","time"]`; the reference appears in the pin tray automatically | Two entries; a replaced `use`; the reference is not pinned |
| QA-12 | T5 | Switch to `IMAGE`, drop the outfit photo, `EXTRACT → clothing` only | Second mix entry, `use: ["clothing"]`; the first entry unchanged | Framing or scene arrives uninvited |
| QA-13 | T5 | Click × on the beanie chip | The entry gains `exclude: ["clothing.beanie"]`; the chip does not reappear after any subsequent edit | The chip returns on the next recompute (a haunted UI) |
| QA-14 | T6 | Observe R8 and R10 | `1 DECISION PENDING` for `camera_angle`; both `low_angle` and `high_angle` still in `intent`; the `camera` slot renders as **blocked: 1 decision pending** | A winner was picked; a value disappeared; the slot shows an error |
| QA-15 | T6 | Read the conflict card | Both sources named; the user's value badged `from you` and pre-selected; amber, not red; none of the words *error / invalid / failed / problem / warning* | Any of the above |
| QA-16 | T6 | Click the user's value | Conflict `resolved`, `strategy:"user"`; the losing chip **remains** in `intent`, marked unused; the `camera` slot unblocks; an undo affordance is offered | The loser is deleted |
| QA-17 | T6 | Edit an unrelated chip | The resolved conflict stays resolved (same `cfl_` id); `dominance.camera_angle` is remembered; the question is not re-asked | The decision is re-asked |
| QA-18 | T7 | Switch to `VIDEO`, upload a clip, scrub the window to `1.2 s → 3.4 s` | Filmstrip and window work with no analyzer; status reads **mocked**; the mocked proposal carries `evidence.t_start_s/t_end_s` | The filmstrip requires a model; a still-derived `camera_motion` chip is offered |
| QA-19 | T7 | Add a second `camera_motion` chip with `order: 1` | Two ordered chips, not one merged value; no conflict raised between them | A compound move is collapsed |
| QA-20 | T8 | Use `EXPLORE → same lighting` on a card | KEEP readout R9 lights up with `lighting, time`; `intent` and `mix` are **untouched** | EXPLORE acquires anything |
| QA-21 | T9 | Read the composer output | 13 slots in generic order; every fragment traceable on hover **and** on focus; the lens fragment reads `35mm-like perspective`, never `35mm` | An untraceable fragment; an unhedged lens claim |
| QA-22 | T9 | Delete one contribution of one reference | Exactly that fragment disappears; no other fragment changes | Collateral removal |
| QA-23 | T10 | Save a `VisualRecipe`, reload the page, load it back | Intent, mix, resolved conflicts and frozen snapshots restore; the prompt is **re-derived**; a rotted thumbnail degrades the card but the prompt text is identical | The recipe stored a prompt string; a dead URL changes the prompt |
| QA-24 | T11 | Export `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` | Four files; `reference_mix` validates against the schema; the exported intent round-trips through `normalizeVisualIntent` unchanged | Any export fails validation |

**Sign-off requires**: 24/24 pass, `npm test` green, T-72 numbers recorded from an actual measurement, and one sentence from the tester describing what they built — if that sentence is *"I made a prompt"* rather than *"I combined three references"*, the product drifted and the release is held.

---

## 9. Assumptions, additions and cross-document claims

### 9.1 Names and structures introduced here (flagged)

1. **Task ids `T-01 … T-72`, the size classes `S/M/L`, the wave numbers and the QA step ids `QA-01 … QA-24`** are this document's scheduling vocabulary. They appear in no schema and in no other document.
2. **`src/core/hash.js`** is added to the brief's file layout (decision D-2).
3. **`tools/ingest-seed.mjs`** is added, deliberately outside `src/` (decision D-3).
4. **`tests/` subdirectories** — `tests/unit`, `tests/conformance`, `tests/invariants`, `tests/golden`, `tests/arch`, `tests/e2e`, `tests/perf`, `tests/fixtures`, `tests/ui`, `tests/helpers` — are named here. [`ARCHITECTURE.md`](./ARCHITECTURE.md) §12.2 flags `tests/` itself as an addition.
5. **`package.json`, `npm test`, `npm run serve` and the `ajv` devDependency** are chosen here. The no-build-step rule comes from [`ARCHITECTURE.md`](./ARCHITECTURE.md) §2.
6. **`NotImplementedInV01`** is the error name for the v0.2 provider stubs.
7. **`SEED-A` / `SEED-B`** name the two seed tranches (decision D-5). The 300–600 budget and the ≥ 30-per-EXTRACT-group spread come from [`ROADMAP.md`](./ROADMAP.md) §2.1.
8. **Size and performance numbers are estimates and targets, not measurements (UNVERIFIED)** until T-72 runs.
9. **The brief contains no section 73.** §8.2 traces [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6, which is this repository's canonical journey, and says so at the top of the script.
10. **Test file names** (`intent-normalize.test.mjs`, `mix-conflicts.test.mjs`, …) are proposed here; a builder may rename them provided the suite names still carry the invariant ids required by T-69.

### 9.2 Claims other documents must agree with

1. **The public API surface implemented by these tasks is exactly [`ARCHITECTURE.md`](./ARCHITECTURE.md) §2**, function for function. The only source file added beyond that inventory is `src/core/hash.js`.
2. **The reducer's event surface is the 34-event table of [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) §3.2**, all of which v0.1 implements; `SET_KEEP_CHANGE` ships in its KEEP-only form (D-4).
3. **`KEYWORD_SCORES` and `REL` are implemented verbatim** from [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §3.4 and §4.2, including the pre-boost confidence rule.
4. **The License Guard implemented in T-44 … T-46 is the state machine of [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) §4**, including LP-16 (no bypass), LP-18 (`unknown` → `license_review`), LP-21 (no offline approval of a remote reference) and LP-26 (demotion on edit). The maintainer ingest tool (D-3) is the only place a stage-2 network call happens, and it is not part of the shipped app.
5. **`DOD-01-1 … DOD-01-12` of [`ROADMAP.md`](./ROADMAP.md) §2.1 are all covered** by §8.1; this document adds criteria and relaxes none.
6. **The conflict copy in T-61 is quoted verbatim** from [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) §7.3; changing a string there is a change to this task.
7. **The taxonomy shipped in [`../data/taxonomy/`](../data/taxonomy/) already covers all 20 categories across 736 nodes**, so T-08 is a completion-and-validation pass, not an authoring milestone.

---

## 10. Where to go next

| You want to… | Read |
|---|---|
| know why any of this exists | [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) |
| know the exact field, enum or invariant a task must honour | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`schemas/`](./schemas/) |
| know the module boundary a task must not cross | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| implement a region, an event or the conflict copy | [`UNIFIED_MODAL_STATE.md`](./UNIFIED_MODAL_STATE.md) |
| implement a scorer, a filter or the fusion | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| implement the licence gate or add a provider | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |
| know what ships after v0.1 | [`ROADMAP.md`](./ROADMAP.md) |
| answer the brief's nine questions | [`DESIGN_QUESTIONS.md`](./DESIGN_QUESTIONS.md) |
