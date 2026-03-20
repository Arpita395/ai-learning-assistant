const DEFAULT_CHUNK_SIZE = 500;
const OVERLAP_SIZE = 50;
const STOP_WORDS = new Set([
  "the","is","in","at","of","a","and","to","for","on","with",
  "as","by","an","be","this","that","it","from","or","are",
  "was","were","but","not","have","has","had"
]);

// ------------------------
// 1. chunkText
// ------------------------
export function chunkText(text, chunkSize = DEFAULT_CHUNK_SIZE) {
  if (!text) return [];

  let cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const paragraphs = cleaned
    .split(/\n{1,2}/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  let chunks = [];
  let currentWords = [];

  for (let para of paragraphs) {
    const words = para.split(" ");

    if (words.length > chunkSize) {
      for (let i = 0; i < words.length; i += chunkSize) {
        const wordChunk = words.slice(i, i + chunkSize);
        if (currentWords.length + wordChunk.length > chunkSize) {
          if (currentWords.length > 0) {
            chunks.push(currentWords.join(" "));
            currentWords = currentWords.slice(-OVERLAP_SIZE);
          }
        }
        currentWords.push(...wordChunk);
      }
    } else {
      if (currentWords.length + words.length > chunkSize) {
        if (currentWords.length > 0) {
          chunks.push(currentWords.join(" "));
          currentWords = currentWords.slice(-OVERLAP_SIZE);
        }
      }
      currentWords.push(...words);
    }
  }

  if (currentWords.length > 0) {
    chunks.push(currentWords.join(" "));
  }

  if (chunks.length === 0) {
    const words = cleaned.split(" ");
    for (let i = 0; i < words.length; i += chunkSize) {
      chunks.push(words.slice(i, i + chunkSize).join(" "));
    }
  }

  return chunks.map((content, index) => ({
    index,
    content: content.trim()
  }));
}

// ------------------------
// 2. findRelevantChunks
// ------------------------
export function findRelevantChunks(chunks, query, topK = 5) {
  if (!query || chunks.length === 0) return [];

  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(" ")
    .filter(word => word && !STOP_WORDS.has(word));

  const scoredChunks = chunks.map((chunk, index) => {
    const text = chunk.content.toLowerCase();
    let score = 0;
    let matchCount = 0;

    for (let word of queryWords) {
      if (text.includes(word)) {
        score += 2;
        matchCount++;
      } else {
        for (let token of text.split(" ")) {
          if (token.includes(word)) score += 1;
        }
      }
    }

    if (matchCount > 1) score += matchCount;

    const lengthFactor = chunk.content.length / 1000;
    score = score / (lengthFactor || 1);

    score += Math.max(0, (10 - index) * 0.1);

    return { index: chunk.index, content: chunk.content, score };
  });

  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}