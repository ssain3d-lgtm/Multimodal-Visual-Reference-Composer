# Third-Party Review — Unified Visual Reference Composer

The provenance record: every external project examined while designing this product, what was verified about its licence, what idea we carried away, what we deliberately left behind — and the standing statement that not one line of third-party source code exists in this tree.

> **한국어 요약**
> 이 문서는 "우리가 무엇을 베끼지 않았는지"를 증명하는 출처 기록이다. 설계 과정에서 검토한 외부 프로젝트를 8개 군집으로 나눠 저장소·라이선스·라이선스 검증 여부·무엇을 봤는지·무엇을 가져왔는지·무엇을 의도적으로 가져오지 않았는지를 표로 남긴다. 가져온 것은 사실상 전부 **개념뿐이며 코드는 단 한 줄도 복사하지 않았다**. MVP는 런타임 의존성이 0이고, 향후 추가되는 의존성은 허용 라이선스(MIT/BSD/Apache-2.0 등)여야 하며 전이 카피레프트 검사를 거쳐 `THIRD_PARTY_NOTICES.md`에 기록되어야 한다. 분류 체계(taxonomy)는 업계·영화 용어를 우리가 직접 저술한 것이고 어떤 데이터셋의 라벨 파일도 복사하지 않았으며, 연구 전용·비상업 데이터셋은 전면 배제한다. 모델 **가중치 라이선스는 코드 라이선스와 별개**로 기록하며, 이 검토는 릴리스마다 갱신한다.

> **⚠️ This document is an engineering record, not legal advice.**
> It states what we looked at, what we verified with our own eyes, and what rules this codebase enforces. It is written by engineers. Where a question is genuinely legal — whether a term is copyrightable, whether a licence obligation propagates — this document says so, marks it `(UNVERIFIED — legal question)`, and takes the conservative branch rather than guessing. It is not a substitute for counsel.

---

## 0. Document contract and precedence

**Precedence.** [`BRIEF.md`](../BRIEF.md) wins over everything. [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) wins over this document for field names, enums and invariants. [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) wins for *reference media* policy — which licence values may enter the product and under what predicate a `Reference.status` transition fires. This document owns *code and dependency provenance*: what external software and data we read, what we took from it, and the process that keeps that answer true.

**Relationship to siblings.**

| Document | Owns | This document's relationship |
|---|---|---|
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | *Why* each surveyed project is different from ours | Same survey, different question. That document argues product differentiation; this one records legal provenance. Where they overlap on a fact, both must agree |
| [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) | Reference **media** licensing, License Guard, attribution | This document covers **code, datasets and model weights**. The two layers never imply each other |
| [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) | The live notices file for shipped dependencies | Currently empty of dependencies by design. This document defines the process that fills it |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Adapter boundaries, the egress boundary | Supplies the reason a GPL inference backend can be used at all: only behind a process boundary, never imported |
| [`research/`](./research/) | The eight raw research dossiers | The primary evidence. This document is the audited summary of them |

**Scope.** Everything reviewed *as reviewed during the initial design session*. No dates are invented here; where a fact was true at review time and may since have changed (a repository archived, a model retired, an API deprecated), the row says so.

---

## 1. Purpose: what this document is evidence of

Four specific claims, each of which someone may one day need to check:

1. **We knew the landscape.** The product's differentiation claims in [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) rest on having actually read the closest prior art rather than assuming it does not exist. This is the receipt.
2. **We did not copy.** No source file, data file, vocabulary corpus, prompt database, schema field list or trained weight from any surveyed project exists in this repository. §3 states this without hedging; §4 makes it checkable project by project.
3. **We separated the layers the ecosystem routinely conflates.** Code licence ≠ weights licence ≠ dataset licence ≠ reference-media licence. Half of §4's rows exist because some project got this wrong in a way that would have burned us.
4. **We have a process, not a snapshot.** §11 defines the obligation to redo this review before each release and the gate a new dependency must pass. A provenance record that is only ever written once is decoration.

The brief's question 8 — *"Is reference licensing separated from code licensing?"* — is answered here and in [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) jointly. §14 states the joint answer.

---

## 2. Method: what was reviewed, how, and when

### 2.1 The survey

As reviewed during the initial design session, eight parallel research passes were run, one per problem domain the product touches. Each pass produced a dossier in [`research/`](./research/) recording, per project: repository, licence, licence-verification status, function, overlap with our pipeline, one transferable idea, an explicit *must not copy* list, our differentiator, evidence URLs, and a confidence rating.

| # | Cluster | Dossier | Rows in §4 | Why this domain was surveyed |
|---|---|---|---|---|
| C1 | ComfyUI prompt builders & prompt vaults | [`comfyui-prompt-builders.md`](./research/comfyui-prompt-builders.md) | 13 | The output end of our pipeline, and the environment of the eventual node |
| C2 | Fashion / wardrobe / styling | [`fashion-wardrobe-styling.md`](./research/fashion-wardrobe-styling.md) | 14 | The `clothing` category is the deepest subtree the brief demands |
| C3 | Image-to-prompt / interrogators / captioners | [`image-to-prompt-interrogators.md`](./research/image-to-prompt-interrogators.md) | 13 | Candidate analyzer adapters; the closest thing to Reference Decomposition |
| C4 | Multimodal embedding & retrieval stacks | [`multimodal-embedding-retrieval.md`](./research/multimodal-embedding-retrieval.md) | 14 | The v0.3 semantic half of the fusion ranker |
| C5 | Visual prompt galleries & reference browsers | [`visual-prompt-galleries.md`](./research/visual-prompt-galleries.md) | 13 | The nearest commercial analogues to Selective Inheritance |
| C6 | Cinematography / camera & motion taxonomies | [`cinematic-camera-taxonomy.md`](./research/cinematic-camera-taxonomy.md) | 18 | The `camera_angle`, `camera_distance`, `camera_motion`, `framing` vocabulary |
| C7 | Licence-safe media source APIs | [`license-safe-media-apis.md`](./research/license-safe-media-apis.md) | 10 | The provider layer the brief pins to Commons and Openverse |
| C8 | Video understanding & local VLM runtimes | [`video-analysis-and-local-runtimes.md`](./research/video-analysis-and-local-runtimes.md) | 13 | The v0.4 video path and the local-first analyzer story |
| | | **Total** | **108** | |

