# Integration checklist (engine repos)

1. Add submodule: `vendor/demo-tts` → this repo.
2. Copy `config/<engine>.json` to `deploy/demo-config/<engine>.json`.
3. Compose mounts:
   ```yaml
   - ${DEMO_ROOT:-./vendor/demo-tts}:/app/demo:ro
   - ./demo-config.json:/app/demo/config.json:ro
   ```
4. FastAPI (or equivalent): serve `/` and `/demo` from `TADA_DEMO_DIR` / `DEMO_DIR`.
5. CI: on `vendor/demo-tts` or `deploy/demo-config/**` change → sync to server (no GPU rebuild).
6. Optional: set `DEMO_ROOT=~/deploy/shared/demo-tts` after [demo-tts CI](../.github/workflows/deploy.yml) populates the shared path.
