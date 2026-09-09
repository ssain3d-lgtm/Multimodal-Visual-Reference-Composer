# Research Cluster: Multimodal Embedding & Retrieval Stacks

> Scope: what a local-first, license-clean, AI-optional **Unified Visual Reference Composer** must design around when it
> reaches milestone **v0.3 (multimodal embedding, similar-image search, hybrid ranking)** and **v0.4 (video)**.
> Research date: 2026-09-09. Direct network egress was blocked; all facts below come from `WebFetch`/`WebSearch`.
> `huggingface.co`, `jina.ai`, `arxiv.org`, `modelscope.cn` and `npmjs.com` were **blocked by the egress proxy** —
> anything that could only be sourced from those hosts is marked **(UNVERIFIED)**.

## Why this cluster matters to us

Our brief makes retrieval a *replaceable module*: "Retrieval and analysis are SEPARATE modules. Analyzer understands;
retriever ranks", and "Model names/backends must NEVER be hardcoded" behind `src/ai/{analyzer,embedding,reranker}.js`.
That is only credible if we actually know the shape of the things we are adapting: the vector **dimensionality** each
candidate emits, whether the model can natively take a **fused text+image query** (which is precisely what
*Unified Modal* + *Visual Intent* demand — one modal, one schema, four input modes), whether the weights are
**redistributable** (our License Policy is strict about references; it would be absurd to be strict about a CC BY photo
and sloppy about a CC BY-NC model), and whether anything can run **in-browser / CPU-only** (our Privacy rule:
"Local-first. User images/videos processed locally by default").

Three findings dominate the design:

1. **The joint text+image query is the fork in the road.** Classic CLIP-family dual encoders (OpenCLIP, SigLIP 2,
   jina-clip-v2) have *two separate towers*: you get a text vector or an image vector, and "text + image" is a client-side
   hack (vector arithmetic / score fusion). Instruction-tuned VLM embedders (Qwen3-VL-Embedding) take **interleaved
   mixed-modal input natively**. Our *Reference Mixing* and *Search by Difference* pillars are literally
   "compose a query out of parts of several references" — so the adapter interface must express *both* worlds.
2. **License is not uniform across this cluster.** Qwen3-VL-Embedding is Apache-2.0; jina-clip-v2 weights are
   **CC-BY-NC-4.0** (non-commercial) — a hard exclusion candidate under our own License Policy discipline;
   LanguageBind splits MIT code / CC-BY-NC-4.0 data.
3. **A serverless local vector store is a solved problem, but only at small-to-mid scale.** `sqlite-vec` (WASM),
   `voy` (WASM k-d tree), `hnswlib-wasm` (HNSW + IndexedDB) and `usearch` all run without a server. None of them is
   a drop-in "hybrid ranker"; our 60/40 semantic+metadata fusion stays *our* code.

---

## Qwen3-VL-Embedding / Qwen3-VL-Reranker

| | |
|---|---|
| **Repository** | `QwenLM/Qwen3-VL-Embedding` — https://github.com/QwenLM/Qwen3-VL-Embedding |
| **License** | Apache-2.0 (repo `LICENSE` fetched directly) |
| **License verified** | **Yes** — https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/LICENSE returns the Apache License 2.0 text; the README carries an "Apache 2.0" badge |
| **Main function** | Instruction-tuned multimodal embedding + reranking built on the Qwen3-VL foundation model; text, image, screenshot and video inputs, including **mixed-modality inputs** |

**Concrete facts** (from the fetched README, https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/README.md):

