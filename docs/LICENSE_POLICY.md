# License Policy — Unified Visual Reference Composer

The compliance contract: which reference media may enter the product, how a licence is verified, how credit is rendered, what is forbidden to source, and what happens when a licence turns out to be wrong.

> **한국어 요약**
> 이 문서는 레퍼런스 미디어의 라이선스 규정이다. 코드 라이선스(MIT)와 레퍼런스 미디어 라이선스는 완전히 분리된 두 층위이며 서로를 절대 함의하지 않는다. 기본 허용은 퍼블릭 도메인·CC0·CC BY이고, CC BY-SA는 운영자가 명시적으로 켜야 하는 선택 항목이며, CC BY-NC/NC-SA/ND/NC-ND와 라이선스 미확인 항목은 기본 차단이다. License Guard는 LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → APPROVAL의 4단계 상태 기계로 동작하고, **검증되지 않은 라이선스는 어떤 경로로도 `approved`에 도달할 수 없다**. 미디어 바이너리는 저장소에 저장하지 않고 URL·썸네일 URL·메타데이터·임베딩·시각 속성만 보관하며, 사용자가 올린 파일은 기기 밖으로 나가지 않고 공용 레퍼런스 DB에도 들어가지 않는다. 이 문서는 엔지니어링 정책이며 법률 자문이 아니다.

> **⚠️ This document is engineering policy, not legal advice.**
> It describes rules this codebase enforces and the reasoning behind them. It is written by engineers, not lawyers. It does not interpret copyright law, it does not tell a user what they may lawfully do with a generated image, and it is not a substitute for counsel in any jurisdiction. Where a question is genuinely legal rather than technical, this document says so, marks it `(UNVERIFIED — legal question)`, and takes the conservative branch rather than guessing.

---

## 0. Document contract and precedence

**Precedence.** `BRIEF.md` (the canonical product brief, not necessarily committed to this repository) wins over everything. The canonical data model in [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) wins over this document for field names, enums and invariants. This document owns *policy*: which values of those enums are acceptable, under what predicate a status transition may fire, and what the product must show and record. Where this document introduces a name the canonical model does not define, it is listed in §14 and flagged there — never smuggled in.

**Owning module.** `src/reference/license-guard.js`. Every constant, table and predicate below is a frozen export from that file, so tuning policy is a diff in one file and not a hunt across the tree. `src/providers/*.js` own the per-provider field mapping (§6) and nothing else; the guard never contains a provider-specific branch.

**Sibling documents.**

| Document | What it owns that this document defers to |
|---|---|
| [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) | `ReferenceMetadata` fields, `LICENSE_ID`, `Reference.status`, `license_guard` step shape, INV-LIC-1/2/3, INV-REF-2 |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | module boundaries, `license-guard.js` function signatures, the provider interface |
| [`SEARCH_ARCHITECTURE.md`](./SEARCH_ARCHITECTURE.md) | how `status` and `filters.license` are applied at query time — licence is a **gate**, never a ranking signal |
| [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) | the per-project prior-art register and the record of what was and was not taken |
| [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) | reproduced licence texts for runtime dependencies and model weights |
| [`COMPETITIVE_ANALYSIS.md`](./COMPETITIVE_ANALYSIS.md) | the survey these prohibitions were derived from |
| [`docs/research/license-safe-media-apis.md`](./research/license-safe-media-apis.md) | the verified provider API facts §6 cites |

**Rule numbering.** Policy rules are `LP-n` and are citable from code comments, tests and other documents. Schema-enforced invariants keep their canonical `INV-*` names.

---

## 1. The two-layer principle

There are exactly two licensing layers in this product and they never touch. Confusing them is the single most likely compliance failure, and it is the failure this whole document exists to prevent.

```
┌──────────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — CODE                                                          │
│  The repository: src/**, app/**, data/taxonomy/*.json, docs/**           │
│  Licence: MIT  (see /LICENSE)                                            │
│  Authored by us. Contains no copied external repository code.            │
│  Obligations: keep the notice. That is all.                              │
└──────────────────────────────────────────────────────────────────────────┘
                        ▲                              ▲
                        │  NO INHERITANCE EITHER WAY   │
                        ▼                              ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────┐
│  LAYER 2a — REFERENCE MEDIA  │    │  LAYER 2b — MODEL WEIGHTS            │
│  Images and videos we point  │    │  Analyzer / embedding / reranker     │
│  at but never store.         │    │  checkpoints. Never bundled.         │
│  Licence: per item, carried  │    │  Licence: per checkpoint, and NOT    │
│  in Reference.metadata.      │    │  implied by the repo's licence.      │
│  Governed by §2–§8.          │    │  Governed by §11.                    │
└──────────────────────────────┘    └──────────────────────────────────────┘
```

**LP-1.** The MIT licence on this repository grants nothing whatsoever regarding any reference image, reference video, model checkpoint, or third-party dataset. It covers our source code, our taxonomy vocabulary, and our documentation. Nothing else.

**LP-2.** Conversely, a reference's licence grants nothing regarding the code. A CC BY-SA reference does not make the codebase share-alike; a CC BY-NC reference does not make the product non-commercial. The product **points at** media; it does not incorporate it. This is only true because of the no-binaries rule (§7) — the moment we stored a byte of the media in the repository, this separation would become an argument instead of a fact.

**LP-3.** `Reference.metadata.license` always means **the licence of the media asset we display**. It never means the licence of the catalogue record, the licence of the provider's API, the licence of the provider's code, or the licence of the page the media sits on. Three verified cases in the research make this a live hazard rather than pedantry:

| Case | Metadata licence | Media licence | The trap |
|---|---|---|---|
| Met Museum Open Access | CC0 (the dataset) | per object, via `isPublicDomain` | the repo README states plainly: *"Images are not included and are not part of the dataset"* |
| NYPL Digital Collections | CC0 (the metadata records) | per item; roughly one third are PD | the CC0 dedication is on the bibliographic data, not the scans |
| Smithsonian Open Access | CC0 (11M records) | per asset, via `media.usage.access` | record-level CC0 and asset-level CC0 are different facts |

**LP-4.** We do not ship a `metadata_license` field in v1. Instead the rule is absolute: a provider adapter may only write `metadata.license` from a **per-asset** licence statement. If a provider only publishes a record-level or site-level licence, the adapter writes `unknown` and the reference goes to `license_review` (§4). "The catalogue is CC0" is never evidence about a picture.

**Answering brief question 8** — *"Is reference licensing separated from code licensing?"* Yes, structurally: two layers, no inheritance, one field (`metadata.license`) that only ever means one thing, and a no-binaries rule that keeps the two physically apart.

---

## 2. The licence matrix

`LICENSE_ID` is a closed enum defined in [`DATA_SCHEMA.md §1.6`](./DATA_SCHEMA.md). An unrecognised licence string from any provider maps to `unknown` — never to a guess.

`classifyLicense(license_id)` returns `{ policy_class, requires_attribution, share_alike }` and is a pure lookup in this table.

| `license_id` | Human label | `policy_class` | `requires_attribution` | `share_alike` | In `defaultLicenseFilter()` |
|---|---|---|---|---|---|
| `public_domain` | Public domain | **allowed** | false | false | ✅ |
| `pdm` | Public Domain Mark 1.0 | **allowed** | false | false | ✅ |
| `cc0` | CC0 1.0 | **allowed** | false | false | ✅ |
| `cc_by` | CC BY (2.0 / 3.0 / 4.0) | **allowed** | **true** | false | ✅ |
| `user_owned` | User's own media | **allowed** *(local scope only, §10)* | false | false | ✅ |
| `cc_by_sa` | CC BY-SA | **optional** — off by default | **true** | **true** | ❌ until enabled |
| `cc_by_nc` | CC BY-NC | **excluded** | — | — | ❌ |
| `cc_by_nc_sa` | CC BY-NC-SA | **excluded** | — | — | ❌ |
| `cc_by_nd` | CC BY-ND | **excluded** | — | — | ❌ |
| `cc_by_nc_nd` | CC BY-NC-ND | **excluded** | — | — | ❌ |
| `proprietary` | Custom / all-rights-reserved | **excluded** | — | — | ❌ |
| `unknown` | Not determined | **excluded** | — | — | ❌ |

**LP-5.** `defaultLicenseFilter()` returns exactly `["public_domain", "pdm", "cc0", "cc_by", "user_owned"]`. This is also the default value of `ExplorerState.query.filters.license`. A user may narrow it. A user may not widen it past the operator's enabled classes.

**LP-6.** Why `pdm` is separate from `cc0`: Openverse emits Public Domain Mark distinctly from CC0 (`PUBLIC_DOMAIN_MARKS = {"cc0", "pdm"}`, verified in `api/api/constants/licenses.py`). They are different assertions — CC0 is a rights holder waiving rights they had; PDM is a third party asserting a work has no rights remaining. Collapsing them would erase which of those two claims we are relying on, which is exactly the fact a takedown review (§13) needs.

