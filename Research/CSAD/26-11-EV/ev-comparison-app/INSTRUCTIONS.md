# Electric Vehicle Comparison Tool - Usage Instructions

## How to Use This Application

1. **Opening the Application**
   - Simply open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge)
   - No installation required - works completely offline once loaded

2. **Navigation**
   - Use the top navigation menu to switch between sections:
     - Home: Overview and introduction
     - Filters: Vehicle comparison tool 
     - Methodology: How data is collected and sourced
     - About: Project information

3. **Using the Comparison Tool**
   - Go to the "Filters" section
   - Use the filter controls:
     - Manufacturer dropdown: Select specific EV manufacturers
     - Price range inputs: Set minimum and maximum prices
     - Range inputs: Set minimum and maximum driving ranges
   - Results automatically update as you adjust filters
   - Click "Reset Filters" to clear all selections

4. **Viewing Vehicle Information**
   - The table displays key specifications:
     - Vehicle name and manufacturer
     - Price (in Euros)
     - Driving range (km)
     - Battery capacity (kWh)
     - Acceleration 0-100 km/h (seconds)
     - Charging power (kW)

## Data Sources

This application uses data from [gaia-charge/evdb](https://github.com/gaia-charge/evdb), an open-source database of electric vehicle specifications. The database collects information from:

- Manufacturer specifications
- Independent testing organizations  
- Real-world performance metrics

## Technical Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection (for live data updates)

## Troubleshooting

If the application doesn't load properly:

1. Ensure you're opening `index.html` directly in a web browser
2. Check that all files are present in the directory structure
3. Make sure JavaScript is enabled in your browser
4. For development issues, check browser console for error messages (press F12)

## Features

✅ Interactive vehicle comparison table  
✅ Filter by manufacturer, price range, and driving range  
✅ Responsive design for mobile and desktop  
✅ Methodology page with source citations  
✅ Automated testing suite  
✅ Clean, user-friendly interface  

The application gracefully handles situations when external data is unavailable by displaying sample test data.