Three projects appear in two dossiers each (PySceneDetect in C6 and C8; CameraBench in C6 and C8; transformers.js in C4 and C8). Each is listed **once** in §4, in its primary cluster, with a cross-reference. Some rows deliberately group tightly coupled components (VITON-HD + Dress Code; Eagle + Hydrus + Diffusion Toolkit; hnswlib-wasm + hnswlib + FAISS; OpenCLIP registry members; transformers.js + ONNX Runtime Web), so the count of *named components* is higher than 108 and differs slightly from the tally in [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §11, which groups for a different purpose. Neither count is a claim about anything; the rows are.

### 2.2 The review boundary — what was allowed to cross

```
   EXTERNAL WORLD                    │            OUR REPOSITORY
                                     │
   repository README ────────────►   │
   published algorithm description ► │  ┌──────────────────────────┐
   API request/response shapes ────► │  │  CONCEPTS                │
   vocabulary of a research field ─► │  │  (ideas, shapes, rules,  │──► original
   documented failure modes ───────► │  │   named failure modes)   │    implementation
   licence files ──────────────────► │  └──────────────────────────┘
                                     │
   ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
                                     │
   source code ─────────────────X    │   nothing crosses. not even MIT code.
   prompt databases ────────────X    │   not even one function.
   label / tag / wildcard files ─X   │   not even "as a starting point".
   schema field-name lists ─────X    │
   trained weights ─────────────X    │
   dataset annotations ─────────X    │
   media (images, video, frames) X   │
                                     │
```

The line is drawn at *expression*, not at *permission*. Several projects below are MIT-licensed and would happily let us vendor them. We did not, for three reasons: the brief prohibits wholesale copying of external repository code outright; a permissive licence still creates notice obligations we would rather not scatter through a small vanilla-ES-modules codebase; and our value is the schema and the composition logic, neither of which is available to copy from anyone.

### 2.3 Verification rules applied to every licence claim

Five rules, each adopted because a specific project in §4 would otherwise have been misclassified.

| Rule | Statement | The row that forced it |
|---|---|---|
| **V1 — the file wins** | When a platform licence label and the repository's `LICENSE` file disagree, the file is authoritative and the label is recorded as a discrepancy | ComfyUI-MultiModal-Prompt-Nodes (label `NOASSERTION`, file GPL-3.0); CameraBench (label `NOASSERTION`, file CC BY 4.0); Hydrus (label `NOASSERTION`, file WTFPL v3) |
| **V2 — absence is denial** | No `LICENSE` file and no licence field means **all rights reserved**, never "unknown, probably fine". Popularity is not permission | Comfyroll (1,308 stars, no licence); PromptJSON; Okims JSON Builder; ShotBench; AVE; SW-CV-ModelZoo; DeepFashion2; civitai-image-scraper |
| **V3 — weights are not code** | A repository licence never covers model checkpoints unless the repository says it does. Weights get their own recorded column | LTX-Video (Apache-2.0 repo, OpenRAIL-M weights); SigLIP 2 (Apache-2.0 software, CC BY "other materials", checkpoints unlicensed); jina-clip-v2 (NC weights) |
| **V4 — code is not data** | A permissive toolbox over research-gated data is not a usable stack. Both licences must clear | mmfashion (Apache-2.0 over DeepFashion/Polyvore); polyvore-dataset (Apache-2.0 repo, scraped images); CLIP Interrogator (MIT code, `flavors.txt` corpus) |
| **V5 — downloadability is not permission** | A working link, a form password or a Kaggle mirror grants nothing | DeepFashion2 (Google Form + unzip password); Dress Code ("will not be released to private companies"); Polyvore (dead URLs, unofficial mirror) |

### 2.4 Verification legend used in §4

| Mark | Meaning |
|---|---|
| **✅ file** | The `LICENSE`/`COPYING` file itself was fetched and read |
| **✅ label** | Only the platform's licence field was read; the file was not opened. Treated as weaker evidence and never used to justify a dependency |
| **✅ absence** | Verified that no licence file exists at the expected paths *and* that the platform reports no licence field. This is a positive finding of "all rights reserved" |
| **⛔ none** | No licence. All rights reserved by default (V2) |
| **⚠️ UNVERIFIED** | Could not be read firsthand during the research session — every non-repository host was blocked by the research environment's egress proxy. Claims sourced from search snippets or secondary documentation are marked as such and may **never** justify a dependency |
| **§ proprietary** | Closed product. Reviewed from public documentation only, as behaviour, never as source |

Every `⚠️ UNVERIFIED` row is also carried in §12's blocking queue.

---

## 3. The clean-room statement

**No source code from any project listed in this document — or from any other third-party project — has been copied, vendored, adapted, transliterated, machine-translated or otherwise incorporated into this repository. All implementation in `src/`, `app/` and `data/` is original work authored for this product.**

This statement is unconditional and covers, explicitly:

- **Code**, including permissively licensed code (MIT, BSD, Apache-2.0). Permission was available from many of the projects below and was declined in every case.
- **Prompt databases and vocabulary corpora**: `flavors.txt` (100,970 lines), Prompt Vault's `vault_data.py`, WildPromptor's keyword and artist directories, Fooocus-derived style JSON, danbooru tag dumps, community wildcard bundles.
- **Schema field-name lists** — including PromptJSON's, whose nested shape resembles ours. The resemblance is convergent: both descend from how cinematographers already talk. Ours is fixed by [`BRIEF.md`](../BRIEF.md) and formalised in [`DATA_SCHEMA.md`](./DATA_SCHEMA.md).
- **Dataset annotations and label files**: Fashionpedia's 294 attributes, DeepFashion2's 13 classes, AVE's tag vocabulary, CameraBench's taxonomy JSON, ShotBench's option strings, CineScale's class ladders.
- **Trained weights** of any model, and any artefact derived from them.
- **Media**: no image, no video, no film frame, no thumbnail. INV-REF-2 enforces this at the schema level — `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` are declared invalid in `reference.schema.json`, so a document carrying media bytes cannot validate.

**What we did take** is recorded per project in §4 and is, in every single row, one of: an idea, a documented failure mode, a published algorithm description, an API request/response shape we must interoperate with, or a piece of industry vocabulary. §10 lists the handful of cases where a *published algorithm* informed our implementation, together with the citation each one earns.

**Two things that are true and easy to misread.** First, a resemblance between our `StructuredPrompt` and kiko-flux2's JSON, or between our `VisualIntent` and PromptJSON's schema, is not evidence of copying — both are the shape that falls out of the domain, and ours is dictated by a brief written before the survey. Second, our taxonomy uses the same *words* as several surveyed projects ("low angle", "rim light", "dolly in"). Those are the terms of art of cinematography; §8 states our position on them.

---

## 4. The survey

Column conventions: **Taken** describes what crossed the boundary in §2.2 and, per §3, is *concepts only, no code* in every row — the cell names which concept. **Not taken** names the specific artefact we refused, not a generic disclaimer.

### 4.1 C1 — ComfyUI prompt builders and prompt vaults

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| kiko-flux2-prompt-builder | `ComfyAssets/kiko-flux2-prompt-builder` | MIT | ✅ file | README, `nodes/prompt_builder_node.py`, node return signature, standalone HTML page | Concepts only, no code: emit the structured and flattened forms from one call (generalised to our four node outputs); its numeric-vs-descriptive lens toggle as independent precedent for the lens hedge rule | Preset tables (People & Portraits / Nature / Action / Commercial / Artistic), its JSON key names, `_build_text_prompt`, any source |
| ComfyUI-Prompt-Vault | `jeremieLouvaert/ComfyUI-Prompt-Vault` | MIT | ✅ file | README, node contracts and `INPUT_TYPES` keys | Concepts only, no code: a provenance output alongside the prompt (`prompt_dna` is a primitive ancestor of `reference_mix`); curated entry point plus always-editable result | `vault_data.py` — the 21 templates and 100+ components; named camera bodies and film stocks (trademark and brand-assertion hazard) |
| ComfyUI-KikoTools | `ComfyAssets/ComfyUI-KikoTools` | MIT | ✅ file | README (Gemini Prompt Engineer, Local Image Loader) | Concepts only, no code: analyse once, format many — one analysis pass, several output dialects chosen by a parameter; a passthrough inspector as precedent for a `visual_intent` debug view | The Gemini binding: a hardcoded, cloud-only, single-vendor analysis path — precisely what the brief prohibits. API-key handling. Any source |
| ComfyUI Workflow Studio | `ketle-man/ComfyUI-Workflow-Studio` | MIT | ✅ label | Repository page and README | Concepts only, no code: styles as data files in a user-writable directory (→ `data/taxonomy/*.json` is data, the prompt engine is code); a panel that never closes | Its Fooocus-derived style JSON (re-vendored corpus with its own upstream chain); its architecture as a management shell around ComfyUI |
| ComfyUI-PromptChain | `mobcat40/ComfyUI-PromptChain` | **AGPL-3.0** | ✅ file | README, LICENSE | Concepts only, no code: combination is an explicit *named* mode, never an implicit default — which is why our conflicts are a visible choice | **Nothing else. Zero code, zero adaptation, zero translation.** AGPL's network clause would reach a hosted web MVP and place the entire product under AGPL. Also refused: its `::Label::a\|b` / `__file__` inline DSL, whose distinctive syntax would read as derivation |
| ComfyUI-Custom-Scripts | `pythongosssss/ComfyUI-Custom-Scripts` | MIT | ✅ file | README, LICENSE (autocomplete, String Function, Preset Text) | Concepts only, no code: vocabulary lists as plain user-editable files sitting next to what they describe; separator hygiene (`tidy_tags`) as a first-class engineering concern, not an afterthought | The danbooru tag corpus it loads — scraped booru data of unclear provenance with a heavy single-model aesthetic bias that would poison our taxonomy's neutrality |
| sd-dynamic-prompts | `adieyal/sd-dynamic-prompts` | MIT | ✅ file | README, LICENSE, wildcard conventions | Concepts only, no code: record the template *and* its resolution (→ a `VisualRecipe` saves the combination, not the string); glob addressing so one token reaches a whole subtree | The community wildcard `.txt` collections — aggregated from mixed, usually unstated sources. We copy the file convention, never the files. The ComfyUI port's licence is ⚠️ UNVERIFIED (§12) |
| ComfyUI_Comfyroll_CustomNodes | `Suzie1/ComfyUI_Comfyroll_CustomNodes` | **⛔ none declared** | ✅ absence (root listing + API return no licence) | Repository root listing, README, node names | Concepts only, no code: consistent node-name prefixing and a flat predictable category make a large pack navigable; prompts-as-sequences-over-time is a real user demand | **Everything.** No licence file means all rights reserved. 1,308 stars is not permission. Reviewed as prior art only; not one line of it exists in our tree, and neither do its style JSON files |
| ComfyUI-PromptJSON | `NeuralSamurAI/ComfyUI-PromptJSON` | **⛔ none declared** | ✅ absence (raw + blob `LICENSE` both 404; API no field) | README and its documented example schema | Concepts only, no code: schema-as-a-parameter rather than one hardcoded serialisation — support for keeping `formatPrompt(structured_prompt, mode)` pluggable; a single verbosity knob as a composer control | Its schema field names, its schema-type list, its code. Our `VisualIntent` field list is fixed by the brief and authored independently; the structural resemblance is convergent and this document says so on the record |
| ComfyUI-WildPromptor | `1038lab/ComfyUI-WildPromptor` | Apache-2.0 | ✅ label | README, `data/` category structure | Concepts only, no code: the folder *is* the schema — adding a directory creates a new surface with no code change; the cleanest example of UI generated from data | Its bundled keyword data, especially the artist-name lists. Living-artist style tokens are an ethical and legal hazard in a product that also stores attribution. Apache-2.0 would permit reuse; the brief's prompt-DB prohibition still applies |
| ComfyUI-Prompt-Manager | `FranckyB/ComfyUI-Prompt-Manager` | **GPL-3.0** | ✅ label | README, Recipe node descriptions | Concepts only, no code: the saved unit is a recipe and it round-trips — extract, edit, render, re-save | **Any code** — GPL-3.0 would force the whole product copyleft. Its storage layout, its metadata-parsing implementation, its base64-thumbnail-in-JSON trick (we store `thumbnail_url`, never bytes), and its assumption that provenance lives in generated-image metadata |
| ComfyUI-MultiModal-Prompt-Nodes | `kantan-kanto/ComfyUI-MultiModal-Prompt-Nodes` | **GPL-3.0** (file) — platform label reads `NOASSERTION` | ✅ file (V1 applied) | README, LICENSE | Concepts only, no code: backend swappability as a widget (local vs API from a dropdown, no code change) — the ergonomic target for `ai.adapters.*`; multi-image input as node ergonomics | Code (GPL-3.0, transitively pulling a GPL inference backend); its prompt templates; its hardcoded Qwen model-id lists. This row is also the canonical example for rule V1 |
| ComfyUI_Okims_JSON_Builder | `sarnara2/ComfyUI_Okims_JSON_Builder` | **⛔ none declared** | ✅ absence | README only (the repo's sole documented file) | Concepts only, no code: a node reduced to a two-button launcher for a real fullscreen web UI — how our eventual node should embed the web MVP; auto-saved builder state | Code and layout presets. Thinly documented, so its schema, node class and outputs are ⚠️ UNVERIFIED and nothing is cited about it beyond its README |

### 4.2 C2 — Fashion, wardrobe and styling

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| Fashionpedia (ontology + dataset) | `cvdfoundation/fashionpedia` | ⚠️ UNVERIFIED (reported CC BY 4.0; primary terms page egress-blocked) | ⚠️ | Published ontology structure; supercategory axes as they appear in the API repo's sample data | Concepts only, no data: the **attribute supercategory axis** — grouping values by axis (silhouette, length, neckline, opening, material family, pattern) is what makes per-axis conflict detection possible, and is the ancestor of our `exclusivity_group` | The annotation JSONs, the images, and any verbatim dump of the 294-attribute list. Blocked from `data/taxonomy/` until the licence is confirmed from the primary terms page (§12) |
| fashionpedia-api | `KMnP/fashionpedia-api` | BSD-2-Clause | ✅ file | `README`, `data/sample.json`, licence text | Concepts only, no code: the `{category_id, attribute_ids[]}` encoding stays diffable and mergeable — the property our mixer needs; evaluation kept separate from representation | COCO mask-evaluation machinery (irrelevant and Python-bound); its integer attribute ids, which are not canonical for us |
| DeepFashion | CUHK MMLab project page (no public data repo) | ⚠️ UNVERIFIED (reported research-only, signed release from an institutional email; hosts egress-blocked) | ⚠️ | Secondary documentation of the task set | Concepts only, no data: consumer-to-shop pairing is Search by Difference in miniature — hold garment identity constant, vary capture conditions | **Images, weights trained on it, and any dependency on it.** Research-only. Its images are scraped and explicitly not the lab's property (reported). Recorded here as blocked, per the brief's ban on research-gated dependencies |
| DeepFashion2 | `switchablenorms/DeepFashion2` | **⛔ none** (verified absence at repo top level); data behind a Google Form issuing an unzip password | ✅ absence | README, repository top-level listing | Concepts only, no data: per-item donor-quality qualifiers (viewpoint, occlusion, scale, zoom) — a flat-lay is a good `clothing` donor and a useless `pose` donor. Flagged as a proposal in §13, not silently adopted | The 13-class list verbatim, the annotations, any fine-tune. Also refused: its class *design*, which fuses sleeve length into the class name and makes "same silhouette, different sleeves" inexpressible |
| IDM-VTON | `yisol/IDM-VTON` | **CC BY-NC-SA-4.0** (code **and** checkpoints) | ✅ file | README, licence statement, input contract | Concepts only: its input contract is decomposition by construction — person signals (pose, body region) separated from garment signals. Our analyzer should likewise emit `pose`/`appearance` separately from `clothing` | **Nothing shippable.** NC blocks commercial use of both code and checkpoints; SA would infect derivatives. Additionally trained on VITON-HD / Dress Code, a second independent block |
| OOTDiffusion | `levihsu/OOTDiffusion` | **CC BY-NC-SA-4.0** | ✅ file | README, LICENSE, category enum | Concepts only: outfitting dropout as *strength of inheritance* — motivating the per-entry `weight` on a mix entry (soft, never auto-resolving) | Code, weights and derivatives — all NC + SA. Trained on VITON-HD and Dress Code, both research-gated |
| CatVTON | `Zheng-Chong/CatVTON` | **CC BY-NC-SA-4.0** ("code, checkpoints, and demo") | ✅ file | README, licence statement, architecture summary | Concepts only: conditioning on a reference needs no second encoder, only a shared representation space — an argument for one multimodal space rather than per-modality retrieval subsystems | Everything, including the demo. Evaluation additionally touches DeepFashion, VITON-HD and Dress Code |
| VITON-HD + Dress Code | `shadow2496/VITON-HD`, `aimagelab/dress-code` | VITON-HD: **CC BY-NC-4.0**, research only. Dress Code: **proprietary bespoke agreement** — "will not be released to private companies" | ✅ file / ✅ terms | Licence statements and access procedures | Concepts only: the access process is a negative template for our License Guard — "the file downloaded" and "we may use it" are separate facts, which is why `Reference.status` is a four-value enum | No images, no derived features, no checkpoints trained on them. Dress Code requires an institutional email, a hand-signed form, and explicitly excludes private companies |
| tandpfun/wardrobe | `tandpfun/wardrobe` | MIT | ✅ file | README, LICENSE, storage layout | Concepts only, no code: a local `data/` directory as the entire database, matching our local-first stance; a locked identity reference held constant while other attributes vary | Code (brief prohibits it regardless of MIT) and above all its hardcoded provider dependency — the importer is disabled until an API key is set. AI OFF must be a complete product |
| iamsaurabhc/drape-ai | `iamsaurabhc/drape-ai` | MIT | ✅ file | README, LICENSE, persistence model | Concepts only, no code: multi-reference composition in one call rather than chained passes (the same reason we forbid silent sequential conflict resolution); recipe-shaped persistence validating `VisualRecipe` | Its transfer mechanism — reference-locked English prose ("do not alter the model's face…") is unverifiable, untestable and unportable, and is exactly the prompt-builder degradation the brief forbids. Also its hardcoded commercial generator names |
| FashionCLIP / Marqo-FashionCLIP | `patrickjohncyh/fashion-clip`, `marqo-ai/marqo-FashionCLIP` | FashionCLIP: MIT (label). Marqo: Apache-2.0 repo; **weights licence not stated** ⚠️ | ✅ label / ✅ file (repo) | Repository pages, Marqo LICENSE, published evaluation suite | Concepts only, no weights: structured metadata (category, style, colour, material) as a *first-class* retrieval signal rather than a fallback — direct support for our ~60/40 fusion; a held-out benchmark set as the way to answer "did EXPLORE actually return the same outfit?" | The weights. FashionCLIP's training corpus release is described by its own repo as pending — an MIT model does not make its data usable — and Marqo's benchmark bundles wrap DeepFashion and Polyvore images with their own terms |
| open-mmlab/mmfashion | `open-mmlab/mmfashion` | Apache-2.0 (code) | ✅ file | README, `docs/DATA_PREPARATION.md` | Concepts only, no code: one substrate, many independent swappable sub-tasks — the modular framing our adapter layer needs | **The whole stack.** This is the canonical V4 case: permissive code over research-gated data (DeepFashion, Polyvore) is not a usable stack. Also refused: its Python/mmcv dependency shape |
| Polyvore dataset + outfit-transformer | `xthan/polyvore-dataset`, `owj0421/outfit-transformer` | Apache-2.0 (repo only — **not** the crawled images) / MIT | ✅ file | LICENSE files, README, task definitions | Concepts only, no data: fill-in-the-blank applied *per attribute category* — an empty `VisualIntent` field becomes a ranked search rather than a blank box | The images. The repo notes original URLs are dead and points at an unofficial mirror of unknown provenance; under our policy those are `unknown` and excluded by default. Also refused: collapsing reasoning into one learned compatibility scalar |
| Fashion-IQ | `XiaoxiaoGuo/fashion-iq` | ⚠️ UNVERIFIED — platform label reads "CDLA", variant (Permissive-1.0 vs copyleft Sharing-1.0) unconfirmed | ⚠️ | Repository page, task description | Concepts only, no data: users naturally express visual intent as a *delta*, which makes a KEEP/CHANGE selector a natural UI rather than a novelty; and it distributes captions and splits, never media — the same rule as our no-binaries policy | Its captions, until the CDLA variant is confirmed (§12) — under Sharing-1.0 our published derivatives would carry share-alike obligations into `data/`. Also refused: free-text deltas as an internal representation |

### 4.3 C3 — Image-to-prompt, interrogators and captioners

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| clip-interrogator | `pharmapsychotic/clip-interrogator` | MIT | ✅ file | LICENSE, `clip_interrogator.py`, README, the shape of its data files | Concepts only, no code: the **label-table pattern** — pre-embed a controlled vocabulary once, rank an image against it by dot product. Applied per taxonomy category, this fills `VisualIntent` with confidences and no captioner at all (§10, ALG-3) | The five label files — `flavors.txt` alone is 100,970 lines / 1.72 MB of scraped prompt phrases plus a raw artist list. Also refused: the comma-joined output template, which destroys the category membership the system just computed; and token-limit truncation as a prompt-length policy |
| clip-interrogator-ext | `pharmapsychotic/clip-interrogator-ext` | MIT | ✅ file | LICENSE, README, endpoint list | Concepts only, no code: splitting "prompt" from "analyze → terms + confidences" into two API surfaces, validating our analyzer/formatter boundary | Its coupling of UI to engine (a WebUI script, not a library) — the brief prohibits coupling UI with the prompt engine. Its one-shot interaction model where no reference persists |
| WD14 / WD Tagger weights | `SmilingWolf/wd-*-tagger-v3` family (model host) | ⚠️ UNVERIFIED (host egress-blocked) | ⚠️ | Third-party decoding code and the documented output contract | Concepts only, no weights: a tag carries a **category id** alongside its probability, so an analyzer adapter must return `[{field, value, confidence}]`, never `[{value, confidence}]`; and different categories deserve different confidence thresholds | The booru tag vocabulary as our schema (anime domain, NSFW-heavy, unclear vocabulary licensing); the rating axis; the escaped comma-joined output format |
| SW-CV-ModelZoo | `SmilingWolf/SW-CV-ModelZoo` | **⛔ none** (verified absence: raw LICENSE 404, no README licence section) | ✅ absence | README, results table | Concepts only: it demonstrates by omission the required triple separation — training data ≠ weights ≠ training code. That separation is exactly what our brief's question 8 demands | Any code. All rights reserved by default. Also refused as a practice: publishing a widely-depended-on repository with no licence |
| ComfyUI-WD14-Tagger | `pythongosssss/ComfyUI-WD14-Tagger` | MIT | ✅ file | LICENSE, README, `wd14tagger.py` | Concepts only, no code: **two thresholds for two tag classes** — identity-like attributes deserve conservative gates, descriptive ones looser. We generalise this to per-category thresholds, with `lens` the most conservative of all | Its single `tag_string` output socket (our node emits four, three of them structured); and the silent runtime auto-download of weights whose licence the node never states |
| stable-diffusion-webui-wd14-tagger | `picobyte/stable-diffusion-webui-wd14-tagger` | "Public domain, except borrowed parts" — **non-SPDX, ambiguous** | ✅ file (and found it insufficient) | README | Concepts only: multi-backend interrogation behind one UI with the model as a dropdown — practical proof that backends must never be hardcoded | Any code. Its licence statement names neither an SPDX identifier nor which parts are borrowed under what terms; it would fail our own `license_check`. Reference reading only |
| DeepDanbooru | `KichangKim/DeepDanbooru` | MIT | ✅ file | LICENSE, model/vocabulary packaging | Concepts only, no code: it ships its tag list versioned *with* the model — generalised to pinning `integrity.taxonomy_version` alongside the analyzer version, so confidences from two generations stay comparable | The vocabulary and the anime-illustration domain assumption. Our taxonomy is photographic and cinematographic |
| JoyCaption | `fpgaminer/joycaption` | Apache-2.0 (repo); **weights ⚠️ UNVERIFIED** (Llama 3.1 lineage) | ✅ file (repo) | LICENSE, `gradio-app/app.py`, README | Concepts only, no code or weights: attribute checkboxes as an input affordance (users understand "include lighting"), and ordered value *ladders* for shot size and vantage height — ordering enables "one step wider" as an operation, which flat tag sets cannot express | The weights and any derived caption corpus (licence unresolved; deliberately uncensored, incompatible with a licence-clean pool). Its option strings verbatim. Above all: flattening known categories back into one paragraph, and its instruction to state aperture/shutter/ISO — invented EXIF, which the lens rule forbids |
| Florence-2 | `microsoft/Florence-2-*` (model host; no canonical code repo) | ⚠️ UNVERIFIED (reported MIT; model card and paper both egress-blocked) | ⚠️ | Third-party wrapper documentation, published task-token interface | Concepts only: the **task token as an adapter contract** — `analyze(image, task)` lets backends of different capability plug in behind one interface; and region geometry is a measurable composition signal where a caption is only interpretable | Any hardcoding of a model id in our code — it sits behind `ai.adapters.analyzer`. Also refused: the three-tier caption ladder as a product output; verbosity is not structure |
| ComfyUI-Florence2 | `kijai/ComfyUI-Florence2` | MIT | ✅ file | LICENSE, README | Concepts only, no code: running several model variants behind one node with a model dropdown is practical evidence that "can the AI model be swapped later?" is answerable yes | Its practice of stating no licence for the weights it auto-downloads; and its single text output socket |
| BLIP / BLIP-2 / LAVIS | `salesforce/BLIP`, `salesforce/LAVIS` | BSD-3-Clause (both) | ✅ file | `LICENSE.txt` for both, READMEs, API shape | Concepts only, no code: the split between feature extraction and generation mirrors our rule that the analyzer understands and the retriever ranks; its multimodal/unimodal feature API is a good shape for `embedding-adapter` | BLIP-style short generic captions as any part of our schema — they contain almost none of our 20 categories and cannot be decomposed. The deprecated BLIP repo is not built on. Per-checkpoint weight terms are ⚠️ UNVERIFIED and must be checked individually |
| moondream | `vikhyat/moondream` | Apache-2.0 (code); **weights ⚠️ UNVERIFIED** | ✅ file (repo) | LICENSE, README, `gradio_demo.py` | Concepts only, no code: a 0.5B–2B local VLM is laptop-deployable today, which makes the local-first analyzer stance realistic rather than aspirational | The regex-out-of-prose pattern — its demo recovers bounding boxes by regex-matching four floats from generated text. Structured data must never round-trip through prose inside our pipeline; if a backend can only emit text, the adapter parses once at the boundary and discards the prose |
| img2prompt web tools | Picsart, ImagePrompt.org, ImageToPrompt.org, GeneratePrompt.ai, PixelPanda, Replicate `methexis-inc/img2prompt` | § proprietary | ⚠️ (all domains egress-blocked; search snippets only) | Public product descriptions | Concepts only: multi-target formatting from a single analysis is clearly valued — validating one `StructuredPrompt` rendered through several formatter modes rather than re-analysing per target | The entire product shape: upload → wait → copy a blob → leave. Not editable field-by-field, not saveable, not searchable, not mixable. Also refused: the credit-metered, signup-walled funnel — v0.1 must work with no AI and no account |

### 4.4 C4 — Multimodal embedding and retrieval stacks

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| Qwen3-VL-Embedding / Reranker | `QwenLM/Qwen3-VL-Embedding` | Apache-2.0 (repo); **weights ⚠️ UNVERIFIED** | ✅ file (repo) | LICENSE, README, query and instruction shapes | Concepts only, no code or weights: the **instruction string as a first-class query field** — our KEEP set renders into it and the CHANGE set becomes a rerank constraint, degrading gracefully on adapters that ignore it; Matryoshka truncation as a storage-tier strategy | Its inference/serving code. Critically, its 2048-dim assumption must never leak into our schemas — dimension is adapter metadata (`EmbeddingRecord.dim`), never a constant |
| Qwen3-Embedding (text) | `QwenLM/Qwen3-Embedding` | **⛔ / ⚠️** — raw `LICENSE` 404s and the repo page showed no label; Apache-2.0 claimed only on model cards | ✅ absence at repo | Repository page, published dimension ladder | Concepts only: a dimension ladder across one family lets one adapter descriptor expose fast/balanced/enhanced tiers without changing calling code | Any dependency. **We do not assert its licence** and it may not be defaulted or bundled until a human opens the model card (§12) |
| jina-clip-v2 | `jinaai/jina-clip-v2` (model host) | Reported **CC BY-NC-4.0** for weights ⚠️ UNVERIFIED (host egress-blocked) | ⚠️ | Secondary documentation; supported-architecture list of a browser runtime | Concepts only: Matryoshka truncation as an explicit storage tier (1024-dim float32 ≈ 4 KB/reference vs 256 dims ≈ 1 KB) is the difference between a browser-resident library and none | **The weights.** NC is the exact class our own policy excludes for reference media; bundling NC weights while rejecting an NC photograph would be incoherent. If ever supported it is an opt-in adapter, badged like a reference licence, never a default. Also: do not design the adapter interface assuming a native fused text+image query — it is dual-tower |
| SigLIP 2 / big_vision | `google-research/big_vision` | Apache-2.0 (software) + CC BY (other materials); **checkpoints not licensed at all** | ✅ file | LICENSE, `README_siglip2.md` | Concepts only, no code or weights: NaFlex-style native aspect-ratio preservation matters because framing and aspect ratio *are* semantic content for us — consequence: if we pick a fixed-resolution encoder, aspect ratio must be recorded as structured metadata (`media.aspect_ratio`) so the metadata half of the ranker keeps it | The checkpoints. This row is the canonical V3 case: the repo explicitly splits software from other materials and never licenses the checkpoints, while the model-card label reads permissive ⚠️ |
| OpenCLIP | `mlfoundations/open_clip` | MIT | ✅ file | LICENSE, README, registry API | Concepts only, no code: a **runtime-enumerable backend registry** — `listBackends() → [{id, dims, modalities, license, licenseUrl, runsInBrowser, quality}]`, carrying licence as a *field* so the UI can badge an NC model the way License Guard badges an NC image. Flagged as a proposal in §13 | Its model code. Also refused: the assumption "weights licence == repo licence" — it is MIT while serving weights under varying and unstated terms |
| clip-retrieval | `rom1504/clip-retrieval` | MIT | ✅ file | LICENSE, README, pipeline description | Concepts only, no code: memory-mapped index plus a separate metadata store keeps footprint near zero — mapping directly onto vectors in an index, metadata in a queryable store, media only ever by URL | Its query API's mutually exclusive text-OR-image-URL-OR-base64 shape, which the frontend mirrors — a disqualifying anti-pattern under Pillar 1. Also the crawl-everything posture, which collides with our ban on bulk unknown-licence storage |
| Marqo | `marqo-ai/marqo` | Apache-2.0 | ✅ file | LICENSE, README (which now declares the OSS project deprecated) | Concepts only, no code: the **weighted multi-part query** — a query as a list of (content, weight) pairs, which is the right mental model for a mix's semantic side (`[{source, categories, weight}]`, never a concatenated sentence) | The server dependency (Docker/Vespa contradicts local-first and "AI OFF is a complete product"). Its deprecation *is* the lesson: never build a pillar on one vendor's OSS goodwill — the adapter boundary exists so a dead backend costs one file |
| transformers.js + ONNX Runtime Web | `huggingface/transformers.js`, `microsoft/onnxruntime` | Apache-2.0 / MIT | ✅ file (both) | LICENSE files, READMEs, dtype and backend documentation | Concepts only, no code today: a device/dtype policy exposed as a user-visible setting with a documented fallback chain — the honest quality/size dial that implements "enhanced search mode" without hardcoding a model. Pre-screened as an admissible *future* dependency (§7.4) | Nothing to copy — it is a dependency candidate, not a competitor. The trap refused is implicit network access: weights fetch from a remote hub on first use, so any model download must be user-initiated, size-disclosed and cached, per `external_transmission.disclosed_at`. WebGPU is not depended on |
| sqlite-vec | `asg017/sqlite-vec` | Apache-2.0 **OR** MIT | ✅ label | Repository page, feature list | Concepts only, no code today: partition-key and metadata columns beside the vector mean an unapproved reference is unreachable by the retriever *by construction* (a `WHERE` clause) rather than post-filtered. Pre-screened for §7.4 | Premature adoption of DiskANN/IVF — brute force is correct at our scale with zero failure modes. Its SQL must never leak out of the search module; it is self-declared pre-v1 |
| Voy | `tantaraio/voy` | Apache-2.0 **OR** MIT | ✅ label | Repository page, documented constraints | Concepts only: result payloads carrying metadata inline is the right ergonomics for reference cards — the retriever returns enough to render a card without a second round-trip | **Rejected as a dependency.** Its documented requirement to rebuild the index on resource update is disqualifying: our users approve references continuously, and a full reindex per approval is unacceptable. Persistence is serialise/deserialise only; the API is pre-1.0 |
| USearch | `unum-cloud/usearch` | Apache-2.0 | ✅ label | Repository page, scalar-type list, serialisation features | Concepts only, no code today: `i8`/`b1x8` quantized indexes — a 2048-d float32 vector (8 KB) becomes 256-d int8 (256 B), ~32× smaller, which is what makes a few-thousand-card local library fit browser quotas. Pre-screened for §7.4 | The assumption that HNSW is free: sibling documentation puts memory at ~M × 8–10 bytes per element with deletions as marks, so a library where users *reject* references needs tombstones and rebuild planned in. Its npm browser-vs-native status is ⚠️ UNVERIFIED |
| hnswlib-wasm + hnswlib + FAISS | `ShravanSunder/hnswlib-wasm`, `nmslib/hnswlib`, `facebookresearch/faiss` | Apache-2.0, Apache-2.0, MIT | ✅ file (hnswlib, FAISS); ✅ label (wasm) | LICENSE files, READMEs, persistence mechanisms | Concepts only, no code: index persistence with an explicit compatibility header — `{embeddingBackendId, dims, quantization, indexVersion}` — so swapping the embedding adapter *invalidates* the index instead of silently returning garbage | Adopting an experimental single-maintainer WASM binding as a load-bearing default. ANN stays an optional acceleration behind an honest brute-force baseline. Also noted and heeded: hnswlib's own caveat that inner product is not a true metric |
| LanguageBind | `PKU-YuanGroup/LanguageBind` | MIT (code) / **CC BY-NC-4.0 (VIDAL dataset)** | ✅ file | README licence split, architecture summary | Concepts only, no code or data: one text-anchored space for all modalities implies our index must be **modality-tagged but single-space** — one vector table with a media-type column, not separate image and video indexes, or the unified promise breaks at the storage layer | The NC dataset — it may never touch our repo or reference library. This row is a clean instance of the MIT-code-over-NC-data trap. Also refused: its per-modality LoRA sprawl as an adapter design |
| InternVideo / InternVideo2 | `OpenGVLab/InternVideo` | Apache-2.0 (label); **weights not separately licensed** ⚠️ | ✅ label | Repository page, model family description | Concepts only: the distillation ladder (one teacher, several sizes) is the model-axis analogue of Matryoshka — expose `quality: fast \| balanced \| enhanced` and state explicitly whether tiers share a vector space | Its scale. An 8B video model is categorically incompatible with local-first, AI-optional defaults; anything that size can only be an explicitly installed, explicitly disclosed enhanced mode — never a requirement, never silently enabled |

### 4.5 C5 — Visual prompt galleries and reference-browsing products

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| Lexica | closed product; community client `transitive-bullshit/lexica-api` | § proprietary / MIT (client) | ⚠️ (product), ✅ label (client) | Public API documentation, third-party tutorials | Concepts only: one query parameter accepting either text or an image URL is a shipped miniature proof that the surface stays constant while only the input mode changes | **No mirroring or bulk ingestion of its index** — user-generated output with no per-image licence provenance, which fails `license_check` and can never reach `approved`. Also refused: an opaque prompt string as the output contract. API terms are ⚠️ UNVERIFIED; we never use it as a provider |
| PromptHero | closed product | ⚠️ UNVERIFIED | ⚠️ | Secondary product descriptions | Concepts only: model-aware output — the same intent must render differently per generator, validating a swappable formatter | Its presentational facets ("camera technique" as a search keyword rather than a typed field with a controlled vocabulary). No ingestion of its prompt database |
| OpenArt | closed product | ⚠️ UNVERIFIED | ⚠️ | Secondary product descriptions | Concepts only: remix as the default verb — a gallery item is a starting state, not a finished artefact; and teaching vocabulary in-product is valuable | Its all-or-nothing remix (inherit the whole string, then hand-edit text — text surgery, not attribute surgery). Its gallery content and written material |
| Civitai | `civitai/civitai` | Apache-2.0 (application code) | ✅ file | LICENSE, public REST API surface, ToS | Concepts only, no code: the provider adapter contract shape — search with filters, fetch metadata by id, fetch preview — and the lesson that licence must be a first-class field on every record | **No bulk export or scraping.** Its ToS prohibits spiders, crawlers and data-mining tools outside its provided interfaces. Third-party bulk scrapers (e.g. `hassan-sd/civitai-image-scraper`, which has **⛔ no licence file at all** — ✅ absence verified) are an anti-pattern, not a template |
| Midjourney `--sref` / `--oref` | closed product | § proprietary | ⚠️ (vendor docs partially egress-blocked) | Public documentation of parameters, ranges and defaults | Concepts only: per-reference weights with a **documented scale and default**, and the subject/style split as an admission that one reference contributing everything is too blunt | Any documentation text; and the design itself — an opaque latent style code cannot be decomposed, cannot be edited, teaches nothing and expires with the model version. **No sref-code database is built or redistributed** |
| Krea 2 style references | closed product | § proprietary | ⚠️ (krea.ai egress-blocked; reference counts conflict across sources) | Public blog/product descriptions | Concepts only: **negative reference weight** — "less like this one" is a real control, and scoping it to a *category* is strictly more expressive. Flagged as a proposal in §13 | Model weights, LoRAs or derived style artefacts. Also refused: extraction to a single latent style blob per image with no UI to select among the named components |
| ShotDeck | closed product (subscription); images are third-party film copyright | § proprietary | ⚠️ | Public description of its facets and tagging depth | Concepts only: composable multi-facet AND-filtering with live visual results is exactly the AI-OFF experience v0.1 owes users, and its facet vocabulary confirms this is how practitioners think | **No corpus of film stills, scraped or otherwise.** Under our policy film stills are `unknown` and excluded by default. A gated paid library adds ToS exposure on top of copyright exposure |
| Film-Grab | closed site | ⚠️ UNVERIFIED — self-declared fair-use posture; owner states they do not own the imagery | ⚠️ | Secondary descriptions | Concepts only: provenance-first browsing ("more from this source") is a legitimate second axis and nearly free given `metadata.source` and `metadata.creator` | The fair-use posture itself. Fair use is a fact-specific defence applied inconsistently and commercial use weighs against it `(UNVERIFIED — legal question)`. A tool ingesting film frames at scale is not a review blog |
| Cinekive | `Gianluca-Improta/cinekive` | MIT | ✅ label | README, repository page, stack description | Concepts only, no code: local-first with an *optional* cloud VLM is shipped proof that AI-OFF can be a complete product; semantic embeddings plus metadata routing is our fusion ranker in practice; per-item rights badges on cards | Vendoring it — an Electron/Next.js/FastAPI/Qdrant stack is far heavier than our target and would couple UI, search and enrichment, which the brief forbids. Also refused: its ingestion of film frames, which reproduces the Film-Grab problem |
| Pinterest / Pinry | closed product / `pinry/pinry` | § proprietary / BSD-2-Clause | ⚠️ / ✅ label | Pinterest ToS; Pinry repository page | Concepts only, no code: the board as working memory — users collect long before they know why, so the modal must let references accumulate without forcing a decision and must never close mid-exploration | **No Pinterest scraping — a hard prohibition in the brief and in their ToS**, which bans robots, spiders, crawlers and scrapers. Pins carry no reliable licence metadata, so even a permitted import fails License Guard |
| Are.na | closed platform; client `ivangreene/arena-js` | § proprietary / MIT | ⚠️ / ✅ label | Public API documentation, client repository page | Concepts only, no code: **edge-carried metadata** — the single most transferable pattern in the survey. Keep `Reference` immutable and global and attach `{use[], weight, dominance}` to the *connection* between a reference and a mix, which is exactly what `ReferenceMix.references[]` is | Mirroring channels or treating public blocks as a licensed corpus — user-submitted links with no uniform licence. Also refused: the flat-channel UI |
| Eagle / Hydrus / Diffusion Toolkit | closed product / `hydrusnetwork/hydrus` / `RupertAvery/DiffusionToolkit` | § proprietary / **WTFPL v3** (file; label reads `NOASSERTION`) / MIT | ⚠️ / ✅ file (V1) / ✅ label | Eagle's public API docs; Hydrus LICENSE; Diffusion Toolkit README | Concepts only, no code: three coexisting retrieval modes behind one UI (exact tag, full-text, semantic) as shipped proof that AI-optional is buildable; namespaced tags as the model-free serialisation of a taxonomy; identity attaches to the record, not the file path | Reimplementing Eagle's proprietary API as a compatibility layer. Hydrus's booru-shaped flat unbounded tag model, which would dilute a controlled vocabulary. Critically: **none of the three stores per-asset licence provenance**, so copying their record shape would drop the field License Guard is built on |
| gpt-image-1 / Gemini reference-image features | closed products | § proprietary | ⚠️ (platform docs egress-blocked; reported image limits conflict wildly) | Public prompting guides | Concepts only: role assignment per reference ("image 1 for lighting, image 2 for wardrobe") means our structured mix can be *compiled down* into interfaces these APIs already understand — a graceful degradation path and a future formatter mode | Architecting around any one of them. Role assignment there is free text interpreted by a black box: unverifiable, non-deterministic, un-inspectable and silently version-dependent. Reported limits are ⚠️ UNVERIFIED and none is a safe constant |

### 4.6 C6 — Cinematography, camera and motion taxonomies

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| CameraBench | `sy77777en/CameraBench` | **CC BY-4.0** (file; platform label reads `NOASSERTION`) | ✅ file (V1) | LICENSE, README, published taxonomy axes | Concepts only, no data: **reference-frame qualification** — "tracking" is not a sibling of "dolly", it is the same translation in an object-centric frame; and label-then-caption annotation with an explicit *"I am not sure"* option, which is a direct implementation recipe for per-value confidence | Vendoring its taxonomy JSON or prompts into `data/taxonomy/` — CC BY-4.0 is a content licence, awkward on source, with mandatory attribution. Its videos are third-party internet media behind an access form. Its full primitive list is ⚠️ UNVERIFIED (§12). Cross-referenced from C8 |
| CineScale / CineScale2 | Mendeley dataset records | ⚠️ UNVERIFIED (every hosting domain egress-blocked; no licence file to read) | ⚠️ | Secondary descriptions of the class sets | Concepts only, no data: camera **angle** and camera **level** are orthogonal axes — a shot can be neutral-angle at ground level, which is why "low angle" behaves unpredictably in tools that merge them. Our resolution is modifier nodes inside `camera_angle` (§13) | Frames, annotation files and derived weights, until the licence is actually verified. Our own License Guard rule — an unverified licence never reaches `approved` — applies to research datasets exactly as to reference media |
| MovieShots / MovieNet (SGNet) | `movienet/movienet-tools`; reproduction `sssabet/Shot_Type_Classification` | ⚠️ UNVERIFIED (dataset) / MIT (reproduction) | ⚠️ / ✅ label | Class definitions as published | Concepts only, no data — and here the *negative* lesson is the valuable one: "long shot" is the widest class here but a mid-wide class elsewhere, which is why canonical ids plus source-scoped alias tables are mandatory (§8.3) | Frames from copyrighted trailers; the annotations; and republishing its class list as if it were ours. Also refused: its definition of "push" as "camera zooms in", which fuses a physical dolly with a focal-length change and cannot round-trip to a model exposing both |
| AVE — Anatomy of Video Editing | `dawitmureja/AVE` | **⛔ none** (verified absence; authors state they do not own the clips) | ✅ absence | README and its documented annotation keys | Concepts only, no data: clearest evidence at scale that **framing and shot size are different fields** — "medium" and "two-shot" are simultaneously true; and that steadiness belongs under camera motion rather than as a separate style tag | Its annotations, and its clip-acquisition workflow (annotations via a drive link, clips re-downloaded from a video platform) — a workflow the brief prohibits. Reviewed as prior art only |
| ShotBench / ShotVL | `Vchitect/ShotBench` | **⛔ none** (verified absence: no root LICENSE, `/blob/main/LICENSE` 404s) | ✅ absence | Repository listing, published dimension list | Concepts only, no data: **lens size as a categorical dimension** (wide / normal / long / telephoto / macro) rather than a numeric focal length — a lens class is defensible from a frame, a millimetre figure is not, which is exactly the brief's lens rule arrived at independently | Its evaluation data, its QA text, and its option strings as our shipped vocabulary. Read-only prior art |
| CineTechBench | `PRIS-CV/CineTechBench` | **CC-BY-NC-ND-4.0** | ✅ file | LICENSE, distribution model | Concepts only, no data: its metadata-and-hyperlinks-only distribution independently confirms that "no media binaries, store URLs and metadata" is standard practice for serious research groups, not a self-imposed limitation | **Everything else — a hard stop.** NC, ND and share-alike constraints at once. No importing its annotations, no redistributing a modified version, and no CineTechBench-derived value may ever reach `approved` |
| PySceneDetect | `Breakthrough/PySceneDetect` | BSD-3-Clause | ✅ file | LICENSE, `content_detector.py`, `adaptive_detector.py`, `scene_manager.py` | Concepts only, no code: downscale before measuring; and the **ratio-to-rolling-average test** that stops a whip pan being read as a cut — load-bearing for us, since whip pans are exactly what users want to extract. Implemented from the described algorithm (§10, ALG-1) | Vendoring or transliterating its detector source. BSD-3-Clause is fine as a dependency but the brief prohibits copying code; if it ever becomes a dependency the copyright notice and disclaimer go in `THIRD_PARTY_NOTICES.md`. Also refused: its mental model that the output is an editing scene list. Cross-referenced from C8 |
| movie_shot_classification_dataset | `magcil/movie_shot_classification_dataset` | MIT (repo — **not** the underlying film shots) | ✅ file | LICENSE, class list | Concepts only, no data: its class names separate travelling-in/out from zoom-in — dolly is not zoom, encoded in the label set itself; and its extreme class imbalance is a warning that any camera-motion analyzer will look accurate while missing every interesting move | The media. MIT covers the repo's own contents and does not clear third-party film shots |
| shot-type-classifier | `rsomani95/shot-type-classifier` | **CC-BY-NC-4.0** | ✅ file | README licence section, class list | Concepts only: the single clearest piece of evidence for our alias requirement — three sources, three incompatible conventions for the same ladder | The weights (cannot ship, cannot bundle as an adapter in a commercially capable product) and its class list as our shipped vocabulary. NC is excluded by default under our policy. Cited only |
| ComfyUI-AdvancedCameraPrompts | `jandan520/ComfyUI-AdvancedCameraPrompts` | MIT | ✅ file | LICENSE, README, its dual output | Concepts only, no code: dual structured + natural-language output independently validates the `StructuredPrompt` → `formatPrompt` split; subject-distance ranges per shot size are a useful grounding aid for a visual picker | The code (MIT permits it; the brief does not). **And its epistemics**: it asserts focal length and sensor size as facts in JSON. An emitted `focal_length: 35` derived from one image is a fabrication and the lens rule forbids it |
| xoxxel/camera-prompts | `xoxxel/camera-prompts` | MIT (per README licence section; `LICENSE` blob 404'd at the paths tried, so the label is ⚠️ unconfirmed) | ✅ file (README section) | README structure and term groupings | Concepts only, no data: pairing every vocabulary term with a canonical example image is the cheapest way to make an unfamiliar taxonomy usable — and it works with AI OFF, which v0.1 requires. Our taxonomy nodes carry `visual_hint` for exactly this | Its example PNGs. MIT on a Markdown library does not clear the film frames illustrating it. Our exemplars must come through License Guard from Commons or Openverse under PD/CC0/CC BY only |
| ai-shortfilm-prompts | `jnMetaCode/ai-shortfilm-prompts` | MIT (skill/templates) over **all-rights-reserved third-party prompts** | ✅ file | README, licence statement, structure | Concepts only: a **per-model capability record** — target models differ in duration ceiling, negative-prompt support and filter strictness, so a formatter mode needs a capability record, not just a string template (§13) | Its templates and embedded prompts. This is the perfect trap our review exists to catch: a permissive wrapper around all-rights-reserved content, where an automated "MIT therefore safe" check is simply wrong. Also refused: its advice to specify real lens nomenclature, and one-click genre template packs |
| MiniMax Hailuo "Director" commands | closed product | § proprietary | ⚠️ (vendor docs and mirror both egress-blocked) | Public command documentation as reported | Concepts only: its axis decomposition is textbook-correct and anchors our canonical ids — truck vs pan is translation vs rotation, pedestal vs tilt likewise, and **push-in and zoom-in are distinct commands in a shipping product**, which is the commercial proof our taxonomy must not merge them | Documentation text, and its bracket strings as our canonical ids. Brackets are a surface form a formatter mode produces, downstream of canonical values |
| Kling `camera_control` | closed product; parameters mirrored in `griptape-ai/griptape-nodes-library-kling` | § proprietary / Apache-2.0 (integrator) | ⚠️ / ✅ label | Public parameter documentation via the integrator | Concepts only: motion **intensity** as a first-class parameter, and named composite moves that occupy the same slot as their components — so the conflict detector must know a composite conflicts with its parts | Vendoring the integrator's code. **Axis warning recorded:** its documentation describes pan and tilt on axes inverted relative to standard cinematography and to another vendor's own commands. Whether this is a doc error or real behaviour is unresolved; a Kling formatter mode may not ship until validated empirically (§12) |
| Runway Gen-3/4 camera vocabulary | closed product | § proprietary | ⚠️ (help centre egress-blocked) | Public reference library as reported | Concepts only: two formatter rules — the composite phrase pattern `[steadiness] + [angle] + [motion] + "shot"` means a formatter must *compose across* fields into one clause rather than emitting one line per field; and negative camera phrasing is discouraged, so `camera_motion.static` must render positively | Its help-centre text and example media. Also noted: its model generations are already being retired, a reminder that hardcoding a mode name would violate the brief |
| Google Veo 3.1 prompt guide | closed product | § proprietary | ✅ (the one vendor guide reachable during research) | Published prompt formula and vocabulary | Concepts only: **cinematography-first ordering** as one formatter mode among several with genuinely different orderings — the strongest single argument for separating `StructuredPrompt` from `formatPrompt` | Its guide text and examples. Also refused: its flattened "composition" grouping (which lumps two-shot, wide/medium and low/high together) as our internal schema — our canonical layer keeps them apart and the formatter flattens on the way out, never the reverse |
| Wan 2.1 / Wan 2.2 | `Wan-Video/Wan2.2`, `Wan-Video/Wan2.1` | Apache-2.0 | ✅ file | README, licence statement, prompt-extension description | Concepts only: a prompt-extension step is architecturally the same separation we have — and a warning, since an expansion step can overwrite user intent. Ours must be a proposal the user can reject | Its weights as a default, and community folklore: the widely circulated lists of Wan camera verbs come from third-party guides, **not** from the vendor README, and must not be encoded in a formatter as if they were a vendor contract |
| LTX-Video | `Lightricks/LTX-Video` | Apache-2.0 (repository) / **OpenRAIL-M (weights)** | ✅ file | LICENSE, README prompt guidance | Concepts only: a **hard length budget with a documented drop order** — a formatter must support a per-mode word budget and per-mode field ordering, because a generic serialiser that dumps every array blows past it and degrades output | The weights under the assumption that the repo badge covers them. This row is a second canonical V3 case and a reason License Guard records *what* an entity licenses, not just an SPDX string |

### 4.7 C7 — Licence-safe media source APIs (our provider layer)

These are the only projects in the survey we intend to *use*, and we use them the way they are meant to be used: over HTTP, anonymously where possible, with their own licence metadata carried through into `Reference.metadata`.

| Project | Repository / endpoint | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| Openverse API | `WordPress/openverse` — `api.openverse.org/v1/` | MIT (application) | ✅ file | LICENSE, licence-constant and media-type source, serializers, throttle and CORS settings | Concepts only, no code: licence *grouping* as one user-facing switch instead of seven checkboxes; and dead-link filtering as a reason our `source_validation` step should HEAD-check liveness before `approved`. We call the API; we do not reuse the software | Their Django/DRF serializers, viewsets and frontend. No mirroring of the catalogue into `data/references.json`. **And a specific trap:** its `license_type=commercial` grouping still admits `by-nd`, and `modification` still admits `by-nc` — neither matches our policy, so we filter with explicit licence codes |
| Wikimedia Commons — Action API + CommonsMetadata | `wikimedia/mediawiki`, `.../CommonsMetadata` — `commons.wikimedia.org/w/api.php` | **GPL-2.0** | ✅ file | `COPYING`, `TemplateParser.php`, `DataCollector.php`, `ApiQueryImageInfo.php`, CORS handling, media-type constants | Concepts only, no code: **`AttributionRequired` as an explicit boolean** is the single most reusable idea in the cluster — the source *states* the obligation rather than making us infer it from a licence string, which is precisely `metadata.requires_attribution`. Also: server-side thumbnailing makes `thumbnail_url` a derived URL and never a stored byte | **Any PHP.** GPL-2.0 is copyleft; calling the API over HTTP is not a derivative work, vendoring the extension would be. Also refused: scraping category trees into `data/taxonomy/` (our vocabulary is our own), re-hosting media, and importing free-text descriptions as if they were structured intent |
| Europeana Search API | `europeana/labs-preview` (docs), `europeana/rd-europeana-python-api` (client) | **EUPL-1.2** (client repo; **service terms not verified** ⚠️) | ✅ file (client) | Search documentation, client repository | Concepts only, no code: `reusability` as a three-valued trust ladder (open / restricted / permission) rather than a boolean, mapping cleanly onto `approved` / `license_review` / `rejected` so restricted content stays visible and explained | The Python client — EUPL-1.2 is copyleft. Bulk harvesting. And the pattern of baking an API key into a static page's query strings, which leaks it in the network tab |
| Smithsonian Open Access | `Smithsonian/OpenAccess` — `api.si.edu` | CC0-1.0 (metadata) | ✅ label | Repository page; a third-party ingester's field mapping | Concepts only, no data: **per-asset `usage.access`** rather than per-record rights — bind the licence to the media asset actually displayed, because record-level and media-level rights are different things | Mirroring the record dump. CC0 would legally permit it; the brief's no-bulk-storage rule does not. Also refused: assuming the dataset's CC0 label covers every linked asset. Repository archival status makes live availability ⚠️ UNVERIFIED (§12) |
| The Met Open Access | `metmuseum/openaccess` — `collectionapi.metmuseum.org` | CC0-1.0 (**metadata only**) | ✅ label + README statement | README, API field list | Concepts only, no data: a single unambiguous boolean as the entire licence gate — where a source gives us one, `license_check` short-circuits on it and `false` routes to `rejected`, not `license_review` | **Treating the CC0 metadata waiver as covering images.** The README states plainly that images are not included and not part of the dataset. This is the exact mistake the "unverified licence can never reach approved" rule exists to prevent. Also: no CSV dump |
| Flickr API (incl. Commons) | service; client `Flickr-Foundation/flickr-photos-api` | § proprietary (service) / Apache-2.0 **OR** MIT (client) | ✅ file (client, incl. a recorded live licence table) | Client repository, licence-id table, API shape | Concepts only, no code: numeric licence ids force an explicit **per-provider mapping table** (id → canonical `LICENSE_ID` + canonical URL) held as *data*, so adding a provider never means editing guard logic | Scraping galleries, bulk downloading, or treating all-rights-reserved content as usable. **Critically:** its "no known copyright restrictions" and "US Government Work" ids are institutional assertions, not CC grants — they route to `license_review`, never auto-`approved` |
| Pexels API | closed product | § **proprietary** — explicitly *not* Creative Commons | ⚠️ (docs read via a third-party mirror) | Mirrored official documentation: auth, params, response shape, rate limits | Concepts only: a **named ladder of derivatives** rather than one URL, plus an average-colour placeholder — informing how many named thumbnail sizes a card grid and a detail drawer need | Everything else. Their terms state you may not replicate core functionality. Independently, it exposes no per-item licence field at all, only one blanket proprietary licence, so under our policy a Pexels item maps to `unknown` and **can never reach `approved`**. No caching of its media; never presented beside CC BY results without a distinct badge |
| Unsplash API | service; client `unsplash/unsplash-js` | MIT (**client library only**); photos under a proprietary Unsplash Licence | ✅ label (client); photo terms ⚠️ UNVERIFIED | Client README and its stated integrator obligations | Concepts only: the *shape* of an obligation model — a source can require attribution, hotlinking **and** an event ping. This generalises `requires_attribution` into an extensible obligation set (§13) | The client library, and the source itself as a provider. Never describing the Unsplash Licence as Creative Commons or public domain. Its mandatory download ping is an outbound call our privacy rules would require us to disclose before it fires |
| Rijksmuseum Data Services | institutional service | ⚠️ UNVERIFIED (no licence file; host egress-blocked) | ⚠️ | Public service description | Concepts only: IIIF as a derivative strategy — one canonical URL yielding arbitrary server-side crops and sizes fits the no-binaries rule better than storing our own image pyramid, and would let a detail view zoom into a *region* when isolating composition or clothing | Any dependency. **"Museum" does not mean "public domain."** Without a per-object licence statement we can read, every item is `license_review` at best. Not added as a provider until a statement is verified |
| NYPL Digital Collections | `NYPL-publicdomain/data-and-utilities` — `api.repo.nypl.org` | CC0-1.0 (**metadata snapshot repo**; live API terms not verified) | ✅ label | Repository README statement | Concepts only, no data: metadata may be CC0 while the item is not public domain — motivating a `metadata_license` field separate from the media `license` (§13) | Building a dependency on it: the Repo API is reported deprecated with no public replacement ⚠️ (§12). Also refused: inferring item-level public-domain status from a CC0 metadata dedication |

### 4.8 C8 — Video understanding, frame sampling and local VLM runtimes

| Project | Repository | Licence | Verified? | What we looked at | What we took | What we deliberately did not take |
|---|---|---|---|---|---|---|
| TransNetV2 | `soCzech/TransNetV2` | MIT | ✅ label | Repository page, inference README, input contract | Concepts only, no code or weights: a state-of-the-art shot detector runs on a ~1,300-pixel thumbnail — licence to downscale aggressively; and its two-head design (hard label + soft per-frame score) is the model for emitting a label *and* a confidence, never a bare label | Making it a dependency — it needs a deep-learning framework plus a weight download, which would break "AI OFF is a complete product". Per-weight terms were not separately visible, so no weights are redistributed |
| FFmpeg | `FFmpeg/FFmpeg` | **LGPL-2.1-or-later** (GPL-2.0-or-later with `--enable-gpl`; `--enable-nonfree` builds are not redistributable) | ✅ file | `LICENSE.md`, `vf_scdet.c`, `f_select.c` | Concepts only, no code: its scene score is already normalised 0..1, which is the shape a confidence field wants; and keyframe flags point at the cheapest sampler of all — decode only I-frames, since keyframes are the encoder's own opinion about where the picture changed (§10, ALG-2) | Linking it into a distributed artefact without the LGPL homework (dynamic linking, relinking rights, notices). **No `--enable-gpl` or `--enable-nonfree` build is ever shipped.** Conceptually, also refused: treating a scene score as a motion signal — it detects cuts and says nothing about pan versus dolly |
| RAFT | `princeton-vl/RAFT` | BSD-3-Clause | ✅ label | Repository page, method description | Concepts only, no code or weights: use it as an **offline oracle** — run it once on a small labelled clip set to calibrate the thresholds of our cheap estimator, then ship only the cheap one | Shipping it. PyTorch, weights and a GPU are each individually disqualifying against local-first and AI-optional. Also refused: adopting anyone's published thresholds as universal |
| OpenCV | `opencv/opencv` | Apache-2.0 (current default branch) | ✅ label | Repository page; the published behaviour of its geometric estimators | Concepts only, no code: the 4-DOF partial-affine parameter vector maps almost one-to-one onto our camera-motion vocabulary, and a single global homography **cannot** separate dolly-in from zoom-in on a planar scene — an irreducible geometric fact that makes ambiguity a UI feature rather than an accuracy failure (§10, ALG-4) | Reflexively shipping `opencv.js` — a multi-megabyte WASM download for a few hundred lines of least squares is a real first-paint cost. Exact signatures and RANSAC defaults are ⚠️ UNVERIFIED (docs host egress-blocked) |
| Qwen3-VL | `QwenLM/Qwen3-VL` | Apache-2.0 (repo); **per-checkpoint weights ⚠️ UNVERIFIED** | ✅ file (repo) | LICENSE, README, processor defaults | Concepts only, no weights: concrete published defaults for what "representative frames" means to a VLM — a sourced operating point (low frame rate, capped frame count, bounded pixel budget) that we make *shot-aware* rather than uniform | Hardcoding the model name anywhere; shipping weights; assuming checkpoint terms match the repo. Also refused: letting its prose leak into the product as prose, and letting it assert lens as fact |
| llama.cpp (llama-server, libmtmd) | `ggml-org/llama.cpp` | MIT | ✅ label | Repository page, `docs/multimodal.md` | Concepts only, no code: the **two-file model contract** means a local analyzer's config is an object, not a string, and "vision unavailable" must be a first-class UI state; and because it speaks an OpenAI-compatible surface, implementing that contract once covers four runtimes | Building the analyzer around runtime-specific surfaces. Anything outside the OpenAI-compatible surface sits behind an optional capability flag. It is consumed over HTTP as a *user-supplied* local server, never bundled |
| Ollama | `ollama/ollama` | MIT | ✅ label | Repository page; API surface (docs host egress-blocked ⚠️) | Concepts only, no code: model **discovery** — a settings UI can list what the user already has installed instead of asking them to type a model name, which is the practical way to honour "model names must never be hardcoded"; and embeddings and chat sharing one base URL means the analyzer and embedding adapters can share one connection config | Assuming its compatibility layer is universal or bug-free; making image analysis a hard requirement. Its exact documentation wording is ⚠️ UNVERIFIED |
| vLLM | `vllm-project/vllm` | Apache-2.0 | ✅ label | Repository page; multimodal content types (docs host egress-blocked ⚠️) | Concepts only, no code: its whole-video input type is the temptation we consciously **refuse** — sending sampled frames instead is portable across every runtime, an order of magnitude cheaper, and privacy-legible, because we can show the user exactly which frames will be transmitted | Its GPU-server assumptions in a product whose MVP is a static web app. And the whole-video upload path, which collides with local-first processing |
| MLX-VLM | `Blaizzy/mlx-vlm` | MIT | ✅ label | Repository page, README, server endpoints | Concepts only, no code: it serves chat, embeddings **and** rerank from one process — strong evidence that our three adapters should be thin functions over one shared connection config, and that the hybrid-search plan is something one local machine can actually serve | Making Apple Silicon a first-class assumption; baking quantization suffixes into config defaults. Also refused: captioning as the output — a caption is prose, the exact failure the brief forbids |
| LM Studio (`lms` CLI) | `lmstudio-ai/lms` | MIT (**CLI only**; the desktop app is proprietary ⚠️) | ✅ label | Repository page | Concepts only, no code: it reinforces the single most important runtime conclusion — an OpenAI-compatible endpoint is the lingua franca, so our settings ship *base-URL presets* rather than per-vendor integrations | Its onboarding model — "download a multi-gigabyte model to try the app" would destroy v0.1, which is explicitly no-AI-required. And describing LM Studio as open source, which the desktop app is not |
| WebCodecs + mp4box.js | `w3c/webcodecs` (spec), `gpac/mp4box.js` | Spec (no software licence applies) / BSD-3-Clause | ✅ file (mp4box.js) | Explainer, LICENSE, demuxer capabilities | Concepts only, no code today: the browser gives you a decoder but **not** a demuxer, and the payoff is that a container's sample table exposes keyframe timestamps *before any decoding* — the cheapest possible sampler. Pre-screened as an admissible future dependency (§7.4) | Vendoring mp4box.js into `src/` — it would be a declared dependency with its notice recorded, never a copy. Also refused: assuming one container format, and leaking decoded frame objects, which hold system memory |
| `requestVideoFrameCallback` | `WICG/video-rvfc` | ⚠️ UNVERIFIED (spec repository; no software licence relevant to us) | ⚠️ | Explainer and its metadata fields | Concepts only, no code: two sampling patterns — seek-and-grab for shot-representative frames, play-and-sample for the motion estimator, which needs consecutive frames at a known stride. This is the zero-dependency path that makes AI-OFF video analysis genuinely complete rather than a degraded demo | Building on frame-timing heuristics the API exists to replace. And a hard constraint noted rather than taken: reading pixels from a cross-origin video taints the canvas, so remote provider video cannot be analysed unless CORS permits (§12) |
| ffmpeg.wasm | `ffmpegwasm/ffmpeg.wasm` | MIT (wrapper) over an **LGPL-2.1-or-later** core (or GPL, depending on build flags — core build ⚠️ UNVERIFIED) | ✅ label (wrapper) | Repository page; the licence stack | Concepts only: the loading strategy — a multi-megabyte WASM payload must never be on the critical path of first render, and is fetched only after a user drops an unsupported file | Adopting it as a default. **The licence stack is the hazard**: an MIT wrapper around an LGPL core means the *core's* build licence governs, with relinking rights to preserve. If ever adopted it is an optional, lazily loaded capability with its core licence recorded explicitly, and it is never conflated with the CC pipeline for reference media |

---

## 5. What the survey's licence distribution means for us

```
   108 rows
   ├── permissive (MIT / BSD / Apache-2.0 / dual) ......... usable in principle,
   │                                                        used in practice: 0
   ├── copyleft (GPL-3.0, AGPL-3.0, EUPL-1.2, GPL-2.0) .... code never touched;
   │                                                        Commons is called over HTTP
   ├── non-commercial (CC BY-NC / NC-SA / NC-ND) .......... excluded by the same rule
   │                                                        that excludes an NC photograph
   ├── no licence at all (8 repositories) ................. all rights reserved.
   │                                                        prior-art reading only
   ├── licence-mismatch cases (label ≠ file) .............. the file wins, every time
   └── proprietary / closed products ...................... reviewed as behaviour,
                                                            never as source
```

Three consequences we act on:

1. **Permissive availability changed nothing.** Roughly half the survey would have let us vendor code. The count of files we vendored is zero. This is deliberate and is the point of §3 — our defensibility does not depend on anyone's licence terms holding up.
2. **The dangerous rows are not the copyleft ones.** GPL and AGPL are loud; a competent engineer avoids them. The rows that would actually have burned us are the quiet ones: an MIT skill wrapping all-rights-reserved prompts, an Apache-2.0 toolbox over research-gated data, an Apache-2.0 repository whose checkpoints are unlicensed, a permissive repo whose payload is scraped images. Rules V1–V5 exist because of those rows specifically.
3. **"No licence" is the single most common failure mode in this ecosystem**, and it correlates with popularity rather than against it. Our answer is uniform: absence is denial, read it as prior art, say so in writing, take nothing.

---

## 6. Prior art we implement from description, not from source

Five places where a published algorithm or scoring rule genuinely informed our implementation. In each case we implemented from the *described* method — the same way one implements quicksort from a textbook — and the citation below is the acknowledgement that earns. No source was read into the implementation, and none of these creates a licence obligation.

| Id | Our module | The idea, as published | Cited prior art | Why we did not just depend on it |
|---|---|---|---|---|
| **ALG-1** | shot segmentation (v0.4) | A cut is a *local outlier*: compare a frame-difference score both against an absolute threshold and against a rolling average of its neighbourhood, so a sustained fast pan does not register as a boundary | PySceneDetect (BSD-3-Clause) | It is a Python/OpenCV library; our MVP is a browser with no build step. The idea is a dozen lines; the dependency is a runtime |
| **ALG-2** | frame sampling (v0.4) | Two cheap samplers: a normalised 0..1 frame-difference score, and decode-only-keyframes using the container's own sync-sample table | FFmpeg (LGPL-2.1-or-later); WebCodecs + mp4box.js | Linking FFmpeg carries LGPL obligations for a job the browser already does. The keyframe idea needs a demuxer, not a media framework |
| **ALG-3** | analyzer adapter (v0.2+) | Pre-embed a controlled vocabulary once, cache the embeddings, rank an image against it by dot product, and keep the per-category label rather than joining everything into one string | CLIP Interrogator (MIT code; its label *files* are refused) | The value is the method, not the corpus. Applied per taxonomy category over our own `data/taxonomy/*.json`, it fills `VisualIntent` with confidences and no captioner at all |
| **ALG-4** | camera-motion estimation (v0.4) | Downscale to greyscale, find sparse correspondences, RANSAC-fit a 4-DOF partial affine, accumulate over a shot, classify. Sustained translation → pan/tilt; sustained rotation → roll; high per-step variance with near-zero cumulative sum → handheld; uniform scale growth → the *ambiguous* dolly/zoom family | OpenCV (Apache-2.0); RAFT as an offline calibration oracle (BSD-3-Clause) | `opencv.js` is a multi-megabyte download for a few hundred lines of least squares. RAFT cannot ship at all under local-first constraints |
| **ALG-5** | keyword search (v0.1) | Score an inverted index over label, aliases, description and one related-node hop, with tiered weights for exact/prefix/substring matches and a per-node boost | Conventional information-retrieval practice; the *shape* of the tiers is our own, specified in [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) | No dependency exists that would know our taxonomy's edge semantics |

**The rule this encodes.** An idea described in a README or a paper is knowledge; a file in a repository is expression. We take the first freely and cite it, and we take the second never. Where the line is genuinely unclear — a scoring formula short enough that any implementation looks alike — we cite anyway, because the cost of a citation is zero and the cost of an unrecorded borrowing is not.

---

## 7. Dependency policy

### 7.1 Current state: zero

**The MVP has no runtime dependencies.** `app/index.html` loads vanilla ES modules from `src/`. There is no bundler, no package manager manifest for runtime code, no transpiler, no framework, no polyfill. [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) therefore contains no package entries — it exists so the obligation is recorded *before* the first dependency is ever added, not after.

This is a design decision, not an accident of earliness. It buys four things the brief needs: a static page that runs from any file server (privacy: no build server sees the code, no CDN sees the user); an audit surface small enough that §3's clean-room claim is checkable by reading the tree; zero transitive-licence risk; and no supply-chain surface for a tool that will handle users' private media.

### 7.2 The admission gate

```
   candidate dependency
        │
        ▼
   ┌────────────────────────────────────────────────────────┐
   │ G1  Is it genuinely necessary?                          │  no ──► rejected
   │     Can the same job be done in <200 lines we own?      │        (default answer)
   └────────────────────────────────────────────────────────┘
        │ yes
        ▼
   ┌────────────────────────────────────────────────────────┐
   │ G2  Licence is permissive: MIT, BSD-2/3, ISC,           │  no ──► rejected
   │     Apache-2.0, or dual-licensed including one of those.│        no exceptions
   │     Read from the LICENSE FILE, not a platform label.   │        for runtime code
   └────────────────────────────────────────────────────────┘
        │ yes
        ▼
   ┌────────────────────────────────────────────────────────┐
   │ G3  Full transitive tree checked to the leaves for      │  fail ──► rejected
   │     copyleft, source-available, non-compete and         │
   │     "custom" licences. Depth is not an excuse.          │
   └────────────────────────────────────────────────────────┘
        │ pass
        ▼
   ┌────────────────────────────────────────────────────────┐
   │ G4  It does not import a concrete AI backend, does not  │  fail ──► rejected
   │     phone home, does not fetch code or weights at       │
   │     runtime without explicit user action.               │
   └────────────────────────────────────────────────────────┘
        │ pass
        ▼
   ┌────────────────────────────────────────────────────────┐
   │ G5  Licence text reproduced in THIRD_PARTY_NOTICES.md   │
   │     under a `## <package>` heading; a row added to §7.4 │
   │     here; the pinned version recorded.                  │
   └────────────────────────────────────────────────────────┘
        │
        ▼  admitted
```

**G2's rejected classes, stated positively.** GPL (any version), LGPL, AGPL, EUPL, MPL-with-file-level-obligations-we-would-have-to-honour, SSPL, BUSL, Elastic, "commons clause", CC BY-NC anything, CC BY-ND anything, non-SPDX self-authored grants, and **no licence at all**. LGPL deserves a specific note: it is not categorically impossible, but a WASM or statically linked LGPL artefact carries relinking obligations that a static single-page app cannot honour cleanly, so LGPL is rejected for anything linked into the page. An LGPL or GPL tool may still be *used* — as a separate process the user runs, behind an adapter, over HTTP or a CLI boundary — which is exactly how FFmpeg and any GPL inference backend are treated.

**G4 exists because of a specific survey finding.** Several node packs auto-download model weights at runtime while stating no licence for them, and one browser ML library fetches weights from a remote hub on first use. Under our privacy rules any such transmission must be disclosed in the UI before it happens, with the download size shown and the user's explicit action required. A dependency that makes that impossible is rejected regardless of its own licence.

### 7.3 Where dependencies are and are not permitted

| Zone | Dependency policy | Rationale |
|---|---|---|
| `src/core/`, `src/prompt/`, `src/reference/` | **Zero, permanently.** No dependency, ever | These are the modules the ComfyUI node reuses. Any dependency here becomes a dependency of the node too |
| `src/search/` | Zero for keyword and metadata search. An ANN or vector-store dependency may be admitted for the semantic path only, behind the existing interface | Brute-force cosine is the honest baseline; ANN is an optimisation that must be removable |
| `src/ai/` | Zero *shipped*. Backends are user-supplied processes reached over HTTP. A browser inference runtime may be admitted as an explicitly opt-in, lazily loaded capability | This is how "AI OFF is a complete product" and "no hardcoded backends" stay true simultaneously |
| `src/providers/` | Zero. `fetch` is the whole client | Every provider in §4.7 is a plain HTTP API |
| `src/ui/` | Zero, permanently. No framework | The brief forbids coupling UI with the prompt engine; a framework is the most common way that coupling happens |
| `tests/` | Dev-only dependencies permitted under G2–G3, recorded separately from runtime | Dev tools do not ship, but their licences still get read |

### 7.4 Pre-screened candidates

These are the only external packages any milestone currently anticipates. Each has passed G2 on a read licence and is recorded here so that admitting it later is a decision, not a drift. **None is currently a dependency.** Being listed here grants nothing; the gate still runs.

| Candidate | Licence | Verified | Earliest milestone | Gate status |
|---|---|---|---|---|
| `mp4box.js` | BSD-3-Clause | ✅ file | v0.4 (video demuxing) | G1–G4 provisionally pass. Needed only if `requestVideoFrameCallback` proves insufficient — which it may not, making this avoidable |
| `transformers.js` | Apache-2.0 | ✅ file | v0.3 (browser embeddings) | G4 requires a user-initiated, size-disclosed model download. Admissible only with that UI in place |
| ONNX Runtime Web | MIT | ✅ file | v0.3 (transitively) | Pre-cleared as a transitive of the above |
| `sqlite-vec` | Apache-2.0 OR MIT | ✅ label | v0.3 (local vector store) | Requires a licence-file read before admission (label is weaker evidence). Self-declared pre-v1, so pinning is mandatory |
| `usearch` | Apache-2.0 | ✅ label | v0.3+ (ANN, optional) | Same: file read required. Only if brute force measurably fails at the real library size, which it may never |
| **Rejected outright** | | | | |
| `voy` | Apache-2.0 OR MIT | ✅ label | — | Fails G1: full index rebuild on resource update is incompatible with continuous reference approval |
| `ffmpeg.wasm` | MIT wrapper / **LGPL core** | ✅ label (wrapper) | — | Fails G2 at the core. Only reconsidered as a lazily loaded optional capability with the core's build licence read and recorded, and never as a default |
| `opencv.js` | Apache-2.0 | ✅ label | — | Fails G1: a multi-megabyte download for a few hundred lines of geometry we implement ourselves (ALG-4) |

---

## 8. Dataset and taxonomy provenance

### 8.1 The claim

**Our taxonomy is authored by us.** Every node in `data/taxonomy/*.json` — its id, label, aliases, description, `prompt_fragment`, `parent`, `exclusivity_group` and `conflicts_with` edges — is written for this product. No label file, attribute list, tag dump, class enumeration or annotation vocabulary from any surveyed dataset was copied, converted or machine-transformed into it.

### 8.2 The vocabulary question, stated honestly

Our taxonomy contains the words "low angle", "rim light", "dolly in", "rule of thirds", "medium long shot". So do several datasets in §4. That is not because we copied them; it is because they are the terms of art of cinematography and have been for a century.

**Our engineering position:** individual terms of art from a shared professional vocabulary are facts about a field, not creative expression, and using them is not copying `(UNVERIFIED — legal question)`. What *would* be copying is taking a specific curated *selection* and *arrangement* — a particular 294-attribute list, a particular 13-class enumeration, a particular ordering with particular groupings — because selection and arrangement is where a dataset's authorship actually lives.

We therefore hold ourselves to a stricter line than the legal one:

| Practice | Status |
|---|---|
| Using the term "medium long shot" | Fine. It is the field's word |
| Recording that three sources disagree about whether "long shot" is the widest class, and building `aliases[]` so both conventions map in | Fine, and necessary. The *disagreement* is the finding; the alias table is ours |
| Copying a dataset's class list verbatim as our value set | **Refused**, even where the licence permits it |
| Copying a dataset's supercategory grouping as our `exclusivity_group` assignment | **Refused.** We took the *idea* that values need an axis; the axes we ship are our own |
| Deriving our vocabulary by transforming an annotation file | **Refused.** A transformation of a corpus is a derivative of that corpus |

**Practical consequence for whoever authors `data/taxonomy/*.json`:** write each node from the concept, not from a source list open in another window. Where a term genuinely comes from one identifiable place, put it in `aliases[]` with a note rather than in `label`, and if the source's terms would ever require attribution, that node does not ship until §12's queue clears the source.

### 8.3 The alias requirement, and why it is a provenance safeguard as well as a feature

The survey found three mutually incompatible shot-size ladders and two contradictory pan/tilt axis conventions. A single flat string vocabulary silently mismatches across them. Our model is three layers:

```
   canonical id                     aliases[]                          formatter output
   ─────────────                    ─────────                          ────────────────
   camera_distance.medium_long  ◄── "MLS", "full shot",           ──►  per formatter_mode
   (ours, stable, lowercase,         "American shot", "cowboy shot"     via model_hints
    two dotted segments)             (spellings and jargon, ours)       or prompt_fragment
```

Because layer 1 is ours and stable, an external vocabulary maps *into* layer 2 without forking the tree — and because layer 2 is a list of spellings rather than an imported table, mapping in a new source's terminology never imports that source's arrangement. Provenance and interoperability are served by the same mechanism.

### 8.4 Datasets: excluded, and why

Every dataset below was read *about*. None was downloaded into this repository, none contributed a value to our taxonomy, and no model shipped or defaulted by this product is trained on any of them.

| Dataset | Terms | Class | Status |
|---|---|---|---|
| DeepFashion | Reported research-only, signed institutional release ⚠️ | Research-gated | **Excluded.** Working assumption: no commercial use, no redistribution, until proven otherwise |
| DeepFashion2 | ⛔ No licence; Google Form issuing an unzip password | Research-gated + unlicensed | **Excluded.** A password is not a licence (V5) |
| VITON-HD | CC BY-NC-4.0, "research purposes only" | Non-commercial | **Excluded** |
| Dress Code | Bespoke agreement; "will not be released to private companies" | Proprietary, exclusionary | **Excluded.** Structurally unavailable to us |
| Polyvore | Apache-2.0 repo over crawled images with unaddressed rights; dead URLs, unofficial mirror | Permissive wrapper / unlicensed payload | **Excluded** (V4) |
| Fashionpedia | Reported CC BY 4.0 ⚠️, primary terms page unread | Attribution licence, unverified | **Blocked pending §12.** Even if confirmed, it would require a notices entry — a reason to author our own values regardless |
| Fashion-IQ | CDLA, variant unconfirmed ⚠️ | Possibly copyleft data licence | **Blocked pending §12.** Under the sharing variant our published derivatives inherit obligations |
| CineScale / CineScale2 | ⚠️ Unverified, hosts unreachable | Unknown | **Blocked.** Same rule as reference media: unverified never reaches approved |
| MovieShots / MovieNet | ⚠️ Unverified; frames from copyrighted trailers | Unknown + third-party copyright | **Excluded** |
| AVE | ⛔ No licence; authors state they do not own the clips | Unlicensed | **Excluded** (V2) |
| ShotBench / ShotQA | ⛔ No licence file | Unlicensed | **Excluded** (V2) |
| CineTechBench | CC BY-NC-ND-4.0 | NC **and** ND | **Excluded.** Three blocking constraints at once |
| CameraBench | CC BY-4.0 (file) ✅ | Attribution content licence | **Not vendored.** Cited as prior art; its videos are third-party media behind an access form |
| Danbooru-derived tag vocabularies | Unclear provenance | Unknown | **Excluded.** Would also import an aesthetic bias incompatible with a photographic taxonomy |
| CLIP Interrogator label files | MIT repo, scraped phrase corpus | Prompt DB | **Excluded** by the brief's prompt-DB prohibition, independent of licence |
| Fooocus-derived style JSON, community wildcard bundles | Mixed, usually unstated | Prompt DB | **Excluded** |

**Reference media is a separate question entirely** and is governed by [`LICENSE_POLICY.md`](./LICENSE_POLICY.md): allowed by default `public_domain`, `pdm`, `cc0`, `cc_by`, `user_owned`; optional `cc_by_sa`; excluded `cc_by_nc`, `cc_by_nc_sa`, `cc_by_nd`, `cc_by_nc_nd`, `proprietary`, `unknown`. A dataset being excluded here says nothing about an individual Commons file, and vice versa. That is the two-layer principle in action.

---

## 9. Model licensing review

### 9.1 The rule: four licences, not one

```
   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
   │  TRAINING DATA  │   │  TRAINING CODE  │   │     WEIGHTS     │   │  INFERENCE CODE │
   │                 │   │                 │   │                 │   │                 │
   │ e.g. research-  │   │ e.g. Apache-2.0 │   │ e.g. OpenRAIL-M │   │ e.g. MIT        │
   │ only, NC, or    │   │ or no licence   │   │ or NC or        │   │ (llama.cpp)     │
   │ simply unstated │   │ at all          │   │ unstated        │   │ or GPL          │
   └─────────────────┘   └─────────────────┘   └─────────────────┘   └─────────────────┘
            │                     │                     │                     │
            └─────────────────────┴──────────┬──────────┴─────────────────────┘
                                             ▼
                        ALL FOUR must clear before a model may be a
                        DEFAULT or be BUNDLED. Any one blocked ⇒ the
                        model is at most an opt-in, user-installed
                        adapter, badged in the UI like an NC reference.
```

Four independent facts, routinely collapsed into one badge by tooling. The survey produced concrete counter-examples for every collapse: an Apache-2.0 repository whose checkpoints are explicitly not licensed; an Apache-2.0 repository over a non-commercial dataset; a repository whose platform label reads `NOASSERTION` while its file is GPL-3.0; a permissive repo whose weights are non-commercial; training code with no licence at all backing widely used weights.

### 9.2 Recorded status of every model family reviewed

| Model family | Code licence | Weights licence | Training data | May it be a default? |
|---|---|---|---|---|
| Qwen3-VL (analysis) | Apache-2.0 ✅ file | ⚠️ UNVERIFIED per checkpoint | Unstated | **No.** Weights unread. Opt-in adapter only |
| Qwen3-VL-Embedding / Reranker | Apache-2.0 ✅ file | ⚠️ UNVERIFIED | Unstated | **No**, same reason. This is the brief's own named candidate, and it still does not get defaulted on an unread licence |
| Qwen3-Embedding (text) | ⛔/⚠️ repo LICENSE 404s | ⚠️ UNVERIFIED | Unstated | **No.** We do not assert its licence at all |
| jina-clip-v2 | — | Reported **CC BY-NC-4.0** ⚠️ | Unstated | **No, and never bundled.** NC weights while rejecting NC photographs would be incoherent |
| SigLIP 2 | Apache-2.0 (software) ✅ file | **Not licensed** by the repository; card label ⚠️ | Unstated | **No** until the checkpoint terms exist in writing |
| OpenCLIP registry models | MIT (library) ✅ file | Varies per entry, mostly unstated | LAION / WebLI, varying | **No** as a class. Per-entry only, after a per-entry read |
| Florence-2 | ⚠️ (reported MIT) | ⚠️ UNVERIFIED | Unstated | **No.** Behind the analyzer adapter if used at all |
| JoyCaption | Apache-2.0 ✅ file | ⚠️ UNVERIFIED (upstream LLM lineage) | Unstated; deliberately uncensored | **No.** Licence unresolved *and* default behaviour is incompatible with a licence-clean pool — a product decision with a safety dimension |
| moondream | Apache-2.0 ✅ file | ⚠️ UNVERIFIED | Unstated | **No** until weights are read. Strong candidate afterwards for local-first analysis |
| WD14 / WD taggers | Training code ⛔ **no licence**; a wrapper node is MIT | ⚠️ UNVERIFIED | Booru corpus, unclear vocabulary rights | **No.** The clearest case in the survey of unclear provenance at every layer |
| BLIP / BLIP-2 / LAVIS | BSD-3-Clause ✅ file | ⚠️ per checkpoint | Varies | **No** as a class; per-checkpoint only |
| LTX-Video | Apache-2.0 ✅ file | **OpenRAIL-M** ✅ | Unstated | **No.** OpenRAIL-M carries use restrictions; it is a formatter *target*, not a bundled component |
| Wan 2.1 / 2.2 | Apache-2.0 ✅ file | Not separately stated | Curated aesthetic data | Formatter target only. Never bundled |
| TransNetV2 | MIT ✅ label | Not separately visible ⚠️ | Unstated | **No.** Not a dependency in any case |
| InternVideo / InternVideo2 | Apache-2.0 ✅ label | Not separately stated ⚠️ | Unstated | **No.** Scale alone disqualifies it as a default |
| Marqo-FashionCLIP | Apache-2.0 ✅ file | Not stated ⚠️ | Benchmarks wrapping restricted images | **No** |
| FashionCLIP | MIT ✅ label | ⚠️ | Corpus release described as pending | **No** |
| IDM-VTON / OOTDiffusion / CatVTON | CC BY-NC-SA-4.0 (**code and checkpoints**) ✅ file | Same | VITON-HD / Dress Code | **No, categorically.** Nothing shippable at any layer |

**Net position.** As reviewed during the initial design session, **no model may be a bundled default**, because not one family cleared all four licences with a firsthand read. This is not an obstacle to shipping: the brief already requires that AI be optional, that no model name be hardcoded, and that backends resolve at runtime through `ai.adapters.{analyzer,embedding,reranker}`. The honest product is one where the user brings a model, is told what its licence is when we know, and is told that we do not know when we do not.

### 9.3 Rules this imposes on the code

1. **No model identifier is ever a literal in `src/`.** `ai.adapters.*` holds opaque instance ids; `Evidence.detector` records an adapter instance id (e.g. `analyzer-adapter:local@2`), never a model name. `EmbeddingRecord.model_id` is opaque and core code never branches on it.
2. **A backend descriptor carries `license` and `licenseUrl` as fields**, so the UI can badge a non-commercial or unknown-licence backend exactly as License Guard badges a non-commercial image. Flagged as a proposal in §13 — it is not in the canonical model today.
3. **No weights are redistributed by this project.** Ever. Not bundled, not mirrored, not cached into a release artefact.
4. **A model download is a disclosed egress event.** User-initiated, size shown, recorded in `ai.external_transmission.disclosed_at`, and refused outright for any reference marked `privacy.local_only`.
5. **GPL/AGPL inference backends stay behind a process boundary.** A local server reached over HTTP is a user's own tool, not a linked library. We never import one.

---

## 10. Web-service terms reviewed

Distinct from licences: several sources impose *contractual* limits that a licence check would not catch.

| Service | Term recorded | Our compliance |
|---|---|---|
| Pinterest | Prohibits robots, spiders, crawlers, scrapers and any interface not provided by them for accessing or extracting data | Named in the brief's hard prohibitions. No scraper exists or will |
| Instagram | Prohibits collecting data by automated means without prior permission | Same |
| TikTok | Prohibits scraping, crawling, exporting or extracting content by automated system | Same |
| Civitai | Prohibits spiders, robots, crawlers and data-mining tools except through its provided interfaces with valid credentials and within rate limits | Not used as a provider. Third-party bulk scrapers of it are treated as an anti-pattern, and the most visible one has no licence at all |
| Pexels | "You may not copy or replicate core functionality of Pexels" | Not used as a provider; independently blocked because it exposes no per-item licence |
| Unsplash | Requires attribution per its guidelines, hotlinking, and a download-endpoint ping | Not used as a provider. Were it ever enabled, the ping is an egress event requiring UI disclosure before it fires |
| Openverse | Anonymous access is heavily rate-limited; registered credentials raise it | Design consequence in §12: either each user registers their own credentials (an egress event to disclose) or Commons is the default and Openverse is opt-in |
| Wikimedia Commons | Anonymous cross-origin read access is explicitly supported; browsers cannot set a user agent, so the API reads a dedicated header instead | We identify ourselves through that header. No credentials, no cookies, no account |

---

## 11. The ongoing obligation

A provenance record written once and never revisited is worse than none, because it creates false confidence. Three standing obligations.

### 11.1 Re-review before each release

**Every release re-runs this review.** The release is blocked until each item passes.

| # | Check | Pass condition | Evidence |
|---|---|---|---|
| R1 | Dependency inventory | Every runtime dependency in the tree appears in §7.4 **and** in `THIRD_PARTY_NOTICES.md` with its licence text and pinned version. Count matches | Manifest diff vs notices file |
| R2 | Licence re-read | Every dependency's `LICENSE` file re-read at the pinned version. A licence change between versions is a blocking finding, not a note | Read + recorded |
| R3 | Transitive sweep | The full transitive tree re-checked to the leaves for copyleft, source-available and unlicensed packages | Tree walk |
| R4 | Clean-room reaffirmation | §3 restated as true for the release, or amended with a specific exception and its notice entry. There is no third option | Statement in the release record |
| R5 | New-survey rows | Any project reviewed since the last release added to §4 with all seven columns filled | §4 diff |
| R6 | Model layer | §9.2 re-checked for any model newly shipped, defaulted or recommended. Weights licences re-read | §9.2 diff |
| R7 | Verification queue | §12 reviewed. Anything now unblocked is resolved and its `⚠️` marks removed; anything still blocked still blocks the feature that depends on it | §12 diff |
| R8 | Data files | `data/taxonomy/*.json` and `data/presets.json` spot-checked against §8: no imported class list, no imported attribute enumeration, no vendored corpus | Review of new nodes since last release |
| R9 | Terms drift | §10's service terms re-checked for the providers actually shipped | Re-read of provider terms |
| R10 | Sibling consistency | §14's cross-document claims still agree with [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) | Cross-read |

### 11.2 Adding a dependency: the procedure

1. **Justify against G1 in writing.** State the job and why fewer than ~200 lines we own cannot do it. This is the gate that rejects most candidates and it is meant to.
2. **Fetch and read the `LICENSE` file** at the exact version to be pinned. A platform label is not evidence (V1). Record which you read.
3. **Walk the transitive tree to the leaves** and record the walk. Record any package with no licence as a blocker, not a footnote (V2).
4. **Check G4:** no concrete AI backend imported, no phone-home, no runtime code or weight fetch without explicit user action.
5. **Pin the exact version.** Ranges are not permitted for runtime code.
6. **Reproduce the licence text** in `THIRD_PARTY_NOTICES.md` under a `## <package>` heading, with the version and the URL read.
7. **Add a row to §7.4** here with licence, verification mark, milestone and gate status.
8. **Note it in the release record** so R1 has something to diff against.

A change of licence in a *later* version of an existing dependency is treated as a new dependency and repeats steps 2–8.

### 11.3 Adding a survey row

Reviewing a new project — for competitive reasons, for an idea, for anything — obliges a row in §4 before the next release, with all seven columns filled, including an explicit **What we deliberately did not take**. That column is the one that matters: it is where an engineer records the thing they were tempted by. A row whose "not taken" cell says only "code" has not been filled in properly.

---

## 12. Open verification queue

Every item below was blocked by the research environment's egress proxy or otherwise unresolved as reviewed during the initial design session. None of them changes a decision in this document — every one of them is currently resolved conservatively, by exclusion. Each must clear before the feature or dependency it gates ships. The full per-cluster lists live in [`research/`](./research/); [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §12 carries the product-facing view of the same queue.

**Blocking a dependency or a default (must clear before the artefact ships):**

| # | Item | Gates |
|---|---|---|
| 1 | Qwen3-VL-Embedding **weights** licence, distinct from the Apache-2.0 repo | Recommending it as a default embedding adapter |
| 2 | Qwen3-Embedding text family — its repo `LICENSE` 404s | Any mention of it as a candidate |
| 3 | jina-clip-v2's non-commercial status, confirmed from the model card | Whether it may exist even as an opt-in adapter |
| 4 | SigLIP 2 checkpoint terms, which the repository deliberately does not state | Using it as the permissive alternative |
| 5 | Florence-2 licence firsthand, including fine-tuned and community variants | Recommending it as a v0.2 analyzer |
| 6 | JoyCaption checkpoint terms — does the upstream LLM community licence propagate? | Any recommendation at all |
| 7 | WD tagger weights and the tag-vocabulary rights, per model repository | Any tagger-based analyzer path |
| 8 | TransNetV2, InternVideo, Marqo weight terms, distinct from repository code | Recommending any of them |
| 9 | `sqlite-vec` and `usearch` licence **files** (currently label-only evidence) | G2 admission |
| 10 | The core build licence of any WASM media build we might adopt | G2 admission of `ffmpeg.wasm` |
| 11 | Whether the ComfyUI port of `sd-dynamic-prompts` shares the A1111 extension's licence | Nothing — recorded for completeness |

**Blocking a data or taxonomy decision:**

| # | Item | Gates |
|---|---|---|
| 12 | Fashionpedia's dataset and ontology licence, from the primary terms page | Whether it may even be *cited* in `data/taxonomy/clothing.json` |
| 13 | Fashion-IQ's CDLA variant — permissive vs share-alike | Any reference to its material |
| 14 | CineScale / CineScale2 licence, from the dataset records | Citing the angle ⊥ level finding as sourced rather than as our own reasoning |
| 15 | CameraBench's full primitive list, unavailable in the repository | Finalising the motion taxonomy |

**Blocking a provider (v0.2):**

| # | Item | Gates |
|---|---|---|
| 16 | Commons search parameters for user-driven search, and whether its media-search ranking is API-reachable | `src/providers/wikimedia.js` |
| 17 | The `filetype:` alias spelling on Commons | Reliable video filtering |
| 18 | Openverse anonymous CORS behaviour behind its CDN, and whether the anonymous cap is per-IP or per-origin | Whether Openverse is default or opt-in, and whether users must register credentials (an egress event to disclose) |
| 19 | Openverse's exact attribution string template | Whether our attribution builder defers to it or derives its own |
| 20 | Whether the Smithsonian API still serves traffic post-archival, and whether the NYPL Repo API is dead | Adding either as a provider |
| 21 | Whether any CORS-enabled, key-free, CC-licensed **video** source exists besides Commons | Whether v0.4's corpus is user-uploaded video only — which the UI must then say |
| 22 | Whether reading pixels from a cross-origin provider video is possible under their CORS headers | Whether remote video can be decomposed at all, or only local uploads |
| 23 | Whether the optional CC BY-SA tier creates a share-alike obligation on a generated *prompt* — a text derivative of attribute descriptions | `(UNVERIFIED — legal question)`. Enabling CC BY-SA anywhere by default |

**Blocking a specific feature:**

| # | Item | Gates |
|---|---|---|
| 24 | One vendor's documented pan/tilt axis convention, which is inverted relative to standard cinematography and to a competitor's own commands | That vendor's formatter mode, which is wrong half the time until an empirical A/B settles it |
| 25 | Which video models distinguish dolly-in from zoom-in in *rendered behaviour*, not merely vocabulary | Whether the distinction must survive every formatter mode or only some |
| 26 | Exact geometric-estimator API contracts (docs host blocked) | Writing the ALG-4 specification |

---

## 13. Assumptions and names not fixed by the canonical data model

This document is bound by [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) and introduces no synonym for anything it already defines. The following are names or structures used above that the canonical model does **not** currently define. Each is flagged here rather than smuggled in.

| # | Name / structure | Where used | Status |
|---|---|---|---|
| 1 | **Cluster codes C1–C8** and the eight-cluster grouping | §2.1, §4 | Editorial only. Mirrors the eight research dossiers. No schema impact. Differs from [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md)'s five-cluster product grouping, deliberately |
| 2 | **Verification marks** `✅ file` / `✅ label` / `✅ absence` / `⚠️ UNVERIFIED` / `⛔ none` / `§ proprietary` | §2.4, §4 | This document's own evidence grading. Not a schema enum. Deliberately *not* reusing `LICENSE_ID` values, which describe media licences, not our confidence in a claim |
| 3 | **Rules V1–V5** and **gates G1–G5** | §2.3, §7.2 | Process names owned by this document |
| 4 | **Algorithm ledger ids ALG-1…ALG-5** | §6 | Owned here. Referenced by implementation comments so a reader can find the citation |
| 5 | **Release checks R1–R10** | §11.1 | Owned here. [`ROADMAP.md`](./ROADMAP.md) should reference the gate, not restate it |
| 6 | **Backend descriptor with a `license` field** — `listBackends() → [{id, dims, modalities, license, licenseUrl, runsInBrowser, quality}]` | §4.4 (OpenCLIP), §9.3 | **Proposed.** The canonical model treats `ai.adapters.*` as opaque ids and defines no descriptor shape. Belongs in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Also proposed in [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §11 — the two must not diverge |
| 7 | **`metadata_license` distinct from the media `license`** | §4.7 (Met, NYPL, Smithsonian) | **Proposed.** Not in `Reference.metadata` today. Low cost, prevents a real class of error where a CC0 catalogue record is mistaken for a CC0 image |
| 8 | **Extended obligation flags** — `hotlink_only`, `download_ping` alongside `requires_attribution` and `share_alike` | §4.7 (Unsplash) | **Proposed and deprioritised.** Only needed if a non-CC provider is ever enabled, which policy currently forbids |
| 9 | **Donor-quality fields** — viewpoint, occlusion, scale, zoom | §4.2 (DeepFashion2) | **Proposed.** Would let the mixer warn that a flat-lay is a poor `pose` donor. Not in the model today |
| 10 | **`formatter_capability` record per mode** — word budget, slot ordering, negative-prompt support, max simultaneous camera moves, drop order | §4.6 (LTX, Hailuo, Veo, ai-shortfilm-prompts) | **Proposed.** The canonical model defines `FORMATTER_MODE` and `model_hints` but no capability record. Needs a home in the prompt layer |
| 11 | **Category-scoped negative reference weight** | §4.5 (Krea) | **Proposed.** Adjacent to `difference.change_targets`; appears unclaimed. Requires a signed weight or an avoid-list on a mix entry |
| 12 | **Camera level as modifier nodes inside `camera_angle`** (`exclusivity_group: null`, so they never trigger an arity conflict) | §4.6 (CineScale2) | **Our design decision.** The brief fixes the category list at 20, so a new category is unavailable; the modifier escape is the schema-legal resolution. Needs ratification when `camera.json` is authored |
| 13 | The row count **108** | §2.1 | This document's own tally, grouped as stated. Not a claim about anything |

---

## 14. Answering the brief

**Question 8 — "Is reference licensing separated from code licensing?"** Yes, and this document is half the proof. Four independent layers, none of which implies any other:

```
   ┌──────────────────────────────────────────────────────────────────────┐
   │ LAYER 1  OUR CODE                    MIT. Ours. Original (§3)        │
   ├──────────────────────────────────────────────────────────────────────┤
   │ LAYER 2  OUR DEPENDENCIES            None today. Permissive only,    │
   │                                      gated and recorded (§7)         │
   ├──────────────────────────────────────────────────────────────────────┤
   │ LAYER 3  MODEL WEIGHTS               Separate from model code.       │
   │                                      None bundled. None default (§9) │
   ├──────────────────────────────────────────────────────────────────────┤
   │ LAYER 4  REFERENCE MEDIA             Per-item licence metadata,      │
   │                                      License Guard, no binaries      │
   │                                      stored → LICENSE_POLICY.md      │
   └──────────────────────────────────────────────────────────────────────┘
        ▲                                                          ▲
        └── this document owns layers 1–3 ────── LICENSE_POLICY.md owns layer 4
```

A `VisualRecipe.license_summary` describes reference media **only**. It says nothing about the licence of our code, of a user's generated output, or of any model. We never imply otherwise.

**Cross-document claims this section makes**, each of which a sibling must uphold:

| # | Claim | Must also hold in |
|---|---|---|
| 1 | No code from any surveyed repository exists in this tree; all implementation is original | [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md), [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §10 |
| 2 | The MVP has zero runtime dependencies; future ones must be MIT/BSD/Apache-2.0, transitively checked, and recorded in the notices file | [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md), [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| 3 | Model **weights** licences are recorded separately from model **code** licences, and no model is a bundled default | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) §11, [`ARCHITECTURE.md`](./ARCHITECTURE.md) §5 |
| 4 | A licence **file** overrides a platform label, always | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| 5 | Repositories with no licence (Comfyroll, PromptJSON, Okims, ShotBench, AVE, SW-CV-ModelZoo, DeepFashion2, and the Civitai bulk scraper) were read as prior art only and contributed no code and no data | [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) §7 |
| 6 | Our taxonomy vocabulary is authored by us; no dataset label file was copied; research-only and NC datasets are excluded | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md), [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) §4.5 |
| 7 | No media binaries are stored, enforced at schema level | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) INV-REF-2, [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) §7 |
| 8 | No model name is hardcoded; adapters resolve at runtime and carry no vendor branch | [`ARCHITECTURE.md`](./ARCHITECTURE.md), [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) INV-AI-2 |
| 9 | A model download or any external transmission is a disclosed egress event, refused for `privacy.local_only` references | [`ARCHITECTURE.md`](./ARCHITECTURE.md) §10, [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) §10 |
| 10 | This review is re-run before every release, and the gate blocks the release | [`ROADMAP.md`](./ROADMAP.md) |

---

## 15. Where to go next

| If you want | Read |
|---|---|
| Why each surveyed project is *different from ours* | [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) |
| Which reference media may enter the product, and how credit is rendered | [`LICENSE_POLICY.md`](./LICENSE_POLICY.md) |
| The live notices file and the dependency-addition rules in short form | [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) |
| Where adapters sit and why a GPL backend is reachable but never importable | [`ARCHITECTURE.md`](./ARCHITECTURE.md) |
| Field names, enums and the invariants cited throughout | [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) |
| The raw evidence behind every row in §4 | [`research/`](./research/) |
