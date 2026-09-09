# License-safe media source APIs

## Why this cluster matters to us

The canonical brief fixes a hard licence policy: sources priority is **1) Wikimedia Commons, 2) Openverse**;
allowed by default are **Public Domain, CC0, CC BY** (optionally CC BY-SA); **CC BY-NC / NC-SA / ND / Unknown are
excluded by default**; and the License Guard pipeline is
`LICENSE CHECK -> SOURCE VALIDATION -> ATTRIBUTION METADATA -> REFERENCE APPROVAL`, where an unverified licence can
never reach `approved`. The brief also forbids storing media binaries — we persist only
`source_url / media_url / thumbnail_url / metadata / embedding / visual_attributes`.

That makes this cluster the load-bearing one for `src/providers/{openverse,wikimedia,local}.js`. Every provider must
return a `Reference.metadata` object with `{ source, creator, license, license_url, source_url, media_url,
thumbnail_url, attribution }`. This document records, per API, exactly which response field fills each of those slots,
what the licence filter parameter is called, whether a browser-only static page can call it (CORS), and whether the
source can serve **video** — which the brief needs from v0.4 onwards (camera motion extraction, motion reference mixing).

**Research constraint (relevant to reproducibility):** in this environment direct network egress and most documentation
hosts were blocked by the egress proxy (`api.openverse.org`, `docs.openverse.org`, `commons.wikimedia.org`,
`www.mediawiki.org`, `api.wikimedia.org`, `pro.europeana.eu`, `www.si.edu`, `unsplash.com`, `www.flickr.com`,
`data.rijksmuseum.nl`, `digitalcollections.nypl.org`, `make.wordpress.org`). To avoid guessing, the primary facts below
were verified against **the actual source code of the servers/clients on GitHub** (`raw.githubusercontent.com` and
`github.com` were reachable), which is a stronger citation than prose docs. Where a fact could only be obtained from a
search-result snippet, it is marked `(UNVERIFIED)`.

---

## 1. Openverse API

