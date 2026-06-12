# CLAUDE.md — Project Guide

## Commit Format

Ada **2 varian format commit**, pilih berdasarkan konten (bukan type commit):

### Varian 1 — Dash list (ada bullet `- `)

```
type: short description

- Add specific change one
- Add specific change two
- Add specific change three
- Add specific change four

Notes:
Penjelasan why atau tradeoff yang diambil. Bisa multiple line tanpa dash.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

Rules:
- Subject → **empty line** → body.
- Body: tiap item `- ` di baris sendiri, NO trailing blank lines antar item.
- `Notes:` **tanpa enter**, langsung diikuti text.
- Footer: `Co-Authored-By: ...`.

### Varian 2 — Paragraph (narasi, NO bullet)

```
type: short description

Paragraph description tanpa enter di tengah. Tulis aja sampe abis.

Notes:

Note pertama. Note kedua bisa sambung.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
```

Rules:
- Subject → **empty line** → body.
- Body: NO enter di tengah paragraf.
- `Notes:` diikuti **empty line**, baru note text.
- Footer: `Co-Authored-By: ...`.

Aturan penting:
- NO `AI-Generated` di footer.
- NO enter di tengah kalimat/paragraf.
- Enter cuma di: header→body, antar item list, body→Notes, Notes→footer.

## Tipe commit

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
2. Format pesan sesuai aturan di atas
3. Jangan skip hooks (`--no-verify` dilarang)
