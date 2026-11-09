# KDP Launch HQ

**One calm dashboard for every book you're self-publishing on KDP — so you never again wonder which cover version, interior file, or ISBN goes with which edition.**

If you publish on Amazon KDP, you know the mess: a paperback, a hardcover, and an eBook for the same title, each with its own ISBN, page count, trim size, cover file, interior file, and a half-finished upload checklist — spread across sticky notes, spreadsheets, and your memory. KDP Launch HQ puts it all in one place, in the browser, with nothing to install on a server and no account to create.

## Who it's for

- Indie authors launching their first book on KDP
- Self-publishers juggling paperback, hardcover, and eBook editions of the same title
- Anyone who has ever uploaded the wrong cover version and only noticed after hitting publish

## Features

- **Books** — title, author, genre, target launch date, and status (Draft / Ready to upload / Live)
- **Editions as first-class rows** — Paperback, Hardcover, and eBook under each book, each with its own ISBN, page count, trim size, cover file version, interior file version, and notes
- **Per-edition upload checklist** — interior uploaded, cover uploaded, ISBN entered, preview checked, price set, published — plus any custom steps you add
- **Progress at a glance** — a progress bar per book and one overall launch progress bar, so you can see what's actually left
- **Search + status filter** — find a book fast when your catalogue grows
- **Add, edit, and delete** books and editions, and add custom checklist items
- **Private by default** — everything saves in your browser's localStorage only (`kdp-launch-hq-v1`). Nothing is sent to a server. A "Reset sample data" button restores the two sample books.
- **Works on phone and desktop** — responsive, warm, bookish design
- **Open in KDP button** — one tap opens your KDP Bookshelf (https://kdp.amazon.com/en_US/bookshelf) in a new tab, where you sign in yourself. It is only a link — the dashboard never connects to your KDP account and stores no login.

## Screenshot

> Screenshot placeholder — add a screenshot of the dashboard here (for example `docs/screenshot.png`) once you've run it with your own books.

## Quick start

```bash
npm install
npm run dev     # local dev server with hot reload
npm run build   # production build — output in dist/
npm run preview # serve the production build locally
```

Requires Node.js 18+ and npm. Built with Vite 8 + React 19 + Tailwind CSS v3.4 (Tailwind is pinned to v3 so `npx tailwindcss init -p` works as written).

## How to make it yours

1. Run it, then click **Reset sample data** only if you want the samples back — otherwise just delete the two sample books.
2. Click **+ Add book** and enter your real title, author, genre, target launch date, and status.
3. Under each book, click **+ Add edition** for every format you're publishing — Paperback, Hardcover, eBook — and fill in that edition's real ISBN, page count, trim size, and the current cover / interior file versions (e.g. `v2`, `v3`).
4. Tick off each edition's checklist as you go in KDP, and add custom steps for anything your launch needs (for example "A+ Content added" or "Author copy ordered").
5. Your edits save automatically in your browser. That's it — there's no database to set up and no login.

The two seeded books are fictional placeholders only — *The Lighthouse at Low Tide* by Sample Author and *A Field Guide to Small Gardens* by Sample Author — so you can see how editions and checklists work before replacing them with your own. Their ISBNs are placeholders (`979-8-XXXXXXX-X`); eBook ISBNs are left blank on purpose, since eBooks don't need an ISBN on KDP.

## What it does NOT do

- **It does not connect to your KDP account.** There is no Amazon login, no API, and no automatic upload. You do every upload click yourself in KDP — this dashboard just keeps track of what you've done and what's left.
- **It does not store your files.** It records file *versions* (like "cover v2"), not the cover or interior files themselves. Keep those files where you already keep them.
- **It does not sync between devices.** Data lives in one browser's localStorage. If you switch browsers or devices, your books won't follow — export or re-enter them there.

## What's in the starter

- `src/App.jsx` — the whole dashboard: book cards, edition rows, upload checklists, progress bars, search + status filters, and the add/edit forms
- `src/main.jsx` — React entry point
- `src/index.css` — Tailwind directives and the warm paper background
- `tailwind.config.js` — content paths for `./index.html` and `./src/**`
- `vite.config.js`, `postcss.config.js` — Vite + Tailwind setup

## License

MIT — see [LICENSE](LICENSE). Fork it, adapt it, make it yours.
