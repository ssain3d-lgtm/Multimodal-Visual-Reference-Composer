# Unified Modal State — the Unified Visual Explorer Modal

**Purpose:** the complete behavioural specification of the product's single most important UX asset — one modal, four modes — fixing its layout regions, its full state shape, its event/action table with preconditions and transitions, the mode-switch invariant matrix, the navigation-history model, the reference-card action menu, the conflict UI, pinning, keyboard and accessibility requirements, per-mode empty/loading/error states, and an end-to-end state log proving the modal never closes mid-exploration.

> ### 한국어 요약
> 이 문서는 **통합 비주얼 익스플로러 모달**의 동작 사양을 확정합니다. 텍스트 · 이미지 · 비디오 · 브라우즈는 네 개의 페이지가 아니라 **하나의 모달의 네 가지 입력 모드**이며, 모드를 바꿔도 `intent` · `pinned_reference_ids` · `mix` · `difference` · `query.filters`는 절대 초기화되지 않습니다 (INV-EXP-1). 바뀌는 것은 **입력 표면과 후보 결과 집합뿐**입니다.
> 레이아웃을 12개 영역으로 나누어 각 영역이 어떤 상태 필드에 묶이고 어떤 이벤트를 발생시키는지 명시하고, 34개 이벤트의 페이로드 · 사전조건 · 상태 전이 · 사이드 이펙트를 표로 고정했습니다.
> 히스토리는 **문서 히스토리가 아니라 탐색 히스토리**입니다. 뒤로 가기는 모드 · 쿼리 · 필터 · 결과만 복원하며 핀이나 믹스를 건드리지 않고, 기본값으로는 살아 있는 intent도 덮어쓰지 않습니다 (INV-EXP-3). v0.1은 **뒤로 가기만** 노출합니다.
> 충돌은 감지되어 **결정 사항으로 제시**될 뿐, 자동 해결되거나 조용히 삭제되지 않습니다. Escape 키는 저장되지 않은 믹스를 절대 파괴하지 않으며, 모달은 사용자의 명시적 종료로만 닫힙니다.

---

## 0. Document contract, precedence and scope

| Rank | Source | Role |
|---|---|---|
| 1 | `BRIEF.md` (the canonical product brief) | product authority; never contradicted |
| 2 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/) | canonical data model: every field name, enum, id grammar and invariant used here |
| 3 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3–§4 | module boundaries, the reducer/effect loop, the event list this document expands |
| 4 | **this document** | the modal's behaviour in full detail: regions, events, transitions, history, card actions, conflicts, pins, a11y, states |

Sibling depth: [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) owns how a query becomes a ranked result set; [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) owns the badge and the approval gate; [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) owns the *why*; [`ROADMAP.md`](./ROADMAP.md) owns what ships in which milestone.

**Scope boundary.** This document specifies the modal. It does **not** specify ranking (see `SEARCH_ARCHITECTURE.md`), prompt text generation (`DATA_SCHEMA.md` §12.4), or licence verification (`LICENSE_POLICY.md`). Where the modal *calls* those, it calls them as an **effect descriptor** and never as an inline function — the reducer is pure by construction.

**Naming contract.** Every field name, enum value, category key, id prefix and invariant id used here comes from the canonical data model. Names this document must introduce — layout region ids, event names not already in `ARCHITECTURE.md` §3.3, keyboard bindings, UI copy patterns — are defined inline and listed in §12. They are **runtime and presentation vocabulary; they appear in no schema and are never persisted**, with the single exception of `ui.*`, which the schema already defines.

**One-sentence restatement of what is being specified.** The Unified Visual Explorer Modal is a single `ExplorerState` object plus a pure reducer, rendered as one dialog in which the thing you are *building* (intent, mix, prompt) is never off-screen while you *search* — because splitting those onto two pages is exactly what turns this product into a prompt builder.

---

## 1. The modal, region by region

### 1.1 Provenance note (read this before quoting the drawing)

The brief fixes the modal's **behaviour** — "Text / Image / Video / Browse all operate inside ONE modal… No separate image-search page. No separate video-search page. Only the input MODE changes… Modal state persists across mode switches; the modal never closes mid-exploration" — and it fixes the card action vocabulary (USE / EXTRACT / EXPLORE). **It contains no ASCII drawing of the modal.** The layout below is the canonical layout **for this repository**, derived from those constraints. It is identical in structure to the layout in [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.2, extended here with region identifiers `R1`–`R12` and a pin tray strip. It is a design commitment made here, not a quotation; flagged in §12.1.

### 1.2 The annotated layout

```
   ╔══════════════════════════════════════════════════════════════════════════════════════════╗
R1 ║ UNIFIED VISUAL EXPLORER                          AI ○ OFF  ·  local-only ✓        [ × ]   ║
   ╠══════════════════════════════════════════════════════════════════════════════════════════╣
R2 ║ ▐ TEXT ▌  IMAGE    VIDEO    BROWSE      ← mode tabs; a switch changes ONLY this row +R3   ║
   ╠══════════════════════════════════════════════════════════════════════════════════════════╣
   ║ QUERY SURFACE   state.query.<mode> — ALL FOUR PAYLOADS ARE HELD AT ONCE                   ║
R3a║  text  ▸ [ golden hour alley______________________________ ]              ( Search ⏎ )    ║
R3b║  image ▸ [ drop file / choose ]  ▤ thumb   status: mocked ⓘ                               ║
R3c║  video ▸ [ drop file / choose ]  ▤ thumb   ├──filmstrip─────────┤  window 1.2s → 3.4s     ║
R3d║  browse▸ [ camera_angle ▾ ] [ parent: — ▾ ] [ filter tiles______ ]                        ║
   ╟──────────────────────────────────────────────────────────────────────────────────────────╢
R4 ║ FILTERS (SHARED, never reset by a mode switch)                                            ║
   ║  licence: PD·CC0·CC BY ▾   type ▾   status: approved ▾   orientation ▾   ⛭ more           ║
   ╟──────────────────────────────────────────────────────────────────────────────────────────╢
R11║ PINS (3)  ▤ A  ▤ B  ▤ C                                    [ clear unused pins ]          ║
   ╠═══════════════════════════╤═══════════════════════════════════╤══════════════════════════╣
   ║ R5  INTENT                │ R6  RESULTS (virtualized grid)    │ R8  MIX  (2 refs)        ║
   ║  19 chip rows + conf      │                                   │                          ║
   ║                           │ ┌────────┐ ┌────────┐ ┌────────┐  │ ▤ A  look anchor         ║
   ║ framing                   │ │  ▤     │ │  ▤     │ │  ▤     │  │   use: composition,      ║
   ║  ▸ medium_shot    🔒 0.81 │ │        │ │        │ │        │  │        lighting, time,   ║
   ║ camera_angle       ⚠ 1    │ │ CC BY  │ │ CC0    │ │ PD     │  │        lens              ║
   ║  ▸ low_angle   (you) 1.00 │ ├────────┤ ├────────┤ ├────────┤  │   priority 10 · pinned   ║
   ║  ▸ high_angle   (B)  0.80 │ │USE EXT▾│ │USE EXT▾│ │USE EXT▾│  │ ▤ B  outfit              ║
   ║ clothing                  │ │ EXPLORE│ │ EXPLORE│ │ EXPLORE│  │   use: clothing,         ║
   ║  ▸ hoodie       (B)  0.77 │ └────────┘ └────────┘ └────────┘  │        camera_angle      ║
   ║  ▸ cargo_pants  (B)  0.72 │                                   │   exclude: beanie        ║
   ║ lighting                  │  R7 DETAIL overlays R6 when       │ ⚠ 1 DECISION PENDING     ║
   ║  ▸ golden_hour_sun   0.66 │     ui.active_panel == "detail"   │  camera_angle            ║
   ║ …                         │     tabs: attributes · metadata · │  ▤ low_angle  (from you) ║
   ║                           │           licence · explore       │  ▤ high_angle (ref B)    ║
   ║ [ chip filter ▾ ]         │                                   │  ( keep mine ) ( use B ) ║
   ║ [ ☐ conflicts only ]      │                                   │  ( keep both — I'll ↴ )  ║
   ╟───────────────────────────┴───────────────────────────────────┴──────────────────────────╢
R9 ║ SEARCH BY DIFFERENCE   anchor ▤ A                                                         ║
   ║  KEEP  ☑composition ☑lighting ☑camera_angle ☑framing    CHANGE ☑clothing → streetwear     ║
   ╟──────────────────────────────────────────────────────────────────────────────────────────╢
R10║ COMPOSER   mode: generic ▾                          13 slots · 1 slot blocked             ║
   ║  subject · appearance · clothing · action · motion · scene · lighting · composition ·     ║
   ║  framing · [camera ▒ blocked: 1 decision pending] · lens · style · constraints            ║
   ║  "a woman, a hoodie, cargo trousers, walking, in a narrow alley, during golden hour,      ║
   ║   composed on the rule of thirds, medium shot, 35mm-like perspective, street-style …"     ║
   ║  ( copy )  ( save recipe )  ( export: prompt · structured_prompt · visual_intent · mix )  ║
   ╚══════════════════════════════════════════════════════════════════════════════════════════╝

R12  DISCLOSURE GATE — a dialog-over-dialog, rendered only when an effect would transmit user
     media off-device. Blocks the `analyze` / `embed_query` effect until answered. Never
     auto-dismisses, never defaults to "allow".
```

### 1.3 Region table

Each region is a rendering target bound to a slice of `ExplorerState`, and a source of a fixed set of events. **A region may only read its bound slice and may only emit its listed events.** This is the enforceable form of "no hidden coupling".

