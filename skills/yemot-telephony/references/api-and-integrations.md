# Yemot APIs, call integration, and SIP

## Contents

- [Choose the interface](#choose-the-interface)
- [Interactive API extension](#interactive-api-extension)
- [Management API](#management-api)
- [SIP, WSS, and WebRTC](#sip-wss-and-webrtc)
- [Security and reliability](#security-and-reliability)
- [Troubleshooting](#troubleshooting)

## Choose the interface

| Interface | Direction | Purpose | Credential context |
|---|---|---|---|
| Interactive `type=api` | Yemot calls the developer endpoint during a call | collect input and control the caller | endpoint validation/signature |
| Management API | developer server calls Yemot | manage files, campaigns, calls, tasks, systems, accounts | management token/session, server-side only |
| SIP/WSS | SIP client/PBX registers and exchanges calls | endpoints, softphones, PBX, WebRTC | SIP account credentials |

Never return management credentials as an interactive API response. Never put management or SIP credentials in browser JavaScript, a repository, a query log, or a phone prompt.

## Interactive API extension

Minimal extension:

```ini
type=api
api_link=https://example.com/yemot/ivr
```

Yemot calls the endpoint with documented call metadata. Search the exact current defaults before depending on a parameter:

```powershell
python scripts/search_docs.py "api_call_id_send api_phone_send api_did_send" --limit 8
python scripts/search_docs.py "api_extension_send api_enter_id_send ApiTime" --limit 8
```

Use continuous `api_add_0`, `api_add_1`, and later indices only for documented static parameters. Prefer a signature or server-side allow-list over a long-lived secret embedded in extension configuration.

### Collecting input

The module can define numbered questions such as `api_000`, with corresponding prompt files. Its comma-delimited syntax is position-sensitive:

```powershell
python scripts/search_docs.py "api_000 הקשה הקלטה" --limit 8
```

Do not infer an omitted field's position/default. Verify digit length, terminator, timeout, retries, character set, and recording behavior by phone.

### Returning actions

Yemot responses can request more input, play data, move folders, route calls, or perform other documented actions. Syntax and delimiters are strict.

Before generating a response:

1. Search the exact action: `read`, `id_list_message`, `go_to_folder`, `routing`, `routing_yemot`, `noop`, or another documented command.
2. Open the matching Markdown lines and live source.
3. Return the required content type and body with no BOM, debug text, HTML wrapper, or stack trace.
4. Test Hebrew, URL encoding, delimiters, empty values, and maximum expected length.
5. Configure a caller-friendly fallback for timeout or invalid output.

`api_answer_<value>` can map a simple returned value to a configured action. Use it for small finite decisions rather than generating complex output unnecessarily.

### Endpoint architecture

```text
receive
  -> validate source/signature and required identifiers
  -> load/create call state idempotently
  -> validate current step and input
  -> persist result
  -> return one documented Yemot action
```

Use a documented call identifier for correlation/idempotency, not only caller number. Bound database/upstream latency.

Search `api_hangup_send`, `api_hangup_link`, and `ApiHangupExtension` before hang-up callbacks. Treat callbacks as at-least-once and idempotent.

## Management API

Documented base:

```text
https://www.call2all.co.il/ym/api/<Command>
```

Most commands return JSON with `yemotAPIVersion` and `responseStatus`. Documented statuses include `OK`, `ERROR`, `FORBIDDEN`, and `EXCEPTION`. Handle command-specific fields and HTTP/network failures.

Prefer server-side POST with JSON where the exact command supports it:

```http
POST /ym/api/GetSession HTTP/1.1
Host: www.call2all.co.il
Content-Type: application/json

{"token":"<SYSTEM>:<PASSWORD>"}
```

Use placeholders only. GET URLs leak through histories, proxies, access logs, and error reports.

### Command families

| Family | Representative commands |
|---|---|
| Authentication/system | `Login`, `Logout`, `GetSession`, `SetPassword`, `GetCustomerData` |
| Files/extensions | `UploadFile`, `DownloadFile`, `GetIVR2Dir`, `GetIVR2DirStats`, `GetFile`, `FileAction`, `UpdateExtension` |
| Text files | `GetTextFile`, `UploadTextFile` |
| Campaigns | `GetTemplates`, `UpdateTemplate`, `CreateTemplate`, `UploadPhoneList`, `RunCampaign`, `GetCampaignStatus` |
| Live calls | `GetIncomingCalls`, `CallAction`, `CreateBridgeCall`, `GetQueueRealTime` |
| Messaging/fax | `SendSms`, `SendFax`, `RunTzintuk` |
| Tasks | `GetTasks`, `GetTasksData`, `CreateTask` |
| SIP accounts | `CreateSipAccount`, `GetSipAccountsInCustomer`, `SipToWss`, `SipToUdp`, `DeleteSipAccount` |

Search the exact command, preferring `api-forum` results:

```powershell
python scripts/search_docs.py "UploadFile multipart/form-data" --limit 8
python scripts/search_docs.py "RunCampaign GetCampaignStatus" --limit 8
python scripts/search_docs.py "FileAction move copy delete" --limit 8
```

### Client rules

- Keep tokens in a server-side secret store.
- Set connect and total timeouts.
- Check HTTP outcome and `responseStatus`; downloads are a response-shape exception.
- Retry read-only calls with bounded backoff.
- Retry mutations only when documented safe or protected by application idempotency.
- Stream file transfers and verify current size limits.
- Redact tokens and personal phone data from telemetry.
- Log command name, sanitized system ID, correlation ID, duration, and platform status.

### Paths

Examples often use `ivr2:/1/1/000.wav`. Requirements differ by command. Confirm prefix, leading slash, case, and extension. Restrict user-controlled paths to an allowed folder and filename pattern.

## SIP, WSS, and WebRTC

SIP exists only on supporting Yemot servers. Verify enablement first.

Documented workflow:

1. Create a dedicated account with `CreateSipAccount`, optionally choosing a supported internal extension.
2. Store the returned username/password as secrets.
3. Inspect accounts with `GetSipAccountsInCustomer`.
4. Select UDP or secure WebSocket with the documented command.
5. Register the client and test inbound, outbound, internal, DTMF, hang-up, and failure flows.
6. Rotate/delete exposed or unused accounts.

The captured SIP source documents this secure WebSocket endpoint:

```text
wss://sip.yemot.co.il:8089/ws
```

Verify it live before production. Do not downgrade to insecure browser WebSocket.

For WebRTC, combine WSS registration with microphone permission, audio-device handling, and a user gesture. Shipping long-lived SIP credentials to arbitrary browsers is high risk; broker or constrain access where supported.

Captured inbound headers:

- `X-Yemot-Path`: originating extension path.
- `X-Yemot-CallID`: call identifier for correlation.

Captured outgoing caller-ID request header:

- `X-YemotCallerId`: per-call caller-ID request, subject to approval.

Verify current names, authorization, and billing:

```powershell
python scripts/search_docs.py "CreateSipAccount SipToWss" --limit 8
python scripts/search_docs.py "X-Yemot-Path X-Yemot-CallID" --limit 8
python scripts/search_docs.py "X-YemotCallerId" --limit 8
```

## Security and reliability

- Use HTTPS/WSS across untrusted networks.
- Rotate secrets; never log or publish them.
- Allow-list digits, paths, filenames, caller IDs, and response actions.
- Add idempotency to purchases, campaigns, writes, hang-up callbacks, and call actions.
- Set timeouts and a safe phone fallback.
- Rate-limit public endpoints.
- Separate test and production systems/credentials.
- Minimize retention of recordings, caller numbers, IDs, and payment data.
- Require explicit confirmation before chargeable or high-volume actions.

## Troubleshooting

**Interactive API:** check TLS, reachability, latency, exact parameters, URL encoding, plain response, whitespace/BOM, fallback, and server logs.

**Management API:** capture sanitized HTTP status/body, command, `responseStatus`, and `yemotAPIVersion`. Separate authentication, forbidden action, unsupported server, invalid parameter/path, and transient exception.

**SIP/WebRTC:** capture registration state, transport, TLS/WSS error, SIP response code, dialed format, account mapping, ICE/audio-device state, and caller-ID approval. Registration success with one-way/no audio is usually a media path issue, not authentication.

When observed behavior conflicts with documentation, record source URL, test timestamp, and server, then use Yemot support/official forums rather than inventing a workaround.
