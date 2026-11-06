/**
 * SVG Generator for REBUILDER
 * Creates vector SVG representations from image analysis data
 */

const { LayoutEngine } = require('./layout-engine');

class SVGGenerator {
  /**
   * Generate SVG from analyzed image data
   * @param {Object} imageData - Processed image data from analysis components  
   * @returns {Promise<string>} SVG content as string
   */
  async generateSVG(imageData) {
    try {
      // Initialize layout engine
      const layoutEngine = new LayoutEngine();
      
      // Generate layout based on spatial analysis
      const svgContent = await layoutEngine.generateLayout(imageData.spatial, imageData.text);
      
      return svgContent;
    } catch (error) {
      throw new Error(`SVG generation failed: ${error.message}`);
    }
  }
}

// Export the generator as module
module.exports = { SVGGenerator };

/**
 * Generate SVG from analyzed data (utility function)
 * @param {Object} analysisData - Result from all analysis components  
 * @returns {Promise<string>} SVG content as string
 */
async function generateSVG(analysisData) {
  const generator = new SVGGenerator();
  return await generator.generateSVG(analysisData);
}

module.exports = { generateSVG, SVGGenerator };