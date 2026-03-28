import axiosInstance from "../utils/axiosInstance";
import { API_PATHS } from "../utils/apiPaths";

const generateFlashcards= async(documentId, options)=> {
    try {
        const response= await axiosInstance.post(API_PATHS.AI.GENERATE_FLASHCARDS, {documentId, ...options})
        return response.data
    } catch (error) {
        throw error.response?.data || {message: 'An unknown error occurred'}
    }
}

const generateQuiz= async(documentId, options)=> {
    try {
        const response= await axiosInstance.post(API_PATHS.AI.GENERATE_QUIZ, {documentId, ...options})
        return response.data
    } catch (error) {
        throw error.response?.data || {message: 'An unknown error occurred'}
    }
}

const generateSummary= async(documentId)=> {
    try {
        const response= await axiosInstance.post(API_PATHS.AI.GENERATE_SUMMARY, {documentId})
        return response.data?.data
    } catch (error) {
        throw error.response?.data || {message: 'An unknown error occurred'}
    }
}

const chat= async(documentId, message)=> {
    try {
        const response= await axiosInstance.post(API_PATHS.AI.CHAT, {documentId, question: message})
        return response.data
    } catch (error) {
        throw error.response?.data || {message: 'An unknown error occurred'}
    }
}

const explainConcept= async(documentId, concept)=> {
    try {
        const response= await axiosInstance.post(API_PATHS.AI.EXPLAIN_CONCEPT, {documentId, concept})
        return response.data?.data
    } catch (error) {
        throw error.response?.data || {message: 'An unknown error occurred'}
    }
}

const getChatHistory= async(documentId)=> {
    try {
        console.log("STEP 6 - API URL:", `/chat-history/${documentId}`)

        const response= await axiosInstance.get(API_PATHS.AI.GET_CHAT_HISTORY(documentId))
        console.log("STEP 7 - RAW RESPONSE:", response)
        return response.data
    } catch (error) {
        console.error("STEP 8 - SERVICE ERROR:", error.response || error)
    }
}

const aiService= {
    generateFlashcards,
    generateQuiz,
    generateSummary,
    explainConcept,
    chat,
    getChatHistory
}

export default aiService