| Id | Region | Reads | Emits | Never does |
|---|---|---|---|---|
| **R1** | Title / status strip. Product name, AI state pill, privacy pill (`local-only ✓` / `external allowed ⚠`), close button. | `ai.enabled`, `ai.external_transmission.allowed`, `mix.references.length` | `SET_AI`, `CLOSE_MODAL` | Close without the dirty-state check (§9.4). |
| **R2** | Mode tab strip. Exactly four tabs, always all four, always in brief order `TEXT IMAGE VIDEO BROWSE`. Each tab shows a "has content" dot when its payload is non-empty. | `mode`, `query.text/image/video/browse` | `SET_MODE` | Hide a tab, disable a tab, or reorder tabs by recency. |
| **R3a** | TEXT surface: one text field + Search. | `query.text`, `query.expansion` | `SUBMIT_QUERY`, `ADD_CHIP` (from a keyword hit), `SET_UI` | Auto-submit on keystroke; see §9.5 debounce rule. |
| **R3b** | IMAGE surface: drop zone, thumbnail, analysis status pill, proposal tray. | `query.image`, `ai.analyzer_enabled` | `ANALYZE_MEDIA`, `ACCEPT_PROPOSAL`, `REJECT_PROPOSAL`, `SUBMIT_QUERY` | Merge a proposal into `intent` without an explicit accept. |
| **R3c** | VIDEO surface: drop zone, filmstrip, window handles `t_start_s`/`t_end_s`, analysis status, proposal tray with timespans. | `query.video` | as R3b, plus window drag → `ANALYZE_MEDIA { window }` | Offer `camera_motion` proposals from a still (INV-VID-1). |
| **R3d** | BROWSE surface: category picker, parent breadcrumb, tile keyword box, thumbnailed taxonomy tiles. | `query.browse`, taxonomy | `BROWSE_CATEGORY`, `ADD_CHIP` | Require the user to know the term before they can find it. |
| **R4** | Shared filter bar. One bar, four modes. Licence chips, type, status, orientation, and an overflow for the rest of `query.filters`. | `query.filters` | `SET_FILTERS` | Reset on mode switch (INV-EXP-1). |
| **R5** | INTENT column. 19 chip rows (the intent categories), each row a category with its chips; per-chip source badge, confidence, lock, negate, alternatives menu, delete; per-row aggregate confidence and conflict count. `props` chips render under a **Props** heading, read out of `scene` via `origin_category`. | `intent`, `mix.conflicts`, `ui.chip_filter_category`, `ui.show_conflicts_only` | `EDIT_CHIP`, `ADD_CHIP`, `SET_UI` | Reorder or delete a `locked` or `source:"user"` chip on any non-user action. |
| **R6** | RESULTS grid. Virtualized, fixed card height. Each card: thumbnail, licence badge, media-state badge, pin toggle, USE, EXTRACT menu (8), EXPLORE menu (9). | `results`, `pinned_reference_ids` | `SELECT_REFERENCE`, `PIN`, `UNPIN`, `ADD_TO_MIX`, `EXTRACT_ATTRIBUTES`, `EXPLORE_FROM_CARD` | Render a card without onward actions. A look-only card is a search engine's card. |
| **R7** | DETAIL panel. Overlays R6. Four tabs: `attributes` (all 20 categories with per-attribute confidence), `metadata`, `licence` (full attribution block), `explore`. | `selected_reference_id`, the reference, `ui.detail_tab` | `EXTRACT_ATTRIBUTES`, `ADD_TO_MIX`, `EXPLORE_FROM_CARD`, `SET_UI`, `PIN` | Imply mix membership from selection. |
| **R8** | MIX column. One block per `MixEntry` (role, `use`, `only`/`exclude`, priority, weight, pin state), the dominance readout, and the **decision list** for open conflicts. | `mix`, references | `UPDATE_MIX_ENTRY`, `REMOVE_FROM_MIX`, `SET_DOMINANT`, `RESOLVE_CONFLICT` | Auto-pick a winner. Silently drop a losing value. |
| **R9** | SEARCH BY DIFFERENCE bar. KEEP / CHANGE category checkboxes over the 20 categories, anchor selector, optional directed `change_targets`, strictness slider. | `difference` | `SET_KEEP_CHANGE` | Allow a category into both KEEP and CHANGE (INV-EXP-5). |
| **R10** | COMPOSER row. 13 slots in generic order, each fragment traceable to its chip / category / reference on hover and focus; blocked slots rendered as pending decisions; copy / save recipe / export. | `prompt_preview`, `prompt_mode` | `COMPOSE`, `SAVE_RECIPE`, `SET_UI` | Emit text for a category with an open conflict while `on_unresolved == "block"`. |
| **R11** | PIN tray. Every `pinned_reference_ids` member as a small thumb; mix contributors are marked and their unpin control is replaced by "remove from mix" (INV-EXP-4). | `pinned_reference_ids`, `mix.references` | `PIN`, `UNPIN`, `SELECT_REFERENCE` | Let a mix contributor be unpinned. |
| **R12** | DISCLOSURE gate. Names the adapter instance id, the endpoint host, and exactly what bytes would leave the device. Two buttons; no default; no timeout. | `ai.adapters`, `ai.external_transmission` | `DISCLOSURE_ANSWERED` | Grant on Escape, on outside click, or on timeout. |

### 1.4 Why the layout is the argument

Three regions are **always on screen in every mode**: R5 (intent), R8 (mix), R10 (composer). That is the visible form of the brief's second design question — *why must image search and prompt building live in ONE UI*. The thing you are building is never off-screen while you search, so a result is evaluated against the assembly in progress rather than in the abstract. Move the composer to a second page and the extract-and-mix loop dies within a week: the composer becomes a destination you visit *after* searching, and the product silently becomes "search, then write a prompt" — a prompt builder with a picture gallery attached.

Two consequences follow and are binding:

1. **R5, R8 and R10 may collapse to a summary strip on narrow viewports, but they may never be removed, tabbed away behind the results, or hidden behind an "advanced" toggle.** The collapsed form must still show the counts (`19 rows · 4 chips`, `2 refs · 1 decision`, `13 slots · 1 blocked`) so the user knows the assembly exists.
2. **R6 never becomes the whole modal.** There is no "full-screen results" mode. A results-only view is the failure state, not a feature.

---

## 2. The complete state shape

Schema: [`schemas/explorer-state.schema.json`](./schemas/explorer-state.schema.json) (`$id: https://schema.uvrc.dev/v1/explorer-state.schema.json`). Required: `schema_version, mode, query, intent`. Everything else has a defined default, so a fresh modal is constructible from `{}` plus those four.

### 2.1 The three tiers

The tier decides the rules. **Look up the tier before writing any code that mutates state.**

| Tier | Fields | Rule |
|---|---|---|
| **DOCUMENT** — the user's work | `intent`, `mix`, `pinned_reference_ids`, `difference`, `query.filters` | Never reset by a mode switch (INV-EXP-1). Never touched by `back`/`forward` (INV-EXP-3). Changed only by an explicit user act. Losing any of it is a P0 bug. |
| **QUERY** — how the user is asking | `mode`, `query.text`, `query.image`, `query.video`, `query.browse`, `query.expansion` | All held simultaneously. A mode switch changes *visibility*, not content. Recorded verbatim in every history entry. |
| **DISPOSABLE** — recomputable | `results`, `selected_reference_id`, `ui`, `prompt_preview` | May be dropped or rebuilt at any moment. `prompt_preview` is a pure selector of `intent + mix + prompt_mode + taxonomy`; it is a cache, never a source. |

### 2.2 Field-by-field

#### Root

| Field | Type / default | What it is, and the rule that governs it |
|---|---|---|
| `schema_version` | `"1.0"`, pattern `^[0-9]+\.[0-9]+$` | Persisted-root version. Readers accept any MINOR within MAJOR `1` and ignore unknown properties from a higher MINOR; they refuse or migrate a different MAJOR. |
| `id` | `exp_<slug>`, optional | Present only when the session is persisted or shared. An in-memory modal has no id and needs none. |
| `mode` | `text \| image \| video \| browse`, required | The **active input surface**, nothing more. It is not a filter, not a search scope, not a mode of the product. Changing it is the cheapest event in the system by design. |
| `open` | `boolean`, default `true` | Modal visibility. **Only `CLOSE_MODAL`, dispatched from an explicit user dismissal, may set it false.** No search, upload, analysis, error, navigation, export or save may set it. |
| `query` | object, required | All four mode payloads plus the shared filters and expansion state. See below. |
| `intent` | `VisualIntent` (full chip form), required | The live, user-editable intent — 20 keys, all present, arrays possibly empty. Survives every mode switch, every search, every back/forward. |
| `results` | `ResultSet` | Retrieval output. **Nothing in `results` ever writes back into `intent`** — the analyzer understands, the retriever ranks. |
| `selected_reference_id` | `reference_id \| null`, default `null` | The reference open in R7. **Transient. Selection never implies mix membership**; USE and EXTRACT are explicit acts. |
| `pinned_reference_ids` | `reference_id[]`, unique, default `[]` | The pin tray. Superset of mix contributors (INV-EXP-4). |
| `mix` | `ReferenceMix` | The live mix: entries, derived `conflicts`, `dominance`, `resolution_policy`. Accumulates across modes; never reset by a mode switch or a new search. |
| `history` | `{entries[], cursor, max_entries, restore_intent_on_navigate}` | Navigation history. §5. |
| `difference` | `{enabled, anchor_reference_id, keep[], change[], change_targets, strictness}` | Search by Difference. `keep` and `change` MUST be disjoint (INV-EXP-5, code-enforced). |
| `ai` | `{enabled, analyzer_enabled, semantic_enabled, rerank_enabled, expansion_enabled, adapters{}, external_transmission{}}` | All AI switches. `enabled` defaults **false**, and false is a fully supported product state (INV-AI-1). |
| `prompt_mode` | `formatter_mode`, default `"generic"` | Formatter target for the live preview. Open string; no vendor is ever an enum member (INV-AI-2). |
| `prompt_preview` | `StructuredPromptDocument` | Last rendered prompt, kept so R10 can show blocked slots without re-running the formatter. Advisory cache; recomputed on any `intent`/`mix`/`prompt_mode` change. |
| `ui` | `{active_panel, detail_tab, chip_filter_category, show_conflicts_only, composer_open, grid_density}` | Purely presentational. **Never affects retrieval, intent or the prompt.** |
| `created_at`, `updated_at` | ISO datetime | Session bookkeeping. |
| `x_ext` | object | Vendor extension bucket. Core code never reads it. |

#### `query` — why all four payloads at once

```
query
├─ text      string, ≤2000, default ""      TEXT input. Never cleared by switching away.
├─ image     media_query                    IMAGE input.
├─ video     video_query                    VIDEO input (media_query + t_start_s / t_end_s).
├─ browse    { category, parent, keyword, page }
├─ filters   filters                        SHARED by all four modes.
└─ expansion { enabled, terms[], expanded_ids[] }
```

This is the structural expression of pillar 1. A single polymorphic `payload` replaced on switch would require a "stash the previous mode's input" code path — and that code path is the one every implementation forgets to write, or writes for three modes out of four. **Holding all four means there is nothing to forget:** text → image → text restores the typed string because it was never discarded, not because something restored it.

