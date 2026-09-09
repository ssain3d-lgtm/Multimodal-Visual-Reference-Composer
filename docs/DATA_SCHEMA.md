# Data Schema — Unified Visual Reference Composer

**Purpose:** the reference manual for every persisted structure in the product — the nine core objects, the shared enums and id grammars they are built from, the invariants that make the product's promises checkable, and worked payloads that prove the schema covers the brief's own use cases.

> ### 한국어 요약
> 이 문서는 제품이 저장하는 모든 데이터 구조의 레퍼런스 매뉴얼입니다. `VisualIntent`, `IntentChip`, `Reference`, `ReferenceMetadata`, `ReferenceMix`, `StructuredPrompt`, `TaxonomyNode`, `ExplorerState`, `VisualRecipe` 아홉 개 객체를 각각 목적 · 필드표 · 실제 JSON 예제 · 검증 규칙으로 정의합니다.
> 핵심 결정 세 가지: 20개 카테고리 열거형은 **단 한 곳**(`taxonomy-node.schema.json`)에만 정의되고, VisualIntent 배열의 원소는 문자열이 아니라 **출처·신뢰도·잠금·증거를 담은 `IntentChip` 객체**이며, 충돌은 감지되어 **표면화될 뿐 자동 해결되지 않습니다**.
> 분류 id는 `<카테고리>.<슬러그>` 두 마디로 고정되고 계층은 id가 아니라 `parent` 필드에 들어갑니다 — 재분류가 저장된 데이터를 깨뜨리지 않게 하기 위해서입니다.
> 기계가 읽는 정본은 [`schemas/`](./schemas/)의 JSON Schema 7개 파일이며, 본 문서와 어긋나면 스키마 파일이 아니라 `BRIEF.md` (정본 제품 브리프, 이 저장소에 반드시 커밋되어 있지는 않음) → 정본 데이터 모델 순으로 우선합니다.

---

## 0. Document contract and precedence

| Rank | Source | Role |
|---|---|---|
| 1 | the canonical product brief (`BRIEF.md`) | product authority; never contradicted |
| 2 | **this document + [`schemas/`](./schemas/)** | the canonical data model: every field name, enum value, category key, id grammar and invariant |
| 3 | [`ARCHITECTURE.md`](./ARCHITECTURE.md) | module boundaries and control flow *over* these structures |
| 4 | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`ROADMAP.md`](./ROADMAP.md) | depth on one layer each |

Sibling context: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) (why the structures look like this), [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) and [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) (what other tools store instead), [`research/`](./research/) (primary-source notes), [`../data/taxonomy/`](../data/taxonomy/) (the shipped controlled vocabulary that instantiates `TaxonomyNode`).

**Two rules govern this file.**

1. **The prose here and the JSON Schema files are one artefact.** Every table below is a rendering of a constraint that actually exists in `docs/schemas/*.json`. Where a rule is *not* expressible in JSON Schema it is marked **(code)** and belongs to the module named in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
2. **Nothing is named twice.** Shared enums, id grammars and constant tables live once, in `taxonomy-node.schema.json#/$defs`. Redefining `visual_category` locally in another schema is a defect, not a style choice.

### 0.1 The seven machine-readable files

| File | `$id` | Defines |
|---|---|---|
| [`schemas/taxonomy-node.schema.json`](./schemas/taxonomy-node.schema.json) | `https://schema.uvrc.dev/v1/taxonomy-node.schema.json` | `TaxonomyNode` **and all shared `$defs`** |
| [`schemas/visual-intent.schema.json`](./schemas/visual-intent.schema.json) | `…/v1/visual-intent.schema.json` | `VisualIntent`, `IntentChip`, `Evidence`, compact/ingest/document profiles |
| [`schemas/reference.schema.json`](./schemas/reference.schema.json) | `…/v1/reference.schema.json` | `Reference`, `ReferenceMetadata`, `EmbeddingRecord`, `ReferenceSnapshot` |
| [`schemas/reference-mix.schema.json`](./schemas/reference-mix.schema.json) | `…/v1/reference-mix.schema.json` | `ReferenceMix`, `MixEntry`, `Conflict`, `Resolution` |
| [`schemas/structured-prompt.schema.json`](./schemas/structured-prompt.schema.json) | `…/v1/structured-prompt.schema.json` | `StructuredPrompt`, `PromptFragment`, `ConstraintFragment`, `BlockedSlot` |
| [`schemas/explorer-state.schema.json`](./schemas/explorer-state.schema.json) | `…/v1/explorer-state.schema.json` | `ExplorerState`, `Query`, `Filters`, `ResultSet`, `History`, `Difference` |
| [`schemas/visual-recipe.schema.json`](./schemas/visual-recipe.schema.json) | `…/v1/visual-recipe.schema.json` | `VisualRecipe` |

All seven are JSON Schema **draft 2020-12** and pass `Draft202012Validator.check_schema`. `$id`s are identifiers, **not network locations** — nothing resolves them over HTTP; the validator is handed the seven documents from disk. `taxonomy-node.schema.json` has zero outgoing `$ref`s, so it always resolves first; every other file `$ref`s into it.

```
                    taxonomy-node.schema.json
                    (TaxonomyNode + ALL shared $defs:
                     visual_category, intent_category, taxonomy_id,
                     reference_id, prompt_slot, formatter_mode,
                     license_id, arity map, category→slot map, …)
                                  ▲  ▲  ▲  ▲  ▲  ▲
          ┌───────────────────────┘  │  │  │  │  └────────────────────────┐
          │            ┌─────────────┘  │  │  └──────────┐                │
  visual-intent   reference      reference-mix   structured-prompt   visual-recipe
          ▲            ▲                ▲                ▲                ▲
          └────────────┴────── explorer-state ───────────┘                │
          └──────────────────── visual-recipe ───────────────────────────┘
```

---

## 1. The object map

Nine objects, three lifetimes. Read this diagram before any field table; it is the only thing that explains *why* the field tables differ.

```
  INPUT SURFACES                 THE DOCUMENT                    OUTPUT
  ──────────────                 ────────────                    ──────

  text ┐
 image ┤                     ┌──────────────────┐        ┌───────────────────┐
 video ┼──► analyzer ───────►│   VisualIntent   │───────►│  StructuredPrompt │──► text
  card ┤    (or user typing) │   20 categories  │ build  │  13 slots         │  format
browse ┘                     │   of IntentChip  │        └───────────────────┘
                             └────────▲─────────┘                  │
                                      │ applyMix                   │ blocked[]
                             ┌────────┴─────────┐                  ▼
   Reference ───────────────►│   ReferenceMix   │──► Conflict ──► human decision
   (typed attribute bag)     │  entries + use[] │       ▲              │
        ▲                    └──────────────────┘       └──────────────┘
        │                                                 (never auto-resolved)
   TaxonomyNode  ◄── every value in every box above is a taxonomy id
   (controlled vocabulary, thumbnails, aliases, prompt fragments)

  ExplorerState = the live session: mode + query + intent + results + mix + history
  VisualRecipe  = the frozen session: intent + mix + REFERENCE SNAPSHOTS + prompt_mode
```

| Object | Lifetime | Persisted where | Carries `schema_version` |
|---|---|---|---|
| `TaxonomyNode` | ships with the app | `data/taxonomy/*.json` | yes (on the file wrapper and the node) |
| `Reference` | library-durable | `data/references.json`, provider cache | yes |
| `VisualIntent` | value object inside a container | inside `ExplorerState` / `VisualRecipe`, or wrapped in `VisualIntentDocument` | **no — inherited** |
| `IntentChip` | element of `VisualIntent` | — | no |
| `ReferenceMix` | session or recipe | inside `ExplorerState` / `VisualRecipe` | **optional** (see §6.3) |
| `StructuredPrompt` | derived, cacheable | inside `StructuredPromptDocument` | **no — inherited** |
| `ExplorerState` | session, shareable | local storage / deep link | yes |
| `VisualRecipe` | durable artefact | user library, export file | yes |
| `ReferenceSnapshot` | frozen copy | inside `VisualRecipe.references` | no — inherited from the recipe |

**The one-line summary of the whole model:** *a reference is a bag of typed attributes; an intent is a bag of typed attributes with provenance; a mix is a set of instructions for moving attributes from the first into the second; a prompt is a rendering of the second.*

---

## 2. Shared vocabulary — the category enum

### 2.1 `VISUAL_CATEGORY` — 20 members, in the brief's order

`taxonomy-node.schema.json#/$defs/visual_category`

```
subject        appearance     framing        camera_angle   camera_distance
lens           pose           action         motion         camera_motion
clothing       scene          lighting       composition    color
mood           style          time           weather        props
```

Every one of these appears as: a `TaxonomyNode.category`, a key of `Reference.visual_attributes`, a legal token in `ReferenceMix.use`, a key of `ReferenceMix.dominance`, a conflict-detection domain, a source of a `StructuredPrompt` slot, a member of `ExplorerState.difference.keep`/`.change`, and a member of `filters.require_categories`. **Defined once, referenced everywhere.**

### 2.2 `INTENT_CATEGORY` — 19 members = `VISUAL_CATEGORY` minus `props`

`taxonomy-node.schema.json#/$defs/intent_category`

These 19 are **exactly** the array-valued keys of `VisualIntent`; its 20th key is `confidence`. This is the brief's canonical field list, unchanged.

### 2.3 The `props` asymmetry — the one place the two enums differ

The brief fixes `VisualIntent` at 20 keys (19 arrays + `confidence`) and *separately* lists `Props` among the taxonomy categories. Both statements are honoured, and the seam is made explicit rather than papered over:

- `props` is **first-class** in the taxonomy, in `Reference.visual_attributes`, in `ReferenceMix.use`, in conflict detection, and in the browse UI.
- `props` has **no dedicated `VisualIntent` array**. A props value inherited through a mix is stored in the **`scene`** array carrying `origin_category: "props"`.
- **INV-PROPS-1 (schema):** a chip in `scene` whose `value` is in the `props.*` namespace **MUST** set `origin_category: "props"`.
- `scene` is the **only** array that accepts a foreign namespace. Every other array enforces `value` namespace == array key (INV-INT-2).

```
Reference.visual_attributes.props: ["props.coffee_cup"]
            │  applyMix
            ▼
VisualIntent.scene: [ { value: "props.coffee_cup", origin_category: "props", … } ]
            │  compactVisualIntent
            ▼
VisualIntentCompact.scene: ["props.coffee_cup"]        ← id survives, round-trip is lossless
            │  buildStructuredPrompt  (props → scene slot)
            ▼
StructuredPrompt.scene: [ { text: "a coffee cup on the table", source_category: "props" } ]
```

The UI still renders that chip under a **Props** heading, because `origin_category` says where it came from. Nothing is lost, nothing is invented, and `VisualIntent` still has exactly 20 keys.

### 2.4 `PROMPT_SLOT` — 13 members, in the brief's order

`taxonomy-node.schema.json#/$defs/prompt_slot`

```
subject   appearance   clothing   action   framing   camera   lens
scene     lighting     composition  style  motion    constraints
```

### 2.5 The open-string enums, and why they are open

| Def | Pattern | Reserved values | Why open |
|---|---|---|---|
| `formatter_mode` | `^[a-z0-9]+(_[a-z0-9]+)*$` | `generic` (MVP, must exist), `flux`, `qwen_image`, `sd`, `gpt_image`, `minimax_h3`, `krea` | The brief forbids hardcoded model backends. A new mode is a formatter module plus optional `model_hints` keys — **never a schema change**. |
| `provider_source` | `^[a-z0-9]+(_[a-z0-9]+)*$` | `wikimedia_commons`, `openverse`, `local`, `user_upload`, `manual` | Providers are pluggable (`src/providers/*.js`). Adding one must not require a MAJOR bump. |

`license_id` by contrast is a **closed** enum, because an unrecognised licence string must fail loudly rather than silently fall outside the policy filter:

| Def | Members | Policy class |
|---|---|---|
| `license_id` | `public_domain`, `pdm`, `cc0`, `cc_by`, `user_owned` | **allowed by default** |
| | `cc_by_sa` | **optional / opt-in** |
| | `cc_by_nc`, `cc_by_nc_sa`, `cc_by_nd`, `cc_by_nc_nd`, `proprietary`, `unknown` | **excluded by default** |

