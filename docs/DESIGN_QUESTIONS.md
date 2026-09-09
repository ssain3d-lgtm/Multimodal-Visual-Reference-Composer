# Design Questions — Unified Visual Reference Composer

**Purpose:** the nine questions the brief (spec section 70) requires the doc set to answer, each answered once, in depth, against the actual data structure or module boundary that implements it — plus an honest register of what is still genuinely open and how each open item will be decided.

> ### 한국어 요약
> 이 문서는 브리프 70절이 요구하는 아홉 개의 질문에 대한 **정식 답변서**입니다. 각 답변은 약속이 아니라 실제 스키마 필드·불변식(INV-\*)·모듈 경계로 증명되며, 어떤 답도 "나중에 하겠다"로 끝나지 않습니다.
> 핵심은 네 가지입니다. `IntentChip`은 문자열이 아닌 **출처를 가진 객체**이고, `MixEntry`는 참조를 복사하지 않는 **간선(edge) 객체**이며, 충돌은 자동 해결되지 않고 `blocked[]`로 **드러나고**, AI는 어댑터 뒤에 있어 완전히 꺼도 제품이 완결됩니다.
> 마지막 "Still open" 절은 아직 결정되지 않은 15개 항목을 **결정 방법·차단 대상·현재의 보수적 기본값**과 함께 나열합니다. 모두 해결된 척하는 것이 미해결을 이름 붙이는 것보다 나쁘기 때문입니다.

---

## 0. Document contract and precedence

| Rank | Source | Role |
|---|---|---|
| 1 | `BRIEF.md` (the canonical product brief) | product authority; never contradicted |
| 2 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/) | canonical data model: every field name, enum, id grammar and invariant cited below |
| 3 | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`ROADMAP.md`](./ROADMAP.md) | the mechanisms this document points at |
| 4 | **this document** | the answers, assembled and defended in one place |

This document **owns no mechanism**. It invents no field name, no enum value, no id prefix. Its job is to take the nine questions the brief will be judged on, and answer each one with a structure you can open in an editor, a function you can call, or a lint rule that fails a build. Where an answer names something the canonical data model does not define, that name is flagged in §S.4.

[`PRODUCT_VISION.md §11`](./PRODUCT_VISION.md) carries a one-line version of the same nine answers as a routing table. This document is the long form. If the two ever disagree, this one is wrong and must be fixed — the vision document is the index, not the argument.

**How to read an answer.** Each section has the same four parts: **Verdict** (one sentence, decisive), **The structure** (the actual thing), **Why it holds** (the enforcement, invariant by invariant), and **How this answer could fail** (the falsification — the specific change that would make the answer untrue, so a reviewer can watch for it).

---

## Q1. Why is this different from an existing prompt builder?

**Verdict.** A prompt builder implements one arrow, `Option → Prompt`. This product implements six, and four of them — decomposition, selective inheritance, mixing, conflict surfacing — have no expressible form in a prompt builder because a prompt builder has no reference object to decompose and no provenance edge to carry. The difference is not depth of feature; it is that a prompt builder's data model **cannot represent our intermediate states**.

### The shape difference

```
PROMPT BUILDER                            UNIFIED VISUAL REFERENCE COMPOSER
─────────────                             ────────────────────────────────
                                          TEXT / IMAGE / VIDEO / REFERENCE CARD
 <select> options                                    │
       │                                             ▼
       │  (one-way, stateless)          ┌──▶ UNIFIED VISUAL INTENT ◀────────┐
       ▼                                │            │                     │
   prompt text                          │            ▼                     │
                                        │   SIMILAR REFERENCE SEARCH       │ editable,
   ● no reference exists                │            │                     │ lockable,
   ● no provenance                      │            ▼                     │ per-chip
   ● nothing to disagree with           │   REFERENCE DECOMPOSITION        │
   ● output is the artefact             │            │                     │
                                        │            ▼                     │
                                        │   SELECTIVE ATTRIBUTE INHERITANCE│
                                        │            │                     │
                                        │            ▼                     │
                                        │   MULTIPLE REFERENCE MIXING ─────┘
                                        │            │
                                        │            ▼   (conflicts surfaced, not resolved)
                                        └─── FINAL STRUCTURED PROMPT
                                                     │
                                                     ▼
                                             text  (a VIEW, not the artefact)
```

### The containment argument — one direction only

This product **contains** a prompt builder as a degenerate case, and cannot be contained by one.

Set `mix.references = []`, author every chip with `source: "user"`, and call `buildStructuredPrompt` then `formatPrompt`. What comes out is exactly a prompt builder: options in, prompt out. Every other state this product can reach — a chip carrying `ref_id`, an open `Conflict`, a `MixEntry` with `exclude`, a `PromptFragment` that names the reference it came from — has no encoding in a builder's model at all. The containment is strictly one-way, and that asymmetry is the answer to Q1 stated formally.

### Four structures a prompt builder cannot have

| # | Structure | Field-level proof | What it buys | Schema |
|---|---|---|---|---|
| 1 | **Provenance on the value** | `IntentChip.ref_id`, `.source` (10-value `ChipSource`), `.contributors[]`, `.evidence` | "Remove everything reference B gave me" is a filter, not a text edit | [`visual-intent.schema.json`](./schemas/visual-intent.schema.json) |
| 2 | **Partial inheritance below category granularity** | `MixEntry { use[], only[], exclude[] }` | "Take this outfit but NOT the hat" is one field | [`reference-mix.schema.json`](./schemas/reference-mix.schema.json) |
| 3 | **Representable disagreement** | `Conflict { kind, candidates[≥2], status }` + `BlockedSlot` | The product can *refuse to emit a slot* until a human decides | [`reference-mix.schema.json`](./schemas/reference-mix.schema.json), [`structured-prompt.schema.json`](./schemas/structured-prompt.schema.json) |
| 4 | **The prompt read backwards** | `PromptFragment { text, source_category, value, ref_id, chip_id, hedged }` | "Why is this word in my prompt?" has an answer with a thumbnail and a licence | [`structured-prompt.schema.json`](./schemas/structured-prompt.schema.json) |

Item 3 deserves its own emphasis, because it is the one a reviewer will try to simplify away. **INV-MIX-4: arity is a conflict-detection rule, not a cardinality constraint.** No schema puts `maxItems: 1` on a `single_dominant` category. A conflicting state — `camera_angle` holding both `low_angle` and `high_angle` — must be *representable* in order to be *surfaced*. A prompt builder models `camera_angle` as a `<select>`, and a `<select>` cannot hold two values; the disagreement is structurally unrepresentable, so it is silently resolved by whichever option was picked last. That is the exact failure this product exists to prevent.

### The saved artefact is different

| | Prompt builder | This product |
|---|---|---|
| What is saved | the prompt **string** (or an options preset) | `VisualRecipe` — `intent` + `mix` + frozen `ReferenceSnapshot[]` |
| Can it be re-mixed? | no — a string has no parts | yes — swap one `MixEntry`, re-derive |
| Survives media rot? | n/a | yes — intent and mix are pixel-free; a recipe with 100 % dead media produces the *same prompt* (media-rot rule R2) |
| Re-derivable? | prompt → options is impossible | recipe → prompt is `formatPrompt`, deterministic (INV-FMT-1) |

`VisualRecipe.prompt_preview` is explicitly **advisory**: on open the prompt is always re-derived from `intent` + `mix`, and if the taxonomy has moved on the UI shows a "regenerated" notice rather than trusting the cache. A prompt gallery stores the output; we store the input and can always recompute the output. See [`DATA_SCHEMA.md §15`](./DATA_SCHEMA.md) and [`visual-recipe.schema.json`](./schemas/visual-recipe.schema.json).

### Why it holds

The difference is defended by three mechanisms, not by intent:

1. **The schema forbids the collapse.** `IntentChip` is an object in the full form; a bare-string array does not validate (INV-INT-1, and coupling prohibition `C9` in [`ARCHITECTURE.md §11`](./ARCHITECTURE.md)).
2. **The drift list is a release blocker.** [`PRODUCT_VISION.md §10`](./PRODUCT_VISION.md) enumerates twenty named decay symptoms `D1`–`D20`, each with the pillar it destroys. `D1` *is* the prompt-builder screen; `D6` is the string collapse; `D10` is storing the prompt instead of the recipe.
3. **The one-question drift test** is applied per pull request: *can a user still take one third of reference A and one half of reference B, see the disagreement, decide it themselves, and read the prompt backwards to the source and its licence?*

