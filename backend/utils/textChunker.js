// textChunker.js

// -----------------------------
// CONFIG
// -----------------------------
const DEFAULT_CHUNK_SIZE = 500; // words
const OVERLAP_SIZE = 50;

// Common stop words
const STOP_WORDS = new Set([
  "the", "is", "in", "at", "of", "a", "and", "to", "for", "on", "with",
  "as", "by", "an", "be", "this", "that", "it", "from", "or", "are",
  "was", "were", "but", "not", "have", "has", "had"
]);

// ==========================================================
// 1. MAIN FUNCTION: chunkText
// ==========================================================
function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE) {
  if (!text) return [];

  // -----------------------------
  // Clean text while preserving paragraphs
  // -----------------------------
  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // -----------------------------
  // Split into paragraphs (single/double newline)
  // -----------------------------
  let paragraphs = cleaned
    .split(/\n{1,2}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  let chunks = [];
  let currentChunk = "";
  let currentWords = [];

  // -----------------------------
  // Process each paragraph
  // -----------------------------
  for (let para of paragraphs) {
    let words = para.split(" ");

    // -----------------------------
    // If paragraph exceeds chunk size → split by words
    // -----------------------------
    if (words.length > chunkSize) {
      for (let i = 0; i < words.length; i += chunkSize) {
        let wordChunk = words.slice(i, i + chunkSize);

        // If adding exceeds chunk size → save current chunk
        if (currentWords.length + wordChunk.length > chunkSize) {
          if (currentWords.length > 0) {
            chunks.push(currentWords.join(" "));

            // create overlap from previous chunk
            let overlap = currentWords.slice(-OVERLAP_SIZE);
            currentWords = [...overlap];
          }
        }

        // add word chunk
        currentWords.push(...wordChunk);
      }
    } else {
      // -----------------------------
      // If adding paragraph exceeds chunk size
      // -----------------------------
      if (currentWords.length + words.length > chunkSize) {
        if (currentWords.length > 0) {
          chunks.push(currentWords.join(" "));

          // create overlap
          let overlap = currentWords.slice(-OVERLAP_SIZE);
          currentWords = [...overlap];
        }
      }

      // add paragraph to current chunk
      currentWords.push(...words);
    }
  }

  // -----------------------------
  // Add last chunk
  // -----------------------------
  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }

  // -----------------------------
  // Fallback: if no chunks created → split by words
  // -----------------------------
  if (chunks.length === 0) {
    let words = cleaned.split(" ");
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
  }

  // -----------------------------
  // Return clean chunk objects (NO mongoose metadata)
  // -----------------------------
  return chunks.map((content, index) => ({
    index,
    content: content.trim()
  }));
}

// ==========================================================
// 2. MAIN FUNCTION: findRelevantChunks
// ==========================================================
function findRelevantChunks(chunks, query, topK = 5) {
  if (!query || chunks.length === 0) return [];

  // -----------------------------
  // Extract and clean query words
  // -----------------------------
  let queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(word => word && !STOP_WORDS.has(word));

  // -----------------------------
  // Score each chunk
  // -----------------------------
  let scoredChunks = chunks.map((chunk, index) => {
    let text = chunk.content.toLowerCase();
    let score = 0;
    let matchCount = 0;

    for (let word of queryWords) {
      // exact match → higher score
      if (text.includes(word)) {
        score += 2;
        matchCount++;
      } else {
        // partial match → lower score
        let tokens = text.split(" ");
        for (let token of tokens) {
          if (token.includes(word)) {
            score += 1;
          }
        }
      }
    }

    // bonus: multiple query words found
    if (matchCount > 1) {
      score += matchCount;
    }

    // normalize by content length
    let lengthFactor = chunk.content.length / 1000;
    score = score / (lengthFactor || 1);

    // small bonus for earlier chunks
    score += Math.max(0, (10 - index) * 0.1);

    return {
      index: chunk.index,
      content: chunk.content,
      score
    };
  });

  // -----------------------------
  // Return top relevant chunks
  // -----------------------------
  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

// -----------------------------
// EXPORTS
// -----------------------------
module.exports = {
  chunkText,
  findRelevantChunks
};