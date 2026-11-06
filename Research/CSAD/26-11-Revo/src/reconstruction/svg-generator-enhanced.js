/**
 * Enhanced SVG Generator for REBUILDER
 * Uses spatial analysis to create properly positioned SVG output
 */

const { EnhancedLayoutEngine } = require('./layout-engine-enhanced');

class EnhancedSVGGenerator {
  /**
   * Generate SVG from analyzed image data with spatial awareness
   * @param {Object} imageData - Processed image data from analysis components  
   * @returns {Promise<string>} SVG content as string
   */
  async generateSVG(imageData) {
    try {
      // Initialize enhanced layout engine
      const layoutEngine = new EnhancedLayoutEngine();
      
      // Generate layout based on spatial analysis and text data
      const svgContent = await layoutEngine.generateLayout(imageData.spatial, imageData.text);
      
      return svgContent;
    } catch (error) {
      throw new Error(`Enhanced SVG generation failed: ${error.message}`);
    }
  }
}

// Export the generator as module  
module.exports = { EnhancedSVGGenerator };

/**
 * Generate SVG from analyzed data (utility function)
 * @param {Object} analysisData - Result from all analysis components  
 * @returns {Promise<string>} SVG content as string
 */
async function generateSVG(analysisData) {
  const generator = new EnhancedSVGGenerator();
  return await generator.generateSVG(analysisData);
}

module.exports = { generateSVG, EnhancedSVGGenerator };