**LP-7.** `requires_attribution: false` for the public-domain family is a statement about legal obligation, not about product behaviour. The product **always** stores and renders `attribution` for every reference regardless of licence class (§5, §8). Credit is a courtesy the licence does not have to compel, and provenance is the thing that makes a takedown tractable.

### 2.1 The optional tier: CC BY-SA

**LP-8.** `cc_by_sa` is `policy_class: "optional"` and **disabled by default**. It is enabled by one operator setting, `LICENSE_POLICY.allow_share_alike` (§14, addition A1). When disabled, a `cc_by_sa` reference routes to `license_review`, not to `rejected` — the classification is a setting, not a fact about the work, and flipping the setting must resolve it without re-fetching.

**LP-9.** When enabled, every `cc_by_sa` reference sets `metadata.share_alike: true`, and the UI must display this warning verbatim on the reference detail panel and again in any export dialog whose `license_summary.share_alike` is true:

> **Share-alike reference.** This reference is licensed CC BY-SA. Share-alike terms can require that a derivative work you publish be licensed under the same terms. This tool does not redistribute the image and the prompt text it produces is not the image. Whether an image generated from this reference is a derivative work of it is an unsettled question that depends on your jurisdiction and your use. We surface this; we do not decide it.

**LP-10.** We take no position on whether a generated image, or a `StructuredPrompt` derived from a `cc_by_sa` reference's typed attributes, is a derivative work `(UNVERIFIED — legal question, deliberately unresolved; recorded as an open question in [`research/license-safe-media-apis.md`](./research/license-safe-media-apis.md))`. The engineering consequence is fixed regardless of the answer: `share_alike` propagates into `VisualRecipe.license_summary`, the warning is shown, and the default is off.

### 2.2 Why each exclusion

Exclusions are not squeamishness. Each has an operational reason that would otherwise have to be re-derived.

| Excluded | Reason we cannot serve it as a reference |
|---|---|
| `cc_by_nc`, `cc_by_nc_sa`, `cc_by_nc_nd` | We cannot know or control our users' downstream commercial use. A tool whose entire output is a production input cannot honestly serve NC content and claim the obligation was discharged. It would also be incoherent to reject NC **model weights** (§11) while shipping NC **references**. |
| `cc_by_nd`, `cc_by_nc_nd` | ND is no-derivatives. Decomposition, selective inheritance and mixing are the product. Even if a typed attribute list is not a derivative, ND makes that question unanswerable at scale and per item. Fail closed. |
| `proprietary` | A bespoke licence is not machine-checkable and its obligations are not expressible in `classifyLicense`'s three fields. See §3. |
| `unknown` | The brief's rule and the whole point of the guard. "The file downloaded" and "we may use it" are separate facts (the Dress Code dataset — a hand-signed release, institutional email required, *"The dataset will not be released to private companies"* — is the canonical demonstration). |

**LP-11.** `excluded` is not the same as invisible. A reference whose licence is `excluded` may still be *displayed* with a red badge and an explanation, so that the empty-result case is legible ("0 of 340 results are CC BY or freer — 218 are CC BY-NC"). It can never be added to a mix, never be inherited from, and never be exported. Silence about a filtered result is a UX failure (§8 U6, LP-38).

---

## 3. Non-CC custom licences (Pexels, Unsplash, and their kind)

Some large free-media providers publish under a bespoke licence that is neither Creative Commons nor public domain. They are common enough to be tempting and different enough to need their own rule.

| Provider | Licence reality | Fatal facts |
|---|---|---|
| **Pexels** | one blanket proprietary "Pexels License"; photos **and** videos | No per-item `license` or `license_url` field exists in the API response at all — there is nothing per-item to verify. Terms include *"You may not copy or replicate core functionality of Pexels."* Auth is an `Authorization` header key, unshippable in a static page. `(UNVERIFIED — pexels.com was egress-blocked during research; facts read from a GitHub-mirrored copy of the official docs)` |
| **Unsplash** | proprietary "Unsplash License"; the `unsplash-js` **client** is MIT, the **photos** are not | Obligations are a *set*, not just attribution: attribute the photographer, hotlink the image, **and** *"trigger a download when appropriate"* via `/photos/{id}/download`. That last one is an outbound compliance call, which the brief's privacy rule requires us to disclose in the UI before it fires. `(UNVERIFIED — unsplash.com was blocked; read from the client README)` |

**LP-12.** A custom-licensed provider maps to `license: "proprietary"`, never to `public_domain`, never to `cc0`, and never to `unknown`. `proprietary` is `excluded`, so such an item can **never reach `approved`** under the default policy. This is not a slight against those services — it is that "free to use" is a marketing phrase and our guard needs a per-item, machine-checkable licence.

**LP-13.** If a custom-licensed provider is ever integrated, it must be:
1. **opt-in per user**, never a shipped default provider;
2. permanently badged with its own badge style, visually distinct from every CC badge, and never rendered adjacent to a CC BY result without that distinction;
3. accompanied by the provider's terms surfaced verbatim in the provider settings panel, not paraphrased;
4. gated so its items are `license_review` forever — the terminal state, not a waypoint;
5. modelled with its extra obligations in `metadata.x_ext.obligations` (§14, addition A2), because `requires_attribution` and `share_alike` cannot express *hotlink-only* or *download-ping*.

**LP-14.** Any obligation that requires an outbound network call (the Unsplash download ping is the known case) is an **external transmission** under the brief's privacy rule. It must be disclosed in the UI before it fires and recorded in `ExplorerState.ai.external_transmission.endpoints[]` with a `disclosed_at`. A compliance obligation is not an exemption from the disclosure rule; it is a second reason not to integrate the provider casually.

**LP-15.** The generalised lesson, and the reason this section exists at all: a licence can impose obligations our three-field classifier does not model. Before adding *any* provider, enumerate its obligations explicitly. The three known shapes are **attribution**, **share-alike**, and **hotlink / event-ping**. Assume there is a fourth.

---

## 4. The License Guard state machine

The brief specifies four stages: `LICENSE CHECK → SOURCE VALIDATION → ATTRIBUTION METADATA → REFERENCE APPROVAL`. They are stored on the reference as an audit trail, `license_guard.{license_check, source_validation, attribution_metadata, approval}`, each a `GuardStep` of `{status: pending|pass|fail|manual_review, at, actor, note}`.

```
                             ┌───────────────────────────────────────────┐
        provider ingest ───► │  status: candidate                        │
                             │  all four steps: pending                  │
                             └────────────────┬──────────────────────────┘
                                              │
                                     ┌────────▼─────────┐
                                     │ 1 LICENSE CHECK  │  pure; offline-capable
                                     └──┬────┬──────┬───┘
                            fail ◄──────┘    │pass  └──────► manual_review
                              │              │                     │
                    ┌─────────▼────┐         │            ┌────────▼──────────┐
                    │ rejected     │         │            │ license_review    │
                    │ (terminal*)  │         │            │ (resumable)       │
                    └──────────────┘         │            └────────┬──────────┘
                                             │                     │ operator/re-fetch
                                     ┌───────▼──────────┐          │ resolves
                                     │ 2 SOURCE         │◄─────────┘
                                     │   VALIDATION     │  network; NOT offline-capable
                                     └──┬────┬──────┬───┘
                            fail ◄──────┘    │pass  └──────► manual_review ──► license_review
                              │              │
                    ┌─────────▼────┐         │
                    │ rejected     │         │
                    └──────────────┘         │
                                     ┌───────▼──────────┐
                                     │ 3 ATTRIBUTION    │  pure
                                     │   METADATA       │
                                     └──┬────┬──────┬───┘
                        fail/mr ◄───────┘    │pass  │
                              │              │      │
                    ┌─────────▼─────────┐    │      │   NOTE: stage 3 `fail` is the one
                    │ license_review    │    │      │   non-terminal fail in the machine.
                    │ (recoverable)     │    │      │   A missing credit field is a data
                    └───────────────────┘    │      │   gap, never a rights violation.
                                     ┌───────▼──────▼───┐
                                     │ 4 APPROVAL       │  pure; requires an actor
                                     └──┬────┬──────┬───┘
                       manual_review ◄──┘    │pass  └──────► fail ──► license_review
                              │              │
                    ┌─────────▼────┐  ┌──────▼───────┐
                    │license_review│  │  approved    │
                    └──────────────┘  └──────┬───────┘
                                             │
                          any edit to license / license_url / license_version /
                          creator / source / source_id / source_url,  OR a
                          revocation hit (§13)  ──► DEMOTE: status ← candidate,
                                                    all four steps ← pending
```
`*` `rejected` is terminal for the *record as ingested*. A corrected re-ingest from the provider mints the same deterministic id (`mintReferenceId`) and starts a fresh guard run; the previous rejection stays in the audit trail via `license_check.note`.

**LP-16 — the load-bearing invariant.** *Unverified licence can never reach `approved`.* Made checkable: `approve()` returns `{reference, violations}` and refuses to set `status: "approved"` unless **all four** of these hold — `license_check.status === "pass"`, `source_validation.status === "pass"`, `attribution_metadata.status === "pass"`, and every schema invariant INV-LIC-1 / INV-LIC-2. This is INV-LIC-3, enforced in code because JSON Schema cannot express step ordering. There is no override flag, no force parameter, and no admin bypass. Adding one is a policy change requiring an edit to this document.

