import Document from "../models/Document.js";
import Flashcard from '../models/Flashcard.js'
import Quiz from '../models/Quiz.js'
import {chunkText} from '../utils/textChunker.js'
import fs from 'fs/promises'
import mongoose from "mongoose"; 
import { extractedTextFromPDF } from "../utils/pdfParser.js";

// @desc Upload PDF document
// @route POST /api/documents/upload
// @access Private
export const uploadDocument= async (req, res, next)=> {
    try {
        if(!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Please upload a PDF file',
                statusCode: 400
            })
        }

        const {title} =req.body

        if(!title) {
            // Delete uploaded file if no title provided
            await fs.unlink(req.file.path)
            return res.status(400).json({
                success: false,
                error: 'Please provide a document title',
                statusCode: 400
            })
        }

        // Construct the URL for the uploaded file
        const baseUrl= `http://localhost:${process.env.PORT || 8000}`
        const fileUrl= `${baseUrl}/uploads/documents/${req.file.filename}`

        // Create document record
        const document= await Document.create({
            userId: req.user._id,
            title,
            fileName: req.file.originalname,
            filePath: fileUrl, // Store the URL instead of the local path
            fileSize: req.file.size,
            status: 'processing'
        })

            // Process PDF in backgroud (in production, use a queue like Bull)
            processPDF(document._id, req.file.path).catch(err=> {
                console.error('PDF processing error:', err)
            })

            res.status(201).json({
                success: true,
                data: document,
                message: 'Document uploaded successfully. Processing in progress...',
            })
        
    } catch (error) {
        // Clean up file on error
        if(req.file) {
            await fs.unlink(req.file.path).catch(()=> {})
        }
        next(error)
    }
}

// Helper function to process PDF
const processPDF= async(documentId, filePath)=> {
    try {
        const data= await extractedTextFromPDF(filePath)
        const text= data.text

        // Create chunks
        const chunks= chunkText(text, 500)

        // Update document
        await Document.findByIdAndUpdate(documentId, {
            extractedText: text,
            chunks: chunks,
            status: 'ready'
        })

    } catch (error) {
        console.error(`Error processing document ${documentId}:`, error)

        await Document.findByIdAndUpdate(documentId, {
            status: 'failed'
        })
    }
}

// @desc Get all user documents
// @route GET /api/documents
// @access Private
export const getDocuments= async(req, res, next)=> {
    try {
        const documents= await Document.aggregate([
            {
                $match: {userId: new mongoose.Types.ObjectId(req.user._id)}
            },
            {
                $lookup: {
                    from: 'flashcards',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'flashcardSets'
                }
            },
            {
                $lookup: {
                    from: 'quizzes',
                    localField: '_id',
                    foreignField: 'documentId',
                    as: 'quizzes'
                }
            },
            {
                $addFields: {
                    flashcardCount: {$size: '$flashcardSets'},
                    quizCount: {$size: '$quizzes'}
                }
            },
            {
                $project: {
                    extractedText: 0,
                    chunks: 0,
                    flashcardSets: 0,
                    quizzes: 0
                }
            }, {
                $sort: {uploadData: -1}
            }
        ])

        res.status(200).json({
            success: true,
            count: documents.length,
            data: documents,
        })
    } catch (error) {
        next(error)
    }
}

// @desc Get single user document with chunk
// @route GET /api/documents/:id
// @access Private
export const getDocument= async(req, res,next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc Delete document
// @route DELETE /api/documents/:id
// @access Private
export const deleteDocument= async(req, res,next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

// @desc Update document
// @route PUT /api/documents/:id
// @access Private
export const updateDocument= async(req, res,next)=> {
    try {
        
    } catch (error) {
        next(error)
    }
}

