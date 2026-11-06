/**
 * Spatial Analyzer for REBUILDER
 * Detects and analyzes spatial relationships between elements in images
 */

class SpatialAnalyzer {
  /**
   * Analyze spatial relationships in an image
   * @param {Object} imageData - Processed image data 
   * @param {Array} detectedElements - Elements from object detection
   * @returns {Promise<Object>} Spatial relationship analysis
   */
  async analyzeSpatialRelationships(imageData, detectedElements) {
    try {
      // Get image dimensions from metadata
      const { width, height } = imageData.metadata;
      
      // Analyze element positions and relationships
      const spatialData = {
        elements: detectedElements || [],
        canvas: { width, height },
        layout: await this.determineLayoutStructure(detectedElements),
        groups: await this.identifyElementGroups(detectedElements),
        alignment: await this.analyzeAlignment(detectedElements),
        hierarchy: await this.buildHierarchy(detectedElements)
      };
      
      return spatialData;
    } catch (error) {
      throw new Error(`Spatial analysis failed: ${error.message}`);
    }
  }

  /**
   * Determine overall layout structure (grid, column, row, etc.)
   * @param {Array} elements - Detected elements
   * @returns {Promise<Object>} Layout structure information
   */
  async determineLayoutStructure(elements) {
    if (!elements || elements.length === 0) {
      return { type: 'unknown', confidence: 0 };
    }

    // Calculate centroids and positions of all elements
    const centroids = elements.map(element => ({
      id: element.id,
      x: element.boundingBox.x + (element.boundingBox.width / 2),
      y: element.boundingBox.y + (element.boundingBox.height / 2)
    }));

    // Simplified approach - in real implementation this would be more sophisticated
    const xPositions = centroids.map(c => c.x);
    const yPositions = centroids.map(c => c.y);
    
    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);
    
    // Determine if elements are arranged in rows or columns
    let layoutType = 'mixed';
    let confidence = 0.5;
    
    if (xRange > yRange && xRange > 100) {
      layoutType = 'row-based';
      confidence = Math.min(1, xRange / 500); // Higher range = more likely to be row-based
    } else if (yRange > xRange && yRange > 100) {
      layoutType = 'column-based';  
      confidence = Math.min(1, yRange / 500); // Higher range = more likely to be column-based
    }
    
