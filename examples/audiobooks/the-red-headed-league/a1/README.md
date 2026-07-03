# Имена файлов demo-аудио

Шаблон:

```
{объём}-{движок}-{голоса}-{режим}.mp3
```

| Часть | Значение | Примеры |
|-------|----------|---------|
| **объём** | `full-book` — вся книга (8 глав); `part-01` — глава 1 | |
| **движок** | `tada` · `tada3b` · `dots` | `tada3b` = TADA-3B-ML на RTX 3090 (server6) |
| **голоса** | `one-voice-owen` — один рассказчик (Owen neutral) · `multi-voice-cast` — по ролям (Watson/Holmes/Wilson) | |
| **режим** | `chunks` — простое чтение блоками · `directed` — **постановка** из `direction.json` + `cast.json` | |

## Файлы

| Файл | По-русски |
|------|-----------|
| `full-book-tada-one-voice-owen-chunks.mp3` | TADA **1B**, вся книга, **один голос**, не постановка (RTX 3060, server2) |
| `full-book-tada3b-one-voice-owen-chunks.mp3` | TADA **3B-ML**, вся книга, один голос, профиль **Default** (RTX 3090, server6) |
| `full-book-tada3b-one-voice-owen-chunks.srt` | Субтитры к 3B Default |
| `full-book-tada3b-one-voice-owen-chunks-StableBook.mp3` | TADA **3B-ML**, та же книга, профиль **Stable book** (меньше «переигрыша») |
| `full-book-tada3b-one-voice-owen-chunks-StableBook.srt` | Субтитры к 3B Stable book |
| `full-book-tada-multi-voice-cast-directed.mp3` | TADA, вся книга, **постановка**, разные роли |
| `full-book-tada-multi-voice-cast-directed.srt` | Субтитры к полной постановке (SRT, таймкоды TADA) |
| `full-book-dots-one-voice-owen-chunks.mp3` | dots.tts, вся книга, один голос |
| `part-01-tada-one-voice-owen-chunks.mp3` | TADA, глава 1, один голос |
| `part-01-tada-multi-voice-cast-directed.mp3` | TADA, глава 1, постановка |
| `part-01-dots-one-voice-owen-chunks.mp3` | dots, глава 1, один голос |

Cast (directed): watson→owen_neutral, holmes→leo_neutral, wilson→owen_soft, other→leo_amused (minor guest, 1 line).

## Скорость генерации (chunks, owen_neutral, A1)

| Файл | GPU | Модель | Аудио | Wall-clock GPU | RTF |
|------|-----|--------|-------|----------------|-----|
| `full-book-tada-one-voice-owen-chunks.mp3` | RTX 3060 12 GB | TADA-1B | ~16 мин | ~3.5 мин | ~0.20 |
| `full-book-tada3b-one-voice-owen-chunks.mp3` | RTX 3090 24 GB | TADA-3B-ML Default | ~16.4 мин | ~3.3 мин | ~0.20 |
| `full-book-tada3b-one-voice-owen-chunks-StableBook.mp3` | RTX 3090 24 GB | TADA-3B-ML Stable book | ~16.0 мин | ~3.6 мин | ~0.22 |

**Stable book** = `noise_temperature 0.7`, `acoustic_cfg_scale 1.9`, `flow_steps 12` — сильнее держится за reference-голос, меньше случайной экспрессии (см. `vendor/demo-tts/js/synthesis-settings-tada.js`).