**LP-17.** Licence approval is a **gate, not a ranking signal**. `src/search/**` may filter on `status` and on `filters.license`; no code path in `src/search/**` may write a `status` transition. A weight can be tuned to zero; a gate cannot. (Cross-ref: `ARCHITECTURE.md` constraint C7.)

### 4.1 Stage 1 — LICENSE CHECK

`runLicenseCheck(reference, policy) -> GuardStep`. Pure. Runs offline. Reads only `metadata` and the policy table.

| Result | Predicate (evaluated in order; first match wins) |
|---|---|
| **fail** → `rejected` | `classifyLicense(license).policy_class === "excluded"` **and** the licence is a *known, named* exclusion (`cc_by_nc`, `cc_by_nc_sa`, `cc_by_nd`, `cc_by_nc_nd`, `proprietary`). A determinate, permanent fact about the work. |
| **fail** → `rejected` | A provider hard-reject signal is present. Wikimedia Commons: `extmetadata.NonFree` truthy, or `Copyrighted` explicitly false-for-us, or a non-empty `Restrictions` naming a use restriction. |
| **manual_review** → `license_review` | `license === "unknown"`. Indeterminate, and re-fetch may resolve it. |
| **manual_review** → `license_review` | `policy_class === "optional"` and the operator setting for that class is off (today: `cc_by_sa` with `allow_share_alike: false`). |
| **manual_review** → `license_review` | `license ∈ {cc_by, cc_by_sa}` and `license_url` is empty. See LP-19. |
| **manual_review** → `license_review` | `license` is in the CC family and `license_version` is empty. Attribution wording and obligations differ across CC 2.0/3.0/4.0; an unversioned CC claim is not verified. |
| **manual_review** → `license_review` | `license_url` is present but its normalised form disagrees with the canonical deed URL for that `license_id` (LP-20). A mismatch is a provider bug or a mislabelled file; either way a human decides. |
| **pass** | `policy_class ∈ enabled classes`, required fields present, no reject signal, no mismatch. |

**LP-18.** `unknown` never fails to `rejected` at stage 1. It goes to `license_review`, because "we have not determined this" and "we have determined this is unusable" are different states and collapsing them destroys the queue an operator works from. Both are equally unusable — `approved` is unreachable from either — but only one is worth a human's attention.

**LP-19.** `metadata.license_url` is **copied from the provider, never synthesized**. If it is absent for `cc_by` or `cc_by_sa` — the two licences whose obligations are discharged partly *by* that link — the reference cannot be approved (this is also INV-LIC-2 at the schema level). For `cc0`, `pdm` and `public_domain` a missing `license_url` is a warning recorded in the step `note`, not a blocker: there is no obligation the link discharges.

**LP-20.** Validation-only canonical deed URLs. These are used to *detect a mismatch*, never to fill in a missing value.

| `license_id` | Canonical deed URL family |
|---|---|
| `cc0` | `https://creativecommons.org/publicdomain/zero/1.0/` |
| `pdm` | `https://creativecommons.org/publicdomain/mark/1.0/` |
| `cc_by` | `https://creativecommons.org/licenses/by/{version}/` |
| `cc_by_sa` | `https://creativecommons.org/licenses/by-sa/{version}/` |
| `cc_by_nc`, `cc_by_nc_sa`, `cc_by_nd`, `cc_by_nc_nd` | `…/licenses/{code}/{version}/` — recorded for badge rendering only; these never reach stage 2 |
| `public_domain` | no canonical URL; whatever the source supplies, unchecked |

Normalisation before comparison: lowercase, force `https`, strip a trailing slash, drop `deed.*` and any query string or fragment.

### 4.2 Stage 2 — SOURCE VALIDATION

`runSourceValidation(reference, providers) -> Promise<GuardStep>`. The **only** impure function in `license-guard.js`. Runs only when stage 1 passed.

This is the stage that turns "the search result said CC BY" into "the source says CC BY". A search index is a cache; a cache is not a licence.

| Result | Predicate |
|---|---|
| **fail** → `rejected` | `provider.getMetadata(source_id)` returns *not found* / 404 — the item the licence claim refers to does not exist. |
| **fail** → `rejected` | The licence re-read at source classifies as a **named exclusion**. The index was stale or wrong and the truth is unusable. |
| **manual_review** → `license_review` | The licence at source differs from `metadata.license` but is still `allowed` or `optional`. A human confirms which is right; the guard never silently overwrites a licence claim. |
| **manual_review** → `license_review` | `metadata.source` is not a registered provider, or `source_url`'s host is not on that provider's known-host list. |
| **manual_review** → `license_review` | Network unavailable, provider error, timeout, or rate-limited. **Not** a failure of the work. |
| **pass** | Provider re-read succeeded; licence at source matches `metadata.license`; `source_url` host is the provider's; **and** liveness holds — a `HEAD` on `media_url` returns 2xx, or the provider re-resolves it and we store `resolved_media_url`. |

**LP-21.** A remote reference **cannot be approved offline**. Stage 2 requires the network by construction. Offline, the reference stays `candidate` with `source_validation: pending`, which is honest: we have not verified anything. This does not break the brief's "AI OFF is a complete product" guarantee — AI-off and network-off are different axes, and the `local` provider (§10) plus any already-approved library remain fully usable offline.

**LP-22.** The liveness check borrows Openverse's `filter_dead` reasoning: because we store URLs and not bytes, a dead URL means a reference card that renders as a broken box and an attribution that cannot be checked. Liveness is a *stage-2 gate*, but a later rot is **not** a demotion — see `DATA_SCHEMA.md §10.4` R1–R5. A `gone` snapshot keeps its record, its stored attribution text and its full credit line. Media loss degrades the **card**, never the **recipe**, and never the **credit**.

**LP-23.** Providers carry access obligations that this stage also enforces, because violating them is a compliance failure even when the licence is clean:

| Provider | Obligation | Where enforced |
|---|---|---|
| `wikimedia_commons` | Send `Api-User-Agent: UnifiedVisualReferenceComposer/<version> (<contact URL>)` — a browser cannot set `User-Agent`, and MediaWiki reads this header instead (verified in `includes/Request/WebRequest.php`). Respect published etiquette: ≤3 concurrent requests, `maxlag=5` on batch traffic `(UNVERIFIED — API:Etiquette was egress-blocked)`. | `src/providers/wikimedia.js` |
| `openverse` | Anonymous throttle is **5/hour burst, 100/day sustained** (verified in `api/conf/settings/rest_framework.py`). Beyond that the user must register their own client credentials — which is an external transmission requiring UI disclosure. | `src/providers/openverse.js` |
| any | Never access through an interface the provider did not provide. No scrapers, no crawlers, no HTML parsing of a site that publishes an API. | §9 |

### 4.3 Stage 3 — ATTRIBUTION METADATA

`buildAttribution(reference) -> { attribution, credit_line }`. Pure. Runs only when stage 2 passed. Full templates in §5.

| Result | Predicate |
|---|---|
| **fail** → `license_review` | `buildAttribution` cannot produce a non-empty `attribution`, **or** `requires_attribution` is true and `creator` is empty, **or** `source_url` is empty. |
| **pass** | A non-empty `attribution` string was produced and stored, and every field the licence class requires is present. |

**LP-24.** Stage 3's `fail` is the **one non-terminal fail in the machine**. It routes to `license_review`, never to `rejected`, because a missing credit field is a data gap that a re-fetch or a human keystroke fixes — it is not a statement that the work may not be used. Every other `fail` in the machine is terminal.

**LP-25.** `attribution` is stored **text**, computed once at ingest, never a computed link and never re-derived at render time. This is `DATA_SCHEMA.md §10.4` R4 and it is why a reference whose `media_state` is `gone` still renders its complete credit line years later.

### 4.4 Stage 4 — APPROVAL

`approve(reference, actor) -> { reference, violations }`. Pure. Requires a non-empty `actor`.

| Result | Predicate |
|---|---|
| **fail** → `license_review` | Any schema invariant violated: INV-LIC-1 (`approved` ⇒ non-empty `attribution` and `license ∉ {unknown, proprietary}`) or INV-LIC-2 (`approved` + `cc_by`/`cc_by_sa` ⇒ non-empty `creator` **and** `license_url`). |
| **manual_review** → `license_review` | `policy_class === "optional"` — the optional tier always requires an explicit human approval, even when the operator setting is on. |
| **pass** → **`approved`** | All three prior steps `pass`, no violations, `actor` recorded, `at` stamped. |

**LP-26 — the anti-laundering rule.** Editing any of `metadata.license`, `license_url`, `license_version`, `creator`, `source`, `source_id`, or `source_url` on an `approved` reference **demotes it to `candidate` and resets all four guard steps to `pending`**. Without this, a reference could be approved as CC BY and then edited into something else while keeping its green badge. `normalizeReference()` enforces the demotion on load, so it survives hand-edited storage.