The survey evidence that no existing tool does this sits in [`COMPETITIVE_ANALYSIS.md §4`](./COMPETITIVE_ANALYSIS.md) — in particular §4.5, whose finding is that **not one surveyed multi-reference tool can detect that two sources disagree**, because by the time the sources meet there is no category structure left to compare.

### How this answer could fail

If `IntentChip` is flattened to a string "for simplicity" (`D6`), or the mix panel is hidden behind a toggle (`D3`), or conflicts get an auto-resolve default (`D4`), then all four structures above become decorative and the answer to Q1 becomes false in a single commit. That is why each of those is a blocker rather than a preference.

---

## Q2. Why must image search and prompt building live in ONE UI?

**Verdict.** Because the object crossing the boundary between them is not a string — it is `ExplorerState`, carrying `VisualIntent` (chips with per-chip provenance, locks, alternatives and evidence), `ReferenceMix` (edges with `use`/`only`/`exclude`, open conflicts, dominance), `pinned_reference_ids` and `difference`. A page boundary forces that object through the only channel two pages share: a text box. Everything that makes the product work is exactly what a text box cannot carry.

### What a page boundary destroys, field by field

```
   ┌────────────────┐        the only channel        ┌──────────────────┐
   │  IMAGE SEARCH  │  ───▶  a copied prompt string  ───▶ │ PROMPT BUILDER │
   │      PAGE      │        (lossy, one-way)        │       PAGE       │
   └────────────────┘                                └──────────────────┘
          │                                                    │
          └── these die at the boundary ───────────────────────┘
```

| Field | Carried by a text box? | Consequence of loss |
|---|---|---|
| `IntentChip.ref_id` | ✗ | "remove everything B gave me" is unimplementable (Pillar 4 dead) |
| `IntentChip.locked` | ✗ | a re-analysis silently overwrites the user's pinned decision |
| `IntentChip.alternatives[]` | ✗ | the "did you mean" swap menu is gone; AI output becomes a commitment |
| `IntentChip.evidence.t_start_s` | ✗ | "the dolly-in happens between 1.2 s and 3.4 s" cannot be shown |
| `IntentChip.contributors[]` | ✗ | agreement between two references reads identically to a single guess |
| `ReferenceMix.conflicts[]` | ✗ | an open disagreement becomes an invisible resolved one (`D4`/`D5`) |
| `ReferenceMix.dominance` | ✗ | "which should be dominant?" is re-asked on every edit |
| `difference.keep/change` | ✗ | Search by Difference cannot start from what is already composed |
| `pinned_reference_ids` | ✗ | the references you collected vanish when you go looking for more |

### The structural expression: one state, four mode payloads

`ExplorerState.query` is **not** a polymorphic payload. It holds all four mode payloads simultaneously:

```jsonc
"query": {
  "text":   "golden hour alley, backlit",
  "image":  { "reference_id": null, "upload_id": "upl_9f2a",
              "thumbnail_url": "…", "analysis_status": "mocked" },
  "video":  { "upload_id": "upl_31bc", "t_start_s": 1.2, "t_end_s": 3.4,
              "analysis_status": "pending" },
  "browse": { "category": "lighting", "parent": null, "keyword": "", "page": 0 },
  "filters":   { "license": ["public_domain","pdm","cc0","cc_by","user_owned"],
                 "status": ["approved"], "type": ["image","video"] },
  "expansion": { "enabled": true }
}
```

Going `text → image → text` restores the typed text untouched **because it was never discarded**. That is the difference between "we re-populate the field" and "the field was always there".

And the invariant that makes it a guarantee rather than a habit:

> **INV-EXP-1 — switching `mode` NEVER resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `filters`.** A mode switch changes which input surface is visible and nothing else. It MAY reset `results` (a new mode implies new retrieval) and `ui.active_panel`. Nothing else. The modal never closes mid-exploration.

Two supporting invariants close the remaining holes:

- **INV-EXP-3** — history is *navigation* history. `back()`/`forward()` restore mode, query, filters and results; they do **not** touch pins or mix, and by default do not overwrite the live `intent`. Going back to an earlier search must never delete the outfit you already collected. Restoring an entry's intent is explicit (`restoreEntry(entry, {apply_intent:true})`) or opt-in (`history.restore_intent_on_navigate`, default `false`).
- **INV-EXP-4** — every `reference_id` in `mix.references` is also in `pinned_reference_ids`, so a contributing reference can never vanish from view.

### The nuance that keeps this from becoming a coupling argument

**ONE UI, but NOT one module.** This is the point most likely to be misread, so it is stated flatly:

| | Unified | Separated |
|---|---|---|
| **What** | the *surface* and the *state* | the *code* |
| **How** | one modal; one `ExplorerState`; no product state outside it (`C10`) | `src/search/**` ↮ `src/prompt/**`, both directions, including via a shared helper (`C2`) |
| **Why** | the brief's Pillar 1 and the UX north star | the brief's hard prohibitions: no coupling of UI with prompt engine, no coupling of search with prompt composer |

Search and Prompt communicate **only through plain data owned by Core** — they never import each other. `src/prompt/**` may not import `src/ui/**`, may not touch the DOM, and may not receive a DOM node (`C1`), which is also precisely what makes Q9 answerable. Both prohibitions are machine-checked by the architecture lint; a violating pull request is rejected regardless of what it enables.

`C5` closes the last seam: the analyzer may not rank, the retriever may not propose chips, and **`results` never writes back into `intent`**. Retrieval sits inside the composer's UI without ever reaching into the composer's document.

### The use case that requires it

> *"Same composition as this photo, but the outfit from that one."*

```
type "rainy alley"          → mode: text    → results
open a card, EXTRACT camera → mix += {img_A, use:[composition, framing, camera_angle]}
drop a phone photo          → mode: image   ← intent, pins, mix ALL still here (INV-EXP-1)
browse Clothing → Streetwear→ mode: browse  ← still here
open a card, EXTRACT clothing → mix += {img_B, use:[clothing], exclude:[clothing.beanie]}
conflict: framing A vs B    → surfaced, resolved by click
read the prompt             → composer panel, same modal, never closed
```

With two pages, step 3 destroys steps 1–2. The task is not merely inconvenient across a page boundary; it is **inexpressible**, because there is no artefact to carry across that holds a mix.

Mechanism detail lives in [`ARCHITECTURE.md §3–§4`](./ARCHITECTURE.md) (the modal state machine and the mode-switch invariant) and [`explorer-state.schema.json`](./schemas/explorer-state.schema.json).

### How this answer could fail

`D7` (image and video get their own pages), `D8` (the modal closes on search or mode switch), `D9` (a mode switch clears intent, pins, mix or filters), or a second store appearing anywhere in the UI (`C10`). The last is the quiet one: INV-EXP-1 does not usually die by decision, it dies because a component kept its own copy of something and forgot to restore it.

---

## Q3. What are the minimum VisualIntent fields?

**Verdict.** Exactly **20 keys**, all REQUIRED, `additionalProperties: false`: 19 `IntentChip[]` arrays plus one `confidence` map. Arrays may be empty and `confidence` may be `{}` — but no key may be absent, and no 21st key may appear.

"Minimum" has two readings and both are answered below: the minimum **key set** of the document, and the minimum **field set** of an element.

### 3a. The document — the 20 keys, in brief order

| # | Key | Type | Arity (§2 of the data model) | → Prompt slot |
|---:|---|---|---|---|
| 1 | `subject` | `IntentChip[]` | multi | `subject` |
| 2 | `appearance` | `IntentChip[]` | multi | `appearance` |
| 3 | `framing` | `IntentChip[]` | **single_dominant** | `framing` |
| 4 | `camera_angle` | `IntentChip[]` | **single_dominant** | `camera` |
| 5 | `camera_distance` | `IntentChip[]` | **single_dominant** | `camera` |
| 6 | `lens` | `IntentChip[]` | **single_dominant** | `lens` |
| 7 | `pose` | `IntentChip[]` | **single_dominant** | `action` |
| 8 | `action` | `IntentChip[]` | multi | `action` |
| 9 | `motion` | `IntentChip[]` | multi | `motion` |
| 10 | `camera_motion` | `IntentChip[]` | multi | `camera` |
| 11 | `clothing` | `IntentChip[]` | multi | `clothing` |
| 12 | `scene` | `IntentChip[]` | multi | `scene` |
| 13 | `lighting` | `IntentChip[]` | multi | `lighting` |
| 14 | `composition` | `IntentChip[]` | multi | `composition` |
| 15 | `color` | `IntentChip[]` | multi | `style` |
| 16 | `mood` | `IntentChip[]` | multi | `style` |
| 17 | `style` | `IntentChip[]` | multi | `style` |
| 18 | `time` | `IntentChip[]` | **single_dominant** | `lighting` |
| 19 | `weather` | `IntentChip[]` | **single_dominant** | `scene` |
| 20 | `confidence` | `{ <intent_category>: 0..1 }` | — | — |