| Sub-field | Notes |
|---|---|
| `query.image.reference_id` | Set when an existing library reference is used as the query (the `EXPLORE → find similar` path). |
| `query.image.upload_id` | `upl_` handle to locally held bytes. **An `upl_` handle never implies that the bytes left the device.** The bytes themselves never appear in state (INV-REF-2's spirit: no binaries anywhere). |
| `query.image.thumbnail_url` | Local object URL or remote thumb, display only. |
| `query.image.analysis_status` | `none \| pending \| running \| done \| error \| mocked`. **`mocked` is a first-class state**, not a debug flag: v0.1 ships the upload surface before real analysis exists, and the state machine says so honestly rather than faking a spinner. |
| `query.image.analysis_error` | ≤500 chars, user-facing. Never a stack trace. |
| `query.video.t_start_s` / `t_end_s` | The analysed window. This is what lets the user say "describe **this** camera move", not "describe the clip". A still has no analogue and the schema gives it none. |
| `query.browse.category` / `parent` | Where the user is in the taxonomy grid. `parent` is a taxonomy id, never encoded in a child's id (INV-TAX-1). |
| `query.browse.keyword` | The AI-free keyword box over labels, aliases, related nodes, descriptions, and reference titles/tags. |
| `query.filters` | 13 filter fields; defaults matter. `license` defaults to whatever `defaultLicenseFilter()` returns — the allowed-by-default set of LICENSE_POLICY LP-5, `[public_domain, pdm, cc0, cc_by, user_owned]`; `user_owned` is in it so the local-first path never filters out the user’s own uploads; `status` defaults to `["approved"]`, so an unverified reference never reaches a normal result set. `require_categories` and `has_camera_motion` are how a camera-move hunt restricts itself to references that can actually answer the question. |
| `query.expansion` | Alias/related-hop expansion. **Needs no model and stays available with AI off.** Any chip it produces carries `source: "query_expansion"`, low confidence, and is removable in one click. |

#### `results` — disposable, and guarded

`ResultSet = {status, query_id, items[], total, cursor, ranking, ran_at, error}`.

- `status`: `idle | loading | ready | error`.
- `query_id` correlates a response with the request that produced it. **A response whose `query_id` is not the current one is dropped silently** — that is the entire concurrency story, and it is why an abandoned slow search can never repaint the grid.
- `items[i] = {reference_id, rank, score, score_breakdown{semantic, metadata, rerank, keyword, recency}, matched_categories[], matched_values[], differs_categories[]}`. `matched_categories` drives the "why did this come back" badge; `differs_categories` is populated by Search by Difference and drives the "different: clothing" badge.
- `ranking = {mode, semantic_weight 0.6, metadata_weight 0.4, fusion, reranker_enabled, embedding_key}`. Recorded per result set so a replayed history entry reproduces the same ordering. With AI off, `mode` is `metadata_only` or `keyword_only` and `embedding_key` is `null`.

#### `ui` — and the one thing it may not do

`{active_panel: results|detail|mixer|composer|browse, detail_tab: attributes|metadata|license|explore, chip_filter_category, show_conflicts_only, composer_open, grid_density: compact|comfortable}`.

`ui` is presentational and **must not influence retrieval, intent or the prompt**. Concretely: `chip_filter_category` filters what R5 *renders*; it never filters what `buildStructuredPrompt` *reads*. `show_conflicts_only` hides non-conflicting rows from view; it never hides a chip from the formatter. A reviewer seeing `ui.*` referenced inside `src/search/**` or `src/prompt/**` should reject the change outright — that is the brief's UI/engine coupling prohibition in its most likely disguise.

### 2.3 Derived values the modal must recompute, never trust

Per the canonical data model's derived-cache rule, these are recomputed on load and after any relevant edit, never read from storage as truth:

`intent.confidence` (per category, via `aggConfidence`) · `IntentChip.contested` · `mix.conflicts` · `prompt_preview` · `Reference.search_text` · media `aspect_ratio` / `orientation` · licence policy class flags.

A stored value that disagrees with the recomputed one is a stale cache, not a disagreement to resolve. Overwrite it.

---

## 3. Events and actions

### 3.1 The loop

```
   user gesture ── or ── an effect's reply
        │
        ▼
   dispatch(event)
        │
        ▼
   reduceExplorer(state, event, ctx) ──── PURE. Never awaits. Never fetches. Never touches the DOM.
        │                                 ctx = { taxonomy, referencesById, now, capabilities, locale }
        ├──▶ next state ──▶ render(state)
        │
        └──▶ effects: Effect[] ──▶ effectRunner (impure, owned by src/ui/explorer-modal.js)
                                      │
                                      ├─ retrieve      → search layer
                                      ├─ analyze       → ai analyzer port
                                      ├─ embed_query   → ai embedding port
                                      ├─ index_upsert  → search index
                                      ├─ resolve_media → reference layer
                                      ├─ provider_call → providers
                                      ├─ disclose      → R12 consent gate
                                      └─ persist       → local storage
                                      │
                                      └──▶ replies come back as NEW EVENTS carrying query_id / token
```

The purity of the reducer is not a stylistic preference: it is what makes INV-EXP-1, INV-EXP-3, INV-EXP-4 and INV-EXP-5 testable as **properties over every event** — `assertExplorerInvariants(prev, next, event)` runs on every transition in the test suite — rather than as hopes checked by review.

### 3.2 The event table

Columns: **Payload** · **Precondition** (what must hold, else the event is a no-op with a user-visible reason) · **State transition** (exactly which fields change) · **Effects** · **History** (the `origin` pushed, or `—`).

| # | Event | Payload | Precondition | State transition | Effects | History |
|---|---|---|---|---|---|---|
| 1 | `OPEN_MODAL` † | `{ deep_link? }` | — | `open = true`; if state is fresh, fill defaults; a deep link sets `mode`, `query`, `filters` | `retrieve` if the resolved query is non-empty | `initial` or `deep_link` |
| 2 | `SET_MODE` | `{ mode }` | `mode` ∈ the four; `mode ≠ state.mode` (else no-op) | `mode`; MAY clear `results` and reset `ui.active_panel` to `results`/`browse`; MAY clear `selected_reference_id`. **Nothing else.** | `retrieve` iff the target mode's payload is non-empty | `mode_switch` |
| 3 | `SUBMIT_QUERY` | `{ mode, payload, filters? }` | payload non-empty for that mode; not identical to the last submitted `(payload, filters)` | `query.<mode>` ← payload; `query.filters` ← merged; `results.status = "loading"`; fresh `results.query_id` | `retrieve`; `+ embed_query` if `ai.semantic_enabled` | `user_query` |
| 4 | `SET_FILTERS` | `{ patch }` | patch validates against the `filters` schema | `query.filters` merged | `retrieve` (re-runs the current query) | `user_query` |
| 5 | `BROWSE_CATEGORY` | `{ category, parent?, page? }` | `category` ∈ the 20 | `query.browse`; `mode = "browse"` if not already; `ui.active_panel = "browse"` | `retrieve` (tile population is a metadata query) | `taxonomy_browse` |
| 6 | `ADD_CHIP` † | `{ category, value, source, label?, ref_id?, custom?, negate? }` | INV-INT-2 namespace rule; INV-INT-3 (`reference`/`mix_resolution` ⇒ `ref_id`); INV-INT-4 (`inferred` ⇒ ≤0.5); INV-LENS-1; `props.*` ⇒ target `scene` with `origin_category:"props"` | `intent.<category>` gains a normalized chip; dedupe = **agreement** (max confidence, union `contributors`); `intent.confidence` recomputed; `mix.conflicts` recomputed | `retrieve` iff the chip came from the query surface (R3a/R3d) | `chip_edit` |
| 7 | `EDIT_CHIP` | `{ chip_id, patch }` — lock, negate, weight, order, swap to an `alternatives` entry, delete | chip exists | `intent`; `intent.confidence`; `mix.conflicts` recomputed | — | `chip_edit` |
| 8 | `ANALYZE_MEDIA` | `{ mode: "image"\|"video", handle, window? }` | `handle` present; `ai.analyzer_enabled` **or** the mock analyzer is registered | `query.<mode>.analysis_status = "pending"` (or `"mocked"` in v0.1); `analysis_error = null` | `disclose` **first** if the resolved adapter would transmit off-device and `external_transmission.allowed == false`; then `analyze` | — |
| 9 | `ANALYSIS_SETTLED` | `{ token, result \| error }` | `token` is current, else **discard silently** | `analysis_status → done \| error \| mocked`; `analyzed_at`; proposals staged in the R3b/R3c tray — **not merged into `intent`** | — | — |
| 10 | `ACCEPT_PROPOSAL` | `{ chip }` | proposal is in the current tray | as `ADD_CHIP` (the proposal is normalized on the way in) | — | `chip_edit` |
| 11 | `REJECT_PROPOSAL` | `{ chip_id }` | proposal is in the current tray | proposal removed from the tray only | — | — |
| 12 | `SELECT_REFERENCE` | `{ reference_id }` | reference is resolvable (results, pins, mix or library) | `selected_reference_id`; `ui.active_panel = "detail"`; `ui.detail_tab = "attributes"` | `resolve_media` | — |
| 13 | `EXPLORE_FROM_CARD` † | `{ reference_id, explore_action }` (§6.4) | reference resolvable; the action's categories are non-empty on that reference | `query.filters` may gain `type` pin; `difference` set for the "same X" actions; `results.status = "loading"`; fresh `query_id` | `retrieve` (`+ embed_query` for `find_similar` when semantic is on) | `reference_explore` with `origin_reference_id` + `origin_categories` |
| 14 | `EXTRACT_ATTRIBUTES` | `{ reference_id, groups[] \| categories[] }` | reference resolvable; **the UI has already expanded group names to categories** — `use` never stores a group name | `mix` upserts a `MixEntry` (merging `use` if the entry exists); `pinned_reference_ids` gains the id (INV-EXP-4); `mix.conflicts` recomputed; `prompt_preview` recomputed | — | `reference_extract` with `origin_categories` |
| 15 | `ADD_TO_MIX` | `{ reference_id, use[], only?, exclude?, role?, priority?, weight? }` | `reference_id` unique across entries (INV-MIX-1); `use` items ∈ the 20 categories or `"*"` | `mix.references` upsert; `pinned_reference_ids` gains the id; conflicts + preview recomputed | — | `reference_use` |
| 16 | `UPDATE_MIX_ENTRY` | `{ reference_id, patch }` | entry exists | `mix.references[i]`; conflicts + preview recomputed | — | `chip_edit` |
| 17 | `REMOVE_FROM_MIX` | `{ reference_id }` | entry exists | entry removed; **its contributed chips are removed, but chips with `source:"user"` or `locked:true` are not** (they were promoted out of the mix's ownership); conflicts + preview recomputed; the reference **stays pinned** | — | `chip_edit` |
| 18 | `SET_DOMINANT` | `{ category, reference_id }` | `category` ∈ the 20; that reference contributes to it | `mix.dominance[category]`; the matching conflict → `status: "resolved"` with `strategy: "user"`; a `mix_resolution` chip is materialized | — | `chip_edit` |
| 19 | `RESOLVE_CONFLICT` | `{ conflict_id, resolution }` | conflict exists and `status == "open"`; while `auto_resolve == false`, `resolution.strategy` MUST be `"user"` or `"keep_both"`; `winner_value` required unless `strategy == "keep_both"` (INV-MIX-3) | `mix.conflicts[i].status/resolution`; `intent` gains a `mix_resolution` chip (`ref_id` = winner) or, for `keep_both`, both chips remain and the conflict becomes `ignored`; preview recomputed | — | `chip_edit` |
| 20 | `PIN` | `{ reference_id }` | not already pinned | `pinned_reference_ids` gains the id | `resolve_media` | — |
| 21 | `UNPIN` | `{ reference_id }` | **`reference_id` ∉ `mix.references[].reference_id`** — otherwise the event is **refused** (INV-EXP-4) and the UI offers "remove from mix" instead | `pinned_reference_ids` loses the id | — | — |
| 22 | `SET_KEEP_CHANGE` | `{ keep[], change[], change_targets?, anchor_reference_id?, strictness? }` | `keep ∩ change == ∅` (INV-EXP-5) — **validated before any write**; an overlapping payload is refused whole | `difference`; `difference.enabled = true` if either list is non-empty; `results.status = "loading"` | `retrieve` | `search_by_difference` |
| 23 | `COMPOSE` | `{ prompt_mode? }` | — | `prompt_mode` (if given); `prompt_preview` ← `formatPrompt(buildStructuredPrompt(intent, taxonomy, mix), mode)` | — | — |
| 24 | `SET_AI` | `{ patch }` | — | `ai` merged. **Turning AI off must never lose a chip** — existing chips keep their `analyzer_*` provenance and stay editable | `disclose` when `external_transmission.allowed` is being turned on | — |
| 25 | `SET_UI` † | `{ patch }` | patch ∈ the `ui` schema | `ui` merged | — | — |
| 26 | `DISCLOSURE_ANSWERED` † | `{ allowed: boolean, endpoints[] }` | R12 is open | on `true`: `ai.external_transmission.allowed = true`, `disclosed_at = now`, `endpoints` recorded, and the **held effect is released**; on `false`: the held effect is **discarded**, nothing is transmitted, and the originating status returns to `none` | the released `analyze` / `embed_query`, or none | — |
| 27 | `LOAD_PRESET` | `{ id }` | preset exists in `data/presets.json` | chips merged into `intent` with `source: "preset"`; existing `user`/`locked` chips untouched | — | `preset_load` |
| 28 | `LOAD_RECIPE` | `{ id }` | recipe exists; every `mix.references[].reference_id` has a snapshot (INV-RCP-1) | `intent`, `mix`, `pinned_reference_ids`, `prompt_mode` replaced; prompt **re-derived**, cached `prompt_preview` treated as advisory; deprecated ids rewritten via `replaced_by` or kept as custom chips with a badge — **never dropped** | `resolve_media` per snapshot | `recipe_load` |
| 29 | `SAVE_RECIPE` † | `{ name, description?, tags? }` | `mix.references` non-empty **or** `intent` non-empty | builds a `VisualRecipe` with frozen `ReferenceSnapshot`s and a `license_summary`; marks the session clean | `persist` | — |
| 30 | `RESULTS_ARRIVED` | `{ query_id, result_set }` | `query_id == results.query_id`, else **dropped silently** | `results` replaced; `status = "ready"` or `"error"` | `index_upsert` | — |
| 31 | `NAVIGATE_BACK` | — | `history.cursor > 0` | `mode`, `query`, `query.filters`, `results` restored from `entries[cursor-1]`; `cursor--`. **Does not touch `intent`, `pinned_reference_ids`, `mix`, `difference`** unless `restore_intent_on_navigate` (INV-EXP-3) | `retrieve` using the entry's `intent_snapshot` | **never pushes** |
| 32 | `NAVIGATE_FORWARD` | — | `history.cursor < entries.length - 1` | mirror of 31 | `retrieve` | **never pushes** |
| 33 | `RESTORE_ENTRY` † | `{ entry_id, apply_intent: boolean }` | entry exists | as 31; **plus** `intent ← entry.intent_snapshot` when `apply_intent` is true. This is the only path by which history may overwrite the live intent | `retrieve` | **never pushes** |
| 34 | `CLOSE_MODAL` | `{ confirmed: boolean }` | if the session is dirty (§8.4), `confirmed` MUST be true — the UI obtains it from an explicit confirmation, never from Escape alone | `open = false` | `persist` | — |

† Introduced by this document; listed in §12.1. All other names are fixed by [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.3.

### 3.3 Two events that do not exist, and never will

There is **no `RESET`** and **no `CLEAR_ON_MODE_CHANGE`**. Neither can be added without breaking pillar 1. A reviewer who sees either name in a diff should reject it without further discussion; the correct implementations are `REMOVE_FROM_MIX` per entry, `EDIT_CHIP {delete}` per chip, and starting a new session.

There is also no event by which `results` writes into `intent`. The analyzer proposes (events 9–11); the retriever ranks (events 30). Merging them makes AI-OFF retrieval impossible and is the brief's prohibited coupling.

### 3.4 Effect ordering and cancellation

1. Effects are executed **after** the state has been committed and rendered. A user always sees the optimistic state (`loading`, `pending`) before any I/O begins.
2. Every `retrieve` carries the `query_id` minted in the same reduction. A reply for a superseded `query_id` is dropped by event 30's precondition — there is no `AbortController` correctness requirement, only a performance one.
3. Every `analyze` carries a token with the same discipline (event 9).
4. `disclose` is a **barrier**: the effect it guards is held in the runner, not queued in the reducer, and is released or discarded by event 26. Disclosure therefore *precedes* transmission by construction, which is what the privacy rule requires.
5. `persist` is fire-and-forget and may never block a render.

---

## 4. The mode-switch invariant matrix

### 4.1 INV-EXP-1, stated exactly

> Switching `mode` NEVER resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `query.filters`. A mode switch changes which input surface is visible and nothing else. It MAY reset `results` (a new mode implies new retrieval) and `ui.active_panel`. Nothing else.

### 4.2 The matrix

Rows are every field of `ExplorerState`. Columns are the four possible `SET_MODE` targets. The answer is deliberately identical in all four columns — **that uniformity is the invariant**; a matrix with an exception in one column would be a bug report.

| Field | → `text` | → `image` | → `video` | → `browse` |
|---|---|---|---|---|
| `intent` (all 20 keys, all chips, locks, provenance) | preserved | preserved | preserved | preserved |
| `intent.confidence` | preserved | preserved | preserved | preserved |
| `pinned_reference_ids` | preserved | preserved | preserved | preserved |
| `mix.references` (entries, `use`, `only`, `exclude`, weights, priorities, roles) | preserved | preserved | preserved | preserved |
| `mix.dominance` | preserved | preserved | preserved | preserved |
| `mix.conflicts` + resolutions | preserved | preserved | preserved | preserved |
| `mix.resolution_policy` | preserved | preserved | preserved | preserved |
| `difference` (enabled, anchor, keep, change, targets, strictness) | preserved | preserved | preserved | preserved |
| `query.filters` (all 13) | preserved | preserved | preserved | preserved |
| `query.text` | **visible** | preserved | preserved | preserved |
| `query.image` | preserved | **visible** | preserved | preserved |
| `query.video` | preserved | preserved | **visible** | preserved |
| `query.browse` | preserved | preserved | preserved | **visible** |
| `query.expansion` | preserved | preserved | preserved | preserved |
| `history` (entries + cursor) | preserved (+1 entry, `mode_switch`) | same | same | same |
| `ai` (all switches, adapters, disclosure) | preserved | preserved | preserved | preserved |
| `prompt_mode` | preserved | preserved | preserved | preserved |
| `prompt_preview` | preserved | preserved | preserved | preserved |
| `open` | **`true`** | **`true`** | **`true`** | **`true`** |
| `schema_version`, `id`, `created_at` | preserved | preserved | preserved | preserved |
| `results` | may clear | may clear | may clear | may clear |
| `selected_reference_id` | may clear | may clear | may clear | may clear |
| `ui.active_panel` | may reset to `results` | may reset to `results` | may reset to `results` | may reset to `browse` |
| `ui.*` (other) | preserved | preserved | preserved | preserved |

**Read the matrix in one line:** exactly four rows are allowed to change — `results`, `selected_reference_id` and `ui.active_panel`, all three recomputable, plus `history`, which gains exactly one `mode_switch` entry and nothing else.

### 4.3 The round-trip proof obligation

This is a test, not a prose claim. `tests/` must contain:

```
property MODE_ROUNDTRIP:
  for every permutation p of [text, image, video, browse] and every seeded state s:
      s' = fold(SET_MODE, p, s)
      assert deepEqual(pick(s,  DOCUMENT_TIER ∪ QUERY_TIER),
                       pick(s', DOCUMENT_TIER ∪ QUERY_TIER))
      assert s'.open === true
```

`DOCUMENT_TIER = {intent, mix, pinned_reference_ids, difference, query.filters}`, `QUERY_TIER = {query.text, query.image, query.video, query.browse, query.expansion}`. A single failing permutation is a P0.

### 4.4 What actually changes, in the user's words

| The user says | What really changed |
|---|---|
| "I switched to image search" | R2's selected tab, R3's visible surface, and the candidate set in R6. |
| "I lost my chips when I switched" | A bug. There is no code path that can do this; if it happens, `SET_MODE` was not the event dispatched. |
| "The filters reset" | A bug. Filters are one bar shared by four modes, by construction. |
| "It closed when I dropped a video" | A bug. Only `CLOSE_MODAL` closes the modal. |

---

## 5. The navigation history model

### 5.1 What an entry is

```
HistoryEntry = {
  id?, at?,                       // hst_<slug>, ISO datetime
  mode,                           // text | image | video | browse
  query,                          // THE FULL four-mode query object as it stood
  intent_snapshot,                // deep copy of the VisualIntent used for THIS retrieval
  filters,                        // the shared filters as they stood
  origin,                         // why this step happened (12 values)
  origin_reference_id?,           // the card the step came from
  origin_categories?,             // which categories an EXPLORE/EXTRACT targeted
  label?,                         // human breadcrumb: "similar lighting to img_…"
  result_ref_ids?,                // optional id cache so back() paints instantly
  ranking_snapshot?,              // optional copy of results.ranking
  difference_snapshot?            // the Search by Difference state in force for THIS retrieval
}
```

`origin ∈ {initial, user_query, mode_switch, chip_edit, taxonomy_browse, reference_explore, reference_use, reference_extract, search_by_difference, preset_load, recipe_load, deep_link}`.

`difference_snapshot` is recorded by every step whose `origin` is `search_by_difference`, `reference_explore` or `reference_use` — the six "same X" EXPLORE actions of §6.3 all set `difference.keep`, and KEEP is a **hard pool filter**, which makes `difference` a retrieval input exactly like `intent`. A replay that re-ran with today's `difference` would return a different pool than the step it claims to be replaying, for the same three reasons §5.3 gives about the intent.

**An entry is fully self-contained: `replay(entry)` needs nothing outside the entry.** That is the design rule that makes the breadcrumb trail trustworthy and makes history serialisable into a shared session.

`back` and `forward` are **not** `origin` values, because navigation records nothing — exactly browser semantics.

### 5.2 The algorithm

```
push(entry):
    if cursor < entries.length - 1:
        entries = entries[0 .. cursor]          ← TRUNCATE the forward tail
    entries.push(entry)
    cursor = entries.length - 1
    while entries.length > max_entries (200):
        entries.shift(); cursor--               ← FIFO eviction from the front

back():     cursor = max(0, cursor - 1)                     ← pushes NOTHING
forward():  cursor = min(entries.length - 1, cursor + 1)    ← pushes NOTHING
empty history ⇒ cursor = -1

replay(entry):
    set mode, query, query.filters from the entry
    re-run retrieval with entry.intent_snapshot AND entry.difference_snapshot
        ← both are read as retrieval INPUTS only; neither is written back into state
    DO NOT touch pinned_reference_ids, mix, difference
    DO NOT overwrite the live intent unless
        history.restore_intent_on_navigate === true
        or the caller used RESTORE_ENTRY { apply_intent: true }
```

### 5.3 Why entries snapshot the intent

Retrieval is a function of `(query, filters, intent)`. The intent is the *most* mutable of the three — it changes on every chip edit, every accepted proposal, every EXTRACT. If an entry stored only `(query, filters)` and replayed against **today's** intent, then:

1. `back()` would return **different results** than the user saw, which makes the back button a lie;
2. the breadcrumb "similar lighting to img_x" would no longer describe what it produced;
3. no test could assert replay determinism, because the ground truth would drift under it.

So the entry carries a **deep copy in full chip form** — provenance included, so the snapshot is inspectable ("this search ran with B's clothing chips already in play"). The cost is bounded: 200 entries × one intent each, and an intent is a few hundred small objects with no binaries anywhere. If that ever becomes a real memory concern, the mitigation is structural sharing of unchanged category arrays, **not** dropping the snapshot.

### 5.4 History is navigation history, not document history — and not undo

This is INV-EXP-3, and it is the single most commonly mis-implemented rule in the modal.

| | Restores | Does **not** touch |
|---|---|---|
| `NAVIGATE_BACK` / `NAVIGATE_FORWARD` | `mode`, `query` (all four payloads), `query.filters`, `results` | `intent`, `pinned_reference_ids`, `mix`, `difference` |
| `RESTORE_ENTRY {apply_intent: true}` | the above **plus** `intent` | `pinned_reference_ids`, `mix`, `difference` |

**In one sentence a builder can act on: going back to an earlier search must never delete the outfit you already collected.** The user's mental model of "back" comes from the browser, where back changes *where you are looking*, not *what you own*. A modal in which back silently discarded four EXTRACTed references would be experienced as data loss, and would train users to never press it — which costs the product its exploration loop.

**Back is not undo.** Undo would restore `intent` and `mix`; back deliberately does not. Chip-level undo/redo is a separate, later concern with its own stack keyed on `chip_id` (`chip_` ids exist precisely to make it addressable). Do not implement undo by reusing the history stack; the two have different tiers and different rules, and conflating them re-breaks INV-EXP-3.

### 5.5 MVP scope: **back only**

| Milestone | Reducer | UI |
|---|---|---|
| **v0.1** | `push`, `back`, `forward`, `replay`, truncation, FIFO eviction — all implemented and unit-tested | **Only the back affordance is rendered** (`←` button + `Alt+←`). No forward button. The breadcrumb list is rendered read-only. |
| v0.2+ | unchanged | Forward button, clickable breadcrumb trail, `RESTORE_ENTRY` "restore this intent too" control |

Rationale, recorded so nobody "fixes" it: forward only has meaning once branch truncation is visible to the user, and truncation is only visible once a breadcrumb trail is rendered. Shipping a forward button before the trail produces a control whose behaviour ("sometimes it goes grey after I search") is unexplainable, and users reliably reinterpret an unexplainable forward button as redo — which it is not (§5.4). The reducer implements forward from day one so the semantics are frozen and tested; only the affordance waits.

### 5.6 Which events push, at a glance

| Pushes an entry | Does not push |
|---|---|
| `OPEN_MODAL` (`initial`/`deep_link`), `SET_MODE` (`mode_switch`), `SUBMIT_QUERY` + `SET_FILTERS` (`user_query`), `BROWSE_CATEGORY` (`taxonomy_browse`), `ADD_CHIP` / `EDIT_CHIP` / mix edits / conflict resolutions (`chip_edit`), `EXPLORE_FROM_CARD` (`reference_explore`), `EXTRACT_ATTRIBUTES` (`reference_extract`), `ADD_TO_MIX` (`reference_use`), `SET_KEEP_CHANGE` (`search_by_difference`), `LOAD_PRESET` / `LOAD_RECIPE` | `NAVIGATE_BACK`, `NAVIGATE_FORWARD`, `RESTORE_ENTRY`, `SELECT_REFERENCE`, `PIN`, `UNPIN`, `COMPOSE`, `SET_UI`, `SET_AI`, `ANALYZE_MEDIA`, `ANALYSIS_SETTLED`, `REJECT_PROPOSAL`, `RESULTS_ARRIVED`, `DISCLOSURE_ANSWERED`, `SAVE_RECIPE`, `CLOSE_MODAL` |

Consecutive `chip_edit` pushes within a 1500 ms window **coalesce** into the last entry rather than pushing a new one, so a burst of chip toggles does not bury the previous search under twelve steps. (Coalescing window: a design decision made here, §12.1.)

---

## 6. The reference-card action menu

Every card in R6 and the detail panel R7 offers the same three families. **A card with no onward action is forbidden** — that is a search engine's card, not this product's.

```
┌──────────────────────────┐
│        ▤ thumbnail       │   pin ⊙ (top-right, always visible)
│                          │   licence badge (bottom-left, always visible)
│  CC BY · Wikimedia       │   media-state badge when not `ok`
├──────────────────────────┤
│  [ USE ]  [ EXTRACT ▾ ]  │   ← 1 + 8
│  [ EXPLORE ▾ ]           │   ← 9
└──────────────────────────┘
```

### 6.1 USE — take everything

| | |
|---|---|
| Event | `ADD_TO_MIX { reference_id, use: ["*"] }` |
| Meaning of `"*"` | every category this reference **actually has** values in — resolved at `applyMix` time, not frozen at click time |
| State transition | `mix.references` upsert; `pinned_reference_ids` gains the id (INV-EXP-4); `applyMix` re-runs; `mix.conflicts` recomputed; `prompt_preview` recomputed |
| History | `reference_use` |
| Note | USE is the **only** way `subject`, `appearance` and `action` enter the mix from a card, because those three are deliberately outside the EXTRACT groups (§6.2). |

### 6.2 EXTRACT — take only *how it looks*

Eight buttons, fixed by `extract_group_map`. The UI expands the group name to categories **before** dispatch; `use` never stores a group name.

| # | EXTRACT button | Expands to categories | State transition |
|---|---|---|---|
| 1 | composition | `composition` | `EXTRACT_ATTRIBUTES` → upsert `MixEntry.use` ∪ these; pin the reference; recompute conflicts + preview |
| 2 | camera | `camera_angle, camera_distance, framing, lens, camera_motion` | as above; on an image reference `camera_motion` contributes nothing (INV-VID-2) |
| 3 | pose | `pose` | as above |
| 4 | clothing | `clothing` | as above |
| 5 | lighting | `lighting, time` | as above |
| 6 | scene | `scene, weather, props` | as above; `props.*` values land in `intent.scene` with `origin_category:"props"` (INV-PROPS-1) and still render under a Props heading |
| 7 | style | `style, mood, color` | as above |
| 8 | motion | `motion` | as above |

**17 of 20 categories are reachable this way. `subject`, `appearance` and `action` are excluded on purpose:** EXTRACT takes *how it looks*, not *who or what is in it*. Taking the subject of someone else's photograph is the behaviour of a copying tool; taking its lighting is the behaviour of a reference tool. Those three arrive only via USE-everything or manual chip authoring, and R7's attributes tab shows them as read-only rows with a one-line explanation of why they have no EXTRACT button.

**Repeated EXTRACT is additive, never replacing.** Clicking `EXTRACT → lighting` then `EXTRACT → composition` on the same card produces one entry with `use: ["lighting","time","composition"]`, not two entries (INV-MIX-1) and not a replaced `use`.

**Removing one contributed value uses `exclude`, not chip deletion.** When the user clicks × on a chip that a mix entry contributes, the UI writes `exclude: [<taxonomy_id>]` into that entry. Deleting the chip alone would be undone by the next `applyMix` recomputation — the chip would silently come back, which reads as a haunted UI. This is the single most important implementation detail in the whole card menu.

### 6.3 EXPLORE — leave with a new query

Nine actions, fixed by the brief. All nine are ordinary retrieval; none of them modify `intent` or `mix`. Query construction is owned by [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §2.3; the state effect is specified here.

| # | EXPLORE action | `difference` set to | Filters pinned | Also |
|---|---|---|---|---|
| 1 | find similar | *(none)* — all of A's values at weight 0.5 | — | anchor on A; excludes A from results; hybrid when semantic is on, metadata-only otherwise |
| 2 | same composition | `keep: ["composition"]`, anchor A | — | A's other values contribute at half weight |
| 3 | same lighting | `keep: ["lighting","time"]`, anchor A | — | " |
| 4 | same outfit | `keep: ["clothing"]`, anchor A | — | " |
| 5 | same pose | `keep: ["pose"]`, anchor A | — | " |
| 6 | same camera | `keep: ["camera_angle","camera_distance","framing","lens","camera_motion"]`, anchor A | — | " |
| 7 | same scene | `keep: ["scene","weather","props"]`, anchor A | — | " |
| 8 | similar video | *(none)* — all values at 0.5 | `filters.type = ["video"]` | anchor on A |
| 9 | similar image | *(none)* — all values at 0.5 | `filters.type = ["image"]` | anchor on A |

Common to all nine:

- Event `EXPLORE_FROM_CARD { reference_id, explore_action }`; `results.status = "loading"` with a fresh `query_id`; effect `retrieve`.
- History push `reference_explore` with `origin_reference_id` and `origin_categories`, so the breadcrumb reads **"same lighting as ▤ A"** rather than "search 7".
- **`intent`, `mix` and `pinned_reference_ids` are untouched.** EXPLORE is a *query*, not an *acquisition*. This separation is what lets a user chase a lead and come back without having accidentally collected anything.
- Actions 2–7 populate `difference.keep`, which means the KEEP/CHANGE bar R9 lights up showing what the search is doing. The user can then add a CHANGE category in one click and be in Search by Difference without having learned a new screen — the brief's key differentiator, entered from the place the thought actually starts.
- An action whose categories are empty on that reference is **disabled with a reason on hover/focus** ("this reference has no pose attributes"), never silently returning zero results.

### 6.4 `explore_action` values

`find_similar, same_composition, same_lighting, same_outfit, same_pose, same_camera, same_scene, similar_video, similar_image` — nine values, matching the brief's list one-for-one. This enum is runtime vocabulary; it appears in no schema, and `origin_categories` on the history entry is what persists (§12.1).

---

> **Amended by [PRODUCT_BRIEF.md](./PRODUCT_BRIEF.md) A-1.** Conflicts are graded: a HARD conflict
> resolves to a visible winner the user can flip, a SOFT one only warns, nothing is deleted, and
> generation is never blocked.

## 7. The conflict UI

### 7.1 The doctrine, restated because it is the product

> Conflicts are **DETECTED and SURFACED**, never auto-resolved and never silently dropped. The UI asks which should be dominant.

`resolution_policy.auto_resolve` defaults to `false`; `on_unresolved` defaults to `"block"`. `"highest_priority"` and `"drop"` exist only as explicit user opt-ins and MUST be visibly indicated in R8 whenever active. This is INV-MIX-2.

### 7.2 Detection rule

`applyMix` raises a conflict in exactly three cases (`Conflict.kind`):

| Kind | Rule | Example |
|---|---|---|
| `arity` | The category is `single_dominant` (`framing, camera_angle, camera_distance, lens, pose, time, weather`) and ≥2 **distinct non-modifier** values arrive from ≥2 **distinct** sources | A's `camera_angle.low_angle` vs B's `camera_angle.high_angle` |
| `exclusivity_group` | The category is `multi` and ≥2 distinct values share a **non-null** `exclusivity_group`; `group` is required on the record | `lighting.high_key` vs `lighting.low_key`, group `key_level` |
| `explicit` | The taxonomy declares `conflicts_with` between the two ids; may cross categories | `camera_motion.static` vs any other camera motion |

Three things that are **not** conflicts, and must never be reported as such:

1. **The same value from two references.** That is *agreement*: dedupe keeps max confidence and unions `contributors[]`, and the chip renders "2 references agree".
2. **A modifier in a single-dominant category.** A node with `exclusivity_group: null` in a single-dominant category is a modifier and never participates — `camera_angle.dutch_tilt`, `pose.arms_crossed`, `weather.fog`. This is what makes "rain + fog" fine while "sunny + rain" is a real question.
3. **Two different categories.** "Motion from video A, camera work from video B" is two categories and is a conflict-free mix *by construction* — which is precisely why the brief's second success case works at all.

`dominance` is consulted **first**: a category with a `dominance` entry resolves to that reference and raises no open conflict. That is how "which should be dominant?" is *remembered* instead of re-asked on every subsequent edit.

Conflict ids are deterministic — `cfl_ + sha1(category + "|" + (group ?? "") + "|" + sorted(values).join(",")).slice(0,12)` — so a human's answer survives recomputation of the mix. Recomputing conflicts after every edit is therefore cheap and safe: a resolved conflict keeps its id and stays resolved.

### 7.3 The exact wording pattern

Copy is specified, not left to the implementer, because the difference between an error and a decision is entirely in the wording. Placeholders in `{braces}`.

| Surface | Pattern | Rendered example |
|---|---|---|
| R8 header | `{n} DECISION{S} PENDING` | `1 DECISION PENDING` |
| R5 category row badge | `⚠ {n}` with accessible name `{category}: {n} decision{s} pending` | `camera_angle: 1 decision pending` |
| Conflict card title | `Which {category label} should win?` | `Which camera angle should win?` |
| Conflict card body | `{Ref A label} says {value A label}. {Ref B label} says {value B label}. Both are still in your intent — pick the one to use in the prompt.` | `Your own choice says low angle. Reference B says high angle. Both are still in your intent — pick the one to use in the prompt.` |
| Candidate from the user | badge `from you`, pre-selected | `▤ low angle · from you` |
| Candidate from a reference | `{value label} · {role or reference title} · {confidence}` | `high angle · outfit · 0.80` |
| Buttons | `( use {A} )` `( use {B} )` `( keep both — I'll decide in the prompt )` | |
| R10 blocked slot | `[{slot} ▒ blocked: {n} decision{s} pending]` with accessible name `{slot} slot: {n} decision pending, activate to resolve` | `[camera ▒ blocked: 1 decision pending]` |
| After resolution | `{category} resolved: {winner}. {loser} is off your intent and still on {loser source}, one click away.` with an `undo` affordance | `camera_angle resolved: high angle. low angle is off your intent and still on Reference B, one click away.` |
| Auto-resolve opt-in active | persistent banner `Auto-resolve is ON ({strategy}). Conflicts will be decided without asking you.` | |

Wording rules, binding:

- **Never the words** *error*, *invalid*, *failed*, *problem*, *warning* for a conflict. It is a decision the machine is not entitled to make.
- **Never a red destructive style.** Amber/attention styling, decision iconography.
- **Never "we removed X" for a conflict the user has not yet decided.** Detection removes nothing; say what is still there. After an explicit `winner_only` resolution the losing value does leave the resolved intent — then name where it still lives (the source reference, and the `undo` affordance), never report a bare deletion.
- **Always name both sources.** A conflict with an anonymous side is unresolvable in practice.
- The `from you` candidate is **pre-selected and can only lose by an explicit click** — the user's own choice is never quietly outvoted by a reference's confidence score.

### 7.4 Nothing is auto-removed — the three places this is enforced

| Place | Enforcement |
|---|---|
| `applyMix` step 6 | Conflicts are appended and every participant gets `contested: true`. **Nothing is deleted and nothing is auto-picked.** Both competing chips remain in `intent`. |
| `buildStructuredPrompt` step 5 | A category with an open conflict is **not emitted** while `on_unresolved == "block"`; it is reported in `blocked[]` as `{slot, category, reason: "unresolved_conflict", conflict_id}`. Not auto-picked, not silently dropped. |
| R10 | The blocked slot renders as a **pending decision with a jump link to R8**, never as an omission and never as an error. The user can always see that the prompt is incomplete *and why*. |

The state-level consequence worth memorising: **a conflicting state must be representable in order to be surfaced.** That is why arity is a conflict-detection rule and *not* a cardinality constraint, and why no schema sets `maxItems` on a single-dominant category (INV-MIX-4). A schema that made the conflict unrepresentable would force the code to silently drop one side — the exact behaviour the brief forbids.

### 7.5 Resolution paths

| Path | Event | Result |
|---|---|---|
| Click a candidate in R8 | `RESOLVE_CONFLICT {conflict_id, resolution:{winner_reference_id, winner_value, strategy:"user", disposition:"winner_only"}}` | conflict `resolved`; a `mix_resolution` chip is materialized with `ref_id` = winner; the losing chip is **removed from the resolved intent** and stays reconstructible from the mix — the source reference still lists that value, so `undo` restores it |
| "Keep both" | `RESOLVE_CONFLICT {..., strategy:"keep_both", disposition:"keep_all"}` | conflict becomes `ignored` — an explicit human decision to coexist; both values emit into the prompt; `winner_value` is not required for this strategy |
| Set a dominant reference for the category | `SET_DOMINANT {category, reference_id}` | the answer is remembered in `mix.dominance`, so the question is not re-asked on the next edit |
| Remove one side | `UPDATE_MIX_ENTRY` writing `exclude` | the contribution stops; the conflict disappears on recomputation because one candidate no longer exists |

`strategy: "user"` and `strategy: "keep_both"` are the only strategies reachable while `auto_resolve == false`, which is the default — both are human decisions, which is why the third button on the conflict card can dispatch `keep_both`. The remaining strategies (`priority`, `weight`, `first`, `last`) exist for a user who has explicitly opted into automation and must be visibly indicated while active.

---

## 8. Pinning semantics

### 8.1 What a pin is

A pin is the user's statement **"keep this in front of me"**. It is not membership in the mix, not a favourite, not a bookmark, and it has no effect whatsoever on ranking.

| Property | Rule |
|---|---|
| Storage | `pinned_reference_ids: reference_id[]`, unique, order = pin order |
| Survives | new searches, result-set replacement, mode switches, filter changes, back/forward |
| Does **not** survive | nothing in-session; a pin persists for the life of the session and into a saved session (`exp_`) |
| Effect on retrieval | **none.** Pins never boost, never filter, never re-rank |
| Effect on the prompt | **none.** A pinned reference contributes nothing until USE or EXTRACT |
| Relationship to `selected_reference_id` | orthogonal. Selecting a card opens R7; it does not pin |

**Why pins do not influence scoring:** implicit pin-affinity ("boost things like what you already collected") makes ranking depend on invisible state, and makes the "why did this come back" explanation a lie. A user who wants pin-driven retrieval uses EXPLORE on the card or Search by Difference — both explicit, both showing their reasoning. This is a deliberate refusal of a feature that would feel clever for one session and be inexplicable in the next.

### 8.2 The auto-pin rule (INV-EXP-4)

> Every `reference_id` in `mix.references` MUST also appear in `pinned_reference_ids`.

Consequences, both enforced in the reducer:

1. `ADD_TO_MIX` and `EXTRACT_ATTRIBUTES` **add the id to `pinned_reference_ids` in the same reduction**. There is no window in which a contributor is unpinned.
2. `UNPIN` on a mix contributor is **refused**. The UI does not present a disabled button; it presents a different button — `remove from mix` — because the user's actual intent ("get this out of my way") maps to a different, safe operation. Refusing with no alternative would be a dead end.

The reason is one sentence: **a reference that is contributing to your prompt can never vanish from the UI.** If it could, the user would see a prompt fragment they cannot trace to a card, and the traceability that justifies the whole per-chip provenance design would break at the last step.

`REMOVE_FROM_MIX` deliberately leaves the reference **pinned**. Removing a contribution and dismissing a card are two different intentions, and collapsing them costs the user their place.

### 8.3 Pin tray behaviour (R11)

- Renders every pin as a thumb in pin order, with mix contributors marked (`▤ A ●`) and non-contributors plain.
- `clear unused pins` removes every pin that is **not** a mix contributor, in one action. It never touches contributors and it never touches the mix.
- A pinned reference whose media has rotted still renders: the thumbnail degrades to a placeholder with a `moved` / `gone` badge, and the card keeps its full attribution line, because attribution is stored **text**, never a computed link. Rot degrades the card, never the recipe.
- Pins are capped at 50 with a visible counter; at the cap, pinning shows `Pin limit reached — unpin something first`, never silently evicting the oldest. (Cap value: a decision made here, §12.1.)

### 8.4 Dirty-session definition

Used by Escape (§9.4) and by `CLOSE_MODAL`'s precondition. A session is **dirty** when any of the following is true since the last `SAVE_RECIPE`:

- `mix.references.length > 0`, **or**
- any `intent` array is non-empty, **or**
- `difference.enabled == true`.

Pins alone do not make a session dirty; they are cheap to recreate and holding a confirmation dialog over them would be noise.

---

## 9. Keyboard and accessibility

Target: WCAG 2.2 AA. The requirements below are binding acceptance criteria, not aspirations. Where a criterion is a specific WCAG success criterion it is named so it can be tested against the standard rather than against taste.

### 9.1 Dialog semantics and the focus trap

| Requirement | Specification |
|---|---|
| Role | The modal root is `role="dialog"` with `aria-modal="true"` and `aria-labelledby` pointing at the R1 title. |
| Background | While `open`, content outside the modal is `inert` (or `aria-hidden="true"` plus removed from the tab order in browsers without `inert`). Background scroll is locked; the modal's own regions scroll internally. |
| Trap | Tab and Shift+Tab cycle **only** within the modal. Implemented with sentinel focusable nodes at both ends, not by intercepting keydown, so browser and AT focus commands behave normally. |
| Initial focus | On open: the active mode's primary input (R3a's text field, R3b/R3c's drop-zone button, R3d's category picker). **Not** the close button — opening a tool should place the cursor where work begins. |
| Return focus | On close: the element that opened the modal. On closing R7: **the card that opened it**, not the top of the grid. On closing a menu: the button that opened it. |
| Focus loss | Focus may never land on `document.body`. Any region that unmounts while focused moves focus to its nearest surviving ancestor region's heading, which is `tabindex="-1"`. |

### 9.2 Mode tabs (R2)

`role="tablist"` / `role="tab"` / `role="tabpanel"` with `aria-selected`, `aria-controls`, and a **roving tabindex** (exactly one tab is in the tab order).

| Key | Action |
|---|---|
| `←` / `→` | Move between tabs (wrapping). Activation is **automatic** — moving activates — because a mode switch is free and lossless by INV-EXP-1. |
| `Home` / `End` | First / last tab. |
| `Tab` | Leaves the tablist into the active panel (R3). |
| `Alt+1..4` | Jump directly to TEXT / IMAGE / VIDEO / BROWSE from anywhere in the modal. |

The tabpanel is labelled by its tab. Each tab's accessible name includes its content state: `IMAGE, has content` when `query.image` is non-empty, so a screen-reader user knows their upload survived the switch without visiting the tab.

### 9.3 Results grid, chips, and the rest

| Region | Semantics | Keys |
|---|---|---|
| R6 results | `role="grid"`, rows `role="row"`, cards `role="gridcell"`, roving tabindex, one tab stop for the whole grid | `←→↑↓` move by cell/row (2-D, wrapping off at the edges), `Home`/`End` row start/end, `PageUp`/`PageDown` by viewport, `Enter` opens R7, `Space` toggles the pin |
| card actions | Buttons inside the focused cell reachable with `Tab` while the cell is focused; menus are `aria-haspopup="menu"` + `role="menu"` | `u` USE, `x` open EXTRACT menu, `e` open EXPLORE menu, `p` pin — **only while a card has focus**, never while a text field has focus |
| R5 intent | `role="list"` of category groups; each chip is a `role="listitem"` containing a labelled group of controls | `Delete`/`Backspace` removes the focused chip (with the `exclude` rule of §6.2 when it is mix-contributed), `l` locks, `n` negates |
| R8 conflicts | Each conflict is a `role="group"` with `aria-labelledby` on its title; candidates are a `role="radiogroup"` with the `from you` option pre-checked | `←→` choose, `Enter` confirm |
| R9 KEEP/CHANGE | Two `role="group"` checkbox sets over the same 20 categories; a category checked in one is `aria-disabled` in the other with an explanatory `aria-describedby` (INV-EXP-5 made visible) | standard checkbox keys |
| R10 composer | Slots are a `role="list"`; a blocked slot is a **button** whose accessible name is `camera slot: 1 decision pending, activate to resolve`, and activating it moves focus to that conflict in R8 | `Enter` jumps to the conflict |
| R3c filmstrip | A two-thumb `role="slider"` pair (`aria-valuemin/max/now`, `aria-valuetext` in seconds) — **never** a drag-only control | `←→` ±0.1 s, `Shift+←→` ±1 s, `Home`/`End` clip bounds |

Global shortcuts: `/` focuses the active query input (suppressed while a text field has focus), `Ctrl/Cmd+Enter` submits, `Alt+←` back, `Alt+→` forward (v0.2+, §5.5), `Ctrl/Cmd+Shift+C` copies the prompt, `?` opens the shortcut sheet. Every shortcut is listed in that sheet, and every shortcut has a pointer-reachable equivalent — no function is keyboard-only or pointer-only.

### 9.4 Escape — layered, and it never destroys work

**Escape is the single highest-risk key in this UI**, because the naive implementation ("Escape closes the dialog") would discard an unsaved mix that may represent twenty minutes of work. The behaviour is layered; Escape acts on the **innermost open layer only**.

```
Escape pressed
   │
   ├─ L0  a menu / popover / combobox listbox is open?     → close it, focus returns to its trigger.  STOP.
   ├─ L1  the R12 disclosure gate is open?                 → CANCEL it. Never grants. The held effect
   │                                                          is discarded, analysis_status → "none".  STOP.
   ├─ L2  the R7 detail panel is open?                     → close it, ui.active_panel = "results",
   │                                                          focus returns to the originating card.  STOP.
   ├─ L3  an inline editor (chip rename, mix role) is open?→ cancel the edit, discard the draft text. STOP.
   │
   └─ L4  top level:
             session NOT dirty (§8.4)  → dispatch CLOSE_MODAL { confirmed: true }
             session IS dirty          → open the "Leave the explorer?" confirmation.
                                         DO NOT dispatch CLOSE_MODAL.
                                         Escape on that confirmation CANCELS it and returns
                                         focus to the modal. The mix is untouched either way.
```

The confirmation offers exactly three choices, in this order:

1. **Keep exploring** (default focus, and the action Escape maps to)
2. **Save recipe, then leave** → `SAVE_RECIPE` then `CLOSE_MODAL { confirmed: true }`
3. **Leave without saving** → `CLOSE_MODAL { confirmed: true }`, and only this button ever discards a mix

Two absolute rules follow:

- **No Escape path, at any layer, may reach `CLOSE_MODAL` while the session is dirty without passing through that confirmation.**
- **Nothing else closes the modal.** Not an error, not a completed search, not an upload, not an export, not a successful save (a save keeps the modal open, marks the session clean and shows a confirmation toast), and not an outside click. Outside-click-to-dismiss is **disabled entirely** on this dialog; a misclick beside a modal must not be able to end an exploration session.

### 9.5 Visible focus, motion, colour, timing

| Requirement | Specification |
|---|---|
| Visible focus (WCAG 2.4.7 / 2.4.11) | A 2 px solid outline with a 2 px offset on every focusable element, contrast ≥ 3:1 against **both** the element and the adjacent background. `outline: none` without a replacement of equal or greater visibility is a build-blocking lint error. Focus rings on thumbnails render on an inset ring so they stay visible over any image. |
| Target size (WCAG 2.5.8) | Every interactive target ≥ 24×24 CSS px, including chip delete buttons, pin toggles and filmstrip thumbs. Card action buttons ≥ 32 px high. |
| Reduced motion | Under `prefers-reduced-motion: reduce`: no crossfade on mode switch (instant swap), no card entrance/stagger animation, no auto-scrolling, no parallax, no skeleton shimmer (a static block instead), no filmstrip inertia. Remaining transitions are opacity-only and ≤ 100 ms. **No information may be conveyed only by motion.** |
| Colour independence (WCAG 1.4.1) | Confidence is a number **and** a bar, never colour alone. Licence state is a badge **with text** (`CC BY`, `PD`), never a coloured dot alone. Conflict state carries the `⚠` glyph and the word *decision*, never amber alone. Contested chips carry a text badge, never just a tint. |
| Contrast (WCAG 1.4.3 / 1.4.11) | Text ≥ 4.5:1 (large text ≥ 3:1); UI component boundaries and state indicators ≥ 3:1. Licence badges over thumbnails sit on an opaque plate, never directly on the image. |
| Live regions | `results.status` announces politely (`Searching…` / `12 results`); analysis status announces politely; a **conflict announces politely as a decision**, never via `role="alert"`. `role="alert"` is reserved for genuine failures (adapter unreachable, upload rejected). |
| Reflow / zoom (WCAG 1.4.10) | Usable at 320 px width and at 400 % zoom. The three-column band stacks; R5/R8/R10 collapse to summary strips (§1.4) but never disappear. |
| Timing | No component of the modal has a time limit. Nothing auto-dismisses except non-critical success toasts (≥ 6 s, dismissible, and mirrored in a status log). The disclosure gate never times out. |
| Debounce vs. announcement | Query input is debounced for *retrieval only* at the canonical **180 ms** — trailing edge, minimum 2 characters, immediate flush on Enter, owned by [`ARCHITECTURE.md`](./ARCHITECTURE.md) §9.2 and restated here, not redecided; the typed value is committed to `query.text` on every keystroke, so a mode switch mid-typing loses nothing. |
| Language | `lang` is set on the root; `i18n` labels come from taxonomy `i18n[lang]`. **`prompt_fragment` is never localized** — the prompt is a machine-facing artefact, and translating it would silently change the generation result. |

---

## 10. Empty, loading and error states

Three rules govern every cell of the tables below.

1. **No dead ends.** Every empty and every error state names at least one action the user can take from inside the modal.
2. **No blank panels.** An empty state explains what the region is for. A first-run user must be able to learn the product from the empty states alone.
3. **A decision is not an error.** Blocked slots, unresolved conflicts and deprecated nodes use decision styling and decision wording (§7.3), never error styling.

### 10.1 Per-mode query-surface states (R3)

| Mode | Empty (no input yet) | Loading | Populated but no results | Error |
|---|---|---|---|---|
| **TEXT** | `Describe what you're looking for. Don't know the words? Try BROWSE.` with three seed chips from the taxonomy and a link that switches to `browse`. | Skeleton grid in R6 + polite `Searching…`. Input stays live and editable. | `No approved references match "golden hour alley".` + the three highest-value relaxations, each one click: *widen licence to include CC BY-SA*, *drop the `approved`-only filter*, *remove filter: orientation*. Never a bare "0 results". | `Search failed: {reason}.` + `( retry )`. `results.status="error"`, `results.error` set; **the previous result set is kept on screen, greyed**, so the user does not lose their place. |
| **IMAGE** | Drop zone: `Drop an image, or choose a file. It stays on your device.` Under it: the privacy pill and, when the analyzer is off, `Analysis is off — you can still search by this image's attributes once you add it.` | `analysis_status: pending \| running` → progress pill `Analyzing…` **on the thumbnail**, never a modal-blocking spinner. R6 stays interactive throughout. | Same relaxation list as TEXT, plus `Try EXPLORE → find similar on a card instead`. | `analysis_status: "error"` + `analysis_error` verbatim in R3b + `( retry )` + `( use it as a reference anyway )`. **An analysis failure never blocks using the image as a query.** |
| | `mocked` (v0.1) | The pill reads `Mock analysis (v0.1)` with an ⓘ explaining that real analysis ships in v0.2 and that these chips are examples. Mock proposals are visually distinct and still require an explicit accept. **We do not fake a spinner.** | | |
| **VIDEO** | Drop zone: `Drop a clip. Pick the moment you care about — you don't have to describe the whole thing.` | Filmstrip renders as soon as keyframes exist, before analysis finishes. Window handles are usable during analysis; changing the window cancels the in-flight analysis token and starts a new one. | As IMAGE, plus `filters.has_camera_motion` offered as a one-click relaxation when the query was camera-motion-shaped. | As IMAGE. Additionally: if the file has no decodable video stream, `This file has no video track` + `( use as image instead )`, which moves the handle to `query.image` and switches mode — one click, nothing lost. |
| **BROWSE** | Category grid with all 20 categories, each showing a `visual_hint` thumbnail and a node count. This state is **never empty** — it is the product's answer to "I don't know what Low Angle means". | Tile skeletons only. Taxonomy is local JSON, so this state is typically imperceptible. | `No tiles match "{keyword}" in {category}.` + `( search all categories )` + `( clear keyword )`. Alias and related hits are shown as `did you mean` rows before declaring nothing. | Taxonomy load failure is a **fatal-for-browse** state: `Taxonomy could not be loaded.` + `( retry )`. Other modes remain usable, and the intent is untouched. |

### 10.2 Per-region states

| Region | Empty | Loading | Error |
|---|---|---|---|
| **R5 intent** | `Nothing chosen yet. Type, drop an image, or browse — everything you pick lands here.` The 19 row headings are still rendered greyed, so the shape of the thing is visible from the start. | n/a (intent is synchronous) | A chip whose taxonomy id is missing from the current taxonomy renders as a **custom chip with a `deprecated node` badge** and a `replaced_by` swap offer — never dropped, never an error. |
| **R6 results** | `Results appear here. Every card can be used, taken apart, or explored.` | Skeleton cards at the real card size (no layout shift), `aria-busy="true"`. | §10.1 per mode. A single card whose media 404s shows a placeholder + `moved`/`gone` badge and stays fully actionable — its attributes are metadata, not pixels. |
| **R7 detail** | n/a (only opens for a selected reference) | Attribute list renders from cached metadata immediately; media resolution is async and only affects the image area. | `Media unavailable ({state}).` + `( open source page )` + `( re-resolve )`. The licence tab still renders the complete stored attribution — **credit survives a dead URL**. |
| **R8 mix** | `Nothing in the mix. Use EXTRACT on a card to take just its lighting, or just its outfit.` | n/a | An entry whose reference cannot be resolved renders from its last known metadata with an `unresolved` badge and stays removable. It is never silently dropped from `mix.references`. |
| **R9 difference** | Collapsed to a single line: `Search by Difference — keep some categories, change others.` | n/a | Overlapping keep/change is **prevented** (the checkbox is disabled with a reason), not reported after the fact. |
| **R10 composer** | `Your prompt builds itself as you go.` with the 13 slot names greyed. | n/a — `formatPrompt` is pure and synchronous. | Blocked slots (§7.3). A missing taxonomy node yields `reason: "missing_taxonomy"` rendered as `{slot}: 1 term needs attention`, with the offending chip linked in R5. |
| **R12 disclosure** | n/a | n/a | If the adapter is unreachable **after** consent, the failure is reported in R3b/R3c as an analysis error; consent is **not** revoked, but no retry happens automatically. |

### 10.3 Global degraded states

| Condition | Behaviour |
|---|---|
| `ai.enabled == false` | The default, and a complete product (INV-AI-1). R1 shows `AI ○ OFF`. `results.ranking.mode` is `metadata_only` / `keyword_only`. Analysis surfaces show `Analysis is off` with a toggle. Query expansion **remains available** — alias and related hops need no model. Nothing is hidden or disabled beyond the analyzer itself. |
| Analyzer adapter missing while `analyzer_enabled` | `ANALYZE_MEDIA` is a no-op with `Analyzer adapter "{id}" is not registered.` and a link to settings. The upload is still usable as a query. |
| Embedding adapter missing while `semantic_enabled` | Retrieval silently falls back to `metadata_only`, and `results.ranking.mode` **says so** in the R6 ranking readout. Silent fallback without the readout would be a lie about how results were ordered. |
| Every result filtered out by licence | `12 references matched but none are licence-approved.` + `( show what was excluded )`, which lists them **read-only with their licence ids** and no USE/EXTRACT actions. Visibility of exclusion is not the same as permission to use it. |
| Offline | Provider searches fail with `retry`; local library, taxonomy browse, keyword search, mixing and the composer all keep working, because none of them require the network. |
| Storage quota exceeded on `persist` | Toast `Session not saved: storage full.` The in-memory session is untouched and the modal stays open. Nothing is dropped to make room. |

---

## 11. The end-to-end journey as a state log

### 11.1 Provenance note

The assignment refers to "the section-73 user journey". **The brief numbers exactly one section — "the 9 questions every design doc set must answer (spec section 70)" — and contains no section 73.** The canonical end-to-end narrative for this repository is [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6, constructed from the brief's pipeline, its five pillars and its six success cases. The trace below is that narrative rendered as a state log against `ExplorerState`. Flagged in §12.1.

### 11.2 The log

Notation: `+` added, `~` changed, `=` unchanged. Every row's `open` column is `true` — that column exists to be read, not skipped.

| T | User act | Event | `open` | `mode` | Document tier (`intent` / `mix` / `pins` / `difference` / `filters`) | Disposable tier | History |
|---|---|---|---|---|---|---|---|
| **T0** | Opens the composer | `OPEN_MODAL` | **true** | `text` | all empty; `filters` at defaults (`licence: PD·CC0·CC BY`, `status: [approved]`) | `results: idle` | `[initial]` cursor 0 |
| **T1** | Types `golden hour alley`, hits Search. No model runs. | `SUBMIT_QUERY` → `ADD_CHIP` ×3 (+1 expansion) | **true** | `text` | `intent +time.golden_hour (user 1.0)`, `+scene.alley (user 1.0)`, `+lighting.golden_hour_sun (user 1.0)` — three direct alias hits, scored in [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §3.5 — plus `+lighting.backlit_haze (query_expansion, low)` from one `related` hop; mix `=`; pins `=` | `results: loading → ready`, `ranking.mode = keyword_only` | `+user_query` |
| **T2** | Can't name the angle. Switches to BROWSE, opens `camera_angle`, recognises a picture, clicks it. | `SET_MODE {browse}` → `BROWSE_CATEGORY` → `ADD_CHIP` | **true** | `browse` | **`intent` chips from T1 all `=`** (INV-EXP-1); `+camera_angle.low_angle (user 1.0)`; `query.text` still holds `golden hour alley` | `results` refreshed | `+mode_switch`, `+taxonomy_browse`, `+chip_edit` |
| **T3** | Switches to IMAGE, drops her look reference. Analyzer proposes 5 chips; she accepts 3, rejects the lens guess, locks `composition.rule_of_thirds`. | `SET_MODE {image}` → `ANALYZE_MEDIA` → `ANALYSIS_SETTLED` → `ACCEPT_PROPOSAL` ×3, `REJECT_PROPOSAL` ×1, `EDIT_CHIP {lock}` | **true** | `image` | `intent +composition.rule_of_thirds (locked)`, `+composition.leading_lines`, `+framing.medium_shot`; **T1/T2 chips untouched — the analyzer never overwrites** | `query.image.analysis_status: pending → done` | `+mode_switch`, `+chip_edit` ×3 (coalesced) |
| **T4** | Opens a result card, clicks `EXTRACT → composition` and `EXTRACT → lighting`, then adds the anchor's `lens` alone from the attributes tab. | `SELECT_REFERENCE` → `EXTRACT_ATTRIBUTES` ×3 | **true** | `image` | `mix +entry{img_wikimedia_commons_9f2ab41c, use:[composition,lighting,time,lens], role:"look anchor", priority 10}`; **`pins +` same id in the same reduction** (INV-EXP-4) | `ui.active_panel: detail` | `+reference_extract` |
| **T5** | Still in IMAGE, drops a second file — the outfit photo — and takes `EXTRACT → clothing` only, then × on the beanie chip. | `EXTRACT_ATTRIBUTES` → `UPDATE_MIX_ENTRY {exclude:["clothing.beanie"]}` | **true** | `image` | `mix +entry{img_openverse_1a2b3c4d, use:[clothing], exclude:[clothing.beanie], role:"outfit"}`; `pins +` | preview recomputed | `+reference_extract`, `+chip_edit` |
| **T6** | The outfit photo was shot from above and she wants that angle too, so she pulls `camera_angle` from it — one category, not the whole `camera` group. **Conflict surfaces** against her own T2 chip. She clicks the outfit photo's value. | `EXTRACT_ATTRIBUTES {categories:["camera_angle"]}` → *(detection)* → `RESOLVE_CONFLICT` / `SET_DOMINANT` | **true** | `image` | `mix` entry `img_openverse_1a2b3c4d` gains `use +camera_angle` — without it nothing in that category could contribute and there would be no conflict to surface; `mix.conflicts +cfl_… {camera_angle, arity, open}`; **both chips remain in `intent`**; after the click: `status: resolved`, `strategy: user`, `dominance.camera_angle = img_openverse…` (event 18's precondition holds: that reference now contributes to the category); `intent +mix_resolution` chip | `prompt_preview.blocked = [{slot:"camera", …}] → []` | `+reference_extract`, `+chip_edit` |
| **T7** | Switches to VIDEO, uploads a 6 s clip, scrubs to `1.2 s → 3.4 s`, accepts `camera_motion.dolly_in`, adds `camera_motion.pan_left` with `order: 1`. | `SET_MODE {video}` → `ANALYZE_MEDIA {window}` → `ANALYSIS_SETTLED` → `ACCEPT_PROPOSAL` → `ADD_CHIP` | **true** | `video` | `intent.camera_motion +dolly_in (analyzer_video, evidence t 1.2–3.4, order 0)`, `+pan_left (order 1)`; **everything from T1–T6 `=`**; `query.image` still holds her look reference | `query.video.t_start_s/t_end_s` set | `+mode_switch`, `+chip_edit` |
| **T8** | Marks KEEP = composition, lighting, camera_angle, framing; CHANGE = clothing → `clothing.streetwear`. Browses alternatives, swaps one in. | `SET_KEEP_CHANGE` → `EXPLORE`-driven `SUBMIT_QUERY` → `UPDATE_MIX_ENTRY` | **true** | `video` | `difference {enabled, keep:[…4], change:["clothing"], change_targets:{clothing:["clothing.streetwear"]}, strictness 0.8}`; camera/composition/lighting decisions **untouched** | `results.items[].differs_categories = ["clothing"]` | `+search_by_difference` |
| **T9** | Reads the prompt. Hovers a fragment; it names its chip, category and reference. | `COMPOSE` | **true** | `video` | all `=` — composing is pure recomputation | `prompt_preview` rebuilt; `lens` fragment reads **`35mm-like perspective`**, never `35mm` (INV-LENS-1/2) | — |
| **T10** | Saves a Visual Recipe. | `SAVE_RECIPE` | **true** | `video` | all `=`; session marked clean | `VisualRecipe` persisted with frozen `ReferenceSnapshot`s + `license_summary` (INV-RCP-1) | — |
| **T11** | Switches `prompt_mode` from `generic` to another formatter; exports `visual_intent` and `reference_mix`. | `COMPOSE {prompt_mode}` | **true** | `video` | all `=` — the formatter is a leaf, not a dependency | `prompt_preview` re-rendered under the new mode | — |
| **T12** | Presses Escape at the top level. | *(no event)* → confirmation → `CLOSE_MODAL {confirmed:true}` | **true → false** | — | untouched by the confirmation; only the explicit third button could have discarded anything, and she chose "save recipe, then leave" at T10 | — | — |

### 11.3 What the log proves

| Claim | Evidence in the log |
|---|---|
| **The modal never closes mid-exploration.** | `open == true` in every row from T0 to T11. The only `false` is T12, following an explicit user dismissal through a confirmation. |
| **Mode switches are lossless.** | Three switches (T2, T3, T7) — T4–T6 all run inside IMAGE without one. After each, every document-tier field is `=`, and `query.text` from T1 is still intact at T7 — six steps and three modes later. |
| **AI adds, never owns.** | T1 and T2 run with no model at all and produce a working intent and result set. T3 and T7 add proposals that require an explicit accept; T3's rejected lens guess leaves no trace in `intent` — the `lens` fragment T9 reads is the anchor's own attribute, taken by hand at T4. |
| **Conflicts are surfaced, not resolved.** | T6: both competing chips stay in `intent`, the `camera` slot is `blocked` rather than guessed, and the resolution is a human click recorded with `strategy: "user"` and remembered in `dominance`. |
| **Selective inheritance is real.** | T4 takes composition + lighting from one reference and T5 takes clothing (minus the beanie) from another. Neither took a picture; both took parts. |
| **A recipe is a combination, not a prompt.** | T10 saves intent + mix + frozen snapshots. T11 re-renders the same combination under a different formatter without touching any of it. |

---

## 12. Assumptions, invented names and cross-document claims

### 12.1 Names and decisions introduced by this document

Everything below is **runtime or presentation vocabulary**. None of it appears in a schema, and none of it is persisted, with the noted exception of `ui.*` (already schema-defined).

| Item | What it is | Why it was needed |
|---|---|---|
| Region ids `R1`–`R12` | Layout addressing for the annotated diagram and the region table | The canonical model defines state, not layout regions; a region table needs stable handles |
| The ASCII layout itself | Design commitment for this repository, structurally identical to [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.2 | **The brief contains no ASCII drawing of the modal**; it fixes behaviour and card actions only |
| Pin tray strip (R11) and its 50-pin cap | Layout + a concrete cap | `pinned_reference_ids` needs a home in the layout; an uncapped tray degrades into an unusable strip |
| Events `OPEN_MODAL`, `ADD_CHIP`, `EXPLORE_FROM_CARD`, `SAVE_RECIPE`, `SET_UI`, `RESTORE_ENTRY`, `DISCLOSURE_ANSWERED` | Event names beyond [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.3's list | Browse-tile clicks, EXPLORE actions, recipe saving, `ui` mutation, explicit intent restore and consent all need addressable events |
| `explore_action` enum (9 values) | Runtime discriminator for the EXPLORE menu | The brief lists nine actions in prose; the persisted trace is `origin_categories` on the history entry |
| `chip_edit` coalescing window of 1500 ms | History-push behaviour | Prevents a burst of chip toggles burying the previous search |
| Conflict, blocked-slot, empty-state and error-state **copy patterns** | UI text | The line between "error" and "decision" is entirely in the wording; leaving it to implementers reliably produces red error states |
| Keyboard bindings (`Alt+1..4`, `/`, `u`/`x`/`e`/`p`, `Alt+←/→`, `Ctrl/Cmd+Enter`, `Ctrl/Cmd+Shift+C`, `?`) | Shortcut map | No shortcut vocabulary exists upstream |
| The layered Escape ladder (L0–L4) and the dirty-session definition (§8.4) | Behaviour | Escape is the highest-risk key in the UI; "Escape closes the dialog" would discard an unsaved mix |
| Outside-click dismissal **disabled** | Behaviour | A misclick beside the dialog must not be able to end an exploration session |
| History MVP scope: **back only** in v0.1 | Milestone scoping | A forward button without a visible breadcrumb trail is unexplainable and is misread as redo |
| Value committed to `query.text` on every keystroke, while retrieval waits for [`ARCHITECTURE.md`](./ARCHITECTURE.md) §9.2's 180 ms debounce | Input behaviour | Keeps mode switching lossless while typing; only the per-keystroke commit is decided here, the constant is not |

### 12.2 Assumptions about upstream material

1. **The brief has no section 73.** It numbers only "spec section 70". §11 traces [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §6, the canonical narrative for this repository, and says so.
2. **The brief has no ASCII modal layout.** §1 reproduces this repository's canonical layout and says so.
3. The nine EXPLORE actions are read as exactly the brief's list: *find similar, same composition, same lighting, same outfit, same pose, same camera, same scene, similar video, similar image*.
4. WCAG 2.2 AA is adopted as the accessibility target. The brief does not name an accessibility standard; this is a decision made here.
5. The `ui.*` values used in the region table (`active_panel`, `detail_tab`, `chip_filter_category`, `show_conflicts_only`, `composer_open`, `grid_density`) are exactly the schema's; no `ui` field is invented.
6. No claim is made here about any third-party product's behaviour. Where a UI convention is asserted (browser back/forward semantics, WCAG criterion numbers), it is a specification, not an empirical claim.

### 12.3 Claims other documents must agree with

| Claim | Owner / must match |
|---|---|
| `SET_MODE` may reset only `results`, `ui.active_panel` and `selected_reference_id`; every other field is preserved (INV-EXP-1) | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §4.1, [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), `explorer-state.schema.json` |
| `back`/`forward` never push a history entry, and `back`/`forward` are not `origin` values | `explorer-state.schema.json` `history_entry.origin`, [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.4 |
| History pushes truncate the forward tail; FIFO eviction at `max_entries` 200; empty history ⇒ `cursor: -1` | `explorer-state.schema.json` `$defs/history` |
| `back()` does not overwrite the live `intent` unless `restore_intent_on_navigate` or an explicit restore (INV-EXP-3) | `explorer-state.schema.json`, [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.4 |
| Every mix contributor is pinned; `UNPIN` on a contributor is refused (INV-EXP-4) | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.3, `explorer-state.schema.json` `pinned_reference_ids` |
| `difference.keep` and `difference.change` are disjoint, validated before any write (INV-EXP-5) | `explorer-state.schema.json` `$defs/difference` |
| Pins never affect ranking | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) §2.4 |
| EXTRACT has exactly 8 groups covering 17 of 20 categories; `subject`, `appearance`, `action` are excluded and reachable only via USE-everything or manual authoring | `taxonomy-node.schema.json#/$defs/extract_group_map`, [`ARCHITECTURE.md`](./ARCHITECTURE.md) §2 module table, [`ROADMAP.md`](./ROADMAP.md) `GATE-P3-a` |
| The UI expands EXTRACT group names to categories before dispatch; `use` never stores a group name | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §4.3, `reference-mix.schema.json` |
| Removing a mix-contributed value writes `exclude` on the entry rather than deleting the chip | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §11.5 `applyMix` |
| Conflicts are detected and surfaced, never auto-resolved or silently dropped; `auto_resolve` default `false`, `on_unresolved` default `"block"`; `strategy:"user"` and `strategy:"keep_both"` are the only strategies reachable while `auto_resolve` is false (INV-MIX-2) | `reference-mix.schema.json`, [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §11.6, [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §5 |
| Conflict ids are deterministic, so a resolution survives recomputation | `reference-mix.schema.json` `Conflict.id` |
| Arity is a conflict-detection rule, not a cardinality limit — no `maxItems` on single-dominant categories (INV-MIX-4) | `visual-intent.schema.json` (absence), [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §3.1, §11.8 |
| A blocked slot is reported in `blocked[]` and rendered as a pending decision, never an error or a silent omission | `structured-prompt.schema.json` `BlockedSlot`, [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §12.3 |
| `analysis_status` includes `mocked` as a first-class v0.1 state | `explorer-state.schema.json` `$defs/media_query`, [`ROADMAP.md`](./ROADMAP.md) v0.1 |
| Disclosure precedes transmission; the gate blocks the effect and never defaults to allow | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §10 privacy table, `explorer-state.schema.json` `ai.external_transmission` |
| With AI off the product is complete, and `expansion_enabled` stays available (INV-AI-1) | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §5, [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md), [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) §8.1 |
| Lens fragments are always hedged (`35mm-like perspective`, never `35mm`) (INV-LENS-1/2) | `visual-intent.schema.json`, `taxonomy-node.schema.json`, [`../data/taxonomy/lens.json`](../data/taxonomy/lens.json) |
| `camera_motion` cannot be authored by `analyzer_image`; `type:image` references carry no `camera_motion` (INV-VID-1/2) | `visual-intent.schema.json`, `reference.schema.json` |
| Media rot degrades the card, never the recipe; attribution is stored text and survives a dead URL | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §10.4 R1–R5 |
| Default filters: `licence` = the allowed-by-default set, `status` = `["approved"]` | `explorer-state.schema.json` `$defs/filters`, [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| `ui.*` never influences retrieval, intent or the prompt | `explorer-state.schema.json` `$defs/ui_state`, [`ARCHITECTURE.md`](./ARCHITECTURE.md) §11 coupling rules |
| There is no `RESET` and no `CLEAR_ON_MODE_CHANGE` event | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §3.3 |
