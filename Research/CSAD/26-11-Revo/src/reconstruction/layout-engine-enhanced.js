/**
 * Enhanced Layout Engine for REBUILDER
 * Properly uses spatial analysis to generate SVG with correct element positioning  
 */

class EnhancedLayoutEngine {
  /**
   * Generate SVG layout from spatial analysis with proper positioning
   * @param {Object} spatialData - Spatial analysis results 
   * @param {Object} textData - Text extraction results  
   * @returns {Promise<string>} SVG content with accurate layout structure
   */
  async generateLayout(spatialData, textData) {
    try {
      // Create main SVG structure with proper dimensions
      const svgContent = [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
        `<svg width="${spatialData.canvas.width}" height="${spatialData.canvas.height}" viewBox="0 0 ${spatialData.canvas.width} ${spatialData.canvas.height}" xmlns="http://www.w3.org/2000/svg">`
      ];
      
      // Add CSS styles
      svgContent.push(this.generateStyles());
      
      // Add the main content container with proper positioning
      svgContent.push('<g id="rebuilder-content" transform="translate(20, 20)">');
      
      // Process text elements using spatial relationships
      if (textData && textData.lines && textData.lines.length > 0) {
        const textElements = this.processTextElements(spatialData, textData);
        svgContent.push(...textElements);
      }
      
      // Process graphical elements
      if (spatialData.groups && spatialData.groups.length > 0) {
        const graphics = this.processGraphicalElements(spatialData);
        svgContent.push(...graphics);
      }
      
      // Close main container and add metadata
      svgContent.push('</g>');
      svgContent.push(this.generateMetadata());
      svgContent.push('</svg>');
      
      return svgContent.join('\n');
    } catch (error) {
      throw new Error(`Layout generation failed: ${error.message}`);
    }
  }

  /**
   * Process text elements using spatial analysis
   * @param {Object} spatialData - Spatial relationships data
   * @param {Object} textData - Text extraction results  
   * @returns {Array} SVG content for text elements
   */
  processTextElements(spatialData, textData) {
    const svgContent = [];
    
    // Group lines based on vertical position (using spatial analysis)
    const lineGroups = {};

    // If we have spatial groups that contain text, use those
    if (spatialData.groups && spatialData.groups.length > 0) {
      spatialData.groups.forEach(group => {
        // Only process groups that contain text elements or are likely to be text-related
        if (group.elements && group.elements.length > 0) {
          const hasText = group.elements.some(el => 
            el.type === 'text' || 
            el.label === 'text' || 
            (el.text && el.text.length > 0)
          );
          
          if (hasText) {
            // Sort elements in the group by Y position (top to bottom)
            const sortedElements = [...group.elements].sort((a, b) => {
              return a.boundingBox.y - b.boundingBox.y;
            });
            
            // Group them by approximate Y alignment
            let currentYGroup = [];
            let lastY = null;
            
            sortedElements.forEach(element => {
              const centerY = element.boundingBox.y + (element.boundingBox.height / 2);
              
              if (lastY === null || Math.abs(centerY - lastY) < 15) {
                // Same Y-group
                currentYGroup.push(element);
              } else {
                // New Y-group, process previous one
                if (currentYGroup.length > 0) {
                  svgContent.push(...this.createTextLineGroup(currentYGroup));
                }
                currentYGroup = [element];
              }
              lastY = centerY;
            });
            
            // Process final group
            if (currentYGroup.length > 0) {
              svgContent.push(...this.createTextLineGroup(currentYGroup));
            }
          }
        }
      });
    } else {
      // Fallback to processing individual text lines
      let currentYGroups = {};
      textData.lines.forEach((line, i) => {
        const centerY = line.boundingBox.y + (line.boundingBox.height / 2);
        const yKey = Math.round(centerY / 10) * 10; // Group by Y position
        
        if (!currentYGroups[yKey]) {
          currentYGroups[yKey] = [];
        }
        currentYGroups[yKey].push(line);
      });
      
      // Sort and process groups
      Object.keys(currentYGroups)
        .sort((a, b) => a - b)
        .forEach(yKey => {
          const lines = currentYGroups[yKey];
          if (lines.length === 1) {
            svgContent.push(this.createSingleTextElement(lines[0]));
          } else {
            svgContent.push(...this.createMultiLineGroup(lines));
          }
        });
    }
    
    return svgContent;
  }

