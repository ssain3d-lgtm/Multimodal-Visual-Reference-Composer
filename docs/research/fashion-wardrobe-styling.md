# Fashion / Wardrobe / Styling Reference Tools

## Why this cluster matters to us

The `Clothing` branch is the most attribute-dense subtree in our taxonomy (`Tops, Bottoms, Outerwear, Dresses, Shoes, Accessories, Materials, Fit, Style` plus 15 clothing styles). Fashion computer vision has already spent a decade building expert ontologies for exactly that branch — Fashionpedia alone encodes 27 apparel categories, 19 apparel parts and 294 fine-grained attributes with typed relationships. We should learn the *shape* of those ontologies (category vs. part vs. attribute, attributes grouped by supercategory such as `silhouette`, `neckline type`, `length`, `textile pattern`) rather than reinvent a flat tag list.

This cluster is also the only place where something resembling **Selective Inheritance** already ships: virtual try-on takes *one* attribute (the garment) from reference B and pastes it onto reference A. It is instructive precisely because it stops there — it is a pixel-level garment swap, not a typed, multi-category, multi-reference attribute mix, and it produces an *image*, not a `VisualIntent` / `StructuredPrompt`.

Finally, this is the worst license minefield of any cluster we will touch. Nearly every high-quality fashion dataset is gated behind a signed research-only agreement, and the three best-known open virtual try-on models are all CC BY-NC-SA 4.0 — i.e. their weights and code cannot be used in a product. Our brief already forbids `CC BY-NC` sources for *references*; the same discipline must extend to *models and datasets*.

---

## Fashionpedia (ontology + dataset)

