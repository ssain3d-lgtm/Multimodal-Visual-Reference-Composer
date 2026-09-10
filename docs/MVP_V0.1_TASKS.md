# MVP v0.1 — task list

What v0.1 is, in twelve tasks. Ten are done; two remain.

> **한국어 요약:** 원래 72개 태스크였던 계획을 12개로 줄였습니다. 한 흐름
> (`입력 → 카드 → 속성 선택 → Mix Tray → Prompt`)을 실제로 동작시키는 데 필요한 것만
> 남기고, 나머지는 이 흐름을 써 본 뒤에 넓힙니다. 현재 10개 완료, 2개 남았습니다.

## Why this list is short

The first plan for v0.1 had 72 tasks and was sized XL. It layered Core, Search,
Prompt, Reference, Provider, AI adapter and UI before a single screen existed, and
the documentation grew to a hundred times the size of the running code. That is the
failure mode this project was supposed to avoid: architecture outgrowing the product.

So v0.1 is now exactly the one path a user actually walks:

```
input (text · image · video · browse)
   -> reference cards
   -> take only the attributes you want
   -> mix tray
   -> composed prompt
```

Everything else waits until that path has been used.

## Done

| # | Task | Files | Proof |
|---|---|---|---|
| T-01 | Taxonomy index: load ten files, recompute `children` from `parent`, close `conflicts_with` symmetrically, resolve deprecated ids | `src/core/taxonomy.js` | `tests/validate-taxonomy.mjs`, tests 3–4 |
| T-02 | Canonical constants read from the schema instead of retyped, so the category enum, arity table, slot map and EXTRACT groups cannot drift | `src/core/constants.js` | `tests/validate-schemas.mjs` |
| T-03 | Stable ids — order-independent conflict ids, no cryptographic hash | `src/core/id.js` | test 2 |
| T-04 | VisualIntent chips with provenance, confidence, lock and agreement-merging | `src/core/intent.js` | tests 13–14 |
| T-05 | ReferenceMix: per-group contribution, graded conflict detection, effective-contribution view | `src/core/mix.js` | tests 5–7 |
| T-06 | AI-free search: query expansion over aliases, metadata coverage with parent/related partial credit, fusion with renormalising weights, per-result explanation | `src/search/search.js` | tests 9, 11 |
| T-07 | Search by Difference — KEEP as a hard requirement, CHANGE as a sameness penalty rather than a filter | `src/search/search.js` | test 10 |
| T-08 | Prompt composition: intent + mix → StructuredPrompt → text, with provenance per fragment | `src/prompt/compose.js` | tests 7, 15 |
| T-09 | Seed library, generated and license-clean: no media bytes, every attribute resolved against the shipped taxonomy at build time | `tools/gen-seed.mjs`, `data/references.json` | test 1, CI seed gate |
| T-10 | The Unified Visual Explorer: four modes on one surface, card grid, EXTRACT/EXPLORE actions, mix tray, conflict UI, composed prompt with copy | `app/`, `src/ui/` | manual QA script below |

## Remaining

| # | Task | Why it is not done yet |
|---|---|---|
| T-11 | **Pin** a reference so it survives a query change | Small, but it needs a decision about whether pinned references also pin their chips. Deferred until the mix tray has been used enough to answer that. |
| T-12 | **Back** through exploration history | The state is already shaped for it (`ExplorerState` in the data model). Left until there is enough exploration depth to make it worth the UI. |

## Explicitly not in v0.1

Live Openverse/Wikimedia providers · embeddings and semantic search · reranking ·
video analysis · Visual Recipes · reference comparison · the ComfyUI node.
Each is a milestone of its own in [`ROADMAP.md`](./ROADMAP.md).

## Definition of done

v0.1 is done when each pillar is demonstrable with the analyzer switched **off**:

| Pillar | Demonstrated by |
|---|---|
| Unified modal | switching Text → Image → Video → Browse without losing the intent, the mix or the results |
| Visual Intent | chips carrying category, source, confidence and lock state, all editable |
| Reference decomposition | the EXTRACT row showing eight groups with per-group attribute counts |
| Selective inheritance | taking `composition` from one card and `clothing` from another |
| Reference mixing | a prompt whose fragments name which reference each came from |
| Search by difference | *Keep all but clothing* returning the same framing and lighting with a different outfit |

## Manual QA script

1. Open the app. Sixteen cards appear with no query — browsing works with nothing typed.
2. Type `night street low angle flash`. *Night street, direct flash* ranks first; each card says why it matched.
3. Click it. Take **composition** and **camera**. The mix tray shows one entry; a prompt appears.
4. Search `rooftop techwear`, click the top card, take **clothing**. The prompt now draws from two references, and the provenance row names both.
5. Take **camera** from the second card too. A hard conflict appears for camera angle, naming both contributors. The prompt is still produced.
6. Click the other value. The prompt changes; nothing was deleted.
7. Click *Keep all but clothing* on any card. Results share its framing and lighting and differ in outfit.
8. Switch to Image, then back to Text. The mix, the chips and the query are all still there.