**LP-27.** The default search filter is `status: ["approved"]` (`DATA_SCHEMA.md §4.6`). Combined with LP-16, an unverified reference never reaches a normal result set in the first place. The gate is therefore defence in depth, not a single check.

---

## 5. Attribution: required fields and exact string templates

### 5.1 Required fields

| Field | Required for | Why |
|---|---|---|
| `source` | every reference | which provider, for revocation keying and etiquette |
| `source_id` | every reference | the provider's own id — half of durable identity (R1) |
| `source_url` | every reference | the human-visitable page; the "S" of TASL; the link a reader follows to check us |
| `license` | every reference | the machine field the whole guard runs on |
| `license_url` | `approved` + `cc_by` / `cc_by_sa` (INV-LIC-2) | part of how the attribution obligation is discharged |
| `license_version` | `approved` + any CC licence (§4.1 stage-1 predicate) | obligations differ by version |
| `creator` | `approved` + `cc_by` / `cc_by_sa` (INV-LIC-2) | the "A" of TASL; nullable **only** for `public_domain`, `pdm`, `cc0`, `user_owned` |
| `attribution` | `approved` (INV-LIC-1) | our canonical render, stored as text |
| `title` | recommended | the "T" of TASL |
| `credit_line` | when the provider supplies one | the provider's own preferred wording, stored **verbatim** |
| `retrieved_at` | recommended | when the licence claim was read; the age of our evidence |

**LP-28.** `credit_line` and `attribution` are different fields with different jobs and must not be merged:
- **`credit_line`** is the *provider's* wording, copied verbatim, never edited or reformatted. Openverse computes an `attribution` string; that string is ours to store, not to rewrite — it goes here.
- **`attribution`** is *our* canonical TASL render (below), always computed, so every reference in an export block reads the same way regardless of which provider it came from.
- **Render rule:** the UI and every export line render `credit_line || attribution`. The provider's preferred wording wins when it exists; ours is the guaranteed fallback and the uniform format.

### 5.2 The canonical template

One template, four slots, per-provider bindings in §6. Slots are dropped in a fixed order so the output is deterministic and diffable.

```
TASL := “{T}” by {A} — {S_label} ({S_url}) — {L_label} ({L_url})
```

| Slot | Value | Fallback chain | Dropped when |
|---|---|---|---|
| `T` title | `metadata.title` | `metadata.source_id` → `"Untitled"` | never dropped |
| `A` author | `metadata.creator` | `"Unknown author"` when `requires_attribution` | **whole `by {A}` segment dropped** when `creator` is empty **and** `requires_attribution` is false |
| `S_label` | provider display name (§6) | `metadata.source` | never dropped |
| `S_url` | `metadata.source_url` | — | never dropped (required field) |
| `L_label` | licence label + version, e.g. `CC BY 4.0` | licence label alone | never dropped |
| `L_url` | `metadata.license_url` | — | **whole ` ({L_url})` segment dropped** when empty (only reachable for the PD family, LP-19) |

Join rule: segments are joined with ` — `; a dropped segment takes its separator with it; the result is trimmed and collapsed to single spaces. Wiki-HTML in `Artist` / `Credit` is sanitised to plain text (tags stripped, entities decoded, links reduced to their text) **before** it enters a slot — the attribution is stored text, not markup (LP-25).

### 5.3 Worked examples

**Wikimedia Commons, CC BY 4.0:**
```
“Rain on 7th Avenue” by Jane Doe — Wikimedia Commons
(https://commons.wikimedia.org/wiki/File:Rain_7th_Ave.jpg) — CC BY 4.0
(https://creativecommons.org/licenses/by/4.0/)
```

**Wikimedia Commons, public domain, no known creator:**
```
“Alley, 1904” — Wikimedia Commons
(https://commons.wikimedia.org/wiki/File:Alley_1904_glass_plate.jpg) — Public Domain Mark 1.0
(https://creativecommons.org/publicdomain/mark/1.0/)
```
The `by {A}` segment is dropped: `creator` is null, which is legal here precisely because the licence is in the public-domain family, and `requires_attribution` is false.

**Openverse, CC BY-SA 4.0 (optional tier, operator-enabled), upstream Flickr:**
```
“Neon alley, Osaka” by K. Tanaka — Flickr via Openverse
(https://www.flickr.com/photos/…/54321/) — CC BY-SA 4.0
(https://creativecommons.org/licenses/by-sa/4.0/)
```
Note `S_url` is the **`foreign_landing_url`** — the upstream human-facing page — not Openverse's `url`, which is the media file.

**User upload:**
```
“IMG_4417.jpg” — Local upload (private) — User-owned
```
No `S_url`, no `L_url`, no provider. This is the one shape that deviates from the template, and it is handled by a dedicated branch because a private reference has no public page to link to (§10, LP-38).

### 5.4 The attribution block

`summarizeLicenses(snapshots) -> license_summary` produces `{licenses[], requires_attribution, share_alike, has_excluded, attribution_block}` for a `VisualRecipe`.

`attribution_block` is built **only** from stored strings — never from a live fetch, never from a computed link (R4). Shape:

```
References used
───────────────
1. “Rain on 7th Avenue” by Jane Doe — Wikimedia Commons (…) — CC BY 4.0 (…)
2. “Neon alley, Osaka” by K. Tanaka — Flickr via Openverse (…) — CC BY-SA 4.0 (…)

This composition includes share-alike (CC BY-SA) material. See the share-alike
notice before publishing a derivative work.
```
Ordering is `mix.references[]` order, so the block is stable across re-renders and diffs cleanly. The trailing notice line appears if and only if `license_summary.share_alike` is true.

---

## 6. Provider field mappings

Each provider adapter normalises to `Reference` **at its own boundary**. Nothing above `src/providers/` contains a provider-specific branch.

### 6.1 Wikimedia Commons — priority 1

Endpoint `https://commons.wikimedia.org/w/api.php`, `action=query`, `prop=imageinfo`, `iiprop=url|extmetadata|mediatype|mime|size|dimensions`, `format=json`, `origin=*`. Anonymous cookie-less CORS is supported (verified in `ApiMain::handleCORS()`), which is why Commons is our zero-backend default provider. `iiurlwidth=<px>` yields a server-rendered thumbnail — a derived URL, never a stored byte (§7).

Every `extmetadata` entry is an object of shape `{ value, source, hidden? }`, **not** a bare string; the adapter reads `.value` and must not crash on either shape.

| `extmetadata` key | → `Reference.metadata` | Notes |
|---|---|---|
| `License` | `license` (after mapping, §6.3) | **primary machine field**; normalised code emitted by CommonsMetadata with `source: 'commons-templates'` |
| `LicenseShortName` | badge text (`L_label`) | e.g. `"CC BY-SA 4.0"` |
| `UsageTerms` | long-form label in the licence drawer | |
| `LicenseUrl` | `license_url` | |
| `Artist` | `creator` | **wiki-HTML** — sanitise to plain text |
| `Credit` | `credit_line` | **wiki-HTML** — sanitise |
| `Attribution` | `credit_line` (preferred over `Credit` when present) | the file's own pre-rendered credit |
| `AttributionRequired` | cross-check against `classifyLicense().requires_attribution` | **fail closed:** if the source says required, it is required, even if our table says otherwise |
| `ObjectName` / page title | `title` | |
| `NonFree`, `Copyrighted`, `Restrictions` | **hard reject signals** (stage 1) | never mapped into a display field |
| `DateTimeOriginal` | informational | |
| `ImageDescription` | **not** mapped into `visual_attributes` | it is prose; it goes through the analyzer like any other text |
| `iiprop=mediatype` | `Reference.type` | `BITMAP`/`DRAWING` → `image`; `VIDEO` → `video` (verified in `includes/libs/Mime/defines.php`) |

`S_label` = `"Wikimedia Commons"`. `source_url` = the File: page. `source_id` = the canonical `File:…` title.

**LP-29.** Commons exposes no licence *query* filter we have verified `(UNVERIFIED — the CirrusSearch alias table lives in config, not source)`. The adapter therefore fetches, then filters client-side on the mapped `license`, then reports the filtered count so the UI can explain an empty result set (§8 U6). Never present an unfiltered Commons result grid.

**LP-30.** Commons is priority 1 for a reason beyond licence quality: it is the **only license-clean video source** available to us. Openverse's media types are exactly `["audio", "image"]` (verified in `api/api/constants/media_types.py`), and Openverse's own Commons ingester explicitly discards `VIDEO`. The v0.4 video milestone has exactly one licence-clean remote path, and it is direct to Commons.

### 6.2 Openverse — priority 2

Base `https://api.openverse.org/v1/`. `CORS_ALLOW_ALL_ORIGINS = True` (verified in `api/conf/settings/security.py`), so a static page can call it directly, subject to the anonymous throttle in LP-23.

