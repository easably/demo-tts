# The Red-Headed League — A1 demo samples

Pre-rendered audiobook excerpts for the shared demo UI (`/books` page).

## Режимы

| Режим API | Файл | Голоса |
|-----------|------|--------|
| **chunks** | `full-book-tada-owen-neutral-chunks.mp3` | **Один** — `owen_neutral` на всю книгу |
| **directed** | `full-book-tada-directed.mp3` | **По постановке** — Watson / Holmes / Wilson (`cast.json`) |
| **directed** (глава 1) | `part-01-directed-tada.mp3` | то же, 28 реплик |

| File | Engine | Content | Duration |
|------|--------|---------|----------|
| `part-01-tada-owen-neutral.mp3` | TADA | Ch.1, chunks, one voice | ~2:02 |
| `part-01-directed-tada.mp3` | TADA | Ch.1, **directed** (roles) | ~1:58 |
| `part-01-dots-owen-neutral.mp3` | dots.tts | Ch.1, chunks | ~1:44 |
| `full-book-tada-owen-neutral-chunks.mp3` | TADA | Full book, **one narrator** | ~15:54 |
| `full-book-tada-directed.mp3` | TADA | Full book, **voice cast** | ~16:20 |
| `full-book-dots-owen-neutral-chunks.mp3` | dots.tts | Full book, one narrator | ~13:47 |

Cast (directed): watson→owen, holmes→leo, wilson→nora, other→nora_soft.