That is the brief's canonical field list, unchanged and unreordered.

**The `props` asymmetry, stated plainly.** The brief fixes VisualIntent at 20 keys *and* lists `Props` among the taxonomy categories. Both are honoured: `props` is a first-class **visual category** (20 of them) in the taxonomy, in `Reference.visual_attributes`, in `ReferenceMix.use`, in conflict detection and in browse — but it has **no dedicated intent array**. A props chip lives in `scene` and declares `origin_category: "props"` (**INV-PROPS-1**, schema-enforced), which keeps Reference ⇄ VisualIntent ⇄ ReferenceMix round-trips lossless and still lets the UI render it under a Props heading. `scene` is the only array that accepts a foreign namespace; every other array enforces `value` namespace == array category (**INV-INT-2**).

So: **20 visual categories, 19 intent arrays, 13 prompt slots.** Those three numbers are not typos and their relationship is defined once, in [`taxonomy-node.schema.json`](./schemas/taxonomy-node.schema.json)`#/$defs`.

### Why all 20 are required rather than optional

| Reason | Consequence if they were optional |
|---|---|
| Shape stability | every consumer needs `intent.lens?.length ?? 0` at every call site; one missing `?.` is a crash |
| Trivial diff/merge | absent-vs-empty becomes a distinction the merge logic must invent a rule for |
| Round-trip fidelity | `normalize(normalize(x))` could no longer deep-equal `normalize(x)` without a canonicalisation step |
| UI layout | the chip editor renders 19 rows unconditionally; rows do not appear and disappear as you type |

`EMPTY_INTENT()` (in `src/core/visual-intent.js`) returns the 20 keys with empty arrays and `confidence: {}`. It is the identity element of the whole system.

### 3b. The element — the minimum legal `IntentChip`

```jsonc
{ "value": "framing.medium_shot", "source": "user" }
```

Two required fields. Everything else has a default or is conditionally required:

| Field | Required when | Note |
|---|---|---|
| `value` | always | a taxonomy id, or free text ≤120 chars when `custom: true` |
| `source` | always | one of the 10 `ChipSource` values |
| `ref_id` | `source ∈ {reference, mix_resolution}` | **INV-INT-3** |
| `origin_category` | a `props.*` value stored in `scene` | **INV-PROPS-1** |
| `confidence` | never; defaults `1.0` for `source: "user"`, `0.5` for analyzer/expansion | **INV-INT-4**: `source == "inferred"` ⇒ ≤ 0.5 |
| `evidence.kind` + `confidence ≤ 0.6` | a `motion` chip from `analyzer_image` | **INV-VID-3** |

The full optional set — `label, locked, id, custom, negate, order, weight, evidence, alternatives, contributors, contested, note, created_at, updated_at, x_ext` — is documented in [`DATA_SCHEMA.md §8`](./DATA_SCHEMA.md). Note there is **no `x_ext` on `VisualIntent` or `StructuredPrompt`**: their key counts are frozen by the brief at 20 and 13, and an extension bucket would make them 21 and 14. For the same reason neither carries `schema_version`; they are value objects and are wrapped in `$defs/document` envelopes (`VisualIntentDocument`, `StructuredPromptDocument`) when persisted or exported.

### 3c. Confidence is two levels, deliberately

The brief says `confidence` maps field → 0..1 *"(or per-value confidence)"*. Both exist, at different levels, because the UI needs both:

```
IntentChip.confidence          per-VALUE     "how sure are we about THIS value"
VisualIntent.confidence[cat]   per-CATEGORY  "how well is this category characterised at all"
```

```
aggConfidence(c):
    if any chip in c has locked == true or source == "user" -> 1.0
    else                                                    -> max(chip.confidence), 3 dp
    if the category array is empty                          -> entry absent (or 0)
```

**Max, not mean.** A category is "known" once one high-confidence value is known; averaging would punish a rich category that legitimately carries several weak secondary chips. The map is a **stored advisory cache** and a derived value: writers may set it, readers MUST recompute it after any chip edit (derived-cache rule 0.3, alongside `IntentChip.contested`, `ReferenceMix.conflicts`, `TaxonomyNode.children` and the rest).

### 3d. Three profiles, one root

| Profile | `$ref` | Element type | Used for |
|---|---|---|---|
| **full** (root) | `visual-intent.schema.json` | `IntentChip` object | canonical in-memory and persisted form |
| **compact** | `#/$defs/compact` | bare taxonomy id string | export / interop |
| **ingest** | `#/$defs/ingest` | any subset, strings or chips or both | permissive wire shape — **never persisted** |
| **document** | `#/$defs/document` | wraps `full` or `compact` | `{schema_version, kind, form, intent, …}` |

**Losslessness, precisely.** `compact` is lossless with respect to the **semantic payload** — the exact set of taxonomy ids per category, which is everything a generation prompt depends on — and lossy only with respect to **provenance metadata** (source, ref_id, confidence, lock, evidence, alternatives). Round-trip guarantee: `compact → normalizeVisualIntent → compactVisualIntent` returns the identical document. `compactVisualIntent` drops `custom` and `negate` chips **with a warning**, because they have no taxonomy id to carry.

`normalizeVisualIntent(input, ctx)` is **total and idempotent**: it never throws on a valid ingest document, and an unknown taxonomy id becomes a `custom: true` chip rather than an error. Its eight steps (fill · lift strings to chips · fill labels · rewrite deprecated ids · move stray `props.*` into `scene` · dedupe as *agreement* · sort · recompute confidence) are specified in [`DATA_SCHEMA.md §7`](./DATA_SCHEMA.md).

### How this answer could fail

A 21st key. An optional key. A bare-string array in the full form (`D6`). Or `props` acquiring its own array, which would break the brief's fixed count and silently invalidate every stored intent that used the `scene` carrier.

---

## Q4. What data structure lets you take only SOME attributes from one reference?

**Verdict.** `MixEntry` — an **edge object** between a `ReferenceMix` and a `Reference`, in [`reference-mix.schema.json`](./schemas/reference-mix.schema.json). It selects at four granularities and never copies the reference.

### The structure

```jsonc
{
  "reference_id": "img_openverse_1a2b3c4d",   // REQUIRED
  "use":  ["clothing"],                        // REQUIRED — visual_category[] or ["*"]
  "only": [],                                  // allow-list of taxonomy ids, applied FIRST
  "exclude": ["clothing.beanie"],              // deny-list, applied AFTER only
  "weight": 1,        // 0..1, multiplies contributed chip confidence. Soft. Never auto-resolves.
  "priority": 10,     // int 0..1000, hard ordering; ties break on array position
  "pinned": true,     // survives searches, mode switches, result replacement
  "role": "outfit",   // free label: "composition anchor", "outfit", "camera work"
  "note": null, "added_at": "2026-01-01T00:00:00Z"
}
```

**INV-MIX-1:** `reference_id` is unique across entries. One reference, one edge.

### Four granularities of "some"

```
Reference.visual_attributes            (all 20 categories the reference actually has)
        │
        │  ① use: ["*"]              ── whole reference
        │  ① use: ["clothing","lighting"]  ── CATEGORY level
        ▼
   categories kept
        │
        │  ② only: ["clothing.hoodie","clothing.cargo_pants"]   ── NODE allow-list
        ▼                                (applied BEFORE exclude; empty ⇒ no-op)
   candidate ids
        │
        │  ③ exclude: ["clothing.beanie"]                       ── NODE deny-list
        ▼
   contributed ids  ──▶ chips {source:"reference", ref_id, confidence, origin_category}
        │
        │  ④ post-hoc: delete the chip, or `locked` a competing user chip
        ▼
   VisualIntent
```

