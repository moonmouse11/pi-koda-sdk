# Changelog

All notable changes to this project are documented here.

## [0.3.0] - 2026-10-20

### Added

- OpenAI-compatible Pi providers from env, `~/.pi/agent/koda-sdk.json`, and Koda `config.yaml` / `auth.yaml`
- Auto model discovery on startup (`GET …/models`) with timeout; `/koda models refresh` and `/koda reload`
- `/koda doctor`, `/koda doctor-verbose`, `/koda sources`, `/koda base-url`
- Koda `model_overrides` and fallback `models-cache.json` (XDG data dir)
- Routing hints from `model.primary`, `utility_model`, `workflow.review_model.primary`
- Unit tests; CI runs `npm run check`
- Install via npm: `pi install npm:pi-koda-sdk`

### Changed

- Config paths (`koda-paths`, `koda-sdk.json`) resolved at read time using `HOME` / XDG

## [0.2.0] - 2026-10-17

- Initial public SDK extension (no Koda ACP subprocess)