| Openverse field | → `Reference.metadata` | Notes |
|---|---|---|
| `id` (from `identifier`) | `source_id` | |
| `title` | `title` | |
| `creator`, `creator_url` | `creator` (URL used as the link target only) | |
| `url` | `media_url` | the media file — **not** the source page |
| `thumbnail` | `thumbnail_url` | |
| `foreign_landing_url` | **`source_url`** | the human-facing page at the *upstream* provider |
| `license` (lowercase code) | `license` (after mapping, §6.3) | |
| `license_version` | `license_version` | |
| `license_url` | `license_url` | **computed property with a documented fallback** — see LP-32 |
| `attribution` (computed) | **`credit_line`** | Openverse's own wording, stored verbatim (LP-28) |
| `provider`, `source` | `source` context; `S_label` = `"{source} via Openverse"` | |
| `tags`, `category`, `filetype`, `extension`, `filesize` | facet search / `search_text` | |

**LP-31.** Filter with **explicit licence codes**, never with `license_type`. Verified: `license_type=commercial` still admits `by-nd`, and `license_type=modification` still admits `by-nc` — neither group matches our policy. The correct query parameter is `license=cc0,pdm,by`, plus `,by-sa` only when the optional tier is enabled. Also send `filter_dead=true`.

**LP-32.** Openverse's `license_url` is a *derived* property that "falls back if initialization fails". License Guard therefore treats a missing or empty `license_url` as **not verified** — never as "probably fine". For `cc_by`/`cc_by_sa` this routes to `license_review` (LP-19).

### 6.3 Licence-code mapping tables

**LP-33.** Each table is a closed allow-list. Anything not listed maps to `unknown`. There is no pattern-matching fallback, no fuzzy match, and no "it starts with `by-` so it's probably CC BY".

| Openverse code | → `LICENSE_ID` | | Commons `License` code | → `LICENSE_ID` |
|---|---|---|---|---|
| `cc0` | `cc0` | | `cc0` | `cc0` |
| `pdm` | `pdm` | | `pd`, `pd-*` family | `public_domain` |
| `by` | `cc_by` | | `cc-by-{v}` | `cc_by` |
| `by-sa` | `cc_by_sa` | | `cc-by-sa-{v}` | `cc_by_sa` |
| `by-nc` | `cc_by_nc` | | `cc-by-nc-{v}` | `cc_by_nc` |
| `by-nc-sa` | `cc_by_nc_sa` | | `cc-by-nc-sa-{v}` | `cc_by_nc_sa` |
| `by-nd` | `cc_by_nd` | | `cc-by-nd-{v}` | `cc_by_nd` |
| `by-nc-nd` | `cc_by_nc_nd` | | `cc-by-nc-nd-{v}` | `cc_by_nc_nd` |
| `sampling+`, `nc-sampling+` (deprecated) | `unknown` | | anything else | `unknown` |

The `{v}` suffix populates `license_version`. Commons' exact emitted code strings beyond this shape are `(UNVERIFIED — commons.wikimedia.org was egress-blocked during research; the shape is confirmed from CommonsMetadata's `DataCollector.php`, the value set is not)`. The adapter must therefore log every unmapped code it sees so the table can be extended from evidence rather than from guessing.

**LP-34.** Flickr's numeric licence ids are a worked example of why these tables are data, not logic — and of the two traps in them. Recorded here for when a Flickr adapter is written, not because one exists: ids `4, 9, 10, 11` map to our default allow-list and `5, 12` to the optional tier; but id **7** ("No known copyright restrictions", the Flickr Commons marker) and id **8** ("United States Government Work") are **institutional assertions, not CC grants**, and map to `unknown` → `license_review`. Never auto-approve an assertion.

---

## 7. The no-binaries rule

**LP-35.** No media binary is ever stored in this repository, in `data/references.json`, in any exported `VisualRecipe`, or in any `ReferenceSnapshot`. We store: `source_url`, `media_url`, `thumbnail_url`, metadata, embeddings, and typed visual attributes. Nothing else.

This is schema-enforced, not merely documented: `media_blob`, `media_base64`, `media_bytes`, `data_uri` and `binary` are declared `false` in `reference.schema.json#/properties`, so a document carrying any of them is **invalid** (INV-REF-2).

```
   WHAT WE STORE                              WHAT WE NEVER STORE
   ┌────────────────────────────────┐         ┌──────────────────────────────┐
   │ source, source_id              │         │ the JPEG / PNG / WebM bytes  │
   │ source_url    (a link)         │         │ a base64 data: URI           │
   │ media_url     (a cache hint)   │  ──X──► │ a downloaded thumbnail file  │
   │ thumbnail_url (server-derived) │         │ a frame extracted to disk    │
   │ license, license_url, creator  │         │ a re-hosted mirror           │
   │ attribution   (stored TEXT)    │         │ an "offline cache" of media  │
   │ visual_attributes (typed ids)  │         └──────────────────────────────┘
   │ embeddings    (prefer vector_ref)        │
   └────────────────────────────────┘
```

Six reasons, each independently sufficient:

1. **We have no redistribution right for most of it.** CC BY permits redistribution with credit; PD permits anything; but the moment we store bytes we are a *distributor*, and every obligation we currently discharge by linking would have to be discharged by us on every copy.
2. **It keeps the two layers apart (§1).** An MIT repository containing CC BY-SA image bytes is a licensing argument. An MIT repository containing a URL is not.
3. **Takedown becomes tractable.** A wrong licence (§13) is fixed by demoting a record. If we had mirrored the bytes, it would also be a purge across every clone, fork, release artefact and user export in existence.
4. **Privacy.** User uploads never leave the device (§10). There is no user-media corpus to leak because there is no user-media corpus.
5. **The rot policy already handles the failure mode.** `media_url` is a *cache hint* expected to rot; identity is `(source, source_id)` plus `source_url`; a recipe with 100% dead media produces the **same prompt**, because intent, mix, conflict resolutions and every taxonomy id are pixel-free (`DATA_SCHEMA.md §10.4` R1–R5).
6. **Repository hygiene.** A design repo that grows a media corpus stops being reviewable.

**LP-36.** Thumbnails are **derived URLs**, not stored files. Commons gives us `iiurlwidth=<px>`; Openverse gives us `/v1/images/{id}/thumb/`. Both render server-side. Where a provider offers a named ladder of derivative sizes, prefer it so the card grid and the detail drawer do not fight over one asset.

**LP-37.** The same spirit governs embeddings: prefer `EmbeddingRecord.vector_ref` into a sidecar index outside the repository. Inline float arrays are for test fixtures only. An embedding is not media, but a repository full of them is still a corpus.

---

## 8. UI obligations

Licence compliance that is not visible is not compliance. These are hard UI requirements, not suggestions, and each maps to a specific module in `src/ui/`.

| # | Obligation | Where | Rule |
|---|---|---|---|
| **U1** | **A licence badge on every card, always.** | `reference-card.js` | No result tile renders without a badge. The badge carries the `LicenseShortName`-style label and is colour-coded by `policy_class`: allowed / optional / excluded. Badges are never truncated away at small grid density; the thumbnail shrinks first. |
| **U2** | **Status is visible, not just licence.** | `reference-card.js` | `candidate`, `license_review` and `rejected` are visually distinguishable from `approved` **before** the user invests effort. A `license_review` card is dimmed with an explicit "licence not verified" chip. |
| **U3** | **Attribution visible before use.** | `reference-detail.js` | The full attribution block (§5.4) renders in the detail panel, and the detail panel is reachable in one click from every card. USE / EXTRACT / EXPLORE are enabled **only** for `approved` references; on a non-approved card those actions are replaced by a "Why can't I use this?" affordance that opens the guard audit trail. |
| **U4** | **The mixer shows its running credit.** | `reference-mixer.js` | The mix panel renders the live attribution block for every reference currently in `mix.references[]`. A user assembling a composition can always see whom they will need to credit. |
| **U5** | **Exports carry the notice.** | export paths | See LP-39 below. |
| **U6** | **Empty results are explained, never silent.** | `explorer-modal.js` | When the licence filter removes results, say so with numbers: *"Showing 12 of 340 results. 218 are CC BY-NC and 110 have no verified licence — both are excluded by policy."* Offer the licence tier as an explicit, labelled lever. Never silently widen a query to fill a grid. |
| **U7** | **Share-alike is warned, not buried.** | `reference-detail.js`, export dialog | The LP-9 notice, verbatim, wherever `share_alike` is true. |
| **U8** | **Custom-licence providers are visually distinct.** | `reference-card.js` | LP-13.2 — a non-CC badge never shares a style with a CC badge. |
| **U9** | **External transmission is disclosed before it happens.** | provider settings, upload panel | Any outbound call carrying user media, or any compliance ping (LP-14), is disclosed with a timestamp written to `disclosed_at` **before** the first call. |

**LP-38 — the empty-grid rule.** U6 exists because every product surveyed in the research fails it: strict filters produce empty grids with no explanation, or the product quietly widens the query. Both teach the user that the licence filter is broken and should be turned off. Explaining the filter is what makes it survivable.

**LP-39 — how the licence notice travels into exports.** This one needs care, because a prompt string is not a document.

