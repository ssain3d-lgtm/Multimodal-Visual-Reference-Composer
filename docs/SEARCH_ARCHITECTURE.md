# Search Architecture — Unified Visual Reference Composer

How a query is built, matched, scored, fused, diversified, explained and measured — the complete retrieval specification, implementable without inventing anything.

> **한국어 요약**
> 이 문서는 제품의 검색 전체를 규정한다. 텍스트·이미지·비디오·레퍼런스 카드라는 네 가지 입력이 모두 하나의 `Query` 객체로 변환되고, 그 질의는 키워드 검색(AI 없이 동작하는 MVP 엔진), 구조화 메타데이터 매칭, 그리고 선택적 시맨틱 검색이라는 세 갈래로 실행된다. 세 점수는 리스트별 min-max 정규화 후 기본 가중치 0.6(시맨틱)/0.4(메타데이터)로 융합되며, 어떤 신호가 없으면 0으로 처리하지 않고 가중치를 재정규화한다. Search by Difference의 KEEP/CHANGE 의미론, 별칭·related 기반 질의 확장, 재순위, 모든 결과가 반드시 지녀야 하는 점수 근거(설명 가능성), 그리고 검색 품질을 실제로 측정하는 평가 절차까지 함께 정의한다.

---

## 0. Document contract and precedence

**Precedence.** `BRIEF.md` (the canonical product brief) wins over everything. The canonical data model in [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) wins over this document. [`ARCHITECTURE.md`](./ARCHITECTURE.md) owns module boundaries and function signatures; this document owns their *behaviour*. Where this document appears to add a field, an enum value or a constant, it is listed in §14 as an addition and flagged, never smuggled in.

**Scope.** Everything between "the user has expressed something" and "a `ResultSet` exists". Specifically in scope: query construction, keyword matching, metadata matching, vector retrieval, fusion, difference queries, expansion, reranking, explanation and evaluation. Specifically **out** of scope: analysis (`src/ai/analyzer.js` — see [`ARCHITECTURE.md §5.2`](./ARCHITECTURE.md)), prompt composition (`src/prompt/` — see [`DATA_SCHEMA.md §12`](./DATA_SCHEMA.md)), licence verification (`src/reference/license-guard.js` — see [`LICENSE_POLICY.md`](./LICENSE_POLICY.md)) and provider transport (`src/providers/*.js`).

**The separation the brief demands.** *"Retrieval and analysis are SEPARATE modules. Analyzer understands; retriever ranks."* Concretely: **no code path in `src/search/` may write into `ExplorerState.intent`** (INV-SRCH-1). Results propose nothing. A user clicking a result is a UI event that goes through the intent layer, not a retrieval side effect. And *"No coupling of search with prompt composer"*: `src/search/` never imports `src/prompt/`.

**Owning modules.** `src/search/query-builder.js`, `metadata-search.js`, `semantic-search.js`, `fusion-ranker.js`. Every constant named in this document is a frozen export from one of those four files, so that tuning is a diff and not a hunt.

---

## 1. The retrieval pipeline

The brief's core pipeline, with the part this document owns marked:

```
TEXT / IMAGE / VIDEO / REFERENCE CARD
  -> UNIFIED VISUAL INTENT
  -> SIMILAR REFERENCE SEARCH          <-- THIS DOCUMENT
  -> REFERENCE DECOMPOSITION
  -> SELECTIVE ATTRIBUTE INHERITANCE
  -> MULTIPLE REFERENCE MIXING
  -> FINAL STRUCTURED PROMPT
```

Search sits in the middle on purpose. It is *not* the product's endpoint — every result card must lead onward into EXTRACT / EXPLORE / USE. A result grid with a download button is the failure mode this whole architecture exists to avoid (see [`PRODUCT_VISION.md §10`](./PRODUCT_VISION.md)).

Expanded, the retrieval stage itself:

```
                       ExplorerState  (mode, query.{text,image,video,browse},
                                       intent, filters, difference, pins, ai)
                                 │
                       query-builder.js │ buildQuery(state)
                                 ▼
   ┌──────────────────────── Query ────────────────────────┐
   │ query_id · mode · text_terms · node_hits · expansion  │
   │ intent_filters(targets) · filters · difference · pins │
   │ embedding_key · embedding · ranking                   │
   └───────────────────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
  ┌─────────────┐        ┌──────────────┐        ┌──────────────┐
  │  KEYWORD    │        │  METADATA    │        │  SEMANTIC    │
  │ metadata-   │        │ metadata-    │        │ semantic-    │
  │ search.js   │        │ search.js    │        │ search.js    │
  │             │        │              │        │              │
  │ inverted    │        │ hard filters │        │ knn over     │
  │ index over  │        │ + weighted   │        │ embeddings[  │
  │ taxonomy &  │        │ target       │        │ embedding_   │
  │ ref text    │        │ coverage     │        │ key]         │
  └──────┬──────┘        └──────┬───────┘        └──────┬───────┘
         │ kw_text 0..1         │ meta 0..1             │ cosine
         │                      │                       │ (or null)
         └──────────┬───────────┴───────────┬───────────┘
                    ▼                       │
         metadata_component =               │
         0.75·meta + 0.25·kw_text           │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │   FUSION  fusion-     │  per-list min-max over the
                    │   ranker.js           │  candidate POOL, then
                    │   0.6 sem / 0.4 meta  │  per-ITEM weight renormalization
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  DIFFERENCE PENALTY   │  change_penalty, λ = 0.7
                    │  (only if enabled)    │
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  RERANK (optional)    │  blended, ρ = 0.5; may reorder,
                    │  reranker-adapter     │  never add/remove  (INV-SRCH-8)
                    └───────────┬───────────┘
                                ▼
                    ┌───────────────────────┐
                    │  DEDUPE + DIVERSIFY   │  near-duplicate GROUPING (never
                    │  MMR, μ = 0.3         │  dropping) + CHANGE-axis MMR
                    └───────────┬───────────┘
                                ▼
                      ResultSet { status, query_id, items[], total,
                                  cursor, ranking, ran_at, error }
                      items[i].score_breakdown{semantic, metadata,
                                  rerank, keyword, recency}
                                │
                      explain(query, ref, ranking)  <- called on demand by the UI
```

Five stage properties hold for every run:

| Property | Statement |
|---|---|
| **Pure** | Same `(Query, library, taxonomy_version, ranking)` ⇒ byte-identical `items[]` order. Ties break on `(score desc, reference_id asc)`. (INV-SRCH-9) |
| **Cancellable** | `query_id` is monotonic; a response whose `query_id` is not the current one is discarded, never rendered. |
| **Degradable** | Every stage after KEYWORD is optional. With no embedding adapter the pipeline is keyword + metadata + fusion-of-one and still returns a ranked, explained list. (INV-AI-1) |
| **Explained** | Every emitted item carries a `score_breakdown`, and `explain()` can reconstruct the item's rank from stored state. (INV-SRCH-6) |
| **Non-mutating** | Nothing here writes to `intent`, `mix` or `pinned_reference_ids`. (INV-SRCH-1) |

---

## 2. Query construction — four input modes, one `Query` object

### 2.1 The `Query` object

`buildQuery(state)` is the only function that reads the whole `ExplorerState` for retrieval purposes. It emits:

```js
Query = {
  query_id      : "q_000137",              // monotonic; stale responses dropped
  issued_at     : "2026-09-09T10:12:04Z",
  mode          : "text" | "image" | "video" | "browse",

  // --- text channel -------------------------------------------------------
  text_raw      : "golden hour alley",
  text_norm     : "golden hour alley",     // §3.1
  text_tokens   : ["golden", "hour", "alley"],
  node_hits     : ScoredNode[],            // taxonomy resolution of text_norm (§3)
  expansion     : ScoredNode[],            // alias/related/child hops, MARKED (§8)

  // --- structured channel -------------------------------------------------
  intent_filters: {                        // the assignment's `intent`
    targets           : [{ category, value, weight, negate, origin }],
    require_categories: visual_category[]
  },

  // --- hard gate ----------------------------------------------------------
  filters       : Filters,                 // ExplorerState.query.filters, §4.1

  // --- difference ---------------------------------------------------------
  difference    : { anchor_reference_id, keep[], change[], change_targets,
                    strictness, keep_threshold } | null,   // §7

  // --- semantic channel ---------------------------------------------------
  embedding_key : "qwen3vl_2b@1" | null,   // opaque; core never branches on it
  embedding     : EmbeddingRecord | null,  // the query vector, when available

  // --- context ------------------------------------------------------------
  pins          : reference_id[],          // excluded from results, §2.4
  exclude_ids   : reference_id[],          // anchor, already-seen, mix members
  ranking       : Ranking
}
```

`Ranking` is stored on the `ResultSet` so a replayed history entry reproduces the identical ordering:

```js
DEFAULT_RANKING = Object.freeze({
  mode            : "hybrid",              // hybrid|semantic_only|metadata_only|keyword_only
  semantic_weight : 0.6,                   // the brief's ~60
  metadata_weight : 0.4,                   // the brief's ~40
  fusion          : "weighted_sum",        // or "rrf"
  keyword_share   : 0.25,                  // keyword's share INSIDE the metadata component
  rerank_weight   : 0.5,                   // ρ, §9
  recency_weight  : 0.0,                   // §6.6 — recency does not rank by default
  diversity_mu    : 0.3,                   // μ, §7.5
  change_lambda   : 0.7,                   // λ, §7.4
  reranker_enabled: false,
  embedding_key   : null,
  category_weight : {},                    // per-category overrides; empty = uniform
  pool_size       : 200                    // per-list candidate cap, §6.2
});
```

The assignment's compound query `{intent, embedding?, keep, change, filters, pins}` maps onto this exactly: `intent → intent_filters`, `embedding → embedding`, `keep/change → difference.keep/change`, `filters → filters`, `pins → pins`. It is one object, not four; that is the structural expression of Pillar 1 (Unified Modal).

### 2.2 What each mode contributes