`only` before `exclude` is the specified order, and it matters: `only` narrows to an allow-list, `exclude` then removes from what survived. Writing them the other way round would make `only: [X], exclude: [X]` ambiguous; as specified it is unambiguously empty.

### The contribution function, exactly

From `applyMix` step 4:

```js
chip = {
  value:  v,                                  // a taxonomy id from reference.visual_attributes[c]
  label:  taxonomy[v].label,
  source: "reference",                        // ⇒ ref_id is REQUIRED (INV-INT-3)
  ref_id: entry.reference_id,
  confidence: clamp01((attribute_meta[v].confidence ?? 0.7) * entry.weight),
  origin_category: c                          // props.* chips are written into `scene`
}
```

`0.7` is the specified default when the analyzer sidecar has no opinion. `weight` is a **soft** emphasis multiplier and never participates in conflict detection; `priority` is the **hard** ordering. Confusing the two is the classic way an "auto-resolver" sneaks in.

### Why an edge object rather than a copy

| Property | Consequence |
|---|---|
| The `Reference` is global and immutable | the same reference donates `lighting` in one recipe and `clothing` in another, with **no duplication** |
| The edge is small and diffable | changing "take the outfit" to "take the outfit but not the hat" is one array element, not a re-import |
| `Reference.visual_attributes` holds **bare taxonomy ids** | the brief's interop shape stays minimal; analyzer detail lives in the `attribute_meta` sidecar |
| The mix is pixel-free | a `MixEntry` survives media rot untouched (rule R2) |

### The brief's own payloads, validating verbatim

**INV-MIX-0.** Only `references` is required at the root, so the brief's interop minimum validates unchanged:

```json
{ "references": [ { "reference_id": "img_A", "use": ["composition","camera_angle"] } ] }
```

And the headline use case, fully expressed:

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

### The UI seam: EXTRACT groups are not stored

A reference card exposes `USE` (everything), the **8 EXTRACT groups**, and `EXPLORE`. The groups are a UI vocabulary and are expanded to categories **before** they reach `ReferenceMix.use` — `use` never stores a group name.

```
composition : [composition]                      pose     : [pose]
camera      : [camera_angle, camera_distance,    clothing : [clothing]
               framing, lens, camera_motion]     lighting : [lighting, time]
scene       : [scene, weather, props]            style    : [style, mood, color]
motion      : [motion]
```

These cover 17 of 20 categories. `subject`, `appearance` and `action` are **deliberately excluded**: EXTRACT takes *how it looks*, not *who or what is in it*. Those three arrive only through `use: ["*"]` or manual chip authoring. This is a product decision, not an omission, and it has a test (`GATE-P3-c` in [`ROADMAP.md §4.3`](./ROADMAP.md)).

### The immovability rule

`applyMix` step 1: chips with `source == "user"` **or** `locked == true` are **IMMOVABLE**. The mix may add alongside them and may raise a conflict against them; it may never remove or rewrite them. This is what makes "AI output is a proposal, never a commitment" true at the level of a single value rather than a whole document.

### How this answer could fail

`D2` — references reduced to a single "Use" button, because EXTRACT and EXPLORE were called confusing. At that moment `only` and `exclude` still exist in the schema but nothing can author them, and Pillars 3 and 4 are dead in the product even though they are alive in the JSON.

---

## Q5. How are conflicts between multiple references handled?

**Verdict.** Detected by three named kinds, recorded as first-class `Conflict` objects with **deterministic** ids, surfaced side by side with their sources, and resolved **only by a human** unless the user explicitly and visibly opts into a policy. Nothing is auto-picked. Nothing is silently dropped. A category with an open conflict is **not emitted** into the prompt; it is reported in `blocked[]`.

### The doctrine, stated as defaults

```jsonc
"resolution_policy": {
  "auto_resolve": false,       // ← default. `user` is then the ONLY reachable strategy.
  "default_strategy": "ask",
  "on_unresolved": "block"     // ← default. Alternatives: "highest_priority" | "drop"
}
```

`"highest_priority"` and `"drop"` are explicit user opt-ins and **MUST be visibly indicated in the UI** while active (`GATE-P5-c`). **INV-MIX-2** and coupling prohibition `C8` make this a build-level commitment, not a setting someone can quietly flip in a default.

### The three kinds

| Kind | Fires when | `group` | Example |
|---|---|---|---|
| `arity` | a **single_dominant** category holds ≥2 distinct **non-modifier** values from ≥2 distinct references | — | `camera_angle.low_angle` (A) vs `camera_angle.high_angle` (B) |
| `exclusivity_group` | a **multi** category holds ≥2 distinct values sharing a non-null `exclusivity_group` | required | `lighting.high_key` vs `lighting.low_key`, group `key_level` |
| `explicit` | the taxonomy declares `conflicts_with` between the two ids (**may cross categories**) | — | `camera_motion.static` vs every other camera-motion node |

The seven `single_dominant` categories are `framing, camera_angle, camera_distance, lens, pose, time, weather`. The other thirteen are `multi`, where two different values are **not** a conflict by themselves.

**The modifier escape is what makes a binary rule correct rather than approximate.** Every `TaxonomyNode` may declare `exclusivity_group: string | null`. In a single_dominant category, a node with `exclusivity_group: null` is a **MODIFIER** and never participates in a conflict — `camera_angle.dutch_tilt`, `pose.arms_crossed`, `weather.fog`. So "rain + fog" never registers as a conflict while "sunny + rain" does, and "arms crossed" never fights the base pose it modifies.

### The lifecycle

```
  applyMix
     │
     ├─ ① dominance FIRST ──▶ category has a dominance entry?
     │       yes → resolves to that reference, NO open conflict
     │             (this is how "which should be dominant?" is remembered, not re-asked)
     │       no  ↓
     ├─ ② detect (arity | exclusivity_group | explicit)
     │       both values STAY in the intent · contested = true on every participant
     │       cfl_ id = sha1(category|group|sorted(values)) .slice(0,12)   ← DETERMINISTIC
     │
     ├─ ③ surface: two thumbnails, two labels, two confidences, side by side
     │       from_user candidates are PRE-SELECTED and can only lose by explicit click
     │
     ├─ ④ human decides  ──▶ Resolution { winner_value, strategy:"user",
     │                                    disposition: winner_only | keep_all, resolved_by }
     │       status: resolved   (INV-MIX-3: resolution REQUIRED when resolved)
     │       or status: ignored  ← an explicit human decision to let them coexist
     │
     └─ ⑤ the winner materialises as a chip with source: "mix_resolution", ref_id = winner
```

The deterministic `cfl_` id is the load-bearing detail: `applyMix` is pure, so it re-runs on every edit — and a resolution recorded against `cfl_ab12cd34ef56` still matches the same conflict after recomputation. Without determinism, every edit would re-ask every question.

### What reaches the prompt

```jsonc
// the conflict
{ "id": "cfl_ab12cd34ef56", "category": "camera_angle", "kind": "arity", "status": "open",
  "candidates": [ { "reference_id": "img_a", "value": "camera_angle.low_angle",  "confidence": 0.9 },
                  { "reference_id": "img_b", "value": "camera_angle.high_angle", "confidence": 0.8 } ] }

// what formatPrompt returns while it is open
"blocked": [ { "slot": "camera", "category": "camera_angle",
               "reason": "unresolved_conflict", "conflict_id": "cfl_ab12cd34ef56" } ]
```

`BlockedSlot.reason ∈ {unresolved_conflict, missing_taxonomy, policy}`. The UI shows it as an unresolved **decision** — never as an error, never as a silent omission. A blocked slot is a better product than a clean prompt that lost a choice.

### Agreement is the mirror image, and is never a conflict

Deduplication by `(target_array, value)` is **AGREEMENT**, not collision: keep max confidence, **union `contributors[]`**, OR the `locked` flags, keep the earliest `created_at`. Two references saying `lighting.backlit` makes the value *stronger* and records both sources. Only *different* values under a conflict rule disagree. This is why `contributors[]` and `contested` are separate fields rather than one.

### Conflict avoidance by construction

The brief's own video use case never conflicts, and that is a design property rather than luck:

```json
{ "references": [ { "reference_id": "vid_a", "use": ["motion"] },
                  { "reference_id": "vid_b", "use": ["camera_motion"] } ] }
```

Two different categories ⇒ no conflict, by construction. `motion` stays subject motion; `camera_motion` stays camera behaviour. That seam is exactly why `camera_motion` maps to the `camera` slot and not the `motion` slot (§3 of the data model), and why merging the two categories (`D17`) would make this use case inexpressible.

