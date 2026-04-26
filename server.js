import express from 'express'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000
const DATA_FILE = join(__dirname, 'data', 'library.json')

app.use(express.json({ limit: '50mb' }))

// Serve static files from dist/
app.use(express.static(join(__dirname, 'dist')))

function readLibrary() {
  if (!existsSync(DATA_FILE)) return []
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeLibrary(books) {
  const dir = dirname(DATA_FILE)
  if (!existsSync(dir)) {
    import('fs').then(fs => fs.mkdirSync(dir, { recursive: true }))
  }
  writeFileSync(DATA_FILE, JSON.stringify(books, null, 2))
}

// Ensure data dir exists on startup
import('fs').then(fs => {
  const dir = dirname(DATA_FILE)
  if (!existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

// GET all books
app.get('/api/books', (req, res) => {
  res.json(readLibrary())
})

// GET single book
app.get('/api/books/:id', (req, res) => {
  const books = readLibrary()
  const book = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })
  res.json(book)
})

// PUT save/update a book
app.put('/api/books/:id', (req, res) => {
  const books = readLibrary()
  const index = books.findIndex(b => b.id === req.params.id)
  const book = { ...req.body, id: req.params.id }
  if (index >= 0) {
    books[index] = book
  } else {
    books.push(book)
  }
  writeLibrary(books)
  res.json(book)
})

// PATCH update progress/title only
app.patch('/api/books/:id', (req, res) => {
  const books = readLibrary()
  const book = books.find(b => b.id === req.params.id)
  if (!book) return res.status(404).json({ error: 'Not found' })
  Object.assign(book, req.body)
  writeLibrary(books)
  res.json(book)
})

// DELETE a book
app.delete('/api/books/:id', (req, res) => {
  const books = readLibrary().filter(b => b.id !== req.params.id)
  writeLibrary(books)
  res.json({ ok: true })
})

// SPA fallback
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RSVP Reader server running at http://localhost:${PORT}`)
})