**INV-EXP-1 governs everything here: a mode switch changes which input surface is visible and nothing else.** `intent`, `pins`, `mix`, `difference` and `filters` are shared across all four modes and are never reset. `query.text`, `query.image`, `query.video` and `query.browse` all persist simultaneously, so switching text → image → text restores the typed text untouched. Retrieval therefore reads *the active mode's payload plus the always-shared structured state*.

| Mode | Text channel | Structured channel | Semantic channel | Notes |
|---|---|---|---|---|
| **text** | `query.text` → normalize, tokenize, resolve to `node_hits` (§3) | intent chips **+** `node_hits` promoted to targets at `0.6 × node_score` | `embedText(query.text)` if adapter present | The v0.1 path. Fully functional with AI off. |
| **image** | empty | intent chips only (accepted analyzer proposals land in `intent` through `ACCEPT_PROPOSAL`, never directly) | `embedImage(handle)` — the raw pixels, independent of whether analysis succeeded | If the analyzer is absent or `mocked`, the image contributes **only** through the embedding. With AI fully off an image contributes nothing retrievable, and the UI says so rather than pretending. |
| **video** | empty | intent chips | `embedVideo(handle, {t_start_s, t_end_s})` — the **window**, not the clip | The time window is the query. "Describe *this* camera move" is a windowed query, not a whole-file query. |
| **browse** | `query.browse.keyword` (scoped to `query.browse.category`) | intent chips + the browsed `category`/`parent` as `require_categories` | none (browsing is structured navigation) | Ranking mode is `metadata_only` by construction. |

Two derived rules, both visible and both reversible:

1. **Camera-motion narrowing.** If any target is in `camera_motion`, `filters.type` is narrowed to `["video"]` with a dismissible notice. Justification: INV-VID-2 caps `visual_attributes.camera_motion` at `maxItems: 0` for `type:"image"`, so an image reference *cannot* satisfy such a target; leaving images in the pool only dilutes it. This is a derivation from a schema invariant, not an editorial preference.
2. **Analysis is never a precondition.** `buildQuery` never waits on an analyzer. A pending analysis leaves the structured channel as-is; when the proposal is accepted a new `query_id` is issued and retrieval re-runs.

### 2.3 Reference-card queries — the EXPLORE menu, as data

The card actions from the brief compile to concrete queries. `A` is the card.

| Card action | `intent_filters.targets` | `difference` | `exclude_ids` | Semantic |
|---|---|---|---|---|
| USE (everything) | every `A.visual_attributes[c]` value, weight `attribute_meta[v].confidence ?? 0.7` | — | `[A.id]` | anchor on `A` |
| EXTRACT *(group)* | only the categories of that EXTRACT group ([`DATA_SCHEMA.md §4.3`](./DATA_SCHEMA.md)) | — | `[A.id]` | anchor on `A` |
| EXPLORE → find similar | all of `A`'s values at weight `0.5` | — | `[A.id]` | anchor on `A` |
| EXPLORE → same lighting | `A.visual_attributes.lighting` at weight `1.0` | `keep: ["lighting"]`, `change: []`, anchor `A` | `[A.id]` | anchor on `A`, weight halved |
| EXPLORE → same composition / camera / pose / outfit / scene | as above for that category (camera expands to `camera_angle, camera_distance, framing, lens, camera_motion`) | `keep: [<those>]` | `[A.id]` | as above |
| EXPLORE → similar video / similar image | all values at `0.5` | — | `[A.id]` | anchor on `A`; `filters.type` pinned to `video` / `image` |

Note that "same lighting" is a **difference query with an empty CHANGE set**. That is not a trick — it is the same machinery, which is why Search by Difference is a v0.5 *UI* milestone over a retrieval capability that exists from v0.1.

### 2.4 Pins, anchors and exclusion

`pins` (= `ExplorerState.pinned_reference_ids`) are **excluded from the ranked result list** and rendered as a persistent tray row instead. Two reasons: returning something the user has already collected wastes a result slot, and a pinned near-perfect match would compress the min-max normalization range for everything else (§6.3). They are excluded, never *hidden* — the tray is on screen the whole time, satisfying "never silently dropped".

Pins do **not** influence scoring. Implicit pin-affinity ("boost things like what you already collected") would make ranking depend on invisible state and would make the `explain()` sentence a lie. Users who want pin-driven retrieval use EXPLORE on the card or Search by Difference, both of which are explicit and both of which show their reasoning.

`exclude_ids` additionally carries the difference anchor and current mix members (which are pins anyway, by INV-EXP-4).

---

## 3. Keyword search — the AI-free engine

This is the MVP search engine. **No model is involved anywhere in this section.** It must be implementable straight from this text.

### 3.1 Normalization

```
norm(s):
  1. Unicode NFKC
  2. lowercase (locale-independent)
  3. strip combining marks: NFD, drop \p{Mn}, recompose NFC
       "contre-jour" -> "contre-jour"   (hyphen handled next)
       "café"        -> "cafe"
  4. replace [_ \-\/.,;:()\[\]{}"'`] with a single space
       "35mm_like"   -> "35mm like"
       "k-fashion"   -> "k fashion"
       "lens.35mm_like" -> "lens 35mm like"
  5. collapse runs of whitespace to one space; trim
```

Step 3 is what makes `contre-jour`, `café` and their unaccented spellings all reachable. Step 4 is what makes taxonomy ids searchable as prose: a user typing `medium shot` hits the label, a user pasting `framing.medium_shot` hits the id.

Every indexed surface form is stored **both** raw and normalized. Exact-match tiers compare normalized-to-normalized.

### 3.2 Tokenization and stopwords

```
tokens(s) = norm(s).split(" ").filter(t => t.length > 0)
content_tokens(s) = tokens(s).filter(t => !STOPWORDS.has(t))
```

```js
STOPWORDS = Object.freeze(new Set([
  "a","an","and","the","of","in","on","at","with","to","for","from",
  "by","is","it","this","that","or","as","into","over","under","my"
]));
```

Stopwords are removed from the **token pass only**. The phrase pass (§3.4) uses the full normalized string, so `"rule of thirds"` still matches its alias exactly. If `content_tokens` is empty (the query was all stopwords), fall back to `tokens`. `STOPWORDS` is English-only; for other locales it is empty, which degrades to "no stopwording" — mildly noisier, never wrong.

CJK note: whitespace tokenization does not segment Korean or Japanese. For those locales the token pass yields one token equal to the phrase, so matching falls back to phrase/prefix/substring behaviour over `i18n[lang].label` and `i18n[lang].aliases[]`. That is adequate and honest; proper segmentation is out of MVP scope and flagged in §14.

### 3.3 The index

`buildIndex(taxonomy, references) -> SearchIndex`. One inverted index, two document kinds.

**Taxonomy documents** — one per non-deprecated `TaxonomyNode`, surface forms and their match tier:

| Surface form | Tier used |
|---|---|
| `node.id` (raw, and normalized-with-dots-as-spaces) | *id* |
| `node.label` | *label* |
| `node.aliases[]` | *alias* |
| `node.i18n[lang].label` | *label* |
| `node.i18n[lang].aliases[]` | *alias* |
| `node.description` | *description* (substring only) |

**Reference documents** — one per `Reference`, mapping reference text onto the same tiers:

| Reference field | Tier used |
|---|---|
| `reference.id` | *id* (exact only — pasting an id is a power-user jump) |
| `reference.title` | *label* |
| `reference.tags[]`, `reference.aliases[]` | *alias* |
| `reference.description` | *description* |

`Reference.search_text` is a derived cache of the concatenation and **must be recomputed on load**, never trusted from storage ([`DATA_SCHEMA.md §6.4`](./DATA_SCHEMA.md)).

Index structure: a `Map<token, Posting[]>` where `Posting = {doc_kind, doc_id, tier, form_id, form_token_count, is_first_token}`, plus a `Map<normalized_form, Posting[]>` for exact and a sorted array of all normalized forms for prefix probing by binary search. Substring matching over `description` is a linear scan of the description strings for the surviving candidate set only, never over the whole corpus.

**Deprecated nodes are excluded from results.** Chips that already reference a deprecated node stay valid; the browse UI badges them, and `replaced_by` rewriting happens in `normalizeVisualIntent`, not in search.

### 3.4 Matching and the scoring formula

The match table is canonical and must not be altered:

```js
KEYWORD_SCORES = Object.freeze({
  EXACT_ID          : 1.00,
  EXACT_LABEL       : 0.95,
  EXACT_ALIAS       : 0.90,
  PREFIX            : 0.70,   // on label or alias
  SUBSTRING         : 0.50,   // on label or alias
  RELATED_HOP       : 0.35,   // × score(source node)
  CHILD_HOP         : 0.30,   // × score(source node)   -- addition, §14
  DESCRIPTION_SUB   : 0.20
});
```

Two passes, then a max.

```
PHRASE PASS
  P = norm(query)
  s_phrase(d) = max over surface forms f of d:
      P == f                      -> tier value (ID / LABEL / ALIAS)
      f startsWith P              -> PREFIX
      f contains P                -> SUBSTRING
      description(d) contains P   -> DESCRIPTION_SUB

TOKEN PASS
  T = content_tokens(query),  n = |T|
  for each token t:
      s_tok(d, t) = max over surface forms f of d:
          t == f                  -> tier value
          f startsWith t          -> PREFIX          (whole-form prefix)
          any word of f startsWith t -> PREFIX × 0.9  (word-internal prefix)
          f contains t            -> SUBSTRING
          description(d) contains t -> DESCRIPTION_SUB

  s_token_agg(d) = ( Σ_{t ∈ T} s_tok(d, t) ) / n        <- mean over ALL query tokens

COMBINE
  s_raw(d)   = max( s_phrase(d), s_token_agg(d) )
  score_kw(d) = s_raw(d) × (d.search_boost ?? 1.0)
