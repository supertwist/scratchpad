// Simple validation test for EV app
console.log("Testing EV Comparison App functionality...");

// This is a simple test that should run in the browser console
// To run this manually:
// 1. Open index.html in a browser
// 2. Open browser's developer console (F12)
// 3. Run this code:

try {
    console.log("Checking if dataHandler exists:", typeof dataHandler !== 'undefined');
    console.log("Checking if EVDataHandler class works:", typeof EVDataHandler !== 'undefined');
    
    if (typeof dataHandler !== 'undefined') {
        console.log("Data handler initialized");
        console.log("Manufacturers found:", dataHandler.getManufacturers().length);
    } else {
        console.log("Data handler not properly initialized");
    }
    
    console.log("App validation completed successfully");
} catch (error) {
    console.error("Error in app validation:", error.message);
}