| Export | Carries the notice how |
|---|---|
| `VisualRecipe` (JSON) | `license_summary` with `attribution_block`, always. Plus a full `ReferenceSnapshot` per mix reference including licence, creator and attribution (INV-RCP-1). |
| `StructuredPromptDocument` (JSON) | The attribution block travels in the **envelope**, alongside `text`, `structured`, `blocked[]` and `warnings[]`. |
| `visual_intent`, `reference_mix` (JSON) | Same envelope treatment. |
| Markdown / file export of a prompt | Attribution block appended below the prompt, under a `References used` heading. |
| **Copy prompt text to clipboard** | **The prompt text itself carries no attribution.** |

**Why the prompt text stays clean.** Injecting a credit line into prompt text would corrupt the prompt — a generator would try to render it. It would also violate INV-FMT-3: *the formatter never invents a value not present in the `StructuredPrompt`*. So the notice travels **beside** the text, never inside it: the copy button sits next to a persistent, non-dismissible "References used" panel showing the full attribution block, and every *file* export includes the block. The obligation is discharged by the surface the user is actually looking at, not by polluting the artefact.

**LP-40.** `license_summary.has_excluded === true` ⇒ the recipe **must** warn on open and **must not** be exported by default. This is the case where a recipe was authored under a different operator policy, or where a revocation (§13) landed after the recipe was saved.

---

## 9. Prohibited sourcing

**LP-41.** The following are forbidden as sources of media, metadata, vocabulary or prompt data. Each entry states the reason, because a prohibition without a reason gets re-litigated by the next contributor.

### 9.1 Platform scraping — forbidden by the platforms' own terms

| Platform | The term | Consequence for us |
|---|---|---|
| **Pinterest** | *"You agree not to use any robot, spider, crawler, scraper or other automated means or interface not provided by us to access the Services or to extract data"* | No pin import, no board import, no "paste a Pinterest URL" affordance. Pins also carry no reliable per-item licence, so even a permitted import would fail stage 1. |
| **Instagram** | *"You may not access or collect data from our Products using automated means (without our prior permission)."* | No media copying, no metadata harvest, no embed-and-cache. |
| **TikTok** | prohibits *"scraping, crawling, exporting or otherwise extracting any data or content in any form, for any purpose, from the Platform using any automated system or software"* except with written approval | No video DB. This is doubly relevant because v0.4 needs video and TikTok is the obvious temptation. |
| **Civitai** | prohibits access via spiders, robots, crawlers and data-mining tools except through the public API within rate limits | Reviewed as prior art only. Third-party bulk scrapers of it are an anti-pattern, not a template. |
| **Lexica / prompt galleries** | user-generated model output with no per-image licence provenance | Fails stage 1 as `unknown`. Never a provider. |

These are the brief's hard prohibitions, restated with the terms that make them non-negotiable. Note that two independent barriers apply to each: the platform's terms, **and** the absence of per-item licence metadata. Removing one would not unlock the other.

### 9.2 Bulk copying of prompt databases and vocabularies — forbidden by the brief

The brief forbids *"wholesale copying of prompt DBs or external repository code"*. Concretely, and named so nobody has to rediscover them:

| Corpus | Why not |
|---|---|
| CLIP Interrogator's label files (`flavors.txt` alone is 100,970 lines / 1.72 MB of scraped prompt phrases, plus a raw artist-name list) | scraped phrases of mixed provenance; MIT on the code does not clear the corpus; it would poison our taxonomy's neutrality |
| Danbooru / booru tag corpora (Custom-Scripts autocomplete lists, WD tagger `selected_tags.csv`) | scraped tag data of unclear provenance, heavy single-domain aesthetic bias, NSFW axis we do not want |
| Fooocus-derived style JSON (Workflow Studio and its re-vendors) | a widely re-vendored corpus with its own upstream provenance chain |
| `sd-dynamic-prompts` community wildcard bundles | `.txt` bundles aggregated from unstated sources |
| ComfyUI-Prompt-Vault's `vault_data.py` component database, Comfyroll's style JSON, WildPromptor's artist lists | prompt DBs; Comfyroll additionally has **no LICENSE file at all** (verified absence) and is therefore all-rights-reserved |
| Any artist-name list presented as a style parameter | ethical and legal hazard, and inconsistent with our own "describe the look, not the brand" rule (the same discipline as the lens honesty rule) |

**LP-42.** `data/taxonomy/*.json` is **authored by us**, licensed MIT with the rest of the code, and derived from published *facts* (a shot-scale ladder is a fact; a 294-item attribute dump is a corpus). Vocabulary may be learned from prior art and cited in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md); it may not be copied.

### 9.3 Research datasets — permissive code over restricted data

The most instructive trap in the whole survey: **a permissive repository licence does not clear its payload.**

| Dataset | Status | Verdict |
|---|---|---|
| CineTechBench | **CC BY-NC-ND-4.0** (verified) | Blocked three times over — NC, ND, and no redistribution of modified material. Cite only. |
| `rsomani95/shot-type-classifier` | **CC BY-NC-4.0** (verified) | NC. Cannot ship weights, cannot adopt its class list as shipped vocabulary. |
| CameraBench | CC BY-4.0 (verified) for repo contents | Taxonomy *shape* may be cited with attribution; the annotated videos are third-party media the authors do not own — **never ingest the media**. |
| DeepFashion2 | **no LICENSE file** (verified absence); access via a Google Form issuing an unzip password | A password is not a licence. Blocked. |
| VITON-HD | CC BY-NC-4.0, research only | Blocked. |
| Dress Code | bespoke agreement; *"The dataset will not be released to private companies"* | Blocked, and the canonical proof that "it downloaded" ≠ "we may use it". |
| Polyvore | repo Apache-2.0, **images scraped from a dead site, mirrored to Kaggle** | "It's on Kaggle" is not a licence. Blocked. |
| Fashionpedia | reported CC BY-4.0 `(UNVERIFIED — the primary terms page was egress-blocked)` | Structure may be learned and cited; **no vocabulary dump** until the licence is read from the primary source. |
| Fashion-IQ | CDLA, **variant unconfirmed** `(UNVERIFIED)` | Permissive-1.0 and Sharing-1.0 have opposite consequences for anything we publish. Blocked until resolved. |
| ShotBench, AVE | **no LICENSE file** (verified absence) | Treated as all-rights-reserved. Field decomposition may be cited as prior art; nothing vendored. |
| `mmfashion` | Apache-2.0 code over research-gated data | The archetype: permissive code + restricted data is not a usable stack. |

**LP-43.** Default for any dataset whose licence we have not read from a primary source: **blocked**. Not "probably fine". This is the same fail-closed posture as `unknown` in §2, applied one layer up.

---

## 10. User-supplied media

A user dropping their own photo or video into the modal is the most privacy-sensitive path in the product. It gets its own rules.

**LP-44 — it stays local.** User-supplied media is processed on the device. It is never uploaded to any server, never sent to a provider, never sent to a remote model adapter, and never written into shared storage. `ExplorerState.ai.external_transmission.allowed` defaults to `false`, and a `Reference` with `privacy.local_only: true` **must be refused by every remote adapter** — the refusal lives in the adapter, not in the caller, so a new call site cannot bypass it.

**LP-45 — the upload handle is not a transmission.** An `upl_` handle **never** implies bytes left the device. It is a local object-URL/handle. If a future feature genuinely needs to transmit user media, it requires an explicit disclosure with a written `privacy.disclosed_at`, per-item, before the first byte moves — and the disclosure must state what is sent (frames, not files, per the frame-sampling architecture) and to where.

**LP-46 — it is never added to the shared reference DB.** `data/references.json` is the shipped, licence-cleared seed corpus. User uploads live in the user's local library only. There is no code path from an upload to `data/references.json`, and no export path that embeds an upload's media.

**LP-47 — it is marked truthfully.**

| Field | Value | Why |
|---|---|---|
| `metadata.source` | `local` or `user_upload` | not a remote provider |
| `metadata.license` | `user_owned` | `user_owned` exists in the enum exactly so an upload has a truthful licence value instead of being laundered as `cc0` or flagged as `unknown` |
| `metadata.creator` | may be null | permitted for `user_owned` |
| `privacy.local_only` | `true` | the adapter-level refusal switch |
| `privacy.may_transmit_external` | `false` | flipped only by an explicit, disclosed user action |
| id prefix | `img_local_<uuid8>` / `vid_local_<uuid8>` | distinguishable at a glance from provider-minted ids |

**LP-48 — private-source approval is scoped.** A `user_owned` reference reaches `approved` in the **local library only**. Stage 2 (source validation) passes trivially — the file is on the device — but the approval carries a `scope: local` marker, and every share, publish or export path treats a `privacy.local_only` reference as unexportable: the recipe exports with that snapshot's media fields blank and a `"private source"` marker in place of the attribution line. A user may of course export their own work; the product simply never does it *for* them by default, because a recipe is a shareable artefact and a private photo is not.

**LP-49 — `user_owned` is a claim we do not verify.** We take the user's word that the media is theirs. That claim is recorded (`license: "user_owned"`, `source: "user_upload"`) so that if a recipe built on it is later shared and disputed, the provenance says exactly where the asset came from and who asserted it. We do not, and cannot, verify it. This is stated here so nobody later mistakes `user_owned` for a verified licence.

