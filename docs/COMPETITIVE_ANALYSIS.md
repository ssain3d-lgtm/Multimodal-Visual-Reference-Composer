# Competitive Analysis — Unified Visual Reference Composer

**Purpose:** the prior-art register. It maps every adjacent product, library, dataset and vendor vocabulary we surveyed, proves that no existing system occupies the cell this product occupies, records exactly what we may borrow and what we must never copy, and states the legal and ethical boundaries that follow.

> ### 한국어 요약
> 이 문서는 106개의 인접 프로젝트를 다섯 개 클러스터로 정리한 **선행 기술 대장**입니다. 결론은 하나입니다: 레퍼런스를 **타입이 지정된 속성 단위로 분해하고, 속성별로 상속하고, 여러 레퍼런스를 섞으면서 충돌을 사용자에게 드러내는** 제품은 존재하지 않습니다. 가장 가까운 상용 기능인 Midjourney `--sref`/`--oref`조차 **두 칸짜리 불투명 슬롯**이며, 편집도 설명도 이식도 불가능합니다.
> 이 문서는 또한 **무엇을 절대 복사하지 않는지**를 프로젝트별로 명시합니다. 라이선스가 없는 저장소(= 모든 권리 유보), 연구 전용 패션 데이터셋, NC/ND 모델 가중치, 스크래핑 금지 서비스가 대표적입니다. 코드는 어떤 저장소에서도 통째로 가져오지 않으며, 라이선스를 확인하지 못한 항목은 반드시 `(UNVERIFIED)`로 표시합니다.
> 채택할 만한 패턴은 출처와 **채택 시 발생하는 라이선스 의무**까지 함께 기록했습니다.
> 문서 간 충돌 시 `BRIEF.md` → [정본 데이터 모델](./DATA_SCHEMA.md) → 본 문서 순으로 우선합니다.

---

## 0. Document contract

| Rank | Source | Role |
|---|---|---|
| 1 | `BRIEF.md` (the canonical product brief) | product authority; never contradicted |
| 2 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) + [`schemas/`](./schemas/) | every field name, enum, id grammar and invariant referenced below |
| 3 | **this document** | what exists elsewhere, what we take, what we refuse |
| 4 | [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) | the operational register: per-project clearance decisions and their dates |

Siblings: [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) (why), [`ARCHITECTURE.md`](./ARCHITECTURE.md) (how), [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) (the License Guard rules), [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) (retrieval), [`ROADMAP.md`](./ROADMAP.md) (order of work), and the primary-source notes under [`research/`](./research/), which carry the full evidence logs, fetched-URL lists and per-cluster open questions this document condenses.

### 0.1 Evidence discipline

Three rules govern every claim below, and they are the same rules the License Guard applies to media.

1. **A licence is a fact you read, not a badge you saw.** Where a `LICENSE` file was fetched and read, the licence is stated plainly. Where only a platform label or a search-result snippet was available, the claim carries **(UNVERIFIED)**. Two projects in this survey have a platform label that *disagrees with the file*: `kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes` (label `NOASSERTION`, file GPL-3.0) and `sy77777en/CameraBench` (label `NOASSERTION`, file CC BY 4.0). Both times, **the file wins**. That is why `Reference.metadata.license` is populated from a source's own licence statement and never from a heuristic.
2. **Absence of a licence is a licence decision.** Seven surveyed repositories ship no `LICENSE` file at all. Under default copyright that means all rights reserved. Popularity is not permission: `Suzie1/ComfyUI_Comfyroll_CustomNodes` has 1,308 stars and no licence.
3. **Code licence ≠ weights licence ≠ data licence.** SigLIP 2's own documentation licenses "all software" Apache-2.0 and "all other materials" CC BY, and never licenses the checkpoints. LTX-Video is Apache-2.0 for the repository and OpenRAIL-M for the weights. LanguageBind is MIT code over a CC BY-NC-4.0 dataset. `jnMetaCode/ai-shortfilm-prompts` is an MIT wrapper around all-rights-reserved third-party prompts. An automated "the repo is MIT, therefore safe" check would be wrong in every one of those cases. This is the concrete justification for brief question 8 — reference licensing, model licensing and code licensing are three separate columns.

Because the research passes ran behind a restrictive egress proxy, most vendor documentation hosts (`docs.midjourney.com`, `krea.ai`, `platform.openai.com`, `ai.google.dev`, `huggingface.co`, `arxiv.org`, `commons.wikimedia.org`, `api.openverse.org`, `shotdeck.com`, `help.runwayml.com`, `platform.minimax.io`) were unreachable. Claims resting on them are marked inline. Claims about GitHub-hosted code were verified against the source itself, which is a stronger citation than prose documentation.

### 0.2 How to read the per-project sections

Every project in §3 uses exactly the brief-mandated headings: **Repository / License / Main Function / Overlap / Useful Idea / What We Must NOT Copy / Our Differentiation**, and ends with source links. "Our Differentiation" always names one of the five identity pillars — Unified Modal, Visual Intent, Reference Decomposition, Selective Inheritance, Reference Mixing — or Search by Difference, so that the argument stays anchored to the brief rather than drifting into feature comparison.

---

## 1. Executive summary: the landscape in five clusters

### 1.1 The clusters

| # | Cluster | The shape of every member | Members | What it proves | What it lacks |
|---|---|---|---|---|---|
| **C1** | Prompt builders and prompt vaults | curated option list + string concatenator | 16 | Users want structure in a prompt, and want the vocabulary supplied to them | No reference object at all. Nothing is ever populated *from* media |
| **C2** | Image-to-prompt interrogators, taggers, captioners | one media in → one text blob out | 13 | Per-category analysis is already technically solved | The categories are computed and then deliberately discarded at the last step |
| **C3** | Reference galleries, boards, and commercial style-reference features | a reference is an atom you copy whole | 13 | People choose visual direction by *looking*, and demand partial reference control | A reference cannot be split. The closest split is a two-slot black box |
| **C4** | Domain ontologies, datasets and benchmarks | expert labels, no product | 22 | The typed decomposition is real, professional, and stable enough to standardise | Labels are for scoring models, not for a human to steal four attributes from four references |
| **C5** | Components we consume — retrieval, runtimes, decoding, media providers, formatter targets | infrastructure with no opinion about content | 42 | Every layer we need is buildable today, locally, licence-cleanly | None of them is a product; several would quietly break our licence or privacy posture if adopted naively |

C1–C3 are competitors in the sense that a user could mistake them for us. C4 is the evidence base for our taxonomy. C5 is the parts bin. **The product's entire claim lives in the space that all five clusters leave empty.**

### 1.2 The wall

Our pipeline, with the reach of each cluster drawn over it:

```
 TEXT/IMAGE/VIDEO/CARD → VISUAL INTENT → SIMILAR REF SEARCH → DECOMPOSITION → SELECTIVE INHERITANCE → MIXING → STRUCTURED PROMPT
 ├────────────────────────────────────┤                                                                  ├──────────────────────┤
 C2 interrogators: media in, blob out.                                                   C1 builders: options in, string out.
 Categories computed, then flattened.                                                    No media ever enters. No provenance.

 ├───────────────────────────────────────────────────────────┤
 C3 galleries/boards: find it, pin it, copy the whole thing.
 Stops exactly where our product starts.

                    ├───────────────────────────┤                ├──────────────┤
                    C4 ontologies: the vocabulary and the        C4 benchmarks score a model's
                    proof that shot size ≠ framing ≠ angle.      guess; nobody inherits anything.

 ├──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
 C5 components: embedders, vector stores, decoders, local VLM servers, licence-clean providers. Plumbing for all of the above.

                                                   ▲                      ▲                      ▲
                                                   └──────────────────────┴──────────────────────┘
                                                       NOTHING IN 106 PROJECTS OCCUPIES THIS SPAN
```

Three arrows are unoccupied: **Decomposition → Selective Inheritance → Mixing**. They are pillars 3, 4 and 5, and they are the product.

### 1.3 The four structural absences

Stated as findings, each with the evidence that produced it:

1. **Nobody has a Reference object.** C1 has *option lists* (`vault_data.py`, `data/*.txt` wildcards, Fooocus-style `styles/*.json`). An option is a word with no source URL, no creator, no licence, no thumbnail and no origin media. Our `Reference` — `{id, type, status, visual_attributes, attribute_meta, metadata{source, source_id, creator, license, license_url, source_url, media_url, thumbnail_url, attribution}, license_guard, media, embeddings, privacy}` — has no counterpart anywhere in the survey. C3 has objects with thumbnails, but none of them carries a per-asset licence field; Cinekive's "rights badge" is the closest and it is a display hint, not a gate.
2. **Where structure exists, it is structure for the encoder, not for the user.** `kiko-flux2-prompt-builder` builds a genuinely nested JSON prompt (`prompt`, `style`, `camera{angle, distance, lens/lens-mm, f-number, ISO, focus}`, `film_stock`, `lighting`, `colors{palette, mood}`, `composition`) — and that JSON is *write-only*. It is assembled from dropdown widgets and flattened to text. Nothing reads a JSON back out of an image or a video, and nothing merges two of them. `ComfyUI-PromptJSON` is the same shape one level more abstract: its four outputs are `system_prompt`, `user_prompt`, `negative_passthru`, `schema` — all strings destined for an external LLM.
3. **Per-category analysis is solved and then thrown away.** JoyCaption's Gradio app ships checkboxes reading verbatim `"Include information about lighting."`, `"Include information about camera angle."`, `"Include information on the image's composition style, such as leading lines, rule of thirds, or symmetry."`, `"Specify the depth of field…"`, plus a full shot-size ladder from extreme close-up to extreme wide shot. That option list *is* a taxonomy — and the output is a paragraph in which none of it can be addressed again. CLIP Interrogator computes per-category scores against five separate label tables and then emits the template `"caption, medium artist, trending, movement, flaves"`. WD14 emits `(tag, probability, category-id)` triples and the node hands over a single `tag_string` socket. **The dead end is a product decision, not a model limitation.** That single sentence is the strongest argument in this document.
4. **Multi-source combination exists, and it is always opaque.** Comfyroll's "Prompt Mix" blends text and conditioning between encoders. PromptChain's `Combine` concatenates whole prompts. MultiModal-Prompt-Nodes takes up to three images into one flat enhanced prompt with no record of which image contributed what. drape-ai composes a character plus 2–5 garments in one call and preserves identity by writing *"Do not alter the model's face, identity, or body shape from Image 1"* into the prompt. Midjourney blends `--sref` and `--oref` channels statistically. **Not one of them can detect a conflict**, because by the time the sources meet, the category structure is gone. Conflict detection is not a feature we bolt on; it is only *possible* because `applyMix` operates on typed `visual_attributes` before any text exists.

### 1.4 The verdict in one paragraph

Across 106 project entries there is exactly one commercial feature that concedes our premise — Midjourney's split of a reference into `--sref` (look) and `--oref` (subject) — and it concedes it with a two-slot, opaque, non-editable, non-portable mechanism whose separation is statistical rather than structural. There is exactly one open-source project whose architecture rhymes with ours — Cinekive: local-first, SigLIP + metadata routing, craft-tag chips, rights badges — and it stops at the moodboard, with no `StructuredPrompt`, no inheritance and no mixing. Everything else is either upstream of us (a model, an index, a provider) or beside us (a builder, an interrogator, a gallery). **The cell is empty, and it is empty for a structural reason: every other product destroys category membership before the point at which we start working.**

---

## 2. Master comparison matrix

**Legend.** ● = present and first-class · ◐ = partial, implicit, or single-axis · ○ = absent.

- **Multimodal input** — can text, image *and* video all be inputs to the same surface?
- **Reference model** — is there a persisted object with provenance and licence, not just a file or an option string?
- **Attribute decomposition** — does one media item become *typed, separately addressable* attributes?
- **Selective inheritance** — can the user take *some* attributes from one reference and leave the rest?
- **Mixing** — can several references contribute *different* attributes to one output, with conflicts surfaced?
- **Unified UI** — do all input modes share one persistent surface, or is there a page/tab/node per mode?

### 2.1 C1 · Prompt builders and prompt vaults

| Project | License | Multimodal input | Reference model | Attribute decomposition | Selective inheritance | Mixing | Unified UI | Notes |
|---|---|---|---|---|---|---|---|---|
| kiko-flux2-prompt-builder | MIT | ○ | ○ | ◐ write-only JSON | ○ | ○ | ◐ node + standalone HTML | Closest analogue to our `StructuredPrompt`; never populated from media |
| ComfyUI-Prompt-Vault | MIT | ○ | ○ | ○ | ○ | ○ | ○ | `prompt_dna` second output is a primitive provenance ancestor |
| ComfyUI-KikoTools | MIT | ◐ image only | ○ | ○ | ○ | ○ | ○ | Gemini node: image → one whole prompt, cloud-only |
| ComfyUI Workflow Studio | MIT | ○ | ◐ assets, no licence | ○ | ○ | ○ | ◐ persistent side panel | Unifies *assets*, not input modes |
| ComfyUI-PromptChain | AGPL-3.0 | ◐ image masking | ○ | ○ spatial only | ○ | ◐ text combine | ○ | Named combination modes; combines strings, not attributes |
| ComfyUI-Custom-Scripts | MIT | ○ | ○ | ○ | ○ | ○ | ○ | Autocomplete = the incumbent answer to "I don't know the word" |
| sd-dynamic-prompts | MIT | ○ | ○ | ○ | ○ | ○ | ○ | Explores by enumeration (cartesian product), not retrieval |
| Comfyroll CustomNodes | **none — all rights reserved** | ○ | ○ | ○ | ○ | ◐ conditioning blend | ○ | "Prompt Mix" mixes tensors/strings; 1,308 stars, no licence |
| ComfyUI-PromptJSON | **none — all rights reserved** | ○ | ○ | ◐ schema you type into | ○ | ○ | ○ | Only schema in C1 that *shape*-resembles `VisualIntent`; convergent, not derived |
| ComfyUI-WildPromptor | Apache-2.0 | ○ | ○ | ○ | ○ | ○ | ○ | "LEGO for prompts" — the exact degradation the brief forbids |
| ComfyUI-Prompt-Manager | GPL-3.0 | ◐ metadata parse | ◐ recipes | ○ | ○ | ○ | ○ | v2.0 Recipes are the closest analogue to `VisualRecipe` |
| ComfyUI-MultiModal-Prompt-Nodes | GPL-3.0 (label says NOASSERTION) | ● image + video prompts | ○ | ○ | ○ | ◐ 3 images → 1 string | ○ | Backend swappable by dropdown — validates our adapter rule |
| ComfyUI_Okims_JSON_Builder | **none — all rights reserved** | ○ | ○ | ◐ spatial boxes | ○ | ○ | ◐ fullscreen canvas | Node-as-launcher pattern is the useful part |
| ComfyUI-AdvancedCameraPrompts | MIT | ○ | ○ | ◐ camera fields only | ○ | ○ | ○ | Emits `"focal_length": 35` as fact — violates our lens rule |
| xoxxel/camera-prompts | MIT (LICENSE blob 404) **(UNVERIFIED label)** | ○ | ○ | ○ | ○ | ○ | ○ | Term + example image per entry; the right idea, wrong licence chain for the images |
| jnMetaCode/ai-shortfilm-prompts | MIT wrapper over **all-rights-reserved** prompts | ○ | ○ | ◐ 5-stage skeleton | ○ | ○ | ○ | The canonical licence trap: permissive shell, restricted payload |

### 2.2 C2 · Image-to-prompt interrogators, taggers, captioners

| Project | License | Multimodal input | Reference model | Attribute decomposition | Selective inheritance | Mixing | Unified UI | Notes |
|---|---|---|---|---|---|---|---|---|
| clip-interrogator | MIT | ◐ image | ○ | ◐ internal only | ○ | ○ | ○ | Ranks per category, then comma-joins the categories away |
| clip-interrogator-ext | MIT | ◐ image | ○ | ◐ `analyze` endpoint returns scored terms | ○ | ○ | ○ separate WebUI tab | Splits "prompt" from "analyze" — validates our analyzer/formatter seam |
| WD14 / WD Tagger weights | **UNVERIFIED** | ◐ image | ○ | ● (tag, prob, category-id) | ○ | ○ | ○ | Closest existing thing to `VisualIntent`; wrong domain, unusable vocabulary |
| SW-CV-ModelZoo | **none — all rights reserved** | ○ | ○ | ○ | ○ | ○ | ○ | Live illustration of why unverified licence can never reach `approved` |
| ComfyUI-WD14-Tagger | MIT (weights unstated) | ◐ image | ○ | ◐ collapsed to one socket | ○ | ○ | ○ | Two thresholds for two tag classes → per-category confidence gates |
| picobyte/…-wd14-tagger | "Public domain, except borrowed parts" — non-SPDX | ◐ image | ○ | ◐ tag files | ○ | ○ | ○ | Would fail our own `license_check` stage |
| DeepDanbooru | MIT | ◐ image | ○ | ◐ flat tags | ○ | ○ | ○ | Ships its tag list with the model — pin taxonomy version to analyzer version |
| JoyCaption | Apache-2.0 code; **weights UNVERIFIED** | ◐ image | ○ | ◐ asked for, then dissolved | ○ | ○ | ○ | Proves the dead end is a product choice |
| Florence-2 | **UNVERIFIED** (reported MIT) | ◐ image | ○ | ◐ boxes + labels | ○ | ○ | ○ | Region geometry is a better `composition` signal than any caption |
| kijai/ComfyUI-Florence2 | MIT (weights unstated) | ◐ image | ○ | ◐ | ○ | ○ | ○ | Runtime weight download with no licence statement |
| BLIP / LAVIS | BSD-3-Clause | ◐ image | ○ | ○ | ○ | ○ | ○ | BLIP repo is deprecated; captions contain almost none of our 20 categories |
| moondream | Apache-2.0 code; **weights UNVERIFIED** | ◐ image | ○ | ◐ bboxes regexed out of prose | ○ | ○ | ○ | Structured data round-tripping through a sentence — never in our pipeline |
| img2prompt web tools | proprietary **(UNVERIFIED)** | ◐ image | ○ | ○ | ○ | ○ | ○ | Multi-target formatting from one analysis is the one good idea |

### 2.3 C3 · Reference galleries, boards, and commercial style-reference features

| Project | License | Multimodal input | Reference model | Attribute decomposition | Selective inheritance | Mixing | Unified UI | Notes |
|---|---|---|---|---|---|---|---|---|
| Lexica | proprietary **(UNVERIFIED)**; MIT client wrapper | ◐ text or image URL in one `q` | ◐ image + prompt, no licence | ○ | ○ | ○ | ◐ one query param, two modalities | Corpus is unlicensed SD output — fails `license_check` |
| PromptHero | proprietary **(UNVERIFIED)** | ○ | ◐ | ○ presentational facets | ○ | ○ | ○ | Per-target-model filter is a distant cousin of `formatPrompt` modes |
| OpenArt | proprietary **(UNVERIFIED)** | ○ | ◐ | ○ | ○ | ○ | ○ | "Remix" = inherit the whole string, then hand-edit text |
| Civitai | Apache-2.0 (app code) | ○ | ◐ generation params | ○ | ○ | ○ | ○ | ToS forbids crawlers; images carry no per-asset licence |
| Midjourney `--sref` / `--oref` | proprietary | ◐ image refs | ○ | ◐ **two slots** | ◐ style *or* subject | ◐ weighted blend, no conflicts | ○ | The nearest analogue. Opaque, uneditable, two categories. See §8 |
| Krea 2 style refs + moodboards | proprietary **(UNVERIFIED)** | ◐ image refs | ◐ moodboard | ○ single latent blob | ○ | ◐ weighted, incl. negative | ○ | Negative reference weight is a real idea we extend per-category |
| ShotDeck | proprietary; film stills | ○ | ● hand-tagged, no licence field | ● 30+ categories, 50+ keywords **(UNVERIFIED)** | ○ | ○ | ○ | Proof that decomposition is a *profession*. Stops at retrieval |
| Film-Grab | self-declared fair use — **not a licence** | ○ | ◐ provenance-first | ○ | ○ | ○ | ○ | Under our policy: `unknown` → excluded by default |
| Cinekive | MIT | ◐ stills + film ingest | ● local, with rights badges | ● craft-graph chips | ○ | ○ | ◐ | The closest open-source neighbour. No prompt, no inheritance |
| Pinterest / Pinry | proprietary / BSD-2-Clause | ○ | ◐ pins + tags | ○ | ○ | ○ | ○ | Scraping contractually prohibited; no per-pin licence |
| Are.na | proprietary; MIT client | ◐ mixed blocks | ● blocks + **connections** | ○ | ○ | ○ | ○ | Edge-carried metadata is the most transferable pattern in the survey |
| Eagle / Hydrus / Diffusion Toolkit | proprietary / WTFPL v3 / MIT | ◐ | ● local library | ◐ namespaced tags | ○ | ○ | ○ | Eagle ships tag + full-text + semantic search side by side — AI-optional, proven |
| gpt-image-1 / Gemini reference images | proprietary **(UNVERIFIED)** | ● | ○ | ○ | ◐ role stated in prose | ◐ blended | ○ | Role assignment by free text: unverifiable, non-deterministic. See §8 |

### 2.4 C4 · Domain ontologies, datasets and benchmarks

| Project | License | Multimodal input | Reference model | Attribute decomposition | Selective inheritance | Mixing | Unified UI | Notes |
|---|---|---|---|---|---|---|---|---|
| Fashionpedia (ontology) | **UNVERIFIED** (reported CC BY 4.0); API code BSD-2-Clause | ○ | ○ | ● 27 cat / 19 parts / 294 attrs with supercategories | ○ | ○ | ○ | The attribute-supercategory axis is our `exclusivity_group` prototype |
| KMnP/fashionpedia-api | BSD-2-Clause | ○ | ○ | ● `{category_id, attribute_ids[]}` | ○ | ○ | ○ | Compact, diffable per-item encoding |
| DeepFashion | **UNVERIFIED** — research-only, signed agreement | ○ | ○ | ● | ○ | ○ | ○ | Consumer-to-shop pairing = Search by Difference in miniature |
| DeepFashion2 | **none — no LICENSE file**; form-gated | ○ | ○ | ● 13 classes + qualifiers | ○ | ○ | ○ | Fuses sleeve length into the class id — the anti-pattern for our axes |
| IDM-VTON | CC BY-NC-SA 4.0 (code **and** checkpoints) | ◐ 2 images | ○ | ◐ person vs garment | ● one category, in pixels | ○ | ○ | Selective inheritance, hard-coded to one category, output is pixels |
| OOTDiffusion | CC BY-NC-SA 4.0 | ◐ 2 images | ○ | ◐ 3-way enum | ● one category | ○ | ○ | Outfitting dropout ⇒ *strength of inheritance* (our `MixEntry.weight`) |
| CatVTON | CC BY-NC-SA 4.0 | ◐ 2 images | ○ | ◐ | ● one category | ○ | ○ | One shared space + concatenation, no second encoder |
| VITON-HD / Dress Code | CC BY-NC 4.0 / bespoke: *"will not be released to private companies"* | ○ | ○ | ○ | ○ | ○ | ○ | The root licence trap under the whole open try-on stack |
| tandpfun/wardrobe | MIT | ◐ image | ◐ local library | ● one category, as cutouts | ◐ | ○ | ○ | Vendor-locked cold start: importer disabled without `OPENAI_API_KEY` |
| iamsaurabhc/drape-ai | MIT | ◐ images | ◐ assets + outfits | ◐ category-tagged assets | ◐ whole assets | ◐ one call, no conflicts | ○ studio-per-stage | Transfer mechanism is English prose in the prompt |
| FashionCLIP / Marqo-FashionCLIP | MIT **(label only)** / Apache-2.0 code, weights **UNVERIFIED** | ◐ text+image | ○ | ○ | ○ | ○ | ○ | Trains on structured metadata, not captions — supports our 60/40 fusion |
| open-mmlab/mmfashion | Apache-2.0 code over research-gated data | ○ | ○ | ● | ○ | ○ | ○ | Permissive code over restricted data is not a usable stack |
| Polyvore + outfit-transformer | Apache-2.0 / MIT (repos only; images unaddressed) | ○ | ○ | ◐ | ○ | ◐ learned scalar | ○ | Fill-in-the-blank per category is a genuinely good idea to steal |
| Fashion-IQ | **UNVERIFIED** — CDLA variant unconfirmed | ◐ image pairs | ○ | ◐ | ○ | ○ | ○ | Relative captions = users express intent as a *delta*. Ours is typed |
| CameraBench | CC BY 4.0 (file; label NOASSERTION) | ◐ video | ○ | ● reference-frame-qualified motion | ○ | ○ | ○ | Geometry vs semantics finding drives our two-source `camera_motion` design |
| CineScale / CineScale2 | **UNVERIFIED** — all hosts blocked | ○ | ○ | ● scale; angle ⊥ level | ○ | ○ | ○ | Proves camera angle and camera height are orthogonal axes |
| MovieShots / SGNet | **UNVERIFIED** (dataset) | ○ | ○ | ◐ 5 scale + 4 movement | ○ | ○ | ○ | Defines "push = zooms in" — the dolly/zoom conflation we must not inherit |
| AVE | **none — no licence statement** | ○ | ○ | ● 11 typed per-shot keys | ○ | ○ | ○ | 196K shots proving `shot-size` ≠ `shot-type` (our `camera_distance` ≠ `framing`) |
| ShotBench / ShotVL | **none — no LICENSE file** | ◐ image + clip | ○ | ● 8 dimensions | ○ | ○ | ○ | "Lens Size" as a *category*, not a millimetre figure — our lens rule, confirmed |
| CineTechBench | CC BY-NC-ND 4.0 | ◐ image + clip | ○ | ● 7 dimensions | ○ | ○ | ○ | Hard stop: NC **and** ND. Metadata-and-hyperlinks-only distribution is the good part |
| magcil/movie_shot_classification_dataset | MIT (repo; films are third-party) | ○ | ○ | ◐ 10 movement classes | ○ | ○ | ○ | Keeps `Travelling_in` distinct from `Zoom in` — usable class *names* |
| rsomani95/shot-type-classifier | CC BY-NC 4.0 | ○ | ○ | ◐ 6 classes | ○ | ○ | ○ | A third incompatible shot-size convention. NC blocks us |

### 2.5 C5 · Components we consume (not competitors)

On the mandated axes every row here scores **○ for reference model, attribute decomposition, selective inheritance and mixing**, and at most ◐ for multimodal input and unified UI — none of these systems models a reference at all, which is precisely why they are components rather than competitors. Repeating four columns of ○ forty-four times would be noise, so this table records the decision that actually matters for each: what we use it for, whether we adopt it, and the trap.

| Project | License | Role for us | Adopt? | Notes / trap |
|---|---|---|---|---|
| Qwen3-VL-Embedding / Reranker | Apache-2.0 repo; **weights UNVERIFIED** | `embedding-adapter`, `reranker-adapter` candidate | Behind an adapter | Only model with a *native* fused text+image query. 2048/4096 dims; MRL |
| Qwen3-Embedding (text) | **UNVERIFIED** (raw LICENSE 404) | text-side embedding | Not until verified | Do not default or bundle |
| jina-clip-v2 | **CC BY-NC-4.0 (UNVERIFIED, host blocked)** | browser-grade CLIP | **No — NC** | Rejecting CC BY-NC photos while bundling CC BY-NC weights would be incoherent |
| SigLIP 2 | Apache-2.0 *software*; checkpoints **not licensed in-repo** | permissive embedding alternative | Behind an adapter | NaFlex preserves aspect ratio — framing is semantic content for us |
| OpenCLIP | MIT | model registry pattern | Pattern only | `list_pretrained()` → our `listBackends()` descriptor with a licence field |
| clip-retrieval | MIT | embed→index→serve→browse reference loop | Pattern only | Query modes are mutually exclusive — the anti-pattern our modal forbids |
| Marqo | Apache-2.0 | batteries-included vector search | **No** — server + self-declared deprecated | Weighted multi-part query shape is worth keeping |
| transformers.js | Apache-2.0 | in-browser inference | Yes, lazily | Fetches weights from a remote hub — must be disclosed and user-initiated |
| ONNX Runtime Web | MIT | backend under transformers.js | Yes | WebGPU experimental; WASM must stay the fallback |
| sqlite-vec | Apache-2.0 OR MIT | local vector + metadata store | **Recommended default** | Pre-v1; keep its SQL inside `semantic-search.js` |
| Voy | Apache-2.0 OR MIT | 75 KB WASM k-d tree | No | Documented full rebuild on update — fatal for continuous approval flow |
| USearch | Apache-2.0 | one index format, browser + Node | Candidate | `i8`/`b1x8` quantization is what makes a local library fit |
| hnswlib-wasm / hnswlib / FAISS | Apache-2.0 / Apache-2.0 / MIT | ANN tiers | Optional acceleration only | Baseline stays an honest brute-force cosine scan |
| LanguageBind | MIT code / **CC BY-NC-4.0 data** | one text-anchored space for video+image | Pattern only | Single modality-tagged vector table, not two indexes |
| InternVideo / InternVideo2 | Apache-2.0; weights **UNVERIFIED** | heavyweight video retrieval | Enhanced mode only | 8B is categorically incompatible with local-first defaults |
| PySceneDetect | BSD-3-Clause | shot segmentation reference algorithm | Reimplement, cite | `AdaptiveDetector` exists precisely so a whip pan is not read as a cut |
| TransNetV2 | MIT (weights **UNVERIFIED**) | accuracy ceiling for shot detection | Benchmark only | 27×48 input = permission to downscale aggressively |
| FFmpeg (`scdet`, `select`) | LGPL-2.1+ / GPL-2.0+ with `--enable-gpl` | scene-score reference formula | Formula only | Never ship `--enable-gpl` or `--enable-nonfree` builds |
| RAFT | BSD-3-Clause | optical-flow oracle | Offline calibration only | PyTorch + weights + GPU: not shippable in a static web app |
| OpenCV | Apache-2.0 (branch `5.x`) | homography / partial-affine route | Algorithm, not `opencv.js` | Multi-megabyte WASM for a few hundred lines of least squares |
| Qwen3-VL | Apache-2.0 repo; weights **UNVERIFIED** | `analyzer-adapter` candidate | Behind an adapter | `fps=2`, `num_frames=128`, `total_pixels < 24576*32*32` = a sourced frame budget |
| llama.cpp (`llama-server`) | MIT | local OpenAI-compatible analyzer host | Yes, over HTTP | Two-file model contract ⇒ adapter config is an object, not a string |
| Ollama | MIT | lowest-friction local runtime | Yes, over HTTP | `/v1/models` lets settings *discover* models instead of hardcoding names |
| LM Studio (`lms` CLI) / vLLM | MIT / Apache-2.0 | same OpenAI-compatible surface | Yes, over HTTP | vLLM's `video_url` tempts us to upload the user's video. Send frames |
| MLX-VLM | MIT | Apple-silicon local host | Yes, over HTTP | Serves `/v1/chat/completions` + `/v1/embeddings` + `/v1/rerank` — our three adapters |
| WebCodecs + mp4box.js | W3C spec / BSD-3-Clause | in-browser decode | Yes | Sample table gives keyframe timestamps *before* decoding a pixel |
| `requestVideoFrameCallback` | WICG spec | universal decode fallback | Yes — likely primary | Cross-origin video taints the canvas: remote video may be un-analysable |
| ffmpeg.wasm | MIT wrapper over LGPL/GPL core | exotic container fallback | Lazy-load only | Licence stack is the hazard; multi-thread needs COOP/COEP |
| Openverse API | MIT (code) | provider #2 | **Yes** | `license_type=commercial` still admits `by-nd`. Filter with explicit codes |
| Wikimedia Commons API | GPL-2.0 (software; call over HTTP only) | provider #1, and our only CC video source | **Yes** | `AttributionRequired` as an explicit boolean is the single best idea in C5 |
| Europeana | EUPL-1.2 (client) | optional provider | Optional, user key | `reusability` open/restricted/permission maps onto our `status` ladder |
| Smithsonian Open Access | CC0-1.0 (data repo) | optional provider | Optional | Licence is per *media asset* (`usage.access`), not per record |
| The Met Open Access | CC0-1.0 (metadata **only**) | optional provider | Optional | "Images are not included and are not part of the dataset" |
| Flickr API | proprietary service; client Apache-2.0 OR MIT | optional provider | Optional | ids 7 and 8 are institutional assertions, not grants → `license_review` |
| Pexels | proprietary "Pexels License" | — | **No** | No per-item licence field ⇒ can never reach `approved`. Terms forbid replicating core functionality |
| Unsplash | MIT client; proprietary photo licence | — | **No** | Mandatory download-ping is an outbound call requiring UI disclosure |
| Rijksmuseum | **UNVERIFIED** | — | Not until verified | IIIF is the good idea: derivatives by URL template, no stored bytes |
| NYPL Digital Collections | CC0-1.0 (metadata repo) | — | No — reported deprecated | Metadata CC0 ≠ item public domain |
| MiniMax Hailuo "Director" | proprietary | formatter mode `minimax_h3` | Formatter target | `[Push in]` ≠ `[Zoom in]` in a shipping product — our taxonomy must not merge them |
| Kling `camera_control` | proprietary; integrator lib Apache-2.0 | future formatter mode | Formatter target | Documented pan/tilt axes are inverted vs convention — **verify empirically** |
| Runway Gen-3/4 | proprietary | future formatter mode | Formatter target | "Avoid negative phrasing" ⇒ `camera_motion.static` must render positively |
| Google Veo 3.1 | proprietary | future formatter mode | Formatter target | Cinematography-first ordering; flattens framing/size/angle into "composition" |
| Wan 2.1 / 2.2 | Apache-2.0 | self-hostable formatter target | Formatter target | Community camera-verb lists are folklore, not a vendor contract |
| LTX-Video | Apache-2.0 repo; **OpenRAIL-M weights** | formatter target | Formatter target | 200-word budget ⇒ per-mode word budget and drop-order |

### 2.6 Reading the matrix

Scan the four middle columns of §2.1–§2.4 and the pattern is unmistakable.

| Axis | How many rows score ● | Who they are |
|---|---|---|
| **Multimodal input** | 2 | One node pack that generates *both* image and video prompts, and hosted models that accept mixed input. Neither shares state across modes |
| **Reference model** | 4 | ShotDeck, Cinekive, Are.na, and the local asset managers — and **not one of them carries a per-asset licence field** |
| **Attribute decomposition** | 14 | Every single one is a *labelling* artefact: ontologies (Fashionpedia and its API), datasets (DeepFashion, DeepFashion2, CameraBench, CineScale, AVE), benchmarks (ShotBench, CineTechBench), a tagger (WD14), a research toolbox (mmfashion), a hand-tagged retrieval library (ShotDeck), a local archive (Cinekive), and one single-category extractor (wardrobe) |
| **Selective inheritance** | 3 | IDM-VTON, OOTDiffusion, CatVTON — all virtual try-on, all restricted to one category, all emitting pixels rather than structure, and **all three CC BY-NC-SA** |
| **Mixing** | **0** | Nobody. Anywhere |
| **Unified UI** | **0** | Nobody reaches ●. The best is ◐: one persistent panel over assets, or one query parameter accepting two modalities |

The shape is not an accident, and it is the whole argument of this document compressed into six rows. **Decomposition without a composer is a research output** — fourteen projects decompose beautifully and none of them lets you *move* an attribute, because none attaches provenance to it. **Inheritance without decomposition can only ever be single-category** — which is why all three inheritance implementations are garment transfer and nothing else. **And mixing is impossible for everyone**, because each of them has already destroyed the category structure — in a comma-join, in a latent style code, or in an English sentence — before the mixing step is reached.

---

## 3. Per-project analysis