| | |
|---|---|
| Repository | [cvdfoundation/fashionpedia](https://github.com/cvdfoundation/fashionpedia) (data), [KMnP/fashionpedia-api](https://github.com/KMnP/fashionpedia-api) (API) |
| License | Dataset/ontology: **UNVERIFIED** — widely reported as CC BY 4.0 for annotations + ontology, but the authoritative terms page `fashionpedia.github.io/home/data_license.html` is unreachable from this environment (egress-blocked). API code: **BSD-2-Clause** |
| License verified | API code: **yes** (raw `license.txt` read). Dataset/ontology: **no** |
| Main function | An expert-built fashion ontology (27 main apparel categories, 19 apparel parts, 294 fine-grained attributes and their relationships) plus ~48k images with instance segmentation masks and per-mask attributes |

**Overlap.** Direct overlap with our `Clothing` subtree and, more generally, with the idea that a reference is a *bag of typed attributes* rather than a picture. Fashionpedia's two-level model (main garment → garment part → attribute, with a typed relationship such as *material* or *silhouette*) is a more rigorous version of what our `Reference Decomposition` pillar does across all categories.

**Useful idea.** The **attribute supercategory** layer. In the real annotation JSON, every attribute carries a `supercategory` — verified values include `nickname`, `silhouette`, `waistline`, `length`, `neckline type`, `opening type`, `knit`, `crochet`, `woven`, `non-woven`, `non-textile material type`, `leather`, `textile finishing, manufacturing techniques`, `textile pattern`, `animal` ([sample.json](https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/data/sample.json)). Categories likewise carry supercategories: `upperbody`, `lowerbody`, `wholebody`, `head`, `neck`, `arms and hands`, `waist`, `legs and feet`, `others`, `garment parts`, `closures`, `decorations`. That is exactly the axis structure our `data/taxonomy/clothing.json` needs so that Reference Mixing can detect conflicts *per axis* (two references both asserting a `neckline type` conflict; a `neckline type` and a `textile pattern` do not).

Also useful: Fashionpedia explicitly demonstrates that other taxonomies map *into* it — the paper shows the 13 DeepFashion2 garment classes expressed as "11 main garment categories, 1 garment part, and 7 attributes" ([fashionpedia-api README](https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/README.md)). That is an argument for our taxonomy carrying `aliases` and `related` fields (already in the v0.1 milestone) so external vocabularies can be aliased in without forking the tree.

**What we must NOT copy.** Do not vendor the Fashionpedia annotation JSONs, the images, or a verbatim dump of the 294-attribute list into `data/taxonomy/` until the dataset license is confirmed from the primary terms page. Even if it is CC BY 4.0, that is an *attribution* license: copying the list obliges us to attribute the Fashionpedia Consortium in `THIRD_PARTY_NOTICES.md`. Under our own brief, "Unverified license can never reach `approved`" — the same rule applies to vocabulary we ingest. Learn the *structure* (category / part / attribute / supercategory), author our own value lists.

**Our differentiation.** Fashionpedia is a static, single-domain ontology for annotation. Our taxonomy is one of ~20 sibling categories feeding **Reference Decomposition** and **Selective Inheritance**: clothing attributes are extracted per-reference and can be inherited *independently* of composition, lighting or camera. Fashionpedia can tell you a jacket is `zip-up` + `denim`; it cannot express "take the clothing from B while keeping the composition of A".

---

## KMnP/fashionpedia-api

| | |
|---|---|
| Repository | [KMnP/fashionpedia-api](https://github.com/KMnP/fashionpedia-api) |
| License | **BSD-2-Clause** ("Copyright (c) 2020, Menglin Jia") |
| License verified | **yes** — raw [license.txt](https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/license.txt) read directly |
| Main function | COCO-style Python API for loading Fashionpedia annotations and evaluating attribute-aware instance segmentation |

**Overlap.** Only the data model overlaps: a COCO-shaped JSON where an annotation carries `category_id` plus an `attribute_ids` array. That "one category id + N attribute ids" pattern is a compact encoding of our per-reference `visual_attributes`.

**Useful idea.** Separating the *evaluation* of attribute prediction from the *representation* of attributes — the same split our brief demands between analyzer and retriever ("Analyzer understands; retriever ranks").

**What we must NOT copy.** The code is BSD-2-Clause (permissive, so reuse would be legally fine) but it is COCO/mask-evaluation machinery we have no use for; importing it would drag a Python dependency into a JS product. Do not copy the attribute id numbering as if it were canonical.

**Our differentiation.** We store attributes as *editable proposals with confidence* (`VisualIntent.confidence` maps field → 0..1), not as ground-truth integer ids. AI output is never a commitment.

---

## DeepFashion (CUHK MMLab)

| | |
|---|---|
| Repository | Project page `mmlab.ie.cuhk.edu.hk/projects/DeepFashion.html` (egress-blocked here); release agreement PDF `.../DeepFashionAgreement.pdf` |
| License | **UNVERIFIED** — reported as *non-commercial research only*, gated by a signed release agreement sent from an institutional email |
| License verified | **no** — the primary page and the agreement PDF are both unreachable from this environment |
| Main function | Large-scale clothing dataset: category & attribute prediction, in-shop retrieval, consumer-to-shop retrieval, landmark detection |

**Overlap.** It is the canonical source of clothing *attribute* labels and the training substrate for most fashion taggers we might otherwise consider using.

**Useful idea.** The consumer-to-shop pairing idea — the same garment photographed in two very different conditions — is conceptually our **Search by Difference** in miniature: hold identity constant, vary everything else. Inverted, it is our case "same outfit, different lighting/camera".

**What we must NOT copy.** Do not ingest DeepFashion images, do not ship a model whose weights were trained on it into a commercial product, and do not treat "the download link works" as a license. The images are scraped from the open web and are explicitly *not* the property of the lab (reported; UNVERIFIED). Any dependency here is a research-only dependency and must be flagged in `docs/THIRD_PARTY_REVIEW.md`.

**Our differentiation.** Our reference corpus is license-first by construction: Wikimedia Commons and Openverse, PD/CC0/CC BY allowed by default, unknown excluded. We never need a signed academic agreement to ship.

---

## DeepFashion2

| | |
|---|---|
| Repository | [switchablenorms/DeepFashion2](https://github.com/switchablenorms/DeepFashion2) |
| License | **UNVERIFIED / none present** — the repository's top level contains only `deepfashion2_api/`, `evaluation/`, `images/`, `README.md`: **no LICENSE file at all**. Data access is gated behind a Google Form that issues an unzip password |
| License verified | **no** (the *absence* of a license file was verified by reading the repo tree) |
| Main function | 491,895 images, 800,732 annotated clothing items, 13 categories, 873,234 commercial-consumer pairs, with bounding boxes, dense landmarks and per-pixel masks |

**Overlap.** Its 13-class taxonomy (short/long sleeve top, short/long sleeve outwear, vest, sling, shorts, trousers, skirt, short/long sleeve dress, vest dress, sling dress) is a compressed version of our `Tops / Bottoms / Outerwear / Dresses` split — note it encodes *sleeve length* into the class name rather than as an attribute.

**Useful idea.** The per-item qualifier fields are a good model for the "how confident / how usable is this reference" question: `scale` (1–3), `occlusion` (1–3), `zoom-in` (1–3), `viewpoint` (1 = no wear, 2 = frontal, 3 = side/back), plus `style` and `pair_id` linking the same product across shots. `viewpoint` in particular is a real signal for us: a flat-lay garment photo is a poor *clothing* reference for a pose-bearing shot.

**What we must NOT copy.** No LICENSE file means **no grant of rights**. "Publicly downloadable after a form" is not a license. Do not vendor its class list verbatim; do not train or fine-tune anything shippable on it.

**Our differentiation.** Baking sleeve length into a class id makes DeepFashion2 unable to express "same silhouette, different sleeve". Our `Clothing` subtree keeps `Fit`, `Materials` and `Style` as orthogonal axes precisely so **Selective Inheritance** can inherit one axis without dragging the others.

---

## IDM-VTON

| | |
|---|---|
| Repository | [yisol/IDM-VTON](https://github.com/yisol/IDM-VTON) |
| License | **CC-BY-NC-SA-4.0** — README: "The codes and checkpoints in this repository are under the CC BY-NC-SA 4.0 license." GitHub label agrees |
| License verified | **yes** (repo page: README statement + license label) |
| Main function | Diffusion virtual try-on: person image + garment image + densepose + human parsing mask → person wearing that garment |

**Overlap.** This is *the* existing implementation of "take the clothing attribute from reference B and apply it to reference A" — a hard-coded, single-category instance of **Selective Inheritance**.

**Useful idea.** The input contract is instructive: try-on works because it explicitly separates *person* signals (pose via densepose, body region via parsing mask) from *garment* signals (the isolated garment image). That is decomposition by construction. Our analyzer should likewise emit `pose`/`appearance` separately from `clothing` so that a reference can contribute one without the other.

**What we must NOT copy.** Nothing at all, in any shippable form. NC + SA means the code *and* the checkpoints are off-limits for a product, and ShareAlike would additionally infect derivatives. It is also trained on VITON-HD / DressCode, which carry their own research-only terms (see below) — a second, independent block.

**Our differentiation.** IDM-VTON outputs a rendered image and only ever transfers one category. We output a **`ReferenceMix`** — `{ references: [ { reference_id, use: ["composition","camera_angle"] }, ... ] }` — that can inherit composition from A, clothing from B, lighting from C and motion from video D at once, surfaces conflicts to the user instead of resolving them silently, and hands the result to any generator via `formatPrompt(structuredPrompt, mode)`. We are model-agnostic; IDM-VTON *is* the model.

---

## OOTDiffusion

| | |
|---|---|
| Repository | [levihsu/OOTDiffusion](https://github.com/levihsu/OOTDiffusion) |
| License | **CC-BY-NC-SA-4.0** — LICENSE file reads "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International", restricting Sharing and Adapted Material to "NonCommercial purposes only" |
| License verified | **yes** — raw [LICENSE](https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/LICENSE) read directly |
| Main function | "Outfitting Fusion based Latent Diffusion for Controllable Virtual Try-on"; outfitting UNet + outfitting fusion/dropout; half-body and full-body checkpoints |

**Overlap.** Same as IDM-VTON: garment-only transfer. Its category enum is relevant to us — `0 = upperbody`, `1 = lowerbody`, `2 = dress` — which is the minimum viable split of our `Clothing` subtree for *mixing* purposes.

**Useful idea.** **Outfitting dropout** — randomly dropping the garment conditioning during training so the strength of the garment signal becomes controllable at inference (classifier-free-guidance style). The transferable concept is *strength of inheritance*: our `ReferenceMix` currently treats `use: ["clothing"]` as binary. A future weight per inherited category ("mostly B's outfit, lightly A's") is the same idea expressed in prompt space.

**What we must NOT copy.** Code, weights, or any derivative. NC + SA. Trained on VITON-HD and Dress Code, both research-gated.

**Our differentiation.** OOTDiffusion is a fixed pipeline bound to a fixed backbone; our brief forbids AI-model-dependent architecture and mandates adapters (`analyzer-adapter`, `embedding-adapter`, `reranker-adapter`) with **AI OFF as a complete product**. OOTDiffusion with the model removed is nothing; our product with AI removed still browses, searches by keyword/metadata, mixes references and composes prompts.

---

## CatVTON

| | |
|---|---|
| Repository | [Zheng-Chong/CatVTON](https://github.com/Zheng-Chong/CatVTON) |
| License | **CC-BY-NC-SA-4.0** — "All the materials, including code, checkpoints, and demo, are made available under the Creative Commons BY-NC-SA 4.0 license" |
| License verified | **yes** (repo page: license statement + GitHub label) |
| Main function | Lightweight try-on by concatenating person and garment latents into an SD1.5-inpainting backbone — no ReferenceNet, no separate image encoder |

**Overlap.** Third instance of single-attribute transfer; interesting because it is the *architecturally minimal* one.

**Useful idea.** Its thesis — that you do not need a second encoder network to condition on a reference, only a shared representation space and concatenation — argues for our hybrid retrieval design: one multimodal embedding space in which text, image and video queries all live, rather than per-modality subsystems. That is our **Unified Modal** pillar restated at the retrieval layer.

**What we must NOT copy.** Everything is NC-SA, explicitly including the demo. Its evaluation additionally touches DeepFashion, VITON-HD and DressCode.

**Our differentiation.** CatVTON's efficiency claim is 899.06M total / 49.57M trainable params and <8GB VRAM at 1024×768 — impressive, but it is still a *generator*. We do not generate pixels at all; we produce `visual_intent`, `reference_mix`, `structured_prompt` and text. Our **Reference Mixing** pillar means the user's mix is portable to whatever generator they own.

---

## VITON-HD and Dress Code (the datasets underneath every try-on model)

| | |
|---|---|
| Repository | [shadow2496/VITON-HD](https://github.com/shadow2496/VITON-HD) · [aimagelab/dress-code](https://github.com/aimagelab/dress-code) |
| License | VITON-HD: **CC-BY-NC-4.0** ("use, redistribute, and adapt … for non-commercial purposes"; dataset "collected … for research purposes only"). Dress Code: **proprietary / bespoke agreement** — "By making any use of the Dress Code Dataset, you accept and agree to comply with the terms and conditions"; "**The dataset will not be released to private companies**"; institutional email required; hand-signed release form mandatory |
| License verified | **yes** for both (repo pages read directly) |
| Main function | Paired person/garment image datasets (VITON-HD 1024×768 half-body; Dress Code multi-category upper/lower/dresses) |

**Overlap.** None functionally — but they are the *root* of the license trap. IDM-VTON, OOTDiffusion and CatVTON are all trained on one or both.

**Useful idea.** Dress Code's access process is a useful negative template for our **License Guard** (`LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → REFERENCE APPROVAL`): it proves that "the file downloaded" and "we are allowed to use it" are entirely separate facts. Our `Reference.status` enum (`candidate | approved | rejected | license_review`) exists for exactly this.

**What we must NOT copy.** No images, no derived features, no checkpoints trained on them. "Will not be released to private companies" is about as unambiguous as a restriction gets; a commercial product touching Dress Code derivatives is not defensible.

**Our differentiation.** Our brief pins sources to Wikimedia Commons and Openverse with a default allowlist of PD/CC0/CC BY and an explicit exclusion of NC/ND/unknown, and forbids storing media binaries at all (URL + thumbnail + metadata + embedding only). We never inherit a dataset's terms because we never hold the dataset.

---

## tandpfun/wardrobe

| | |
|---|---|
| Repository | [tandpfun/wardrobe](https://github.com/tandpfun/wardrobe) |
| License | **MIT** ("Copyright (c) 2026 Open Wardrobe contributors") |
| License verified | **yes** — raw [LICENSE](https://raw.githubusercontent.com/tandpfun/wardrobe/main/LICENSE) read directly |
| Main function | Local-first personal wardrobe cataloguer: detects every garment in a photo via the OpenAI Responses API, extracts clean product cutouts via the OpenAI Images API, stores them in `data/library.json`, and generates modelled outfit lookbooks |

**Overlap.** It performs **reference decomposition on one category only**: a photo goes in, N typed garment items come out, each becoming an independently reusable item. That is structurally the same move as our `Reference → visual_attributes.clothing[]`, restricted to clothing and materialised as cutout images rather than as typed attributes.

**Useful idea.** Two things. (1) **The local `data/` directory as the whole database** — originals, job records, generated images and a JSON library all stay on disk; no server. This matches our "Local-first" privacy stance and our `data/references.json` layout. (2) **A locked model-reference image** (`data/model-reference.png`) held constant while garments vary — a concrete, user-legible implementation of "keep identity, change clothing", which is a `Search by Difference` query in generation form.

**What we must NOT copy.** No code copying (MIT would permit it, but our brief prohibits wholesale copying of external repository code, and its architecture is hard-bound to one vendor's API). More importantly, do not copy its **hardcoded provider dependency**: the importer is disabled until `OPENAI_API_KEY` is set. Our brief requires that AI OFF be a complete product and that model backends never be hardcoded.

**Our differentiation.** Wardrobe is closed-world (your own clothes) and produces images. We are open-world (search Openverse/Wikimedia, or bring your own image/video) and produce a structured, editable `VisualIntent` that survives across modes. Its "extract clothes" is one leaf of our **Reference Decomposition**, which spans composition, camera angle, framing, lens, pose, motion, lighting, scene, colour, mood and style as well.

---

## iamsaurabhc/drape-ai

| | |
|---|---|
| Repository | [iamsaurabhc/drape-ai](https://github.com/iamsaurabhc/drape-ai) |
| License | **MIT** ("Copyright (c) 2026 Drape contributors") |
| License verified | **yes** — raw [LICENSE](https://raw.githubusercontent.com/iamsaurabhc/drape-ai/main/LICENSE) read directly |
| Main function | Batch e-commerce fashion photography: Character Studio (model identity) → Garment Studio (categorised packshot library) → Outfit Composer (character + 2–5 garments + background preset in a single multi-reference edit call) → optional image-to-video |

**Overlap.** The closest thing in this cluster to **Reference Mixing**: several reference images are combined in *one* call, with one of them (the character) pinned as the identity anchor. Its stored objects — assets with category tags (`top`, `bottom`, `dress`, …), outfits as `character ID + garment IDs + background preset + image URL`, and outfit videos with a `motion preset` — are a thin cousin of our `ReferenceMix` and of the "Visual Recipe" in our Future section.

**Useful idea.** Two. (1) **Multi-reference composition in a single call rather than chained passes**, explicitly to avoid identity drift and colour shift between garments — the same reason our brief insists conflicts be detected and surfaced rather than resolved by sequential overwriting. (2) **Recipe-shaped persistence**: it saves the *combination* (character + garments + background), not a prompt string. That is precisely our Visual Recipe `{ name, references: [...], intent: {...}, prompt_mode }`, and it validates that users want to re-run a combination, not a sentence.

**What we must NOT copy.** Its transfer mechanism is **reference-locked prose**, not structure: identity is preserved by literally instructing the model "Do not alter the model's face, identity, or body shape from Image 1", and layering is expressed as prose ("outerwear goes over the top"). That is exactly the failure mode our brief calls "degrading into a prompt builder" — the semantics live in an English sentence, not in a schema. Also: it hardcodes a stack of named commercial generators (Seedream, Nano Banana, FLUX, Higgsfield, Seedance, Kling) — forbidden by "Model names/backends must NEVER be hardcoded".

**Our differentiation.** **Selective Inheritance** is typed and per-category: `{ reference_id, use: ["clothing","lighting"] }` is machine-checkable, conflict-detectable, and portable across output modes; "do not alter Image 1's face" is none of those. Drape mixes whole assets; we mix *attributes of* assets.

---

## FashionCLIP / Marqo-FashionCLIP (fashion tagging & embedding)

| | |
|---|---|
| Repository | [patrickjohncyh/fashion-clip](https://github.com/patrickjohncyh/fashion-clip) · [marqo-ai/marqo-FashionCLIP](https://github.com/marqo-ai/marqo-FashionCLIP) |
| License | FashionCLIP: **MIT** (GitHub license label). Marqo-FashionCLIP: **Apache-2.0** — raw LICENSE reads "Apache License Version 2.0, January 2004" (code; a distinct weights licence is not stated in the repo — (UNVERIFIED)) |
| License verified | Marqo code: **yes** (raw LICENSE). FashionCLIP: **partially** — MIT label seen on the repo page, LICENSE body not opened |
| Main function | CLIP/SigLIP encoders fine-tuned on fashion for zero-shot attribute classification, multimodal retrieval and localisation. FashionCLIP 2.0 is fine-tuned from `laion/CLIP-ViT-B-32` on >700K image–text pairs from the Farfetch dataset; Marqo's models are ViT-B-16 with 512-dim embeddings |

**Overlap.** Direct overlap with our `src/ai/embedding.js` and `semantic-search` modules for the clothing slice: these are the off-the-shelf way to get "same outfit" retrieval and zero-shot clothing tags without training anything.

**Useful idea.** Marqo's evaluation suite is the transferable artefact: seven public fashion benchmarks (DeepFashion In-shop, DeepFashion Multimodal, Fashion200k, KAGL, Atlas, Polyvore, iMaterialist). We need an equivalent held-out set for "did EXPLORE → *same outfit* actually return the same outfit?", and this is a template for building one. Marqo's stated approach — training against *structured* metadata (category, style, colours, materials, keywords), not only free-text captions — is also an argument for our hybrid ranker: structured metadata match is a first-class signal, not a fallback (brief: ~60/40 semantic/structured fusion).

**What we must NOT copy.** Two traps. (1) FashionCLIP's training corpus is the **Farfetch dataset, whose public release the repo itself describes as pending** — the *model* being MIT does not make the *data* usable, and it should not be presented to users as an unencumbered asset. (2) Marqo's benchmark suite includes DeepFashion and Polyvore, whose underlying images carry their own terms; do not redistribute the benchmark bundles.

**Our differentiation.** These are retrieval encoders. Our brief keeps **retrieval and analysis as separate modules** ("Analyzer understands; retriever ranks") behind swappable adapters, and requires the whole product to work with the embedding adapter switched off. A FashionCLIP-shaped tool answers "find similar"; only our pipeline answers "same framing and lighting, *different* outfit" (**Search by Difference**).

---

## open-mmlab/mmfashion

| | |
|---|---|
| Repository | [open-mmlab/mmfashion](https://github.com/open-mmlab/mmfashion) |
| License | **Apache-2.0** — "This project is released under the Apache 2.0 license" |
| License verified | **yes** (repo page: statement + GitHub label) |
| Main function | Toolbox covering attribute prediction, recognition & retrieval, landmark detection, parsing & segmentation, compatibility & recommendation, and virtual try-on |

**Overlap.** It is the cluster's clearest demonstration that "fashion understanding" decomposes into independent, swappable sub-tasks — the same modular framing our `src/ai/` adapter layer needs.

**Useful idea.** One toolbox, many tasks, one shared data abstraction. Its `DATA_PREPARATION.md` shows every task feeding from the same DeepFashion / Polyvore substrate — analogous to our `Reference` object being the single substrate for search, decomposition, mixing and prompt composition.

**What we must NOT copy.** The code is permissively licensed, but the toolbox is **useless without research-gated data**: `DATA_PREPARATION.md` points at DeepFashion Category&Attribute, In-Shop, Consumer-to-Shop and Landmark benchmarks hosted by CUHK MMLab, plus Polyvore Outfits. Permissive code sitting on restricted data is the single most common license trap in this cluster. Also, do not adopt its Python/mmcv stack.

**Our differentiation.** mmfashion is a research toolbox producing labels. We produce a user-editable `VisualIntent` and a `StructuredPrompt`, inside a **Unified Modal** where text/image/video/browse never fragment into separate pages.

---

## Polyvore dataset + outfit-transformer (outfit recommendation OSS)

| | |
|---|---|
| Repository | [xthan/polyvore-dataset](https://github.com/xthan/polyvore-dataset) · [owj0421/outfit-transformer](https://github.com/owj0421/outfit-transformer) |
| License | polyvore-dataset repo: **Apache-2.0** (raw LICENSE: "Apache License Version 2.0, January 2004") — but this covers the *repository*, not the crawled polyvore.com images, whose rights are unaddressed **(UNVERIFIED)**. outfit-transformer: **MIT** ("Copyright (c) 2024 big_oh_one") |
| License verified | **yes** for both repos (raw LICENSE files read); image rights: **no** |
| Main function | 21,889 outfits (17,316 / 1,497 / 3,076 train/val/test) crawled from polyvore.com c. 2017-02-19, with fill-in-the-blank and compatibility-prediction tasks; outfit-transformer is an unofficial implementation of *Outfit Transformer* (CVPR 2023) for compatibility prediction and complementary item retrieval |

**Overlap.** Complementary Item Retrieval — "given these items, what fourth item completes the set?" — is the recommendation-flavoured sibling of our **Reference Mixing**: reasoning over a *set* of partial references rather than one.

**Useful idea.** The **fill-in-the-blank framing**. Our composer should be able to say: "you have inherited composition from A and lighting from C; `clothing` is empty — here are candidate references that would fill it, ranked for consistency with what you already chose." That is `EXPLORE → same lighting, different outfit` made proactive, and it turns an empty `VisualIntent` field into a search rather than a blank box.

**What we must NOT copy.** The classic trap: **an Apache-2.0 repository whose payload is scraped third-party images**. The repo itself notes the original image URLs are dead and points users at an *unofficial Kaggle mirror* — re-hosted images of unknown provenance. Under our License Guard those are `unknown` and therefore excluded by default; they can never reach `approved`. Do not ingest them, and do not accept "it's on Kaggle" as a license.

**Our differentiation.** Outfit recommendation optimises a single learned scalar (compatibility) and hides its reasoning. Our brief forbids that shape of automation at the mixing step: conflicts between references "are DETECTED and SURFACED, never auto-resolved and never silently dropped. UI asks which should be dominant." We recommend candidates; the user decides, and the decision is stored structurally in `ReferenceMix`.

---

## Fashion-IQ (relative captions — closest prior art to Search by Difference)

| | |
|---|---|
| Repository | [XiaoxiaoGuo/fashion-iq](https://github.com/XiaoxiaoGuo/fashion-iq) |
| License | **UNVERIFIED** — the GitHub page shows a "Community Data License Agreement (CDLA)" label, but the specific variant (CDLA-Permissive-1.0 vs CDLA-Sharing-1.0) could not be confirmed: the LICENSE file was not retrievable at the paths tried. The two variants differ materially — Sharing is copyleft for data |
| License verified | **no** |
| Main function | Fashion retrieval by *natural-language feedback*: human-written **relative captions** that describe the difference between two similar garment images, across Dresses / Tops&Tees / Shirts, ~77K images, plus attribute side-information. The repo hosts captions and splits, not images |

**Overlap.** This is the nearest published prior art to our **Search by Difference** pillar: the query is not "find similar to X" but "find X, *but* different in this specific respect".

**Useful idea.** Two. (1) **Relative captions as a query type** — proof that users naturally express visual intent as a delta, which is precisely why our KEEP/CHANGE category selector is the right UI, not a novelty. (2) **The repo distributes captions and image *splits/URLs*, not the images.** That is exactly our brief's rule: "Do NOT store media binaries in the repo — store URL, thumbnail URL, metadata, embedding, visual attributes only." Fashion-IQ is a working precedent for that discipline.

**What we must NOT copy.** Do not vendor its captions until the CDLA variant is confirmed — if it is CDLA-Sharing-1.0, publishing enhanced data derived from it carries share-alike obligations that would propagate into `data/`. Also, its deltas are *free text*; do not adopt free-text deltas as our internal representation.

**Our differentiation.** Fashion-IQ's difference is an unstructured English sentence over one domain (garments). Ours is **structured and cross-category**: the user marks KEEP `{composition, lighting, camera}` and CHANGE `{clothing}`, and the retriever executes that as a typed constraint over `visual_attributes` fused with semantic similarity (~60/40, configurable) — no natural-language parsing required, and it works with AI OFF via metadata match alone.

---

## UX patterns to avoid

- **Vendor-locked cold start.** tandpfun/wardrobe disables its importer until `OPENAI_API_KEY` is present; drape-ai's entire pipeline is a chain of named commercial generators. Our v0.1 must be fully usable with zero keys — browse, keyword search, mix, compose.
- **Prose as the transfer mechanism.** drape-ai preserves identity by writing "Do not alter the model's face, identity, or body shape from Image 1" into the prompt. Instructions-in-English are unverifiable, untestable and not portable across output modes. Selective inheritance must live in `ReferenceMix`, and the prompt must be *generated from* it.
- **Silent conflict resolution.** Try-on pipelines simply overwrite the garment region; sequential multi-pass composition drifts identity and colour. When two references both assert `lighting`, never let last-write-win — surface it and ask which is dominant.
- **Category ids that fuse independent axes.** DeepFashion2 folds sleeve length into the class name, so "same silhouette, different sleeves" is inexpressible. Keep `Fit`, `Materials`, `Style`, `length`-like axes orthogonal.
- **Flat tag soup.** A 294-item flat attribute list with no supercategory is unusable for conflict detection and for a KEEP/CHANGE UI. Group by axis or the Reference Mixer cannot reason.
- **A separate page per modality.** Every tool in this cluster has a distinct screen per input type (character studio vs garment studio; upload person vs upload garment). Our Unified Modal pillar exists to kill that — only the input MODE changes, and modal state persists across switches.
- **Treating downloadability as permission.** A Google Form password (DeepFashion2), a dead-URL dataset mirrored to Kaggle (Polyvore), or a permissive repo wrapping scraped images — none of these grant rights. Never surface such a reference as `approved`.

## Reusable patterns

- **Three-level ontology: category → part → attribute, with typed relationships.** Fashionpedia's `jacket` → `button` (part) → `metal` (material attribute). Our `Clothing` subtree should support at least category + attribute-with-supercategory so that "same neckline, different fabric" is expressible.
- **`supercategory` on every attribute value.** Verified Fashionpedia axes worth mirroring in `data/taxonomy/clothing.json`: silhouette, waistline, length, neckline type, opening type, textile pattern, material family (knit / woven / non-woven / leather / non-textile), finishing technique. This is what makes per-axis conflict detection possible in `reference-mix.js`.
- **`{category_id, attribute_ids[]}` as the compact per-item encoding.** One typed category plus N attribute ids maps cleanly onto our `visual_attributes.clothing` array while staying diffable and mergeable.
- **Reference-quality qualifiers.** DeepFashion2's `viewpoint` (no-wear / frontal / side-back), `occlusion`, `scale`, `zoom-in` are cheap, high-value fields for deciding whether a reference is a good donor for a given category. A flat-lay packshot is a fine `clothing` donor and a useless `pose` donor.
- **Fill-in-the-blank completion.** When a `VisualIntent` field is empty, offer ranked candidate references to fill *that field only* — the recommendation framing of complementary item retrieval, applied per attribute category.
- **Identity anchor + varying donors.** Both wardrobe (`data/model-reference.png`) and drape-ai (character locked as reference #1) converge on the same UX: one pinned reference, the rest swappable. That is our "dominant reference" affordance for conflict resolution.
- **Recipes, not prompts.** drape-ai persists `character ID + garment IDs + background preset`; save the *combination*. Direct validation of our Visual Recipe `{ name, references, intent, prompt_mode }`.
- **Distribute metadata, not media.** Fashion-IQ ships captions + splits and lets you fetch images yourself. Same rule as our brief: URL + thumbnail + metadata + embedding only.
- **Structured metadata as a first-class retrieval signal.** Marqo trains against category/style/colour/material/keyword fields rather than captions alone — supports our semantic + structured fusion ranker instead of pure vector search.

## Hard technical facts

- Fashionpedia ontology: **27 main apparel categories, 19 apparel parts, 294 fine-grained attributes**; ~48k images; **16.7 attributes per image on average, max 57**.
- Fashionpedia *category* supercategories (verified in `data/sample.json`): `upperbody`, `lowerbody`, `wholebody`, `head`, `neck`, `arms and hands`, `waist`, `legs and feet`, `others`, `garment parts`, `closures`, `decorations`.
- Fashionpedia *attribute* supercategories (verified, partial list): `nickname`, `silhouette`, `waistline`, `length`, `neckline type`, `opening type`, `knit`, `crochet`, `woven`, `non-woven`, `non-textile material type`, `leather`, `textile finishing, manufacturing techniques`, `textile pattern`, `animal`. Example values: `asymmetrical` (silhouette), `empire waistline` (waistline), `knee (length)`, `crew (neck)` (neckline type), `zip-up` (opening type), `denim` (woven), `suede` (leather), `leopard` (animal).
- Fashionpedia annotation format is COCO-style JSON; an annotation carries `category_id` plus an `attribute_ids` array. Files: `instances_attributes_train2020.json`, `instances_attributes_val2020.json`, `attributes_train2020.json`, `attributes_val2020.json`, `info_test2020.json`.
- The 13 DeepFashion2 garment classes can be expressed in the Fashionpedia ontology as **11 main garment categories + 1 garment part + 7 attributes** — i.e. cross-taxonomy mapping is feasible via aliases.
- DeepFashion2: **491,895 images** (390,884 train / 33,669 val / 67,342 test), **800,732 items**, **13 categories**, **873,234 commercial-consumer pairs**, **294 dense landmarks** across all categories. Per-item fields: `scale` 1–3, `occlusion` 1–3, `zoom_in` 1–3, `viewpoint` 1–3 (1 = no wear, 2 = frontal, 3 = side/back), `style`, `pair_id`. Landmark visibility flags: `v=2` visible, `v=1` occluded, `v=0` unlabeled.
- DeepFashion2 repository top level contains **no LICENSE file**; access is via a Google Form that issues an unzip password.
- IDM-VTON: code **and checkpoints** are CC BY-NC-SA 4.0; built on SDXL with IP-Adapter-style garment conditioning; consumes densepose + human parsing masks; ships `vitonhd_train_tagged.json` / `vitonhd_test_tagged.json` and DressCode caption/densepose files.
- OOTDiffusion: LICENSE is CC BY-NC-SA 4.0 verbatim; full-body category enum `0 = upperbody`, `1 = lowerbody`, `2 = dress`; checkpoints trained on VITON-HD (half-body) and Dress Code (full-body).
- CatVTON: CC BY-NC-SA 4.0 for "code, checkpoints, and demo"; **899.06M total parameters, 49.57M trainable**; SD v1.5-inpainting backbone; **<8GB VRAM at 1024×768** inference; no ReferenceNet, no separate image encoder.
- VITON-HD: CC BY-NC 4.0, 1024×768, "collected … for research purposes only".
- Dress Code: bespoke agreement; **"The dataset will not be released to private companies"**; non-institutional emails (gmail, qq) rejected; hand-signed release form required, typed signatures not accepted; requests validated weekly.
- FashionCLIP 2.0: fine-tuned from `laion/CLIP-ViT-B-32` on **>700K image–text pairs** from the Farfetch dataset (release described by the repo as pending); weighted macro-F1 **0.83 (FMNIST) / 0.73 (KAGL) / 0.62 (DEEP)**.
- Marqo-FashionCLIP: **ViT-B-16, 512-dim embeddings**; evaluated on DeepFashion (In-shop), DeepFashion (Multimodal), Fashion200k, KAGL, Atlas, Polyvore, iMaterialist; repo code Apache-2.0; claimed +57% eval-metric improvement over FashionCLIP 2.0.
- Polyvore dataset: **21,889 outfits** (17,316 / 1,497 / 3,076), crawled c. **2017-02-19**, outfits truncated to first 8 items, ~**7,000 labelled outfits** for compatibility (≈4,000 incompatible / 3,000 compatible); original image URLs are dead.
- Fashion-IQ: ~**77K images** (46K train), **18K image pairs**, three categories (Dresses, Tops&Tees, Shirts), human-written relative captions plus derived attribute labels; images are not hosted in the repo.
- mmfashion supports six tasks: attribute prediction, recognition & retrieval, landmark detection, parsing & segmentation, compatibility & recommendation, virtual try-on; Apache-2.0 code over CUHK-hosted DeepFashion benchmarks + Polyvore Outfits.
- drape-ai stores: assets (garment/character with category tag), outfits (`character ID + garment IDs + background preset + image URL`), outfit videos (`outfit ID + video URL + motion preset + resolution + provider metadata`); composes 2–5 garments in **one** multi-reference edit call.

## Open questions

1. **Fashionpedia's exact dataset licence.** Reported as CC BY 4.0 for annotations + ontology (Fashionpedia Consortium, 2020), but `fashionpedia.github.io` is egress-blocked here. Must be confirmed from the primary terms page before any part of its vocabulary is referenced in `data/taxonomy/`, and before adding an entry to `THIRD_PARTY_NOTICES.md`.
2. **Fashion-IQ's CDLA variant.** Permissive-1.0 vs Sharing-1.0 changes whether derived data we publish carries share-alike obligations. Must be resolved before any use.
3. **DeepFashion / DeepFashion2 agreement text.** Both primary sources are unreachable from this environment. Working assumption: research-only, no commercial use, no redistribution — treat as blocked until proven otherwise.
4. **Does Marqo publish a separate licence for the model weights**, distinct from the Apache-2.0 code? Repo does not say. Needed before we recommend it as a default embedding adapter.
5. **How deep should our `Clothing` subtree go?** Fashionpedia's 294 attributes are far beyond what a prompt composer needs. What is the minimum set of axes (silhouette, length, neckline, sleeve, material, pattern, fit, style) that still makes "same outfit but different fabric" expressible?
6. **Is there a defensible commercially-usable fashion tagger at all?** Every strong candidate is either NC-licensed or trained on research-only data. Do we (a) restrict clothing analysis to a general VLM under our analyzer adapter, (b) ship clothing analysis as user-supplied-model only, or (c) rely on manual/taxonomy-driven tagging with AI OFF as the default path?
7. **Should inherited categories carry a weight** (OOTDiffusion's outfitting-dropout analogue) rather than being binary in `ReferenceMix.use[]`? This affects the schema, so it should be decided before v0.3.
8. **Do we need a `viewpoint`/donor-quality field on `Reference`** so the mixer can warn "this flat-lay is a poor `pose` donor"? DeepFashion2 suggests yes; it is not in the brief's Reference object today.

## Evidence log

Every URL actually fetched for this document:

- https://github.com/tandpfun/wardrobe
- https://raw.githubusercontent.com/tandpfun/wardrobe/main/LICENSE
- https://github.com/iamsaurabhc?tab=repositories
- https://github.com/iamsaurabhc/drape-ai
- https://raw.githubusercontent.com/iamsaurabhc/drape-ai/main/LICENSE
- https://github.com/cvdfoundation/fashionpedia
- https://github.com/KMnP/fashionpedia-api
- https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/README.md
- https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/license.txt
- https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/data/sample.json
- https://github.com/KMnP/fashionpedia-api/tree/master/data
- https://github.com/switchablenorms/DeepFashion2
- https://github.com/switchablenorms/DeepFashion2/tree/master
- https://raw.githubusercontent.com/switchablenorms/DeepFashion2/master/README.md
- https://github.com/yisol/IDM-VTON
- https://github.com/levihsu/OOTDiffusion
- https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/LICENSE
- https://github.com/Zheng-Chong/CatVTON
- https://github.com/shadow2496/VITON-HD
- https://github.com/aimagelab/dress-code
- https://github.com/patrickjohncyh/fashion-clip
- https://github.com/marqo-ai/marqo-FashionCLIP
- https://raw.githubusercontent.com/marqo-ai/marqo-FashionCLIP/main/LICENSE
- https://github.com/open-mmlab/mmfashion
- https://raw.githubusercontent.com/open-mmlab/mmfashion/master/docs/DATA_PREPARATION.md
- https://github.com/xthan/polyvore-dataset
- https://raw.githubusercontent.com/xthan/polyvore-dataset/master/LICENSE
- https://github.com/owj0421/outfit-transformer
- https://raw.githubusercontent.com/owj0421/outfit-transformer/main/LICENSE
- https://github.com/XiaoxiaoGuo/fashion-iq

Attempted but **blocked by the network egress proxy** (so any claim resting on them is marked UNVERIFIED): `fashionpedia.github.io`, `huggingface.co`, `arxiv.org`, `www.ecva.net`, `mmlab.ie.cuhk.edu.hk`, `complexity.cecs.ucf.edu`, `fashn.ai`, `web.archive.org`. Attempted and returned 404: `raw.githubusercontent.com/XiaoxiaoGuo/fashion-iq/{master,main}/LICENSE`, `github.com/cvdfoundation/fashionpedia/blob/master/LICENSE`.
