# Electric Vehicle Comparison Tool

An interactive tool for comparing electric vehicles based on price, range, and specifications.

## Features

- Interactive comparison table of electric vehicles
- Filter by manufacturer, price range, and driving range
- Responsive design that works on mobile and desktop
- Methodology page explaining data sources
- Citations to authoritative sources

## Data Sources

This application uses data from the [gaia-charge/evdb](https://github.com/gaia-charge/evdb) open-source database of electric vehicles, which provides specifications from multiple sources including:

- Manufacturer documentation
- Independent testing organizations  
- Real-world performance metrics

## Project Structure

```bash
ev-comparison-app/
├── index.html          # Main application page
├── css/
│   └── style.css       # Styling for the application
├── js/
│   ├── main.js         # Main application logic and UI handling  
│   └── data-handler.js # Data management and filtering logic
├── tests/
│   └── test-suite.html # Automated testing suite
└── README.md           # This file
```

## How to Use

1. Open `index.html` in a web browser
2. Navigate to the "Filters" section using the navigation menu
3. Apply filters for:
   - Manufacturer
   - Price range (min/max)
   - Driving range (min/max)
4. View filtered results in the table
5. Use "Reset Filters" to clear all filters

## Technical Details

### Data Handling

The application fetches vehicle data from the gaia-charge/evdb API using JavaScript's `fetch()` method. When this fails, it falls back to sample data for demonstration purposes.

### Filtering Logic

Filtering is performed on:
- Vehicle manufacturers
- Price ranges (based on market data)
- Driving range (real-world range in km)

### Responsive Design

The application uses CSS Flexbox and Grid layouts with media queries to ensure proper display on mobile, tablet, and desktop devices.

## Testing

The test suite (`tests/test-suite.html`) includes basic validation tests for the application components. Run these tests by opening the file in a browser.

## Future Improvements

- Add more detailed vehicle specifications
- Implement sorting functionality
- Include additional filter criteria (performance metrics)
- Add export functionality to save comparisons
- Integrate with real-time pricing data
- Add vehicle images and more visual elements

## License

This project is built using open-source principles and data from the gaia-charge/evdb project. All code follows standard open-source licensing practices.