/**
 * Command Line Interface for REBUILDER
 * Parses command line arguments and manages user interaction
 */

const argparse = require('argparse');

/**
 * Parse command line arguments
 * @returns {Object} Parsed arguments
 */
function parseCLIArgs() {
  const parser = new argparse.ArgumentParser({
    description: 'REBUILDER - Convert bitmap images to SVG with preserved structure and design styles'
  });

  parser.add_argument('input', {
    help: 'Input image file path',
    nargs: '?'
  });

  parser.add_argument('-o', '--output', {
    help: 'Output SVG file path (default: input.svg)',
    default: null
  });

  parser.add_argument('--format', {
    help: 'Output format (svg, html, json) [default: svg]',
    default: 'svg'
  });

  parser.add_argument('--no-ocr', {
    help: 'Skip OCR processing',
    action: 'store_true'
  });

  parser.add_argument('--no-detection', {
    help: 'Skip object detection',
    action: 'store_true'
  });

  parser.add_argument('--verbose', {
    help: 'Enable verbose output',
    action: 'store_true'
  });

  parser.add_argument('--quality', {
    help: 'Conversion quality (low, medium, high) [default: medium]',
    default: 'medium'
  });

  const args = parser.parse_args();

  // Validate arguments
  if (!args.input) {
    console.error('Error: Input file is required');
    process.exit(1);
  }

  // Set default output name if not provided
  if (!args.output) {
    const path = require('path');
    const ext = path.extname(args.input);
    const basename = path.basename(args.input, ext);
    args.output = `${basename}.svg`;
  }

  return args;
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
REBUILDER - Bitmap to SVG Converter

Usage: rebuilder [options] input.png

Options:
  -h, --help              Show this help message
  -o, --output PATH       Specify output file path
  --format FORMAT         Output format (svg, html, json) [default: svg]
  --no-ocr                Skip OCR processing
  --no-detection          Skip object detection
  --verbose               Enable verbose output
  --quality LEVEL         Conversion quality (low, medium, high) [default: medium]

Examples:
  rebuilder input.png                    # Convert to input.svg
  rebuilder input.jpg -o output.svg      # Convert with custom output
  rebuilder --no-ocr --verbose image.png # Skip OCR with verbose logging
`);
}

module.exports = { parseCLIArgs, showHelp };