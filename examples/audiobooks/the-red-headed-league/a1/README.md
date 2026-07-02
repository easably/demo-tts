# Имена файлов demo-аудио

Шаблон:

```
{объём}-{движок}-{голоса}-{режим}.mp3
```

| Часть | Значение | Примеры |
|-------|----------|---------|
| **объём** | `full-book` — вся книга (8 глав); `part-01` — глава 1 | |
| **движок** | `tada` · `dots` | |
| **голоса** | `one-voice-owen` — один рассказчик (Owen neutral) · `multi-voice-cast` — по ролям (Watson/Holmes/Wilson) | |
| **режим** | `chunks` — простое чтение блоками · `directed` — **постановка** из `direction.json` + `cast.json` | |

## Файлы

| Файл | По-русски |
|------|-----------|
| `full-book-tada-one-voice-owen-chunks.mp3` | TADA, вся книга, **один голос**, не постановка |
| `full-book-tada-multi-voice-cast-directed.mp3` | TADA, вся книга, **постановка**, разные роли |
| `full-book-dots-one-voice-owen-chunks.mp3` | dots.tts, вся книга, один голос |
| `part-01-tada-one-voice-owen-chunks.mp3` | TADA, глава 1, один голос |
| `part-01-tada-multi-voice-cast-directed.mp3` | TADA, глава 1, постановка |
| `part-01-dots-one-voice-owen-chunks.mp3` | dots, глава 1, один голос |

Cast (directed): watson→owen_neutral, holmes→leo_neutral, wilson→nora_neutral, other→nora_soft.