### Why nothing is auto-resolved

Every auto-resolution rule that sounds reasonable is a creative decision made by a heuristic and hidden from the person whose work it is:

| "Reasonable" rule | What it actually does |
|---|---|
| highest confidence wins | the analyzer's certainty overrules the user's taste |
| first wins / last wins | the outcome depends on click order, which nobody can see |
| highest priority wins | correct *only* when the user set priority for this purpose — hence it is an opt-in strategy, never a default |
| drop both | the cleanest prompt and the largest silent loss |

Full mechanism in [`DATA_SCHEMA.md §11`](./DATA_SCHEMA.md); the survey finding that **no comparable tool can even detect the disagreement** is in [`COMPETITIVE_ANALYSIS.md §4.5`](./COMPETITIVE_ANALYSIS.md).

### How this answer could fail

`D4` (auto-resolution ships with no visible decision), `D5` (conflicting values silently dropped so the prompt looks clean), or a `maxItems: 1` appearing on a single_dominant category — which would make the conflicting state unrepresentable and therefore undetectable, converting a surfaced decision into a schema validation error at exactly the wrong moment.

---

## Q6. Does the product work with no AI at all?

**Verdict.** Yes — completely, not as a degraded trial mode. **INV-AI-1.** The brief's entire `v0.1` milestone sits in the AI-OFF column, which is the proof rather than the claim: the first shippable version of this product contains no model.

### What works with `ai.enabled === false`

| Capability | AI OFF | Mechanism |
|---|---|---|
| Browse 20 categories as thumbnailed tiles | ✅ full | `data/taxonomy/*.json` + `TaxonomyNode.visual_hint` |
| Learn a term by looking at pictures | ✅ full | browse tiles — no model involved |
| Keyword search over `id/label/aliases/i18n/description` | ✅ full | inverted index, `src/search/metadata-search.js` |
| Alias + `related[]` one-hop query expansion | ✅ full | `expansion_enabled` is available with AI off |
| Structured metadata search over `visual_attributes` | ✅ full | `filterReferences` |
| Licence filtering and badges | ✅ full | `src/reference/license-guard.js` |
| Manual chip authoring, editing, locking, negating | ✅ full | `src/ui/intent-chips.js` + `src/core/visual-intent.js` |
| Reference decomposition + 8 EXTRACT groups | ✅ full | stored `visual_attributes` |
| Selective inheritance (`use`/`only`/`exclude`) | ✅ full | `src/core/reference-mix.js` |
| Multi-reference mixing, conflict detection, resolution | ✅ full | `applyMix` is pure logic, not inference |
| Structured prompt build + generic formatter | ✅ full | `src/prompt/**` never calls a model |
| Visual Recipe save / open / re-derive | ✅ full | pixel-free data |
| Search by Difference | ✅ structured: KEEP/CHANGE as hard filters over taxonomy ids | `buildDifferenceQuery` |
| Similar-reference search | ✅ structured similarity: shared taxonomy ids, weighted by category | `fusion-ranker.js` in `metadata_only` mode |

What AI adds, and only adds: image → chips, video → chips + camera motion + timespans, free text → taxonomy ids beyond keyword matching, semantic kNN, reranking.

### The AI-free retrieval engine, concretely

No model is involved. One inverted index over `{node.id, label, aliases[], i18n[*].label, i18n[*].aliases[], description}` plus, for references, `{title, description, tags[], aliases[]}`. The scoring ladder:

```
exact id match .............. 1.00
exact label match ........... 0.95
exact alias match ........... 0.90
prefix on label or alias .... 0.70
substring on label or alias . 0.50
one hop through related[] ... 0.35 × score(source node)
substring in description .... 0.20
score *= node.search_boost (default 1.0);  deduplicate by node keeping max
deprecated nodes are excluded from results (stored chips referencing them stay valid)
```

Hits become intent chips (`source: "user"` when clicked, `source: "query_expansion"` when auto-expanded) and/or structured metadata filters over `Reference.visual_attributes`. **`aliases[]` is the whole reason this works**: a synonym is an alias, not a node, so vocabulary variation is absorbed by data rather than by a model. Tuning constants and the tokenizer live in [`SEARCH_ARCHITECTURE.md §3`](./SEARCH_ARCHITECTURE.md).

### The three rules that keep AI-OFF honest

1. **No feature may be implemented such that its AI-OFF path is an error message.** Either it degrades to a defined structured behaviour, or it is disabled with a named reason. Every degradation renders as a one-line `degrade_notice` with the missing capability named — **disable-and-explain, never hide-and-confuse**.
2. **`results.ranking.mode` is always displayed.** `hybrid | semantic_only | metadata_only | keyword_only`. A user must always be able to tell which retrieval ran, so nobody can believe semantic search silently happened.
3. **Turning AI off never destroys data.** Chips authored by an analyzer keep their `source` and stay editable; the intent does not change.

### The null objects

The AI-OFF path is not a branch — it is a set of adapters:

```js
NULL_ANALYZER    // capabilities: modalities [], everything false
NULL_EMBEDDING   // dim 0 ⇒ can_semantic_search false ⇒ ranking falls back
NULL_RERANKER    // identity: returns candidates unchanged
MOCK_ANALYZER    // v0.1 only: drives query.<mode>.analysis_status = "mocked"
```

`analysis_status: "mocked"` is a **first-class state** in `explorer-state.schema.json`, not a hack: v0.1 ships the upload UI before real analysis exists, and the UI says so rather than pretending. Upload is never rejected for lack of an analyzer; the video filmstrip and the time window keep working because they are player features, not model features.

`deriveCapabilityProfile(ai_settings, capability_records)` folds the adapter capability records and the user's toggles into one flat boolean object the UI reads. It is pure and lives in **Core**, which is why UI degradation policy never leaks into the adapter layer.

### How this answer could fail

`D11` — an empty state that says "enable AI to continue", or any search path with no keyword fallback. `NG-R3` in [`ROADMAP.md §8`](./ROADMAP.md) re-tests AI-OFF completeness at v0.2, v0.3, v0.4 and v0.5 precisely because this is the kind of property that erodes one convenient exception at a time.

---

## Q7. Can the AI model be swapped later?

**Verdict.** Yes, by configuration, with **no data migration and no data loss**. Three runtime ports, opaque model ids, **model-keyed** embeddings, an open `FORMATTER_MODE` string, and a lint rule that fails the build if a backend is imported anywhere.

### The seam

```
        ┌──────────── src/core/**  (imports NOTHING) ─────────────┐
        │  taxonomy · visual-intent · reference-mix · explorer     │
        └──────────────────────────▲──────────────────────────────┘
                                   │  plain data only
   ┌──────────────┬────────────────┴────────────────┬──────────────┐
   │ src/ai/      │ analyzer.js   embedding.js   reranker.js       │   ← PORTS (shared)
   └──────────────┴──────────────────▲──────────────┴──────────────┘
                                     │ registered at runtime
                    ┌────────────────┴────────────────┐
                    │  BACKENDS — host-supplied, never imported by us
                    │  local WASM · llama-server · remote API · null
                    └─────────────────────────────────┘
```

**INV-AI-2 / `C3`:** no module may import a concrete AI backend; no model name appears as an import specifier or a branch condition. Checked by the architecture lint *and* by a source scan for reserved model names (`GATE-X-2`).

### What actually makes the swap free: `Reference.embeddings` is a map

```jsonc
"embeddings": {
  "clipish_base@1": { "model_id": "…", "adapter": "embedding-adapter:local@3", "dim": 768,
                      "modality": "image", "vector_ref": "idx://v1/9f2ab41c",
                      "normalized": true, "quantization": "int8", "created_at": "…" },
  "otherfam_large@2": { "…": "several models coexist in ONE reference" }
}
```

The key grammar is `"<family>_<size>@<rev>"` — it *is* `EmbeddingCapabilities.embedding_key`. Retrieval queries only the key named by the **active** embedding adapter and **silently skips references that lack it**. Consequences:

| Swap step | Cost |
|---|---|
| Change the active adapter | a settings change |
| Old vectors | **kept**, under their own key, still valid for rolling back |
| New vectors | appended by a background, idle-scheduled re-index |
| Search during re-index | correct on the partially indexed set; per-**item** weight renormalization means a reference with no vector is judged on what *is* known, not punished for what is not |
| Schema migration | **none** — no field changes type, no document is rewritten |

