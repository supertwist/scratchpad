// Data handler for EV comparison tool
class EVDataHandler {
    constructor() {
        this.vehicles = [];
        this.filteredVehicles = [];
        this.manufacturers = [];
    }

    // Fetch data from gaia-charge/evdb API
    async fetchVehicleData() {
        try {
            console.log('Fetching vehicle data from gaia-charge/evdb...');
            
            // Try to get the complete dataset
            const response = await fetch('https://gaia-charge.github.io/evdb/v1/vehicles.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.vehicles = await response.json();
            console.log(`Successfully loaded ${this.vehicles.length} vehicles`);
            
            // Update manufacturers
            this.updateManufacturers();
            
            return this.vehicles;
        } catch (error) {
            console.error('Error fetching vehicle data:', error);
            // Fallback to sample data for development
            return this.loadSampleData();
        }
    }

    // Update the list of unique manufacturers
    updateManufacturers() {
        this.manufacturers = Array.from(new Set(this.vehicles.map(vehicle => vehicle.brand))).sort();
    }

    // Filter vehicles based on criteria
    filterVehicles(filters) {
        let filtered = [...this.vehicles];
        
        if (filters.manufacturer && filters.manufacturer !== '') {
            filtered = filtered.filter(v => v.brand === filters.manufacturer);
        }
        
        if (filters.minPrice !== null && filters.minPrice !== '') {
            filtered = filtered.filter(v => {
                const price = this.getVehiclePrice(v);
                return price >= parseFloat(filters.minPrice);
            });
        }
        
        if (filters.maxPrice !== null && filters.maxPrice !== '') {
            filtered = filtered.filter(v => {
                const price = this.getVehiclePrice(v);
                return price <= parseFloat(filters.maxPrice);
            });
        }
        
        if (filters.minRange !== null && filters.minRange !== '') {
            filtered = filtered.filter(v => {
                return v.range_real_world_km >= parseFloat(filters.minRange);
            });
        }
        
        if (filters.maxRange !== null && filters.maxRange !== '') {
            filtered = filtered.filter(v => {
                return v.range_real_world_km <= parseFloat(filters.maxRange);
            });
        }
        
        this.filteredVehicles = filtered;
        return filtered;
    }

    // Get vehicle price from market data
    getVehiclePrice(vehicle) {
        if (vehicle.markets && vehicle.markets.length > 0) {
            return vehicle.markets[0].price_base;
        }
        return 0;
    }

    // Get unique manufacturers
    getManufacturers() {
        return this.manufacturers;
    }

    // Load sample data for demo purposes
    loadSampleData() {
        console.log('Loading sample data as fallback...');
        
        const sampleVehicles = [
            {
                "id": "tesla-model-3-long-range-awd-2024",
                "model_id": "tesla-model-3",
                "variant_name": "Long Range AWD",
                "model_year": 2024,
                "battery_capacity_kwh": 82.0,
                "battery_usable_kwh": 78.1,
                "range_wltp_km": 629,
                "range_epa_km": 567,
                "range_real_world_km": 560,
                "consumption_wltp_kwh_100km": 14.9,
                "consumption_real_world_kwh_100km": 16.2,
                "ac_charge_power_kw": 11.0,
                "dc_charge_power_kw": 250.0,
                "dc_charge_time_10_80_min": 24,
                "dc_peak_power_kw": 250.0,
                "motor_type": "permanent magnet",
                "motor_count": 2,
                "drive_type": "AWD",
                "total_power_kw": 366.0,
                "acceleration_0_100_sec": 4.4,
                "top_speed_kph": 201,
                "weight_curb_kg": 1844,
                "brand": "Tesla",
                "model_name": "Model 3",
                "body_style": "sedan",
                "markets": [
                    {
                        "market_code": "US",
                        "currency": "USD",
                        "price_base": 47490,
                        "notes": "Federal tax credit subject to eligibility requirements. Prices exclude taxes and fees. Supercharging network access included."
                    }
                ]
            },
            {
                "id": "bmw-i3-50-xdrive",
                "model_id": "bmw-i3",
                "variant_name": "50 xDrive",
                "model_year": 2024,
                "battery_capacity_kwh": 71.0,
                "battery_usable_kwh": 69.0,
                "range_wltp_km": 382,
                "range_epa_km": 350,
                "range_real_world_km": 340,
                "consumption_wltp_kwh_100km": 12.7,
                "consumption_real_world_kwh_100km": 14.1,
                "ac_charge_power_kw": 11.0,
                "dc_charge_power_kw": 150.0,
                "dc_charge_time_10_80_min": 35,
                "dc_peak_power_kw": 150.0,
                "motor_type": "permanent magnet",
                "motor_count": 2,
                "drive_type": "AWD",
                "total_power_kw": 200.0,
                "acceleration_0_100_sec": 7.6,
                "top_speed_kph": 150,
                "weight_curb_kg": 2440,
                "brand": "BMW",
                "model_name": "i3",
                "body_style": "SUV",
                "markets": [
                    {
                        "market_code": "DE",
                        "currency": "EUR",
                        "price_base": 50990,
                        "available_from": "2023-10-01",
                        "availability_status": "available"
                    }
                ]
            },
            {
                "id": "nissan-leaf-e+",
                "model_id": "nissan-leaf",
                "variant_name": "e+",
                "model_year": 2024,
                "battery_capacity_kwh": 62.0,
                "battery_usable_kwh": 60.0,
                "range_wltp_km": 312,
                "range_epa_km": 280,
                "range_real_world_km": 270,
                "consumption_wltp_kwh_100km": 15.0,
                "consumption_real_world_kwh_100km": 16.8,
                "ac_charge_power_kw": 11.0,
                "dc_charge_power_kw": 50.0,
                "dc_charge_time_10_80_min": 50,
                "dc_peak_power_kw": 50.0,
                "motor_type": "permanent magnet",
                "motor_count": 1,
                "drive_type": "FWD",
                "total_power_kw": 110.0,
                "acceleration_0_100_sec": 8.2,
                "top_speed_kph": 140,
                "weight_curb_kg": 1630,
                "brand": "Nissan",
                "model_name": "Leaf",
                "body_style": "hatchback",
                "markets": [
                    {
                        "market_code": "US",
                        "currency": "USD",
                        "price_base": 35490,
                        "notes": "Includes federal tax credit for qualifying purchases. Price excludes taxes and fees."
                    }
                ]
            }
        ];
        
        this.vehicles = sampleVehicles;
        this.updateManufacturers();
        return sampleVehicles;
    }

    // Format currency for display
    formatCurrency(amount, currency = 'EUR') {
        // For now, just return formatted number with thousand separators
        return amount.toLocaleString('en-US');
    }

    // Sort vehicles by a specific criteria
    sortVehicles(vehicles, sortBy, order = 'asc') {
        const sorted = [...vehicles];
        
        switch (sortBy) {
            case 'price':
                sorted.sort((a, b) => {
                    const priceA = this.getVehiclePrice(a);
                    const priceB = this.getVehiclePrice(b);
                    return order === 'asc' ? priceA - priceB : priceB - priceA;
                });
                break;
            case 'range':
                sorted.sort((a, b) => {
                    return order === 'asc' ? a.range_real_world_km - b.range_real_world_km : b.range_real_world_km - a.range_real_world_km;
                });
                break;
            case 'brand':
                sorted.sort((a, b) => {
                    return order === 'asc' ? a.brand.localeCompare(b.brand) : b.brand.localeCompare(a.brand);
                });
                break;
            default:
                // Keep original order
                break;
        }
        
        return sorted;
    }
}

// Initialize data handler when the page loads
let dataHandler = new EVDataHandler();