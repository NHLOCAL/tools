# yemot-mcp

An MCP server that gives an AI assistant persistent, authenticated access to the
**Yemot Hamashiach / call2all** management API, plus a **live management
dashboard** for configuring systems, secrets, and two-step verification (MFA).

- **Standard MCP (stdio)** - runs in any MCP client: Claude Code, Claude Desktop,
  Cursor, Windsurf, Cline, Codex CLI, and others.
- **Two auth methods per system:** a permanent API key (MFA-exempt) *or* username +
  password with two-step verification.
- **Multiple systems**, each with a friendly name and optional links to projects.
- **Secrets stay yours.** You enter them in the local dashboard; they are written
  only to `~/.yemot/systems.json` on your machine and never pass through chat.
- Bundled Yemot documentation for offline lookup (`yemot_docs`).

Requires **Node.js 18+** (only for the CLI/manual install; the one-click Desktop
bundle ships its own Node).

> **New here?** Start with the step-by-step Hebrew guides:
> [guides/installation.md](guides/installation.md) (all install methods + setup)
> and [guides/tools.md](guides/tools.md) (what each tool does).

## Install

### A. Claude Code / Cursor / Codex / any MCP client (CLI)

```bash
npm install
claude mcp add yemot -- node /path/to/yemot-mcp/server/index.js
```

(For other clients, add the same `node .../server/index.js` command to their MCP
config.)

### B. Claude Desktop - one click

Package once, then double-click the file and press Install:

```bash
npm install --omit=dev
npx @anthropic-ai/mcpb pack      # produces yemot.mcpb
```

Claude Desktop ships its own Node runtime, so end users need nothing installed.

## First-time setup (the dashboard)

Open the dashboard - either run the server and it prints the URL, or:

```bash
npm run dashboard          # prints http://127.0.0.1:8787/
```

In the dashboard you:

1. **Add a system** - name, display label, system number, and either a permanent
   API key or a management password.
2. **Link it to a project** (optional) so it's the default when you work there.
3. For password systems, run **2FA** once (pick a method, get the code, enter it);
   remember-me keeps you logged in afterward.

### Creating a permanent API key (the MFA-exempt option)

Do this once in a browser: go to `https://www.call2all.co.il/firewall` (or the
admin site under אבטחה > ניהול מפתחות גישה), complete 2FA, create an access key,
optionally restrict it by IP/service/path, and paste it into the dashboard.

## Tools (what the assistant can do)

- `yemot_systems` - list systems and which are linked to the current project.
- `yemot_call(system?, command, params)` - any management command
  (`GetSession`, `UploadTextFile`, `RunCampaign`, `SendSms`, `GetIVR2Dir`, ...).
  Omit `system` to use the one linked to the current project.
- `yemot_upload` / `yemot_download` - file transfer.
- `yemot_mfa_status` / `yemot_mfa_send` / `yemot_mfa_verify` - the MFA flow, if you
  prefer doing it from chat instead of the dashboard.
- `yemot_docs(query)` - search the bundled Yemot documentation.
- `yemot_dashboard` - get the dashboard URL.

## Project linking

A system is the default for a directory when either the directory is in the
system's linked `projects`, or a `.yemot` file in the directory names the system.
When exactly one system is linked, `system` can be omitted from tool calls.

## Verify

```bash
npm test                   # offline: auth/token/MFA/project logic
```

Then, with a configured system, `yemot_call` with `GetSession` returns your
account details.

## Documentation

`yemot_docs` reads the skill's own `../references/*.md`. For a standalone bundle,
`npm run docs:sync` copies them into `mcp/docs/` so the packed `.mcpb` is
self-contained (see the build workflow).

## Notes

- Config and session cache live in `~/.yemot/` (override with `YEMOT_HOME`).
  `systems.json` holds your secrets in a `0600` file - keep it private.
- Session tokens expire after 30 minutes idle; the server re-logs in automatically.
- The dashboard binds to `127.0.0.1` only.
- File uploads are read fully into memory (fine for audio).

## License

Part of the `yemot-telephony` skill; licensed under this repository's license.
