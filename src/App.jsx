import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'kdp-launch-hq-v1'

const DEFAULT_CHECKLIST = [
  'Interior uploaded',
  'Cover uploaded',
  'ISBN entered',
  'Preview checked',
  'Price set',
  'Published',
]

function checklist(labels, doneLabels = []) {
  return labels.map((label, i) => ({
    id: `c-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
    label,
    done: doneLabels.includes(label),
  }))
}

// Sample data only — two clearly fictional placeholder books.
// Replace them with your own books in the app. No real ISBNs here:
// print ISBNs use the placeholder 979-8-XXXXXXX-X, and the eBook
// ISBN is left blank on purpose (eBooks don't need one on KDP).
const SEED = [
  {
    id: 'sample-lighthouse',
    title: 'The Lighthouse at Low Tide',
    author: 'Sample Author',
    genre: 'Literary fiction',
    status: 'Ready to upload',
    targetDate: '2027-03-15',
    notes: 'Sample book — replace this with your own title. Paperback is nearly ready; the eBook still needs a final preview.',
    editions: [
      {
        id: 'sample-lighthouse-paperback',
        type: 'Paperback',
        isbn: '979-8-XXXXXXX-X',
        pages: '248',
        trim: '5.5" x 8.5"',
        coverVersion: 'v2',
        interiorVersion: 'v3',
        notes: 'Cover v2 fixed the title contrast. Interior v3 is the final pass.',
        checklist: checklist(DEFAULT_CHECKLIST, [
          'Interior uploaded',
          'Cover uploaded',
          'ISBN entered',
          'Preview checked',
        ]),
      },
      {
        id: 'sample-lighthouse-hardcover',
        type: 'Hardcover',
        isbn: '979-8-XXXXXXX-X',
        pages: '248',
        trim: '5.5" x 8.5"',
        coverVersion: 'v1',
        interiorVersion: 'v3',
        notes: 'Hardcover uses the same interior as the paperback. Cover still v1.',
        checklist: checklist(DEFAULT_CHECKLIST, [
          'Interior uploaded',
          'ISBN entered',
        ]),
      },
      {
        id: 'sample-lighthouse-ebook',
        type: 'eBook',
        isbn: '',
        pages: '',
        trim: '',
        coverVersion: 'v2',
        interiorVersion: 'v2',
        notes: 'No ISBN needed for an eBook on KDP — leave this blank.',
        checklist: checklist(DEFAULT_CHECKLIST, ['Cover uploaded']),
      },
    ],
  },
  {
    id: 'sample-gardens',
    title: 'A Field Guide to Small Gardens',
    author: 'Sample Author',
    genre: 'Nonfiction / Gardening',
    status: 'Draft',
    targetDate: '2027-05-01',
    notes: 'Sample book — still in draft. Only the paperback edition exists so far; add an eBook edition when you are ready.',
    editions: [
      {
        id: 'sample-gardens-paperback',
        type: 'Paperback',
        isbn: '979-8-XXXXXXX-X',
        pages: '132',
        trim: '6" x 9"',
        coverVersion: 'v1',
        interiorVersion: 'v1',
        notes: 'First draft of the interior. Photos are placeholders.',
        checklist: checklist(DEFAULT_CHECKLIST, ['ISBN entered']),
      },
      {
        id: 'sample-gardens-ebook',
        type: 'eBook',
        isbn: '',
        pages: '',
        trim: '',
        coverVersion: 'v1',
        interiorVersion: 'v1',
        notes: 'eBook edition added early so the checklist is visible — nothing uploaded yet.',
        checklist: checklist(DEFAULT_CHECKLIST, []),
      },
    ],
  },
]

const STATUSES = ['Draft', 'Ready to upload', 'Live']
const EDITION_TYPES = ['Paperback', 'Hardcover', 'eBook']
const FILTERS = ['All', ...STATUSES]

const STATUS_STYLES = {
  Draft: 'bg-amber-100 text-amber-900',
  'Ready to upload': 'bg-sky-100 text-sky-900',
  Live: 'bg-emerald-100 text-emerald-900',
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return SEED
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : SEED
  } catch {
    return SEED
  }
}

function editionProgress(edition) {
  const total = edition.checklist.length
  if (!total) return { done: 0, total: 0, pct: 0 }
  const done = edition.checklist.filter((item) => item.done).length
  return { done, total, pct: Math.round((done / total) * 100) }
}

function bookProgress(book) {
  const all = book.editions.flatMap((e) => e.checklist)
  const total = all.length
  if (!total) return { done: 0, total: 0, pct: 0 }
  const done = all.filter((item) => item.done).length
  return { done, total, pct: Math.round((done / total) * 100) }
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(`${dateStr}T00:00:00`)
  return Math.round((d - today) / 86400000)
}

const emptyBookForm = {
  title: '',
  author: '',
  genre: '',
  status: 'Draft',
  targetDate: '',
  notes: '',
}

const emptyEditionForm = {
  type: 'Paperback',
  isbn: '',
  pages: '',
  trim: '',
  coverVersion: '',
  interiorVersion: '',
  notes: '',
}

export default function App() {
  const [books, setBooks] = useState(load)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [showBookForm, setShowBookForm] = useState(false)
  const [editingBookId, setEditingBookId] = useState(null)
  const [bookForm, setBookForm] = useState(emptyBookForm)
  const [editionFormFor, setEditionFormFor] = useState(null) // book id, or null
  const [editingEdition, setEditingEdition] = useState(null) // { bookId, editionId } or null
  const [editionForm, setEditionForm] = useState(emptyEditionForm)
  const [customLabels, setCustomLabels] = useState({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  }, [books])

  const overall = useMemo(() => {
    const all = books.flatMap((b) => b.editions.flatMap((e) => e.checklist))
    const total = all.length
    const done = all.filter((item) => item.done).length
    return {
      done,
      total,
      pct: total ? Math.round((done / total) * 100) : 0,
      live: books.filter((b) => b.status === 'Live').length,
      editions: books.reduce((sum, b) => sum + b.editions.length, 0),
    }
  }, [books])

  const visible = books.filter((b) => {
    if (filter !== 'All' && b.status !== filter) return false
    if (query) {
      const hay = `${b.title} ${b.author} ${b.genre} ${b.notes} ${b.editions.map((e) => e.type).join(' ')}`.toLowerCase()
      if (!hay.includes(query.toLowerCase())) return false
    }
    return true
  })

  function submitBook(e) {
    e.preventDefault()
    if (!bookForm.title.trim()) return
    const data = {
      title: bookForm.title.trim(),
      author: bookForm.author.trim(),
      genre: bookForm.genre.trim(),
      status: bookForm.status,
      targetDate: bookForm.targetDate,
      notes: bookForm.notes.trim(),
    }
    if (editingBookId) {
      setBooks((list) => list.map((b) => (b.id === editingBookId ? { ...b, ...data } : b)))
    } else {
      setBooks((list) => [...list, { id: `b-${Date.now()}`, ...data, editions: [] }])
    }
    setBookForm(emptyBookForm)
    setEditingBookId(null)
    setShowBookForm(false)
  }

  function startEditBook(book) {
    setBookForm({
      title: book.title,
      author: book.author,
      genre: book.genre,
      status: book.status,
      targetDate: book.targetDate || '',
      notes: book.notes || '',
    })
    setEditingBookId(book.id)
    setShowBookForm(true)
  }

  function removeBook(id) {
    if (!globalThis.confirm('Remove this book and all its editions?')) return
    setBooks((list) => list.filter((b) => b.id !== id))
  }

  function openEditionForm(bookId, edition = null) {
    setEditionFormFor(bookId)
    setEditingEdition(edition ? { bookId, editionId: edition.id } : null)
    setEditionForm(
      edition
        ? {
            type: edition.type,
            isbn: edition.isbn || '',
            pages: edition.pages || '',
            trim: edition.trim || '',
            coverVersion: edition.coverVersion || '',
            interiorVersion: edition.interiorVersion || '',
            notes: edition.notes || '',
          }
        : emptyEditionForm,
    )
  }

  function submitEdition(e, bookId) {
    e.preventDefault()
    const data = {
      type: editionForm.type,
      isbn: editionForm.isbn.trim(),
      pages: editionForm.pages.trim(),
      trim: editionForm.trim.trim(),
      coverVersion: editionForm.coverVersion.trim(),
      interiorVersion: editionForm.interiorVersion.trim(),
      notes: editionForm.notes.trim(),
    }
    setBooks((list) =>
      list.map((b) => {
        if (b.id !== bookId) return b
        if (editingEdition) {
          return {
            ...b,
            editions: b.editions.map((ed) => (ed.id === editingEdition.editionId ? { ...ed, ...data } : ed)),
          }
        }
        return {
          ...b,
          editions: [
            ...b.editions,
            { id: `e-${Date.now()}`, ...data, checklist: checklist(DEFAULT_CHECKLIST) },
          ],
        }
      }),
    )
    setEditionForm(emptyEditionForm)
    setEditingEdition(null)
    setEditionFormFor(null)
  }

  function removeEdition(bookId, editionId) {
    if (!globalThis.confirm('Remove this edition?')) return
    setBooks((list) =>
      list.map((b) =>
        b.id === bookId ? { ...b, editions: b.editions.filter((ed) => ed.id !== editionId) } : b,
      ),
    )
  }

  function toggleChecklist(bookId, editionId, itemId) {
    setBooks((list) =>
      list.map((b) =>
        b.id !== bookId
          ? b
          : {
              ...b,
              editions: b.editions.map((ed) =>
                ed.id !== editionId
                  ? ed
                  : {
                      ...ed,
                      checklist: ed.checklist.map((item) =>
                        item.id === itemId ? { ...item, done: !item.done } : item,
                      ),
                    },
              ),
            },
      ),
    )
  }

  function addChecklistItem(bookId, editionId) {
    const label = (customLabels[editionId] || '').trim()
    if (!label) return
    setBooks((list) =>
      list.map((b) =>
        b.id !== bookId
          ? b
          : {
              ...b,
              editions: b.editions.map((ed) =>
                ed.id !== editionId
                  ? ed
                  : { ...ed, checklist: [...ed.checklist, { id: `c-${Date.now()}`, label, done: false }] },
              ),
            },
      ),
    )
    setCustomLabels((old) => ({ ...old, [editionId]: '' }))
  }

  function removeChecklistItem(bookId, editionId, itemId) {
    setBooks((list) =>
      list.map((b) =>
        b.id !== bookId
          ? b
          : {
              ...b,
              editions: b.editions.map((ed) =>
                ed.id !== editionId
                  ? ed
                  : { ...ed, checklist: ed.checklist.filter((item) => item.id !== itemId) },
              ),
            },
      ),
    )
  }

  function resetSample() {
    if (!globalThis.confirm('Reset to the two sample books? Your edits will be replaced.')) return
    setBooks(SEED)
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            For indie authors · KDP Launch HQ
          </p>
          <h1 className="mt-1 font-serif text-3xl font-bold sm:text-4xl">KDP Launch HQ</h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            Every book, every edition, every upload step — in one place.
            Track paperback, hardcover, and eBook launches without losing
            track of which cover or interior version is which.
          </p>
          <a
            href="https://kdp.amazon.com/en_US/bookshelf"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
          >
            Open in KDP ↗
          </a>
          <p className="mt-2 text-xs text-stone-500">
            Opens your KDP Bookshelf in a new tab — sign in there yourself.
            This dashboard never connects to your KDP account.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {/* Overall progress */}
        <section className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-serif text-lg font-bold">Overall launch progress</h2>
            <p className="text-sm text-stone-600">
              <span className="font-semibold text-stone-900">{overall.done} / {overall.total}</span> steps done · {overall.pct}%
            </p>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-stone-200">
            <div className="h-full rounded-full bg-amber-700" style={{ width: `${overall.pct}%` }} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-serif text-2xl font-bold">{books.length}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Books</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold">{overall.editions}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Editions</p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold">{overall.live}</p>
              <p className="text-xs uppercase tracking-wide text-stone-500">Live</p>
            </div>
          </div>
        </section>

        {/* Controls */}
        <section className="mt-6 flex flex-wrap items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search books, authors, genres…"
            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-700"
          />
          <button
            type="button"
            onClick={() => {
              setBookForm(emptyBookForm)
              setEditingBookId(null)
              setShowBookForm((v) => !v)
            }}
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700"
          >
            {showBookForm ? 'Close form' : '+ Add book'}
          </button>
          <button
            type="button"
            onClick={resetSample}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-600 hover:bg-stone-50"
          >
            Reset sample data
          </button>
        </section>

        <div className="mt-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === f ? 'bg-stone-900 text-white' : 'border border-stone-300 bg-white text-stone-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Add / edit book form */}
        {showBookForm && (
          <form onSubmit={submitBook} className="mt-4 rounded-xl border border-stone-200 bg-white p-4">
            <h2 className="font-serif text-lg font-bold">{editingBookId ? 'Edit book' : 'Add a book'}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Title
                <input required value={bookForm.title} onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                Author
                <input value={bookForm.author} onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })} placeholder="Your name" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                Genre
                <input value={bookForm.genre} onChange={(e) => setBookForm({ ...bookForm, genre: e.target.value })} placeholder="e.g. Memoir, Fantasy, Cookbook" className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                Status
                <select value={bookForm.status} onChange={(e) => setBookForm({ ...bookForm, status: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="text-sm">
                Target launch date
                <input type="date" value={bookForm.targetDate} onChange={(e) => setBookForm({ ...bookForm, targetDate: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
              <label className="text-sm">
                Notes
                <input value={bookForm.notes} onChange={(e) => setBookForm({ ...bookForm, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2" />
              </label>
            </div>
            <button type="submit" className="mt-4 rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
              {editingBookId ? 'Save changes' : 'Add book'}
            </button>
          </form>
        )}

        {/* Book cards */}
        <section className="mt-6 space-y-5">
          {visible.map((book) => {
            const prog = bookProgress(book)
            const days = daysUntil(book.targetDate)
            return (
              <article key={book.id} className="rounded-xl border border-stone-200 bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-2xl font-bold leading-snug">{book.title}</h2>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {book.author || 'No author yet'}{book.genre ? ` · ${book.genre}` : ''}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[book.status] || 'bg-stone-200 text-stone-700'}`}>
                    {book.status}
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">{prog.done} / {prog.total} upload steps</span>
                    <span className="text-stone-500">{prog.pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-stone-200">
                    <div className="h-full rounded-full bg-amber-700" style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>

                {book.targetDate && (
                  <p className="mt-3 text-sm">
                    <span className="font-semibold">Target launch {book.targetDate}</span>
                    <span className="text-stone-500">
                      {' '}· {days === 0 ? 'due today' : days > 0 ? `${days} days left` : `${Math.abs(days)} days past target`}
                    </span>
                  </p>
                )}
                {book.notes && <p className="mt-2 text-sm leading-relaxed text-stone-600">{book.notes}</p>}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEditBook(book)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                    Edit book
                  </button>
                  <button type="button" onClick={() => openEditionForm(book.id)} className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm hover:bg-stone-50">
                    + Add edition
                  </button>
                  <button type="button" onClick={() => removeBook(book.id)} className="ml-auto text-sm text-stone-400 hover:text-red-700">
                    Remove book
                  </button>
                </div>

                {/* Edition form */}
                {editionFormFor === book.id && (
                  <form onSubmit={(e) => submitEdition(e, book.id)} className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <h3 className="font-serif text-base font-bold">{editingEdition ? 'Edit edition' : 'Add an edition'}</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="text-sm">
                        Edition type
                        <select value={editionForm.type} onChange={(e) => setEditionForm({ ...editionForm, type: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2">
                          {EDITION_TYPES.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="text-sm">
                        ISBN
                        <input value={editionForm.isbn} onChange={(e) => setEditionForm({ ...editionForm, isbn: e.target.value })} placeholder="979-8-XXXXXXX-X (leave blank for eBook)" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                      <label className="text-sm">
                        Page count
                        <input value={editionForm.pages} onChange={(e) => setEditionForm({ ...editionForm, pages: e.target.value })} placeholder="e.g. 248" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                      <label className="text-sm">
                        Trim size
                        <input value={editionForm.trim} onChange={(e) => setEditionForm({ ...editionForm, trim: e.target.value })} placeholder='e.g. 5.5" x 8.5"' className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                      <label className="text-sm">
                        Cover file version
                        <input value={editionForm.coverVersion} onChange={(e) => setEditionForm({ ...editionForm, coverVersion: e.target.value })} placeholder="e.g. v2" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                      <label className="text-sm">
                        Interior file version
                        <input value={editionForm.interiorVersion} onChange={(e) => setEditionForm({ ...editionForm, interiorVersion: e.target.value })} placeholder="e.g. v3" className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                      <label className="text-sm sm:col-span-2">
                        Notes
                        <input value={editionForm.notes} onChange={(e) => setEditionForm({ ...editionForm, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2" />
                      </label>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button type="submit" className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700">
                        {editingEdition ? 'Save edition' : 'Add edition'}
                      </button>
                      <button type="button" onClick={() => { setEditionFormFor(null); setEditingEdition(null) }} className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Editions */}
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {book.editions.map((edition) => {
                    const ep = editionProgress(edition)
                    return (
                      <div key={edition.id} className="rounded-lg border border-stone-200 bg-stone-50 p-4">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-lg font-bold">{edition.type}</h3>
                          <span className="text-sm font-semibold text-stone-600">{ep.pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
                          <div className="h-full rounded-full bg-amber-700" style={{ width: `${ep.pct}%` }} />
                        </div>
                        <dl className="mt-3 space-y-1 text-sm">
                          <div className="flex justify-between gap-2"><dt className="text-stone-500">ISBN</dt><dd className="font-medium">{edition.isbn || '—'}</dd></div>
                          <div className="flex justify-between gap-2"><dt className="text-stone-500">Pages</dt><dd className="font-medium">{edition.pages || '—'}</dd></div>
                          <div className="flex justify-between gap-2"><dt className="text-stone-500">Trim size</dt><dd className="font-medium">{edition.trim || '—'}</dd></div>
                          <div className="flex justify-between gap-2"><dt className="text-stone-500">Cover</dt><dd className="font-medium">{edition.coverVersion || '—'}</dd></div>
                          <div className="flex justify-between gap-2"><dt className="text-stone-500">Interior</dt><dd className="font-medium">{edition.interiorVersion || '—'}</dd></div>
                        </dl>
                        {edition.notes && <p className="mt-2 text-sm text-stone-600">{edition.notes}</p>}

                        <ul className="mt-3 space-y-1.5">
                          {edition.checklist.map((item) => (
                            <li key={item.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={item.done}
                                onChange={() => toggleChecklist(book.id, edition.id, item.id)}
                                className="h-4 w-4 accent-amber-700"
                              />
                              <span className={item.done ? 'text-stone-400 line-through' : ''}>{item.label}</span>
                              <button type="button" onClick={() => removeChecklistItem(book.id, edition.id, item.id)} className="ml-auto text-xs text-stone-400 hover:text-red-700" aria-label={`Remove ${item.label}`}>
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 flex gap-2">
                          <input
                            value={customLabels[edition.id] || ''}
                            onChange={(e) => setCustomLabels({ ...customLabels, [edition.id]: e.target.value })}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(book.id, edition.id) } }}
                            placeholder="Add a checklist step…"
                            className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-amber-700"
                          />
                          <button type="button" onClick={() => addChecklistItem(book.id, edition.id)} className="rounded-lg bg-stone-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-stone-700">
                            Add
                          </button>
                        </div>
                        <div className="mt-3 flex gap-3 border-t border-stone-200 pt-3">
                          <button type="button" onClick={() => openEditionForm(book.id, edition)} className="text-sm text-stone-600 hover:text-stone-900">
                            Edit edition
                          </button>
                          <button type="button" onClick={() => removeEdition(book.id, edition.id)} className="text-sm text-stone-400 hover:text-red-700">
                            Remove edition
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {book.editions.length === 0 && (
                    <p className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                      No editions yet — add a Paperback, Hardcover, or eBook edition above.
                    </p>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        {visible.length === 0 && (
          <p className="mt-8 rounded-xl border border-dashed border-stone-300 bg-white p-6 text-center text-stone-500">
            Nothing matches that search or filter. Try another status, or add a book.
          </p>
        )}

        <footer className="mt-8 border-t border-stone-200 pt-4 text-center text-xs text-stone-400">
          KDP Launch HQ · Vite + React + Tailwind CSS · Your data saves in this browser only (localStorage) — nothing is sent to a server, and it never connects to your KDP account.
        </footer>
      </main>
    </div>
  )
}
