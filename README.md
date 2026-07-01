# demo-tts

Shared **static UI** for GPU TTS engines (TADA, dots.TTS, …). Engine backends stay in their own repos; this repo is only HTML/JS/CSS plus per-engine `config.json`.

## API contract (v1)

The demo expects these endpoints on the **same origin** (or set `apiBase` in config):

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/presets` | Voices, dialogue/book examples, default options |
| GET | `/api/samples/{voice_id}` | Reference WAV preview |
| POST | `/api/tts` | Single line |
| POST | `/api/dialogue` | Multi-line scene + merged audio |
| POST | `/api/book` | Book paragraphs + merged audio |
| GET | `/health` | Liveness |
| GET | `/api/ops/*` | Ops log page (optional) |

Details: [docs/api-contract.md](docs/api-contract.md)

## Per-engine branding

Templates in `config/` — mounted or **served by the engine** as `GET /demo/config.json`:

- `config/tada.json` — HumeAI TADA (`deploy/demo-config/tada.json` in easably/tada)
- `config/dots.json` — dots.TTS

Schema: [config/schema.json](config/schema.json)

## How engines consume this repo

### 1. Git submodule (version pin per engine)

```bash
git submodule add https://github.com/easably/demo-tts.git vendor/demo-tts
```

Docker / compose bind-mount:

```yaml
volumes:
  - ./vendor/demo-tts:/app/demo:ro
environment:
  - TADA_DEMO_CONFIG=/app/deploy/demo-config/tada.json
```

Engine serves branding: `GET /demo/config.json` (see easably/tada `main.py`).

### 2. Shared server path (fastest — one UI for all engines)

**demo-tts CI** syncs this repo to `~/deploy/shared/demo-tts` on the GPU host.

Each engine compose file:

```yaml
environment:
  - DEMO_ROOT=/home/user/deploy/shared/demo-tts
volumes:
  - ${DEMO_ROOT}:/app/demo:ro
  - ./demo-config.json:/app/demo/config.json:ro
```

Push to **demo-tts `main`** → all engines on that server get the new UI in ~1 minute (no GPU image rebuild).

### 3. Release tarball (optional)

Tag `v0.1.0` → download zip from GitHub Releases → extract to `~/deploy/shared/demo-tts`.

## Local preview

Static files need an API backend. With TADA running on port 7860:

```bash
# Terminal 1 — TADA API (from easably/tada)
./run_local.sh

# Terminal 2 — serve demo + proxy API (or mount demo in TADA)
cp config/tada.json config.json
npx --yes serve -l 3000 .
# Then use TADA with TADA_DEMO_DIR pointing here, or open via TADA's /demo mount
```

Recommended: run through the engine container/process so `/api/*` and `/demo/*` share one origin.

## Version

See [VERSION](VERSION). Engines may pin a submodule commit or rely on shared-path deploy from `main`.