```

Four properties of this formula, each deliberate:

1. **Phrase beats tokens.** `"golden hour"` matches the alias `golden hour` exactly (0.90) rather than being diluted to the mean of a strong `golden` and a weak `hour`. Multi-word taxonomy terms are the common case, so the phrase pass must dominate.
2. **Coverage is built into the mean, not bolted on.** Dividing by `n` — the count of *all* content tokens, not of matched ones — means a node that answers one of three tokens earns a third of the credit. No separate coverage multiplier is needed, and a node cannot win by matching one rare token very well.
3. **`search_boost` is applied last and is not clamped.** `search_boost` ranges 0..10 and exists precisely to lift the terms users actually mean (`clothing.hoodie` 1.5) above their branch nodes (`lighting.light_direction` 0.8). Clamping to 1.0 would destroy it. Consequence: `score_kw` can exceed 1.0, which is fine because everything is min-max normalized before fusion (§6.3).
4. **Boost never inflates confidence.** When a node hit becomes an intent chip, the chip's `confidence` is `clamp01(s_raw)` — the **pre-boost** value. `search_boost` is a retrieval-ranking device; it is not evidence about the world, and the product does not let a tuning constant masquerade as belief.

Dedupe by document keeping the max. Then:

```
score_kw_norm(d) = score_kw(d) / max(1e-9, max_d score_kw(d))   // per-list, over the pool
```

### 3.5 Worked example — `"golden hour alley"`

Computed against the shipped taxonomy (`data/taxonomy/scene.json`, `.../lighting.json`; 740 nodes total).

```
Input      : "Golden Hour alley"
norm       : "golden hour alley"
tokens     : ["golden", "hour", "alley"]      (no stopwords)   n = 3
```

Phrase pass: `"golden hour alley"` is not an exact, prefix or substring match of any surface form ⇒ `s_phrase = 0` for every node.

Token pass, for the three nodes that matter:

| Node | boost | `golden` | `hour` | `alley` | Σ | `s_token_agg` = Σ/3 | `s_raw` | **`score_kw`** |
|---|---|---|---|---|---|---|---|---|
| `time.golden_hour` — aliases include `golden hour`, `goldenhour`, `magic hour`, `golden light` | 1.45 | PREFIX on `golden hour` → **0.70** | SUBSTRING in `golden hour` → **0.50** | 0 | 1.20 | 0.400 | 0.400 | **0.580** |
| `scene.alley` — aliases `alley`, `alleyway`, `back street`, `narrow lane` | 1.25 | 0 | 0 | EXACT_ALIAS `alley` → **0.90** | 0.90 | 0.300 | 0.300 | **0.375** |
| `lighting.golden_hour_sun` *(related to `time.golden_hour`)* | 1.2 *(illustrative)* | PREFIX → 0.70 | SUBSTRING → 0.50 | 0 | 1.20 | 0.400 | 0.400 | **0.480** |

Now compare with the single-term query `"golden hour"` (n = 2):

```
s_phrase(time.golden_hour) = EXACT_ALIAS("golden hour") = 0.90
s_token_agg                = (0.70 + 0.50) / 2 = 0.60
s_raw = max(0.90, 0.60)    = 0.90
score_kw = 0.90 × 1.45     = 1.305        <- phrase dominance, as designed
```

And the misspelling case, which is the whole reason the taxonomy ships deliberate misspelling aliases:

```
"goldenhour alley"  ->  tokens ["goldenhour","alley"], n = 2
  time.golden_hour : EXACT_ALIAS("goldenhour") = 0.90 ; alley 0 -> 0.450 × 1.45 = 0.653
  scene.alley      : 0 ; EXACT_ALIAS("alley")  = 0.90 -> 0.450 × 1.25 = 0.563
```

Both surface. No spell-checker, no model, no edit-distance code — the correction lives in `aliases[]`, which is data a non-programmer can extend. That is the same "vocabulary lives in user-editable data files" pattern the research dossier records across WildPromptor, Workflow Studio and ComfyUI-Custom-Scripts ([`research/comfyui-prompt-builders.md`](./research/comfyui-prompt-builders.md)) — with the difference that our files are authored by us, so no third-party prompt database enters the tree.

### 3.6 From node hits to two channels

A `ScoredNode` feeds retrieval through two distinct channels, and they are reported separately in the score breakdown:

```
node_hits  ──(a)──>  intent_filters.targets, weight = 0.6 × min(1, s_raw)
                     => contributes to the METADATA score (§4)

           ──(b)──>  nothing directly; the node's own text match against a
                     reference's title/tags/description is the KEYWORD score