- Four models: `Qwen3-VL-Embedding-2B`, `Qwen3-VL-Embedding-8B`, `Qwen3-VL-Reranker-2B`, `Qwen3-VL-Reranker-8B`.
- **Embedding dimension: 2048 (2B) / 4096 (8B)**, with **MRL** ("Flexible vector dimensions with Matryoshka
  Representation Learning (MRL)") so shorter prefixes are usable. The *exact* published truncation ladder
  (e.g. 128/256/512/1024) is **(UNVERIFIED)** — the model card lives on the blocked HF host.
- **Native joint text+image query.** A query item is literally a dict with both keys:
  `{"text": "A woman playing with her dog on a beach at sunset.", "image": "https://.../demo.jpeg"}`.
- **Video is a first-class input**: local path, URL, or a sequence of frames, with `fps` and `max_frames`
  (default **64**) sampling parameters.
- **Instruction parameter**: optional task description, default `"Represent the user's input"`, e.g.
  `"Retrieve images or text relevant to the user's query."`
- Training uses **Quantization-Aware Training (LSQ + straight-through estimator)** so embeddings stay usable at
  **int8 or binary** precision — sourced from the technical report via search, not a direct fetch, so treat the
  QAT detail as **(UNVERIFIED)** (arxiv.org blocked).
- **No VRAM/CPU requirement is stated anywhere we could fetch — (UNVERIFIED).** Assume a 2B VLM encoder is *not*
  browser-viable and needs a local GPU or a slow CPU path.

Sibling text-only family: `QwenLM/Qwen3-Embedding` (https://github.com/QwenLM/Qwen3-Embedding) — 0.6B/4B/8B at
**1024 / 2560 / 4096 dims**, MRL, 32K context, 100+ languages (README fetched). **Its license is (UNVERIFIED):**
`raw.githubusercontent.com/QwenLM/Qwen3-Embedding/main/LICENSE` returned **404**, and the GitHub page we fetched showed
**no license label**. Search results claim Apache-2.0 on the HF cards; we did not see it, so we must not assert it.

**Overlap with our product.** This is the single closest match to what our brief calls the *embedding-adapter*. The
brief itself already names "Qwen3-VL-Embedding ~2B for retrieval, 8B as 'enhanced search mode'" as a candidate.
Its instruction + mixed-modal query is the mechanical realisation of *Unified Modal*.

**Useful idea to borrow (as a pattern, not as code).** The **instruction string as a first-class query field.**
Our *Search by Difference* ("keep composition + lighting + camera, change clothing") maps beautifully onto it:
the KEEP set becomes the instruction ("Retrieve images with the same composition and lighting"), the CHANGE set
becomes a negative/rerank constraint. Also: MRL means we can store a **short vector for the browser index and a long
vector for the desktop/Node path from the same model** — one embedding job, two storage tiers.

**What we must NOT copy.** No wholesale copying of their inference/serving code into `src/ai/embedding.js`
(the brief forbids "wholesale copying of ... external repository code"). Apache-2.0 also obliges us to keep the
NOTICE/attribution if we ever vendor anything — that belongs in `THIRD_PARTY_NOTICES.md`, not silently inlined.
And we must not let its 2048-dim assumption leak into schemas: dimension is adapter metadata, never a constant.

**Our differentiation.** Qwen3-VL-Embedding *ranks*; it has no notion of a reference being a bag of typed attributes.
Our **Reference Decomposition** pillar means a returned card is immediately decomposable into composition / lighting /
clothing / camera-motion slots that the user can inherit *selectively*. The model gives us similarity; it cannot give
us "take composition from A and clothing from B".

---

## jina-clip-v2

| | |
|---|---|
| **Repository** | Model on Hugging Face: `jinaai/jina-clip-v2` (host blocked); product page https://jina.ai/models/jina-clip-v2/ (host blocked) |
| **License** | **CC-BY-NC-4.0** (non-commercial) for the downloadable weights |
| **License verified** | **No** — huggingface.co and jina.ai are both blocked by the egress proxy. Evidence is a search result whose title is the literal README front-matter `--- library_name: transformers license: cc-by-nc-4.0 tags: - xlm-roberta - eva02` (https://huggingface.co/api/resolve-cache/models/jinaai/jina-clip-v2/5396271eefd4668cdfb31ba1a391fa7bb5247097/README.md). Strong, but not a fetch — treat as **(UNVERIFIED)** until someone opens the card. |
| **Main function** | Multilingual multimodal (text↔image) dual-encoder embedding model with Matryoshka truncation |

**Concrete facts (all via search, host blocked — (UNVERIFIED) as a class):**

- ~**865M parameters**; text tower Jina XLM-RoBERTa (~561M), vision tower **EVA02-L14** (~304M).
- **1024-dim output, Matryoshka-truncatable down to 64**; reported ~99% of performance retained at 1024→256.
- **512×512** image input; **89 languages**.
- **Two towers → no native fused text+image query.** You embed text *or* image into a shared space.
- Supported as an architecture in transformers.js (see below) — the transformers.js README lists **JinaCLIP** among
  supported architectures (this part **is** verified, we fetched that README).

**Overlap.** It is the obvious "small, browser-plausible, shared-space CLIP" for our v0.3 similar-image search, and
its ONNX/transformers.js availability makes it one of the very few candidates that could run client-side.

**Useful idea.** **Matryoshka as a storage-tier strategy.** For a local-first app, storing 1024-dim float32 per
reference is ~4 KB; truncating to 256 dims is ~1 KB and reportedly near-lossless. That is the difference between an
IndexedDB store that survives thousands of reference cards and one that doesn't.

**What we must NOT copy.** **The license.** CC-BY-NC-4.0 weights cannot be bundled or shipped as a default in a
product we intend to be freely usable, and it would be hypocritical given our own License Policy excludes CC BY-NC
*references* by default. If we support it at all, it must be an **opt-in adapter the user installs themselves**, with
a UI badge, exactly like our reference License Guard. Never ship the weights in-repo; never make it the default.

**Our differentiation.** jina-clip-v2 answers "which images are similar to this vector". It has no concept of
**Selective Inheritance**. Our composer treats its score as *one input to fusion ranking* (~60/40 semantic/metadata
per the brief), alongside taxonomy matches on framing/lighting/camera — a dual-tower CLIP score alone cannot express
"same framing, different outfit".

---

## SigLIP 2 (google-research/big_vision)

| | |
|---|---|
| **Repository** | https://github.com/google-research/big_vision — model docs at `big_vision/configs/proj/image_text/README_siglip2.md` |
| **License** | **Apache-2.0** for the software; the repo's own doc adds "All other materials are licensed under the Creative Commons Attribution 4.0 International License (CC-BY)" |
| **License verified** | **Yes for the code** — https://raw.githubusercontent.com/google-research/big_vision/main/LICENSE is the Apache-2.0 text, and the SigLIP 2 README states verbatim: *"All software is licensed under the Apache License, Version 2.0 (Apache 2.0)"*. **The checkpoint cards themselves were not fetched (HF blocked)** — search consistently reports `apache-2.0` on `google/siglip2-*`, but that specific claim is **(UNVERIFIED)**. The SigLIP 2 README explicitly does not license the checkpoints. |
| **Main function** | Multilingual vision-language dual encoder (sigmoid contrastive loss), successor to SigLIP; zero-shot classification, image-text retrieval, and as a VLM vision tower |

**Concrete facts** (fetched README_siglip2.md):

- Four sizes: **ViT-B (86M), L (303M), So400m (400M), g (1B)**.
- Resolutions **224 / 256 / 384 / 512**, plus **NaFlex** variants that preserve native aspect ratio with variable
  sequence length (vs "FixRes" backward-compatible fixed resolution).
- The README does **not** state embedding dimension or language count. Search suggests base `hidden_size = 768` and
  109 languages — **(UNVERIFIED)**.
- Two towers, therefore **no native fused text+image query**.

**Overlap.** The strongest permissively-licensed alternative to jina-clip-v2 for the same slot, and available through
OpenCLIP (below), which makes it swappable without new inference code.

**Useful idea.** **NaFlex / native aspect ratio.** Our references are photographs and film stills where *framing* and
*aspect ratio are semantic content* — a 2.39:1 anamorphic still squashed to 224×224 loses exactly the
`framing`/`composition` signal our taxonomy cares about. If we pick a fixed-res encoder we should record the original
aspect ratio as a **structured metadata field** and let the metadata half of the fusion ranker use it.

**What we must NOT copy.** Do not assume the Apache-2.0 on the *code* covers the *weights* — the SigLIP 2 README
deliberately separates software / other materials, and does not license the checkpoints at all. Our
`THIRD_PARTY_REVIEW.md` must record model-weight licenses separately from model-code licenses.

**Our differentiation.** SigLIP 2 is a better *embedding*, full stop — and that is exactly why it is a component and
not a product. Our **Visual Intent** layer converts text, image, video and reference-card inputs into *one editable
structured schema*; SigLIP 2 collapses each input into an opaque 768-d point that the user can neither read nor edit.
"AI output is a proposal, never a commitment" is impossible with a raw embedding.

---

## OpenCLIP (mlfoundations/open_clip)

| | |
|---|---|
| **Repository** | https://github.com/mlfoundations/open_clip |
| **License** | **MIT** |
| **License verified** | **Yes** — https://raw.githubusercontent.com/mlfoundations/open_clip/main/LICENSE is the MIT text (copyright Ilharco, Wortsman, Carlini, … Schmidt) |
| **Main function** | Open-source CLIP training/inference library and a registry of many pretrained image-text encoders |

**Concrete facts** (fetched README):

- Architectures: ViT (B-32, B-16, L-14, H-14, bigG-14), ConvNeXt (Base/Large/XXLarge), ResNets.
- Pretrained families include **SigLIP and SigLIP2**, MetaCLIP/PE, DFN, CoCa, CLAP, MaMMUT.
- `open_clip.list_pretrained()` enumerates the registry; details in `PRETRAINED.md`.
- Training sets referenced: LAION-400M, LAION-2B, DataComp-1B, WebLI.
- README does **not** state per-model embedding dimensions.
- README notes parts of `src/open_clip/` are adaptations of OpenAI's official repo; it does **not** give a blanket
  license for the *weights*, which come from different sources with different terms.

**Overlap.** This is the *reference implementation of the adapter idea we already committed to*: one API, dozens of
interchangeable encoders. It validates our `embedding-adapter` boundary.

**Useful idea.** `list_pretrained()` — a **runtime-enumerable model registry** rather than hardcoded names. Our
`src/ai/embedding.js` should expose the same shape: `listBackends() -> [{id, dims, modalities, license, licenseUrl,
runsInBrowser}]`. Note that we should carry **license as a field on the backend descriptor**, so the UI can badge an
NC model the same way it badges an NC image.

**What we must NOT copy.** Don't inherit the assumption that "weights license == repo license". OpenCLIP is MIT but
serves weights trained on LAION/WebLI under varying terms. Also: do not vendor OpenCLIP model code into our repo —
we are a JS/browser-first product, and the brief forbids wholesale external-code copying.

**Our differentiation.** OpenCLIP is a *model zoo*; it has no UI, no taxonomy, no attribution model. Our
**Unified Modal** pillar is a product claim OpenCLIP cannot make: one modal where Text / Image / Video / Browse are
*modes*, state persisting across mode switches, never closing mid-exploration.

---

## rom1504/clip-retrieval

| | |
|---|---|
| **Repository** | https://github.com/rom1504/clip-retrieval |
| **License** | **MIT** |
| **License verified** | **Yes** — https://raw.githubusercontent.com/rom1504/clip-retrieval/main/LICENSE, "MIT License, Copyright (c) 2021 Romain Beaumont" |
| **Main function** | End-to-end pipeline to compute CLIP embeddings, build a FAISS index, and serve a KNN search UI |

**Concrete facts** (fetched README):

- Components: **clip-inference** (~1,500 samples/s on a 3080), **clip-index** (autofaiss/FAISS), **clip-filter**,
  **clip-back** (Flask KNN service, ~**50 ms** latency, ~**20 queries/s**), **clip-front** (web UI).
- Scale: designed for **hundreds of millions** of embeddings; ~100M embeddings in ~20 h on a single 3080.
- **Memory-mapped FAISS indices** plus HDF5 metadata caching bring the memory footprint "to nearly zero".
- The KNN service accepts **text query, image URL, or base64 image — mutually exclusive**. The README describes
  **no** combined/arithmetic multimodal query.

**Overlap.** It is the canonical open implementation of the "embed → index → serve KNN → browse a grid of results"
loop, i.e. the plumbing behind our v0.3 *Similar Reference Search*.

**Useful idea.** **Memory-mapped index + separate metadata store.** This maps directly onto our storage rule
("Do NOT store media binaries in the repo — store URL, thumbnail URL, metadata, embedding, visual attributes only"):
vectors in an mmap-able/serialisable index, metadata in a queryable store, media only ever referenced by URL.

**What we must NOT copy.** Its **mutually exclusive query modes** are, for us, an anti-pattern — it is precisely the
"separate image-search page vs text-search page" split our *Unified Modal* pillar forbids. Also do not copy the
crawl-everything posture: `clip-filter`-style bulk dataset handling collides with our ban on "bulk storage of
unknown-license images".

**Our differentiation.** clip-retrieval ends where we begin. Its result grid is terminal — you look at images. Our
result card carries **USE / EXTRACT / EXPLORE** actions, and EXTRACT is the entry point to
**Reference Decomposition** and then **Selective Inheritance**.

---

## Marqo (marqo-ai/marqo)

| | |
|---|---|
| **Repository** | https://github.com/marqo-ai/marqo |
| **License** | **Apache-2.0** |
| **License verified** | **Yes** — https://raw.githubusercontent.com/marqo-ai/marqo/mainline/LICENSE is the Apache 2.0 text; the GitHub page shows the `Apache-2.0 license` label |
| **Main function** | End-to-end vector search engine with built-in embedding generation; positioned as an "AI-native ecommerce search platform" |

**Concrete facts** (fetched repo page):

- Topic tags explicitly include **multi-modal**; multimodal (image+text) search is a headline capability.
- Ships `compose.yaml`, `compose-inference.yaml`, `compose-triton.yaml` → **containerised, server-based**
  (Vespa-backed in recent versions — **(UNVERIFIED)**, we did not fetch that detail).
- **Critical:** the README states *"Marqo's Open Source project is deprecated and will no longer recieve updates."* [sic]
- Weighted multi-term / multi-vector queries: **(UNVERIFIED)** — the README excerpt we fetched did not confirm it,
  though Marqo historically advertised weighted multimodal query combination.

**Overlap.** Marqo is the "batteries-included" version of our search layer: it fuses embedding generation, storage and
lexical+vector search behind one API.

**Useful idea.** The **weighted multi-part query** concept (query as a *list of (content, weight)* pairs rather than a
single string) is the right mental model for **Reference Mixing**: our `ReferenceMix` is already a list of
`{reference_id, use: [...]}` — a weighted, typed query. If we ever need a query object for the semantic side, it should
be `[{source: 'img_A', categories: ['composition'], weight: 0.6}, ...]`, not a concatenated sentence.

**What we must NOT copy.** Two things. (1) The **server dependency** — a Docker/Vespa stack directly contradicts our
local-first, "works with AI OFF" requirement. (2) Its **deprecation** is the lesson: do not build a pillar on a
single vendor's open-source goodwill. Our adapter boundary exists exactly so a dead backend costs us one file.

**Our differentiation.** Marqo returns ranked documents. It has no **Search by Difference** — no way to say
"keep camera + lighting, change clothing". Difference-based retrieval requires typed attributes on both sides of the
query, which requires our taxonomy and our decomposition step; a generic vector engine structurally cannot host it.

---

## transformers.js (huggingface/transformers.js)

| | |
|---|---|
| **Repository** | https://github.com/huggingface/transformers.js |
| **License** | **Apache-2.0** |
| **License verified** | **Yes** — https://raw.githubusercontent.com/huggingface/transformers.js/main/LICENSE is the Apache 2.0 text; repo page shows the `Apache-2.0` label |
| **Main function** | Run Transformers models directly in the browser via ONNX Runtime Web — "no need for a server" |

**Concrete facts** (fetched repo page + README):

- Backends: **ONNX Runtime**; **CPU/WASM by default**, optional **WebGPU** via `device: 'webgpu'`.
- WebGPU is explicitly flagged experimental: *"The WebGPU API is still experimental in many browsers, so if you run
  into any issues, please file a bug report."*
- Quantization dtypes: **`fp32` (WebGPU default), `fp16`, `q8` (WASM default), `q4`**.
- Supported architectures listed in the README include **CLIP**, **SigLIP**, **JinaCLIP**, **Qwen2-VL**,
  **Qwen2.5-VL**, **Qwen3-VL**.
- Whether a *Qwen3-VL-**Embedding*** ONNX export exists and is practical in-browser: **(UNVERIFIED)** — architecture
  support for Qwen3-VL is not the same as a usable embedding export, and HF was blocked.

**Overlap.** This is the only realistic path to "AI ON, but still local-first, still zero server" for our v0.3
semantic search — and to honouring "User images/videos processed locally by default".

**Useful idea.** **A dtype/device policy as a user-visible setting.** `q8` on WASM for a low-end laptop, `fp16` on
WebGPU for a desktop, and a documented fallback chain. Combined with MRL truncation, we get a genuine
quality/size dial: *(fast, small vectors, CPU)* → *(accurate, full vectors, GPU)*. This is our "enhanced search mode"
from the brief, implemented honestly.

**What we must NOT copy.** Nothing to copy — it is a dependency, not a competitor. The trap to avoid is *implicit
network access*: transformers.js fetches weights from a remote hub on first use. Our Privacy rule ("Any external API
transmission must be explicitly disclosed in the UI") means model download must be an explicit, disclosed,
user-initiated action with a visible size, and cached thereafter.

**Our differentiation.** transformers.js gives us vectors in the browser; it gives us nothing about what to *do* with
them. **Visual Intent** — every input funnelling into the same editable structured schema — is the layer above, and it
is the layer that lets the product still work when the user leaves AI OFF entirely.

---

## sqlite-vec (asg017/sqlite-vec)

| | |
|---|---|
| **Repository** | https://github.com/asg017/sqlite-vec |
| **License** | **Apache-2.0 OR MIT** (dual) |
| **License verified** | **Yes** — GitHub shows "Apache-2.0, MIT licenses found" on the repo page |
| **Main function** | SQLite extension for vector storage and KNN search; pure C, no dependencies |

**Concrete facts** (fetched repo page):

- Vector element types: **float32, int8, and binary**.
- Runs on Linux, macOS, Windows, **and "in the browser with WASM"**.
- Index strategies present/underway: **brute-force KNN**, IVF, IVF+k-means, DiskANN.
- Supports **auxiliary, partition-key and metadata columns** alongside the vector column.
- Status caveat, verbatim: *"sqlite-vec is a pre-v1, so expect breaking changes!"*

**Overlap.** This is the most direct answer to "how does a local-first app persist and search vectors without a
server": a single SQLite file that holds vectors **and** our reference metadata **and** our taxonomy tags, queryable
in one SQL statement, in the browser via WASM or on disk in a future ComfyUI/Node build.

**Useful idea — and probably our recommended default.** The **partition key / metadata column** feature is the
mechanism for our hybrid ranker: license status, provider (`openverse`/`wikimedia`/`local`) and taxonomy tags live in
the same row as the embedding, so the **License Guard filter is a WHERE clause, not a post-filter**. An unapproved
reference can be made structurally unreachable by the retriever.

**What we must NOT copy.** Pre-v1 breaking changes mean we must not let `sqlite-vec` SQL leak out of
`src/search/semantic-search.js`. And brute-force KNN is fine at our scale — do not prematurely adopt DiskANN/IVF.

**Our differentiation.** sqlite-vec is storage. Our value is what the row *contains*: a Reference object with typed
`visual_attributes` and full `metadata {source, creator, license, license_url, source_url, attribution}` and a
`status` of candidate/approved/rejected/license_review. **Selective Inheritance** operates on those typed attributes,
not on the vector.

---

## Voy (tantaraio/voy)

| | |
|---|---|
| **Repository** | https://github.com/tantaraio/voy |
| **License** | **Apache-2.0 OR MIT** (dual, at the user's option) |
| **License verified** | **Yes** — repo page shows both labels; README states *"Licensed under either of Apache License, Version 2.0 … or MIT license … at your option."* |
| **Main function** | WASM vector similarity search engine written in Rust, for the browser |

**Concrete facts** (fetched repo page):

- Index: **k-d tree** (not HNSW).
- Size: **75 KB gzipped / 69 KB brotli**.
- API: `new Voy(resource)` plus `index()`, `search()`, `add()`, `remove()`; results carry metadata (id, title, url).
- Brings no embeddings of its own — expects vectors from transformers.js or similar.
- Persistence is only via **serialize/deserialize to a string**.
- Stated limitations: *"Currently it's required to re-build the index when a resource update occurs"*; marked
  **Work In Progress**, API not stable pre-1.0.

**Overlap.** Smallest possible client-side ANN for a v0.3 prototype — ship it, index a few thousand reference cards,
done.

**Useful idea.** Its result payload **carries metadata inline** (id/title/url), which is exactly the right ergonomics
for our reference cards: the retriever returns enough to render a card without a second lookup.

**What we must NOT copy.** The **rebuild-on-update** constraint is disqualifying for our workflow — users add and
approve references continuously through the License Guard pipeline, and a full reindex per approval is unacceptable
UX. Also: k-d trees degrade badly in high dimensions; with 1024–2048-d embeddings a k-d tree is close to brute force
anyway, so its advantage over a plain cosine scan is small. **(UNVERIFIED)** as a measured claim — this is a
well-known property of k-d trees, not something we benchmarked.

**Our differentiation.** Voy searches vectors. Our **Reference Mixing** produces a *new* composite query from parts of
several approved references, with conflicts surfaced to the user rather than auto-resolved — a search-index library
has no place to put that.

---

## USearch (unum-cloud/usearch)

| | |
|---|---|
| **Repository** | https://github.com/unum-cloud/usearch |
| **License** | **Apache-2.0** |
| **License verified** | **Yes** — GitHub repo page shows the `Apache-2.0` license label |
| **Main function** | Multi-language HNSW vector search & clustering engine |

**Concrete facts** (fetched repo page):

- Index: **HNSW**, described as the same algorithm as FAISS with better performance.
- Bindings: **Python, JavaScript (with WebAssembly/WASM for browsers)**, Rust, C++11, C99, Java, Swift, Obj-C, C#, Go.
- Quantization/scalar types: `f64, f32, bf16, f16, e5m2, e4m3, e3m2, e2m3, u8, i8, b1x8` (single-bit);
  README recommends **bf16** for modern CPUs.
- **Serialization to file, stream or buffer, including memory-mapped files with random access** — indexes can be
  served "from external memory".
- The npm package's browser-vs-native-addon status is **(UNVERIFIED)** — npmjs.com returned 403 to our fetch.

**Overlap.** The single library that could serve **both** our browser MVP and a future Node/ComfyUI build with one
index format — directly supporting the brief's "Can the web MVP be reused inside ComfyUI?" question.

**Useful idea.** **`i8` / `b1x8` quantized indexes.** Combined with Qwen3-VL-Embedding's quantization-aware training
and MRL, a 2048-d float32 vector (8 KB) becomes a 256-d int8 vector (256 B) — a **32×** reduction. That is what makes
a few-thousand-card local library feasible inside browser storage quotas.

**What we must NOT copy.** Nothing structurally — but do not treat HNSW as free. HNSW memory is roughly
`M × 8–10 bytes per element` (stated on hnswlib, https://github.com/nmslib/hnswlib), and deletion in HNSW is
soft-delete/marking. For a library where users reject references, we need to plan for tombstones and periodic rebuild.

**Our differentiation.** USearch is infrastructure with no opinion about content. Our **Visual Intent** schema —
20 typed, user-editable fields with per-field confidence, and the rule that lens is rendered as `35mm_like`, never
asserted as `35mm` — is a product-level epistemic commitment no index library expresses.

---

## hnswlib-wasm (ShravanSunder/hnswlib-wasm) + hnswlib + FAISS

| | |
|---|---|
| **Repository** | https://github.com/ShravanSunder/hnswlib-wasm (browser); https://github.com/nmslib/hnswlib (native); https://github.com/facebookresearch/faiss |
| **License** | hnswlib-wasm: **Apache-2.0** · hnswlib: **Apache-2.0** · FAISS: **MIT** |
| **License verified** | **Yes, all three** — hnswlib-wasm repo page shows the `Apache-2.0` label and the README says *"hnswlib-wasm is available as open source under the terms of the Apache-2.0 License"*; https://raw.githubusercontent.com/nmslib/hnswlib/master/LICENSE is Apache-2.0; https://raw.githubusercontent.com/facebookresearch/faiss/main/LICENSE is MIT |
| **Main function** | Approximate nearest-neighbour search over HNSW graphs — in the browser (wasm), natively (C++/Python), and at scale (FAISS) |

**Concrete facts:**

- **hnswlib-wasm**: Emscripten build; persistence through the **Emscripten virtual FS synced to IndexedDB (IDBFS)** via
  `writeIndex()` / `readIndex()` / `EmscriptenFileSystemManager.syncFS()`. README example initialises with
  **100,000 max elements**; no hard limit documented. README self-describes: *"This library is still in its early days!"* —
  **experimental**. No Node.js support mentioned. (repo page fetched)
- **hnswlib**: header-only C++ with Python bindings; **incremental insertion and updates**, deletions by **marking**;
  `save_index()` / `load_index()`. Documented caveats: inner product "is not an actual metric" (an element can be
  closer to another element than to itself), and filtered search is slow in Python multithreaded mode. (repo page fetched)
- **FAISS**: MIT; used by clip-retrieval via autofaiss, supports memory-mapped indices (see clip-retrieval above).

**Overlap.** These are the three tiers of the same idea, and they bracket our deployment story:
browser (hnswlib-wasm) → desktop/ComfyUI (hnswlib) → large corpora (FAISS).

**Useful idea.** **IDBFS-backed index persistence** is the concrete answer to "how does a local-first web app keep its
vector index across sessions without a server". Pattern: keep the reference metadata rows in IndexedDB (or SQLite
WASM with OPFS), keep the ANN graph in an Emscripten FS file synced to IndexedDB, and store an explicit
`{embeddingBackendId, dims, quantization, indexVersion}` header so a backend swap invalidates the index instead of
silently returning garbage.

**What we must NOT copy.** Do not adopt an experimental, single-maintainer WASM binding as a load-bearing default;
make ANN an **optional acceleration** behind the same `semantic-search.js` interface whose baseline is an honest
brute-force cosine scan. At a few thousand references, brute force in JS is fine and has zero failure modes.

**Our differentiation.** All three answer "nearest neighbours of this vector". Our brief's ranking is explicitly
**hybrid**: "semantic (multimodal embedding) + structured metadata match → fusion ranking (default ~60/40,
configurable) → optional reranker". The ANN library owns 60% of one half of one stage.

---

## LanguageBind (PKU-YuanGroup/LanguageBind)

| | |
|---|---|
| **Repository** | https://github.com/PKU-YuanGroup/LanguageBind |
| **License** | **MIT** for code; **CC-BY-NC-4.0** for the dataset (VIDAL) |
| **License verified** | **Yes** — repo page shows both labels and the README states *"The majority of this project is released under the MIT license"* and *"The dataset of this project is released under the CC-BY-NC 4.0 license."* |
| **Main function** | Language-centric multimodal pretraining: binds **video, audio, depth, thermal and image** into a shared text-anchored embedding space |

**Concrete facts** (fetched repo page):

- Five bound modalities, all aligned through text.
- Video and audio have LoRA and fully-fine-tuned variants; depth and thermal are LoRA; the image tower is initialised
  from **OpenCLIP** and not fine-tuned → **CLIP-compatible space**.
- Sizes: Large and Huge; video variants at 8 and 12 frames.
- **Embedding dimension is not stated in the README — (UNVERIFIED).**

**Overlap.** Our v0.4 milestone is video analysis, similar-video search and **motion reference mixing**. LanguageBind is
the clearest demonstration that video and image can live in **one** vector space anchored by text — which is what makes
"find a video whose motion matches this still's pose" even conceivable.

**Useful idea.** **One text-anchored space for all modalities.** This is the retrieval-side mirror of our *Visual
Intent* pillar ("every input converts to the SAME structured schema"). Design consequence: our index should be
**modality-tagged but single-space** — one vector table with a `media_type` column — not separate image and video
indexes, otherwise our Unified Modal promise breaks at the storage layer.

**What we must NOT copy.** The **CC-BY-NC-4.0 dataset** must never touch our repo or our reference library; our
License Policy excludes NC by default and the brief bans bulk storage of unknown-license media. Also: LoRA-adapter
sprawl (a different adapter per modality) is a maintenance shape we should not import into `src/ai/embedding.js`.

**Our differentiation.** LanguageBind retrieves whole videos. Our **Reference Decomposition** for video means the
video is decomposed into `motion`, `camera_motion`, `pose`, `lighting`, `scene` — so the user can inherit
*"the camera work of that video"* without inheriting its subject. The brief's success case
"Same movement as this video, but the camera work of that video" requires two videos contributing **different
attribute categories** to one prompt; that is a mixing operation, not a retrieval operation.

---

## InternVideo / InternVideo2 (OpenGVLab/InternVideo)

| | |
|---|---|
| **Repository** | https://github.com/OpenGVLab/InternVideo |
| **License** | **Apache-2.0** |
| **License verified** | **Yes** — GitHub repo page shows the `Apache-2.0` license label. The README does not separately license the weights, so **weight terms are (UNVERIFIED)**. |
| **Main function** | Video foundation models (generative + discriminative) for multimodal video understanding, including a VideoCLIP component for video-text matching |

**Concrete facts** (fetched repo page):

- Variants: InternVideo2 in **S / B / L**, plus an **8B** model; smaller models distilled from InternVideo2-1B.
- Includes a **VideoCLIP** component for video-text matching → usable for video-text retrieval.
- **Embedding dimension not stated in the README — (UNVERIFIED).**

**Overlap.** The heavyweight option for v0.4 similar-video search and camera-motion-aware retrieval.

**Useful idea.** **Distillation ladder (8B → 1B → L/B/S from one teacher).** Same idea as MRL but on the model axis:
publish a family where the small member is a faithful approximation of the large one, so a user can trade quality for
laptop-friendliness *without changing the vector space semantics*. Our adapter registry should expose exactly this as
`quality: 'fast' | 'balanced' | 'enhanced'` while keeping vector compatibility explicit.

**What we must NOT copy.** Its scale. An 8B video model is categorically incompatible with our local-first,
AI-optional default. Anything of this size can only ever be an explicitly-disclosed, explicitly-installed
"enhanced mode" backend — never a requirement, never silently enabled.

**Our differentiation.** InternVideo produces video understanding. Our product produces an **editable
`camera_motion` field** — Static / Pan / Tilt / Dolly / Tracking / Orbit / Handheld / Crane / Push / Pull / Zoom — that
the user can override, mix with another reference's `motion`, and export as a **StructuredPrompt**. The brief's
success case "Describe my video's camera movement as a prompt" is a *composition* deliverable, not a retrieval result.

---

## UX patterns to avoid

- **Mode-separated search surfaces.** clip-retrieval's KNN API takes text **or** image URL **or** base64 —
  mutually exclusive — and its front-end mirrors that. Our brief bans this outright: "No separate image-search page.
  No separate video-search page. Only the input MODE changes." Any adapter whose query object can only hold one
  modality must be wrapped, not exposed.
- **The terminal result grid.** Almost every project here ends at "here are similar images". A grid with no
  USE / EXTRACT / EXPLORE affordances silently degrades our product into reverse image search — one of the four things
  the brief says we are not.
- **Opaque similarity as the only explanation.** A cosine score is unreadable and uneditable. Never show a rank
  without the *typed attributes* that justified it, and never let AI output be a commitment — Visual Intent is always
  a proposal.
- **Silent conflict resolution in ranking.** Vector engines fuse everything into one score. Our ReferenceMix spec is
  explicit: conflicts are "DETECTED and SURFACED, never auto-resolved and never silently dropped".
- **Assert-as-fact rendering of inferred physical parameters.** Retrieval systems happily label things "35mm".
  The brief forbids it: render `35mm_like`.
- **Undisclosed model/weight downloads.** transformers.js pulls weights from a remote hub on first use; a
  local-first app that quietly does this violates our Privacy rule. Disclose, show the size, require a click.
- **Requiring a server for the "real" experience.** Marqo's Docker/Vespa stack is a fine product decision and a fatal
  one for us. AI OFF must remain a complete product.
- **Index rebuild on every content change.** Voy's documented rebuild-on-update would make reference approval feel
  like a batch job.

## Reusable patterns

1. **Backend descriptor registry** (from OpenCLIP `list_pretrained()`): `listBackends() -> [{id, dims, modalities,
   license, licenseUrl, runsInBrowser, quality}]`. License is a **field**, so the UI badges an NC model exactly like
   it badges an NC image.
2. **Instruction-conditioned queries** (from Qwen3-VL-Embedding): the KEEP set of *Search by Difference* becomes the
   instruction string; the CHANGE set becomes a rerank/negative constraint. Degrades gracefully — adapters without
   instruction support just ignore the field.
3. **Weighted multi-part query object** (from Marqo's multimodal query shape): the semantic side of a ReferenceMix is
   `[{source, categories, weight}]`, never a concatenated sentence.
4. **Matryoshka storage tiers** (jina-clip-v2, Qwen3-VL-Embedding, Qwen3-Embedding): store a short prefix for the
   in-browser index, keep the full vector for the desktop path. One embedding pass, two tiers.
5. **Quantized vectors as the browser default** (USearch scalar types + Qwen QAT): `i8` or binary for the local index,
   `f32` only where accuracy is measured to matter.
6. **Vector + metadata in one row, license as a WHERE clause** (sqlite-vec metadata/partition columns): a reference
   whose `status != 'approved'` is unreachable by the retriever *by construction*, not by post-filtering.
7. **Memory-mapped / serialisable index with a compatibility header** (clip-retrieval + USearch + hnswlib-wasm IDBFS):
   persist `{embeddingBackendId, dims, quantization, indexVersion}` so swapping the adapter invalidates rather than
   corrupts.
8. **Single modality-tagged vector space** (LanguageBind): one table with a `media_type` column, not separate image
   and video indexes — otherwise Unified Modal breaks at the storage layer.
9. **Brute force as the correct baseline**: at a few-thousand-card library, an honest cosine scan behind
   `semantic-search.js` has zero failure modes; ANN is an optional acceleration.
10. **Quality/device dial** (transformers.js dtypes): `q8`+WASM on low-end machines, `fp16`+WebGPU on capable ones,
    with a documented fallback chain — this is the brief's "enhanced search mode", implemented honestly.

## Hard technical facts

Verified by direct fetch unless marked.

- **Qwen3-VL-Embedding**: dims **2048 (2B)** / **4096 (8B)**; MRL supported; Apache-2.0 (LICENSE fetched).
- **Qwen3-VL-Embedding** query item accepts text and image **together**: `{"text": ..., "image": ...}`.
- **Qwen3-VL-Embedding** video params: `fps`, `max_frames` (**default 64**); accepts local path, URL, or frame sequence.
- **Qwen3-VL-Embedding** instruction default string: `"Represent the user's input"`.
- **Qwen3-VL-Reranker** exists at 2B and 8B — a separate reranker stage matching our `reranker-adapter`.
- **Qwen3-Embedding (text)**: dims **1024 / 2560 / 4096** for 0.6B / 4B / 8B; **32K** context; 100+ languages.
  License **(UNVERIFIED)**: raw LICENSE 404, no GitHub license label observed.
- **jina-clip-v2** **(UNVERIFIED, host blocked)**: ~865M params; **1024 dims, truncatable to 64**; 512×512 input;
  89 languages; **CC-BY-NC-4.0** weights.
- **SigLIP 2** sizes: **B 86M / L 303M / So400m 400M / g 1B**; resolutions 224/256/384/512 plus **NaFlex**
  (native aspect ratio, variable sequence length). Code Apache-2.0, other materials CC-BY; **checkpoint license not
  stated in the repo doc**.
- **OpenCLIP** is MIT and its registry includes SigLIP and SigLIP2 → SigLIP2 is reachable without new inference code.
- **transformers.js** dtypes: **fp32 (WebGPU default), fp16, q8 (WASM default), q4**; WebGPU via `device: 'webgpu'`,
  explicitly experimental; architectures include CLIP, SigLIP, **JinaCLIP**, Qwen2-VL, Qwen2.5-VL, **Qwen3-VL**.
- **sqlite-vec** supports **float32, int8, binary** vectors, runs **in the browser with WASM**, has metadata/partition
  columns, and is **pre-v1 with expected breaking changes**.
- **Voy**: k-d tree, **75 KB gzipped**, requires **full index rebuild on resource update**, persistence only via
  serialize/deserialize string, WIP.
- **USearch**: HNSW; scalar types include **i8** and **b1x8** (1-bit); **memory-mapped** index files with random
  access; JS/WASM binding listed.
- **hnswlib**: memory ≈ **M × 8–10 bytes per stored element**; deletions are **marks**, not removals; inner product is
  not a true metric.
- **hnswlib-wasm**: persistence via **Emscripten IDBFS ↔ IndexedDB**, `writeIndex()`/`readIndex()`/`syncFS()`;
  README example uses **100,000 max elements**; self-described early-stage.
- **clip-retrieval**: **~50 ms** KNN latency, **~20 q/s**, ~**1,500 samples/s** embedding on a 3080, ~100M embeddings
  in ~20 h; **memory-mapped FAISS**; query modes are **mutually exclusive**.
- **FAISS** is **MIT**; **hnswlib** is **Apache-2.0**; **Voy** and **sqlite-vec** are **Apache-2.0 OR MIT**.
- **Marqo's open-source project is deprecated** per its own README.
- **LanguageBind** binds video/audio/depth/thermal/image via text; image tower from OpenCLIP;
  **MIT code / CC-BY-NC-4.0 dataset**.
- **InternVideo2**: S/B/L plus 8B, smaller models distilled from the 1B checkpoint; Apache-2.0 repo label.

## Open questions

1. **Is there a usable browser-grade multimodal embedder with a permissive license?** jina-clip-v2 is the best
   browser fit but is CC-BY-NC-4.0; SigLIP 2 is permissive but has no confirmed transformers.js/ONNX embedding path we
   verified. This is the decisive unresolved question for a truly local-first v0.3.
2. **Does `Qwen3-VL-Embedding-2B` have an ONNX export usable by transformers.js, and at what memory cost?**
   Architecture support for Qwen3-VL ≠ a working embedding export. Unverified (HF blocked).
3. **What is the confirmed license of the Qwen3-Embedding text models and of the Qwen3-VL-Embedding *weights*
   (as opposed to the repo code)?** Must be verified from the model cards before either is defaulted.
4. **What are the actual MRL truncation points for Qwen3-VL-Embedding, and how much quality is lost at 256 dims?**
   This determines our browser storage budget.
5. **Does any of these models let us weight a *query attribute category*** (e.g. "match composition strongly, colour
   weakly")? If not, category weighting must be implemented entirely in our fusion ranker.
6. **What is the real ceiling for in-browser reference libraries?** IndexedDB/OPFS quotas vs. N references ×
   (thumbnail + metadata + vector) — needs measurement, not estimation.
7. **For video: do we embed whole clips or per-shot keyframes?** Qwen3-VL-Embedding's `max_frames=64` implies clip-level;
   our `camera_motion` extraction implies shot-level. These may need two different index entries per video.
8. **Should the reranker be a separate adapter stage at all in the MVP,** given that Qwen3-VL-Reranker at 2B is far
   heavier than our default posture allows?
9. **Do Wikimedia Commons and Openverse expose anything we can use for pre-computed embeddings,** or must every
   reference be embedded client-side on first approval? (Cross-cluster question for the providers research.)

## Evidence log

URLs actually fetched with WebFetch:

- https://github.com/QwenLM/Qwen3-VL-Embedding
- https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/LICENSE
- https://raw.githubusercontent.com/QwenLM/Qwen3-VL-Embedding/main/README.md
- https://github.com/QwenLM/Qwen3-Embedding
- https://github.com/marqo-ai/marqo
- https://raw.githubusercontent.com/marqo-ai/marqo/mainline/LICENSE
- https://raw.githubusercontent.com/rom1504/clip-retrieval/main/LICENSE
- https://raw.githubusercontent.com/rom1504/clip-retrieval/main/README.md
- https://raw.githubusercontent.com/mlfoundations/open_clip/main/LICENSE
- https://raw.githubusercontent.com/mlfoundations/open_clip/main/README.md
- https://raw.githubusercontent.com/google-research/big_vision/main/LICENSE
- https://github.com/google-research/big_vision/blob/main/big_vision/configs/proj/image_text/README_siglip2.md
- https://github.com/huggingface/transformers.js
- https://raw.githubusercontent.com/huggingface/transformers.js/main/LICENSE
- https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md
- https://github.com/asg017/sqlite-vec
- https://github.com/tantaraio/voy
- https://github.com/unum-cloud/usearch
- https://raw.githubusercontent.com/facebookresearch/faiss/main/LICENSE
- https://github.com/nmslib/hnswlib
- https://raw.githubusercontent.com/nmslib/hnswlib/master/LICENSE
- https://github.com/ShravanSunder/hnswlib-wasm
- https://github.com/PKU-YuanGroup/LanguageBind
- https://github.com/OpenGVLab/InternVideo

Fetches attempted and **BLOCKED / failed** (so anything sourced only from these is marked UNVERIFIED):

- https://huggingface.co/Qwen/Qwen3-VL-Embedding-2B — EGRESS_BLOCKED
- https://huggingface.co/jinaai/jina-clip-v2 — EGRESS_BLOCKED
- https://jina.ai/models/jina-clip-v2/ — EGRESS_BLOCKED
- https://arxiv.org/abs/2601.04720 — EGRESS_BLOCKED
- https://www.modelscope.cn/models/Qwen/Qwen3-VL-Embedding-2B — EGRESS_BLOCKED
- https://www.npmjs.com/package/usearch — HTTP 403
- https://raw.githubusercontent.com/QwenLM/Qwen3-Embedding/main/LICENSE — HTTP 404
- https://github.com/QwenLM/Qwen3-Embedding/blob/main/LICENSE — HTTP 404
- https://raw.githubusercontent.com/asg017/sqlite-vec/main/LICENSE — HTTP 404 (dual license confirmed via repo page label instead)

Search-only evidence (not a direct fetch, treated as UNVERIFIED):

- jina-clip-v2 README front-matter `license: cc-by-nc-4.0`, surfaced as a search result title for
  https://huggingface.co/api/resolve-cache/models/jinaai/jina-clip-v2/5396271eefd4668cdfb31ba1a391fa7bb5247097/README.md
- `google/siglip2-*` model cards reported as `apache-2.0`
- Qwen3-VL-Embedding QAT (LSQ + straight-through estimator, int8/binary) from the technical report PDF listing
