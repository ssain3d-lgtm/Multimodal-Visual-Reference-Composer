# Research Cluster: Visual Prompt Galleries and Reference-Browsing Products

> Research date: 2026-09-09. Scope: the "browse references visually" neighbourhood — AI prompt
> galleries (Lexica, PromptHero, OpenArt, Civitai), commercial selective-reference features
> (Midjourney `--sref` / `--oref`, Krea 2 style references, OpenAI / Gemini reference images),
> film & photo reference libraries (ShotDeck, Film-Grab, Cinekive), and general reference managers
> (Pinterest, Are.na, Eagle, Pinry, Hydrus, Diffusion Toolkit).

## Why this cluster matters to us

This is the closest existing behaviour to the front half of our pipeline
(`TEXT / IMAGE / VIDEO / REFERENCE CARD -> UNIFIED VISUAL INTENT -> SIMILAR REFERENCE SEARCH`).
Every product here has independently confirmed one thing we assume in the brief: **people pick visual
direction by looking, not by reading dropdowns.** Grids of real frames beat taxonomies of words, and
ShotDeck proves that even professionals with precise vocabulary ("2.39:1, night exterior, teal-and-orange")
still want to *see* the result set.

But the entire cluster stops at the same wall, and that wall is our product. Every one of these tools
treats a reference as an **atom**: you can copy a whole prompt (Lexica, PromptHero, OpenArt, Civitai),
pin a whole board (Pinterest, Are.na, Eagle), or hand an entire image to a model as a single style blob
(`--sref`, Krea S-Refs, Gemini multi-image blending). **Not one of them lets you take only the lighting
from image A and only the outfit from image B.** The closest commercial analogue — Midjourney's
`--sref` plus `--oref` split — is a *two-slot* decomposition (subject vs. look), it is opaque
(`--sref 3847291` is a pointer into latent space, not an editable description), and it cannot be
inspected, corrected or recombined per category.

That gap maps one-to-one onto brief pillars 3, 4 and 5 (**Reference Decomposition**, **Selective
Inheritance**, **Reference Mixing**) plus **Search by Difference**. This cluster is therefore not a
competitor set to imitate — it is the evidence that the demand exists and that the decomposition step
is missing everywhere.

A second, equally important output of this research: **most of these products are legally unusable as
data sources for us.** Pinterest, Instagram, TikTok and Civitai all contractually prohibit automated
extraction, and ShotDeck/Film-Grab are built on third-party film copyright. That directly reinforces the
brief's provider priority (Wikimedia Commons, then Openverse) and the License Guard pipeline.

---

## Lexica

| | |
|---|---|
| Repository | N/A - closed product (`https://lexica.art`). Community client: `transitive-bullshit/lexica-api` |
| License | Product: proprietary (UNVERIFIED - lexica.art blocked by egress policy). Client wrapper: MIT |
| License verified | Partial — MIT verified for `transitive-bullshit/lexica-api` via the GitHub license label; product ToS **not** verified |
| Main function | Search engine over 10M+ Stable Diffusion images where every result exposes its full prompt; CLIP-embedding similarity search and reverse-image search |

**Overlap.** Lexica is the canonical "search visually, get a prompt" loop and the direct ancestor of the
naive version of our idea. Its reverse-image search (`GET https://lexica.art/api/v1/search?q=<image URL>`,
returning ~50 results) is a primitive form of our *image -> similar reference search* step, and its
CLIP-embedding index is the same architectural family as our `semantic-search` module.

**Useful idea.** Two things are worth carrying over. First, **prompt metadata is the payload, not the
image** — Lexica's value is that the text behind every image is visible and copyable; ours is that the
*structured attributes* behind every image are visible and copyable. Second, **one query box, two
modalities**: the same `q` parameter takes either text or an image URL. That is a miniature proof of
brief pillar 1 (Unified Modal) — the mode changes, the surface does not.

**What we must NOT copy.** Do not mirror or bulk-ingest Lexica's index. Its corpus is user-generated
Stable Diffusion output with no per-image license provenance, which fails our License Guard at the
`LICENSE CHECK` stage and can never reach `approved`. Also do not copy its output contract: a Lexica
result is an opaque prompt string, which is exactly the "whole blob, take it or leave it" failure mode
the brief forbids.

**Our differentiation.** Lexica gives you a *whole prompt*; we give you a **decomposed reference**. A
Lexica hit is one string; our hit is a `Reference` object with typed `visual_attributes`, and the user
runs `EXTRACT` on it to take composition only. Lexica cannot express "same lighting, different outfit";
our **Search by Difference** (KEEP/CHANGE categories) is a first-class query type.