```

The `0.6` factor exists because a text-derived target is weaker evidence of intent than a chip the user placed by hand. A hand-placed chip carries weight 1.0. The user always sees text-derived targets as chips and can promote, edit, lock or delete any of them — AI-free, but still a proposal.

---

## 4. Structured metadata search

Two operations that must never be conflated: **filters exclude**, **matches rank** (INV-SRCH-3).

### 4.1 Filters — the hard gate

`filterReferences(references, filters) -> Reference[]`. Boolean, evaluated before any scoring. A reference that fails a filter is *absent*, not down-ranked.

| Filter | Semantics | Default |
|---|---|---|
| `status` | `reference.status ∈ filters.status` | **`["approved"]`** — an unverified reference never reaches a normal result set (INV-SRCH-4) |
| `license` | `metadata.license ∈ filters.license` | the allowed-by-default set: `public_domain, pdm, cc0, cc_by, user_owned` |
| `type` | `reference.type ∈` | both |
| `source` | `metadata.source ∈` | all |
| `orientation` | derived cache `media.orientation` | any |
| `min_width` / `min_height` | `media.width ≥` / `media.height ≥` | none |
| `duration_s{min,max}` | video only; images excluded when set | none |
| `has_camera_motion` | `visual_attributes.camera_motion.length > 0` | off |
| `require_categories` | for each `c`: `visual_attributes[c].length > 0` | `[]` |
| `tags`, `collections` | set intersection non-empty | `[]` |
| `local_only` | `privacy.local_only === true` | off |

**Empty result sets are explained, never faked.** If the filter gate empties the pool, the `ResultSet` carries `status: "empty"` and the UI must state the cause with counts: *"0 of 340 matches are CC BY or freer — 218 are excluded by licence."* Silently widening the query (the pattern the gallery dossier records across Openverse and Europeana, [`research/license-safe-media-apis.md`](./research/license-safe-media-apis.md)) is forbidden: it hides a policy decision behind a result list.

### 4.2 Targets and relatedness credit

The structured query is a weighted target set:

```js
Target = { category, value, weight /* 0..1 */, negate /* bool */, origin }
// origin ∈ "chip" | "node_hit" | "difference_target" | "card_action"
```

Target weight comes from: user/locked chip → `1.0`; other chips → `chip.confidence × chip.weight`; node hits → `0.6 × s_raw` (§3.6); directed change targets → `1.0`.

A reference earns *partial credit* for having a taxonomy-related value rather than the exact one. `rel(v, v')` is the credit a stored value `v'` earns against a desired value `v`, using only the `parent` chain and `related[]` — hierarchy lives in `parent`, never in the id ([`DATA_SCHEMA.md §5.2`](./DATA_SCHEMA.md)):

```js
REL = Object.freeze({
  IDENTICAL  : 1.00,
  DESCENDANT : 0.60,   // × 0.75^(d-1), d = hops down the parent chain, d ≤ 3
  ANCESTOR   : 0.45,   // × 0.75^(d-1), d = hops up
  SIBLING    : 0.30,   // shares a non-null parent
  RELATED    : 0.25,   // v' ∈ related(v) ∪ related⁻¹(v)
  NONE       : 0.00
});
rel(v, v') = the highest applicable row (evaluated in the order above)
```

**Why descendants outscore ancestors.** Asking for `lighting.light_direction` (a branch) and finding `lighting.backlighting` is *fulfilment* — the reference answered the question more precisely than it was asked. Asking for `lighting.backlighting` and finding only the branch node is *underspecification* — the reference is compatible but has not committed. 0.60 vs 0.45 encodes that asymmetry.

**Why "same category" earns nothing.** A tempting floor ("at least it says something about lighting") rewards references that assert the *opposite* of the request. `rel` is 0.00 outside the table.

### 4.3 The metadata score

```
credit(target, ref) = max over v' ∈ ref.visual_attributes[target.category] of rel(target.value, v')
                      (0 if the reference has no values in that category)

cw(c) = ranking.category_weight[c] ?? 1.0

                     Σ_{t ∈ positive targets} t.weight · cw(t.category) · credit(t, ref)
metadata_match(ref) = ───────────────────────────────────────────────────────────────────
                          Σ_{t ∈ positive targets} t.weight · cw(t.category)

negated targets:  metadata_match ×= (1 − 0.8 · credit(t, ref))   for each t with negate=true
```

Normalized to 0..1 by construction, and readable as *"the weighted fraction of what you asked for that this reference actually has"*. That readability is why min-max fusion is preferable to rank fusion (§6.4) — this number means something, and throwing it away for a rank position would be a loss.

**Category weights default to uniform, and that is a decision, not laziness.** Baking editorial priorities ("lighting matters more than props") into the ranker would be an invisible opinion the user cannot see or override — precisely the class of behaviour [`PRODUCT_VISION.md §10`](./PRODUCT_VISION.md) lists as drift. The user's own chips already encode priority through `confidence`, `weight` and `locked`. `ranking.category_weight` exists as an override so the evaluation harness (§11) can sweep it, and so an advanced UI can expose it explicitly.

### 4.4 Worked example

Query targets (from two chips and one node hit):

| Target | weight | origin |
|---|---|---|
| `lighting.backlighting` | 1.00 | user chip |
| `framing.medium_shot` | 1.00 | user chip |
| `time.golden_hour` | 0.54 | node hit (`0.6 × 0.90`) |

Candidate references:

| Ref | `lighting` | `framing` | `time` | credits | `metadata_match` |
|---|---|---|---|---|---|
| `img_a` | `backlighting` | `medium_shot` | `golden_hour` | 1.00, 1.00, 1.00 | (1.00+1.00+0.54)/2.54 = **1.000** |
| `img_b` | `rim_lighting` *(sibling under `light_direction`)* | `medium_shot` | `sunset` *(sibling under `time.day`)* | 0.30, 1.00, 0.30 | (0.30+1.00+0.162)/2.54 = **0.576** |
| `img_c` | `light_direction` *(the parent branch)* | `close_up` *(sibling)* | — | 0.45, 0.30, 0 | (0.45+0.30+0)/2.54 = **0.295** |
| `img_d` | — | — | — | 0,0,0 | **0.000** |

`img_b` outranking `img_c` is the intended behaviour: a specific-but-adjacent lighting value is worth more than a vague-but-nominally-correct branch node.

---

## 5. Semantic search

### 5.1 The adapter contract

Search never constructs a model. It receives an **embedding adapter** through the registry ([`ARCHITECTURE.md §5.3`](./ARCHITECTURE.md)) and reads only its declared capabilities:

```js
EmbeddingCapabilities = {
  id, kind: "embedding", version,
  offline, requires_external_transmission, cost_class,
  embedding_key,                        // "<family>_<size>@<rev>"  -- OPAQUE
  dim, modality: "image"|"video"|"text"|"multimodal",
  normalized: true,
  quantization: "f32"|"f16"|"int8"|"binary",
  batch_max
}
embedText(text, opts)    -> Promise<EmbeddingRecord>
embedImage(handle, opts) -> Promise<EmbeddingRecord>
embedVideo(handle, opts) -> Promise<EmbeddingRecord>
```

**INV-AI-2 in practice: no code in `src/search/` may branch on `model_id`, `embedding_key` or adapter `id`.** `dim` is read from capabilities and never appears as a literal. `NULL_EMBEDDING` (dim 0) is a valid registration and means "semantic search unavailable" — the pipeline must produce a complete, ranked, explained result set in that state.

Fused text+image queries (image mode plus typed text) are handled two ways, decided by capability, not by hope:
- `modality === "multimodal"` and the adapter accepts a joint payload → send one joint query. The Qwen3-VL-Embedding family documents a native fused `{text, image}` query item (verified in its repository README, [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md)).
- Dual-tower adapters (CLIP/SigLIP/JinaCLIP lineage) have **no** native fused query. Do not fake one with vector arithmetic. Instead embed each modality separately, run two kNN passes, and treat them as two lists in the fusion stage with `w_sem` split evenly. Stated plainly so nobody designs the adapter interface assuming a fusion the model does not have.

### 5.2 Vector storage

Vectors live on the reference, model-keyed:

```
Reference.embeddings["<family>_<size>@<rev>"] = EmbeddingRecord
EmbeddingRecord = { model_id, adapter, dim, modality, vector | vector_ref,
                    normalized, quantization, pooling, created_at }   // oneOf vector/vector_ref
```

Model-keying is the entire model-swap story: several models coexist in one reference, retrieval queries only the active key, and a reference lacking that key is **skipped, not penalized** (§6.3). Swapping models is a settings change plus a background re-index ([`ARCHITECTURE.md §9.4`](./ARCHITECTURE.md)) — never a migration, never data loss.

`SemanticIndex` is partitioned by `embedding_key` and carries a compatibility header:

```js
IndexHeader = { embedding_key, dim, quantization, index_version, built_at, count }
```

On any header mismatch the index is invalidated and rebuilt incrementally rather than queried — silently querying a stale index returns confident nonsense, which is the worst available failure.

**Storage tiers.** Prefer `vector_ref` into a sidecar index; inline `vector` is for fixtures. In the browser the shipped default is an int8, Matryoshka-truncated tier: a 2048-dim f32 vector is 8 KB, a 256-dim int8 vector is 256 B — roughly 32× smaller, which is the difference between a few-thousand-card library that fits browser storage and one that does not. MRL truncation is documented for the Qwen3-VL-Embedding and jina-clip-v2 families and int8/b1x8 index types are documented by USearch (both from [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md); the exact published MRL truncation points and their quality cost are **UNVERIFIED**). Full-precision vectors stay available for a desktop/ComfyUI build.

### 5.3 Similarity and why a linear scan ships

Vectors are stored L2-normalized (`normalized: true`), so cosine similarity is a dot product:

```
sim(q, r) = Σ_i q_i · r_i          // q, r unit vectors
```

Raw cosine is **not** rescaled to 0..1. For contrastively trained encoders the practical spread is narrow and model-specific; a fixed affine map would flatten exactly the differences that matter. Normalization happens per-list over the actual candidate pool (§6.3), where the observed range is the right reference frame.

**The MVP retrieval structure is a brute-force scan, and that is a decision.**

```
cost = N × dim multiply-adds over Float32Array / Int8Array
  N =  5,000, dim = 1,024   ->  5.1M MAC   ->  ~5-15 ms in a Web Worker
  N = 50,000, dim = 1,024   -> 51.2M MAC   -> ~50-150 ms
  (order-of-magnitude estimates on a modern laptop; UNVERIFIED — measure before quoting)
```

Reasons brute force is correct here, not merely acceptable:

1. **The corpus is small by construction.** Every reference passes the License Guard before it is approved; a licence-verified Wikimedia/Openverse library is thousands of cards, not millions. Whether such a library is ever large enough to need ANN is an open question in the research dossier, and the honest answer at MVP is "probably not".
2. **ANN's cost is in mutation, not query.** Users continuously add and reject references. Voy documents a full index rebuild on resource update; hnswlib deletes by marking rather than removing, requiring tombstones and periodic rebuild ([`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md), both verified from the projects' own documentation). A licence-approval workflow that triggers a batch reindex is a worse product than a 10 ms scan.
3. **Brute force has no recall cliff.** It is exact. Every ANN result is approximate, and an approximate miss looks identical to "no such reference exists" — undebuggable, and corrosive to trust in a tool whose job is finding the reference you are missing.
4. **It keeps the interface honest.** `SemanticIndex.knn(vector, {k, key, filter})` is the same signature either way, so an ANN backend is a drop-in when measurement — not intuition — says it is needed.

Policy trigger: enable an ANN backend behind `knn()` only when `SemanticIndex.size(key) > ANN_THRESHOLD = 20_000` **and** a measured p95 query time exceeds 200 ms. `ANN_THRESHOLD` is a policy number, not a measured one (UNVERIFIED).

The filter is applied **before** the scan, not after: candidates are pre-filtered by the hard gate (§4.1) so a rejected or NC-licensed reference is structurally unreachable rather than post-filtered out of a top-k. This is the sqlite-vec "vector and metadata in one row, licence as a WHERE clause" pattern from the dossier.

### 5.4 Candidate models — cited, never hardcoded

The brief names candidates and forbids depending on them. Recorded here so a builder does not re-research, and marked for verification status:

| Candidate | Facts | Verification |
|---|---|---|
| **Qwen3-VL-Embedding 2B / 8B** | 2048 / 4096 dims, MRL, native fused text+image query item, matching 2B/8B rerankers. Repository LICENSE is Apache-2.0. | Repo facts **verified** from the repository. **Model-weight licence UNVERIFIED** (model host unreachable during research). |
| **jina-clip-v2** | ~865M params, 1024 dims truncatable to 64, listed as a supported architecture in transformers.js — the most browser-plausible option. | Weights **reported CC-BY-NC-4.0 (UNVERIFIED)**. NC is excluded by our own reference licence policy; bundling an NC model while rejecting NC photographs would be incoherent. Opt-in adapter only, badged in the UI. Never a default. |
| **SigLIP 2** | Permissive code; the repository doc explicitly splits Apache-2.0 software from CC-BY "other materials" and does **not** licence the checkpoints. | Split **verified** from the repository doc. No verified browser/ONNX embedding path. |

**Conclusion, and it is a product decision:** the MVP ships `NULL_EMBEDDING`. Semantic search is an opt-in the user configures with a model they choose, whose licence is displayed on the adapter descriptor exactly as a reference's licence is displayed on its card. Adding `license` and `license_url` as fields on the embedding adapter descriptor is an addition (§14) and is the direct application of the dossier's OpenCLIP `list_pretrained()` registry pattern.

---

## 6. Fusion ranking

### 6.1 The three raw signals

| Signal | Range | Source | Missing when |
|---|---|---|---|
| `kw_text` | 0..∞ (boost-scaled) | §3, text match against the reference's own title/tags/description | the query has no text |
| `meta` | 0..1 calibrated | §4, weighted target coverage | the query has no structured targets |
| `sem` | raw cosine, model-dependent | §5 | no adapter, semantic disabled, **or this reference has no vector for the active key** |

### 6.2 Candidate pool

```
gate      = filterReferences(library, query.filters)      // hard, §4.1
           minus query.pins, minus query.exclude_ids
K_meta    = top pool_size of gate by meta
K_kw      = top pool_size of gate by kw_text
K_sem     = knn(query.embedding, { k: pool_size, filter: gate })    // if available
pool      = K_meta ∪ K_kw ∪ K_sem                        // deduped, |pool| ≤ 3·pool_size
backfill  : compute meta and kw_text for EVERY item in pool (both are cheap)
            compute sem for every pool item that HAS a vector; others get sem = null
```

Backfilling matters: without it an item that entered via kNN would have a missing metadata score and would be normalized against a range it never contributed to.

### 6.3 Normalization — per-list min-max over the pool

```
for L in {sem, meta_component}:
    lo = min over pool of L (ignoring nulls)
    hi = max over pool of L (ignoring nulls)
    norm_L(x) = (hi - lo) < 1e-6  ?  (hi > 0 ? 1.0 : 0.0)
                                  :  (x - lo) / (hi - lo)
```

The ε-guard is not decoration: a single-item pool, or a pool where every reference scores identically, is a routine state in a small library, and an unguarded min-max divides by zero there.

The metadata side is composed first, so the top-level fusion stays exactly the brief's two-way split:

```
metadata_component = (1 − keyword_share) · norm_meta + keyword_share · norm_kw
                   = 0.75 · norm_meta + 0.25 · norm_kw
```

