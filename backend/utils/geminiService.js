import dotenv from "dotenv";
dotenv.config();

import axios from "axios";

export const openRouter = axios.create({
  baseURL: "https://openrouter.ai/api/v1",
  headers: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "http://localhost:3000",
    "X-Title": "AI Learning App",            
  },
});

export const generateFlashcards = async (text, count = 10) => {
  const prompt = `
    Generate ${count} flashcards from the text below. 

    Each flashcard must be in this format:
    [
      {
        "question": "string",
        "answer": "string"
      }
    ]

    STRICT RULES:
    - Return ONLY JSON
    - Do NOT write anything before or after JSON
    - Do NOT explain
    - Do NOT say "Here are flashcards"
    - Output must start with [ and end with ]

    Text:
    ${text}
    `;

    try {
      const response = await openRouter.post("/chat/completions", {
        model: "meta-llama/llama-3-8b-instruct",
        messages: [
      {
        role: "system",
        content: "You ONLY return valid JSON arrays. No extra text."
      },
      {
        role: "user",
        content: prompt
      }
    ],
  });

    const raw = response.data?.choices?.[0]?.message?.content;

    if (!raw) {
      console.error("Empty AI response");
      return [];
    }

    // Extract JSON safely
    let jsonMatch = raw.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      console.error("No JSON found in response:", raw);
      return [];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("JSON parse failed:", err.message);
      return [];
    }

    return parsed.map(card => ({
      questions: card.question,
      answer: card.answer,
      difficulty: "medium",
      lastReviewed: null,
      reviewCount: 0,
      isStarred: false
    }));

  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    return [];
  }
};

// ==========================================================
// 2. GENERATE QUIZ QUESTIONS
// ==========================================================
export const generateQuiz = async (text, numQuestions = 5) => {
  const prompt = `
You are an expert examiner.

Generate ${numQuestions} multiple-choice questions from the text.

Instructions:
- Each question must include:
  - question
  - 4 options
  - correctAnswer
  - explanation
- Difficulty: moderate
- Return ONLY valid JSON array, strictly like:
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

  try {
    // 1. Call AI
    const response = await openRouter.post("/chat/completions", {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        { role: "system", content: "Return ONLY a JSON array of questions. No extra text." },
        { role: "user", content: prompt }
      ],
    });

    let raw = response.data?.choices?.[0]?.message?.content || "";

    // 2. Clean quotes (AI sometimes returns single quotes)
    raw = raw.replace(/'/g, '"');

    // 3. Try parsing JSON
    let questions = [];
    try {
      questions = JSON.parse(raw);
    } catch {
      // Fallback: extract {..} blocks if JSON is broken
      const blocks = raw.match(/\{[^{}]*"question"[^{}]*\}/g) || [];
      questions = blocks.map(block => {
        const questionMatch = block.match(/"question"\s*:\s*"([^"]*)"/);
        const question = questionMatch ? questionMatch[1].trim() : "N/A";

        const optionsMatch = block.match(/"options"\s*:\s*\[([^\]]*)\]/);
        let options = optionsMatch
          ? optionsMatch[1].split(",").map(o => o.replace(/['"]/g, "").trim())
          : [];
        while (options.length < 4) options.push("N/A");
        if (options.length > 4) options = options.slice(0, 4);

        const correctMatch = block.match(/"correctAnswer"\s*:\s*"([^"]*)"/);
        const correctAnswer = correctMatch ? correctMatch[1].trim() : "N/A";

        const explanationMatch = block.match(/"explanation"\s*:\s*"([^"]*)"/);
        const explanation = explanationMatch ? explanationMatch[1].trim() : "N/A";

        return { question, options, correctAnswer, explanation };
      });
    }

    // 4. Convert options array to string to match schema
    const formattedQuestions = questions.map(q => {
  let optionsArray = [];

  // CASE 1: Already array
  if (Array.isArray(q.options)) {
    optionsArray = q.options;
  }

  // CASE 2: String like "A) ..., B) ..., C) ..., D) ..."
  else if (typeof q.options === "string") {
    optionsArray = q.options
      if (Array.isArray(q.options)) {
  optionsArray = q.options;
} else {
  optionsArray = [];
}

// Clean options
optionsArray = optionsArray.map(opt => opt.trim());

// Fix broken options (merge if >4)
if (optionsArray.length > 4) {
  optionsArray = optionsArray.slice(0, 3).concat(
    optionsArray.slice(3).join(", ")
  );
}

// Ensure exactly 4
while (optionsArray.length < 4) {
  optionsArray.push("N/A");
}
  }

  // Ensure exactly 4 options
  optionsArray = optionsArray.slice(0, 4);
  while (optionsArray.length < 4) {
    optionsArray.push("N/A");
  }

  return {
    question: q.question || "N/A",
    options: optionsArray, // KEEP AS ARRAY (important)
    correctAnswer: q.correctAnswer || "N/A",
    explanation: q.explanation || "N/A"
  };
});

  return formattedQuestions;

  } catch (err) {
    console.error("Quiz generation failed:", err.message);
    return [];
  }
};

// ==========================================================
// 3. GENERATE DOCUMENT SUMMARY
// ==========================================================
export const generateSummary = async (text) => {
  const prompt = `
Generate a detailed, structured summary of the text.

STRICT RULES:
- Return ONLY plain text
- No JSON
- No extra commentary

Text:
${text}
`;

  try {
    const response = await openRouter.post("/chat/completions", {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are an academic summarizer."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.data?.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    return "";
  }
};

// ==========================================================
// 4. CHAT WITH DOCUMENT CONTEXT
// ==========================================================
export const chatWithDocument = async (question, chunks) => {
  const context = chunks.map(c => c.content).join("\n");

  const prompt = `
Answer the question ONLY using the context below.

If not found, say:
"This information is not available in the provided document"

Context:
${context}

Question:
${question}
`;

  try {
    const response = await openRouter.post("/chat/completions", {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI tutor. Do not hallucinate."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.data?.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    return "";
  }
};

// ==========================================================
// 5. EXPLAIN A SPECIFIC CONCEPT
// ==========================================================
export const explainConcept = async (concept, context) => {
  const prompt = `
Explain the concept in a simple and detailed way.

Steps:
1. Simple explanation
2. Technical explanation
3. Example

Concept: ${concept}

Context:
${context}
`;

  try {
    const response = await openRouter.post("/chat/completions", {
      model: "meta-llama/llama-3-8b-instruct",
      messages: [
        {
          role: "system",
          content: "You are an expert teacher."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.data?.choices?.[0]?.message?.content || "";

  } catch (error) {
    console.error("OpenRouter API error:", error.response?.data || error.message);
    return "";
  }
};