`EmbeddingRecord` requires exactly one of `vector` / `vector_ref` (`oneOf`, **INV-REF-3**); `vector_ref` points into a sidecar index outside the repository, so an embedding swap never rewrites reference documents at all.

### Swapping the analyzer

Analyzer output is **staged → normalised → accepted**, never written straight into `intent`:

```
adapter → AnalyzerResult.intent (VisualIntentIngest, permissive)
        → normalizeVisualIntent(..., { default_source: "analyzer_image" | "analyzer_video" | "analyzer_text" })
        → post-condition enforcement
        → staging area in query.<mode>
        → ACCEPT_PROPOSAL → intent
```

The post-conditions are what let us trust an adapter **nobody in this repository wrote**:

- a `camera_motion` chip sourced `analyzer_image` is **dropped with a warning** (INV-VID-1 — a single still cannot evidence camera movement);
- a `motion` chip from `analyzer_image` is clamped to `evidence.kind: "implied"` and `confidence ≤ 0.6`, and kept only for taxonomy nodes flagged `still_inferable: true` (INV-VID-3);
- the egress gate runs **before** the adapter is touched: a `local_only` handle is refused outright.

Provenance survives the swap because `evidence.detector` stores an **adapter instance id** (`analyzer-adapter:local@2`), never a hardcoded model name. Chips authored by yesterday's analyzer remain valid, editable and attributable after today's swap.

### Swapping the reranker and the formatter

- Reranker output is **blended**, never substituted — it cannot see licence, structure or dimensions, so it must not overwrite what can. `NULL_RERANKER` is the identity function.
- `FORMATTER_MODE` is an **open string** (`^[a-z0-9]+(_[a-z0-9]+)*$`), reserved values `generic` (the only one that must exist), `flux`, `qwen_image`, `sd`, `gpt_image`, `minimax_h3`, `krea`. Adding a mode is a formatter module plus optional `model_hints` keys on taxonomy nodes — **no core change**. Formatters are leaves: a formatter may not import Search, Reference, Providers or AI (`C12`), and may not invent a value absent from the `StructuredPrompt` (INV-FMT-3).

### The capability contract that makes degradation automatic

Every adapter reports `capabilities()` — **synchronous and cheap**, so the UI can lay itself out before any model has loaded:

```js
AnalyzerCapabilities = { id, kind, version, offline, requires_external_transmission, cost_class,
  modalities: ("image"|"video"|"text")[], categories_supported: visual_category[],
  supports_bbox, supports_timespan, supports_shot_boundaries, max_pixels?, max_duration_s?, batch_max? }
```

A weaker replacement model therefore produces a *narrower UI with named reasons*, not a crash — the swap does not require the new model to be as capable as the old one.

### The AI-OFF backstop makes the swap risk-free

Because of INV-AI-1, "no acceptable model exists today" still leaves a complete product. This is why `RSK-01` (a candidate model turns out to carry an unusable licence) is a config change rather than a rewrite, and why [`SEARCH_ARCHITECTURE.md §14.1 D15`](./SEARCH_ARCHITECTURE.md) ships the MVP with `NULL_EMBEDDING` and **no default model** at all.