---

## 11. Model and dataset licensing

**LP-50.** **Model weights are licensed separately from model code, and neither is implied by the other.** A repository's licence badge tells you about the repository. The research produced four independent demonstrations:

| Case | Code | Weights / data | Lesson |
|---|---|---|---|
| SigLIP 2 (`google-research/big_vision`) | Apache-2.0 (verified) | README splits *"All software … Apache 2.0"* from *"All other materials … CC-BY"* and **never licenses the released checkpoints** | the repo licence may not cover the thing you want |
| LTX-Video | Apache-2.0 repository (verified) | **OpenRAIL-M** weights (verified) — with use restrictions | a repo badge is not the weight licence |
| LanguageBind | MIT code | **CC BY-NC-4.0 dataset** | permissive code, non-commercial payload |
| ComfyUI-MultiModal-Prompt-Nodes | GitHub label reads **NOASSERTION / "Other"** | LICENSE file is **GPL-3.0** | **the LICENSE file is authoritative, never the platform label** (Hydrus is the mirror-image case: label NOASSERTION, file WTFPL v3) |

**LP-51 — the shipping gate.** No model may be shipped as a **default** adapter until (a) its **weights** licence has been read from a primary source by a human, (b) that licence is permissive enough to allow our users' commercial use, and (c) the licence text is reproduced in [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and the review recorded in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md).

**LP-52.** This gate is not a schedule risk, because of INV-AI-2: *no model name is ever hardcoded*. The product ships with `NULL_*` adapters and, in v0.1, a `MOCK_*` analyzer (`analysis_status: "mocked"`). AI-off is a complete product. A model is a **user-installed backend behind an adapter**, not a bundled asset — which means LP-51 gates *defaults and bundles*, and a user pointing the analyzer adapter at their own local runtime is their decision, not our distribution.

**LP-53 — candidate register.** Current status. Every "UNVERIFIED" below is because `huggingface.co` and the model-card hosts were egress-blocked during research; **only code-repository licences were confirmed firsthand.**

| Candidate | Role | Code licence | Weights licence | Ship as default? |
|---|---|---|---|---|
| Qwen3-VL (2B/4B/8B) | analyzer | Apache-2.0 repo (verified) | **UNVERIFIED** | ❌ not until read |
| Qwen3-VL-Embedding (2B/8B) | embedding | Apache-2.0 repo (verified) | **UNVERIFIED** | ❌ not until read |
| Qwen3-Embedding (text) | embedding | **UNVERIFIED** — raw LICENSE URL 404s, no repo label | **UNVERIFIED** | ❌ |
| jina-clip-v2 | embedding | — | reported **CC BY-NC-4.0** `(UNVERIFIED)` | ❌ **NC.** It would be incoherent to reject a CC BY-NC *photo* and bundle CC BY-NC *weights* |
| SigLIP 2 | embedding | Apache-2.0 (verified) | **checkpoints unlicensed by the README** | ❌ |
| OpenCLIP | embedding library | MIT (verified) | per-weight, varies, often unstated | library ✅ / weights ❌ |
| WD14 taggers | analyzer | training repo has **no LICENSE at all** (verified absence) | **UNVERIFIED** | ❌ |
| JoyCaption | analyzer | Apache-2.0 (verified) | **UNVERIFIED**, Llama 3.1 lineage | ❌ |
| Florence-2 | analyzer | no canonical repo (`github.com/microsoft/Florence` → 404) | **UNVERIFIED** | ❌ |
| moondream | analyzer | Apache-2.0 (verified) | **UNVERIFIED** | ❌ |
| InternVideo2 8B | video embedding | Apache-2.0 label | **UNVERIFIED**; also far too large for local-first defaults | ❌ |
| transformers.js / ONNX Runtime Web | runtime | Apache-2.0 / MIT (verified) | n/a | ✅ as a dependency, subject to the TPN policy |

**LP-54.** Model weight downloads are **user-initiated, size-disclosed and cached**. A first visit must never trigger a multi-hundred-megabyte fetch. `transformers.js` fetches weights from a remote hub on first use; a local-first product that does that quietly has broken its own privacy promise. Disclose the host, disclose the size, require a click.

**LP-55 — runtime code dependencies.** Permissive only: MIT, BSD-2/3-Clause, ISC, Apache-2.0 or equivalent. GPL / AGPL / LGPL are rejected for runtime code (see [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md)). Two consequences worth stating because they will come up:
- **FFmpeg** is LGPL-2.1-or-later by default and GPL with `--enable-gpl`; a `--enable-nonfree` build is not redistributable at all. If FFmpeg is ever used it goes **behind a process/CLI boundary** — never linked, never imported — and the build's actual licence is recorded in TPN.
- **`ffmpeg.wasm`** is an MIT wrapper around an LGPL (or, with the wrong flags, GPL) core. The *core's* licence is what must be recorded, with LGPL relinking rights preserved. This is the same trap as LP-50, wearing a JavaScript hat.

---

## 12. Audit checklist

Three checklists, three cadences. Each item is mechanically checkable; anything that needs judgement says so.

### 12.1 Per reference — automated, runs in `normalizeReference()` on every load

- [ ] `license` is a member of the closed `LICENSE_ID` enum (an unrecognised string fails loudly, never silently)
- [ ] `license_policy_class`, `requires_attribution`, `share_alike` **recomputed**, not trusted from storage
- [ ] `creator: null` only for `public_domain` / `pdm` / `cc0` / `user_owned`
- [ ] `source`, `source_id`, `license`, `source_url` all present
- [ ] `approved` ⇒ non-empty `attribution`, `license ∉ {unknown, proprietary}` (INV-LIC-1)
- [ ] `approved` + `cc_by`/`cc_by_sa` ⇒ non-empty `creator` **and** `license_url` (INV-LIC-2)
- [ ] `approved` ⇒ `license_check` and `source_validation` both `pass` (INV-LIC-3)
- [ ] guard step order not skipped
- [ ] no `media_blob` / `media_base64` / `media_bytes` / `data_uri` / `binary` (INV-REF-2)
- [ ] `license_url`, if present, matches the canonical deed URL family for its `license_id` (LP-20)
- [ ] not present in the revocation list (§13)
- [ ] `privacy.local_only` references carry `source ∈ {local, user_upload}` and `license: "user_owned"`

### 12.2 Per release — human, before tagging

- [ ] `git ls-files` shows **no** image, video or audio file outside `docs/` diagrams. Enforce in CI with an extension deny-list.
- [ ] `data/references.json` contains only references whose `license_policy_class` is `allowed`, all four guard steps `pass`, all with non-empty `attribution`.
- [ ] No `privacy.local_only` reference appears anywhere in a committed file.
- [ ] Every runtime dependency's licence is reproduced in [`../THIRD_PARTY_NOTICES.md`](../THIRD_PARTY_NOTICES.md) and permissive per LP-55.
- [ ] Every bundled or defaulted model's **weights** licence is verified and recorded (LP-51). If any is UNVERIFIED, the model is not a default.
- [ ] [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) records every project surveyed since the last release, with what was and was not taken.
- [ ] `data/taxonomy/*.json` contains no value copied verbatim from a third-party corpus (spot-check the largest additions).
- [ ] The licence badge renders on every card in a manual pass at every grid density (U1).
- [ ] The empty-result explanation (U6) is exercised by at least one test with a deliberately restrictive filter.

### 12.3 Per provider — human, before enabling a new one

- [ ] Per-**asset** licence field exists and is machine-readable (LP-4). If only record-level licensing exists → do not enable.
- [ ] Licence code → `LICENSE_ID` mapping table written as **data**, closed, unmapped codes → `unknown` (LP-33).
- [ ] Terms of service read and quoted in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md), specifically: automated-access clauses, attribution requirements, hotlink requirements, event-ping requirements.
- [ ] Rate limits recorded and enforced in the adapter.
- [ ] Required headers/identification implemented (e.g. `Api-User-Agent` for Commons, LP-23).
- [ ] No API key is baked into a static page or a query string. If the provider only supports query-param keys, it is user-supplied-key only, and that is an external-transmission disclosure.
- [ ] `S_label` display name and `source_url` binding decided and written into §6.
- [ ] Obligations beyond attribution/share-alike enumerated; if any exist, `x_ext.obligations` populated and the provider is opt-in (LP-13).
- [ ] Does the provider serve video? Record the answer — it determines whether v0.4 can use it.

---

## 13. Takedown and revocation: what to do when a licence is later found to be wrong

Licences are wrong sometimes. A Commons uploader mislabels a file; a provider's index goes stale; a rights holder discovers their work was marked PD in error; a policy changes. This section is the procedure, and its first rule is the important one.

**LP-56 — demote first, triage second.** On receipt of a credible report, the reference is demoted **immediately**, before any investigation: `status ← license_review`, all four guard steps `← pending`, and a revocation record is written. The reference disappears from default result sets (which filter on `approved`) within the same session. Investigation happens afterwards. We do not leave a disputed reference approved while we think about it.

