# Yemot Telephony Skill Design

## Goal

Add a repository-hosted Codex skill that gives agents practical, source-backed knowledge for building and operating Yemot Hamashiach telephone systems and telephone integrations. Keep the NH Local website a lightweight project catalog with a short download entry only.

## Scope

The skill covers:

- IVR system structure, extensions, paths, files, messages, identification and shared settings.
- Content, recording, playback, live broadcast, routing, queues, campaigns, data collection, sales, payments, messaging and administration modules.
- The interactive `api` extension protocol used to connect a phone call to an external web application.
- The management API at `https://www.call2all.co.il/ym/api/`, including authentication, files, campaigns, calls, tasks and SIP account management.
- SIP, UDP, secure WebSocket and WebRTC integration details documented by Yemot.
- Troubleshooting, security, validation and production rollout practices.

The source snapshot is based on the official Yemot website and the two Yemot-hosted documentation forums. Community replies remain searchable but are labelled separately from source posts and administrator-authored material.

## Architecture

Create `skills/yemot-telephony/` with a concise routing-oriented `SKILL.md`, UI metadata, focused curated references, a readable Markdown documentation snapshot, and deterministic maintenance/search scripts.

Store the full snapshot as one generated Markdown document per source topic under `references/snapshot/`. Preserve direct topic/post URLs, topic/post identifiers, author/authority labels, timestamps and normalized technical content. Split exceptional files at Markdown boundaries so no reference file becomes costly to inspect. Do not duplicate the original rendered HTML. Agents may use ordinary `rg` or `scripts/search_docs.py`, and humans can review changes directly in Git.

`scripts/refresh_docs.py` rebuilds the snapshot from the official NodeBB APIs, follows the central documentation index, includes the management API and SIP topics, paginates long topics, retries transient failures and writes a coverage manifest. Generate deterministic topic files whose contents do not change merely because a refresh was run. A validator checks structure, uniqueness, HTTPS source URLs, file-size limits and minimum coverage.

## Website Integration

Add a single `סקילים` section to `README.md`. Extend `build.py` with a skill item type whose actions are only:

- Download the latest `yemot-telephony.zip` release asset.
- Open the skill source folder on GitHub.

No Yemot documentation, search interface or dedicated documentation page is added to the website.

## Release Packaging

Add a deterministic PowerShell packaging script and a GitHub Actions workflow triggered by a `yemot-telephony-v*` tag or manual dispatch. The archive contains only the skill directory under a top-level `yemot-telephony/` folder and excludes caches. Publishing an actual GitHub Release is deferred until all local validation succeeds.

## Safety and Freshness

- Never embed real system numbers, passwords, API tokens, caller IDs or customer data in examples.
- Prefer POST for credentials and sensitive parameters; redact secrets from logs and URLs.
- Treat billing, caller-ID authorization, SIP availability, limits and prices as volatile and verify them against linked sources before production use.
- Preserve the retrieval timestamp and direct source URL for every corpus record.
- Report HTTP 418 or certificate failures as possible Netfree filtering and keep the previous valid snapshot intact on refresh failure.

## Implemented Decisions (2026-07-10)

- Keep `source-manifest.json`: it is operational metadata used by refresh, validation and release automation, not a duplicate documentation payload.
- Keep these Superpowers planning documents in the repository for future maintenance history; exclude them from the distributable skill ZIP.
- Use `ימות המשיח - מערכות טלפוניות` as the human-facing name and retain `yemot-telephony` for stable machine paths, release assets and tags.
- Place the concise `סקילים` catalog section before other project categories.
- Start at `v0.1.0` because the skill is in initial development. Publish it as the latest normal GitHub Release so the website's stable `releases/latest/download/yemot-telephony.zip` link remains valid.

## Verification

- Validate skill metadata with the official `quick_validate.py`.
- Run corpus schema and coverage validation.
- Exercise search against representative IVR, API-module, management-API and SIP queries.
- Rebuild `index.html` and confirm the catalog contains only the concise skill card.
- Build the ZIP twice and compare its file list and checksums where timestamps permit.
- Check links and inspect the final Git diff before any commit, push or release.
