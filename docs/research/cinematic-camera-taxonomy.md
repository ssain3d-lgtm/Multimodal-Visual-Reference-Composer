# Cinematography / Camera & Motion Taxonomies and Video-Prompt Tooling

## Why this cluster matters to us

Three of the canonical `VisualIntent` fields — `framing`, `camera_angle`, `camera_distance` — plus `motion` and
`camera_motion` are the fields where a hand-waved vocabulary would quietly destroy the product. Every downstream
pillar depends on them being *typed and comparable*: **Reference Decomposition** needs a reference to break into
typed attribute values, **Selective Inheritance** needs "take the camera from A" to mean an exact set of values,
**Reference Mixing** needs conflict detection between two references contributing to the same category, and
**Search by Difference** needs "keep camera, change clothing" to be a structured-metadata predicate, not a string
match. On top of that, `formatPrompt(structuredPrompt, mode)` must later emit *different surface forms of the same
canonical value* for different generators — MiniMax Hailuo wants `[Push in]` in square brackets, Kling wants a
numeric `camera_config` vector, Veo wants a natural-language cinematography clause. That is only possible if the
canonical layer is model-independent.

This document reports what film practice and the shot-classification literature actually standardise on, which of
those taxonomies are legally reusable, and which vocabulary each video model accepts. The single most important
practical finding: **the "shot size" ladder is not standardised across datasets** (the same word, *long shot*,
denotes the widest class in MovieShots and a mid-wide class in CineScale), and **extrinsic translation (dolly-in)
is routinely confused with intrinsic focal change (zoom-in)** — a confusion that a research benchmark built with
cinematographers calls out explicitly. Our taxonomy must resolve both by design.

---

## CameraBench (Towards Understanding Camera Motions in Any Video)

