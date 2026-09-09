# Research: Image-to-Prompt / Interrogator / Captioner Projects

## Why this cluster matters to us

This is the cluster our product is most often *mistaken for*, and the one it must most sharply
differentiate from. Every project here implements the same shape: **one image in → one text blob out**.
Some of them are excellent at it. None of them produce a *typed, per-category, editable, searchable*
representation of a reference.

That difference is not cosmetic — it is architectural. The Unified Visual Reference Composer pipeline
(`INPUT → UNIFIED VISUAL INTENT → SIMILAR REFERENCE SEARCH → REFERENCE DECOMPOSITION →
SELECTIVE ATTRIBUTE INHERITANCE → MULTIPLE REFERENCE MIXING → FINAL STRUCTURED PROMPT`) requires four
operations that a text blob cannot support:

1. **Decompose** — you cannot ask a sentence "give me only your `lighting` and `camera_angle`".
   Once "soft rim light on a rainy street, low angle, 35mm" is a string, `lighting`, `scene`,
   `camera_angle` and `lens` have been irreversibly fused into one token sequence.
2. **Mix** — `ReferenceMix` needs `{reference_id, use: ["composition","camera_angle"]}`. You cannot take
   "half of paragraph A and a third of paragraph B" deterministically. Concatenating two captions
   produces contradiction, not composition.
3. **Detect conflicts** — the brief requires that two references contributing different values *in the
   same category* be surfaced to the user. Category membership must exist for a conflict to be
   detectable at all. Text has no categories, so conflicts silently become contradictory prose.
4. **Search by category / Search by Difference** — "keep composition + lighting + camera, change
   clothing" is a structured query over typed fields. Over free text it degenerates into fuzzy string
   matching, which is exactly the failure mode our UX north star rejects.

There is one genuinely important sub-family here: **booru-style taggers** (WD14 / DeepDanbooru), which
emit a *closed vocabulary of tags with per-tag confidence scores*. That is structurally much closer to
`VisualIntent` than any captioner — but their vocabulary is flat and un-typed beyond
`rating / general / character`, and it is anime-domain. Their output shape is a useful lesson; their
taxonomy is not reusable for us.

A second theme worth recording: **JoyCaption already knows our category list** (it has explicit toggles
for lighting, camera angle, composition style, depth of field, shot size, vantage height) — and then
deliberately *dissolves those categories back into a paragraph*. That is the clearest possible proof
that the dead end is a product decision, not a model limitation. The categories are recoverable at
analysis time and thrown away at output time. Our product keeps them.

---

## pharmapsychotic/clip-interrogator

| | |
|---|---|
| Repository | `pharmapsychotic/clip-interrogator` |
| License | MIT (code) |
| License verified | Yes — fetched `LICENSE`, "Copyright (c) 2022 pharmapsychotic" |
| Main function | Image → Stable Diffusion-style prompt string, by CLIP-ranking a huge list of candidate phrases against the image and appending them to a BLIP caption |

**How it actually works** (from
[`clip_interrogator.py`](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/clip_interrogator/clip_interrogator.py)):
it loads five flat label files — `artists.txt`, `flavors.txt`, `mediums.txt`, `movements.txt`,
`negative.txt` — plus a synthesized "trendings" list (`"trending on {site}"`, `"featured on {site}"`).
Each list is embedded with CLIP into a `LabelTable`; `rank_top()` scores candidates with
`similarity = text_features @ image_features.T` and returns the best. Modes: `interrogate_classic`
(template `"caption, medium artist, trending, movement, flaves"`), `interrogate_fast` (caption +
top-ranked merged terms), `interrogate_negative` (`reverse=True` — least similar terms), and
`interrogate` (runs all three and picks the candidate with the highest image-feature alignment via
`candidates[np.argmax(self.similarities(...))]`). Output is truncated by `_truncate_to_fit()` to the
CLIP token limit.

**Overlap.** It is the canonical "image → prompt" tool and it does have a proto-taxonomy: artist /
medium / movement / trending / flavor are *categories*. Users reach for it to answer "what is this
image, as a prompt?" — a question our Image mode also answers.

**Useful idea.** The `LabelTable` pattern is genuinely reusable: **pre-embed a controlled vocabulary
once, cache it, then score an image against it by dot product**. That is exactly how we can implement
AI-assisted taxonomy assignment (`data/taxonomy/*.json` → embedded once → ranked per reference) without
a captioning model. Their per-list `rank_top()` also gives *per-category* results internally — they
just concatenate them away.

