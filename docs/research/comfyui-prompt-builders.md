# Research Cluster: ComfyUI Prompt Builders & Prompt Vaults

## Why this cluster matters to us

This is the cluster our product is most likely to be *mistaken for*, and therefore the one
where we must be able to state the difference in one sentence. Every project here answers the
question "how do I stop typing prompts from scratch?" — and every one of them answers it the
same way: **a curated option list plus a string concatenator**. The user picks `low angle` from
a dropdown, picks `Rembrandt lighting` from another dropdown, and a node emits a `STRING`.

Three structural facts emerged from reading the actual source of these packs, and all three are
load-bearing for our design:

1. **Nobody in this cluster has a REFERENCE object.** They have *option lists* (`vault_data.py`,
   `data/` folders of `.txt` wildcards, `styles/*.json`). An option is a label with no provenance,
   no source URL, no license, no thumbnail, and no origin image. A reference in our sense —
   `{ id, type, visual_attributes, metadata{source, creator, license, license_url, source_url,
   thumbnail_url, attribution}, status }` (BRIEF, "Reference object") — has no counterpart anywhere
   in this cluster.
2. **Where structure exists, it is structure for the *encoder*, not for the *user*.** The most
   structured node we found ([kiko-flux2-prompt-builder](https://github.com/ComfyAssets/kiko-flux2-prompt-builder))
   builds a real nested JSON — but that JSON is a one-way write target. It is assembled from
   widget values and flattened to text. Nothing ever reads a JSON *back out of* an image or video,
   and nothing merges two JSONs.
3. **Nothing decomposes and nothing mixes.** Even the packs that touch images
   ([KikoTools' Gemini Prompt Engineer](https://github.com/ComfyAssets/ComfyUI-KikoTools),
   [MultiModal-Prompt-Nodes](https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes))
   do image → **one flat enhanced prompt**. There is no "take composition from A, clothing from B",
   no per-attribute selection, and no conflict surface. Our pillars 3, 4 and 5
   (Reference Decomposition, Selective Inheritance, Reference Mixing) are unoccupied territory
   in this entire cluster.

The licensing picture also matters: two of the most-copied packs in this space
(Comfyroll, PromptJSON) have **no license at all**, and two more are copyleft
(PromptChain AGPL-3.0, Prompt Manager GPL-3.0). Our `THIRD_PARTY_REVIEW.md` needs to say
plainly that we studied these and copied no code from any of them.

---

## ComfyAssets/kiko-flux2-prompt-builder

| | |
|---|---|
| Repository | [ComfyAssets/kiko-flux2-prompt-builder](https://github.com/ComfyAssets/kiko-flux2-prompt-builder) |
| License | MIT |
| License verified | Yes — GitHub license label `MIT` via API, `LICENSE` file present at repo root, README states "MIT License - Feel free to use, modify, and distribute." |
| Main function | A JSON-style prompt builder for FLUX 2 exposed both as a ComfyUI node (`KikoFlux2PromptBuilder`) and as a standalone HTML page (`flux2-prompt-node-v2.html`) |

**Overlap.** This is the single closest project in the cluster to the *output* end of our pipeline.
It produces a genuinely nested JSON prompt rather than a comma-soup string, with top-level keys
`prompt`, `style`, `camera` (nested `angle`, `distance`, `lens`/`lens-mm`, `f-number`, `ISO`, `focus`),
`film_stock`, `lighting`, `colors` (nested `palette`, `mood`) and `composition`
([source](https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/nodes/prompt_builder_node.py)).
That overlaps our `StructuredPrompt` intermediate and our `formatPrompt(structuredPrompt, mode)` step.
It also ships the builder as a standalone web page *and* a node — the same dual-surface strategy our
roadmap uses (web MVP first, ComfyUI node at v0.5+).

**Useful idea.** Its node contract is worth copying *as a shape*, not as code:
`RETURN_TYPES = ("STRING", "STRING", "STRING")`, `RETURN_NAMES = ("json_prompt", "text_prompt", "prompt_only")`
— i.e. **emit the structured form and the flattened form side by side from one node**, so a downstream
CLIP encoder gets text while an LLM/debug branch gets the JSON. Our planned node outputs
(`prompt`, `structured_prompt`, `visual_intent`, `reference_mix`) are the same idea generalised.
Also useful: the `numeric_lens_format` toggle, which switches `lens` between a numeric `lens-mm: 85`
and a descriptive string — a direct precedent for our rule that lens is rendered as `"35mm_like"`
and never asserted as a fact.

**What we must NOT copy.** Nothing. MIT permits reuse with attribution, but the brief's hard
prohibition on "wholesale copying of prompt DBs or external repository code" applies regardless:
we do not lift its preset tables (People & Portraits / Nature & Outdoors / Action & Events /
Commercial / Artistic), its JSON key names, or its flattening code. Our taxonomy is authored
independently under `data/taxonomy/`. If we ever reference its schema in docs, it is as prior art,
not as a source file.

**Our differentiation.** **Reference Decomposition.** kiko's JSON is *write-only*: it is assembled
from dropdown widgets and never populated from an image. Its README documents no reference-image
input and no attribute extraction of any kind. Our identical-looking JSON is *readable from a
reference* — an image or video is decomposed into typed attributes with per-field `confidence`,
and the user then edits that proposal. kiko answers "what fields should a Flux 2 prompt have";
we answer "what is *in* this picture, per field, and which of those fields do I want".

---

## jeremieLouvaert/ComfyUI-Prompt-Vault

| | |
|---|---|
| Repository | [jeremieLouvaert/ComfyUI-Prompt-Vault](https://github.com/jeremieLouvaert/ComfyUI-Prompt-Vault) |
| License | MIT |
| License verified | Yes — GitHub license label `MIT` via API; `LICENSE` file present at repo root; README license section states MIT |
| Main function | A "photographic prompt arsenal": 21 curated templates across 8 categories plus a component builder over 100+ photographic components |

**Overlap.** Its component vocabulary is the closest thing in the cluster to our taxonomy:
27 camera+lens entries (Sony A7R V, Hasselblad X2D, Leica M11, ARRI Alexa 35), 24 lighting setups
(Rembrandt, butterfly, golden hour, window light, neon), 18 film stocks (Portra 400, Ektar 100,
CineStill 800T, Velvia 50), 15 moods, 7 quality directives, 10 compositions
([README](https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/README.md)).
Its three nodes — `PromptVaultBrowse`, `PromptVaultBuild`, `PromptVaultFavorites` — map onto our
Browse mode, prompt composer, and (loosely) Visual Recipe.

**Useful idea.** Two. First, the `prompt_dna` second output: every node returns
`RETURN_NAMES = ("prompt", "prompt_dna",)`
([source](https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/prompt_vault_nodes.py)),
i.e. the prompt *plus a record of what went into it*. That is a primitive ancestor of our
`reference_mix` output and validates that users want provenance alongside the text. Second, its
category-first browse (`category_filter` → `template` → `edit_prompt`) confirms that a
curated-entry-point + always-editable-result flow is the right default — which is exactly our
"AI output is a proposal, never a commitment" rule applied to templates.

**What we must NOT copy.** The component database itself. `vault_data.py` embeds the templates and
the 100+ components directly in source. Copying it would be both a "wholesale copying of prompt DBs"
violation under the brief and a needless MIT attribution obligation. Named commercial camera bodies
and film stocks (Leica M11, CineStill 800T) also carry trademark considerations we do not want to
inherit; our taxonomy should describe *looks* ("halation, tungsten-balanced, warm highlights") rather
than assert brand names.

**Our differentiation.** **Visual Intent.** Prompt Vault's `PromptVaultBuild` takes nine text widgets
and joins the selected components with `". ".join(parts)`. The user must already know that they want
"Rembrandt lighting" — the vault cannot tell them what Rembrandt lighting *looks like*, and offers no
path from a picture they like to that term. Our unified modal converts text, image, video and reference
cards into the *same* structured schema, so the user reaches "Rembrandt-like" by pointing at an image,
not by recognising a name in a dropdown.

---

## ComfyAssets/ComfyUI-KikoTools

| | |
|---|---|
| Repository | [ComfyAssets/ComfyUI-KikoTools](https://github.com/ComfyAssets/ComfyUI-KikoTools) |
| License | MIT |
| License verified | Yes — GitHub license label `MIT` via API; README states "MIT License - see LICENSE file for details." |
| Main function | A 21-node general-purpose ComfyUI utility pack (resolution, sampler, seed, save/display) that includes one image-analysis prompt node |

**Overlap.** Only one node overlaps us, but it overlaps hard: **Gemini Prompt Engineer**, which takes
an image plus a model selection (FLUX / SDXL / Danbooru / Video) and emits a prompt formatted for that
model, and which the README describes as analysing "composition, style, lighting, colors, and details"
from reference images ([README](https://raw.githubusercontent.com/ComfyAssets/ComfyUI-KikoTools/main/README.md)).
That is image → visual attributes → model-specific prompt, i.e. a compressed version of our
analyzer + formatter path. `Local Image Loader` (a visual gallery browser that "extracts embedded prompt
and workflow data" from files) also brushes against our Browse mode.

**Useful idea.** The **model-selection-as-formatting-target** pattern: one analysis pass, several output
dialects chosen by a widget (FLUX vs SDXL vs Danbooru vs Video). This is precisely our
`formatPrompt(structuredPrompt, mode)` with `mode: generic | flux | qwen-image | sd | gpt-image |
minimax-h3 | krea`, and it independently confirms the architectural split between *understanding* and
*rendering*. Also worth stealing conceptually: `Display Text`'s automatic positive/negative pair
detection, and the pack's habit of shipping a passthrough debug node (`Display Any`) — we will want an
equivalent inspector for `visual_intent` when the analyzer misfires.

**What we must NOT copy.** The Gemini integration itself. It is a hardcoded, cloud-only, single-vendor
analysis path — the exact thing the brief prohibits ("Model names/backends must NEVER be hardcoded",
"No AI-model-dependent architecture", and Privacy: "Local-first ... any external API transmission must
be explicitly disclosed"). We take the *pattern* (analyse once, format many) and reject the *binding*
(analysis == Gemini). Also do not copy its API-key handling.

**Our differentiation.** **Selective Inheritance.** Gemini Prompt Engineer gives the user exactly one
lever: which output dialect. The analysis is all-or-nothing — you get a whole prompt describing the whole
image, and if you only wanted the *camera angle* from that image you must delete the rest by hand.
Our EXTRACT action lets the user take composition/camera/pose/clothing/lighting/scene/style/motion
*individually*, per reference, and our `ReferenceMix` records which reference contributed which category.
KikoTools has no data structure capable of expressing "only the lighting from this image".

---

## ketle-man/ComfyUI-Workflow-Studio

| | |
|---|---|
| Repository | [ketle-man/ComfyUI-Workflow-Studio](https://github.com/ketle-man/ComfyUI-Workflow-Studio) |
| License | MIT |
| License verified | Yes — GitHub license label `MIT` via API; repo page About sidebar shows MIT |
| Main function | A workflow/asset/gallery management side-panel UI plugin for ComfyUI, with prompt presets, Fooocus-style JSON styles, a model browser and a vision-model Tagger tab |

**Overlap.** This is the cluster's most ambitious *UI* project and the closest to our "one panel for
everything" instinct. It unifies a workflow library, a model browser and a generated-image gallery with
metadata extraction into a single side panel, stores prompt presets in an app database, and stores styles
as JSON under `user/default/Workflow-Studio/style/`
([repo page](https://github.com/ketle-man/ComfyUI-Workflow-Studio)). Its Tagger tab applies vision models
to label images. Drag-and-drop from panel to canvas is the interaction we want for dropping a composed
prompt into a graph.

**Useful idea.** **Styles as data files, not code.** Fooocus-style JSON style definitions living in a
user-writable directory means the vocabulary can grow without a release. Our `data/taxonomy/*.json`
should follow the same rule — taxonomy is data, the prompt engine is code, and the two ship separately.
The side-panel-that-never-closes is also a real precedent for our "the modal never closes mid-exploration"
requirement.

**What we must NOT copy.** Its Fooocus-derived style definitions. Fooocus style JSON is a widely
re-vendored corpus with its own upstream provenance chain; ingesting it wholesale would put third-party
prompt data into our repo, which the brief forbids. Also avoid its architecture direction: it is a
management shell *around* ComfyUI, whereas the brief mandates a standalone web MVP with no coupling of UI
to the prompt engine, and a ComfyUI node only later.

**Our differentiation.** **Unified Modal.** Workflow Studio unifies *assets* (workflows, models, images)
— it is a file browser with tabs. It does not unify *input modes*. There is no path where a user types a
sentence, switches to an image upload, then to a video, then to a browsed card, all inside one persistent
state. Its gallery reads *embedded generation metadata* (checkpoint, LoRA, prompt text from PNG/WebP),
which only works on images that ComfyUI itself produced — a photograph from the outside world yields
nothing. Our modal accepts arbitrary media and produces the same `VisualIntent` from any of them.

---

## mobcat40/ComfyUI-PromptChain

| | |
|---|---|
| Repository | [mobcat40/ComfyUI-PromptChain](https://github.com/mobcat40/ComfyUI-PromptChain) |
| License | AGPL-3.0 |
| License verified | Yes — GitHub About sidebar shows `AGPL-3.0`; `LICENSE` file on branch `master` contains "GNU AFFERO GENERAL PUBLIC LICENSE Version 3, 19 November 2007" |
| Main function | A prompt-engineering and image-iteration suite: a code-editor prompt node with chain modes, inline option sets, wildcards, a 3D poser, regional conditioning and segmentation-based masking |

**Overlap.** Its **chain modes** are the nearest thing in the cluster to combining multiple prompt
sources: `Combine` (merge all), `Randomize` (pick one), `Switch` (choose a branch), `Iterate` (cycle
across queued runs). It also has genuine image understanding — `Select Subject` (BiRefNet segmentation),
`Object Select` (SAM2 click-masking) and pose-derived masks — and its detailer/regional nodes bind prompt
text to spatial regions.

**Useful idea.** Two. First, **combination is a named, explicit mode, not an implicit default**. When
several prompt sources meet, the user chooses how they meet. Our conflict handling should present the same
way: when two references contribute different values in the same category, the resolution is a visible
choice ("which is dominant?"), never a silent merge. Second, **region-scoped prompt text**: attaching
prompt fragments to spatial areas is a serious answer to "where in the frame does this apply", and is a
plausible future extension of our `composition` field.

**What we must NOT copy.** **Any code, at all.** AGPL-3.0 is the strongest copyleft in this cluster and its
network clause would reach a hosted version of our web MVP. Vendoring, adapting, or translating PromptChain
source into JavaScript would put our whole product under AGPL. We may read it and cite it; we may not
derive from it. Also do not copy its `::Label::a|b` / `__file__` inline syntax verbatim — a distinctive
DSL is exactly the kind of expressive choice that reads as derivation.

**Our differentiation.** **Reference Mixing.** PromptChain's chain modes combine *prompt texts* —
opaque blobs of string. `Combine` concatenates whole prompts; it cannot take the camera clause from
chain A and the wardrobe clause from chain B, because once a chain has compiled to text the categories
are gone. Our `ReferenceMix` (`{"references":[{"reference_id":"img_A","use":["composition","camera_angle"]}]}`)
operates on typed attributes *before* text exists, which is why we can detect a conflict at all —
two references disagreeing on `lighting` is a comparable pair of values; two prompt strings are not.
Its segmentation is also spatial, not semantic: SAM2 tells you *where* the subject is, never *what the
lighting setup is called*.

---

## pythongosssss/ComfyUI-Custom-Scripts

| | |
|---|---|
| Repository | [pythongosssss/ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts) |
| License | MIT |
| License verified | Yes — fetched `LICENSE` at `main`: MIT License, "Copyright (c) 2023 pythongosssss" |
| Main function | A broad quality-of-life extension pack; the prompt-relevant parts are embedding/tag autocomplete, Preset Text, String Function and Math Expression nodes, plus an Image Feed panel |

**Overlap.** Its **autocomplete** is the de facto standard way ComfyUI users discover prompt vocabulary
today, and it is our closest competitor for the "user does not know the word yet" problem. Word lists are
configured in settings, can be defaulted to danbooru tags with one Load button, and per-model lists live
alongside the model (`loras/model_name/*.txt`)
([README](https://raw.githubusercontent.com/pythongosssss/ComfyUI-Custom-Scripts/main/README.md)).
`String Function` (append/replace with a `tidy_tags` option that inserts commas between components) is a
minimal prompt composer; `Preset Text` is a minimal vault.

**Useful idea.** **Vocabulary lists as plain, user-editable, model-adjacent text files.** No database, no
migration, no lock-in — and the convention that a list can sit *next to the thing it describes*. That is
a good model for our taxonomy files and for user-extensible aliases. The `tidy_tags` detail is also a real
lesson: the boring part of prompt composition is separator hygiene, and a formatter that gets punctuation
right is worth more than another dropdown.

**What we must NOT copy.** The danbooru tag corpus it loads. That vocabulary is scraped booru tag data
with unclear provenance and a strong aesthetic bias toward one model family; ingesting it would breach the
brief's prohibition on wholesale copying of prompt databases and would poison our taxonomy's neutrality.
Our taxonomy is authored, curated, and licensed by us.

**Our differentiation.** **Visual Intent.** Autocomplete is a *text* affordance: it helps you finish a word
you have already started typing. It cannot help the user in the brief's own success case — "I don't know
what this lighting is called — let me pick it by looking at pictures." An autocompleter that offers
`low angle` after you type `low a` is useless to someone who has never heard the phrase. Our taxonomy
entries carry visual exemplars, so selection happens by looking, and text is the *output* of the choice
rather than its prerequisite.

---

## adieyal/sd-dynamic-prompts

| | |
|---|---|
| Repository | [adieyal/sd-dynamic-prompts](https://github.com/adieyal/sd-dynamic-prompts) (ComfyUI port: [adieyal/comfyui-dynamicprompts](https://github.com/adieyal/comfyui-dynamicprompts)) |
| License | MIT |
| License verified | Yes — fetched `LICENSE` at `main`: MIT License, "Copyright (c) 2022 Adi Eyal". *(The ComfyUI port repo's license was not separately verified — (UNVERIFIED).)* |
| Main function | A templating language for prompts: `{a\|b\|c}` variants, `__wildcard__` file references, combinatorial expansion of all permutations, and an ML "Magic Prompt" enhancer |

**Overlap.** It is the canonical prior art for "one authored template, many concrete prompts", and its
wildcard directory convention (one option per line, nested folders, glob matching like `__colors*__`)
is the vocabulary-storage pattern the whole ecosystem imitated. Combinatorial mode — "I {love|hate}
{New York|Chicago} in {June|July|August}" expanding to all 12 permutations — is the closest existing
answer to "explore the neighbourhood of this idea".

**Useful idea.** **Separating the template from its resolutions, and recording both.** Dynamic Prompts
optionally writes *both* the final prompt and the original template into image metadata. That is exactly
the right instinct for our Visual Recipe: the artefact worth saving is not the resolved string, it is the
recipe that produced it (`{ name, references: [...], intent: {...}, prompt_mode }`). Also: glob-matched
wildcards are a cheap, powerful way to let one token address a whole taxonomy subtree — worth considering
for `clothing/*` style selection.

**What we must NOT copy.** The community wildcard collections that circulate with it. Those `.txt` bundles
are aggregated from mixed and often unstated sources — precisely the "unknown provenance prompt DB"
the brief bars. Copy the *file convention*, never the *files*.

**Our differentiation.** **Search by Difference.** Dynamic Prompts explores by *enumeration*: it multiplies
out every combination of the axes you listed and hands you the cartesian product, unranked and unfiltered.
It has no notion of "keep these categories fixed, vary only that one, and find real examples". Our
Search by Difference lets the user mark KEEP (composition, lighting, camera) and CHANGE (clothing), and
returns actual references that satisfy the constraint via hybrid semantic + structured-metadata ranking.
Enumeration generates strings; Search by Difference retrieves evidence.

---

## Suzie1/ComfyUI_Comfyroll_CustomNodes

| | |
|---|---|
| Repository | [Suzie1/ComfyUI_Comfyroll_CustomNodes](https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes) |
| License | **UNVERIFIED — no license found.** No `LICENSE` file exists at the repository root and the GitHub API returns no `license` field for this repo. Treat as all-rights-reserved. |
| License verified | No |
| Main function | A very large (~150+ node) SDXL/SD1.5 node pack; the prompt-relevant nodes are CR Prompt Text, CR Combine Prompt, CR Prompt List, CR Simple Prompt Scheduler, CR SDXL Prompt Mix Presets, CR SDXL Style Text, CR Load Prompt Style and CR Encode Scheduled Prompts |

**Overlap.** `CR Combine Prompt` and `CR SDXL Prompt Mix Presets` are, by name, the closest thing the
ecosystem has to "mixing" — and examining what they actually do is the sharpest possible illustration of
our gap. They mix *strings and conditioning*, not attributes. `CR SDXL Style Text` and `CR Load Prompt Style`
implement the same styles-as-data-files idea seen in Workflow Studio. The pack is also the most-installed
prompt-node source in this cluster (1,300+ stars), so its conventions are what users expect.

**Useful idea.** Naming and discoverability: a consistent `CR ` prefix and a flat, predictable node
category make a 150-node pack navigable. If we ship a node pack later, one prefix and a small number of
nodes with obvious names beats a sprawling taxonomy of them. `CR Prompt List` + scheduler also shows that
users want prompts as *sequences over time* — relevant when we get to video/motion in v0.4.

**What we must NOT copy.** **Any code or data, without exception, and this is the sharpest legal
constraint in the cluster.** Absence of a LICENSE file means default copyright: all rights reserved.
Popularity is not permission. This must be recorded explicitly in `THIRD_PARTY_NOTICES.md` /
`THIRD_PARTY_REVIEW.md`: Comfyroll was reviewed as prior art only, and no line of it exists in our tree.
Its style JSON files are equally unusable.

**Our differentiation.** **Reference Mixing.** "Prompt Mix" in Comfyroll means blending text/conditioning
between a base and a refiner encoder — an operation on *tensors and strings*. It cannot answer
"take composition from A and clothing from B" because at the point of mixing there is no category
structure left to address. Our mixing happens on typed `visual_attributes` while categories still exist,
which is also the only reason conflicts can be *detected and surfaced* rather than silently averaged away.

---

## NeuralSamurAI/ComfyUI-PromptJSON

| | |
|---|---|
| Repository | [NeuralSamurAI/ComfyUI-PromptJSON](https://github.com/NeuralSamurAI/ComfyUI-PromptJSON) |
| License | **UNVERIFIED — no license found.** No `LICENSE` file at `main` (raw fetch and blob view both 404) and the GitHub API returns no `license` field. Treat as all-rights-reserved. |
| License verified | No |
| Main function | A node that structures a natural-language prompt into a schema and emits system/user prompts for an *external* LLM node to expand |

**Overlap.** It is the only project in the cluster whose *schema shape* resembles our `VisualIntent`.
Its documented example schema nests `scene` (`time_of_day`, `weather`, `location`), a `subjects` array
(`type`, `description`, `position`), `style` (`artistic_movement`, `color_palette`, `mood`) and `camera`
(`angle`, `shot_type`) ([repo page](https://github.com/NeuralSamurAI/ComfyUI-PromptJSON)). It also enumerates
alternative schema encodings: "JSON, HTML, Key-Value, Attribute-Based, Visual Layer Breakdown,
Compositional Grid, and Artistic Reference".

**Useful idea.** **Schema-as-a-parameter.** Rather than hardcoding one serialisation, the node lets the
user pick the encoding (`schema_type`) and supply a `custom_schema`. That directly supports our decision to
keep `formatPrompt(structuredPrompt, mode)` pluggable rather than baking a single output dialect. Its
`complexity` float (0.1–1.0) is also a neat single-knob verbosity control we could offer on the composer.

**What we must NOT copy.** Its schema field names, its schema-type list, and any code — no license means
no permission, despite the small size and apparent abandonment (last push 2024-08-11). Our
`VisualIntent` field list is fixed by the brief and was authored independently; the resemblance is
convergent, not derived, and the docs should say so.

**Our differentiation.** **Reference Decomposition** and **Visual Intent**. PromptJSON's schema is a
*prompt for a prompt*: its four outputs are `system_prompt`, `user_prompt`, `negative_passthru` and
`schema` — all strings destined for an external LLM. It performs no image analysis; the structure is
something the user types into, and the JSON is instructions for a model that will write prose. Our
`VisualIntent` is populated *from media*, is arrays-plus-`confidence` rather than free text, is always
user-editable, and is the object that search, mixing and formatting all operate on. PromptJSON structures
a request; we structure an observation.

---

## 1038lab/ComfyUI-WildPromptor

| | |
|---|---|
| Repository | [1038lab/ComfyUI-WildPromptor](https://github.com/1038lab/ComfyUI-WildPromptor) |
| License | Apache-2.0 |
| License verified | Yes — GitHub license label `Apache-2.0` via API; repo About sidebar shows Apache-2.0 |
| Main function | Folder-driven prompt organisation: each folder under `data/` becomes its own selectable list node, plus a Prompt Builder (prefix/content/suffix), Prompt Concat and Keyword Picker |

**Overlap.** Its category set is the closest published analogue to our taxonomy top level —
Subject, Environment, Virtual (visual effects, camera settings, lighting, artists, styles), Custom,
Styles, Negative ([repo page](https://github.com/1038lab/ComfyUI-WildPromptor)). The prefix/content/suffix
composition model is a two-tier version of our `StructuredPrompt` → `formatPrompt` split.

**Useful idea.** **The folder *is* the schema.** Adding a directory under `data/` creates a new list node
with no code change, and the UI updates dynamically as the folder structure changes. That is an excellent
extensibility model for `data/taxonomy/*.json` and would let a user add, say, a `props/` category without
touching our source. It is also the cleanest example in the cluster of the brief's "no coupling of UI with
prompt engine" — the UI is generated from data.

**What we must NOT copy.** Its bundled keyword data, especially the artist-name lists under `Virtual`
and `Styles`. Living-artist style tokens are an ethical and legal hazard we do not want in a product that
also stores reference metadata and attribution. Apache-2.0 would permit reuse with notice, but the brief's
prohibition on copying prompt DBs applies and our License Guard posture argues for authored data only.

**Our differentiation.** **Visual Intent.** WildPromptor's own framing — "like LEGO for prompts", snap
together prefix, content and suffix — is precisely the "pick a few options → get a prompt" degradation the
brief forbids us from becoming. Its categories are *containers of words*; ours are *typed attribute slots
that a reference can fill*. The user of WildPromptor must supply the vocabulary from their own head;
the user of our tool can supply an image instead, and every mode — text, image, video, browsed card —
lands in the same schema.

---

## FranckyB/ComfyUI-Prompt-Manager

| | |
|---|---|
| Repository | [FranckyB/ComfyUI-Prompt-Manager](https://github.com/FranckyB/ComfyUI-Prompt-Manager) |
| License | GPL-3.0 |
| License verified | Yes — GitHub license label `GPL-3.0` ("GNU General Public License v3.0") via API; repo page reports GPL-3.0 |
| Main function | A prompt library with ~15+ nodes: save/browse/compose prompts, generate with llama.cpp/Ollama/CLIP, extract prompts and LoRAs from image/video metadata, and save complete "Recipes" (v2.0) |

**Overlap.** The highest-overlap project in the cluster on the *persistence* axis. Its v2.0 **Recipes**
(Recipe Extractor / Builder / Renderer / Manager nodes operating on `recipe_data` structures containing
"model blocks") are a direct analogue of our Visual Recipe concept — save the whole configuration, not
just the prompt string. Its Prompt Extractor reads Comfy/A1111 metadata from images, videos and JSON and
outputs the prompt plus the LoRAs used. Data is stored as JSON files under `user/default` with base64
data-URL thumbnails and a rolling 5-day backup.

**Useful idea.** **The saved unit is a recipe, not a prompt** — and it round-trips: extract from an
artefact, edit, re-render, re-save. Our Visual Recipe should aim for the same closed loop
(`{ name, references, intent, prompt_mode }` must be extractable from a produced result, not only
authored forward). The base64 thumbnail-in-JSON detail is also directly applicable: it is how they keep a
visual card visual without a media store — and it is a useful contrast to our rule that we store
`thumbnail_url`, never binaries, in the repo.

**What we must NOT copy.** Any code — GPL-3.0 would force our entire product copyleft, which conflicts
with shipping a permissively licensed web MVP plus a reusable node pack. Also do not copy its storage
layout or its metadata-parsing implementation. Architecturally, avoid its assumption that a prompt's
history lives in *generated-image metadata*: that only works inside a closed generation loop and is
useless for external references.

**Our differentiation.** **Reference Decomposition.** Prompt Manager's extraction is *metadata parsing*,
not visual understanding: it recovers the prompt that a Comfy/A1111 pipeline already embedded in the file.
Point it at a photograph from Wikimedia Commons and it recovers nothing, because nothing was ever written.
(Its Prompt Generator can optionally call a vision-capable LLM, but that produces prose, not typed
attributes — (UNVERIFIED) as to whether any per-field structure is retained.) Our decomposition works on
media that no generator ever touched, and produces `visual_attributes` with per-field confidence —
which is what makes a photograph usable as a *reference* rather than as a *record*.

---

## kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes

| | |
|---|---|
| Repository | [kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes](https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes) |
| License | GPL-3.0 |
| License verified | Yes — fetched `LICENSE` at `main`: "GNU General Public License, Version 3". Note: the GitHub license label reports `NOASSERTION` / "Other", so the LICENSE file is authoritative here. README attributes the copyleft to the `llama-cpp-python` dependency. |
| Main function | Vision-LLM prompt generation for QwenImageEdit and Wan 2.2: local GGUF (Qwen2.5-VL / Qwen3-VL / Qwen3.5 / Qwen3.6 / Qwen3.8) or Qwen cloud API, for image and video prompts |

**Overlap.** The closest project to our *AI ON* layer, and to our v0.4 video work. Three nodes:
a **Vision LLM Node** (text + optional image → enhanced prompt), a **Qwen Image Edit Prompt Generator**
(up to 3 images via optional inputs + an edit instruction), and a **Wan Video Prompt Generator**
(text + optional reference image for I2V, 2048-token limit)
([repo page](https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes)). It targets the same model
families the brief names as candidates (Qwen3.5-class analysis, Qwen-VL family) and covers the same
image-and-video multimodal surface.

**Useful idea.** **Backend swappability as a widget.** Local GGUF and cloud API are interchangeable from a
dropdown with no code change — exactly the shape our `analyzer-adapter` / `embedding-adapter` /
`reranker-adapter` must have, and independent evidence that users demand a local option. Its multi-image
input (up to three optional image sockets on one node) is also the right ergonomic precedent for a node
that will eventually accept several references. Its style presets (raw / default / detailed / concise /
creative) are a reasonable verbosity axis.

**What we must NOT copy.** Code (GPL-3.0, transitively driven by `llama-cpp-python` — a reminder that our
adapters must keep any GPL inference backend behind a process/CLI boundary rather than importing it). Also
do not copy its prompt templates or its hardcoded Qwen model id lists; the brief requires model names never
be hardcoded, and its widget enumerates specific versions.

**Our differentiation.** **Reference Mixing.** Its multi-image node accepts up to three images — and then
collapses them into *one* flat enhanced prompt (README documents no selective attribute extraction and no
reference mixing). Three images in, one opaque string out, with no record of which image contributed what.
Ours accepts N references, decomposes each into typed attributes, lets the user assign categories per
reference via `ReferenceMix`, detects when two references disagree within a category, and asks the user
which is dominant. It also has no retrieval at all: it enhances what you already have, and cannot find the
reference you are missing.

---

## sarnara2/ComfyUI_Okims_JSON_Builder

| | |
|---|---|
| Repository | [sarnara2/ComfyUI_Okims_JSON_Builder](https://github.com/sarnara2/ComfyUI_Okims_JSON_Builder) |
| License | **UNVERIFIED — no license found.** The GitHub API returns no `license` field and the README (the repo's only documented file) states none. Treat as all-rights-reserved. |
| License verified | No |
| Main function | A visual JSON prompt builder: a fullscreen HTML canvas of draggable, resizable boxes (types: full, center, impact-grid) with auto-save, presets and JSON import/export, exposed to ComfyUI via a two-button node ("Open Builder", "Copy JSON") |

**Overlap.** It is the cluster's only genuinely *spatial* prompt editor, and it shares our dual-surface
shape: a standalone HTML app plus a thin ComfyUI node wrapper. Its box types and 10px base grid are aimed
at composition/layout description — which touches our `composition` and `framing` fields.

**Useful idea.** **The node as a launcher for a real UI.** Reducing the ComfyUI node surface to two
buttons ("Open Builder", "Copy JSON") and doing the actual work in a fullscreen web view is the cleanest
answer to ComfyUI's cramped widget model, and it is exactly how our v0.5+ node should embed the web MVP —
one node, one launcher, structured output. Auto-saved builder state also matches our "the modal never
closes mid-exploration, state persists" requirement.

**What we must NOT copy.** Code and layout presets — no license. Note also that the repo is thinly
documented (README only, last push 2026-06-15) so its JSON schema, node output names and target models
are all **(UNVERIFIED)**; we should not cite specifics about it beyond what the README states.

**Our differentiation.** **Unified Modal.** Okims unifies nothing — it is a layout canvas that emits JSON
you then paste onward. There is no search, no reference, no analysis, no provenance, and no path from
"a picture I like" to "a filled box". Our fullscreen surface is a *pipeline*
(input → intent → search → decomposition → inheritance → mixing → prompt), not a drawing board, and every
mode of input lands in the same schema without leaving the modal.

---

## UX patterns to avoid

1. **The dropdown wall.** Prompt Vault's Build node presents nine widgets over 100+ components;
   Comfyroll ships 150+ nodes; WildPromptor generates one node per folder. The cost is not the count —
   it is that **every entry is a word with no picture**. A user who does not already know the vocabulary is
   stuck. Never present a taxonomy category as a bare `<select>`; a category cell must show an exemplar.
2. **Text-completion as the discovery mechanism.** Custom-Scripts' autocomplete only helps once you have
   typed the first few characters of a term you already know. This actively fails the brief's success case
   "I don't know what Low Angle means — let me choose it visually." Discovery must be *browse-first*,
   with typing as an accelerator for experts, not the entry point.
3. **No visual feedback on the effect of a choice.** Across the entire cluster, selecting `low angle`
   changes only a string in a text box. Nothing shows what changed. Our reference cards and intent chips
   must make every selection visible immediately — the chip should carry the exemplar it came from.
4. **All-or-nothing image analysis.** KikoTools' Gemini node and MultiModal's Qwen nodes both do
   image → one whole prompt. The user cannot say "only the lighting". Any analysis surface we build must
   render *per-field* results the user can accept or discard individually.
5. **Silent merging of multiple sources.** Comfyroll's "Prompt Mix", PromptChain's `Combine`, and
   MultiModal's three-image input all fuse inputs with no record of who contributed what and no conflict
   surface. Conflicts must be detected and shown; the user picks the dominant reference.
6. **Provenance that only exists inside your own generation loop.** Workflow Studio and Prompt Manager
   both recover history from embedded PNG/WebP generation metadata. That is worthless for an external
   photograph. Provenance must be attached to the reference object at ingest, from the source API,
   not scraped out of a file we happened to produce.
7. **Brand and artist names presented as parameters.** Prompt Vault enumerates camera bodies and film
   stocks; WildPromptor ships artist lists. Prefer describing the *look* over asserting the *brand* —
   this is the same discipline as the brief's `35mm_like` rule.
8. **Two surfaces for two media types.** Nothing in this cluster has a video path and an image path that
   share state; MultiModal even splits them into separate nodes (Qwen Image Edit vs Wan Video). Our modal
   changes MODE, never PAGE.

## Reusable patterns

1. **Dual output from one node: structured + flattened.** kiko emits
   `("json_prompt", "text_prompt", "prompt_only")` from a single call. Our node contract
   (`prompt`, `structured_prompt`, `visual_intent`, `reference_mix`) is the generalisation. Ship both
   forms always; never make the caller re-derive one from the other.
2. **A provenance output alongside the prompt.** Prompt Vault's `prompt_dna` proves users want to know
   what went into a result. `reference_mix` is our stronger version.
3. **Analyse once, format many.** KikoTools' model-target selector (FLUX/SDXL/Danbooru/Video) validates
   keeping `formatPrompt(structuredPrompt, mode)` separate from analysis. Do not entangle the two.
4. **Vocabulary lives in user-editable data files; the UI is generated from them.** WildPromptor
   (folder → node), Workflow Studio (`user/default/.../style/*.json`) and Custom-Scripts
   (`loras/model_name/*.txt`) all converge here. `data/taxonomy/*.json` should be additive with no code
   change required.
5. **The saved artefact is a recipe, and it round-trips.** Prompt Manager's Recipe Extractor / Builder /
   Renderer / Manager quartet is the right shape for Visual Recipe: extract → edit → render → save.
6. **Backend choice is a widget, not a build flag.** MultiModal's local-GGUF-or-API dropdown is the
   ergonomic target for our analyzer/embedding/reranker adapters, and the strongest available evidence
   that a local-first default is expected in this ecosystem.
7. **Combination mode is explicit and named.** PromptChain's Combine / Randomize / Switch / Iterate shows
   users accept — and want — an explicit answer to "how do these sources meet". Model conflict resolution
   the same way.
8. **A ComfyUI node can be a two-button launcher for a real web UI.** Okims ("Open Builder", "Copy JSON")
   and kiko (`flux2-prompt-node-v2.html` alongside the node) both do this. It de-risks our roadmap:
   build the web MVP well, wrap it thinly later.

## Hard technical facts

- `KikoFlux2PromptBuilder` declares `RETURN_TYPES = ("STRING", "STRING", "STRING")`,
  `RETURN_NAMES = ("json_prompt", "text_prompt", "prompt_only")`, `FUNCTION = "build_prompt"`,
  `CATEGORY = "🫶 ComfyAssets/🧠 Prompts"`.
  [source](https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/nodes/prompt_builder_node.py)
- kiko's JSON top-level keys: `prompt`, `style`, `camera` (`angle`, `distance`, `lens`/`lens-mm`,
  `f-number`, `ISO`, `focus`), `film_stock`, `lighting`, `colors` (`palette`, `mood`), `composition`.
  Its `numeric_lens_format` toggle switches `lens` between numeric (`lens-mm: 85`) and descriptive form.
  Text output is built by `_build_text_prompt`, which prefixes sections with labels
  ("Style:", "Camera:", "Lighting:", "Colors:", "Mood:", "Composition:") and joins with periods.
- Prompt Vault node contracts: `PromptVaultBrowse` and `PromptVaultBuild` both declare
  `RETURN_TYPES = ("STRING", "STRING",)` / `RETURN_NAMES = ("prompt", "prompt_dna",)`;
  `PromptVaultFavorites` declares `RETURN_NAMES = ("prompt", "info",)`. All use
  `CATEGORY = "AKURATE/Prompt Vault"`. `PromptVaultBuild` inputs: `subject`, `camera_lens`, `lighting`,
  `film_stock`, `mood`, `quality_directive`, `composition`, `extra_details`, `save_to_favorites`;
  it joins selected parts with `". ".join(parts)`.
  [source](https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/prompt_vault_nodes.py)
- Prompt Vault component counts: 27 camera+lens, 24 lighting, 18 film stocks, 15 moods,
  7 quality directives, 10 compositions; 21 templates across 8 categories. Favorites persist to
  `prompt_vault_favorites.json`; the corpus is embedded in `vault_data.py` (no separate JSON data files).
- PromptJSON node "Prompt JSON" inputs: `prompt`, `negative_prompt`, `complexity` (float 0.1–1.0),
  `llm_prompt_type`, `schema_type`, `custom_schema`. Outputs: `system_prompt`, `user_prompt`,
  `negative_passthru`, `schema`. Supported schema types: "JSON, HTML, Key-Value, Attribute-Based,
  Visual Layer Breakdown, Compositional Grid, and Artistic Reference".
- **Comfyroll has no LICENSE file** — root listing shows only `Patch_Notes.md`, `README.md`, `__init__.py`,
  `categories.py`, `config.py`, `node_mappings.py` and the `fonts/`, `nodes/`, `workflows/` directories;
  the GitHub API returns no `license` field. 1,308 stars, last push 2024-07-24.
- **PromptJSON has no LICENSE file** — `raw.githubusercontent.com/.../main/LICENSE` and
  `github.com/.../blob/main/LICENSE` both return 404; the GitHub API returns no `license` field.
  8 stars, last push 2024-08-11.
- MultiModal-Prompt-Nodes: GitHub's license label is `NOASSERTION`/"Other" while the actual `LICENSE`
  file is GPL-3.0 — a concrete reason our License Guard must prefer the file over the label.
  Its Wan Video Prompt Generator has a **2048-token** prompt limit; the Qwen Image Edit node accepts
  **up to 3 images** via optional inputs.
- Dynamic Prompts syntax: `{a|b|c}` variants, `__wildcard__` file references (one option per line,
  nested folders, glob e.g. `__colors*__`), default wildcard path
  `extensions/sd-dynamic-prompts/wildcards`; combinatorial mode expands all permutations
  (the documented example yields 12); output is a fully resolved flat string, and both the resolved
  prompt and the original template can be written to image metadata.
- Custom-Scripts autocomplete: word lists are settings-managed, danbooru tags load via a one-click
  Load button, and per-model lists live at `loras/model_name/*.txt`. `String Function` offers
  append/replace with a `tidy_tags` option that inserts commas between components.
- Workflow Studio stores styles as JSON at `user/default/Workflow-Studio/style/` and supports
  Fooocus-style JSON style configs; its gallery extracts checkpoint/LoRA/prompt metadata from PNG/WebP.
- Prompt Manager stores data as JSON under `user/default` with base64 data-URL thumbnails and 5 daily
  backups; its Recipe nodes operate on `recipe_data` structures containing "model blocks".
- License summary across the cluster: MIT ×5 (kiko-flux2, Prompt Vault, KikoTools, Workflow Studio,
  Custom-Scripts, sd-dynamic-prompts — 6 counting both), Apache-2.0 ×1 (WildPromptor),
  GPL-3.0 ×2 (Prompt Manager, MultiModal), AGPL-3.0 ×1 (PromptChain), **none declared ×3**
  (Comfyroll, PromptJSON, Okims JSON Builder).

## Open questions

1. Does `kiko-flux2-prompt-builder`'s standalone `app/` MVP persist state between sessions, and does its
   HTML page share code with the node's Python flattener or duplicate it? (Not inspected — this matters
   because it is the closest precedent for our own web-MVP-plus-node-wrapper split.)
2. Does Prompt Vault's `prompt_dna` string carry structured provenance (which component id came from where)
   or is it a human-readable summary? We read the node signature but not the body of `browse`/`build`.
3. Does ComfyUI-Prompt-Manager's `recipe_data` include anything image-derived, or only generation settings
   (model, LoRA stack, prompt)? Its exact serialised shape would tell us how close Recipes really are to
   our Visual Recipe.
4. Is there any project anywhere — inside or outside ComfyUI — that stores a per-attribute *confidence*
   alongside extracted visual attributes? We found none in this cluster; worth one more sweep before we
   claim novelty in `COMPETITIVE_ANALYSIS.md`.
5. Does `adieyal/comfyui-dynamicprompts` (the ComfyUI port) carry the same MIT license as the A1111
   extension? We verified only the latter's LICENSE file. **(UNVERIFIED)**
6. Okims JSON Builder's actual JSON schema, node class name and output socket names are undocumented on
   the repo page; if its `impact-grid`/`center`/`full` box types encode a composition vocabulary, it may be
   more relevant to our `composition`/`framing` taxonomy than it currently appears. **(UNVERIFIED)**
7. Do any of these packs handle *video* as a reference for camera motion (pan/tilt/dolly/orbit)?
   MultiModal generates video prompts from text or a single I2V still, but we found no project that
   *extracts* camera motion from an existing clip — the core of our v0.4. Worth confirming against the
   WAN/AnimateDiff node ecosystem specifically.
8. Comfyroll's missing license: has an issue ever been filed asking for one? If it was intended as MIT,
   that changes nothing for us today (we still copy nothing), but it affects how we phrase the
   `THIRD_PARTY_REVIEW.md` entry.

## Evidence log

Every URL actually fetched during this research:

- https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/README.md
- https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/nodes/prompt_builder_node.py
- https://github.com/ComfyAssets/kiko-flux2-prompt-builder
- https://github.com/ComfyAssets/kiko-flux2-prompt-builder/tree/main/nodes
- https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/README.md
- https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/prompt_vault_nodes.py
- https://github.com/jeremieLouvaert/ComfyUI-Prompt-Vault/tree/main
- https://raw.githubusercontent.com/ComfyAssets/ComfyUI-KikoTools/main/README.md
- https://github.com/ketle-man/ComfyUI-Workflow-Studio
- https://github.com/mobcat40/ComfyUI-PromptChain
- https://raw.githubusercontent.com/mobcat40/ComfyUI-PromptChain/master/LICENSE
- https://raw.githubusercontent.com/pythongosssss/ComfyUI-Custom-Scripts/main/README.md
- https://raw.githubusercontent.com/pythongosssss/ComfyUI-Custom-Scripts/main/LICENSE
- https://raw.githubusercontent.com/adieyal/sd-dynamic-prompts/main/README.md
- https://raw.githubusercontent.com/adieyal/sd-dynamic-prompts/main/LICENSE
- https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes
- https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes/tree/main
- https://raw.githubusercontent.com/Suzie1/ComfyUI_Comfyroll_CustomNodes/main/LICENSE.txt (404 — no license file)
- https://github.com/NeuralSamurAI/ComfyUI-PromptJSON
- https://raw.githubusercontent.com/NeuralSamurAI/ComfyUI-PromptJSON/main/README.md (404)
- https://raw.githubusercontent.com/NeuralSamurAI/ComfyUI-PromptJSON/main/LICENSE (404 — no license file)
- https://github.com/NeuralSamurAI/ComfyUI-PromptJSON/blob/main/LICENSE (404 — no license file)
- https://github.com/1038lab/ComfyUI-WildPromptor
- https://github.com/FranckyB/ComfyUI-Prompt-Manager
- https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes
- https://raw.githubusercontent.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes/main/LICENSE
- https://github.com/sarnara2/ComfyUI_Okims_JSON_Builder

GitHub REST repository metadata (license label field) was additionally queried via the GitHub API for:
`ComfyAssets/kiko-flux2-prompt-builder` (MIT), `jeremieLouvaert/ComfyUI-Prompt-Vault` (MIT),
`ComfyAssets/ComfyUI-KikoTools` (MIT), `ketle-man/ComfyUI-Workflow-Studio` (MIT),
`1038lab/ComfyUI-WildPromptor` (Apache-2.0), `FranckyB/ComfyUI-Prompt-Manager` (GPL-3.0),
`kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes` (NOASSERTION/"Other"),
`Suzie1/ComfyUI_Comfyroll_CustomNodes` (no license field),
`NeuralSamurAI/ComfyUI-PromptJSON` (no license field),
`sarnara2/ComfyUI_Okims_JSON_Builder` (no license field).
