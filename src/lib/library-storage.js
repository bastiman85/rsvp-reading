const LIBRARY_KEY = 'rsvp-library';

// Local cache
function getCache() {
  try {
    const data = localStorage.getItem(LIBRARY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setCache(books) {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(books));
  } catch { /* quota exceeded — server is source of truth */ }
}

// API helpers
async function api(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

// Sync: fetch from server and update local cache
export async function syncBooks() {
  try {
    const books = await api('/books');
    setCache(books);
    return books;
  } catch {
    return getCache();
  }
}

export function getBooks() {
  return getCache();
}

export async function saveBook(book) {
  const entry = {
    id: book.id || Date.now().toString(),
    title: book.title,
    text: book.text,
    chapters: book.chapters || [],
    currentWordIndex: book.currentWordIndex || 0,
    totalWords: book.totalWords || 0,
    settings: book.settings || {},
    savedAt: Date.now()
  };

  // Update cache immediately
  const books = getCache();
  const existing = books.findIndex(b => b.id === entry.id);
  if (existing >= 0) books[existing] = entry;
  else books.push(entry);
  setCache(books);

  // Persist to server
  api(`/books/${entry.id}`, { method: 'PUT', body: JSON.stringify(entry) }).catch(() => {});

  return entry.id;
}

export function updateBookProgress(id, currentWordIndex, totalWords) {
  // Update cache
  const books = getCache();
  const book = books.find(b => b.id === id);
  if (book) {
    book.currentWordIndex = currentWordIndex;
    book.totalWords = totalWords;
    book.savedAt = Date.now();
    setCache(books);
  }

  // Persist to server
  api(`/books/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ currentWordIndex, totalWords, savedAt: Date.now() })
  }).catch(() => {});
}

export function deleteBook(id) {
  const books = getCache().filter(b => b.id !== id);
  setCache(books);
  api(`/books/${id}`, { method: 'DELETE' }).catch(() => {});
}

export function renameBook(id, newTitle) {
  const books = getCache();
  const book = books.find(b => b.id === id);
  if (book) {
    book.title = newTitle;
    setCache(books);
  }
  api(`/books/${id}`, { method: 'PATCH', body: JSON.stringify({ title: newTitle }) }).catch(() => {});
}

export function getBook(id) {
  return getCache().find(b => b.id === id) || null;
}