Sources: [Lexica Search API docs (referenced)](https://lexica.art/docs) ·
[lexica-api wrapper](https://github.com/transitive-bullshit/lexica-api) ·
[lablab.ai Lexica tutorial](https://lablab.ai/ai-tutorials/stable-diffusion-lexica)

---

## PromptHero

| | |
|---|---|
| Repository | N/A - closed product (`https://prompthero.com`) |
| License | proprietary (UNVERIFIED - prompthero.com blocked by egress policy) |
| License verified | false |
| Main function | Prompt search engine across Midjourney / Stable Diffusion / DALL-E / ChatGPT, with model filters, curated collections and a paid generation tier |

**Overlap.** PromptHero already ships a crude version of our facets: users search by "keyword, subject
matter, artist style, or camera technique" and filter by target model. The per-model filter is a
distant cousin of our `formatPrompt(structuredPrompt, mode)` — the recognition that the same intent must
be rendered differently for Flux vs. Midjourney vs. SD.

**Useful idea.** *Model-aware output.* PromptHero adapts prompt syntax per model. Our brief already
plans `formatter-generic` first and `flux / qwen-image / sd / gpt-image / minimax-h3 / krea` later; this
validates that the formatter must be a swappable module and never baked into the composer.
Also worth noting: PromptHero monetises an **API by request volume** (documented publicly as free tier
then per-request pricing), i.e. the prompt corpus itself is the product — a business model we
deliberately do not want, because it pushes toward hoarding scraped content.

**What we must NOT copy.** The taxonomy is presentational, not structural: "camera technique" is a
search keyword, not a typed field with a controlled vocabulary and a confidence value. Copying that
shape would collapse us into the "pick a few options -> get a prompt" product the brief explicitly
prohibits. Also, no ingestion of their prompt DB.

**Our differentiation.** PromptHero's filters *narrow a list of finished prompts*. Our taxonomy
(`data/taxonomy/{framing,camera,lens,pose,motion,clothing,scene,lighting,style}.json`) is the **schema of
the artefact itself** — it is what makes **Reference Decomposition** possible, so an attribute can be
lifted out of one reference and inherited into a new one.

Sources: [PromptHero review / feature breakdown](https://www.futurepedia.io/tool/prompthero) ·
[PromptHero pricing summary](https://www.neura.market/directories/ai-tools/prompthero)

---

## OpenArt (prompt library + Prompt Book)

| | |
|---|---|
| Repository | N/A - closed product (`https://openart.ai`) |
| License | proprietary (UNVERIFIED - openart.ai not fetched; egress policy) |
| License verified | false |
| Main function | Gallery of 10M+ community creations where each image exposes its full prompt and settings, plus a "remix" action and an educational Prompt Book |

**Overlap.** OpenArt's "click any image -> see its full prompt setup -> remix it in a few clicks" is the
single closest UX to our `USE (everything)` action on a reference card. It is the whole-blob branch of
our Explore menu, already shipped.

**Useful idea.** **Remix as the default verb.** OpenArt treats a gallery item as a *starting state* for
a new generation rather than as a finished artefact. That is exactly the mental model our
`ReferenceMix` needs — a reference card is an input, not a destination. Their Prompt Book also shows the
value of teaching vocabulary alongside the tool, which supports our UX north star case
*"I don't know what this lighting is called — let me pick it by looking at pictures."*

**What we must NOT copy.** OpenArt's remix is all-or-nothing: you inherit the whole prompt string and
then hand-edit text. That is text surgery, not attribute surgery, and it is precisely the degradation
path the brief bans. Do not copy their gallery content or Prompt Book text.

**Our differentiation.** Our remix is **Selective Inheritance**: `{"reference_id":"img_A","use":["composition","camera_angle"]}`.
OpenArt cannot express "take these two categories and nothing else", and it has no concept of a
*conflict* between two sources — our `ReferenceMix` detects and surfaces category conflicts instead of
silently concatenating strings.

Sources: [OpenArt gallery/prompt features](https://ec-arts.com/openart-ai-review-prompt-gallery-filters/) ·
[OpenArt review 2026](https://promptsrush.com/blog/openart-review)

---

## Civitai (images / prompts)

| | |
|---|---|
| Repository | `civitai/civitai` |
| License | Apache-2.0 (application code only — **not** the hosted content) |
| License verified | **true** — read `LICENSE` at [raw.githubusercontent.com/civitai/civitai/main/LICENSE](https://raw.githubusercontent.com/civitai/civitai/main/LICENSE) (Apache License, Version 2.0) and confirmed by the GitHub license label (`spdx_id: Apache-2.0`) |
| Main function | Community platform for AI models and AI-generated media; public REST API at `/api/v1/` exposes models, model versions, images, creators and tags, with image prompt metadata attached |

**Overlap.** Civitai is the largest structured store of `image + generation metadata` pairs in the
open, and its API surface (`/api/v1/images`, `/api/v1/models`, `/api/v1/tags`) is the shape our
`src/providers/*.js` interface (`search`, `getMetadata`, `getPreview`) is modelled on. It is also a live
example of the tag + reaction-count ranking signals a fusion ranker could consume.

**Useful idea.** The **provider adapter contract** itself: Civitai's API demonstrates that a reference
provider needs three separable capabilities — list/search with filters, fetch full metadata for one id,
and fetch a preview/thumbnail — which is exactly the three-method interface the brief specifies. Their
per-model `allowCommercialUse`-style permission flags (UNVERIFIED — I could not fetch the API schema;
civitai.com and developer.civitai.com are blocked by the egress policy) are also a reminder that
**license/permission must be a first-class field on every record**, not a footnote.

**What we must NOT copy.** Two hard lines. (1) **Do not bulk-export Civitai content.** Their ToS
prohibits accessing the service via "spiders, robots, crawlers, and data mining tools" except through
expressly provided interfaces — the public API or their MCP server — with valid credentials and within
rate limits. The many third-party bulk scrapers that exist (e.g. `hassan-sd/civitai-image-scraper`,
which pulls images above a reaction threshold and writes prompts out as caption files for training) are
a pattern to **avoid**, not to follow; that repo also ships **no license file at all**, so its code is
"all rights reserved" by default and must not be vendored. (2) Do not copy Apache-2.0 application code
into our repo without complying with attribution/NOTICE obligations in `THIRD_PARTY_NOTICES.md` — and
we should not need to.

**Our differentiation.** Civitai stores *generation parameters* (prompt, sampler, seed). We store
*perceptual attributes* (`lighting`, `composition`, `camera_angle`, `clothing`, ...) that are model-agnostic
and, crucially, **editable**. A Civitai prompt cannot be queried by "same framing, different outfit";
our **Search by Difference** and **Reference Mixing** operate on the attribute layer, and our
License Guard means we never hold a corpus of unknown-license images in the first place.

Sources: [civitai/civitai repo](https://github.com/civitai/civitai) ·
[LICENSE (Apache-2.0)](https://raw.githubusercontent.com/civitai/civitai/main/LICENSE) ·
[Civitai ToS anti-scraping clause (via search)](https://civitai.com/content/tos) ·
[civitai-image-scraper (anti-pattern)](https://github.com/hassan-sd/civitai-image-scraper)

---

## Midjourney Style Reference (`--sref`) and Omni Reference (`--oref`)

| | |
|---|---|
| Repository | N/A - closed product (`https://docs.midjourney.com`, blocked by egress policy) |
| License | proprietary (UNVERIFIED) |
| License verified | false |
| Main function | Attach one or more images (or a numeric style code) to a prompt so the model inherits their aesthetic (`--sref`) or their subject identity (`--oref`), with per-reference weights |

**Overlap.** This is **the nearest commercial analogue to Selective Inheritance** and the most important
entry in this cluster. Midjourney has explicitly split a reference into two channels:

- `--sref <url|code>` — *style*: "palette, light and finish, not the subject". Strength `--sw`, range
  0–1000, default 100. Multiple references can be weighted inline: `--sref URL1::2 URL2::1 URL3::1`.
  Algorithm version selected with `--sv` (`--sv 6` is the default for V7). `--sref random` assigns a
  random code, which is then rewritten into the prompt as a concrete `--sref <number>`.
- `--oref <url>` — *Omni Reference*: pins the **subject**. Strength `--ow`, range 1–1000, default 100;
  low values (25–50) allow stylization, high values (400+) enforce strict adherence. Midjourney's own
  guidance is to combine `--oref` with `--sref` for consistent sequences, and the same image can be
  passed as both.

So the industry has already conceded the core premise: *one reference should not have to contribute
everything.*

**Useful idea.** Three concrete borrowings. (1) **Per-reference weights**, including the `::n` inline
syntax — our `ReferenceMix` conflict resolution ("which reference is dominant?") is a categorical
version of the same control. (2) **A named strength scale with a documented default** (0–1000, default
100) is far more usable than an unlabelled slider. (3) **The subject/style split is the minimum viable
decomposition** and it validates that users understand and want per-channel control.

**What we must NOT copy.** The failure mode is the point of our product:
- **Opaque.** An sref code is a pointer into Midjourney's learned style space. You cannot decompose
  `3847291` into "warm colour temperature + chiaroscuro lighting + analog grain"; it is a black box, so
  you gain a tool but not knowledge — you cannot modify it incrementally, explain it, or carry it to
  another model.
- **Single-blob.** `--sref` bundles palette + light + texture + finish into one undifferentiated
  channel. You cannot take the *lighting* from one sref and the *colour* from another.
- **Two categories only.** Subject vs. style. There is no framing channel, no clothing channel, no
  camera-motion channel.
- **Not editable.** There is no intermediate representation for the user to inspect or correct — which
  violates our rule that *AI output is a proposal, never a commitment.*
- **Leaky.** Community documentation repeatedly notes that costume elements, props and accessories
  "often merge into" the output despite the claim that style reference does not copy objects — i.e. the
  channel separation is statistical, not structural.

Also: do not build a `--sref` code database or resell codes; that is a Midjourney-account-bound artefact
with no license we can rely on.

**Our differentiation.** `--sref` is a **two-slot, opaque, non-editable** decomposition. Ours is an
**N-category, human-readable, user-editable** one: the `VisualIntent` schema has 19 typed array fields
plus `confidence`, every field is exposed as an editable chip, and `ReferenceMix` names exactly which
categories come from which reference. Midjourney cannot answer "same movement as this video, but the
camera work of that video"; **Reference Mixing** across image *and video* references is our pillar 5.
Note also our lens rule — we render `35mm_like`, never the false certainty of `35mm` — precisely because
inherited style channels are inferences, not facts.

Sources: [Midjourney Style Reference docs (blocked, cited via search)](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) ·
[`--sref` weights and `--sv` explainer](https://prompt-architects.com/blog/214-style-references-in-midjourney-sref-explained) ·
[`--oref` / `--ow` guide](https://imigo.ai/en/media/omni-reference-in-midjourney-v7) ·
[sref codes are opaque — deep dive](https://midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes) ·
[sref codes critique](https://aikizi.com/learn/blog/midjourney-style-codes-explained)

---

## Krea 2 style references and moodboards

| | |
|---|---|
| Repository | N/A - closed product (`https://krea.ai`) |
| License | proprietary (UNVERIFIED) |
| License verified | false |
| Main function | Image model with a dedicated style-transfer slot: drop reference images into the prompt box and the model extracts "palette, line work, texture, lighting, composition language" and applies them to a new prompt; supports multiple weighted references, custom style training, and moodboards |

**Overlap.** Krea is the most ambitious commercial version of "mix several references". Reported
capabilities: style references transfer the style of **up to four images with per-image strength
controls**, while other sources report **up to 10 style images each with its own adjustable weight,
including negative weights** that push output *away* from a reference (numbers conflict across sources —
see Open Questions). Krea also supports training a custom style and then using it as a style reference,
and exposes a moodboard surface — the same conceptual object as our future `Visual Recipe`.

**Useful idea.** **Negative reference weights.** "Less like this one" is a genuinely powerful control we
had not specified, and it composes naturally with our category model: a negative weight *scoped to a
category* ("keep this lighting, actively avoid that colour palette") is strictly more expressive than
Krea's whole-image negative. Also: Krea's public claim that they spent as much effort on the style
transfer system as on the foundation model is a useful argument that **reference handling is a product,
not a feature**.

**What we must NOT copy.** Krea's extraction is still a **single latent style blob per image**: it names
the components it captures ("palette, line work, texture, lighting, composition language") but does not
let you *select among them*. There is no UI to say "from this image, lighting only". Do not copy their
model weights, LoRAs, or any Krea-derived style artefacts.

**Our differentiation.** Krea mixes references **image-wise**; we mix them **attribute-wise**. Their
weight is per-image; our selection is per-category (`use: ["composition","camera_angle"]`), and conflicts
between references contributing to the same category are **detected and surfaced, never auto-resolved**.
Krea also has no equivalent to the brief's **Unified Modal** — style transfer, generation and moodboards
are separate surfaces; ours is one modal whose state persists across mode switches.

Sources: [Style references in Krea 2](https://www.krea.ai/blog/style-references-krea-2) ·
[Krea 2 deep dive: exploration, style references, moodboards](https://www.krea.ai/blog/krea-2-deep-dive-walkthrough) ·
[Krea 2 style refs + moodboards summary](https://morphic.com/resources/tools/krea-2-ai-image-generator)

---

## ShotDeck

| | |
|---|---|
| Repository | N/A - closed product (`https://shotdeck.com`, blocked by egress policy) |
| License | proprietary, subscription-only; underlying images are third-party film copyright (UNVERIFIED) |
| License verified | false |
| Main function | Hand-tagged, fully searchable library of HD film/TV/commercial stills, filterable by craft attributes, with shareable "decks" |

**Overlap.** ShotDeck is the **strongest existing proof of Reference Decomposition as a product**, just
done by humans instead of models. Reported: every image is hand-tagged across **30+ categories with 50+
keywords**, covering crew, genre, cameras, lenses, framing, lighting, colour, composition, locations and
emotion. Filters compose — "teal and orange + night exterior + 2.39:1" returns frames matching all three
at once. That is our `metadata-search` module, validated at professional scale.

**Useful idea.** (1) **The category list is the product.** ShotDeck's tag vocabulary is close to our
required taxonomy (Framing, Camera Angle, Lens, Lighting, Composition, Colour, Mood, Scene, Time,
Weather) and confirms that this decomposition is how practitioners actually think. (2) **Decks** — a
saved, shareable *set of references* — is the interaction our `Visual Recipe` should beat, by saving the
*combination rule* (`{name, references, intent, prompt_mode}`) and not merely the images. (3) Multi-facet
AND-filtering with live visual results is the AI-OFF experience we owe users in v0.1.

**What we must NOT copy.** Do not build a corpus of film stills. ShotDeck's library is film screenshots;
we have no license to any of it, and the brief's default-allow list is PD/CC0/CC BY (optionally CC BY-SA).
Do not scrape ShotDeck, and do not treat "everyone does it" as a defence — a paid, gated library is
exactly the kind of source that generates both ToS and copyright exposure.

**Our differentiation.** ShotDeck lets you *find* a frame with the lighting you want; it stops there. It
cannot compose: there is no way to say "this frame's lighting + that frame's wardrobe -> give me a
prompt". Our pipeline continues past retrieval into **Selective Inheritance** and **Reference Mixing**,
and ends in a `StructuredPrompt`. ShotDeck is also stills-only; our v0.4 adds video references and
camera-motion extraction, serving "same movement as this video, but the camera work of that video".

Sources: [ShotDeck (site, blocked — cited via search)](https://shotdeck.com/) ·
[ShotDeck filter categories](https://www.soundstripe.com/blogs/recreating-film-looks-shotdeck) ·
[ShotDeck 30+ categories / 50+ keywords per image](https://medium.com/@ivan_74570/free-shotdeck-alternatives-2025-12-ways-to-find-cinematic-references-without-the-paywall-05a94b9dcb6f)

---

## Film-Grab

| | |
|---|---|
| Repository | N/A - closed site (`https://film-grab.com`) |
| License | Site presents images **under a fair-use claim for education and reference only**; site owner states they do not own the imagery and sell nothing (UNVERIFIED — site not fetched, egress policy) |
| License verified | false |
| Main function | Curated, film-by-film galleries of high-resolution movie frames, browsed by title/director rather than by craft attribute |

**Overlap.** Film-Grab is the free ancestor of ShotDeck and the reason "browse frames" became a habit for
filmmakers. Its organising axis is *provenance* (which film) rather than *attribute* (which lighting).

**Useful idea.** **Provenance-first browsing is a legitimate second axis.** Our `Reference.metadata`
already carries `source`, `creator`, `license`, `attribution` — exposing "more from this source" as an
EXPLORE action costs almost nothing and matches how people actually recall references ("that shot from
that film"). Also: Film-Grab's explicit, visible statement of its legal posture is good practice; our
**license badge** on every card is the same instinct, done rigorously.

**What we must NOT copy.** The fair-use posture itself. Film stills are copyrighted; fair use is a
fact-specific defence that courts apply inconsistently, and commercial use weighs against it. A tool
that ingests film frames and re-emits derived attributes at scale is not the same legal position as a
review blog. Under our License Policy, film stills are `Unknown` license and are **excluded by default**
and can never reach `approved`.

**Our differentiation.** Film-Grab is a browsing archive with no schema. We convert every reference into
the **same VisualIntent schema** regardless of whether it arrived as text, image, video or card
(pillar 2), which is what makes cross-source mixing possible — and we do it only over sources whose
license we can verify (Wikimedia Commons, then Openverse).

Sources: [Film-Grab fair-use posture (via search)](https://forfilmssake1.wixsite.com/home/post/film-grab-a-true-library-of-stills) ·
[Film stills are copyrighted; fair use is fact-specific](https://education.onehowto.com/article/are-movie-screenshots-copyrighted-12627.html)

---

## Cinekive (open-source ShotDeck-like)

| | |
|---|---|
| Repository | `Gianluca-Improta/cinekive` |
| License | MIT |
| License verified | **true** — GitHub license label `spdx_id: MIT`, and the README states "MIT — use it, fork it, keep your library private" |
| Main function | Local-first desktop/self-hosted cinematic still archive: ingests films, still folders and URLs, indexes frames with SigLIP semantic search in Qdrant, extracts craft attributes, and builds moodboards |

**Overlap.** The single closest open-source neighbour in this cluster, and startlingly close to our
architecture. Per its README: SigLIP embeddings for visual search (~800 MB model download), **Qdrant on
port 6333** as the vector store, **SQLite** plus on-disk files for metadata, "metadata routing" for
queries, **"craft graph" chips** to navigate along interconnected attributes (lighting, technique, film,
director), an optional **local VLM via Ollama** for craft-tag enrichment with cloud VLMs (OpenRouter,
Claude) as a Pro upgrade, an infinite-canvas moodboard per project, and a **"rights badge" taxonomy**
marking stills by subscription status, study rights, or generation method. Free is the default; Pro
($19 one-time) unlocks batch export, folder watching and cloud VLM keys; gating is client-side.

**Useful idea.** Four:
1. **Local-first + optional cloud VLM is a shipped, working split** — direct evidence that our
   "AI OFF must be a complete product / AI ON adds analysis" requirement is buildable, and that the
   analyzer must be an adapter (`Ollama` today, something else tomorrow).
2. **Hybrid retrieval in practice**: semantic embeddings *plus* "metadata routing" — the same
   semantic + structured fusion our `fusion-ranker` specifies.
3. **"Craft graph" chips** — attribute chips that are also navigation edges. Our `intent-chips` UI
   should be clickable in both directions: chip as filter, chip as EXPLORE seed.
4. **Rights badges** — a per-item provenance/rights marker in the UI, which is a lightweight sibling of
   our License Guard `status: candidate|approved|rejected|license_review`.

**What we must NOT copy.** MIT permits reuse with attribution, but we should not vendor its code:
Electron/Next.js/FastAPI/Qdrant is a far heavier stack than our `app/index.html` + plain-JS-modules
target, and adopting it would couple UI, search and enrichment — the brief explicitly forbids coupling
UI with the prompt engine and search with the prompt composer. Also do not copy its ingestion of film
frames via `yt-dlp`; that reproduces the Film-Grab licensing problem.

**Our differentiation.** Cinekive **finds** frames by look and pins them to a moodboard; it has no
`StructuredPrompt` output and no attribute inheritance. Its craft tags describe an image; they cannot be
*lifted out of it*. Our **Selective Inheritance** turns those same tags into transferable parts, and
**Reference Mixing** combines partial attributes from several references into one prompt — the step
Cinekive stops short of.

Sources: [Cinekive repo](https://github.com/Gianluca-Improta/cinekive) ·
[Cinekive README](https://raw.githubusercontent.com/Gianluca-Improta/cinekive/main/README.md) ·
[GitHub topic: shot-library](https://github.com/topics/shot-library)

---

## Pinterest (and Pinry, the self-hosted equivalent)

| | |
|---|---|
| Repository | Pinterest: N/A - closed product. Self-hosted equivalent: `pinry/pinry` |
| License | Pinterest: proprietary (UNVERIFIED). Pinry: BSD-2-Clause |
| License verified | Partial — BSD-2-Clause **verified** for `pinry/pinry` via the GitHub license label (`spdx_id: BSD-2-Clause`); Pinterest ToS not fetched (egress policy) |
| Main function | Pinterest: visual bookmarking onto boards, discovery by visual similarity. Pinry: open-source, self-hosted tiling image board — save, tag and share images/videos/webpages, public and private boards |

**Overlap.** Pinterest defined the tiling visual board and the "save it because it looks right" behaviour
that our reference tray inherits. Pinry shows the minimum viable version of that: pins, tags, boards,
private/public — roughly our v0.1 "browse cards + keyword search over tags" with **no AI required**.

**Useful idea.** (1) **The board as working memory.** Users collect long before they know why; our
Explorer modal must let references accumulate without forcing a decision, and must not close mid-exploration
(pillar 1). (2) **Pinry is a legitimate reference implementation to study for the AI-OFF path**: a plain
tag + board data model that works with zero inference. (3) Its BSD-2-Clause license means, if we ever
did borrow, attribution alone suffices — but see below.

**What we must NOT copy — and this is a hard prohibition.** **No Pinterest scraping.** Pinterest's ToS
prohibits scraping, collecting, searching, copying or otherwise accessing data or content by automated
means without express prior permission, and states: "You agree not to use any robot, spider, crawler,
scraper or other automated means or interface not provided by us to access the Services or to extract
data." Their developer guidelines separately treat data extraction as an unacceptable use of the
Pinterest API. This matches the brief's explicit prohibition. Pins also carry no reliable license
metadata, so even a permitted import would fail License Guard.

**Our differentiation.** A Pinterest board is a **bag of images**; our reference set is a **bag of typed
attributes with provenance**. Pinterest's "more like this" is whole-image similarity; ours is
**Search by Difference** — mark composition/lighting/camera as KEEP and clothing as CHANGE, and get
frames that hold three categories constant while varying the fourth. No board product can express that.

Sources: [Pinry repo](https://github.com/pinry/pinry) ·
[Pinterest Terms of Service (via search)](https://policy.pinterest.com/en/terms-of-service) ·
[Pinterest anti-scraping clauses summarised](https://scrapeops.io/websites/pinterest/)

---

## Are.na

| | |
|---|---|
| Repository | Platform: N/A - closed product (`https://are.na`). Client library studied: `ivangreene/arena-js` |
| License | Platform: proprietary (UNVERIFIED — dev.are.na blocked by egress policy). Client: MIT |
| License verified | Partial — MIT **verified** for `ivangreene/arena-js` via the GitHub license label; Are.na platform terms not verified |
| Main function | Research/collection platform where **blocks** (images, text, links, media) are joined to **channels** by **connections**; a block can live in many channels at once. REST API (v3) at `https://api.are.na` |

**Overlap.** Are.na is the most structurally interesting entry here because of one detail: **connections
are first-class objects, and the API supports custom key/value metadata on blocks, channels *and*
connections** — a connection being "the specific instance and position of a block within a channel".
That is exactly the shape our `ReferenceMix` needs.

**Useful idea — the most transferable pattern in this document.** In Are.na, the *relationship* between a
block and a channel carries its own metadata, separate from the block. Translate directly:

> A `Reference` is global and immutable (id, attributes, license, provenance).
> Its **participation in a mix** — `{reference_id, use: ["composition","camera_angle"], weight, dominant?}` —
> is a separate object attached to the *edge*, not to the reference.

This means the same reference can contribute **lighting** in one Visual Recipe and **clothing** in
another with no duplication and no mutation, and it makes conflict detection a pure function over the
edge set. It also makes `Visual Recipe` trivially serialisable. Secondly, Are.na's culture of
**non-algorithmic, user-curated collection** is a good corrective: our EXPLORE actions should expand the
user's options, not silently rank away the odd ones.

**What we must NOT copy.** Do not mirror Are.na channels or treat their public blocks as a licensed
corpus — blocks are user-submitted links and images with no uniform license, which fails License Guard.
Do not copy their UI wholesale; a channel is a flat list, and flat lists are what we are replacing.

**Our differentiation.** Are.na models *which references belong together*. We model **which parts of which
references belong together**, and then we resolve the conflicts. Are.na has no taxonomy, no attribute
extraction, and no output artefact; our pipeline ends in a `StructuredPrompt` and a formatter.

Sources: [arena-js client (MIT)](https://github.com/ivangreene/arena-js) ·
[Are.na API v3 / connection metadata (via search)](https://dev.are.na/documentation/channels) ·
[Are.na connections concept](https://help.are.na/docs/getting-started/connections)

---

## Eagle (asset manager) — with Hydrus and Diffusion Toolkit as open-source counterparts

| | |
|---|---|
| Repository | Eagle: N/A - closed product. OSS counterparts: `hydrusnetwork/hydrus`, `RupertAvery/DiffusionToolkit` |
| License | Eagle: proprietary (UNVERIFIED — en.eagle.cool blocked by egress policy). Hydrus: **WTFPL v3** (GitHub label reports "Other"/`NOASSERTION`). Diffusion Toolkit: MIT |
| License verified | Partial — Hydrus **verified** by reading [`LICENSE`](https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/LICENSE) ("DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE, Version 3, May 2010"); Diffusion Toolkit **verified** via the GitHub license label (`spdx_id: MIT`); Eagle **not** verified |
| Main function | Eagle: local desktop image/reference manager with folders, tags, colour search and a local HTTP API. Hydrus: local booru-style tagger that browses by tags instead of folders. Diffusion Toolkit: local metadata indexer/viewer for AI-generated images (PNGInfo from A1111, InvokeAI, NovelAI, Fooocus, …) |

**Overlap.** This trio covers the *local-first* half of our brief. Eagle's API is the most instructive:
the server starts with the app on **`http://localhost:41595`** by default, all v2 endpoints are prefixed
`/api/v2/`, requests from `localhost` / `127.0.0.1` / `0.0.0.0` are automatically trusted with no
authentication, and it exposes three distinct retrieval styles side by side —
**tag search** (`/api/v2/item/get` with a `tags` parameter), **full-text search** (`/api/v2/item/query`)
and **AI semantic search** (`/api/v2/aiSearch/searchByText`). Hydrus contributes the booru **tag
namespace** idea (typed tags rather than flat strings) and a strict privacy stance ("the program never
phones home"). Diffusion Toolkit contributes the "index your own generations by their embedded prompt
metadata, keep custom tags/ratings when files move" pattern.

**Useful idea.** (1) **Eagle's three coexisting search modes are a shipped proof of the brief's
AI-optional design**: exact tag match and full-text work with no model at all; semantic search is an
*additional* endpoint, not a replacement. Our `metadata-search` / `semantic-search` / `fusion-ranker`
split should mirror that separation. (2) **Namespaced tags** (Hydrus) are the cheap version of typed
attributes — `lighting:rim`, `framing:medium_close_up` — and give a clean serialisation for our taxonomy
even before any AI is involved. (3) **A localhost API with a documented port** makes the local library
addressable by other tools; worth remembering for the later ComfyUI node, which will need to read our
reference store. (4) Diffusion Toolkit's rule that **user-added metadata survives file moves** is a good
constraint for our `reference-manager`: identity is the record, not the path.

**What we must NOT copy.** Eagle is proprietary — do not reimplement its API surface as a
compatibility layer or reuse its schema. Hydrus's WTFPL is maximally permissive but its data model is
booru-shaped (flat, unbounded, community tags) and would dilute our controlled taxonomy. Diffusion
Toolkit is MIT but Windows/WPF/C#; nothing to vendor. And none of these tools store license provenance
per asset — copying their record shape would drop the field our License Guard is built on.

**Our differentiation.** All three are **libraries you organise**; we are a **composer you extract with**.
None converts a reference into a `VisualIntent`, none supports partial attribute inheritance, and none
produces a prompt. Our **Unified Modal** also removes the thing every asset manager forces on you —
knowing which pane to search in. Per the UX north star: *"User should never need to know where to search."*

Sources: [Eagle Web API introduction](https://developer.eagle.cool/web-api) ·
[Eagle API overview](https://api.eagle.cool/) ·
[Hydrus repo](https://github.com/hydrusnetwork/hydrus) ·
[Hydrus LICENSE](https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/LICENSE) ·
[Diffusion Toolkit repo](https://github.com/RupertAvery/DiffusionToolkit) ·
[Diffusion Toolkit README](https://raw.githubusercontent.com/RupertAvery/DiffusionToolkit/master/README.md)

---

## OpenAI and Google reference-image features (commercial analogue, second tier)

| | |
|---|---|
| Repository | N/A - closed products |
| License | proprietary (UNVERIFIED — platform.openai.com and ai.google.dev are blocked by the egress policy) |
| License verified | false |
| Main function | Image models that accept one or more input images alongside a text prompt and blend their style/structure/content into the output |

**Overlap.** Both are moving toward multi-reference conditioning. OpenAI's `gpt-image-1` / 4o image
generation is described as strong at retexturing and style change from a reference image, and can handle
**multi-image inputs by referencing each input by index and description** (UNVERIFIED — reported limits of
"up to 20 images per request" for image editing and much higher caps for vision come from secondary
sources, not the official docs, which I could not fetch). Google's Gemini image generation ("Nano Banana")
is reported to blend multiple reference images "to steer style, structure, and content", with source-dependent
limits (5 / 8 / 10 / 14 images depending on model tier — these numbers conflict; see Open Questions).

**Useful idea.** OpenAI's "reference each input by index and description" is the important one: it
concedes that the model needs to be **told what role each reference plays**. That is a natural-language,
lossy version of our `ReferenceMix` — and it means our structured mix can be *compiled down* into a
prompt these APIs already understand ("use image 1 for lighting, image 2 for wardrobe"). That is a
concrete future `formatter-gpt-image` / `formatter-gemini` target.

**What we must NOT copy.** Do not architect around any one of these. Role assignment here is a free-text
instruction interpreted by a black box: unverifiable, non-deterministic, un-inspectable, and silently
different per model version. The brief's rule stands — **no AI-model-dependent architecture, model names
never hardcoded**, everything behind `analyzer-adapter` / `embedding-adapter` / `reranker-adapter`.

**Our differentiation.** These APIs consume references at generation time and discard the reasoning. We
produce a **persisted, editable intermediate** (`VisualIntent` + `ReferenceMix` + `StructuredPrompt`) that
exists before and independently of any generator, and which the user can correct. **Reference
Decomposition** is a durable artefact for us; for them it is a transient prompt-parsing side effect.

Sources: [OpenAI image-gen prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide) ·
[4o image generation guide](https://www.promptingguide.ai/guides/4o-image-generation) ·
[Gemini image generation docs (blocked, cited via search)](https://ai.google.dev/gemini-api/docs/image-generation) ·
[Nano Banana Pro multi-reference blending](https://www.datacamp.com/tutorial/nano-banana-pro)

---

## UX patterns to avoid

1. **Whole-prompt copy as the only action.** Lexica / PromptHero / OpenArt end at "copy this string".
   Our card must lead with `EXTRACT` and `EXPLORE`, not with `USE (everything)`.
2. **Opaque style tokens.** `--sref 3847291` cannot be read, edited, explained or transferred. Never
   surface an attribute the user cannot see and change. Every AI output is a proposal.
3. **Two-slot decomposition.** Subject vs. style (Midjourney) is not decomposition; it is a compromise.
   Do not ship a "content / style" toggle as if it were the feature.
4. **Silent conflict resolution.** Multi-reference tools blend and hope. Two references contributing
   different `lighting` values must raise a visible conflict with a dominance choice — never a silent merge,
   never a silent drop.
5. **Separate pages per modality.** Every product here has an image page, a video page and a text page.
   That forces the user to answer "where do I search?", which the north star forbids. One modal, mode
   switch only, state persists, modal never closes mid-exploration.
6. **A single unlabelled "strength" slider.** Midjourney at least documents `--sw` 0–1000 default 100.
   An unnamed 0–1 slider with no default and no unit is worse than no control.
7. **Infinite scroll with no state.** Gallery products lose your selections when you navigate. The
   reference tray must survive mode switches, searches and detail views.
8. **License as an afterthought.** No product in this cluster shows per-asset license on the card.
   Ours must, and unverified assets must be visibly quarantined rather than quietly usable.
9. **Presentational facets.** "Camera technique" as a search keyword instead of a typed field with a
   controlled vocabulary. Facets that cannot be extracted, inherited or conflicted are decoration.
10. **Vocabulary-gated entry.** Requiring the user to know "low angle" or "chiaroscuro" before they can
    search. Visual pickers must be a first-class entry point, not a fallback.

## Reusable patterns

1. **Edge-carried mix metadata (from Are.na connections).** Keep `Reference` immutable and global; put
   `use[]`, weight and dominance on the *connection* between a reference and a mix. Same reference,
   different roles in different recipes, no duplication. Conflict detection becomes a pure function over
   edges.
2. **Per-reference weights with a documented scale (from `--sref`/`--sw`, `--oref`/`--ow`).** If we add
   weights, name the range and the default explicitly, and support inline per-reference weighting.
3. **Negative reference weight (from Krea).** "Less like this" is a real user need. Scope it to a
   category to beat the whole-image version.
4. **Three coexisting retrieval modes (from Eagle's `/api/v2/item/get` tags, `/api/v2/item/query`
   full-text, `/api/v2/aiSearch/searchByText`).** Structured, lexical and semantic as separate endpoints
   behind one UI — the shipped proof that AI-OFF can be complete.
5. **Semantic + metadata fusion (from Cinekive's SigLIP-over-Qdrant plus "metadata routing").** Matches
   the brief's ~60/40 configurable fusion; retrieval and analysis stay separate modules.
6. **Attribute chips that are also navigation edges (Cinekive "craft graph").** Every chip in
   `intent-chips` should work as both a filter and an EXPLORE seed ("same lighting", "same outfit").
7. **Namespaced tags as the AI-OFF serialisation (from Hydrus).** `lighting:rim`, `framing:medium_close_up`
   gives a taxonomy-faithful, model-free representation usable in v0.1.
8. **Identity is the record, not the path (from Diffusion Toolkit).** User-added attributes survive file
   moves and re-ingest.
9. **Per-item rights badge in the UI (from Cinekive).** A visible provenance/rights marker per card,
   which our License Guard states (`candidate | approved | rejected | license_review`) can render directly.
10. **One query parameter, two modalities (from Lexica's `q` accepting text or an image URL).** The API
    shape that makes the Unified Modal honest rather than cosmetic.
11. **Model-aware output formatting (from PromptHero).** Keep the formatter swappable and downstream of
    `StructuredPrompt`; never let a target model's syntax leak upstream into the schema.
12. **Compile our mix down to competitors' interfaces (from OpenAI's "reference each input by index and
    description").** Our `ReferenceMix` can render as "image 1 for lighting, image 2 for wardrobe" — a
    graceful degradation path into any generator.

## Hard technical facts

- **Midjourney `--sref`**: style reference; strength `--sw`, range **0–1000**, default **100**;
  algorithm version `--sv`, with `--sv 6` the default for V7; multiple weighted references use inline
  `::` syntax, e.g. `--sref URL1::2 URL2::1 URL3::1`; `--sref random` is rewritten in the returned prompt
  as a concrete `--sref <number>`. Documented as transferring palette/light/finish, **not** subject.
  [source](https://prompt-architects.com/blog/214-style-references-in-midjourney-sref-explained)
- **Midjourney `--oref`** (Omni Reference, V7): pins the subject; strength `--ow`, range **1–1000**,
  default **100**; 25–50 permits stylization, 400+ enforces strict adherence; the URL must be publicly
  accessible; the same image may be passed as both `--oref` and `--sref`.
  [source](https://imigo.ai/en/media/omni-reference-in-midjourney-v7)
- **sref codes are opaque pointers into latent style space** — a code cannot be decomposed into
  components such as "warm colour temperature + chiaroscuro lighting + analog grain".
  [source](https://midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes)
- **Lexica search API**: `GET https://lexica.art/api/v1/search?q=<term>`; passing an image URL as `q`
  performs reverse-image search; returns a JSON array of ~**50** results; index built on **CLIP
  embeddings** + vector search. [source](https://lablab.ai/ai-tutorials/stable-diffusion-lexica)
- **Eagle local API**: default listener **`http://localhost:41595`**, started with the app; v2 endpoints
  prefixed `/api/v2/`; requests from `localhost` / `127.0.0.1` / `0.0.0.0` are trusted with **no
  authentication**; tag search `/api/v2/item/get?tags=…`, full-text `/api/v2/item/query`, AI semantic
  search `/api/v2/aiSearch/searchByText`. [source](https://developer.eagle.cool/web-api)
- **Cinekive stack**: SigLIP embeddings (~**800 MB** model download), **Qdrant on port 6333**, **SQLite**
  + on-disk `data/` for metadata, optional local VLM enrichment via **Ollama**, cloud VLM (OpenRouter /
  Claude) behind a **$19 one-time** Pro tier with **client-side gating**; MIT licensed.
  [source](https://raw.githubusercontent.com/Gianluca-Improta/cinekive/main/README.md)
- **Civitai public API**: `https://civitai.com/api/v1/` covering models, model versions, **images**,
  creators and tags; supports unauthenticated and authenticated (API key) access with rate limiting.
  Application code is **Apache-2.0**.
  [source](https://raw.githubusercontent.com/civitai/civitai/main/LICENSE)
- **Are.na API**: base URL `https://api.are.na`, JSON with hypermedia links; **connections** (a block's
  specific instance and position within a channel) are first-class and, like blocks and channels, accept
  **custom key/value metadata**; V2 channels endpoints are deprecated in favour of V3.
  [source](https://dev.are.na/documentation/channels)
- **ShotDeck tagging depth**: every image hand-tagged across **30+ categories** with **50+ keywords**,
  including crew, genre, cameras, lenses, framing, lighting, colour, composition, locations and emotion;
  filters compose (e.g. "teal and orange + night exterior + 2.39:1").
  [source](https://medium.com/@ivan_74570/free-shotdeck-alternatives-2025-12-ways-to-find-cinematic-references-without-the-paywall-05a94b9dcb6f)
- **Hydrus license** is **WTFPL v3** ("DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE, Version 3, May 2010"),
  even though the GitHub license label reports `Other` / `NOASSERTION`.
  [source](https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/LICENSE)
- **Verified license labels (GitHub API `license.spdx_id`)**: `civitai/civitai` → `Apache-2.0`;
  `pinry/pinry` → `BSD-2-Clause`; `Gianluca-Improta/cinekive` → `MIT`;
  `RupertAvery/DiffusionToolkit` → `MIT`; `ivangreene/arena-js` → `MIT`;
  `transitive-bullshit/lexica-api` → `MIT`; `hydrusnetwork/hydrus` → `NOASSERTION`;
  `hassan-sd/civitai-image-scraper` → **no license field returned** (no license file).

### Scraping / ToS traps (explicit list)

| Source | Trap | Verdict for us |
|---|---|---|
| **Pinterest** | ToS forbids scraping, collecting, copying or accessing content by automated means without express permission — "any robot, spider, crawler, scraper or other automated means or interface not provided by us"; developer guidelines treat data extraction as unacceptable use of the API. No per-pin license metadata. | **Prohibited.** Already a hard prohibition in the brief. No import path, not even manual bulk. |
| **Instagram** | "You may not access or collect data from our Products using automated means (without our prior permission)". | **Prohibited.** No media copying, per the brief. |
| **TikTok** | ToS prohibits "scraping, crawling, exporting or otherwise extracting any data or content in any form, for any purpose … using any automated system or software" except with written approval. | **Prohibited.** No video DB, per the brief. |
| **Civitai** | ToS prohibits access via "spiders, robots, crawlers, and data mining tools" except through expressly provided interfaces (public API or official MCP server) with valid credentials and within rate limits; also bans bots/scripts that manipulate stats. Bulk scrapers exist but are ToS-violating. | **Bulk export prohibited.** Even API-legal use fails License Guard: user-generated images with no per-image license. Not a provider. |
| **Lexica / PromptHero / OpenArt** | Community-generated corpora with no per-image license provenance; ToS unverified (sites blocked by egress policy). | **Do not ingest.** Fails `LICENSE CHECK`; cannot reach `approved`. |
| **ShotDeck** | Paid, gated library of film screenshots; underlying works are third-party copyright. | **Do not scrape, do not ingest.** |
| **Film-Grab** | Film frames published under a self-declared fair-use claim for education/reference; owner states they do not own the imagery. | **Not a license.** `Unknown` → excluded by default. |
| **Are.na / Eagle libraries** | User-curated blocks and personal libraries with mixed, mostly unknown licensing. | User's **own local** library is fine (local-first, processed locally). Public Are.na channels are not a corpus. |
| **Midjourney sref codes** | Account-bound, undocumented, no license grant; "sref code packs" are sold by third parties with unclear rights. | **Do not build or redistribute a code DB.** |
| **`hassan-sd/civitai-image-scraper`** | No license file → all rights reserved by default, and the workflow itself violates Civitai ToS. | **Do not vendor, do not imitate.** |

**Reaffirmed provider policy:** priority 1 Wikimedia Commons, priority 2 Openverse; allow PD / CC0 / CC BY
(optionally CC BY-SA); exclude CC BY-NC, CC BY-NC-SA, CC BY-ND and Unknown by default; store URL,
thumbnail URL, metadata, embedding and visual attributes — **never media binaries in the repo**.

## Open questions

1. **Krea's reference count and weighting.** Sources disagree: "up to four images with per-image strength"
   vs. "up to 10 style reference images each with its own adjustable weight, including negative weights".
   Needs verification against Krea's own docs (krea.ai blocked by egress policy here).
2. **Gemini / Nano Banana reference-image limits.** Reported as 5, 8, 10 and 14 images depending on the
   source and model tier. Unresolved; `ai.google.dev` was blocked.
3. **OpenAI `gpt-image-1` input-image limits.** "Up to 20 images per request" and "500 images per request
   for vision" come from secondary sources; official docs blocked. Verify before designing a
   `formatter-gpt-image`.
4. **Civitai `/api/v1/images` response schema.** Does it expose a per-image license or permission field
   (analogous to model-level `allowCommercialUse`)? Could not fetch the API docs. Affects nothing
   operationally — we are not ingesting Civitai — but it settles whether *any* AI-gallery has per-asset
   license metadata at all.
5. **Are.na connection metadata limits.** Size/shape constraints on custom key/value metadata, and
   whether the v3 API allows querying *by* that metadata (which would confirm the edge-carried-mix
   pattern is queryable, not just storable).
6. **Lexica API terms of use.** Whether programmatic use is permitted at all, and at what rate. Not
   fetched. Irrelevant if we never use it as a provider — recommend we do not.
7. **ShotDeck's exact category list.** "30+ categories, 50+ keywords" is second-hand. Obtaining the real
   list would be the fastest sanity check on our own taxonomy completeness (especially Motion and Camera
   Motion, which stills libraries may not cover at all).
8. **Does any product ship category-scoped negative references?** I found none. If true, "keep this
   lighting, actively avoid that palette" is unclaimed territory adjacent to **Search by Difference**.
9. **Video reference decomposition prior art.** This cluster is overwhelmingly stills-based. Camera-motion
   extraction (v0.4) may have no direct analogue here — needs a separate cluster.

## Evidence log

URLs actually fetched with WebFetch (content read):

- https://github.com/hassan-sd/civitai-image-scraper
- https://raw.githubusercontent.com/hassan-sd/civitai-image-scraper/main/README.md
- https://raw.githubusercontent.com/civitai/civitai/main/LICENSE
- https://github.com/hydrusnetwork/hydrus
- https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/LICENSE
- https://raw.githubusercontent.com/Gianluca-Improta/cinekive/main/README.md
- https://raw.githubusercontent.com/RupertAvery/DiffusionToolkit/master/README.md
- https://github.com/topics/shot-library

Repository metadata read directly from the GitHub API (`https://api.github.com/repos/<owner>/<repo>`),
which is where every `license.spdx_id` claim above comes from:

- https://api.github.com/repos/civitai/civitai — `Apache-2.0`
- https://api.github.com/repos/pinry/pinry — `BSD-2-Clause`
- https://api.github.com/repos/Gianluca-Improta/cinekive — `MIT`
- https://api.github.com/repos/RupertAvery/DiffusionToolkit — `MIT`
- https://api.github.com/repos/ivangreene/arena-js — `MIT`
- https://api.github.com/repos/transitive-bullshit/lexica-api — `MIT`
- https://api.github.com/repos/hydrusnetwork/hydrus — `NOASSERTION` ("Other")
- https://api.github.com/repos/bbc-mc/sdweb-eagle-pnginfo — no `license` field returned
- https://api.github.com/search/repositories?q=cinematic+reference+frames+moodboard+filmmakers+stills+library

Sources cited from WebSearch result summaries but **not** directly fetched — every non-GitHub domain
below was refused by this session's network egress proxy (`EGRESS_BLOCKED`), so these claims are
second-hand and are marked (UNVERIFIED) wherever they are load-bearing:

- https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference (blocked)
- https://civitai.com/content/tos (blocked)
- https://developer.civitai.com/docs/api/public-rest (blocked)
- https://shotdeck.com/ (blocked)
- https://dev.are.na/documentation/channels (blocked)
- https://prompthero.com/ (blocked)
- https://developers.pinterest.com/docs/api/v5/introduction/ (blocked)
- https://en.eagle.cool/ (blocked)
- https://ai.google.dev/gemini-api/docs/image-generation (blocked)
- https://platform.openai.com/docs/guides/image-generation (blocked)
- https://en.wikipedia.org/wiki/Midjourney (blocked)
- https://deepwiki.com/civitai/civitai/9.1-public-rest-api-(v1) (blocked)
- https://prompt-architects.com/blog/214-style-references-in-midjourney-sref-explained
- https://imigo.ai/en/media/omni-reference-in-midjourney-v7
- https://midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes
- https://aikizi.com/learn/blog/midjourney-style-codes-explained
- https://lablab.ai/ai-tutorials/stable-diffusion-lexica
- https://lexica.art/docs
- https://www.futurepedia.io/tool/prompthero
- https://www.neura.market/directories/ai-tools/prompthero
- https://ec-arts.com/openart-ai-review-prompt-gallery-filters/
- https://promptsrush.com/blog/openart-review
- https://www.krea.ai/blog/style-references-krea-2
- https://www.krea.ai/blog/krea-2-deep-dive-walkthrough
- https://morphic.com/resources/tools/krea-2-ai-image-generator
- https://www.soundstripe.com/blogs/recreating-film-looks-shotdeck
- https://medium.com/@ivan_74570/free-shotdeck-alternatives-2025-12-ways-to-find-cinematic-references-without-the-paywall-05a94b9dcb6f
- https://forfilmssake1.wixsite.com/home/post/film-grab-a-true-library-of-stills
- https://education.onehowto.com/article/are-movie-screenshots-copyrighted-12627.html
- https://policy.pinterest.com/en/terms-of-service
- https://scrapeops.io/websites/pinterest/
- https://www.tiktok.com/legal/page/us/terms-of-service/en
- https://www.socialcrawl.dev/blog/social-media-scraping-legal-technical-guide
- https://developer.eagle.cool/web-api
- https://api.eagle.cool/
- https://help.are.na/docs/getting-started/connections
- https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide
- https://www.promptingguide.ai/guides/4o-image-generation
- https://www.datacamp.com/tutorial/nano-banana-pro
