# Architecture — Unified Visual Reference Composer

**Purpose:** the system design. It fixes the layer boundaries and the dependency rule, the complete module inventory with public API signatures, the Unified Visual Explorer Modal state machine, the AI adapter ports and capability negotiation, the three canonical data flows, the ComfyUI reuse plan, and the performance, privacy and coupling rules that keep the product from decaying into a prompt builder.

> ### 한국어 요약
> 이 문서는 시스템 설계를 확정합니다. 레이어는 UI → (Search / Prompt / Reference / Providers / AI 어댑터) → Core → Data 순이며, **Core는 아무것도 import 하지 않고**, **Search와 Prompt는 서로를 절대 import 하지 않으며**, **어떤 모듈도 구체적인 AI 백엔드를 import 하지 않습니다**.
> 통합 모달은 `ExplorerState` 하나와 순수 리듀서 `reduceExplorer(state, event)`로 구동되고, 모드를 바꿔도 `intent` · `pinned_reference_ids` · `mix` · `difference` · `filters`는 절대 초기화되지 않습니다 (INV-EXP-1).
> 분석기·임베딩·리랭커는 능력(capability) 객체를 보고하는 교체 가능한 어댑터이며, AI를 완전히 꺼도 브라우즈·키워드 검색·메타데이터 검색·믹스·프롬프트 작성이 모두 동작하는 **완결된 제품**입니다 (INV-AI-1).
> 순수 JS인 core/prompt/taxonomy 모듈은 브라우저와 ComfyUI 양쪽에서 동일하게 재사용되어 `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` 네 가지 출력을 만듭니다.

---

## 0. Document contract and precedence

| Rank | Source | Role |
|---|---|---|
| 1 | `BRIEF.md` (the canonical product brief) | product authority; never contradicted |
| 2 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/) | canonical data model: every field name, enum, id grammar and invariant used below |
| 3 | **this document** | module boundaries, control flow, runtime behaviour |
| 4 | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`ROADMAP.md`](./ROADMAP.md) | depth on one layer each |

Sibling context: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) (why), [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) and [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) (what exists elsewhere), [`research/`](./research/) (primary-source notes), [`../data/taxonomy/`](../data/taxonomy/) (the shipped controlled vocabulary).

This document names **no field, enum value, category key or id prefix that the canonical data model does not define.** Where it needs a name the data model does not supply — a function name, an event name, an effect kind — it defines it here explicitly and lists it in §12.2.

---

## 1. Layer architecture and the dependency rule

### 1.1 The eight layers

