# Yemot Telephony Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Checked items are complete; unchecked items remain pending.

**Goal:** Build, validate and publish-ready package a comprehensive Yemot Hamashiach telephony skill while keeping the website integration to one concise catalog card.

**Architecture:** A lean `SKILL.md` routes agents to curated references or readable generated Markdown topics. Refresh, search, validation and packaging scripts make the large external documentation set maintainable without loading it all into context.

**Tech Stack:** Markdown, YAML, Python 3 standard library, PowerShell 7, existing Python/markdown2 site builder, GitHub Actions.

## Current Implementation Status (2026-07-10)

- The complete readable snapshot is implemented and validated: 157 topics, 607 selected posts and 158 Markdown documents.
- `source-manifest.json` is intentionally retained as machine-readable provenance and coverage data. The refresher generates it, the validator requires it, and the release workflow validates it.
- The public display name is `ימות המשיח — מערכות טלפוניות`; the stable technical slug remains `yemot-telephony`.
- The website remains a compact catalog. Its `סקילים` section appears first and exposes only ZIP download and source actions.
- The initial release target is `yemot-telephony-v0.1.0`, reflecting an early-development SemVer release.
- Repository publication status is authoritative in GitHub history; the final unchecked items below intentionally preserve the pre-publication gate recorded by this plan.

## Global Constraints

- Put the skill at `skills/yemot-telephony/`.
- Keep detailed documentation inside the skill, not on the website.
- Use only official Yemot-hosted sources as authoritative documentation; label community replies.
- Do not store live credentials or personal data.
- Perform repository integration and release actions only after validation.

---

### Task 1: Build the documentation corpus pipeline

**Files:**
- Create: `skills/yemot-telephony/scripts/refresh_docs.py`
- Create: `skills/yemot-telephony/scripts/search_docs.py`
- Create: `skills/yemot-telephony/scripts/validate_snapshot.py`
- Create: `skills/yemot-telephony/tests/test_scripts.py`

**Interfaces:**
- `refresh_docs.py --output-dir PATH` produces `snapshot/*.md`, `source-manifest.json` and `source-index.md`.
- `search_docs.py QUERY --snapshot-dir PATH --limit N` prints ranked source-backed Markdown matches with file and source URLs.
- `validate_snapshot.py --references-dir PATH` exits nonzero for invalid or incomplete snapshots.

- [x] Write tests for normalization, post-link resolution, ranking, redaction-safe output and schema validation.
- [x] Run `python -m unittest skills/yemot-telephony/tests/test_scripts.py -v` and confirm the missing modules fail.
- [x] Implement the three standard-library scripts with retry, pagination, deterministic Markdown rendering, bounded file sizes, atomic output and Netfree-aware errors.
- [x] Re-run the unit tests and confirm they pass.

### Task 2: Generate and audit the complete snapshot

**Files:**
- Create: `skills/yemot-telephony/references/snapshot/*.md`
- Create: `skills/yemot-telephony/references/source-manifest.json`
- Create: `skills/yemot-telephony/references/source-index.md`

**Interfaces:**
- Every topic document contains stable topic metadata and post sections with author/authority labels, timestamps, source URLs and complete normalized content. Files above the configured limit are split at Markdown boundaries.

- [x] Run the refresher against the official forum index, API topic and API forum.
- [x] Retry or explicitly record unresolved and inaccessible source links.
- [x] Validate minimum topic/post coverage, unique record IDs, non-empty content and HTTPS source URLs.
- [x] Search representative terms: `type=api`, `recording_and_entering_data`, `CreateSipAccount`, `X-Yemot-CallID`, `queue_api_send` and `M1000`.

### Task 3: Author the skill and curated guidance

**Files:**
- Create: `skills/yemot-telephony/SKILL.md`
- Create: `skills/yemot-telephony/agents/openai.yaml`
- Create: `skills/yemot-telephony/references/concepts-and-workflow.md`
- Create: `skills/yemot-telephony/references/api-and-integrations.md`
- Create: `skills/yemot-telephony/references/practical-recipes.md`

**Interfaces:**
- `SKILL.md` tells agents exactly which reference or search command to use for each task class.
- Curated files contain stable mental models, security practices, implementation sequences and concise tested examples; parameter exhaustiveness remains in the corpus.

- [x] Initialize the skill with the official `init_skill.py` and generated UI strings.
- [x] Replace scaffold placeholders with concise imperative instructions and source hierarchy rules.
- [x] Add practical examples for a basic menu, API extension, management API call and SIP/WebRTC setup without real credentials.
- [x] Run `quick_validate.py` and scan for placeholders, duplicated guidance and unsafe example secrets.

### Task 4: Add minimal catalog and release packaging

**Files:**
- Modify: `README.md`
- Modify: `build.py`
- Modify: `index.html` (generated)
- Create: `scripts/package-yemot-telephony.ps1`
- Create: `.github/workflows/release-yemot-telephony.yml`
- Create: `tests/test_build.py`

**Interfaces:**
- A README section containing `סקיל` is rendered as a skill card with latest-release download and source actions.
- `scripts/package-yemot-telephony.ps1 -OutputPath PATH` creates `yemot-telephony.zip` with a top-level skill folder.

- [x] Write a build test proving the card exposes exactly download and source actions.
- [x] Extend the builder with a dedicated `skill` type and run the test to green.
- [x] Add the concise README entry and regenerate `index.html` with `python build.py`.
- [x] Add deterministic packaging and tag/manual GitHub Actions workflow.
- [x] Build the archive locally and inspect its file list.

### Task 5: Final verification and repository integration

**Files:**
- Verify all files changed by Tasks 1-4.

**Interfaces:**
- The full verification command set is reproducible from a clean checkout.

- [x] Run all Python unit tests, corpus validation, skill validation and the site build.
- [x] Confirm `git diff --check` and scan the final diff for secrets and unrelated changes.
- [x] Confirm the website contains no detailed Yemot documentation.
- [ ] Commit the complete focused change only after every check passes.
- [ ] Push the feature branch and create a release/tag only if the release asset workflow and repository state are ready.