Keyword text is a **sub-signal of the metadata side**, not a third top-level weight, because its primary effect is already felt through the metadata channel: text resolves to taxonomy nodes, which become targets (§3.6). The 0.25 share covers the residual — a reference whose *title* says "backlit alley at dusk" while its `visual_attributes` are still sparse. In a pure keyword query (`norm_meta` identical for all) the ordering reduces exactly to the keyword ordering, because a shared additive constant is order-preserving.

### 6.4 The fusion formula

```
                Σ_{L}  active(L, item) · w_L · norm_L(item)
fused(item) =  ─────────────────────────────────────────────
                Σ_{L}  active(L, item) · w_L

  L ∈ { sem, metadata_component }
  w_sem  = ranking.semantic_weight  = 0.6
  w_meta = ranking.metadata_weight  = 0.4
  active(L, item) = 1 if a score for L exists for THIS item, else 0
```

**Per-item renormalization is the load-bearing detail.** Two failure modes it prevents:

1. *A reference with no vector.* Treating `sem = 0` would multiply it by 0.6 and bury a perfect metadata match beneath mediocre ones. With `active(sem, item) = 0` the denominator becomes 0.4 and the item is ranked on metadata **at full weight** — judged on what is known about it, not punished for what is not.
2. *The whole semantic side unavailable.* `active(sem, ·) = 0` everywhere, the 0.6 drops out for everyone, and `metadata_component`'s effective weight becomes 1.0. **The weights renormalize; they do not silently zero out.** This is the explicit requirement, and it is why `fused` is a weighted *mean*, not a weighted *sum*.

If every list is inactive for an item (possible only when the pool was built from a list that item has since lost — a defensive case), `fused = 0` and the item is dropped with a warning.

`ranking.mode` is derived and always stored, always displayed:

```
sem active for ≥1 item  &&  targets or text present   -> "hybrid"
no sem                  &&  structured targets present -> "metadata_only"
no sem                  &&  text only                  -> "keyword_only"
w_meta = 0 (explicit user override)                    -> "semantic_only"
```

### 6.5 Why min-max weighted sum and not RRF — decided

`fusion: "rrf"` remains available. `weighted_sum` over per-list min-max is the **default**, for four reasons:

1. **Explainability is a product requirement, not a nicety (§10).** A weighted sum lets the UI state a true sentence: *"63% of this result's rank came from metadata match, 37% from visual similarity."* An RRF contribution is a function of a rank position in a list the user never sees; any plain-language rendering of it is either vague or misleading.
2. **We deliberately computed a calibrated score; discarding it is a loss.** `metadata_match` is a *weighted fraction of requested attributes present*. RRF replaces that with "it was 4th". Rank fusion is the right tool when both lists' magnitudes are meaningless — ours has exactly one meaningless side.
3. **Min-max fixes precisely the one uncalibrated side.** Cosine magnitude varies per model; min-max over the actual pool maps it into the same frame as the calibrated metadata score without asserting any absolute meaning.
4. **The known weaknesses are addressable.** Min-max is sensitive to outliers and degenerate on flat lists; the ε-guard handles the flat case, pinned items are excluded from the pool so a collected near-perfect match cannot compress the range (§2.4), and pool-wide backfilling prevents range mismatch between lists.

RRF is the **recommended fallback** for one specific future case: an adapter that returns an order without meaningful magnitudes (some rerankers). `rrf(item) = Σ_L w_L / (k + rank_L(item))`, `k = 60`. It is implemented, tested, exposed in `ranking.fusion`, and swept by the evaluation harness — so the choice is revisitable with evidence rather than by argument.

### 6.6 Recency

`score_breakdown.recency` is computed and reported, and contributes **nothing** by default (`recency_weight = 0`). A 1904 photograph is not a worse lighting reference than a 2019 one, and time-decay in a reference library is an unjustifiable opinion. Recency is defined as a decay over `Reference.created_at` (when the record entered *this library*, not when the work was made — `metadata` has no reliable creation date) and exists to power an explicit "recently added" browse sort, which is a user-selected ordering rather than a hidden ranking bias.

---

## 7. Search by Difference

The brief's key differentiator. It is a retrieval capability from v0.1 and a UI milestone at v0.5.

### 7.1 The query

```js
difference = {
  anchor_reference_id : "img_a",
  keep                : visual_category[],   // hard structured filters
  change              : visual_category[],   // NOT filters — see §7.4
  change_targets      : { <category>: taxonomy_id[] },  // directed change
  strictness          : 0.8,                 // default
  keep_threshold      : 0.60                 // derived from strictness, §7.3
}
```

**INV-EXP-5 / INV-SRCH-7: `keep ∩ change === ∅`, asserted in `buildDifferenceQuery`, which throws on violation.** A category in neither list is *free* — unconstrained, unscored, unmentioned.

The anchor is always in `exclude_ids`. Returning the anchor as a result of "find things like the anchor but different" is a bug, not a base case.

### 7.2 KEEP — a hard filter, pinned to the anchor's values

For each `c ∈ keep`:

```
satisfied(ref, c) ⟺ ∃ v ∈ anchor.visual_attributes[c],
                    ∃ v' ∈ ref.visual_attributes[c] :  rel(v, v') ≥ keep_threshold
```

Unsatisfied ⇒ excluded from the pool. KEEP is genuinely a filter because it is the *premise* of the query: "same framing" is not a preference to be traded off, it is the thing being held constant.

If `anchor.visual_attributes[c]` is empty, the KEEP is **vacuous**: it is dropped, and a warning is attached to the `ResultSet` (*"KEEP lighting was ignored — the anchor has no lighting attributes"*). Silently satisfying an impossible constraint would be the worst of both options.

### 7.3 `strictness` — the ladder

`strictness` (default 0.8) selects which `rel` tiers satisfy a KEEP:

| `strictness` | `keep_threshold` | Meaning |
|---|---|---|
| `≥ 0.9` | 1.00 | exact taxonomy value only |
| `0.7 – 0.9` | **0.60** | exact **or a more specific descendant** ← *default 0.8* |
| `0.5 – 0.7` | 0.45 | also accepts the ancestor branch node |
| `< 0.5` | 0.25 | also accepts siblings and `related` neighbours |

The default reads as: *"the same value, or something that is a more specific case of it."* Asking to keep `lighting.light_direction` and receiving `lighting.backlighting` is a satisfied keep; that is the correct reading of the request.

### 7.4 CHANGE — a penalty and a presence requirement, not an exclusion

CHANGE has three components, and the first design decision is that **it is not a filter on values**.

**(a) Overlap penalty (soft).**

```
overlap(ref, c) = ( Σ_{v ∈ anchor[c]} max_{v' ∈ ref[c]} rel(v, v') ) / |anchor[c]|
change_penalty(ref) = ( Σ_{c ∈ change} overlap(ref, c) ) / |change|

metadata_match(ref) ×= (1 − λ · change_penalty(ref)),   λ = ranking.change_lambda = 0.7
```

Why a penalty rather than an exclusion filter:

- **Exclusion is brittle on multi-valued categories.** `clothing` is the canonical multi category; an anchor may carry six clothing values. A reference sharing one of them (both wear sneakers) would be *entirely excluded* even though the outfit is otherwise completely different — which is not what the user asked and is a silently wrong answer.
- **Exclusion collapses the result set.** On a rich category the intersection with "shares nothing" is frequently empty, and an empty grid teaches the user that the feature does not work.
- **Graded degradation is legible.** With `λ = 0.7`, a full overlap costs 70% of the metadata score — enough to sink it below any genuine change, not enough to annihilate an otherwise outstanding match. Near-misses appear *below* true changes rather than vanishing, which is the same doctrine as conflict handling: surface, do not silently drop.

**(b) Presence requirement (hard, on presence only).** For each `c ∈ change`, the reference must have at least one value in `c`. "Change the clothing" is unanswerable by a reference that says nothing about clothing; without this rule the top of the list fills with attribute-sparse references that trivially "differ". This is a filter on *presence*, never on *value* — and it is exactly `filters.require_categories` reused, so it costs no new machinery.

**(c) Directed change (`change_targets`).** `change_targets.clothing = ["clothing.streetwear"]` adds positive targets with weight 1.0 to the metadata match **while the overlap penalty still applies**. Both at once: *"not this outfit, and preferably streetwear."* The two are independent and must not be collapsed — dropping the penalty would allow a streetwear reference that happens to share the anchor's exact hoodie to win.

### 7.5 Avoiding near-duplicates

Two distinct problems with two distinct mechanisms.

**Near-duplicate grouping (always on, not only in difference queries).** Two references are near-duplicates when any of:

```
same (metadata.source, metadata.source_id)                       -> the same work
Jaccard(all visual_attributes values) ≥ 0.90 AND same orientation
semantic cosine ≥ 0.98                                           (only if both have vectors)
```

Duplicates are **collapsed into a group**, rendering one card with an "N more like this" affordance. They are never dropped: hiding a variant that might be exactly the crop the user wanted is a silent loss (INV-SRCH-10). The kept representative is the highest-`fused` member, tie-broken by `(status approved first, licence rank, reference_id asc)`.

**Diversity on the CHANGE axis (difference queries only).** Greedy MMR over the fused list:

```
select next = argmax over remaining r of:
     (1 − μ) · fused(r)  −  μ · max_{s ∈ selected} sim_change(r, s)

sim_change(a, b) = mean over c ∈ change of Jaccard(a.visual_attributes[c],
                                                   b.visual_attributes[c])
μ = ranking.diversity_mu = 0.3
```

Without this, "same lighting, different outfit" returns twenty references from the same shoot wearing twenty slightly different black coats: each individually satisfies the query, and collectively they answer nothing. MMR on exactly the CHANGE categories is the minimal targeted fix — it does not diversify what the user asked to keep, which would be a bug.

MMR runs **after** rerank so that the reranker sees the true best candidates, and it is disabled (`μ = 0`) when `change` is empty.

### 7.6 Worked example A — *"Same composition as this photo, but a different outfit"*

