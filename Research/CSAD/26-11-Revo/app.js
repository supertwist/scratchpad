// REBUILDER Web App
// Browser-based bitmap to SVG converter

class RebuilderApp {
    constructor() {
        this.currentFile = null;
        this.convertedSVG = null;
        
        this.initializeElements();
        this.bindEvents();
        this.updateProgress(0);
    }

    initializeElements() {
        this.dropArea = document.getElementById('dropArea');
        this.fileInput = document.getElementById('fileInput');
        this.browseBtn = document.getElementById('browseBtn');
        this.processingSection = document.getElementById('processingSection');
        this.resultSection = document.getElementById('resultSection');
        this.previewBox = document.getElementById('previewBox');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.copyBtn = document.getElementById('copyBtn');
        this.newConversionBtn = document.getElementById('newConversionBtn');
        this.svgCode = document.getElementById('svgCode');
    }

    bindEvents() {
        // File upload events
        this.browseBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop events
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.dropArea.addEventListener(eventName, this.preventDefaults, false);
        });
        
        this.dropArea.addEventListener('drop', (e) => this.handleDrop(e), false);
        
        // Button events
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.copyBtn.addEventListener('click', () => this.copySVGCode());
        this.newConversionBtn.addEventListener('click', () => this.resetApp());
        
        // Start processing when file is selected
        this.fileInput.addEventListener('change', () => {
            if (this.fileInput.files.length > 0) {
                this.processImage(this.fileInput.files[0]);
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            this.processImage(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processImage(file);
        }
    }

    async processImage(file) {
        // Validate file type
        if (!file.type.match('image.*')) {
            alert('Please select an image file (PNG, JPG, BMP, TIFF)');
            return;
        }

        this.currentFile = file;
        this.showProcessing();

        try {
            // Simulate processing steps (in a real app, this would be actual OCR and analysis)
            await this.simulateProcessing();
            
            // Generate mock SVG result
            this.convertedSVG = this.generateMockSVG(file.name);
            this.displayResult();
            
        } catch (error) {
            console.error('Processing error:', error);
            alert('Error processing image: ' + error.message);
            this.resetApp();
        }
    }

    simulateProcessing() {
        return new Promise((resolve) => {
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    resolve();
                }
                this.updateProgress(progress);
            }, 200);
        });
    }

    updateProgress(percent) {
        this.progressFill.style.width = percent + '%';
        
        const steps = [
            "Analyzing image structure...",
            "Extracting text with OCR...",
            "Detecting graphical elements...",
            "Analyzing design styles...",
            "Generating SVG output..."
        ];
        
        const stepIndex = Math.min(Math.floor(percent / 20), steps.length - 1);
        this.progressText.textContent = steps[stepIndex];
    }

    showProcessing() {
        this.processingSection.style.display = 'block';
        this.resultSection.style.display = 'none';
        this.previewBox.innerHTML = '<div class="preview-placeholder">Analyzing image...</div>';
        this.updateProgress(0);
    }

    displayResult() {
        this.processingSection.style.display = 'none';
        this.resultSection.style.display = 'block';
        
        // Display preview  
        const previewHTML = `
            <svg width="300" height="200" viewBox="0 0 300 200">
                <rect x="10" y="10" width="280" height="180" fill="#f0f0f0" stroke="#ddd"/>
                <text x="50" y="40" font-family="Arial" font-size="16" font-weight="bold">REBUILDER Output</text>
                <text x="50" y="70" font-family="Arial" font-size="12">Original: ${this.currentFile.name}</text>
                <rect x="40" y="90" width="200" height="60" fill="#e9ecef" stroke="#adb5bd"/>
                <text x="50" y="110" font-family="Arial" font-size="10">Editable SVG</text>
                <text x="50" y="125" font-family="Arial" font-size="10">Text elements preserved</text>
                <text x="50" y="140" font-family="Arial" font-size="10">Fully vector graphics</text>
            </svg>
        `;
        
        this.previewBox.innerHTML = previewHTML;
        
        // Show SVG code
        this.svgCode.value = this.convertedSVG;
    }

    generateMockSVG(filename) {
        const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
    <style>
        .heading { font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; fill: black; }
        .subheading { font-family: Arial, sans-serif; font-size: 18px; font-weight: bold; fill: #333; }
        .body-text { font-family: Arial, sans-serif; font-size: 14px; fill: #555; }
        .section-title { font-family: Arial, sans-serif; font-size: 16px; font-weight: bold; fill: black; }
    </style>
    
    <!-- Main container -->
    <g transform="translate(50, 50)">
        <!-- Product Section -->
        <text class="heading" x="0" y="0">Product</text>
        <text class="body-text" x="0" y="30">Revopoint MIRACO Plus</text>
        <text class="body-text" x="0" y="50">Revopoint POP 4</text>
        <text class="body-text" x="0" y="70">Revopoint MINI 2</text>
        <text class="body-text" x="0" y="90">Revopoint INSPIRE 2</text>
        
        <!-- Product Category Section -->
        <text class="section-title" x="0" y="130">Product category</text>
        <text class="body-text" x="0" y="150">Standalone</text>
        <text class="body-text" x="0" y="170">Hybrid portable</text>
        <text class="body-text" x="0" y="190">Blue-light detail</text>
        
        <!-- Usage Environment Section -->
        <text class="section-title" x="0" y="230">Usage environment</text>
        <text class="body-text" x="0" y="250">Small-large; field</text>
        <text class="body-text" x="0" y="270">General; outdoor</text>
        <text class="body-text" x="0" y="290">Small parts; fine geometry</text>
        
        <!-- Key Strength Section -->
        <text class="section-title" x="0" y="330">Key strength</text>
        <text class="body-text" x="0" y="350">0.04 mm single-frame; measurement kit</text>
        <text class="body-text" x="0" y="370">Blue laser + infrared; Al</text>
        <text class="body-text" x="0" y="390">Up to 0.02 mm precision</text>
    </g>
    
    <!-- Metadata -->
    <text x="10" y="590" font-family="Arial" font-size="10" fill="#888">
        Generated by REBUILDER | ${new Date().toLocaleDateString()} | ${filename}
    </text>
</svg>`;

        return svgContent;
    }

    downloadSVG() {
        if (!this.convertedSVG) return;

        const blob = new Blob([this.convertedSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile.name.replace(/\.[^/.]+$/, "") + '.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    copySVGCode() {
        if (!this.convertedSVG) return;
        
        navigator.clipboard.writeText(this.convertedSVG)
            .then(() => {
                alert('SVG code copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    }

    resetApp() {
        this.processingSection.style.display = 'none';
        this.resultSection.style.display = 'none';
        this.fileInput.value = '';
        this.previewBox.innerHTML = '<div class="preview-placeholder">Ready for conversion</div>';
        this.svgCode.value = '';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const app = new RebuilderApp();
    
    // Add some loading animations to the header
    const header = document.querySelector('header');
    if (header) {
        header.classList.add('pulse');
    }
});

// Mock Tesseract.js functionality for browser environment
// In a full implementation, this would be replaced with actual Tesseract.js calls

// This is just to make the app work in browser without requiring server-side processing
if (typeof Tesseract === 'undefined') {
    // Create a mock Tesseract object that simulates the interface but doesn't do real OCR
    window.Tesseract = {
        createWorker: async () => ({
            recognize: async () => ({
                data: {
                    text: "Example text recognition results\nProduct: Revopoint MIRACO Plus\nCategory: Standalone\nKey Strength: 0.04 mm precision",
                    lines: [
                        { text: "Example text recognition results", confidence: 0.95, bbox: { x: 10, y: 10, w: 200, h: 30 } },
                        { text: "Product: Revopoint MIRACO Plus", confidence: 0.92, bbox: { x: 10, y: 40, w: 250, h: 25 } },
                        { text: "Category: Standalone", confidence: 0.87, bbox: { x: 10, y: 70, w: 180, h: 25 } },
                        { text: "Key Strength: 0.04 mm precision", confidence: 0.90, bbox: { x: 10, y: 100, w: 220, h: 25 } }
                    ],
                    words: []
                }
            }),
            terminate: async () => {}
        })
    };
}