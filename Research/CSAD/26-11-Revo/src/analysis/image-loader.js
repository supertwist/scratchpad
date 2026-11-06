/**
 * Image loader and preprocessor for REBUILDER
 * Handles loading, preprocessing, and metadata extraction
 */

const sharp = require('sharp');
const fs = require('fs');

/**
 * Load and process an image file
 * @param {string} imagePath - Path to the input image file
 * @returns {Promise<Object>} Processed image data with metadata
 */
async function processImage(imagePath) {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Input file not found: ${imagePath}`);
    }

    // Get image metadata using sharp
    const metadata = await sharp(imagePath).metadata();
    
    // Load image buffer for further processing
    const imageBuffer = await sharp(imagePath)
      .png() // Convert to PNG format for consistent handling
      .toBuffer();

    return {
      path: imagePath,
      buffer: imageBuffer,
      metadata: metadata,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      channels: metadata.channels,
      density: metadata.density || 72, // Default to 72 DPI if not specified
      hasAlpha: metadata.hasAlpha || false
    };
  } catch (error) {
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

/**
 * Apply preprocessing to the image (optional)
 * @param {Object} imageData - Processed image data from processImage
 * @param {Object} options - Preprocessing options
 * @returns {Promise<Object>} Preprocessed image data  
 */
async function preprocessImage(imageData, options = {}) {
  try {
    let pipeline = sharp(imageData.buffer);
    
    // Apply preprocessing based on options
    if (options.resize) {
      pipeline = pipeline.resize(options.resize.width, options.resize.height);
    }
    
    if (options.normalize) {
      pipeline = pipeline.normalize();
    }
    
    if (options.threshold) {
      pipeline = pipeline.threshold(options.threshold);
    }
    
    // Convert back to buffer
    const processedBuffer = await pipeline.toBuffer();
    
    return {
      ...imageData,
      buffer: processedBuffer
    };
  } catch (error) {
    throw new Error(`Failed to preprocess image: ${error.message}`);
  }
}

module.exports = { processImage, preprocessImage };