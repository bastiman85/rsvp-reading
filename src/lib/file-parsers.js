/**
 * File parsing utilities for PDF and EPUB files
 */

/**
 * Parse a PDF file and extract its text content
 * @param {File} file - The PDF file to parse
 * @returns {Promise<string>} The extracted text
 */
export async function parsePDF(file) {
  const pdfjsLib = await import('pdfjs-dist')

  // Set up the worker - use unpkg which mirrors npm directly
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let fullText = ''

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items
      .filter(item => 'str' in item)
      .map(item => /** @type {{ str: string }} */ (item).str)
      .join(' ')
    fullText += pageText + ' '
  }

  // Clean up the text
  return cleanText(fullText)
}

/**
 * Parse an EPUB file and extract its text content
 * @param {File} file - The EPUB file to parse
 * @returns {Promise<string>} The extracted text
 */
export async function parseEPUB(file) {
  const ePub = (await import('epubjs')).default

  const arrayBuffer = await file.arrayBuffer()
  const book = ePub(arrayBuffer)

  await book.ready
  await book.loaded.spine
  await book.loaded.navigation

  // Build a map of href -> TOC label from the EPUB's built-in table of contents
  const tocMap = new Map()
  function walkToc(items) {
    for (const item of items) {
      if (item.href && item.label) {
        // Normalize href by stripping fragment identifiers for matching
        const baseHref = item.href.split('#')[0]
        if (!tocMap.has(baseHref)) {
          tocMap.set(baseHref, item.label.trim())
        }
      }
      if (item.subitems && item.subitems.length > 0) {
        walkToc(item.subitems)
      }
    }
  }
  if (book.navigation && book.navigation.toc) {
    walkToc(book.navigation.toc)
  }

  const chapters = []

  // Get spine items - the API varies between versions
  const spineItems = book.spine?.spineItems || book.spine?.items || []

  // Phase 1: load and clean each spine item, preserving TOC labels
  const allChunks = []
  for (const item of spineItems) {
    try {
      const href = item.href || item.url
      if (!href) continue

      const baseHref = href.split('#')[0]
      const tocLabel = tocMap.get(baseHref) || null

      const contents = await book.load(href)
      if (contents) {
        let text = ''
        // contents can be a Document, string, or XML document
        if (typeof contents === 'string') {
          const doc = new DOMParser().parseFromString(contents, 'text/html')
          text = doc.body?.textContent || ''
        } else if (contents.body) {
          text = contents.body.textContent || ''
        } else if (contents.documentElement) {
          text = contents.documentElement.textContent || ''
        }

        const cleanedChunk = cleanText(text)
        if (cleanedChunk) {
          allChunks.push({ cleanedChunk, tocLabel })
        }
      }
    } catch (e) {
      console.warn('Could not load section:', e)
    }
  }

  // Phase 2: compute chapter word indices against the already-cleaned text.
  // Word positions are accumulated chunk-by-chunk so they match exactly what
  // parseTextUtil will produce when splitting the final joined string.
  let fullText = ''
  let wordPos = 0
  for (const { cleanedChunk, tocLabel } of allChunks) {
    if (tocLabel) {
      chapters.push({ title: tocLabel, wordIndex: wordPos })
    }
    wordPos += cleanedChunk.split(/\s+/).filter(w => w.length > 0).length
    fullText += cleanedChunk + ' '
  }

  const title = book.package?.metadata?.title || ''
  return { text: fullText.trim(), chapters, title }
}

/**
 * Clean and normalize extracted text
 * @param {string} text - The raw text to clean
 * @returns {string} Cleaned text
 */
function cleanText(text) {
  return text
    // Ensure space after sentence-ending punctuation followed by a letter (handles missing
    // spaces when HTML text nodes are concatenated without whitespace, e.g. "end.Next")
    .replace(/([.!?])([A-Za-z])/g, '$1 $2')
    // Ensure space after comma/semicolon/colon followed by a letter
    .replace(/([,;:])([A-Za-z])/g, '$1 $2')
    // Replace multiple spaces/newlines with single space
    .replace(/\s+/g, ' ')
    // Remove excessive repeated punctuation (e.g. "..." → ".")
    .replace(/([.!?])\1+/g, '$1')
    // Trim
    .trim()
}

/**
 * Detect file type and parse accordingly
 * @param {File} file - The file to parse
 * @returns {Promise<string>} The extracted text
 */
export async function parseFile(file) {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.pdf')) {
    return { text: await parsePDF(file), chapters: [] }
  } else if (fileName.endsWith('.epub')) {
    return parseEPUB(file)
  } else {
    throw new Error(`Unsupported file type: ${fileName}`)
  }
}

/**
 * Get supported file extensions
 * @returns {string} Comma-separated list of supported extensions
 */
export function getSupportedExtensions() {
  return '.pdf,.epub'
}