```
anchor  img_a : composition [rule_of_thirds, negative_space]
                framing     [medium_shot]
                camera_angle[low_angle]
                lighting    [backlighting]
                clothing    [trench_coat, sneakers, oversized]

keep    ["composition", "framing", "camera_angle"]
change  ["clothing"]
strictness 0.8  ->  keep_threshold 0.60
```

Gate: `status approved`, licence allow-list, then KEEP — a reference must have ≥1 composition value with `rel ≥ 0.60` to `rule_of_thirds` **or** `negative_space`, and likewise for framing and camera_angle. Then the CHANGE presence requirement: `clothing` non-empty.

| Candidate | composition | framing | angle | clothing | KEEP | `overlap(clothing)` | penalty ×(1−0.7·o) | verdict |
|---|---|---|---|---|---|---|---|---|
| `img_p` | `rule_of_thirds` | `medium_shot` | `low_angle` | `hoodie, sneakers, oversized` | ✅ | (0 + 1.00 + 1.00)/3 = 0.667 | ×0.533 | penalised — half the outfit is unchanged |
| `img_q` | `negative_space` | `medium_shot` | `low_angle` | `evening_gown, heels` | ✅ | (0+0+0)/3 = 0.000 | ×1.000 | **ideal** |
| `img_r` | `rule_of_thirds` | `waist_up` *(child of medium_shot, rel 0.60)* | `low_angle` | `blazer, tailored_trousers` | ✅ (0.60 ≥ 0.60) | 0.000 | ×1.000 | **ideal** |
| `img_s` | `centered` *(sibling, 0.30)* | `medium_shot` | `low_angle` | `leather_jacket` | ❌ composition | — | — | excluded |
| `img_t` | `rule_of_thirds` | `medium_shot` | `low_angle` | *(none)* | ✅ | — | — | excluded (CHANGE presence) |

MMR then ensures `img_q` and `img_r` are not followed by four more blazer-and-trousers references from the same source.

### 7.7 Worked example B — directed change

```
change_targets = { clothing: ["clothing.streetwear"] }
```

adds `Target{category: clothing, value: clothing.streetwear, weight: 1.0}`. `img_p` now earns `credit = 1.00` if it carries `clothing.streetwear`, or `0.25` via the `related` edge `clothing.hoodie → clothing.streetwear` — **and still pays the 0.667 overlap penalty for the shared sneakers and oversized fit**. `img_q` (evening gown) earns no directed credit but pays no penalty. The ordering between them becomes a real trade-off the weights express and `explain()` can narrate, rather than a hidden coin flip.

### 7.8 Worked example C — the video case

*"Same movement as this video, but a different setting."*

```
anchor  vid_b : motion [walking, medium_speed]
                camera_motion [dolly_in]
                scene [alley, night_city]

keep    ["motion", "camera_motion"]
change  ["scene"]
```

`filters.type` narrows to `["video"]` automatically (§2.2) because `camera_motion` is in play and INV-VID-2 makes it unsatisfiable by an image. KEEP on `camera_motion` is exact-or-descendant; `camera_motion.dolly` (the parent branch) fails at `rel = 0.45 < 0.60`, correctly, because "dolly" does not tell you *in or out*. This is also the brief's mixing case in retrieval form: `motion` and `camera_motion` are different categories, so combining them from two different videos raises no conflict by construction ([`DATA_SCHEMA.md §5`](./DATA_SCHEMA.md)).

---

## 8. Query expansion

### 8.1 MVP expansion — no model, works with AI OFF

`expansion_enabled` is available with `ai.enabled === false`, because alias and graph hops need no inference. Three edge kinds:

| Edge | Factor | Rationale |
|---|---|---|
| `related[]`, treated as **symmetric** | `0.35 × score(source)` | canonical. Symmetry is a decision (§14): a one-directional authoring omission across 740 nodes must not create a retrieval asymmetry the user can feel but not explain. |
| `children[]` of a hit branch node | `0.30 × score(source)` | **addition** (§14). Branch nodes like `lighting.light_direction` or `clothing.styles` are almost never what a user means; their children are. Without a child hop, hitting a branch is a dead end. |
| `deprecated → replaced_by` | rewrite at `1.00` | not an expansion — a rewrite, performed in `normalizeVisualIntent`, logged in the rewrites log. |

Control:

```
seeds       = top 5 node hits by score_kw           // top-N, not a threshold: multi-token
                                                    // queries dilute scores and a fixed
                                                    // threshold would disable expansion
hops        = 1  (never 2 — a two-hop neighbourhood of a 740-node graph is the whole graph)
cap         = 24 expansion nodes, then truncated by score
dedupe      = an expansion hit that is already a direct hit keeps the max (direct wins)
```

Every expansion chip carries `source: "query_expansion"`, low confidence, a visible "expanded" badge, and one-click removal (INV-SRCH-12). Expansion that the user cannot see and undo is just an unpredictable search engine.

### 8.2 Worked example — *"airport fashion"*, end to end

Computed against the shipped taxonomy.

**Step 1 — normalize and tokenize.** `"airport fashion"` → tokens `["airport", "fashion"]`, `n = 2`.

**Step 2 — phrase pass.** No surface form equals, starts with or contains `"airport fashion"`. `s_phrase = 0` everywhere. (This is the ordinary case for conceptual queries and exactly why the token pass exists.)

**Step 3 — token pass.**

| Node | boost | `airport` | `fashion` | `s_token_agg` | **`score_kw`** |
|---|---|---|---|---|---|
| `scene.airport_terminal` — aliases `airport`, `airport terminal`, `departure hall`, `boarding gate`, `terminal`, `airoport` | 1.15 | EXACT_ALIAS **0.90** | 0 | 0.450 | **0.5175** |
| `style.fashion_editorial` — alias `fashion editorial`, label *Fashion editorial* | 1.30 | 0 | PREFIX **0.70** | 0.350 | **0.4550** |
| `clothing.styles` — alias `fashion style` | 1.30 | 0 | PREFIX **0.70** | 0.350 | **0.4550** |
| `style.street_fashion` — alias `fashion week street`, `street fashion` | 1.30 | 0 | PREFIX **0.70** | 0.350 | **0.4550** |
| `clothing.korean_fashion` — alias `korean fashion` | 1.30 | 0 | SUBSTRING **0.50** | 0.250 | **0.3250** |

**Step 4 — expansion.** Seeds = the top 5 above.

| From seed | Edge | Node | Score |
|---|---|---|---|
| `scene.airport_terminal` (0.5175) | related | `props.suitcase` | 0.35 × 0.5175 × 1.10 = **0.199** |
| | related | `scene.subway_station` | 0.35 × 0.5175 × boost |
| | related | `scene.hotel_lobby` | 0.35 × 0.5175 × boost |
| | related⁻¹ *(symmetry)* | `scene.transit` *(parent)* | ancestor edge, see below |
| `clothing.styles` (0.4550) | **child** | `clothing.streetwear` | 0.30 × 0.4550 × 1.40 = **0.191** |
| | **child** | `clothing.casual` | 0.30 × 0.4550 × 1.40 = **0.191** |
| | **child** | `clothing.minimal` | 0.30 × 0.4550 × 1.20 = **0.164** |
| `style.street_fashion` (0.4550) | related | `style.street_photography`, `style.documentary`, `style.snapshot` | 0.35 × 0.4550 × boost |
| `clothing.korean_fashion` (0.3250) | related | `clothing.oversized` | 0.35 × 0.3250 × 1.40 = **0.159** |
| | related | `clothing.layered`, `clothing.minimal` *(dedupe: keeps 0.164)* | |

**Step 5 — what the user sees.** Direct chips: `scene.airport_terminal`, `style.street_fashion`, `style.fashion_editorial`, `clothing.korean_fashion`. Expansion chips, badged and removable: `props.suitcase`, `clothing.streetwear`, `clothing.casual`, `clothing.oversized`, `clothing.minimal`, `style.snapshot`.

Read together, that *is* "airport fashion": a person in a terminal, carrying luggage, in oversized street-style clothing, shot documentary-style. **No model produced that.** It came from alias tables and two graph edges over authored data — which is the concrete proof of INV-AI-1.

**Step 6 — into retrieval.** Direct chips become targets at `0.6 × s_raw` (§3.6); expansion chips at `0.6 × s_raw` of their already-discounted score, so they nudge ranking without steering it. `metadata_match` then ranks references by weighted coverage of that target set, and any reference lacking `scene.airport_terminal` can still win on the outfit categories — which is right, because half the query was about clothes.

### 8.3 Later — LLM expansion (AI ON)

`analyzeText(text, opts) -> AnalyzerResult` with `intent: VisualIntentIngest`. Four constraints, all enforced outside the adapter so a misbehaving backend cannot break the model:

1. Output passes through `normalizeVisualIntent` with `default_source: "analyzer_text"`. Unknown ids become `custom: true` chips, never errors.
2. Chips land in the mode's **staging area** and reach `intent` only via `ACCEPT_PROPOSAL`. Expansion is never auto-committed.
3. `confidence ≤ 0.5` is not imposed by source (that clamp is for `inferred`), but the UI renders analyzer-text chips distinctly from user chips, and the aggregate confidence recomputes on every edit.
4. The prompt sent to the model contains **no model-specific syntax and no vendor name**; the adapter owns its own dialect. Search never sees it.

MVP alias/related expansion is not a placeholder for this. It is the AI-OFF path and must remain complete on its own.

---

## 9. Reranking — an optional stage

```js
rerank(query, candidates, opts) -> Promise<{ reference_id, score }[]>
RerankerCapabilities = { ...AdapterCapabilities, max_candidates, pairwise }
NULL_RERANKER  // identity
```

Rules:

| Rule | Statement |
|---|---|
| **Scope** | Applies to the top `min(max_candidates, 50)` of the fused list. Never to the whole pool. |
| **Set-preserving** | The reranker may reorder. It may **not** add, remove or filter candidates (INV-SRCH-8). A returned id not in the input is dropped with a warning; a missing id keeps its fused score. |
| **Blended, not substituted** | `final = (1 − ρ) · fused + ρ · norm_rerank`, `ρ = ranking.rerank_weight = 0.5`. |
| **Cancellable** | Carries `query_id` and an `AbortSignal`; a stale rerank never mutates a live `ResultSet`. |
| **Visible** | `ranking.reranker_enabled` is stored; `score_breakdown.rerank` is populated; `explain()` reports `delta_rank`. |
| **Optional by construction** | With `NULL_RERANKER` the fused order is final. No feature degrades to an error message. |

