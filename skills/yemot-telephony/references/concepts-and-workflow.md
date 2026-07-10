# Yemot IVR concepts and workflow

## Contents

- [Mental model](#mental-model)
- [Extensions and files](#extensions-and-files)
- [Module map](#module-map)
- [Identification and access](#identification-and-access)
- [Audio, TTS, and messages](#audio-tts-and-messages)
- [Design and rollout](#design-and-rollout)
- [Troubleshooting](#troubleshooting)

## Mental model

A Yemot system is a tree of extension folders. Each extension has one primary module type and may apply documented settings shared by many modules.

Model four layers explicitly:

1. **Call flow:** arrival, prompts, accepted input, outcomes, and fallbacks.
2. **Configuration:** module `type` and settings in the extension's `ext.ini`.
3. **Content/data:** audio, `Mxxxx` messages, TTS, lists, reports, and module-specific files.
4. **External effects:** API calls, campaigns, routing, queues, messages, payments, and SIP calls.

A folder tree alone is incomplete. Document access rules, data ownership, charges, failure behavior, reporting, and rollback.

## Extensions and files

Use `/` for the root in management API paths and slash-separated folders for nested extensions. Management API file paths often use `ivr2:`; verify the exact command before sending a path.

| File class | Role | Rule |
|---|---|---|
| `ext.ini` | primary module and shared settings | search every unfamiliar key |
| Module-specific INI/list | agents, personalized data, filters | verify exact filename, encoding, delimiter |
| Numbered audio | sequential content such as `000.wav` | preserve numbering and playback semantics |
| `Mxxxx` | replaceable system prompt | verify the ID in the message snapshot |
| `.tts` | text-to-speech content | verify module support, language, encoding, pronunciation |
| `.ymgr`, HTML, CSV | reports and operational data | use the module-specific schema |

Give each extension one responsibility. Prefer a small menu routing to recording, playback, queue, or API extensions over one tangled extension.

### Minimal menu

```ini
type=menu
```

The documented default menu prompt is `M1000`. Destination folders determine usable keys. Search `menu`, `M1000`, digit length, invalid input, and timeout behavior before adding options.

## Module map

Search the terms in the last column for full settings.

| Need | Module family | Search |
|---|---|---|
| Keypad/voice branching | menu | `type=menu`, `menu_voice` |
| Sequential/personal playback | playback | `playfile`, `last_play`, `id_list_message` |
| Record content | recording/voicemail | `type=record`, `voicemail_email` |
| Collect values and recordings | data collection | `recording_and_entering_data` |
| Live/simulated broadcast | conference/stream | `confbridge`, `music_on_hold`, `playdir_time` |
| Human response | queue/routing | `type=queue`, `type=routing`, `routing_time` |
| Identity and authorization | identification/filter | `enter_id`, `access_filter`, `template_filter` |
| Lists and outbound calls | campaigns/alerts | `template_add_number`, `RunCampaign`, `tzintuk` |
| Commerce | sales/payment | `sale_products`, `sale_seats`, `credit_card` |
| Tests and points | assessment | `points_save`, `examination`, `trivia_questions` |
| Live web application | API extension | `type=api`, `api_link` |
| PBX/softphone | SIP/IAX | `CreateSipAccount`, `type=sip`, `IAX` |

Search both the exact Latin identifier and the Hebrew feature name. Some titles use historical names or describe an add-on to another module.

## Identification and access

Do not conflate:

- **Caller number:** call metadata; it may be forwarded, hidden, or unsuitable as a durable ID.
- **Personal ID (`enter_id`):** identification that may attach names/fields to reports and is required by some modules.
- **Extension password:** shared access control, not personal identity.
- **List/filter authorization:** decision from a list, points, time, prior action, or API response.
- **Management authentication:** server-side API credential/session; never expose it to callers or browsers.

For private content, payment, attendance, or personal records, define replay/spoofing risk, failed attempts, logging, retention, and support access.

Search before implementation:

```powershell
python scripts/search_docs.py "הגדרות הזיהוי בכלל המערכת enter_id" --limit 8
python scripts/search_docs.py "הרשאות כניסה לשלוחה" --limit 8
python scripts/search_docs.py "access_filter" --limit 8
```

## Audio, TTS, and messages

Do not guess media format. Search the current file-format topic before conversion or bulk upload, and preserve originals until test calls pass.

The system-message topic is intentionally split into bounded Markdown parts. Search instead of loading it:

```powershell
python scripts/search_docs.py "M1000" --limit 5
python scripts/search_docs.py "הודעה הוקלטה בהצלחה" --limit 5
```

For TTS:

1. Confirm the target module accepts `.tts` at that position.
2. Keep encoding and language consistent.
3. Test Hebrew numbers, abbreviations, punctuation, and mixed English.
4. Prefer recorded audio when pronunciation or legal wording must be exact.

## Design and rollout

### Capture requirements

Record:

- entry numbers, server/environment, and expected concurrency;
- caller groups, languages, and accessibility needs;
- success, invalid-input, no-answer, timeout, and closed-hour paths;
- authentication, privacy, recording, and retention requirements;
- integrations and their timeout/idempotency behavior;
- unit budget and chargeable branches;
- reports, owners, support, and rollback.

### Draw the tree

```text
/          menu
/1         playfile — announcements
/2         record — leave a message
/3         queue — service representatives
/9         api — personalized self-service
/98        protected administration/test path
```

For every key, document the unavailable destination behavior. Avoid hidden dependencies on unrelated folders.

### Resolve exact settings

For each extension:

1. Search the primary `type`.
2. Inspect topic-author/staff material first.
3. Search each filter, time rule, report, response, or callback separately.
4. Confirm companion filenames and path forms.
5. Link the exact source post beside non-obvious behavior.

### Stage and test

| Case | Expected evidence |
|---|---|
| Valid caller/input | intended destination and correct report row |
| Invalid/no input | documented retry or fallback |
| Missing audio/data file | controlled route, no dead end |
| Integration timeout/error | safe prompt and fallback; no secret leakage |
| Caller hangs up | expected save/callback behavior |
| Closed hours/no agents | defined alternate branch |
| Duplicate request | no duplicate purchase, campaign, or write |

Back up affected files. Deploy the smallest unit, make test calls, inspect reports, and retain the previous files for rollback.

## Troubleshooting

Diagnose in this order:

1. **Reproduce:** called number, redacted caller, timestamp, path, expected and actual result.
2. **Tree:** prove the caller reached the intended extension.
3. **Configuration:** verify type, spelling, prefix, and location against the snapshot.
4. **Files:** verify name, case, extension, encoding, format, and existence.
5. **Shared rules:** inspect time, password, identification, list, and access filters that run first.
6. **External service:** inspect HTTPS status, latency, exact response, idempotency, and logs.
7. **Platform state:** verify units, feature enablement, server support, and current announcements.
8. **Rollback:** restore the last known-good files if impact continues.

Redact tokens, passwords, phone lists, recordings, and personal identifiers before sharing logs. Do not disable access control as an unbounded workaround.
