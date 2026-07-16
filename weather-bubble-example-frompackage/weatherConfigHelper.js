// weather-bubble-example-frompackage/weatherConfigHelper.js

(function () {
  const DEFAULT_CITIES = [
    { id: 'san-francisco', name: 'San Francisco', lat: 37.7749, lng: -122.4194, symbol: '🌉' },
    { id: 'new-york', name: 'New York', lat: 40.7128, lng: -74.0060, symbol: '🗽' },
    { id: 'london', name: 'London', lat: 51.5074, lng: -0.1278, symbol: '🇬🇧' },
    { id: 'antwerpen', name: 'Antwerpen', lat: 51.2194, lng: 4.4024, symbol: '🇧🇪' },
    { id: 'almaty', name: 'Almaty', lat: 43.2380, lng: 76.9464, symbol: '🏔️' },
    { id: 'basseterre', name: 'Basseterre', lat: 17.3010, lng: -62.7330, symbol: '🏝️' },
    { id: 'sydney', name: 'Sydney', lat: -33.8688, lng: 151.2093, symbol: '🦘' }
  ];

  // Merge custom cities from localStorage
  let customCities = [];
  try {
    customCities = JSON.parse(localStorage.getItem('weather_bubble_carousel_custom_cities') || '[]');
  } catch (e) {
    console.error('Failed to load custom cities from localStorage:', e);
  }
  const CITIES = [...DEFAULT_CITIES, ...customCities];

  const UNITS = ['celsius', 'fahrenheit'];
  const WEATHER_CACHE_KEY = 'weather_bubble_carousel_cache';
  const WEATHER_CACHE_TIME_KEY = 'weather_bubble_carousel_cache_time';
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
  let updateInterval = null;

  // Generate unique colors for each city
  function generateUniqueColors() {
    const count = CITIES.length;
    const startHue = Math.floor(Math.random() * 360);
    const hues = CITIES.map((_, i) => (startHue + (i * (360 / count))) % 360);

    // Fisher-Yates Shuffle
    for (let i = hues.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hues[i], hues[j]] = [hues[j], hues[i]];
    }

    return hues.map(hue => `hsl(${Math.round(hue)}, 75%, 55%)`);
  }

  // Convert Celsius to Fahrenheit
  function celsiusToFahrenheit(celsius) {
    return (celsius * 9/5) + 32;
  }

  // Fetch weather data for all cities
  async function fetchWeatherData() {
    // 1. Check Cache
    const cachedData = localStorage.getItem(WEATHER_CACHE_KEY);
    const cachedTime = localStorage.getItem(WEATHER_CACHE_TIME_KEY);
    
    // Validate cache has proper structure
    let isValidCache = false;
    if (cachedData && cachedTime && (Date.now() - parseInt(cachedTime, 10) < CACHE_DURATION)) {
      try {
        const parsed = JSON.parse(cachedData);
        // Check if items have required properties
        isValidCache = Array.isArray(parsed) && parsed.length > 0 && 
                      parsed[0].celsius !== undefined && 
                      parsed[0].units !== undefined;
        if (isValidCache) {
          console.log('Loading weather data from cache');
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse cached weather data, fetching fresh.', e);
      }
    }

    console.log('Fetching fresh weather data from Open-Meteo API...');
    const colors = generateUniqueColors();

    try {
      // Fetch weather data for all cities in parallel
      const fetchPromises = CITIES.map(async (city, index) => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility,pressure_msl,uv_index&daily=sunrise,sunset&forecast_days=1&timezone=auto&air_quality_api=cams`;
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error fetching ${city.name}: ${res.status}`);
        }
        const data = await res.json();
        return { city, data, index };
      });

      const results = await Promise.all(fetchPromises);

      // Structure data by city
      const cityDataMap = {};
      
      results.forEach(({ city, data, index }) => {
        const current = data.current;
        const timezone = data.timezone;
        
        // Get local time
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        const localDateTime = formatter.format(now);

        // Parse temperature (in Celsius from API)
        const tempC = current.temperature_2m;
        const tempF = celsiusToFahrenheit(tempC);

        // Get air quality index (if available)
        let aqIndex = 0;
        if (data.current_aqi && data.current_aqi.pm25) {
          aqIndex = data.current_aqi.pm25; // Using PM2.5 as air quality indicator
        }

        cityDataMap[city.id] = {
          id: city.id,
          name: city.name,
          symbol: city.symbol,
          color: colors[index],
          units: ["celsius", "fahrenheit", "pressure", "wind", "visibility", "humidity", "air-quality"],
          unit: 'celsius',
          
          timezone: timezone,
          
          // Temperature values
          celsius: Math.round(tempC * 10) / 10,
          fahrenheit: Math.round(tempF * 10) / 10,
          
          // All metrics
          humidity: current.relative_humidity_2m, // %
          wind: Math.round(current.wind_speed_10m * 10) / 10, // km/h
          visibility: Math.round(current.visibility / 1000 * 10) / 10, // Convert to km
          pressure: Math.round(current.pressure_msl), // hPa
          "air-quality": Math.round(aqIndex * 10) / 10,
          "uv-index": current.uv_index,
          localDateTime: localDateTime,
          weatherCode: current.weather_code,
          sunrise: data.daily?.sunrise?.[0] || '',
          sunset: data.daily?.sunset?.[0] || ''
        };
      });

      const items = Object.values(cityDataMap);

      // Save to Cache
      localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(items));
      localStorage.setItem(WEATHER_CACHE_TIME_KEY, Date.now().toString());

      return items;
    } catch (err) {
      console.error('Failed to fetch from Open-Meteo API, falling back to expired cache:', err);
      if (cachedData) {
        try {
          return JSON.parse(cachedData);
        } catch (e) {
          console.error('Failed to parse fallback cache', e);
          throw err;
        }
      }
      throw err;
    }
  }

  // Generate BUBBLE_CAROUSEL_CONFIG from weather data
  async function generateCarouselConfig() {
    const weatherItems = await fetchWeatherData();
    
    // Get current time with color based on sun position
    const now = new Date();
    const hours = now.getHours();
    let sunColor = 'oklch(78% 0.23 85)'; // Default sun color
    
    // Change sun color based on time of day
    if (hours >= 6 && hours < 12) {
      sunColor = 'oklch(85% 0.25 70)'; // Morning - brighter yellow
    } else if (hours >= 12 && hours < 17) {
      sunColor = 'oklch(78% 0.23 85)'; // Afternoon - normal yellow
    } else if (hours >= 17 && hours < 19) {
      sunColor = 'oklch(72% 0.22 30)'; // Evening - orange
    } else {
      sunColor = 'oklch(30% 0 0)'; // Night - dark
    }

    // Build config
    const config = {
      "title": "Weather Data",
      "baseBubbleSize": 120,
      "maxGrowth": 50,
      "defaultIndex": 0,
      "centerBubbleEnabled": true,
      "centerBubble": {
        "id": "sun",
        "name": "Sun",
        "symbol": "☀️",
        "color": sunColor,
        "units": ["date", "time", "uv-index"],
        "unit": "time",
        "date": now.toLocaleDateString(),
        "time": now.toLocaleTimeString(),
        "uv-index": 0,
        "description": "Current date, time and UV index of selected city"
      },
      "items": [
        ...weatherItems,
        {
          "id": "add-city",
          "name": "Add City",
          "symbol": "➕",
          "color": "rgba(255,255,255,0.12)",
          "units": ["celsius", "fahrenheit", "pressure", "wind", "visibility", "humidity", "air-quality"],
          "unit": "celsius",
          "isAddButton": true
        }
      ]
    };

    return config;
  }

  // Update config every 10 minutes
  function startAutoUpdate(callback) {
    // Initial update
    generateCarouselConfig().then(callback);
    
    // Update every 10 minutes
    updateInterval = setInterval(() => {
      generateCarouselConfig().then(callback);
    }, CACHE_DURATION);
  }

  // Stop auto updates
  function stopAutoUpdate() {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }

  // Export helper globally
  window.WeatherConfigHelper = {
    fetchWeatherData,
    generateCarouselConfig,
    startAutoUpdate,
    stopAutoUpdate,
    clearCache: () => {
      localStorage.removeItem(WEATHER_CACHE_KEY);
      localStorage.removeItem(WEATHER_CACHE_TIME_KEY);
    }
  };
})();
