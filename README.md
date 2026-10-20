# pi-koda-sdk

Pi extension for **Koda hosted / OpenAI-compatible chat APIs** — one agent (Pi), no Koda CLI ACP subprocess.

## Sources (merged)

1. `KODA_BASE_URL` + `KODA_API_KEY`
2. `~/.pi/agent/koda-sdk.json` — `{ "baseUrl": "https://…/v1" }`
3. Koda `config.yaml` / `auth.yaml` — compatible providers with `base_url`

## Install

**npm** (recommended after publish):

```bash
pi install npm:pi-koda-sdk@0.3.0
```

**git** (pinned tag):

```bash
pi install git:github.com/moonmouse11/pi-koda-sdk@v0.3.0
```

**local path** (development):

```bash
git clone https://github.com/moonmouse11/pi-koda-sdk.git
pi install ./pi-koda-sdk
# or one-shot: pi -e ./pi-koda-sdk
```

No Koda CLI required if you set `KODA_BASE_URL` and `KODA_API_KEY`. Koda `config.yaml` / `auth.yaml` are optional import.

## Use

```bash
export KODA_BASE_URL=https://your-koda-api.example/v1
export KODA_API_KEY=sk-…
pi --model koda/default
pi --list-models koda
```

In Pi: `/koda doctor`, `/koda doctor-verbose`, `/koda sources`, `/koda reload`, `/koda models refresh`

## Development

```bash
npm install && npm run check   # typecheck + unit tests
pi -e . --model koda/default
```

Contributing (branches, PRs, CI): see [CONTRIBUTING.md](./CONTRIBUTING.md).

## From Koda CLI — take vs skip

Koda CLI (`@koda-code/cli`) is a full product: TUI, tasks, local services, IDE hooks. **pi-koda-sdk only reuses data Koda already stores on disk**, not its UX or agent runtime.

| Take (already or next) | Skip |
|--------|------|
| `config.yaml` / `auth.yaml` paths and OpenAI-compatible `providers[].base_url` | Koda TUI, themes, splash, “beauty” |
| Model IDs / aliases needed to register Pi providers | Koda session server, task UI, checkpoints inside Koda |
| Optional: `GET /v1/models` discovery per endpoint | `koda --acp`, subprocess agent loop |
| `/koda doctor`, env + `koda-sdk.json` overrides | JetBrains / VS Code Koda plugins |
| Same API keys Koda uses (read from auth yaml) | Koda-specific tools, hooks, memory, subagents |

Pi stays the only agent; Koda is a **provider config + HTTP chat API** source.

## Non-goals

- Koda ACP / `koda --acp` (removed — duplicates Pi’s agent loop)
- Koda IDE plugins (use those inside JetBrains/VS Code separately)
- Parity with Koda CLI features beyond OpenAI-compatible chat endpoints
