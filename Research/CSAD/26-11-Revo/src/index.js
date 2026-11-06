#!/usr/bin/env node

/**
 * REBUILDER - Bitmap to SVG Converter
 * 
 * This tool analyzes bitmap images and converts them to SVG format,
 * preserving content structure, design styles, and spatial relationships.
 */

const { processImage } = require('./analysis/image-loader');
const { extractTextFromImage, classifyTextElements } = require('./analysis/ocr-engine');
const { ObjectDetector } = require('./analysis/object-detection');
const { StyleAnalyzer } = require('./analysis/style-analyzer');
const { SpatialAnalyzer } = require('./analysis/spatial-analyzer');
const { EnhancedSVGGenerator } = require('./reconstruction/svg-generator-enhanced');
const { parseCLIArgs, showHelp } = require('./cli/cli');

async function main() {
  try {
    const args = parseCLIArgs();
    
    // Show help if requested
    if (args.help) {
      showHelp();
      return;
    }
    
    console.log('Starting REBUILDER process...');
    console.log(`Input: ${args.input}`);
    console.log(`Output: ${args.output}`);
    
    // Process the image
    console.log('Loading and preprocessing image...');
    const imageData = await processImage(args.input);
    
    // Initialize analysis components
    const styleAnalyzer = new StyleAnalyzer();
    const objectDetector = new ObjectDetector();
    const spatialAnalyzer = new SpatialAnalyzer();
    
    // Start with basic analysis
    console.log('Analyzing image structure and styles...');
    const styleData = await styleAnalyzer.analyzeStyle(imageData.buffer);
    
    // Extract text using OCR
    let textData = null;
    if (!args.noOcr) {
      console.log('Performing OCR text extraction...');
      textData = await extractTextFromImage(imageData.buffer);
      console.log(`Extracted ${textData.lines.length} lines of text`);
    }
    
    // Detect objects in the image
    let objectData = null;
    if (!args.noDetection) {
      console.log('Detecting graphical elements...');
      await objectDetector.init();
      objectData = await objectDetector.detectObjects(imageData.buffer);
      console.log(`Detected ${objectData.metadata.totalObjects} objects`);
    }
    
    // Classify text elements
    let classifiedText = null;
    if (textData) {
      console.log('Classifying extracted text...');
      classifiedText = await classifyTextElements(textData);
    }
    
    // Analyze spatial relationships between elements
    console.log('Analyzing spatial relationships...');
    const spatialData = await spatialAnalyzer.analyzeSpatialRelationships(imageData, objectData?.objects || []);
    console.log('Spatial analysis complete');
    
    // Prepare data for SVG generation including spatial information
    const analysisData = {
      imageData,
      style: styleData,
      text: textData,
      objects: objectData,
      classifiedText: classifiedText,
      spatial: spatialData
    };
    
    // Generate SVG using the enhanced generator
    console.log('Generating SVG output...');
    const svgContent = await EnhancedSVGGenerator.generateSVG(analysisData);
    
    // Save the output
    const fs = require('fs');
    fs.writeFileSync(args.output, svgContent);
    
    console.log('Successfully converted image to SVG');
    console.log(`Output saved to: ${args.output}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };