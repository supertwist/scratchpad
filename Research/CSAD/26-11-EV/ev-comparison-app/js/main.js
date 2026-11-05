// Global variables
let dataHandler = new EVDataHandler();

// DOM Elements
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('nav a');

// Page navigation
function showPage(pageId) {
    // Hide all pages
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update active nav link
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Set up navigation event listeners
navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const pageId = this.getAttribute('data-page');
        showPage(pageId);
    });
});

// Initialize the application
async function init() {
    // Load vehicle data
    await loadVehicleData();
    
    // Set up filter event listeners
    document.getElementById('minPrice').addEventListener('input', applyFilters);
    document.getElementById('maxPrice').addEventListener('input', applyFilters);
    document.getElementById('minRange').addEventListener('input', applyFilters);
    document.getElementById('maxRange').addEventListener('input', applyFilters);
}

// Load vehicle data from external source
async function loadVehicleData() {
    try {
        // Fetch data using our data handler
        const vehicles = await dataHandler.fetchVehicleData();
        
        // Populate manufacturer dropdown
        populateManufacturers();
        
        // Display initial data
        displayVehicles(vehicles);
        
    } catch (error) {
        console.error('Error loading vehicle data:', error);
    }
}

// Populate manufacturer dropdown
function populateManufacturers() {
    const manufacturerSelect = document.getElementById('manufacturer');
    
    // Clear existing options
    manufacturerSelect.innerHTML = '<option value="">All Manufacturers</option>';
    
    const manufacturers = dataHandler.getManufacturers();
    
    manufacturers.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        manufacturerSelect.appendChild(option);
    });
    
    // Add event listener for manufacturer filter
    manufacturerSelect.addEventListener('change', applyFilters);
}

// Filter vehicles based on selected criteria
function applyFilters() {
    const minPrice = document.getElementById('minPrice').value || null;
    const maxPrice = document.getElementById('maxPrice').value || null;
    const minRange = document.getElementById('minRange').value || null;
    const maxRange = document.getElementById('maxRange').value || null;
    const manufacturer = document.getElementById('manufacturer').value;
    
    // Create filter object
    const filters = {
        manufacturer: manufacturer,
        minPrice: minPrice,
        maxPrice: maxPrice,
        minRange: minRange,
        maxRange: maxRange
    };
    
    // Apply filters using data handler
    const filteredVehicles = dataHandler.filterVehicles(filters);
    displayVehicles(filteredVehicles);
}

// Reset all filters
function resetFilters() {
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    document.getElementById('minRange').value = '';
    document.getElementById('maxRange').value = '';
    document.getElementById('manufacturer').value = '';
    
    // Show all vehicles again
    displayVehicles(dataHandler.vehicles);
}

// Display vehicles in the table
function displayVehicles(vehicles) {
    const tableBody = document.getElementById('vehiclesTableBody');
    tableBody.innerHTML = '';
    
    // Update results count
    document.getElementById('results-count').textContent = `Showing ${vehicles.length} vehicles`;
    
    if (vehicles.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No vehicles match your criteria</td></tr>';
        return;
    }
    
    vehicles.forEach(vehicle => {
        const price = dataHandler.getVehiclePrice(vehicle);
        const range = vehicle.range_real_world_km || 'N/A';
        const battery = vehicle.battery_usable_kwh || 'N/A';
        const acceleration = vehicle.acceleration_0_100_sec || 'N/A';
        const chargePower = vehicle.dc_charge_power_kw || 'N/A';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${vehicle.brand} ${vehicle.model_name} ${vehicle.variant_name}</td>
            <td>${vehicle.brand}</td>
            <td>${price ? price.toLocaleString() : 'N/A'}</td>
            <td>${range}</td>
            <td>${battery}</td>
            <td>${acceleration}</td>
            <td>${chargePower}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);