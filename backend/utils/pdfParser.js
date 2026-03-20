import fs from "fs";
import {PDFParse} from "pdf-parse";

/**
 * Parse PDF and extract text
 * @param {string} filePath - Path to uploaded PDF file
 * @returns {Promise<{text: string, numPages: number}>} extracted text
 */
export const extractedTextFromPDF = async (filePath) => {
  try {
    // Read file
    const dataBuffer = await fs.readFile(filePath);
    const parser= new PDFParse(new Uint8Array(dataBuffer))
    // Parse PDF
    const data = await parser.getText();

    return {
        text: data.text,
        numPages: data.numPages,
        info: data.info
    }
  } catch (error) {
    console.error("PDF parsing error:", error.message);
    throw new Error("Failed to parse PDF");
  }
};