**What we must NOT copy.** (a) The five `.txt` label files themselves — `flavors.txt` alone is
**100,970 lines / 1.72 MB** of scraped prompt phrases
([GitHub blob](https://github.com/pharmapsychotic/clip-interrogator/blob/main/clip_interrogator/data/flavors.txt));
copying it would violate the brief's "no wholesale copying of prompt DBs" prohibition regardless of the
MIT code license, and it is an un-curated artist-name list with obvious attribution/ethics problems.
(b) The `"caption, medium artist, trending, movement, flaves"` output template — the moment categories
are joined by commas the decomposition is lost. (c) The dependency on CLIP token truncation as the
prompt-length policy.

**Our differentiation.** **Reference Decomposition.** CLIP Interrogator computes category-level scores
and then throws the category labels away, emitting one comma-joined string. We keep the category as a
first-class field: the same ranking work produces `visual_attributes.lighting`, `.composition`,
`.camera_angle` as separate typed arrays with `confidence`, so a user can extract lighting from this
reference and nothing else.

Sources:
[repo](https://github.com/pharmapsychotic/clip-interrogator) ·
[LICENSE](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/LICENSE) ·
[README](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/README.md) ·
[data dir](https://github.com/pharmapsychotic/clip-interrogator/tree/main/clip_interrogator/data)

---

## pharmapsychotic/clip-interrogator-ext (A1111 WebUI extension)

| | |
|---|---|
| Repository | `pharmapsychotic/clip-interrogator-ext` |
| License | MIT |
| License verified | Yes — fetched `LICENSE`, "Copyright (c) 2023 pharmapsychotic" |
| Main function | Wraps CLIP Interrogator as a Stable Diffusion WebUI tab + HTTP API |

Its README documents three endpoints: list available models, generate a prompt from an image, and
**"analyze images to return words with associated confidence scores."** That third endpoint is the
interesting one — the underlying machinery *can* expose `(term, score)` pairs; the product surface just
usually doesn't.

**Overlap.** Same image→prompt function, delivered inside an existing generation UI — which is the
posture our future ComfyUI node will take (brief: "later ComfyUI node, only after the web MVP proves the
concepts").

**Useful idea.** Splitting "prompt" from "analyze (terms + confidences)" into two API surfaces
validates our `analyzer-adapter` boundary: the analyzer returns scored terms; the formatter decides the
string. Also confirms the brief's rule that retrieval/analysis and prompt formatting stay separate
modules.

**What we must NOT copy.** Its coupling of UI to engine (the extension is a WebUI script, not a
library) — the brief explicitly prohibits "coupling of UI with prompt engine". Also its per-image,
one-shot interaction model: analyze, paste string into the prompt box, done. No reference persists.

**Our differentiation.** **Unified Modal.** This extension is a *tab*: a separate place you go to do
image analysis, then leave. Our product keeps Text / Image / Video / Browse inside ONE modal whose state
persists across mode switches, so an analyzed image becomes a reference card you can immediately search
from, extract from, and mix — without ever closing the modal.

Sources:
[repo](https://github.com/pharmapsychotic/clip-interrogator-ext) ·
[LICENSE](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/LICENSE) ·
[README](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/README.md)

---

## WD14 / WD Tagger (SmilingWolf) — the model weights

| | |
|---|---|
| Repository | Hugging Face: `SmilingWolf/wd-vit-tagger-v3`, `wd-swinv2-tagger-v3`, `wd-convnext-tagger-v3`, `wd-eva02-large-tagger-v3`, plus the older `wd-v1-4-*-tagger-v2` family |
| License | UNVERIFIED |
| License verified | **No** |
| Main function | Image → multi-label booru tag predictions with a per-tag confidence score, over a fixed tag vocabulary split into `rating` / `general` / `character` categories |

**License note (important).** I could not verify these model licenses. `huggingface.co` and `hf.co` are
blocked by this environment's egress proxy, so the model cards could not be fetched. Secondary sources
in search results assert Apache-2.0, but that is **hearsay and must not be recorded as fact
(UNVERIFIED)**. Before any dependency is taken, someone must open the model card and the repo files
directly. Note also that the *training code* repo `SmilingWolf/SW-CV-ModelZoo` shows **no license file
and no license section at all** in its README — see the next entry. Model license and code license are
therefore two separate unresolved questions here.

**Structured output — verified from consuming code, not from the model card.** The ComfyUI node's
[`wd14tagger.py`](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py)
shows how the output is decoded: a companion CSV supplies tag names in column 1 and a **category number
in column 2** — `row[2] == "0"` marks the start of *general* tags and `row[2] == "4"` marks the start of
*character* tags. Two independent thresholds are applied
(`[item for item in result[general_index:character_index] if item[1] > threshold]` and
`result[character_index:]` against `character_threshold`), defaults **0.35 general / 0.85 character**.
So the real model output is a **vector of (tag, probability) over a closed vocabulary, with a coarse
category id** — and only the *last* step flattens it to a comma-joined string.

**Overlap.** This is the closest existing thing to `VisualIntent` in the whole cluster. The Danbooru tag
space genuinely contains many of our taxonomy categories in disguise: `from_below` (camera_angle),
`upper_body` / `cowboy_shot` (camera_distance / framing), `backlighting` (lighting), `school_uniform`
(clothing), `rain` (weather), `dutch_angle` (camera_angle).

**How a structured-tag output could map into `VisualIntent`.** This is the concrete integration design:

```
WD tagger output: [(tag, p), ...]  +  category id (0 general / 4 character / 9 rating)
      │
      ▼   tag → taxonomy mapping table  (data/taxonomy/*.json aliases)
   "from_below"      → camera_angle: ["low_angle"]           conf 0.71
   "cowboy_shot"     → camera_distance: ["cowboy_shot"]      conf 0.63
   "backlighting"    → lighting: ["backlight"]               conf 0.55
   "school_uniform"  → clothing: ["uniform","school"]        conf 0.88
   "rain"            → weather: ["rain"]  scene: ["street"]  conf 0.49
      │
      ▼
VisualIntent { camera_angle: [...], camera_distance: [...], lighting: [...],
               clothing: [...], weather: [...],
               confidence: { camera_angle: 0.71, lighting: 0.55, ... } }
```

Three rules that fall out of this: (1) the mapping table lives in *our* `data/taxonomy/*.json` as an
`aliases` list — we never adopt the booru vocabulary as our schema; (2) tag probability becomes the
per-field `confidence` value the brief requires, so the analyzer's output stays a *proposal*, editable
by the user; (3) one tag may legitimately populate two fields (`rain` → weather **and** scene), which
is why every `VisualIntent` field is an array.

**What we must NOT copy.** The tag vocabulary itself (anime/booru domain, NSFW-heavy, unclear licensing
on both weights and the Danbooru-derived tag list), the `rating: safe/questionable/explicit` axis, and
the "dump all tags above threshold, comma-joined, escape parentheses" output format
(`item[0].replace("(", "\\(")`) — that escaping exists purely to survive an A1111 prompt parser and has
nothing to do with meaning.

**Our differentiation.** **Visual Intent.** WD tagger produces *one flat bag of tags for one image*.
Our schema is the SAME structured target for text, image, video and reference-card inputs alike, with
typed fields and per-field confidence — so a tagger is merely one possible `analyzer-adapter`
implementation feeding it, never the schema itself. The brief's "AI is optional" rule holds: with the
tagger off, the same fields are filled by manual selection and keyword search.

Sources:
[SmilingWolf HF profile (blocked, listed in search results)](https://huggingface.co/SmilingWolf) ·
[wd14tagger.py decode logic](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py) ·
[SW-CV-ModelZoo README](https://github.com/SmilingWolf/SW-CV-ModelZoo)

---

## SmilingWolf/SW-CV-ModelZoo (the tagger training code)

| | |
|---|---|
| Repository | `SmilingWolf/SW-CV-ModelZoo` |
| License | UNVERIFIED — no LICENSE file and no license section found |
| License verified | **No** (verified *absence*: the repo page and README show no license label or licensing section) |
| Main function | TensorFlow/Keras training code + experiment log for the anime-tagging models (ConvNext, ViT, NFNet family) that became the WD taggers |

The README documents training on **"Danbooru2021, 512px SFW subset"** and results tables over
**"All 5500 tags"**, with a later note about training on "2.8M vs 1.5M" images. Attribution given:
*"Anonymous, The Danbooru Community, & Gwern Branwen; 'Danbooru2021: A Large-Scale Crowdsourced and
Tagged Anime Illustration Dataset', 2022-01-21."*

**Overlap.** Only conceptually — it is the provenance of the structured-tag output we find interesting.

**Useful idea.** The clean separation the repo demonstrates: *training data (Danbooru, third-party
license) ≠ model weights (separate distribution) ≠ training code (this repo)*. That triple separation is
exactly what our brief's question 8 ("Is reference licensing separated from code licensing?") demands,
and it is a cautionary example of what happens when it is left implicit: with no LICENSE file, the code
is **all rights reserved by default**.

**What we must NOT copy.** Any code from it (no license = not usable), and the practice of shipping a
public repo with no LICENSE file.

**Our differentiation.** **Reference Decomposition** plus the License Guard. Our `Reference` object
carries `metadata.license`, `license_url`, `source_url`, `attribution` and a `status` of
`candidate | approved | rejected | license_review`, and an unverified license can never reach
`approved`. This repo is a live illustration of why that gate exists.

Source: [SW-CV-ModelZoo](https://github.com/SmilingWolf/SW-CV-ModelZoo)

---

## pythongosssss/ComfyUI-WD14-Tagger

| | |
|---|---|
| Repository | `pythongosssss/ComfyUI-WD14-Tagger` |
| License | MIT (code) |
| License verified | Yes — fetched `LICENSE`, "Copyright (c) 2024 pythongosssss" |
| Main function | ComfyUI node: image → booru tag string, using SmilingWolf's WD v1.4 ONNX models downloaded at runtime |

Node parameters (from README + source): `threshold`, `character_threshold`, `exclude_tags`
("A comma separated list of tags that should not be included in the results"), replace-underscore,
and a `tag_string` output. README states *"All models created by SmilingWolf"* and **does not state the
model licenses** — the classic code-license / model-license gap.

**Overlap.** It is the reference implementation of "structured tagger inside a node graph", which is
where our v0.5+ ComfyUI node will live.

**Useful idea.** Two thresholds for two tag classes is a small but real insight: *different attribute
categories deserve different confidence gates.* Identity-like attributes (character, subject identity)
should be far more conservative (0.85) than descriptive ones (0.35). We should adopt per-category
thresholds in the analyzer adapter — e.g. `lens` must be very conservative, consistent with the brief's
rule that lens is rendered as `"35mm_like"` and never asserted as fact.

**What we must NOT copy.** The single `tag_string` output socket. Our node's contract is fixed by the
brief: it outputs `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` — four outputs, three
of them structured. Also: silently auto-downloading model weights whose license the node never states.

**Our differentiation.** **Selective Inheritance.** A tag string cannot be partially inherited; a
`visual_intent` output can. Downstream nodes (and our own mixer) can take `composition` from one
reference and `clothing` from another because the node hands over typed fields, not one socket of prose.

Sources:
[repo](https://github.com/pythongosssss/ComfyUI-WD14-Tagger) ·
[LICENSE](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/LICENSE) ·
[README](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/README.md) ·
[wd14tagger.py](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py)

---

## picobyte/stable-diffusion-webui-wd14-tagger (successor to toriato's extension)

| | |
|---|---|
| Repository | `picobyte/stable-diffusion-webui-wd14-tagger` |
| License | "Public domain, except borrowed parts (e.g. `dbimutils.py`)" — a non-SPDX, ambiguous grant |
| License verified | Yes — the README's own license statement was fetched and read |
| Main function | A1111 WebUI extension: *"Interrogate booru style tags for single or multiple image files using various models, such as DeepDanbooru"* — supports WD 1.4 (auto-downloaded from Hugging Face), DeepDanbooru variants, and an e621 model |

README explicitly disclaims model ownership (*"I didn't make any models"*) and does not state the model
licenses.

**Overlap.** Batch interrogation of a folder into tag files — i.e. building a *tagged corpus*, which is
adjacent to our reference index.

**Useful idea.** Multi-backend interrogation behind one UI, with the model as a dropdown, is precisely
the brief's adapter rule ("Model names/backends must NEVER be hardcoded"). This extension is evidence
the pattern works in practice for taggers.

**What we must NOT copy.** The license posture. "Public domain, except borrowed parts" is not an SPDX
identifier, does not name which parts are borrowed under what terms, and would fail our own License
Guard's `LICENSE CHECK → SOURCE VALIDATION` stage. Treat this repo as reference reading only, never as a
code source.

**Our differentiation.** **Search by Difference.** This extension's endpoint is a `.txt` of tags per
image — a dataset-labelling output. Ours is an *interactive* one: tags become the structured half of the
hybrid retrieval (semantic + structured metadata, ~60/40 fusion), which is what lets a user mark KEEP
composition+lighting+camera and CHANGE clothing. Tag files cannot be queried that way.

Source: [README](https://raw.githubusercontent.com/picobyte/stable-diffusion-webui-wd14-tagger/master/README.md)

---

## KichangKim/DeepDanbooru

| | |
|---|---|
| Repository | `KichangKim/DeepDanbooru` |
| License | MIT (code) |
| License verified | Yes — fetched `LICENSE`, "Copyright (c) 2019 Kichang Kim" |
| Main function | Anime-domain multi-label tag classifier: image → booru tags with confidence |

**Overlap.** The predecessor of WD14 and still bundled in many pipelines; same structured-tag output
shape.

**Useful idea.** It normalized the idea that an image's description can be a *set of vocabulary items
with scores* rather than a sentence — the single most important structural precedent for `VisualIntent`.
Its tag list is versioned with the model, which is the right instinct: **taxonomy version must be pinned
alongside the analyzer version**, or confidence values from two model versions become incomparable. We
should version `data/taxonomy/*.json`.

**What we must NOT copy.** The vocabulary and the domain assumption (anime illustration). Our taxonomy
is photographic/cinematographic: Framing, Camera Angle, Camera Distance, Lens, Pose, Action, Motion,
Camera Motion, Clothing, Scene, Lighting, Composition, Color, Mood, Style, Time, Weather, Props.

**Our differentiation.** **Reference Mixing.** DeepDanbooru describes one image in one flat namespace.
We combine *partial* attribute sets from several references into one new prompt, and surface conflicts
when two references disagree inside the same category rather than auto-resolving them.

Source: [LICENSE](https://raw.githubusercontent.com/KichangKim/DeepDanbooru/master/LICENSE)

---

## JoyCaption (fpgaminer/joycaption)

| | |
|---|---|
| Repository | `fpgaminer/joycaption` |
| License | Apache-2.0 for the **repository/code** (verified). **Model weights: UNVERIFIED** — README says *"Free and Open… open weights, no restrictions"*, but the weights are distributed on Hugging Face (blocked here) and the model is built on **Llama 3.1**, which carries Meta's own community license upstream. Do not record a weights license until the model card is read. |
| License verified | Yes for the repo `LICENSE` ("Copyright 2024 fpgaminer@bitcoin-mining.com", Apache 2.0); **No** for weights |
| Main function | VLM captioner *"being built from the ground up as a free, open, and uncensored model for the community to use in training Diffusion models"* |

**This is the most important entry in the cluster for us,** because JoyCaption proves the dead end is a
*choice*. Its Gradio app exposes a `CAPTION_TYPE_MAP` with 12 modes — `Descriptive`,
`Descriptive (Casual)`, `Straightforward`, `Stable Diffusion Prompt`, `MidJourney`, `Danbooru tag list`,
`e621 tag list`, `Rule34 tag list`, `Booru-like tag list`, `Art Critic`, `Product Listing`,
`Social Media Post` — plus ~27 "extra options" checkboxes. Verbatim examples from
[`gradio-app/app.py`](https://raw.githubusercontent.com/fpgaminer/joycaption/main/gradio-app/app.py):

- `"Include information about lighting."`
- `"Include information about camera angle."`
- `"Include information on the image's composition style, such as leading lines, rule of thirds, or symmetry."`
- `"Specify the depth of field and whether the background is in focus or blurred."`
- `"Explicitly specify the vantage height (eye-level, low-angle worm's-eye, bird's-eye, drone, rooftop, etc.)."`
- `"Mention whether the image depicts an extreme close-up, close-up, medium close-up, medium shot, cowboy shot, medium wide shot, wide shot, or extreme wide shot."`
- `"If it is a photo you MUST include information about what camera was likely used and details such as aperture, shutter speed, ISO, etc."`
- `"Identify the image orientation (portrait, landscape, or square) and aspect ratio if obvious."`
- `"Do NOT include information about people/characters that cannot be changed (like ethnicity, gender, etc), but do still include changeable attributes (like hair style)."`

Read that list against our taxonomy: lighting, camera_angle, composition, lens/DOF, camera_distance,
framing. **JoyCaption's option list IS a taxonomy** — expressed as English instructions to a language
model, and then flattened into a paragraph where none of it can be addressed again.

**Overlap.** Very high on *analysis capability*: it already reasons about the exact attribute categories
our schema needs, and its shot-size vocabulary is close to what we want for `camera_distance`.

**Useful idea.** Two, both adoptable immediately. (1) **The checkbox-per-attribute UX is the right
input affordance** — users understand "include lighting" — but the *output* must be a field, not a
sentence. (2) The shot-size ladder (extreme close-up → close-up → medium close-up → medium shot →
cowboy shot → medium wide → wide → extreme wide) and the vantage-height ladder (eye-level, worm's-eye,
bird's-eye, drone) are good candidate ordered value sets for `data/taxonomy/camera.json`, expressed in
our own words. Also note its explicit warning to avoid meta phrases
(`"avoid useless meta phrases like 'This image shows…'"`) — a formatter rule worth stealing for
`formatter-generic`.

**What we must NOT copy.** The model weights or any derived caption corpus (weights license unresolved,
Llama 3.1 lineage, and the model is explicitly uncensored — an NSFW-by-default analyzer is not
compatible with our license-clean, Wikimedia/Openverse-sourced reference pool). Also do not copy the
option strings verbatim into our UI; they are prompt text from an Apache-2.0 repo, and more importantly
they are instructions to a specific model — our taxonomy must be model-independent
(brief: "No AI-model-dependent architecture").

**Our differentiation.** **Visual Intent.** JoyCaption asks the model for lighting, camera angle,
composition and depth of field, then *returns them as prose*. We ask for the same things and return them
as `VisualIntent.lighting[]`, `.camera_angle[]`, `.composition[]`, `.lens[]` with per-field
`confidence`, always user-editable, and rendered `"35mm_like"` rather than asserting `"35mm"`. Same
analysis, non-destructive output.

Sources:
[repo](https://github.com/fpgaminer/joycaption) ·
[LICENSE](https://raw.githubusercontent.com/fpgaminer/joycaption/main/LICENSE) ·
[README](https://raw.githubusercontent.com/fpgaminer/joycaption/main/README.md) ·
[gradio-app/app.py](https://raw.githubusercontent.com/fpgaminer/joycaption/main/gradio-app/app.py)

---

## Florence-2 (Microsoft)

| | |
|---|---|
| Repository | Hugging Face: `microsoft/Florence-2-large`, `-base`, `-large-ft`, `-base-ft` (no canonical Microsoft GitHub repo found; `github.com/microsoft/Florence` returns 404) |
| License | UNVERIFIED — widely reported as MIT, **not confirmed firsthand** |
| License verified | **No** — `huggingface.co` and `arxiv.org` are both blocked by this environment's egress proxy, so neither the model card nor the paper could be fetched |
| Main function | Unified prompt-based vision model: a task token (`<CAPTION>`, `<DETAILED_CAPTION>`, `<MORE_DETAILED_CAPTION>`, `<OD>`, `<DENSE_REGION_CAPTION>`, `<CAPTION_TO_PHRASE_GROUNDING>`, OCR, segmentation) selects the task; outputs are generated as text, with region tasks returning `{'bboxes': [[x1,y1,x2,y2], ...], 'labels': [...]}` after post-processing (UNVERIFIED — from search-result summaries, HF card unreachable) |

**Overlap.** Florence-2 is the strongest candidate *analyzer backend* in this cluster for our v0.2
"real image analysis" milestone: small (0.2B / 0.7B class), fast, permissively licensed if MIT holds,
and it emits three caption granularities plus grounded regions.

**Useful idea.** The **task-token design** — one model, many output shapes, selected by a token — is a
clean adapter contract. Our `analyzer-adapter` interface should look similar: `analyze(image, task)`
where task ∈ {`intent`, `regions`, `caption`}, so a backend that supports region grounding can populate
`composition` (subject placement, rule-of-thirds occupancy) from `<DENSE_REGION_CAPTION>` boxes, while a
tagger backend populates the same field from tags. Grounded boxes are also a genuinely better signal for
`composition` and `framing` than any caption — geometry is structured data we can measure, not
interpret.

**What we must NOT copy.** The three-tier caption ladder as a *product output*
(`CAPTION`/`DETAILED_CAPTION`/`MORE_DETAILED_CAPTION` are just three lengths of the same undecomposable
blob), and any hardcoding of `microsoft/Florence-2-*` in our code — the brief forbids hardcoded model
names; it must sit behind `src/ai/analyzer.js`.

**Our differentiation.** **Reference Decomposition.** Florence-2 gives us either a paragraph or a set of
boxes; neither is a reference. Our `Reference` object is `{id, type, visual_attributes{...}, metadata{
source, creator, license, license_url, source_url, media_url, thumbnail_url, attribution}, status}` —
Florence-2 output is one input to `visual_attributes`, and it never touches the license/status half that
makes a reference usable in our pipeline.

Sources (search-result level only — pages themselves blocked):
[microsoft/Florence-2-large model card](https://huggingface.co/microsoft/Florence-2-large) ·
[Florence-2 paper](https://arxiv.org/abs/2311.06242) ·
[kijai/ComfyUI-Florence2](https://github.com/kijai/ComfyUI-Florence2)

---

## kijai/ComfyUI-Florence2

| | |
|---|---|
| Repository | `kijai/ComfyUI-Florence2` |
| License | MIT (code) |
| License verified | Yes — fetched `LICENSE`, "Copyright (c) 2024 Jukka Seppänen" |
| Main function | ComfyUI nodes wrapping Florence-2 for captioning, object detection, segmentation and DocVQA; downloads base/ft/community variants (incl. PromptGen fine-tunes) at runtime |

**Overlap.** The node-graph delivery of a captioner — the same shape our future node takes.

**Useful idea.** It normalizes running *several* Florence variants behind one node with a model
dropdown, including community fine-tunes aimed specifically at prompt generation. Confirms that the
"analyzer is swappable" requirement (brief question 7) is achievable in the ComfyUI environment we
eventually target.

**What we must NOT copy.** The README states no licenses for the models it downloads — a pattern our
THIRD_PARTY_NOTICES policy forbids. And again, one text output socket.

**Our differentiation.** **Unified Modal.** In a node graph, "search for a reference", "look at
candidates", and "compose a prompt" are three disconnected places (or don't exist at all). Our MVP is a
single modal where Text/Image/Video/Browse are modes, not pages, and the modal never closes
mid-exploration — the node comes later and inherits the shared modules, not the other way round.

Sources:
[repo](https://github.com/kijai/ComfyUI-Florence2) ·
[LICENSE](https://raw.githubusercontent.com/kijai/ComfyUI-Florence2/main/LICENSE) ·
[README](https://raw.githubusercontent.com/kijai/ComfyUI-Florence2/main/README.md)

---

## BLIP (Salesforce) and BLIP-2 (via LAVIS)

| | |
|---|---|
| Repository | `salesforce/BLIP` (deprecated) and `salesforce/LAVIS` |
| License | BSD 3-Clause (both, code) |
| License verified | Yes — fetched `salesforce/BLIP/LICENSE.txt` ("Copyright (c) 2022, Salesforce.com, Inc.") and `salesforce/LAVIS/LICENSE.txt` ("Copyright (c) 2022 Salesforce, Inc."); LAVIS README's license section reads "BSD 3-Clause License" |
| Main function | Vision-language pretraining: image captioning, VQA, image-text retrieval, feature extraction. BLIP-2, InstructBLIP, BLIP-Diffusion and X-InstructBLIP all live in LAVIS ("30+ pretrained weights") |

Note: the BLIP repo carries a deprecation banner — *"This repo is DEPRECATED and no longer supported —
We recommend that you do not use the content in this repo for any production or sensitive purpose"* —
and points to LAVIS. Neither README separates model-weight licensing from code licensing (UNVERIFIED
whether individual LAVIS checkpoints carry additional terms; this must be checked per checkpoint).

**Overlap.** BLIP is the caption half of CLIP Interrogator, so it is upstream of most of this cluster.
LAVIS also ships **retrieval** models (ALBEF, CLIP, BLIP image-text retrieval), which touches our
`semantic-search` module, not just the analyzer.

**Useful idea.** LAVIS's split between *feature extraction* and *generation* is the same split our
brief mandates: "Retrieval and analysis are SEPARATE modules. Analyzer understands; retriever ranks."
Its multimodal/unimodal feature-extraction API is a good model for our `embedding-adapter`, which must
embed text queries, images and video frames into one space to support "search with words, images,
videos, or references".

**What we must NOT copy.** BLIP-style short generic captions as any part of our schema — a BLIP caption
("a woman standing on a street at night") contains almost none of the 20 taxonomy categories and cannot
be decomposed. Also do not build on the deprecated repo.

**Our differentiation.** **Unified Modal** and **Visual Intent** together. LAVIS gives you a library of
models; the product question — how a user moves from "I have this photo" to "same lighting, different
outfit, now give me a prompt" without knowing where to search — is untouched by it. Our UX north star,
*"User should never need to know where to search"*, is a product-layer claim that no model library makes.

Sources:
[BLIP repo](https://github.com/salesforce/BLIP) ·
[BLIP LICENSE.txt](https://raw.githubusercontent.com/salesforce/BLIP/main/LICENSE.txt) ·
[BLIP README](https://raw.githubusercontent.com/salesforce/BLIP/main/README.md) ·
[LAVIS LICENSE.txt](https://raw.githubusercontent.com/salesforce/LAVIS/main/LICENSE.txt) ·
[LAVIS README](https://raw.githubusercontent.com/salesforce/LAVIS/main/README.md)

---

## moondream (vikhyat/moondream)

| | |
|---|---|
| Repository | `vikhyat/moondream` |
| License | Apache-2.0 (code) |
| License verified | Yes — fetched `LICENSE` (Apache License 2.0) and the GitHub repo page shows the **Apache-2.0** label. **Weights license: UNVERIFIED** (hosted on Hugging Face / moondream.ai, both unreachable here) |
| Main function | *"a tiny vision language model"* (2B and 0.5B variants) offering *"captioning, visual question answering, and object detection"* |

**A concrete, verified illustration of the whole problem.** The repo's `gradio_demo.py` calls
`moondream.encode_image(img)` then `moondream.answer_question(image_embeds, question, tokenizer,
streamer=...)` and streams **text**. To get a bounding box out, the demo **regex-matches four floats
`[x1, y1, x2, y2]` out of the generated string** — there is no structured field. Spatial data, which the
model demonstrably possesses, has to be reconstructed by parsing prose. (The newer hosted API is
reported to expose `caption` / `query` / `detect` / `point` with JSON returns — **UNVERIFIED**,
`docs.moondream.ai` is blocked by the egress proxy.)

**Overlap.** Strong candidate for our local-first, privacy-preserving analyzer: the brief requires
"User images/videos processed locally by default", and a 0.5B–2B model is deployable on a laptop.

**Useful idea.** Small-model, local-first VLM analysis is viable — this supports the brief's local-first
privacy stance without an external API disclosure. Its `point` capability (if confirmed) would give
subject placement coordinates, which feed `composition` directly.

**What we must NOT copy.** The regex-out-of-prose pattern. Any structure we need must be produced by
the adapter as a typed object and validated against our schema; if a backend can only emit text, the
adapter parses once, at the boundary, into `VisualIntent`, and the raw text is discarded — never carried
downstream as the source of truth.

**Our differentiation.** **Selective Inheritance.** moondream can tell you where the subject is and
what it looks like. It cannot let you take *this* photo's composition and *that* video's camera motion.
Our `ReferenceMix` (`{references:[{reference_id, use:["composition","camera_angle"]}]}`) is the data
structure that makes the answer to brief question 4 — "what data structure lets you take only SOME
attributes from one reference?" — a schema, not a prompt-engineering trick.

Sources:
[repo](https://github.com/vikhyat/moondream) ·
[LICENSE](https://raw.githubusercontent.com/vikhyat/moondream/main/LICENSE) ·
[README](https://raw.githubusercontent.com/vikhyat/moondream/main/README.md) ·
[gradio_demo.py](https://raw.githubusercontent.com/vikhyat/moondream/main/gradio_demo.py)

---

## "img2prompt" web tools (Picsart, ImagePrompt.org, VideoTok, ImageToPrompt.org, GeneratePrompt.ai, PixelPanda, Replicate `methexis-inc/img2prompt`)

| | |
|---|---|
| Repository | N/A — closed products (the Replicate `methexis-inc/img2prompt` model is a hosted wrapper around CLIP Interrogator) |
| License | proprietary (per-site terms; not inspected) |
| License verified | **No** — every one of these domains (`imageprompt.org`, `pixelpanda.ai`, `replicate.com`) is blocked by this environment's egress proxy; findings below come from search-result descriptions only and are (UNVERIFIED) |
| Main function | Upload an image → receive one or several prompt strings targeted at Midjourney / Flux / SD / DALL·E, usually behind a daily free-credit limit |

Reported characteristics (all UNVERIFIED, search-snippet level): PixelPanda returns "4 AI-art prompts:
general, Flux, Midjourney v6 & Stable Diffusion, no signup required"; ImagePrompt.org gives "5 daily
Prompt Credits"; VideoTok "5 free generations per day"; Picsart supports "10+ languages" and
"multiple models".

**Overlap.** These are what a user finds when they search "image to prompt" — they define the category
expectation our Image mode will be judged against. Their per-target-model prompt formatting is the same
job as our `formatPrompt(structuredPrompt, mode)` with modes `generic → flux / qwen-image / sd /
gpt-image / minimax-h3 / krea`.

**Useful idea.** Exactly one: **multi-target formatting from a single analysis** is clearly valued by
users. That validates our architecture where one `StructuredPrompt` is rendered by several formatters —
and it is a strong argument for keeping the structured intermediate, since these sites must re-run the
whole analysis per target while we re-render.

**What we must NOT copy.** Their entire product shape: upload → wait → copy a blob → leave. The result
is not editable field-by-field, not saveable as a reference, not searchable, not mixable, and the
sources of the images are unlicensed uploads. Also do not copy the credit-metered, signup-walled
funnel — our v0.1 must work with **no AI at all** and no account.

**Our differentiation.** **Reference Mixing.** These tools answer "what prompt describes THIS image?".
Our product answers "give me the composition of A, the outfit of B, the lighting of C, and the camera
move of video D, as one prompt" — and surfaces the conflicts when A and C disagree about lighting rather
than silently picking one. That question is not expressible in any of these UIs.

Sources (search results; pages blocked):
[Picsart](https://picsart.com/image-to-prompt/) ·
[ImagePrompt.org](https://imageprompt.org/image-to-prompt) ·
[PixelPanda](https://pixelpanda.ai/free-tools/image-to-prompt) ·
[Replicate img2prompt](https://replicate.com/methexis-inc/img2prompt)

---

## UX patterns to avoid

1. **The one-way blob.** Upload → single text area → "Copy". Nothing in the result is addressable, so
   the user's only edit tool is a text cursor. Never our primary output.
2. **The comma-join.** CLIP Interrogator's `"caption, medium artist, trending, movement, flaves"` and
   WD14's comma-joined tag dump both destroy category membership at the last step, after the system
   already computed it per category. If our formatter is the only place categories disappear, that is
   fine — but they must still exist in `structured_prompt` and `visual_intent`.
3. **The separate tab / separate page.** A "CLIP Interrogator" tab you visit and leave. The brief is
   explicit: one modal, mode switches only, state persists, never closes mid-exploration.
4. **Caption-length ladders as a feature.** `CAPTION` / `DETAILED_CAPTION` / `MORE_DETAILED_CAPTION` is
   three sizes of the same undecomposable object. Verbosity is not structure.
5. **Silent model auto-download with no license statement.** Both ComfyUI nodes reviewed download
   weights at runtime and state no model license. Our License Guard forbids this posture.
6. **Asserting uncertain facts.** JoyCaption instructs the model to state aperture, shutter speed and
   ISO "if it is a photo" — invented EXIF. Our rule stands: `"35mm_like"`, never `"35mm"`, and every
   field carries `confidence`.
7. **Prose-encoded structure.** moondream's demo regex-parsing bboxes out of a sentence is the
   archetype: never let structured data round-trip through prose inside our own pipeline.
8. **Credit meters and signup walls on the core loop.** v0.1 must be fully usable with AI OFF and no
   account.
9. **Auto-resolving contradictions.** None of these tools has a concept of two sources disagreeing.
   When we mix references, conflicts are detected and surfaced, never silently dropped.

## Reusable patterns

1. **Pre-embedded controlled vocabulary + dot-product ranking** (CLIP Interrogator's `LabelTable`,
   `similarity = text_features @ image_features.T`, cached chunk embeddings). Directly applicable:
   embed `data/taxonomy/*.json` once per category, rank an image against each category *separately*, and
   keep the category label. This yields `VisualIntent` with confidences and needs no captioner —
   useful for a lightweight AI-ON tier.
2. **Per-category confidence thresholds** (WD14's 0.35 general / 0.85 character). Generalize: strict
   thresholds for identity-like and factual fields (`lens`, `subject` identity), looser for descriptive
   ones (`mood`, `style`).
3. **Closed vocabulary + per-item probability as the model contract.** Multi-label classification, not
   generation, is the natural fit for `VisualIntent`. It is inherently decomposable, mixable and
   searchable.
4. **Category id carried alongside every predicted label** (WD14's CSV column 2). Our analyzer adapter's
   return type should be `[{field, value, confidence}]`, never `[{value, confidence}]`.
5. **Attribute checkboxes as an input affordance** (JoyCaption's extra options). Users understand
   "include lighting" — reuse the affordance, change the output from sentence to field. This is also
   the natural UI for KEEP/CHANGE in Search by Difference.
6. **Ordered value ladders for continuous-ish categories** — shot size (extreme close-up → extreme wide)
   and vantage height (worm's-eye → eye-level → bird's-eye). Ordering enables "one step wider" as a
   search operation, which flat tag sets cannot express.
7. **Task-token / single-adapter, many output shapes** (Florence-2). Our `analyze(image, task)` contract
   should mirror it so backends of different capability plug in behind one interface.
8. **Two separate API surfaces: "prompt" and "analyze → terms + confidences"**
   (clip-interrogator-ext). Confirms the analyzer/formatter split the brief mandates.
9. **Multi-target formatting from one analysis** (img2prompt sites, JoyCaption's SD/MidJourney modes).
   Validates `formatPrompt(structuredPrompt, mode)` over re-analysis per target.
10. **Explicit anti-meta-phrase formatter rule** (JoyCaption: avoid "This image shows…"). Cheap, real
    quality win for `formatter-generic`.
11. **Pin taxonomy version to analyzer version** (DeepDanbooru ships its tag list with the model), so
    confidences remain comparable across upgrades.

## Hard technical facts

- `pharmapsychotic/clip-interrogator` is **MIT**, "Copyright (c) 2022 pharmapsychotic" (LICENSE fetched).
- CLIP Interrogator loads exactly five data files: `artists.txt`, `flavors.txt`, `mediums.txt`,
  `movements.txt`, `negative.txt`, plus a synthesized "trendings" list built from `"trending on {site}"` /
  `"featured on {site}"`.
- `clip_interrogator/data/flavors.txt` is **100,970 lines, 1.72 MB** — a flat, un-typed phrase list.
- CLIP Interrogator ranking core: `similarity = text_features @ image_features.T`; labels are chunked via
  `np.array_split(self.labels, max(1, len(self.labels)/config.chunk_size))`.
- CLIP Interrogator classic template: `"caption, medium artist, trending, movement, flaves"`;
  `interrogate_negative` uses `reverse=True`; `interrogate` picks
  `candidates[np.argmax(self.similarities(...))]`; all modes end in `_truncate_to_fit()`.
- CLIP Interrogator model pairing: `ViT-L-14/openai` for SD 1.x, `ViT-H-14/laion2b_s32b_b79k` for SD 2.0;
  default settings use ~6.3 GB VRAM, low-VRAM mode ~2.7 GB.
- `clip-interrogator-ext` is **MIT**, "Copyright (c) 2023 pharmapsychotic"; it exposes three endpoints —
  list models, generate prompt, and analyze returning **words with confidence scores**.
- WD14 tag decoding: companion CSV has tag name in `row[1]` and **category id in `row[2]`**;
  `row[2] == "0"` = general, `row[2] == "4"` = character. Defaults: **threshold 0.35** (general),
  **character_threshold 0.85**. Tag names are escaped for prompt parsers via
  `item[0].replace("(", "\\(").replace(")", "\\)")`.
- `pythongosssss/ComfyUI-WD14-Tagger` is **MIT**, "Copyright (c) 2024 pythongosssss"; README says
  *"All models created by SmilingWolf"* and states no model license.
- `SmilingWolf/SW-CV-ModelZoo` (tagger training code) has **no LICENSE file and no license section**;
  trained on **Danbooru2021, 512px SFW subset**, results reported over **"All 5500 tags"**.
- WD tagger model weights (`wd-vit-tagger-v3` etc.) license: **UNVERIFIED** — huggingface.co and hf.co
  are blocked by the egress proxy in this environment.
- `picobyte/stable-diffusion-webui-wd14-tagger` states its license as
  *"Public domain, except borrowed parts (e.g. `dbimutils.py`)"* — not an SPDX identifier.
- `KichangKim/DeepDanbooru` is **MIT**, "Copyright (c) 2019 Kichang Kim".
- `fpgaminer/joycaption` repo is **Apache-2.0**, "Copyright 2024 fpgaminer@bitcoin-mining.com"; the
  underlying LLM is **Llama 3.1** (README: *"bfloat16 is the native dtype of the LLM used in JoyCaption
  (Llama 3.1)"*). Weights license **UNVERIFIED**.
- JoyCaption `CAPTION_TYPE_MAP` has 12 modes: Descriptive, Descriptive (Casual), Straightforward,
  Stable Diffusion Prompt, MidJourney, Danbooru tag list, e621 tag list, Rule34 tag list, Booru-like tag
  list, Art Critic, Product Listing, Social Media Post.
- JoyCaption's shot-size option enumerates: *extreme close-up, close-up, medium close-up, medium shot,
  cowboy shot, medium wide shot, wide shot, extreme wide shot*; the vantage-height option enumerates
  *eye-level, low-angle worm's-eye, bird's-eye, drone, rooftop*.
- `salesforce/BLIP` is **BSD 3-Clause**, "Copyright (c) 2022, Salesforce.com, Inc."; the repo is
  **DEPRECATED** ("do not use the content in this repo for any production or sensitive purpose").
- `salesforce/LAVIS` is **BSD 3-Clause**, "Copyright (c) 2022 Salesforce, Inc."; ships **30+ pretrained
  weights** and includes BLIP-2 (Jan 2023), InstructBLIP (May 2023), BLIP-Diffusion (Jul 2023),
  X-InstructBLIP (Nov 2023).
- `vikhyat/moondream` is **Apache-2.0** (LICENSE file + GitHub label); variants at 2B and 0.5B params.
- moondream's `gradio_demo.py` obtains bounding boxes by **regex-matching four floats out of generated
  text**, not from a structured field.
- `kijai/ComfyUI-Florence2` is **MIT**, "Copyright (c) 2024 Jukka Seppänen".
- Florence-2 region tasks return `{'bboxes': [[x1,y1,x2,y2], ...], 'labels': [...]}` for `<OD>` and
  `<DENSE_REGION_CAPTION>` (UNVERIFIED — HF model card unreachable); model sizes 0.2B / 0.7B; license
  reported MIT (UNVERIFIED).
- Egress restriction affecting this research: `huggingface.co`, `hf.co`, `arxiv.org`, `replicate.com`,
  `docs.moondream.ai`, `modelscope.cn`, `imageprompt.org` and `pixelpanda.ai` are all blocked by the
  proxy. Every model-weights license in this cluster is therefore unverified.

## Open questions

1. What is the actual license on SmilingWolf's WD tagger **weights** (per model repo), and separately on
   the `selected_tags.csv` vocabulary, which is Danbooru-derived? Must be read on huggingface.co from an
   unblocked environment before any dependency.
2. `SW-CV-ModelZoo` has no license — is the WD weights release governed by anything written down at all,
   or only by the model card?
3. Florence-2: confirm MIT firsthand on `microsoft/Florence-2-large`, and confirm whether the `-ft`
   variants and community PromptGen fine-tunes carry the same terms.
4. JoyCaption weights: does the Llama 3.1 community license propagate to the JoyCaption checkpoints
   despite the README's "no restrictions" claim?
5. Do any individual LAVIS checkpoints carry terms beyond the repo's BSD-3-Clause?
6. Does moondream's current API really expose structured `detect` / `point` JSON (and under what weights
   license), or is the text-parsing pattern still the reality outside the hosted service?
7. Which is the better first `analyzer-adapter` for v0.2 — a tagger (structured, cheap, anime-biased) or
   a small VLM (photographic, but text output needing a parse step)? A hybrid (tagger for
   clothing/scene/weather + VLM for composition/camera) is likely, and needs a bake-off.
8. Can Florence-2 `<DENSE_REGION_CAPTION>` boxes be converted into reliable `composition` values
   (rule-of-thirds occupancy, subject placement, headroom) — i.e. is geometry a better composition
   signal than any caption?
9. What is the minimum tag→taxonomy alias table size needed to make a booru tagger useful for our
   photographic taxonomy, and does that mapping survive outside anime imagery?
10. None of these tools handles **video**. What is the closest prior art for camera-motion extraction —
    this cluster provides no answer, and the brief's v0.4 depends on it.

## Evidence log

URLs actually fetched during this research:

- https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/LICENSE
- https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/README.md
- https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/clip_interrogator/clip_interrogator.py
- https://github.com/pharmapsychotic/clip-interrogator/tree/main/clip_interrogator/data
- https://github.com/pharmapsychotic/clip-interrogator/blob/main/clip_interrogator/data/flavors.txt
- https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/LICENSE
- https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/README.md
- https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/LICENSE
- https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/README.md
- https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py
- https://github.com/SmilingWolf/SW-CV-ModelZoo
- https://github.com/SmilingWolf/SW-CV-ModelZoo/blob/main/README.md
- https://raw.githubusercontent.com/SmilingWolf/SW-CV-ModelZoo/main/LICENSE (HTTP 404 — no LICENSE file)
- https://raw.githubusercontent.com/picobyte/stable-diffusion-webui-wd14-tagger/master/README.md
- https://raw.githubusercontent.com/KichangKim/DeepDanbooru/master/LICENSE
- https://raw.githubusercontent.com/fpgaminer/joycaption/main/LICENSE
- https://raw.githubusercontent.com/fpgaminer/joycaption/main/README.md
- https://raw.githubusercontent.com/fpgaminer/joycaption/main/gradio-app/app.py
- https://github.com/fpgaminer/joycaption
- https://github.com/fpgaminer/joycaption/tree/main
- https://raw.githubusercontent.com/salesforce/BLIP/main/LICENSE.txt
- https://raw.githubusercontent.com/salesforce/BLIP/main/README.md
- https://raw.githubusercontent.com/salesforce/LAVIS/main/LICENSE.txt
- https://raw.githubusercontent.com/salesforce/LAVIS/main/README.md
- https://raw.githubusercontent.com/vikhyat/moondream/main/LICENSE
- https://raw.githubusercontent.com/vikhyat/moondream/main/README.md
- https://raw.githubusercontent.com/vikhyat/moondream/main/sample.py
- https://raw.githubusercontent.com/vikhyat/moondream/main/gradio_demo.py
- https://github.com/vikhyat/moondream
- https://github.com/vikhyat/moondream/tree/main
- https://raw.githubusercontent.com/kijai/ComfyUI-Florence2/main/LICENSE
- https://raw.githubusercontent.com/kijai/ComfyUI-Florence2/main/README.md
- https://github.com/microsoft/Florence (HTTP 404 — no such repository)

Attempted but **blocked by the egress proxy** (no content retrieved; anything sourced from these is
marked UNVERIFIED above):

- https://huggingface.co/SmilingWolf/wd-vit-tagger-v3 (EGRESS_BLOCKED)
- https://hf.co/SmilingWolf/wd-vit-tagger-v3 (EGRESS_BLOCKED)
- https://arxiv.org/abs/2311.06242 (EGRESS_BLOCKED)
- https://replicate.com/methexis-inc/img2prompt (EGRESS_BLOCKED)
- https://docs.moondream.ai/ (EGRESS_BLOCKED)
- https://www.modelscope.cn/models/AI-ModelScope/Florence-2-large (EGRESS_BLOCKED)
- https://imageprompt.org/image-to-prompt (EGRESS_BLOCKED)
- https://pixelpanda.ai/free-tools/image-to-prompt (EGRESS_BLOCKED)