| | |
|---|---|
| Repository | `WordPress/openverse` (API base `https://api.openverse.org/v1/`) |
| License | **MIT** (code) — the indexed *media* carries its own per-item CC/PD licence |
| License verified | **Yes** — fetched [LICENSE](https://raw.githubusercontent.com/WordPress/openverse/main/LICENSE): "MIT License / Copyright (c) 2021 Openverse" |
| Main function | Aggregated search index over openly-licensed **images and audio** from ~many upstream providers, with first-class licence filtering |

### Endpoints (verified from the client integration tests)

From [`packages/js/api-client/tests/client.test.ts`](https://raw.githubusercontent.com/WordPress/openverse/main/packages/js/api-client/tests/client.test.ts):

- `GET /v1/images/` — image search
- `GET /v1/images/{identifier}/` — single item detail
- `GET /v1/images/{identifier}/thumb/` — thumbnail proxy (`url_path="thumb"` confirmed in
  [`api/api/views/media_views.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/views/media_views.py))
- `GET /v1/images/stats/`
- `GET /v1/audio/`, `GET /v1/audio/{identifier}/`
- `POST /v1/auth_tokens/token/`
- Related items: the `related` action is declared `@action(detail=True)` with no explicit `url_path`, so it routes as
  `/v1/images/{identifier}/related/` (media_views.py).

### Auth and throttling (exact numbers, verified)

From [`api/api/examples/oauth2_requests.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/examples/oauth2_requests.py):

- Register: `POST {ORIGIN}/v1/auth_tokens/register/` with body `name`, `description`, `email`
- Token: `POST {ORIGIN}/v1/auth_tokens/token/` with `grant_type=client_credentials`, `client_id`, `client_secret`
- Use: header `Authorization: Bearer {TOKEN}`
- Check your own quota: `GET {ORIGIN}/v1/rate_limit/`

From [`api/conf/settings/rest_framework.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/rest_framework.py)
(`DEFAULT_THROTTLE_RATES`) and [`api/api/utils/throttle.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/utils/throttle.py):

| Scope | Rate |
|---|---|
| `anon_burst` | `5/hour` (default) |
| `anon_sustained` | `100/day` (default) |
| `anon_thumbnail` | `150/minute` (default) |
| `anon_healthcheck` | `3/minute` (default) |
| `ov_referrer_burst` / `ov_referrer_sustained` | `5/hour` / `100/day` (default) |
| `oauth2_client_credentials_burst` | `100/min` |
| `oauth2_client_credentials_sustained` | `10000/day` |
| `enhanced_oauth2_client_credentials_burst` | `200/min` |
| `enhanced_oauth2_client_credentials_sustained` | `20000/day` |
| `exempt_oauth2_client_credentials` | `None` (unlimited) |

**Anonymous is 100 requests/day and 5/hour.** That is far too small for an interactive explorer modal — registration is
effectively mandatory for anything beyond a demo.

### CORS — can a static page call it directly?

**Yes.** [`api/conf/settings/security.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/security.py)
sets `CORS_ALLOW_ALL_ORIGINS = True`, plus `CORS_EXPOSE_HEADERS = ["cf-cache-status", "cf-ray", "date"]`
("These headers are required for search response time analytics").

Caveat: OAuth2 `client_secret` must never sit in a static page. Anonymous browser calls work but are capped at 100/day
per IP.

### Licence filtering parameters (verified)

From [`api/api/serializers/media_serializers.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/serializers/media_serializers.py):

- `license` — "Comma separated list of valid license codes"
- `license_type` — "Comma separated list of license type collections"

The accepted values come from [`api/api/constants/licenses.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/licenses.py):

```python
CC_LICENSES = {"by", "by-sa", "by-nd", "by-nc", "by-nc-sa", "by-nc-nd", "cc0"}
DEPRECATED_CC_LICENSES = {"sampling+", "nc-sampling+"}
PUBLIC_DOMAIN_MARKS = {"cc0", "pdm"}
LICENSE_GROUPS = {
    "all": ALL_LICENSES,
    "all-cc": ALL_CC_LICENSES,
    "commercial": {_license for _license in ALL_LICENSES if "nc" not in _license},
    "modification": {_license for _license in ALL_LICENSES if "nd" not in _license},
}
```

So our brief's default allow-list maps to **`license=cc0,pdm,by`** (add `by-sa` when the user opts into the optional
tier). Note `license_type=commercial` is *not* equivalent to our policy — `commercial` still admits `by-nd`, and
`modification` still admits `by-nc`. **We must filter with explicit `license=` codes, not with `license_type`.**

Other useful search params (same serializer): `q`, `source`, `excluded_source`, `tags`, `title`, `creator`, `extension`,
`filter_dead` ("Control whether 404 links are filtered out"), `page`, `page_size`,
`unstable__include_sensitive_results` (mutually exclusive with the legacy `mature`), `unstable__sort_by`,
`unstable__sort_dir`, `unstable__authority`, `unstable__authority_boost`, `unstable__collection`, `unstable__tag`.

Enumerated filter values from [`api/api/constants/field_values.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/field_values.py):
image `category` ∈ `digitized_artwork | illustration | photograph`; aspect ratio ∈ `tall | wide | square`;
size ∈ `small | medium | large`; audio categories `audiobook, music, news, podcast, pronunciation, sound_effect`;
length `shortest, short, medium, long`.

### Response fields → our `Reference.metadata`

| Openverse field | Our slot |
|---|---|
| `id` (serialized from `identifier`) | reference id (namespaced `ov:<uuid>`) |
| `title`, `creator`, `creator_url` | title, `creator` |
| `url` | `media_url` |
| `thumbnail` ("A direct link to the miniature artwork") | `thumbnail_url` |
| `foreign_landing_url` | `source_url` (the human-facing page at the upstream provider) |
| `license` (lowercase code), `license_version` | `license` |
| `license_url` (computed property; "constructed via License class instantiation; falls back if initialization fails") | `license_url` |
| `attribution` (computed property) | `attribution` |
| `provider`, `source` | `source` |
| `filesize`, `filetype`, `extension`, `category`, `tags` | visual metadata / facet search |
| `fields_matched` | "List the fields that matched the query for this result" — useful for our fusion ranker debugging |
| `indexed_on` (from `created_on`), `mature` (from `sensitive`), `unstable__sensitivity`, `detail_url`, `related_url` | ops/moderation |

Because `license_url` is a *derived* property with a documented fallback, License Guard must treat a missing/empty
`license_url` as **not verified**, never as "probably fine".

### Video: NO

Verified from [`api/api/constants/media_types.py`](https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/media_types.py):

```python
AUDIO_TYPE = "audio"
IMAGE_TYPE = "image"
MEDIA_TYPES = [AUDIO_TYPE, IMAGE_TYPE]
```

and from Openverse's own UI copy in
[`frontend/i18n/data/en.json5`](https://raw.githubusercontent.com/WordPress/openverse/main/frontend/i18n/data/en.json5):
"Currently Openverse only searches images and audio tracks, with search for video provided through External Sources",
where External Sources "offer external sources of media types we do not include in Openverse yet, but plan to."
**External Sources is a set of outbound links, not an API.** Openverse cannot serve our v0.4 video milestone.

### Overlap

Openverse overlaps with our **SIMILAR REFERENCE SEARCH** stage only. It is a keyword+facet retrieval index over
licence metadata; it has a `related/` endpoint but no notion of composition, camera angle, pose, lighting or motion. It
returns a flat result grid.

### Useful idea

Two things are worth adopting wholesale in spirit (not in code): (a) the **`license_type` grouping concept** — a single
user-facing switch ("commercial use OK", "modification OK") that expands into a concrete code list is a much better UX
than making users tick seven CC checkboxes; we should expose exactly two groups matching our brief's default and
optional tiers. (b) **`filter_dead`** — the index actively drops 404 links. Our License Guard `SOURCE VALIDATION` step
should do the same liveness check before a reference reaches `approved`, since we store URLs rather than binaries.

### What we must NOT copy

No copying of Openverse's Django/DRF code, serializers, or their frontend components (brief: "No wholesale copying of
prompt DBs or external repository code"). MIT would permit it, but the brief prohibits it and it would drag a whole
server architecture into a local-first product. We must also not mirror their catalogue: no bulk ingestion of their
index into `data/references.json`. Finally, do not copy the search-results-grid UX (see "UX patterns to avoid").

### Our differentiation

**Reference Decomposition.** Openverse returns a picture; we return a bag of typed visual attributes (composition,
camera_angle, framing, lens, pose, motion, clothing, lighting, scene, color, mood, style) that can be individually
inherited. An Openverse result is an *input* to our decomposition step, never the product.

---

## 2. Wikimedia Commons — MediaWiki Action API + CommonsMetadata

| | |
|---|---|
| Repository | `wikimedia/mediawiki` (core Action API) + `wikimedia/mediawiki-extensions-CommonsMetadata`; endpoint `https://commons.wikimedia.org/w/api.php` |
| License | **GPL-2.0** (or later) for the software — media items carry per-file CC/PD licences |
| License verified | **Yes** — fetched [CommonsMetadata `COPYING`](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/COPYING): "GNU General Public License … Version 2, June 1991" |
| Main function | Full media repository API: file search, `imageinfo` (URLs, thumbnails, MIME, mediatype) and machine-readable licence/attribution via `extmetadata` |

### Endpoint and query shape

Openverse's own ingester
([`catalog/dags/providers/provider_api_scripts/wikimedia_commons.py`](https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/wikimedia_commons.py))
calls, verbatim:

- endpoint `https://commons.wikimedia.org/w/api.php`
- `action=query`, `generator=allimages`, `gaisort=timestamp`, `gaidir=newer`, `gailimit=250`
- `prop=imageinfo|globalusage`
- `iiprop=url|user|dimensions|extmetadata|mediatype|mime|size|metadata`
- `format=json`

For *user-driven* search (what our modal needs) the generator becomes `generator=search` with `gsrnamespace=6`
(the File namespace) — the pattern the search snippets describe (UNVERIFIED as to exact param spelling, since
`commons.wikimedia.org` was unreachable here; it should be re-confirmed against `Commons:API/MediaWiki` before we ship
`src/providers/wikimedia.js`).

Full accepted `iiprop` set, verified from
[`includes/Api/ApiQueryImageInfo.php`](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiQueryImageInfo.php):
`timestamp, user, userid, comment, parsedcomment, canonicaltitle, url, size, dimensions, sha1, mime, thumbmime,
thumburls, mediatype, metadata, commonmetadata, extmetadata, archivename, bitdepth, uploadwarning, badfile`.
Related params (same file): `iiurlwidth`, `iiurlheight`, `iiurlparam`, `iiextmetadatalanguage`, `iiextmetadatafilter`,
`iiextmetadatamultilang`, `iilimit`, `iistart`, `iiend`, `iimetadataversion`, `iilocalonly`.

`iiurlwidth=<px>` is how we get a server-rendered thumbnail without downloading the original — exactly what the brief's
"do not store media binaries" rule wants.

### extmetadata keys (the attribution payload) — verified

From [`src/TemplateParser.php`](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/src/TemplateParser.php),
the extension emits these exact keys:

- Licence block: `LicenseShortName`, `UsageTerms`, `LicenseUrl`, `AttributionRequired`, `Attribution`, `NonFree`,
  `Copyrighted`
- Credit block: `Artist`, `Credit`, `ImageDescription`, `ObjectName`, `Permission`, `DateTimeOriginal`
- Restrictions: `Restrictions`, `DeletionReason`
- Geo: `GPSLatitude`, `GPSLongitude`, `GPSMapDatum`

From [`src/DataCollector.php`](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/src/DataCollector.php):
`Categories` (imploded, `source: 'commons-categories'`), `Assessments` (poty, potd, featured, quality, valued),
`DateTime`/`DateTimeOriginal` normalised to `TS_DB`, and `License` — a normalised machine-readable code derived from
`LicenseShortName` with `source: 'commons-templates'`.

Mapping to our `Reference.metadata`:

| extmetadata key | Our slot |
|---|---|
| `License` (normalised code, e.g. `cc-by-sa-4.0`) | `license` — **primary machine field** |
| `LicenseShortName` | human badge text ("CC BY-SA 4.0") |
| `UsageTerms` | long-form licence name shown in the licence drawer |
| `LicenseUrl` | `license_url` |
| `Artist` (may contain HTML) | `creator` |
| `Credit` | `attribution` source line |
| `Attribution` | pre-rendered attribution string when the file supplies one |
| `AttributionRequired` | drives whether the UI *forces* an attribution field into the export |
| `Copyrighted`, `NonFree`, `Restrictions` | **hard reject signals** for License Guard |

Every extmetadata entry is an object of the shape `{ value, source, hidden? }`, not a bare string — the provider must
read `.value` (verified indirectly: `DataCollector` writes `source` alongside each value, e.g. `'commons-categories'`).
`Artist` and `Credit` are wiki-HTML fragments and must be sanitised before rendering.

### CORS — can a static page call it directly?

**Yes, with `origin=*`.** Verified from
[`includes/Api/ApiMain.php`](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiMain.php)
`handleCORS()`: a request "for CORS without browser-supplied credentials (e.g. cookies): may be anonymous (`origin=*`)".
For `origin=*` the server sends `Access-Control-Allow-Origin: *` and sets `$allowCredentials = 'false'`, i.e.
`Access-Control-Allow-Credentials: false`. So **anonymous, cookie-less, read-only browser calls work** — which is
exactly our use case, and it means Wikimedia Commons can be our zero-backend default provider.

Note the anti-cache-poisoning comment in the same file: "Technically we should check for the presence of an Origin
header and not process it as CORS if it's not set, but that would require us to vary on Origin for all 'origin=*'
requests which we don't want to do."

### User-Agent from a browser

A browser cannot set `User-Agent` from JS. MediaWiki accepts an **`Api-User-Agent`** header instead — verified in
[`includes/Request/WebRequest.php`](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Request/WebRequest.php):

```php
if ( defined( 'MW_API' ) ) {
    // matches ApiMain::getUserAgent()
    $apiUserAgent = $this->getHeader( 'Api-User-Agent' );
}
```

Our `wikimedia.js` provider must send `Api-User-Agent: UnifiedVisualReferenceComposer/<version> (<contact URL>)`.
Wikimedia's published guidance is a soft ceiling around 200 req/s per client, ≤3 concurrent requests, and `maxlag=5`
on batch traffic (UNVERIFIED — from search snippets of `API:Etiquette` / `Wikimedia APIs/Rate limits`, both hosts
blocked here).

### Video: YES

Verified from [`includes/libs/Mime/defines.php`](https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/libs/Mime/defines.php):

| Constant | Value |
|---|---|
| `MEDIATYPE_BITMAP` | `'BITMAP'` |
| `MEDIATYPE_DRAWING` | `'DRAWING'` |
| `MEDIATYPE_AUDIO` | `'AUDIO'` |
| `MEDIATYPE_VIDEO` | `'VIDEO'` |
| `MEDIATYPE_MULTIMEDIA` | `'MULTIMEDIA'` |
| `MEDIATYPE_3D` | `'3D'` |

`iiprop=mediatype` returns these strings, so we can classify a Commons file as `Reference.type = video` deterministically.
CirrusSearch exposes a `filetype` search keyword that queries the `file_media_type` field — verified from
[`includes/Query/FileTypeFeature.php`](https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CirrusSearch/master/includes/Query/FileTypeFeature.php)
(`getKeywords()` returns `"filetype"`; values pipe-separated, max 20 conditions; matched against `file_media_type`).
The exact user-facing token spelling (`filetype:video`) is (UNVERIFIED) because the alias table lives in
`CirrusConfigNames::FiletypeAliases` config, not in the source file.

Notably, Openverse's own Commons ingester **discards** video: its mediatype mapping keeps `BITMAP`/`DRAWING` as images
and `AUDIO` as audio, and "video and office document types are explicitly ignored" (wikimedia_commons.py). So for our
v0.4 video milestone, **going direct to the Commons API is the only path** — Openverse would have thrown the videos away.

### Overlap

Commons overlaps with **SIMILAR REFERENCE SEARCH** and, uniquely, with the **licence + attribution** half of our
License Guard: `extmetadata` already carries a normalised `License` plus `AttributionRequired`, which is precisely the
`ATTRIBUTION METADATA` step the brief specifies. `Special:MediaSearch` is a search UI, not a decomposition tool.

### Useful idea

`AttributionRequired` as an explicit boolean is the single most reusable idea in this whole cluster. Rather than
inferring "CC BY needs credit" from a licence string, the source states it. Our `license-guard.js` should carry the same
explicit flag on every `Reference`, defaulting to `true` whenever the source does not state otherwise — fail-closed.
Second idea: `iiurlwidth` server-side thumbnailing, so `thumbnail_url` is a derived URL and never a stored byte.

### What we must NOT copy

Do not vendor MediaWiki or CommonsMetadata PHP — GPL-2.0 is copyleft and would infect our codebase; we call the API over
HTTP, which is not a derivative work. Do not scrape Commons category trees into our own taxonomy files
(`data/taxonomy/*.json` must be our own vocabulary, per the brief). Do not re-host Commons media; store URLs only.
And do not import `extmetadata`'s free-text `ImageDescription` blobs as if they were structured VisualIntent — they are
prose and must go through the analyzer like any other text.

### Our differentiation

**Selective Inheritance.** Commons can tell us a file is CC BY-SA 4.0 and who shot it; it cannot let a user take the
*composition* from that file and the *lighting* from another. Commons is the licence-clean substrate; the product is the
attribute-level mixing that sits on top of it.

---

## 3. Europeana Search API

| | |
|---|---|
| Repository | `europeana/labs-preview` (API docs), `europeana/rd-europeana-python-api` (client); endpoint `https://api.europeana.eu/record/v2/search.json` |
| License | Python client: **EUPL-1.2**. The API service itself is not a repo we can licence-check. |
| License verified | **Partly** — the client repo's licence was read from its GitHub page ([rd-europeana-python-api](https://github.com/europeana/rd-europeana-python-api), LICENSE.md → EUPL-1.2). The API terms themselves are (UNVERIFIED) since `pro.europeana.eu` was blocked. |
| Main function | Aggregated search over ~50M European cultural-heritage objects (TEXT, VIDEO, SOUND, IMAGE, 3D) with a rights-based reusability filter |

Verified from [`europeana/labs-preview/api/search.md`](https://raw.githubusercontent.com/europeana/labs-preview/master/api/search.md):

- Base: `http://europeana.eu/api/v2/search.json` (current form `https://api.europeana.eu/record/v2/search.json`)
- Params: `query`, `profile`, `qf`, `rows`, `start`, `callback`, `reusability`, `facet`,
  `f.[facet name].facet.limit`, `f.[facet name].facet.offset`
- `reusability` ∈ **`open | restricted | permission`**
- `type` ∈ **`TEXT, VIDEO, SOUND, IMAGE, 3D`** ← Europeana *does* carry video
- Item fields: `id`, `title`, `edmPreview`, `edmIsShownAt`, `edmIsShownBy`, `dataProvider`, `provider`, `rights`,
  `type`, `guid`, `score`, plus `europeanaCompleteness`, `dcCreator`, `year`, `language` etc. depending on `profile`

`reusability=open` returns only Public Domain Mark, CC0, CC BY or CC BY-SA (UNVERIFIED — search snippet from
`pro.europeana.eu`; blocked host). `media=true` / `thumbnail=true` exist in the current API and in the Python client
(`query`, `qf`, `reusability`, `media`, `thumbnail`, `landingpage`, `colourpalette`, `theme`, `sort`, `profile`, `rows`)
but are absent from the older `labs-preview` doc — treat as (UNVERIFIED) until re-checked.

Auth: a free `wskey` API key is required as a query parameter (UNVERIFIED as to registration flow; blocked host).
**A `wskey` in a query string is visible in a static page's network tab — this is a reason to keep Europeana behind an
optional, user-supplied-key setting rather than shipping it as a default provider.** CORS status is (UNVERIFIED);
the presence of a `callback` (JSONP) parameter historically suggests cross-origin use was expected.

Field mapping: `edmIsShownAt` → `source_url`, `edmIsShownBy` → `media_url`, `edmPreview` → `thumbnail_url`,
`rights` (an `edm:rights` URI) → `license_url`, `dataProvider` → `source`, `dcCreator` → `creator`.

**Overlap:** retrieval only, and it is metadata-first (catalogue records), not visual-first.
**Useful idea:** `reusability` as a *three-valued* trust ladder (open / restricted / permission) rather than a boolean —
that maps cleanly onto our `status: candidate | approved | rejected | license_review`, where `restricted` and
`permission` route to `license_review` instead of being silently dropped.
**Must NOT copy:** EUPL-1.2 is a copyleft licence — do not vendor the Python client. Do not bulk-harvest EDM records.
**Our differentiation:** **Unified Modal** — Europeana's rights filter lives on a separate search page with its own
result grid; in our product the source switch is a *mode* inside one modal whose state persists, so a user never has to
know they crossed a provider boundary.

---

## 4. Smithsonian Open Access API

| | |
|---|---|
| Repository | [`Smithsonian/OpenAccess`](https://github.com/Smithsonian/OpenAccess); endpoint `https://api.si.edu/openaccess/api/v1.0/` |
| License | **CC0-1.0** (metadata/data repo) |
| License verified | **Yes** — GitHub licence label on `Smithsonian/OpenAccess` reads CC0-1.0; README states the data is CC0 |
| Main function | 11M+ CC0 metadata records with media across 19 Smithsonian units; `search` and `content` endpoints |

Verified via Openverse's ingester
([`catalog/dags/providers/provider_api_scripts/smithsonian.py`](https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/smithsonian.py)):

- Base endpoint `"https://api.si.edu/openaccess/api/v1.0/"`, search at `{base}search`
- Auth: `api_key` query param, obtained from **api.data.gov** (Openverse stores it as `API_KEY_DATA_GOV`)
- Params: `q` (e.g. `"online_media_type:Images AND media_usage:CC0"`), `rows` (batch of 1000), `start`
- Media path: `content.descriptiveNonRepeating.online_media.media[]`; image URL at `.content`, id at `.idsId`
- **Licence check: `media.usage.access == "CC0"`** — an explicit per-media (not per-record) flag
- Landing page: `descriptiveNonRepeating.record_link`, falling back to `guid`
- Openverse assigns `LicenseInfo(license="cc0", version="1.0", url="https://creativecommons.org/publicdomain/zero/1.0/")`

Important caveat, and it is a licence-safety lesson: **record-level CC0 and media-level CC0 are different things.**
The `usage.access` flag sits on the individual media asset. A record can be open while a specific image is not.

Note: the `Smithsonian/OpenAccess` GitHub repo was **archived on 2026-05-21** and is now read-only; bulk data moved to
S3 / the AWS Registry of Open Data. The live REST API at `api.si.edu` is separate and (UNVERIFIED) still running —
`www.si.edu` was blocked here. Rate limits are api.data.gov's standard tiers (UNVERIFIED — no number confirmed).
CORS: (UNVERIFIED). An `api_key` in a query string has the same static-page exposure problem as Europeana's `wskey`.

**Overlap:** retrieval + a CC0-only corpus. Zero decomposition.
**Useful idea:** per-asset `usage.access` rather than per-record rights. Our `Reference` should likewise bind the licence
to the *media asset* we actually display, not to its parent catalogue record.
**Must NOT copy:** do not mirror the 11M-record dump into the repo (brief: no bulk storage; no media binaries). CC0 would
legally permit it, but it violates our own architecture rule.
**Our differentiation:** **Visual Intent** — Smithsonian's `q` is a Solr-ish text query over catalogue prose; ours is a
structured schema (subject, framing, camera_angle, lighting, …) that every input mode compiles down to.

---

## 5. The Metropolitan Museum of Art — Open Access / Collection API

| | |
|---|---|
| Repository | [`metmuseum/openaccess`](https://github.com/metmuseum/openaccess); API `https://collectionapi.metmuseum.org/public/collection/v1/` |
| License | **CC0-1.0** for the dataset |
| License verified | **Yes** — GitHub licence label CC0-1.0; README: the Met "has waived all copyright and related or neighboring rights to this dataset using Creative Commons Zero" |
| Main function | Object metadata + open-access image URLs for the Met collection; no key required |

Verified via Openverse's ingester
([`metropolitan_museum.py`](https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/metropolitan_museum.py)):

- Endpoint `"https://collectionapi.metmuseum.org/public/collection/v1/objects"`, detail at `{endpoint}/{object_id}`
- Params used: `metadataDate`, `isPublicDomain`
- Response fields read: `objectIDs`, `total`, `isPublicDomain`, `objectURL`, `primaryImage`, `additionalImages`,
  `accessionNumber`, `department`, `medium`, `culture`, `objectName`, `artistDisplayName`, `title`, `classification`,
  `objectDate`, `creditLine`, `period`, `tags`
- Openverse assigns every Met record `license="cc0", version="1.0", url=".../publicdomain/zero/1.0/"`

Critical caveat, stated in the repo README: **"Images are not included and are not part of the dataset."** The CC0 waiver
covers the *metadata*. Image reuse is governed by the Met's Open Access page and signalled per object by
`isPublicDomain`. So `isPublicDomain === true` is the gate, and `primaryImage`/`primaryImageSmall` are only usable when
it is true. Anything with `isPublicDomain === false` must go to `rejected`, not `license_review`.

No API key is required (UNVERIFIED as to current rate limits; `metmuseum.org` docs were not reachable here).
CORS: (UNVERIFIED). Images: yes. Video: no.

**Overlap:** a narrow, very high-quality PD art corpus — useful for the brief's "Style" and "Composition" taxonomy
teaching examples ("I don't know what this lighting is called — let me pick it by looking at pictures").
**Useful idea:** a single unambiguous boolean (`isPublicDomain`) as the entire licence gate. Where a source gives us one,
License Guard should short-circuit on it rather than string-parse a licence name.
**Must NOT copy:** do not treat the CC0 *metadata* waiver as covering images — that is the exact mistake the brief's
"Unverified license can never reach approved" rule exists to prevent. Do not vendor the CSV dump.
**Our differentiation:** **Search by Difference** — the Met API can filter by department and date; it cannot answer
"same framing and lighting, different subject", which is our keep/change axis.

---

## 6. Flickr API (including Flickr Commons)

| | |
|---|---|
| Repository | Client used for verification: [`Flickr-Foundation/flickr-photos-api`](https://github.com/Flickr-Foundation/flickr-photos-api); API `https://api.flickr.com/services/rest/` |
| License | Client repo: **Apache-2.0 OR MIT** (dual). The Flickr *service* is proprietary. |
| License verified | **Yes** for the client repo (GitHub page states dual Apache-2.0 / MIT). Flickr's own ToS: (UNVERIFIED), `flickr.com` blocked. |
| Main function | Photo search with a first-class numeric `license` filter; Flickr Commons = "no known copyright restrictions" institutional holdings |

Base call shape, verified from the client README: `HTTP GET https://api.flickr.com/services/rest/?api_key={api_key}`
plus a required `method` parameter, e.g. `method=flickr.photos.search`.

**Full licence table**, verified from a recorded live response to `flickr.photos.licenses.getInfo`
([test cassette](https://raw.githubusercontent.com/Flickr-Foundation/flickr-photos-api/main/tests/fixtures/cassettes/TestLicenseMethods.test_get_licenses.yml)):

| id | name | url |
|---|---|---|
| 0 | All Rights Reserved | flickrhelp article |
| 1 | CC BY-NC-SA 2.0 | creativecommons.org/licenses/by-nc-sa/2.0/ |
| 2 | CC BY-NC 2.0 | .../by-nc/2.0/ |
| 3 | CC BY-NC-ND 2.0 | .../by-nc-nd/2.0/ |
| 4 | CC BY 2.0 | .../by/2.0/ |
| 5 | CC BY-SA 2.0 | .../by-sa/2.0/ |
| 6 | CC BY-ND 2.0 | .../by-nd/2.0/ |
| 7 | No known copyright restrictions | flickr.com/commons/usage/ |
| 8 | United States Government Work | usa.gov/government-copyright |
| 9 | Public Domain Dedication (CC0) | .../publicdomain/zero/1.0/ |
| 10 | Public Domain Mark | .../publicdomain/mark/1.0/ |
| 11 | CC BY 4.0 | .../licenses/by/4.0/ |
| 12 | CC BY-SA 4.0 | .../by-sa/4.0/ |
| 13 | CC BY-ND 4.0 | .../by-nd/4.0/ |
| 14 | CC BY-NC 4.0 | .../by-nc/4.0/ |
| 15 | CC BY-NC-SA 4.0 | .../by-nc-sa/4.0/ |
| 16 | CC BY-NC-ND 4.0 | .../by-nc-nd/4.0/ |

Our brief's default allow-list therefore maps to **`license=4,9,10,11`** (+ `5,12` when CC BY-SA is enabled).
**ID 7 ("No known copyright restrictions", the Flickr Commons marker) and ID 8 (US Government Work) are *not* CC and are
not on our default allow-list** — they belong in `license_review`, because "no known restrictions" is an institutional
assertion, not a grant.

The `license` param accepts comma-separated ids (UNVERIFIED as to the exact doc wording; from search snippet of
`flickr.photos.search`). `extras=license,owner_name,url_o,url_m,description` is the standard way to get licence and
attribution in the search response (UNVERIFIED — blocked host).
Requires an `api_key` (free registration). CORS: (UNVERIFIED). Video: Flickr hosts video, but our use is photos.

**Overlap:** retrieval with the best-in-class licence filter granularity of any source here.
**Useful idea:** numeric licence ids force us to keep an explicit **id → SPDX-ish code + canonical URL** mapping table
per provider rather than trusting a display string. That table belongs in `src/reference/license-guard.js` as data, one
map per provider, so adding a provider never means editing guard logic.
**Must NOT copy:** no scraping of Flickr galleries, no bulk downloading, and no treatment of ARR (id 0) content as
usable. The brief's prohibition on Pinterest/Instagram scraping applies in spirit here.
**Our differentiation:** **Reference Mixing** — Flickr can return 200 CC BY photos; it cannot combine the composition of
result #3 with the outfit of result #17 into one structured prompt.

---

## 7. Pexels API — **NOT Creative Commons**

| | |
|---|---|
| Repository | N/A — closed product. API `https://api.pexels.com/v1/` (photos) and `https://api.pexels.com/v1/videos/` |
| License | **Proprietary "Pexels License"** — not CC, not public domain |
| License verified | **No** — `pexels.com` was blocked; facts below come from a GitHub-mirrored copy of the official docs |
| Main function | Free-to-use stock photos **and videos** with a custom licence |

Verified against a mirrored copy of the official docs
([`developer-ishan/mcp-pexels/docs/official/pexels-api-docs.md`](https://raw.githubusercontent.com/developer-ishan/mcp-pexels/main/docs/official/pexels-api-docs.md) — a third-party mirror, so treat as indicative):

- Auth: `Authorization: YOUR_API_KEY` header (not a query param — better than Europeana/Smithsonian for leakage, but
  still fatal to ship in a static page)
- Photo search params: `query` (required), `orientation` (`landscape|portrait|square`), `size` (`large`/`medium`/`small`
  = 24MP/12MP/4MP), `color`, `locale`, `page`, `per_page` (default 15, max 80)
- Photo fields: `id, width, height, url, photographer, photographer_url, photographer_id, avg_color, src{original,
  large2x, large, medium, small, portrait, landscape, tiny}, alt, liked`
- Video fields: `id, width, height, url, image, duration, user{id,name,url}, video_files[{id, quality, file_type,
  width, height, fps, link}], video_pictures[]`
- Rate limit: **"200 requests per hour and 20,000 requests per month"**, with `X-Ratelimit-Limit`,
  `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` on 2xx responses
- Terms: "show a prominent link to Pexels", "Always credit our photographers when possible", and
  **"You may not copy or replicate core functionality of Pexels."**

**Flag for License Guard:** Pexels content carries no `license`/`license_url` field at all, because there is no
per-item licence — there is one blanket proprietary licence. Under our policy (`Excluded by default: … Unknown`) a Pexels
item can **never** reach `approved`. If we ever integrate it, it must be an explicitly user-enabled provider whose items
are permanently badged `license_review` with the Pexels terms surfaced verbatim.

**Overlap:** retrieval, plus it is one of only two sources here with a real video API.
**Useful idea:** the `avg_color` field as a load-time placeholder, and `src` as a *named ladder* of derivative sizes.
Our `Reference.metadata.thumbnail_url` should likewise be a small set of named sizes, not one URL, so the card grid and
the detail drawer don't fight over the same asset.
**Must NOT copy:** their "core functionality" clause is explicit — and independently, the brief forbids building on a
non-CC source. Do not cache Pexels media, do not treat "free to use" as public domain.
**Our differentiation:** **Unified Modal** — Pexels splits photos and videos into different API surfaces and different
site sections; our modal treats an image and a video as the same `Reference` type with the same attribute bag.

---

## 8. Unsplash API — **NOT Creative Commons**

| | |
|---|---|
| Repository | Official JS client [`unsplash/unsplash-js`](https://github.com/unsplash/unsplash-js); API `https://api.unsplash.com/` |
| License | Client library: **MIT**. The photos: proprietary **"Unsplash License"**. |
| License verified | **Yes for the client library** (GitHub licence label: MIT). **No for the photo licence** — `unsplash.com` was blocked; do not quote photo terms without re-checking. |
| Main function | Curated free-to-use photography with a custom licence and mandatory usage tracking |

Verified from the `unsplash-js` README: consumers must "attribute photographers" per the API Guidelines, "hotlink
images", and "trigger a download when appropriate" — demonstrated via the `/photos/{id}/download` endpoint. That
**download-tracking requirement is a compliance obligation, not an optional analytics nicety**: it means Unsplash
integration cannot be a purely passive metadata read.

The demo-vs-production rate limits (commonly cited as 50/hour vs 5000/hour) are (UNVERIFIED) — the README does not
state them and `unsplash.com/documentation` was blocked. CORS: (UNVERIFIED). Video: no.

**Flag for License Guard:** identical to Pexels — no per-item CC licence, so `approved` is unreachable under our default
policy. The hotlinking requirement additionally conflicts with nothing we do (we already store URLs, not binaries), but
the download-ping requirement adds an outbound call the brief's Privacy section would require us to disclose in the UI.

**Overlap:** retrieval only.
**Useful idea:** the *shape* of their obligation model — a source can require (a) attribution, (b) hotlinking,
(c) an event ping. Our `Reference.metadata` should carry a small `obligations` set rather than assuming attribution is
the only duty a licence can impose. That generalises `AttributionRequired` from Commons into something extensible.
**Must NOT copy:** do not vendor `unsplash-js` (MIT permits it, but the brief forbids wholesale external code and it
would couple us to a non-CC source). Never present Unsplash results next to CC BY results without a distinct badge.
**Our differentiation:** **Reference Decomposition** — Unsplash's value proposition is "a beautiful photo"; ours is
"the eleven typed attributes inside that photo, individually selectable".

---

## 9. Rijksmuseum Data Services

| | |
|---|---|
| Repository | N/A — institutional service, docs at `https://data.rijksmuseum.nl/docs/` |
| License | **UNVERIFIED** — widely described as public-domain images + open metadata, but `data.rijksmuseum.nl` was blocked and no LICENSE file exists to check |
| License verified | **No** |
| Main function | ~800k object records, most with high-resolution images; OAI-PMH, a Search API, an LDES stream, and IIIF Presentation/Image APIs |

All details here are (UNVERIFIED), from search snippets only: an API key is required; the older Collection and
Collection Details endpoints (returning a `webImage` object with `guid, width, height, url`) are marked **deprecated**;
the museum now steers integrators to IIIF. Video: none.

The genuinely interesting part for us is **IIIF**. A IIIF Image API endpoint gives arbitrary server-side crops and sizes
from a canonical URL (`{id}/{region}/{size}/{rotation}/{quality}.{format}`) — which is a much better fit for our
"no binaries in the repo" rule than storing our own derivatives, and it would let the reference-detail view zoom into a
*region* of a reference when the user is isolating, say, composition or clothing.

**Overlap:** retrieval of a PD art corpus.
**Useful idea:** IIIF as the thumbnail/derivative strategy across any provider that supports it — one URL template
instead of a stored image pyramid.
**Must NOT copy:** do not assume "museum = public domain"; without a verified licence statement per object, everything
here is `license_review` at best.
**Our differentiation:** **Visual Intent** — a IIIF manifest describes pixels and regions; it says nothing about camera
angle, pose or lighting, which is the layer we add.

---

## 10. NYPL Digital Collections API

| | |
|---|---|
| Repository | [`NYPL-publicdomain/data-and-utilities`](https://github.com/NYPL-publicdomain/data-and-utilities); API `https://api.repo.nypl.org/` |
| License | **CC0-1.0** for the metadata snapshot repo |
| License verified | **Yes for the repo** — GitHub licence label CC0-1.0; README: "NYPL's bibliographic metadata records and code provided via this repository are distributed under a Creative Commons CC0 1.0 Universal Public Domain Dedication" |
| Main function | Metadata + image access for NYPL Digital Collections; ~1/3 of items are public domain |

**Status warning:** the Repo API is reported to be **deprecated as of 2026-08-01, with no public API replacement
planned** (UNVERIFIED — from a search snippet of `digitalcollections.nypl.org/about`, which was blocked; given today is
2026-09-09 this may already be dead). Requires a token. The 2016 public-domain snapshot in the GitHub repo remains
available and CC0. Video: negligible.

**Overlap:** retrieval, historical/PD imagery.
**Useful idea:** the separation between "metadata is CC0" and "the item may or may not be public domain" is stated
plainly here, and it is the same trap as the Met. Our schema should never conflate `metadata_license` with
`license` (the media licence). Consider adding `metadata_license` alongside `license` in `Reference.metadata`.
**Must NOT copy:** do not build a dependency on a deprecated API; if used at all, treat the CC0 snapshot as a static
seed corpus for `data/references.json` (metadata only — no images), not a live provider.
**Our differentiation:** **Selective Inheritance** — a digitised archive gives whole plates; we give
"take the composition from this plate, the lighting from that photograph".

---

## UX patterns to avoid

- **The flat result grid as a terminal state.** Every source in this cluster (Openverse, Europeana, Flickr, Pexels,
  Unsplash) ends the user journey at a grid of thumbnails with a download button. Our grid is the *middle* of the
  pipeline; every card must expose `USE / EXTRACT / EXPLORE` and never a bare "download".
- **A separate page per media type.** Openverse routes `/search/image` and `/search/audio` separately and pushes video
  out to an "External Sources" link list; Pexels splits photos and videos into different API surfaces. The brief's
  pillar 1 forbids this outright: only the input MODE changes, the modal never closes.
- **Seven CC checkboxes.** Exposing raw `by-nc-nd` style codes to users is a licence-literacy tax. Expose our two tiers
  (default: PD/CC0/CC BY; optional: +CC BY-SA) and put the raw codes in an advanced disclosure.
- **Licence as a footnote.** Several of these APIs surface rights only on the detail page. In our product the licence
  badge belongs on the card itself, because a `license_review` reference must be visually distinguishable from an
  `approved` one *before* the user invests in mixing it.
- **"Free to use" as a synonym for "public domain".** Pexels and Unsplash both market this way. Copying that language
  would put us in direct conflict with our own License Guard.
- **Silent result substitution.** When a strict licence filter empties the result set, these UIs quietly widen or show
  nothing. We must say *why* it is empty ("0 of 340 results are CC BY or freer") and offer the licence tier as the
  explicit lever — the same principle as the brief's rule that reference conflicts are surfaced, never auto-resolved.
- **Query-string API keys in a browser.** Europeana's `wskey` and Smithsonian's `api_key` are query params. Shipping
  them in a static page leaks them; this is a UX pattern (an app that "just works" with a baked-in key) we must not
  imitate. Prefer providers that work anonymously (Commons) or a user-supplied-key setting.

## Reusable patterns

1. **Per-provider licence mapping tables as data, not code.** Flickr's numeric ids, Commons' `LicenseShortName`,
   Openverse's lowercase codes and Europeana's `edm:rights` URIs all differ. `src/reference/license-guard.js` should own
   one normalisation function plus one declarative map per provider, so adding a provider never edits guard logic.
2. **Explicit obligation flags, generalised from Commons' `AttributionRequired`.** Store
   `obligations: { attribution, share_alike, hotlink_only, download_ping }` on every `Reference`, defaulting to
   fail-closed. Commons states attribution explicitly; Unsplash demands hotlinking and a download ping; CC BY-SA implies
   share-alike on derivatives.
3. **Asset-level, not record-level, licensing.** Smithsonian binds CC0 to `media.usage.access`; the Met binds it to
   `isPublicDomain` per object while the *dataset* is CC0. Bind our `license` to the exact media asset we display, and
   keep `metadata_license` as a separate field.
4. **Server-rendered derivatives instead of stored bytes.** Commons `iiurlwidth`, Openverse `/thumb/`, Pexels' named
   `src` ladder, IIIF's size segment. Our `thumbnail_url` should be a *derived* URL, satisfying the brief's
   no-binaries rule for free.
5. **Liveness filtering.** Openverse's `filter_dead` param exists because aggregated URLs rot. Our
   `SOURCE VALIDATION` step should HEAD-check before promoting a reference to `approved`, and demote on failure.
6. **A three-valued reusability ladder** (Europeana's `open / restricted / permission`) mapped onto our
   `approved / license_review / rejected`, so restricted content is *visible and explained* rather than invisibly
   filtered.
7. **Anonymous-CORS-first provider selection.** Commons (`origin=*`) and Openverse (`CORS_ALLOW_ALL_ORIGINS = True`)
   both work from a static page with no server. That means the brief's v0.2 milestone is achievable with zero backend —
   which in turn keeps the "Local-first" privacy promise intact.

## Hard technical facts

- Openverse anonymous throttle: `anon_burst = 5/hour`, `anon_sustained = 100/day`; OAuth2 client-credentials:
  `100/min` burst, `10000/day` sustained; "enhanced" tier: `200/min`, `20000/day`; an `exempt` tier is `None`.
  Source: `api/conf/settings/rest_framework.py`.
- Openverse sets `CORS_ALLOW_ALL_ORIGINS = True` and `CORS_EXPOSE_HEADERS = ["cf-cache-status", "cf-ray", "date"]`.
  Source: `api/conf/settings/security.py`.
- Openverse registration is `POST /v1/auth_tokens/register/` (`name`, `description`, `email`); token is
  `POST /v1/auth_tokens/token/` (`grant_type=client_credentials`, `client_id`, `client_secret`); usage is
  `Authorization: Bearer {TOKEN}`; quota introspection is `GET /v1/rate_limit/`.
- Openverse licence codes: `by, by-sa, by-nd, by-nc, by-nc-sa, by-nc-nd, cc0` plus PD marks `cc0, pdm` and deprecated
  `sampling+, nc-sampling+`. Groups: `all, all-cc, commercial` (excludes `nc`), `modification` (excludes `nd`).
  `commercial` still includes `by-nd`; `modification` still includes `by-nc` — neither matches our policy.
- Openverse media types are exactly `["audio", "image"]` (`api/api/constants/media_types.py`). **No video.**
  Its own UI says video is "provided through External Sources" (`frontend/i18n/data/en.json5`).
- Openverse image `category` values: `digitized_artwork`, `illustration`, `photograph`.
- Openverse response carries `foreign_landing_url` (upstream page) separately from `url` (the media file) and
  `thumbnail`; `license_url` and `attribution` are *computed* properties with documented fallbacks.
- MediaWiki `iiprop` accepts: `timestamp, user, userid, comment, parsedcomment, canonicaltitle, url, size, dimensions,
  sha1, mime, thumbmime, thumburls, mediatype, metadata, commonmetadata, extmetadata, archivename, bitdepth,
  uploadwarning, badfile`. Thumbnails via `iiurlwidth` / `iiurlheight` / `iiurlparam`.
- CommonsMetadata `extmetadata` keys include `LicenseShortName, UsageTerms, LicenseUrl, License, Artist, Credit,
  Attribution, AttributionRequired, NonFree, Copyrighted, Restrictions, DeletionReason, ImageDescription, ObjectName,
  Permission, DateTimeOriginal, DateTime, Categories, Assessments, GPSLatitude, GPSLongitude, GPSMapDatum`.
  `License` is machine-normalised from `LicenseShortName` with `source: 'commons-templates'`; `Categories` carries
  `source: 'commons-categories'`.
- MediaWiki Action API CORS: `origin=*` yields `Access-Control-Allow-Origin: *` and
  `Access-Control-Allow-Credentials: false` — anonymous cookie-less browser calls are supported
  (`includes/Api/ApiMain.php::handleCORS()`).
- Browsers cannot set `User-Agent`; MediaWiki reads **`Api-User-Agent`** instead when `MW_API` is defined
  (`includes/Request/WebRequest.php`).
- MediaWiki media types: `UNKNOWN, BITMAP, DRAWING, AUDIO, VIDEO, MULTIMEDIA, OFFICE, TEXT, EXECUTABLE, ARCHIVE, 3D`
  (`includes/libs/Mime/defines.php`). `MEDIATYPE_VIDEO = 'VIDEO'` — **Commons is our video source.**
- CirrusSearch registers the `filetype` keyword, pipe-separated, max 20 conditions, matched against the
  `file_media_type` field (`includes/Query/FileTypeFeature.php`).
- Openverse's Commons ingester uses `generator=allimages`, `gaisort=timestamp`, `gaidir=newer`, `gailimit=250`,
  `prop=imageinfo|globalusage`, `iiprop=url|user|dimensions|extmetadata|mediatype|mime|size|metadata`, and **discards
  VIDEO and OFFICE mediatypes** — one more reason to call Commons directly.
- Europeana: `reusability ∈ {open, restricted, permission}`; `type ∈ {TEXT, VIDEO, SOUND, IMAGE, 3D}`; item fields
  `id, title, edmPreview, edmIsShownAt, edmIsShownBy, dataProvider, provider, rights, type, guid, score`;
  params `query, profile, qf, rows, start, callback, reusability, facet, f.[facet].facet.limit/offset`.
- Smithsonian: base `https://api.si.edu/openaccess/api/v1.0/`, search `{base}search`, `api_key` from api.data.gov,
  `q` / `rows` / `start`; media at `content.descriptiveNonRepeating.online_media.media[]`;
  CC0 gate is `media.usage.access == "CC0"`; landing at `descriptiveNonRepeating.record_link` or `guid`.
- The Met: `https://collectionapi.metmuseum.org/public/collection/v1/objects`, detail `{endpoint}/{object_id}`,
  params `metadataDate`, `isPublicDomain`; fields `objectIDs, total, isPublicDomain, objectURL, primaryImage,
  additionalImages, artistDisplayName, title, creditLine, tags, …`. Images are **not** covered by the dataset's CC0.
- Flickr licence ids (live `flickr.photos.licenses.getInfo` response): 0 ARR, 1 BY-NC-SA 2.0, 2 BY-NC 2.0,
  3 BY-NC-ND 2.0, 4 BY 2.0, 5 BY-SA 2.0, 6 BY-ND 2.0, 7 No known copyright restrictions, 8 US Government Work,
  9 CC0, 10 Public Domain Mark, 11 BY 4.0, 12 BY-SA 4.0, 13 BY-ND 4.0, 14 BY-NC 4.0, 15 BY-NC-SA 4.0, 16 BY-NC-ND 4.0.
  Base call `https://api.flickr.com/services/rest/?api_key={api_key}&method=…`.
- Pexels: `Authorization: <key>` header; 200 requests/hour and 20,000/month; `X-Ratelimit-Limit`,
  `X-Ratelimit-Remaining`, `X-Ratelimit-Reset` headers; `per_page` max 80; has a real video API with
  `video_files[].link` / `quality` / `fps`; terms include "You may not copy or replicate core functionality of Pexels."
  (from a third-party mirror of the official docs).
- Unsplash: attribution, hotlinking, and a `/photos/{id}/download` ping are all required by the API Guidelines
  (stated in the official `unsplash-js` README).

## Open questions

1. **Exact Commons search parameters.** `generator=search` + `gsrnamespace=6` vs `list=search` + `srnamespace=6`,
   and how `Special:MediaSearch`'s ranking is (or is not) reachable via the API. Must be confirmed against
   `Commons:API/MediaWiki` before `src/providers/wikimedia.js` is written — the host was blocked here.
2. **`filetype:` alias spelling on Commons.** The aliases live in `CirrusConfigNames::FiletypeAliases` config, not in
   source. Needs a live query to confirm `filetype:video` returns `MEDIATYPE_VIDEO` files.
3. **Openverse anonymous CORS in practice.** `CORS_ALLOW_ALL_ORIGINS = True` is set, but Cloudflare sits in front;
   confirm preflight behaviour and whether the 100/day anon cap is per-IP or per-origin.
4. **Is there any CORS-enabled, key-free, CC-licensed *video* source besides Commons?** Europeana has `type=VIDEO` but
   its rights and CORS story is unverified; Pexels has video but is not CC. If Commons is the only one, v0.4's
   "similar video search" corpus is structurally narrow and we should plan for user-uploaded local video as the primary
   video path (which the brief's Privacy section already prefers).
5. **Does `api.si.edu` still serve traffic** now that `Smithsonian/OpenAccess` is archived (2026-05-21)?
6. **Is the NYPL Repo API actually dead** after the reported 2026-08-01 deprecation?
7. **Openverse `attribution` string format** — we read that it is a computed property but not its exact template.
   If it already produces a compliant CC BY credit line, our attribution builder should defer to it rather than
   re-derive one.
8. **Europeana `media=true` / `thumbnail=true`** — present in the current Python client, absent from `labs-preview`.
   Needs confirmation against the live docs.
9. **Rijksmuseum licence terms** — completely unverified. Do not add as a provider until a licence statement is read.
10. **Rate-limit strategy for a local-first app.** With Openverse anon at 100/day, do we require every user to register
    their own client credentials (a privacy-disclosure event under the brief) or default to Commons-only?

## Evidence log

Every URL below was actually fetched during this research.

- https://raw.githubusercontent.com/WordPress/openverse/main/LICENSE
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/licenses.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/media_types.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/constants/field_values.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/serializers/media_serializers.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/utils/throttle.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/views/media_views.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/api/examples/oauth2_requests.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/rest_framework.py
- https://raw.githubusercontent.com/WordPress/openverse/main/api/conf/settings/security.py
- https://raw.githubusercontent.com/WordPress/openverse/main/packages/js/api-client/tests/client.test.ts
- https://raw.githubusercontent.com/WordPress/openverse/main/frontend/i18n/data/en.json5
- https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/wikimedia_commons.py
- https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/metropolitan_museum.py
- https://raw.githubusercontent.com/WordPress/openverse/main/catalog/dags/providers/provider_api_scripts/smithsonian.py
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiMain.php
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Api/ApiQueryImageInfo.php
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Request/WebRequest.php
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/libs/Mime/defines.php
- https://raw.githubusercontent.com/wikimedia/mediawiki/master/includes/Defines.php (checked; contains no MEDIATYPE_* constants)
- https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/src/TemplateParser.php
- https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/src/DataCollector.php
- https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CommonsMetadata/master/COPYING
- https://raw.githubusercontent.com/wikimedia/mediawiki-extensions-CirrusSearch/master/includes/Query/FileTypeFeature.php
- https://github.com/Smithsonian/OpenAccess
- https://github.com/metmuseum/openaccess
- https://github.com/europeana/rd-europeana-python-api
- https://raw.githubusercontent.com/europeana/labs-preview/master/api/search.md
- https://github.com/unsplash/unsplash-js
- https://github.com/NYPL-publicdomain/data-and-utilities
- https://github.com/Flickr-Foundation/flickr-photos-api
- https://raw.githubusercontent.com/Flickr-Foundation/flickr-photos-api/main/src/flickr_api/api/license_methods.py
- https://raw.githubusercontent.com/Flickr-Foundation/flickr-photos-api/main/src/flickr_api/models/licenses.py
- https://raw.githubusercontent.com/Flickr-Foundation/flickr-photos-api/main/tests/fixtures/cassettes/TestLicenseMethods.test_get_licenses.yml
- https://raw.githubusercontent.com/developer-ishan/mcp-pexels/main/docs/official/pexels-api-docs.md (third-party mirror of Pexels' official docs)

Blocked by the egress proxy and therefore **not** used as primary evidence: `api.openverse.org`, `docs.openverse.org`,
`commons.wikimedia.org`, `www.mediawiki.org`, `api.wikimedia.org`, `pro.europeana.eu`, `www.si.edu`, `unsplash.com`,
`www.flickr.com`, `data.rijksmuseum.nl`, `digitalcollections.nypl.org`, `make.wordpress.org`, `api.jentic.com`.
Claims sourced only from search-result snippets of those hosts are marked (UNVERIFIED) inline above.