Ports and capability negotiation: [`ARCHITECTURE.md §5`](./ARCHITECTURE.md). Model candidates, evaluated as candidates and never as dependencies: [`research/multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md), [`research/video-analysis-and-local-runtimes.md`](./research/video-analysis-and-local-runtimes.md).

### How this answer could fail

`D12` — a model name hardcoded anywhere outside adapter config. Or an embedding stored under a *fixed* key instead of a model key, which turns every future swap from a background re-index into a migration, and quietly makes rollback impossible.

---

## Q8. Is reference licensing separated from code licensing?

**Verdict.** Yes — structurally, not by policy statement. Two layers, no inheritance in either direction, one field that only ever means one thing, and a **no-binaries rule that keeps the two physically apart**. The separation is a fact about the repository's contents, not an argument about interpretation.

### The two layers (three, counting model weights)

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — CODE                                                      │
│  src/** · app/** · data/taxonomy/*.json · docs/**                    │
│  Licence: MIT  (/LICENSE).  Authored by us. No copied external code. │
│  Obligation: keep the notice. That is all.                           │
└──────────────────────────────────────────────────────────────────────┘
                 ▲                                    ▲
                 │       NO INHERITANCE EITHER WAY    │
                 ▼                                    ▼
┌──────────────────────────────┐   ┌──────────────────────────────────┐
│  LAYER 2a — REFERENCE MEDIA  │   │  LAYER 2b — MODEL WEIGHTS        │
│  Pointed at, never stored.   │   │  Never bundled. Per-checkpoint    │
│  Licence per item, in        │   │  terms, NOT implied by the repo's │
│  Reference.metadata.license  │   │  licence.                        │
└──────────────────────────────┘   └──────────────────────────────────┘
```

- **LP-1.** The MIT licence grants nothing whatsoever regarding any reference image, reference video, model checkpoint or third-party dataset.
- **LP-2.** Conversely, a reference's licence grants nothing regarding the code. A CC BY-SA reference does not make the codebase share-alike; a CC BY-NC reference does not make the product non-commercial. **This is only true because of the no-binaries rule** — the moment we stored a byte of the media in the repository, this separation would become an argument instead of a fact.
- **LP-3.** `Reference.metadata.license` always means **the licence of the media asset we display**. Never the catalogue record, never the provider's API, never the provider's code, never the page the media sits on.

### The no-binaries rule is schema-enforced, not a convention

**INV-REF-2.** In [`reference.schema.json`](./schemas/reference.schema.json), these property names are declared `false`:

```
media_blob · media_base64 · media_bytes · data_uri · binary
```

A document carrying any of them is **INVALID**. Only URLs, thumbnail URLs, metadata, embeddings and visual attributes are ever stored. Embedding vectors follow the same spirit: prefer `vector_ref` into a sidecar index outside the repository; inline floats are for fixtures only. `GATE-X-7` re-checks this across code, fixtures, recipes and the vector sidecar, and `NG-R4` forbids any milestone from introducing byte storage "just for the cache".

### The record-vs-asset trap, which is why LP-4 exists

A verified, live hazard rather than pedantry — sourced from [`research/license-safe-media-apis.md`](./research/license-safe-media-apis.md):

| Case | Metadata licence | Media licence | The trap |
|---|---|---|---|
| Met Museum Open Access | CC0 (the dataset) | per object, via `isPublicDomain` | the repo states plainly that images are not part of the dataset |
| NYPL Digital Collections | CC0 (the records) | per item; roughly one third PD | the dedication is on the bibliographic data, not the scans |
| Smithsonian Open Access | CC0 (the records) | per asset, via `media.usage.access` | record-level CC0 and asset-level CC0 are different facts |

**LP-4** is therefore absolute: a provider adapter may write `metadata.license` **only** from a per-asset licence statement. If a provider publishes only a record-level or site-level licence, the adapter writes `unknown` and the reference goes to `license_review`. *"The catalogue is CC0"* is never evidence about a picture.

### The gate that makes it operational

```
LICENSE CHECK ──▶ SOURCE VALIDATION ──▶ ATTRIBUTION METADATA ──▶ REFERENCE APPROVAL
```

`Reference.license_guard` records each step as `{status: pending|pass|fail|manual_review, at, actor, note}`. Enforcement:

| Invariant | Statement | Where |
|---|---|---|
| **INV-LIC-1** | `approved` ⇒ non-empty `metadata.attribution`, and `license ∉ {unknown, proprietary}` | schema |
| **INV-LIC-2** | `approved` + `cc_by`/`cc_by_sa` ⇒ non-empty `creator` **and** `license_url` | schema |
| **INV-LIC-3** | `approved` also requires `license_check.status == "pass"` **and** `source_validation.status == "pass"` | code |

Default search filter is `status: ["approved"]`, so an unverified reference never reaches a normal result set. And `C7`: **licence approval is never a ranking signal, and ranking is never an approval path** — a weight can be tuned to zero; a gate cannot.

### Where the two layers are most likely to be confused, and are not

`VisualRecipe.license_summary` = `{licenses[], requires_attribution, share_alike, has_excluded, attribution_block}`. It describes **the reference media only**. It says nothing about the licence of the code and nothing about the licence of the generated output. `has_excluded: true` ⇒ the recipe MUST warn on open and MUST NOT be exported by default. `C13` states the prohibition in module terms.

**Attribution survives URL rot** because `metadata.attribution` is stored *text*, never a computed link (media-rot rule R4). A snapshot whose media is `gone` still renders its full credit line, and `attribution_block` is built from those stored strings. Rot is never "fixed" by embedding the image (rule R5) — which would be the one change that collapses the two layers into one.

Code-side obligations for anything we depend on live in [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and are reviewed in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md). Full policy, the licence matrix, attribution templates and the takedown procedure: [`LICENSE_POLICY.md`](./LICENSE_POLICY.md).

### How this answer could fail

`D15` (media binaries stored, in the repo, a cache, a fixture or a recipe) — the single change that turns LP-2 from a fact into a legal opinion. Or `D14` (unverified-licence references in normal results, or `approved` granted without the guard passing).

---

## Q9. Can the web MVP be reused inside ComfyUI?

**Verdict.** Yes — as a **packaging exercise, not a rewrite** — and the architecture is built so that this is checkable today rather than hoped for later. The engine is pure functions over plain data with no UI, no network and no clock. The node emits exactly the brief's four outputs, produced by the **same functions** the web app calls.

### Portability, module by module

| Module | Class | Portable? | Why |
|---|---|---|---|
| `src/core/taxonomy.js` | pure | ✅ verbatim | no I/O; data is injected |
| `src/core/visual-intent.js` | pure | ✅ verbatim | |
| `src/core/reference-mix.js` | pure | ✅ verbatim | |
| `src/core/explorer-state.js` | pure reducer | ✅ verbatim | usable headlessly for tests and batch |
| `src/core/visual-recipe.js` | pure | ✅ verbatim | a recipe is the node's natural input |
| `src/prompt/prompt-engine.js` | pure | ✅ verbatim | |
| `src/prompt/formatter-generic.js` | pure | ✅ verbatim | |
| `data/taxonomy/*.json`, `data/presets.json` | data | ✅ verbatim | inert JSON |
| `docs/schemas/*.json` | **contract** | ✅ verbatim | the cross-language truth |
| `src/reference/license-guard.js` | pure **except** `runSourceValidation` | ✅ minus that one function | classification and attribution are pure string/enum work |
| `src/reference/reference-manager.js` | pure **except** `resolveMedia` | ✅ minus that one function | media resolution needs the network |
| `src/search/*` (except semantic) | pure | ✅ usable, not required | the node does no retrieval |
| `src/providers/*.js` | network | ❌ host-specific | `fetch`, provider APIs, rate limits |
| `src/ai/*.js` | ports | ✅ ports, ❌ backends | backends are always host-supplied |
| `src/ui/**`, `app/index.html` | browser | ❌ | DOM |

**Purity is machine-checked.** The architecture lint fails the build if anything under `src/core/**` or `src/prompt/**` references `window`, `document`, `fetch`, `localStorage`, `node:` or `import.meta.url` (`GATE-X-4`). This is what makes "verbatim" true rather than aspirational — a single `document.` reference in the prompt engine would silently convert the node from packaging into a rewrite, months before anyone noticed.

### The language boundary — decided now, not later

ComfyUI nodes are Python; the reference implementation is JavaScript. Rather than defer:

- **The portable asset is the contract, not the language.** `docs/schemas/*.json` + `data/taxonomy/*.json` + golden fixtures `tests/conformance/*.json` (mapping `(intent, mix, taxonomy_version, mode) → expected StructuredPrompt → expected text`) define correct behaviour independently of any implementation.
- **Primary path:** ship one bundled zero-dependency pure-ESM artefact `dist/uvrc-core.mjs` (core + prompt + taxonomy); the Python node invokes it through a short-lived Node sidecar over stdin/stdout JSON. Zero re-implementation, and `formatPrompt`'s byte-determinism (INV-FMT-1) is preserved **by construction** because it is literally the same code.
- **Fallback path:** a Python port of core + prompt, accepted **only** when it passes the same conformance fixtures byte-for-byte. Divergence is then a test failure, not a discovery in the field.
- Whether a given ComfyUI installation has a usable Node runtime is an environment question, not a design one (**UNVERIFIED** across installations). The sidecar is **probed at node load and reported in node status, never assumed** — which is exactly why the fallback exists.

### The node's output contract

```
   VisualRecipe  ──┐
   VisualIntentDoc ├──▶ [ UVRC node ]  no network · no retrieval · pure transform
   ReferenceMix  ──┤          │
   prompt_mode   ──┘          ├──▶ prompt            STRING   formatPrompt(structured, mode).text
   taxonomy bundle ───────────┼──▶ structured_prompt JSON     toPromptDocument(...)
                              ├──▶ visual_intent     JSON     wrapIntentDocument(intent, meta)
                              └──▶ reference_mix     JSON     persistMix(mix, ctx)
```

Those are exactly the brief's four node outputs, and exactly the first four `VisualRecipe.exports[].kind` values — the node and the web app export the same things because the same functions produce both.

Node behaviour rules:

1. **`blocked[]` is surfaced on the node, never silently dropped.** An unresolved conflict in a headless graph is a visible blocked slot with its `conflict_id`. The conflict doctrine does not weaken because no human is on screen.
2. **No retrieval, no network.** Provider access stays in the web app.
3. `negative_text` is emitted alongside `prompt` when `constraints` is non-empty.
4. `taxonomy_version` and `formatter_version` travel inside `structured_prompt`, so a graph re-run against a newer taxonomy is diagnosable rather than mysterious.

**Round-trip guarantee:** `visual_intent` + `reference_mix` exported from the web app, fed into the node, reproduce the **identical** prompt string given the same taxonomy version and mode (INV-FMT-1). That is what makes this a "yes with evidence" rather than an intention.

### The gate — the node is not started early

The brief defers the node until the web MVP proves the concepts, and [`ROADMAP.md §4`](./ROADMAP.md) turns that into a gate with no partial credit: `GATE-P1` … `GATE-P5` (one per identity pillar) plus `GATE-X-1…8` (AI-OFF completeness at 100 %, no hardcoded model name, byte-determinism, purity lint green, coupling prohibitions hold, licence integrity, no binaries, lossless recipe round-trip).

`NG-R6`: the node is **never pulled forward** as a demo, a spike, or a thin prototype. A node built over an unproven core is a second implementation of an unsettled contract, and it will fossilise whatever is wrong.

### The rule that keeps two hosts honest without a meeting

```
   schema change ──▶ docs/schemas/*.json
                       ├──▶ tests/conformance/*.json  updated in the SAME commit
                       ├──▶ src/core/**, src/prompt/**   (both hosts get it for free)
                       └──▶ dist/uvrc-core.mjs rebuilt; the node picks it up unchanged
```

A schema change that lands without a conformance-fixture update is rejected. And `C5`: **the core never learns about its host** — no `if (isComfyUI)`, no `if (isBrowser)`. Host differences are expressed as injected adapters and injected data, both of which the core receives and never constructs.

### How this answer could fail

`D13` — the formatter reaches into the UI, or search imports the prompt composer. Either one converts §9's packaging exercise into a port, and the port will diverge.

---

## Still open

Pretending everything is settled is worse than naming the gaps. Everything below is **genuinely unresolved**. None of it blocks the design; each is currently resolved **conservatively by exclusion or by a labelled default**, and each has a named method of decision. `OPEN-nn` ids are this document's own naming (§S.4).

### S.1 Open by measurement — a number we have not measured

| Id | Question | Current conservative position | How we decide | Blocks |
|---|---|---|---|---|
| `OPEN-01` | **The real fusion weights.** 0.6 / 0.4 semantic:metadata is the brief's starting point, not a measured optimum | ship 0.6 / 0.4, **labelled in the UI as a default**, and always show `ranking.mode` | the `--sweep` harness over the golden query set, once a fixture library exists; a delta below ~0.05 nDCG@10 is treated as noise (**UNVERIFIED** as a computed interval — compute a bootstrap CI before quoting any number) | tuning only; nothing ships on it |
| `OPEN-02` | **Video embedding granularity** — whole-clip vs per-shot keyframe pooling | none chosen; `Reference.media.shot_boundaries` and `.keyframes` exist so either is expressible | measure both on a video golden set at v0.4; it changes what "semantic" means for video and therefore what the 0.6 weight is weighting | v0.4 similar-video search |
| `OPEN-03` | **Browser storage ceiling** — how many `(thumbnail_url + metadata + int8 vector)` records fit an IndexedDB/OPFS quota | promise no library size | measure, do not estimate, before any number appears in a UI or a README | any claim about local library size |
| `OPEN-04` | **Analyzer quality threshold** — at what accuracy do proposals stop being a net negative | proposals are always staged and per-chip acceptable; a weak analyzer degrades to manual authoring | track the proportion of proposed chips the user deletes (`RSK-07`); no default analyzer ships until it clears | enabling any analyzer **by default** |
| `OPEN-05` | **Whether an over-specified camera clause degrades generated output** | formatters emit everything the `StructuredPrompt` holds (INV-FMT-3) | empirical A/B per formatter mode; the answer becomes each mode's drop-order policy, never a core change | per-mode drop order beyond `generic` |

### S.2 Open by external verification — a fact we could not confirm firsthand

The research environment's egress proxy blocked these. Full per-item lists: [`THIRD_PARTY_REVIEW.md §12`](./THIRD_PARTY_REVIEW.md) and [`COMPETITIVE_ANALYSIS.md §12`](./COMPETITIVE_ANALYSIS.md).

| Id | Question | Current conservative position | How we decide | Blocks |
|---|---|---|---|---|
| `OPEN-06` | **Model-weight licences** for every candidate analyzer, embedder and reranker — distinct from their repositories' code licences | **no default model ships**; MVP uses `NULL_EMBEDDING` and `MOCK_ANALYZER` | read each model card and licence file firsthand; record it in `THIRD_PARTY_REVIEW.md` **before** the adapter is enabled by default | any default-enabled model (`RSK-01`) |
| `OPEN-07` | **Whether any CORS-enabled, key-free, CC-licensed *video* source exists** besides Wikimedia Commons | assume not | provider probe at v0.4 | if the answer is no, v0.4's corpus is user-uploaded video only — **and the UI must say so**, not imply a library that does not exist |
| `OPEN-08` | **Whether pixels can be read from a cross-origin provider video** under their CORS headers | assume not | probe per provider | whether remote video can be decomposed at all, or only local uploads |
| `OPEN-09` | **Openverse anonymous CORS behaviour and rate cap** (per-IP or per-origin), and its exact attribution string template | Wikimedia Commons is priority 1; our own attribution builder is used | firsthand API check at v0.2 | whether Openverse is default or opt-in; whether users must register credentials — itself an egress event that must be disclosed |
| `OPEN-10` | **One vendor's documented pan/tilt axis convention**, which is inverted relative to standard cinematography and to a competitor's own commands | that vendor's formatter mode is not written | empirical A/B generation | that mode is wrong half the time until it is settled — so it does not ship |
| `OPEN-11` | **CameraBench's full motion-primitive list**, unavailable in the repository | `camera.json` ships our synthesis, with `aliases[]` absorbing variants | obtain the primitive list, then reconcile as **aliases first, new nodes only if a concept is genuinely absent** (`RSK-04`: a synonym is an alias, not a node) | finalising the motion taxonomy |

### S.3 Open by decision we have deliberately deferred — a schema or product choice

| Id | Question | Current conservative position | How we decide | Blocks |
|---|---|---|---|---|
| `OPEN-12` | **Does a CC BY-SA reference create a share-alike obligation on the generated prompt *text*?** — a text derivative of attribute descriptions | CC BY-SA stays **opt-in, never default**; the question is recorded, not answered | **(UNVERIFIED — legal question.)** Requires qualified legal input, not engineering judgement. Until then the conservative reading (that it might) governs the default | enabling CC BY-SA anywhere by default |
| `OPEN-13` | **A `metadata_license` field distinct from the media `license`** | not shipped in v1; LP-4 handles the hazard by writing `unknown` and routing to `license_review` | a MINOR schema bump (additive, optional field) if `license_review` volume shows LP-4 is too blunt in practice | nothing today; it is a refinement, not a fix |
| `OPEN-14` | **A `formatter_capability` record per mode** — word budget, slot ordering, negative-prompt support, max simultaneous camera moves, drop order | `FORMATTER_MODE` is an open string and `model_hints` exists; a mode is a module | needs a home in the prompt layer and a MINOR bump; decide when the second formatter mode is written, not before — one mode is not evidence of a shape | modes beyond `generic` |
| `OPEN-15` | **Multi-shot sequencing** — `exports[].kind` already names `storyboard` and `shot_list`, but a shot is a `VisualIntent` and v1 of the data model does not express how several intents relate in time | post-v0.5, explicitly unscheduled | design the sequencing model **before** the feature, per `NG-R5`: no feature is scheduled before the schema expresses it, and the model will not be improvised into shape mid-milestone | storyboard and shot-list exports |
| `OPEN-16` | **Camera *level* as modifier nodes inside `camera_angle`** (`exclusivity_group: null`, so they never trigger an arity conflict) | proposed; the brief fixes the category list at 20, so a new category is unavailable and the modifier escape is the schema-legal resolution | ratify when `camera.json` is authored, with the arity consequences tested | the camera taxonomy's final shape |
| `OPEN-17` | **Donor-quality fields** (viewpoint, occlusion, scale) that would let the mixer warn "this flat-lay is a poor `pose` donor" | not in the model; the mixer warns about nothing | proposed as a MINOR addition to `attribute_meta`; decide only if real mixes show bad-donor confusion | nothing; a quality-of-life idea, honestly parked |

### S.4 Names this document introduces

| Name | Status |
|---|---|
| `OPEN-01` … `OPEN-17` | This document's own ids for open questions. Editorial only; no schema impact. They **index**, and do not replace, the per-cluster queues in [`THIRD_PARTY_REVIEW.md §12`](./THIRD_PARTY_REVIEW.md) and [`COMPETITIVE_ANALYSIS.md §12`](./COMPETITIVE_ANALYSIS.md) — when an item clears there, it clears here |
| The **containment argument** (Q1) and the **falsification** blocks in each section | Editorial framing owned here. The underlying claims are all schema- or invariant-backed |
| `Q1` … `Q9` as section labels | The brief numbers the nine questions; the labels are that numbering |

Everything else in this document uses names fixed by [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) or [`ROADMAP.md`](./ROADMAP.md). No synonym is introduced for anything already named.

### S.5 What is NOT open — do not re-litigate

Listing gaps honestly is only useful if the settled things stay settled. These are **closed**, and reopening one requires new evidence about the *product*, not a new opinion about the code:

| Closed | Authority |
|---|---|
| `VisualIntent` has exactly 20 keys, all required, `additionalProperties: false` | the brief; INV-INT-1 |
| `IntentChip` is an object, never a bare string, in the full form | INV-INT-1, `C9`, `D6` |
| Conflicts are detected and surfaced, never auto-resolved, never silently dropped | INV-MIX-2, `C8`, `D4`/`D5` |
| Arity is a conflict rule, **not** a cardinality limit — no `maxItems` on single_dominant | INV-MIX-4 |
| No binary media anywhere, ever | INV-REF-2, `NG-R4`, `D15` |
| A mode switch never resets intent, pins, mix, difference or filters | INV-EXP-1, `D9` |
| AI OFF is a complete product | INV-AI-1, `NG-R3`, `D11` |
| No hardcoded model names | INV-AI-2, `C3`, `D12` |
| Lens is hedged everywhere — `lens.35mm_like` → `"35mm-like perspective"` → `hedged: true` | INV-LENS-1/2, `D16` |
| Taxonomy hierarchy lives in `parent`, never in ids | INV-TAX-1, `C11`, `D19` |
| Reference licensing and code licensing are never conflated | LP-1/2/3, `C13` |

---

## Where to go next

| You want to… | Read |
|---|---|
| know why the product exists and what counts as decay | [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) |
| find the exact field, enum, invariant or worked example | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`schemas/`](./schemas/) |
| implement a module, an adapter or the egress boundary | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| implement retrieval, fusion or Search by Difference | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| implement the licence gate or add a provider | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |
| see what exists elsewhere and where it breaks | [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md), [`research/`](./research/) |
| know what ships when, and the gate to the node | [`ROADMAP.md`](./ROADMAP.md) |
| read the shipped controlled vocabulary | [`../data/taxonomy/`](../data/taxonomy/) |

*Corrections to any of the nine answers belong here **and** in the document that owns the mechanism. An answer that stops matching its mechanism is a defect in this file, never a new design.*
