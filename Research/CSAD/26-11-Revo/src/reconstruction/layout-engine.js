/**
 * Layout Engine for REBUILDER
 * Generates proper SVG layout structure based on spatial analysis
 */

class LayoutEngine {
  /**
   * Generate SVG layout from spatial analysis
   * @param {Object} spatialData - Spatial analysis results from SpatialAnalyzer
   * @param {Object} textData - Text extraction results  
   * @returns {Promise<string>} SVG content with proper layout structure
   */
  async generateLayout(spatialData, textData) {
    try {
      // Create main SVG structure
      const svgContent = [
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
        '<svg width="' + spatialData.canvas.width + '" height="' + spatialData.canvas.height + '" viewBox="0 0 ' + 
        spatialData.canvas.width + ' ' + spatialData.canvas.height + '" xmlns="http://www.w3.org/2000/svg">'
      ];
      
      // Add CSS styles for different element types
      svgContent.push(this.generateStyles());
      
      // Process each group of elements according to their spatial relationships
      const groups = this.organizeElementsIntoGroups(spatialData);
      
      // Create SVG groups for logical organization  
      svgContent.push('<g id="rebuilder-content" transform="translate(20, 20)">');
      
      // Process text elements 
      if (textData && textData.lines && textData.lines.length > 0) {
        const textElements = this.processTextElements(textData);
        svgContent.push(...textElements);
      }
      
      // Process spatially related groups
      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        
        if (group.type === 'text') {
          // Add text group
          svgContent.push(this.createTextGroup(group));
        } else if (group.type === 'graphic') {
          // Add graphic elements  
          svgContent.push(this.createGraphicGroup(group));
        }
      }
      
      // Close main container
      svgContent.push('</g>');
      
      // Add metadata
      svgContent.push(this.generateMetadata());
      
      svgContent.push('</svg>');
      
      return svgContent.join('\n');
    } catch (error) {
      throw new Error(`Layout generation failed: ${error.message}`);
    }
  }

  /**
   * Organize elements into logical groups based on spatial analysis
   * @param {Object} spatialData - Spatial analysis results  
   * @returns {Array} Organized element groups
   */
  organizeElementsIntoGroups(spatialData) {
    const groups = [];
    
    if (!spatialData.groups || spatialData.groups.length === 0) {
      // Fallback to organizing elements directly
      return this.fallbackGrouping(spatialData.elements);
    }
    
    // Use the identified groups from spatial analysis 
    spatialData.groups.forEach(group => {
      const groupElements = {
        id: group.id,
        type: this.determineGroupType(group.elements),
        elements: group.elements,
        boundingBox: group.boundingBox,
        centroid: group.centroid
      };
      
      groups.push(groupElements);
    });
    
    // Also add individual elements that weren't grouped  
    const groupedElementIds = new Set(groups.map(g => g.elements.map(e => e.id)).flat());
    
    spatialData.elements.forEach(element => {
      if (!groupedElementIds.has(element.id)) {
        const singleGroup = {
          id: `single-${element.id}`,
          type: this.determineElementType(element),
          elements: [element],
          boundingBox: element.boundingBox,
          centroid: {
            x: element.boundingBox.x + (element.boundingBox.width / 2),
            y: element.boundingBox.y + (element.boundingBox.height / 2)
          }
        };
        
        groups.push(singleGroup);
      }
    });
    
    return groups;
  }

  /**
   * Fallback grouping when no spatial groups are detected
   * @param {Array} elements - Elements to group  
   * @returns {Array} Grouped elements
   */
  fallbackGrouping(elements) {
    const groups = [];
    
    // Simple logical grouping by type
    const groupedByType = {};
    
    elements.forEach(element => {
      const type = this.determineElementType(element);
      
      if (!groupedByType[type]) {
        groupedByType[type] = [];
      }
      
      groupedByType[type].push(element);
    });
    
    // Convert to groups
    Object.keys(groupedByType).forEach(type => {
      if (groupedByType[type].length > 0) {
        const group = {
          id: `fallback-${type}`,
          type: type,
          elements: groupedByType[type],
          boundingBox: this.calculateGroupBBox(groupedByType[type]),
          centroid: this.calculateGroupCentroid(groupedByType[type])
        };
        
        groups.push(group);
      }
    });
    
    return groups;
  }

  /**
   * Determine element type from spatial analysis
   * @param {Object} element - Element to analyze  
   * @returns {string} Element type (text, graphic, image)
   */
  determineElementType(element) {
    if (element.type) {
      return element.type;
    }
    
    // If no explicit type, infer from element characteristics  
    if (element.label && element.label.includes('text')) {
      return 'text';
    }
    
    if (element.label && element.label.includes('image')) {
      return 'image';
    }
    
    // Default to graphic
    return 'graphic';
  }

  /**
   * Determine group type from elements
   * @param {Array} elements - Elements in group  
   * @returns {string} Group type 
   */
  determineGroupType(elements) {
    if (!elements || elements.length === 0) return 'unknown';
    
    // Check first element for type, then validate
    const firstElement = elements[0];
    const elementType = this.determineElementType(firstElement);
    
    // If all elements in group are of same type, use that type
    const allSameType = elements.every(e => this.determineElementType(e) === elementType);
    
    if (allSameType) {
      return elementType;
    }
    
    return 'mixed';
  }

  /**
   * Calculate bounding box for a group of elements
   * @param {Array} elements - Elements to calculate BBox for  
   * @returns {Object} Bounding box coordinates
   */
  calculateGroupBBox(elements) {
    if (!elements || elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = Infinity;
    let minY = Infinity; 
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    elements.forEach(element => {
      const { x, y, width, height } = element.boundingBox;
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate centroid for a group of elements
   * @param {Array} elements - Elements to calculate centroid for
   * @returns {Object} Centroid coordinates  
   */
  calculateGroupCentroid(elements) {
    if (!elements || elements.length === 0) return { x: 0, y: 0 };
    
    let totalX = 0;
    let totalY = 0;
    
    elements.forEach(element => {
      const centerX = element.boundingBox.x + (element.boundingBox.width / 2);
      const centerY = element.boundingBox.y + (element.boundingBox.height / 2);
      
      totalX += centerX;
      totalY += centerY;
    });
    
    return {
      x: totalX / elements.length,
      y: totalY / elements.length
    };
  }

  /**
   * Process text elements with proper layout
   * @param {Object} textData - Text extraction results
   * @returns {Array} SVG content for text elements
   */
  processTextElements(textData) {
    const svgContent = [];
    
    // Group lines by approximate Y position (vertical alignment)
    const lineGroups = {};
    
    textData.lines.forEach(line => {
      const centerY = line.boundingBox.y + (line.boundingBox.height / 2);
      const linePosition = Math.round(centerY / 15) * 15; // Group by 15px vertical spacing
      
      if (!lineGroups[linePosition]) {
        lineGroups[linePosition] = [];
      }
      
      lineGroups[linePosition].push(line);
    });
    
    // Create individual lines
    Object.keys(lineGroups).forEach(position => {
      const lines = lineGroups[position];
      lines.sort((a, b) => a.boundingBox.x - b.boundingBox.x); // Sort by X position
      
      // Group into paragraphs if necessary
      let currentParagraph = [];
      let paragraphStartY = lines[0].boundingBox.y;
      
      lines.forEach(line => {
        const lineY = line.boundingBox.y;
        
        if (Math.abs(lineY - paragraphStartY) < 15 || currentParagraph.length === 0) {
          currentParagraph.push(line);
        } else {
          // Start new paragraph
          svgContent.push(...this.createTextParagraph(currentParagraph));
          currentParagraph = [line];
          paragraphStartY = lineY;
        }
      });
      
      if (currentParagraph.length > 0) {
        svgContent.push(...this.createTextParagraph(currentParagraph));
      }
    });
    
    return svgContent;
  }

  /**
   * Create SVG text element for a paragraph
   * @param {Array} lines - Lines in paragraph  
   * @returns {Array} SVG content for paragraph
   */
  createTextParagraph(lines) {
    const svgContent = [];
    
    const firstLine = lines[0];
    const yPosition = firstLine.boundingBox.y;
    
    // Determine if it's a heading or body based on style heuristics:
    // - Headings are typically larger, bold, and at the top
    // - Body text is smaller and spaced regularly
    
    let className = 'body-text';
    
    // Simple heuristic: first line in paragraph with significant size might be title
    if (firstLine.boundingBox.height > 20 && lines.length === 1) {
      className = 'heading-text';
    }
    
    // Create text element that contains all lines from this group
    const fullText = lines.map(line => line.text).join(' ');
    
    svgContent.push(
      `<text x="${firstLine.boundingBox.x}" y="${yPosition}" class="${className}">`,
      fullText,
      '</text>'
    );
    
    return svgContent;
  }

  /**
   * Create SVG group for text elements
   * @param {Object} group - Text element group  
   * @returns {string} SVG group content
   */
  createTextGroup(group) {
    if (!group.elements || group.elements.length === 0) return '';
    
    const svgContent = [];
    
    // Add group container with ID
    svgContent.push(`<g id="${group.id}" class="text-group">`);
    
    // Add individual text elements 
    group.elements.forEach(element => {
      const x = element.boundingBox.x;
      const y = element.boundingBox.y + (element.boundingBox.height / 2); // Center vertically
      
      // Determine appropriate class based on element characteristics
      let className = 'body-text';
      
      if (element.boundingBox.height > 20) {
        className = 'heading-text';
      }
      
      svgContent.push(
        `<text x="${x}" y="${y}" class="${className}">${this.escapeXml(element.text || '')}</text>`
      );
    });
    
    svgContent.push('</g>');
    
    return svgContent.join('\n');
  }

  /**
   * Create SVG group for graphic elements
   * @param {Object} group - Graphic element group  
   * @returns {string} SVG group content
   */
  createGraphicGroup(group) {
    if (!group.elements || group.elements.length === 0) return '';
    
    const svgContent = [];
    
    // Add group container with ID 
    svgContent.push(`<g id="${group.id}" class="graphic-group">`);
    
    group.elements.forEach(element => {
      // Handle different graphic types based on element characteristics
      if (element.type === 'line' || element.label === 'line') {
        this.createLineElement(svgContent, element);
      } else if (element.type === 'rectangle' || element.label === 'rectangle') {
        this.createRectangleElement(svgContent, element);
      } else if (this.isImageElement(element)) {
        this.createImageElement(svgContent, element);
      } else {
        // Default to rectangle for unknown types
        this.createRectangleElement(svgContent, element);
      }
    });
    
    svgContent.push('</g>');
    
    return svgContent.join('\n');
  }

  /**
   * Create SVG line element
   * @param {Array} svgContent - SVG content array to append to  
   * @param {Object} element - Line element to create
   */
  createLineElement(svgContent, element) {
    const x1 = element.boundingBox.x;
    const y1 = element.boundingBox.y;
    const x2 = element.boundingBox.x + element.boundingBox.width; 
    const y2 = element.boundingBox.y + element.boundingBox.height;
    
    svgContent.push(
      `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="graphic-line"/>`
    );
  }

  /**
   * Create SVG rectangle element
   * @param {Array} svgContent - SVG content array to append to  
   * @param {Object} element - Rectangle element to create
   */
  createRectangleElement(svgContent, element) {
    const x = element.boundingBox.x;
    const y = element.boundingBox.y;
    const width = element.boundingBox.width;
    const height = element.boundingBox.height;
    
    svgContent.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="graphic-rectangle"/>`
    );
  }

  /**
   * Create SVG image element
   * @param {Array} svgContent - SVG content array to append to  
   * @param {Object} element - Image element to create
   */
  createImageElement(svgContent, element) {
    // For embedded images, we'd need the actual image data in a real implementation
    // Here we'll just create a placeholder rectangle as an example
    
    const x = element.boundingBox.x;
    const y = element.boundingBox.y;
    const width = element.boundingBox.width;
    const height = element.boundingBox.height;
    
    svgContent.push(
      `<rect x="${x}" y="${y}" width="${width}" height="${height}" class="embedded-image-placeholder"/>`
    );
  }

  /**
   * Determine if an element is an image type
   * @param {Object} element - Element to check  
   * @returns {boolean} Whether it's an image element
   */
  isImageElement(element) {
    const imageLabels = ['image', 'photo', 'picture', 'embedded'];
    const label = (element.label || '').toLowerCase();
    
    return imageLabels.some(imgLabel => label.includes(imgLabel));
  }

  /**
   * Generate CSS styles for SVG elements
   * @returns {string} CSS style declarations
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
    
    .embedded-image-placeholder {
      fill: #e9ecef;
      stroke: #adb5bd;
      stroke-width: 1;
      stroke-dasharray: 5,5;
    }
    
    .text-group {
      opacity: 1;
    }
    
    .graphic-group {
      opacity: 1;
    }
  </style>`;
  }

  /**
   * Generate metadata section with REBUILDER information
   * @returns {string} Metadata XML content
   */
  generateMetadata() {
    return `
  <metadata>
    <rebuilder version="1.0" created="${new Date().toISOString()}">
      <processing>
        <spatial-analysis>
          <groups count="0"/>
        </spatial-analysis>
      </processing>
    </rebuilder>
  </metadata>`;
  }

  /**
   * Escape XML special characters in text
   * @param {string} text - Text to escape  
   * @returns {string} Escaped text
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

module.exports = { LayoutEngine };