| | |
|---|---|
| Repository | [sy77777en/CameraBench](https://github.com/sy77777en/CameraBench) |
| License | CC-BY-4.0 |
| License verified | Yes — [LICENSE file fetched](https://raw.githubusercontent.com/sy77777en/CameraBench/main/LICENSE), opens with *"…Creative Commons Attribution 4.0 International Public License…"* |
| Main function | Expert-annotated benchmark + fine-tuned VLM judges (Qwen2.5-VL 7B/32B/72B) for classifying camera motion in arbitrary video; NeurIPS 2025 Spotlight |

**Overlap.** This is the closest thing in the open world to the `camera_motion` half of our taxonomy. Its taxonomy of
camera-motion primitives was built *with cinematographers*, and it explicitly separates the axes we need:
**reference frame** (object-centric, ground-centric, camera-centric), **translation** (e.g. upward/forward),
**rotation** (e.g. roll clockwise), **intrinsic change** (e.g. zoom-in), **circular motion** (arcing),
**steadiness** (e.g. shaky) and **tracking shots** (e.g. side-tracking). The public test set is
[1,000+ videos with expert labels and captions, with ~1,400 extra annotated clips used for SFT](https://github.com/sy77777en/CameraBench);
search-surfaced descriptions of the paper put the primitive count at ~50 and the annotation effort at ~3,000 videos
(UNVERIFIED — the paper PDF hosts, `arxiv.org`, `openreview.net` and the project page, are blocked from this
environment; the repo README does not restate the full primitive list).

**Useful idea.** Two structural ideas we should copy outright as *ideas*, not as data:
1. **Reference-frame qualification.** "Tracking" is not a sibling of "dolly" — it is the same translation expressed
   in an *object-centric* frame. Encoding `camera_motion` as `{primitive, axis, direction, reference_frame}` removes
   the pan/truck/tracking muddle that flat lists suffer from.
2. **Label-then-caption with an explicit "I am not sure".** Annotators first classify only the aspects they are
   confident about, leave the rest unset, and then write free-text. This is exactly our `confidence` map plus the
   rule that *AI output is a proposal, never a commitment*.

**What we must NOT copy.** The annotations and videos are third-party media; CC-BY-4.0 covers the repository
contents, and any reuse of labels requires attribution — it does not launder the underlying internet videos. We must
not ingest CameraBench clips as reference media (the brief forbids bulk storage of unknown-license media, and these
are internet videos the authors do not own). We take the *shape of the taxonomy*, cite it, and build our own value
list.

**Our differentiation.** CameraBench answers "what is the camera doing in this clip?". It has no notion of taking
*only* the camera motion from clip A while taking clothing from image B. **Reference Decomposition** plus
**Selective Inheritance** is our layer on top: CameraBench-shaped labels become one typed slice of a reference that
the user can inherit independently of every other slice.

---

## CineScale / CineScale2 (University of Brescia + ELTE)

| | |
|---|---|
| Repository | Project pages `cinescale.github.io`; data on [Mendeley Data (CineScale)](https://data.mendeley.com/datasets/th46h4vdwd/1) and [Mendeley Data (CineScale2)](https://data.mendeley.com/datasets/h4n3gn93gz/3); papers in *Data in Brief* ([CineScale](https://www.sciencedirect.com/science/article/pii/S2352340921002869), [CineScale2](https://www.sciencedirect.com/science/article/pii/S2352340923007126)) |
| License | UNVERIFIED |
| License verified | No — every hosting domain (`cinescale.github.io`, `sciencedirect.com`, `data.mendeley.com`, `ncbi.nlm.nih.gov`, `iris.unibs.it`) is blocked by this environment's egress proxy. *Data in Brief* is an open-access journal and such datasets are commonly CC BY, but I did not see the license text, so it is recorded as UNVERIFIED. |
| Main function | Frame-level annotations of cinematic **shot scale** (CineScale) and **camera angle + camera level** (CineScale2) across 124 full feature films |

**Overlap.** CineScale is the most defensible public source for our `camera_distance` ladder, and CineScale2 is the
most defensible source for `camera_angle` — because it proves that *angle* and *height/level* are two orthogonal
dimensions, which most prompt tools collapse into one.

Reported class sets (from the publishers' own abstracts, surfaced via search; full text not fetchable here —
treat the exact wording as (UNVERIFIED) pending a fetch of the *Data in Brief* PDFs):

- **CineScale shot scale (9 classes over 792,000+ frames from 124 films by Scorsese, Godard, Tarr, Fellini,
  Antonioni, Bergman):** Extreme Close Up (ECU), Close Up (CU), Medium Close Up (MCU), Medium Shot (MS),
  Medium Long Shot (MLS), Long Shot (LS), Extreme Long Shot (ELS), Foreground Shot (FS), Insert Shot (IS).
- **CineScale2 camera angle (5 classes, ~25,000 frames):** Overhead, High, Neutral, Low, Dutch.
- **CineScale2 camera level (6 classes):** Aerial, Eye, Shoulder, Hip, Knee, Ground.

**Useful idea.** *Angle ≠ level.* A shot can be Neutral-angle at Ground level (camera on the floor, lens horizontal)
or High-angle at Eye level (standing, looking down). Collapsing these is why "low angle" prompts behave
unpredictably. Our schema should carry `camera_angle` (tilt of the optical axis: overhead / high / neutral / low /
dutch) and a `camera_level` value (aerial / eye / shoulder / hip / knee / ground) — either as a second field or as a
subtyped value inside `camera_angle`, since the brief fixes the field list.

**What we must NOT copy.** No frames, no annotation files, no derived model weights until the license is actually
verified. Under our own License Guard, an unverified license can never reach `approved`, and that rule applies to
research datasets exactly as it applies to reference media.

**Our differentiation.** CineScale is a corpus for film-studies analysis. We are not classifying Bergman; we use the
*vocabulary* so that a user who cannot name "medium long shot" can pick it visually — the brief's north star
*"I don't know what Low Angle means — let me choose it visually"* — and then inherit exactly that value into a mix.

---

## MovieShots / MovieNet shot-type classification (ECCV 2020, SGNet)

| | |
|---|---|
| Repository | Project page `movienet.github.io/projects/eccv20shot.html`; toolbox [movienet/movienet-tools](https://github.com/movienet/movienet-tools); reproduction [sssabet/Shot_Type_Classification](https://github.com/sssabet/Shot_Type_Classification) |
| License | UNVERIFIED (dataset). The independent reproduction sssabet/Shot_Type_Classification is MIT. |
| License verified | No for MovieShots/MovieNet — `movienet.github.io`, `ecva.net`, `arxiv.org` and `anyirao.com` are all blocked here, and `movienet-tools` did not expose a LICENSE at the paths I tried. Yes for the reproduction: its [repo page states "released under the MIT License"](https://github.com/sssabet/Shot_Type_Classification). |
| Main function | 46K shots from 7K movie trailers labelled with **shot scale** and **shot movement**; SGNet splits subject/background into two streams to predict scale and movement separately |

**Overlap.** This is the canonical ML shot-scale/shot-movement label set, and it is the one that most later work
cites. Its classes, as restated by the MIT reproduction I could fetch:

- **Scale (5):** Long Shot (LS) — "a long distance"; Full Shot (FS) — "human body in full"; Medium Shot (MS) —
  "knees or waist up"; Close-up Shot (CS) — "a relatively small object, e.g., face, hand"; Extreme Close-up Shot
  (ECS) — "even a smaller part of object, e.g., eyes".
- **Movement (4):** static (camera fixed), motion (camera moves or rotates), push (camera zooms in),
  pull (camera zooms out). (Class definitions surfaced from the project description; UNVERIFIED at source.)

**Useful idea.** The *negative* lesson is the valuable one. Two problems are visible in this label set and both are
traps for us:
1. **The word "long shot" means different things in different taxonomies.** In MovieShots, LS is the *widest* class.
   In CineScale, LS sits between MLS and ELS, and ELS is the widest. A controlled vocabulary that ships bare strings
   will silently mismatch when we later ingest either corpus. We need canonical ids (`shot_size.extreme_long`,
   `shot_size.long`, …) with per-source alias tables.
2. **"Push" is defined as "zooms in".** That is precisely the dolly/zoom conflation: a push-in is a physical dolly
   forward, a zoom-in is a focal-length change. Fusing them into one class means the label cannot round-trip to a
   model like Hailuo Director, which exposes `[Push in]` and `[Zoom in]` as *different* commands.

**What we must NOT copy.** MovieShots frames come from copyrighted trailers; the dataset license is unverified. No
frames, no annotations, and no re-publication of the class list as if it were ours.

**Our differentiation.** SGNet outputs one label per shot. Our value is that the label is a *handle*: **Search by
Difference** lets a user keep `camera_distance` and `camera_angle` while changing `clothing`, which no
shot-classifier exposes because it has no other typed fields to hold constant.

---

## AVE — The Anatomy of Video Editing (ECCV 2022)

| | |
|---|---|
| Repository | [dawitmureja/AVE](https://github.com/dawitmureja/AVE) |
| License | UNVERIFIED |
| License verified | No — I fetched the [raw README](https://raw.githubusercontent.com/dawitmureja/AVE/main/README.md) and it contains **no license statement**; it says the authors "do not own the movie clips" and points users to the MovieClips YouTube channel. No LICENSE file surfaced on the repo page. |
| Main function | ~196,176 shots from movie scenes with >1.5M manually applied cinematography tags, plus benchmark tasks for AI-assisted editing |

**Overlap.** AVE's per-shot annotation record is almost a subset of our `VisualIntent`. Confirmed field names from
the README's JSON example: `clip-type`, `start-time`, `end-time`, **`shot-size`**, **`shot-angle`**,
**`shot-type`**, **`shot-motion`**, `shot-subject`, `shot-location`, `num-people`, `sound-source`. Example values
visible in the README: `shot-size: "medium"`, `shot-angle: "low-angle"`, `shot-type: "two-shot"`,
`shot-motion: "handheld"`, `shot-subject: "human"`, `shot-location: "int"`, `sound-source: "on-screen"`.

**Useful idea.** AVE is the clearest evidence that **`framing` and `camera_distance` are different fields**. It keeps
`shot-size` (medium) apart from `shot-type` (two-shot). In film practice, *shot size* answers "how much of the
subject is in frame" and *framing* answers "how many subjects and from what relationship" — single, two-shot,
group, over-the-shoulder, POV, insert, establishing, master, reaction. Our brief already lists `framing` and
`camera_distance` as separate fields; AVE justifies that split with a 196K-shot corpus. It also puts
`shot-motion: handheld` in the same slot as camera moves, which supports treating **steadiness as a value of
`camera_motion`**, not a separate style tag.

**What we must NOT copy.** No license, and the media are explicitly not the authors'. The annotation file is
distributed via a Google Drive link and the clips must be re-downloaded with `yt-dlp` from YouTube — a workflow our
brief prohibits us from replicating (no bulk storage of unknown-license media). We take the *field decomposition*,
cite it, and populate values from sources we can license.

**Our differentiation.** AVE annotates shots so a model can propose edits. We decompose a reference so a **human**
can steal four attributes from four different references and see the conflicts. **Reference Mixing** — combining
partial attributes of several references into one prompt with surfaced conflicts — is the thing AVE has no analogue
for.

---

## ShotBench / ShotVL (Vchitect)

| | |
|---|---|
| Repository | [Vchitect/ShotBench](https://github.com/Vchitect/ShotBench) |
| License | UNVERIFIED |
| License verified | No — the [repo root listing](https://github.com/Vchitect/ShotBench/tree/main) shows `assets/`, `evaluation/`, `.gitignore`, `README.md`, `requirements.txt` and **no LICENSE file**; `/blob/main/LICENSE` returns 404. |
| Main function | Benchmark of expert-level cinematic understanding for VLMs: 3,500+ expert-annotated QA pairs over images/clips from 200+ acclaimed films, plus a ~70K-pair ShotQA training set and the ShotVL model |

**Overlap.** ShotBench's eight dimensions are essentially our camera-side taxonomy categories, confirmed verbatim on
the repo page: **Shot Size (SS)**, **Shot Framing (SF)**, **Camera Angle (CA)**, **Lens Size (LS)**,
**Lighting Type (LT)**, **Lighting Conditions (LC)**, **Shot Composition (SC)**, **Camera Movement (CM)**. Note that
it, too, keeps *shot size* and *shot framing* apart, and keeps *composition* as a third, independent dimension —
matching the brief's separate `framing`, `camera_distance`, `composition` fields. The enumerated option values per
dimension are not listed on the repo page (they live in the paper / eval data, which I could not fetch —
`arxiv.org`, `huggingface.co`, `emergentmind.com` all blocked). (UNVERIFIED: the specific option lists.)

**Useful idea.** "Lens Size" as a *categorical* dimension (wide / normal / long / telephoto / macro) rather than a
numeric focal length. This is directly aligned with the brief's hard rule that lens must never be asserted as fact —
render `35mm_like`, not `35mm`. A categorical lens class is defensible from a single frame; a millimetre figure is not.

**What we must NOT copy.** With no license file, we treat ShotBench as read-only prior art: no vendoring of eval
data, no copying of QA text, no reuse of option strings as our shipped vocabulary without independent grounding.

**Our differentiation.** ShotBench measures whether a model *understands* cinematography. We make understanding
*editable*: **Visual Intent** says every input — text, image, video or reference card — converts into the same
user-editable structured schema, so a wrong `camera_angle` guess is a chip the user fixes in one click, not a
benchmark score.

---

## CineTechBench (PRIS-CV)

| | |
|---|---|
| Repository | [PRIS-CV/CineTechBench](https://github.com/PRIS-CV/CineTechBench) |
| License | CC-BY-NC-ND-4.0 (dataset) |
| License verified | Yes — the [repo page states CC BY-NC-ND 4.0](https://github.com/PRIS-CV/CineTechBench), including "You may not use the Dataset for commercial purposes" and "you may not distribute the modified material"; the dataset itself ships metadata + hyperlinks only |
| Main function | Expert-annotated benchmark for cinematographic technique understanding *and generation*: 600+ movie images and 120+ clips across seven dimensions |

**Overlap.** Its seven dimensions — **shot scale, shot angle, composition, camera movement, lighting, color, focal
length** — are a near-exact subset of our taxonomy categories, and it is the only one of these benchmarks that also
evaluates *generation* (i.e. whether a video model actually executes the requested camera move). That makes it the
best existing evidence base for the mapping table our `formatPrompt` will need.

**Useful idea.** The metadata-and-hyperlinks-only distribution model. CineTechBench does not ship the media; it ships
annotations plus links and pushes ToS compliance to the user. That is exactly the brief's rule: *do not store media
binaries in the repo — store URL, thumbnail URL, metadata, embedding, visual attributes only.* Independent
confirmation that a serious research group considers this the correct pattern.

**What we must NOT copy.** **NC-ND is a hard stop for us.** Our License Guard excludes CC BY-NC, CC BY-NC-SA and
CC BY-ND by default, and this is all three constraints at once. We must not import its annotations, must not
redistribute a modified version, and must not let any CineTechBench-derived value reach `approved` status in a
reference record. It is citable prior art and nothing more.

**Our differentiation.** CineTechBench asks a model to *reproduce* a named technique. We let a user say "the camera
work of that video, but the movement of this one" — **Reference Mixing** across two video references — which
requires typed per-attribute provenance that a benchmark has no reason to build.

---

## PySceneDetect

| | |
|---|---|
| Repository | [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect) |
| License | BSD-3-Clause |
| License verified | Yes — [LICENSE file fetched](https://github.com/Breakthrough/PySceneDetect/blob/main/LICENSE): *"BSD 3-Clause License / Copyright (C) 2014, Brandon Castellano"*; the README also states *"PySceneDetect is released under the BSD 3-Clause license"* |
| Main function | Python/OpenCV shot-boundary (cut/transition) detection library and CLI; splits video into scenes with `ffmpeg`/`mkvmerge` and saves representative frames |

**Overlap.** Milestone v0.4 is video analysis, similar-video search and camera-motion extraction. None of that is
meaningful on a whole clip: camera motion is a *per-shot* property, and a 30-second clip with four cuts has four
different `camera_motion` values. PySceneDetect is the segmentation step that must run before analysis.

**Useful idea.** Its detector set maps onto real failure modes we will hit: `ContentDetector` (weighted HSV frame
delta) for hard cuts, `AdaptiveDetector` (two-pass) which the README specifically recommends because it *handles
fast camera movement better* — i.e. it avoids reporting a whip-pan as a cut — and `ThresholdDetector` for fades.
Choosing `AdaptiveDetector` is directly load-bearing for us, because whip pans and crash zooms are exactly the
camera moves users want to extract.

**What we must NOT copy.** BSD-3-Clause is permissive and compatible with using it as a dependency, but it requires
retaining the copyright notice and disclaimer, and forbids using the author's name to endorse our product. If we
ever ship it, it goes in `THIRD_PARTY_NOTICES.md`. We must not copy detector source into `src/` and relabel it.

**Our differentiation.** PySceneDetect gives us shot boundaries; it says nothing about what is *in* a shot. Our
pipeline turns each detected shot into a **Visual Intent** record so the user can answer the brief's own success
case *"Describe my video's camera movement as a prompt"* — and then inherit only the `camera_motion` from it.

---

## rsomani95/shot-type-classifier

| | |
|---|---|
| Repository | [rsomani95/shot-type-classifier](https://github.com/rsomani95/shot-type-classifier) |
| License | CC-BY-NC-4.0 |
| License verified | Yes — the [repo page states](https://github.com/rsomani95/shot-type-classifier) the project is under *"Creative Commons Attribution-NonCommercial 4.0 (CC BY-NC 4.0)"* |
| Main function | ResNet-50 classifier predicting cinema shot type from a single frame |

**Overlap.** Its six classes are a *sixth* variant of the shot-size ladder: **Extreme Wide Shot, Long Shot, Medium
Shot, Medium Close Up, Close Up, Extreme Close Up**, with Wide Shot and Medium Long Shot listed as planned
additions. Note that here "Extreme Wide" is the widest and "Long Shot" is second — a third distinct convention
alongside MovieShots and CineScale.

**Useful idea.** It is the clearest single piece of evidence for our alias requirement. Across three sources we now
have *extreme wide ≈ extreme long shot ≈ ELS*, *wide ≈ long shot* (CineScale) but *long shot = widest*
(MovieShots), and *full shot ≈ medium long shot ≈ American/cowboy shot*. A taxonomy JSON with `id`, `label`,
`aliases[]` and `source_notes` is not optional polish — it is the only way these three corpora can coexist.

**What we must NOT copy.** **NC blocks us.** We cannot ship the weights, cannot bundle it as an analyzer adapter in a
commercial-capable product, and cannot copy its class list as our shipped vocabulary. Cite only.

**Our differentiation.** A frame classifier returns one string. Our `confidence` map returns per-field, per-value
confidence, and the brief mandates that this is a *proposal* the user edits — the difference between an oracle and a
tool.

---

## magcil/movie_shot_classification_dataset

| | |
|---|---|
| Repository | [magcil/movie_shot_classification_dataset](https://github.com/magcil/movie_shot_classification_dataset) |
| License | MIT |
| License verified | Yes — [LICENSE fetched](https://github.com/magcil/movie_shot_classification_dataset/blob/main/LICENSE): *"MIT License / Copyright (c) 2021 magcil"* |
| Main function | 1,803 classified film shots across 10 **camera-movement** classes |

**Overlap.** This is a movement-only taxonomy and its class names are unusually explicit about the axis of motion:
**Static, Handheld, Panoramic, Panoramic_lateral, Vertical_static, Vertical_moving, Travelling_in, Travelling_out,
Zoom in, Aerial** (counts skewed: Static 985, Vertical_moving 37).

**Useful idea.** It separates `Travelling_in` / `Travelling_out` from `Zoom in` — i.e. **dolly ≠ zoom is encoded in
the label set itself**, which is precisely the distinction MovieShots collapses. It also treats `Handheld` and
`Static` as members of the same dimension, supporting a `steadiness` sub-axis inside `camera_motion`. The extreme
class imbalance is a warning for us too: if we ever train or evaluate a camera-motion analyzer, "static" will
dominate and naive accuracy will look great while every interesting move is missed.

**What we must NOT copy.** MIT is permissive for the repo's own contents, but the underlying film shots are
third-party; MIT on a dataset repo does not clear the film clips. We would reuse the *class names* (which are facts,
not expression) with attribution, never the media.

**Our differentiation.** Ten flat classes cannot express "same movement as this video, but the camera work of that
video" — the brief's explicit success case. That requires `motion` (subject) and `camera_motion` (camera) as two
independent inheritable fields, which is **Selective Inheritance**.

---

## ComfyUI-AdvancedCameraPrompts

| | |
|---|---|
| Repository | [jandan520/ComfyUI-AdvancedCameraPrompts](https://github.com/jandan520/ComfyUI-AdvancedCameraPrompts) |
| License | MIT |
| License verified | Yes — [raw LICENSE fetched](https://raw.githubusercontent.com/jandan520/ComfyUI-AdvancedCameraPrompts/main/LICENSE): *"MIT License / Copyright (c) 2025 jandan520"* |
| Main function | ComfyUI node that turns camera parameters into a prompt, emitting both natural language and structured JSON |

**Overlap.** The closest thing to a shipped "camera vocabulary UI" in the open ecosystem, and the closest thing to a
competitor for the *last* stage of our pipeline. Its enumerations, per the repo page: nine angles — Eye Level, High
Angle, Slight Low Angle, Standard Low Angle, Deep Low Angle, Extreme Low Angle, Bird's Eye, Dutch Angle, Dutch Low
Angle; eight shot types spanning Extreme Close-Up (0.3–0.6 m) to Extreme Wide Shot (10–50 m). It outputs a natural
language line ("Pan the camera 45 degrees to the right, high angle medium shot") **and** a JSON object with focal
length, sensor dimensions, distance, tilt/pan/roll angles and shot classification.

**Useful idea.** The **dual output** is the right architecture and independently validates the brief's split:
`StructuredPrompt` is the machine-readable intermediate, `formatPrompt(structuredPrompt, mode)` produces the text.
Keeping both means the JSON survives a change of target model. Its subject-distance ranges per shot size are also a
genuinely useful grounding aid for a visual picker.

**What we must NOT copy.** Two things. (1) The code — MIT permits reuse but the brief prohibits wholesale copying of
external repository code; we implement our own. (2) The epistemics: it *asserts* focal length and sensor size as
facts in its JSON. Our brief is explicit — lens must never be asserted as fact, render `35mm_like`. An emitted
`"focal_length": 35` from a single image is a fabrication.

**Our differentiation.** This node is exactly the "pick a few options → get a prompt" product the brief forbids us
from degrading into. It has no references, no search, no decomposition and no mixing. Our **Unified Modal** — text,
image, video and browse in one modal that never closes mid-exploration — means the camera vocabulary is reached *by
looking at reference images*, not by reading a dropdown.

---

## xoxxel/camera-prompts

| | |
|---|---|
| Repository | [xoxxel/camera-prompts](https://github.com/xoxxel/camera-prompts) |
| License | MIT |
| License verified | Yes — via README license section on the [repo page](https://github.com/xoxxel/camera-prompts): *"This project is licensed under the MIT License"*. (Note: I could not resolve the LICENSE blob at `/blob/main/LICENSE` or `/blob/master/LICENSE` — both 404 from this environment — so the GitHub license label itself is (UNVERIFIED).) |
| Main function | Educational Markdown library of 40+ camera angles and cinematic techniques with example PNGs, grouped into Basic Angles (1–11), Cinematic Techniques (12–23), Advanced Shots (24–40) |

**Overlap.** It is a *visual* camera-angle reference — text term plus example image — which is the same interaction
the brief's north star demands: *"I don't know what Low Angle means — let me choose it visually."*

**Useful idea.** Pairing every vocabulary term with a canonical example image is the single cheapest way to make an
unfamiliar taxonomy usable, and it works with **AI OFF** (v0.1 requires a complete product with no AI). Our
`data/taxonomy/camera.json` entries should carry an `example_reference_id` pointing at a licensed reference card, so
the chip picker is a *gallery*, not a `<select>`.

**What we must NOT copy.** The example PNGs are the risk: a Markdown library under MIT does not clear the film
frames illustrating it. Our example images must come through the License Guard pipeline from Wikimedia Commons or
Openverse with PD/CC0/CC-BY only.

**Our differentiation.** A term→picture lookup is a glossary. Ours is a **Reference Decomposition** surface: clicking
the picture does not paste a word, it inherits a typed attribute from an approved, attributed reference into the mix.

---

## jnMetaCode/ai-shortfilm-prompts

| | |
|---|---|
| Repository | [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts) |
| License | MIT for the skill/templates; **embedded third-party prompts remain "© Mx-Shell, all rights reserved"** |
| License verified | Yes — the [repo page](https://github.com/jnMetaCode/ai-shortfilm-prompts) states MIT for the methodology/templates/skill and that Mx-Shell's original prompts are archived for educational reference only, with commercial reuse requiring direct contact |
| Main function | A Claude Code skill that expands an idea into a model-ready cinematic video prompt; 21 genre templates, a 5-stage structure, a ~50-move camera library, targeting Seedance, Veo 3/3.1, Kling 2.x/3.0, Sora 2, Hailuo, Wan, Pika, Runway Gen-4 |

**Overlap.** Same output artefact as our final stage (a cinematic video prompt), and the same problem of
per-model divergence. Its 5-stage skeleton — core theme → character & scene → atmosphere & quality → **camera rules
(shot type, angle, movement)** → storyboard — is an independent confirmation that camera rules deserve their own
stage rather than being sprinkled into prose.

**Useful idea.** The per-model divergence catalogue: it notes that target models differ in duration ceiling,
negative-prompt support and IP-filter strictness. Our `formatter-*` modules need exactly this — a per-mode
capability record, not just a string template.

**What we must NOT copy.** This repo is the perfect illustration of the licence trap our License Guard exists to
catch: **a permissively-licensed wrapper around all-rights-reserved content**. An automated "MIT, therefore safe"
check would be wrong here. It also advises specifying real Panavision/IMAX lens nomenclature — brand-name lens
claims we must not assert from an image, per the `35mm_like` rule. And its genre "template packs" are the
one-click-prompt pattern the brief forbids.

**Our differentiation.** It generates *from an idea*. We generate *from references the user chose and dissected* —
**Reference Mixing**, with conflicts detected and surfaced rather than blended away by a template.

---

## MiniMax Hailuo — "Director" camera command vocabulary

| | |
|---|---|
| Repository | N/A – closed product ([MiniMax API docs](https://platform.minimax.io/docs/api-reference/video-generation-i2v)) |
| License | proprietary |
| License verified | No — `platform.minimax.io` and `fal.ai` are blocked from this environment; command list assembled from search-surfaced vendor and integrator documentation |
| Main function | Video model that accepts explicit in-prompt camera commands in square brackets |

**Overlap.** This is the most *machine-mappable* camera vocabulary any video model exposes, and therefore the
strongest evidence for what our canonical `camera_motion` values must be able to express. Reported command set
(15 commands, (UNVERIFIED) at source — the official docs page is blocked):
`[Truck left]`, `[Truck right]`, `[Pan left]`, `[Pan right]`, `[Push in]`, `[Pull out]`, `[Pedestal up]`,
`[Pedestal down]`, `[Tilt up]`, `[Tilt down]`, `[Zoom in]`, `[Zoom out]`, `[Shake]`, `[Tracking shot]`,
`[Static shot]`. Syntax: bracketed, combinable inside one bracket set (e.g. `[Truck left, Pan right, Zoom in]`),
recommended maximum 3.

**Useful idea.** Its axis decomposition is textbook-correct and should anchor our canonical ids:
- **Truck** = lateral *translation* (camera body moves left/right) — often called *track* or *crab*.
- **Pan** = *rotation* about the vertical axis (camera body fixed).
- **Pedestal** (a.k.a. *boom*) = vertical *translation*.
- **Tilt** = *rotation* about the horizontal axis.
- **Push in / Pull out** = longitudinal *translation* (dolly in / dolly out).
- **Zoom in / out** = *intrinsic* focal-length change, no translation.
- **Shake** = steadiness, **Tracking shot** = object-referenced follow, **Static shot** = null motion.

That `[Push in]` and `[Zoom in]` are distinct commands in a shipping product is the commercial proof that our
taxonomy must not merge them the way MovieShots does.

**What we must NOT copy.** Proprietary product. We do not copy documentation text or ship their bracket strings as
our canonical ids — the brackets are a *surface form* produced by a formatter mode, downstream of our canonical
values.

**Our differentiation.** Hailuo executes a camera command a human typed. We *derive* the command from a video
reference the user pointed at — "same camera work as that clip" — via **Reference Decomposition**, then let the
formatter emit the bracket syntax.

---

## Kling — `camera_control` API vocabulary

| | |
|---|---|
| Repository | N/A – closed product; parameters mirrored in [griptape-ai/griptape-nodes-library-kling](https://github.com/griptape-ai/griptape-nodes-library-kling) (Apache-2.0) |
| License | proprietary (Kling); the integrator node library is Apache-2.0 |
| License verified | Kling: No (vendor docs and `docs.comfy.org` blocked). Integrator: Yes — the [repo page](https://github.com/griptape-ai/griptape-nodes-library-kling) shows Apache-2.0 |
| Main function | Video model exposing camera motion as a typed API parameter rather than as prose |

**Overlap.** Kling proves that a formatter target may be **numeric, not lexical**. Per the Apache-2.0 node library:
`camera_control_type` ∈ `{(Auto), simple, down_back, forward_up, right_turn_forward, left_turn_forward}`; in
`simple` mode six scalar knobs each in **−10 … 10**: `camera_config_horizontal`, `camera_config_vertical`,
`camera_config_pan` ("rotation around x-axis"), `camera_config_tilt` ("rotation around y-axis"),
`camera_config_roll` ("rotation around z-axis"), `camera_config_zoom`.

**Useful idea.** Two:
1. **Motion intensity is a first-class quantity.** The −10…10 range is precisely our "motion intensity" requirement.
   Our canonical value should carry `{direction, intensity}` where intensity is a normalised 0..1 (or an ordinal
   `subtle | moderate | strong`) that a formatter can scale to −10…10 for Kling, or to an adverb ("slow dolly-in")
   for a prose model.
2. **Named composite moves.** `down_back`, `forward_up`, `right_turn_forward` are *combinations* (translation +
   rotation) with vendor-specific names. Our conflict detector must know that a composite occupies the same slot as
   its components, or a mix will emit contradictory instructions.

⚠️ **Axis-convention warning.** As documented in the integrator library, Kling labels `pan` as rotation around the
**x**-axis and `tilt` as rotation around the **y**-axis. Standard cinematography (and Hailuo's own commands) treat
pan as rotation about the **vertical** axis and tilt about the **horizontal** axis. Whether this is a doc error, a
different axis convention, or genuinely swapped behaviour is unresolved (UNVERIFIED — I could not reach Kling's own
API reference). **Our Kling formatter must be validated empirically before we trust the axis mapping.**

**What we must NOT copy.** Proprietary API semantics; we consume them through an adapter, we do not vendor the
integrator's code (brief: no wholesale copying of external repository code).

**Our differentiation.** Six unlabeled sliders from −10 to 10 are unusable by someone who cannot name the move. The
brief's north star is *"user should never need to know where to search"* — **Visual Intent** means the user points at
a reference and we produce the vector.

---

## Runway (Gen-3 Alpha → Gen-4 / Gen-4.5) camera vocabulary

| | |
|---|---|
| Repository | N/A – closed product ([Camera Terms, Prompts & Examples](https://help.runwayml.com/hc/en-us/articles/47313504791059-Camera-Terms-Prompts-Examples), [Gen-4 Video Prompting Guide](https://help.runwayml.com/hc/en-us/articles/39789879462419-Gen-4-Video-Prompting-Guide)) |
| License | proprietary |
| License verified | No — `help.runwayml.com` is blocked by this environment's egress proxy; content below is from search result snippets and is marked accordingly |
| Main function | Video model family; publishes a reference library pairing camera terminology with text-to-video prompts and their rendered outputs |

**Overlap.** Runway's guidance is **prose-first**: camera motion is prompted as *style* — "locked, handheld, dolly,
pan, and more" — with compound phrases as the working unit. Terms visible in snippets: *handheld low angle tracking
shot*, *whip pan*, *dolly backward shot*, *tilt up shot*, *crash zoom*, *low angle static shot*
(all (UNVERIFIED) at source). The Gen-3 guide also advises **avoiding negative phrasing** such as "the camera doesn't
move" — a static shot must be expressed positively. Gen-3 Alpha Turbo additionally shipped a separate
Camera Control UI with axis controls, i.e. Runway has offered both the lexical and the parametric interface.

**Useful idea.** The composite phrase pattern — `[steadiness] + [angle] + [motion] + "shot"` — is a clean formatter
template that composes several of our canonical fields into one clause, and it explains why our formatter must
compose across fields rather than emit one line per field. The "no negatives" rule is a concrete formatter
constraint: `camera_motion: [static]` must render as "locked-off static shot", never "the camera does not move".

**What we must NOT copy.** Proprietary help-centre text and example media. Runway's own retirement of Gen-3 Alpha
(reported July 2026) is also a reminder that model modes churn — hard-coding a Runway mode violates the brief's rule
that model names/backends must never be hardcoded.

**Our differentiation.** Runway's library is a lookup from term → example video. Ours runs the other direction and
across modalities: **Unified Modal** takes an example *the user already has* and yields the term, the structured
intent, and the mix.

---

## Google Veo 3.1 prompt guide

| | |
|---|---|
| Repository | N/A – closed product ([Ultimate prompting guide for Veo 3.1, Google Cloud Blog](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)) |
| License | proprietary |
| License verified | No — closed product; the guide page itself was fetched successfully, the model is not open |
| Main function | Vendor prompt guide defining a fixed prompt formula and a cinematography vocabulary |

**Overlap.** The only vendor guide I could fetch in full, and it gives us a directly usable formatter target.
Verbatim structure: **`[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`**, with
*Cinematography* defined as "define the camera work and shot composition" and placed **first**.

Enumerated terms in the guide:
- **Camera movement:** dolly shot, tracking shot, crane shot, aerial view, slow pan, POV shot.
- **Composition (size/angle):** wide shot, close-up, extreme close-up, low angle, two-shot, medium shot, high-angle.
- **Lens & focus:** shallow depth of field, wide-angle lens, soft focus, macro lens, deep focus.
- **Additional techniques:** reverse shot, 180-degree arc shot, reverse angle, lens flare.

**Useful idea.** Cinematography-first ordering. Our `formatPrompt` for a Veo-like mode should emit the camera clause
at the head of the prompt, whereas a Hailuo-like mode emits bracketed commands and an LTX-like mode wants a
chronological paragraph. Same `StructuredPrompt`, three genuinely different renderings — which is exactly why the
brief separates `StructuredPrompt` from `formatPrompt(structuredPrompt, mode)`.

Note also that Veo's list mixes framing (*two-shot*), size (*wide/medium/close-up*) and angle (*low/high*) under one
"composition" heading, and mixes lens class with focus behaviour. Our canonical layer must keep them apart and let
the formatter flatten them on the way out — never the reverse.

**What we must NOT copy.** Proprietary guide text and examples.

**Our differentiation.** Veo's guide teaches a human to write a good prompt. **Visual Intent** removes the need to
know the vocabulary at all: the same structured schema is produced whether the user typed, uploaded an image,
uploaded a video, or clicked a reference card.

---

## Wan 2.1 / Wan 2.2 (Alibaba, open weights)

| | |
|---|---|
| Repository | [Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2) (also [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1)) |
| License | Apache-2.0 |
| License verified | Yes — [Wan2.2 README](https://github.com/Wan-Video/Wan2.2/blob/main/README.md): "The models in this repository are licensed under the Apache 2.0 License… We claim no rights over the your generated contents"; same statement in [Wan2.1](https://github.com/Wan-Video/Wan2.1) |
| Main function | Open large-scale video generative models (MoE architecture) trained on aesthetic data labelled for lighting, composition, contrast and colour tone |

**Overlap.** Wan2.2's README states it "incorporates meticulously curated aesthetic data, complete with detailed
labels for lighting, composition, contrast, color tone, and more", enabling "more precise and controllable cinematic
style generation". In other words the *training labels* are a taxonomy very close to our `lighting`, `composition`,
`color` fields — which is why prompts using that vocabulary steer it well.

**Useful idea.** Wan is the strongest candidate for an **AI-OFF-compatible, self-hostable** formatter target, and its
Apache-2.0 licence is compatible with our repo licensing story. Wan2.1 also ships a "prompt extension" step (via
Qwen, local or API) that enriches a short prompt before generation — architecturally the same separation we have
between `StructuredPrompt` and the analyzer/formatter, and a reminder that an expansion step can *overwrite* user
intent if we let it. Our expansion must be a proposal the user can reject.

**What we must NOT copy.** The README does **not** publish an enumerated camera-motion vocabulary; the widely
circulated lists of Wan camera verbs (pan/tilt/dolly/tracking/orbital arcs/crane/whip pan, 80–120 word prompts) come
from third-party guides, not from Alibaba (UNVERIFIED — do not encode them as vendor-supported until confirmed
against official Wan documentation). We must not present community folklore as a vendor contract in our formatter.

**Our differentiation.** Wan is a backend. The brief forbids AI-model-dependent architecture and hardcoded model
names; Wan enters our system only through an adapter and a formatter mode, and everything upstream — **Unified
Modal**, decomposition, mixing — works with it absent.

---

## LTX-Video (Lightricks, open weights)

| | |
|---|---|
| Repository | [Lightricks/LTX-Video](https://github.com/Lightricks/LTX-Video) |
| License | Apache-2.0 (repository); **OpenRAIL-M** (model weights) |
| License verified | Yes — the [repo page](https://github.com/Lightricks/LTX-Video) shows Apache-2.0 for the repo and records the change to "New license for commercial use (OpenRail-M)" for the weights |
| Main function | Real-time DiT video generation model (30 FPS at 1216×704) with an explicit prompt-engineering section |

**Overlap.** LTX's prompting guidance is the *opposite shape* to Hailuo's and Veo's, and that matters for our
formatter modes. From the repo: "focus on detailed, chronological descriptions of actions and scenes… Include
specific movements, appearances, camera angles, and environmental details", structured as "Start with main action in
a single sentence" → "Describe character/object appearances precisely" → "**Specify camera angles and movements**" →
"Describe lighting and colors", all as one flowing paragraph, **within 200 words**, thinking "like a cinematographer
describing a shot list".

**Useful idea.** A hard **length budget** (200 words) and a **chronological** ordering constraint. Our formatter must
therefore support (a) a per-mode token/word budget with a documented drop-order when the `StructuredPrompt` is too
rich, and (b) per-mode field ordering. A generic serializer that dumps every array will blow past LTX's budget and
degrade output.

**What we must NOT copy.** The **licence split is the trap**: Apache-2.0 covers the code, OpenRAIL-M covers the
weights and carries use restrictions. A repo-level licence badge is not the weight licence. This is a
`THIRD_PARTY_REVIEW.md` case, and a reason our License Guard must record *what* an entity licenses, not just a SPDX
string.

**Our differentiation.** LTX wants a shot-list paragraph. Producing one requires knowing the shot — **Reference
Decomposition** produces the typed attributes and the formatter linearises them into LTX's chronological paragraph,
so the user never writes cinematographer prose by hand.

---

## Recommended controlled vocabulary (synthesis)

Canonical ids, with aliases, so that ingesting any of the corpora above is lossless.

**`camera_distance` (shot size)** — 7 canonical steps, anchored on the CineScale ladder because it is the finest
public film-studies grid:

| id | Common labels / aliases | Rough content |
|---|---|---|
| `extreme_long` | ELS, extreme wide shot, EWS, establishing (when wide) | subject tiny in a large environment |
| `long` | LS, wide shot, WS | full figure with substantial environment |
| `medium_long` | MLS, full shot, FS, American shot, cowboy shot, ¾ shot | full body, roughly head-to-knee to head-to-toe |
| `medium` | MS, mid shot | waist or knees up |
| `medium_close_up` | MCU, bust shot | chest/shoulders up |
| `close_up` | CU | head, or one small object |
| `extreme_close_up` | ECU, ECS, detail shot, insert (when detail) | eye, mouth, texture |

Plus two non-ladder members from CineScale that are genuinely useful and often mis-filed: `foreground_shot`
(subject occluding/dominating the near plane) and `insert` (isolated detail cut into a scene).
⚠️ Alias conflict to encode explicitly: **`long shot` maps to `extreme_long` under the MovieShots convention and to
`long` under the CineScale/Runway convention.** Alias tables must be source-scoped.

**`framing`** (independent of size): `single`, `two_shot`, `three_shot`, `group`, `crowd`, `over_the_shoulder`,
`pov`, `insert`, `cutaway`, `establishing`, `master`, `reaction`. Justified by AVE (`shot-type: two-shot` alongside
`shot-size: medium`) and ShotBench (Shot Framing distinct from Shot Size).

**`camera_angle`** (tilt of the optical axis): `overhead` (a.k.a. bird's-eye/top-down), `high`, `neutral`
(eye-level), `low`, `dutch` (canted/oblique). Directly from CineScale2.
**Camera level** (height of the camera body) is a *second* axis: `aerial`, `eye`, `shoulder`, `hip`, `knee`,
`ground`. Since the brief fixes the field list, carry level as a typed sub-value inside `camera_angle`
(e.g. `{axis: "level", value: "ground"}`) rather than inventing a field.

**`camera_motion`** — structured, not a flat string. Shape: `{primitive, axis, direction, intensity, reference_frame}`.

| Group | Canonical primitives | Note |
|---|---|---|
| Translation | `dolly_in` / `dolly_out` (Z), `truck_left` / `truck_right` (X), `pedestal_up` / `pedestal_down` (Y) | aliases: push in/out, track in/out; crab/track left-right; boom up/down |
| Rotation | `pan_left` / `pan_right` (yaw), `tilt_up` / `tilt_down` (pitch), `roll_cw` / `roll_ccw` | pan/tilt are rotations from a fixed position |
| Intrinsic | `zoom_in` / `zoom_out` | focal length change only — **no translation, no parallax** |
| Composite | `arc_left` / `arc_right` / `orbit`, `crane_up` / `crane_down`, `dolly_zoom` | dolly_zoom = simultaneous opposite dolly + zoom |
| Following | `tracking` / `follow`, `lead`, `side_track`, `aerial_follow` | object-centric reference frame |
| Steadiness | `static`, `smooth`, `handheld`, `shaky`, `whip` (whip pan / crash zoom as speed-extreme variants) | AVE files `handheld` under `shot-motion` |

**Motion intensity** (`camera_motion.intensity` and `motion.speed`): ordinal `subtle | moderate | strong` mapped to a
normalised 0..1 scalar. Formatter targets: Kling `−10…10`, prose adverbs ("slow", "rapid"), or omitted.

**The dolly-in vs zoom-in rule (write this into `data/taxonomy/camera.json` as a doc string):**
a **dolly/push-in** physically moves the camera forward — perspective changes, parallax shifts, the background
relationship changes, the subject's relation to the space changes. A **zoom-in** changes focal length from a fixed
position — no parallax, the background *compresses* and appears to flatten and enlarge with the subject. They look
different and they read emotionally differently. Every taxonomy that keeps them apart (Hailuo, magcil, CameraBench's
extrinsic/intrinsic split) is usable; every taxonomy that merges them (MovieShots' "push = zooms in") loses
information that our formatter cannot reconstruct.

---

## UX patterns to avoid

- **The 40-item flat dropdown.** Both `xoxxel/camera-prompts` (40+ terms) and `ComfyUI-AdvancedCameraPrompts`
  (9 angles × 8 shot types) present vocabulary as a list of words. The brief's north star is the opposite: *"I don't
  know what Low Angle means — let me choose it visually."* Every camera chip must be selectable from an example image.
- **Unlabeled numeric sliders.** Kling's six `−10…10` knobs are unusable without knowing the axis convention (which
  is itself ambiguous). Never expose a raw axis value as the primary control; expose a named move plus an intensity.
- **Genre template packs / one-click prompts.** `ai-shortfilm-prompts` ships 21 genre templates. That is precisely
  the "pick a few options → get a prompt" degradation the brief forbids. Templates may exist as *starting
  references*, never as the product's main path.
- **A single free-text "camera" box.** Runway-style compound phrases ("handheld low angle tracking shot") are a
  great *output*, a terrible *input model* — they cannot be diffed, so **Search by Difference** ("keep camera, change
  clothing") becomes impossible.
- **Asserting numeric optics.** Emitting `"focal_length": 35` or a Panavision model name from a single frame is
  fabrication. Render `35mm_like`; keep lens categorical.
- **Silently merging conflicting camera moves.** If reference A contributes `dolly_in` and reference B contributes
  `zoom_in`, the mixer must surface the conflict and ask which is dominant — never emit both (most models degrade
  with more than one move; Hailuo caps combined commands at ~3, and community guidance for Kling is one clean move
  per generation (UNVERIFIED)).
- **Negative camera phrasing.** "The camera doesn't move" is explicitly discouraged by Runway's guide. `static` must
  render positively ("locked-off static shot").
- **Treating an analyzer's output as final.** Every dataset above resolves ambiguity by *abstaining*
  (CameraBench's "I am not sure"). Our chips must show confidence and stay editable.

## Reusable patterns

1. **Canonical id + source-scoped aliases + per-model surface form** — a three-layer taxonomy. Layer 1
   `shot_size.medium_long`; layer 2 aliases `{cinescale: "MLS", movieshots: "FS", practice: ["full shot","American shot"]}`;
   layer 3 formatter output per mode. Without layer 2 the three corpora above cannot be reconciled.
2. **Reference-frame–qualified motion** (CameraBench): represent "tracking" as a translation in an object-centric
   frame rather than as a sibling of "dolly". Collapses a dozen ad-hoc labels into a small orthogonal set.
3. **Orthogonal angle and level axes** (CineScale2): two independent values, not one merged enum.
4. **Framing separate from size** (AVE, ShotBench): `two_shot` and `medium` are simultaneously true.
5. **Label-then-caption with explicit abstention** (CameraBench): populate only confident fields, leave the rest
   unset, attach free text — a direct implementation recipe for our `confidence` map.
6. **Shot-boundary segmentation before attribute extraction** (PySceneDetect, `AdaptiveDetector` for fast camera
   movement): v0.4's video analyzer should be *detect shots → per-shot VisualIntent → aggregate*, not one label per clip.
7. **Dual output: structured JSON + natural language** (ComfyUI-AdvancedCameraPrompts): validates
   `StructuredPrompt` → `formatPrompt(structuredPrompt, mode)`.
8. **Metadata-and-hyperlinks-only distribution** (CineTechBench): confirms the brief's no-media-in-repo rule is
   standard practice, not a limitation.
9. **Per-mode capability record** (from `ai-shortfilm-prompts`' per-model notes and LTX's 200-word limit): each
   formatter mode declares word budget, field ordering, negative-prompt support and max simultaneous camera moves.
10. **Example image per vocabulary term** (`xoxxel/camera-prompts`): makes the taxonomy usable with AI OFF, which
    v0.1 requires.

## Hard technical facts

- **CameraBench** is licensed **CC-BY-4.0** (LICENSE file verified). Public test set is **1,000+ videos** with expert
  labels and captions; **~1,400 extra annotated clips** used for SFT; fine-tuned judges released at **7B / 32B / 72B**
  on Qwen2.5-VL. Taxonomy axes: reference frame (object-/ground-/camera-centric), translation, rotation, intrinsic
  change, circular motion, steadiness, tracking.
- **CineScale**: 9 shot-scale classes (ECU, CU, MCU, MS, MLS, LS, ELS, FS, IS) over **792,000+ frames** from
  **124 films** by 6 directors. **CineScale2**: camera **angle** ∈ {Overhead, High, Neutral, Low, Dutch} and camera
  **level** ∈ {Aerial, Eye, Shoulder, Hip, Knee, Ground} over **~25,000 frames**. (UNVERIFIED at source — all hosting
  domains blocked here.)
- **MovieShots**: **46K shots** from **7K trailers**; scale ∈ {LS, FS, MS, CS, ECS}; movement ∈ {static, motion,
  push, pull}, where *push* is defined as "camera zooms in" — a documented dolly/zoom conflation.
- **AVE**: **196,176 shots**, **>1.5M** manual tags. Annotation JSON keys confirmed from the raw README:
  `clip-type`, `start-time`, `end-time`, `shot-size`, `shot-angle`, `shot-type`, `shot-motion`, `shot-subject`,
  `shot-location`, `num-people`, `sound-source`. **No license file.**
- **ShotBench**: 8 dimensions — Shot Size, Shot Framing, Camera Angle, Lens Size, Lighting Type, Lighting
  Conditions, Shot Composition, Camera Movement; **3,500+** expert QA pairs from **200+** films; ShotQA ≈ **70K**
  pairs. **No LICENSE file in the repo root.**
- **CineTechBench**: **CC-BY-NC-ND-4.0**; 7 dimensions (shot scale, shot angle, composition, camera movement,
  lighting, color, focal length); **600+** images, **120+** clips; distributes metadata + hyperlinks only.
- **PySceneDetect**: **BSD-3-Clause**, "Copyright (C) 2014, Brandon Castellano". `ContentDetector` = weighted HSV
  frame delta; `AdaptiveDetector` = two-pass, better for fast camera movement; `ThresholdDetector` = fades.
- **magcil/movie_shot_classification_dataset**: **MIT** (Copyright (c) 2021 magcil); **1,803** shots across 10 classes
  (Static 985 … Vertical_moving 37); keeps `Travelling_in/out` distinct from `Zoom in`.
- **rsomani95/shot-type-classifier**: **CC-BY-NC-4.0**; 6 classes (Extreme Wide, Long, Medium, Medium Close Up,
  Close Up, Extreme Close Up); ResNet-50.
- **MiniMax Hailuo Director**: 15 bracketed camera commands (`[Truck left/right]`, `[Pan left/right]`,
  `[Push in]`/`[Pull out]`, `[Pedestal up/down]`, `[Tilt up/down]`, `[Zoom in/out]`, `[Shake]`, `[Tracking shot]`,
  `[Static shot]`); combinable inside one bracket set; recommended max **3**. **`[Push in]` ≠ `[Zoom in]`.**
  (UNVERIFIED at source — vendor docs blocked.)
- **Kling**: `camera_control_type` ∈ {`(Auto)`, `simple`, `down_back`, `forward_up`, `right_turn_forward`,
  `left_turn_forward`}; `simple` mode exposes `horizontal`, `vertical`, `pan`, `tilt`, `roll`, `zoom`, each
  **−10 … 10**. Documented as `pan` = rotation around **x**-axis, `tilt` = rotation around **y**-axis — inverted
  relative to standard cinematographic convention; **verify empirically before shipping the mapping.**
- **Veo 3.1** prompt formula: **`[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`**, camera
  clause first. Vocabulary published in the guide: dolly / tracking / crane / aerial view / slow pan / POV;
  wide / medium / close-up / extreme close-up / low angle / high-angle / two-shot; shallow DoF / wide-angle lens /
  soft focus / macro lens / deep focus; reverse shot, 180-degree arc shot, reverse angle, lens flare.
- **Runway**: camera motion prompted as style — "locked, handheld, dolly, pan, and more"; compound phrases such as
  "handheld low angle tracking shot", "whip pan", "crash zoom"; **avoid negative phrasing** like "the camera doesn't
  move". Gen-3 Alpha retired 8 July 2026, Gen-3 Alpha Turbo retired 30 July 2026. (UNVERIFIED at source — help centre blocked.)
- **Wan2.2 / Wan2.1**: **Apache-2.0**, "We claim no rights over the your generated contents." Trained with aesthetic
  labels for lighting, composition, contrast and colour tone. Wan2.1 ships an optional Qwen-based prompt-extension step.
- **LTX-Video**: repo **Apache-2.0**, weights **OpenRAIL-M**; 30 FPS at 1216×704; prompt guidance = single
  chronological paragraph, **≤200 words**, order: main action → appearances → **camera angles and movements** →
  lighting and colours.

## Open questions

1. **CineScale / CineScale2 licence.** Everything hinges on this if we want to reuse the 9-class scale ladder or the
   angle/level split as *data* rather than as cited vocabulary. Needs a fetch of the *Data in Brief* articles or the
   Mendeley Data records from an unblocked environment.
2. **Kling's pan/tilt axis convention.** Doc error or genuine? An empirical A/B generation is the only way to settle
   it, and our Kling formatter is wrong 50% of the time until it is settled.
3. **CameraBench's full ~50-primitive list.** We have the axes but not the leaf values. Required before we finalise
   `data/taxonomy/motion.json`. Source: the NeurIPS 2025 paper (blocked here).
4. **ShotBench / AVE licensing.** Both repos lack a licence. Do we treat "no licence" as all-rights-reserved (the
   safe default, and consistent with our own policy that unknown licence is excluded) and cite only?
5. **Which video models actually distinguish dolly-in from zoom-in in behaviour**, not just in vocabulary? Hailuo
   exposes both commands, but we have no evidence about the rendered result. This determines whether the distinction
   is worth preserving through the formatter for every mode or only some.
6. **Does an over-specified camera clause hurt?** Runway warns that keywords must be cohesive with the prompt; LTX
   caps at 200 words. We need a per-mode drop-order policy for when a mix produces more camera detail than a model
   can absorb.
7. **Where do `composition` and `framing` divide?** ShotBench treats Shot Composition as a ninth dimension separate
   from framing and size; our brief has both `framing` and `composition`. We need a written rule (proposal:
   `framing` = subject count/relationship; `composition` = spatial organisation — rule of thirds, symmetry, leading
   lines, negative space, centred).
8. **Motion intensity scale.** Ordinal (`subtle/moderate/strong`) or continuous 0..1? Kling needs a number, prose
   models need an adverb. Which is canonical and which is derived?

## Evidence log

URLs actually fetched in this research pass:

- https://github.com/magcil/movie_shot_classification_dataset
- https://github.com/magcil/movie_shot_classification_dataset/blob/main/LICENSE
- https://github.com/Breakthrough/PySceneDetect
- https://github.com/Breakthrough/PySceneDetect/blob/main/LICENSE
- https://github.com/dawitmureja/AVE
- https://raw.githubusercontent.com/dawitmureja/AVE/main/README.md
- https://github.com/sy77777en/CameraBench
- https://github.com/sy77777en/CameraBench/tree/main
- https://github.com/sy77777en/CameraBench/tree/main/templates
- https://raw.githubusercontent.com/sy77777en/CameraBench/main/LICENSE
- https://raw.githubusercontent.com/sy77777en/CameraBench/main/README.md
- https://github.com/Vchitect/ShotBench
- https://github.com/Vchitect/ShotBench/tree/main
- https://github.com/PRIS-CV/CineTechBench
- https://github.com/rsomani95/shot-type-classifier
- https://github.com/sssabet/Shot_Type_Classification
- https://github.com/movienet/movienet-tools
- https://github.com/xoxxel/camera-prompts
- https://github.com/jandan520/ComfyUI-AdvancedCameraPrompts
- https://raw.githubusercontent.com/jandan520/ComfyUI-AdvancedCameraPrompts/main/LICENSE
- https://github.com/jnMetaCode/ai-shortfilm-prompts
- https://github.com/griptape-ai/griptape-nodes-library-kling
- https://github.com/Wan-Video/Wan2.2/blob/main/README.md
- https://github.com/Wan-Video/Wan2.1
- https://github.com/Lightricks/LTX-Video
- https://github.com/snubroot/Veo-3-Prompting-Guide
- https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1

Attempted but **blocked by this environment's egress proxy** (claims sourced from these are marked UNVERIFIED and
rest on search-result snippets only): `movienet.github.io`, `www.ecva.net`, `arxiv.org`, `ar5iv.labs.arxiv.org`,
`openreview.net`, `huggingface.co`, `www.semanticscholar.org`, `www.alphaxiv.org`, `www.emergentmind.com`,
`cinescale.github.io`, `linzhiqiu.github.io`, `joonyoung-cv.github.io`, `www.sciencedirect.com`,
`www.ncbi.nlm.nih.gov`, `dl.acm.org`, `iris.unibs.it`, `data.mendeley.com`, `help.runwayml.com`, `fal.ai`,
`platform.minimax.io`, `docs.comfy.org`, `platform.openai.com`, `en.wikipedia.org`, `docs.cloud.google.com`.