Every entry uses the same seven headings. "Our differentiation" always names a pillar. Where a licence could not be read firsthand it is marked **(UNVERIFIED)** and must be re-checked before any dependency, citation of specifics, or entry in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md).

### 3.1 C1 · Prompt builders and prompt vaults

This is the cluster we are most likely to be *mistaken for*, and therefore the one where the difference must be sayable in one sentence: **they turn options into a string; we turn media into typed attributes and only then into a string.**

#### 3.1.1 ComfyAssets/kiko-flux2-prompt-builder

**Repository** — [ComfyAssets/kiko-flux2-prompt-builder](https://github.com/ComfyAssets/kiko-flux2-prompt-builder)
**License** — MIT. Verified: LICENSE file present, GitHub label MIT, README restates it.
**Main function** — A JSON-style prompt builder for FLUX 2, shipped both as a ComfyUI node (`KikoFlux2PromptBuilder`) and as a standalone HTML page (`flux2-prompt-node-v2.html`).
**Overlap** — The closest project in the survey to the *output* end of our pipeline. It builds a genuinely nested JSON — `prompt`, `style`, `camera{angle, distance, lens/lens-mm, f-number, ISO, focus}`, `film_stock`, `lighting`, `colors{palette, mood}`, `composition` — and then flattens it. That overlaps our `StructuredPrompt` and `formatPrompt(structured_prompt, mode)`. It also uses the dual-surface strategy our roadmap uses: web page first, node alongside.
**Useful idea** — Emit the structured and the flattened forms side by side from one call: `RETURN_TYPES = ("STRING","STRING","STRING")`, `RETURN_NAMES = ("json_prompt","text_prompt","prompt_only")`. Our node contract (`prompt`, `structured_prompt`, `visual_intent`, `reference_mix`) is that idea generalised, and matches `VisualRecipe.exports[].kind`. Its `numeric_lens_format` toggle — numeric `lens-mm: 85` versus a descriptive string — is a direct precedent for our lens rule (`lens.35mm_like` → `"35mm-like perspective"`, INV-LENS-1/2).
**What we must NOT copy** — Its preset tables (People & Portraits / Nature & Outdoors / Action & Events / Commercial / Artistic), its JSON key names, and its `_build_text_prompt` flattener. MIT would permit reuse; the brief's prohibition on wholesale copying of prompt DBs and external repository code does not. Our taxonomy is authored independently under `data/taxonomy/`.
**Our differentiation** — **Reference Decomposition.** kiko's JSON is write-only: assembled from widgets, never populated from media, with no documented reference-image input. Our identically-shaped structure is *readable from a reference*: an image or video becomes `visual_attributes` plus `attribute_meta[id].confidence`, which the user then edits as `IntentChip`s. kiko answers "what fields should a Flux 2 prompt have"; we answer "what is in this picture, per field, and which of those fields do I want".
**Sources:** [repo](https://github.com/ComfyAssets/kiko-flux2-prompt-builder) · [prompt_builder_node.py](https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/nodes/prompt_builder_node.py) · [README](https://raw.githubusercontent.com/ComfyAssets/kiko-flux2-prompt-builder/main/README.md)

#### 3.1.2 jeremieLouvaert/ComfyUI-Prompt-Vault

**Repository** — [jeremieLouvaert/ComfyUI-Prompt-Vault](https://github.com/jeremieLouvaert/ComfyUI-Prompt-Vault)
**License** — MIT. Verified: LICENSE file present, GitHub label MIT, README licence section.
**Main function** — A photographic "prompt arsenal": 21 curated templates across 8 categories plus a component builder over 100+ photographic components, with persistent favourites.
**Overlap** — Its component vocabulary is the closest published analogue to our taxonomy: 27 camera+lens entries, 24 lighting setups, 18 film stocks, 15 moods, 7 quality directives, 10 compositions. Its three nodes — `PromptVaultBrowse`, `PromptVaultBuild`, `PromptVaultFavorites` — map loosely onto our browse mode, prompt composer and `VisualRecipe`.
**Useful idea** — The `prompt_dna` second output: every node returns `("prompt", "prompt_dna")`, i.e. the prompt **plus a record of what went into it**. That is a primitive ancestor of our `reference_mix` output and independent proof that users want provenance alongside text. Its `category_filter → template → edit_prompt` flow also confirms that a curated entry point with an always-editable result is the right default — our "AI output is a proposal, never a commitment" applied to templates.
**What we must NOT copy** — The component database. `vault_data.py` embeds the templates and 100+ components in source; copying it breaches the prompt-DB prohibition and adds MIT attribution obligations. Named commercial bodies and film stocks (Leica M11, CineStill 800T) carry trademark baggage we do not want: our taxonomy describes the *look* ("halation, tungsten-balanced, warm highlights"), never the brand — the same discipline as the lens rule.
**Our differentiation** — **Visual Intent.** `PromptVaultBuild` takes nine text widgets and joins components with `". ".join(parts)`. The user must already know they want "Rembrandt lighting"; the vault cannot show what it looks like and offers no path from a liked picture to that term. Our unified modal converts text, image, video and reference cards into the *same* `VisualIntent`, so the user reaches "Rembrandt-like" by pointing at an image (`TaxonomyNode.visual_hint`), not by recognising a name in a dropdown.
**Sources:** [repo](https://github.com/jeremieLouvaert/ComfyUI-Prompt-Vault) · [prompt_vault_nodes.py](https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/prompt_vault_nodes.py) · [README](https://raw.githubusercontent.com/jeremieLouvaert/ComfyUI-Prompt-Vault/main/README.md)

#### 3.1.3 ComfyAssets/ComfyUI-KikoTools

**Repository** — [ComfyAssets/ComfyUI-KikoTools](https://github.com/ComfyAssets/ComfyUI-KikoTools)
**License** — MIT. Verified: GitHub label, README statement.
**Main function** — A 21-node general-purpose utility pack containing one image-analysis prompt node, **Gemini Prompt Engineer**, plus a `Local Image Loader` gallery browser.
**Overlap** — Gemini Prompt Engineer overlaps hard: image + model selection (FLUX / SDXL / Danbooru / Video) → a prompt formatted for that model, described as analysing "composition, style, lighting, colors, and details". That is a compressed version of our analyzer + formatter path.
**Useful idea** — **Model-selection-as-formatting-target**: one analysis pass, several output dialects chosen by a widget. This is exactly `formatPrompt(structured_prompt, mode)` over the `FORMATTER_MODE` set (`generic`, `flux`, `qwen_image`, `sd`, `gpt_image`, `minimax_h3`, `krea`), and independent confirmation of the split between understanding and rendering. Its `Display Any` passthrough debug node is a good precedent for a `visual_intent` inspector.
**What we must NOT copy** — The Gemini integration: a hardcoded, cloud-only, single-vendor analysis path — precisely what the brief prohibits ("Model names/backends must NEVER be hardcoded", "No AI-model-dependent architecture", local-first with explicit disclosure). Take the pattern (analyse once, format many); reject the binding (analysis == one vendor). Do not copy its API-key handling.
**Our differentiation** — **Selective Inheritance.** It gives one lever — which output dialect — and its analysis is all-or-nothing: a whole prompt describing the whole image, so if you only wanted the camera angle you delete the rest by hand. Our EXTRACT groups (`composition`, `camera`, `pose`, `clothing`, `lighting`, `scene`, `style`, `motion`) take categories individually per reference, and `ReferenceMix` records which reference contributed which category. KikoTools has no structure capable of expressing "only the lighting from this image".
**Sources:** [repo](https://github.com/ComfyAssets/ComfyUI-KikoTools) · [README](https://raw.githubusercontent.com/ComfyAssets/ComfyUI-KikoTools/main/README.md)

#### 3.1.4 ketle-man/ComfyUI-Workflow-Studio

**Repository** — [ketle-man/ComfyUI-Workflow-Studio](https://github.com/ketle-man/ComfyUI-Workflow-Studio)
**License** — MIT. Verified via GitHub label / About sidebar.
**Main function** — A workflow/asset/gallery management side-panel UI plugin for ComfyUI, with prompt presets, Fooocus-style JSON styles at `user/default/Workflow-Studio/style/`, a model browser, PNG/WebP metadata extraction, and a vision-model Tagger tab.
**Overlap** — The cluster's most ambitious UI project and the closest to our "one panel for everything" instinct: a persistent side panel unifying a workflow library, model browser and generated-image gallery, with drag-and-drop onto the canvas.
**Useful idea** — **Styles as data files, not code.** JSON in a user-writable directory means the vocabulary grows without a release. Our `data/taxonomy/*.json` follows the same rule — taxonomy is data, prompt engine is code, and `TaxonomyNode` files carry their own `version` and `updated_at`. The side-panel-that-never-closes is also a real precedent for INV-EXP-1 ("the modal never closes mid-exploration").
**What we must NOT copy** — Its Fooocus-derived style definitions: a widely re-vendored corpus with its own upstream provenance chain, so ingesting it would put third-party prompt data in our repo. Also avoid its architectural direction — it is a management shell *around* ComfyUI, whereas the brief mandates a standalone web MVP with no UI/prompt-engine coupling and a node only later.
**Our differentiation** — **Unified Modal.** Workflow Studio unifies *assets* (workflows, models, images); it is a tabbed file browser. It does not unify *input modes*: there is no path where a user types a sentence, switches to image upload, then video, then a browsed card, inside one persistent state. Its gallery only reads embedded generation metadata, so an outside-world photograph yields nothing; our modal accepts arbitrary media and produces the same `VisualIntent` from any of it.
**Sources:** [repo](https://github.com/ketle-man/ComfyUI-Workflow-Studio)

#### 3.1.5 mobcat40/ComfyUI-PromptChain

**Repository** — [mobcat40/ComfyUI-PromptChain](https://github.com/mobcat40/ComfyUI-PromptChain)
**License** — **AGPL-3.0.** Verified: LICENSE file on `master` contains the GNU Affero General Public License v3 text.
**Main function** — A prompt-engineering and image-iteration suite: a code-editor prompt node with chain modes, inline option sets and wildcards, plus a 3D poser, regional conditioning/detailer nodes and BiRefNet/SAM2 segmentation masking.
**Overlap** — Its chain modes are the nearest thing in the cluster to combining multiple prompt sources: `Combine` (merge all), `Randomize` (pick one), `Switch` (choose branch), `Iterate` (cycle across queued runs). It also has genuine image understanding and binds prompt text to spatial regions.
**Useful idea** — **Combination is a named, explicit mode rather than an implicit default.** When several sources meet, the user chooses how. Our conflict handling presents the same way: `Conflict.status` is `open` until a human resolves it, `resolution_policy.auto_resolve` defaults `false`, and `on_unresolved` defaults `"block"` (INV-MIX-2). Region-scoped prompt text is also a plausible future extension of `composition`.
**What we must NOT copy** — **Any code at all.** AGPL-3.0 is the strongest copyleft in the survey and its network clause would reach a hosted version of our web MVP, so vendoring, adapting or translating its source into JavaScript would put the whole product under AGPL. Also avoid copying its `::Label::a|b` / `__file__` inline DSL verbatim — a signature syntax reads as derivation.
**Our differentiation** — **Reference Mixing.** PromptChain's chain modes combine *prompt texts* — opaque strings. `Combine` concatenates whole prompts; it cannot take the camera clause from chain A and the wardrobe clause from chain B, because once a chain compiles to text the categories are gone. Our mix operates on typed attributes before text exists — which is the only reason `applyMix` can raise an `arity` or `exclusivity_group` conflict at all. Its segmentation is spatial, not semantic: SAM2 says *where* the subject is, never *what the lighting setup is called*.
**Sources:** [repo](https://github.com/mobcat40/ComfyUI-PromptChain) · [LICENSE](https://raw.githubusercontent.com/mobcat40/ComfyUI-PromptChain/master/LICENSE)

#### 3.1.6 pythongosssss/ComfyUI-Custom-Scripts

**Repository** — [pythongosssss/ComfyUI-Custom-Scripts](https://github.com/pythongosssss/ComfyUI-Custom-Scripts)
**License** — MIT. Verified: LICENSE fetched, "Copyright (c) 2023 pythongosssss".
**Main function** — A broad quality-of-life extension pack; the prompt-relevant parts are embedding/tag autocomplete, Preset Text, String Function (append/replace with `tidy_tags`), Math Expression and an Image Feed panel.
**Overlap** — Its autocomplete is the de facto standard way ComfyUI users discover prompt vocabulary today, which makes it our closest competitor for the "user does not know the word yet" problem. Word lists are settings-managed, default to danbooru tags with one Load button, and per-model lists live at `loras/model_name/*.txt`.
**Useful idea** — **Vocabulary lists as plain, user-editable, model-adjacent files** — no database, no migration, no lock-in, and a list can sit next to the thing it describes. A good model for our taxonomy files and for user-extensible `TaxonomyNode.aliases`. `tidy_tags` is a real lesson too: the boring part of prompt composition is separator hygiene, and a formatter that gets punctuation right beats another dropdown.
**What we must NOT copy** — The danbooru tag corpus it loads: scraped booru tag data of unclear provenance with a heavy single-model-family aesthetic bias. Ingesting it would breach the prompt-DB prohibition and poison our taxonomy's neutrality.
**Our differentiation** — **Visual Intent.** Autocomplete is a *text* affordance: it helps you finish a word you already started typing, so it fails the brief's own success case, "I don't know what Low Angle means — let me choose it visually." Offering `low angle` after you type `low a` is useless to someone who has never heard the phrase. Our taxonomy entries carry `visual_hint` exemplars, so selection happens by looking and text is the *output* of the choice rather than its prerequisite.
**Sources:** [README](https://raw.githubusercontent.com/pythongosssss/ComfyUI-Custom-Scripts/main/README.md) · [LICENSE](https://raw.githubusercontent.com/pythongosssss/ComfyUI-Custom-Scripts/main/LICENSE)

#### 3.1.7 adieyal/sd-dynamic-prompts

**Repository** — [adieyal/sd-dynamic-prompts](https://github.com/adieyal/sd-dynamic-prompts) (ComfyUI port: `adieyal/comfyui-dynamicprompts`, port licence **(UNVERIFIED)**)
**License** — MIT for the A1111 extension. Verified: LICENSE fetched, "Copyright (c) 2022 Adi Eyal".
**Main function** — A templating language for prompts: `{a|b|c}` variants, `__wildcard__` file references, combinatorial expansion of every permutation, and an ML "Magic Prompt" enhancer.
**Overlap** — Canonical prior art for "one authored template, many concrete prompts". Its wildcard directory convention (one option per line, nested folders, glob matching like `__colors*__`) is the vocabulary-storage pattern the ecosystem imitated. Combinatorial mode is the closest existing answer to "explore the neighbourhood of this idea".
**Useful idea** — **Separate the template from its resolutions and record both** — it can write the final prompt *and* the original template into image metadata. That is the right instinct for `VisualRecipe`: the artefact worth saving is the recipe (`{id, name, version, intent, mix, references, prompt_mode}`), not the resolved string, and `prompt_preview` is explicitly an advisory cache that is re-derived on open. Glob-matched wildcards are also a cheap way for one token to address a taxonomy subtree (`clothing.*`).
**What we must NOT copy** — The community wildcard collections that circulate with it: `.txt` bundles aggregated from mixed and usually unstated sources — exactly the unknown-provenance prompt DB the brief bars. Copy the file convention, never the files.
**Our differentiation** — **Search by Difference.** Dynamic Prompts explores by *enumeration*: it multiplies out every combination of the axes you listed and hands you an unranked cartesian product (the documented example yields all 12 permutations). It has no notion of "keep these categories fixed, vary only that one, and find real examples". Our `difference.keep` / `difference.change` (disjoint by INV-EXP-5, with `change_targets` for directed change) returns actual references via hybrid semantic + structured-metadata fusion. Enumeration generates strings; Search by Difference retrieves evidence.
**Sources:** [README](https://raw.githubusercontent.com/adieyal/sd-dynamic-prompts/main/README.md) · [LICENSE](https://raw.githubusercontent.com/adieyal/sd-dynamic-prompts/main/LICENSE)

#### 3.1.8 Suzie1/ComfyUI_Comfyroll_CustomNodes

**Repository** — [Suzie1/ComfyUI_Comfyroll_CustomNodes](https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes)
**License** — **NONE.** Verified *absence*: the repository root contains only `Patch_Notes.md`, `README.md`, `__init__.py`, `categories.py`, `config.py`, `node_mappings.py` plus `fonts/`, `nodes/`, `workflows/`; the GitHub API returns no `license` field. **Treat as all rights reserved.**
**Main function** — A ~150+ node SDXL/SD1.5 pack; the prompt-relevant nodes are CR Prompt Text, CR Combine Prompt, CR Prompt List, CR Simple Prompt Scheduler, CR SDXL Prompt Mix Presets, CR SDXL Style Text, CR Load Prompt Style, CR Encode Scheduled Prompts.
**Overlap** — `CR Combine Prompt` and `CR SDXL Prompt Mix Presets` are, by name, the ecosystem's closest thing to "mixing", which makes them the sharpest illustration of our gap. At 1,308 stars it is the most-installed prompt-node source here, so its conventions set user expectations.
**Useful idea** — Naming and discoverability: a consistent `CR ` prefix and a flat, predictable node category make a 150-node pack navigable. If we ship a node pack, one prefix and few obviously-named nodes beats a sprawl. `CR Prompt List` plus a scheduler also shows users want prompts as *sequences over time* — relevant to our `camera_motion` chips carrying `order` and disjoint `evidence.t_start_s`/`t_end_s`.
**What we must NOT copy** — **Any code or data, without exception.** This is the sharpest legal constraint in C1: no LICENSE file means default copyright, all rights reserved, and popularity is not permission. Its style JSON files are equally unusable. [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) must state explicitly that Comfyroll was reviewed as prior art only and that no line of it exists in our tree.
**Our differentiation** — **Reference Mixing.** "Prompt Mix" here means blending text/conditioning between base and refiner encoders — an operation on tensors and strings. It cannot answer "take composition from A and clothing from B" because at the point of mixing no category structure remains to address. Our mixing happens on typed `visual_attributes` while categories still exist, which is also the only reason conflicts can be detected and surfaced rather than silently averaged away.
**Sources:** [repo](https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes) · [root tree, showing no LICENSE](https://github.com/Suzie1/ComfyUI_Comfyroll_CustomNodes/tree/main)

#### 3.1.9 NeuralSamurAI/ComfyUI-PromptJSON

**Repository** — [NeuralSamurAI/ComfyUI-PromptJSON](https://github.com/NeuralSamurAI/ComfyUI-PromptJSON)
**License** — **NONE.** Verified *absence*: raw and blob views of `/main/LICENSE` both return 404 and the GitHub API returns no `license` field. **Treat as all rights reserved.**
**Main function** — A node that structures a natural-language prompt into a schema and emits system/user prompts for an external LLM node to expand. Inputs: `prompt`, `negative_prompt`, `complexity` (0.1–1.0), `llm_prompt_type`, `schema_type`, `custom_schema`. Outputs: `system_prompt`, `user_prompt`, `negative_passthru`, `schema`.
**Overlap** — The only project in C1 whose schema *shape* resembles `VisualIntent`: its documented example nests `scene` (`time_of_day`, `weather`, `location`), a `subjects` array, `style` (`artistic_movement`, `color_palette`, `mood`) and `camera` (`angle`, `shot_type`). It also enumerates alternative encodings: JSON, HTML, Key-Value, Attribute-Based, Visual Layer Breakdown, Compositional Grid, Artistic Reference.
**Useful idea** — **Schema-as-a-parameter**: rather than hardcoding one serialisation, the node exposes `schema_type` plus a `custom_schema` input. That supports keeping `FORMATTER_MODE` an *open* string with a formatter module per mode rather than a closed enum. Its `complexity` float is a neat single-knob verbosity control worth offering on the composer.
**What we must NOT copy** — Its schema field names, its schema-type list, and any code — no licence means no permission, despite the small size and apparent abandonment. Our `VisualIntent` field list is fixed by the brief and authored independently; **the resemblance is convergent, not derived, and this document is the record of that fact.**
**Our differentiation** — **Reference Decomposition.** PromptJSON's schema is a prompt for a prompt: all four outputs are strings destined for an external LLM, with no image analysis anywhere. The structure is something the user *types into*. Our `VisualIntent` is populated *from media*, is arrays of `IntentChip` objects with per-value `confidence` and `ref_id` rather than free text, is always user-editable, and is the object that search, mixing and formatting all operate on. PromptJSON structures a request; we structure an observation.
**Sources:** [repo](https://github.com/NeuralSamurAI/ComfyUI-PromptJSON) · [LICENSE, 404](https://github.com/NeuralSamurAI/ComfyUI-PromptJSON/blob/main/LICENSE)

#### 3.1.10 1038lab/ComfyUI-WildPromptor

**Repository** — [1038lab/ComfyUI-WildPromptor](https://github.com/1038lab/ComfyUI-WildPromptor)
**License** — Apache-2.0. Verified via GitHub label / About sidebar.
**Main function** — Folder-driven prompt organisation: each folder under `data/` becomes its own selectable list node, plus a Prompt Builder (prefix/content/suffix), Prompt Concat and Keyword Picker.
**Overlap** — Its category set is the closest published analogue to our taxonomy top level — Subject, Environment, Virtual (visual effects, camera settings, lighting, artists, styles), Custom, Styles, Negative. Its prefix/content/suffix composition is a two-tier version of the `StructuredPrompt` → `formatPrompt` split.
**Useful idea** — **The folder *is* the schema.** Adding a directory under `data/` creates a new list node with no code change and the UI updates as the folder structure changes. That is an excellent extensibility model for `data/taxonomy/*.json` — a user could add nodes in a new category without touching our source — and the cleanest example in the cluster of "no coupling of UI with prompt engine", since the UI is generated from data.
**What we must NOT copy** — Its bundled keyword data, especially the artist-name lists under `Virtual` and `Styles`. Living-artist style tokens are an ethical and legal hazard in a product that also stores reference metadata and attribution. Apache-2.0 would permit reuse with notice, but the prompt-DB prohibition applies and our License Guard posture argues for authored data only.
**Our differentiation** — **Visual Intent.** Its own framing — "like LEGO for prompts", snap together prefix, content and suffix — is precisely the "pick a few options → get a prompt" degradation the brief forbids us from becoming. Its categories are containers of *words*; ours are typed attribute *slots that a reference can fill*. Its user must supply vocabulary from their own head; ours can supply an image instead, and every mode lands in the same schema.
**Sources:** [repo](https://github.com/1038lab/ComfyUI-WildPromptor)

#### 3.1.11 FranckyB/ComfyUI-Prompt-Manager

**Repository** — [FranckyB/ComfyUI-Prompt-Manager](https://github.com/FranckyB/ComfyUI-Prompt-Manager)
**License** — **GPL-3.0.** Verified via GitHub label.
**Main function** — A prompt library with ~15+ nodes: save/browse/compose prompts, generate via llama.cpp/Ollama/CLIP, extract prompts and LoRAs from image/video Comfy/A1111 metadata, and save complete "Recipes" (v2.0) via Recipe Extractor/Builder/Renderer/Manager nodes over `recipe_data` structures. Data is JSON under `user/default` with base64 data-URL thumbnails and 5 daily backups.
**Overlap** — The highest-overlap project on the *persistence* axis. Its v2.0 Recipes are a direct analogue of `VisualRecipe` — save the whole configuration, not just the prompt string.
**Useful idea** — **The saved unit is a recipe, and it round-trips**: extract from an artefact, edit, re-render, re-save. Our `VisualRecipe` should close the same loop, and its `version` field is a monotonic *content* revision precisely so that an edited recipe is a new revision rather than a silent overwrite (INV-RCP-1 keeps it standalone by requiring a `ReferenceSnapshot` per mix entry).
**What we must NOT copy** — Any code: GPL-3.0 would force our entire product copyleft, conflicting with a permissively licensed web MVP plus a reusable node pack. Do not copy its storage layout or metadata-parsing implementation. Its base64-thumbnail-in-JSON trick is also the exact opposite of our rule: INV-REF-2 declares `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` **invalid** on a `Reference`. Architecturally, reject its assumption that a prompt's history lives in generated-image metadata — that only works inside a closed generation loop.
**Our differentiation** — **Reference Decomposition.** Its extraction is metadata *parsing*, not visual understanding: it recovers the prompt a Comfy/A1111 pipeline already embedded in the file. Point it at a Wikimedia Commons photograph and it recovers nothing, because nothing was ever written. Our decomposition works on media no generator ever touched and produces `visual_attributes` with per-attribute confidence — which is what makes a photograph usable as a *reference* rather than as a *record*.
**Sources:** [repo](https://github.com/FranckyB/ComfyUI-Prompt-Manager)

#### 3.1.12 kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes

**Repository** — [kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes](https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes)
**License** — **GPL-3.0.** Verified: LICENSE file fetched. Note the GitHub label reads `NOASSERTION`/"Other" — **the file is authoritative.** README attributes the copyleft to the `llama-cpp-python` dependency.
**Main function** — Vision-LLM prompt generation for QwenImageEdit and Wan 2.2 via local GGUF or a cloud API: a Vision LLM node, a Qwen Image Edit Prompt Generator (up to 3 optional image inputs), and a Wan Video Prompt Generator (2048-token limit).
**Overlap** — The closest project to our AI-ON layer and to v0.4: the same multimodal image-and-video surface, targeting the very model families the brief names as candidates.
**Useful idea** — **Backend swappability as a widget** — local GGUF and cloud API interchangeable from a dropdown with no code change, exactly the shape our `ai.adapters.{analyzer, embedding, reranker}` need, and independent evidence that users demand a local option. Its multi-image input (three optional sockets on one node) is the right ergonomic precedent for a node that will eventually accept several references. Its style presets (raw/default/detailed/concise/creative) are a reasonable verbosity axis.
**What we must NOT copy** — Code — GPL-3.0, driven transitively by `llama-cpp-python`, which is itself a reminder that our adapters must keep any GPL inference backend behind a process or HTTP boundary rather than importing it. Also do not copy its prompt templates or its hardcoded model-id lists; INV-AI-2 requires model names never be hardcoded.
**Our differentiation** — **Reference Mixing.** Its multi-image node accepts up to three images and then collapses them into **one** flat enhanced prompt, with no record of which image contributed what. Ours accepts N references, decomposes each into typed attributes, lets the user assign categories per reference via `MixEntry.use`, detects when two references disagree within a category, and asks which is dominant (`ReferenceMix.dominance`). It also has no retrieval at all: it enhances what you already have and cannot find the reference you are missing.
**Sources:** [repo](https://github.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes) · [LICENSE](https://raw.githubusercontent.com/kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes/main/LICENSE)

#### 3.1.13 sarnara2/ComfyUI_Okims_JSON_Builder

**Repository** — [sarnara2/ComfyUI_Okims_JSON_Builder](https://github.com/sarnara2/ComfyUI_Okims_JSON_Builder)
**License** — **NONE.** Verified *absence*: the GitHub API returns no `license` field and the README declares none. **Treat as all rights reserved.**
**Main function** — A visual JSON prompt builder: a fullscreen HTML canvas of draggable, resizable boxes (types `full`, `center`, `impact-grid`) on a 10px grid, with auto-save, presets and JSON import/export, exposed to ComfyUI via a two-button node ("Open Builder", "Copy JSON").
**Overlap** — The only genuinely *spatial* prompt editor in the survey, and it shares our dual-surface shape: a standalone HTML app plus a thin node wrapper. Its box types touch `composition` and `framing`.
**Useful idea** — **The node as a launcher for a real UI.** Reducing the node surface to two buttons and doing the work in a fullscreen web view is the cleanest answer to ComfyUI's cramped widget model, and exactly how our later node should embed the web MVP: one node, one launcher, structured output. Auto-saved builder state matches our persistent-`ExplorerState` requirement.
**What we must NOT copy** — Code and layout presets: no licence. The repo is also thinly documented (README only), so its JSON schema, node output names and target models are all **(UNVERIFIED)**; we cite nothing about it beyond what the README states.
**Our differentiation** — **Unified Modal.** Okims unifies nothing — it is a layout canvas that emits JSON you paste onward, with no search, no reference object, no analysis, no provenance and no path from "a picture I like" to "a filled box". Our fullscreen surface is a pipeline (input → intent → search → decomposition → inheritance → mixing → prompt), not a drawing board, and every input mode lands in the same schema without leaving the modal.
**Sources:** [repo](https://github.com/sarnara2/ComfyUI_Okims_JSON_Builder)

#### 3.1.14 jandan520/ComfyUI-AdvancedCameraPrompts

**Repository** — [jandan520/ComfyUI-AdvancedCameraPrompts](https://github.com/jandan520/ComfyUI-AdvancedCameraPrompts)
**License** — MIT. Verified: raw LICENSE fetched, "Copyright (c) 2025 jandan520".
**Main function** — A ComfyUI node that turns camera parameters into a prompt, emitting both natural language and structured JSON. Nine angles (Eye Level, High, Slight/Standard/Deep/Extreme Low, Bird's Eye, Dutch, Dutch Low) and eight shot types from Extreme Close-Up (0.3–0.6 m) to Extreme Wide Shot (10–50 m).
**Overlap** — The closest shipped "camera vocabulary UI" in the open ecosystem, and therefore the closest competitor for the last stage of our pipeline.
**Useful idea** — The **dual output** independently validates our split: a machine-readable `StructuredPrompt` plus `formatPrompt(structured_prompt, mode)` for the text, so the structure survives a change of target model. Its subject-distance ranges per shot size are a genuinely useful grounding aid for a visual picker, and a good candidate for `TaxonomyNode.description` text on `camera_distance.*` nodes.
**What we must NOT copy** — Two things. (1) The code: MIT permits reuse, the brief does not. (2) The epistemics: it asserts focal length and sensor size as *facts* in its JSON. An emitted `"focal_length": 35` derived from a single image is a fabrication. INV-LENS-1 rejects `lens.35mm` at the schema level in three places, and INV-LENS-2 requires every `lens`-slot `PromptFragment` to carry `hedged: true`.
**Our differentiation** — **Unified Modal.** This node is precisely the "pick a few options → get a prompt" product the brief forbids us from becoming: no references, no search, no decomposition, no mixing. Our camera vocabulary is reached by *looking at reference images* inside one modal that never closes, not by reading a dropdown.
**Sources:** [repo](https://github.com/jandan520/ComfyUI-AdvancedCameraPrompts) · [LICENSE](https://raw.githubusercontent.com/jandan520/ComfyUI-AdvancedCameraPrompts/main/LICENSE)

#### 3.1.15 xoxxel/camera-prompts

**Repository** — [xoxxel/camera-prompts](https://github.com/xoxxel/camera-prompts)
**License** — MIT per the README licence section. **(UNVERIFIED as a label** — the LICENSE blob 404s at both `/blob/main/LICENSE` and `/blob/master/LICENSE`.) The example PNGs are **separately unlicensed**.
**Main function** — An educational Markdown library of 40+ camera angles and cinematic techniques with example images, grouped into Basic Angles (1–11), Cinematic Techniques (12–23) and Advanced Shots (24–40).
**Overlap** — A *visual* camera-angle reference — term plus example image — which is the same interaction the brief's north star demands.
**Useful idea** — Pairing every vocabulary term with a canonical example image is the cheapest way to make an unfamiliar taxonomy usable, and it works with **AI OFF**, which v0.1 requires. This is exactly what `TaxonomyNode.visual_hint` (a `reference_id`) and `visual_hint_pool[]` exist for: the chip picker is a gallery, not a `<select>`.
**What we must NOT copy** — The example images are the risk: MIT on a Markdown library does not clear film frames used to illustrate it. Our exemplars must come through the License Guard from Wikimedia Commons or Openverse with `public_domain` / `pdm` / `cc0` / `cc_by` only, and must reach `status: "approved"` before they can be a `visual_hint`.
**Our differentiation** — **Reference Decomposition.** A term-to-picture lookup is a glossary. Clicking our picture does not paste a word; it inherits a typed attribute from an approved, attributed reference into the mix, carrying `ref_id` and `source: "reference"` on the resulting chip.
**Sources:** [repo](https://github.com/xoxxel/camera-prompts)

#### 3.1.16 jnMetaCode/ai-shortfilm-prompts

**Repository** — [jnMetaCode/ai-shortfilm-prompts](https://github.com/jnMetaCode/ai-shortfilm-prompts)
**License** — MIT for the skill/templates; **embedded third-party prompts remain all rights reserved (© Mx-Shell)**, archived for educational reference with commercial reuse requiring direct contact. Verified from the repo page.
**Main function** — A skill that expands an idea into a model-ready cinematic video prompt: 21 genre templates, a 5-stage structure (core theme → character & scene → atmosphere & quality → camera rules → storyboard), a ~50-move camera library, targeting Seedance, Veo 3/3.1, Kling 2.x/3.0, Sora 2, Hailuo, Wan, Pika, Runway Gen-4.
**Overlap** — The same output artefact as our final stage and the same per-model divergence problem. Its 5-stage skeleton independently confirms that camera rules deserve their own stage rather than being sprinkled through prose — which is what the `camera`, `framing` and `lens` slots of `StructuredPrompt` encode.
**Useful idea** — The **per-model capability catalogue**: target models differ in duration ceiling, negative-prompt support and filter strictness. Our formatter modes need exactly this — a per-mode capability record (word budget, slot ordering, negative-prompt support, maximum simultaneous camera moves), not just a string template. *(This record is not named in the canonical data model; see §11 assumptions.)*
**What we must NOT copy** — This repo is the perfect illustration of the trap the License Guard exists to catch: **a permissively licensed wrapper around all-rights-reserved content**, where an automated "MIT therefore safe" check would be wrong. Also do not copy its advice to specify real Panavision/IMAX lens nomenclature — brand-name optical claims asserted from an image violate the lens rule — and its one-click genre template packs are the degradation the brief forbids.
**Our differentiation** — **Reference Mixing.** It generates *from an idea*. We generate *from references the user chose and dissected*, with conflicts detected and surfaced for the user to arbitrate rather than blended away by a template.
**Sources:** [repo](https://github.com/jnMetaCode/ai-shortfilm-prompts)

### 3.2 C2 · Image-to-prompt interrogators, taggers and captioners

Every project here implements the same shape: **one media in → one text blob out.** Some are excellent at it. None produces a typed, per-category, editable, searchable representation of a reference — and a text blob cannot support the four operations our pipeline requires: you cannot ask a sentence for only its `lighting` and `camera_angle`; you cannot deterministically take half of paragraph A and a third of paragraph B; you cannot detect a conflict where no category membership exists; and you cannot execute a KEEP/CHANGE query over prose.

#### 3.2.1 pharmapsychotic/clip-interrogator

**Repository** — [pharmapsychotic/clip-interrogator](https://github.com/pharmapsychotic/clip-interrogator)
**License** — MIT. Verified: LICENSE fetched, "Copyright (c) 2022 pharmapsychotic".
**Main function** — Image → Stable Diffusion-style prompt string: a BLIP caption plus CLIP-ranked phrases drawn from five flat label files (`artists`, `flavors`, `mediums`, `movements`, `negative`) and a synthesised "trending on {site}" list; modes `classic` / `fast` / `negative` / `best`, output truncated to the CLIP token limit.
**Overlap** — The canonical image-to-prompt tool, and it *does* have a proto-taxonomy: artist / medium / movement / trending / flavor are categories, scored separately by `rank_top()`.
**Useful idea** — The `LabelTable` pattern: **pre-embed a controlled vocabulary once, cache the embeddings, then rank an image against it by dot product** (`similarity = text_features @ image_features.T`, labels chunked by `np.array_split`). We can run exactly this per taxonomy category over `data/taxonomy/*.json` to populate `VisualIntent` with per-chip `confidence` and no captioner at all — a cheap AI-ON tier that still produces structure.
**What we must NOT copy** — (a) The five `.txt` label files: `flavors.txt` alone is 100,970 lines / 1.72 MB of scraped prompt phrases plus a raw artist-name list; copying it breaches the prompt-DB prohibition regardless of the MIT code licence and imports an obvious attribution/ethics problem. (b) The `"caption, medium artist, trending, movement, flaves"` output template — the moment categories are comma-joined the decomposition is lost. (c) CLIP token truncation as prompt-length policy; our budget is per formatter mode.
**Our differentiation** — **Reference Decomposition.** CLIP Interrogator computes category-level scores and then discards the category labels into one string. We keep the category as a first-class field, so the same ranking work yields `visual_attributes.lighting`, `.composition`, `.camera_angle` as separate arrays with confidence, and a user can extract lighting from a reference and nothing else.
**Sources:** [repo](https://github.com/pharmapsychotic/clip-interrogator) · [clip_interrogator.py](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/clip_interrogator/clip_interrogator.py) · [LICENSE](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator/main/LICENSE) · [flavors.txt](https://github.com/pharmapsychotic/clip-interrogator/blob/main/clip_interrogator/data/flavors.txt)

#### 3.2.2 pharmapsychotic/clip-interrogator-ext

**Repository** — [pharmapsychotic/clip-interrogator-ext](https://github.com/pharmapsychotic/clip-interrogator-ext)
**License** — MIT. Verified: LICENSE fetched, "Copyright (c) 2023 pharmapsychotic".
**Main function** — Wraps CLIP Interrogator as a Stable Diffusion WebUI tab plus an HTTP API with three endpoints: list models, generate a prompt from an image, and **analyze an image returning words with associated confidence scores**.
**Overlap** — Same image→prompt function delivered inside an existing generation UI — the posture our later ComfyUI node takes.
**Useful idea** — It splits "prompt" from "analyze → terms + confidences" into **two separate API surfaces**. That is our analyzer/formatter seam, shipped: the analyzer returns scored terms, the formatter decides the string. It also proves the underlying machinery can expose `(term, score)` pairs — the product surface just usually does not.
**What we must NOT copy** — Its coupling of UI to engine (it is a WebUI script, not a library); the brief explicitly prohibits coupling UI with the prompt engine. Also its one-shot interaction model: analyze, paste a string, done — no reference persists.
**Our differentiation** — **Unified Modal.** This extension is a *tab* you visit and leave. Our product keeps text / image / video / browse as `ExplorerState.mode` values inside one modal whose `intent`, `pinned_reference_ids`, `mix`, `difference` and `filters` survive every mode switch (INV-EXP-1), so an analysed image immediately becomes a reference card you can search from, extract from and mix.
**Sources:** [repo](https://github.com/pharmapsychotic/clip-interrogator-ext) · [LICENSE](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/LICENSE) · [README](https://raw.githubusercontent.com/pharmapsychotic/clip-interrogator-ext/main/README.md)

#### 3.2.3 WD14 / WD Tagger model weights (SmilingWolf)

**Repository** — Hugging Face: `SmilingWolf/wd-vit-tagger-v3`, `wd-swinv2-…`, `wd-convnext-…`, `wd-eva02-large-tagger-v3`, plus the older `wd-v1-4-*-tagger-v2` family.
**License** — **UNVERIFIED.** `huggingface.co` and `hf.co` are blocked by the research environment's egress proxy, so no model card was read. Secondary sources assert Apache-2.0; that is hearsay and must not be recorded as fact. The *training-code* repo separately has no licence at all (§3.2.4).
**Main function** — Image → multi-label booru tag predictions with a per-tag probability over a fixed vocabulary, split into `rating` / `general` / `character` categories.
**Overlap** — The closest existing thing to `VisualIntent` in the whole survey: verified from the consuming node's code, the companion CSV carries the tag name in column 1 and a **category id in column 2** (`0` = general, `4` = character), and two independent thresholds are applied. The real model output is a vector of `(tag, probability)` over a closed vocabulary *with a coarse category id*; only the last step flattens it. The Danbooru tag space also contains many of our categories in disguise — `from_below` (camera_angle), `cowboy_shot` (camera_distance/framing), `backlighting` (lighting), `school_uniform` (clothing), `rain` (weather).
**Useful idea** — The integration design falls out of that shape: `(tag, probability, category-id)` → an alias lookup in *our* `TaxonomyNode.aliases` → `{array, value, confidence}`. Three rules follow. (1) The mapping table lives in our taxonomy, never in the model. (2) Tag probability becomes `IntentChip.confidence`, keeping the output a proposal. (3) One tag may legitimately populate two arrays (`rain` → `weather` **and** `scene`) — which is why every `VisualIntent` field is an array, and why `scene` is the one array permitted a foreign namespace (INV-PROPS-1).
**What we must NOT copy** — The booru vocabulary as our schema (anime domain, NSFW-heavy, Danbooru-derived, unclear licensing on both weights and tag list), the `rating: safe/questionable/explicit` axis, and the "dump every tag above threshold, comma-join, escape parentheses" output format — that escaping exists only to survive an A1111 prompt parser and has nothing to do with meaning.
**Our differentiation** — **Visual Intent.** A tagger produces one flat bag of tags for one image. Our schema is the *same* structured target for text, image, video and reference-card inputs, with typed arrays and both per-value and per-category confidence — so a tagger is one possible `analyzer-adapter` feeding it, never the schema, and with AI off the same fields are filled by browse and keyword search (INV-AI-1).
**Sources:** [wd14tagger.py decode logic](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py) · [SW-CV-ModelZoo](https://github.com/SmilingWolf/SW-CV-ModelZoo)

#### 3.2.4 SmilingWolf/SW-CV-ModelZoo

**Repository** — [SmilingWolf/SW-CV-ModelZoo](https://github.com/SmilingWolf/SW-CV-ModelZoo)
**License** — **NONE.** Verified *absence*: the raw LICENSE URL returns HTTP 404 and the README has no licence section. All rights reserved by default.
**Main function** — TensorFlow/Keras training code and experiment log for the anime-tagging models behind the WD taggers; trained on the "Danbooru2021, 512px SFW subset", results reported over "All 5500 tags".
**Overlap** — Only as provenance for the structured-tag output we find interesting; no product overlap.
**Useful idea** — It demonstrates, by omission, the required **triple separation**: training data (Danbooru, third-party terms) ≠ model weights (separately distributed) ≠ training code (this repo). That is exactly what brief question 8 demands, and it shows what happens when the separation is left implicit — a widely depended-on repository whose code nobody actually has permission to use.
**What we must NOT copy** — Any code from it, and the practice of publishing a load-bearing repository with no LICENSE file.
**Our differentiation** — **Reference Decomposition plus the License Guard.** Our `Reference` carries `metadata.license`, `license_url`, `source_url`, `attribution` and a `status` of `candidate | approved | rejected | license_review`, and INV-LIC-1/2/3 make it structurally impossible for an unverified licence to reach `approved`. This repository is the live illustration of why that gate exists.
**Sources:** [repo](https://github.com/SmilingWolf/SW-CV-ModelZoo) · [LICENSE, 404](https://raw.githubusercontent.com/SmilingWolf/SW-CV-ModelZoo/main/LICENSE)

#### 3.2.5 pythongosssss/ComfyUI-WD14-Tagger

**Repository** — [pythongosssss/ComfyUI-WD14-Tagger](https://github.com/pythongosssss/ComfyUI-WD14-Tagger)
**License** — MIT for the node code. Verified: LICENSE fetched, "Copyright (c) 2024 pythongosssss". **Model licences are not stated by the README.**
**Main function** — A ComfyUI node: image → booru tag string, using ONNX models downloaded at runtime; parameters `threshold`, `character_threshold`, `exclude_tags`, replace-underscore; one `tag_string` output.
**Overlap** — The reference implementation of a structured tagger inside a node graph — the environment our post-MVP node targets.
**Useful idea** — **Two thresholds for two tag classes** (0.35 general, 0.85 character): identity-like attributes deserve far more conservative confidence gates than descriptive ones. We adopt per-category thresholds in the analyzer adapter, with `lens` the most conservative of all — consistent with the lens rule and with INV-VID-3, which caps an `analyzer_image`-sourced `motion` chip at `confidence ≤ 0.6` and forces `evidence.kind: "implied"`.
**What we must NOT copy** — The single `tag_string` output socket: our node contract is `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` — four outputs, three of them structured. Also the silent runtime auto-download of weights whose licence the node never states; our THIRD_PARTY_NOTICES policy forbids that posture.
**Our differentiation** — **Selective Inheritance.** A tag string cannot be partially inherited; a `visual_intent` output can. Because the node hands over typed arrays rather than one socket of prose, composition can come from one reference and clothing from another.
**Sources:** [repo](https://github.com/pythongosssss/ComfyUI-WD14-Tagger) · [LICENSE](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/LICENSE) · [wd14tagger.py](https://raw.githubusercontent.com/pythongosssss/ComfyUI-WD14-Tagger/main/wd14tagger.py)

#### 3.2.6 picobyte/stable-diffusion-webui-wd14-tagger

**Repository** — [picobyte/stable-diffusion-webui-wd14-tagger](https://github.com/picobyte/stable-diffusion-webui-wd14-tagger)
**License** — Self-declared as *"Public domain, except borrowed parts (e.g. `dbimutils.py`)"* — **not an SPDX identifier**, and it does not name which parts are borrowed under what terms. Verified only in the sense that the README statement itself was read.
**Main function** — An A1111 extension that interrogates booru-style tags for single or batch image files across several backends (WD 1.4 auto-downloaded, DeepDanbooru variants, an e621 model), producing tag files. The README states plainly "I didn't make any models".
**Overlap** — Batch interrogation of a folder into tag files — adjacent to building our reference index.
**Useful idea** — Multi-backend interrogation behind one UI with the model as a dropdown is practical proof of INV-AI-2 (no hardcoded backends) in the tagger domain.
**What we must NOT copy** — The licence posture. "Public domain, except borrowed parts" would fail our own `license_check` → `source_validation` stages. Reference reading only, never a code source.
**Our differentiation** — **Search by Difference.** Its endpoint is a `.txt` of tags per image — a dataset-labelling output. Ours turns the same tags into the structured half of hybrid retrieval, which is what lets a user mark KEEP `{composition, lighting, camera_angle}` and CHANGE `{clothing}`. Tag files cannot be queried that way.
**Sources:** [README](https://raw.githubusercontent.com/picobyte/stable-diffusion-webui-wd14-tagger/master/README.md)

#### 3.2.7 KichangKim/DeepDanbooru

**Repository** — [KichangKim/DeepDanbooru](https://github.com/KichangKim/DeepDanbooru)
**License** — MIT. Verified: LICENSE fetched, "Copyright (c) 2019 Kichang Kim".
**Main function** — Anime-domain multi-label tag classifier: image → booru tags with confidence; predecessor of the WD taggers and still bundled in many pipelines.
**Overlap** — Same structured-tag output shape as WD14; the historical precedent for describing an image as a *scored set of vocabulary items* rather than a sentence.
**Useful idea** — It ships its tag list versioned **together with** the model. Generalised: pin the taxonomy version to the analyzer version, otherwise confidence values from two model generations are not comparable. Our schema already carries the hooks — `TaxonomyNode.schema_version` and the taxonomy file's `version`, `Reference.analyzer_version`, `Evidence.detector` as an *adapter instance id* (e.g. `analyzer-adapter:local@2`), and `VisualRecipe.integrity.taxonomy_version`.
**What we must NOT copy** — The vocabulary and the anime-illustration domain assumption. Our taxonomy is photographic and cinematographic across the 20 `VISUAL_CATEGORY` members.
**Our differentiation** — **Reference Mixing.** DeepDanbooru describes one image in one flat namespace. We combine partial attribute sets from several references into one prompt and surface conflicts when two references disagree inside the same category, rather than auto-resolving them.
**Sources:** [LICENSE](https://raw.githubusercontent.com/KichangKim/DeepDanbooru/master/LICENSE)

#### 3.2.8 JoyCaption (fpgaminer/joycaption)

**Repository** — [fpgaminer/joycaption](https://github.com/fpgaminer/joycaption)
**License** — Apache-2.0 for the repository. Verified: LICENSE fetched, "Copyright 2024 fpgaminer@bitcoin-mining.com". **Model weights: UNVERIFIED** — distributed on a blocked host and built on Llama 3.1, whose upstream community licence may propagate.
**Main function** — A free, open, uncensored captioning VLM built for training diffusion models; the Gradio app exposes 12 caption modes plus ~27 "extra options" toggles.
**Overlap** — **This is the most important entry in C2, because it proves the dead end is a choice.** Its extra options read verbatim: `"Include information about lighting."`, `"Include information about camera angle."`, `"Include information on the image's composition style, such as leading lines, rule of thirds, or symmetry."`, `"Specify the depth of field and whether the background is in focus or blurred."`, `"Explicitly specify the vantage height (eye-level, low-angle worm's-eye, bird's-eye, drone, rooftop, etc.)."`, plus a shot-size ladder from extreme close-up to extreme wide shot. Read against our taxonomy: `lighting`, `camera_angle`, `composition`, `lens`, `camera_distance`, `framing`. **That option list is a taxonomy — expressed as instructions to a language model, and then dissolved into a paragraph where none of it can be addressed again.**
**Useful idea** — Two, adoptable immediately. (1) The **checkbox-per-attribute input affordance** is right — users understand "include lighting" — and it is also the natural UI for KEEP/CHANGE in Search by Difference; only the *output* must change from sentence to field. (2) Its ordered ladders (shot size; vantage height) are good candidate value sets for `camera_distance.*` and `camera_angle.*`, expressed in our own words. Its instruction to avoid meta phrases like "This image shows…" is a cheap quality rule for `formatter-generic`.
**What we must NOT copy** — The weights or any derived caption corpus (licence unresolved, Llama 3.1 lineage, deliberately uncensored — incompatible with a licence-clean Wikimedia/Openverse reference pool); the option strings verbatim (they are prompt text bound to one specific model, and our taxonomy must be model-independent); and above all the final flattening of known categories into one paragraph.
**Our differentiation** — **Visual Intent.** JoyCaption asks the model for lighting, camera angle, composition and depth of field and returns them as prose. We ask for the same things and return `VisualIntent.lighting[]`, `.camera_angle[]`, `.composition[]`, `.lens[]` as `IntentChip` objects with per-value confidence and per-category aggregate confidence, always user-editable, rendering `"35mm-like perspective"` rather than asserting `"35mm"`. Same analysis, non-destructive output.
**Sources:** [repo](https://github.com/fpgaminer/joycaption) · [LICENSE](https://raw.githubusercontent.com/fpgaminer/joycaption/main/LICENSE) · [gradio-app/app.py](https://raw.githubusercontent.com/fpgaminer/joycaption/main/gradio-app/app.py)

#### 3.2.9 Florence-2 (Microsoft)

**Repository** — Hugging Face `microsoft/Florence-2-large` / `-base` / `-*-ft`. There is no canonical Microsoft GitHub repo; `github.com/microsoft/Florence` returns 404.
**License** — **UNVERIFIED** — widely reported MIT, not confirmed firsthand (both the model card host and the paper host were blocked).
**Main function** — A unified prompt-based vision model (0.2B / 0.7B class) where a task token selects the output: `<CAPTION>`, `<DETAILED_CAPTION>`, `<MORE_DETAILED_CAPTION>`, `<OD>`, `<DENSE_REGION_CAPTION>`, phrase grounding, OCR, segmentation; region tasks post-process into `{'bboxes': [[x1,y1,x2,y2], …], 'labels': […]}` **(UNVERIFIED)**.
**Overlap** — The strongest candidate analyzer backend in C2 for the "real image analysis" milestone: small, fast, and emitting *grounded regions* in addition to captions.
**Useful idea** — The **task-token design is a clean adapter contract**: `analyze(media, task)` with task ∈ {intent, regions, caption}, so a grounding-capable backend can populate `composition` and `framing` from box geometry (subject placement, rule-of-thirds occupancy, headroom) while a tagger backend populates the same categories from tags. Geometry is measurable structured data — a strictly better `composition` signal than any caption, and it maps naturally onto `Evidence.bbox` (normalised 0..1).
**What we must NOT copy** — The three-tier caption ladder as a product output: `CAPTION` / `DETAILED_CAPTION` / `MORE_DETAILED_CAPTION` are three lengths of the same undecomposable blob, and verbosity is not structure. And no hardcoding of a model id anywhere; it sits behind `src/ai/analyzer.js`.
**Our differentiation** — **Reference Decomposition.** Florence-2 returns either a paragraph or a set of boxes; neither is a reference. Our `Reference` pairs `visual_attributes` with the licence/status half that makes it *usable*; Florence-2 output is one input to `visual_attributes` and never touches the other half.
**Sources:** [model card (blocked)](https://huggingface.co/microsoft/Florence-2-large) · [paper (blocked)](https://arxiv.org/abs/2311.06242) · [kijai/ComfyUI-Florence2](https://github.com/kijai/ComfyUI-Florence2)

#### 3.2.10 kijai/ComfyUI-Florence2

**Repository** — [kijai/ComfyUI-Florence2](https://github.com/kijai/ComfyUI-Florence2)
**License** — MIT for the node code. Verified: LICENSE fetched, "Copyright (c) 2024 Jukka Seppänen". Weights it downloads are unlicensed by the README.
**Main function** — ComfyUI nodes wrapping Florence-2 for captioning, object detection, segmentation and DocVQA, downloading base/ft and community fine-tunes (including PromptGen variants) at runtime.
**Overlap** — Node-graph delivery of a captioner — the same shape as our future node.
**Useful idea** — Running several model variants behind one node with a model dropdown is practical evidence that brief question 7 ("can the AI model be swapped later?") is answerable *yes* in the ComfyUI environment, provided the model is a parameter and not an import.
**What we must NOT copy** — Stating no licences for the weights it auto-downloads, and the single text output socket.
**Our differentiation** — **Unified Modal.** In a node graph, "search for a reference", "look at candidates" and "compose a prompt" are disconnected or absent. Our MVP is one modal where the four modes share persistent state; the node comes later and inherits the shared modules, not the reverse.
**Sources:** [repo](https://github.com/kijai/ComfyUI-Florence2) · [LICENSE](https://raw.githubusercontent.com/kijai/ComfyUI-Florence2/main/LICENSE)

#### 3.2.11 BLIP / BLIP-2 (Salesforce, via LAVIS)

**Repository** — [salesforce/BLIP](https://github.com/salesforce/BLIP) (deprecated) and [salesforce/LAVIS](https://github.com/salesforce/LAVIS)
**License** — BSD-3-Clause for both, code. Verified: both `LICENSE.txt` files fetched. Per-checkpoint weight terms **(UNVERIFIED)** and must be checked individually.
**Main function** — Vision-language pretraining: captioning, VQA, image-text retrieval and feature extraction; LAVIS ships BLIP-2, InstructBLIP, BLIP-Diffusion, X-InstructBLIP and 30+ pretrained weights. The BLIP repo carries a deprecation banner advising against production use.
**Overlap** — BLIP is the caption half of CLIP Interrogator, so it sits upstream of most of C2; LAVIS also ships retrieval models, touching our semantic-search module as well as the analyzer.
**Useful idea** — LAVIS's split between *feature extraction* and *generation* mirrors the brief's rule that retrieval and analysis are separate modules. Its multimodal/unimodal feature-extraction API is a good shape for our `embedding-adapter`, which must place text queries, images and video frames in one space.
**What we must NOT copy** — BLIP-style short generic captions as any part of our schema — "a woman standing on a street at night" contains almost none of our 20 categories and cannot be decomposed. Also do not build on the deprecated repo.
**Our differentiation** — **Unified Modal with Visual Intent.** LAVIS is a library of models; the product question — how a user gets from "I have this photo" to "same lighting, different outfit, now give me a prompt" *without knowing where to search* — is untouched by it. "User should never need to know where to search" is a product-layer claim no model library makes.
**Sources:** [BLIP LICENSE](https://raw.githubusercontent.com/salesforce/BLIP/main/LICENSE.txt) · [LAVIS LICENSE](https://raw.githubusercontent.com/salesforce/LAVIS/main/LICENSE.txt) · [LAVIS README](https://raw.githubusercontent.com/salesforce/LAVIS/main/README.md)

#### 3.2.12 moondream (vikhyat/moondream)

**Repository** — [vikhyat/moondream](https://github.com/vikhyat/moondream)
**License** — Apache-2.0 for the code. Verified: LICENSE fetched plus GitHub label. **Weights: UNVERIFIED** (hosts blocked).
**Main function** — A tiny vision language model (2B and 0.5B variants) offering captioning, visual question answering and object detection.
**Overlap** — A strong candidate for our local-first, privacy-preserving analyzer: the brief requires user media to be processed locally by default, and a 0.5B–2B model is laptop-deployable.
**Useful idea** — Small-model local VLM analysis is viable today, which supports the local-first stance with no external-transmission disclosure at all (`ai.external_transmission.allowed` stays `false`). Its pointing/detection capability, if confirmed, yields subject-placement coordinates that feed `composition` and `Evidence.bbox` directly.
**What we must NOT copy** — The **regex-out-of-prose pattern**: the demo obtains bounding boxes by regex-matching four floats out of generated text, so structured data the model demonstrably has must be reconstructed from a sentence. Any structure we need must be produced by the adapter as a typed object validated against our schema; if a backend can only emit text, we parse once at the boundary and discard the prose. Structured data must never round-trip through prose *inside* our pipeline.
**Our differentiation** — **Selective Inheritance.** moondream can say where the subject is and what it looks like, but cannot let you take *this* photo's composition and *that* video's camera motion. `ReferenceMix` makes the answer to brief question 4 a schema rather than a prompt-engineering trick.
**Sources:** [repo](https://github.com/vikhyat/moondream) · [LICENSE](https://raw.githubusercontent.com/vikhyat/moondream/main/LICENSE) · [gradio_demo.py](https://raw.githubusercontent.com/vikhyat/moondream/main/gradio_demo.py)

#### 3.2.13 img2prompt web tools (Picsart, ImagePrompt.org, VideoTok, GeneratePrompt.ai, PixelPanda, Replicate `methexis-inc/img2prompt`)

**Repository** — N/A — closed products; the Replicate model is a hosted CLIP Interrogator wrapper.
**License** — proprietary, per-site terms. **(UNVERIFIED** — every one of these domains was blocked; all characteristics below come from search-result descriptions.)
**Main function** — Upload an image → receive one or several prompt strings targeted at Midjourney / Flux / SD / DALL·E, usually behind a daily free-credit limit.
**Overlap** — They define the category expectation our image mode is judged against, and their per-target-model formatting is the same job as `formatPrompt(structured_prompt, mode)`.
**Useful idea** — Exactly one: **multi-target formatting from a single analysis** is clearly valued by users, which validates rendering one `StructuredPrompt` through several formatters — and argues for keeping the structured intermediate, since these sites must re-run the whole analysis per target while we merely re-render (INV-FMT-1 makes that re-render byte-deterministic).
**What we must NOT copy** — The entire product shape: upload → wait → copy a blob → leave. The result is not editable field by field, not saveable as a reference, not searchable, not mixable, and the source images are unlicensed uploads. Also not the credit-metered, signup-walled funnel: v0.1 must work with no AI and no account.
**Our differentiation** — **Reference Mixing.** These tools answer "what prompt describes THIS image?". Our product answers "composition of A, outfit of B, lighting of C, camera move of video D, as one prompt" — and surfaces the conflict when A and C disagree about lighting instead of silently picking one. That question is not expressible in any of these UIs.
**Sources:** [Picsart](https://picsart.com/image-to-prompt/) · [ImagePrompt.org](https://imageprompt.org/image-to-prompt) · [PixelPanda](https://pixelpanda.ai/free-tools/image-to-prompt) · [Replicate img2prompt](https://replicate.com/methexis-inc/img2prompt)

### 3.3 C3 · Reference galleries, boards and commercial style-reference features

This cluster confirms the demand and marks the wall. Every product here treats a reference as an **atom**: copy the whole prompt, pin the whole image, or hand the whole picture to a model as one style blob. The commercial members have gone furthest — Midjourney has conceded that one reference should not have to contribute everything — and they have all stopped at a two-slot, opaque split. §8 treats that concession in full.

#### 3.3.1 Lexica

**Repository** — N/A — closed product (`lexica.art`). Community client: [transitive-bullshit/lexica-api](https://github.com/transitive-bullshit/lexica-api).
**License** — Product proprietary **(UNVERIFIED** — host blocked); client wrapper MIT (verified via GitHub label).
**Main function** — A search engine over 10M+ Stable Diffusion images where every result exposes its full prompt; CLIP-embedding similarity plus reverse-image search via `GET /api/v1/search?q=<term|image URL>`, ~50 results per call.
**Overlap** — The canonical "search visually, get a prompt" loop and the naive ancestor of our idea. Its reverse-image search is a primitive of our image → similar-reference-search step; its CLIP index is the same family as our `semantic-search` module.
**Useful idea** — **One query parameter accepting either text or an image URL.** A miniature, shipped proof that the surface stays constant while only the input mode changes — the API shape that makes a Unified Modal honest rather than cosmetic. Also: the *metadata* is the payload, not the image.
**What we must NOT copy** — Do not mirror or bulk-ingest its index: user-generated SD output with no per-image licence provenance, which fails `license_check` and can never reach `approved`. Do not copy its output contract either — an opaque prompt string is the whole-blob failure mode the brief forbids.
**Our differentiation** — **Reference Decomposition.** A Lexica hit is one string; ours is a `Reference` with typed `visual_attributes` that EXTRACT can lift category by category. Lexica cannot express "same lighting, different outfit"; that is `difference.keep` / `difference.change`, a first-class query type for us.
**Sources:** [lexica-api](https://github.com/transitive-bullshit/lexica-api) · [Lexica API tutorial](https://lablab.ai/ai-tutorials/stable-diffusion-lexica) · [Lexica docs](https://lexica.art/docs)

#### 3.3.2 PromptHero

**Repository** — N/A — closed product (`prompthero.com`).
**License** — proprietary **(UNVERIFIED** — host blocked).
**Main function** — A prompt search engine across Midjourney / Stable Diffusion / DALL·E / ChatGPT with model filters, keyword + style + camera-technique search, curated collections, an academy, and a per-request-priced API.
**Overlap** — Ships a crude version of our facets (subject, artist style, camera technique) and a per-target-model filter that is a distant cousin of `formatPrompt(structured_prompt, mode)`.
**Useful idea** — **Model-aware output**: the same intent must be rendered differently per generator, which validates keeping the formatter a swappable module downstream of `StructuredPrompt` rather than baking syntax into the composer. Its business model is also instructive as a warning: when the prompt corpus *is* the product, the incentive is to hoard scraped content.
**What we must NOT copy** — Its taxonomy is presentational: "camera technique" is a search keyword, not a typed field with a controlled vocabulary and a confidence. Copying that shape collapses us into "pick a few options → get a prompt". No ingestion of its prompt DB.
**Our differentiation** — **Reference Decomposition.** PromptHero's filters narrow a list of *finished prompts*. Our taxonomy is the schema of the artefact itself, so an attribute can be lifted out of one reference and inherited into another.
**Sources:** [feature breakdown](https://www.futurepedia.io/tool/prompthero) · [pricing summary](https://www.neura.market/directories/ai-tools/prompthero)

#### 3.3.3 OpenArt

**Repository** — N/A — closed product (`openart.ai`).
**License** — proprietary **(UNVERIFIED)**.
**Main function** — A gallery of 10M+ community creations where each image exposes its full prompt and settings, with a one-click "remix" action and an educational Prompt Book.
**Overlap** — "Click any image → see its full prompt setup → remix it" is the closest shipped UX to our USE-everything card action (`use: ["*"]`) — the whole-blob branch of our explore menu.
**Useful idea** — **Remix as the default verb**: a gallery item is a *starting state*, not a finished artefact. The Prompt Book also shows the value of teaching vocabulary in-product, which supports the north-star case "I don't know what this lighting is called — let me pick it by looking at pictures."
**What we must NOT copy** — Its remix is all-or-nothing: you inherit the whole prompt string and then hand-edit text. That is text surgery, not attribute surgery. Do not copy their gallery content or Prompt Book text.
**Our differentiation** — **Selective Inheritance.** Our remix is `{ "reference_id": "img_A", "use": ["composition", "camera_angle"] }`. OpenArt cannot express "these two categories and nothing else", and has no notion of a conflict between two sources.
**Sources:** [gallery/prompt features](https://ec-arts.com/openart-ai-review-prompt-gallery-filters/) · [review](https://promptsrush.com/blog/openart-review)

#### 3.3.4 Civitai

**Repository** — [civitai/civitai](https://github.com/civitai/civitai)
**License** — Apache-2.0 for the **application code only**, not the hosted content. Verified: LICENSE fetched, GitHub `spdx_id: Apache-2.0`.
**Main function** — A community platform for AI models and AI-generated media; a public REST API at `/api/v1/` exposing models, model versions, images, creators and tags, with generation metadata attached to images.
**Overlap** — The largest open store of image + generation-metadata pairs, and its API surface (search with filters, fetch metadata by id, fetch preview) is the shape our `src/providers/*.js` interface is modelled on.
**Useful idea** — The **provider adapter contract** itself — three separable capabilities: search with filters, fetch full metadata by id, fetch a preview. Plus the lesson that licence/permission must be a first-class field on every record rather than a footnote.
**What we must NOT copy** — Two hard lines. (1) Do not bulk-export Civitai content: their ToS prohibits spiders, robots, crawlers and data-mining tools except through expressly provided interfaces with valid credentials and within rate limits. Third-party bulk scrapers such as `hassan-sd/civitai-image-scraper` — which additionally ships **no licence file at all** — are an anti-pattern, not a template. (2) Do not copy Apache-2.0 application code without NOTICE compliance, and we should not need to.
**Our differentiation** — **Reference Decomposition.** Civitai stores *generation parameters* (prompt, sampler, seed); we store editable, model-agnostic *perceptual attributes*, so "same framing, different outfit" is a query we can answer and Civitai structurally cannot. And our License Guard means we never hold a corpus of unknown-licence images in the first place.
**Sources:** [repo](https://github.com/civitai/civitai) · [LICENSE](https://raw.githubusercontent.com/civitai/civitai/main/LICENSE) · [ToS](https://civitai.com/content/tos) · [anti-pattern scraper](https://github.com/hassan-sd/civitai-image-scraper)

#### 3.3.5 Midjourney Style Reference (`--sref`) and Omni Reference (`--oref`)

**Repository** — N/A — closed product (`docs.midjourney.com`, blocked).
**License** — proprietary **(UNVERIFIED)**.
**Main function** — Attach images or a numeric style code to a prompt so the model inherits their aesthetic (`--sref`, strength `--sw` 0–1000 default 100, algorithm `--sv`, inline weights `URL1::2 URL2::1`) or their subject identity (`--oref`, strength `--ow` 1–1000 default 100; 25–50 permits stylization, 400+ enforces strict adherence). All parameter details **(UNVERIFIED at source)**, from integrator documentation.
**Overlap** — **The nearest commercial analogue to Selective Inheritance and the single most important entry in this survey.** Midjourney has explicitly conceded the premise: one reference should not have to contribute everything, so it split a reference into a style channel and a subject channel.
**Useful idea** — Three. (1) **Per-reference weights with an explicitly documented scale and default** (0–1000, default 100) — far more usable than an unlabelled slider, and a direct model for how we should document `MixEntry.weight` (0..1, default 1) and `priority` (0..1000, default 0). (2) Inline per-reference weighting syntax. (3) The subject/style split is the *minimum viable decomposition*, and it proves users understand and want per-channel control.
**What we must NOT copy** — The failure mode, which is the point of our product. `--sref 3847291` is an opaque pointer into learned style space: it cannot be decomposed into "warm colour temperature + chiaroscuro + analog grain", cannot be explained, cannot be edited incrementally, and cannot be carried to another model. The style channel is one undifferentiated blob, so you cannot take the *lighting* from one sref and the *colour* from another. There are two categories, not twenty. There is no editable intermediate representation, which violates "AI output is a proposal, never a commitment". And the separation is statistical rather than structural — community documentation repeatedly notes costumes, props and accessories leaking through. Also: do not build or redistribute an sref-code database; it is an account-bound artefact with no licence we can rely on.
**Our differentiation** — **Reference Decomposition and Reference Mixing together.** Ours is an N-category, human-readable, user-editable decomposition: 19 typed `IntentChip` arrays plus a per-category `confidence` map, every chip carrying `ref_id`, `source`, `confidence`, `locked` and `alternatives`, and `ReferenceMix` naming exactly which categories come from which reference. Midjourney cannot answer "same movement as this video, but the camera work of that video" — two *video* references contributing `motion` and `camera_motion` respectively, which is no conflict at all by construction. See §8 for the full argument.
**Sources:** [Style Reference docs (blocked)](https://docs.midjourney.com/hc/en-us/articles/32180011136653-Style-Reference) · [`--sref` weights explainer](https://prompt-architects.com/blog/214-style-references-in-midjourney-sref-explained) · [`--oref` guide](https://imigo.ai/en/media/omni-reference-in-midjourney-v7) · [sref codes are opaque](https://midlibrary.io/midguide/deep-dive-into-midjourney-sref-codes)

#### 3.3.6 Krea 2 style references and moodboards

**Repository** — N/A — closed product (`krea.ai`, blocked).
**License** — proprietary **(UNVERIFIED)**.
**Main function** — An image model with a dedicated style-transfer slot: dropped reference images have their palette, line work, texture, lighting and composition language extracted and applied to a new prompt, with per-image strength (and reportedly negative) weights, custom style training, and moodboards. Reference counts conflict across sources (four images vs ten) — **(UNVERIFIED)**.
**Overlap** — The most ambitious commercial multi-reference mixer: multiple weighted style references at once, trained styles reusable as references, and a moodboard surface that is conceptually our `VisualRecipe`.
**Useful idea** — **Negative reference weights.** "Less like this one" is a real, largely unclaimed control. Scoped to a *category* — "keep this lighting, actively avoid that palette" — it is strictly more expressive than Krea's whole-image version, and it composes naturally with `difference.change_targets` (directed change). Krea's public position that reference handling deserved as much effort as the foundation model is also a useful argument that **reference handling is a product, not a feature**.
**What we must NOT copy** — Extraction is still a single latent style blob per image: Krea *names* the components it captures but offers no UI to select among them, so "from this image, lighting only" is inexpressible. Do not copy Krea model weights, LoRAs or derived style artefacts.
**Our differentiation** — **Reference Mixing.** Krea mixes references image-wise with a per-image weight; we mix attribute-wise with per-category `use[]` selection, and conflicts between references contributing to the same category are detected and surfaced rather than blended. Krea also has no Unified Modal — style transfer, generation and moodboards are separate surfaces.
**Sources:** [Style references in Krea 2](https://www.krea.ai/blog/style-references-krea-2) · [Krea 2 deep dive](https://www.krea.ai/blog/krea-2-deep-dive-walkthrough)

#### 3.3.7 ShotDeck

**Repository** — N/A — closed product (`shotdeck.com`, blocked).
**License** — proprietary subscription; the underlying images are third-party film copyright **(UNVERIFIED)**.
**Main function** — A hand-tagged, fully searchable library of HD film/TV/commercial stills — reportedly 30+ categories and 50+ keywords per image covering crew, genre, cameras, lenses, framing, lighting, colour, composition, location and emotion — with composable filters and shareable "decks".
**Overlap** — **The strongest existing proof that Reference Decomposition is a product**, done by human taggers. Composable multi-facet filtering ("teal and orange + night exterior + 2.39:1") is exactly our `metadata-search` module validated at professional scale, and its category vocabulary closely tracks our `VISUAL_CATEGORY` list — confirming that this is how practitioners actually think.
**Useful idea** — Multi-facet AND-filtering with live visual results *is* the AI-OFF experience v0.1 owes users (INV-AI-1), and it is achievable with `filters.require_categories` plus the keyword index over `TaxonomyNode.aliases`. "Decks" — a saved, shareable set of references — is the interaction `VisualRecipe` must beat, by saving the *combination rule* (`intent` + `mix` + frozen `references`) rather than merely the images.
**What we must NOT copy** — Do not build or scrape a corpus of film stills: we have no licence to any of it, and a gated paid library creates both ToS and copyright exposure. Under our policy film stills are `unknown` and excluded by default.
**Our differentiation** — **Selective Inheritance.** ShotDeck lets you find a frame with the lighting you want and stops there — it cannot compose "this frame's lighting + that frame's wardrobe → a prompt". Our pipeline continues past retrieval into inheritance, mixing and `StructuredPrompt`, and extends to video and `camera_motion`, which a stills library cannot cover at all.
**Sources:** [ShotDeck (blocked)](https://shotdeck.com/) · [filter categories](https://www.soundstripe.com/blogs/recreating-film-looks-shotdeck) · [tagging depth](https://medium.com/@ivan_74570/free-shotdeck-alternatives-2025-12-ways-to-find-cinematic-references-without-the-paywall-05a94b9dcb6f)

#### 3.3.8 Film-Grab

**Repository** — N/A — closed site (`film-grab.com`).
**License** — **Not a licence.** The site presents frames under a self-declared fair-use claim for education and reference, and the owner states they do not own the imagery **(UNVERIFIED — site not fetched)**.
**Main function** — Curated, film-by-film galleries of high-resolution movie frames, browsed by title and director rather than by craft attribute.
**Overlap** — The free ancestor of ShotDeck; it organises references by *provenance* (which film) instead of by *attribute* (which lighting).
**Useful idea** — **Provenance-first browsing is a legitimate second axis.** `Reference.metadata` already carries `source`, `source_id`, `creator`, `license` and `attribution`, so "more from this source" is a nearly free EXPLORE action and matches how people actually recall references ("that shot from that film"). Film-Grab's explicit statement of its legal posture is also good practice; our per-card licence badge is the same instinct done rigorously.
**What we must NOT copy** — The fair-use posture itself. Film stills are copyrighted; fair use is a fact-specific defence applied inconsistently, and commercial use weighs against it. A tool that ingests film frames at scale and re-emits derived attributes is not a review blog. Under our policy such assets are `unknown` → excluded by default, and can never reach `approved`.
**Our differentiation** — **Visual Intent.** Film-Grab is a browsing archive with no schema. Every input — text, image, video, card — converts to the same structured schema for us regardless of source, which is what makes cross-source mixing possible; and we do it only over sources whose licence we can verify.
**Sources:** [fair-use posture](https://forfilmssake1.wixsite.com/home/post/film-grab-a-true-library-of-stills) · [film stills and fair use](https://education.onehowto.com/article/are-movie-screenshots-copyrighted-12627.html)

#### 3.3.9 Cinekive

**Repository** — [Gianluca-Improta/cinekive](https://github.com/Gianluca-Improta/cinekive)
**License** — MIT. Verified: GitHub `spdx_id: MIT`, README restates it.
**Main function** — A local-first cinematic still archive: ingests films, still folders and URLs, indexes frames with SigLIP semantic search in Qdrant (port 6333) over SQLite metadata, extracts craft attributes via an optional local Ollama VLM (cloud VLMs behind a paid tier), offers "craft graph" chips, rights badges and infinite-canvas moodboards.
**Overlap** — **The closest open-source neighbour in the entire survey**, and startlingly close to our architecture: hybrid semantic + metadata-routing retrieval, local-first with an optional cloud VLM, attribute chips as navigation, and a per-item rights badge.
**Useful idea** — Four. (1) Local-first with an optional cloud VLM is a *shipped* proof that AI-OFF can be a complete product and that the analyzer must be an adapter. (2) Semantic embeddings plus metadata routing is our fusion ranker in practice. (3) Craft-graph chips work as both filter and EXPLORE seed — our `intent-chips` should be clickable in both directions. (4) Rights badges are a lightweight sibling of `Reference.status`.
**What we must NOT copy** — MIT permits reuse, but do not vendor it: an Electron/Next.js/FastAPI/Qdrant stack is far heavier than our `app/index.html` plus plain-ES-module target, and adopting it would couple UI, search and enrichment, which the brief forbids. Do not copy its `yt-dlp` ingestion of film frames — that reproduces the Film-Grab licensing problem exactly.
**Our differentiation** — **Selective Inheritance.** Cinekive's craft tags *describe* an image but cannot be *lifted out of it*: it finds frames and pins them to a moodboard, with no `StructuredPrompt` output and no attribute inheritance. We turn those same tags into transferable parts and mix partial attributes from several references into one prompt.
**Sources:** [repo](https://github.com/Gianluca-Improta/cinekive) · [README](https://raw.githubusercontent.com/Gianluca-Improta/cinekive/main/README.md)

#### 3.3.10 Pinterest (and Pinry, the self-hosted equivalent)

**Repository** — Pinterest: N/A — closed product. Self-hosted equivalent: [pinry/pinry](https://github.com/pinry/pinry).
**License** — Pinterest proprietary **(UNVERIFIED)**; Pinry BSD-2-Clause (verified via GitHub `spdx_id`).
**Main function** — Pinterest: visual bookmarking onto boards with similarity-based discovery. Pinry: an open-source self-hosted tiling image board for saving, tagging and sharing images, videos and webpages across public and private boards.
**Overlap** — Pinterest defined the tiling visual board and the "save it because it looks right" behaviour our reference tray inherits. Pinry is the minimum viable version of that — pins, tags, boards, zero inference — roughly our v0.1 AI-OFF path.
**Useful idea** — **The board as working memory.** Users collect long before they know why, so the Explorer modal must let references accumulate without forcing a decision and must never close mid-exploration. `pinned_reference_ids` exists for exactly this, and INV-EXP-4 guarantees a mix contributor can never vanish from the tray. Pinry (BSD-2-Clause) is a legitimate reference implementation to *study* for the no-AI tag+board data model.
**What we must NOT copy** — **No Pinterest scraping — a hard prohibition.** Their ToS bans accessing or extracting data by "any robot, spider, crawler, scraper or other automated means or interface not provided by us", and their developer guidelines treat data extraction as unacceptable API use. Pins also carry no reliable licence metadata, so even a permitted import would fail License Guard.
**Our differentiation** — **Search by Difference.** A Pinterest board is a bag of images and its "more like this" is whole-image similarity. We mark composition, lighting and camera as KEEP and clothing as CHANGE and return frames holding three categories constant while varying the fourth — a query no board product can express.
**Sources:** [Pinry](https://github.com/pinry/pinry) · [Pinterest ToS](https://policy.pinterest.com/en/terms-of-service) · [anti-scraping clauses summarised](https://scrapeops.io/websites/pinterest/)

#### 3.3.11 Are.na

**Repository** — Platform: N/A — closed product (`are.na`). Client studied: [ivangreene/arena-js](https://github.com/ivangreene/arena-js).
**License** — Platform proprietary **(UNVERIFIED)**; client MIT (verified via GitHub `spdx_id`).
**Main function** — A research/collection platform where **blocks** (images, text, links, media) are joined to **channels** by **connections**; a block can live in many channels at once. The REST API supports custom key/value metadata on blocks, channels **and connections**.
**Overlap** — Structurally the most interesting entry in the survey: the *connection* — the specific instance and position of a block within a channel — is a first-class object carrying its own metadata. That is precisely the shape `ReferenceMix` needs.
**Useful idea** — **Edge-carried mix metadata — the single most transferable pattern in this document.** Keep `Reference` global and immutable (id, `visual_attributes`, licence, provenance) and attach `{use[], weight, priority, pinned, exclude, only, role}` to the *connection* between a reference and a mix. Our `MixEntry` is exactly that edge object. The consequences are concrete: the same reference contributes `lighting` in one recipe and `clothing` in another with no duplication and no mutation; conflict detection becomes a pure function over the edge set (`applyMix` is documented as pure and deterministic, producing the same `cfl_` ids for the same inputs); and `VisualRecipe` becomes trivially serialisable. Are.na's non-algorithmic, user-curated culture is also a good corrective: EXPLORE should expand options, not silently rank away the odd ones.
**What we must NOT copy** — Do not mirror Are.na channels or treat public blocks as a licensed corpus — they are user-submitted links and images with no uniform licence. Do not copy the flat-channel UI; flat lists are what we are replacing.
**Our differentiation** — **Reference Mixing.** Are.na models *which references belong together*. We model *which parts of which references belong together*, and then we surface and resolve the conflicts. Are.na has no taxonomy, no attribute extraction and no output artefact; our pipeline ends in a `StructuredPrompt` and a formatter.
**Sources:** [arena-js](https://github.com/ivangreene/arena-js) · [API channels docs](https://dev.are.na/documentation/channels) · [connections concept](https://help.are.na/docs/getting-started/connections)

#### 3.3.12 Eagle, with Hydrus and Diffusion Toolkit as open-source counterparts

**Repository** — Eagle: N/A — closed product. [hydrusnetwork/hydrus](https://github.com/hydrusnetwork/hydrus) · [RupertAvery/DiffusionToolkit](https://github.com/RupertAvery/DiffusionToolkit).
**License** — Eagle proprietary **(UNVERIFIED)**; Hydrus **WTFPL v3** (verified by reading `LICENSE`, even though the GitHub label reports `NOASSERTION`); Diffusion Toolkit MIT (verified via `spdx_id`).
**Main function** — Eagle: a local desktop reference manager with folders, tags, colour search and a local HTTP API on `localhost:41595` exposing tag search (`/api/v2/item/get`), full-text search (`/api/v2/item/query`) and AI semantic search (`/api/v2/aiSearch/searchByText`). Hydrus: a local booru-style tagger browsing by namespaced tags instead of folders, with a strict no-phone-home stance. Diffusion Toolkit: a local indexer/viewer of AI images by embedded PNGInfo prompt metadata.
**Overlap** — Together they cover the local-first half of the brief. Eagle's three coexisting retrieval modes map directly onto our `metadata-search` / `semantic-search` / `fusion-ranker` split; Hydrus supplies namespaced typed tags; Diffusion Toolkit supplies "browse your own output by its metadata".
**Useful idea** — Four. (1) Eagle's separation of exact tag match, full-text and semantic search into **distinct endpoints** is shipped proof that AI-optional is buildable, and it is why our `ResultSet.ranking.mode` can fall back to `metadata_only` / `keyword_only`. (2) Hydrus namespaces (`lighting:rim`, `framing:medium_close_up`) are a taxonomy-faithful, model-free serialisation — conceptually identical to our two-segment ids (`lighting.rim_lighting`, `framing.medium_close_up`) but without the stability guarantee that INV-TAX-1 provides by keeping hierarchy in `parent`. (3) A documented localhost API makes the reference store addressable by the later ComfyUI node. (4) Diffusion Toolkit's rule that user metadata survives file moves fixes identity to the record, not the path — the same reasoning behind our media-URL-rot policy, where identity is `(metadata.source, metadata.source_id)` and `media_url` is only a cache hint.
**What we must NOT copy** — Eagle is proprietary: do not reimplement its API as a compatibility layer or reuse its schema. Hydrus's data model is booru-shaped (flat, unbounded, community-sourced) and would dilute our controlled vocabulary. Critically, **none of the three stores per-asset licence provenance**, so copying their record shape would drop the field the License Guard is built on.
**Our differentiation** — **Unified Modal.** All three are libraries you *organise*, with separate panes, no conversion of a reference into a `VisualIntent`, no partial attribute inheritance and no prompt output. One modal with persistent state across mode switches is what delivers "user should never need to know where to search".
**Sources:** [Eagle Web API](https://developer.eagle.cool/web-api) · [Hydrus](https://github.com/hydrusnetwork/hydrus) · [Hydrus LICENSE](https://raw.githubusercontent.com/hydrusnetwork/hydrus/master/LICENSE) · [Diffusion Toolkit](https://github.com/RupertAvery/DiffusionToolkit)

#### 3.3.13 OpenAI `gpt-image-1` and Google Gemini reference-image conditioning

**Repository** — N/A — closed products.
**License** — proprietary **(UNVERIFIED** — `platform.openai.com` and `ai.google.dev` both blocked).
**Main function** — Image models that accept one or more input images alongside a text prompt and blend their style, structure and content into the output. OpenAI documents referencing each input image **by index and description**; Gemini is reported to blend multiple reference images to steer style, structure and content. Reported image-count limits conflict wildly across secondary sources (OpenAI 20 vs 500; Gemini 5 / 8 / 10 / 14) — **(UNVERIFIED)**, and none is safe to design against.
**Overlap** — The second-tier commercial analogue to Selective Inheritance. OpenAI's index+description convention concedes that the model must be *told what role each reference plays*.
**Useful idea** — Role assignment per reference means our structured `ReferenceMix` can be **compiled down** into a prompt these APIs already understand: "use image 1 for lighting, image 2 for wardrobe". That is a concrete future `gpt_image` formatter mode and a graceful degradation path into any generator that accepts reference images.
**What we must NOT copy** — Do not architect around any one of them. Role assignment here is free text interpreted by a black box: unverifiable, non-deterministic, un-inspectable, and silently different per model version. Our formatter must be pure and byte-deterministic (INV-FMT-1); an English instruction to a hosted model is none of those things.
**Our differentiation** — **Visual Intent.** These APIs consume references at generation time and discard the reasoning. We produce a persisted, user-editable intermediate — `VisualIntent` + `ReferenceMix` + `StructuredPrompt` — that exists *before and independently of* any generator, behind adapters so that no model name is ever hardcoded. For them, decomposition is a transient prompt-parsing side effect; for us it is a durable artefact that can be saved as a `VisualRecipe` and re-rendered years later.
**Sources:** [OpenAI image-gen prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide) · [4o image generation guide](https://www.promptingguide.ai/guides/4o-image-generation) · [Gemini image generation docs (blocked)](https://ai.google.dev/gemini-api/docs/image-generation)

### 3.4 C4 · Domain ontologies, datasets and benchmarks

This cluster is not competition; it is **evidence**. Fashion computer vision and film-studies annotation have each spent a decade proving that the typed decomposition our product depends on is real, professional and stable. They are also the worst licence minefield we will touch: nearly every high-quality dataset is research-gated, and the three best-known open virtual try-on models are all CC BY-NC-SA 4.0. Our brief already excludes `cc_by_nc` sources for *references*; the same discipline extends to *models and datasets*.

#### 3.4.1 Fashionpedia (ontology + dataset)

**Repository** — [cvdfoundation/fashionpedia](https://github.com/cvdfoundation/fashionpedia) (data) · [KMnP/fashionpedia-api](https://github.com/KMnP/fashionpedia-api) (API)
**License** — Dataset/ontology **UNVERIFIED** — widely reported CC BY 4.0 for annotations and ontology, but the authoritative terms page was unreachable and the data repo has no LICENSE file. API code: BSD-2-Clause (verified).
**Main function** — An expert-built fashion ontology — 27 main apparel categories, 19 apparel parts, 294 fine-grained attributes with typed relationships — plus ~48k images with instance segmentation masks and per-mask attributes (16.7 attributes per image on average, max 57).
**Overlap** — Direct overlap with our `clothing` subtree and with the premise that a reference is a bag of typed attributes. Its category → garment-part → attribute model with typed relations is a rigorous version of Reference Decomposition applied to one category.
**Useful idea** — **The attribute-supercategory axis.** Verified in `data/sample.json`: attribute supercategories include `silhouette`, `waistline`, `length`, `neckline type`, `opening type`, `knit`, `crochet`, `woven`, `non-woven`, `leather`, `non-textile material type`, `textile finishing`, `textile pattern`, `animal`; category supercategories include `upperbody`, `lowerbody`, `wholebody`, `head`, `neck`, `arms and hands`, `waist`, `legs and feet`, `garment parts`, `closures`, `decorations`. Grouping values *by axis* is exactly what our `TaxonomyNode.exclusivity_group` does, and it is the mechanism that lets `clothing` be a `multi` category while still detecting real conflicts: two values sharing `garment_top` conflict; a neckline and a textile pattern do not. Fashionpedia also demonstrates that other taxonomies map *into* it — DeepFashion2's 13 classes re-expressed as 11 categories + 1 part + 7 attributes — which is the argument for `aliases[]` and `related[]` on every node.
**What we must NOT copy** — Do not vendor the annotation JSONs, the images, or a verbatim dump of the 294-attribute list into `data/taxonomy/` until the dataset licence is confirmed. Even under CC BY 4.0 it is an attribution licence requiring a THIRD_PARTY_NOTICES entry. Learn the structure; author our own values.
**Our differentiation** — **Reference Decomposition.** Fashionpedia is a static, single-domain annotation ontology. Our clothing attributes are one of 20 sibling categories extracted per reference and inheritable independently of composition, lighting and camera. Fashionpedia can say a jacket is zip-up and denim; it cannot express "clothing from B, composition from A".
**Sources:** [fashionpedia data repo](https://github.com/cvdfoundation/fashionpedia) · [fashionpedia-api](https://github.com/KMnP/fashionpedia-api) · [sample.json](https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/data/sample.json)

#### 3.4.2 KMnP/fashionpedia-api

**Repository** — [KMnP/fashionpedia-api](https://github.com/KMnP/fashionpedia-api)
**License** — BSD-2-Clause. Verified: raw `license.txt` read, "Copyright (c) 2020, Menglin Jia".
**Main function** — A COCO-style Python API for loading Fashionpedia annotations and evaluating attribute-aware instance segmentation.
**Overlap** — Data model only: an annotation carries `category_id` plus an `attribute_ids` array.
**Useful idea** — The `{category_id, attribute_ids[]}` encoding is compact, diffable and mergeable, which is what `applyMix` needs. Our `Reference.visual_attributes` is the same instinct: bare taxonomy ids per category, with analyzer detail pushed into the `attribute_meta` sidecar so the interop contract stays minimal. It also separates attribute *evaluation* from attribute *representation*, mirroring the analyzer/retriever split.
**What we must NOT copy** — COCO mask-evaluation machinery is irrelevant to us and would drag a Python dependency into a JS product. Do not treat its integer attribute ids as canonical; ids in our world are stable dotted strings precisely so re-parenting never invalidates a stored intent (INV-TAX-1).
**Our differentiation** — **Visual Intent.** We store attributes as user-editable proposals with per-value confidence, never as ground-truth integer labels. AI output is a proposal, never a commitment.
**Sources:** [repo](https://github.com/KMnP/fashionpedia-api) · [license.txt](https://raw.githubusercontent.com/KMnP/fashionpedia-api/master/license.txt)

#### 3.4.3 DeepFashion (CUHK MMLab)

**Repository** — Project page only; no public code repository for the data.
**License** — **UNVERIFIED** — reported non-commercial research only, gated by a signed release agreement from an institutional email. Both the project page and the agreement PDF were unreachable.
**Main function** — A large-scale clothing dataset covering category and attribute prediction, in-shop retrieval, consumer-to-shop retrieval and landmark detection; the training substrate for most fashion taggers.
**Overlap** — The canonical source of clothing attribute labels; anything we might use for automatic clothing tagging is likely trained on it.
**Useful idea** — **Consumer-to-shop pairing** — the same garment under radically different capture conditions — is Search by Difference in miniature: hold garment identity constant, vary lighting, camera and scene. Inverted, it is our "same outfit, different lighting" query, and it is a ready-made evaluation shape for whether `difference.keep` actually holds.
**What we must NOT copy** — Do not ingest its images, do not ship weights trained on it, and do not treat a working download link as a licence. The images are scraped from the web and are explicitly not the lab's property (reported, **UNVERIFIED**). Any dependency here is research-only and must be flagged in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md).
**Our differentiation** — **Reference Decomposition fed by a licence-first corpus.** Our sources are Wikimedia Commons and Openverse, `public_domain` / `pdm` / `cc0` / `cc_by` allowed by default, NC/ND/unknown excluded, media binaries never stored. We never need an academic agreement to ship, so our decomposition pipeline has no research-only dependency.
**Sources:** [mmfashion DATA_PREPARATION.md, which enumerates the benchmarks](https://raw.githubusercontent.com/open-mmlab/mmfashion/master/docs/DATA_PREPARATION.md)

#### 3.4.4 DeepFashion2

**Repository** — [switchablenorms/DeepFashion2](https://github.com/switchablenorms/DeepFashion2)
**License** — **NONE.** Verified *absence*: the repository top level contains only `deepfashion2_api/`, `evaluation/`, `images/` and `README.md`. Data access is gated behind a form that issues an unzip password.
**Main function** — 491,895 images, 800,732 annotated clothing items, 13 clothing categories, 873,234 commercial-consumer pairs, with boxes, 294 dense landmarks, per-pixel masks and per-item qualifier fields.
**Overlap** — Its 13-class taxonomy is a compressed version of our Tops/Bottoms/Outerwear/Dresses split.
**Useful idea** — **Per-item qualifiers as donor-quality signals**: `scale` 1–3, `occlusion` 1–3, `zoom_in` 1–3, `viewpoint` 1–3 (1 = no wear / flat-lay, 2 = frontal, 3 = side-back), plus `style` and `pair_id` linking the same product across shots. `viewpoint` is directly actionable: a flat-lay packshot is an excellent `clothing` donor and a useless `pose` donor, and the mixer could warn accordingly. *(No donor-quality field exists in the canonical data model today; see §11.)*
**What we must NOT copy** — No LICENSE file means no grant of rights; "downloadable after a form" is not a licence. Do not vendor the 13-class list verbatim, and do not fine-tune anything shippable on it. Also do not copy the class design: it **fuses sleeve length into the class name**.
**Our differentiation** — **Selective Inheritance.** Because DeepFashion2 folds sleeve length into the category id, "same silhouette, different sleeves" is inexpressible. Our clothing subtree keeps fit, materials and style as orthogonal axes — expressed as separate `exclusivity_group`s — precisely so one axis can be inherited without dragging the others.
**Sources:** [repo](https://github.com/switchablenorms/DeepFashion2) · [root tree, showing no LICENSE](https://github.com/switchablenorms/DeepFashion2/tree/master)

#### 3.4.5 IDM-VTON

**Repository** — [yisol/IDM-VTON](https://github.com/yisol/IDM-VTON)
**License** — **CC BY-NC-SA 4.0** for codes **and checkpoints**. Verified: README statement plus GitHub label.
**Main function** — SDXL-based virtual try-on: person image + garment image + densepose + human parsing mask → the person rendered wearing that garment.
**Overlap** — The existing implementation of "take clothing from reference B and apply it to reference A" — a hard-coded, single-category instance of Selective Inheritance that outputs pixels instead of structure.
**Useful idea** — Its input contract is **decomposition by construction**: person signals (pose via densepose, body region via parsing mask) are separated from garment signals (an isolated garment image). Our analyzer should likewise emit `pose` and `appearance` separately from `clothing` so that a reference can donate one without the other — which is exactly why the EXTRACT groups keep `pose` and `clothing` as distinct buttons.
**What we must NOT copy** — Nothing shippable. NC blocks commercial use of code *and* checkpoints; SA would infect derivatives. It is additionally trained on VITON-HD / DressCode, which carry their own research-only terms — a second, independent block.
**Our differentiation** — **Reference Mixing.** IDM-VTON transfers exactly one category into one image. We emit a `ReferenceMix` that inherits composition from A, clothing from B, lighting from C and motion from video D at once, detects and surfaces conflicts rather than resolving them, and hands the result to any generator via `formatPrompt`. We are model-agnostic; IDM-VTON *is* the model.
**Sources:** [repo](https://github.com/yisol/IDM-VTON)

#### 3.4.6 OOTDiffusion

**Repository** — [levihsu/OOTDiffusion](https://github.com/levihsu/OOTDiffusion)
**License** — **CC BY-NC-SA 4.0.** Verified: raw LICENSE read (verbatim Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International).
**Main function** — Outfitting-fusion latent diffusion for controllable virtual try-on; outfitting UNet plus outfitting fusion/dropout; half-body and full-body checkpoints with the category enum `0 = upperbody`, `1 = lowerbody`, `2 = dress`.
**Overlap** — Same single-category garment transfer as IDM-VTON; its three-way enum is the minimum viable split of a clothing subtree for mixing purposes.
**Useful idea** — **Outfitting dropout** — randomly dropping garment conditioning during training so the *strength* of the garment signal is controllable at inference. Translated into our schema, that is **strength of inheritance**: `MixEntry.weight` (0..1, default 1) multiplies the confidence of every chip that entry contributes. The canonical model is explicit that this is a soft hint and **never** auto-resolves a conflict — weight influences ranking and emphasis, not arbitration.
**What we must NOT copy** — Code, weights and derivatives are all NC + SA. Trained on VITON-HD and Dress Code, both research-gated: the licence trap is layered.
**Our differentiation** — **Unified Modal and the AI-optional architecture.** OOTDiffusion is a fixed pipeline welded to a fixed backbone; remove the model and nothing remains. Remove the model from our product and browse, keyword search, metadata search, mixing and prompt composition all still work (INV-AI-1).
**Sources:** [repo](https://github.com/levihsu/OOTDiffusion) · [LICENSE](https://raw.githubusercontent.com/levihsu/OOTDiffusion/main/LICENSE)

#### 3.4.7 CatVTON

**Repository** — [Zheng-Chong/CatVTON](https://github.com/Zheng-Chong/CatVTON)
**License** — **CC BY-NC-SA 4.0** for "code, checkpoints, and demo". Verified: repo statement plus GitHub label.
**Main function** — Lightweight try-on that concatenates person and garment latents into an SD v1.5-inpainting backbone — no ReferenceNet, no separate image encoder. 899.06M total / 49.57M trainable parameters, under 8 GB VRAM at 1024×768.
**Overlap** — A third instance of single-attribute transfer; the architecturally minimal one.
**Useful idea** — Its thesis — that conditioning on a reference needs no second encoder network, only a shared representation space plus concatenation — argues for **one multimodal embedding space** in which text, image and video queries all live, rather than per-modality retrieval subsystems. That is our Unified Modal pillar restated at the retrieval layer, and it is why our vector store should be one modality-tagged table.
**What we must NOT copy** — Everything, explicitly including the demo, is NC-SA. Its evaluation additionally touches DeepFashion, VITON-HD and Dress Code.
**Our differentiation** — **Unified Modal.** CatVTON's efficiency is impressive and it is still a *generator*. We generate no pixels; we produce `visual_intent`, `reference_mix` and `structured_prompt` inside one modal where text/image/video/browse never fragment into separate pages, and the mix is portable to whatever generator the user owns.
**Sources:** [repo](https://github.com/Zheng-Chong/CatVTON)

#### 3.4.8 VITON-HD and Dress Code (the datasets under every open try-on model)

**Repository** — [shadow2496/VITON-HD](https://github.com/shadow2496/VITON-HD) · [aimagelab/dress-code](https://github.com/aimagelab/dress-code)
**License** — VITON-HD: **CC BY-NC 4.0** ("research purposes only"). Dress Code: **a bespoke proprietary agreement** — "The dataset will not be released to private companies"; institutional email required; a hand-signed release form is mandatory and typed signatures are refused. Both verified from the repo pages.
**Main function** — Paired person/garment image datasets: VITON-HD 1024×768 half-body; Dress Code multi-category (upper body, lower body, dresses). They are the training data for IDM-VTON, OOTDiffusion and CatVTON.
**Overlap** — No functional overlap — but they are the *root* of the licence trap that disqualifies the entire open try-on stack for commercial use.
**Useful idea** — Dress Code's access process is a **negative template for our License Guard**: it proves that "the file downloaded" and "we may use it" are entirely separate facts. That is precisely why `Reference.status` exists as a four-value enum rather than a boolean, and why INV-LIC-3 requires `license_check` and `source_validation` both to pass before `approved`.
**What we must NOT copy** — No images, no derived features, no checkpoints trained on them. "Will not be released to private companies" is about as unambiguous as a restriction gets.
**Our differentiation** — **Reference Decomposition over a licence-first corpus.** Our sources are pinned, our default allow-list is narrow, and we forbid storing media binaries at all. We never inherit a dataset's terms because we never hold the dataset.
**Sources:** [VITON-HD](https://github.com/shadow2496/VITON-HD) · [Dress Code](https://github.com/aimagelab/dress-code)

#### 3.4.9 tandpfun/wardrobe

**Repository** — [tandpfun/wardrobe](https://github.com/tandpfun/wardrobe)
**License** — MIT. Verified: raw LICENSE read.
**Main function** — A local-first personal wardrobe cataloguer: detects every garment in a photo via a hosted API, extracts clean product cutouts, stores them in `data/library.json`, and generates modelled outfit lookbooks.
**Overlap** — It performs reference decomposition on *one* category: a photo goes in, N typed garment items come out, each independently reusable. Structurally the same move as `Reference → visual_attributes.clothing[]`, materialised as cutout images rather than typed attributes.
**Useful idea** — Two. (1) **The local `data/` directory as the entire database** — originals, job records, generated images and a JSON library on disk, no server — matching our local-first stance and our `data/references.json` layout. (2) **A locked model-reference image held constant while garments vary** — a user-legible "keep identity, change clothing" operation, i.e. Search by Difference expressed in generation form.
**What we must NOT copy** — Do not copy code, and above all do not copy its **hardcoded provider dependency**: the importer is disabled until an API key is set. INV-AI-1 requires AI OFF to be a complete product and INV-AI-2 forbids hardcoded backends.
**Our differentiation** — **Reference Decomposition.** Wardrobe is closed-world (your own clothes) and outputs images. We are open-world (Openverse/Wikimedia search, or user-supplied media) and output a structured, editable `VisualIntent` that persists across modal modes. Its "extract clothes" is one leaf of a decomposition that also spans composition, camera angle, framing, lens, pose, motion, lighting, scene, colour, mood and style.
**Sources:** [repo](https://github.com/tandpfun/wardrobe) · [LICENSE](https://raw.githubusercontent.com/tandpfun/wardrobe/main/LICENSE)

#### 3.4.10 iamsaurabhc/drape-ai

**Repository** — [iamsaurabhc/drape-ai](https://github.com/iamsaurabhc/drape-ai)
**License** — MIT. Verified: raw LICENSE read.
**Main function** — Batch e-commerce fashion photography: Character Studio (model identity) → Garment Studio (categorised packshot library) → Outfit Composer (character + 2–5 garments + background preset composed in a single multi-reference edit call) → optional image-to-video.
**Overlap** — The closest thing in C4 to Reference Mixing: several references combined in one call with one pinned as the identity anchor. It stores assets with category tags, outfits as character id + garment ids + background preset + image URL, and videos with a motion preset — a thin cousin of `ReferenceMix` and `VisualRecipe`.
**Useful idea** — Two. (1) **Multi-reference composition in one call rather than chained passes**, explicitly to avoid identity drift and colour shift — the same reason our conflict doctrine forbids silent sequential resolution. (2) **Recipe-shaped persistence**: it saves the *combination*, not a prompt string, validating `VisualRecipe`.
**What we must NOT copy** — Its transfer mechanism is **reference-locked prose**, not structure: identity is preserved by writing "Do not alter the model's face, identity, or body shape from Image 1" into the prompt, and layering is prose ("outerwear goes over the top"). That is precisely the degrade-into-a-prompt-builder failure mode. It also hardcodes a stack of named commercial generators — forbidden by INV-AI-2.
**Our differentiation** — **Selective Inheritance.** Our inheritance is typed and per-category: `{reference_id, use: ["clothing","lighting"]}` is machine-checkable, conflict-detectable and portable across output modes; an English sentence telling a model not to change a face is none of those. Drape mixes whole assets; we mix *attributes of* assets.
**Sources:** [repo](https://github.com/iamsaurabhc/drape-ai) · [LICENSE](https://raw.githubusercontent.com/iamsaurabhc/drape-ai/main/LICENSE)

#### 3.4.11 FashionCLIP / Marqo-FashionCLIP

**Repository** — [patrickjohncyh/fashion-clip](https://github.com/patrickjohncyh/fashion-clip) · [marqo-ai/marqo-FashionCLIP](https://github.com/marqo-ai/marqo-FashionCLIP)
**License** — FashionCLIP: MIT **(label only — LICENSE body not opened)**. Marqo-FashionCLIP: Apache-2.0 for the repository code (verified); a separate weights licence is **not stated (UNVERIFIED)**.
**Main function** — CLIP/SigLIP encoders fine-tuned for fashion, used for zero-shot attribute classification, multimodal retrieval and localisation. FashionCLIP 2.0 fine-tunes `laion/CLIP-ViT-B-32` on >700K image-text pairs from the Farfetch dataset; Marqo's models are ViT-B-16 with 512-dim embeddings.
**Overlap** — Direct overlap with `src/ai/embedding.js` and `semantic-search` for the clothing slice: the off-the-shelf way to get "same outfit" retrieval and zero-shot clothing tags with no training.
**Useful idea** — Two. (1) Marqo's seven-benchmark evaluation suite is a template for the held-out set we need to answer "did EXPLORE → *same outfit* actually return the same outfit?" — an evaluation obligation we owe ourselves before claiming `difference` works. (2) Marqo trains against **structured metadata** (category, style, colours, materials, keywords), not captions alone: evidence that structured-metadata match should be a first-class signal in our fusion ranker (`metadata_weight` defaulting to 0.4), not a fallback.
**What we must NOT copy** — Two traps: FashionCLIP's training corpus is the Farfetch dataset, whose public release the repo itself describes as pending — an MIT model does not make its data usable; and Marqo's benchmark bundles wrap DeepFashion and Polyvore images with their own terms, so do not redistribute them.
**Our differentiation** — **Search by Difference.** These are retrieval encoders answering "find similar". Our brief keeps retrieval and analysis separate and swappable, and requires the product to work with the embedding adapter off. Only our pipeline answers "same framing and lighting, DIFFERENT outfit" via explicit KEEP/CHANGE categories.
**Sources:** [fashion-clip](https://github.com/patrickjohncyh/fashion-clip) · [marqo-FashionCLIP](https://github.com/marqo-ai/marqo-FashionCLIP) · [Marqo LICENSE](https://raw.githubusercontent.com/marqo-ai/marqo-FashionCLIP/main/LICENSE)

#### 3.4.12 open-mmlab/mmfashion

**Repository** — [open-mmlab/mmfashion](https://github.com/open-mmlab/mmfashion)
**License** — Apache-2.0 for the code. Verified: repo statement plus GitHub label.
**Main function** — A fashion analysis toolbox covering attribute prediction, recognition and retrieval, landmark detection, parsing and segmentation, compatibility and recommendation, and virtual try-on.
**Overlap** — Demonstrates that "fashion understanding" decomposes into independent, swappable sub-tasks over one shared data abstraction — the same modular framing our `src/ai/` adapter layer needs.
**Useful idea** — One toolbox, many tasks, one substrate: every task feeds from the same data, analogous to our `Reference` object being the single substrate for search, decomposition, mixing and prompt composition.
**What we must NOT copy** — The cluster's most instructive trap: **permissive Apache-2.0 code that is useless without research-gated data.** Its `DATA_PREPARATION.md` points at CUHK-hosted DeepFashion benchmarks plus Polyvore Outfits. Permissive code over restricted data is not a usable stack. Also do not adopt its Python/mmcv stack.
**Our differentiation** — **Visual Intent.** mmfashion is a research toolbox that emits labels. We emit a single user-editable schema shared by every input modality and a `StructuredPrompt` derived from it, inside a Unified Modal rather than a task-per-script toolbox.
**Sources:** [repo](https://github.com/open-mmlab/mmfashion) · [DATA_PREPARATION.md](https://raw.githubusercontent.com/open-mmlab/mmfashion/master/docs/DATA_PREPARATION.md)

#### 3.4.13 Polyvore dataset + outfit-transformer

**Repository** — [xthan/polyvore-dataset](https://github.com/xthan/polyvore-dataset) · [owj0421/outfit-transformer](https://github.com/owj0421/outfit-transformer)
**License** — polyvore-dataset repo Apache-2.0 (verified) — covering the *repository*, **not** the crawled images, whose rights are unaddressed **(UNVERIFIED)**. outfit-transformer MIT (verified).
**Main function** — 21,889 crawled outfits (17,316 / 1,497 / 3,076 train/val/test, c. 2017, truncated to 8 items, ~7,000 compatibility-labelled) with fill-in-the-blank and compatibility tasks; outfit-transformer is an unofficial Outfit Transformer implementation for compatibility prediction and complementary item retrieval.
**Overlap** — Complementary Item Retrieval — "given these items, what completes the set?" — is the recommendation-flavoured sibling of Reference Mixing: reasoning over a *set* of partial references rather than one.
**Useful idea** — **The fill-in-the-blank framing, applied per attribute category**: "you inherited composition from A and lighting from C; `clothing` is empty — here are candidate references that would fill it, ranked for consistency with your existing choices." That turns an empty `VisualIntent` array into a search rather than a blank box, and it is EXPLORE → "same lighting, different outfit" made proactive.
**What we must NOT copy** — The classic trap: an Apache-2.0 repository whose payload is scraped third-party images. The repo itself notes the original image URLs are dead and points at an unofficial mirror of unknown provenance. Under License Guard those are `unknown` and excluded by default; "it's on a dataset host" is not a licence.
**Our differentiation** — **Reference Mixing.** Outfit recommendation collapses everything into one learned compatibility scalar and hides its reasoning. Conflicts between references are detected and surfaced for us, never auto-resolved: we rank candidates, the user decides, and the decision is stored structurally as a `Resolution` with `strategy: "user"` and a `resolved_by` / `resolved_at` record.
**Sources:** [polyvore-dataset](https://github.com/xthan/polyvore-dataset) · [LICENSE](https://raw.githubusercontent.com/xthan/polyvore-dataset/master/LICENSE) · [outfit-transformer](https://github.com/owj0421/outfit-transformer)

#### 3.4.14 Fashion-IQ

**Repository** — [XiaoxiaoGuo/fashion-iq](https://github.com/XiaoxiaoGuo/fashion-iq)
**License** — **UNVERIFIED** — the repo page shows a Community Data License Agreement label, but the variant (CDLA-Permissive-1.0 vs the copyleft CDLA-Sharing-1.0) could not be confirmed; the LICENSE file was not retrievable.
**Main function** — Fashion retrieval by natural-language feedback: human-written **relative captions** describing the *difference* between two similar garment images, across Dresses / Tops&Tees / Shirts (~77K images, 18K pairs), plus derived attribute side-information. The repo hosts captions and splits, not images.
**Overlap** — The nearest published prior art to our **Search by Difference** pillar: the query is not "find similar to X" but "find X but different in this specific respect".
**Useful idea** — Two. (1) Relative captions prove users naturally express visual intent as a **delta**, which is why a KEEP/CHANGE selector is the right UI rather than a novelty. (2) It distributes captions and image splits/URLs, not media — a working precedent for our rule that we store URL, thumbnail URL, metadata, embedding and visual attributes only.
**What we must NOT copy** — Do not vendor its captions until the CDLA variant is confirmed: under CDLA-Sharing-1.0, publishing enhanced data derived from it carries share-alike obligations that would propagate into `data/`. Also do not adopt free-text deltas as our internal representation.
**Our differentiation** — **Search by Difference.** Fashion-IQ's delta is an unstructured English sentence over one domain. Ours is structured and cross-category: `difference.keep` and `difference.change` (disjoint by INV-EXP-5) executed as typed constraints over `visual_attributes` fused with semantic similarity, with `strictness` controlling whether sibling taxonomy nodes count as a match — and it works with AI off via metadata match alone.
**Sources:** [repo](https://github.com/XiaoxiaoGuo/fashion-iq)

#### 3.4.15 CameraBench

**Repository** — [sy77777en/CameraBench](https://github.com/sy77777en/CameraBench)
**License** — **CC BY 4.0.** Verified: the LICENSE file is the Creative Commons Attribution 4.0 International Public License, with no non-commercial clause. Note the GitHub label reports `NOASSERTION`; **the file is authoritative.**
**Main function** — An expert-annotated benchmark plus fine-tuned VLM judges (7B/32B/72B) for classifying camera motion in arbitrary video; a taxonomy of camera-motion primitives co-designed with cinematographers. Public test set 1,000+ videos with expert labels and captions, ~1,400 extra clips for SFT.
**Overlap** — The only serious public work whose output vocabulary is the same *kind* of object as our `camera_motion` array. Its axes are what our schema needs: reference frame (object-/ground-/camera-centric), translation, rotation, intrinsic change (zoom), circular motion (arc), steadiness, tracking shots — and it explicitly flags the confusion between extrinsic motion (dolly) and intrinsic change (zoom).
**Useful idea** — Three. (1) **Reference-frame qualification**: "tracking" is not a sibling of "dolly", it is the same translation expressed in an object-centric frame. (2) **Label-then-caption with an explicit "I am not sure"** — annotators classify only what they are confident about and leave the rest unset. That is a direct implementation recipe for our confidence map and for the rule that AI output is a proposal: an unset chip is better than a wrong one. (3) Its headline finding — that generative VLMs trail classical SfM/SLAM on pure geometry but capture scene-aware cues SfM misses (e.g. "follow" requires knowing a subject is moving) — is the strongest architectural evidence in the survey for computing `pan`/`tilt`/`roll`/`static` geometrically and reserving `tracking` / `orbit` / `handheld` for the semantic pass.
**What we must NOT copy** — CC BY 4.0 is a *content* licence, awkward on source code, and attribution is mandatory: do not vendor its taxonomy JSON or prompts into `data/taxonomy/*.json`. Do not import its videos — third-party internet media the authors do not own, behind an access-request form.
**Our differentiation** — **Reference Mixing.** CameraBench asks a video "what is the camera doing?" and scores the answer. We extract it so the user can take that attribute *and nothing else* and paste it alongside `pose` and `clothing` from two stills. That is not a benchmark task, and no model here is aimed at it.
**Sources:** [repo](https://github.com/sy77777en/CameraBench) · [LICENSE](https://raw.githubusercontent.com/sy77777en/CameraBench/main/LICENSE) · [README](https://raw.githubusercontent.com/sy77777en/CameraBench/main/README.md)

#### 3.4.16 CineScale / CineScale2

**Repository** — Datasets on Mendeley Data; papers in *Data in Brief*.
**License** — **UNVERIFIED.** Every hosting domain was blocked. *Data in Brief* datasets are commonly CC BY, but no licence text was read.
**Main function** — Frame-level annotations of cinematic shot scale (9 classes over 792,000+ frames from 124 feature films) and, in CineScale2, camera angle (5 classes) and camera level (6 classes) over ~25,000 frames.
**Overlap** — The most defensible public source for our `camera_distance` ladder and for `camera_angle`.
**Useful idea** — **CineScale2 proves camera *angle* and camera *level* are orthogonal.** Angle is the tilt of the optical axis (overhead / high / neutral / low / dutch); level is the height of the camera body (aerial / eye / shoulder / hip / knee / ground). A shot can be neutral-angle at ground level. Most prompt tools collapse these, which is why "low angle" behaves unpredictably. Because the brief fixes the category list at 20, the clean resolution inside our model is to carry level as **modifier nodes within `camera_angle`** — `exclusivity_group: null`, so they never participate in an arity conflict and coexist with the dominant angle value. *(That resolution is our design decision, not the brief's; see §11.)*
**What we must NOT copy** — No frames, no annotation files, no derived weights until the licence is verified. Under our own rule an unverified licence can never reach `approved`, and that applies to research datasets exactly as to reference media.
**Our differentiation** — **Visual Intent.** CineScale is a corpus for film-studies analysis. We use only the vocabulary, so that a user who cannot name "medium long shot" picks it visually and then inherits exactly that value into a mix.
**Sources:** [CineScale on Mendeley](https://data.mendeley.com/datasets/th46h4vdwd/1) · [CineScale2 on Mendeley](https://data.mendeley.com/datasets/h4n3gn93gz/3)

#### 3.4.17 MovieShots / MovieNet shot-type classification (SGNet)

**Repository** — [movienet/movienet-tools](https://github.com/movienet/movienet-tools); independent reproduction [sssabet/Shot_Type_Classification](https://github.com/sssabet/Shot_Type_Classification) (MIT).
**License** — **UNVERIFIED** for the dataset — every primary host was blocked and `movienet-tools` exposed no LICENSE at the paths tried.
**Main function** — 46K shots from 7K movie trailers labelled with shot scale (LS, FS, MS, CS, ECS) and shot movement (static, motion, push, pull); SGNet splits subject and background into two streams.
**Overlap** — The canonical ML shot-scale/movement label set that most later work cites.
**Useful idea** — **The negative lesson is the valuable one, and it produced two hard rules for our taxonomy.** (1) "Long shot" is the *widest* class here but a mid-wide class in CineScale, so shipping bare strings guarantees a silent mismatch: canonical ids with **source-scoped alias tables** are mandatory, which is exactly what `TaxonomyNode.aliases` is for. (2) MovieShots defines "push" as "camera zooms in", fusing a physical dolly with a focal-length change. That label cannot round-trip to a model like Hailuo, which exposes `[Push in]` and `[Zoom in]` as *different* commands — so `camera_motion.dolly_in` and `camera_motion.zoom_in` must remain distinct nodes in our tree.
**What we must NOT copy** — Frames come from copyrighted trailers and the dataset licence is unverified. No frames, no annotations, and no republication of the class list as if it were ours.
**Our differentiation** — **Search by Difference.** SGNet emits one label per shot. Our value is that the label is a *handle*: the user holds `camera_distance` and `camera_angle` constant while changing `clothing`, which no shot classifier can express because it has no other typed fields to keep fixed.
**Sources:** [movienet-tools](https://github.com/movienet/movienet-tools) · [MIT reproduction](https://github.com/sssabet/Shot_Type_Classification)

#### 3.4.18 AVE — The Anatomy of Video Editing

**Repository** — [dawitmureja/AVE](https://github.com/dawitmureja/AVE)
**License** — **NONE.** Verified *absence*: the raw README contains no licence statement, no LICENSE file surfaced, and the authors state they do not own the movie clips.
**Main function** — ~196,176 shots from movie scenes with >1.5M manually applied cinematography tags, plus benchmark tasks for AI-assisted video editing.
**Overlap** — Its per-shot annotation record is almost a subset of our `VisualIntent`. Confirmed JSON keys: `clip-type`, `start-time`, `end-time`, `shot-size`, `shot-angle`, `shot-type`, `shot-motion`, `shot-subject`, `shot-location`, `num-people`, `sound-source`, with example values `medium` / `low-angle` / `two-shot` / `handheld` / `human` / `int` / `on-screen`.
**Useful idea** — **The clearest evidence at scale that `framing` and `camera_distance` are different fields**: AVE keeps `shot-size: "medium"` apart from `shot-type: "two-shot"`, and both are simultaneously true of the same shot. It also files `handheld` under `shot-motion`, which supports treating steadiness as a *value* of `camera_motion` rather than a separate style tag — in our tree, `camera_motion.handheld` alongside `camera_motion.static`, with `camera_motion.static` declaring `conflicts_with` every other node.
**What we must NOT copy** — No licence, and the media are explicitly not the authors'. Annotations ship via a file-sharing link and the clips must be re-downloaded from a video platform with a downloader — a workflow our brief prohibits. We take the field decomposition, cite it, and populate values from licensable sources.
**Our differentiation** — **Reference Mixing.** AVE annotates shots so a model can propose edits. Combining partial attributes of several references into one prompt with surfaced conflicts has no analogue there.
**Sources:** [repo](https://github.com/dawitmureja/AVE) · [README](https://raw.githubusercontent.com/dawitmureja/AVE/main/README.md)

#### 3.4.19 ShotBench / ShotVL

**Repository** — [Vchitect/ShotBench](https://github.com/Vchitect/ShotBench)
**License** — **NONE.** Verified *absence*: the repo root listing shows no LICENSE file and `/blob/main/LICENSE` returns 404.
**Main function** — A benchmark of expert-level cinematic understanding for VLMs: 3,500+ expert-annotated QA pairs over images and clips from 200+ films, plus a ~70K-pair training set and the ShotVL model.
**Overlap** — Its eight dimensions are essentially our camera-side categories: Shot Size, Shot Framing, Camera Angle, Lens Size, Lighting Type, Lighting Conditions, Shot Composition, Camera Movement. It keeps shot size, framing and composition as **three separate dimensions**, matching our separate `camera_distance`, `framing` and `composition`.
**Useful idea** — **"Lens Size" as a categorical dimension** (wide / normal / long / telephoto / macro) rather than a numeric focal length. That is our lens rule confirmed by an independent expert-annotated benchmark: a lens *class* is defensible from a single frame; a millimetre figure is not. It is also the strongest external justification for INV-LENS-1's `_like` suffix requirement.
**What we must NOT copy** — With no licence file, treat it as read-only prior art: no vendoring of eval data, no copying of QA text, no adopting its option strings as our shipped vocabulary without independent grounding.
**Our differentiation** — **Visual Intent.** ShotBench measures whether a model *understands* cinematography. We make understanding *editable*: a wrong `camera_angle` guess is a chip the user fixes in one click, not a benchmark score.
**Sources:** [repo](https://github.com/Vchitect/ShotBench) · [root tree, showing no LICENSE](https://github.com/Vchitect/ShotBench/tree/main)

#### 3.4.20 CineTechBench

**Repository** — [PRIS-CV/CineTechBench](https://github.com/PRIS-CV/CineTechBench)
**License** — **CC BY-NC-ND 4.0.** Verified from the repo page, including "You may not use the Dataset for commercial purposes" and "you may not distribute the modified material".
**Main function** — An expert-annotated benchmark for cinematographic technique understanding **and generation** across seven dimensions — shot scale, shot angle, composition, camera movement, lighting, colour, focal length — over 600+ movie images and 120+ clips; it distributes metadata and hyperlinks only.
**Overlap** — Its seven dimensions are a near-exact subset of our categories, and it is the only benchmark here that also evaluates whether a video model actually *executes* a requested camera move — the best existing evidence base for the per-mode mapping table our formatter needs.
**Useful idea** — **The metadata-and-hyperlinks-only distribution model.** Ship annotations plus links, never the media, and push ToS compliance to the user. Independent confirmation that our no-media-binaries rule is standard practice for serious research groups, not a self-imposed limitation.
**What we must NOT copy** — **NC-ND is a hard stop**, and this is all three constraints at once (attribution + non-commercial + no-derivatives). No importing its annotations, no redistributing a modified version, and no CineTechBench-derived value may ever reach `approved`.
**Our differentiation** — **Reference Mixing.** CineTechBench asks a model to reproduce a *named* technique. We let a user say "the camera work of that video, but the movement of this one" across two video references — which requires typed per-attribute provenance a benchmark has no reason to build.
**Sources:** [repo](https://github.com/PRIS-CV/CineTechBench)

#### 3.4.21 magcil/movie_shot_classification_dataset

**Repository** — [magcil/movie_shot_classification_dataset](https://github.com/magcil/movie_shot_classification_dataset)
**License** — MIT for the repository. Verified: LICENSE fetched, "Copyright (c) 2021 magcil". The underlying film shots are third-party.
**Main function** — 1,803 classified film shots across 10 camera-movement classes: Static (985), Handheld, Panoramic, Panoramic_lateral, Vertical_static, Vertical_moving (37), Travelling_in, Travelling_out, Zoom in, Aerial.
**Overlap** — A movement-only taxonomy whose class names are unusually explicit about the axis of motion.
**Useful idea** — It separates `Travelling_in` / `Travelling_out` from `Zoom in` — **dolly ≠ zoom, encoded in the label set itself**, exactly where MovieShots collapses them. It also puts `Handheld` and `Static` in the same dimension, supporting steadiness as a member of `camera_motion`. The extreme class imbalance (985 vs 37) is a warning: any camera-motion analyzer we evaluate will look accurate while missing every interesting move, so our evaluation must be per-class, not aggregate.
**What we must NOT copy** — MIT covers the repo's own contents but does not clear the underlying film shots. We would reuse the class *names* (facts, not expression) with attribution, never the media.
**Our differentiation** — **Selective Inheritance.** Ten flat classes cannot express "same movement as this video, but the camera work of that video". That needs `motion` (subject) and `camera_motion` (camera) as two independently inheritable arrays — which is also why that particular mix produces *no conflict at all* by construction.
**Sources:** [repo](https://github.com/magcil/movie_shot_classification_dataset) · [LICENSE](https://github.com/magcil/movie_shot_classification_dataset/blob/main/LICENSE)

#### 3.4.22 rsomani95/shot-type-classifier

**Repository** — [rsomani95/shot-type-classifier](https://github.com/rsomani95/shot-type-classifier)
**License** — **CC BY-NC 4.0.** Verified from the repo page.
**Main function** — A ResNet-50 classifier predicting cinema shot type from a single frame across six classes: Extreme Wide Shot, Long Shot, Medium Shot, Medium Close Up, Close Up, Extreme Close Up.
**Overlap** — A *third* distinct convention for the shot-size ladder, alongside MovieShots and CineScale — here "Extreme Wide" is widest and "Long Shot" is second.
**Useful idea** — The clearest single piece of evidence for our alias requirement. Across three sources: extreme wide ≈ extreme long shot ≈ ELS; wide ≈ long shot (CineScale) but long shot = widest (MovieShots); full shot ≈ medium long shot ≈ American/cowboy shot. A taxonomy carrying `id`, `label`, `aliases[]` and per-source notes in `description` is the **only** way these corpora can coexist without silent mismatch.
**What we must NOT copy** — CC BY-NC blocks us: we cannot ship the weights, cannot bundle it as an analyzer adapter in a commercially capable product, and cannot adopt its class list as our shipped vocabulary. Cite only.
**Our differentiation** — **Visual Intent.** A frame classifier returns one string. We return per-value and per-category confidence, and the result is a proposal the user edits — the difference between an oracle and a tool.
**Sources:** [repo](https://github.com/rsomani95/shot-type-classifier)

### 3.5 C5 · Components we consume

These are not competitors; they are the parts bin, and the reason the product is buildable. They are catalogued here with the same seven headings because **the decision not to adopt something is as load-bearing as the decision to adopt it**, and because several of them would quietly break our licence or privacy posture if taken at face value. In this subsection "Our differentiation" means *what we add above the component, and why the component alone is not a product*.

#### 3.5.1 Embedding and retrieval stacks

##### Qwen3-VL-Embedding / Qwen3-VL-Reranker

**Repository** — [QwenLM/Qwen3-VL-Embedding](https://github.com/QwenLM/Qwen3-VL-Embedding)
**License** — Apache-2.0 for the repository (LICENSE fetched). **Weights licence UNVERIFIED** (model-card host blocked).
**Main function** — Instruction-tuned multimodal embedding and reranking on Qwen3-VL: text, images, screenshots, video and genuinely interleaved mixed-modality input. Embedding 2B (2048 dims) / 8B (4096 dims), rerankers at 2B and 8B, with Matryoshka flexible dimensions. Video params `fps` and `max_frames` (default 64).
**Overlap** — The closest existing thing to our `embedding-adapter` slot, and the only model in the survey with a **native fused text+image query** — a query item is literally `{"text": …, "image": …}`. Its reranker matches our optional `reranker-adapter` stage.
**Useful idea** — The **instruction string as a first-class query field** (default `"Represent the user's input"`). Our KEEP set can be rendered into that instruction while the CHANGE set becomes a rerank/negative constraint, and adapters without instruction support simply ignore the field — graceful degradation. Matryoshka plus quantization-aware training means one embedding pass yields a short int8 vector for a browser index and a full vector for a desktop index.
**What we must NOT copy** — No wholesale copying of its inference code into `src/ai/embedding.js`; Apache-2.0 NOTICE obligations belong in THIRD_PARTY_NOTICES, not silently inlined. And its 2048-dim assumption must never leak into a schema: dimension is `EmbeddingRecord.dim`, adapter metadata, never a constant.
**Our differentiation** — **Reference Decomposition.** It ranks; it has no notion of a reference as a bag of typed attributes. The card it returns is immediately decomposable for us into categories the user can inherit selectively. The model gives similarity; it cannot give "composition from A, clothing from B".
**Sources:** [repo](https://github.com/QwenLM/Qwen3-VL-Embedding) · [LICENSE](https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/LICENSE) · [README](https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/README.md)

##### Qwen3-Embedding (text-only siblings)

**Repository** — [QwenLM/Qwen3-Embedding](https://github.com/QwenLM/Qwen3-Embedding)
**License** — **UNVERIFIED.** The raw LICENSE URL returns 404 and the fetched repo page showed no licence label. Search results claim Apache-2.0 on the model cards; we did not see it, so we must not assert it.
**Main function** — Text embedding and reranking at 0.6B / 4B / 8B producing 1024 / 2560 / 4096 dims, Matryoshka support, 32K context, 100+ languages.
**Overlap** — Covers the text-only half of the hybrid ranker: embedding taxonomy labels, aliases and the user's typed query when a full VLM encoder is too heavy.
**Useful idea** — A **dimension ladder within one family**, so a single adapter descriptor can expose fast / balanced / enhanced tiers without changing calling code.
**What we must NOT copy** — Do not assert its licence, and do not default or bundle it until a human opens the model card.
**Our differentiation** — **Unified Modal.** A text-only embedder can never be the whole retriever, because text, image, video and browse are modes of one modal — text embedding is one branch of a query builder, not a separate search product.
**Sources:** [repo](https://github.com/QwenLM/Qwen3-Embedding)

##### jina-clip-v2

**Repository** — Model on Hugging Face (`jinaai/jina-clip-v2`); host blocked.
**License** — Reported **CC BY-NC-4.0** for the weights. **(UNVERIFIED** — evidence is a search result rendering the model card's front matter, not a fetch.)
**Main function** — A multilingual multimodal dual-encoder (~865M params) embedding text and images into a shared space; 1024 dims truncatable to 64 via Matryoshka; 512×512 input; 89 languages. All figures **(UNVERIFIED)**.
**Overlap** — The most browser-plausible shared-space CLIP for similar-image search: it is one of the few multimodal embedders listed as a supported architecture in transformers.js, so it could actually run client-side under our local-first rule.
**Useful idea** — **Matryoshka truncation as an explicit storage-tier strategy.** 1024-dim float32 is ~4 KB per reference; 256 dims is ~1 KB and reportedly near-lossless. That is the difference between a local library that survives thousands of cards in browser storage and one that does not.
**What we must NOT copy** — **The licence.** Non-commercial weights are exactly the category our own policy excludes by default for references; it would be incoherent to reject a `cc_by_nc` photo while bundling `cc_by_nc` weights. If supported at all it must be an opt-in adapter the user installs, badged in the UI like a reference licence, never bundled and never the default. Also: two separate towers means there is **no** native fused text+image query — do not design the adapter interface assuming there is.
**Our differentiation** — **Reference Mixing.** It answers "which images are near this vector". Our composer feeds its score into the fusion ranker alongside taxonomy matches, because a dual-tower cosine score structurally cannot express "same framing and lighting, different outfit".
**Sources:** [model card (blocked)](https://huggingface.co/jinaai/jina-clip-v2) · [transformers.js supported architectures](https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md)

##### SigLIP 2 (google-research/big_vision)

**Repository** — [google-research/big_vision](https://github.com/google-research/big_vision)
**License** — Apache-2.0 for the **software** (LICENSE fetched). The SigLIP 2 doc adds that "all other materials" are CC BY, and **does not license the checkpoints at all**; the `apache-2.0` label reported on the model cards is **(UNVERIFIED)**.
**Main function** — A multilingual vision-language dual encoder trained with a sigmoid contrastive loss. Four sizes — ViT-B 86M, L 303M, So400m 400M, g 1B — at resolutions 224/256/384/512 plus NaFlex variants that preserve native aspect ratio.
**Overlap** — The strongest permissively-licensed alternative to jina-clip-v2 for the same slot, and reachable through OpenCLIP's registry so swapping costs no new inference code.
**Useful idea** — **NaFlex / native aspect-ratio preservation.** Our references are photographs and film stills where framing and aspect ratio *are* semantic content: squashing a 2.39:1 still to 224×224 destroys exactly the `framing` and `composition` signal our taxonomy cares about. Consequence: if we pick a fixed-resolution encoder, `Reference.media.aspect_ratio` and `.orientation` (derived caches, recomputed on load) must carry that information into the metadata half of the fusion ranker.
**What we must NOT copy** — Do not assume the code licence covers the weights. THIRD_PARTY_REVIEW must record model-weight licences separately from model-code licences; SigLIP 2 is the cleanest example of why.
**Our differentiation** — **Visual Intent.** It collapses each input to an opaque point the user can neither read nor edit. "AI output is a proposal, never a commitment" is impossible with a raw embedding.
**Sources:** [LICENSE](https://raw.githubusercontent.com/google-research/big_vision/main/LICENSE) · [SigLIP 2 README](https://github.com/google-research/big_vision/blob/main/big_vision/configs/proj/image_text/README_siglip2.md)

##### OpenCLIP

**Repository** — [mlfoundations/open_clip](https://github.com/mlfoundations/open_clip)
**License** — MIT (LICENSE fetched).
**Main function** — An open CLIP training/inference library plus a runtime-enumerable registry of many pretrained image-text encoders, including SigLIP and SigLIP2, MetaCLIP/PE, DFN, CoCa, CLAP and MaMMUT.
**Overlap** — The working reference implementation of the adapter idea we already committed to: one API, dozens of interchangeable encoders, enumerable at runtime via `list_pretrained()`.
**Useful idea** — **A runtime-enumerable model registry instead of hardcoded names.** Our embedding module should expose `listBackends() -> [{id, dims, modalities, license, licenseUrl, runsInBrowser, quality}]`, carrying **licence as a field on the backend descriptor** so the UI can badge a non-commercial model exactly the way it badges a non-commercial reference image. *(That descriptor shape is not in the canonical data model; see §11.)*
**What we must NOT copy** — Do not inherit the assumption that "weights licence == repo licence": OpenCLIP is MIT but serves weights trained under varying and often unstated terms. Do not vendor its model code into a browser-first repo.
**Our differentiation** — **Unified Modal.** A model zoo has no UI, no taxonomy and no attribution model.
**Sources:** [LICENSE](https://raw.githubusercontent.com/mlfoundations/open_clip/main/LICENSE) · [README](https://raw.githubusercontent.com/mlfoundations/open_clip/main/README.md)

##### rom1504/clip-retrieval

**Repository** — [rom1504/clip-retrieval](https://github.com/rom1504/clip-retrieval)
**License** — MIT (LICENSE fetched).
**Main function** — An end-to-end pipeline: clip-inference (~1,500 samples/s on a 3080) → clip-index (FAISS) → clip-filter → clip-back (KNN service, ~50 ms latency, ~20 q/s, memory-mapped indices) → clip-front. ~100M embeddings in ~20 h on one GPU.
**Overlap** — The canonical open implementation of the loop behind our similar-reference search: embed, index, serve KNN, browse a grid.
**Useful idea** — **Memory-mapped index plus a separate metadata store**, bringing the resident footprint to nearly zero. That maps directly onto our storage rule — vectors in a serialisable/mmap-able index, metadata in a queryable store, media only ever referenced by URL and thumbnail URL.
**What we must NOT copy** — Its query API takes text **or** an image URL **or** base64 — mutually exclusive — and the front-end mirrors that split. For us that is a disqualifying anti-pattern: the brief bans separate image-search and video-search surfaces. Also do not copy the crawl-everything posture; bulk dataset handling collides with our ban on storing unknown-licence media.
**Our differentiation** — **Reference Decomposition.** Its result grid is terminal — you look at images and stop. Our card carries USE / EXTRACT / EXPLORE, and EXTRACT is the doorway into decomposition and then inheritance.
**Sources:** [LICENSE](https://raw.githubusercontent.com/rom1504/clip-retrieval/main/LICENSE) · [README](https://raw.githubusercontent.com/rom1504/clip-retrieval/main/README.md)

##### Marqo

**Repository** — [marqo-ai/marqo](https://github.com/marqo-ai/marqo)
**License** — Apache-2.0 (LICENSE fetched).
**Main function** — An end-to-end vector search engine with built-in embedding generation and multimodal search, shipped as a containerised server stack. Its README now states: "Marqo's Open Source project is deprecated and will no longer recieve updates." [sic]
**Overlap** — The batteries-included version of our whole search layer.
**Useful idea** — **The weighted multi-part query**: a query as a list of `(content, weight)` pairs rather than a single string. That is the right mental model for Reference Mixing, whose `ReferenceMix` is already a typed weighted query — the semantic side should be `[{source, categories, weight}]`, never a concatenated sentence.
**What we must NOT copy** — Two things. (1) The server dependency: a Docker stack directly contradicts local-first and "AI OFF must be a complete product". (2) Its deprecation is the lesson itself — never build a pillar on one vendor's open-source goodwill; the adapter boundary exists so that a dead backend costs us exactly one file.
**Our differentiation** — **Search by Difference.** Marqo returns ranked documents; it has no way to express "keep composition + lighting + camera, change clothing", which needs typed attributes on *both* sides of the query.
**Sources:** [repo](https://github.com/marqo-ai/marqo) · [LICENSE](https://raw.githubusercontent.com/marqo-ai/marqo/mainline/LICENSE)

##### transformers.js + ONNX Runtime Web

**Repository** — [huggingface/transformers.js](https://github.com/huggingface/transformers.js) · [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)
**License** — transformers.js Apache-2.0; ONNX Runtime MIT. Both verified via LICENSE/labels. (The transformers.js README badge suggests MIT; the repository label is authoritative.)
**Main function** — Run transformer models directly in the browser via ONNX Runtime Web with no server. Dtypes `fp32` (WebGPU default), `fp16`, `q8` (WASM default), `q4`; backends WASM (CPU), WebGL (maintenance), WebGPU (experimental), WebNN (experimental). Supported architectures include CLIP, SigLIP, JinaCLIP, Qwen2-VL, Qwen2.5-VL and Qwen3-VL.
**Overlap** — The only realistic path to "AI ON but still local-first, still zero server", and the mechanism that honours processing user media locally by default.
**Useful idea** — **A dtype/device policy exposed as a user-visible setting with a documented fallback chain** — `q8` + WASM on a low-end laptop, `fp16` + WebGPU on a capable desktop. Combined with Matryoshka truncation this gives an honest quality/size dial, which is the brief's "enhanced search mode" implemented as a setting rather than a hardcoded model. The realistic browser-side AI for us is **embeddings, not generation**: a CLIP-class embedder runs in-tab; a VLM analyzer does not.
**What we must NOT copy** — Nothing to copy; it is a dependency. The trap is implicit network access: it fetches weights from a remote hub on first use, so model download must be user-initiated, size-disclosed and cached, and recorded via `ai.external_transmission.disclosed_at`. Architecture support for Qwen3-VL does **not** mean a usable embedding export exists **(UNVERIFIED)**. Do not depend on WebGPU; WASM stays the fallback.
**Our differentiation** — **Visual Intent.** These libraries hand us vectors in a page and say nothing about what to do with them. The layer above — every input converting into one editable structured schema — is what keeps the product complete when the user turns AI off entirely.
**Sources:** [transformers.js README](https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md) · [ORT Web README](https://raw.githubusercontent.com/microsoft/onnxruntime/main/js/web/README.md)

##### LanguageBind

**Repository** — [PKU-YuanGroup/LanguageBind](https://github.com/PKU-YuanGroup/LanguageBind)
**License** — **MIT for the code; CC BY-NC-4.0 for the VIDAL dataset.** Verified from the repo page and README statements.
**Main function** — Language-centric multimodal pretraining binding video, audio, depth, thermal and image into one text-anchored embedding space; the image tower is initialised from OpenCLIP and not fine-tuned, so the space stays CLIP-compatible. Embedding dimension not stated **(UNVERIFIED)**.
**Overlap** — Our video milestone needs similar-video search and motion reference mixing; this is the clearest demonstration that video and image can share **one** vector space.
**Useful idea** — One text-anchored space for all modalities is the retrieval-side mirror of our Visual Intent rule. Design consequence: our index must be **modality-tagged but single-space** — one vector table with a media-type column, not separate image and video indexes — otherwise the unified promise breaks at the storage layer even if the UI looks unified.
**What we must NOT copy** — The CC BY-NC-4.0 dataset must never touch our repo or reference library. The MIT/NC split is exactly the trap THIRD_PARTY_REVIEW must catch. Also avoid importing its per-modality LoRA-adapter sprawl into one embedding module.
**Our differentiation** — **Reference Decomposition.** It retrieves whole videos; we decompose a video into `motion`, `camera_motion`, `pose`, `lighting` and `scene` so the user can inherit "the camera work of that video" without its subject.
**Sources:** [repo](https://github.com/PKU-YuanGroup/LanguageBind)

##### InternVideo / InternVideo2

**Repository** — [OpenGVLab/InternVideo](https://github.com/OpenGVLab/InternVideo)
**License** — Apache-2.0 label on the repository; **weight terms UNVERIFIED** (not separately licensed in the README).
**Main function** — Video foundation models combining generative and discriminative learning, including a VideoCLIP component for video-text matching; variants S / B / L plus an 8B model, smaller models distilled from the 1B checkpoint.
**Overlap** — The heavyweight option for similar-video search and camera-motion-aware retrieval, if a user opts into an enhanced mode with a local GPU.
**Useful idea** — The **distillation ladder** is Matryoshka's logic applied on the model axis: publish a family where the small member approximates the large one so a user trades quality for laptop-friendliness *without changing vector-space semantics*. Our adapter registry should expose that as a `quality` tier with vector compatibility stated explicitly.
**What we must NOT copy** — Its scale. An 8B video model is categorically incompatible with local-first, AI-optional defaults; anything this size can only be an explicitly disclosed, explicitly installed enhanced-mode backend.
**Our differentiation** — **Reference Mixing.** It produces video *understanding*; we produce an editable `camera_motion` array the user can override, combine with another reference's `motion`, and export as a `StructuredPrompt`.
**Sources:** [repo](https://github.com/OpenGVLab/InternVideo)

#### 3.5.2 Local vector storage and ANN

##### sqlite-vec

**Repository** — [asg017/sqlite-vec](https://github.com/asg017/sqlite-vec)
**License** — Apache-2.0 OR MIT (dual; both labels shown on the repo page).
**Main function** — A pure-C, dependency-free SQLite extension for vector storage and KNN search. float32, int8 and binary vectors; runs on desktop platforms and **in the browser with WASM**; supports auxiliary, partition-key and metadata columns alongside the vector. Self-declared pre-v1: "expect breaking changes!"
**Overlap** — The most direct answer to "how does a local-first app persist and search vectors without a server": one file holding vectors, reference metadata and taxonomy tags, queryable in a single statement.
**Useful idea** — **Partition-key and metadata columns are the mechanism for the License Guard.** `status`, `metadata.source` and taxonomy tags live in the same row as the embedding, so a reference that is not `approved` becomes structurally unreachable by the retriever via a `WHERE` clause instead of being post-filtered out. That is the storage-level expression of "an unverified licence can never reach `approved`", and it is why this is our recommended default store.
**What we must NOT copy** — Pre-v1 status means its SQL must never leak out of `src/search/semantic-search.js`. Do not prematurely adopt IVF/DiskANN; brute force is correct at our scale and has zero failure modes.
**Our differentiation** — **Selective Inheritance.** sqlite-vec is storage; our value is what the row *contains* — a `Reference` with typed `visual_attributes`, full attribution metadata and a four-value `status`. Inheritance operates on those typed attributes, never on the vector.
**Sources:** [repo](https://github.com/asg017/sqlite-vec)

##### Voy

**Repository** — [tantaraio/voy](https://github.com/tantaraio/voy)
**License** — Apache-2.0 OR MIT, at the user's option (README statement).
**Main function** — A 75 KB-gzipped Rust/WASM vector similarity engine for the browser using a k-d tree; `index()`, `search()`, `add()`, `remove()`; results carry inline metadata; persistence only via serialize/deserialize to a string.
**Overlap** — The smallest possible client-side ANN for a prototype.
**Useful idea** — Its result payload **carries metadata inline** (id, title, url), which is the right ergonomics for reference cards: the retriever returns enough to render a card without a second lookup round-trip. Our `ResultSet.items[]` follows the same instinct with `matched_categories[]` and `score_breakdown`.
**What we must NOT copy** — The documented requirement to **rebuild the index when a resource updates** is disqualifying: users add and approve references continuously through the License Guard, and a full reindex per approval is unacceptable. The project is also marked work-in-progress with a pre-1.0 API, and k-d trees degrade toward brute force at 1024–2048 dims anyway **(UNVERIFIED as a measurement)**.
**Our differentiation** — **Reference Mixing.** Voy searches a fixed set of vectors; we construct a *new* composite query from parts of several approved references and surface conflicts rather than auto-resolving them.
**Sources:** [repo](https://github.com/tantaraio/voy)

##### USearch

**Repository** — [unum-cloud/usearch](https://github.com/unum-cloud/usearch)
**License** — Apache-2.0 (GitHub label).
**Main function** — A multi-language HNSW vector search and clustering engine with JavaScript/WASM bindings; scalar types from f64 down to `i8` and `b1x8` (single-bit); serialises to file, stream or buffer including memory-mapped files with random access.
**Overlap** — The one library that could serve both a browser MVP and a future Node/ComfyUI build from a single index format — directly answering brief question 9.
**Useful idea** — **Quantized indexes.** Combined with quantization-aware embedding training and Matryoshka truncation, a 2048-dim float32 vector (8 KB) becomes a 256-dim int8 vector (256 B) — roughly 32× smaller, which is what makes a few-thousand-card local library fit inside browser storage quotas. Our `EmbeddingRecord.quantization` enum (`f32|f16|int8|binary`) exists to record exactly this.
**What we must NOT copy** — Do not treat HNSW as free: sibling `hnswlib` documents memory at roughly M × 8–10 bytes per element and implements deletion as *marking*, so a library where users reject references needs tombstones and periodic rebuild planned from the start. The npm package's browser-vs-native status is **(UNVERIFIED)**.
**Our differentiation** — **Visual Intent.** Infrastructure with no opinion about content; our 20 typed, user-editable fields with per-value confidence and the `35mm_like` rule are a product-level epistemic commitment no index library expresses.
**Sources:** [repo](https://github.com/unum-cloud/usearch) · [hnswlib memory notes](https://github.com/nmslib/hnswlib)

##### hnswlib-wasm, hnswlib and FAISS

**Repository** — [ShravanSunder/hnswlib-wasm](https://github.com/ShravanSunder/hnswlib-wasm) · [nmslib/hnswlib](https://github.com/nmslib/hnswlib) · [facebookresearch/faiss](https://github.com/facebookresearch/faiss)
**License** — Apache-2.0 / Apache-2.0 / MIT. All three verified.
**Main function** — Approximate nearest-neighbour search over HNSW graphs at three deployment tiers: in the browser (Emscripten build persisting through IDBFS/IndexedDB), natively (header-only C++ with incremental insert and delete-by-marking), and at scale (FAISS).
**Overlap** — Together they bracket our entire deployment story: browser MVP, desktop/ComfyUI node, large corpora — all behind one `semantic-search` interface.
**Useful idea** — **IDBFS-backed index persistence** is the concrete answer to keeping a vector index across sessions with no server. The pattern: reference metadata rows in IndexedDB or SQLite-over-OPFS, the ANN graph in an Emscripten FS file synced to IndexedDB, plus an explicit `{embeddingBackendId, dims, quantization, indexVersion}` header so swapping the embedding adapter **invalidates** the index instead of silently returning garbage. Our `EmbeddingRecord` is model-keyed (`"<family>_<size>@<rev>"`) for the same reason: retrieval queries the key named by the active adapter and silently skips references that lack it.
**What we must NOT copy** — Do not adopt an experimental single-maintainer WASM binding as a load-bearing default; ANN must be an optional acceleration behind an interface whose baseline is an honest brute-force cosine scan. Note also hnswlib's caveat that inner product is not a true metric.
**Our differentiation** — **Search by Difference.** All three answer only "nearest neighbours of this vector". Our ranking is explicitly hybrid, so an ANN library owns part of one half of one stage; the KEEP/CHANGE logic lives entirely in our fusion ranker.
**Sources:** [hnswlib-wasm](https://github.com/ShravanSunder/hnswlib-wasm) · [hnswlib LICENSE](https://raw.githubusercontent.com/nmslib/hnswlib/master/LICENSE) · [FAISS LICENSE](https://raw.githubusercontent.com/facebookresearch/faiss/main/LICENSE)

#### 3.5.3 Video segmentation, motion estimation and in-browser decoding

##### PySceneDetect

**Repository** — [Breakthrough/PySceneDetect](https://github.com/Breakthrough/PySceneDetect)
**License** — BSD-3-Clause. Verified: LICENSE file, "Copyright (C) 2014, Brandon Castellano".
**Main function** — A Python/OpenCV library and CLI that detects shot cuts and fades, then splits the video or saves representative frames per scene. `ContentDetector` (weighted HSV frame delta, `threshold=27.0`, `min_scene_len=15`), `AdaptiveDetector` (two-pass, `adaptive_threshold=3.0`, `min_content_val=15.0`), `ThresholdDetector` (fades).
**Overlap** — Steps 1–2 of our video pipeline. Camera motion is a **per-shot** property: a 30-second clip with four cuts has four `camera_motion` values, so segmentation must precede analysis.
**Useful idea** — Three portable ideas. (1) **Downscale before you measure**: `DEFAULT_MIN_WIDTH = 256`. (2) **Absolute score AND ratio-to-neighbourhood**: `AdaptiveDetector` fires only when the ratio to a rolling average *and* the absolute score both clear their thresholds, which is exactly what stops a whip pan being reported as a cut — load-bearing for us, because a whip pan is a `camera_motion` value, not a boundary. (3) `min_scene_len` as a product-level floor: do not emit a shot the user cannot see.
**What we must NOT copy** — Do not vendor or transliterate its detectors into `src/`; reimplement from the described algorithm and cite it. BSD-3-Clause requires retaining the copyright notice and disclaimer and forbids using the author's name to endorse our product; if shipped as a dependency it goes in THIRD_PARTY_NOTICES. Also do not adopt its mental model that the output is an *editing* scene list; ours is *evidence* for a proposal — which is why each shot becomes `Reference.media.shot_boundaries` and chip-level `evidence.shot_index`.
**Our differentiation** — **Reference Decomposition.** It ends at "here are your cuts". Each detected shot becomes a decomposable segment whose `camera_motion` can be inherited independently.
**Sources:** [repo](https://github.com/Breakthrough/PySceneDetect) · [content_detector.py](https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/content_detector.py) · [adaptive_detector.py](https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/adaptive_detector.py)

##### TransNetV2

**Repository** — [soCzech/TransNetV2](https://github.com/soCzech/TransNetV2)
**License** — MIT for the repository (GitHub label). Weight-specific terms **(UNVERIFIED)**.
**Main function** — A neural shot-boundary detector that catches gradual transitions (dissolves, fades) which pixel-difference detectors miss. Input contract: frames of shape `[n_frames, 27, 48, 3]`, uint8 RGB; two output heads, one sharp per-cut and one soft per-frame.
**Overlap** — The same job as PySceneDetect at higher accuracy and much higher cost; an accuracy ceiling to benchmark against.
**Useful idea** — Two. (1) A state-of-the-art shot detector runs on a **1,296-pixel thumbnail per frame** — licence to downscale aggressively in our own geometric estimator. (2) Its **two-head design is a clean model for our confidence map**: emit a hard label *plus* a soft score, never a bare label.
**What we must NOT copy** — Do not make it a dependency: it needs a deep-learning runtime plus a weight download, which breaks "AI OFF must be a complete product" if shot segmentation silently requires it. Do not redistribute weights until their terms are checked.
**Our differentiation** — **Unified Modal.** It answers "is frame *i* a transition?". We surface the resulting shots as reference cards inside the same modal as image and text results.
**Sources:** [repo](https://github.com/soCzech/TransNetV2) · [inference README](https://github.com/soCzech/TransNetV2/blob/master/inference/README.md)

##### FFmpeg (`scdet`, `select`, keyframe sampling)

**Repository** — [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg)
**License** — LGPL-2.1-or-later by default; GPL-2.0-or-later with `--enable-gpl`; `--enable-nonfree` produces an **unredistributable** binary. Verified from `LICENSE.md`.
**Main function** — The reference implementation for decoding, scene-change scoring and cheap frame extraction. `scdet` writes `lavfi.scd.mafd` / `.score` / `.time`; the `select` filter's scene score is `mafd = sad/count/(1<<(bitdepth-8))`, `diff = |mafd - prev_mafd|`, `score = clip(min(mafd, diff)/100, 0, 1)`, with expression variables including `key` and `pict_type`.
**Overlap** — The canonical answer to "how do I sample representative frames cheaply", both via scene score and via decode-only-I-frames.
**Useful idea** — The scene score is two lines and already normalised to 0..1 — exactly the shape a confidence value wants. And `key` / `pict_type` point at the cheapest sampler of all: **decode only I-frames**, since keyframes are the encoder's own opinion about where the picture changed.
**What we must NOT copy** — Do not link FFmpeg into a distributed artifact without the LGPL homework (dynamic linking, relinking rights, notices), and never ship an `--enable-gpl` or `--enable-nonfree` build. Do not copy mafd-only thinking into the product: a scene score is a *cut* signal and says nothing about pan versus dolly.
**Our differentiation** — **Reference Mixing.** FFmpeg gives a number per frame; we turn the sequence into typed `camera_motion` chips that can be combined with `motion` from a second clip, with conflicts surfaced rather than averaged.
**Sources:** [vf_scdet.c](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_scdet.c) · [f_select.c](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/f_select.c) · [LICENSE.md](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md)

##### RAFT and the OpenCV homography / partial-affine route

**Repository** — [princeton-vl/RAFT](https://github.com/princeton-vl/RAFT) · [opencv/opencv](https://github.com/opencv/opencv)
**License** — RAFT BSD-3-Clause; OpenCV Apache-2.0 on the current default branch. Both verified via GitHub labels. Whether every historical 4.x release matches is **(UNVERIFIED)**.
**Main function** — RAFT: dense per-pixel optical flow, reference quality. OpenCV: classical CV — feature detection, sparse flow, `findHomography`, `estimateAffinePartial2D`, RANSAC, homography decomposition. (Exact signatures and RANSAC defaults **(UNVERIFIED)** — the docs host was blocked.)
**Overlap** — This is the AI-free, deterministic path to `camera_motion` that lets video analysis work with AI OFF: downscale to ~256 px greyscale, get sparse correspondences, RANSAC-fit a 4-DOF partial affine (tx, ty, scale, rotation), accumulate over the shot, then classify.
**Useful idea** — The 4-DOF parameter vector maps almost one-to-one onto our vocabulary: sustained `tx` → `camera_motion.pan_*`, sustained `ty` → `camera_motion.tilt_*`, sustained rotation → roll/dutch, high per-step variance with near-zero cumulative sum → `camera_motion.handheld`, all-zero → `camera_motion.static`. **Critically, a single global homography cannot separate a dolly-in from a zoom-in on a planar or distant scene** — both produce uniform scale growth, and separating them needs parallax or depth. This is a geometric fact, not a bug, and the product answer is already in the schema: emit the ambiguous family as several low-confidence chips with `alternatives`, and let the user resolve it. RAFT's role is as an **offline oracle** to calibrate the cheap estimator's thresholds, not as a shipped component.
**What we must NOT copy** — Do not ship RAFT (a deep-learning runtime, weights and a GPU) in an MVP that must run in a browser. Do not reflexively ship `opencv.js` either — a multi-megabyte WASM download for a few hundred lines of least squares is a real first-paint cost. And do not copy anyone's thresholds as universal; they must be recalibrated on our own clips.
**Our differentiation** — **Selective Inheritance.** Flow libraries output a field or a trajectory. We output a typed, transplantable attribute: `camera_motion` extracted from a video can be inherited onto a still image's composition, which is what "same movement as this video, but the camera work of that video" actually requires.
**Sources:** [RAFT](https://github.com/princeton-vl/RAFT) · [OpenCV](https://github.com/opencv/opencv)

##### WebCodecs + mp4box.js

**Repository** — [w3c/webcodecs](https://github.com/w3c/webcodecs) (spec) · [gpac/mp4box.js](https://github.com/gpac/mp4box.js) (demuxer)
**License** — WebCodecs is a specification (no software licence applies to us); mp4box.js is BSD-3-Clause (LICENSE verified).
**Main function** — WebCodecs gives JavaScript direct access to the browser's decoders (`VideoDecoder`, `VideoFrame`, `EncodedVideoChunk`); mp4box.js parses the container to feed it. WebCodecs' explicit **non-goals** are "Direct APIs for media containers (muxers/demuxers)" and "Writing codecs in JavaScript or WebAssembly".
**Overlap** — The fast path for in-browser video decoding, which is mandatory because the MVP is a static web app doing local-first processing.
**Useful idea** — Because the demuxer exposes the **sample table before any decoding**, we can read sync-sample (keyframe) timestamps without decoding a pixel. The cheapest possible sampler is therefore: parse container → take sync-sample timestamps → decode only those → downscale to a 256-px canvas → run the motion math.
**What we must NOT copy** — Do not vendor mp4box.js into `src/`; take it as a dependency and record BSD-3-Clause attribution. Do not assume MP4 — other containers need a different demuxer, so container support must be a declared capability with a graceful fallback. Do not leak `VideoFrame` objects; they hold system memory and must be closed.
**Our differentiation** — **Visual Intent.** WebCodecs is a pixel pump. What sits on top is the conversion of a dropped video into the identical structured schema a typed text query produces — "user should never need to know where to search" extends to "or how their video was decoded".
**Sources:** [WebCodecs explainer](https://raw.githubusercontent.com/w3c/webcodecs/main/explainer.md) · [mp4box.js LICENSE](https://raw.githubusercontent.com/gpac/mp4box.js/master/LICENSE)

##### `HTMLVideoElement.requestVideoFrameCallback`

**Repository** — [WICG/video-rvfc](https://github.com/WICG/video-rvfc)
**License** — A WICG specification; document licence not fetched **(UNVERIFIED)**. No code dependency for us.
**Main function** — A callback fired when a new video frame is presented for composition, carrying frame-accurate metadata: `mediaTime`, `presentedFrames`, `width`/`height`, `presentationTime`, `expectedDisplayTime`, `processingDuration`.
**Overlap** — The universal in-browser decoding fallback and arguably the primary MVP path: it works wherever `<video>` works, with no demuxer, no WASM and no cross-origin isolation.
**Useful idea** — Two patterns. **Seek-and-grab** (set `currentTime`, wait for the callback, draw into a 256-px offscreen canvas) suits shot-representative frames, and because `mediaTime` is reported you know exactly which frame you got — which matters for stamping `evidence.t_start_s` on a chip. **Play-and-sample** (play muted at high rate, take every Nth callback, use `presentedFrames` to detect drops) suits the motion estimator, which needs consecutive frames at a known stride.
**What we must NOT copy** — Do not build on `requestAnimationFrame` + `currentTime` heuristics; this API exists to replace them. And do not read pixels from a **cross-origin** `<video>`: the canvas is tainted and pixel readback throws — meaning remote provider video may be un-analysable unless CORS permits, and only uploaded video can be decomposed. That limitation must be stated in the UI, not hidden.
**Our differentiation** — **AI-optional completeness.** This is how we honestly deliver local-first video analysis in a static web app with zero server and zero model download, so geometric `camera_motion` extraction works with AI OFF — making the no-AI product genuinely complete for video, not a degraded demo.
**Sources:** [explainer](https://raw.githubusercontent.com/WICG/video-rvfc/gh-pages/explainer.md)

##### ffmpeg.wasm

**Repository** — [ffmpegwasm/ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)
**License** — MIT for the wrapper (GitHub label). The compiled core is LGPL-2.1-or-later, or GPL depending on build flags; the shipped core's effective licence was **not read (UNVERIFIED)**.
**Main function** — FFmpeg compiled to WebAssembly, giving full transcode and filter capability inside the browser.
**Overlap** — It would let us run scene detection client-side exactly as on a server — tempting, and mostly wrong for us.
**Useful idea** — Keep it as an **optional, lazily loaded capability for formats WebCodecs cannot handle**. The transferable lesson is the loading strategy: a multi-megabyte WASM payload must never be on the critical path of a static web app's first render, and should be fetched only after the user drops an unsupported file.
**What we must NOT copy** — The licence stack is the hazard: an MIT wrapper around an LGPL (or, with the wrong flags, GPL) core means the core's actual build licence must be recorded with LGPL relinking rights preserved — in the *code*-licence column, never conflated with the CC pipeline for reference media. Multi-threaded builds additionally need cross-origin isolation headers a plain static host may not send **(UNVERIFIED)**.
**Our differentiation** — **Unified Modal.** We are not building a video tool. Video is one of four input modes, so our video code should be the smallest thing that can emit `camera_motion` and `motion` chips, not a media pipeline.
**Sources:** [repo](https://github.com/ffmpegwasm/ffmpeg.wasm) · [FFmpeg LICENSE.md](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md)

#### 3.5.4 Local model runtimes

##### Qwen3-VL

**Repository** — [QwenLM/Qwen3-VL](https://github.com/QwenLM/Qwen3-VL)
**License** — Apache-2.0 for the repository (GitHub label). **Per-checkpoint weight licences UNVERIFIED.**
**Main function** — A multimodal LLM family (2B / 4B / 8B / 32B dense plus MoE variants) with explicit long-video and timestamp-grounding capability.
**Overlap** — The leading candidate for `analyzer-adapter` in AI-ON mode; the 2B/4B sizes are the realistic laptop-local floor the brief's "evaluate, do not hardcode" clause anticipates.
**Useful idea** — Its processor defaults tell us concretely what "representative frames" means for a VLM: `fps=2` with frame sampling on by default, or `num_frames=128` with fps disabled, and total pixels bounded to keep the token sequence manageable. That is a **sourced operating point** — roughly 2 fps, capped frame count, small resolution — which we should make *shot-aware* (one frame per detected shot plus first/middle/last in long shots) rather than uniform. Its timestamp grounding is also what makes `evidence.t_start_s` / `t_end_s` realistically populatable by `source: "analyzer_video"`.
**What we must NOT copy** — Do not hardcode the model name anywhere; the model id belongs in adapter config. Do not ship weights or assume checkpoint terms match the repo licence. And do not let its fluent prose leak into the product as prose, or let it assert lens as fact.
**Our differentiation** — **Reference Decomposition.** It will write a paragraph about a video; we discard the paragraph and keep only the typed decomposition, because a reference-as-typed-attributes is the precondition for Search by Difference.
**Sources:** [repo](https://github.com/QwenLM/Qwen3-VL) · [README](https://raw.githubusercontent.com/QwenLM/Qwen3-VL/main/README.md)

##### llama.cpp (`llama-server` + libmtmd)

**Repository** — [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp)
**License** — MIT (GitHub label).
**Main function** — A C/C++ LLM inference engine whose `llama-server` exposes an OpenAI-compatible `/chat/completions` endpoint with multimodal input; requires `-m model.gguf` plus `--mmproj projector.gguf`, and documents image, audio and video input.
**Overlap** — The pragmatic adapter target: one HTTP contract that also covers Ollama, LM Studio and vLLM.
**Useful idea** — Two lessons. (1) The **two-file model contract** means a local analyzer's config is an object, not a string, and "vision unavailable — no projector loaded" must be a first-class UI state rather than a failed request. (2) Because it speaks OpenAI chat-completions, we implement image parts as data URIs **once** and get four runtimes for free.
**What we must NOT copy** — Nothing to copy; MIT, consumed over HTTP. The architectural trap is building the analyzer around llama.cpp-only surfaces; anything outside the OpenAI-compatible surface goes behind an optional capability flag.
**Our differentiation** — **Visual Intent.** It is a runtime with no opinion about what a reference is. We are the layer that makes local model output safe to trust: every field lands in the same user-editable schema with a confidence, whatever the input mode.
**Sources:** [repo](https://github.com/ggml-org/llama.cpp) · [docs/multimodal.md](https://raw.githubusercontent.com/ggml-org/llama.cpp/master/docs/multimodal.md)

##### Ollama

**Repository** — [ollama/ollama](https://github.com/ollama/ollama)
**License** — MIT (GitHub label).
**Main function** — A local model runner with a registry plus an OpenAI-compatible API layer on `localhost:11434/v1/` covering `/v1/chat/completions`, `/v1/embeddings` and `/v1/models`. Exact documentation wording **(UNVERIFIED** — docs hosts blocked).
**Overlap** — The lowest-friction local backend for a non-technical user, and the default target for our local-first stance.
**Useful idea** — Two. `/v1/embeddings` on the *same* base URL as `/v1/chat/completions` means the analyzer and embedding adapters can share one connection config. And `/v1/models` means the settings UI can **discover** what the user has installed instead of asking them to type a model name — the practical way to honour INV-AI-2.
**What we must NOT copy** — Do not assume the OpenAI-compat vision path is universal or bug-free; keep a fallback to the native chat shape behind a flag, and never make image analysis a hard requirement.
**Our differentiation** — **Unified Modal.** Which local server answered a request is an implementation detail the user should never have to care about, beyond the mandated privacy disclosure.
**Sources:** [repo](https://github.com/ollama/ollama)

##### LM Studio (`lms` CLI) and vLLM

**Repository** — [lmstudio-ai/lms](https://github.com/lmstudio-ai/lms) · [vllm-project/vllm](https://github.com/vllm-project/vllm)
**License** — `lms` CLI MIT; vLLM Apache-2.0 (both GitHub labels). **The LM Studio desktop application itself is proprietary (UNVERIFIED)** — do not describe LM Studio as open source.
**Main function** — LM Studio: a desktop local-model runner exposing an OpenAI-compatible server on `localhost:1234/v1`. vLLM: a high-throughput GPU serving engine with an OpenAI-compatible server that accepts multimodal content parts including `video_url` **(UNVERIFIED)**.
**Overlap** — Both reinforce the same conclusion: `/v1/chat/completions` is the lingua franca and a base-URL swap is the entire integration. Our settings UI should ship base-URL presets rather than per-vendor integrations.
**Useful idea** — vLLM's `video_url` is the temptation we should consciously **refuse** for the MVP: sending a whole video to a server means uploading the user's media, colliding with local-first processing. Sending **sampled frames as images** is portable across all four runtimes, an order of magnitude cheaper, and privacy-legible — we can literally show the user the N frames that will be transmitted before `external_transmission.allowed` is set.
**What we must NOT copy** — vLLM's GPU-server assumptions in a product whose MVP is a static web app; and LM Studio's "download a multi-gigabyte model to try the app" onboarding, which would destroy the v0.1 milestone.
**Our differentiation** — **Search by Difference.** Serving engines compete on tokens per second. We compete on letting a user mark KEEP and CHANGE categories and retrieve against that delta; no serving engine has a concept of a partially inherited reference.
**Sources:** [lms](https://github.com/lmstudio-ai/lms) · [vLLM](https://github.com/vllm-project/vllm)

##### MLX-VLM

**Repository** — [Blaizzy/mlx-vlm](https://github.com/Blaizzy/mlx-vlm)
**License** — MIT (GitHub label).
**Main function** — Inference and fine-tuning of vision-language models on Apple Silicon via MLX, with a CLI and an OpenAI-compatible server exposing `/v1/chat/completions`, `/v1/embeddings` **and** `/v1/rerank`; explicitly covers video analysis with select models.
**Overlap** — The Mac-native leg of the local runtime story.
**Useful idea** — It serves **exactly the three adapters the brief names** from one process. That is strong evidence our adapter interfaces should be three thin functions over one shared connection config, and it validates the hybrid-search plan (semantic + structured → fusion → optional reranker) as something one local box can actually serve.
**What we must NOT copy** — Do not make Apple Silicon a first-class assumption; it is one backend among several. Do not bake quantization suffixes into config defaults.
**Our differentiation** — **Reference Mixing.** It will caption a video, and a caption is prose — the exact failure mode the brief forbids. Our output is a `StructuredPrompt` plus a `ReferenceMix` recording which reference contributed which category, so the composition is reproducible and re-mixable as a `VisualRecipe`.
**Sources:** [repo](https://github.com/Blaizzy/mlx-vlm) · [README](https://raw.githubusercontent.com/Blaizzy/mlx-vlm/main/README.md)

#### 3.5.5 Licence-safe media providers

These fill `Reference.metadata`. For each, the question is not "is it good search?" but **"which response field fills which metadata slot, can a static page call it, and can a licence be verified per asset?"**

##### Openverse API

**Repository** — [WordPress/openverse](https://github.com/WordPress/openverse) (API base `https://api.openverse.org/v1/`)
**License** — MIT for the code (LICENSE fetched). Indexed media carries its own per-item licence.
**Main function** — An aggregated search index over openly licensed **images and audio only** — no video — with first-class licence filtering via `license` (comma-separated codes `by, by-sa, by-nd, by-nc, by-nc-sa, by-nc-nd, cc0, pdm`) and `license_type` (groups `all`, `all-cc`, `commercial`, `modification`). Responses carry `id`, `title`, `creator`, `creator_url`, `url` (media), `thumbnail`, `foreign_landing_url` (upstream page), `license`, `license_version`, `license_url`, `attribution`, `provider`, `source`, `category`, `tags`, `fields_matched`.
**Overlap** — Only with our similar-reference-search stage. Its `related/` endpoint has no notion of composition, camera angle, pose, lighting or motion, and it terminates at a flat result grid.
**Useful idea** — Two, in spirit. (1) **`license_type` grouping**: one user-facing switch that expands to a concrete code list, instead of seven CC checkboxes. We expose exactly two tiers matching our default (`public_domain`, `pdm`, `cc0`, `cc_by`, `user_owned`) and optional (`+ cc_by_sa`) sets. (2) **`filter_dead`**: the index actively drops 404 links, which is what our `source_validation` step should do with a HEAD check before a reference reaches `approved` — and it is the same logic as `resolveMedia()`'s post-check `media_state` values (`ok` / `moved` / `gone`, from an initial `unchecked`).
**What we must NOT copy** — No copying of its server code (MIT would permit it; the brief does not, and it would drag a server architecture into a local-first product). Do not mirror its catalogue. And **do not use `license_type=commercial` as a proxy for our policy**: `commercial` still admits `by-nd` and `modification` still admits `by-nc`, so we must filter with explicit `license=` codes. Because `license_url` and `attribution` are *computed* properties with a documented fallback, a missing `license_url` must be treated as **not verified**, never as "probably fine". Note also the anonymous throttle — 5/hour and 100/day — which makes registration effectively mandatory beyond a demo, and registration is itself an external-transmission event to disclose.
**Our differentiation** — **Reference Decomposition.** Openverse returns a picture; we return a bag of typed attributes that can be individually inherited. An Openverse result is an *input* to our decomposition, never the product.
**Sources:** [LICENSE](https://raw.githubusercontent.com/WordPress/openverse/main/LICENSE) · [licenses.py](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/licenses.py) · [media_types.py](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/media_types.py) · [security.py, CORS](https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/security.py) · [rest_framework.py, throttles](https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/rest_framework.py)

##### Wikimedia Commons — MediaWiki Action API + CommonsMetadata

**Repository** — [wikimedia/mediawiki](https://github.com/wikimedia/mediawiki) · [mediawiki-extensions-CommonsMetadata](https://github.com/wikimedia/mediawiki-extensions-CommonsMetadata); endpoint `https://commons.wikimedia.org/w/api.php`
**License** — GPL-2.0 for the software (COPYING fetched). Media items carry per-file CC/PD licences.
**Main function** — A full media repository API: file search, `prop=imageinfo` with `iiprop=url|extmetadata|mediatype|mime|size|dimensions`, server-side thumbnails via `iiurlwidth`, and machine-readable licence/attribution through the `extmetadata` block. Media types include `MEDIATYPE_VIDEO`, making Commons **the only licence-clean video source in this survey**. Anonymous browser calls work with `origin=*`.
**Overlap** — Similar-reference search and, uniquely, the licence+attribution half of our License Guard: `extmetadata` already carries a normalised `License` code plus an explicit `AttributionRequired` boolean.
**Useful idea** — **`AttributionRequired` as an explicit boolean is the single most reusable idea in C5.** Rather than *inferring* "CC BY needs credit" from a licence string, the source states it. Our `metadata.requires_attribution` is a derived cache recomputed on load, and it must **fail closed** — default `true` when a source is silent. Second: `iiurlwidth` server-side thumbnailing makes `thumbnail_url` a derived URL and never a stored byte, satisfying INV-REF-2 for free.
**What we must NOT copy** — Do not vendor MediaWiki or CommonsMetadata PHP: GPL-2.0 is copyleft and would infect our codebase; calling the API over HTTP is not a derivative work. Do not scrape Commons category trees into `data/taxonomy/*.json` — our vocabulary must be our own. Do not re-host media. And do not import free-text `ImageDescription` blobs as if they were structured intent; they are prose and must go through the analyzer.
**Our differentiation** — **Selective Inheritance.** Commons can tell us a file is CC BY-SA 4.0 and who shot it; it cannot let a user take the composition from that file and the lighting from another. Commons is the licence-clean substrate; the product is the attribute-level layer above it.
**Sources:** [CommonsMetadata COPYING](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/COPYING) · [TemplateParser.php, extmetadata keys](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/src/TemplateParser.php) · [ApiQueryImageInfo.php](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiQueryImageInfo.php) · [ApiMain.php, CORS](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiMain.php) · [Mime/defines.php, media types](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/libs/Mime/defines.php)

##### Europeana Search API

**Repository** — [europeana/labs-preview](https://github.com/europeana/labs-preview) (docs) · [europeana/rd-europeana-python-api](https://github.com/europeana/rd-europeana-python-api) (client)
**License** — EUPL-1.2 for the Python client (verified from its repo page). **API service terms UNVERIFIED** (host blocked).
**Main function** — Aggregated search over European cultural-heritage objects with a rights-based `reusability` filter (`open | restricted | permission`) and a `type` facet covering TEXT, VIDEO, SOUND, IMAGE, 3D. Requires a free key passed as a query parameter.
**Overlap** — Retrieval only, and metadata-first (catalogue records) rather than visual-first.
**Useful idea** — **`reusability` as a three-valued trust ladder** rather than a boolean. That maps cleanly onto `Reference.status`: `open` → `approved` (subject to per-item checks), `restricted` / `permission` → `license_review`, so restricted content stays *visible and explained* rather than invisibly filtered out.
**What we must NOT copy** — EUPL-1.2 is copyleft: do not vendor the client. Do not bulk-harvest records. And do not imitate the pattern of baking a key into a static page's query strings — that leaks the key in the network tab, which is why Europeana can only ever be an optional, user-supplied-key provider for us.
**Our differentiation** — **Unified Modal.** Its rights filter and result grid are a separate destination page; in our product the source switch is a mode inside one modal whose state persists, so the user never has to know they crossed a provider boundary.
**Sources:** [search.md](https://raw.githubusercontent.com/europeana/labs-preview/master/api/search.md) · [Python client](https://github.com/europeana/rd-europeana-python-api)

##### Smithsonian Open Access API

**Repository** — [Smithsonian/OpenAccess](https://github.com/Smithsonian/OpenAccess) (repository archived 2026-05-21); endpoint `https://api.si.edu/openaccess/api/v1.0/`
**License** — CC0-1.0 for the metadata/data repository (GitHub label + README).
**Main function** — 11M+ CC0 metadata records with media across 19 Smithsonian units; search with a key obtained from a government API portal; media live under `content.descriptiveNonRepeating.online_media.media[]`, with the CC0 gate being the per-asset flag `media.usage.access == "CC0"`.
**Overlap** — Retrieval plus a CC0-only corpus. Zero decomposition — its query parameter is a text query over catalogue prose.
**Useful idea** — **Per-asset `usage.access` rather than per-record rights.** Our `Reference` must likewise bind the licence to the media asset we actually display, not to its parent catalogue record; record-level CC0 and media-level CC0 are different things, and conflating them is a real licence-safety failure mode.
**What we must NOT copy** — Do not mirror the record dump into the repo; CC0 would legally permit it, but the brief forbids bulk storage and media binaries. Do not assume the dataset's CC0 label covers every linked media asset. Whether `api.si.edu` still serves traffic now that the repo is archived is **(UNVERIFIED)**.
**Our differentiation** — **Visual Intent.** A Solr-style text query over catalogue prose is not a structured schema that every input mode compiles down to.
**Sources:** [repo](https://github.com/Smithsonian/OpenAccess) · [Openverse's Smithsonian ingester](https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/smithsonian.py)

##### The Metropolitan Museum of Art Open Access

**Repository** — [metmuseum/openaccess](https://github.com/metmuseum/openaccess); API `https://collectionapi.metmuseum.org/public/collection/v1/`
**License** — CC0-1.0 **for the dataset metadata** (GitHub label + README waiver).
**Main function** — Object metadata plus open-access image URLs with no API key required; fields include `isPublicDomain`, `objectURL`, `primaryImage`, `additionalImages`, `artistDisplayName`, `title`, `creditLine`, `tags`.
**Overlap** — A narrow, very high-quality public-domain art corpus — useful as teaching exemplars for our `style` and `composition` taxonomy, i.e. `visual_hint` candidates.
**Useful idea** — **A single unambiguous boolean (`isPublicDomain`) as the entire licence gate.** Where a source gives us one, License Guard should short-circuit on it rather than string-parsing a licence name; `false` must route to `rejected`, not `license_review`.
**What we must NOT copy** — **Do NOT treat the CC0 metadata waiver as covering images.** The repo README states plainly: "Images are not included and are not part of the dataset." This is exactly the mistake the "unverified licence can never reach approved" rule exists to prevent. Do not vendor the bulk dump.
**Our differentiation** — **Search by Difference.** The Met API can filter by department and date; it cannot answer "same framing and lighting, different subject".
**Sources:** [repo](https://github.com/metmuseum/openaccess) · [Openverse's Met ingester](https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/metropolitan_museum.py)

##### Flickr API (including Flickr Commons)

**Repository** — Client used for verification: [Flickr-Foundation/flickr-photos-api](https://github.com/Flickr-Foundation/flickr-photos-api); API `https://api.flickr.com/services/rest/`
**License** — Client repo Apache-2.0 OR MIT (dual, verified). The Flickr service itself is proprietary; its ToS is **(UNVERIFIED)**.
**Main function** — Photo search with the most granular licence filter in this survey: a numeric `license` parameter. The full table was verified from a recorded live response — 0 All Rights Reserved, 1 BY-NC-SA 2.0, 2 BY-NC 2.0, 3 BY-NC-ND 2.0, 4 BY 2.0, 5 BY-SA 2.0, 6 BY-ND 2.0, 7 No known copyright restrictions, 8 United States Government Work, 9 CC0, 10 Public Domain Mark, 11 BY 4.0, 12 BY-SA 4.0, 13 BY-ND 4.0, 14 BY-NC 4.0, 15 BY-NC-SA 4.0, 16 BY-NC-ND 4.0.
**Overlap** — Retrieval with best-in-class licence-filter granularity. No decomposition, no mixing.
**Useful idea** — **Numeric licence ids force an explicit per-provider mapping table** (id → canonical `LICENSE_ID` + canonical URL) rather than trusting a display string. That table belongs in `src/reference/license-guard.js` as *data*, one map per provider, so adding a provider never means editing guard logic. Our default allow-list maps to `license=4,9,10,11` (plus `5,12` when `cc_by_sa` is enabled).
**What we must NOT copy** — No scraping of galleries, no bulk downloading, and no treating ARR (id 0) content as usable. Critically: **do not auto-approve id 7 ("No known copyright restrictions") or id 8 (US Government Work).** Neither is a CC grant; both are institutional assertions and belong in `license_review`.
**Our differentiation** — **Reference Mixing.** Flickr can return 200 CC BY photos; it cannot combine the composition of result #3 with the outfit of result #17 into one structured prompt.
**Sources:** [client repo](https://github.com/Flickr-Foundation/flickr-photos-api) · [recorded licence table](https://raw.githubusercontent.com/Flickr-Foundation/flickr-photos-api/main/tests/fixtures/cassettes/TestLicenseMethods.test_get_licenses.yml)

##### Pexels — flagged: NOT Creative Commons

**Repository** — N/A — closed product; `api.pexels.com`.
**License** — A proprietary "Pexels License". **(UNVERIFIED at source** — facts below come from a third-party mirror of the official docs.)
**Main function** — Free-to-use stock photos **and videos** under a custom licence; authentication via header; a named ladder of derivative sizes (`original`, `large2x`, `large`, `medium`, `small`, `portrait`, `landscape`, `tiny`); `avg_color`; rate limit 200/hour and 20,000/month.
**Overlap** — Retrieval, plus it is one of only two sources here with a real video API — tempting for our video milestone and to be resisted on licence grounds.
**Useful idea** — The **`src` object as a named ladder of derivatives** rather than a single URL, plus `avg_color` as a load-time placeholder. Our thumbnail strategy should likewise expose a small set of named sizes so the card grid and the detail drawer do not fight over the same asset.
**What we must NOT copy** — Their terms state explicitly: "You may not copy or replicate core functionality of Pexels." Independently, the brief forbids building on a non-CC source. Do not cache Pexels media, do not treat "free to use" as public domain, and never present Pexels results beside CC BY results without a distinct badge. Under our policy a Pexels item can **never** reach `approved`: it has no per-item `license` or `license_url` at all, only one blanket proprietary licence, which maps to `unknown`.
**Our differentiation** — **Unified Modal.** Pexels splits photos and videos across different API surfaces and site sections; our modal treats an image and a video as the same `Reference` type with the same attribute bag.
**Sources:** [third-party mirror of the official API docs](https://raw.githubusercontent.com/developer-ishan/mcp-pexels/main/docs/official/pexels-api-docs.md)

##### Unsplash — flagged: NOT Creative Commons

**Repository** — Official client [unsplash/unsplash-js](https://github.com/unsplash/unsplash-js); API `https://api.unsplash.com/`
**License** — **MIT for the client library only** (verified label). The photos are under a proprietary "Unsplash License" whose terms could **not** be verified (host blocked).
**Main function** — Curated free-to-use photography with mandatory usage obligations: attribute photographers, hotlink images, and "trigger a download when appropriate" via a dedicated endpoint.
**Overlap** — Retrieval only.
**Useful idea** — The **shape of their obligation model**: a source can require (a) attribution, (b) hotlinking, (c) an event ping. That generalises Commons' `AttributionRequired` into something extensible, and suggests an obligations set on a reference rather than assuming attribution is the only duty a licence can impose. *(Our canonical model carries `requires_attribution` and `share_alike`; hotlink-only and download-ping obligations are not modelled — see §11.)*
**What we must NOT copy** — Do not vendor the client, and never describe the Unsplash Licence as Creative Commons or public domain. The mandatory download ping is an outbound call that our privacy rule requires be disclosed in the UI before it happens.
**Our differentiation** — **Reference Decomposition.** Unsplash's value proposition is "a beautiful photo"; ours is "the typed visual attributes inside that photo, individually selectable".
**Sources:** [unsplash-js](https://github.com/unsplash/unsplash-js)

##### Rijksmuseum Data Services

**Repository** — N/A — an institutional service.
**License** — **UNVERIFIED.** The host was blocked and there is no LICENSE file to check.
**Main function** — Roughly 800k object records, most with high-resolution images, exposed through OAI-PMH, a Search API, an LDES stream and IIIF Presentation/Image APIs; older collection endpoints are marked deprecated in favour of IIIF. All **(UNVERIFIED)**.
**Overlap** — Retrieval of a public-domain art corpus; its IIIF layer overlaps our thumbnail/derivative strategy rather than search.
**Useful idea** — **IIIF as the derivative strategy for any provider that supports it.** The Image API URL template (`{id}/{region}/{size}/{rotation}/{quality}.{format}`) gives arbitrary server-side crops and sizes from one canonical URL, which fits the no-binaries rule better than storing our own pyramid — and would let the reference detail view zoom into a *region* when the user is isolating composition or clothing (a natural pairing with `Evidence.bbox`).
**What we must NOT copy** — Do not assume "museum = public domain". Without a per-object licence statement we can actually read, every item is `license_review` at best and must never be auto-approved. Do not add it as a default provider until a licence statement has been verified.
**Our differentiation** — **Visual Intent.** A IIIF manifest describes pixels and regions; it says nothing about camera angle, pose, lighting or motion.
**Sources:** service documentation at `data.rijksmuseum.nl/docs/` (blocked)

##### NYPL Digital Collections API

**Repository** — [NYPL-publicdomain/data-and-utilities](https://github.com/NYPL-publicdomain/data-and-utilities); API `https://api.repo.nypl.org/`
**License** — CC0-1.0 for the **metadata snapshot repository** (GitHub label + README). That does not cover the items.
**Main function** — Metadata and image access for NYPL Digital Collections; roughly a third of items are public domain. The Repo API is reported deprecated as of 2026-08-01 with no public replacement planned **(UNVERIFIED)** — given today's date it may already be dead.
**Overlap** — Retrieval of historical and public-domain imagery.
**Useful idea** — NYPL states plainly that the **metadata is CC0 while the item may or may not be public domain** — the same trap as the Met. Our schema should never conflate the two; a separate metadata-licence field is the clean fix. *(Not in the canonical model today — see §11.)*
**What we must NOT copy** — Do not build a dependency on a deprecated API. If used at all, treat the CC0 snapshot as a static seed corpus of *metadata only*, never a live provider, and never infer item-level public-domain status from the metadata dedication.
**Our differentiation** — **Selective Inheritance.** A digitised archive hands you whole plates; we let a user take the composition from one plate and the lighting from another photograph.
**Sources:** [repo](https://github.com/NYPL-publicdomain/data-and-utilities)

#### 3.5.6 Video-model prompt vocabularies (formatter targets, not competitors)

These define what `formatPrompt(structured_prompt, mode)` must be able to *emit*. They are the strongest external constraint on our canonical `camera_motion` vocabulary, and the reason the canonical layer must be model-independent: the same `StructuredPrompt` has to render as bracketed commands, as a numeric vector, as a camera-first clause, and as a chronological paragraph.

##### MiniMax Hailuo "Director" camera commands

**Repository** — N/A — closed product.
**License** — proprietary. **(UNVERIFIED at source** — vendor docs blocked; command list assembled from integrator documentation.)
**Main function** — A video model accepting explicit in-prompt camera commands in square brackets: `[Truck left/right]`, `[Pan left/right]`, `[Push in]` / `[Pull out]`, `[Pedestal up/down]`, `[Tilt up/down]`, `[Zoom in/out]`, `[Shake]`, `[Tracking shot]`, `[Static shot]` — 15 commands, combinable inside one bracket set, recommended maximum 3.
**Overlap** — The most machine-mappable camera vocabulary any video model exposes, and therefore the strongest constraint on what our canonical values must express.
**Useful idea** — Its axis decomposition is textbook-correct and should anchor our node ids: truck = lateral translation; pan = rotation about the vertical axis; pedestal/boom = vertical translation; tilt = rotation about the horizontal axis; push/pull = longitudinal translation; zoom = intrinsic focal change with no translation; shake = steadiness; tracking = object-referenced follow; static = null motion. **That `[Push in]` and `[Zoom in]` are different commands in a shipping product is the commercial proof our taxonomy must not merge them** the way MovieShots does. Its recommended cap of ~3 combined moves is also a per-mode capability fact our formatter must respect.
**What we must NOT copy** — Documentation text, and the bracket strings as canonical ids. Brackets are a *surface form* produced by the `minimax_h3` formatter mode, downstream of our values.
**Our differentiation** — **Reference Decomposition.** Hailuo executes a command a human typed; we derive the command from a video reference the user pointed at, and the formatter then renders the syntax.
**Sources:** [MiniMax API reference (blocked)](https://platform.minimax.io/docs/api-reference/video-generation-i2v)

##### Kling `camera_control`

**Repository** — N/A — closed product; parameters mirrored in [griptape-ai/griptape-nodes-library-kling](https://github.com/griptape-ai/griptape-nodes-library-kling) (Apache-2.0).
**License** — proprietary for Kling **(UNVERIFIED** — vendor docs blocked); Apache-2.0 for the integrator library.
**Main function** — A video model exposing camera motion as a typed API parameter: `camera_control_type` ∈ {auto, simple, down_back, forward_up, right_turn_forward, left_turn_forward}; in simple mode six scalars each −10…10 (horizontal, vertical, pan, tilt, roll, zoom).
**Overlap** — Proof that a formatter target may be **numeric rather than lexical**, and the concrete shape of a motion-intensity parameter.
**Useful idea** — Two. (1) **Motion intensity is first-class**: the −10…10 range is exactly an intensity requirement, so a canonical camera-motion value should carry a direction plus a normalised intensity that a formatter scales to −10…10 here, or to an adverb ("slow dolly-in") for a prose model. Our chip already carries `weight` (0..1) as an emphasis hint that never affects conflict detection. (2) **Named composite moves** (`down_back`, `forward_up`) combine translation and rotation, so our conflict detector must know that a composite occupies the same slot as its components — expressible via `conflicts_with` edges on the taxonomy node.
**What we must NOT copy** — Proprietary semantics, and the integrator's code. **Axis warning:** Kling documents `pan` as rotation around the x-axis and `tilt` as rotation around the y-axis, inverted relative to standard cinematography and to Hailuo's own commands. Whether that is a documentation error or real behaviour is unresolved **(UNVERIFIED)**; our Kling formatter must be validated empirically before we trust the mapping, and until then a Kling mode must not ship.
**Our differentiation** — **Visual Intent.** Six unlabeled sliders are unusable by someone who cannot name the move. The user points at a reference; we produce the vector.
**Sources:** [integrator library](https://github.com/griptape-ai/griptape-nodes-library-kling)

##### Runway Gen-3 / Gen-4

**Repository** — N/A — closed product.
**License** — proprietary. **(UNVERIFIED at source** — help centre blocked.)
**Main function** — A video model family publishing a reference library pairing camera terminology with prompts and rendered outputs; camera motion is prompted as *style* ("locked, handheld, dolly, pan, and more"), with compound phrases as the working unit: "handheld low angle tracking shot", "whip pan", "crash zoom".
**Overlap** — A prose-first camera vocabulary, and the clearest example of a formatter that must **compose across several of our categories into one clause**.
**Useful idea** — Two formatter rules. (1) The composite pattern `[steadiness] + [angle] + [motion] + "shot"` shows our formatter must compose across fields, not emit one line per field — which is precisely why `PROMPT_SLOT_EMIT_ORDER` exists for multi-source slots such as `camera` (`camera_angle`, `camera_distance`, `camera_motion`). (2) Runway explicitly advises **avoiding negative phrasing** such as "the camera doesn't move", so a static camera must render positively ("locked-off static shot") — a concrete constraint on `formatter-generic`, and a reminder that our `constraints` slot is for genuine negations (chips with `negate: true`), not for describing absence.
**What we must NOT copy** — Proprietary help-centre text and example media. Its retirement of earlier model generations is also a reminder that modes churn: hardcoding a mode would violate INV-AI-2, which is why `FORMATTER_MODE` is an open string.
**Our differentiation** — **Unified Modal.** Runway's library is a lookup from term to example video; we run the other direction and across modalities — an example the user already has yields the term, the structured intent and the mix, inside one modal.
**Sources:** [Camera Terms, Prompts & Examples (blocked)](https://help.runwayml.com/hc/en-us/articles/47313504791059-Camera-Terms-Prompts-Examples)

##### Google Veo 3.1

**Repository** — N/A — closed product.
**License** — proprietary. The prompt guide itself was fetched successfully; the model is closed.
**Main function** — A vendor prompt guide defining a fixed formula — `[Cinematography] + [Subject] + [Action] + [Context] + [Style & Ambiance]`, camera clause **first** — plus an enumerated vocabulary: dolly / tracking / crane / aerial view / slow pan / POV; wide / close-up / extreme close-up / low angle / two-shot / medium shot / high angle; shallow depth of field / wide-angle lens / soft focus / macro lens / deep focus; reverse shot, 180-degree arc shot, lens flare.
**Overlap** — A directly usable formatter target, and the only vendor guide fetchable in full.
**Useful idea** — **Cinematography-first ordering.** A Veo-like mode emits the camera clause at the head; a Hailuo-like mode emits bracketed commands; an LTX-like mode wants a chronological paragraph. Same `StructuredPrompt`, three genuinely different renderings — which is exactly why the brief separates the structure from the formatter, and why `formatPrompt` takes a per-mode `slot_order`. Note also that Veo lumps framing ("two-shot"), size ("wide/medium") and angle ("low/high") under one "composition" heading: **our canonical layer must keep them apart and let the formatter flatten on the way out, never the reverse.**
**What we must NOT copy** — Proprietary guide text and examples, and its flattened "composition" grouping as an internal schema.
**Our differentiation** — **Visual Intent.** Veo's guide teaches a human to write a good prompt; we remove the need to know the vocabulary at all.
**Sources:** [Ultimate prompting guide for Veo 3.1](https://cloud.google.com/blog/products/ai-machine-learning/ultimate-prompting-guide-for-veo-3-1)

##### Wan 2.1 / Wan 2.2 (Alibaba, open weights)

**Repository** — [Wan-Video/Wan2.2](https://github.com/Wan-Video/Wan2.2) · [Wan-Video/Wan2.1](https://github.com/Wan-Video/Wan2.1)
**License** — Apache-2.0. Verified from the README: "The models in this repository are licensed under the Apache 2.0 License… We claim no rights over the your generated contents."
**Main function** — Open large-scale video generative models trained on curated aesthetic data with detailed labels for lighting, composition, contrast and colour tone; Wan2.1 also ships an optional prompt-extension step.
**Overlap** — Its training labels are a taxonomy close to our `lighting`, `composition` and `color` categories, which is why prompts in that vocabulary steer it well. It is the strongest candidate for a self-hostable, licence-compatible formatter target.
**Useful idea** — The prompt-extension step is architecturally the same separation we have between `StructuredPrompt` and the formatter — **and a warning**: an expansion step can overwrite user intent. Our own expansion (`source: "query_expansion"`) is always low confidence and one-click removable, and a chip with `locked: true` or `source: "user"` is immovable by `applyMix`.
**What we must NOT copy** — The README publishes **no** enumerated camera-motion vocabulary. The widely circulated lists of Wan camera verbs come from third-party guides, not the vendor **(UNVERIFIED)**. Do not encode community folklore in a formatter as if it were a vendor contract.
**Our differentiation** — **AI-optional architecture.** Wan is a backend, entering only through an adapter and a formatter mode; the modal, decomposition and mixing all work with it absent.
**Sources:** [Wan2.2 README](https://github.com/Wan-Video/Wan2.2/blob/main/README.md)

##### LTX-Video (Lightricks, open weights)

**Repository** — [Lightricks/LTX-Video](https://github.com/Lightricks/LTX-Video)
**License** — **Apache-2.0 for the repository; OpenRAIL-M for the model weights.** Verified from the repo page.
**Main function** — A real-time DiT video generation model with an explicit prompt-engineering section: one flowing chronological paragraph within 200 words, ordered main action → appearances → camera angles and movements → lighting and colours, "like a cinematographer describing a shot list".
**Overlap** — The opposite prompt shape to Hailuo's brackets and Veo's camera-first formula, which is what makes it valuable as a third formatter mode.
**Useful idea** — A hard **length budget** plus a **chronological ordering constraint**. Our formatter must therefore support a per-mode word/token budget with a documented **drop order** when the `StructuredPrompt` is richer than the budget, and per-mode field ordering. A generic serialiser that dumps every array will blow past the budget and degrade output — and any dropped fragment must be reported as a warning, never silently omitted (the same discipline as `blocked[]`).
**What we must NOT copy** — The licence split is the trap: Apache-2.0 covers the code, OpenRAIL-M covers the weights and carries use restrictions. A repo-level badge is not the weight licence. This is a THIRD_PARTY_REVIEW case and a reason License Guard must record *what* an entity licenses, not just an identifier.
**Our differentiation** — **Reference Decomposition.** LTX wants a shot-list paragraph, which presupposes knowing the shot. We produce the typed attributes and the formatter linearises them, so the user never writes cinematographer prose by hand.
**Sources:** [repo](https://github.com/Lightricks/LTX-Video)

## 4. The gap we fill, feature by feature

Section 1 asserted the cell is empty. This section proves it one capability at a time. For each row: the closest thing that exists, what it actually does, the precise point at which it breaks, and the mechanism that replaces it.

### 4.1 Pillar 1 — Unified Modal

| | |
|---|---|
| **Closest existing** | Lexica's `q` parameter (text *or* an image URL, one endpoint) · Eagle's three coexisting search endpoints · Cinekive's single desktop surface |
| **What it does** | Lexica proves one query surface can accept two modalities. Eagle proves tag, full-text and semantic search can coexist behind one UI without the user choosing an engine. |
| **Where it breaks** | Lexica's two modalities are *alternatives*, not a persistent state — nothing accumulates. Eagle has no notion of an in-progress composition at all. Every other product in the survey has a page, tab or node per input type: clip-interrogator-ext is a tab; MultiModal-Prompt-Nodes splits image editing and video into separate nodes; Pexels splits photos and videos across API surfaces; drape-ai splits Character Studio from Garment Studio. Switching surfaces discards context, which is exactly what makes S1 ("composition of A, outfit of B") impossible to *perform* even where it is imaginable. |
| **What we do** | One `ExplorerState` with four `mode` values and a `query` object that holds **all four mode payloads simultaneously** (`text`, `image`, `video`, `browse`, plus shared `filters` and `expansion`). Going text → image → text restores the typed text untouched because it was never discarded. INV-EXP-1 makes this a hard invariant: a mode switch never resets `intent`, `pinned_reference_ids`, `mix`, `difference` or `filters`; it may reset `results` and the active panel, and nothing else. `open` is `true` unless a user explicitly dismisses the modal. |

### 4.2 Pillar 2 — Visual Intent

| | |
|---|---|
| **Closest existing** | WD14 taggers (structured `(tag, probability, category-id)` output) · ComfyUI-PromptJSON (a nested schema shape) · JoyCaption (per-attribute analysis requests) |
| **What it does** | WD14 genuinely emits typed, scored, closed-vocabulary output. PromptJSON has a schema with `scene`, `subjects`, `style`, `camera`. JoyCaption asks a model for exactly our categories. |
| **Where it breaks** | WD14's structure is one flat namespace for one image with a three-way category id, and every consumer flattens it to a string at the last step. PromptJSON's schema is something the user *types into*, populated from nothing, emitted as strings for another model. JoyCaption computes the categories and dissolves them into a paragraph. **In all three, the structure is a means to a string.** |
| **What we do** | `VisualIntent` is the *destination*, not a waypoint: exactly 20 keys, all required, `additionalProperties: false`, so every consumer can index any category without a null check. Its array elements are `IntentChip` **objects**, not bare strings, and that decision is load-bearing — a string cannot carry `ref_id` (so "remove everything B gave me" becomes unimplementable), cannot carry per-chip `confidence`, `locked` or `alternatives` (so an AI proposal cannot be selectively accepted), and cannot carry `evidence.t_start_s` (so video provenance vanishes). The same schema is produced whether the input was typed, uploaded, analysed or clicked, and `normalizeVisualIntent` is total and idempotent so an unknown value becomes a `custom: true` chip rather than an error. |

### 4.3 Pillar 3 — Reference Decomposition

| | |
|---|---|
| **Closest existing** | ShotDeck (30+ hand-tagged categories per still) · Fashionpedia (294 attributes with supercategories) · AVE (11 typed keys per shot) · Cinekive (craft-graph chips) |
| **What it does** | These are real, professional, category-complete decompositions. ShotDeck's vocabulary tracks ours closely; AVE proves at 196K shots that shot size and shot type are different fields. |
| **Where it breaks** | Every one of them decomposes **for retrieval or for scoring**, never for *transfer*. ShotDeck's tags let you find a frame and stop. AVE's tags train an editing model. Fashionpedia's attributes evaluate a segmentation network. Cinekive's chips filter a library and pin to a moodboard. **None of them attaches provenance to the attribute**, so an attribute cannot be moved: a ShotDeck tag says "this frame is low angle", not "this value came from this reference with this confidence and can be inherited". |
| **What we do** | A `Reference` carries `visual_attributes` (bare taxonomy ids, exactly the brief's shape, so the interop contract stays minimal) plus an `attribute_meta` sidecar with per-attribute `confidence`, `source`, `evidence` and `verified_by_user`. Decomposition is inseparable from provenance: `applyMix` reads `attribute_meta[id].confidence` (default 0.7) and stamps every produced chip with `source: "reference"` and `ref_id`. The eight EXTRACT groups cover 17 of 20 categories; `subject`, `appearance` and `action` are deliberately excluded, because EXTRACT takes *how it looks*, not *who is in it*. |

### 4.4 Pillar 4 — Selective Inheritance

| | |
|---|---|
| **Closest existing** | Midjourney `--sref` + `--oref` (two channels) · IDM-VTON / OOTDiffusion / CatVTON (garment only) · OpenAI reference-by-index-and-description |
| **What it does** | Midjourney splits a reference into look and subject. Try-on models transfer exactly one category with high fidelity. OpenAI lets you say which image plays which role. |
| **Where it breaks** | Two categories is not decomposition, it is a compromise — and both channels are opaque, uneditable, non-portable and statistically leaky. Try-on inherits one hard-coded category and outputs pixels rather than structure, so nothing composes onward. OpenAI's roles are free text in a black box: unverifiable, non-deterministic, silently different per model version. |
| **What we do** | `MixEntry` is an **edge object** — the Are.na insight, formalised: `{reference_id, use[], weight, priority, pinned, exclude[], only[], role, note}`. `use` names categories (or `"*"`), `only` is an allow-list applied *before* `exclude`, so "take this outfit but NOT the hat" is one field, not a prompt sentence. The reference itself stays global and immutable, so the same reference can donate `lighting` in one recipe and `clothing` in another with no duplication. The brief's interop minimum — `{"references":[{"reference_id":"img_A","use":["composition","camera_angle"]}]}` — validates verbatim (INV-MIX-0), because the simplest expression of the pillar must remain the simplest thing to write. |

### 4.5 Pillar 5 — Reference Mixing and conflict surfacing

| | |
|---|---|
| **Closest existing** | Comfyroll "Prompt Mix" · PromptChain `Combine` · Krea multi-reference weights · drape-ai's single multi-reference call · MultiModal's three-image input |
| **What it does** | All of them accept several sources and produce one output. Krea even offers per-image weights, including negative ones. drape-ai composes in a single call *specifically* to avoid the drift that chained passes cause. |
| **Where it breaks** | **Not one of them can detect that two sources disagree**, because by the time the sources meet there is no category structure left to compare. Comfyroll blends tensors. PromptChain concatenates strings. Krea blends latents. drape-ai writes an English instruction and hopes. Silent merging is the universal behaviour, and it is a correctness failure, not a UI omission: if reference A says low angle and reference B says high angle, *some* answer comes out and the user is never told a choice was made on their behalf. |
| **What we do** | Conflicts are a first-class object. `applyMix` detects three kinds — `arity` (two distinct non-modifier values in a single-dominant category from two references), `exclusivity_group` (two values sharing a non-null group in a multi category), and `explicit` (a `conflicts_with` edge, which may cross categories) — and records each as a `Conflict` with a **deterministic** `cfl_` id derived from the category, group and sorted values, so a resolution survives recomputation. `auto_resolve` defaults to `false`; `on_unresolved` defaults to `"block"`, meaning a category with an open conflict is *not emitted* by `buildStructuredPrompt` and is reported in `blocked[]` as an unresolved **decision**, never as an error and never as a silent omission. Nothing is deleted and nothing is auto-picked. `dominance` is consulted first, which is how "which should be dominant?" is remembered instead of re-asked on every edit. |

### 4.6 Search by Difference

| | |
|---|---|
| **Closest existing** | Fashion-IQ relative captions · DeepFashion consumer-to-shop pairing · Krea negative reference weights |
| **What it does** | Fashion-IQ proves users express visual intent as a *delta* and collects 18K human-written deltas to prove it. Krea ships "less like this one" as a whole-image control. |
| **Where it breaks** | Fashion-IQ's delta is an unstructured English sentence over a single domain (garments), so executing it requires NL parsing and it cannot span categories. Krea's negative weight applies to a whole image, so "keep this lighting, actively avoid that palette" is inexpressible. Nothing in the survey ships **category-scoped** difference. |
| **What we do** | `difference` is structured: `keep[]` and `change[]` are category lists (disjoint by INV-EXP-5, code-enforced because JSON Schema cannot express it), `change_targets` supports *directed* change ("change clothing TO streetwear", not merely "not this outfit"), and `strictness` (default 0.8) decides whether sibling taxonomy nodes count as a KEEP match. KEEP becomes hard structured filters pinned to the anchor's values; CHANGE becomes negative filters plus a diversity boost; unlisted categories stay free. **It works with AI off**, because the structured half of the query is a metadata match over `visual_attributes` and needs no model at all. |

### 4.7 AI as an option, not a dependency

| | |
|---|---|
| **Closest existing** | Eagle (tag / full-text / semantic as three endpoints) · Cinekive (local-first, optional VLM) · Hydrus (never phones home) |
| **What it does** | Eagle and Cinekive both ship an AI-optional product today. That is the existence proof that our requirement is buildable rather than aspirational. |
| **Where it breaks** | Everywhere else, AI is the product: tandpfun/wardrobe disables its importer without an API key; KikoTools' analysis *is* one cloud vendor; drape-ai chains named commercial generators; LM Studio-style onboarding asks for a multi-gigabyte download before anything works; img2prompt sites meter the core loop behind credits and signup. |
| **What we do** | INV-AI-1 makes AI-off a *complete* product: browse cards, manual selection, keyword search over labels, aliases, related-hops and descriptions, metadata search, mixing and the prompt composer all work with no model, and `ranking.mode` falls back to `metadata_only` / `keyword_only`. Query expansion stays available with AI off, because alias and `related[]` hops need no model. INV-AI-2 keeps every backend an opaque adapter id resolved at runtime, so brief question 7 — "can the model be swapped later?" — is answered by construction rather than by refactor. |

### 4.8 Licence separation and provenance

| | |
|---|---|
| **Closest existing** | Cinekive rights badges · Openverse per-item licence codes · Commons `AttributionRequired` |
| **What it does** | Openverse and Commons both provide genuine per-item licence metadata; Commons goes further and states the *obligation* explicitly. |
| **Where it breaks** | **No product in C1, C2 or C3 stores per-asset licence provenance at all.** Eagle, Hydrus and Diffusion Toolkit are local libraries with no licence field. Lexica, PromptHero, OpenArt and Civitai host unlicensed user output. ShotDeck and Film-Grab are built on third-party film copyright. Meanwhile the ML side conflates three separate licences routinely — permissive code over research-gated data (mmfashion), permissive repo over NC weights (LTX-Video's OpenRAIL-M, jina-clip-v2's NC), permissive wrapper over all-rights-reserved payload (ai-shortfilm-prompts). |
| **What we do** | Three columns, never merged: **reference media licence** (`Reference.metadata.license` from the `LICENSE_ID` enum, gated by `status` and INV-LIC-1/2/3), **model licence** (recorded per adapter, weights separate from code), and **our code licence** (MIT, with the dependency policy in [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md)). `VisualRecipe.license_summary` describes the reference media only and says nothing about the licence of the code or of generated output. Attribution is stored **text**, never a computed link, so a dead URL never erases credit. |

### 4.9 The brief's nine questions, answered against the survey

| # | Question | Answer, with the evidence from this survey |
|---|---|---|
| 1 | Why is this different from an existing prompt builder? | Sixteen prompt builders were examined. Every one turns *options* into a string; none has a reference object, none is ever populated from media, none can express partial contribution. §3.1 is the register. |
| 2 | Why must image search and prompt building live in ONE UI? | Because S1 and S2 require holding several partial references and an in-progress intent simultaneously. Every surveyed tool that splits them (a tab, a node, a studio, a separate API) discards that state on the switch. §4.1. |
| 3 | What are the minimum VisualIntent fields? | The brief's 20. C4 independently justifies the three most contested splits: `camera_distance` ≠ `framing` (AVE, ShotBench), `camera_angle` ⊥ camera level (CineScale2), `camera_motion` ≠ `motion` (magcil, Hailuo, CameraBench). |
| 4 | What data structure lets you take only SOME attributes? | `MixEntry` as an edge object carrying `use` / `only` / `exclude`. Are.na's connection metadata is the only prior art for edge-carried role metadata, and it carries no taxonomy. §4.4. |
| 5 | How are conflicts handled? | Detected, never resolved. Nothing in the 106 surveyed entries can even *detect* one. §4.5. |
| 6 | Does the product work with no AI at all? | Yes, and Eagle plus Cinekive prove it is buildable. §4.7. |
| 7 | Can the AI model be swapped later? | Yes: four independent runtimes converge on one OpenAI-compatible surface, and OpenCLIP shows a runtime-enumerable registry is the right descriptor shape. §3.5.4. |
| 8 | Is reference licensing separated from code licensing? | Yes, into three columns, because the survey supplied four distinct real-world traps that a two-column model would have failed. §4.8, §7. |
| 9 | Can the web MVP be reused inside ComfyUI? | Yes: Okims and kiko both ship node-as-launcher-for-a-web-UI today, and USearch shows one index format can serve browser and Node. The node's four outputs are the same objects the web app already produces. |

---

## 5. UX patterns we must avoid

Each is a real observed behaviour, attributed, followed by the rule it generates. These are prohibitions, not preferences.

| # | Anti-pattern | Where observed | The rule it generates |
|---|---|---|---|
| 1 | **The dropdown wall** — a taxonomy presented as a list of words with no pictures | Prompt Vault (9 widgets over 100+ components), Comfyroll (150+ nodes), WildPromptor (one node per folder), ComfyUI-AdvancedCameraPrompts (9 × 8), xoxxel (40+ terms) | Never render a category as a bare `<select>`. Every category cell shows an exemplar; `TaxonomyNode.visual_hint` is populated before a node ships in the picker |
| 2 | **Text completion as the discovery mechanism** | Custom-Scripts autocomplete | Discovery is browse-first; typing is an expert accelerator, never the entry point. Offering `low angle` after `low a` fails the user who has never heard the phrase |
| 3 | **No visual feedback on the effect of a choice** | The whole of C1: selecting a value changes only a string in a box | Every selection is immediately visible as a chip carrying the exemplar it came from, and chips are clickable in both directions — filter and EXPLORE seed (Cinekive's craft graph, done right) |
| 4 | **All-or-nothing analysis** | KikoTools' Gemini node, MultiModal's Qwen nodes, every img2prompt site | Any analysis surface renders **per-category** results the user accepts or discards individually. A chip is the unit of acceptance, not a paragraph |
| 5 | **Silent merging of multiple sources** | Comfyroll "Prompt Mix", PromptChain `Combine`, MultiModal's 3-image input, Krea, Midjourney, every try-on pipeline | Conflicts are detected and shown; the user picks the dominant reference. `auto_resolve: false` and `on_unresolved: "block"` are the defaults, and `"highest_priority"` / `"drop"` are explicit opt-ins that MUST be visibly indicated |
| 6 | **The one-way blob** — upload, wait, copy a string, leave | img2prompt sites, clip-interrogator, Lexica, OpenArt | Nothing terminal. A result is a `Reference` you can search from, extract from, mix and save |
| 7 | **The comma-join at the last step** | CLIP Interrogator's `"caption, medium artist, trending, movement, flaves"`, WD14's tag dump | Categories may disappear only inside `formatPrompt`, never in `visual_intent` or `structured_prompt`, and every `PromptFragment` retains `source_category`, `value` and `ref_id` so the user can delete exactly one contribution of one reference |
| 8 | **Caption-length ladders as a feature** | Florence-2's three caption sizes | Verbosity is not structure. A longer blob is still a blob |
| 9 | **Opaque tokens the user cannot read or edit** | `--sref 3847291`, any latent style code | Never surface an attribute the user cannot see, explain, edit and carry elsewhere |
| 10 | **Two-slot "content vs style" presented as decomposition** | Midjourney, Krea | Do not ship a content/style toggle as if it were the feature. Twenty categories, or it is a compromise |
| 11 | **A single unlabelled strength slider** | Common; Midjourney at least documents `--sw` 0–1000 default 100 | Every weight names its range, its default and its effect. `MixEntry.weight` is 0..1 default 1 and is documented as a soft emphasis hint that **never** auto-resolves a conflict |
| 12 | **Unlabeled numeric axis sliders as the primary control** | Kling's six −10…10 knobs, whose axis convention is itself ambiguous | Expose a named move plus an intensity; the raw vector is a formatter output, never an input affordance |
| 13 | **Asserting inferred physical facts** | ComfyUI-AdvancedCameraPrompts emitting `"focal_length": 35`; JoyCaption instructing the model to state aperture, shutter speed and ISO; ai-shortfilm-prompts recommending brand lens nomenclature | `lens.35mm_like` → "35mm-like perspective", enforced in three schema places, with every lens fragment `hedged: true`. Never assert optics, EXIF or brands we cannot know |
| 14 | **Negative camera phrasing** | Runway explicitly discourages "the camera doesn't move" | `camera_motion.static` renders positively ("locked-off static shot"). The `constraints` slot is for genuine negations, not for describing absence |
| 15 | **Prose-encoded structure** | moondream's demo regexing bboxes out of a sentence; drape-ai's "Do not alter the model's face…" | Structured data never round-trips through prose inside our pipeline. If a backend can only emit text, the adapter parses once at the boundary and discards the prose |
| 16 | **A separate page or tab per modality** | clip-interrogator-ext, MultiModal (image vs video nodes), Pexels, drape-ai's studios, Openverse routing video to an external-links page | One modal, mode switch only, state persists, never closes mid-exploration |
| 17 | **Vendor-locked cold start** | tandpfun/wardrobe (no importer without a key), LM Studio-style "download 20 GB first", credit meters on img2prompt sites | v0.1 is fully usable with no key, no account and no model |
| 18 | **Undisclosed outbound calls and silent model downloads** | transformers.js hub fetches, both ComfyUI nodes auto-downloading unlicensed weights, Unsplash's mandatory download ping | Every transmission and every large download is disclosed before it happens, with a size, and recorded in `external_transmission.disclosed_at` |
| 19 | **Licence as a footnote, or absent** | No product in C1–C3 shows per-asset licence on the card | The licence badge is on the card, and a `license_review` reference is visually distinguishable from an `approved` one *before* the user invests effort in mixing it |
| 20 | **Silent result substitution when a filter empties the set** | Common across media APIs | Say *why* it is empty ("0 of 340 results are CC BY or freer") and offer the licence tier as an explicit lever — the same doctrine as conflicts: surface the decision, never make it silently |
| 21 | **Presentational facets** | PromptHero's "camera technique" as a search keyword | A facet that cannot be extracted, inherited or conflicted is decoration. Facets are typed fields over a controlled vocabulary or they do not ship |
| 22 | **Category ids that fuse independent axes** | DeepFashion2 folding sleeve length into the class name; MovieShots defining "push = zooms in" | Axes stay orthogonal. `clothing.*` keeps fit, material and length separable; `camera_motion.dolly_in` and `camera_motion.zoom_in` are distinct nodes |
| 23 | **Flat tag soup with no axis grouping** | A 294-attribute list with no supercategory | Group values by axis (`exclusivity_group`) or the mixer cannot reason about conflicts at all |
| 24 | **Provenance that exists only inside your own generation loop** | Workflow Studio and Prompt Manager reading PNG metadata | Provenance attaches to the reference at ingest, from the source API. A photograph that no generator ever touched must work perfectly |
| 25 | **Infinite scroll that loses selections; index rebuild on every change** | Gallery products; Voy's documented rebuild-on-update | The tray survives mode switches, searches and detail views (INV-EXP-4 guarantees mix members stay pinned), and approving a reference must never feel like a batch job |
| 26 | **A progress bar with no visible intermediate result** | Video analysis pipelines generally | Stream shot thumbnails as they are found and make each immediately clickable. "The app is working with me", not "the app is thinking" |
| 27 | **Uniform frame sampling across a multi-shot video** | The naive default everywhere | Segment first, then sample within segments; otherwise the temporal summary mixes unrelated shots into nonsense |
| 28 | **One-click genre template packs** | ai-shortfilm-prompts' 21 templates | Templates may exist as *starting references*, never as the product's main path. This is the degradation the brief forbids, wearing a friendly hat |

---

## 6. Patterns worth adopting

Each row states the source, exactly what we take, and **the licence implication of taking it**. The recurring answer is "an idea, not an artefact" — ideas are not copyrightable, and taking the idea while authoring our own implementation is what keeps our tree clean.

| # | Pattern | Source (licence) | What we adopt | Licence implication |
|---|---|---|---|---|
| 1 | **Edge-carried mix metadata** — role lives on the connection, not the reference | Are.na (proprietary platform; MIT client) | `MixEntry` as an edge object with `use`/`weight`/`priority`/`only`/`exclude`; reference stays global and immutable | **None.** A data-modelling idea, independently implemented. No Are.na code or data touched |
| 2 | **Dual output: structured + flattened from one call** | kiko-flux2 (MIT), ComfyUI-AdvancedCameraPrompts (MIT) | Node outputs `prompt`, `structured_prompt`, `visual_intent`, `reference_mix` | **None.** Shape of a contract, not code. No MIT notice obligation because nothing is copied |
| 3 | **A provenance output beside the prompt** | Prompt Vault's `prompt_dna` (MIT) | `reference_mix` as a machine-readable, stronger version | **None.** Idea only |
| 4 | **Analyse once, format many** | KikoTools (MIT), img2prompt sites (proprietary) | `formatPrompt(structured_prompt, mode)` over an open `FORMATTER_MODE` set | **None** |
| 5 | **Vocabulary as user-editable data files; UI generated from them** | WildPromptor (Apache-2.0), Workflow Studio (MIT), Custom-Scripts (MIT) | `data/taxonomy/*.json` additive with no code change | **None** for the pattern. **Do not** ingest any of their bundled data |
| 6 | **Pre-embedded controlled vocabulary + dot-product ranking** | CLIP Interrogator's `LabelTable` (MIT) | Embed our taxonomy once per category, rank per category, keep the label | **None** if reimplemented. **Never** copy the five label files |
| 7 | **Per-category confidence thresholds** | WD14 node's 0.35 / 0.85 split (MIT) | Strict gates for identity-like and factual categories, looser for descriptive ones; `lens` strictest | **None** — a numeric policy, recalibrated on our data |
| 8 | **Carry a category id beside every predicted label** | WD14 CSV column 2 | Analyzer adapters return `{category, value, confidence}`, never `{value, confidence}` | **None** |
| 9 | **Attribute checkboxes as the input affordance** | JoyCaption's extra options (Apache-2.0 repo) | The affordance, driving EXTRACT groups and KEEP/CHANGE — with fields, not sentences, as output | **None** for the affordance. **Do not** copy the option strings verbatim |
| 10 | **Ordered value ladders** | JoyCaption's shot-size ladder; CineScale's 9-step scale (**UNVERIFIED** licence) | `TaxonomyNode.sort_order` on `camera_distance` and `camera_angle`, enabling "one step wider" as an operation | Ladder *structure* is an idea; **do not** vendor CineScale data until its licence is verified |
| 11 | **Canonical id + source-scoped aliases + per-model surface form** | Forced by the MovieShots ⇄ CineScale ⇄ shot-type-classifier disagreement | `id` + `aliases[]` + `model_hints[mode]` on every node — the only way three corpora coexist | **None.** Alias tables are authored by us |
| 12 | **Attribute supercategory / axis grouping** | Fashionpedia (**UNVERIFIED** licence) | `exclusivity_group` as the conflict bucket, with `null` meaning "modifier, never conflicts" | Structure only. **Do not** copy the 294-attribute list |
| 13 | **Reference-frame-qualified camera motion** | CameraBench (CC BY 4.0) | Keep `tracking` distinct from `dolly` as an object-referenced follow, not a sibling primitive | Idea only; **do not** vendor its taxonomy JSON (attribution would attach) |
| 14 | **Label-then-caption with explicit abstention** | CameraBench (CC BY 4.0) | Populate only confident chips; an absent chip beats a wrong one; `confidence` is always present | **None** |
| 15 | **Two-headed output → hard label plus soft score** | TransNetV2 (MIT) | Per-chip `confidence` alongside the value | **None** |
| 16 | **Downscale-first analysis** | PySceneDetect `DEFAULT_MIN_WIDTH = 256` (BSD-3), TransNetV2's 27×48 input (MIT) | Decode into a small offscreen canvas; never touch full-resolution pixels for motion math | **None** if reimplemented; a shipped PySceneDetect dependency would need a BSD-3 notice |
| 17 | **Absolute score AND ratio-to-neighbourhood for cut detection** | PySceneDetect `AdaptiveDetector` (BSD-3), FFmpeg's `min(mafd, diff)` (LGPL) | A cut is a local outlier, not merely a big number — this is what stops a whip pan reading as a cut | Implement from the described algorithm. **Do not** transliterate either source |
| 18 | **Sync samples as free shot candidates** | mp4box.js sample table (BSD-3), FFmpeg's `key` variable | Read keyframe timestamps before decoding a pixel | mp4box.js as a *dependency* is fine; BSD-3 notice required in THIRD_PARTY_NOTICES |
| 19 | **Shot segmentation before attribute extraction** | PySceneDetect, CameraBench | detect shots → per-shot intent → aggregate; `shot_boundaries` and `evidence.shot_index` exist for this | **None** |
| 20 | **Geometry for what geometry knows; semantics for the rest** | CameraBench's SfM-vs-VLM finding (CC BY 4.0) | Compute pan/tilt/roll/static geometrically (AI-free), reserve tracking/orbit/handheld for the semantic pass | Idea only |
| 21 | **One OpenAI-compatible adapter for four runtimes** | llama.cpp (MIT), Ollama (MIT), LM Studio (MIT CLI), vLLM (Apache-2.0), MLX-VLM (MIT) | Implement `/v1/chat/completions` with data-URI image parts once; ship base-URL presets | **None** — HTTP consumption is not derivation |
| 22 | **Three adapters, one base URL** | MLX-VLM (MIT) serving chat + embeddings + rerank | Analyzer, embedding and reranker adapters share one connection config | **None** |
| 23 | **Model discovery instead of model names** | Ollama's `/v1/models` (MIT), OpenCLIP's `list_pretrained()` (MIT) | `listBackends()` descriptor with a `license` field, so the UI badges an NC model like an NC image | **None** for the pattern; the descriptor is our own |
| 24 | **Backend choice is a widget, not a build flag** | MultiModal-Prompt-Nodes (GPL-3.0), picobyte tagger | Adapter selection in settings, never in source | **None** — pattern only; **no code** from a GPL source |
| 25 | **Matryoshka storage tiers + quantized vectors** | jina-clip-v2 (**NC**), Qwen3-VL-Embedding (Apache-2.0), USearch (Apache-2.0) | Short int8 prefix for the browser index, full vector for desktop; one embedding pass, two tiers | **None** for the technique. **Never bundle NC weights** |
| 26 | **Vector + metadata in one row; licence as a `WHERE` clause** | sqlite-vec (Apache-2.0 OR MIT) | `status != 'approved'` makes a reference unreachable by the retriever *by construction* | Dependency; permissive, notice required if shipped |
| 27 | **Index compatibility header** | hnswlib-wasm IDBFS pattern (Apache-2.0), clip-retrieval (MIT) | Persist `{embeddingBackendId, dims, quantization, indexVersion}` so a backend swap invalidates rather than corrupts; mirrors our model-keyed `EmbeddingRecord` | **None** |
| 28 | **Single modality-tagged vector space** | LanguageBind (MIT code) | One vector table with a media-type column, not separate image and video indexes | **None.** **Never** touch its NC dataset |
| 29 | **Brute force as the honest baseline** | Our reading of the ANN cluster | Cosine scan behind the search interface; ANN is an optional acceleration | **None** |
| 30 | **Three coexisting retrieval modes behind one UI** | Eagle (proprietary) | `metadata-search` / `semantic-search` / `fusion-ranker` as separate modules with graceful degradation | **None** — the *pattern*; do not reimplement Eagle's API surface |
| 31 | **Semantic + structured metadata fusion** | Cinekive (MIT), Marqo-FashionCLIP (Apache-2.0 code) | Configurable ~60/40 fusion with structured match as a first-class signal | **None** |
| 32 | **Weighted multi-part query object** | Marqo (Apache-2.0) | The semantic side of a mix is a list of weighted typed parts, never a concatenated sentence | **None** |
| 33 | **Instruction-conditioned queries** | Qwen3-VL-Embedding (Apache-2.0 repo) | Render KEEP into the instruction; adapters lacking support ignore the field | **None** |
| 34 | **Per-provider licence mapping tables as data** | Flickr's numeric ids, Commons' `LicenseShortName`, Openverse codes, Europeana rights URIs | One normalisation function plus one declarative map per provider in `license-guard.js` | **None** — the maps are authored by us from published tables |
| 35 | **Explicit obligation flags, fail-closed** | Commons `AttributionRequired` (GPL software, but the *field* is data), Unsplash's obligation set | `requires_attribution` and `share_alike` as derived caches recomputed on load, defaulting to required when a source is silent | **None** |
| 36 | **Asset-level, not record-level, licensing** | Smithsonian `usage.access`, the Met's `isPublicDomain`, NYPL's metadata/item split | Bind `license` to the exact media asset displayed | **None** |
| 37 | **Server-rendered derivatives instead of stored bytes** | Commons `iiurlwidth`, Openverse `/thumb/`, Pexels' `src` ladder, IIIF templates | `thumbnail_url` is a derived URL; INV-REF-2 forbids binaries outright | **None** |
| 38 | **Liveness filtering before approval** | Openverse `filter_dead` | HEAD-check in `source_validation`; `media_state` ∈ `ok`/`moved`/`gone` with the record always kept | **None** |
| 39 | **A three-valued reusability ladder** | Europeana `open`/`restricted`/`permission` (EUPL client) | Mapped onto `approved` / `license_review` / `rejected`, so restricted content is explained rather than invisible | **None** — mapping only; do not vendor the EUPL client |
| 40 | **Metadata-and-hyperlinks-only distribution** | CineTechBench (**CC BY-NC-ND**), Fashion-IQ (**UNVERIFIED CDLA**) | Confirms our no-binaries rule is standard practice | **None** — we adopt the *discipline*, and import none of their data |
| 41 | **Per-mode formatter capability record** | ai-shortfilm-prompts' model notes, LTX's 200-word cap, Hailuo's 3-move cap | Word budget, slot ordering, negative support, max simultaneous camera moves, declared per mode with a documented drop order | **None** — facts about third-party models, authored as our own table |
| 42 | **Example image per vocabulary term** | xoxxel/camera-prompts (MIT text; images unlicensed) | `visual_hint` / `visual_hint_pool` populated only from `approved` references | Pattern only. **Never** reuse their example images |
| 43 | **Recipes, not prompts; and they round-trip** | Prompt Manager (GPL-3.0), drape-ai (MIT), Dynamic Prompts (MIT) | `VisualRecipe` saves the combination with frozen snapshots and a monotonic content `version` | **None** — no code from a GPL source; concept only |
| 44 | **Fill-in-the-blank completion per category** | Polyvore / outfit-transformer (Apache-2.0 / MIT) | An empty category offers ranked candidate references that would fill *that* category, consistent with what is already inherited | **None**. **Never** touch the scraped image payload |
| 45 | **Identity anchor plus varying donors** | wardrobe's locked model image, drape-ai's pinned character, Midjourney `--oref` | The `dominance` map as the durable answer to "which reference wins this category" | **None** |
| 46 | **Category-scoped negative reference** | Extends Krea's whole-image negative weight | "Keep this lighting, actively avoid that palette" — adjacent to `difference.change_targets` and, as far as this survey found, **unclaimed territory** | **None** — an extension, not a copy |
| 47 | **Compile our mix down to a competitor's interface** | OpenAI's reference-by-index-and-description | A future formatter mode rendering "image 1 for lighting, image 2 for wardrobe" as graceful degradation | **None** |
| 48 | **Separator hygiene as a real feature** | Custom-Scripts' `tidy_tags` (MIT) | The formatter owns punctuation and joining; getting it right beats another dropdown | **None** |
| 49 | **Pin taxonomy version to analyzer version** | DeepDanbooru shipping its tag list with the model (MIT) | Taxonomy `version` recorded in `integrity.taxonomy_version`; `analyzer_version` on the reference; `Evidence.detector` is an adapter instance id | **None** |
| 50 | **The node as a two-button launcher for a real web UI** | Okims (**no licence**), kiko (MIT) | Build the web MVP well; wrap it thinly later | **None** — a delivery pattern; no code from an unlicensed repo |

---
## 7. Legal and ethical boundaries

The brief's hard prohibitions are not abstract; every one of them has a concrete tempting violation in this survey. This section names the temptation next to the rule.

### 7.1 The five rules

1. **No wholesale copying of external repository code, regardless of licence.** This binds even where a licence would permit it (MIT, Apache-2.0, BSD). The rule exists because our value is the schema and the composition logic, and because a permissive licence still creates notice obligations we would rather not scatter through a small codebase. Where an algorithm is genuinely useful (PySceneDetect's adaptive-ratio test, FFmpeg's scene score, CLIP Interrogator's label-table ranking) we implement from the *described* algorithm and cite the source as prior art.
2. **No wholesale copying of prompt databases or vocabulary corpora.** `flavors.txt` (100,970 lines), Prompt Vault's `vault_data.py`, WildPromptor's artist lists, Fooocus-derived style JSON, danbooru tag dumps, community wildcard bundles, Fashionpedia's 294 attributes, CameraBench's taxonomy JSON. Our taxonomy is authored by us, with our own aliases, so it carries no upstream attribution chain and no aesthetic bias inherited from someone else's corpus.
3. **No scraping.** Pinterest, Instagram and TikTok are named in the brief; the survey adds Civitai (ToS prohibits spiders, robots, crawlers and data-mining tools outside its provided interfaces), Lexica, PromptHero, OpenArt, ShotDeck and Film-Grab. The rule is not merely contractual: none of these sources carries per-asset licence metadata, so even a *permitted* import would fail `license_check` and could never reach `approved`. A scraper for any of them is doubly pointless.
4. **No bulk storage of unknown-licence media, and no media binaries in the repository at all.** We store `source_url`, `media_url`, `thumbnail_url`, metadata, embeddings and visual attributes. INV-REF-2 enforces this at the schema level by declaring `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` invalid. CineTechBench and Fashion-IQ independently confirm that metadata-and-hyperlinks-only is standard practice for serious research groups.
5. **No AI-model-dependent architecture and no hardcoded model names.** Every backend is an opaque adapter id resolved at runtime, and the product is complete with all of them absent.

### 7.2 The dataset licence traps, named

| Trap | Concrete instance | Why an automated check would fail | Our handling |
|---|---|---|---|
| **Permissive code over research-gated data** | mmfashion (Apache-2.0) requires DeepFashion and Polyvore | The repo scan says "Apache-2.0, safe" | Usable stack = code licence **and** data licence. Recorded as blocked in THIRD_PARTY_REVIEW |
| **Permissive repo over restricted weights** | LTX-Video (Apache-2.0 repo, OpenRAIL-M weights); SigLIP 2 (Apache-2.0 software, checkpoints unlicensed); jina-clip-v2 (**NC** weights) | A repo badge is not a weights licence | Weights licence is a separate recorded column; NC weights are never bundled or defaulted |
| **Permissive wrapper over all-rights-reserved payload** | ai-shortfilm-prompts (MIT skill, © Mx-Shell prompts) | "MIT therefore safe" is wrong at the top level | Read what the licence actually covers, not what the repo is labelled |
| **No licence at all, high popularity** | Comfyroll (1,308 stars), PromptJSON, Okims, ShotBench, AVE, SW-CV-ModelZoo, DeepFashion2, civitai-image-scraper | The GitHub API simply returns no licence field, which tooling often renders as blank rather than as "denied" | Absence = all rights reserved. Prior-art reading only, and it is stated in writing |
| **Platform label contradicts the file** | MultiModal-Prompt-Nodes (label NOASSERTION, file GPL-3.0); CameraBench (label NOASSERTION, file CC BY 4.0); Hydrus (label NOASSERTION, file WTFPL v3) | A label-based check reads "unknown" or, worse, "permissive" | **The file wins.** Always |
| **Non-SPDX, self-authored grant** | picobyte's "Public domain, except borrowed parts" | No SPDX identifier to match against | Fails `license_check`; reference reading only |
| **Downloadability treated as permission** | DeepFashion2 (form + unzip password), Polyvore (dead URLs, unofficial mirror), Dress Code ("will not be released to private companies") | The file downloads, therefore the check passes | "It downloaded" and "we may use it" are separate facts. This is the entire reason `Reference.status` is a four-value enum |
| **Metadata licence mistaken for media licence** | The Met ("Images are not included and are not part of the dataset"), NYPL (CC0 metadata, item may not be PD), Smithsonian (record-level vs `media.usage.access`) | The dataset is genuinely CC0 | Bind the licence to the exact asset displayed; keep metadata licensing separate |
| **"Free to use" marketed as public domain** | Pexels, Unsplash | Neither exposes a per-item licence field to check | Both map to `unknown` → excluded by default; if ever enabled, permanently badged and never presented beside CC BY results without distinction |
| **Institutional assertion mistaken for a grant** | Flickr id 7 "No known copyright restrictions"; id 8 "US Government Work" | An id in the licence table looks like a licence | Route to `license_review`, never auto-approve |

### 7.3 Ethical boundaries beyond licensing

- **Artist-name and brand tokens.** WildPromptor ships artist lists; Prompt Vault enumerates camera bodies and film stocks; ai-shortfilm-prompts recommends real lens nomenclature. We describe the *look* ("halation, tungsten-balanced, warm highlights"), never assert the brand or the living artist. This is the same epistemic discipline as the lens rule, applied to attribution and to people's livelihoods.
- **NSFW-by-default analyzers.** JoyCaption is explicitly uncensored. An analyzer whose default behaviour is incompatible with a licence-clean, family-of-sources reference pool is not a neutral component; the choice of default analyzer is a product decision with a safety dimension.
- **Privacy as a default, not a setting.** `external_transmission.allowed` defaults `false`; any transmission of user media must be disclosed in the UI *before* it happens; a reference marked `privacy.local_only` must be refused by every remote adapter. A local upload handle never implies bytes left the device.
- **Do not fabricate facts about a photograph.** No EXIF, no focal length, no camera body, no shutter speed inferred from pixels. The survey shows this is the industry default and it is a small dishonesty repeated a million times.
- **Do not launder provenance.** A recipe's `license_summary` describes reference media only. It says nothing about the licence of the generated output or of our code, and we must never imply otherwise.

---

## 8. Nearest-analogue honesty: commercial style references

It would be easy — and wrong — to claim nothing like this exists. Something *does*: Midjourney's `--sref` / `--oref` split, Krea's weighted multi-reference style transfer, and the reference-image conditioning in modern hosted image models. This section states as precisely as possible what they achieve and why category-decomposed, editable, provenance-tracked mixing is still a different thing rather than a nicer version of the same thing.

### 8.1 What they genuinely achieve

Give them full credit:

- **They conceded the premise.** Midjourney split a reference into two channels because a single reference contributing everything is too blunt. That is the same observation our product is built on.
- **They shipped weights with documented ranges.** `--sw` 0–1000 default 100, `--ow` 1–1000 default 100, with guidance that 25–50 permits stylization and 400+ enforces adherence. That is more honest instrumentation than most of the open ecosystem offers.
- **They handle multiple references at once**, including inline per-reference weighting, and Krea reportedly supports negative weights.
- **They work.** The output quality of a good `--sref` is beyond anything a text prompt reaches, and pretending otherwise would be dishonest.
- **They concede that role assignment matters.** OpenAI's convention of referencing each input image by index and description is an admission that the model must be *told* what each reference is for.

### 8.2 The five differences, precisely

```
  MIDJOURNEY --sref / --oref                     OURS
  ─────────────────────────                      ────
  image ──► [ latent style code 3847291 ]        image ──► composition.rule_of_thirds   (conf .81, ref img_A)
                     │                                  ├─► lighting.rim_lighting          (conf .74, ref img_A)
                     │  opaque, 1 slot                  ├─► camera_angle.low_angle      (conf .90, ref img_A)
                     ▼                                  └─► clothing.hoodie             (conf .66, ref img_A)
              generation, now                                        │
                                                                     ▼  editable, addressable, portable
                                                        StructuredPrompt ──► any formatter mode
```

1. **Readability.** `3847291` cannot be decomposed into "warm colour temperature + chiaroscuro + analog grain". It is a pointer into a private latent space. Ours is a list of taxonomy ids with human labels, descriptions and exemplar images. The user *learns* the vocabulary by using the tool — which is the brief's north star, "I don't know what Low Angle means, let me choose it visually", and an opaque code cannot serve it in principle.
2. **Granularity.** Two channels versus twenty categories. You cannot take the *lighting* from one `--sref` and the *colour* from another, because they are bundled in one blob. Our `use: ["lighting"]` is one field. And crucially, `camera_motion` exists for us at all: "same movement as this video, but the camera work of that video" needs two *video* references contributing two *different* categories, which is not merely hard in a two-slot model — it is unrepresentable.
3. **Editability.** There is no intermediate the user can inspect or correct. Ours is a document: every chip carries `confidence`, `locked`, `alternatives` and `ref_id`; a wrong `camera_angle` proposal is fixed in one click; a `locked: true` chip is immovable by any subsequent mix or re-analysis. "AI output is a proposal, never a commitment" is meaningless without an artefact to edit.
4. **Conflict handling.** Reference channels blend statistically, and community documentation repeatedly notes costumes, props and accessories leaking through the "style-only" channel — i.e. the separation is statistical rather than structural. When two of our references disagree inside one category, `applyMix` raises a `Conflict` with both candidates, their references, confidences and thumbnails, and the prompt for that slot is **blocked** until a human chooses. The system never silently picks, and the resolution is stored so it is not re-asked.
5. **Portability and durability.** An sref code is bound to one vendor's model version. Our mix is a document that renders into any formatter mode, survives as a `VisualRecipe` with frozen `ReferenceSnapshot`s, carries full attribution, and re-derives its prompt on open rather than trusting a cached string. Even with 100% dead media URLs the recipe still produces the same prompt, because intent, mix, conflict resolutions and taxonomy ids are pixel-free — media loss degrades the *card*, never the *recipe*.

### 8.3 The honest counter-argument, and the answer

**The counter-argument.** "Users do not want twenty categories. They want to drop three pictures and get a good result. Your structure is a tax; `--sref` wins because it hides everything."

**The answer, in three parts.**

*First, the two are not exclusive.* `use: ["*"]` — USE everything — is one click and is the whole-blob experience. Structure is available when the user needs it and invisible when they do not. The failure mode we refuse is the *inverse*: a product where structure is unavailable at any price.

*Second, the tax is paid at the moment of disagreement.* A two-slot blend is pleasant until you want the outfit from one picture and the framing from another, at which point a blob-based tool offers you nothing but re-rolling the seed. That is exactly the moment our users are in — the brief's six success cases are all that moment.

*Third, opacity has a compounding cost.* An sref code teaches you nothing, transfers nowhere, and expires with the model version. A taxonomy id teaches the user a real word, works in any generator through a formatter, and survives a model change. Over a working month, the difference between "the tool made a picture" and "the tool made a picture *and* I now know what a medium long shot is" is the difference between a toy and a craft tool.

**Where they will beat us, and we should say so.** Latent style transfer captures ineffable qualities that no finite vocabulary names — a particular grain, a particular colour response, the residue of a specific film emulsion. Our taxonomy will approximate those and sometimes miss. The mitigation is designed in, not bolted on: `custom: true` chips accept free text outside the taxonomy for exactly the values our vocabulary cannot name, and the compact export profile is explicitly documented as dropping custom chips **with a warning** rather than silently. We are honest that a structured representation is lossy at the edges; we are equally honest that a latent code is lossy at the *centre*, where it loses everything the user could otherwise have controlled.

---

## 9. What would falsify this analysis

A competitive analysis that cannot be wrong is marketing. These are the specific observations that would force a revision, and the response each would require.

| Observation that would falsify a claim | Which claim it breaks | Required response |
|---|---|---|
| A shipping product exposes **more than two** independently selectable reference channels with named, human-readable categories | §1.4 "the cell is empty" | Re-open §8; compete on editability, provenance and portability rather than on granularity |
| A vendor exposes an **editable intermediate** the user can inspect and correct before generation | Pillar 2's uniqueness | Compete on cross-vendor portability and on the AI-off path |
| Any product surfaces a **conflict between two references** and asks which dominates | Pillar 5's uniqueness | Compete on the taxonomy depth and on the recipe/provenance layer |
| A permissively licensed, browser-runnable multimodal embedder appears | Our assumption that local semantic search is the hard part | Accelerate the v0.3 milestone; revisit the jina-clip-v2 exclusion |
| Openverse or another CC provider adds a **video** endpoint | "Commons is our only CC video source" | Add a provider; broaden the video corpus beyond user uploads |
| A camera-motion extractor separates dolly from zoom reliably and cheaply | The "irreducible ambiguity" claim in §3.5.3 | Raise the confidence on that family and reduce the number of surfaced alternatives |
| Someone publishes a per-attribute **confidence** alongside extracted visual attributes in a shipping product | Our implicit novelty claim for per-value confidence | Drop the novelty framing; keep the architectural argument, which does not depend on it |

Our reading is that the first three are unlikely to change soon, because they are not feature gaps — they are consequences of an architecture in which category structure is destroyed before the mixing step. A vendor would have to rebuild from the intermediate representation outward, which is precisely the thing this product is.

---

## 10. Obligations this document places on siblings

Claims made here must hold elsewhere. Each row is a cross-document contract.

| # | Claim made here | Document that must agree |
|---|---|---|
| 1 | Every surveyed project was reviewed as prior art only, and **no code from any of them exists in our tree** — with the no-licence repositories (Comfyroll, PromptJSON, Okims, ShotBench, AVE, SW-CV-ModelZoo, DeepFashion2, civitai-image-scraper) named explicitly | [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md), [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) |
| 2 | Allowed-by-default licences are `public_domain`, `pdm`, `cc0`, `cc_by`, `user_owned`; optional `cc_by_sa`; excluded `cc_by_nc`, `cc_by_nc_sa`, `cc_by_nd`, `cc_by_nc_nd`, `proprietary`, `unknown`; and `license_type=commercial` is **not** an acceptable Openverse proxy | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| 3 | Flickr ids 7 and 8 route to `license_review`, never `approved`; Pexels and Unsplash map to `unknown` | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| 4 | Model **weights** licences are recorded separately from model **code** licences, and a platform label never overrides a licence file | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) |
| 5 | Search and the prompt composer never import each other; no module imports a concrete AI backend; the analyzer/embedding/reranker adapters share one connection config shape | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| 6 | Retrieval is hybrid semantic + structured with a configurable ~60/40 fusion and an optional reranker; keyword search scores over `label`, `aliases`, `description` and one `related[]` hop; KEEP and CHANGE are disjoint | [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) |
| 7 | v0.1 is complete with **no AI and no account**; video analysis and camera-motion extraction arrive later; Search by Difference later still | [`ROADMAP.md`](./ROADMAP.md) |
| 8 | The ComfyUI node emits `prompt`, `structured_prompt`, `visual_intent`, `reference_mix`, reusing the same core modules as the web app | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ROADMAP.md`](./ROADMAP.md) |
| 9 | Every field, enum value and invariant referenced here is defined there; this document introduces no schema names of its own except those flagged in §11 | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md), [`schemas/`](./schemas/) |
| 10 | Formatter modes are an **open** set; `generic` is the only one that must exist; a Kling mode must not ship until its axis convention is empirically verified | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`ROADMAP.md`](./ROADMAP.md) |

---

## 11. Assumptions and names not fixed by the canonical data model

This document is bound by [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) and introduces no synonyms for names it already defines. The following are ideas raised by the survey that the canonical model does **not** currently express. Each is flagged rather than silently adopted; each needs a decision before it becomes a field.

| # | Proposal | Origin | Status |
|---|---|---|---|
| 1 | **Cluster labels C1–C5** and the five-cluster framing | This document | Editorial only. No schema impact |
| 2 | **`formatter_capability` record per mode** — word budget, slot ordering, negative-prompt support, max simultaneous camera moves, drop order | LTX's 200-word cap, Hailuo's 3-move cap, Veo's camera-first ordering, ai-shortfilm-prompts' model notes | **Proposed.** The canonical model defines `FORMATTER_MODE` and `model_hints` but no capability record. Needs a home in the prompt layer |
| 3 | **Backend descriptor with a `license` field** — `listBackends() -> [{id, dims, modalities, license, licenseUrl, runsInBrowser, quality}]` | OpenCLIP's `list_pretrained()` | **Proposed.** The canonical model treats `ai.adapters.*` as opaque ids; a descriptor shape belongs in the architecture doc |
| 4 | **`metadata_license` distinct from the media `license`** | The Met, NYPL, Smithsonian | **Proposed.** Not in `Reference.metadata` today. Low cost, prevents a real class of error |
| 5 | **Extended obligation flags** — `hotlink_only`, `download_ping` alongside the existing `requires_attribution` and `share_alike` | Unsplash's obligation model | **Proposed and deprioritised.** Only needed if a non-CC provider is ever enabled, which the policy currently forbids |
| 6 | **Donor-quality fields on a reference** — viewpoint, occlusion, scale, zoom | DeepFashion2's per-item qualifiers | **Proposed.** Would let the mixer warn "this flat-lay is a poor `pose` donor". Not in the model today |
| 7 | **Camera level as modifier nodes inside `camera_angle`** — `exclusivity_group: null`, so they never trigger an arity conflict and coexist with the dominant angle | CineScale2's angle ⊥ level finding | **Our design decision.** The brief fixes the category list at 20, so a new category is not available; the modifier escape is the schema-legal resolution. Needs ratification when `camera.json` is authored |
| 8 | **Category-scoped negative reference weight** | Extends Krea's whole-image negative | **Proposed.** Adjacent to `difference.change_targets`; appears to be unclaimed territory. Would require a signed weight or a separate avoid-list on a mix entry |
| 9 | **The framing/composition boundary rule** — `framing` = subject count and relationship (single, two-shot, OTS, POV); `composition` = spatial organisation (rule of thirds, symmetry, leading lines, negative space, centred) | AVE and ShotBench both keep them separate; Veo flattens them | **Proposed wording** for the taxonomy authoring guide. The brief lists both categories but does not draw the line |
| 10 | The count "106 project entries" | This document's own tally across the eight research dossiers. Some entries deliberately group closely related projects (VITON-HD + Dress Code; Eagle + Hydrus + Diffusion Toolkit; hnswlib-wasm + hnswlib + FAISS; RAFT + OpenCV; transformers.js + ONNX Runtime Web; LM Studio + vLLM), so the count of *named* components is higher | Editorial |

---

## 12. Re-verification queue

Everything below was blocked by the research environment's egress proxy or otherwise unresolved. None of it changes a design decision in this document; all of it must be cleared before the corresponding dependency, citation or provider ships. Full per-cluster lists live in [`research/`](./research/).

**Licence verification (blocking):**

1. WD tagger **weights** and the Danbooru-derived tag vocabulary, per model repository.
2. Florence-2 MIT, firsthand, including the fine-tuned and community variants.
3. JoyCaption checkpoints — does the upstream Llama community licence propagate?
4. Qwen3-VL-Embedding **weights** (as distinct from the Apache-2.0 repo) and the Qwen3-Embedding text family, whose repo LICENSE 404s.
5. jina-clip-v2's CC BY-NC-4.0 status, confirmed from the model card rather than a search snippet.
6. SigLIP 2 checkpoint terms, which the repository deliberately does not state.
7. Fashionpedia's dataset/ontology licence, from the primary terms page.
8. Fashion-IQ's CDLA variant — Permissive-1.0 versus the copyleft Sharing-1.0.
9. CineScale / CineScale2, from the dataset records.
10. TransNetV2, InternVideo and Marqo model-weight terms, distinct from repository code.
11. Whether the ComfyUI port of sd-dynamic-prompts carries the same MIT licence as the A1111 extension.

**Provider verification (blocking v0.2):**

12. Commons search parameters for user-driven search, and whether `Special:MediaSearch` ranking is reachable via the API at all.
13. The `filetype:` alias spelling on Commons, so that video filtering can be relied on.
14. Openverse anonymous CORS in practice behind its CDN, and whether the 100/day anonymous cap is per-IP or per-origin.
15. Openverse's exact `attribution` string template — if it already emits a compliant credit line, our builder should defer to it rather than risk a mismatch.
16. Whether `api.si.edu` still serves traffic post-archival, and whether the NYPL Repo API is actually dead.
17. Whether any CORS-enabled, key-free, CC-licensed **video** source exists besides Commons. If not, user-uploaded local video is the primary video path — which our privacy stance prefers anyway, but the UI must say so.

**Behavioural verification (blocking specific features):**

18. **Kling's pan/tilt axis convention.** Documented as inverted relative to convention; only an empirical A/B generation settles it, and the Kling formatter mode is wrong half the time until it does.
19. Which video models actually distinguish dolly-in from zoom-in in *rendered behaviour*, not merely in vocabulary.
20. Whether an over-specified camera clause degrades output, which determines the per-mode drop-order policy.
21. CameraBench's full primitive list, needed before the motion taxonomy is finalised.
22. Whether region geometry converts into reliable `composition` values — is a box a better signal than a caption?
23. The real ceiling for an in-browser reference library: quota versus N × (thumbnail + metadata + vector). Measured, not estimated.
24. Whether a usable ONNX export of a permissively licensed multimodal embedder exists for in-browser use — the decisive open question for a genuinely local-first semantic search.

---

*End of document. Corrections belong here and in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) together: this document explains **why** a project was cleared or refused; that one records **that** it was, and when.*
