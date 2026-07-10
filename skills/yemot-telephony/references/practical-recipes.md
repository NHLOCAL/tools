# Practical Yemot recipes

## Contents

- [Rules](#rules)
- [Basic information line](#basic-information-line)
- [Recording and human service](#recording-and-human-service)
- [Personalized web-backed call](#personalized-web-backed-call)
- [Management API client](#management-api-client)
- [Campaign rollout](#campaign-rollout)
- [Browser SIP](#browser-sip)
- [Migration](#migration)

## Rules

These recipes show architecture, not a substitute for exact parameter lookup.

1. Search the module type and every optional key.
2. Open the current live source.
3. Use placeholders in examples and protected secrets in deployment.
4. Test from a non-production extension/system.
5. Verify charges, limits, and server support.

## Basic information line

Goal: menu key 1 plays sequential information.

```text
/       menu
/1      playfile
```

Root `ext.ini`:

```ini
type=menu
```

`/1/ext.ini`:

```ini
type=playfile
```

Upload `M1000` in the root and numbered content files in `/1`. Search `menu M1000`, `playfile`, file format, playback order, and end-of-folder behavior.

Test valid/invalid/no key, empty content folder, first/middle/last file, repeat, exit, and fallback.

## Recording and human service

Goal: key 1 records a message; key 2 enters a queue.

```text
/       menu
/1      record or voicemail_email
/2      queue
```

Minimal declarations:

```ini
; /ext.ini
type=menu
```

```ini
; /1/ext.ini
type=record
```

```ini
; /2/ext.ini
type=queue
```

Do not guess queue companion files. Search current `type=queue` documentation for `queue.ini`, agent format, retry strategy, caller ID, music, after-hours, and no-answer routes.

For recordings, decide confirmation-before-save, hang-up behavior, listener authorization, retention, and whether email/Telegram delivery is permitted.

## Personalized web-backed call

Goal: collect an order/reference number and return personalized status.

```ini
type=api
api_link=https://example.com/yemot/order-status
```

Retrieve the positional input syntax before adding `api_000`:

```powershell
python scripts/search_docs.py "api_000 הקשה" --limit 8
```

State machine:

```text
initial request
  -> validate call metadata
  -> return documented input action
answer request
  -> validate digits and call state
  -> authorize tenant + reference
  -> return documented playback/data action
  -> route to menu or service queue
```

Controls:

- Use a request signature/endpoint secret, never a management token.
- Bind expiring state to a documented call ID.
- Allow only expected digits and fields.
- Prevent enumeration of other customers' records.
- Use a privacy-safe response for unauthorized/not-found where appropriate.
- Bound upstream latency and configure a fallback.
- Log redacted correlation IDs, not spoken personal data.
- Make writes idempotent.

Test valid, invalid, expired, unauthorized, duplicate, timeout, hang-up, and upstream-error paths.

## Management API client

Example adapter shape:

```python
from dataclasses import dataclass
import requests


@dataclass
class YemotClient:
    token: str
    base_url: str = "https://www.call2all.co.il/ym/api"
    timeout_seconds: float = 15.0

    def command(self, name: str, parameters: dict | None = None) -> dict:
        response = requests.post(
            f"{self.base_url}/{name}",
            json={"token": self.token, **(parameters or {})},
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        data = response.json()
        if data.get("responseStatus") != "OK":
            raise RuntimeError(f"Yemot {name} failed: {data.get('responseStatus')}")
        return data
```

This is a pattern, not proof that every command accepts JSON POST or has the same body. Search the exact command, handle file upload/download separately, use typed errors, and redact tokens.

Test `OK`, each documented failure status, HTTP error, non-JSON response, timeout, and command-specific retry policy.

## Campaign rollout

1. Confirm authorization and applicable messaging rules.
2. Create/select a test template.
3. Upload only allow-listed test recipients.
4. Verify audio and approved caller ID.
5. Launch a test campaign.
6. Poll with its returned ID and inspect the report.
7. Estimate units/cost and apply a send limit.
8. Expand in batches with stop criteria.

```powershell
python scripts/search_docs.py "CreateTemplate UploadPhoneList" --limit 8
python scripts/search_docs.py "RunCampaign GetCampaignStatus" --limit 8
python scripts/search_docs.py "DownloadCampaignReport CampaignAction" --limit 8
```

Make launch idempotent. A network timeout after submission does not prove the campaign was not created.

## Browser SIP

1. Verify SIP support on the system server.
2. Create a dedicated account; do not reuse administrator credentials.
3. Select documented WSS transport.
4. Configure the client with current username/password and WSS URL.
5. Request microphone permission after user action.
6. Test registration, inbound/outbound, DTMF, hang-up, reconnect, and device changes.
7. Correlate calls with documented headers when necessary.
8. Rotate/delete the account after exposure or disuse.

Review whether browser users can extract the SIP password, whether destinations are constrained, whether caller ID is approved, and whether call attempts are rate-limited. Prefer brokered/limited authorization for public apps where supported.

## Migration

- Back up the whole extension tree, configuration, and content.
- Inventory module types, message overrides, and companion files.
- Follow replacement links from old documentation.
- Map paths before moving folders.
- Find reports/integrations depending on paths or filenames.
- Preserve message IDs and numbered-content semantics.
- Clone into a test system/protected branch.
- Run a call-path matrix with representative caller IDs.
- Compare reports before and after.
- Schedule a reversible cutover and retain the old tree.

First reproduce existing behavior. Simplify later in separate tested changes.