```
                       ┌───────────────────────────────────────────────┐
   L5  UI              │ src/ui/ explorer-modal · reference-card ·      │
       (browser only)  │         reference-detail · reference-mixer ·   │
                       │         intent-chips        + app/index.html   │
                       └───────┬───────────┬───────────┬───────────┬───┘
                               │           │           │           │
              ┌────────────────┘           │           │           └──────────────┐
              ▼                            ▼           ▼                          ▼
   ┌────────────────────┐   ┌────────────────────┐  ┌──────────────────┐  ┌────────────────────┐
L4 │  SEARCH            │   │  PROMPT            │  │  REFERENCE       │  │  PROVIDERS         │
   │  query-builder     │   │  prompt-engine     │  │  reference-      │  │  openverse         │
   │  metadata-search   │   │  formatter-generic │  │    manager       │  │  wikimedia         │
   │  semantic-search   │   │                    │  │  license-guard   │  │  local             │
   │  fusion-ranker     │   │                    │  │                  │  │  (network I/O)     │
   └─────┬────────┬─────┘   └─────────┬──────────┘  └────────┬─────────┘  └─────────┬──────────┘
         │        │  ✗ NEVER ────────╳│                      │                      │
         │        └───────────────────┘                      │                      │
         │                                                   │                      │
         ▼                    ┌────────────────────┐         │                      │
   ┌───────────────────┐      │ L3  AI ADAPTER     │         │                      │
   │                   │◀─────│     PORTS          │         │                      │
   │                   │ inj. │ src/ai/ analyzer · │         │                      │
   │                   │      │   embedding ·      │         │                      │
   │                   │      │   reranker         │         │                      │
   │                   │      │ (interfaces +      │         │                      │
   │                   │      │  registry + NULL/  │         │                      │
   │                   │      │  MOCK adapters)    │         │                      │
   │                   │      └─────────┬──────────┘         │                      │
   │                   │                ┆ runtime registration only — NEVER imported │
   │                   │      ┌─────────┴──────────┐         │                      │
   │                   │      │ concrete backends  │         │                      │
   │                   │      │ (out of the module │         │                      │
   │                   │      │  graph entirely)   │         │                      │
   │                   │      └────────────────────┘         │                      │
   ▼                   ▼                                     ▼                      ▼
   ┌──────────────────────────────────────────────────────────────────────────────────┐
L2 │  CORE   src/core/ visual-intent · reference-mix · taxonomy · explorer-state       │
   │  pure, environment-agnostic, imports NOTHING from src/                            │
   └──────────────────────────────────┬───────────────────────────────────────────────┘
                                      │ reads (injected as plain data, never fetched)
                                      ▼
   ┌──────────────────────────────────────────────────────────────────────────────────┐
L1 │  DATA   data/taxonomy/*.json (9 files, 20 categories) · data/presets.json ·       │
   │         data/references.json          — inert JSON, no code, no binaries          │
   └──────────────────────────────────────────────────────────────────────────────────┘
   ┌──────────────────────────────────────────────────────────────────────────────────┐
L0 │  CONTRACT  docs/schemas/*.json — 7 JSON Schemas; the only cross-language truth    │
   └──────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 The dependency rule, stated as law

1. **Core is a leaf.** `src/core/*` imports nothing from `src/`. It has no DOM, no `fetch`, no `window`, no filesystem, no clock it did not receive (`ctx.now`), no randomness. Taxonomy and reference data arrive as function arguments.
2. **UI depends on Core.** Every other layer's job is to be replaceable underneath the UI without the UI's state model changing.
3. **Nothing depends on UI.** `src/ui/*` is imported only by `app/index.html`.
4. **Search and Prompt never import each other.** Not directly, not through a shared helper module, not through a barrel file. Their only shared vocabulary is Core (`VisualIntent`, `TaxonomyNode`, category enums). This is the brief's "no coupling of search with prompt composer", enforced as a graph property rather than a convention.
5. **Nothing imports a concrete AI backend.** `src/ai/*` defines *ports* (interfaces), a registry, and the `NULL_*` / `MOCK_*` adapters. A real backend is registered at runtime by the host and never appears as an `import` specifier anywhere in `src/`. This is the brief's "no AI-model-dependent architecture" and INV-AI-2.
6. **Search and Prompt receive adapters by injection**, as parameters. `src/search/semantic-search.js` never imports `src/ai/embedding.js`; it accepts an object satisfying the `EmbeddingAdapter` shape.
7. **Providers are the only modules besides AI adapters permitted to perform network I/O** (§10).
8. **Prompt imports neither Search, Providers, Reference nor AI.** Prompt's entire input is `(VisualIntent, Taxonomy, ReferenceMix?)`. It cannot know a network exists.

### 1.3 Dependency matrix

Row **may import** column. `✗` is a build-breaking violation, not a smell.

| ↓ imports → | core | search | prompt | reference | providers | ai (ports) | ui | concrete AI backend |
|---|---|---|---|---|---|---|---|---|
| **core** | ✓ (within) | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **search** | ✓ | ✓ | **✗** | ✗ | ✗ | **inject only** | ✗ | ✗ |
| **prompt** | ✓ | **✗** | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| **reference** | ✓ | ✗ | ✗ | ✓ | **inject only** | ✗ | ✗ | ✗ |
| **providers** | ✓ (types) | ✗ | ✗ | ✗ | ✓ | ✗ | ✗ | ✗ |
| **ai (ports)** | ✓ (types) | ✗ | ✗ | ✗ | ✗ | ✓ | ✗ | **✗** |
| **ui** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |

"inject only" means: the module names the interface in its documentation and accepts an implementation as an argument; it contains no `import` of the providing module.

**Enforcement.** A dependency-lint step (`tests/arch/dependency-rule.test.js`) parses every `import` specifier in `src/**` and fails the build on any `✗` cell, on any `src/ai/**` file importing outside `src/core`, and on any `src/{core,prompt}/**` file referencing `window`, `document`, `fetch`, `localStorage` or `node:`. The rule is machine-checked because a rule that is only written down is a rule that erodes in month three.

### 1.4 Why these seams and not others

| Seam | Why it exists |
|---|---|
| Core ⟂ everything | The intent, the mix, the taxonomy and the modal state machine are the product. They must be testable with no browser, no network and no model, and portable to the ComfyUI node unchanged (§8). |
| Search ⟂ Prompt | The brief forbids the coupling explicitly. Structurally: a search result must never be able to write into the prompt, and a prompt change must never trigger retrieval. `results` never writes into `intent` — the UI does, on an explicit user action. |
| Analyzer ⟂ Retriever | The brief's "Analyzer understands; retriever ranks." An analyzer produces an intent proposal; a retriever produces a ranking. They share `Reference` and nothing else. Merging them would make "AI off" impossible, because retrieval would inherit the analyzer's dependency. |
| Ports ⟂ backends | Model swap (brief question 7) has to be a registration change, not a refactor. |
| Providers ⟂ everything above | Wikimedia and Openverse have different pagination, different licence vocabularies and different failure modes. All of it is normalised at the provider boundary into `Reference`, so no upper layer contains the substring `wikimedia`. |
| Reference ⟂ Search | Licence approval is a *gate*, not a ranking signal. `license-guard` decides `approved`; search merely filters on `status`. INV-LIC-3 lives on the gate side, where it cannot be weighted away. |

---

## 2. Module inventory

The brief's target layout is reproduced **exactly**. Two files are added inside `src/core/` and flagged; nothing is renamed, moved or omitted.

```
app/index.html
src/core/{visual-intent, reference-mix, taxonomy, explorer-state*, visual-recipe*}.js
src/search/{query-builder, metadata-search, semantic-search, fusion-ranker}.js
src/prompt/{prompt-engine, formatter-generic}.js
src/reference/{reference-manager, license-guard}.js
src/providers/{openverse, wikimedia, local}.js
src/ai/{analyzer, embedding, reranker}.js
src/ui/{explorer-modal, reference-card, reference-detail, reference-mixer, intent-chips}.js
data/taxonomy/{framing, camera, lens, pose, motion, clothing, scene, lighting, style}.json
data/{presets, references}.json
docs/{PRODUCT_VISION, COMPETITIVE_ANALYSIS, ARCHITECTURE, DATA_SCHEMA, SEARCH_ARCHITECTURE,
      LICENSE_POLICY, THIRD_PARTY_REVIEW, ROADMAP}.md + docs/schemas/*.json
tests/                                   (unit, conformance, arch lint)
LICENSE, THIRD_PARTY_NOTICES.md, README.md
```

`*` = added beyond the brief's list, with rationale in §12.2. All modules are ES modules with no build step; `app/index.html` loads `src/ui/explorer-modal.js` directly as `type="module"`.

### 2.1 `src/core/` — pure, environment-agnostic, imports nothing

#### `taxonomy.js` — the controlled vocabulary and the three constant tables

Owns loading and querying `TaxonomyNode`s and re-exports the frozen tables that the schemas carry as `const` in `taxonomy-node.schema.json#/$defs`. It never ranks and never scores (that is Search's job).

```js
loadTaxonomy(files: TaxonomyFile[], opts?) -> Taxonomy
  // pure; validates INV-TAX-1/2/3/4/5/6; computes the `children` derived cache;
  // builds the symmetric closure of `conflicts_with`; throws on a parent cycle.

Taxonomy.get(id)                -> TaxonomyNode | undefined
Taxonomy.has(id)                -> boolean
Taxonomy.byCategory(category)   -> TaxonomyNode[]        // sort_order asc, then id asc
Taxonomy.roots(category)        -> TaxonomyNode[]        // parent === null
Taxonomy.children(id)           -> TaxonomyNode[]        // derived cache, never trusted from disk
Taxonomy.ancestors(id)          -> TaxonomyNode[]
Taxonomy.related(id)            -> TaxonomyNode[]
Taxonomy.resolve(id)            -> { id, rewritten: boolean, from?: string }   // replaced_by chain
Taxonomy.fragment(id, mode)     -> string   // model_hints[mode] ?? prompt_fragment ?? label ?? humanize(id)
Taxonomy.negativeFragment(id)   -> string   // negative_fragment ?? "no " + fragment
Taxonomy.arity(category)        -> "single_dominant" | "multi"
Taxonomy.exclusivityGroup(id)   -> string | null
Taxonomy.conflictsWith(a, b)    -> boolean  // symmetric
Taxonomy.mediaScope(id)         -> ("image"|"video")[]
Taxonomy.version               -> integer

// frozen tables, mirroring the schema $defs — defined ONCE, here
VISUAL_CATEGORIES              // 20, brief order
INTENT_CATEGORIES              // 19 = VISUAL_CATEGORIES minus "props"
PROMPT_SLOTS                   // 13, brief order
CATEGORY_ARITY                 // 7 single_dominant / 13 multi
CATEGORY_TO_PROMPT_SLOT        // 20 -> 13
PROMPT_SLOT_EMIT_ORDER         // multi-source slot ordering
EXTRACT_GROUPS                 // 8 groups -> categories
humanize(id) -> string
```

#### `visual-intent.js` — the intent document

```js
EMPTY_INTENT()                                   -> VisualIntent   // 20 keys, arrays empty, confidence {}
normalizeVisualIntent(input, ctx)                -> NormalizeResult
  // ctx = { taxonomy, default_source = "user", default_ref_id = null, now, locale, keep_confidence? }
  // NormalizeResult = { intent: VisualIntent, rewrites: {from,to}[], warnings: Warning[] }
  // Implements the 8-step contract in the data model. Idempotent. Total: an unknown taxonomy id
  // becomes a custom:true chip, never an error.
compactVisualIntent(intent)                      -> { compact: VisualIntentCompact, warnings }
  // drops custom and negated chips WITH a warning; lossless for the semantic payload
aggConfidence(intent, category)                  -> number         // max, not mean; 1.0 if any chip locked/user
recomputeConfidence(intent)                      -> VisualIntent   // derived-cache rule 0.3
targetArrayFor(category, value)                  -> intent_category // props.* -> "scene"
addChip(intent, category, chip, ctx)             -> VisualIntent   // dedupe = AGREEMENT, then sort
removeChip(intent, selector)                     -> VisualIntent   // selector: chip_id | {category,value}
updateChip(intent, chip_id, patch)               -> VisualIntent
setLocked(intent, chip_id, boolean)              -> VisualIntent
setNegate(intent, chip_id, boolean)              -> VisualIntent
swapAlternative(intent, chip_id, alt_value)      -> VisualIntent
removeContributionsOf(intent, reference_id)      -> VisualIntent   // "remove everything B gave me"
diffIntent(a, b)                                 -> { added, removed, changed }
mergeIntent(base, incoming, policy)              -> VisualIntent   // user/locked chips immovable
validateIntent(intent, taxonomy)                 -> Violation[]    // INV-INT-2/3/4, LENS-1, PROPS-1, VID-1/3
wrapIntentDocument(intent, meta)                 -> VisualIntentDocument
```

All mutators are **immutable** (structural sharing, new root object) so the UI can diff by reference identity and the history can hold snapshots cheaply.

#### `reference-mix.js` — selective inheritance and conflict detection

```js
EMPTY_MIX()                                          -> ReferenceMix   // { references: [] }
addEntry(mix, entry)                                 -> ReferenceMix   // INV-MIX-1: reference_id unique
updateEntry(mix, reference_id, patch)                -> ReferenceMix
removeEntry(mix, reference_id)                       -> ReferenceMix
expandUse(entry, reference)                          -> visual_category[]  // "*" -> categories actually present
applyMix(mix, referencesById, base_intent, taxonomy) -> { intent, conflicts }
  // pure and deterministic; the 7-step contract. Nothing deleted, nothing auto-picked.
detectConflicts(intent, taxonomy, mix)               -> Conflict[]     // kinds: arity | exclusivity_group | explicit
conflictId(category, group, values)                  -> "cfl_…"        // sha1(...).slice(0,12), deterministic
resolveConflict(mix, conflict_id, resolution)        -> ReferenceMix   // INV-MIX-3
ignoreConflict(mix, conflict_id, actor)              -> ReferenceMix   // explicit human "let them coexist"
setDominance(mix, category, reference_id)            -> ReferenceMix   // consulted FIRST, suppresses re-asking
persistMix(mix, ctx)                                 -> PersistedReferenceMix  // adds schema_version + mix_ id
```

#### `explorer-state.js` *(added — §12.2)* — the modal state machine

```js
initExplorerState(opts)                       -> ExplorerState
reduceExplorer(state, event, ctx)             -> { state, effects: Effect[] }
  // PURE. Never awaits, never fetches, never touches the DOM. Every side effect is returned
  // as a plain descriptor for the host to run.
EXPLORER_EVENTS                                // frozen list, §3.3
pushHistory(state, origin, meta)              -> ExplorerState        // truncate-forward-tail semantics
navigate(state, delta)                        -> { state, effects }   // back/forward; pushes nothing
replayEntry(state, entry, { apply_intent })   -> { state, effects }
deriveCapabilityProfile(ai_settings, capability_records) -> CapabilityProfile   // §5.4
selectPromptPreview(state, taxonomy)          -> StructuredPromptDocument       // derived selector
assertExplorerInvariants(prev, next, event)   -> Violation[]          // INV-EXP-1/3/4/5; dev + test only
```

#### `visual-recipe.js` *(added, deferred to the recipe milestone — §12.2)*

```js
buildRecipe(state, references, ctx)   -> VisualRecipe        // freezes ReferenceSnapshots (INV-RCP-1)
openRecipe(recipe, taxonomy)          -> { state_patch, notices }
  // re-derives the prompt; emits a "regenerated" notice instead of trusting prompt_preview;
  // rewrites deprecated ids via replaced_by, or keeps them as custom chips badged "deprecated"
summarizeLicenses(snapshots)          -> license_summary     // re-exported from license-guard's classifier
contentHash(recipe)                   -> string              // integrity.content_hash
bumpVersion(recipe)                   -> VisualRecipe        // monotonic content revision
```

### 2.2 `src/search/` — retrieval only; never composes prompt text

| File | Responsibility |
|---|---|
| `query-builder.js` | Turns `ExplorerState` into a `Query`. The only module that reads the whole state for retrieval purposes. |
| `metadata-search.js` | The AI-free path: inverted keyword index over taxonomy and references, structured filtering. |
| `semantic-search.js` | Vector index and kNN. Adapter-injected; degrades to empty when no embedding adapter is registered. |
| `fusion-ranker.js` | Fuses metadata + semantic score sets, applies the optional reranker, builds the `ResultSet`. |

```js
// query-builder.js
buildQuery(state)                              -> Query
  // Query = { query_id, text_terms[], expansion[], intent_filters, filters,
  //           difference?, ranking, embedding_key|null }
buildKeywordQuery(text, taxonomy, opts)        -> { terms[], node_hits[], expansions[] }
buildMetadataFilter(intent, filters)           -> MetadataFilter
buildDifferenceQuery(difference, anchor, taxonomy)
  -> { keep_filters, change_negatives, change_targets, diversity_boost, strictness }
  // asserts INV-EXP-5: keep ∩ change === ∅
nextQueryId()                                  -> string     // monotonic; stale responses are dropped

// metadata-search.js
buildIndex(taxonomy, references)               -> SearchIndex   // inverted index, built incrementally
searchTaxonomy(index, text, opts)              -> ScoredNode[]  // the 4.5 scoring table, verbatim
searchReferences(index, query, opts)           -> ScoredRef[]
filterReferences(references, filters)          -> Reference[]   // status default ["approved"]
expandRelated(index, node_ids, hops = 1)       -> ScoredNode[]  // 0.35 × source score; no model involved
KEYWORD_SCORES                                                  // frozen scoring constants

// semantic-search.js
createSemanticIndex(opts)                      -> SemanticIndex        // partitioned by embedding_key
SemanticIndex.upsert(reference_id, record)     -> void
SemanticIndex.remove(reference_id, key?)       -> void
SemanticIndex.has(reference_id, key)           -> boolean
SemanticIndex.size(key)                        -> number
SemanticIndex.knn(vector, { k, key, filter })  -> ScoredRef[]
embedQuery(adapter, payload)                   -> Promise<EmbeddingRecord>   // adapter INJECTED
buildIncremental(index, references, adapter, { budget_ms, signal })
  -> AsyncIterable<{ done, indexed, total }>   // §9.4

// fusion-ranker.js
fuse(sets, ranking)                            -> ResultItem[]
  // weighted_sum (default semantic 0.6 / metadata 0.4) or rrf
applyReranker(items, adapter, query, opts)     -> Promise<ResultItem[]>   // no-op when adapter is null
buildResultSet(items, query, ranking, meta)    -> ResultSet
DEFAULT_RANKING  // { mode:"hybrid", semantic_weight:0.6, metadata_weight:0.4, fusion:"weighted_sum" }
```

`ranking.mode` falls back to `metadata_only` / `keyword_only` when no embedding adapter is present (INV-AI-1). Depth: [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md).

### 2.3 `src/prompt/` — composition only; cannot see the network

```js
// prompt-engine.js
buildStructuredPrompt(intent, taxonomy, mix?)  -> { prompt: StructuredPrompt, blocked: BlockedSlot[] }
  // routes 20 categories onto 13 slots; negate:true overrides to `constraints`;
  // a category with an OPEN conflict is reported in blocked[], never guessed (on_unresolved="block")
routeChip(chip)                                -> prompt_slot
orderFragments(slot, fragments)                -> PromptFragment[]   // PROMPT_SLOT_EMIT_ORDER, then order/confidence/value
registerFormatter(mode, formatter)             -> void               // formatter_mode is an OPEN string
getFormatter(mode)                             -> Formatter          // unknown mode -> "generic", with a warning
formatPrompt(structured_prompt, mode, options)
  -> { text, negative_text?, blocked[], warnings[], slot_order[] }   // INV-FMT-1/2/3
toPromptDocument(result, meta)                 -> StructuredPromptDocument
FORMATTER_VERSION

// formatter-generic.js  — the reference formatter; the only one that must exist
formatGeneric(structured_prompt, options)      -> { text, negative_text, warnings, slot_order }
GENERIC_SLOT_ORDER  // subject, appearance, clothing, action, motion, scene, lighting,
                    // composition, framing, camera, lens, style, constraints
joinSlot(slot, fragments, options)             -> string
```

A formatter is a **leaf plugin**: a pure `(StructuredPrompt, options) -> {text,…}` function registered by mode name. Adding `flux` or `qwen_image` support is one new file plus optional `model_hints` keys on taxonomy nodes. No model backend is named anywhere in this layer.

### 2.4 `src/reference/`

```js
// reference-manager.js
createStore(opts)                              -> ReferenceStore
mintReferenceId(type, source, source_id)       -> string   // deterministic; dedupes across sessions
normalizeReference(raw, ctx)                   -> Reference
  // recomputes every derived cache: aspect_ratio, orientation, search_text,
  // license_policy_class, requires_attribution, share_alike. INV-REF-1/2/3 checked.
ReferenceStore.put / get / getMany / list / query / remove
snapshot(reference)                            -> ReferenceSnapshot   // no embeddings, no binaries
resolveMedia(snapshot, providers)              -> Promise<{ media_state, resolved_media_url, media_checked_at }>
  // R3 order: HEAD media_url -> provider.getMetadata(source_id) -> "gone", record KEPT
attributeConfidence(reference, taxonomy_id)    -> number    // attribute_meta[id].confidence ?? 0.7
buildSearchText(reference)                     -> string

// license-guard.js
classifyLicense(license_id)  -> { policy_class: "allowed"|"optional"|"excluded",
                                  requires_attribution, share_alike }
defaultLicenseFilter()       -> license_id[]   // public_domain, pdm, cc0, cc_by, user_owned
runLicenseCheck(reference, policy)             -> GuardStep
runSourceValidation(reference, providers)      -> Promise<GuardStep>
buildAttribution(reference)                    -> { attribution, credit_line }
approve(reference, actor)                      -> { reference, violations: Violation[] }
  // INV-LIC-1/2 schema-level + INV-LIC-3 process-level: license_check and source_validation
  // must both be "pass". Unverified licence can never reach `approved`.
summarizeLicenses(snapshots)                   -> license_summary   // has_excluded ⇒ warn + no default export
```

### 2.5 `src/providers/` — the only outward network surface besides AI adapters

All three implement one interface, exactly as the brief specifies:

```js
id            : provider_source            // "openverse" | "wikimedia_commons" | "local"
capabilities()-> { supports_video, supports_license_filter, page_size_max,
                   rate_limit_per_min, requires_attribution_always, offline }
search(query, filters)  -> Promise<{ items: Reference[], total, cursor, warnings[] }>
getMetadata(id)         -> Promise<ReferenceMetadata>
getPreview(id)          -> Promise<{ thumbnail_url, media_url, width, height, mime_type }>
```

Every provider **normalises to `Reference` at its own boundary** — its own licence strings mapped onto `LICENSE_ID`, its own ids folded into `mintReferenceId`, its own attribution assembled into `metadata.attribution` as stored text (R4). Nothing above `src/providers/` contains a provider-specific branch. `local.js` reads `data/references.json` and user uploads, is the only provider available offline, and never emits an `upl_` handle whose bytes left the device.

Priority order is a policy constant, not a code path: **Wikimedia Commons, then Openverse** ([`LICENSE_POLICY.md`](./LICENSE_POLICY.md)).

### 2.6 `src/ai/` — ports, registry, null and mock adapters. No backends.

Each file exports: the port's documented shape, a registry, a `NULL_*` adapter (all capabilities false — the AI-OFF path), and where useful a `MOCK_*` adapter (v0.1's `analysis_status: "mocked"`). Signatures in §5.

### 2.7 `src/ui/` — browser only; the only layer that may touch the DOM

| File | Responsibility | Public API |
|---|---|---|
| `explorer-modal.js` | Mounts the one modal; owns the dispatch loop `dispatch → reduceExplorer → render + run effects`; renders mode tabs, the four query surfaces, the shared filter bar. | `mountExplorerModal(el, deps) -> { dispatch, getState, subscribe, destroy }` |
| `reference-card.js` | One result tile: thumbnail, licence badge, USE / EXTRACT×8 / EXPLORE actions, pin toggle. Fixed height for virtualization. | `renderReferenceCard(reference, handlers, caps) -> HTMLElement`, `CARD_SIZE` |
| `reference-detail.js` | The decomposition panel: all 20 categories of `visual_attributes` — the 17 reachable through the 8 EXTRACT groups plus `subject`, `appearance`, `action`, which are shown but reachable only via USE-everything — with per-attribute confidence, EXPLORE-along-one-axis, licence and attribution block, media-state badge. | `renderReferenceDetail(reference, deps) -> HTMLElement` |
| `reference-mixer.js` | The mix panel: entries with `use`/`only`/`exclude`/`role`/`priority`, the conflict two-up with both thumbnails, dominance selector, blocked-slot indicator. | `renderMixer(mix, deps) -> HTMLElement` |
| `intent-chips.js` | The intent editor: 19 rows + confidence, per-chip lock / negate / delete / alternatives menu, provenance hover, `contested` badge, category filter. | `renderIntentChips(intent, deps) -> HTMLElement` |

`deps` always carries `{ dispatch, taxonomy, capabilities }` and never a network client: the UI dispatches events; effects are executed by the effect runner in `explorer-modal.js`.

`app/index.html` is the shell: a `<dialog>`, an ESM import of `explorer-modal.js`, a `fetch` of the nine taxonomy JSON files and `data/presets.json`, and nothing else. It contains no product logic, so the same modules mount unchanged in any other host.

---

## 3. The Unified Visual Explorer Modal

### 3.1 One state object

`ExplorerState` (schema: [`schemas/explorer-state.schema.json`](./schemas/explorer-state.schema.json)) is the *entire* modal. There is no second store, no component-local product state, no ref that survives a render. The rule: **if losing it would annoy the user, it is in `ExplorerState`.**

```
ExplorerState
├─ schema_version "1.0"
├─ mode                    text | image | video | browse
├─ open                    true until an explicit user dismissal
├─ query                   ALL FOUR payloads at once  ────────────────┐
│   ├─ text                                                           │ survives
│   ├─ image  { reference_id, upload_id, thumbnail_url,               │ every
│   │           analysis_status, analysis_error, analyzed_at }        │ mode
│   ├─ video  { …same… , t_start_s, t_end_s }                         │ switch
│   ├─ browse { category, parent, keyword, page }                     │
│   ├─ filters  SHARED across modes ───────────────────────────────────┘
│   └─ expansion
├─ intent                  VisualIntent (full chip form)      ── the document
├─ results                 ResultSet (query_id-guarded)       ── disposable
├─ selected_reference_id   transient; NEVER implies mix membership
├─ pinned_reference_ids    superset of mix members (INV-EXP-4)
├─ mix                     ReferenceMix (+ conflicts, dominance, resolution_policy)
├─ history                 { entries[], cursor, max_entries 200, restore_intent_on_navigate false }
├─ difference              { enabled, anchor_reference_id, keep[], change[], change_targets, strictness }
├─ ai                      { enabled, analyzer_enabled, semantic_enabled, rerank_enabled,
│                            expansion_enabled, adapters{…}, external_transmission{…} }
├─ prompt_mode             formatter_mode, default "generic"
├─ prompt_preview          StructuredPromptDocument (derived)
└─ ui                      { active_panel, detail_tab, chip_filter_category,
                             show_conflicts_only, composer_open, grid_density }
```

Three tiers, and the tier decides the rules:

| Tier | Fields | Rule |
|---|---|---|
| **Document** | `intent`, `mix`, `pinned_reference_ids`, `difference`, `query.filters` | Never reset by a mode switch (INV-EXP-1). Never touched by back/forward (INV-EXP-3). Only explicit user acts change them. |
| **Query** | `query.text/image/video/browse`, `mode` | Held simultaneously; a switch changes visibility, not content. Recorded in history. |
| **Disposable** | `results`, `selected_reference_id`, `ui`, `prompt_preview` | Recomputable. May be dropped at any time. `prompt_preview` is a pure selector of `intent + mix + prompt_mode`. |

### 3.2 The loop

```
   user gesture
        │
        ▼
   dispatch(event)
        │
        ▼
   reduceExplorer(state, event, ctx)   ── PURE. no await, no fetch, no DOM.
        │
        ├──▶ next state ──▶ render(state)            (UI diff)
        │
        └──▶ effects: Effect[]  ──▶ effectRunner     (impure, in explorer-modal.js)
                                        │
                                        ├─ retrieve      → search layer     ─┐
                                        ├─ analyze       → ai analyzer port  │ results come back
                                        ├─ embed_query   → ai embedding port │ as NEW EVENTS,
                                        ├─ resolve_media → reference layer   │ carrying query_id
                                        ├─ provider_call → providers         │ / token; stale ones
                                        └─ disclose      → UI consent gate  ─┘ are dropped
```

The reducer being pure is what makes INV-EXP-1 and INV-EXP-3 testable as *properties* — `assertExplorerInvariants(prev, next, event)` runs over every event in the test suite — instead of as hopes.

Effect kinds (defined here; §12.2): `retrieve`, `analyze`, `embed_query`, `index_upsert`, `resolve_media`, `provider_call`, `disclose`, `persist`.

### 3.3 The event list

`M` = mutates, `H` = pushes a history entry with that `origin`, `E` = emits effects.

| Event | Payload | M | H | E | Notes |
|---|---|---|---|---|---|
| `SET_MODE` | `{ mode }` | `mode`, may clear `results`, `ui.active_panel` | `mode_switch` | `retrieve` if the target mode's payload is non-empty | **Touches nothing else** (INV-EXP-1). |
| `SUBMIT_QUERY` | `{ mode, payload, filters? }` | `query.<mode>`, `query.filters`, `results.status="loading"` | `user_query` | `retrieve` (+`embed_query` if semantic on) | Debounced upstream (§9.2); carries a fresh `query_id`. |
| `ANALYZE_MEDIA` | `{ mode:"image"\|"video", handle, window? }` | `query.<mode>.analysis_status = "pending"\|"mocked"` | — | `disclose` (if the handle would leave the device), then `analyze` | Returns immediately. **Never blocks the UI** (§9.1). |
| `ANALYSIS_SETTLED` | `{ token, result \| error }` | `query.<mode>.analysis_status`, `analyzed_at`; proposals staged, **not merged** | — | — | Stale token ⇒ discarded. Proposals are greyed until accepted; the analyzer never writes `intent` directly. |
| `ACCEPT_PROPOSAL` / `REJECT_PROPOSAL` | `{ chip \| chip_id }` | `intent` | `chip_edit` (accept) | — | "AI output is a proposal, never a commitment." |
| `SELECT_REFERENCE` | `{ reference_id }` | `selected_reference_id`, `ui.active_panel="detail"` | — | `resolve_media` | Selection is **not** mix membership. |
| `EXTRACT_ATTRIBUTES` | `{ reference_id, groups[] \| categories[] }` | `mix` (upsert entry), `pinned_reference_ids` | `reference_extract` | `retrieve` (mix changed ⇒ preview refresh only, no new search unless asked) | UI expands EXTRACT groups → categories **before** dispatch; `use` never stores a group name. |
| `ADD_TO_MIX` | `{ reference_id, use[], only?, exclude?, role?, priority?, weight? }` | `mix`, `pinned_reference_ids` | `reference_use` | — | `use: ["*"]` = USE-everything. INV-MIX-1 and INV-EXP-4 enforced in the reducer. |
| `UPDATE_MIX_ENTRY` / `REMOVE_FROM_MIX` | `{ reference_id, patch? }` | `mix` | `chip_edit` | — | Removing an entry removes its contributed chips but never `user`/`locked` ones. |
| `SET_DOMINANT` | `{ category, reference_id }` | `mix.dominance`, resolves the matching conflict | `chip_edit` | — | Remembered, so the question is never re-asked on the next edit. |
| `RESOLVE_CONFLICT` | `{ conflict_id, resolution }` | `mix.conflicts[i]`, `intent` (materialises a `mix_resolution` chip) | `chip_edit` | — | `strategy:"user"` is the only strategy reachable while `auto_resolve=false`. |
| `PIN` / `UNPIN` | `{ reference_id }` | `pinned_reference_ids` | — | — | Unpinning a mix contributor is **refused** (INV-EXP-4); the UI offers "remove from mix" instead. |
| `EDIT_CHIP` | `{ chip_id, patch }` (lock, negate, weight, order, swap alternative, delete) | `intent` | `chip_edit` | — | Every chip action is one event; per-chip granularity is the product. |
| `NAVIGATE_BACK` / `NAVIGATE_FORWARD` | — | `mode`, `query`, `query.filters`, `results` | **never** | `retrieve` | Do **not** touch `intent`, `pinned_reference_ids`, `mix` (INV-EXP-3). |
| `SET_KEEP_CHANGE` | `{ keep[], change[], change_targets?, anchor_reference_id, strictness? }` | `difference` | `search_by_difference` | `retrieve` | Rejects overlapping keep/change (INV-EXP-5) before writing. |
| `COMPOSE` | `{ prompt_mode? }` | `prompt_mode`, `prompt_preview` | — | — | Pure recomputation: `buildStructuredPrompt` → `formatPrompt`. No retrieval, ever. |
| `SET_FILTERS` | `{ patch }` | `query.filters` | `user_query` | `retrieve` | Shared across all four modes. |
| `SET_AI` | `{ patch }` | `ai` | — | `disclose` when enabling external transmission | Toggling AI off must never lose a chip. |
| `BROWSE_CATEGORY` | `{ category, parent?, page? }` | `query.browse` | `taxonomy_browse` | `retrieve` | The "I don't know what Low Angle means" path. |
| `LOAD_PRESET` / `LOAD_RECIPE` | `{ id }` | `intent`, `mix`, `pins`, `prompt_mode` | `preset_load` / `recipe_load` | `resolve_media` | Recipe open re-derives the prompt; cached text is advisory. |
| `RESULTS_ARRIVED` | `{ query_id, result_set }` | `results` | — | `index_upsert` | Stale `query_id` ⇒ dropped silently. |
| `CLOSE_MODAL` | — | `open=false` | — | `persist` | The **only** thing that closes the modal. |

Two events are conspicuously absent, on purpose: there is no `RESET`, and there is no `CLEAR_ON_MODE_CHANGE`. Neither can be added without breaking pillar 1.

### 3.4 History: recorded, replayed, and deliberately narrow

An entry is `{ id?, at?, mode, query, intent_snapshot, filters, origin, origin_reference_id?, origin_categories?, label?, result_ref_ids?, ranking_snapshot? }` — **fully self-contained**, so replay needs nothing outside the entry.

```
push(entry):
    if cursor < entries.length - 1:  entries = entries[0 .. cursor]      ← truncate forward tail
    entries.push(entry); cursor = entries.length - 1
    while entries.length > max_entries (200):  entries.shift(); cursor--  ← FIFO from the front
back():     cursor = max(0, cursor - 1)                    ← pushes NOTHING
forward():  cursor = min(entries.length - 1, cursor + 1)   ← pushes NOTHING
empty history ⇒ cursor = -1

replay(entry):
    set mode, query, query.filters from the entry
    re-run retrieval using entry.intent_snapshot
    DO NOT touch pinned_reference_ids, mix, difference
    DO NOT overwrite the live intent unless history.restore_intent_on_navigate === true
       or the caller passes restoreEntry(entry, { apply_intent: true })
```

`back` and `forward` are not `origin` values because navigation records nothing — exactly browser semantics.

**INV-EXP-3, in one sentence a builder can act on:** history is *navigation* history, not *document* history. Going back to an earlier search must never delete the outfit you already collected. The `intent_snapshot` exists so a user can *deliberately* recover an earlier intent, and it is behind an explicit gesture ("restore this intent too") with a `false` default.

---

## 4. The mode-switch invariant

### 4.1 INV-EXP-1, exactly

> Switching `mode` NEVER resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `query.filters`. A mode switch changes which input surface is visible and nothing else. It MAY reset `results` (a new mode implies new retrieval) and `ui.active_panel`. Nothing else.

| Field | On `SET_MODE` |
|---|---|
| `intent` | **preserved** |
| `pinned_reference_ids` | **preserved** |
| `mix` (entries, dominance, conflicts, resolutions) | **preserved** |
| `difference` | **preserved** |
| `query.filters` | **preserved** — one filter bar, shared by four modes |
| `query.text` / `.image` / `.video` / `.browse` | **all preserved simultaneously** |
| `prompt_mode`, `prompt_preview`, `ai`, `history` | preserved |
| `results` | may be cleared |
| `ui.active_panel` | may change |
| `selected_reference_id` | may clear (transient) |

The invariant is cheap because of one structural choice: `query` holds all four payloads at once rather than one polymorphic payload that is replaced on switch. Text → image → text restores the typed text because it was **never discarded**. There is no "save the old mode's input" code path to forget to write.

### 4.2 The modal layout

> **Provenance note.** The brief fixes the *behaviour* — "Text / Image / Video / Browse all operate inside ONE modal… only the input MODE changes… modal state persists across mode switches" — and the card actions (USE / EXTRACT / EXPLORE). It contains no ASCII drawing. The layout below is the canonical layout **for this repository**, derived from those constraints; it is a design commitment made here, not a quotation. Flagged in §12.2.

```
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ UNIFIED VISUAL EXPLORER                              AI ○ OFF  ·  local-only ✓        [ × ] │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▐ TEXT ▌  IMAGE    VIDEO    BROWSE            ← mode tabs; switching changes ONLY this row  │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ QUERY SURFACE  (state.query.<mode> — all four payloads are held at once)                    │
│  text  ▸ [ golden hour alley______________________________ ]                     ( Search ) │
│  image ▸ [ drop file / choose ]  ▤ thumb   status: mocked ⓘ                                 │
│  video ▸ [ drop file / choose ]  ▤ thumb   ├──filmstrip──────────┤  window 1.2s → 3.4s      │
│  browse▸ [ camera_angle ▾ ] [ parent: — ▾ ] [ filter tiles______ ]                          │
│ FILTERS (SHARED, never reset by a mode switch)                                              │
│  licence: PD·CC0·CC BY ▾   type ▾   status: approved ▾   orientation ▾   ⛭ more             │
├──────────────────────────┬───────────────────────────────────────┬─────────────────────────┤
│ INTENT  (19 rows + conf) │ RESULTS  (virtualized grid)           │ MIX  (2 refs)           │
│                          │                                       │                         │
│ framing                  │ ┌────────┐ ┌────────┐ ┌────────┐      │ ▤ A  look anchor        │
│  ▸ medium_shot   🔒 0.81 │ │  ▤     │ │  ▤     │ │  ▤     │      │   use: composition,     │
│ camera_angle    ⚠ 1      │ │        │ │        │ │        │      │        lighting, time   │
│  ▸ low_angle  (you) 1.0  │ │ CC BY  │ │ CC0    │ │ PD     │      │   priority 10 · pinned  │
│  ▸ high_angle  (B) 0.80  │ ├────────┤ ├────────┤ ├────────┤      │                         │
│ clothing                 │ │USE EXT⋯│ │USE EXT⋯│ │USE EXT⋯│      │ ▤ B  outfit             │
│  ▸ hoodie       (B) 0.77 │ │  EXPLORE│ │ EXPLORE│ │ EXPLORE│     │   use: clothing         │
│  ▸ cargo_pants  (B) 0.72 │ └────────┘ └────────┘ └────────┘      │   exclude: beanie       │
│ lighting                 │                                       │                         │
│  ▸ golden_hour_sun  0.66 │  ▸ EXTRACT: composition · camera ·    │ ⚠ 1 DECISION PENDING    │
│ …                        │    pose · clothing · lighting ·       │  camera_angle           │
│                          │    scene · style · motion             │  ▤ low_angle  (from you)│
│ [ chip filter ▾ ]        │                                       │  ▤ high_angle (ref B)   │
│ [ ☐ conflicts only ]     │  KEEP ☑comp ☑light ☑cam  CHANGE ☑cloth │  ( keep mine ) ( use B )│
├──────────────────────────┴───────────────────────────────────────┴─────────────────────────┤
│ COMPOSER   mode: generic ▾            13 slots · 1 slot blocked                             │
│  subject · appearance · clothing · action · motion · scene · lighting · composition ·       │
│  framing · [camera ▒ blocked: unresolved conflict] · lens · style · constraints             │
│  “a woman, a hoodie, cargo trousers, walking, in a narrow alley, during golden hour,        │
│   composed on the rule of thirds, medium shot, 35mm-like perspective, street-style …”       │
│  ( copy )  ( export: prompt · structured_prompt · visual_intent · reference_mix )           │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

Read the layout as an argument: the INTENT column, the MIX column and the COMPOSER row are **always on screen**, in every mode. That is the visible form of "why must image search and prompt building live in ONE UI" — the thing you are building is never off-screen while you search, so search results are evaluated against the thing being built rather than in the abstract. Split into two pages, the composer becomes a destination you visit after searching, and the extract-and-mix loop dies.

---

## 5. Adapter architecture

### 5.1 Shared shapes

```js
MediaHandle = { kind: "upload" | "url" | "reference",
                upload_id?: "upl_…",       // a local handle; NEVER implies bytes left the device
                blob?: Blob, url?: string, reference_id?: string,
                mime_type, bytes?, local_only: boolean }

AdapterCapabilities = {          // every adapter reports this; the UI reads only this
  id, kind: "analyzer"|"embedding"|"reranker", version,
  offline: boolean,              // runs with no network at all
  requires_external_transmission: boolean,
  cost_class: "free"|"local_compute"|"metered",
  ...kind-specific fields below
}
```

`capabilities()` is **synchronous and cheap**. The UI must be able to lay itself out before any model has loaded.

### 5.2 Analyzer port — `src/ai/analyzer.js`

```js
analyzeImage(handle: MediaHandle, opts) -> Promise<AnalyzerResult>
analyzeVideo(handle: MediaHandle, opts) -> Promise<AnalyzerResult>
  // opts: { t_start_s?, t_end_s?, categories?, max_candidates?, signal, locale }
analyzeText(text: string, opts)         -> Promise<AnalyzerResult>

AnalyzerResult = {
  intent   : VisualIntentIngest,   // permissive wire shape; NEVER persisted as-is
  warnings : Warning[],
  adapter_id, model_id?, took_ms
}

AnalyzerCapabilities = {
  ...AdapterCapabilities,
  modalities            : ("image"|"video"|"text")[],
  categories_supported  : visual_category[],   // what it can even propose
  supports_bbox         : boolean,             // evidence.bbox
  supports_timespan     : boolean,             // evidence.t_start_s / t_end_s  → video only
  supports_shot_boundaries : boolean,
  max_pixels?, max_duration_s?, batch_max?
}

// registry
createAnalyzerRegistry() -> { register(adapter), get(id), list(), default() }
NULL_ANALYZER   // capabilities: modalities [], everything false — the AI-OFF path
MOCK_ANALYZER   // v0.1: returns a fixed plausible ingest; drives analysis_status "mocked"
```

The façade wraps every call in three guarantees the UI can rely on:

1. **Egress gate first** (§10). A `local_only` handle is refused before the adapter is touched.
2. **Normalisation.** The result passes through `normalizeVisualIntent(result.intent, { default_source: "analyzer_image" | "analyzer_video" | "analyzer_text" })`. An adapter may return sloppy input; the core makes it legal.
3. **Post-condition enforcement.** Chips violating INV-VID-1 (a `camera_motion` chip sourced `analyzer_image`) are **dropped with a warning**, not persisted. Chips in `motion` from `analyzer_image` are clamped to `evidence.kind: "implied"` and `confidence ≤ 0.6` (INV-VID-3) and are kept only for nodes flagged `still_inferable: true`. A misbehaving third-party adapter therefore cannot corrupt the epistemic stance of the product.

Analyzer output is always a **proposal**: it lands in the staging area of `query.<mode>` and reaches `intent` only through `ACCEPT_PROPOSAL`.

### 5.3 Embedding and reranker ports

```js
// src/ai/embedding.js
embedImage(handle, opts) -> Promise<EmbeddingRecord>
embedVideo(handle, opts) -> Promise<EmbeddingRecord>
embedText(text, opts)    -> Promise<EmbeddingRecord>
EmbeddingCapabilities = { ...AdapterCapabilities,
  embedding_key,   // "<family>_<size>@<rev>" — the Reference.embeddings map key
  dim, modality: "image"|"video"|"text"|"multimodal",
  normalized: true, quantization: "f32"|"f16"|"int8"|"binary", batch_max }
NULL_EMBEDDING   // dim 0; semantic search unavailable ⇒ ranking falls back

// src/ai/reranker.js
rerank(query, candidates, opts) -> Promise<{ reference_id, score }[]>
RerankerCapabilities = { ...AdapterCapabilities, max_candidates, pairwise: boolean }
NULL_RERANKER    // identity: returns candidates unchanged
```

`embedding_key` is the whole model-swap story: records are **model-keyed**, several models coexist in one `Reference`, retrieval queries only the active key, and references lacking that key are silently skipped. Swapping the embedding model is a settings change plus a background re-index (§9.4) — never a migration, never a data loss.

`model_id` is opaque. No core, search, prompt or UI code ever branches on its value (INV-AI-2). Candidate local models are evaluated in [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md) and [`research/video-analysis-and-local-runtimes.md`](./research/video-analysis-and-local-runtimes.md) — as candidates, never as dependencies.

### 5.4 Capability negotiation — how the UI degrades gracefully

`deriveCapabilityProfile(ai_settings, capability_records)` in `src/core/explorer-state.js` folds the three `capabilities()` records **and** the user's `ExplorerState.ai` toggles into one flat, boolean-only object the UI reads. It is pure, synchronous, and consumes plain data — which is why it can live in Core without Core knowing that adapters exist.

```js
CapabilityProfile = {
  can_analyze_image, can_analyze_video, can_analyze_text,
  can_extract_camera_motion,      // analyzer.modalities ∋ "video" && supports_timespan
  can_timespan_evidence,
  can_semantic_search,            // embedding adapter present && ai.semantic_enabled
  can_rerank,
  can_expand_query,               // TRUE EVEN WITH AI OFF — alias/related hops need no model
  ranking_modes  : ("hybrid"|"semantic_only"|"metadata_only"|"keyword_only")[],
  active_ranking : one of the above,
  embedding_key  : string | null,
  external_transmission_allowed : boolean,
  degrade_notices: { code, message, affects: ("image"|"video"|"semantic"|"rerank")[] }[]
}
```

UI rules driven by it — all of them **disable-and-explain**, never hide-and-confuse:

| Profile flag false | UI behaviour |
|---|---|
| `can_analyze_image` | IMAGE tab stays enabled; the drop zone accepts the file, `analysis_status` becomes `mocked` (v0.1) or the panel reads "no analyzer configured — add chips by hand or browse". Upload is never rejected. |
| `can_analyze_video` | VIDEO tab enabled; filmstrip and time window still work (they are player features, not model features); chip proposals absent. |
| `can_extract_camera_motion` | The `camera_motion` row shows "video analyzer required"; manual and browse authoring stay available. |
| `can_semantic_search` | The "similar" affordances collapse to structured similarity (shared taxonomy ids), and `ranking.mode` shows `metadata_only`/`keyword_only` in the results header — visibly, so nobody thinks semantic search silently ran. |
| `can_rerank` | Reranker toggle greyed with a tooltip; fusion result is final. |
| `external_transmission_allowed` | Any adapter with `requires_external_transmission` is not selectable until the user consents (§10). |

Every `degrade_notice` renders as a one-line explanation with the missing capability named. The product never presents a dead button and never pretends an absent model ran.

---

## 6. AI-OFF vs AI-ON capability matrix

**INV-AI-1: with `ai.enabled === false` this is a complete product.** Not a demo, not a trial mode. The table is the acceptance test.

| Capability | AI OFF | AI ON | Mechanism |
|---|---|---|---|
| Browse the taxonomy visually (20 categories, thumbnailed tiles) | ✅ full | ✅ full | `data/taxonomy/*.json` + `visual_hint` |
| Learn a term by looking at pictures (S3, S4) | ✅ full | ✅ full | browse tiles; no model involved |
| Keyword search over `id/label/aliases/i18n/description` | ✅ full | ✅ full | inverted index, `metadata-search.js` |
| Alias + `related[]` one-hop query expansion | ✅ full | ✅ full | `expansion_enabled` works with AI off |
| Structured metadata search over `visual_attributes` | ✅ full | ✅ full | `filterReferences` |
| Licence filtering and badges | ✅ full | ✅ full | `license-guard.js` |
| Manual chip authoring, editing, locking, negating | ✅ full | ✅ full | `intent-chips.js` + `visual-intent.js` |
| Reference decomposition view (20 categories; 8 EXTRACT groups covering 17 of them) | ✅ full | ✅ full | stored `visual_attributes` |
| Selective inheritance (`use` / `only` / `exclude`) | ✅ full | ✅ full | `reference-mix.js` |
| Multi-reference mixing + conflict detection + resolution | ✅ full | ✅ full | `applyMix` is pure logic, not inference |
| Structured prompt build + generic formatter | ✅ full | ✅ full | `prompt/` never calls a model |
| Visual Recipe save / open / re-derive | ✅ full | ✅ full | pixel-free data |
| Search by Difference | ✅ **structured**: KEEP/CHANGE as hard filters over taxonomy ids | ✅ **+ diversity re-ranking** on the CHANGE axis | `buildDifferenceQuery` |
| Similar-reference search | ✅ **structured similarity**: shared taxonomy ids, weighted by category | ✅ semantic kNN fused 60/40 | `fusion-ranker.js` |
| Image → chips | ❌ (upload accepted; `mocked` in v0.1) | ✅ analyzer proposals with `bbox` evidence | `analyzeImage` |
| Video → chips, camera motion, timespans | ❌ (upload + filmstrip + manual window still work) | ✅ `analyzer_video`, `t_start_s/t_end_s`, `shot_index` | `analyzeVideo` |
| Free text → taxonomy ids beyond keyword matching | ❌ (keyword + aliases cover the common case) | ✅ `analyzer_text` | `analyzeText` |
| Reranking | ❌ | ✅ optional | `applyReranker` |

Everything in the brief's own v0.1 milestone sits in the **AI OFF** column. That is not an accident of scoping; it is the proof that the architecture does not depend on a model.

**The three consequences a builder must respect:**
1. No feature may be implemented such that its AI-OFF path is an error message. Either the feature degrades to a defined structured behaviour, or it is disabled with a named reason.
2. `results.ranking.mode` is always displayed. A user must always be able to tell which retrieval ran.
3. Turning AI off must never destroy data. Chips authored by an analyzer keep their `source` and stay editable; the intent does not change.

---

## 7. Data flow: three journeys

### 7.1 Journey A — keyword search, AI OFF (the v0.1 path)

```
 user            ui/explorer-modal      core/*            search/*                data/
  │                     │                  │                  │                      │
  │ types "golden hour  │                  │                  │                      │
  │  alley"             │                  │                  │                      │
  ├────────────────────▶│ debounce 180 ms  │                  │                      │
  │                     │ (§9.2)           │                  │                      │
  │                     ├─ dispatch SUBMIT_QUERY(text) ──────▶│                      │
  │                     │                  │ reduceExplorer:  │                      │
  │                     │                  │  query.text set  │                      │
  │                     │                  │  history push    │                      │
  │                     │                  │   origin=user_query                     │
  │                     │◀─ { state, effects:[retrieve q#7] } │                      │
  │                     │                  │                  │                      │
  │                     ├─ effectRunner ──▶ buildQuery(state) │                      │
  │                     │                  │─────────────────▶│ searchTaxonomy       │
  │                     │                  │                  │  "golden hour"→       │
  │                     │                  │                  │  time.golden_hour .90 │
  │                     │                  │                  │  (exact alias)        │
  │                     │                  │                  │  "alley"→scene.alley  │
  │                     │                  │                  │  .95 (exact label)    │
  │                     │                  │                  │  related hop →        │
  │                     │                  │                  │  lighting.golden_hour_sun
  │                     │                  │                  │  0.35 × 0.90          │
  │                     │                  │                  │─── filterReferences ─▶│
  │                     │                  │                  │   status=approved     │
  │                     │                  │                  │   licence ∈ default   │
  │                     │                  │                  │◀──────────────────────│
  │                     │                  │                  │ fuse(): keyword_only  │
  │                     │◀─ dispatch RESULTS_ARRIVED(q#7) ────┤ (no embedding adapter)│
  │                     │                  │ stale-guard: q#7 == state.results.query_id ✓
  │◀─ grid renders ─────┤                  │                  │                      │
  │  chips proposed: 2 user (1.0) + 1 query_expansion (greyed, one click to remove)  │
```

**No model ran.** The scoring table is the whole ranking function, and the `related[]` hop is a graph walk over `data/taxonomy/`. The chips are `source:"user"` for what the user typed and `source:"query_expansion"` for the hop — a distinction the UI renders and the user can act on.

### 7.2 Journey B — image drop → analysis → chips → similar references

```
 user      ui          core/explorer-state    ai/analyzer     core/visual-intent   search/*
  │         │                  │                   │                 │                │
  │ drops   │                  │                   │                 │                │
  │ file    │                  │                   │                 │                │
  ├────────▶│ ANALYZE_MEDIA(handle{local_only:true})                 │                │
  │         ├─────────────────▶│ analysis_status = "pending"          │                │
  │         │                  │ (v0.1: "mocked")                     │                │
  │         │◀─ effects:[ disclose?, analyze(token t1) ] ──────────────                │
  │         │                  │                   │                 │                │
  │         │  ── EGRESS GATE (§10) ──▶ adapter.requires_external_transmission?        │
  │         │      false  → proceed locally                          │                │
  │         │      true   → modal consent FIRST; refuse if local_only │                │
  │         │                  │                   │                 │                │
  │◀─ UI STAYS INTERACTIVE ────┤ (browse, chip editing, mix all usable while analysing)│
  │         │                  │                   │                 │                │
  │         ├─ analyzeImage(handle) ──────────────▶│ (off main thread / worker)        │
  │         │                  │                   │  proposals:                       │
  │         │                  │                   │  composition.rule_of_thirds .88   │
  │         │                  │                   │  framing.medium_shot        .81   │
  │         │                  │                   │  lens.35mm_like             .55   │
  │         │◀─ AnalyzerResult(ingest) ────────────┤                 │                │
  │         │                  │                   │                 │                │
  │         ├─ normalizeVisualIntent(ingest, {default_source:"analyzer_image"}) ─────▶ │
  │         │                  │                   │   • fills 20 keys                │
  │         │                  │                   │   • rewrites deprecated ids      │
  │         │                  │                   │   • INV-VID-1: any camera_motion │
  │         │                  │                   │     chip DROPPED + warning       │
  │         │                  │                   │   • INV-VID-3: motion chips →    │
  │         │                  │                   │     evidence.kind="implied", ≤0.6│
  │         │◀─ normalized proposals ──────────────────────────────────┤              │
  │         ├─ dispatch ANALYSIS_SETTLED(t1, result) ───▶ staged, NOT merged           │
  │◀─ greyed proposal chips with ✓ / ✗ / alternatives ▾                                │
  │ accepts 3, rejects lens                                                            │
  ├────────▶│ ACCEPT_PROPOSAL ×3 ──▶ intent (source stays "analyzer_image")            │
  │         │                  │ history push origin=chip_edit                          │
  │         │                  │                                                        │
  │         ├─ effects:[ embed_query, retrieve q#12 ] ──────────────────────────────▶  │
  │         │    AI ON : embedImage(handle) → knn(embedding_key) ⊕ metadata → fuse 60/40│
  │         │    AI OFF: structured similarity over the accepted chips only             │
  │◀─ similar references ──────────────────────────────────────────────────────────────┤
```

Two seams are load-bearing here. **The analyzer never writes `intent`** — it writes a staging area, and a human event moves chips across. And **the analyzer's output is normalised before it is trusted**, so a third-party adapter cannot introduce a chip the schema forbids.

### 7.3 Journey C — multi-reference mix → conflict → compose

```
 user        ui/reference-card+mixer   core/reference-mix        core/visual-intent   prompt/*
  │                    │                       │                        │               │
  │ EXTRACT ▸ clothing on card B                │                        │               │
  ├───────────────────▶│ expand group→categories│                        │               │
  │                    │ EXTRACT_ATTRIBUTES(B, ["clothing"])             │               │
  │                    ├──────────────────────▶│ addEntry({reference_id:B,               │
  │                    │                       │   use:["clothing"], role:"outfit"})     │
  │                    │                       │ + pinned_reference_ids ∪ {B} (INV-EXP-4)│
  │                    │                       │                        │               │
  │                    │                       │ applyMix(mix, refs, base_intent, tax)   │
  │                    │                       │  entries by priority DESC, position ASC │
  │                    │                       │  expand "*" where used                  │
  │                    │                       │  only[] then exclude[]                  │
  │                    │                       │  chip.confidence =                      │
  │                    │                       │    clamp01((attribute_meta ?? 0.7)      │
  │                    │                       │             × entry.weight)             │
  │                    │                       │  props.* → scene, origin_category="props"│
  │                    │                       │  dedupe = AGREEMENT (max conf,          │
  │                    │                       │            union contributors[])        │
  │                    │                       │  user / locked chips IMMOVABLE          │
  │                    │                       ├───────────────────────▶│ intent updated │
  │                    │                       │                        │ contested=true │
  │                    │                       │  detectConflicts:                       │
  │                    │                       │   camera_angle is single_dominant,      │
  │                    │                       │   low_angle (from you) vs high_angle (B)│
  │                    │                       │   neither is a modifier → kind="arity"  │
  │                    │                       │   id = cfl_ + sha1(...)  ← DETERMINISTIC│
  │◀─ two-up: your tile (pre-selected) │ ref B tile ──────────────────────────────────────
  │   NOTHING dropped, NOTHING auto-picked                                               │
  │                    │                       │                        │               │
  │                    │            meanwhile: COMPOSE                                   │
  │                    ├────────────────────────────────────────────────┼──────────────▶│
  │                    │                       │   buildStructuredPrompt(intent, tax, mix)
  │                    │                       │    route 20 categories → 13 slots        │
  │                    │                       │    negate:true → constraints             │
  │                    │                       │    camera_angle has an OPEN conflict →   │
  │                    │                       │    blocked[{slot:"camera",               │
  │                    │                       │             reason:"unresolved_conflict",│
  │                    │                       │             conflict_id:"cfl_ab12…"}]    │
  │                    │                       │    formatPrompt(prompt,"generic")        │
  │◀─ prompt text with the camera slot greyed: “1 decision pending” ──────────────────────│
  │                    │                       │                        │               │
  │ clicks "keep mine" │                       │                        │               │
  ├───────────────────▶│ SET_DOMINANT(camera_angle, <your value>)                        │
  │                    ├──────────────────────▶│ conflict.status="resolved"              │
  │                    │                       │ strategy:"user", dominance remembered   │
  │                    │                       │ (never re-asked on the next edit)       │
  │◀─ camera slot now emits “shot from a low angle looking up at the subject” ────────────│
```

The pass-through property to notice: **the conflict id is deterministic**, so re-running `applyMix` after any later edit reproduces the same `cfl_…` and the human's answer survives recomputation. Without that, every mix edit would re-ask every question, and the conflict UI would be unusable within a minute.

---

## 8. ComfyUI reuse plan

The brief defers the node until the web MVP proves the concepts, and names the shared modules: taxonomy, prompt engine, reference metadata, visual intent, reference mix, model formatter. The architecture is built so that this is a packaging exercise rather than a rewrite.

### 8.1 Portability classification

| Module | Class | Portable to the node? | Why |
|---|---|---|---|
| `src/core/taxonomy.js` | **pure** | ✅ verbatim | no I/O; data is injected |
| `src/core/visual-intent.js` | **pure** | ✅ verbatim | |
| `src/core/reference-mix.js` | **pure** | ✅ verbatim | |
| `src/core/explorer-state.js` | **pure** | ✅ verbatim (reducer usable headlessly for tests / batch) | pure reducer, effects are descriptors |
| `src/core/visual-recipe.js` | **pure** | ✅ verbatim | a recipe is the node's natural input |
| `src/prompt/prompt-engine.js` | **pure** | ✅ verbatim | |
| `src/prompt/formatter-generic.js` | **pure** | ✅ verbatim | |
| `data/taxonomy/*.json`, `data/presets.json` | **data** | ✅ verbatim | inert JSON |
| `docs/schemas/*.json` | **contract** | ✅ verbatim | the cross-language truth |
| `src/reference/license-guard.js` | pure **except** `runSourceValidation` | ✅ minus that one function | classification and attribution are pure string/enum work |
| `src/reference/reference-manager.js` | pure **except** `resolveMedia` | ✅ minus that one function | store is in-memory; media resolution needs the network |
| `src/search/metadata-search.js`, `query-builder.js`, `fusion-ranker.js` | pure | ✅ (usable, not required by the node) | |
| `src/search/semantic-search.js` | pure + injected adapter | ⚠️ needs a vector backend | |
| `src/providers/*.js` | **network** | ❌ host-specific | `fetch`, provider APIs, rate limits |
| `src/ai/*.js` | ports | ✅ ports; ❌ backends | backends are always host-supplied |
| `src/ui/*.js`, `app/index.html` | **browser only** | ❌ | DOM |

Purity is machine-checked: the architecture lint (§1.3) fails the build if anything under `src/core/**` or `src/prompt/**` references `window`, `document`, `fetch`, `localStorage`, `node:` or `import.meta.url`.

### 8.2 The language boundary — decided

ComfyUI nodes are Python; the reference implementation is JavaScript. Rather than leave this to the future, the decision is made now:

- **The portable asset is the contract, not the language.** `docs/schemas/*.json` plus `data/taxonomy/*.json` plus a golden fixture set (`tests/conformance/*.json`: input → expected `StructuredPrompt` and expected `text` per mode) define correct behaviour independently of any implementation.
- **Primary path:** the node ships a single bundled pure-ESM artefact, `dist/uvrc-core.mjs` (core + prompt + taxonomy, zero dependencies), and the Python node invokes it through a short-lived Node sidecar over stdin/stdout JSON. Zero re-implementation, and `formatPrompt`'s byte-determinism (INV-FMT-1) is preserved by construction because it is literally the same code.
- **Fallback path:** a Python port of core + prompt, accepted only when it passes the same conformance fixtures byte-for-byte. Divergence is then a test failure, not a discovery in the field.
- Whether a given ComfyUI installation has a usable Node runtime is an environment question, not a design one; the fallback exists precisely because the answer varies (UNVERIFIED across installations — the sidecar's availability is probed at node load and reported in the node's status, never assumed).

### 8.3 Node output contract

The node emits exactly the brief's four outputs, and they are the same four the web app exports — the same functions produce both.

| Output | Type | Produced by | Schema |
|---|---|---|---|
| `prompt` | `STRING` | `formatPrompt(structured, mode).text` | — |
| `structured_prompt` | `JSON` — `StructuredPromptDocument` | `toPromptDocument(...)` | [`structured-prompt.schema.json`](./schemas/structured-prompt.schema.json) |
| `visual_intent` | `JSON` — `VisualIntentDocument` (`form:"full"`) | `wrapIntentDocument(intent, meta)` | [`visual-intent.schema.json`](./schemas/visual-intent.schema.json) |
| `reference_mix` | `JSON` — persisted `ReferenceMix` | `persistMix(mix, ctx)` | [`reference-mix.schema.json`](./schemas/reference-mix.schema.json) |

Node inputs: a `VisualRecipe` or a `VisualIntentDocument`, optionally a `ReferenceMix`, plus `prompt_mode` and the taxonomy bundle. Node behaviour rules:

1. `blocked[]` is surfaced on the node, not silently dropped. An unresolved conflict in a headless graph is a **visible blocked slot**, matching `on_unresolved: "block"`. The conflict doctrine does not weaken because there is no human on screen; it becomes a node warning with the `conflict_id`.
2. The node performs **no retrieval and no network access**. It is a pure transform. Provider access stays in the web app.
3. `negative_text` is emitted alongside `prompt` when the `constraints` slot is non-empty.
4. `taxonomy_version` and `formatter_version` travel in `structured_prompt`, so a graph re-run against a newer taxonomy is diagnosable.

Round-trip guarantee: `visual_intent` + `reference_mix` exported from the web app, fed into the node, reproduce the identical `prompt` string, given the same taxonomy version and mode (INV-FMT-1). This is what makes the answer to brief question 9 a "yes" with evidence rather than an intention.

---

## 9. Performance strategy

Targets below are **budgets to build against**, on a mid-range laptop, with a library of ~5,000 references and ~750 taxonomy nodes. They are engineering targets, not measurements (UNVERIFIED until benchmarked in `tests/perf/`).

### 9.1 Async analysis never blocks the UI

- `ANALYZE_MEDIA` returns synchronously after setting `analysis_status`. Analysis is an **effect**, never an awaited call inside the reducer, which cannot await by construction.
- Analyzer adapters run off the main thread (Web Worker, WASM worker, or a network call). The main thread's only job is to post a handle and receive a message.
- Every in-flight analysis carries a **token**; `ANALYSIS_SETTLED` with a stale token is dropped. Replacing the dropped image mid-analysis is therefore free.
- While `analysis_status` is `pending` or `mocked`, **every other surface stays live**: browse, keyword search, chip editing, mixing and composing. There is no modal spinner over the modal.
- Analysis is cancellable (`opts.signal`); switching modes or replacing the media aborts it.
- Budget: ≤ 16 ms of main-thread work per analysis lifecycle event (post, progress, settle). Decoding a preview thumbnail uses `createImageBitmap` off-thread.

### 9.2 Debounced keyword search

- Trailing-edge debounce at **180 ms**, minimum **2 characters**, plus an immediate flush on Enter or on a browse-tile click.
- `query_id` is monotonic; only the newest response may write `results` (visible in Journey A). No cancellation race can resurrect an older result set.
- The taxonomy index is built **once at load** (~750 nodes; budget ≤ 30 ms) and mutated incrementally as references arrive. Reference postings are added per batch, never rebuilt.
- Scoring is a scan over posting lists with early termination at `k × 4` candidates before final sort. Target: **≤ 20 ms** per keystroke-triggered query at 5,000 references — comfortably inside the debounce window, so typing never queues work.
- Expansion hops are computed on the node graph (bounded to one hop), not by re-querying the index.

### 9.3 Virtualized card grid

- The results grid renders only the visible window plus **2 rows of overscan**. `CARD_SIZE` is fixed per `ui.grid_density`, so row heights need no measurement pass and scrolling never reflows.
- Thumbnails load through `IntersectionObserver` with `loading="lazy"` and `decoding="async"`; at most **6 concurrent** thumbnail fetches, and off-screen requests are cancelled on scroll-away.
- Card DOM nodes are recycled from a pool keyed by index; a re-render rebinds data rather than recreating elements.
- Budget: **≤ 8 ms** per scroll frame, ≥ 1,000 results scrollable without pagination artefacts.
- `intent-chips.js` and `reference-mixer.js` are **not** virtualized — an intent with 400 chips is a product problem, not a rendering problem.

### 9.4 Incremental embedding index

- The vector index is **partitioned by `embedding_key`**. Registering a new embedding adapter creates a new partition; the old one is untouched and remains queryable.
- `buildIncremental(...)` yields in **time-boxed slices** (default `budget_ms: 8`, scheduled on `requestIdleCallback` with a `setTimeout` fallback) so indexing never contends with a scroll or a keystroke. It reports progress, and it is abortable.
- Indexing is **append-only and resumable**: a reference already carrying the active key is skipped, so a reload continues where it stopped rather than restarting.
- References lacking the active key are **silently skipped by retrieval**, never treated as an error — so search works correctly at 3 % indexed and improves continuously.
- Vectors prefer `vector_ref` into a sidecar store; inline `vector` floats exist only for fixtures. `quantization: "int8"` is the default for on-device storage (4× smaller than `f32`, dot-product cost dominated by memory bandwidth). No binary media is ever stored, per INV-REF-2.
- Persistence: IndexedDB, keyed by `embedding_key`, versioned so a key change cannot silently mix vector spaces.

### 9.5 Everything else

| Concern | Decision |
|---|---|
| `applyMix` cost | O(entries × categories × values). Memoized on `(mix revision, intent revision, taxonomy version)`; recomputed on any mix or chip edit, which is far below one per frame. |
| `formatPrompt` cost | Pure and cheap; recomputed on every intent change. Memoized on the same key triple to keep the preview render trivial. |
| History memory | 200 entries × an `intent_snapshot` each. Snapshots use structural sharing from the immutable core mutators, so unchanged categories are shared, not copied. |
| Taxonomy load | Nine JSON files fetched in parallel, parsed once, frozen. `loadTaxonomy` is the only validation pass. |
| Results ↛ intent | `results` never writes into `intent`, which removes a whole class of feedback-loop re-render storms by construction. |

---

## 10. Privacy and the egress boundary

**Policy (from the brief):** local-first; user images and videos are processed locally by default; any external API transmission must be explicitly disclosed in the UI before it happens.

### 10.1 Where the boundary lives in code

```
                 ┌──────────────────────────────────────────────────────┐
                 │  IN-PROCESS, ALWAYS LOCAL                            │
                 │  src/core/**   src/prompt/**   src/search/**         │
                 │  src/reference/** (except resolveMedia)              │
                 │  src/ui/**                                           │
                 │  → contains NO network call of any kind              │
                 └──────────────────────┬───────────────────────────────┘
                                        │
                   ══════════ EGRESS GATE ══════════   assertEgressAllowed()
                                        │
                 ┌──────────────────────┴───────────────────────────────┐
                 │  MAY LEAVE THE DEVICE — exactly two module families  │
                 │  src/providers/*   (metadata + thumbnails of PUBLIC  │
                 │                     works; never user media)         │
                 │  src/ai/*  adapters flagged                          │
                 │            requires_external_transmission: true      │
                 └──────────────────────────────────────────────────────┘
```

The gate is one function, called at exactly two call sites (the analyzer/embedding façades and the provider client factory):

```js
assertEgressAllowed(handle: MediaHandle, adapter_caps, ai.external_transmission)
  -> void | throws EgressRefused
// 1. handle.local_only === true                       -> REFUSE, unconditionally, no override
// 2. adapter.requires_external_transmission === false -> ALLOW (nothing leaves)
// 3. ai.external_transmission.allowed !== true        -> REFUSE
// 4. ai.external_transmission.disclosed_at is unset   -> REFUSE (consent must precede, not follow)
// 5. endpoint ∉ ai.external_transmission.endpoints[]  -> REFUSE
// otherwise ALLOW, and record the transmission for the UI's activity indicator
```

### 10.2 The rules that follow

| Rule | Consequence |
|---|---|
| `Reference.privacy.local_only` is honoured by **every** remote adapter | A local-only reference can never be embedded by a remote embedding service, no matter which toggles are on. There is no override flag. |
| `external_transmission.allowed` defaults to `false` | The default install transmits no user media. Ever. |
| Disclosure **precedes** transmission | `disclosed_at` must be set before the call, not after. The `disclose` effect renders a modal naming the adapter, the endpoint host and exactly what would be sent, and it blocks the `analyze` effect until answered. |
| An `upl_` handle never implies bytes left the device | An upload handle is a local identity, not an upload receipt. |
| Providers move **metadata and thumbnails of public works**, never user media | The provider interface has no method that accepts a user file. The type system carries the policy. |
| Default AI-OFF install performs **zero** outbound requests beyond `data/` | v0.1 is fully functional in that state. |
| Local adapters report `offline: true` and `requires_external_transmission: false` | The capability record is how the UI can honestly display "local-only ✓" in the header. |
| Any transmission is visible while it happens | The header indicator is driven by the gate's recorded transmissions, not by a hand-maintained flag. |

Storage privacy is the same story from the other side: no binaries are stored anywhere (INV-REF-2, schema-enforced with `media_blob`/`media_base64`/`media_bytes`/`data_uri`/`binary` declared `false`), so there is no user-media corpus to leak, and there is no bulk store of unknown-licence images. Licence detail: [`LICENSE_POLICY.md`](./LICENSE_POLICY.md).

---

## 11. Coupling prohibitions

These restate the brief's hard prohibitions in module terms. Each is machine-checkable and each has a named failure mode. **A pull request that violates one is rejected regardless of what it enables.**

| # | Prohibition | Why | Check |
|---|---|---|---|
| **C1** | **UI must never be coupled to the prompt engine.** `src/prompt/**` may not import `src/ui/**`, may not touch the DOM, and may not receive a DOM node. | The prompt engine has to run in the ComfyUI node and in tests. A single `document.` reference kills §8. | arch lint |
| **C2** | **Search must never be coupled to the prompt composer.** `src/search/**` ↮ `src/prompt/**` in both directions, including via a shared helper module. | The brief's explicit prohibition. Structurally it prevents "the search box quietly rewrites the prompt", which is the failure that turns the product into an interrogator. | arch lint (both directions) |
| **C3** | **No module may import a concrete AI backend.** Backends are registered at runtime; no model name appears as an import specifier or a branch condition. | Brief question 7 (model swap) and INV-AI-2. | arch lint + grep for reserved model names in `src/` |
| **C4** | **Core must import nothing from `src/`.** No DOM, no `fetch`, no clock, no randomness. | Purity is what makes the invariants testable and the node possible. | arch lint |
| **C5** | **Analyzer and retriever stay separate.** The analyzer may not rank; the retriever may not propose chips. `results` never writes into `intent`. | "Analyzer understands; retriever ranks." Merging them makes AI-OFF retrieval impossible. | code review + reducer test: no event path writes `intent` from `results` |
| **C6** | **Providers must not leak upward.** No layer above `src/providers/**` may branch on a provider name or a provider-specific field. | Provider swap and the Wikimedia-then-Openverse priority stay policy, not code paths. | grep: `wikimedia`/`openverse` absent outside `src/providers/**` and policy constants |
| **C7** | **Licence approval is never a ranking signal, and ranking is never an approval path.** `license-guard` decides `approved`; search only filters on `status`. | INV-LIC-3. A weight can be tuned to zero; a gate cannot. | code review + test: no `status` transition inside `src/search/**` |
| **C8** | **Conflicts must never be auto-resolved or silently dropped.** `auto_resolve` stays `false` by default; `on_unresolved` stays `"block"`; `highest_priority` and `drop` require an explicit, visibly indicated user opt-in. | INV-MIX-2. This is the pillar that separates the product from similar-image search. | schema defaults + tests over `applyMix` and `buildStructuredPrompt` |
| **C9** | **`IntentChip` must never degrade to a bare string** in the full form. | Provenance, per-chip lock, alternatives, evidence and the conflict UI all die at once, and the product becomes the prompt builder the brief forbids. | schema (INV-INT-1) + type tests |
| **C10** | **The modal must never be split into pages, and no second store may appear.** No product state outside `ExplorerState`. | Pillar 1. A second store is how INV-EXP-1 dies quietly. | code review; `assertExplorerInvariants` in every reducer test |
| **C11** | **Taxonomy hierarchy must never migrate into ids.** `clothing.tops.hoodie` is invalid; hierarchy lives in `parent`. | INV-TAX-1: re-parenting must never invalidate stored intents, mixes or recipes. | schema |
| **C12** | **Formatters stay leaves.** A formatter may not import Search, Reference, Providers or AI, and may not invent a value absent from the `StructuredPrompt`. | INV-FMT-3, and it keeps "add a model mode" a one-file change. | arch lint + determinism test |
| **C13** | **Reference licensing and code licensing are never conflated.** `license_summary` describes reference media only; it says nothing about the repository's `LICENSE` or about generated output. | Brief question 8. | doc review; `THIRD_PARTY_NOTICES.md` |
| **C14** | **No prohibited sourcing.** No bulk storage of unknown-licence images, no Pinterest scraping, no Instagram media copying, no TikTok video database, no wholesale copying of prompt databases or external repository code. | Brief hard prohibitions. | provider review + [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |

---

## 12. Decisions and additions

### 12.1 Decisions recorded here (with rationale)

| Decision | Rationale |
|---|---|
| The reducer is **pure**; side effects are returned as descriptors and executed by the UI's effect runner. | It is the only way to test INV-EXP-1/3/4/5 as properties over every event, and it lets the modal state machine run headlessly in the node and in tests. |
| **One store, no component-local product state.** | Pillar 1 dies the moment two stores exist and one of them forgets to survive a mode switch. |
| `deriveCapabilityProfile` lives in **Core**, not in `src/ai/`. | The profile is a function of adapter capability *records* (plain data) **and** the user's `ExplorerState.ai` toggles. It is a selector over state, so it belongs where state lives — and this keeps UI-degradation policy out of the adapter layer. |
| Analyzer output is **staged, then normalised, then accepted** — never written straight to `intent`. | "AI output is a proposal, never a commitment," plus it stops a third-party adapter from writing schema-illegal chips. |
| Post-condition enforcement of INV-VID-1/3 in the analyzer façade. | The invariant must hold for adapters nobody in this repository wrote. |
| Vector index partitioned by `embedding_key`, append-only, idle-scheduled. | Model swap becomes a background re-index instead of a migration, and search stays correct while partially indexed. |
| ComfyUI: bundled ESM + Node sidecar primary, Python port validated by conformance fixtures as fallback. | Preserves byte-determinism for free on the primary path; the fixtures make the fallback verifiable rather than hopeful. |
| Debounce 180 ms / min 2 chars / monotonic `query_id`. | Keeps per-keystroke work (~20 ms target) well inside the window, so typing never queues. |
| Grid virtualized; chips and mixer not. | Result counts are unbounded; chip counts are not. Virtualizing the chip editor would add complexity to solve a problem the product should not have. |

### 12.2 Assumptions and additions (flagged)

1. **`src/core/explorer-state.js` is added** beyond the brief's file list. The brief lists a target layout but no home for the modal state machine. Putting the reducer in `src/ui/explorer-modal.js` would make INV-EXP-1 a browser-only, DOM-coupled property, untestable headlessly and unusable in the node — a direct violation of C1/C4. It is placed in Core, where it is pure.
2. **`src/core/visual-recipe.js` is added**, deferred to the recipe milestone. `VisualRecipe` is a first-class schema in the canonical data model; it composes intent + mix + frozen snapshots and belongs to none of `reference-manager`, `reference-mix` or `prompt`.
3. **`normalizeVisualIntent` returns `{ intent, rewrites, warnings }`.** The canonical spec writes the signature as returning `VisualIntent` while also describing "the returned rewrites log". This is a clarification of the return envelope, not a renamed field: `result.intent` is exactly the canonical `VisualIntent`.
4. **Effect kinds** (`retrieve`, `analyze`, `embed_query`, `index_upsert`, `resolve_media`, `provider_call`, `disclose`, `persist`) and the **event names** in §3.3 beyond the assignment's required set (`ANALYSIS_SETTLED`, `ACCEPT_PROPOSAL`, `REJECT_PROPOSAL`, `UPDATE_MIX_ENTRY`, `REMOVE_FROM_MIX`, `RESOLVE_CONFLICT`, `UNPIN`, `EDIT_CHIP`, `SET_FILTERS`, `SET_AI`, `BROWSE_CATEGORY`, `LOAD_PRESET`, `LOAD_RECIPE`, `RESULTS_ARRIVED`, `CLOSE_MODAL`) are defined here. They are runtime vocabulary, not persisted data, and appear in no schema.
5. **`MediaHandle`, `AdapterCapabilities`, `AnalyzerResult`, `CapabilityProfile`, `Effect`, `Query`, `MetadataFilter`, `SearchIndex`, `SemanticIndex`, `GuardStep`, `Violation`, `Warning`** are runtime types introduced here. None is persisted; none collides with a schema name.
6. **`assertEgressAllowed` and the two-call-site egress gate** are an architectural commitment made here; the brief states the policy, not the mechanism.
7. **The ASCII modal layout in §4.2** is a design commitment made in this repository, derived from the brief's behavioural constraints. The brief contains no ASCII drawing.
8. **`tests/` and `dist/`** are not in the brief's layout. `tests/` holds unit, conformance (§8.2) and architecture-lint suites; `dist/uvrc-core.mjs` is a build artefact for the node, not a source module.
9. **Performance numbers in §9 are targets, not measurements** (UNVERIFIED until `tests/perf/` exists). Node-runtime availability inside arbitrary ComfyUI installations is likewise (UNVERIFIED) and is probed, never assumed.

### 12.3 Where to go next

| You want to… | Read |
|---|---|
| know why any of this exists | [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) |
| know the exact field, enum or invariant | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`schemas/`](./schemas/) |
| implement retrieval, scoring, fusion or Search by Difference | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| implement the licence gate or add a provider | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |
| know what ships when | [`ROADMAP.md`](./ROADMAP.md) |
| see the shipped vocabulary | [`../data/taxonomy/`](../data/taxonomy/) |
