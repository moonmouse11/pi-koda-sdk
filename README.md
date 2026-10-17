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

In Pi: `/koda doctor`, `/koda models refresh`

## Development

```bash
npm install && npm run check
pi -e . --model koda/default
```

## Non-goals

- Koda ACP / `koda --acp` (removed — duplicates Pi’s agent loop)
- Koda IDE plugins (use those inside JetBrains/VS Code separately)
