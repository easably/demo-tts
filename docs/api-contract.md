# TTS demo API contract (v1)

Shared by [demo-tts](https://github.com/easably/demo-tts). Implementations: **TADA**, **dots.TTS**.

## `GET /api/presets`

```json
{
  "model": "HumeAI/tada-3b-ml",
  "engine_loaded": true,
  "voices": [
    {
      "id": "nova_neutral",
      "label": "Nova — neutral · clean studio",
      "character_label": "Nova",
      "sample": "samples/en/nova_neutral.wav",
      "sample_available": true,
      "preview_url": "/api/samples/nova_neutral",
      "free_license": true,
      "recording_quality": "studio_clean"
    }
  ],
  "dialogue_examples": [{ "id": "…", "title": "…", "lines": [{ "speaker": "…", "voice_id": "…", "text": "…" }] }],
  "book_examples": [],
  "default_options": {
    "acoustic_cfg_scale": 1.6,
    "duration_cfg_scale": 1.0,
    "num_flow_matching_steps": 10,
    "noise_temperature": 0.9,
    "speed_up_factor": 0,
    "normalize_text": true
  }
}
```

## `POST /api/tts`

Request:

```json
{ "text": "Hello.", "voice_id": "nova_neutral", "options": { "noise_temperature": 0.8 } }
```

Response:

```json
{
  "session_id": "abc123",
  "line": {
    "index": 0,
    "speaker": "Speaker",
    "voice_id": "nova_neutral",
    "text": "Hello.",
    "audio_url": "/api/audio/abc123/line_000.wav",
    "duration_sec": 1.23
  }
}
```

## `POST /api/dialogue` and `POST /api/book`

Request:

```json
{
  "pause_ms": 500,
  "options": {},
  "lines": [
    { "speaker": "Mia", "voice_id": "nova_amused", "text": "…" }
  ]
}
```

Response:

```json
{
  "session_id": "…",
  "pause_ms": 500,
  "merged_audio_url": "/api/audio/…/merged.wav",
  "merged_duration_sec": 12.3,
  "lines": [ … ]
}
```

## Static routes

Engines should serve:

- `GET /` → demo `index.html`
- `GET /demo/**` → static assets
- `GET /logs` → ops log page (optional)
- `GET /api/audio/{session_id}/{filename}` → generated WAV

## Compatibility

Engines may extend preset voice objects; the demo ignores unknown fields.  
Breaking changes require a new schema version (`tts-demo-config/2`, API v2).