**Why blend rather than replace.** A reranker typically sees a text rendering of each candidate, not its licence status, not its `visual_attributes` coverage, not its media dimensions. Letting it overwrite the ranking would let a confident text model discard a calibrated structured signal we computed on purpose — and would make the explanation unfalsifiable ("the reranker liked it"). At `ρ = 0.5` a reranker can move a strong candidate several positions but cannot invert a large structured gap.

Cost note: the smallest reranker in the surveyed family is ~2B parameters ([`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md)), which is heavier than the local-first default posture allows. Reranking is therefore an explicitly enabled enhanced mode, never on by default, and never a requirement.

---

## 10. Explainability — the score breakdown

**This is a product requirement.** The brief's north star is *"user should never need to know where to search"*; the corollary is that when the tool answers, the user must be able to see why. Opaque similarity is listed as a UX anti-pattern in three separate research clusters, and a cosine score with no justification is exactly the "AI output presented as a commitment" posture the brief forbids.

### 10.1 What is stored

Canonical, on every `ResultItem`:

```js
items[i] = {
  reference_id, rank, score,
  score_breakdown : { semantic, metadata, rerank, keyword, recency },
  matched_categories : visual_category[],
  matched_values     : taxonomy_id[],
  differs_categories : visual_category[]
}
```

`score_breakdown` stores the **normalized, pre-weight** values so the fusion weights can be re-derived and re-tuned visibly. A `null` entry means "this signal did not exist for this item" — distinct from `0`, which means "it existed and scored zero". The UI must render those differently: *"no embedding for this reference"* is not *"visually dissimilar"*.

### 10.2 What is computed on demand

Storing a full derivation per result would bloat every persisted `ResultSet` and every history entry. Instead `fusion-ranker.js` exports a pure function:

```js
explain(query, reference, ranking) -> Explanation

Explanation = {
  reference_id, ranking_mode,
  weights_effective : { semantic, metadata },       // AFTER per-item renormalization
  lists : [{ list, raw, pool_min, pool_max, normalized,
             weight_effective, contribution_pct }],
  metadata_targets : [{ category, value, label, weight, origin,
                        matched_value, relation, credit, contribution }],
  keyword_hits : [{ term, field, tier, form, score }],
  difference : { keep:   [{ category, satisfied, via_value, relation }],
                 change: [{ category, overlap, penalty_factor }] },
  semantic : { embedding_key, cosine, rank_in_knn } | { unavailable_reason },
  rerank   : { adapter_id, score, delta_rank } | null,
  duplicates : { group_size, representative_of: reference_id[] },
  notes : string[]
}
```

`explain()` is pure and takes the same inputs as the ranker, so the derivation is reproducible from stored state and cannot drift from the ranking it describes (INV-SRCH-6). It is a test target: for every result in the evaluation set, `Σ contribution_pct === 100` and the reconstructed score must equal `items[i].score` to 1e-9.

### 10.3 What the UI renders

Three levels, all mandatory:

1. **On the card, always.** The matched taxonomy chips (`matched_values`), with exact matches solid and partial matches (descendant/ancestor/sibling/related) outlined. This is the cheapest possible honesty: the user sees *which* of their chips this card actually answered.
2. **In the results header, always.** `ranking.mode` and the effective weights. *"hybrid · semantic 0.6 / metadata 0.4"* or *"metadata_only — no embedding adapter configured."* Nobody should ever have to guess whether semantic search ran (INV-SRCH-2).
3. **On demand, per card.** The `explain()` popover, rendered as a sentence plus a table:

> **Why this matched.** Kept `framing.medium_shot` (exact) and `camera_angle.low_angle` (exact). The outfit differs from the anchor (`overlap 0.00`). Metadata 0.87 × 0.4 = 0.348 · visual similarity 0.71 × 0.6 = 0.426 · fused mean **0.774** — 45% metadata, 55% visual.

Each row of the table names a target, the value that satisfied it, the relation (`exact` / `more specific` / `broader` / `sibling` / `related`) and the credit. That table is also the tuning surface: a fusion weight that produces a visibly silly explanation is a wrong weight, and it will be obvious before it is measured.

---

## 11. Evaluation — how we know the search is good

Tuning fusion weights without a metric is guesswork. This section is the metric.

### 11.1 The golden query set

`tests/search/golden-queries.json` — a minimum of 40 entries, hand-graded, versioned in the repo.

```json
{
  "id": "gq_012",
  "title": "airport fashion, no AI",
  "mode": "text",
  "ai": { "semantic_enabled": false },
  "query": { "text": "airport fashion" },
  "filters": { "status": ["approved"] },
  "expect_nodes": ["scene.airport_terminal", "clothing.streetwear"],
  "relevant": [
    { "reference_id": "img_wikimedia_commons_9f2ab41c", "grade": 2 },
    { "reference_id": "img_openverse_1a2b3c4d",        "grade": 1 }
  ],
  "notes": "Expansion must reach clothing.streetwear via the clothing.styles child hop."
}
```

Composition, deliberately weighted toward what the product actually claims:

| Bucket | Count | Purpose |
|---|---|---|
| Plain keyword | 12 | including **3 misspellings** (`goldenhour`, `casul`, `lether jacket`) — the alias tables are a feature and must be regression-tested |
| Structured / chip-driven | 8 | metadata match, partial credit, category coverage |
| **Search by Difference** | 6 | the differentiator; nothing else measures it |
| Image-anchored (v0.3) | 6 | semantic + fusion |
| Video / camera motion (v0.4) | 4 | windowed queries, type narrowing |
| Adversarial | 4 | empty result, ambiguous term (`editorial` is an exact alias of **two** nodes), a deprecated node, a query filtered to zero by licence |

Grades: `2` = ideal (a reference you would actually use for this), `1` = partial (relevant but weaker), `0` = irrelevant. Graded against a fixture library `tests/fixtures/references.eval.json` — **metadata only, no binaries**, licence-clean, ~300–600 references.

**Grading discipline:** grade before you tune, and never grade a result you have just watched win. Grades are appended by id and reviewed in PRs like code.

### 11.2 Metrics

Standard:

| Metric | Definition | Why |
|---|---|---|
| **P@5, P@10** | fraction of top-k with grade ≥ 1 | the user sees ~10 cards |
| **nDCG@10** | gain `2^grade − 1`, log discount | the primary tuning metric; respects the 2/1/0 grades |
| **MRR** | 1/rank of the first grade-2 result | "did the obvious answer come first" |

Product-specific, and these are the ones that actually measure *this* product:

| Metric | Definition | Target |
|---|---|---|
| **Category coverage@10** | fraction of the query's desired categories represented in the union of `matched_categories` over the top 10 | ≥ 0.80. A result set that answers only the loudest category is a bad reference set even when its precision is high. |
| **Change-yield@10** *(difference queries)* | fraction of the top 10 whose CHANGE categories genuinely differ from the anchor (`overlap < 0.25`) | ≥ 0.80. The only metric that measures the differentiator. |
| **Duplicate rate@10** | proportion of the top 10 belonging to a collapsed near-duplicate group | < 0.10 |
| **Explanation integrity** | `explain()` reconstructs `items[i].score` to 1e-9 and `Σ contribution_pct = 100` | 100% (a hard test, not a metric) |
| **AI-OFF completeness** | every query in the set returns a non-empty, ranked, explained list with `ai.enabled = false`, except the deliberately-empty adversarial ones | 100% — this is the executable form of INV-AI-1 |

### 11.3 Harness

```
node tests/search/eval.mjs                        # full table, all buckets
node tests/search/eval.mjs --bucket difference    # one bucket
node tests/search/eval.mjs --sweep semantic=0:0.1:1
node tests/search/eval.mjs --sweep fusion=weighted_sum,rrf
node tests/search/eval.mjs --baseline             # rewrite tests/search/baseline.json
```

`--sweep` produces the fusion-weight curve — the actual justification for 0.6/0.4 rather than a number inherited from the brief and never checked. The brief says *"~60/40, configurable"*; the sweep is how we find out whether 60/40 is right for **our** corpus, and the answer is recorded in the repo.

**Regression gate (CI):** `nDCG@10` may not fall more than **0.02** below `tests/search/baseline.json`, and `explanation integrity` and `AI-OFF completeness` must be 100%. A ranking change that improves one bucket and quietly destroys another cannot merge.

### 11.4 Manual side-by-side

Automatic metrics cannot judge *"is this a good reference to steal lighting from?"* — the product's real question. So:

`app/index.html?eval=ab&a=<ranking.json>&b=<ranking.json>` renders two configurations in two columns, **labels hidden**, order randomized per query. The reviewer picks a winner or "no difference" per query; results append to `tests/search/ab-log.jsonl` with the config hashes. A config change ships only with both a metric delta and at least 20 A/B judgements.

### 11.5 Honesty about the numbers

With ~40 queries over a few hundred references, the confidence intervals are wide. **Treat an nDCG@10 difference below ~0.05 as noise** (a rule of thumb, **UNVERIFIED** as a computed interval — compute a bootstrap CI before quoting any number externally). Report `n`, report the fixture library size, and never publish a metric without both. The purpose of this harness is to prevent confident nonsense, and it would be a poor joke to produce some.

---

## 12. Performance, indexing and staleness

| Stage | Budget | Mechanism |
|---|---|---|
| Keystroke → query issued | 180 ms | debounce in `explorer-modal.js` ([`ARCHITECTURE.md §9.2`](./ARCHITECTURE.md)) |
| Keyword + metadata, N ≤ 5,000 | < 30 ms | inverted index; `rel()` memoized per `(v, v')` per taxonomy version |
| Semantic kNN, N ≤ 5,000, dim ≤ 1,024 | < 150 ms | typed-array brute force in a Web Worker (estimate; **UNVERIFIED** — measure) |
| Fusion + MMR over ≤ 600 pool items | < 10 ms | O(pool·k) greedy |
| Full re-index of 740 taxonomy nodes | < 20 ms | rebuilt on taxonomy load only |

Notes a builder needs:

- **The taxonomy is small.** 740 nodes × ~10 surface forms is ~7,500 strings; a linear scan is genuinely viable. The inverted index is built anyway because it is canonical and because it earns its keep on the reference corpus, which grows.
- **The reference index is incremental.** `buildIncremental(index, references, adapter, {budget_ms, signal})` yields between chunks so approval of one reference costs one upsert, never a rebuild.
- **Staleness is a `query_id` problem, not a lock problem.** Every stage carries `query_id`; anything arriving for a non-current id is discarded silently *at the boundary* and never reaches state. That is why the brief's "the modal never closes mid-exploration" survives slow adapters.
- **`rel()` and `credit()` are pure** over `(taxonomy_version, v, v')` and are cached in a `Map` cleared on taxonomy reload. This is the single highest-value memoization in the search path.

---

## 13. Search invariants

| Id | Statement | Enforcement |
|---|---|---|
| INV-SRCH-1 | Nothing in `src/search/` writes to `intent`, `mix` or `pinned_reference_ids`. Retrieval and analysis are separate modules. | code + lint rule on imports |
| INV-SRCH-2 | `ranking.mode` is stored on every `ResultSet` and displayed in the results header. | code + UI test |
| INV-SRCH-3 | Hard filters exclude; soft signals rank. A filter is never implemented as a penalty, and a penalty never as a filter. | code review + §4.1/§7.4 tests |
| INV-SRCH-4 | `filters.status` defaults to `["approved"]`; an unverified reference never appears in a normal result set. | code, default constant |
| INV-SRCH-5 | A missing signal renormalizes the remaining weights per item; it never becomes a zero score. | code + unit test on `fused()` |
| INV-SRCH-6 | Every result carries a `score_breakdown`, and `explain()` reproduces its score to 1e-9 from stored state. | test: explanation integrity |
| INV-SRCH-7 | `difference.keep ∩ difference.change === ∅` (= INV-EXP-5). | `buildDifferenceQuery` throws |
| INV-SRCH-8 | The reranker may reorder but may never add, remove or filter candidates. | code, set comparison after rerank |
| INV-SRCH-9 | Retrieval is pure: same `(Query, library, taxonomy_version, ranking)` ⇒ identical order. Ties break `(score desc, reference_id asc)`. | test: repeated-run equality |
| INV-SRCH-10 | Near-duplicates are grouped and labelled, never silently dropped. | code + duplicate-rate metric |
| INV-SRCH-11 | No query text, media or vector leaves the device unless the active adapter declares `requires_external_transmission` **and** the user consented (`external_transmission.disclosed_at`). A `privacy.local_only` reference is refused by every remote adapter. | egress gate ([`ARCHITECTURE.md §10`](./ARCHITECTURE.md)) |
| INV-SRCH-12 | Expansion hits are marked `source: "query_expansion"`, badged, and removable in one click. | code + UI test |
| INV-SRCH-13 | An empty result set states its cause with counts; the query is never silently widened. | code + adversarial eval bucket |

---

## 14. Decisions and flagged additions

### 14.1 Decisions taken here (with rationale)

| # | Decision | Rationale |
|---|---|---|
| D1 | Phrase pass beats token pass via `max`; token pass divides by **all** content tokens | Multi-word taxonomy terms are the common case; coverage and strength collapse into one number (§3.4). |
| D2 | `search_boost` applied last, unclamped, for ranking; chip confidence uses the **pre-boost** value | A tuning constant must not masquerade as belief. |
| D3 | Keyword text is a sub-signal of the metadata side at `keyword_share = 0.25` | Preserves the brief's two-way 0.6/0.4 contract while giving text matching a defined home (§6.3). |
| D4 | Descendant credit (0.60) > ancestor credit (0.45) | Fulfilment beats underspecification (§4.2). |
| D5 | Category weights default to **uniform** | Editorial category priorities would be an invisible opinion; the user's chips already encode priority (§4.3). |
| D6 | Min-max + weighted sum as default fusion; RRF retained as an option and as the recommended fallback for magnitude-free adapters | Explainability is a product requirement, and our metadata score is calibrated (§6.5). |
| D7 | Per-**item** weight renormalization, not per-query | A reference with no vector is judged on what is known, not punished for what is not (§6.4). |
| D8 | Brute-force kNN ships; ANN only past a measured threshold | Small licence-verified corpus; ANN's cost is mutation and recall cliffs, not query time (§5.3). |
| D9 | CHANGE is a penalty (λ = 0.7) + a **presence** filter, never a value exclusion | Exclusion is brittle on multi-valued categories and collapses the result set (§7.4). |
| D10 | Near-duplicates are **grouped**, never dropped | "Never silently dropped" applies to results exactly as it applies to conflicts (§7.5). |
| D11 | Pins are excluded from results and do **not** influence scoring | Implicit pin-affinity would make ranking depend on invisible state and make `explain()` untrue (§2.4). |
| D12 | Recency has weight 0 by default | A 1904 photograph is not a worse lighting reference than a 2019 one (§6.6). |
| D13 | Reranker output is **blended** (ρ = 0.5), never substituted | It cannot see licence, structure or dimensions; it must not overwrite what can (§9). |
| D14 | `camera_motion` targets auto-narrow `filters.type` to `["video"]`, visibly and reversibly | Derived from INV-VID-2, not from taste (§2.2). |
| D15 | The MVP ships `NULL_EMBEDDING`; no default model | INV-AI-2, and every surveyed candidate has either an unverified or a policy-incompatible weight licence (§5.4). |
| D16 | `explain()` is computed on demand, not stored | Keeps the canonical `ResultSet` shape untouched while making full derivations available (§10.2). |

### 14.2 Additions beyond the canonical spec — flagged

| Addition | Where | Note |
|---|---|---|
| `CHILD_HOP = 0.30` expansion edge | §8.1 | The canonical table defines only `related` at 0.35. Branch nodes are dead ends without a child hop. |
| `related[]` treated as **symmetric for search only** | §8.1 | The canonical spec declares symmetry for `conflicts_with`, not for `related`. Storage stays directed; only the expansion index is symmetrized. |
| `REL` table (descendant/ancestor/sibling/related partial credit) | §4.2 | The canonical spec defines taxonomy hierarchy but no retrieval credit function. All five constants are new and tunable. |
| `keep_threshold` ladder from `strictness` | §7.3 | The canonical spec gives `strictness` a default of 0.8 and the words "1.0 requires exact match, lower allows sibling nodes" but no mapping. This is the mapping. |
| `λ` (change penalty), `μ` (MMR diversity), `ρ` (rerank blend), `keyword_share`, `pool_size`, `ANN_THRESHOLD` | §6, §7, §9 | New ranking constants; all live on `Ranking` and are swept by the evaluation harness. |
| `STOPWORDS`, normalization steps, word-internal prefix at `PREFIX × 0.9` | §3.1–3.4 | The canonical spec names the match tiers but not the tokenizer. |
| Reference field → tier mapping (`title`↔label, `tags/aliases`↔alias, `description`↔description, `id`↔id) | §3.3 | The canonical spec lists the indexed reference fields but assigns them no weights. |
| CHANGE **presence** requirement | §7.4(b) | Not in the canonical spec; implemented by reusing `filters.require_categories`. |
| Near-duplicate grouping thresholds (0.90 Jaccard, 0.98 cosine) | §7.5 | New; both are tunable and both are measured by `duplicate rate@10`. |
| `license` / `license_url` on the embedding adapter descriptor | §5.4 | New field on `EmbeddingCapabilities`, so a non-commercial model is badged like a non-commercial photograph. |
| Product metrics: category coverage@k, change-yield@k, duplicate rate@k, explanation integrity, AI-OFF completeness | §11.2 | New; the standard IR metrics do not measure this product's actual claims. |

### 14.3 Open questions this document does not close

1. **The real fusion weights.** 0.6/0.4 is the brief's starting point, not a measured optimum. `--sweep` answers it once a fixture library exists; until then the default stands and is labelled as a default.
2. **Video embedding granularity.** Whole-clip vs per-shot keyframe pooling is unresolved (the dossier flags the same question). It changes what "semantic" means for video and therefore what the 0.6 weight is weighting.
3. **CJK tokenization.** Whitespace segmentation degrades to phrase matching for Korean and Japanese. Acceptable at MVP; a real segmenter is a v0.3+ question.
4. **Share-alike and the prompt.** Whether CC BY-SA reference attributes create an obligation on the generated *text* is a legal question owned by [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), not by retrieval. Search only enforces the filter it is given.
5. **Browser storage ceiling.** How many `(thumbnail_url + metadata + int8 vector)` records fit an IndexedDB/OPFS quota needs measurement, not estimation, before we promise a local library size.

---

## 15. Where to go next

- Data shapes for everything named here: [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) (`ResultSet` §14.4, difference §14.6, taxonomy §13, keyword table §13.5).
- Module boundaries and signatures: [`ARCHITECTURE.md`](./ARCHITECTURE.md) (`src/search/` §2.2, adapters §5, AI-OFF matrix §6, journeys §7, performance §9, egress §10).
- Why retrieval must sit inside the composer at all: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) (Pillars 1 and 5, and the anti-drift list).
- Licence gating that produces `status: "approved"`: [`LICENSE_POLICY.md`](./LICENSE_POLICY.md).
- Model candidates and their verification status: [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md), [`research/video-analysis-and-local-runtimes.md`](./research/video-analysis-and-local-runtimes.md).
- Prior-art anti-patterns this design is reacting against: [`research/visual-prompt-galleries.md`](./research/visual-prompt-galleries.md) (terminal result grids, opaque style tokens), [`research/license-safe-media-apis.md`](./research/license-safe-media-apis.md) (silent query widening).
