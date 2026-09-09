# Video understanding, frame sampling, and local VLM runtimes

## Why this cluster matters to us

The brief puts video on the critical path twice. Pillar 2 (**Visual Intent**) says every input — text, image, **video**, reference card — must collapse into the *same* structured schema, and that schema has two video-only fields: `motion` and `camera_motion`. Pillar 4 (**Selective Inheritance**) explicitly promises "motion from video D", and the UX north star includes *"Same movement as this video, but the camera work of that video"* and *"Describe my video's camera movement as a prompt."* Milestone v0.4 is "Video analysis, similar-video search, camera motion extraction, motion reference mixing."

So the engineering question is narrow and concrete: **given an uploaded video, how do we cheaply and locally produce a small array of taxonomy tokens** — drawn from the brief's fixed camera-motion vocabulary (Static, Pan Left, Pan Right, Tilt Up, Tilt Down, Dolly In, Dolly Out, Tracking, Orbit, Handheld, Crane, Push In, Pull Out, Zoom In, Zoom Out) and motion vocabulary (Standing, Walking, Running, Dancing, Turning, Sitting, Jumping, Falling, Gesture, Hair Movement, Clothing Movement, with Slow/Medium/Fast speed) — **plus a per-field confidence**, without shipping a GPU cluster and without violating "AI is optional" or "Local-first".

This cluster splits into four layers, and the research below keeps them separate because the brief demands swappable adapters (`src/ai/{analyzer,embedding,reranker}.js`) and forbids AI-model-dependent architecture:

1. **Shot segmentation** — where do the cuts fall (PySceneDetect, FFmpeg `scdet`/`select`, TransNetV2).
2. **Frame sampling** — which frames represent a shot (keyframe/thumbnail/uniform/adaptive strategies).
3. **Geometric camera-motion estimation** — cheap, deterministic, AI-free, works with AI OFF (global motion / homography / partial-affine fit; RAFT as the expensive upper bound; CameraBench as the vocabulary sanity-check).
4. **Semantic description** — a VLM that reads sampled frames and proposes `subject`, `action`, `motion`, `style`… served over an OpenAI-compatible `/v1/chat/completions` (llama.cpp `llama-server`, Ollama, LM Studio, vLLM, MLX-VLM), plus the fully in-browser option (transformers.js / ONNX Runtime Web).

A fifth, MVP-critical layer is **how you get pixels at all in a static web app** (WebCodecs + mp4box.js, `HTMLVideoElement` + `requestVideoFrameCallback` + canvas, ffmpeg.wasm).

---

## PySceneDetect

| | |
|---|---|
| Repository | `Breakthrough/PySceneDetect` — https://github.com/Breakthrough/PySceneDetect |
| License | BSD-3-Clause |
| License verified | Yes — GitHub repository license label reports `{"key":"bsd-3-clause","spdx_id":"BSD-3-Clause"}`, and the README states "BSD-3-Clause; see LICENSE and THIRD-PARTY.md for details." |
| Main function | Python/OpenCV library and CLI that finds shot cuts and fades in a video, then splits the video or saves representative frames per scene |

