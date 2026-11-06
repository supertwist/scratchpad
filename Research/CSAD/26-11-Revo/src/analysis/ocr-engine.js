/**
 * OCR (Optical Character Recognition) engine for REBUILDER
 * Extracts text content from images using Tesseract.js
 */

const { createWorker } = require('tesseract.js');

/**
 * Extract text from an image using OCR
 * @param {Buffer} imageBuffer - Image buffer to extract text from  
 * @param {Object} options - OCR configuration options
 * @returns {Promise<Object>} Text regions and content
 */
async function extractTextFromImage(imageBuffer, options = {}) {
  try {
    // Create Tesseract worker
    const worker = await createWorker();
    
    // Configure OCR options
    const ocrOptions = {
      lang: 'eng',
      tessedit_pageseg_mode: 6, // Fully automatic page segmentation, but no OSD
      ...options
    };
    
    // Perform OCR on image
    const result = await worker.recognize(imageBuffer, ocrOptions);
    
    // Process results into structured format
    const textData = {
      fullText: result.data.text,
      blocks: result.data.blocks.map(block => ({
        text: block.lines.map(line => line.text).join('\n'),
        confidence: block.confidence,
        boundingBox: block.bbox,
        words: block.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          boundingBox: word.bbox
        }))
      })),
      lines: result.data.lines.map(line => ({
        text: line.text,
        confidence: line.confidence,
        boundingBox: line.bbox
      })),
      words: result.data.words.map(word => ({
        text: word.text,
        confidence: word.confidence,
        boundingBox: word.bbox
      }))
    };
    
    // Cleanup worker
    await worker.terminate();
    
    return textData;
  } catch (error) {
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
}

/**
 * Classify text elements by content type and significance  
 * @param {Object} textData - Raw OCR output
 * @returns {Promise<Object>} Classified text elements
 */
async function classifyTextElements(textData) {
  try {
    // Simple categorization based on content patterns
    const classifiedElements = {
      headings: [],
      subheadings: [], 
      bodyText: [],
      labels: [],
      categories: []
    };
    
    // Process lines of text to categorize them
    for (const line of textData.lines) {
      // Determine category based on heuristics
      if (isHeading(line.text)) {
        classifiedElements.headings.push(line);
      } else if (isSubheading(line.text)) {
        classifiedElements.subheadings.push(line);
      } else if (isLabel(line.text)) {
        classifiedElements.labels.push(line);
      } else {
        classifiedElements.bodyText.push(line);
      }
    }
    
    return classifiedElements;
  } catch (error) {
    throw new Error(`Text classification failed: ${error.message}`);
  }
}

/**
 * Determine if text is a heading based on content patterns
 * @param {string} text - Text to analyze
 * @returns {boolean} Whether text is likely a heading
 */
function isHeading(text) {
  // Headings tend to be in all caps, bold, or have distinct formatting
  return text.length > 5 && 
         (text.toUpperCase() === text || 
          text.startsWith('PRODUCT') ||
          text.startsWith('CATEGORY') ||
          text.startsWith('USAGE') ||
          text.startsWith('KEY'));
}

/**
 * Determine if text is a subheading  
 * @param {string} text - Text to analyze
 * @returns {boolean} Whether text is likely a subheading
 */
function isSubheading(text) {
  // Subheadings are typically descriptive titles of sections
  return text.includes(':') || 
         (text.length > 10 && 
          text.endsWith('}') ||
          text.includes('Environment') ||
          text.includes('Strength'));
}

/**
 * Determine if text is a label
 * @param {string} text - Text to analyze  
 * @returns {boolean} Whether text is likely a label
 */
function isLabel(text) {
  // Labels are often keywords or categorizations
  return text.length < 20 && 
         !text.includes(' ') &&
         (text.endsWith(':') || 
          text.includes(' '));
}

module.exports = { extractTextFromImage, classifyTextElements };