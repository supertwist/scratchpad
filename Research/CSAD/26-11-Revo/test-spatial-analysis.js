/**
 * Test script for spatial analysis functionality
 * This will help us understand how spatial relationships are being detected
 */

// Create mock data to test the spatial analyzer
const { DebugSpatialAnalyzer } = require('./src/analysis/spatial-analyzer-debug');

async function testSpatialAnalysis() {
  console.log('=== TESTING SPATIAL ANALYSIS ===');
  
  const mockElements = [
    {
      id: 1,
      label: 'text',
      type: 'text',
      boundingBox: { x: 50, y: 50, width: 200, height: 30 }
    },
    {
      id: 2,
      label: 'text', 
      type: 'text',
      boundingBox: { x: 50, y: 90, width: 180, height: 25 }
    },
    {
      id: 3,
      label: 'line',
      type: 'graphic',
      boundingBox: { x: 50, y: 130, width: 300, height: 2 }
    },
    {
      id: 4,
      label: 'text',
      type: 'text',
      boundingBox: { x: 50, y: 160, width: 220, height: 25 }
    },
    {
      id: 5,
      label: 'text',
      type: 'text',
      boundingBox: { x: 50, y: 200, width: 150, height: 20 }
    },
    {
      id: 6,
      label: 'text',
      type: 'text',  
      boundingBox: { x: 250, y: 200, width: 140, height: 20 }
    }
  ];
  
  const imageData = {
    metadata: {
      width: 800,
      height: 600
    }
  };
  
  const analyzer = new DebugSpatialAnalyzer();
  
  console.log('Testing with mock elements:');
  mockElements.forEach((el, i) => {
    console.log(`Element ${i+1} - x:${el.boundingBox.x}, y:${el.boundingBox.y}`);
  });
  
  try {
    const result = await analyzer.analyzeSpatialRelationships(imageData, mockElements);
    console.log('\n=== ANALYSIS RESULTS ===');
    console.log('Layout:', result.layout);
    console.log('Groups created:', result.groups.length);
    if (result.groups.length > 0) {
      result.groups.forEach((group, i) => {
        console.log(`Group ${i+1}: ${group.elements.length} elements`);
        group.elements.forEach(el => {
          console.log(`  - Element ${el.id} at x:${el.boundingBox.x}, y:${el.boundingBox.y}`);
        });
      });
    }
    console.log('Alignment patterns:', result.alignment);
    console.log('Hierarchy groups:', Object.keys(result.hierarchy.groups));
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testSpatialAnalysis();