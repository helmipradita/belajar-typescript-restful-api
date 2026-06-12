# CLAUDE.md — Project Guide

## Commit Format

Project ini punya **2 varian format commit**. Pilih berdasarkan tipe konten:

### Varian 1 — Dash list (pake bullet `- `)

Wajib untuk tipe: `feat`, `infra`, `build`, `refactor`, `test`, `fix`, `chore`

```
git commit -m "type: short description

- Add specific change one
- Add specific change two
- Add specific change three
- Add specific change four

Notes:
Penjelasan why atau tradeoff yang diambil.
Bisa multiple line tanpa dash.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Rules:
- Subject: `type: description` — NO empty line after subject (list langsung).
- Body: setiap item mulai `- `, NO trailing blank lines antar item.
- `Notes:` tanpa enter, langsung diikuti note text.
- Footer: `Co-Authored-By: ...`.

### Varian 2 — Paragraph style (NO dash)

Wajib untuk tipe: `docs`

```
git commit -m "type: short description

Paragraph satu.

Paragraph dua.

Paragraph tiga.

Notes:

Note pertama.
Note kedua.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

Rules:
- Subject: `type: description` — ada **empty line** setelah subject.
- Body: tiap paragraf dipisah **empty line**.
- `Notes:` diikuti **empty line**, baru note items.
- Footer: `Co-Authored-By: ...`.

### Footer (wajib di semua varian)

```text
Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

### Tipe commit

| Tipe | Kapan dipake |
|------|-------------|
| feat | Fitur baru |
| fix | Bug fix |
| infra | Docker, CI/CD, monitoring stack |
| docs | Dokumentasi, README, CHANGELOG |
| refactor | Restruktur kode, rename file |
| test | Nambah atau update test |
| build | Dependencies, build config |
| chore | Maintenance, config, gitignore |

## Proses commit

1. Jalanin `git add <files>` — jangan `git add .` atau `-A`
2. Format pesan sesuai varian di atas
3. Jangan skip hooks (`--no-verify` dilarang)