  /**
   * Create a group of text lines that are on the same Y coordinate
   */
  createTextLineGroup(elements) {
    const svgContent = [];
    
    if (elements.length === 0) return svgContent;
    
    // Use the first element's X position as reference for left alignment
    const xStart = elements[0].boundingBox.x;
    const yStart = elements[0].boundingBox.y;
    
    // For multiple lines in same vertical group, create them with proper spacing
    elements.forEach((element, index) => {
      svgContent.push(this.createSingleTextElement(element));
    });
    
    return svgContent;
  }

  /**
   * Create a single text element
   */
  createSingleTextElement(element) {
    const x = element.boundingBox.x;
    const y = element.boundingBox.y + (element.boundingBox.height / 2); // Center vertically
    
    // Determine appropriate class based on element characteristics  
    let className = 'body-text';
    
    // Simple heuristics for headings vs body text
    if (element.boundingBox.height > 20) {
      className = 'heading-text';
    }
    
    const textContent = this.escapeXml(element.text || '');
    
    return `<text x="${x}" y="${y}" class="${className}">${textContent}</text>`;
  }

  /**
   * Create a multi-line group with proper alignment
   */
  createMultiLineGroup(lines) {
    const svgContent = [];
    
    if (lines.length === 0) return svgContent;
    
    // For multiple lines, we create them individually
    lines.forEach(line => {
      svgContent.push(this.createSingleTextElement(line));
    });
    
    return svgContent;  
  }

  /**
   * Process graphical elements using spatial positioning
   * @param {Object} spatialData - Spatial analysis results
   * @returns {Array} SVG content for graphical elements
   */
  processGraphicalElements(spatialData) {
    const svgContent = [];
    
    if (!spatialData.groups || spatialData.groups.length === 0) return svgContent;
    
    // Process each group with proper positioning based on spatial relationships
    spatialData.groups.forEach(group => {
      if (!group.elements || group.elements.length === 0) return;
      
      // Create SVG group container for this element grouping
      svgContent.push(`<g id="${group.id}" class="spatial-group">`);
      
      // Process each element in the group with its correct position
      group.elements.forEach(element => {
        const x = element.boundingBox.x;
        const y = element.boundingBox.y;
        const width = element.boundingBox.width;
        const height = element.boundingBox.height;
        
        if (element.type === 'graphic' || element.label === 'line') {
          // Create line elements
          svgContent.push(
            `<line x1="${x}" y1="${y}" x2="${x + width}" y2="${y + height}" class="graphic-line"/>`
          );
        } else if (element.type === 'rectangle' || element.label === 'rectangle') {
          // Create rectangle elements  
          svgContent.push(
            `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="graphic-rectangle"/>`
          );
        } else {
          // Default to rectangle for unknown types
          svgContent.push(
            `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="graphic-element"/>`
          );
        }
      });
      
      svgContent.push('</g>');
    });
    
    return svgContent;
  }

  /**
   * Generate CSS styles for SVG elements
   */
  generateStyles() {
    return `
  <style>
    .heading-text {
      font-family: Arial, sans-serif;
      font-size: 20px;
      font-weight: bold;
      fill: #000000;
    }
    
    .body-text {
      font-family: Arial, sans-serif;
      font-size: 14px;
      fill: #333333;
    }
    
    .graphic-line {
      stroke: #000000;
      stroke-width: 1;
    }
    
    .graphic-rectangle {
      fill: none;
      stroke: #000000;
      stroke-width: 1;
    }
    
    .graphic-element {
      fill: none;
      stroke: #555555;
      stroke-width: 1;
    }
    
    .spatial-group {
      opacity: 1;
    }
  </style>`;
  }

  /**
   * Generate metadata section with REBUILDER information
   */
  generateMetadata() {
    return `
  <metadata>
    <rebuilder version="1.0" created="${new Date().toISOString()}">
      <processing>
        <spatial-analysis-complete>true</spatial-analysis-complete>
      </processing>
    </rebuilder>
  </metadata>`;
  }

  /**
   * Escape XML special characters in text
   */
  escapeXml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

module.exports = { EnhancedLayoutEngine };