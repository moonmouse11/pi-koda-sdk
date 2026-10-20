# pi-koda-sdk

Pi extension for **Koda hosted / OpenAI-compatible chat APIs** — one agent (Pi), no Koda CLI ACP subprocess.

## Sources (merged)

1. `KODA_BASE_URL` + `KODA_API_KEY`
2. `~/.pi/agent/koda-sdk.json` — `{ "baseUrl": "https://…/v1" }`
3. Koda `config.yaml` / `auth.yaml` — compatible providers with `base_url`

## Install

```bash
pi install ./pi-koda-sdk
```

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
npm install && npm run check
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