**Overlap.** This is precisely step 1+2 of our video pipeline. `ContentDetector` computes a weighted per-frame delta in HSV and flags a cut when it exceeds a threshold; the constructor defaults are `threshold: float = 27.0`, `min_scene_len: TimecodeLike = 15` frames, with component weights `delta_hue=1.0, delta_sat=1.0, delta_lum=1.0, delta_edges=0.0` (edges are computed via `cv2.Canny` but are off by default) — read directly from [`content_detector.py`](https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/content_detector.py). `AdaptiveDetector` instead divides the frame score by a rolling average of its neighbours, with `adaptive_threshold=3.0, min_scene_len=15, window_width=2, min_content_val=15.0`, firing only when `adaptive_ratio >= adaptive_threshold and target_score >= min_content_val` ([`adaptive_detector.py`](https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/adaptive_detector.py)). The CLI can already do our sampling step: `scenedetect -i video.mp4 save-images` ([README](https://github.com/Breakthrough/PySceneDetect)).

**Useful idea.** Three things, all portable to JavaScript without touching their code:
1. **Downscale before you measure.** `scene_manager.py` defines `DEFAULT_MIN_WIDTH: int = 256` — "The default minimum width a frame will be downscaled to when calculating a downscale factor" — and `compute_downscale_factor(frame_width, effective_width=DEFAULT_MIN_WIDTH)` picks a factor so the effective width lands between `frame_width` and `1.5 * frame_width` ([`scene_manager.py`](https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/scene_manager.py)). For us, decoding to a 256-px-wide offscreen canvas is the whole performance story in the browser.
2. **The adaptive-ratio trick is the direct answer to our biggest false-positive source.** A fast pan or a whip produces a large absolute frame delta but a *flat* neighbourhood, so a ratio-to-rolling-average test suppresses it. That is exactly the confusion we must avoid: a pan is a `camera_motion` value, not a shot boundary.
3. **`min_scene_len` as a product parameter.** A 15-frame floor is a good default for "don't emit a shot the user cannot see".

**What we must NOT copy.** Do not vendor or transliterate `content_detector.py` / `adaptive_detector.py` into `src/`. The brief prohibits "wholesale copying of external repository code," and BSD-3-Clause attribution obligations would follow the code into our repo. We should implement our own frame-difference measure from the *described algorithm* (HSV component deltas, rolling-window ratio) and cite PySceneDetect as prior art in `THIRD_PARTY_NOTICES.md`. Also do not copy the CLI's mental model: PySceneDetect's output is a *scene list for editing*; ours is *evidence for a VisualIntent proposal*.

**Our differentiation.** PySceneDetect ends at "here are your cuts." We start there: each detected shot becomes a decomposable segment under **Reference Decomposition** — a bag of typed attributes (`camera_motion`, `motion`, `lighting`, `framing`…) that the user can inherit selectively. No scene-detection tool lets you say "take the *motion* from shot 3 of this video and the *lighting* from that photo."

---

## TransNetV2

| | |
|---|---|
| Repository | `soCzech/TransNetV2` — https://github.com/soCzech/TransNetV2 |
| License | MIT (code). Weight-specific terms not separately stated on the pages fetched (UNVERIFIED) |
| License verified | Yes for the repository — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}`; the repo page also shows an MIT license link |
| Main function | Neural shot-boundary detector; handles gradual transitions (dissolves, fades) that pixel-difference detectors miss |

**Overlap.** Same job as PySceneDetect, higher accuracy, much heavier. The [inference README](https://github.com/soCzech/TransNetV2/blob/master/inference/README.md) is unusually explicit about the input contract: frames must be `np.array, shape: [n_frames, 27, 48, 3], dtype: np.uint8, RGB (not BGR)`. `predict_video` returns `video_frames, single_frame_predictions, all_frame_predictions` — two heads, one "single-frame-per-transition" and one "all-frames-per-transition".

**Useful idea.** The 27×48 input resolution is the headline fact. A state-of-the-art shot detector operates on a **1,296-pixel thumbnail per frame**. That is permission to be aggressive about downscaling in *our* geometric analysis too: whatever we compute for `camera_motion` almost certainly does not need more than ~128–256 px of width. The two-head design (a sharp per-cut signal plus a soft per-frame transition signal) is also a nice model for our confidence map: `confidence.camera_motion` can come from a soft signal even when the hard decision is binary.

**What we must NOT copy.** Do not make TransNetV2 a dependency. It is TensorFlow/PyTorch and needs a model download — that directly violates "AI is optional" and "AI OFF must be a complete product" if shot segmentation silently requires it. The MIT license covers the repository, but the *weights'* terms were not separately visible on the pages we fetched — do not redistribute weights until that is checked (UNVERIFIED).

**Our differentiation.** TransNetV2 answers "is frame *i* a transition?" It has no notion of what the shot *is*. Our value is **Unified Modal**: the video's shots surface inside the same modal as image and text results, as reference cards you can EXTRACT from — the mode changes, the modal never closes.

---

## FFmpeg (`scdet`, `select`, keyframe sampling)

| | |
|---|---|
| Repository | `FFmpeg/FFmpeg` — https://github.com/FFmpeg/FFmpeg |
| License | LGPL-2.1-or-later by default; GPL-2.0-or-later when built with `--enable-gpl` |
| License verified | Yes — [`LICENSE.md`](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md): "Most files in FFmpeg are under the GNU Lesser General Public License version 2.1 or later (LGPL v2.1+)", changing to GPL v2+ with `--enable-gpl`, and `--enable-nonfree` produces an unredistributable binary |
| Main function | Decoding, filtering, scene-change scoring and frame extraction; the de-facto reference implementation for cheap video sampling |

**Overlap.** FFmpeg is the reference answer to "how do I sample representative frames." Two mechanisms matter, and both are verifiable in source:

- **`scdet` filter** ([`vf_scdet.c`](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_scdet.c)): options `threshold`/`t` (double, **default 10.0**, range 0–100) and `sc_pass`/`s` (bool, default 0). It writes per-frame metadata keys `lavfi.scd.mafd` (mean absolute frame difference), `lavfi.scd.score`, and `lavfi.scd.time` (set only when the score crosses the threshold).
- **`select` filter's `scene` variable** ([`f_select.c`](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/f_select.c)): computes SAD across planes, then `mafd = sad / count / (1ULL << (bitdepth - 8))`, then `diff = fabs(mafd - prev_mafd)`, and returns `av_clipf(FFMIN(mafd, diff) / 100., 0, 1)` — a **0..1** score. Other expression variables include `n` (frame number from zero), `t` (timestamp in seconds), `pts`, `key` (is-keyframe boolean), and `pict_type`.

**Useful idea.** The `FFMIN(mafd, diff)` formula is the cheapest well-tested scene score in existence and it is *two lines*. It is a normalized 0..1 value, which is exactly the shape our `confidence` map wants. And the `key` / `pict_type` variables point at the cheapest possible sampler of all: **decode only I-frames**. Keyframes are, by construction, the encoder's own opinion about where the picture changed — a free first-pass shot proposal with essentially zero compute.

**What we must NOT copy.** Do not link FFmpeg into anything we distribute without doing the LGPL homework (dynamic linking, relinking rights, `THIRD_PARTY_NOTICES.md`), and never build with `--enable-gpl` or `--enable-nonfree` for a shipped artifact, since the latter is explicitly unredistributable. Also do not copy `mafd`-only thinking into the product: a scene score is a *cut* signal and says nothing about pan vs. dolly.

**Our differentiation.** FFmpeg gives a number per frame. Our pipeline turns a sequence of numbers into typed, user-editable `camera_motion` chips that participate in **Reference Mixing** — the user can take `camera_motion` from video A and `motion` from video B and have the conflict surfaced rather than silently averaged.

---

## Optical flow and global motion: RAFT, and the homography/partial-affine route

| | |
|---|---|
| Repository | `princeton-vl/RAFT` — https://github.com/princeton-vl/RAFT |
| License | BSD-3-Clause |
| License verified | Yes — GitHub license label reports `{"key":"bsd-3-clause","spdx_id":"BSD-3-Clause"}` |
| Main function | Dense per-pixel optical flow (recurrent all-pairs field transforms), reference-quality flow estimation |

| | |
|---|---|
| Repository | `opencv/opencv` — https://github.com/opencv/opencv |
| License | Apache-2.0 on the current default branch (`5.x`) |
| License verified | Yes for the default branch — GitHub license label reports `{"key":"apache-2.0","spdx_id":"Apache-2.0"}`. Whether every historical 4.x release carries the same license is **(UNVERIFIED)** — we did not fetch a 4.x LICENSE |
| Main function | Classical CV toolbox: feature detection, sparse/dense optical flow, `findHomography`, `estimateAffinePartial2D`, `decomposeHomographyMat` |

**Overlap.** This is the layer that answers the actual assignment: *how do we get `camera_motion` cheaply and without a model?*

The classical recipe, corroborated by the survey of the literature we searched ([search results](https://www.google.com/search?q=estimate+camera+motion+pan+tilt+zoom+from+homography+decomposition+OpenCV) surfaced OpenCV's `decomposeHomographyMat`, `findHomography`, `estimateAffinePartial2D` and the PTZ-camera literature), is:

1. Decode two frames a fixed stride apart, greyscale, downscaled to ~192–256 px wide.
2. Get sparse correspondences (corner features + Lucas–Kanade, or phase correlation on a coarse grid).
3. Fit a **4-DOF partial affine** — translation `(tx, ty)`, uniform scale `s`, in-plane rotation `θ` — with RANSAC, or a full 8-DOF homography if you need perspective. OpenCV names for these are `estimateAffinePartial2D` and `findHomography` (signatures **UNVERIFIED**: `docs.opencv.org` is blocked from this environment, so we did not read the exact parameter defaults such as `ransacReprojThreshold`).
4. Accumulate the per-step parameters over the shot and *then* classify.

The classification step is where the brief's taxonomy attaches. Our proposed mapping (this is **our design**, derived from the geometry, not quoted from any source):

| Accumulated signal | Taxonomy token |
|---|---|
| all params ≈ 0, low residual | `Static` |
| sustained `tx < 0` / `tx > 0`, `s ≈ 1` | `Pan Right` / `Pan Left` (image moves opposite to camera) |
| sustained `ty`, `s ≈ 1` | `Tilt Up` / `Tilt Down` |
| sustained `s` growth / shrink | `Zoom In` / `Push In` / `Dolly In` — **ambiguous, see below** |
| sustained `θ` | dutch/roll; combined with translation → `Crane` or `Orbit` candidate |
| large per-step variance, near-zero cumulative sum | `Handheld` |
| global motion cancels a tracked subject's motion | `Tracking` |

**The honest limitation, and it is a product-design fact, not a bug.** A single global homography **cannot distinguish a dolly-in from a zoom-in** when the scene is planar or distant: both produce a uniform scale increase. Separating them requires parallax — different depth layers scaling at different rates — which means either a non-global motion model or depth. Therefore `camera_motion` for the "getting closer" family must be emitted as a *low-confidence set* (`["Dolly In","Push In","Zoom In"]` with `confidence.camera_motion ≈ 0.4`) and resolved by the user, not guessed. This is a geometric argument, not a fetched claim (**UNVERIFIED** as a citation; it follows from the projective model). Fortunately the brief already mandates the right UI: "VisualIntent is ALWAYS user-editable. AI output is a proposal, never a commitment."

**Useful idea from RAFT specifically.** RAFT is the accuracy ceiling to *benchmark against*, not to ship. Its value to us is as an offline oracle: run RAFT once, offline, on a small labelled clip set, to calibrate the thresholds of our cheap sparse estimator. Ship the cheap one; validate with the expensive one.

**What we must NOT copy.** Do not ship RAFT (PyTorch, weights, GPU) in an MVP that must run locally in a browser. Do not ship `opencv.js` reflexively either — it is a multi-megabyte WASM download for what amounts to a few hundred lines of least-squares fitting; that cost is real on a static web app's first paint. And do not copy any project's *thresholds* as if they were universal; they must be calibrated on our own clips.

**Our differentiation.** Every optical-flow project outputs a flow field or a trajectory. We output a **typed, inheritable attribute**. Under **Selective Inheritance**, `camera_motion` extracted from a video is a first-class citizen that can be transplanted onto a *still-image* reference's composition — "same movement as this video, but the camera work of that video" is a mixing operation over typed attributes, which no flow library models at all.

---

## CameraBench

| | |
|---|---|
| Repository | `sy77777en/CameraBench` — https://github.com/sy77777en/CameraBench |
| License | CC-BY-4.0 |
| License verified | Yes — the repo's [`LICENSE`](https://raw.githubusercontent.com/sy77777en/CameraBench/main/LICENSE) is the "Creative Commons Attribution 4.0 International Public License" (no non-commercial clause). Note GitHub's own label reports `NOASSERTION`/"Other", so the file is the authority here |
| Main function | Benchmark + dataset + fine-tuned VLMs for classifying camera motion in real video (NeurIPS 2025 Spotlight) |

**Overlap.** Direct: this is the only serious public work whose *output vocabulary* is the same kind of thing as our `camera_motion` field. Per the repo, the public test set is "1 000+ videos with expert labels & captions", the SFT set adds "≈1,400 extra annotated clips", and three fine-tuned Qwen2.5-VL models (7B / 32B / 72B) are released for camera-motion classification and video-text retrieval. The taxonomy was designed with cinematographers, and the paper's finding (from the search abstract) is that generative VLMs **trail classical SfM/SLAM on pure geometry but beat discriminative VLMs and capture scene-aware cues SfM misses** — for example "follow"/tracking requires knowing there is a moving subject.

**Useful idea.** That finding is the strongest architectural evidence in this whole cluster, and it maps cleanly onto the brief's separation of concerns: **geometry and semantics are different modules**. Our `camera_motion` should be a *fusion* of (a) the cheap geometric estimator, which is right about pan/tilt/roll/static and AI-free, and (b) the VLM, which is right about `Tracking`/`Orbit`/`Handheld`-as-style because those require understanding the subject. That is exactly the brief's "Retrieval and analysis are SEPARATE modules" discipline, applied one level down.

**What we must NOT copy.** The repo is CC-BY-4.0, which is a *content* licence, not a code licence — attribution is required and applying it to source code is awkward. Do not vendor their taxonomy JSON or their prompts into `data/taxonomy/*.json` verbatim; our taxonomy is already fixed by the brief and must stay ours. Do not import their videos: the brief's licence policy forbids bulk storage of unknown-licence media, and their training set is behind an access-request form. Cite the paper as prior art in `docs/THIRD_PARTY_REVIEW.md`.

**Our differentiation.** CameraBench asks a video "what is the camera doing?" and scores the answer. We ask "what is the camera doing, **so the user can take that and nothing else** and paste it onto a different reference." **Reference Mixing** — combining `camera_motion` from one clip with `pose` and `clothing` from two stills into one structured prompt — is not a benchmark task and no model in this cluster is aimed at it.

---

## Qwen3-VL (video-capable VLM family)

| | |
|---|---|
| Repository | `QwenLM/Qwen3-VL` — https://github.com/QwenLM/Qwen3-VL |
| License | Apache-2.0 for the repository. **Per-checkpoint weight licences not verified** — `huggingface.co` is blocked from this environment (UNVERIFIED) |
| License verified | Yes for the repository — GitHub license label reports `{"key":"apache-2.0","spdx_id":"Apache-2.0"}`. No for the weights |
| Main function | Multimodal LLM family with explicit long-video and timestamp-grounding capabilities |

**Overlap.** This is the leading candidate for the `analyzer-adapter` in AI-ON mode. From the [README](https://raw.githubusercontent.com/QwenLM/Qwen3-VL/main/README.md): "Interleaved-MRoPE — full-frequency allocation over time, width, and height"; "Text–Timestamp Alignment … moves beyond T-RoPE to precise, timestamp-grounded event localization"; "Native 256K context, expandable to 1M; handles books and hours-long video with full recall and second-level indexing." Released sizes span 2B / 4B / 8B / 32B dense and 30B-A3B / 235B-A22B MoE, in Instruct and Thinking editions.

**Useful idea — this is the single most actionable fact in the cluster.** The processor's own sampling knobs tell us what "representative frames" means in practice for a VLM: **`fps=2` and `do_sample_frames=True` by default**; you can instead "set `num_frames = 128` and overwrite the fps to None"; and `total_pixels` limits the video's token budget with the guidance to keep it "below 24576 * 32 * 32 to avoid excessively long input sequences." Translated to our MVP: **~2 fps, capped at a fixed frame count, at a small resolution** is the sanctioned operating point. We should sample *shot-aware* rather than uniformly — one representative frame per detected shot plus first/middle/last within long shots — but the total budget is the same order of magnitude.

The 2B and 4B sizes matter because the brief names "Qwen3.5-9B class for analysis" as a *candidate to evaluate, not hardcode*; a 2B/4B VL model is the realistic laptop-local floor.

**What we must NOT copy.** Do not hardcode `qwen3-vl` anywhere. The brief: "Model names/backends must NEVER be hardcoded." The model id belongs in adapter config. Do not ship weights or assume weight terms match the Apache-2.0 repo licence until each checkpoint's card is read. And do not let the VLM's fluent prose leak into the product as prose — it must be parsed into the VisualIntent schema, and per the brief `lens` must be rendered as "35mm_like", never asserted as fact.

**Our differentiation.** Qwen3-VL will happily write you a paragraph about a video. Our product refuses to stop there: the paragraph is discarded and only the typed decomposition survives, because **Reference Decomposition** ("a reference is not a picture; it is a bag of typed visual attributes") is what makes **Search by Difference** possible — keep composition+lighting+camera, change clothing.

---

## llama.cpp (`llama-server`) — the pragmatic local adapter target

| | |
|---|---|
| Repository | `ggml-org/llama.cpp` — https://github.com/ggml-org/llama.cpp |
| License | MIT |
| License verified | Yes — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}` |
| Main function | C/C++ LLM inference; `llama-server` exposes an OpenAI-compatible `/chat/completions` endpoint, with multimodal input via `libmtmd` |

**Overlap.** This is the concrete answer to "what is a realistic local-first runtime story." Per [`docs/multimodal.md`](https://raw.githubusercontent.com/ggml-org/llama.cpp/master/docs/multimodal.md): multimodal is supported by `llama-mtmd-cli` and by **`llama-server` via the OpenAI-compatible `/chat/completions` API**; you pass `-m model.gguf` together with `--mmproj file.gguf` (the multimodal projector); the projector is offloaded to GPU by default and `--no-mmproj-offload` disables that; supported vision families listed include Gemma 3, SmolVLM, Pixtral 12B, Qwen 2 VL, Qwen 2.5 VL, Mistral Small, InternVL, Llama 4 Scout, Moondream2 and Gemma 4; and the docs state "we support **image**, **audio** and **video** input."

**Useful idea.** The **two-file model contract** (`-m` + `--mmproj`) is a config-shape lesson for `src/ai/analyzer.js`: a local analyzer adapter's config is not one string but a small object (`{ baseUrl, model, mmproj?, contextLength }`), and the UI must be able to report "vision unavailable — no projector loaded" as a first-class state rather than failing a request. Second lesson: because `llama-server` speaks OpenAI chat-completions, **one adapter covers llama.cpp, Ollama, LM Studio and vLLM**. That is the whole local-first story: implement `POST {baseUrl}/v1/chat/completions` with `messages[].content[]` carrying `{type:"image_url", image_url:{url:"data:image/jpeg;base64,…"}}` once.

**What we must NOT copy.** Nothing to copy — MIT, and we consume it over HTTP. The trap is architectural: do not build the analyzer around llama.cpp-only features (`--mmproj`, GGUF quant names, `/props`). Anything outside the OpenAI-compatible surface goes behind an optional capability flag.

**Our differentiation.** llama.cpp is a runtime; it has no opinion about what a reference *is*. We are the layer that makes a local model's output safe to trust: every field lands in a user-editable VisualIntent with a confidence, which is the operational meaning of **Visual Intent** as a pillar — the same schema whether the input was text, an image, a video, or a card.

---

## Ollama

| | |
|---|---|
| Repository | `ollama/ollama` — https://github.com/ollama/ollama |
| License | MIT |
| License verified | Yes — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}` |
| Main function | Local model runner with a model registry, plus an OpenAI-compatible API layer on `http://localhost:11434/v1/` |

**Overlap.** The lowest-friction local backend for a non-technical user. Ollama provides compatibility with parts of the OpenAI API including `/v1/chat/completions`, `/v1/embeddings` and `/v1/models`, so existing OpenAI SDKs work by changing `base_url` to `http://localhost:11434/v1/`; images travel as `{type:"image_url"}` with a `data:image/png;base64,…` URL, and the compatibility layer extracts the base64 payload into Ollama's native `Images` field ([Ollama OpenAI-compatibility docs](https://docs.ollama.com/api/openai-compatibility) — page itself is **blocked from this environment**, facts taken from the search summary of that page and of [`ollama.readthedocs.io/en/openai/`](https://ollama.readthedocs.io/en/openai/), also blocked; therefore **(UNVERIFIED)** at the level of exact quoted wording, though the endpoint set and base URL are consistent across sources).

**Useful idea.** `/v1/embeddings` being present on the *same* base URL as `/v1/chat/completions` means our `analyzer-adapter` and `embedding-adapter` can share one connection config in the v0.3 milestone (multimodal embedding, similar-image search). Also: because Ollama exposes `/v1/models`, the settings UI can *discover* what the user has locally instead of asking them to type a model name — which is the practical way to honour "model names must never be hardcoded".

**What we must NOT copy.** Do not assume Ollama's vision path is bug-free or universal; community reports of vision failures on the OpenAI-compat route exist. Design the adapter to fall back to the native `/api/chat` shape behind a flag, and never make image analysis a hard requirement of the app.

**Our differentiation.** Ollama is a plumbing choice we deliberately keep swappable. Our identity is **Unified Modal** — one modal in which Text / Image / Video / Browse modes share state and the modal never closes mid-exploration. Which local server answered a request is an implementation detail the user should never be forced to care about, beyond the mandated privacy disclosure.

---

## LM Studio and vLLM (the rest of the OpenAI-compatible field)

| | |
|---|---|
| Repository | `lmstudio-ai/lms` (CLI) — https://github.com/lmstudio-ai/lms ; the LM Studio desktop app itself is not open source |
| License | MIT for the `lms` CLI. **LM Studio desktop application: proprietary (UNVERIFIED)** — `lmstudio.ai` is blocked from this environment and we did not read its terms |
| License verified | Yes for `lms` — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}`. No for the desktop app |
| Main function | Desktop local-model runner exposing an OpenAI-compatible server on `http://localhost:1234/v1` |

| | |
|---|---|
| Repository | `vllm-project/vllm` — https://github.com/vllm-project/vllm |
| License | Apache-2.0 |
| License verified | Yes — GitHub license label reports `{"key":"apache-2.0","spdx_id":"Apache-2.0"}` |
| Main function | High-throughput GPU serving engine with an OpenAI-compatible server, including multimodal `video_url` content parts |

**Overlap.** Both reinforce the same conclusion: `/v1/chat/completions` is the lingua franca. LM Studio defaults to `http://localhost:1234/v1` and "any tool that speaks the OpenAI Chat Completions schema connects to it without code changes — just swap the base URL" ([search summary of lmstudio.ai/docs/developer/openai-compat](https://lmstudio.ai/docs/developer/openai-compat), page blocked — **(UNVERIFIED)** wording). vLLM additionally accepts a **`video_url` content type** in chat completions with a default 30-second HTTP fetch timeout, and gates multimodal counts with `--limit-mm-per-prompt` (e.g. `--limit-mm-per-prompt.image 2`) ([search summary of docs.vllm.ai multimodal inputs](https://docs.vllm.ai/en/stable/features/multimodal_inputs/), page blocked — **(UNVERIFIED)** wording).

**Useful idea.** vLLM's `video_url` is the only place in this cluster where a server takes *a video* rather than *frames*. That tempts a shortcut, and we should refuse it for the MVP: sending a whole video to a server means uploading the user's media, which collides with "Local-first. User images/videos processed locally by default. Any external API transmission must be explicitly disclosed in the UI." Our adapter should send **sampled frames as images**, which is (a) portable across all four runtimes, (b) an order of magnitude cheaper, and (c) privacy-legible — we can literally show the user the N frames that will be sent.

**What we must NOT copy.** Do not build for vLLM's GPU-server assumptions (paged attention, tensor parallel, `--limit-mm-per-prompt`) in a product whose MVP is a static web app. And do not adopt LM Studio's "download a 20 GB model to try the app" onboarding: the brief's v0.1 milestone is explicitly "NO AI required".

**Our differentiation.** All of these are inference servers competing on tokens/second. We compete on **Search by Difference** — letting a user mark KEEP (composition, lighting, camera) and CHANGE (clothing) categories and retrieve against that delta. No serving engine has a concept of a partially-inherited reference.

---

## MLX-VLM

| | |
|---|---|
| Repository | `Blaizzy/mlx-vlm` — https://github.com/Blaizzy/mlx-vlm |
| License | MIT |
| License verified | Yes — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}` |
| Main function | Inference and fine-tuning of vision-language (and omni) models on Apple Silicon via MLX, with a CLI and an OpenAI-compatible server |

**Overlap.** The Mac-native leg of the local story, and notable because it explicitly covers video. From the [README](https://raw.githubusercontent.com/Blaizzy/mlx-vlm/main/README.md): "MLX-VLM also supports video analysis such as captioning, summarization, and more, with select models" (Qwen2-VL, Qwen2.5-VL among them); the server is launched with `mlx_vlm.server --port 8080` and provides an "OpenAI-compatible chat-style interaction endpoint with support for images, audio, and text", exposing `/v1/chat/completions`, `/v1/embeddings` and `/v1/rerank`. The CLI form is `mlx_vlm.generate --model mlx-community/Qwen2-VL-2B-Instruct-4bit --max-tokens 100 --image <url>`.

**Useful idea.** MLX-VLM exposes `/v1/chat/completions`, `/v1/embeddings` **and** `/v1/rerank` on one server — which is exactly the three adapters the brief names (`analyzer`, `embedding`, `reranker`). That is a strong hint that our adapter interfaces should be three thin functions over one shared `baseUrl` config, not three unrelated integrations. It also validates the brief's hybrid-search plan (semantic + structured → fusion → *optional reranker*) as something a single local box can actually serve.

**What we must NOT copy.** Do not make Apple Silicon a first-class assumption; it is one backend among several. The 4-bit `mlx-community/...-4bit` naming convention is also a reminder not to bake quantization suffixes into config defaults.

**Our differentiation.** MLX-VLM will caption a video. A caption is prose, and prose is the thing the brief explicitly refuses to end at — "NOT a generic prompt builder", "must never degrade into 'pick a few options → get a prompt'". Our output is a `StructuredPrompt` plus a `ReferenceMix` that records *which reference contributed which category*, so the composition is reproducible, editable, and re-mixable as a Visual Recipe.

---

## In-browser decoding: WebCodecs + mp4box.js

| | |
|---|---|
| Repository | Spec: `w3c/webcodecs` — https://github.com/w3c/webcodecs ; demuxer: `gpac/mp4box.js` — https://github.com/gpac/mp4box.js |
| License | WebCodecs is a W3C specification (no software licence applies to us); mp4box.js is BSD-3-Clause |
| License verified | Yes for mp4box.js — its [`LICENSE`](https://raw.githubusercontent.com/gpac/mp4box.js/master/LICENSE) is the BSD 3-Clause License, and the GitHub label reports `{"key":"bsd-3-clause","spdx_id":"BSD-3-Clause"}`. The W3C spec's document licence was not fetched (UNVERIFIED) |
| Main function | WebCodecs gives JS direct access to the browser's hardware/software video decoders; mp4box.js parses the MP4 container to feed it |

**Overlap.** This is the fast path for MVP video decoding, and its most important property is a *limitation*. The [WebCodecs explainer](https://raw.githubusercontent.com/w3c/webcodecs/main/explainer.md) lists as explicit **non-goals**: "Direct APIs for media containers (muxers/demuxers)" and "Writing codecs in JavaScript or WebAssembly" — "Applications must handle their own containerization and network transport." The interfaces provided are `EncodedVideoChunk`, `VideoFrame`, `VideoEncoder`, `VideoDecoder` (plus audio equivalents and `MediaStreamTrackProcessor`).

So the browser gives you a *decoder* but not a *demuxer*. mp4box.js fills exactly that hole: it parses the MP4 boxes and hands you `EncodedVideoChunk`-shaped samples plus the `avcC`/`hvcC` description needed for `VideoDecoder.configure()`. That pairing is the standard 2026 recipe.

Support, per the search results: WebCodecs is supported in Chrome/Edge 94+, Firefox 130+ desktop (not Firefox for Android), Opera 80+, Samsung Internet 17+, and Safari 26.0+ on macOS/iOS/iPadOS, with Safari having had `VideoEncoder`/`VideoDecoder` since 16.4 and audio only from 26; global coverage was cited as ~95.5% (Can I Use, 2025) — **(UNVERIFIED)**: these figures come from third-party summaries, not from caniuse or MDN directly, both of which are blocked from this environment.

**Useful idea.** The demuxer/decoder split is a gift for our architecture. Because mp4box.js gives us the **sample table before decoding**, we can read *which samples are sync samples (keyframes)* and *their timestamps* without decoding a single pixel. That means the cheapest possible representative-frame sampler is: parse container → take sync-sample timestamps → decode only those → downscale to a 256-px canvas → run the difference/motion math. A 2-minute clip might have a few hundred keyframes, and decoding a few dozen of them is milliseconds of GPU work.

**What we must NOT copy.** Don't vendor mp4box.js source into `src/`; take it as a dependency and record BSD-3-Clause attribution in `THIRD_PARTY_NOTICES.md`. Don't assume MP4: WebM/VP9 and MKV need a different demuxer, so container support must be a declared capability with a graceful "unsupported format — falling back" path. And don't leak `VideoFrame` objects: they hold GPU/system memory and must be `.close()`d, or a long video will exhaust the browser.

**Our differentiation.** WebCodecs is a pixel pump. What we build on top of it is **Visual Intent** — every input, including a video the user dragged into the same modal they were just typing a text query into, converts to the identical structured schema. The decoding path is invisible to the user by design ("User should never need to know where to search" extends to "…or how their video was decoded").

---

## In-browser decoding: `HTMLVideoElement` + `requestVideoFrameCallback` + canvas

| | |
|---|---|
| Repository | `WICG/video-rvfc` — https://github.com/WICG/video-rvfc |
| License | WICG specification (document licence not fetched — UNVERIFIED). No code dependency for us |
| License verified | No |
| Main function | Callback fired when a new video frame is presented for composition, carrying frame-accurate metadata |

**Overlap.** This is the **universal fallback** and, for the MVP, arguably the primary path: it works wherever `<video>` works, needs no demuxer, no WASM, and no cross-origin isolation. From the [explainer](https://raw.githubusercontent.com/WICG/video-rvfc/gh-pages/explainer.md), the metadata dictionary carries `presentationTime` ("The time at which the user agent submitted the frame for composition"), `expectedDisplayTime`, `width`/`height` ("The width and height of the presented video frame"), `mediaTime` ("The media presentation time in seconds of the frame presented"), `presentedFrames` ("A count of the number of frames submitted for composition") and `processingDuration`. It exists because sites previously "use unreliable heuristics (checking `currentTime > 0`, listening for `canplaythrough`)" and had to blindly call `drawImage`. Caveats quoted in the explainer: callbacks fire at "the minimum between video rate and browser rate", do not fire in error states or for encrypted media, and are **one-shot — they must be re-registered**. Support was described in the search results as available across latest browsers since October 2024 (**UNVERIFIED**: MDN and caniuse are blocked here).

**Useful idea.** Two practical patterns fall out. (1) **Seek-and-grab**: set `video.currentTime = t`, wait for the `rvfc` callback, `drawImage` into a 256-px offscreen canvas, read back with `getImageData`. Because `mediaTime` is reported, you know *exactly which frame* you got — which matters when you are labelling a shot with a timestamp for the reference card. (2) **Play-and-sample**: play muted at high `playbackRate` and grab every Nth callback, using `presentedFrames` to detect drops. Pattern (1) is right for shot-representative frames; pattern (2) is right for the motion estimator, which needs *consecutive* frames at a known stride.

**What we must NOT copy.** Do not build the estimator on `requestAnimationFrame` + `currentTime` heuristics — the explainer says plainly that this is what the API exists to replace. Do not read pixels from a cross-origin `<video>`; the canvas will be tainted and `getImageData` throws. Since our references come from Openverse/Wikimedia URLs, *remote* video analysis will hit this: analysis must be limited to user-uploaded local files (which is what "Local-first" wants anyway) unless CORS headers permit otherwise.

**Our differentiation.** This API is how we can honestly claim **local-first video analysis in a static web app** with zero server and zero model download: geometric `camera_motion` extraction runs entirely in the user's tab, which makes the AI-OFF product genuinely complete rather than a degraded demo — satisfying the brief's question 6 ("Does the product work with no AI at all?") for video, not just for images.

---

## ffmpeg.wasm

| | |
|---|---|
| Repository | `ffmpegwasm/ffmpeg.wasm` — https://github.com/ffmpegwasm/ffmpeg.wasm |
| License | MIT for the wrapper; the compiled FFmpeg core it ships is LGPL-2.1-or-later (or GPL depending on build flags) |
| License verified | Yes for the wrapper — GitHub license label reports `{"key":"mit","spdx_id":"MIT"}` and the repo page shows a "License: MIT" badge. The **core build's** effective licence was not read from `ffmpeg.wasm-core` (UNVERIFIED); FFmpeg's own [`LICENSE.md`](https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md) confirms LGPL-2.1+ by default |
| Main function | FFmpeg compiled to WebAssembly, giving full transcode/filter capability inside the browser |

**Overlap.** The heavyweight in-browser option: it would let us run `scdet` or `select='gt(scene,0.4)'` client-side, exactly as on a server. Tempting, and mostly wrong for us.

**Useful idea.** Keep it as an **optional, lazily-loaded capability for formats WebCodecs cannot handle** (odd containers, unusual codecs). The lesson is the loading strategy, not the library: a multi-megabyte WASM payload must never be on the critical path of a static web app's first render, and must be fetched only after the user actually drops an unsupported file.

**What we must NOT copy.** The licence stack is the real hazard. An MIT wrapper around an LGPL (or, with the wrong flags, GPL) core means we must record the core's actual build licence in `THIRD_PARTY_NOTICES.md` and preserve LGPL relinking rights — and the brief already separates reference licensing from code licensing (question 8), so this belongs in the code-licence column and must not be conflated with the CC-licence pipeline for media. Also: multi-threaded builds require `SharedArrayBuffer`, which requires cross-origin isolation headers (COOP/COEP) — a *hosting* requirement that a plain static file host may not satisfy (**UNVERIFIED**: we did not fetch the ffmpeg.wasm README's own statement on this).

**Our differentiation.** ffmpeg.wasm is a general-purpose media tool. We are not building a video tool; we are building a reference composer in which video is one of four input modes into a single **Unified Modal**. Our video code should be the smallest thing that can produce `camera_motion` and `motion` tokens, not a media pipeline.

---

## transformers.js and ONNX Runtime Web

| | |
|---|---|
| Repository | `huggingface/transformers.js` — https://github.com/huggingface/transformers.js ; `microsoft/onnxruntime` — https://github.com/microsoft/onnxruntime |
| License | transformers.js: Apache-2.0. ONNX Runtime: MIT |
| License verified | Yes for both — GitHub license labels report `{"key":"apache-2.0","spdx_id":"Apache-2.0"}` and `{"key":"mit","spdx_id":"MIT"}` respectively. (Note: a quick read of the transformers.js README badge suggested MIT; the repository's own licence label is Apache-2.0 and is authoritative) |
| Main function | Run transformer models directly in the browser; transformers.js is a JS API over ONNX Runtime Web |

**Overlap.** This is the only path to AI features with **no server at all**, which matters enormously for a static-web-app MVP that promises local-first privacy. Per the [transformers.js README](https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md), it "uses ONNX Runtime to run models in the browser", with a default WASM/CPU backend and an optional WebGPU backend enabled via `device: 'webgpu'`, carrying the caveat "The WebGPU API is still experimental in many browsers, so if you run into any issues, please file a bug report." Models come from the Hugging Face Hub, converted to ONNX with Optimum. Supported tasks span NLP, vision (classification, detection, segmentation, depth) and **multimodal embeddings / zero-shot classification**. The [ONNX Runtime Web README](https://raw.githubusercontent.com/microsoft/onnxruntime/main/js/web/README.md) lists four backends — WebAssembly (CPU), WebGL (maintenance mode), WebGPU (experimental) and WebNN (experimental) — and notes multi-threading support, with "Node.js only support single-threaded `wasm` EP."

**Useful idea.** The realistic browser-side AI for us is **embeddings, not generation**. A CLIP-class multimodal embedding model is small enough to run in-tab and is precisely what milestone v0.3 needs ("Multimodal embedding, similar-image search, image-to-reference search, hybrid ranking"). Running a *VLM analyzer* in-browser is not realistic at MVP scale; running an *embedder* over sampled video frames is. That gives a clean split: `embedding-adapter` can have a browser implementation, `analyzer-adapter` defaults to the OpenAI-compatible local server.

**What we must NOT copy.** Do not let a first visit download hundreds of megabytes of ONNX weights — model download must be an explicit, user-initiated opt-in with a visible size, consistent with "Any external API transmission must be explicitly disclosed in the UI" (the same honesty principle applies to large downloads). Do not depend on WebGPU: the README itself calls it experimental, so WASM must remain the fallback. Do not assume multi-threaded WASM is available — that generally requires `SharedArrayBuffer` and cross-origin isolation (**UNVERIFIED**: the ORT Web README we fetched did not discuss SIMD/COOP/COEP).

**Our differentiation.** These libraries make models runnable in a page; they do not make results *composable*. Our contribution is the fusion layer the brief specifies — semantic embedding score blended ~60/40 with structured metadata match — feeding **Search by Difference**, where a query is not a vector but a set of KEEP and CHANGE categories over a decomposed reference.

---

## UX patterns to avoid

- **Presenting a camera-motion guess as a fact.** The dolly/zoom ambiguity is geometric and irreducible from a single homography. Showing "Dolly In" with no confidence and no alternatives will be wrong often, and the brief already forbids this posture ("AI output is a proposal, never a commitment"; `lens` must render as "35mm_like"). Show a small set with confidences and let the user pick.
- **A progress bar with no visible intermediate result.** Shot detection and motion estimation on a 2-minute clip take seconds. Showing shot thumbnails as they are found — and letting the user click one immediately — is the difference between "the app is thinking" and "the app is working with me."
- **Prose captions as the deliverable.** Every VLM tool in this cluster ends at a paragraph. The brief's hard line is that we never degrade into "pick a few options → get a prompt"; a caption is the same failure wearing different clothes.
- **A separate "video search" page or a separate "analyze video" screen.** Pillar 1 is explicit: no separate image-search page, no separate video-search page, one modal, mode switch only, state persists, modal never closes mid-exploration.
- **Requiring a model download before anything works.** LM Studio–style onboarding ("install 20 GB, then we'll talk") kills v0.1, which must be complete with NO AI.
- **Silently uploading the user's video.** vLLM's `video_url` makes this a one-line temptation. Frames, not files; and disclose exactly what leaves the machine.
- **Auto-resolving conflicts between references.** When video A says `Pan Left` and video B says `Dolly In`, the brief requires detection and surfacing with a dominance question — never a silent merge or a silent drop.
- **Uniform frame sampling as the only strategy.** Sampling every Nth frame across a multi-shot video produces a mush of unrelated shots and a nonsense "temporal summary". Segment first, then sample within segments.

## Reusable patterns

- **Downscale-first analysis.** PySceneDetect's `DEFAULT_MIN_WIDTH = 256` and TransNetV2's 27×48 input are independent confirmations that shot/motion analysis needs almost no resolution. Decode into a small offscreen canvas and never touch full-res pixels.
- **Sync samples as free shot candidates.** mp4box.js exposes the sample table before decoding; FFmpeg's `select` filter exposes `key` and `pict_type`. Keyframe positions are a zero-cost first-pass segmentation.
- **Absolute score AND ratio-to-neighbourhood.** PySceneDetect's `AdaptiveDetector` (`adaptive_ratio >= 3.0` *and* `target_score >= 15.0`) and FFmpeg's `FFMIN(mafd, diff)` both encode the same insight: a cut is a *local outlier*, not merely a big number. This is what stops a whip pan from being read as a cut.
- **Two-headed output → confidence map.** TransNetV2's sharp single-frame head plus soft all-frames head maps directly onto our `confidence` field: emit a hard label and a soft score, never a bare label.
- **Geometry for what geometry knows, semantics for the rest.** CameraBench's finding (VLMs trail SfM on geometry but capture scene-aware cues SfM misses) argues for computing pan/tilt/roll/static geometrically and reserving `Tracking`/`Orbit`/`Handheld` for the semantic pass — mirroring the brief's "analyzer understands; retriever ranks" separation.
- **One OpenAI-compatible adapter for four runtimes.** llama.cpp `llama-server`, Ollama (`:11434/v1`), LM Studio (`:1234/v1`) and vLLM all speak `/v1/chat/completions` with `image_url` data-URI parts. Write it once; put `{baseUrl, model}` in config; use `/v1/models` to populate a picker rather than hardcoding names.
- **Three adapters, one base URL.** MLX-VLM serving `/v1/chat/completions`, `/v1/embeddings` and `/v1/rerank` from one process shows our `analyzer` / `embedding` / `reranker` adapters should share connection config.
- **A concrete definition of "temporal summary".** In practice it is a two-level structure, and it is what feeds VisualIntent's array fields:
  ```
  shots: [
    { shot_id, t_start, t_end, keyframe_t,
      camera_motion: [{value, confidence}],
      motion:        [{value, confidence}],
      speed: "slow|medium|fast",
      thumbnail_ref }
  ]
  summary: { dominant_camera_motion, camera_motion_sequence, shot_count,
             mean_shot_length, cut_rate, global_motion_energy }
  ```
  The per-shot rows are what a user picks from when doing **Selective Inheritance**; the roll-up is what feeds similar-video retrieval. Both are arrays of typed tokens plus confidences — i.e. exactly the VisualIntent shape, not prose.
- **Frame budget as a first-class setting.** Qwen3-VL's defaults (`fps=2`, `do_sample_frames=True`, or `num_frames=128` with fps disabled, and `total_pixels` kept below `24576*32*32`) give us a sane, sourced starting point for "how many frames does a VLM want".

## Hard technical facts

- **PySceneDetect `ContentDetector` defaults**: `threshold=27.0`, `min_scene_len=15` frames, component weights `delta_hue=1.0, delta_sat=1.0, delta_lum=1.0, delta_edges=0.0`; difference computed in HSV via `cv2.cvtColor(frame_img, cv2.COLOR_BGR2HSV)`; optional edge channel via `cv2.Canny`. Source: `scenedetect/detectors/content_detector.py`.
- **PySceneDetect `AdaptiveDetector` defaults**: `adaptive_threshold=3.0`, `min_scene_len=15`, `window_width=2`, `min_content_val=15.0`; fires when `adaptive_ratio >= adaptive_threshold and target_score >= min_content_val`. Source: `scenedetect/detectors/adaptive_detector.py`.
- **PySceneDetect downscaling**: `DEFAULT_MIN_WIDTH: int = 256`; `compute_downscale_factor(frame_width, effective_width=DEFAULT_MIN_WIDTH)`; `auto_downscale=True` by default on `SceneManager`. Source: `scenedetect/scene_manager.py`.
- **TransNetV2 input contract**: `np.array, shape: [n_frames, 27, 48, 3], dtype: np.uint8, RGB (not BGR)`; `predict_video` returns `video_frames, single_frame_predictions, all_frame_predictions`. Source: TransNetV2 `inference/README.md`.
- **FFmpeg `scdet`**: options `threshold`/`t` (double, default **10.0**, range 0–100) and `sc_pass`/`s` (bool, default 0); metadata keys `lavfi.scd.mafd`, `lavfi.scd.score`, `lavfi.scd.time`. Source: `libavfilter/vf_scdet.c`.
- **FFmpeg `select` scene score**: `mafd = sad / count / (1ULL << (bitdepth - 8))`; `diff = fabs(mafd - prev_mafd)`; score = `av_clipf(FFMIN(mafd, diff) / 100., 0, 1)`, i.e. normalized to **0..1**. Available expression variables include `n`, `t`, `pts`, `key`, `pict_type`. Video-only (not in `aselect`). Source: `libavfilter/f_select.c`.
- **FFmpeg licence**: "Most files in FFmpeg are under the GNU Lesser General Public License version 2.1 or later (LGPL v2.1+)"; becomes GPL v2+ with `--enable-gpl`; `--enable-nonfree` yields an unredistributable binary. Source: FFmpeg `LICENSE.md`.
- **WebCodecs non-goals**: "Direct APIs for media containers (muxers/demuxers)" and "Writing codecs in JavaScript or WebAssembly" are explicitly out of scope; applications handle their own containerization and transport. Interfaces: `EncodedVideoChunk`, `VideoFrame`, `VideoEncoder`, `VideoDecoder`, `MediaStreamTrackProcessor` (plus audio equivalents). Source: `w3c/webcodecs` explainer.
- **`requestVideoFrameCallback` metadata**: `presentationTime`, `expectedDisplayTime`, `width`, `height`, `mediaTime` ("media presentation time in seconds of the frame presented"), `presentedFrames`, `processingDuration`. Callbacks fire at "the minimum between video rate and browser rate", are **one-shot** (must be re-registered), and do not fire in error states or for encrypted media. Source: `WICG/video-rvfc` explainer.
- **llama.cpp multimodal**: enabled via `libmtmd`; `llama-server` exposes it through the OpenAI-compatible `/chat/completions` API; requires `-m model.gguf` plus `--mmproj file.gguf`; projector offloads to GPU by default, disabled with `--no-mmproj-offload`; docs state image, audio **and video** input are supported; listed vision families include Gemma 3, SmolVLM, Pixtral 12B, Qwen 2 VL, Qwen 2.5 VL, Mistral Small, InternVL, Llama 4 Scout, Moondream2, Gemma 4. Source: `docs/multimodal.md`.
- **Qwen3-VL video sampling defaults**: `fps=2` and `do_sample_frames=True` by default; alternative `num_frames=128` with fps set to None; `total_pixels` recommended below `24576 * 32 * 32`. Claimed capabilities: Interleaved-MRoPE, Text–Timestamp Alignment for "precise, timestamp-grounded event localization", "Native 256K context, expandable to 1M". Sizes: 2B/4B/8B/32B dense, 30B-A3B and 235B-A22B MoE, Instruct and Thinking editions. Source: Qwen3-VL README.
- **MLX-VLM server**: `mlx_vlm.server --port 8080`; "OpenAI-compatible chat-style interaction endpoint with support for images, audio, and text"; endpoints include `/v1/chat/completions`, `/v1/embeddings`, `/v1/rerank`; supports video analysis "with select models" (Qwen2-VL, Qwen2.5-VL). Source: MLX-VLM README.
- **ONNX Runtime Web backends**: WebAssembly (CPU), WebGL (maintenance mode), WebGPU (experimental), WebNN (experimental); multi-threading supported in browser; "Node.js only support single-threaded `wasm` EP." Source: `js/web/README.md`.
- **transformers.js**: runs models via ONNX Runtime; WASM default, `device: 'webgpu'` opt-in with the caveat "The WebGPU API is still experimental in many browsers"; models loaded from the Hugging Face Hub, converted with Optimum. Source: transformers.js README.
- **CameraBench**: public test set "1 000+ videos with expert labels & captions"; SFT set adds "≈1,400 extra annotated clips"; three released fine-tuned Qwen2.5-VL models (7B, 32B, 72B); taxonomy designed with cinematographers; licence file is CC BY 4.0. Sources: CameraBench README and LICENSE.
- **Verified licences at a glance**: PySceneDetect BSD-3-Clause; TransNetV2 MIT; RAFT BSD-3-Clause; OpenCV Apache-2.0 (default branch `5.x`); FFmpeg LGPL-2.1+ / GPL-2.0+; ffmpeg.wasm MIT (wrapper); mp4box.js BSD-3-Clause; llama.cpp MIT; Ollama MIT; vLLM Apache-2.0; MLX-VLM MIT; `lms` CLI MIT; transformers.js Apache-2.0; ONNX Runtime MIT; Qwen3-VL repo Apache-2.0; InternVL MIT; VideoLLaMA3 Apache-2.0; CameraBench CC-BY-4.0.

## Open questions

1. **Dolly vs. zoom.** Can we separate them cheaply, e.g. by fitting the partial-affine model independently on image-border regions vs. centre regions and comparing scale rates (a parallax proxy)? Or do we simply always emit the ambiguous set and let the user disambiguate? Needs a prototype on real clips.
2. **Thresholds.** Every number above (27.0, 3.0, 15.0, 10.0, 0.4) belongs to someone else's corpus. What are the right thresholds for *our* corpus (short fashion/product/editorial clips, which is what the brief's clothing taxonomy implies)? Needs a small labelled calibration set.
3. **Where does the geometric estimator run?** Pure JS on `ImageData` (small, no dependency, but we write the RANSAC), `opencv.js` (correct but multi-megabyte), or WASM SIMD? The static-web-app constraint pushes hard toward pure JS on 256-px greyscale.
4. **`Tracking` detection.** Distinguishing "camera tracks a subject" from "camera pans across a static scene" requires knowing a subject moved — i.e. the residual flow after removing global motion is concentrated on a coherent region. Is a cheap residual-blob heuristic good enough, or is this strictly a VLM job (as CameraBench's "follow requires understanding scene content" suggests)?
5. **Video embeddings.** The brief's v0.4 wants "similar-video search". Do we embed the representative frame per shot and pool, embed a montage, or add a motion-descriptor channel to the vector? The fusion ranker's ~60/40 semantic/structured split needs a decision on what "semantic" means for video.
6. **Cross-origin video.** Remote references (Openverse, Wikimedia) will taint the canvas and block `getImageData`. Do Wikimedia Commons video assets serve permissive CORS headers? If not, remote video analysis is off the table and only *uploaded* video can be decomposed — which is fine for the brief but must be stated in the UI.
7. **Weight licences.** The Qwen3-VL and InternVL *repositories* are Apache-2.0/MIT, but per-checkpoint model cards were unreadable from this environment (huggingface.co blocked). Before we recommend any default model, someone must read the actual model card licences.
8. **Cross-origin isolation.** Multi-threaded WASM (ffmpeg.wasm, threaded ORT Web) generally needs COOP/COEP headers, which a plain static host may not send. Does our chosen hosting support them, and do we need a single-threaded fallback path?
9. **Do we need shot detection at all in v0.1?** If the user uploads a single-shot 5-second clip — the common case for a motion reference — the whole segmentation layer may be over-engineering. A "treat as one shot unless a cut is obvious" default may be the better MVP.

## Evidence log

Pages actually fetched (via WebFetch) or queried (via the GitHub repository search API, which returns the repository licence label):

- https://github.com/Breakthrough/PySceneDetect
- https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/content_detector.py
- https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/detectors/adaptive_detector.py
- https://raw.githubusercontent.com/Breakthrough/PySceneDetect/main/scenedetect/scene_manager.py
- https://github.com/soCzech/TransNetV2
- https://github.com/soCzech/TransNetV2/blob/master/inference/README.md
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/vf_scdet.c
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/libavfilter/f_select.c
- https://raw.githubusercontent.com/FFmpeg/FFmpeg/master/LICENSE.md
- https://raw.githubusercontent.com/gpac/mp4box.js/master/LICENSE
- https://github.com/ffmpegwasm/ffmpeg.wasm
- https://raw.githubusercontent.com/ggml-org/llama.cpp/master/docs/multimodal.md
- https://raw.githubusercontent.com/QwenLM/Qwen3-VL/main/README.md
- https://raw.githubusercontent.com/w3c/webcodecs/main/explainer.md
- https://raw.githubusercontent.com/WICG/video-rvfc/gh-pages/explainer.md
- https://raw.githubusercontent.com/huggingface/transformers.js/main/README.md
- https://raw.githubusercontent.com/microsoft/onnxruntime/main/js/web/README.md
- https://raw.githubusercontent.com/Blaizzy/mlx-vlm/main/README.md
- https://github.com/sy77777en/CameraBench
- https://raw.githubusercontent.com/sy77777en/CameraBench/main/README.md
- https://raw.githubusercontent.com/sy77777en/CameraBench/main/LICENSE
- GitHub repository search API (licence labels confirmed for): `ollama/ollama` (MIT), `ggml-org/llama.cpp` (MIT), `vllm-project/vllm` (Apache-2.0), `microsoft/onnxruntime` (MIT), `huggingface/transformers.js` (Apache-2.0), `Blaizzy/mlx-vlm` (MIT), `Breakthrough/PySceneDetect` (BSD-3-Clause), `princeton-vl/RAFT` (BSD-3-Clause), `soCzech/TransNetV2` (MIT), `opencv/opencv` (Apache-2.0), `QwenLM/Qwen3-VL` (Apache-2.0), `ffmpegwasm/ffmpeg.wasm` (MIT), `OpenGVLab/InternVL` (MIT), `lmstudio-ai/lms` (MIT), `gpac/mp4box.js` (BSD-3-Clause), `DAMO-NLP-SG/VideoLLaMA3` (Apache-2.0), `sy77777en/CameraBench` (label `NOASSERTION`, file says CC-BY-4.0)

**Blocked by the network egress proxy in this environment (facts sourced from search-result summaries instead and marked UNVERIFIED where relevant):** `www.scenedetect.com`, `developer.mozilla.org`, `docs.opencv.org`, `ffmpeg.org`, `www.w3.org`, `web.dev`, `onnxruntime.ai`, `docs.vllm.ai`, `docs.ollama.com`, `ollama.readthedocs.io`, `lmstudio.ai`, `huggingface.co`, `arxiv.org`, `linzhiqiu.github.io`, `www.ccoderun.ca`.