### 13.1 Intake

Reports arrive by any route (an issue, an email, a provider notice, or our own audit). Required to be actionable: enough to identify the reference — either our `Reference.id`, or the pair `(source, source_id)`, or the `source_url`. `(source, source_id)` is the durable identity (R1), so it is the key everything else is resolved to.

### 13.2 The revocation record

**LP-57.** Revocations live in `data/license-revocations.json` (§14, addition A3), a small append-only file that ships with the product and is applied at load time.

```json
{
  "schema_version": "1.0",
  "revocations": [
    {
      "id": "rvk_wikimedia_commons_9f2ab41c",
      "source": "wikimedia_commons",
      "source_id": "File:Rain_7th_Ave.jpg",
      "reported_at": "2026-09-09T11:04:00Z",
      "reason": "license_incorrect",
      "from_license": "cc_by",
      "to_license": "unknown",
      "action": "license_review",
      "note": "Uploader tagged CC BY; the Commons file page now carries a copyright-violation template.",
      "actor": "maintainer:<handle>"
    }
  ]
}
```

| Field | Values |
|---|---|
| `reason` | `license_incorrect` \| `takedown_request` \| `source_deleted` \| `policy_change` \| `provider_removed` |
| `action` | `license_review` (disputed, resolvable) \| `rejected` (determined unusable) \| `purge` (must not appear at all, even as an excluded card) |

**LP-58 — revocations are keyed on `(source, source_id)`, not on our id.** Our ids are deterministic, but a reference may have been re-minted, edited, or copied into a recipe under a different id. Durable identity is the only key that catches every copy.

### 13.3 Propagation — including into frozen snapshots

This is the non-obvious part, and getting it wrong is how a wrong licence survives a fix.

```
   revocation record  ──┬──►  live Reference in the library
                        │       status ← action;  guard steps ← pending
                        │
                        ├──►  data/references.json  (removed at next release)
                        │
                        ├──►  every VisualRecipe.references[] SNAPSHOT
                        │       ◄── the part that is easy to miss
                        │
                        └──►  license_summary recomputed ⇒ has_excluded may flip true
                                ⇒ recipe warns on open, export disabled by default (LP-40)
```

**LP-59 — snapshots are frozen for appearance, not for licence.** `ReferenceSnapshot` is deliberately frozen so that editing the live library never silently rewrites a saved recipe (INV-RCP-1). That freeze is correct for `visual_attributes`, `title` and `media` — and **wrong** for licence, because a licence claim is exactly the thing that must not be frozen wrongly. Therefore: on loading a `VisualRecipe`, every snapshot's `(source, source_id)` is checked against the revocation list, and a hit **overrides** the snapshot's stored licence fields for display and export purposes. The recipe still opens; the intent, mix and prompt are unchanged (they are pixel-free); but the affected snapshot renders with the revoked badge and the recipe's `license_summary.has_excluded` flips true.

This is the one place where a snapshot is not authoritative, and it is deliberate. It costs one lookup per snapshot on recipe open, and it is the difference between a takedown that works and a takedown that only works for people who have not saved anything.

### 13.4 The procedure

| Step | Action | Timing |
|---|---|---|
| 1 | **Demote.** Write the revocation record with `action: "license_review"`. Reference leaves default results immediately. | on receipt, before triage |
| 2 | **Acknowledge** the reporter, stating that the reference has already been demoted. | within 3 business days |
| 3 | **Re-verify at source.** Re-run stage 2 by hand: fetch the provider record, read the licence as it stands now, compare with what we stored, and read `retrieved_at` to see how old our evidence was. | during triage |
| 4 | **Decide** and set the final `action`: `license_review` (still disputed), `rejected` (licence is genuinely excluded), `purge` (a takedown request, or content that must not be displayed at all even as an excluded card). | during triage |
| 5 | **Propagate** per §13.3: live references, `data/references.json`, snapshots, `license_summary`. | with the decision |
| 6 | **Record** the outcome in the guard audit trail (`license_check.note` and `actor`) and in [`THIRD_PARTY_REVIEW.md`](./THIRD_PARTY_REVIEW.md) if it revealed a systematic problem. | with the decision |
| 7 | **Fix the class of error, not just the instance.** If a provider mapping was wrong, fix the table in §6.3 and re-run stage 1 across every reference from that provider. If a whole provider is unreliable, that is a provider-level decision. | after the decision |
| 8 | **Ship.** Revocations take effect at load time from `data/license-revocations.json`, so an existing install picks them up on its next update without a migration. | next release |

**LP-60.** A revocation is **never deleted**. If a licence is later confirmed correct after all, a new record is appended with `action` reverting the reference — the history stays. The revocation file is the record of what we got wrong and when we knew, and that record is what makes the next audit believable.

**LP-61.** Because we store no binaries (§7), step 5 is a metadata operation. There is no purge of mirrored bytes across clones, forks, release artefacts and user exports. This is the concrete payoff of LP-35 and the strongest single argument for it.

---

## 14. Additions to the canonical model, flagged

Everything below is a name this document introduces that [`DATA_SCHEMA.md`](./DATA_SCHEMA.md) does not define. Nothing here changes an existing field, an enum member or an invariant.

| # | Addition | Shape | Why it is needed | Status |
|---|---|---|---|---|
| **A1** | `LICENSE_POLICY` operator settings | `{ allow_share_alike: false, require_human_approval_for_optional: true }`, a frozen export of `license-guard.js` | The canonical model says `license_policy_class` is derived from "`license` + operator settings" but does not name those settings. This names them. | **new name, no schema change** |
| **A2** | `metadata.x_ext.obligations` | `{ hotlink_only?: boolean, download_ping?: {endpoint} }` | Uses the existing `x_ext` extension bucket rather than adding a field. Only populated if a custom-licence provider is ever enabled (LP-13). Core code never reads it. | **uses existing `x_ext`; no schema change** |
| **A3** | `data/license-revocations.json` | `{ schema_version, revocations: [{ id, source, source_id, reported_at, reason, from_license, to_license, action, note, actor }] }` | Takedown propagation (§13) needs a durable, shippable, load-time-applied list. No existing file does this. | **new data file** |
| **A4** | `rvk_` id prefix | `rvk_<slugify(source)>_<sha256(source + "\|" + source_id).slice(0,8)>` | Follows the canonical id-prefix convention (`DATA_SCHEMA.md §0.4`) and the deterministic minting rule, so a revocation id is reproducible from the durable identity. | **new id prefix** |
| **A5** | `approval.scope` marker for private-source references | `"local"` recorded in the `approval` `GuardStep`'s `note` field | LP-48 needs approved-but-unexportable. Recorded in the existing `note` string rather than adding a field. | **uses existing field** |
| **A6** | TASL attribution template and slot-drop rules | §5.2 | The canonical model requires `attribution` to be stored text but does not specify the render. Two providers producing differently-shaped credit lines would make the attribution block unreadable. | **behaviour spec, no schema change** |
| **A7** | Canonical deed URL table | §5.2 / LP-20 | Validation only. Never used to synthesize a missing `license_url`. | **constant table** |
| **A8** | Snapshot licence re-check on recipe load | §13.3, LP-59 | Refines — does not contradict — the snapshot freeze rule: appearance stays frozen, licence does not. Without it, takedowns do not reach saved recipes. | **behaviour refinement** |

**Deliberately not added:** a `metadata_license` field. LP-3/LP-4 handle the record-vs-asset trap by rule (`license` always means the media asset; a record-level-only provider writes `unknown`) rather than by a second field that would immediately need its own guard, its own badge and its own conflict semantics. If a provider ever publishes both licences per asset in a form we can verify, this decision should be revisited — and until then, the absence of the field is what prevents anyone from reading a CC0 catalogue statement as a licence on a picture.

---

## 15. Answering the brief

| Brief requirement | Where |
|---|---|
| Sources priority: 1) Wikimedia Commons 2) Openverse | §6, LP-30 |
| Allowed by default: Public Domain, CC0, CC BY | §2, LP-5 |
| Optional: CC BY-SA | §2.1, LP-8/9/10 |
| Excluded by default: CC BY-NC, CC BY-NC-SA, CC BY-ND, Unknown | §2, §2.2 |
| License Guard: CHECK → SOURCE VALIDATION → ATTRIBUTION → APPROVAL | §4 |
| **Unverified licence can never reach `approved`** | LP-16, and defence-in-depth via LP-27 |
| Do NOT store media binaries — URL, thumbnail URL, metadata, embedding, attributes only | §7, INV-REF-2 |
| No bulk storage of unknown-licence images | §2 (`unknown` excluded), §9.3 (LP-43), §7 |
| No Pinterest scraping, no Instagram media copying, no TikTok video DB | §9.1 |
| No wholesale copying of prompt DBs or external repository code | §9.2, LP-42 |
| Local-first; external transmission explicitly disclosed | §10, LP-14, U9 |
| Q8 — is reference licensing separated from code licensing? | §1, LP-1/2/3 |
