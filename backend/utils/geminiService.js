import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const openRouter = axios.create({
  baseURL: "https://openrouter.ai/v1",
  headers: {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Safe JSON parser
const parseJSON = (raw) => {
  try {
    const match = raw.match(/\[.*\]/s);
    if (!match) return [];
    return JSON.parse(match[0]);
  } catch (err) {
    console.error("JSON Parse Error:", err.message, "RAW:", raw);
    return [];
  }
};

export const generateFlashcards = async (text, count = 10) => {
  const prompt = `
You are an expert teacher.
Create ${count} high-quality flashcards from the study material.

Instructions:
- Each flashcard must contain:
  - question
  - answer (detailed explanation)
- Focus on concepts, definitions, reasoning
- Avoid repetition
- Make answers student-friendly and clear
- STRICTLY return ONLY a valid JSON array:
[
  { "question": "...", "answer": "..." }
]

Text:
${text}
`;

  try {
    const response = await openRouter.post("/chat/completions", {
      model: "mistralai/mistral-7b-instruct", // check if available in your plan
      messages: [
        { role: "system", content: "You are an expert teacher generating flashcards." },
        { role: "user", content: prompt },
      ],
    });

    // Safe check: ensure choices exist
    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      console.error("OpenRouter response format unexpected:", response.data);
      return [];
    }

    const raw = response.data.choices[0].message.content;

    const parsed = parseJSON(raw);

    return parsed.map(card => ({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty || "medium",
      lastReviewed: null,
      reviewCount: 0,
      isStarred: false
    }));

  } catch (error) {
    console.error("OpenRouter API Error:", error.response?.data || error.message);
    return [];
  }
};

// ==========================================================
// 2. GENERATE QUIZ QUESTIONS
// ==========================================================
export const generateQuizQuestions = async (text, numQuestions = 5) => {
  const prompt = `
You are an expert examiner.

Generate ${numQuestions} multiple-choice questions from the text.

Instructions:
- Each question must include:
  - question
  - 4 options
  - correctAnswer
  - explanation (detailed reasoning)
- Questions should test understanding, not memorization
- Difficulty: moderate

Return ONLY valid JSON:
[
  {
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "...",
    "explanation": "..."
  }
]

Text:
${text}
`;

  const raw = await callAI(prompt);
  return parseJSON(raw);
};

// ==========================================================
// 3. GENERATE DOCUMENT SUMMARY
// ==========================================================
export const generateSummary = async (text) => {
  const prompt = `
You are an academic expert.

Generate a detailed and structured summary of the document.

Instructions:
- Explain key concepts clearly
- Maintain logical flow
- Use paragraphs (not just bullet points)
- Highlight important ideas and insights
- Make it useful for revision

Text:
${text}
`;

  return await callAI(prompt);
};

// ==========================================================
// 4. CHAT WITH DOCUMENT CONTEXT
// ==========================================================
export const chatWithDocument = async (question, chunks) => {
  const context = chunks.map((c) => c.content).join("\n");

  const prompt = `
You are an intelligent AI tutor.

Use ONLY the provided document context to answer the question.

Instructions:
- Provide a detailed and explanatory answer
- If the answer is not in the context, say:
  "This information is not available in the provided document"
- Do NOT hallucinate
- Explain clearly like a teacher

Context:
${context}

Question:
${question}
`;

  return await callAI(prompt);
};

// ==========================================================
// 5. EXPLAIN A SPECIFIC CONCEPT
// ==========================================================
export const explainConcept = async (concept, context) => {
  const prompt = `
You are an expert teacher.

Explain the following concept in a detailed and easy-to-understand way.

Instructions:
- Start with a simple explanation
- Then go deeper into technical details
- Provide examples if possible
- Make it beginner-friendly but informative
- Keep explanation structured

Context:
${context}

Concept:
${concept}
`;

  return await callAI(prompt);
};