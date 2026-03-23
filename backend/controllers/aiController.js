import Document from '../models/Document.js'
import Flashcard from '../models/Flashcard.js'
import Quiz from '../models/Quiz.js'
import ChatHistory from '../models/ChatHistory.js'
import * as geminiService from '../utils/geminiService.js'
import { findRelevantChunks} from '../utils/textChunker.js'
import { 
  generateFlashcards as generateFlashcardsAI,
  generateQuiz as generateQuizAI
} from "../utils/geminiService.js"

// @desc Generate flashcards from document
// @route POST /api/ai/generate-flashcards
// @access Private
export const generateFlashcards = async (req, res, next) => {
  try {
    const { documentId, count = 10 } = req.body;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        error: 'Please provide documentId',
        statusCode: 400
      });
    }

    const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    // Generate flashcards using AI helper
    const cards = await generateFlashcardsAI(document.extractedText, count);

    const flashcardSet = await Flashcard.create({
      userId: req.user._id,
      documentId: document._id,
      cards
    });

    res.status(201).json({
      success: true,
      data: flashcardSet,
      message: 'Flashcards generated successfully'
    });

  } catch (error) {
    next(error);
  }
};

// @desc Generate quiz from document
// @route POST /api/ai/generate-quiz
// @access Private
export const generateQuiz= async(req, res, next)=> {
    try {
        const {documentId, numQuestions= 5, title}= req.body

        if (!documentId) {
          return res.status(400).json({
            success: false,
            error: 'Please provide documentId',
            statusCode: 400
          });
        }

        const document = await Document.findOne({
      _id: documentId,
      userId: req.user._id,
      status: 'ready'
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found or not ready',
        statusCode: 404
      });
    }

    // Generate quiz using openRouter
      const questions = await generateQuizAI(
        document.extractedText,
        parseInt(numQuestions)
      );

      // Save to database
      const quiz = await Quiz.create({
        userId: req.user._id,
        documentId: document._id,
        title: title || `${document.title}- Quiz`,
        questions: questions,
        totalQuestions: questions.length,
        userAnswers: [],
        score: 0
      });

    res.status(201).json({
      success: true,
      data: quiz,
      message: 'Quiz generated successfully'
    });
    } catch (error) {
        next(error)
    }
}

// @desc Generate document summary
// @route POST /api/ai/generate-summary
// @access Private
export const generateSummary= async(req, res, next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc Chat with document
// @route POST /api/ai/chat
// @access Private
export const chat= async(req, res, next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc Explain concept from document
// @route POST /api/ai/explain-concept
// @access Private
export const explainConcept= async(req, res, next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc Get chat history for a  document
// @route GET /api/ai/generate-flashcards
// @access Private
export const getChatHistory= async(req, res, next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}