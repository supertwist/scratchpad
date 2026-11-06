# REBUILDER

REBUILDER is a general-purpose tool that analyzes bitmap images and converts them to SVG format, preserving content structure, design styles, and spatial relationships.

## Features

- **Multi-format support**: Handles PNG, JPG, BMP, TIFF images
- **Text recognition**: Extracts text using OCR technology (Tesseract.js)
- **Content classification**: Distinguishes between text, graphics, and embedded images
- **Layout preservation**: Maintains visual structure and spatial relationships where possible
- **Style consistency**: Applies consistent design patterns to recreated elements
- **Fully editable SVG output**: Creates SVG files with editable text elements

## Installation

```bash
npm install -g rebuilder
```

Or clone this repository and install dependencies:

```bash
git clone https://github.com/yourusername/rebuilder.git
cd rebuilder
npm install
```

## Usage

### Command Line Interface

```bash
rebuilder input.png output.svg
```

### Programmatic Usage

```javascript
const { main } = require('./src/index');

main({
  input: 'input.png',
  output: 'output.svg'
});
```

## Enhanced Spatial Relationships

The latest version of REBUILDER now properly detects and preserves **spatial relationships** between discrete elements in bitmap images. This enhancement addresses the core limitation of previous versions where elements were positioned without regard to their original spatial arrangement.

Key improvements include:
- Detection of element grouping patterns  
- Analysis of alignment characteristics (horizontal/vertical)
- Calculation of proper spacing between elements
- Creation of logical visual hierarchy
- Accurate positioning that reflects original layout structure

## How It Works

REBUILDER follows a multi-stage process:

1. **Image Analysis**: The tool loads and preprocesses the input image
2. **Element Detection**: Uses OCR for text recognition and object detection to identify content components  
3. **Spatial Analysis**: Analyzes spatial relationships, content types, and design elements
4. **Vector Reconstruction**: Generates SVG with appropriate structure and styling
5. **Style Application**: Applies consistent design patterns while preserving visual characteristics

## Architecture

The tool has a modular architecture:

### Analysis Stage
- **Image Loader**: Handles image loading, preprocessing, and metadata extraction  
- **OCR Engine**: Extracts text content using Tesseract.js
- **Object Detection**: Identifies graphical elements (lines, shapes, embedded images)
- **Style Analyzer**: Analyzes color schemes, typography, and layout characteristics
- **Spatial Analyzer**: Detects spatial relationships between elements

### Reconstruction Stage
- **Enhanced SVG Generator**: Creates structured SVG output using advanced positioning
- **Layout Engine**: Preserves spatial relationships between elements
- **Style Applicator**: Applies consistent design patterns to recreated elements

## Components

### Core Modules
- `src/analysis/image-loader.js` - Image loading and preprocessing
- `src/analysis/ocr-engine.js` - Text extraction and classification
- `src/analysis/object-detection.js` - Graphic element detection  
- `src/analysis/style-analyzer.js` - Design characteristic analysis
- `src/analysis/spatial-analyzer.js` - Spatial relationship detection (enhanced)
- `src/reconstruction/svg-generator-enhanced.js` - Enhanced SVG output generation
- `src/reconstruction/layout-engine-enhanced.js` - Proper layout and positioning
- `src/cli/cli.js` - Command-line interface

### Dependencies Used
- **sharp**: High-performance image processing
- **tesseract.js**: OCR text extraction
- **@tensorflow/tfjs-node**: Computer vision capabilities  
- **svg.js**: SVG DOM manipulation and generation
- **d3.js**: Data visualization and layout calculations
- **pica**: High-quality image resizing
- **argparse**: Command-line argument parsing

## Development

To contribute to REBUILDER:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Examples

Here's an example workflow:

```bash
# Convert image with default settings
rebuilder document.png output.svg

# Skip OCR processing 
rebuilder --no-ocr image.jpg result.svg

# Verbose output with high quality
rebuilder --verbose --quality high photo.png converted.svg
```

## Requirements

- Node.js (v14 or higher)
- npm (v6 or higher)

## License

MIT License

## Roadmap

Future enhancements include:
- Support for batch processing
- Enhanced layout detection capabilities  
- Better handling of complex images with multiple sections
- Interactive mode for manual adjustments for complex layouts

## Contributing

We welcome contributions! Please submit issues and pull requests to the GitHub repository.