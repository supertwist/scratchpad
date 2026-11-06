/**
 * Debug Spatial Analyzer for REBUILDER
 * This module will help us understand and fix the spatial relationships problem
 */

// Debug version that generates detailed logs to trace what's happening

class DebugSpatialAnalyzer {
  constructor() {
    this.debugMode = true;
  }

  /**
   * Analyze spatial relationships with detailed logging
   * @param {Object} imageData - Processed image data 
   * @param {Array} detectedElements - Elements from object detection
   * @returns {Promise<Object>} Spatial relationship analysis
   */
  async analyzeSpatialRelationships(imageData, detectedElements) {
    console.log('=== SPATIAL ANALYSIS DEBUG START ===');
    
    // Log incoming data
    console.log('Input data:');
    console.log('- Image dimensions:', imageData.metadata.width, 'x', imageData.metadata.height);
    console.log('- Detected elements count:', detectedElements ? detectedElements.length : 0);
    
    if (detectedElements && detectedElements.length > 0) {
      console.log('First few detected elements:');
      detectedElements.slice(0, 3).forEach((element, index) => {
        console.log(`  Element ${index}:`, {
          id: element.id,
          label: element.label,
          type: element.type,
          bbox: element.boundingBox
        });
      });
    }
    
    try {
      const spatialData = {
        elements: detectedElements || [],
        canvas: { width: imageData.metadata.width, height: imageData.metadata.height },
        layout: await this.determineLayoutStructure(detectedElements),
        groups: await this.identifyElementGroups(detectedElements),
        alignment: await this.analyzeAlignment(detectedElements),
        spacing: await this.calculateSpacing(detectedElements),
        hierarchy: await this.buildHierarchy(detectedElements)
      };
      
      console.log('=== SPATIAL ANALYSIS RESULTS ===');
      console.log('Layout:', spatialData.layout);
      console.log('Groups count:', spatialData.groups.length);
      if (spatialData.groups.length > 0) {
        console.log('First group elements:', spatialData.groups[0].elements.length);
      }
      console.log('Alignment:', spatialData.alignment);
      console.log('Spacing stats:', spatialData.spacing.horizontalStats);
      
      return spatialData;
    } catch (error) {
      console.error('Spatial analysis failed:', error);
      throw new Error(`Spatial analysis failed: ${error.message}`);
    }
  }

  /**
   * Determine overall layout structure with detailed logging
   */
  async determineLayoutStructure(elements) {
    console.log('Determining layout structure...');
    
    if (!elements || elements.length === 0) {
      console.log('- No elements found');
      return { type: 'unknown', confidence: 0 };
    }

    // Calculate centroids and positions of all elements
    const centroids = elements.map(element => ({
      id: element.id,
      x: element.boundingBox.x + (element.boundingBox.width / 2),
      y: element.boundingBox.y + (element.boundingBox.height / 2)
    }));

    console.log('Centroids calculated:', centroids.length);
    
    // Log some sample centroids
    if (centroids.length > 0) {
      console.log('Sample centroids:');
      centroids.slice(0, 5).forEach((c, i) => {
        console.log(`  ${i}: x=${c.x}, y=${c.y}`);
      });
    }

    // For a basic grid structure detection, we would:
    // 1. Cluster elements by X/Y coordinates
    // 2. Check for uniform spacing patterns
    // 3. Determine dominant orientation (horizontal/vertical)
    
    // Simplified approach - in real implementation this would be more sophisticated
    const xPositions = centroids.map(c => c.x);
    const yPositions = centroids.map(c => c.y);
    
    const xRange = Math.max(...xPositions) - Math.min(...xPositions);
    const yRange = Math.max(...yPositions) - Math.min(...yPositions);
    
    console.log(`X range: ${xRange}, Y range: ${yRange}`);
    
    // Determine if elements are arranged in rows or columns
    let layoutType = 'mixed';
    let confidence = 0.5;
    
    if (xRange > yRange && xRange > 100) {
      layoutType = 'row-based';
      confidence = Math.min(1, xRange / 500); // Higher range = more likely to be row-based
      console.log('Detected as ROW-BASED layout');
    } else if (yRange > xRange && yRange > 100) {
      layoutType = 'column-based';  
      confidence = Math.min(1, yRange / 500); // Higher range = more likely to be column-based
      console.log('Detected as COLUMN-BASED layout');
    } else {
      console.log(`Mixed or uniform arrangement (xRange=${xRange}, yRange=${yRange})`);
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
   * Identify groups of related elements with detailed tracing
   */
  async identifyElementGroups(elements) {
    console.log('Identifying element groups...');
    
    if (!elements || elements.length === 0) {
      console.log('- No elements to group');
      return [];
    }
    
    const groups = [];
    const visited = new Set();
    
    console.log(`Processing ${elements.length} elements for grouping`);
    
    for (let i = 0; i < elements.length; i++) {
      if (visited.has(i)) continue;
      
      const group = [elements[i]];
      visited.add(i);
      
      console.log(`Starting group ${groups.length + 1} with element ${i}`);
      console.log(`  Element bbox: ${JSON.stringify(elements[i].boundingBox)}`);
      
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
        
        console.log(`  Distance from ${i} to ${j}: ${distance}`);
        
        // If elements are close together (within threshold), group them
        if (distance < 100) { // Distance threshold in pixels
          console.log(`  --> Grouping element ${j} with element ${i}`);
          group.push(elementB);
          visited.add(j);
        }
      }
      
      if (group.length > 0) {
        const groupInfo = {
          id: `group-${groups.length}`,
          elements: group,
          centroid: this.calculateGroupCentroid(group),
          boundingBox: this.calculateGroupBounds(group)
        };
        
        groups.push(groupInfo);
        console.log(`  Group ${groups.length - 1} created with ${group.length} element(s)`);
      }
    }
    
    return groups;
  }

  /**
   * Calculate group bounding box for debugging
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
   * Calculate group centroid for debugging
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
   * Analyze alignment patterns with debugging
   */
  async analyzeAlignment(elements) {
    console.log('Analyzing alignment patterns...');
    
    if (!elements || elements.length === 0) {
      console.log('- No elements for alignment analysis');
      return {};
    }
    
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
    
    console.log('X positions:', xPositions.slice(0, 10));
    console.log('Y positions:', yPositions.slice(0, 10));
    
    // Find common alignment points (X positions that are close to each other)
    alignments.horizontal = this.findAlignmentPoints(yPositions);
    alignments.vertical = this.findAlignmentPoints(xPositions);
    
    return alignments;
  }

  /**
   * Find alignment points in a set of coordinates
   */
  findAlignmentPoints(positions) {
    console.log('Finding alignment points from', positions.length, 'positions');
    
    // Sort positions
    const sorted = [...positions].sort((a, b) => a - b);
    
    const alignments = [];
    let currentGroup = [sorted[0]];
    const threshold = 15; // Pixel threshold for alignment detection
    
    console.log('Threshold:', threshold);
    console.log('First 5 sorted positions:', sorted.slice(0, 5));
    
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
          console.log('Found alignment group:', currentGroup);
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
      console.log('Found final alignment group:', currentGroup);
    }
    
    return alignments;
  }

  /**
   * Build hierarchy/relationships with debugging
   */
  async buildHierarchy(elements) {
    console.log('Building element hierarchy...');
    
    if (!elements || elements.length === 0) {
      console.log('- No elements for hierarchy');
      return {};
    }
    
    console.log(`Building hierarchy from ${elements.length} elements`);
    
    const hierarchy = {
      root: [],
      children: {},
      parents: {}
    };
    
    // Group elements by approximate Y position (vertical alignment)
    const verticalGroups = {};
    
    elements.forEach((element, index) => {
      console.log(`Processing element ${index}:`, element.boundingBox);
      
      const centerY = element.boundingBox.y + (element.boundingBox.height / 2);
      
      let groupKey = Math.round(centerY / 20) * 20; // Round to nearest 20px
      
      if (!verticalGroups[groupKey]) {
        verticalGroups[groupKey] = [];
      }
      
      verticalGroups[groupKey].push(element);
    });
    
    console.log('Vertical grouping keys:', Object.keys(verticalGroups));
    
    // Within each vertical group, determine linear order
    Object.keys(verticalGroups).forEach(key => {
      if (verticalGroups[key].length > 1) {
        verticalGroups[key].sort((a, b) => a.boundingBox.x - b.boundingBox.x);
        console.log(`Group ${key} sorted:`, verticalGroups[key].map(e => e.boundingBox.x));
      }
    });
    
    const result = {
      groups: verticalGroups,
      relationships: this.determineRelationships(elements)
    };
    
    console.log('Hierarchy construction complete');
    return result;
  }

  /**
   * Determine relationships between elements
   */
  determineRelationships(elements) {
    const relationships = [];
    
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
}

module.exports = { DebugSpatialAnalyzer };