`user_owned` exists so a local upload has a truthful licence value instead of being mislabelled `public_domain`. `pdm` exists because Openverse emits the Public Domain Mark distinctly from CC0 (UNVERIFIED as to Openverse's exact current field naming; see [`research/license-safe-media-apis.md`](./research/license-safe-media-apis.md)) — conflating the two would misstate a work's status. Policy detail lives in [`LICENSE_POLICY.md`](./LICENSE_POLICY.md).

---

## 3. Category arity — the conflict-detection table

`taxonomy-node.schema.json#/$defs/category_arity_map` carries this table as a machine-readable `const`.

> **CRITICAL SEMANTICS: arity is a CONFLICT-DETECTION rule, not a cardinality constraint.**
> No schema sets `maxItems` on a `single_dominant` category (**INV-MIX-4**). A conflicting state must be **representable** in order to be **surfaced**. A schema that rejected two camera angles would force the code to drop one silently — exactly what the brief forbids.

| Category | Arity | Why |
|---|---|---|
| `framing` | **single_dominant** | A shot is one shot type. Close-up and wide shot are mutually exclusive framings. |
| `camera_angle` | **single_dominant** | Low angle and high angle cannot both be the viewpoint. |
| `camera_distance` | **single_dominant** | One physical subject-to-camera distance band. *Kept distinct from `framing` deliberately:* a long lens at distance and a wide lens up close produce the same framing with radically different rendering, and the product must transfer either independently. |
| `lens` | **single_dominant** | One optic per shot. |
| `pose` | **single_dominant** | "Same pose as this photo" is a headline use case; a base pose is a single-slot concept. A second base pose from another reference is precisely the conflict the UI must surface. Limb/head descriptors are **modifiers** (§3.2). |
| `time` | **single_dominant** | One shot happens at one time of day. |
| `weather` | **single_dominant** | One *dominant* meteorological condition. Secondary atmospherics (`weather.fog`, `weather.mist`, `weather.haze`) are modifiers, so "rain + fog" never registers as a conflict while "sunny + rain" does. |
| `subject` | multi | Several subjects coexist. |
| `appearance` | multi | Hair, build, age register, skin — all coexist. |
| `action` | multi | "leaning on a railing, looking back" is one shot. |
| `motion` | multi | `motion.hair_movement` + `motion.walking` coexist; `walking` vs `running` do not — handled by `exclusivity_group` (`locomotion`, `speed`). |
| `camera_motion` | multi | **Compound moves are real and are the point** ("dolly in while panning left"). Exclusivity is expressed by `camera_motion.static` declaring `conflicts_with` every other node, not by arity. |
| `clothing` | multi | The canonical multi-valued category. Groups per garment slot: `garment_top`, `garment_bottom`, `garment_outer`, `garment_full_body`, `footwear`, `headwear`. Cross-group incompatibility (a dress vs a top + trousers) uses `conflicts_with`. |
| `scene` | multi | "rooftop" + "city skyline" + "wet asphalt" is legitimate. Groups: `interiority`, `location`. |
| `lighting` | multi | backlit + golden hour + rim coexist; `high_key` vs `low_key` do not. Groups: `key_level`, `light_direction`. |
| `composition` | multi | `leading_lines` + `negative_space` coexist; `rule_of_thirds` vs `centered` do not. Group: `frame_geometry`. |
| `color` | multi | A palette is several values. |
| `mood` | multi | Emotional registers layer. |
| `style` | multi | Aesthetic references layer. |
| `props` | multi | A scene holds many objects. |

7 single-dominant, 13 multi.

### 3.2 The modifier escape — `exclusivity_group`

Every `TaxonomyNode` declares `exclusivity_group: string | null`. This one field is what makes a binary arity rule *correct* rather than merely approximate.

```
              category arity = single_dominant        category arity = multi
            ┌──────────────────────────────────┐   ┌──────────────────────────────┐
 group=null │ MODIFIER — never conflicts       │   │ free value — never conflicts │
            │ camera_angle.dutch_tilt          │   │ lighting.rim_light           │
            │ pose.arms_crossed, weather.fog   │   │ scene.wet_asphalt            │
            ├──────────────────────────────────┤   ├──────────────────────────────┤
 group set  │ DOMINANT — 2 distinct values     │   │ 2 distinct values sharing the│
            │ from 2 refs ⇒ kind:"arity"       │   │ group ⇒ kind:"exclusivity_   │
            │ camera_angle.low_angle           │   │ group"  (lighting.high_key   │
            │ vs camera_angle.high_angle       │   │  vs lighting.low_key)        │
            └──────────────────────────────────┘   └──────────────────────────────┘
```

### 3.3 Conflict kinds

| `kind` | Condition | `group` |
|---|---|---|
| `arity` | single_dominant category, ≥2 **distinct non-modifier** values from ≥2 distinct sources | absent |
| `exclusivity_group` | multi category, ≥2 distinct values sharing one non-null `exclusivity_group` | **required** |
| `explicit` | the taxonomy declares `conflicts_with` between the two ids (may cross categories) | absent |

---

## 4. Category → prompt slot mapping

`taxonomy-node.schema.json#/$defs/category_to_prompt_slot_map` carries this as a `const`. All 20 categories map onto the 13 slots. **`constraints` has no source category.**

| Category | → Slot | | Category | → Slot |
|---|---|---|---|---|
| `subject` | **subject** | | `scene` | **scene** |
| `appearance` | **appearance** | | `weather` | **scene** |
| `clothing` | **clothing** | | `props` | **scene** |
| `pose` | **action** | | `lighting` | **lighting** |
| `action` | **action** | | `time` | **lighting** |
| `framing` | **framing** | | `composition` | **composition** |
| `camera_angle` | **camera** | | `style` | **style** |
| `camera_distance` | **camera** | | `mood` | **style** |
| `camera_motion` | **camera** | | `color` | **style** |
| `lens` | **lens** | | `motion` | **motion** |
| *chip with `negate: true`, any category* | **constraints** | | *composer directives (aspect, quality, technical, safety)* | **constraints** |

```
 20 categories                          13 slots
 ─────────────                          ────────
 subject ──────────────────────────────► subject
 appearance ───────────────────────────► appearance
 clothing ─────────────────────────────► clothing
 pose ──────────┐
 action ────────┴─────────────────────► action           (fan-in 2)
 framing ──────────────────────────────► framing
 camera_angle ──┐
 camera_distance┼─────────────────────► camera           (fan-in 3)
 camera_motion ─┘
 lens ─────────────────────────────────► lens
 scene ─────────┐
 weather ───────┼─────────────────────► scene            (fan-in 3)
 props ─────────┘
 lighting ──────┐
 time ──────────┴─────────────────────► lighting         (fan-in 2)
 composition ──────────────────────────► composition
 style ─────────┐
 mood ──────────┼─────────────────────► style            (fan-in 3)
 color ─────────┘
 motion ───────────────────────────────► motion
 (negate:true, any category) ──────────► constraints      (no source category)
```

Eight slots are 1:1. Five slots take fan-in.

### 4.1 Emit order inside a multi-source slot

`taxonomy-node.schema.json#/$defs/prompt_slot_emit_order_map`:

| Slot | Category order |
|---|---|
| `action` | `pose`, `action` |
| `camera` | `camera_angle`, `camera_distance`, `camera_motion` |
| `scene` | `scene`, `weather`, `props` |
| `lighting` | `time`, `lighting` |
| `style` | `style`, `mood`, `color` |

Within one category: **`order` asc, then `confidence` desc, then `value` asc.** Fully deterministic — this is half of INV-FMT-1.

### 4.2 Mapping rationale

Each of these is a decision, not a default. Recording them here stops a later contributor from "fixing" one.

- **`pose` → `action`.** The brief defines no pose slot. Pose and action both describe subject behaviour and read naturally in sequence: *"standing contrapposto, arms crossed, looking back"*. Emitting pose first is why `action`'s emit order is `pose, action`.
- **`camera_motion` → `camera`, not `motion`.** `camera` is the "everything about the camera" slot; `motion` stays **subject** motion only. A video prompt then cleanly separates *what the person does* from *what the camera does* — which is exactly the seam the brief's use case S2 ("same movement as this video, but the camera work of that video") depends on.
- **`framing` keeps its own slot** even though it is camera-adjacent, because framing is the single most transferable attribute in the product's core use case and must be independently addressable.
- **`time` → `lighting`.** In a generation prompt, time of day *functions as* a light descriptor ("golden hour", "blue hour"). Orphaning it in `scene` would separate it from the light quality it determines. Formatters emit it as the **leading** lighting qualifier — hence `time` before `lighting` in the emit order.
- **`weather` → `scene`.** Weather is an environmental condition of the place: "rainy street".
- **`color` and `mood` → `style`.** The brief defines no colour or mood slot. Palette and emotional register are conventionally emitted with the aesthetic: *"cinematic editorial photograph, quiet and intimate, muted teal palette"*.
- **`props` → `scene`.** Props are the contents of the place.

### 4.3 EXTRACT groups — the eight buttons on a reference card

`taxonomy-node.schema.json#/$defs/extract_group_map`. The brief names eight EXTRACT buttons; each expands to categories:

| Button | Categories |
|---|---|
| `composition` | `composition` |
| `camera` | `camera_angle`, `camera_distance`, `framing`, `lens`, `camera_motion` |
| `pose` | `pose` |
| `clothing` | `clothing` |
| `lighting` | `lighting`, `time` |
| `scene` | `scene`, `weather`, `props` |
| `style` | `style`, `mood`, `color` |
| `motion` | `motion` |

These cover 17 of 20 categories. **`subject`, `appearance` and `action` are deliberately excluded from EXTRACT:** EXTRACT takes *how it looks*, not *who or what is in it*. Those three arrive only via USE-everything (`use: ["*"]`) or manual chip authoring. **The UI expands a group name to categories before storage; `ReferenceMix.use` never holds a group name.**

---

## 5. ID conventions

| Prefix | Object | Notes |
|---|---|---|
| `img_` | `Reference`, `type: "image"` | prefix and `type` MUST agree (INV-REF-1) |
| `vid_` | `Reference`, `type: "video"` | prefix and `type` MUST agree |
| `ref_` | `Reference`, type not yet known | ingest-only; readers MUST accept it, writers SHOULD emit `img_`/`vid_` |
| `mix_` | `ReferenceMix` | |
| `rcp_` | `VisualRecipe` | stable across every content revision |
| `exp_` | `ExplorerState` | persisted or shared session |
| `hst_` | history entry | |
| `chip_` | `IntentChip` instance | optional; required in practice for undo/redo and conflict addressing |
| `cfl_` | `Conflict` record | **deterministic**, see §11.4 |
| `pst_` | preset in `data/presets.json` | |
| `upl_` | local upload handle | an `upl_` handle **never** implies bytes left the device |
| *(none)* | `TaxonomyNode` | dotted namespace, §5.2 |

Slug body after any prefix: `^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$`.

**Minted ids are always lowercase.** Mixed case is accepted only so hand-authored fixtures and the brief's own `img_A` shorthand keep validating. **Ids compare case-SENSITIVELY; never mint two ids differing only in case.**

### 5.1 Deterministic reference minting

```
mintReferenceId(type, source, source_id) =
    ('img' | 'vid' | 'ref') + '_' + slugify(source) + '_' + sha256(source + '|' + source_id).slice(0,8)

  img_wikimedia_commons_9f2ab41c      // the same provider hit dedupes across sessions
  vid_openverse_4d7e0a13
  img_local_7c1f9ab2                  // user uploads: img_local_<uuid8>
```

The point is **cross-session dedupe**: hitting the same Wikimedia work in two different searches on two different days yields the same id, so a mix, a pin and a recipe all agree about identity without a server.

### 5.2 Taxonomy id grammar — exactly two segments

```
<visual_category> . <snake_case_slug>

  framing.medium_shot      lens.35mm_like      camera_motion.dolly_in      props.coffee_cup
```

Pattern (`taxonomy-node.schema.json#/$defs/taxonomy_id`):

```
^(subject|appearance|framing|camera_angle|camera_distance|lens|pose|action|motion|camera_motion
 |clothing|scene|lighting|composition|color|mood|style|time|weather|props)\.[a-z0-9]+(_[a-z0-9]+)*$
```

> **Hierarchy is NEVER encoded in the id. It lives in `parent`.**
>
> `clothing.tops.hoodie` is **INVALID**. The correct model is `clothing.hoodie` with `parent: "clothing.tops"`.
>
> **Rationale:** re-parenting a node must never invalidate a stored intent, mix or recipe. If hierarchy lived in the id, moving `hoodie` from `tops` to `outerwear` would rewrite every saved document that mentions it — silently breaking recipes a user saved months ago. `parent` is an edge; ids are permanent.

Taxonomy ids are **strictly lowercase** — a controlled vocabulary is authored, not minted, and case collisions there would be a real bug rather than a fixture quirk.

---

## 6. `schema_version` policy and migration

### 6.1 The rule

Every **persisted root object** carries `schema_version: "MAJOR.MINOR"` (pattern `^[0-9]+\.[0-9]+$`). Current value everywhere: **`"1.0"`**.

| Change | Bump | Examples |
|---|---|---|
| field removed, renamed or retyped; enum value **removed**; semantics changed | **MAJOR** | dropping `IntentChip.locked`; making `use` a string |
| new optional field; new enum value **appended**; new `$defs` profile | **MINOR** | adding `formatter_mode: "flux"` handling; adding `IntentChip.note` |

**Reader contract:**

1. Readers **MUST** accept any MINOR within the same MAJOR.
2. Readers **MUST** ignore unknown properties arriving from a higher MINOR — an object written by v1.4 must still load in a v1.1 reader, minus the fields it does not know.
3. Readers **MUST** refuse or migrate a different MAJOR. Silently loading a v2 document into a v1 reader is forbidden.

Objects with `additionalProperties: false` that may need vendor growth expose **`x_ext: object`**. Core code never reads it. `VisualIntent` and `StructuredPrompt` do not have one — their key sets are frozen by the brief.

### 6.2 Migration note

Because the two things most likely to change are the **taxonomy** and the **formatters**, and neither is a schema concern, MAJOR bumps should be rare:

- **Adding a taxonomy node** is a data change: `data/taxonomy/*.json`, bump the file's `version` integer. No schema version moves.
- **Renaming a taxonomy node** is a `deprecated: true` + `replaced_by` edit (INV-TAX-6). Readers rewrite on load (`normalizeVisualIntent` step 4 logs each `{from,to}`); no schema version moves and no stored document breaks.
- **Adding a formatter** is a new `formatter_mode` string and a module. `formatter_mode` is an open pattern precisely so this is not a schema event.
- **A real MAJOR bump** ships a `migrate(doc)` per object in `src/core/`, plus a fixture of the old shape in `tests/`. A document whose MAJOR is unknown is surfaced to the user as "saved by a newer version", never silently coerced.

`VisualRecipe.version` is a **content** revision counter (integer ≥ 1), entirely distinct from `schema_version`. Two recipes with the same `id` and `version` MUST be byte-identical in `intent` + `mix` + `references`.

### 6.3 Two deliberate exceptions

**(a) `VisualIntent` and `StructuredPrompt` carry no version of their own.** They are **value objects** with a brief-fixed key count — 20 and 13. Adding `schema_version` would make them 21 and 14 and would break the brief's own field list. They therefore inherit the version of their container (`ExplorerState`, `VisualRecipe`) or are wrapped in a `$defs/document` envelope when persisted or exported standalone:

```
VisualIntentDocument     { schema_version, kind:"visual_intent",   form:"full"|"compact", intent, … }
StructuredPromptDocument { schema_version, kind:"structured_prompt", form, prompt_mode, structured, text, … }
```

**(b) `ReferenceMix.schema_version` is OPTIONAL.** The brief's interop minimum has no version field and MUST keep validating verbatim:

```json
{ "references": [ { "reference_id": "img_A", "use": ["composition", "camera_angle"] } ] }
```

Absent ⇒ assume the reader's current MAJOR.MINOR. Mixes **this product persists** validate against the stricter `reference-mix.schema.json#/$defs/persisted`, which requires `schema_version` and `id`.

### 6.4 Derived caches — recompute, never trust

Some stored fields are recomputable. They are stored as an optimisation and **MUST be recomputed on load**, never trusted from storage:

| Field | Recomputed from |
|---|---|
| `VisualIntent.confidence` | `aggConfidence` over the chips |
| `IntentChip.contested` | open conflicts referencing the chip's value |
| `ReferenceMix.conflicts` | `applyMix` step 6 |
| `TaxonomyNode.children` | every node's `parent` |
| `Reference.search_text` | title, description, tags, aliases |
| `Reference.media.aspect_ratio`, `.orientation` | `width` / `height` |
| `metadata.license_policy_class`, `.requires_attribution`, `.share_alike` | `metadata.license` + operator settings |
| `VisualRecipe.license_summary` | the snapshots' metadata |
| `VisualRecipe.media_health` | `resolveMedia` over the snapshots |

Rationale: a cache that can disagree with its source will eventually disagree with its source. Recomputing on load makes the disagreement impossible instead of merely unlikely.

---

## 7. `VisualIntent`

**Purpose.** The single structured representation that **every** input converts to — typed text, an analysed image, an analysed video, a clicked reference card, a browsed taxonomy tile. Identity pillar 2. It is always user-editable: AI output is a **proposal**, never a commitment.

File: [`schemas/visual-intent.schema.json`](./schemas/visual-intent.schema.json).

### 7.1 Shape

**Exactly 20 keys, ALL REQUIRED, `additionalProperties: false`** (INV-INT-1). Arrays may be empty; `confidence` may be `{}`.

| Key | Type | Required | Meaning |
|---|---|---|---|
| `subject` | `IntentChip[]` | yes | who or what is in frame |
| `appearance` | `IntentChip[]` | yes | hair, build, age register, skin, features |
| `framing` | `IntentChip[]` | yes | shot type (`framing.medium_shot`) |
| `camera_angle` | `IntentChip[]` | yes | viewpoint (`camera_angle.low_angle`) |
| `camera_distance` | `IntentChip[]` | yes | physical distance band — independent of framing |
| `lens` | `IntentChip[]` | yes | optic character; **values are hedged**, §7.5 |
| `pose` | `IntentChip[]` | yes | body configuration |
| `action` | `IntentChip[]` | yes | what the subject is doing |
| `motion` | `IntentChip[]` | yes | **subject** motion |
| `camera_motion` | `IntentChip[]` | yes | **camera** motion; video-authored only (INV-VID-1) |
| `clothing` | `IntentChip[]` | yes | garments, materials, fit |
| `scene` | `IntentChip[]` | yes | place — **also the carrier for `props.*`** (§2.3) |
| `lighting` | `IntentChip[]` | yes | light quality and direction |
| `composition` | `IntentChip[]` | yes | frame geometry |
| `color` | `IntentChip[]` | yes | palette |
| `mood` | `IntentChip[]` | yes | emotional register |
| `style` | `IntentChip[]` | yes | aesthetic |
| `time` | `IntentChip[]` | yes | time of day |
| `weather` | `IntentChip[]` | yes | meteorological condition |
| `confidence` | `{ <intent_category>: number 0..1 }` | yes | **per-category aggregate**, §7.4 |

**Why all 20 are required even when empty.** The shape is then stable: every consumer indexes any category without a null check, diffing two intents is a key-by-key walk with no presence logic, and the UI renders 19 chip rows without asking whether a row exists. Optionality would buy nothing and cost a null check in every module.

### 7.2 The four profiles

| Profile | `$ref` | Element type | Used for |
|---|---|---|---|
| **full** (root) | `visual-intent.schema.json` | `IntentChip` object | canonical in-memory and persisted form |
| **compact** | `#/$defs/compact` | bare taxonomy id **string** | export / interop |
| **ingest** | `#/$defs/ingest` | string **or** chip, any subset of keys | permissive wire shape — **never persisted** |
| **document** | `#/$defs/document` | wraps `full` or `compact` | standalone persistence/export; `form` is the discriminator |

**Losslessness, stated precisely.** Compact is lossless with respect to the **semantic payload** — the exact set of taxonomy ids per category, which is everything a generation prompt depends on — and lossy only with respect to **provenance metadata** (source, `ref_id`, confidence, lock, evidence, alternatives). The round-trip guarantee is:

```
compact → normalizeVisualIntent → compactVisualIntent   ≡   the identical document
```

`compactVisualIntent(full)` = for each category, the unique `chip.value` of chips where `!custom && !negate`. Custom and negated chips are dropped **with a warning** — they have no taxonomy id to carry.

### 7.3 `normalizeVisualIntent` — the ingest contract

```
normalizeVisualIntent(input: Ingest, ctx) -> VisualIntent            // always FULL form
ctx = { taxonomy, default_source = "user", default_ref_id = null, now, locale, keep_confidence? }

1. Fill every missing key of the 20 with []   (confidence with {}).
2. A string element s becomes:
     { value: s, label: taxonomy[s].label ?? humanize(s), source: ctx.default_source,
       confidence: source === "user" ? 1.0 : 0.5, locked: false }
3. An object element is filled in: label from taxonomy; confidence default as (2);
   locked=false, custom=false where absent.
4. Deprecated ids are rewritten to replaced_by; each {from,to} is appended to the rewrites log.
5. Any props.* value found outside `scene` is MOVED into `scene` with origin_category="props".
6. Deduplicate by (target_array, value): keep max confidence, union contributors[],
   OR the locked flags, keep the earliest created_at.
   >>> DUPLICATES ARE AGREEMENT, NEVER CONFLICT. <<<
7. Sort each array by (order asc, confidence desc, value asc)  — stable diffing.
8. Recompute confidence[c] via aggConfidence unless ctx.keep_confidence.

Idempotent : normalize(normalize(x)) deep-equals normalize(x).
Total      : never throws on a valid ingest document. An unknown taxonomy id becomes a
             custom:true chip — a vocabulary gap is a UI affordance, not an error.
```

### 7.4 Confidence — two levels, deliberately

The brief says *"`confidence` maps field → 0..1 (or per-value confidence)"*. Both are provided, at different levels, because they answer different questions:

| Level | Where | Question it answers |
|---|---|---|
| per-**value** | `IntentChip.confidence` | "how sure are we about *this* value?" |
| per-**category** | `VisualIntent.confidence[c]` | "how well is this category characterised **at all**?" — what the UI needs to grey out or flag an entire chip row |

```
aggConfidence(c):
    if any chip in c has locked == true or source == "user"   -> 1.0
    else                                                      -> max(chip.confidence), 3 dp
    if the category array is empty                            -> entry absent (or 0)
```

**Max, not mean.** A category is "known" once one high-confidence value is known. Averaging would punish a rich category that legitimately carries several weak secondary chips — a `lighting` row with `backlit @0.95` plus three tentative modifiers would score lower than a bare `backlit @0.95`, which is the opposite of the truth.

Defaults for a chip that reports no confidence: **`1.0`** for `source: "user"`, **`0.5`** for analyzer/expansion sources.

### 7.5 The lens rule — enforced in three places

> The product never asserts optics it cannot know. A pixel grid does not carry a focal length.

Values are `*_like`; labels and prompt fragments render the hedge.

```
  taxonomy id      lens.35mm_like
  label            "35mm-like perspective"
  prompt_fragment  "35mm-like perspective"
  PromptFragment   { text: "35mm-like perspective", hedged: true }
                                                    └─ INV-LENS-2: mandatory in the lens slot
```

| Where | Rule | Invariant |
|---|---|---|
| `VisualIntent.lens`, `VisualIntentCompact.lens` | a value matching `[0-9]+mm` MUST end `_like`. `lens.35mm` is **invalid**; `lens.35mm_like` is valid. | INV-LENS-1 |
| `TaxonomyNode` with `category == "lens"` | `prompt_fragment` MUST match `(-like\|like a\|likeness\|reminiscent\|approximat\|similar to)`; an id containing `[0-9]+mm` MUST end `_like`. | INV-LENS-1/2 |
| `StructuredPrompt.lens` | every `PromptFragment` MUST have `hedged: true`. | INV-LENS-2 |

Effect-only lens nodes (`lens.shallow_depth_of_field`, `lens.bokeh_heavy`, `lens.anamorphic_flare`) name no focal length and need no `_like` suffix, but their fragments still may not read as EXIF claims.

This same epistemic stance — *never assert what the medium cannot evidence* — is what produces INV-VID-1 and INV-VID-3 in §16.

### 7.6 Worked example (full form, abridged arrays shown in full)

```json
{
  "subject": [
    { "value": "subject.woman", "label": "a woman", "source": "user", "confidence": 1.0, "locked": true }
  ],
  "appearance": [],
  "framing": [
    { "value": "framing.medium_shot", "label": "medium shot", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.88,
      "contributors": ["img_wikimedia_commons_9f2ab41c", "img_openverse_1a2b3c4d"] }
  ],
  "camera_angle": [
    { "value": "camera_angle.low_angle", "label": "low angle", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.9, "contested": true }
  ],
  "camera_distance": [
    { "value": "camera_distance.near", "label": "near", "source": "inferred", "confidence": 0.5,
      "evidence": { "kind": "derived", "note": "framing.medium_shot ⇒ camera_distance.near" } }
  ],
  "lens": [
    { "value": "lens.35mm_like", "label": "35mm-like perspective", "source": "analyzer_image",
      "confidence": 0.61 }
  ],
  "pose": [
    { "value": "pose.contrapposto", "label": "contrapposto stance", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.72 },
    { "value": "pose.arms_crossed", "label": "arms crossed", "source": "user", "confidence": 1.0 }
  ],
  "action": [],
  "motion": [],
  "camera_motion": [],
  "clothing": [
    { "value": "clothing.oversized_hoodie", "label": "oversized hoodie", "source": "reference",
      "ref_id": "img_openverse_1a2b3c4d", "confidence": 0.9 },
    { "value": "clothing.cargo_trousers", "label": "cargo trousers", "source": "reference",
      "ref_id": "img_openverse_1a2b3c4d", "confidence": 0.84 }
  ],
  "scene": [
    { "value": "scene.narrow_alley", "label": "a narrow alley", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.81 },
    { "value": "props.coffee_cup", "label": "a paper coffee cup", "source": "reference",
      "ref_id": "img_openverse_1a2b3c4d", "confidence": 0.58, "origin_category": "props" }
  ],
  "lighting": [
    { "value": "lighting.backlit", "label": "backlit", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.79 }
  ],
  "composition": [
    { "value": "composition.centered", "label": "centered composition", "source": "reference",
      "ref_id": "img_wikimedia_commons_9f2ab41c", "confidence": 0.83, "locked": true }
  ],
  "color": [
    { "value": "color.muted_teal", "label": "muted teal palette", "source": "analyzer_image",
      "confidence": 0.64 }
  ],
  "mood": [],
  "style": [
    { "value": "style.editorial_photography", "label": "editorial photography",
      "source": "preset", "confidence": 0.7 }
  ],
  "time": [
    { "value": "time.blue_hour", "label": "blue hour", "source": "analyzer_image", "confidence": 0.69 }
  ],
  "weather": [
    { "value": "weather.rain", "label": "rain", "source": "analyzer_image", "confidence": 0.55 }
  ],
  "confidence": {
    "subject": 1.0, "framing": 0.88, "camera_angle": 0.9, "camera_distance": 0.5,
    "lens": 0.61, "pose": 1.0, "clothing": 0.9, "scene": 0.81, "lighting": 0.79,
    "composition": 1.0, "color": 0.64, "style": 0.7, "time": 0.69, "weather": 0.55
  }
}
```

Read the `confidence` map against `aggConfidence`: `pose` is `1.0` (not `0.72`) because one of its chips is `source: "user"`; `composition` is `1.0` because its chip is `locked`. Empty categories have no entry.

### 7.7 Validation rules

| Rule | Enforcement |
|---|---|
| exactly the 20 brief keys, all required, no extras | schema (INV-INT-1) |
| non-custom `value` namespace == the array's category; `scene` additionally accepts `props.*` | schema (INV-INT-2) |
| a `props.*` value in `scene` MUST set `origin_category: "props"` | schema (INV-PROPS-1) |
| `source ∈ {reference, mix_resolution}` ⇒ `ref_id` required | schema (INV-INT-3) |
| `source == "inferred"` ⇒ `confidence ≤ 0.5` | schema (INV-INT-4) |
| lens value containing `[0-9]+mm` MUST end `_like` | schema (INV-LENS-1) |
| a `camera_motion` chip may NOT have `source: "analyzer_image"` | schema (INV-VID-1) |
| a `motion` chip with `source: "analyzer_image"` ⇒ `evidence.kind: "implied"` and `confidence ≤ 0.6` | schema (INV-VID-3) |
| `confidence` keys are `intent_category` members only (never `props`) | schema |

---

## 8. `IntentChip` — and why not bare strings

**Purpose.** One value inside one category of a `VisualIntent`, **with everything needed to explain, edit, un-mix and re-source it**.

### 8.1 Why not bare strings

This is the load-bearing decision of the entire data model, so it is argued rather than asserted. `"framing": ["framing.medium_shot"]` is smaller, prettier, and makes the product impossible to build.

| # | Product promise (brief) | What it needs on the value | What a bare string gives you |
|---|---|---|---|
| 1 | **Selective Inheritance** (pillar 4) — "composition from A, clothing from B" | `ref_id` on every value | nothing. "Remove everything B gave me" becomes unimplementable: you cannot tell B's values from A's. |
| 2 | **Conflict surfacing** (pillar 5) — "UI asks which should be dominant" | `source` + `ref_id`, to render two competing values **with their thumbnails side by side** | nothing. You can show two strings; you cannot show where either came from. |
| 3 | **"AI output is a proposal, never a commitment"** | per-chip `confidence`, `locked`, `alternatives` | nothing. Re-running the analyzer either destroys the user's edits or is refused wholesale; there is no per-value granularity to pin. |
| 4 | **Video provenance** ("dolly in from 1.2 s to 3.4 s") | `evidence.t_start_s` / `t_end_s` on the value | nothing. The timespan has nowhere to live, so use case S6 dies. |
| 5 | **The anti-goal** — "must never degrade into pick a few options → get a prompt" | traceable, per-value structure | exactly the prompt builder the brief forbids. A list of strings **is** a dropdown's output. |

There is a sixth, quieter reason: **agreement**. When two references both contribute `framing.medium_shot`, that is *evidence*, not duplication. `contributors: ["img_a", "img_b"]` records it and the UI can say "2 references agree". With bare strings, deduplication silently discards the signal.

The cost is paid once, in `normalizeVisualIntent`, which accepts bare strings on ingest and inflates them. **Strings are a wire format; chips are the model.** The compact profile (§7.2) exists exactly so the cheap shape is still available for interop, with its lossiness stated in writing instead of discovered later.

### 8.2 Fields

Required: `value`, `source`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `value` | `taxonomy_id` \| free text | **yes** | the taxonomy id, or free text when `custom: true` (≤120 chars) |
| `source` | `ChipSource` | **yes** | how this value got here — §8.3 |
| `label` | string | no | display text; falls back to `taxonomy[value].label` |
| `confidence` | 0..1 | no | **per-value** confidence |
| `ref_id` | `reference_id` | conditional | **required** when `source ∈ {reference, mix_resolution}` |
| `locked` | boolean (`false`) | no | user pin: `applyMix`, re-analysis and expansion may not touch it |
| `id` | `chip_id` (`chip_…`) | no | stable instance id; needed for undo/redo and conflict addressing |
| `origin_category` | `visual_category` | no | the category the value *came from*. Only legal use today: `props.*` stored in `scene` |
| `custom` | boolean (`false`) | no | `value` is free text outside the taxonomy |
| `negate` | boolean (`false`) | no | routes to the `constraints` slot regardless of category |
| `order` | integer | no | explicit ordering; used for `camera_motion` sequences |
| `weight` | 0..1 (`1`) | no | emphasis hint. **Never affects conflict detection.** |
| `evidence` | `Evidence` | no | why the analyzer believes this — §8.4 |
| `alternatives` | `[{value,label,confidence}]` | no | runner-ups; the "did you mean" swap menu |
| `contributors` | `reference_id[]` | no | every reference that supplied this **same** value = agreement |
| `contested` | boolean | no | **derived cache** — true while an open conflict names this value |
| `note` | string | no | user annotation |
| `created_at`, `updated_at` | ISO datetime | no | |
| `x_ext` | object | no | vendor extension; core never reads it |

### 8.3 `ChipSource` — 10 values

| Value | Meaning | Precedence note |
|---|---|---|
| `user` | typed, picked from browse, or hand-edited | **highest**; never overwritten by a mix |
| `analyzer_image` | image analyzer over a still | forbidden in `camera_motion`; capped in `motion` |
| `analyzer_video` | video analyzer | the **only** source allowed to author `camera_motion`; the only one that may carry a timespan |
| `analyzer_text` | parsing/expanding free text into taxonomy ids | |
| `reference` | inherited from a `Reference.visual_attributes` via a mix | `ref_id` required |
| `preset` | from `data/presets.json` | |
| `query_expansion` | added by an alias/`related` hop | always low confidence, one-click removable |
| `recipe` | restored from a `VisualRecipe` | |
| `mix_resolution` | materialised by a human resolving a conflict | `ref_id` = the winner |
| `inferred` | deterministic rule, **no model** (e.g. `framing.close_up` ⇒ `camera_distance.near`) | `confidence ≤ 0.5` |

`reference` vs `analyzer_image` is a real distinction, not a synonym: `reference` means *inherited from attributes already stored on a reference*; `analyzer_image` means *produced by running the analyzer on media right now*. Re-analysis may replace the second and must not touch the first.

### 8.4 `Evidence`

| Field | Type | Meaning |
|---|---|---|
| `kind` | `observed` \| `implied` \| `stated` \| `derived` | how the value was arrived at |
| `bbox` | `[x, y, w, h]` normalised 0..1 | where in the frame |
| `t_start_s`, `t_end_s` | number | **video only**; `t_end_s` requires `t_start_s` |
| `frame_index` | integer | |
| `shot_index` | integer | indexes `Reference.media.shot_boundaries` |
| `keyframe_url` | URL | the still that shows it |
| `detector` | string | **adapter instance id** (e.g. `analyzer-adapter:local@2`), never a hardcoded model name (INV-AI-2) |
| `note` | string | |

### 8.5 Worked example — a video-derived chip with a timespan

```json
{
  "id": "chip_7f31a0",
  "value": "camera_motion.dolly_in",
  "label": "camera dollies in",
  "source": "analyzer_video",
  "confidence": 0.82,
  "ref_id": "vid_openverse_4d7e0a13",
  "order": 0,
  "evidence": {
    "kind": "observed",
    "t_start_s": 1.2,
    "t_end_s": 3.4,
    "shot_index": 0,
    "detector": "analyzer-adapter:local@2"
  },
  "alternatives": [
    { "value": "camera_motion.push_in", "label": "push in", "confidence": 0.44 }
  ]
}
```

No image chip can carry `t_start_s`. That single fact is the difference between a still-image tool and this one.

---

## 9. `Reference`

**Purpose.** Identity pillar 3: **a reference is not a picture; it is a bag of typed visual attributes** plus the licence provenance that makes it usable. The media itself is always remote — the repository stores URLs, never bytes.

File: [`schemas/reference.schema.json`](./schemas/reference.schema.json).

### 9.1 Fields

Required: `schema_version`, `id`, `type`, `status`, `visual_attributes`, `metadata`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `schema_version` | `"MAJOR.MINOR"` | **yes** | `"1.0"` |
| `id` | `reference_id` | **yes** | `img_` / `vid_` / `ref_`; prefix agrees with `type` (INV-REF-1) |
| `type` | `image` \| `video` | **yes** | |
| `status` | `candidate` \| `approved` \| `rejected` \| `license_review` | **yes** | the License Guard state, §10.2 |
| `visual_attributes` | `{ <visual_category>: taxonomy_id[] }` | **yes** | **all 20 categories legal.** Bare taxonomy ids — exactly the brief's shape |
| `attribute_meta` | `{ <taxonomy_id>: {confidence, source, evidence, verified_by_user, created_at} }` | no | analyzer detail **sidecar**, keyed by taxonomy id |
| `metadata` | `ReferenceMetadata` | **yes** | §10 |
| `license_guard` | `{license_check, source_validation, attribution_metadata, approval}` | no | four-stage audit trail, §10.2 |
| `media` | object | no | `width, height, aspect_ratio*, orientation*, mime_type, bytes` + video-only `duration_s, fps, frame_count, has_audio, keyframes, shot_boundaries` |
| `embeddings` | `{ "<family>_<size>@<rev>": EmbeddingRecord }` | no | model-keyed, §9.3 |
| `title`, `description` | string | no | |
| `tags`, `aliases` | string[] | no | keyword-search fuel |
| `search_text` | string | no | **derived cache** of title+description+tags+aliases |
| `collections` | string[] | no | user grouping |
| `privacy` | `{local_only, may_transmit_external, disclosed_at}` | no | local-first guarantees; a `local_only` reference MUST be refused by every remote adapter |
| `created_at`, `updated_at`, `analyzed_at` | ISO datetime | no | |
| `analyzer_version` | string | no | adapter instance id |
| `x_ext` | object | no | |

`*` = derived cache (§6.4).

### 9.2 Bare ids in `visual_attributes`, detail in the sidecar

`visual_attributes` holds **bare taxonomy ids** — precisely the brief's shape — so the interop contract stays minimal and a reference exported to any consumer is trivially readable:

```json
"visual_attributes": {
  "composition": ["composition.centered", "composition.leading_lines"],
  "camera_angle": ["camera_angle.low_angle"],
  "clothing": ["clothing.oversized_hoodie"]
}
```

Everything an analyzer knows *about* one of those ids lives in `attribute_meta[id]`:

```json
"attribute_meta": {
  "camera_angle.low_angle": {
    "confidence": 0.9, "source": "analyzer_image", "verified_by_user": true,
    "evidence": { "kind": "observed", "detector": "analyzer-adapter:local@2" }
  }
}
```

`applyMix` reads `attribute_meta[id].confidence` and **defaults to `0.7`** when it is absent — so a hand-authored reference with no analyzer metadata still contributes usable chips.

### 9.3 `EmbeddingRecord` — model-keyed on purpose

| Field | Type | Meaning |
|---|---|---|
| `model_id` | string | **opaque.** Core code never branches on it (INV-AI-2) |
| `adapter` | string | embedding-adapter instance id |
| `dim` | integer | vector dimensionality |
| `modality` | `image` \| `video` \| `text` \| `multimodal` | |
| `vector` \| `vector_ref` | number[] \| URI | **exactly one** (`oneOf`, INV-REF-3) |
| `normalized` | boolean (`true`) | |
| `quantization` | `f32` \| `f16` \| `int8` \| `binary` | |
| `pooling` | string | |
| `created_at` | ISO datetime | |

Keying `embeddings` by `"<family>_<size>@<rev>"` lets several embedding models coexist and be swapped **with no migration**: retrieval queries the key named by the active embedding-adapter and silently skips references that lack it. Swapping a model becomes a backfill, not a schema event — which is the brief's "can the AI model be swapped later?" answered structurally. Prefer `vector_ref` into a sidecar index outside the repository; inline floats are for fixtures.

### 9.4 No binaries — schema-enforced

`media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` are declared **`false`** in `properties`. A document carrying any of them is **INVALID** (INV-REF-2).

This is the brief's "do NOT store media binaries in the repo" turned from a policy into a check a CI job can run. It is enforced in the schema rather than in a linter because the failure mode — one contributor inlining a base64 thumbnail "just for the fixture" — is exactly the kind of thing a linter gets exempted for.

### 9.5 Worked example

```json
{
  "schema_version": "1.0",
  "id": "img_wikimedia_commons_9f2ab41c",
  "type": "image",
  "status": "approved",
  "title": "Rainy alley at blue hour",
  "visual_attributes": {
    "subject": ["subject.woman"],
    "framing": ["framing.medium_shot"],
    "camera_angle": ["camera_angle.low_angle"],
    "camera_distance": ["camera_distance.near"],
    "lens": ["lens.35mm_like"],
    "pose": ["pose.contrapposto", "pose.arms_crossed"],
    "composition": ["composition.centered", "composition.leading_lines"],
    "lighting": ["lighting.backlit", "lighting.rim_light"],
    "scene": ["scene.narrow_alley", "scene.wet_asphalt"],
    "color": ["color.muted_teal"],
    "mood": ["mood.quiet"],
    "style": ["style.editorial_photography"],
    "time": ["time.blue_hour"],
    "weather": ["weather.rain"],
    "props": ["props.umbrella"]
  },
  "attribute_meta": {
    "camera_angle.low_angle": { "confidence": 0.9, "source": "analyzer_image", "verified_by_user": true },
    "composition.centered":   { "confidence": 0.83, "source": "analyzer_image" },
    "props.umbrella":         { "confidence": 0.61, "source": "analyzer_image" }
  },
  "metadata": {
    "source": "wikimedia_commons",
    "source_id": "File:Rainy_alley_blue_hour.jpg",
    "creator": "A. Photographer",
    "license": "cc_by",
    "license_url": "https://creativecommons.org/licenses/by/4.0/",
    "license_version": "4.0",
    "source_url": "https://commons.wikimedia.org/wiki/File:Rainy_alley_blue_hour.jpg",
    "media_url": "https://upload.wikimedia.org/.../Rainy_alley_blue_hour.jpg",
    "thumbnail_url": "https://upload.wikimedia.org/.../320px-Rainy_alley_blue_hour.jpg",
    "attribution": "Rainy alley at blue hour by A. Photographer, CC BY 4.0, via Wikimedia Commons",
    "retrieved_at": "2026-09-09T10:14:00Z",
    "license_policy_class": "allowed",
    "requires_attribution": true,
    "share_alike": false
  },
  "license_guard": {
    "license_check":        { "status": "pass", "at": "2026-09-09T10:14:02Z", "actor": "system:license-guard" },
    "source_validation":    { "status": "pass", "at": "2026-09-09T10:14:03Z", "actor": "system:license-guard" },
    "attribution_metadata": { "status": "pass", "at": "2026-09-09T10:14:03Z", "actor": "system:license-guard" },
    "approval":             { "status": "pass", "at": "2026-09-09T10:15:40Z", "actor": "user:local" }
  },
  "media": { "width": 2400, "height": 1600, "aspect_ratio": 1.5, "orientation": "landscape", "mime_type": "image/jpeg" },
  "embeddings": {
    "vlm_2b@r3": { "model_id": "vlm-2b", "adapter": "embedding-adapter:local@1", "dim": 1024,
                   "modality": "multimodal", "vector_ref": "index://local/vlm_2b_r3/img_wikimedia_commons_9f2ab41c",
                   "normalized": true, "quantization": "f16" }
  },
  "tags": ["alley", "rain", "night", "editorial"],
  "privacy": { "local_only": false, "may_transmit_external": false }
}
```

### 9.6 Validation rules

| Rule | Enforcement |
|---|---|
| **INV-REF-1** `img_*` ⇒ `type: "image"`, `vid_*` ⇒ `type: "video"` | schema |
| **INV-REF-2** no `media_blob` / `media_base64` / `media_bytes` / `data_uri` / `binary` | schema |
| **INV-REF-3** `EmbeddingRecord` has exactly one of `vector` / `vector_ref` | schema |
| **INV-VID-2** `type: "image"` ⇒ `visual_attributes.camera_motion` has `maxItems: 0`, and `duration_s` / `fps` / `frame_count` / `has_audio` / `keyframes` / `shot_boundaries` are **forbidden** | schema |
| **INV-VID-4** `type: "video"` with a `media` block ⇒ `duration_s` **required** (so timespan evidence is checkable) | schema |
| **INV-LIC-1** `status: "approved"` ⇒ non-empty `metadata.attribution` and `license ∉ {unknown, proprietary}` | schema |
| **INV-LIC-2** `status: "approved"` with `license ∈ {cc_by, cc_by_sa}` ⇒ non-empty `creator` **and** `license_url` | schema |
| **INV-LIC-3** `approved` also requires `license_check.status == "pass"` and `source_validation.status == "pass"` | **code** |
| `creator` may be `null` only for `public_domain` / `pdm` / `cc0` / `user_owned` | schema |

**Unverified licence can never reach `approved`** — the brief's words, made checkable. The default search filter is `status: ["approved"]`, so an unverified reference never reaches a normal result set in the first place.

---

## 10. `ReferenceMetadata`, the License Guard, and snapshots

**Purpose.** Everything about a reference that is **provenance** rather than **appearance**. It is separated from `visual_attributes` because the two have opposite lifetimes: appearance is re-derivable by re-running an analyzer; provenance is not re-derivable at all and must survive URL rot, export and years of storage.

### 10.1 Fields

Required: `source`, `source_id`, `license`, `source_url`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `source` | `provider_source` | **yes** | `wikimedia_commons`, `openverse`, `local`, … |
| `source_id` | string | **yes** | the provider's own id — **half of durable identity** |
| `license` | `license_id` | **yes** | closed enum, §2.5 |
| `source_url` | URL | **yes** | the human-visitable page at the provider |
| `creator` | string \| null | no | null only for `public_domain` / `pdm` / `cc0` / `user_owned` |
| `license_url` | URL | no | required for `approved` + `cc_by`/`cc_by_sa` |
| `license_version` | string | no | e.g. `"4.0"` |
| `media_url` | URL | no | **a cache hint. Expected to rot.** |
| `thumbnail_url` | URL | no | |
| `attribution` | string | no | **stored TEXT**, never a computed link — §10.4 R4 |
| `credit_line` | string | no | the provider's preferred wording, when it supplies one |
| `retrieved_at` | ISO datetime | no | |
| `title` | string | no | the provider's title |
| `license_policy_class` | `allowed` \| `optional` \| `excluded` | no | **derived cache** from `license` + operator settings |
| `requires_attribution` | boolean | no | **derived cache** |
| `share_alike` | boolean | no | **derived cache** |

### 10.2 The License Guard pipeline

The brief's four stages, stored as an audit trail. Each stage is `{status: pending|pass|fail|manual_review, at, actor, note}`. Stages run in order; a later stage may not pass while an earlier one has not.

```
  candidate ──► LICENSE CHECK ──► SOURCE VALIDATION ──► ATTRIBUTION METADATA ──► APPROVAL ──► approved
                    │                   │                       │                    │
                    │ fail              │ fail                  │ fail               │ manual_review
                    ▼                   ▼                       ▼                    ▼
                 rejected            rejected              license_review       license_review
```

Full policy, including the operator settings that move `cc_by_sa` between classes, is in [`LICENSE_POLICY.md`](./LICENSE_POLICY.md).

### 10.3 Worked example and validation rules

A public-domain Wikimedia record — the case that exercises the nullable `creator` and shows the derived caches computed:

```json
{
  "source": "wikimedia_commons",
  "source_id": "File:Alley_1904_glass_plate.jpg",
  "creator": null,
  "license": "public_domain",
  "license_url": "https://creativecommons.org/publicdomain/mark/1.0/",
  "source_url": "https://commons.wikimedia.org/wiki/File:Alley_1904_glass_plate.jpg",
  "media_url": "https://upload.wikimedia.org/.../Alley_1904_glass_plate.jpg",
  "thumbnail_url": "https://upload.wikimedia.org/.../320px-Alley_1904_glass_plate.jpg",
  "attribution": "Alley, 1904 (glass plate) — public domain, via Wikimedia Commons",
  "credit_line": "Unknown photographer, 1904. Public domain.",
  "retrieved_at": "2026-09-09T10:12:00Z",
  "title": "Alley, 1904",
  "license_policy_class": "allowed",
  "requires_attribution": false,
  "share_alike": false
}
```

`creator: null` is legal **only** because `license` is `public_domain`; the same record with `license: "cc_by"` on an `approved` reference is rejected by INV-LIC-2. `requires_attribution: false` is a derived cache — the product still stores and renders `attribution`, because crediting a source is a courtesy the licence does not have to compel.

| Rule | Enforcement |
|---|---|
| `source`, `source_id`, `license`, `source_url` are required | schema |
| `license` is a member of the closed `license_id` enum — an unrecognised string fails loudly | schema |
| `creator: null` permitted only for `public_domain` / `pdm` / `cc0` / `user_owned` | schema |
| `approved` ⇒ non-empty `attribution`, `license ∉ {unknown, proprietary}` (INV-LIC-1) | schema |
| `approved` + `cc_by` / `cc_by_sa` ⇒ non-empty `creator` **and** `license_url` (INV-LIC-2) | schema |
| `license_policy_class`, `requires_attribution`, `share_alike` are **derived caches** — recomputed on load from `license` + operator settings, never trusted from storage | code (§6.4) |
| `attribution` is stored text, never a computed link | code (§10.4 R4) |
| the stage order `license_check → source_validation → attribution_metadata → approval` is not skippable | code (INV-LIC-3) |

### 10.4 `ReferenceSnapshot` and the media-rot policy

`reference.schema.json#/$defs/snapshot` is the **frozen** copy embedded in a `VisualRecipe`:

```
{ id, type, status, title, visual_attributes, metadata,
  media { width, height, duration_s, fps },
  snapshot_at, media_state: unchecked|ok|moved|gone, media_checked_at, resolved_media_url }
```

It carries **no embeddings and no binaries**. Five rules govern URL rot:

| # | Rule | Consequence |
|---|---|---|
| **R1** | **Identity is not a URL.** Durable identity is `(metadata.source, metadata.source_id)` plus `source_url`. `media_url` is a cache hint. | A moved file is not a lost work. |
| **R2** | **A rotted recipe still works.** Intent, mix, conflict resolutions and every taxonomy id are pixel-free, so a recipe with 100 % dead media produces the *same prompt*. | Media loss degrades the **card**, never the **recipe**. |
| **R3** | **Resolution order.** `resolveMedia(snapshot)`: (1) HEAD `media_url` → `ok`; (2) on failure `provider(source).getMetadata(source_id)` → store `resolved_media_url`, `moved`; (3) on failure `gone` — **and keep the record**. | Never delete on a 404. |
| **R4** | **Attribution survives.** `metadata.attribution` is stored text, never a computed link. | A `gone` snapshot still renders its full credit line; `license_summary.attribution_block` is built from those stored strings. |
| **R5** | **No rehydration by copying bytes.** Rot is never fixed by embedding the image. Remedies: re-resolve, open `source_url`, or replace the reference — which is a recipe **edit** and bumps `version`. | INV-REF-2 is never traded away for convenience. |

---

## 11. `ReferenceMix`

**Purpose.** Identity pillar 5, and the answer to the brief's question 4 (*"what data structure lets you take only SOME attributes from one reference?"*). A mix is a set of **instructions**: which references contribute, which categories each contributes, and what to do when two of them disagree.

File: [`schemas/reference-mix.schema.json`](./schemas/reference-mix.schema.json).

### 11.1 The interop minimum validates verbatim

**Only `references` is required at the root.** The brief's literal example — including its hand-written `img_A` — validates unchanged (INV-MIX-0):

```json
{ "references": [ { "reference_id": "img_A", "use": ["composition", "camera_angle"] } ] }
```

Every extension below is optional with a defined default. This is a hard constraint on the schema, verified by a fixture in `tests/`.

### 11.2 Root fields

| Field | Type | Req | Default | Meaning |
|---|---|---|---|---|
| `references` | `MixEntry[]` | **yes** | — | the contributing references |
| `schema_version` | `"MAJOR.MINOR"` | no | reader's current | **optional by design**, §6.3(b) |
| `id` | `mix_id` | no | — | required by `#/$defs/persisted` |
| `name`, `description` | string | no | — | |
| `conflicts` | `Conflict[]` | no | `[]` | **derived cache** — recompute via `applyMix` |
| `dominance` | `{ <visual_category>: reference_id }` | no | `{}` | remembered answers to "which should be dominant?" |
| `resolution_policy` | object | no | see below | how unresolved conflicts behave |
| `created_at`, `updated_at`, `x_ext` | | no | | |

`resolution_policy` = `{ auto_resolve: false, default_strategy: "ask", on_unresolved: "block" | "highest_priority" | "drop" }`, defaulting to `auto_resolve: false` and `on_unresolved: "block"`.

### 11.3 `MixEntry`

Required: `reference_id`, `use`.

| Field | Type | Req | Default | Meaning |
|---|---|---|---|---|
| `reference_id` | `reference_id` | **yes** | — | **unique across entries** (INV-MIX-1) |
| `use` | `(visual_category \| "*")[]` | **yes** | — | which categories this reference contributes. `"*"` = every category it actually has |
| `weight` | 0..1 | no | `1` | multiplies contributed chip confidence. **Soft. Never auto-resolves anything.** |
| `priority` | int 0..1000 | no | `0` | hard ordering; ties break on array position |
| `pinned` | boolean | no | `false` | survives searches, mode switches and result replacement |
| `exclude` | `taxonomy_id[]` | no | `[]` | *"take this outfit but NOT the hat"* |
| `only` | `taxonomy_id[]` | no | `[]` | allow-list, applied **before** `exclude` |
| `role` | string | no | — | free label: `"composition anchor"`, `"outfit"`, `"camera work"` |
| `note`, `added_at` | | no | | |

`use` never holds an EXTRACT **group** name — the UI expands groups to categories before storage (§4.3). `weight` and `priority` are deliberately different: `weight` is an emphasis dial that survives into confidence; `priority` is an ordering that only matters when a human has opted into an automatic resolution strategy.

### 11.4 `Conflict` and `Resolution`

Required: `category`, `candidates` (minItems 2).

| Field | Type | Meaning |
|---|---|---|
| `id` | `cfl_…` | **deterministic**: `cfl_ + sha1(category + "\|" + (group ?? "") + "\|" + sorted(values).join(",")).slice(0,12)` |
| `category` | `visual_category` | |
| `kind` | `arity` \| `exclusivity_group` \| `explicit` | §3.3 |
| `group` | string \| null | **required** when `kind == "exclusivity_group"` |
| `candidates` | `[{reference_id?, value, label, confidence, weight, priority, from_user}]` | **`reference_id` absent ⇒ the competing value came from the user's own base intent.** `from_user` candidates are pre-selected in the UI and can only lose by an explicit click |
| `status` | `open` \| `resolved` \| `ignored` | `ignored` = an explicit human decision to let both coexist |
| `resolution` | `Resolution` | **required when `status == "resolved"`** (INV-MIX-3) |
| `detected_at` | ISO datetime | |

`Resolution` = `{winner_reference_id?, winner_value, strategy: user|priority|weight|first|last|keep_both, disposition: winner_only|keep_all, resolved_by, resolved_at, note}`. `winner_value` is required unless `strategy == "keep_both"`. **`user` is the only strategy reachable while `auto_resolve == false`** — i.e. the only one reachable by default.

**Why the conflict id is deterministic.** A conflict is recomputed on every load and after every edit (§6.4). If ids were random, a user's resolution would be orphaned by the next recomputation and the UI would re-ask a question already answered. Hashing the *content* of the disagreement means the same disagreement always gets the same id, so `status: "resolved"` sticks.

### 11.5 `applyMix` — the algorithm

```
applyMix(mix, referencesById, base_intent, taxonomy) -> { intent, conflicts }

1. intent := deep copy of base_intent.
   Chips with source=="user" OR locked==true are IMMOVABLE: the mix may add alongside
   them and may raise a conflict against them, but never removes or rewrites them.
2. Process entries in (priority DESC, array position ASC).
3. Expand `use`: "*" -> every category present in that reference's visual_attributes.
4. For each expanded category c, each taxonomy id v in reference.visual_attributes[c],
   minus `exclude`, intersected with `only` when `only` is non-empty:
       chip = { value: v,
                label: taxonomy[v].label,
                source: "reference",
                ref_id: entry.reference_id,
                confidence: clamp01((attribute_meta[v].confidence ?? 0.7) * entry.weight),
                origin_category: c }
   props.* chips are written into `scene` with origin_category = "props".
5. Deduplicate by (target_array, value): AGREEMENT — keep max confidence, union contributors[].
6. Detect conflicts (§3.3). Append to conflicts[]; set contested=true on every participant.
   >>> NOTHING IS DELETED AND NOTHING IS AUTO-PICKED. <<<
7. Recompute intent.confidence via aggConfidence.

Pure and deterministic: the same inputs produce the same intent and the same conflict ids.
```

`dominance` is consulted **first**: a category with a dominance entry resolves to that reference and produces no open conflict. That is how "which should be dominant?" is *remembered* instead of re-asked on every edit.

### 11.6 Conflict doctrine — non-negotiable

```
   two references disagree in one category
                  │
                  ▼
        ┌───────────────────┐      dominance[category] set?  ──yes──►  resolved silently, no prompt
        │  detect conflict  │
        └─────────┬─────────┘      no
                  ▼
        both values REMAIN in the intent, contested:true
                  │
                  ▼
        formatPrompt reports blocked:[{slot, category, reason:"unresolved_conflict", conflict_id}]
                  │
                  ▼
        the UI shows an unresolved DECISION — not an error, not a silent omission
                  │
                  ▼
        a human picks  ──►  Resolution{strategy:"user"}  ──►  chip source becomes "mix_resolution"
```

`auto_resolve` defaults to `false`; `on_unresolved` defaults to `"block"`. `"highest_priority"` and `"drop"` are explicit user opt-ins and **MUST be visibly indicated in the UI**. This is the brief's "detected and surfaced, never auto-resolved and never silently dropped", expressed as defaults rather than as a comment.

### 11.7 Worked example — "same composition as this photo, but the outfit from that one"

```json
{
  "schema_version": "1.0",
  "id": "mix_alley1",
  "name": "Alley composition + streetwear outfit",
  "references": [
    { "reference_id": "img_wikimedia_commons_9f2ab41c",
      "use": ["composition", "framing", "camera_angle", "lighting"],
      "priority": 10, "pinned": true, "role": "composition anchor" },
    { "reference_id": "img_openverse_1a2b3c4d",
      "use": ["clothing"],
      "exclude": ["clothing.beanie"], "role": "outfit" }
  ],
  "dominance": { "framing": "img_wikimedia_commons_9f2ab41c" },
  "resolution_policy": { "auto_resolve": false, "default_strategy": "ask", "on_unresolved": "block" },
  "conflicts": [
    { "id": "cfl_ab12cd34ef56",
      "category": "camera_angle",
      "kind": "arity",
      "status": "open",
      "detected_at": "2026-09-09T10:22:11Z",
      "candidates": [
        { "reference_id": "img_wikimedia_commons_9f2ab41c", "value": "camera_angle.low_angle",
          "label": "low angle", "confidence": 0.9, "priority": 10 },
        { "reference_id": "img_openverse_1a2b3c4d", "value": "camera_angle.high_angle",
          "label": "high angle", "confidence": 0.8, "priority": 0 }
      ] }
  ]
}
```

Note what is **not** here: the higher-priority entry did not win. `priority: 10` is recorded on the candidate for the UI to display, and it would decide the outcome only if a human opted into `on_unresolved: "highest_priority"`.

### 11.8 Validation rules

| Rule | Enforcement |
|---|---|
| **INV-MIX-0** the brief's interop minimum validates verbatim (only `references` required) | schema |
| **INV-MIX-1** `reference_id` unique across entries | code |
| **INV-MIX-2** conflicts surfaced, never auto-resolved, never silently dropped; `auto_resolve` default `false`, `on_unresolved` default `"block"` | schema defaults + code |
| **INV-MIX-3** `status: "resolved"` ⇒ `resolution` present | schema |
| **INV-MIX-4** no `maxItems` on any single_dominant category anywhere — a conflict must be representable | schema (by absence) |
| `kind == "exclusivity_group"` ⇒ `group` present | schema |
| `use` items are `visual_category` members or `"*"` — never an EXTRACT group name | schema |

---

## 12. `StructuredPrompt`

**Purpose.** The intermediate between intent and text. Thirteen slots, exactly as the brief lists them. It exists so that **the prompt engine is decoupled from both the UI and the search layer** (a hard prohibition in the brief): a formatter reads only this object, and adding a model backend never touches the intent model.

File: [`schemas/structured-prompt.schema.json`](./schemas/structured-prompt.schema.json).

### 12.1 Shape

**Exactly 13 slots, ALL REQUIRED, `additionalProperties: false`.** A value object — no `schema_version`; persist or export via `#/$defs/document`.

| Slot | Fed by | Item type |
|---|---|---|
| `subject` | `subject` | `PromptFragment` |
| `appearance` | `appearance` | `PromptFragment` |
| `clothing` | `clothing` | `PromptFragment` |
| `action` | `pose`, `action` | `PromptFragment` |
| `framing` | `framing` | `PromptFragment` |
| `camera` | `camera_angle`, `camera_distance`, `camera_motion` | `PromptFragment` |
| `lens` | `lens` | `PromptFragment` — **all `hedged: true`** |
| `scene` | `scene`, `weather`, `props` | `PromptFragment` |
| `lighting` | `time`, `lighting` | `PromptFragment` |
| `composition` | `composition` | `PromptFragment` |
| `style` | `style`, `mood`, `color` | `PromptFragment` |
| `motion` | `motion` | `PromptFragment` |
| `constraints` | negated chips (any category) + composer directives | **`ConstraintFragment`** |

`#/$defs/compact` has the same 13 keys with bare strings as items. Mixed arrays are legal on ingest; `buildStructuredPrompt` always emits the full form.

### 12.2 `PromptFragment` and `ConstraintFragment`

| Field | Type | Req | Meaning |
|---|---|---|---|
| `text` | string | **yes** | the exact words the formatter will emit |
| `source_category` | `visual_category` | no | which category produced it — drives emit order and the "why is this here?" tooltip |
| `value` | `taxonomy_id` | no | the chip's value |
| `ref_id` | `reference_id` | no | which reference contributed it |
| `chip_id` | `chip_id` | no | which chip |
| `confidence` | 0..1 | no | carried through from the chip |
| `weight` | 0..1 (`1`) | no | emphasis |
| `order` | integer | no | |
| `hedged` | boolean | no | true when the text is epistemically hedged. **Mandatory `true` in `lens`** (INV-LENS-2) |

`ConstraintFragment` = `{text, kind: negative|technical|aspect|quality|safety, source_category?, value?, ref_id?}`.

**Traceability is the whole point of the fragment object.** It answers *"why is this word in my prompt?"* and lets the user delete exactly one contribution of one reference without touching anything else. A slot of bare strings would make the composer a text box again.

### 12.3 `buildStructuredPrompt`

```
buildStructuredPrompt(intent, taxonomy, mix?) -> { prompt, blocked }

1. Route every chip by CATEGORY_TO_PROMPT_SLOT (§4).
2. OVERRIDE: any chip with negate == true routes to `constraints` regardless of category,
   emitting taxonomy[value].negative_fragment ?? ("no " + fragment), kind = "negative".
3. Fragment text =  taxonomy[value].model_hints[mode]
                 ?? taxonomy[value].prompt_fragment
                 ?? taxonomy[value].label
                 ?? humanize(value)              // a custom chip emits its label verbatim
4. Order by PROMPT_SLOT_EMIT_ORDER, then order / confidence / value.
5. A category with an OPEN conflict is NOT emitted while on_unresolved == "block";
   it is reported in blocked[] instead. Nothing auto-picked, nothing silently dropped.
6. Media downgrade (INV-FMT-2): for a still-image target mode, camera_motion fragments are
   dropped from `camera` with a warning; motion fragments survive in implied-motion phrasing.
```

`BlockedSlot` = `{slot, category, reason: unresolved_conflict|missing_taxonomy|policy, conflict_id?, message?}`. The UI shows these as an **unresolved decision** — never as an error, never as a silent omission.

### 12.4 `formatPrompt`

```
formatPrompt(structured_prompt, mode, options)
  -> { text, negative_text?, blocked[], warnings[], slot_order[] }

generic slot order:
  subject, appearance, clothing, action, motion, scene, lighting,
  composition, framing, camera, lens, style, constraints
```

| Invariant | Statement |
|---|---|
| **INV-FMT-1** | **Pure.** The same `StructuredPrompt` + mode + taxonomy version produces **byte-identical** text. |
| **INV-FMT-2** | A still-image mode drops `camera_motion`-derived fragments, with a warning. |
| **INV-FMT-3** | The formatter **never invents** a value not present in the `StructuredPrompt`. |

INV-FMT-3 is what stops a formatter from quietly becoming a second, hidden prompt engine — "helpfully" appending `"8k, masterpiece, best quality"` is exactly the drift the brief forbids. Quality directives, if a user wants them, are `ConstraintFragment`s with `kind: "quality"` and are therefore visible, editable and deletable.

### 12.5 Worked example

```json
{
  "subject":     [ { "text": "a woman", "source_category": "subject", "value": "subject.woman", "confidence": 1.0 } ],
  "appearance":  [],
  "clothing":    [ { "text": "an oversized hoodie", "source_category": "clothing",
                     "value": "clothing.oversized_hoodie", "ref_id": "img_openverse_1a2b3c4d", "confidence": 0.9 },
                   { "text": "cargo trousers", "source_category": "clothing",
                     "value": "clothing.cargo_trousers", "ref_id": "img_openverse_1a2b3c4d", "confidence": 0.84 } ],
  "action":      [ { "text": "standing in contrapposto", "source_category": "pose", "value": "pose.contrapposto" },
                   { "text": "arms crossed", "source_category": "pose", "value": "pose.arms_crossed" } ],
  "framing":     [ { "text": "medium shot", "source_category": "framing", "value": "framing.medium_shot" } ],
  "camera":      [],
  "lens":        [ { "text": "35mm-like perspective", "source_category": "lens",
                     "value": "lens.35mm_like", "hedged": true } ],
  "scene":       [ { "text": "a narrow alley", "source_category": "scene", "value": "scene.narrow_alley" },
                   { "text": "in the rain", "source_category": "weather", "value": "weather.rain" },
                   { "text": "holding a paper coffee cup", "source_category": "props", "value": "props.coffee_cup" } ],
  "lighting":    [ { "text": "blue hour", "source_category": "time", "value": "time.blue_hour" },
                   { "text": "backlit", "source_category": "lighting", "value": "lighting.backlit" } ],
  "composition": [ { "text": "centered composition", "source_category": "composition", "value": "composition.centered" } ],
  "style":       [ { "text": "editorial photograph", "source_category": "style", "value": "style.editorial_photography" },
                   { "text": "quiet and intimate", "source_category": "mood", "value": "mood.quiet" },
                   { "text": "muted teal palette", "source_category": "color", "value": "color.muted_teal" } ],
  "motion":      [],
  "constraints": [ { "text": "no text overlays", "kind": "negative" },
                   { "text": "3:2 aspect ratio", "kind": "aspect" } ]
}
```

`camera` is empty **because `camera_angle` is blocked** by the open conflict `cfl_ab12cd34ef56` from §11.7. The accompanying `blocked[]` is:

```json
[ { "slot": "camera", "category": "camera_angle", "reason": "unresolved_conflict",
    "conflict_id": "cfl_ab12cd34ef56",
    "message": "Two references disagree about the camera angle. Choose one to continue." } ]
```

`formatPrompt(…, "generic")` over this object produces:

> a woman, an oversized hoodie, cargo trousers, standing in contrapposto, arms crossed, a narrow alley, in the rain, holding a paper coffee cup, blue hour, backlit, centered composition, medium shot, 35mm-like perspective, editorial photograph, quiet and intimate, muted teal palette — no text overlays, 3:2 aspect ratio

The exact punctuation and joining are the formatter module's concern, not the schema's; what the schema fixes is the **slot content and the order**, which is what makes INV-FMT-1 checkable.

### 12.6 `StructuredPromptDocument`

`{schema_version, kind: "structured_prompt", form, prompt_mode, structured, text, negative_text, blocked[], warnings[], slot_order[], formatter_version, taxonomy_version, source_intent?, source_mix_id?, generated_at}`.

**This is also the shape a ComfyUI node returns**, alongside `prompt`, `visual_intent` and `reference_mix` — the brief's four node outputs. The web app and the node therefore export the same four things from the same modules, which is the brief's question 9 answered structurally rather than aspirationally.

---

## 13. `TaxonomyNode`

**Purpose.** One entry in the controlled vocabulary. It is simultaneously: the definition of a term, the browse tile the user clicks when they *don't know the word* (use cases S3/S4), the keyword-search index entry, and the source of the prompt text that term emits. Those four jobs are why the node has as many fields as it does.

File: [`schemas/taxonomy-node.schema.json`](./schemas/taxonomy-node.schema.json). Instances: [`../data/taxonomy/`](../data/taxonomy/).

### 13.1 Fields

Required: `schema_version`, `id`, `category`, `label`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | `taxonomy_id` | **yes** | `<category>.<slug>`, two segments, stable, globally unique |
| `category` | `visual_category` | **yes** | MUST equal the id namespace (INV-TAX-2) |
| `label` | string | **yes** | display text — `"35mm-like perspective"` |
| `aliases` | string[] | no | spellings, colloquialisms, jargon, **misspellings** — the keyword-search fuel |
| `related` | `taxonomy_id[]` | no | adjacent-but-different nodes; one-hop query expansion, "you might also mean" |
| `parent` | `taxonomy_id` \| null | no | **THE hierarchy edge.** Same category; no cycles |
| `children` | `taxonomy_id[]` | no | **derived cache** of `parent` |
| `description` | string | no | plain language for someone who does not know the term |
| `examples` | string[] | no | short illustrative phrases |
| `visual_hint` | `reference_id` \| null | no | the thumbnail for the browse tile — **this is what makes S4 work** |
| `visual_hint_pool` | `reference_id[]` | no | extra ids for a multi-thumbnail tile |
| `conflicts_with` | `taxonomy_id[]` | no | explicit pairwise incompatibility; may cross categories; treated as **symmetric** |
| `exclusivity_group` | string \| null | no | the conflict bucket / modifier escape (§3.2) |
| `media_scope` | `["image","video"]` subset | no | `camera_motion` nodes MUST be `["video"]` |
| `still_inferable` | boolean (`false`) | no | motion-only; gates INV-VID-3 |
| `prompt_fragment` | string | no | the exact text the **generic** formatter emits |
| `negative_fragment` | string | no | text emitted when a chip carrying this node has `negate: true` |
| `model_hints` | `{ <formatter_mode>: fragment }` | no | per-mode overrides; unknown modes fall back to `prompt_fragment` |
| `search_boost` | 0..10 (`1`) | no | scoring multiplier |
| `sort_order` | integer | no | browse ordering |
| `i18n` | `{ <lang>: {label, aliases[], description} }` | no | **`prompt_fragment` is NEVER localized** |
| `deprecated` | boolean (`false`) | no | excluded from search results; stored chips referencing it stay valid |
| `replaced_by` | `taxonomy_id` \| null | no | non-null forces `deprecated: true` (INV-TAX-6) |
| `x_ext` | object | no | |

`prompt_fragment` is never localized because a generation prompt is addressed to a model, not to a reader. Localizing `label` serves the human; localizing the fragment would silently change the image.

### 13.2 File shape

`#/$defs/taxonomy_file` describes `data/taxonomy/*.json`:

```json
{ "schema_version": "1.0", "categories": ["camera_angle", "camera_distance", "camera_motion"],
  "version": 3, "updated_at": "2026-09-09T09:00:00Z", "nodes": [ … ] }
```

One file may carry several categories — the brief ships **nine files for twenty categories** (e.g. `camera.json` holds `camera_angle` + `camera_distance` + `camera_motion`).

### 13.3 Worked example

```json
{
  "schema_version": "1.0",
  "id": "lens.35mm_like",
  "category": "lens",
  "label": "35mm-like perspective",
  "aliases": ["35mm", "35 mm", "wide-ish", "reportage lens", "documentary lens", "35mm look"],
  "related": ["lens.28mm_like", "lens.50mm_like", "camera_distance.near"],
  "parent": "lens.wide_normal",
  "description": "The mildly wide, natural-reportage look of a 35mm-equivalent lens: some environment around the subject, gentle perspective, minimal distortion at the edges.",
  "examples": ["street reportage", "environmental portrait"],
  "visual_hint": "img_wikimedia_commons_9f2ab41c",
  "exclusivity_group": "focal_length",
  "media_scope": ["image", "video"],
  "prompt_fragment": "35mm-like perspective",
  "negative_fragment": "no wide-angle perspective",
  "model_hints": { "generic": "35mm-like perspective" },
  "search_boost": 1.2,
  "sort_order": 35,
  "i18n": { "ko": { "label": "35mm에 가까운 화각", "aliases": ["35미리"] } },
  "deprecated": false
}
```

Note `exclusivity_group: "focal_length"` on a **single_dominant** category: it marks this node as a *dominant* value rather than a modifier, so a second focal length arriving from another reference raises a `kind: "arity"` conflict. `lens.bokeh_heavy` would carry `exclusivity_group: null` and never conflict.

### 13.4 Validation rules

| Rule | Enforcement |
|---|---|
| **INV-TAX-1** id has exactly two dotted segments; hierarchy lives in `parent` | schema |
| **INV-TAX-2** `category` == id namespace | schema |
| **INV-TAX-3 / INV-LENS-1,2** lens honesty rule (§7.5) | schema |
| **INV-TAX-4** `category == "camera_motion"` ⇒ `media_scope == ["video"]` | schema |
| **INV-TAX-5** `still_inferable: true` ⇒ `category == "motion"` | schema |
| **INV-TAX-6** `replaced_by` set ⇒ `deprecated: true` | schema |
| `parent` in the same category, acyclic | code |
| `conflicts_with` is symmetric (a load-time closure) | code |

### 13.5 How `aliases` + `related` power the AI-free keyword search

**No model is involved.** Build one inverted index over `{node.id, label, aliases[], i18n[*].label, i18n[*].aliases[], description}` plus, for references, `{title, description, tags[], aliases[]}`:

| Match | Score |
|---|---|
| exact id | 1.00 |
| exact label | 0.95 |
| exact alias | 0.90 |
| prefix on label or alias | 0.70 |
| substring on label or alias | 0.50 |
| one hop through `related[]` | 0.35 × score(source node) |
| substring in `description` | 0.20 |

Then `score *= node.search_boost`, deduplicate by node keeping the max, and exclude `deprecated` nodes from results (stored chips referencing them remain valid). Hits become (a) intent chips — `source: "user"` when clicked, `source: "query_expansion"` when auto-expanded — and/or (b) structured metadata filters over `Reference.visual_attributes`.

**This is the entire AI-OFF retrieval path, and it is a complete product** (INV-AI-1): browse, manual selection, keyword search, metadata search, prompt composer. Details in [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md).

---

## 14. `ExplorerState`

**Purpose.** Identity pillar 1: the Unified Modal, as one state machine. Text, Image, Video and Browse are **modes of one state object**, not four pages. This object is what makes "the modal never closes mid-exploration" a checkable property instead of a UI aspiration.

File: [`schemas/explorer-state.schema.json`](./schemas/explorer-state.schema.json).

### 14.1 Fields

Required: `schema_version`, `mode`, `query`, `intent`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `mode` | `text` \| `image` \| `video` \| `browse` | **yes** | which input surface is visible — **and nothing else** |
| `query` | `Query` | **yes** | **all four mode payloads at once**, §14.3 |
| `intent` | `VisualIntent` (full) | **yes** | the live document |
| `id` | `exp_…` | no | set when persisted or shared |
| `open` | boolean (`true`) | no | only an explicit user dismissal sets `false` |
| `results` | `ResultSet` | no | §14.4 |
| `selected_reference_id` | `reference_id` \| null | no | transient highlight. **NEVER implies mix membership** |
| `pinned_reference_ids` | `reference_id[]` | no | the working set |
| `mix` | `ReferenceMix` | no | |
| `history` | `{entries[], cursor, max_entries: 200, restore_intent_on_navigate: false}` | no | §14.5 |
| `difference` | `{enabled, anchor_reference_id, keep[], change[], change_targets, strictness}` | no | §14.6 |
| `ai` | `{enabled, analyzer_enabled, semantic_enabled, rerank_enabled, expansion_enabled, adapters{…}, external_transmission{…}}` | no | §14.7 |
| `prompt_mode` | `formatter_mode` (`"generic"`) | no | |
| `prompt_preview` | `StructuredPromptDocument` | no | advisory cache |
| `ui` | `{active_panel, detail_tab, chip_filter_category, show_conflicts_only, composer_open, grid_density}` | no | `active_panel ∈ results\|detail\|mixer\|composer\|browse`; `detail_tab ∈ attributes\|metadata\|license\|explore` |
| `created_at`, `updated_at`, `x_ext` | | no | |

### 14.2 INV-EXP-1 — the central invariant

> **Switching `mode` NEVER resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `filters`.**

A mode switch changes which input surface is visible and nothing else. It **MAY** reset `results` (a new mode implies new retrieval) and `ui.active_panel`. Nothing else.

```
                       ┌──────────────── PRESERVED ACROSS EVERY MODE SWITCH ────────────────┐
                       │  intent   pinned_reference_ids   mix   difference   query.filters  │
                       └───────────────────────────────────────────────────────────────────┘
   ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐
   │  text  │◄─┤ image  │◄─┤ video  │◄─┤ browse │      switching only changes which of
   └────────┘  └────────┘  └────────┘  └────────┘      query.{text,image,video,browse}
        ▲           ▲           ▲           ▲          is rendered — and MAY clear results
        └───────────┴───────────┴───────────┘
```

Without this invariant the product is four search pages with a shared header. With it, the brief's north star — *"the user should never need to know where to search"* — is structurally true: there is nowhere else to be.

### 14.3 Why `query` holds all four payloads at once

`query = { text, image, video, browse, filters, expansion }` — **not** one polymorphic payload discriminated by `mode`. Going text → image → text restores the typed text untouched **because it was never discarded**. This is the structural expression of "one modal, four modes".

| Sub-object | Shape |
|---|---|
| `query.text` | the typed string |
| `query.image` | `{reference_id\|null, upload_id\|null, thumbnail_url, analysis_status, analysis_error, analyzed_at}` |
| `query.video` | the same **plus** `{t_start_s, t_end_s}` — the window that lets the user say *"describe THIS camera move"*, not the whole clip |
| `query.browse` | `{category, parent, keyword, page}` |
| `query.filters` | **shared across all modes**, below |
| `query.expansion` | alias/`related` hop settings |

`analysis_status ∈ none | pending | running | done | error | **mocked**`. **`mocked` is first-class**, not a test artefact: milestone v0.1 ships the upload UI with mock analysis before any analyzer exists, and the state that describes that must be nameable.

`query.filters`: `license` (default = the allowed-by-default set), `type`, `status` (default `["approved"]`), `source`, `orientation`, `min_width`, `min_height`, `duration_s{min,max}`, `has_camera_motion`, `require_categories`, `tags`, `collections`, `local_only`.

### 14.4 `ResultSet`

`{status, query_id, items[], total, cursor, ranking, ran_at, error}`.

`items[i] = {reference_id, rank, score, score_breakdown{semantic, metadata, rerank, keyword, recency}, matched_categories[], matched_values[], differs_categories[]}`.

`ranking = {mode: hybrid|semantic_only|metadata_only|keyword_only, semantic_weight: 0.6, metadata_weight: 0.4, fusion: weighted_sum|rrf, reranker_enabled, embedding_key}` — the brief's ~60/40 default, stored per result set so a replayed history entry reproduces the same ordering, and `score_breakdown` kept so the fusion weights can be tuned **visibly**.

`query_id` lets a slow response for an abandoned query be discarded. **Retrieval and analysis are separate modules; nothing in `results` ever writes back into `intent`.**

### 14.5 History — navigation, not document

Each entry: `{mode, query, intent_snapshot, filters, origin}` (+ optional `id, at, origin_reference_id, origin_categories[], label, result_ref_ids[], ranking_snapshot`). `replay(entry)` = set mode, query and filters, then re-run retrieval with `intent_snapshot`. **Nothing outside the entry is needed** — that is the whole design requirement.

`origin ∈ initial, user_query, mode_switch, chip_edit, taxonomy_browse, reference_explore, reference_use, reference_extract, search_by_difference, preset_load, recipe_load, deep_link`.

Browser semantics: pushing while `cursor < entries.length - 1` **truncates the forward tail** then appends. `back()` decrements `cursor`, `forward()` increments; **neither pushes an entry** — which is exactly why `back` and `forward` are not `origin` values. FIFO eviction from the front past `max_entries` (200), adjusting `cursor`. Empty history ⇒ `cursor: -1`.

> **INV-EXP-3: history is NAVIGATION history, not document history.** `back()` / `forward()` restore mode, query, filters and the result set. They do **not** touch `pinned_reference_ids` or `mix`, and by default do **not** overwrite the live `intent`.
>
> Going back to an earlier search must never delete the outfit you already collected. Restoring an entry's intent is explicit: `restoreEntry(entry, {apply_intent: true})`, or the opt-in flag `history.restore_intent_on_navigate` (default `false`).

### 14.6 Search by Difference

The brief's key differentiator, as data:

| Field | Meaning |
|---|---|
| `enabled` | |
| `anchor_reference_id` | the reference being varied |
| `keep[]` | `visual_category[]` → **hard structured filters** pinned to the anchor's values |
| `change[]` | `visual_category[]` → **negative filters** against the anchor's values, plus a diversity boost |
| `change_targets` | *directed* change: "change clothing **TO streetwear**", not merely "not this outfit" |
| `strictness` | default `0.8`; `1.0` requires an exact taxonomy match on KEEP, lower allows sibling nodes |

Categories in neither list are **free**. **INV-EXP-5 (code, not expressible in JSON Schema): `keep` and `change` MUST be disjoint.**

### 14.7 AI settings and privacy

| Invariant | Statement |
|---|---|
| **INV-AI-1** | With `ai.enabled == false` the product is **still complete**: browse cards, manual selection, keyword search over tags/aliases/related, metadata search and the prompt composer all work, and `results.ranking.mode` falls back to `metadata_only` / `keyword_only`. `expansion_enabled` stays available with AI off — alias and `related` hops need no model. |
| **INV-AI-2** | **No model name is ever hardcoded.** `adapters.{analyzer, embedding, reranker}` are opaque instance ids resolved at runtime. |

`external_transmission.allowed` defaults to **`false`**. Any transmission of user media must be disclosed in the UI **before** it happens (`disclosed_at` records that it was), and a `Reference` with `privacy.local_only` **MUST be refused by every remote adapter**.

### 14.8 Worked example (abridged; `intent` elided)

```json
{
  "schema_version": "1.0",
  "id": "exp_alley_session",
  "mode": "image",
  "open": true,
  "query": {
    "text": "rainy alley editorial",
    "image": { "upload_id": "upl_9c31de70", "thumbnail_url": "blob:local/9c31de70",
               "analysis_status": "mocked", "analyzed_at": "2026-09-09T10:20:01Z" },
    "video": { "reference_id": null, "upload_id": null, "analysis_status": "none" },
    "browse": { "category": "lighting", "parent": null, "keyword": "", "page": 0 },
    "filters": { "license": ["public_domain", "pdm", "cc0", "cc_by", "user_owned"],
                 "status": ["approved"], "type": ["image"], "orientation": "landscape" },
    "expansion": { "enabled": true, "max_hops": 1 }
  },
  "intent": { "…": "the VisualIntent of §7.6" },
  "results": {
    "status": "done", "query_id": "q_0e11", "total": 42, "ran_at": "2026-09-09T10:20:04Z",
    "ranking": { "mode": "metadata_only", "semantic_weight": 0.6, "metadata_weight": 0.4,
                 "fusion": "weighted_sum", "reranker_enabled": false },
    "items": [
      { "reference_id": "img_wikimedia_commons_9f2ab41c", "rank": 0, "score": 0.81,
        "score_breakdown": { "metadata": 0.81, "keyword": 0.62 },
        "matched_categories": ["lighting", "scene", "time"],
        "matched_values": ["lighting.backlit", "scene.narrow_alley", "time.blue_hour"] }
    ]
  },
  "selected_reference_id": "img_wikimedia_commons_9f2ab41c",
  "pinned_reference_ids": ["img_wikimedia_commons_9f2ab41c", "img_openverse_1a2b3c4d"],
  "mix": { "…": "the ReferenceMix of §11.7" },
  "history": {
    "cursor": 2, "max_entries": 200, "restore_intent_on_navigate": false,
    "entries": [
      { "id": "hst_0001", "origin": "initial",     "mode": "text",  "at": "2026-09-09T10:18:00Z" },
      { "id": "hst_0002", "origin": "user_query",  "mode": "text",  "at": "2026-09-09T10:19:10Z" },
      { "id": "hst_0003", "origin": "mode_switch", "mode": "image", "at": "2026-09-09T10:20:00Z" }
    ]
  },
  "difference": { "enabled": true, "anchor_reference_id": "img_wikimedia_commons_9f2ab41c",
                  "keep": ["composition", "lighting", "camera_angle"], "change": ["clothing"],
                  "change_targets": { "clothing": ["clothing.streetwear"] }, "strictness": 0.8 },
  "ai": { "enabled": false, "analyzer_enabled": false, "semantic_enabled": false,
          "rerank_enabled": false, "expansion_enabled": true,
          "adapters": { "analyzer": null, "embedding": null, "reranker": null },
          "external_transmission": { "allowed": false, "endpoints": [] } },
  "prompt_mode": "generic",
  "ui": { "active_panel": "mixer", "detail_tab": "attributes",
          "show_conflicts_only": true, "composer_open": true, "grid_density": "comfortable" }
}
```

This one document is a complete, shareable session: AI fully off, a mocked upload, a live mix with an unresolved conflict, and a Search-by-Difference query in flight. It is also a compact proof of INV-AI-1 — nothing here needs a model to be meaningful.

### 14.9 Validation rules

| Rule | Enforcement |
|---|---|
| **INV-EXP-1** mode switch never resets intent, pins, mix, difference or filters | code |
| **INV-EXP-3** history is navigation history; `back`/`forward` never touch pins/mix and by default not intent | code |
| **INV-EXP-4** every `reference_id` in `mix.references` also appears in `pinned_reference_ids` | code |
| **INV-EXP-5** `difference.keep` and `difference.change` are disjoint | code |
| `origin: "back"` / `"forward"` are **not** legal history origins | schema |
| `query` carries all four mode payloads regardless of `mode` | schema (all four optional-but-persistent; the reducer never deletes them) |

INV-EXP-4 exists so a contributing reference can never vanish from the UI — a mix entry whose card is not on screen is an unexplainable prompt fragment.

---

## 15. `VisualRecipe`

**Purpose.** The brief's "save the entire reference-combination, **not just a prompt preset**". A recipe is a **combination**: intent + mix + frozen reference snapshots + prompt mode. Re-running `formatPrompt` on a recipe reproduces the prompt; the reverse is impossible — which is precisely why a recipe is not a prompt preset.

File: [`schemas/visual-recipe.schema.json`](./schemas/visual-recipe.schema.json).

### 15.1 Fields

Required: `schema_version`, `id`, `name`, `version`, `intent`, `mix`, `references`, `prompt_mode`.

| Field | Type | Req | Meaning |
|---|---|---|---|
| `id` | `rcp_…` | **yes** | **stable across every content revision** |
| `name` | string | **yes** | |
| `version` | integer ≥ 1 | **yes** | monotonic **content** revision — distinct from `schema_version` |
| `intent` | `VisualIntent` (full chip form) | **yes** | per-chip provenance survives sharing |
| `mix` | `reference-mix.schema.json#/$defs/persisted` | **yes** | `schema_version` + `id` required here |
| `references` | `ReferenceSnapshot[]` | **yes** | full metadata incl. licence, creator, attribution |
| `prompt_mode` | `formatter_mode` | **yes** | |
| `description` | string | no | |
| `created_by`, `created_at`, `updated_at` | | no | |
| `prompt_preview` | `StructuredPromptDocument` | no | **advisory cache only** |
| `tags` | string[] | no | |
| `cover_reference_id` | `reference_id` | no | |
| `license_summary` | `{licenses[], requires_attribution, share_alike, has_excluded, attribution_block}` | no | **derived cache** |
| `integrity` | `{content_hash, taxonomy_version, app_version}` | no | |
| `media_health` | `{checked_at, ok, moved, gone, unchecked}` | no | **derived cache** |
| `exports` | `[{kind, prompt_mode, text, generated_at}]` | no | |
| `x_ext` | object | no | |

`exports[].kind ∈ prompt, structured_prompt, visual_intent, reference_mix, storyboard, shot_list, image_prompt, video_prompt`. **The first four are exactly the ComfyUI node's outputs**, so the node and the web app export the same things.

### 15.2 Why snapshots

**INV-RCP-1: every `mix.references[].reference_id` MUST have a snapshot in `references`.** A recipe is therefore standalone: it opens on a machine whose library never held those references.

Snapshots are **frozen**. Editing the live library never silently rewrites a saved recipe — if a reference's attributes are re-analysed next month, a recipe saved today still means what it meant today. Adopting the new analysis is an explicit recipe **edit** that bumps `version`.

`prompt_preview` is advisory: on open, the prompt is **always re-derived** from `intent` + `mix`. If the re-derived text differs (the taxonomy moved on, a node was deprecated) the UI shows a *"regenerated"* notice rather than trusting the cache. `integrity.taxonomy_version` records what the recipe was authored against; ids missing from the current taxonomy are rewritten via `replaced_by`, or kept as custom chips with a **"deprecated node"** badge — **never dropped**.

`license_summary` describes the **reference media only**. It says nothing about the licence of the code or of the generated output. **Reference licensing and code licensing are separate concerns and are never conflated** — the brief's question 8; see [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) and [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md). `has_excluded: true` ⇒ the recipe **MUST warn on open** and **MUST NOT be exported by default**.

### 15.3 Worked example (abridged)

```json
{
  "schema_version": "1.0",
  "id": "rcp_rainy_alley_streetwear",
  "name": "Rainy alley, streetwear, blue hour",
  "version": 3,
  "created_by": "user:local",
  "created_at": "2026-09-09T10:31:00Z",
  "prompt_mode": "generic",
  "intent": { "…": "the VisualIntent of §7.6" },
  "mix": { "schema_version": "1.0", "id": "mix_alley1", "…": "the ReferenceMix of §11.7" },
  "references": [
    { "id": "img_wikimedia_commons_9f2ab41c", "type": "image", "status": "approved",
      "title": "Rainy alley at blue hour",
      "visual_attributes": { "composition": ["composition.centered"], "camera_angle": ["camera_angle.low_angle"] },
      "metadata": { "source": "wikimedia_commons", "source_id": "File:Rainy_alley_blue_hour.jpg",
                    "creator": "A. Photographer", "license": "cc_by",
                    "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    "source_url": "https://commons.wikimedia.org/wiki/File:Rainy_alley_blue_hour.jpg",
                    "attribution": "Rainy alley at blue hour by A. Photographer, CC BY 4.0, via Wikimedia Commons" },
      "media": { "width": 2400, "height": 1600 },
      "snapshot_at": "2026-09-09T10:31:00Z", "media_state": "ok", "media_checked_at": "2026-09-09T10:31:02Z" },
    { "id": "img_openverse_1a2b3c4d", "type": "image", "status": "approved",
      "title": "Street portrait, oversized hoodie",
      "visual_attributes": { "clothing": ["clothing.oversized_hoodie", "clothing.cargo_trousers"] },
      "metadata": { "source": "openverse", "source_id": "1a2b3c4d", "creator": "B. Shooter",
                    "license": "cc_by", "license_url": "https://creativecommons.org/licenses/by/4.0/",
                    "source_url": "https://openverse.org/image/1a2b3c4d",
                    "attribution": "Street portrait by B. Shooter, CC BY 4.0, via Openverse" },
      "snapshot_at": "2026-09-09T10:31:00Z", "media_state": "gone", "media_checked_at": "2026-09-30T08:00:00Z" }
  ],
  "license_summary": { "licenses": ["cc_by"], "requires_attribution": true, "share_alike": false,
                       "has_excluded": false,
                       "attribution_block": "Rainy alley at blue hour by A. Photographer, CC BY 4.0, via Wikimedia Commons\nStreet portrait by B. Shooter, CC BY 4.0, via Openverse" },
  "integrity": { "content_hash": "sha256:7c1f…", "taxonomy_version": 3, "app_version": "0.1.0" },
  "media_health": { "checked_at": "2026-09-30T08:00:00Z", "ok": 1, "moved": 0, "gone": 1, "unchecked": 0 },
  "exports": [ { "kind": "prompt", "prompt_mode": "generic", "text": "a woman, an oversized hoodie, …",
                 "generated_at": "2026-09-09T10:31:05Z" } ]
}
```

**The second snapshot's media is `gone` — and the recipe is undamaged.** Its clothing attributes, its licence, its credit line and its contribution to the prompt are all intact; only the thumbnail on the card is missing. That is R2 of the media-rot policy, demonstrated.

### 15.4 Validation rules

| Rule | Enforcement |
|---|---|
| **INV-RCP-1** every mix reference has a snapshot in `references` | code |
| `mix` validates against `#/$defs/persisted` (requires `schema_version` and `id`) | schema |
| same `id` + `version` ⇒ byte-identical `intent` + `mix` + `references` | code |
| `has_excluded: true` ⇒ warn on open, do not export by default | code |
| snapshots carry no embeddings and no binaries | schema |

---

## 16. The brief's payloads, in the real schema

This section exists to **prove coverage**. If the schema could not express these, the schema would be wrong.

### 16.1 The brief's literal `ReferenceMix` example — validates unchanged

The brief contains exactly one literal JSON payload. It validates against `reference-mix.schema.json` with no edits, including its hand-written `img_A`:

```json
{ "references": [ { "reference_id": "img_A", "use": ["composition", "camera_angle"] } ] }
```

| Why it validates | |
|---|---|
| only `references` is required at the root | §11.1 |
| `img_A` matches `reference_id` (mixed case accepted for hand-authored ids) | §5 |
| `composition` and `camera_angle` are `visual_category` members | §2.1 |
| no `schema_version` needed | §6.3(b) |

### 16.2 An image-analysis result (use case S5: *"Find prompts similar to a photo I already have"*)

The brief specifies the **fields** an analysis produces (the canonical `VisualIntent` field list) but ships no literal analysis payload; the two documents below are that field list instantiated for the brief's own use cases S5 and S6, in the real schema.

A user drops a still into the modal. The analyzer emits a `VisualIntentDocument` with `form: "full"`. **This is a proposal, not a commitment** — every chip is editable, swappable via `alternatives`, and lockable.

```json
{
  "schema_version": "1.0",
  "kind": "visual_intent",
  "form": "full",
  "created_at": "2026-09-09T10:20:04Z",
  "created_by": "analyzer-adapter:local@2",
  "source_explorer_id": "exp_alley_session",
  "notes": "Analysis of upl_9c31de70. Not yet ingested as a Reference, so chips carry no ref_id.",
  "intent": {
    "subject":     [ { "value": "subject.woman", "label": "a woman", "source": "analyzer_image", "confidence": 0.93,
                       "evidence": { "kind": "observed", "bbox": [0.31, 0.18, 0.34, 0.78], "detector": "analyzer-adapter:local@2" } } ],
    "appearance":  [ { "value": "appearance.long_dark_hair", "label": "long dark hair", "source": "analyzer_image", "confidence": 0.87 } ],
    "framing":     [ { "value": "framing.medium_shot", "label": "medium shot", "source": "analyzer_image", "confidence": 0.88 } ],
    "camera_angle":[ { "value": "camera_angle.low_angle", "label": "low angle", "source": "analyzer_image", "confidence": 0.76,
                       "alternatives": [ { "value": "camera_angle.eye_level", "label": "eye level", "confidence": 0.31 } ] } ],
    "camera_distance": [ { "value": "camera_distance.near", "label": "near", "source": "inferred", "confidence": 0.5,
                           "evidence": { "kind": "derived", "note": "framing.medium_shot ⇒ camera_distance.near" } } ],
    "lens":        [ { "value": "lens.35mm_like", "label": "35mm-like perspective", "source": "analyzer_image", "confidence": 0.61 } ],
    "pose":        [ { "value": "pose.contrapposto", "label": "contrapposto stance", "source": "analyzer_image", "confidence": 0.72 },
                     { "value": "pose.arms_crossed", "label": "arms crossed", "source": "analyzer_image", "confidence": 0.69 } ],
    "action":      [ { "value": "action.looking_away", "label": "looking away from camera", "source": "analyzer_image", "confidence": 0.64 } ],
    "motion":      [ { "value": "motion.hair_movement", "label": "hair moving", "source": "analyzer_image", "confidence": 0.42,
                       "evidence": { "kind": "implied", "note": "motion blur at the hair edge", "detector": "analyzer-adapter:local@2" } } ],
    "camera_motion": [],
    "clothing":    [ { "value": "clothing.oversized_hoodie", "label": "oversized hoodie", "source": "analyzer_image", "confidence": 0.9 },
                     { "value": "clothing.cargo_trousers", "label": "cargo trousers", "source": "analyzer_image", "confidence": 0.84 } ],
    "scene":       [ { "value": "scene.narrow_alley", "label": "a narrow alley", "source": "analyzer_image", "confidence": 0.81 },
                     { "value": "scene.wet_asphalt", "label": "wet asphalt", "source": "analyzer_image", "confidence": 0.66 },
                     { "value": "props.umbrella", "label": "an umbrella", "source": "analyzer_image", "confidence": 0.58,
                       "origin_category": "props" } ],
    "lighting":    [ { "value": "lighting.backlit", "label": "backlit", "source": "analyzer_image", "confidence": 0.79 },
                     { "value": "lighting.rim_light", "label": "rim light", "source": "analyzer_image", "confidence": 0.7 } ],
    "composition": [ { "value": "composition.centered", "label": "centered composition", "source": "analyzer_image", "confidence": 0.83 },
                     { "value": "composition.leading_lines", "label": "leading lines", "source": "analyzer_image", "confidence": 0.71 } ],
    "color":       [ { "value": "color.muted_teal", "label": "muted teal palette", "source": "analyzer_image", "confidence": 0.64 } ],
    "mood":        [ { "value": "mood.quiet", "label": "quiet, intimate", "source": "analyzer_image", "confidence": 0.58 } ],
    "style":       [ { "value": "style.editorial_photography", "label": "editorial photography", "source": "analyzer_image", "confidence": 0.71 } ],
    "time":        [ { "value": "time.blue_hour", "label": "blue hour", "source": "analyzer_image", "confidence": 0.69 } ],
    "weather":     [ { "value": "weather.rain", "label": "rain", "source": "analyzer_image", "confidence": 0.55 } ],
    "confidence": {
      "subject": 0.93, "appearance": 0.87, "framing": 0.88, "camera_angle": 0.76,
      "camera_distance": 0.5, "lens": 0.61, "pose": 0.72, "action": 0.64, "motion": 0.42,
      "clothing": 0.9, "scene": 0.81, "lighting": 0.79, "composition": 0.83,
      "color": 0.64, "mood": 0.58, "style": 0.71, "time": 0.69, "weather": 0.55
    }
  }
}
```

**Four things this payload proves.**

| Observation | Invariant demonstrated |
|---|---|
| `camera_motion` is `[]` and **must** be — no image chip may claim a camera move | INV-VID-1 |
| the `motion` chip has `evidence.kind: "implied"` and `confidence: 0.42 ≤ 0.6` | INV-VID-3 |
| the umbrella lives in `scene` with `origin_category: "props"`, keeping the key count at 20 | INV-PROPS-1 |
| the lens value is `lens.35mm_like`, never `lens.35mm` | INV-LENS-1 |

Also note `camera_distance` at exactly `0.5` with `source: "inferred"` — a deterministic rule, no model, capped by INV-INT-4. And `camera_motion` has **no** entry in `confidence`, because empty categories are absent.

Chips carry no `ref_id` because the upload (`upl_9c31de70`) is not yet a `Reference`; provenance lives in `ExplorerState.query.image.upload_id`. Once the upload is ingested as `img_local_<uuid8>`, re-analysis chips **SHOULD** carry that `ref_id`.

### 16.3 A video-analysis result (use case S6: *"Describe my video's camera movement as a prompt"*)

The same document type, from `analyzer_video`. Only the categories that differ from §16.2 are shown; the other 14 arrays behave identically and are elided here for length — **in a real document all 20 keys are present** (INV-INT-1).

```json
{
  "schema_version": "1.0",
  "kind": "visual_intent",
  "form": "full",
  "created_by": "analyzer-adapter:local@2",
  "notes": "Analysis of vid_openverse_4d7e0a13, window 0.0–6.0 s (ExplorerState.query.video.t_start_s/t_end_s).",
  "intent": {
    "camera_motion": [
      { "id": "chip_7f31a0", "value": "camera_motion.dolly_in", "label": "camera dollies in",
        "source": "analyzer_video", "ref_id": "vid_openverse_4d7e0a13", "confidence": 0.82, "order": 0,
        "evidence": { "kind": "observed", "t_start_s": 1.2, "t_end_s": 3.4, "shot_index": 0,
                      "keyframe_url": "https://…/kf_0002.jpg", "detector": "analyzer-adapter:local@2" },
        "alternatives": [ { "value": "camera_motion.push_in", "label": "push in", "confidence": 0.44 } ] },
      { "id": "chip_7f31a1", "value": "camera_motion.pan_left", "label": "camera pans left",
        "source": "analyzer_video", "ref_id": "vid_openverse_4d7e0a13", "confidence": 0.74, "order": 1,
        "evidence": { "kind": "observed", "t_start_s": 3.4, "t_end_s": 6.0, "shot_index": 0,
                      "detector": "analyzer-adapter:local@2" } }
    ],
    "motion": [
      { "value": "motion.walking", "label": "walking", "source": "analyzer_video",
        "ref_id": "vid_openverse_4d7e0a13", "confidence": 0.88,
        "evidence": { "kind": "observed", "t_start_s": 0.0, "t_end_s": 6.0, "shot_index": 0 } },
      { "value": "motion.slow", "label": "slow", "source": "analyzer_video",
        "ref_id": "vid_openverse_4d7e0a13", "confidence": 0.7 }
    ],
    "subject":     [ { "value": "subject.man", "label": "a man", "source": "analyzer_video", "confidence": 0.91 } ],
    "framing":     [ { "value": "framing.wide_shot", "label": "wide shot", "source": "analyzer_video", "confidence": 0.85 } ],
    "scene":       [ { "value": "scene.city_street", "label": "a city street", "source": "analyzer_video", "confidence": 0.8 } ],
    "confidence": { "camera_motion": 0.82, "motion": 0.88, "subject": 0.91, "framing": 0.85, "scene": 0.8 }
  }
}
```

**What only a video can do, visible in the data:**

```
  time ─────────────────────────────────────────────────────────────────────►
  0.0 s        1.2 s                    3.4 s                          6.0 s
   │            │                        │                              │
   │            ├── camera_motion.dolly_in (order 0) ──┤                 │
   │                                     ├── camera_motion.pan_left (order 1) ──┤
   ├── motion.walking (subject motion, the whole window) ────────────────┤
   └── shot_index 0 ─────────────────────────────────────────────────────┘
```

A compound move is **several ordered chips with disjoint timespans**, not one merged value — which is exactly why `camera_motion` is a `multi` category (§3.1). `camera_motion.static` declares `conflicts_with` every other node, so "static + dolly in" is still caught.

Feeding this intent into a still-image formatter mode drops the two `camera_motion` fragments with a warning and keeps `motion.walking` as implied-motion phrasing (INV-FMT-2).

### 16.4 The brief's two headline mixes

**S1 — "Same composition as this photo, but the outfit from that one."** See §11.7. Two entries, disjoint `use` lists, one surfaced `camera_angle` conflict, one remembered `dominance` entry.

**S2 — "Same movement as this video, but the camera work of that video."**

```json
{ "references": [ { "reference_id": "vid_a", "use": ["motion"] },
                  { "reference_id": "vid_b", "use": ["camera_motion"] } ] }
```

Two **different** categories ⇒ **no conflict, by construction**. This is the payoff of the `camera_motion` → `camera` (not `motion`) mapping decision in §4.2: the subject-motion / camera-motion seam exists in the category enum, so the brief's sentence becomes a two-line document rather than a feature.

### 16.5 A surfaced conflict, end to end

```json
{ "id": "cfl_ab12cd34ef56", "category": "camera_angle", "kind": "arity", "status": "open",
  "candidates": [ { "reference_id": "img_a", "value": "camera_angle.low_angle",  "confidence": 0.9 },
                  { "reference_id": "img_b", "value": "camera_angle.high_angle", "confidence": 0.8 } ] }
```

**Both values remain present in the intent** — nothing was dropped. `formatPrompt` returns:

```json
"blocked": [ { "slot": "camera", "category": "camera_angle",
               "reason": "unresolved_conflict", "conflict_id": "cfl_ab12cd34ef56" } ]
```

until a human chooses. When they do, the chosen chip's `source` becomes `mix_resolution` with `ref_id` = the winner, and `Resolution.strategy` is `"user"` — the only strategy reachable while `auto_resolve` is `false`.

---

## 17. Invariant index

| Id | Statement | Enforcement |
|---|---|---|
| INV-INT-1 | `VisualIntent` has exactly the 20 brief keys, all required, `additionalProperties: false` | schema |
| INV-INT-2 | Non-custom chip `value` namespace == array category (`scene` also accepts `props.*`) | schema |
| INV-INT-3 | `source ∈ {reference, mix_resolution}` ⇒ `ref_id` required | schema |
| INV-INT-4 | `source == "inferred"` ⇒ `confidence ≤ 0.5` | schema |
| INV-PROPS-1 | `props.*` value in `scene` ⇒ `origin_category: "props"` | schema |
| INV-LENS-1 | Lens value containing `[0-9]+mm` MUST end `_like` (intent + compact + taxonomy) | schema |
| INV-LENS-2 | Every `lens`-slot `PromptFragment` is hedged; lens `prompt_fragment` must match a hedge token | schema (taxonomy) + code |
| INV-REF-1 | `img_` / `vid_` id prefix agrees with `type` | schema |
| INV-REF-2 | No binary media anywhere: `media_blob` / `media_base64` / `media_bytes` / `data_uri` / `binary` are `false` | schema |
| INV-REF-3 | `EmbeddingRecord` has exactly one of `vector` / `vector_ref` | schema |
| INV-LIC-1 | `approved` ⇒ non-empty attribution, `license ∉ {unknown, proprietary}` | schema |
| INV-LIC-2 | `approved` + `cc_by`/`cc_by_sa` ⇒ non-empty `creator` and `license_url` | schema |
| INV-LIC-3 | `approved` also requires `license_check` and `source_validation` = `pass` | code |
| INV-VID-1 | `camera_motion` chip may not have `source: "analyzer_image"` | schema |
| INV-VID-2 | `type: "image"` ⇒ no `camera_motion`, no temporal media fields | schema |
| INV-VID-3 | `motion` chip from `analyzer_image` ⇒ `evidence.kind: "implied"` and `confidence ≤ 0.6` | schema |
| INV-VID-4 | `type: "video"` with a `media` block ⇒ `duration_s` required | schema |
| INV-TAX-1 | Taxonomy id has exactly two dotted segments; hierarchy lives in `parent` | schema |
| INV-TAX-2 | `category` == id namespace | schema |
| INV-TAX-4 | `camera_motion` nodes have `media_scope: ["video"]` | schema |
| INV-TAX-5 | `still_inferable` only in `motion` | schema |
| INV-TAX-6 | `replaced_by` set ⇒ `deprecated: true` | schema |
| INV-MIX-0 | The brief's interop minimum validates verbatim (only `references` required) | schema |
| INV-MIX-1 | `reference_id` unique across mix entries | code |
| INV-MIX-2 | Conflicts surfaced, never auto-resolved, never silently dropped; `auto_resolve` default `false`, `on_unresolved` default `"block"` | schema defaults + code |
| INV-MIX-3 | `status: "resolved"` ⇒ `resolution` present | schema |
| INV-MIX-4 | Arity is a conflict rule, **not** a cardinality limit — no `maxItems` on single_dominant categories | schema (by absence) |
| INV-FMT-1 | `formatPrompt` is pure and byte-deterministic | code |
| INV-FMT-2 | Still-image mode drops `camera_motion` fragments with a warning | code |
| INV-FMT-3 | The formatter never invents a value absent from the `StructuredPrompt` | code |
| INV-EXP-1 | Mode switch never resets intent, pins, mix, difference or filters | code |
| INV-EXP-3 | History is navigation history; back/forward never touch pins/mix and by default not intent | code |
| INV-EXP-4 | Every mix reference is also in `pinned_reference_ids` | code |
| INV-EXP-5 | `difference.keep` and `difference.change` are disjoint | code |
| INV-AI-1 | AI off is a complete product (browse, manual, keyword, metadata, composer) | code |
| INV-AI-2 | No hardcoded model names; adapters resolved at runtime | code |
| INV-RCP-1 | Every mix reference has a snapshot in `VisualRecipe.references` | code |

**(INV-INT-5 and INV-TAX-3 are not separate rows: the lens rule is indexed as INV-LENS-1/2 and cross-referenced from the taxonomy section.)**

---

## 18. Validation status and how to check it

All seven schema files pass `Draft202012Validator.check_schema`. A **57-case instance matrix** exercises them, covering:

- the 20-key and 13-slot counts; extra-key and missing-key rejection
- the namespace rule (INV-INT-2) and the props/scene carrier rule (INV-PROPS-1)
- the lens rule in **both directions**, including effect-only lens nodes
- INV-VID-1 / 2 / 3 / 4
- `source: "reference"` without `ref_id` → rejected
- custom chips; **two conflicting values being representable** (INV-MIX-4)
- the compact, ingest and document profiles
- the brief's literal `img_A` mix; mix wildcard `use: ["*"]`
- `status: "resolved"` without `resolution` → rejected; the persisted-mix profile
- `media_blob` → rejected; approval gates for `cc_by`; embedding `oneOf`; video without `duration_s` → rejected
- a full `ExplorerState` with history, difference and AI off; `origin: "back"` → rejected
- a full `VisualRecipe` with a `gone` snapshot

To validate by hand:

```bash
python3 - <<'PY'
import json, glob
from jsonschema import Draft202012Validator
from referencing import Registry, Resource
res = [Resource.from_contents(json.load(open(f))) for f in glob.glob('docs/schemas/*.json')]
reg = Registry().with_resources([(r.id(), r) for r in res])
for f in sorted(glob.glob('docs/schemas/*.json')):
    s = json.load(open(f)); Draft202012Validator.check_schema(s)
    print('ok', f)
PY
```

*(The registry wiring above is the shape used by `tests/`; exact package versions are a `tests/` concern, not a schema concern.)*

---

## 19. What this document does not decide

Deliberate hand-offs, so no one looks for these here:

| Question | Lives in |
|---|---|
| Which module owns which function, and the dependency rule | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Fusion ranking, the 60/40 default, reranking, index construction | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| Operator licence settings, the attribution block format, provider-specific licence mapping | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| Which milestone each field first ships in | [`ROADMAP.md`](./ROADMAP.md) |
| The actual controlled vocabulary — every node, alias and fragment | [`../data/taxonomy/`](../data/taxonomy/) |
| Why the product exists and what would count as decay | [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) |