    return {
      type: layoutType,
      confidence: Math.min(confidence, 1),
      dimensions: {
        rows: Math.round(yRange / 50), // Simplified row estimation
        columns: Math.round(xRange / 50) // Simplified column estimation
      }
    };
  }

  /**
   * Identify groups of related elements
   * @param {Array} elements - Detected elements
   * @returns {Promise<Array>} Element groups with spatial relationships
   */
  async identifyElementGroups(elements) {
    if (!elements || elements.length === 0) return [];
    
    const groups = [];
    const visited = new Set();
    
    for (let i = 0; i < elements.length; i++) {
      if (visited.has(i)) continue;
      
      const group = [elements[i]];
      visited.add(i);
      
      // Find nearby elements that might be part of the same group
      for (let j = i + 1; j < elements.length; j++) {
        if (visited.has(j)) continue;
        
        const elementA = elements[i];
        const elementB = elements[j];
        
        // Calculate distance between elements
        const centerXA = elementA.boundingBox.x + (elementA.boundingBox.width / 2);
        const centerYA = elementA.boundingBox.y + (elementA.boundingBox.height / 2);
        const centerXB = elementB.boundingBox.x + (elementB.boundingBox.width / 2);
        const centerYB = elementB.boundingBox.y + (elementB.boundingBox.height / 2);
        
        const distance = Math.sqrt(
          Math.pow(centerXA - centerXB, 2) + 
          Math.pow(centerYA - centerYB, 2)
        );
        
        // If elements are close together (within threshold), group them
        if (distance < 100) { // Distance threshold in pixels
          group.push(elementB);
          visited.add(j);
        }
      }
      
      if (group.length > 0) {
        groups.push({
          id: `group-${groups.length}`,
          elements: group,
          centroid: this.calculateGroupCentroid(group),
          boundingBox: this.calculateGroupBounds(group)
        });
      }
    }
    
    return groups;
  }

  /**
   * Calculate centroid of element group
   * @param {Array} group - Elements in group
   * @returns {Object} Centroid coordinates
   */
  calculateGroupCentroid(group) {
    if (!group || group.length === 0) return { x: 0, y: 0 };
    
    let totalX = 0;
    let totalY = 0;
    
    group.forEach(element => {
      const centerX = element.boundingBox.x + (element.boundingBox.width / 2);
      const centerY = element.boundingBox.y + (element.boundingBox.height / 2);
      totalX += centerX;
      totalY += centerY;
    });
    
    return {
      x: totalX / group.length,
      y: totalY / group.length
    };
  }

  /**
   * Calculate bounding box of element group
   * @param {Array} group - Elements in group
   * @returns {Object} Bounding box coordinates
   */
  calculateGroupBounds(group) {
    if (!group || group.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
    
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    group.forEach(element => {
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
   * Analyze alignment patterns of elements
   * @param {Array} elements - Detected elements
   * @returns {Promise<Object>} Alignment analysis results
   */
  async analyzeAlignment(elements) {
    if (!elements || elements.length === 0) return {};
    
    // Analyze X and Y alignment patterns
    const alignments = {
      horizontal: [],
      vertical: []
    };
    
    const xPositions = elements.map(e => 
      e.boundingBox.x + (e.boundingBox.width / 2)
    );
    
    const yPositions = elements.map(e => 
      e.boundingBox.y + (e.boundingBox.height / 2)
    );
    
    // Find common alignment points (X positions that are close to each other)
    alignments.horizontal = this.findAlignmentPoints(yPositions);
    alignments.vertical = this.findAlignmentPoints(xPositions);
    
    return alignments;
  }

  /**
   * Find alignment points in a set of coordinates
   * @param {Array} positions - Array of coordinate positions
   * @returns {Array} Detected alignment points
   */
  findAlignmentPoints(positions) {
    // Sort positions
    const sorted = [...positions].sort((a, b) => a - b);
    
    const alignments = [];
    let currentGroup = [sorted[0]];
    const threshold = 15; // Pixel threshold for alignment detection
    
    for (let i = 1; i < sorted.length; i++) {
      if (Math.abs(sorted[i] - currentGroup[currentGroup.length - 1]) <= threshold) {
        currentGroup.push(sorted[i]);
      } else {
        if (currentGroup.length > 1) {
          alignments.push({
            positions: currentGroup,
            center: currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length,
            count: currentGroup.length
          });
        }
        currentGroup = [sorted[i]];
      }
    }
    
    // Don't forget the last group
    if (currentGroup.length > 1) {
      alignments.push({
        positions: currentGroup,
        center: currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length,
        count: currentGroup.length
      });
    }
    
    return alignments;
  }

  /**
   * Build hierarchy/relationships between elements
   * @param {Array} elements - Detected elements
   * @returns {Promise<Object>} Hierarchical relationships
   */
  async buildHierarchy(elements) {
    if (!elements || elements.length === 0) return {};
    
    const hierarchy = {
      root: [],
      children: {},
      parents: {}
    };
    
    // Group elements by approximate Y position (vertical alignment)
    const verticalGroups = {};
    
    elements.forEach(element => {
      const centerY = element.boundingBox.y + (element.boundingBox.height / 2);
      
      let groupKey = Math.round(centerY / 20) * 20; // Round to nearest 20px
      
      if (!verticalGroups[groupKey]) {
        verticalGroups[groupKey] = [];
      }
      
      verticalGroups[groupKey].push(element);
    });
    
    // Within each vertical group, determine linear order
    Object.keys(verticalGroups).forEach(key => {
      verticalGroups[key].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
    });
    
    return {
      groups: verticalGroups,
      relationships: this.determineRelationships(elements)
    };
  }

  /**
   * Determine relationships between elements
   * @param {Array} elements - Elements to relate
   * @returns {Array} Relationship information
   */
  determineRelationships(elements) {
    const relationships = [];
    
    // Simple relationship logic:
    // If one element's bounding box is contained within another's,
    // or they are visually related based on position
    
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        if (i === j) continue;
        
        const a = elements[i];
        const b = elements[j];
        
        // Check if elements overlap or are close
        const overlapX = Math.max(0, 
          Math.min(a.boundingBox.x + a.boundingBox.width, 
                  b.boundingBox.x + b.boundingBox.width) - 
          Math.max(a.boundingBox.x, b.boundingBox.x));
          
        const overlapY = Math.max(0, 
          Math.min(a.boundingBox.y + a.boundingBox.height, 
                  b.boundingBox.y + b.boundingBox.height) - 
          Math.max(a.boundingBox.y, b.boundingBox.y));
          
        if (overlapX > 0 && overlapY > 0) {
          relationships.push({
            type: 'overlap',
            elementA: a.id,
            elementB: b.id,
            intensity: Math.min(overlapX / a.boundingBox.width, 
                              overlapY / a.boundingBox.height)
          });
        }
      }
    }
    
    return relationships;
  }

  /**
   * Extract detailed spatial information for text elements
   * @param {Array} textElements - Text elements with positioning data
   * @returns {Object} Detailed spatial information for text
   */
  extractTextSpatialInfo(textElements) {
    // Calculate character and line positions
    const lines = [];
    
    textElements.forEach(element => {
      if (element.type === 'text') {
        const lineHeight = element.boundingBox.height;
        const linePosition = Math.round((element.boundingBox.y + lineHeight / 2) / 20) * 20;
        
        if (!lines[linePosition]) {
          lines[linePosition] = [];
        }
        
        lines[linePosition].push({
          ...element,
          position: element.boundingBox.x
        });
      }
    });
    
    // Sort characters within lines by X position
    lines.forEach(line => {
      if (line) {
        line.sort((a, b) => a.position - b.position);
      }
    });
    
    return {
      lines: lines.filter(line => line !== undefined),
      wordBlocks: this.groupIntoWords(textElements)
    };
  }

  /**
   * Group text elements into words
   * @param {Array} textElements - Text elements to group
   * @returns {Array} Word groups
   */
  groupIntoWords(textElements) {
    // Simple grouping based on X distance between elements
    const words = [];
    let currentWord = [];
    
    for (let i = 0; i < textElements.length; i++) {
      const element = textElements[i];
      
      if (i === 0 || 
          Math.abs(element.boundingBox.x - (textElements[i-1].boundingBox.x + textElements[i-1].boundingBox.width)) < 20) {
        // Close to previous, part of same word
        currentWord.push(element);
      } else {
        // Start new word
        if (currentWord.length > 0) {
          words.push(currentWord);
        }
        currentWord = [element];
      }
    }
    
    if (currentWord.length > 0) {
      words.push(currentWord);
    }
    
    return words;
  }
}

module.exports = { SpatialAnalyzer };