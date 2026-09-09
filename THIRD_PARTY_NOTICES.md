# Third-Party Notices

**한국어 요약:** 이 프로젝트의 코드는 MIT 라이선스이며, 현재 런타임 의존성이 없습니다.
외부 프로젝트에서 코드를 복사한 부분도 없습니다. 참조 미디어(이미지/영상)는 코드와 별개의
라이선스를 가지며, 각 항목의 라이선스 메타데이터로 관리됩니다.

## Runtime dependencies

**None.** The MVP is written as vanilla ES modules with no build step and no
runtime package dependencies. This file exists so that the obligation is
recorded before the first dependency is ever added.

## Policy for adding a dependency

A new runtime dependency may be added only if all of the following hold:

1. It is licensed under a permissive licence (MIT, BSD-2/3-Clause, ISC, Apache-2.0,
   or equivalent). Copyleft (GPL/AGPL/LGPL) and source-available/non-compete
   licences are rejected for runtime code.
2. Its transitive dependency tree has been checked for the same constraint.
3. Its licence text is reproduced in this file under a `## <package>` heading.
4. The addition is recorded in [`docs/THIRD_PARTY_REVIEW.md`](docs/THIRD_PARTY_REVIEW.md).

## Code provenance

No source code has been copied from any third-party repository. Projects surveyed
during design are catalogued — with their licences and with an explicit record of
what was and was not taken — in [`docs/COMPETITIVE_ANALYSIS.md`](docs/COMPETITIVE_ANALYSIS.md)
and [`docs/THIRD_PARTY_REVIEW.md`](docs/THIRD_PARTY_REVIEW.md).

## Reference media

Reference images and videos are **not** covered by this project's MIT licence.
Each reference carries its own licence metadata (`license`, `license_url`,
`creator`, `attribution`, `source_url`) and is subject to
[`docs/LICENSE_POLICY.md`](docs/LICENSE_POLICY.md). No media binaries are stored
in this repository.

## Model weights

Model weights are licensed separately from this project's code. Any model shipped
as a default must have its weights licence reviewed and recorded here first.
