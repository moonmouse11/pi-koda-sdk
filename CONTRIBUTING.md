# Contributing

Thanks for helping improve pi-koda-sdk.

## Branching

- **`main`** — stable, release-ready. Direct pushes should be rare; prefer pull requests.
- **Topic branches** — all work happens off `main`:
  - `feature/<short-name>` — new behavior
  - `fix/<short-name>` — bug fixes
  - `chore/<short-name>` — CI, tooling, docs in repo root (not local-only notes)
  - `docs/<short-name>` — README / CONTRIBUTING only

Keep branches focused; one logical change per PR when possible.

## Workflow

1. Sync `main`: `git fetch origin && git checkout main && git pull origin main`
2. Create a branch: `git checkout -b feature/my-change`
3. Install and verify locally:
   ```bash
   npm install
   npm run check   # tsc + npm test
   ```
4. Commit with a clear message (what/why).
5. Push and open a **pull request** into `main` on GitHub.
6. Wait for **CI** (GitHub Actions) to pass before merge.

## Pull requests

- Describe what changed and how you tested it (`pi -e .`, `/koda doctor`, etc.).
- Link an issue if one exists.
- Avoid unrelated drive-by changes.

## Maintainer notes (GitHub settings)

Recommended for `main`:

- Require pull request before merging
- Require status check **typecheck** (CI workflow)
- Do not require signed commits unless the project adopts them later

Repository description on GitHub should match the SDK scope (OpenAI-compatible Pi providers, no Koda ACP agent loop).

## Release (maintainers)

1. Bump `version` in `package.json` and `PACKAGE_VERSION` in `src/constants.ts`; update `CHANGELOG.md` and README install pins.
2. `npm run check`
3. Merge to `main`, tag: `git tag v0.3.0 && git push origin v0.3.0`
4. Publish: `npm publish` (npm login required; package name must be available on npm)
5. Users install with `pi install npm:pi-koda-sdk@<version>`

## Local-only docs

The `docs/` directory is gitignored intentionally; planning notes stay on your machine and are not part of the published repository.
