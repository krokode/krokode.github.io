// weather-bubble-example-frompackage/weather-index.js

document.addEventListener('DOMContentLoaded', async () => {
  const mountPoint = '#carousel-mount';
  const container = document.querySelector(mountPoint);
  
  if (!container) {
    console.error('Mount point not found');
    return;
  }

  // 1. Show premium loading state
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); font-family: 'Outfit', sans-serif;">
      <span class="material-symbols-outlined" style="font-size: 3rem; margin-bottom: 1rem; animation: spin 1.5s linear infinite;">sync</span>
      <span style="font-size: 1.1rem; font-weight: 500; letter-spacing: 0.05em;">FETCHING WEATHER DATA...</span>
    </div>
  `;

  let rawData = [];
  let carousel = null;
  let currentWeatherConfig = null;
  let selectedCityIndex = 0;

  // Helper to determine sun color based on sunset and sunrise times
  function getSunColor(timezone, sunriseStr, sunsetStr) {
    if (!sunriseStr || !sunsetStr) {
      return 'oklch(78% 0.23 85)'; // Default golden yellow
    }

    try {
      const parseLocalTime = (isoStr) => {
        // isoStr is like "2026-07-15T05:43"
        const timePart = isoStr.split('T')[1];
        const [hours, minutes] = timePart.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const sunriseMinutes = parseLocalTime(sunriseStr);
      const sunsetMinutes = parseLocalTime(sunsetStr);

      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
      });
      const [cityHours, cityMinutes] = formatter.format(now).split(':').map(Number);
      const currentMinutes = cityHours * 60 + cityMinutes;

      // 45 minutes transition window for golden hour
      const transitionDuration = 45;

      const isNearSunrise = Math.abs(currentMinutes - sunriseMinutes) <= transitionDuration;
      const isNearSunset = Math.abs(currentMinutes - sunsetMinutes) <= transitionDuration;

      if (isNearSunrise || isNearSunset) {
        return 'oklch(68% 0.22 40)'; // Sunset Orange/Red
      } else if (currentMinutes > sunriseMinutes + transitionDuration && currentMinutes < sunsetMinutes - transitionDuration) {
        return 'oklch(85% 0.23 85)'; // Daytime Golden Yellow
      } else {
        return 'oklch(35% 0.08 260)'; // Nighttime Deep Twilight Indigo
      }
    } catch (err) {
      console.error('Error calculating sun color:', err);
      return 'oklch(78% 0.23 85)';
    }
  }

  // Helper to format temperature based on unit
  function formatTemperature(celsius, unit = 'celsius') {
    // Defensive check for undefined celsius
    if (celsius === undefined || celsius === null || isNaN(celsius)) {
      celsius = 20; // Fallback value
    }
    
    if (unit === 'fahrenheit') {
      const fahrenheit = (celsius * 9/5) + 32;
      return `${fahrenheit.toFixed(1)}°F`;
    }
    return `${celsius.toFixed(1)}°C`;
  }

  // Helper to get weather description from code
  function getWeatherDescription(code) {
    const weatherCodes = {
      0: '☀️ Clear',
      1: '🌤️ Mostly Clear',
      2: '⛅ Partly Cloudy',
      3: '☁️ Overcast',
      45: '🌫️ Foggy',
      48: '❄️ Foggy',
      51: '🌧️ Light Drizzle',
      53: '🌧️ Moderate Drizzle',
      55: '🌧️ Dense Drizzle',
      61: '🌧️ Slight Rain',
      63: '🌧️ Moderate Rain',
      65: '⛈️ Heavy Rain',
      71: '❄️ Slight Snow',
      73: '❄️ Moderate Snow',
      75: '❄️ Heavy Snow',
      80: '🌧️ Showers',
      81: '🌧️ Heavy Showers',
      82: '⛈️ Violent Showers',
      85: '❄️ Light Snow Showers',
      86: '❄️ Heavy Snow Showers',
      95: '⛈️ Thunderstorm',
      96: '⛈️ Thunderstorm with Hail',
      99: '⛈️ Severe Thunderstorm'
    };
    return weatherCodes[code] || '🌡️ Unknown';
  }

  // Helper to categorize air quality
  function getAQCategory(aq) {
    if (aq <= 10) return { label: '✅ Excellent', class: 'aq-excellent' };
    if (aq <= 25) return { label: '🟢 Good', class: 'aq-good' };
    if (aq <= 50) return { label: '🟡 Moderate', class: 'aq-moderate' };
    if (aq <= 100) return { label: '🟠 Poor', class: 'aq-poor' };
    return { label: '🔴 Very Poor', class: 'aq-veryPoor' };
  }

  try {
    // 2. Generate carousel config from weather data
    currentWeatherConfig = await WeatherConfigHelper.generateCarouselConfig();
    rawData = currentWeatherConfig.items;
    
    // Apply user's unit preferences from localStorage if present
    const savedUnits = JSON.parse(localStorage.getItem('weather_bubble_carousel_units') || '{}');
    rawData = rawData.map(item => ({
      ...item,
      unit: savedUnits[item.id] || item.unit
    }));

    // 3. Initialize BubbleCarousel
    carousel = new BubbleCarousel(mountPoint, {
      config: {
        title: currentWeatherConfig.title,
        baseBubbleSize: currentWeatherConfig.baseBubbleSize,
        maxGrowth: currentWeatherConfig.maxGrowth,
        defaultIndex: currentWeatherConfig.defaultIndex,
        centerBubbleEnabled: currentWeatherConfig.centerBubbleEnabled,
        centerBubble: currentWeatherConfig.centerBubble,
        items: rawData
      },
      autoTitle: false,
      enableDefaultUnitCycling: false,

      onIndexChange: (idx) => {
        selectedCityIndex = idx;
        updateCenterBubble(idx);
      },

      onItemClick: (item, index, isFocused) => {
        if (item.isAddButton) {
          showAddCityModal();
        } else if (index === 'center') {
          cycleSunUnit();
        } else if (isFocused) {
          cycleBubbleUnit(item, index);
        } else {
          carousel.selectIndex(index);
        }
      },

      // Custom HTML renderer inside bubble circles
      renderBubbleContent: (item, isFocused, dynamicSize) => {
        if (item.isAddButton) {
          const plusSize = Math.max(22, Math.round(dynamicSize * 0.25)) + 'px';
          const labelSize = Math.max(10, Math.round(dynamicSize * 0.11)) + 'px';
          return `
            <div class="weather-bubble-content" style="padding: ${Math.round(dynamicSize * 0.06)}px; flex-direction: column;">
              <span style="font-size: ${plusSize}; font-weight: 700; line-height: 1; margin-bottom: 2px;">+</span>
              <span style="font-size: ${labelSize}; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">ADD CITY</span>
            </div>
          `;
        }

        // Render center bubble (Sun) with date, time, or uv-index
        if (item.id === 'sun') {
          let displayValue = '';
          let unitLabel = '';
          const currentUnit = carousel?.config?.centerBubble?.unit || 'time';

          if (currentUnit === 'date') {
            displayValue = item.date || 'Loading...';
            unitLabel = 'Date';
          } else if (currentUnit === 'time') {
            displayValue = item.time || 'Loading...';
            unitLabel = 'Time';
          } else {
            displayValue = (item["uv-index"] || 0).toFixed(1);
            unitLabel = 'UV Index';
          }

          const charLen = displayValue.length;
          let fontScale = 0.22;
          if (charLen > 10) fontScale = 0.13; // For date like "Jul 15, 2026"
          else if (charLen > 6) fontScale = 0.17; // For time like "21:52:37"

          const valueFontSize = Math.max(14, Math.round(dynamicSize * fontScale)) + 'px';
          const labelFontSize = Math.max(10, Math.round(dynamicSize * 0.10)) + 'px';
          const padding = Math.round(dynamicSize * 0.08) + 'px';

          return `
            <div class="weather-bubble-content" style="padding: ${padding};">
              <span class="weather-temp" style="font-size: ${valueFontSize}; font-weight: 700;">${displayValue}</span>
              <span class="weather-location" style="font-size: ${labelFontSize}; margin-top: 6px; opacity: 0.85; text-transform: uppercase; letter-spacing: 0.05em;">${unitLabel}</span>
            </div>
          `;
        }

        // Render weather city bubbles
        let displayValue = '';
        let unitLabel = '';
        
        if (item.unit === 'celsius') {
          displayValue = item.celsius;
          unitLabel = '°C';
        } else if (item.unit === 'fahrenheit') {
          displayValue = item.fahrenheit;
          unitLabel = '°F';
        } else if (item.unit === 'pressure') {
          displayValue = item.pressure;
          unitLabel = 'hPa';
        } else if (item.unit === 'wind') {
          displayValue = item.wind;
          unitLabel = 'km/h';
        } else if (item.unit === 'visibility') {
          displayValue = item.visibility;
          unitLabel = 'km';
        } else if (item.unit === 'humidity') {
          displayValue = item.humidity;
          unitLabel = '%';
        } else if (item.unit === 'air-quality') {
          displayValue = item["air-quality"];
          unitLabel = 'AQI';
        }

        // Significantly increased font sizes for city bubbles
        const valueFontSize = Math.max(16, Math.round(dynamicSize * 0.22)) + 'px';
        const labelFontSize = Math.max(12, Math.round(dynamicSize * 0.11)) + 'px';
        const padding = Math.round(dynamicSize * 0.08) + 'px';

        const formattedVal = (item.unit === 'pressure') 
          ? Number(displayValue).toFixed(0) 
          : Number(displayValue).toFixed(1);

        return `
          <div class="weather-bubble-content" style="padding: ${padding};">
            <span class="weather-temp" style="font-size: ${valueFontSize}; font-weight: 700;">${formattedVal}</span>
            <span class="weather-location" style="font-size: ${labelFontSize}; margin-top: 4px; opacity: 0.85;">${unitLabel}</span>
          </div>
        `;
      },

      // Hover tooltip with all metrics
      renderBubbleBadge: () => null, // Disable default badge
      
      renderBubbleTooltip: (item) => {
        if (item.isAddButton) return '<div class="weather-tooltip"><div class="tooltip-header">Click to add a new city</div></div>';

        // Tooltip for center bubble (Sun)
        if (item.id === 'sun') {
          const selectedCity = rawData[selectedCityIndex];
          return `
            <div class="weather-tooltip">
              <div class="tooltip-header">${item.symbol} Local Weather Info</div>
              <div class="tooltip-local-time">Click to cycle: Date • Time • UV Index</div>
              <hr style="margin: 8px 0; opacity: 0.3;">
              <div class="tooltip-metrics">
                <div class="metric-row">
                  <span class="metric-label">📍 City:</span>
                  <span class="metric-value">${selectedCity.name}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">📅 Date:</span>
                  <span class="metric-value">${item.date || 'Loading...'}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">🕐 Time:</span>
                  <span class="metric-value">${item.time || 'Loading...'}</span>
                </div>
                <div class="metric-row">
                  <span class="metric-label">☀️ UV Index:</span>
                  <span class="metric-value">${(item["uv-index"] || 0).toFixed(1)}</span>
                </div>
              </div>
            </div>
          `;
        }

        const tempValue = item.unit === 'fahrenheit' ? item.fahrenheit : item.celsius;
        const aqStatus = getAQCategory(item["air-quality"] || 0);
        const weatherDesc = getWeatherDescription(item.weatherCode || 0);

        // Defensive values with fallbacks
        const wind = item.wind || 0;
        const uvIndex = item["uv-index"] || 0;
        const visibility = item.visibility || 0;
        const pressure = item.pressure || 0;
        const humidity = item.humidity || 0;

        return `
          <div class="weather-tooltip">
            <div class="tooltip-header">${item.symbol || '🌍'} ${item.name || 'Unknown'}</div>
            <div class="tooltip-local-time">Click bubble to cycle units • 📍 ${item.localDateTime || 'Loading...'}</div>
            <hr style="margin: 8px 0; opacity: 0.3;">
            <div class="tooltip-metrics">
              <div class="metric-row">
                <span class="metric-label">🌡️ Temperature:</span>
                <span class="metric-value">${formatTemperature(item.celsius || 20, item.unit)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">💨 Wind Speed:</span>
                <span class="metric-value">${wind.toFixed(1)} km/h</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">☀️ UV Index:</span>
                <span class="metric-value">${uvIndex.toFixed(1)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">👁️ Visibility:</span>
                <span class="metric-value">${visibility.toFixed(1)} km</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">🔽 Pressure:</span>
                <span class="metric-value">${pressure.toFixed(0)} hPa</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">💧 Humidity:</span>
                <span class="metric-value">${humidity}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">🌫️ Air Quality:</span>
                <span class="metric-value ${aqStatus.class}">${aqStatus.label}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">⛅ Condition:</span>
                <span class="metric-value">${weatherDesc}</span>
              </div>
            </div>
          </div>
        `;
      }
    });

    await carousel.init();

    // Add click handler for center bubble
    if (carousel.centerBubble && carousel.centerBubble.element) {
      carousel.centerBubble.element.style.cursor = 'pointer';
      carousel.centerBubble.element.addEventListener('click', (e) => {
        e.stopPropagation();
        cycleSunUnit();
      });
    }

    function updateCenterBubble(cityIndex) {
      if (!carousel || !rawData[cityIndex] || rawData[cityIndex].isAddButton) return;
      
      const selectedCity = rawData[cityIndex];
      const now = new Date();
      const timezone = selectedCity.timezone || 'UTC';
      
      // Calculate sun color based on sunset and sunrise of selected city
      const sunColor = getSunColor(timezone, selectedCity.sunrise, selectedCity.sunset);

      // Format date and time local to selected city
      const dateOptions = {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      };
      const timeOptions = {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      const cityDate = new Intl.DateTimeFormat('en-US', dateOptions).format(now);
      const cityTime = new Intl.DateTimeFormat('en-US', timeOptions).format(now);

      let sunUnit = carousel.config.centerBubble?.unit || 'time';
      let sunValue = '';
      if (sunUnit === 'date') {
        sunValue = cityDate;
      } else if (sunUnit === 'time') {
        sunValue = cityTime;
      } else {
        sunValue = (selectedCity["uv-index"] || 0).toFixed(1);
      }

      carousel.config.centerBubble = {
        id: 'sun',
        name: 'Sun',
        symbol: '☀️',
        color: sunColor,
        units: ["date", "time", "uv-index"],
        unit: sunUnit,
        date: cityDate,
        time: cityTime,
        "uv-index": selectedCity["uv-index"] || 0,
        sunValue: sunValue,
        description: `${sunUnit === 'date' ? 'Local Date' : sunUnit === 'time' ? 'Local Time' : 'UV Index'} for ${selectedCity.name}`
      };
      
      // Update DOM directly to avoid drag interference on clock ticks
      const containerEl = document.querySelector(mountPoint);
      if (containerEl) {
        const centerBubbleEl = containerEl.querySelector('.center-bubble');
        if (centerBubbleEl) {
          const circle = centerBubbleEl.querySelector('.bubble-circle');
          if (circle) {
            circle.style.background = sunColor;
            const dynamicSize = parseInt(circle.style.width, 10) || 120;
            const customContent = carousel.renderBubbleContent(carousel.config.centerBubble, true, dynamicSize);
            if (typeof customContent === 'string') {
              circle.innerHTML = customContent;
            }
          }
        }
      }
    }

    // Helper to show "Add City" modal
    function showAddCityModal() {
      const modal = document.createElement('div');
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-family: 'Inter', sans-serif;
      `;

      const modalContent = document.createElement('div');
      modalContent.style.cssText = `
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 2rem;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      `;

      let htmlContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="margin: 0; font-size: 1.5rem; color: var(--text-primary);">➕ Add New City</h2>
          <button id="close-modal" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">✕</button>
        </div>
        
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">City Name</label>
          <input id="city-name-input" type="text" placeholder="e.g. Paris, Tokyo, Berlin" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); box-sizing: border-box;">
        </div>

        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.9rem;">City Symbol/Emoji (Optional)</label>
          <input id="city-symbol-input" type="text" placeholder="e.g. 🗼, 🌸, 🏰 (Default: 🌍)" maxlength="2" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary); box-sizing: border-box;">
        </div>

        <div id="modal-status-msg" style="margin-bottom: 1.25rem; font-size: 0.85rem; display: none;"></div>

        <div style="display: flex; gap: 1rem;">
          <button id="add-city-btn" style="flex: 1; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;">Add City</button>
          <button id="cancel-btn" style="flex: 1; padding: 0.75rem; background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: 6px; font-weight: 600; cursor: pointer;">Cancel</button>
        </div>
      `;

      modalContent.innerHTML = htmlContent;
      modal.appendChild(modalContent);
      document.body.appendChild(modal);

      // Event listeners
      document.getElementById('close-modal').addEventListener('click', () => modal.remove());
      document.getElementById('cancel-btn').addEventListener('click', () => modal.remove());
      
      const addCityBtn = document.getElementById('add-city-btn');
      const statusMsg = document.getElementById('modal-status-msg');

      addCityBtn.addEventListener('click', async () => {
        const name = document.getElementById('city-name-input').value.trim();
        const symbol = document.getElementById('city-symbol-input').value.trim() || '🌍';

        if (!name) {
          statusMsg.style.color = '#ef4444';
          statusMsg.textContent = '⚠️ Please enter a city name.';
          statusMsg.style.display = 'block';
          return;
        }

        // Show loading state
        addCityBtn.disabled = true;
        addCityBtn.style.opacity = '0.7';
        addCityBtn.textContent = 'Searching...';
        statusMsg.style.color = 'var(--text-secondary)';
        statusMsg.textContent = 'Searching geocoding database...';
        statusMsg.style.display = 'block';

        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`);
          if (!res.ok) {
            throw new Error(`Network response error: ${res.status}`);
          }
          const data = await res.json();
          
          if (!data.results || data.results.length === 0) {
            statusMsg.style.color = '#ef4444';
            statusMsg.textContent = '❌ City not found. Please verify spelling.';
            addCityBtn.disabled = false;
            addCityBtn.style.opacity = '1';
            addCityBtn.textContent = 'Add City';
            return;
          }

          const cityInfo = data.results[0];
          const foundName = cityInfo.name;
          const lat = cityInfo.latitude;
          const lng = cityInfo.longitude;
          const timezone = cityInfo.timezone || 'auto';

          // Store new city in localStorage
          const storedCities = JSON.parse(localStorage.getItem('weather_bubble_carousel_custom_cities') || '[]');
          
          // Check duplicate
          const isDuplicate = storedCities.some(c => c.name.toLowerCase() === foundName.toLowerCase());
          if (isDuplicate) {
            statusMsg.style.color = '#f59e0b';
            statusMsg.textContent = 'ℹ️ City already added to your carousel.';
            addCityBtn.disabled = false;
            addCityBtn.style.opacity = '1';
            addCityBtn.textContent = 'Add City';
            return;
          }

          storedCities.push({
            id: `custom-${Date.now()}`,
            name: foundName,
            lat: lat,
            lng: lng,
            symbol: symbol,
            timezone: timezone
          });
          localStorage.setItem('weather_bubble_carousel_custom_cities', JSON.stringify(storedCities));

          statusMsg.style.color = '#10b981';
          statusMsg.textContent = '✅ City found! Loading...';

          setTimeout(() => {
            modal.remove();
            // Clear weather cache
            WeatherConfigHelper.clearCache();
            location.reload();
          }, 800);

        } catch (err) {
          console.error('Error looking up city geocoding:', err);
          statusMsg.style.color = '#ef4444';
          statusMsg.textContent = '❌ Error searching city. Please try again.';
          addCityBtn.disabled = false;
          addCityBtn.style.opacity = '1';
          addCityBtn.textContent = 'Add City';
        }
      });

      // Focus on name input
      document.getElementById('city-name-input').focus();
    }

    // Set initial center bubble
    updateCenterBubble(selectedCityIndex);

    // Setup refresh button with user feedback
    const refreshBtn = document.getElementById('reset-defaults-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        refreshBtn.style.opacity = '0.5';
        refreshBtn.style.pointerEvents = 'none';
        
        // Clear all cached states and settings
        WeatherConfigHelper.clearCache();
        localStorage.removeItem('weather_bubble_carousel_units');
        localStorage.removeItem('weather_bubble_carousel_custom_cities');
        localStorage.removeItem('theme');
        
        refreshBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.1rem">done</span><span>Refreshing...</span>';
        
        setTimeout(() => {
          location.reload();
        }, 500);
      });
    }

    // Setup theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    const htmlElement = document.documentElement;
    
    if (themeBtn) {
      const savedTheme = localStorage.getItem('theme') || 'dark';
      htmlElement.setAttribute('data-theme', savedTheme);
      updateThemeButton(savedTheme);

      themeBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
      });
    }

    function updateThemeButton(theme) {
      const btnText = document.getElementById('theme-btn-text');
      const icon = themeBtn.querySelector('.material-symbols-outlined');
      const mountElement = document.querySelector(mountPoint);
      if (theme === 'dark') {
        btnText.textContent = 'Light Mode';
        icon.textContent = 'light_mode';
        if (mountElement) mountElement.classList.remove('light-theme');
      } else {
        btnText.textContent = 'Dark Mode';
        icon.textContent = 'dark_mode';
        if (mountElement) mountElement.classList.add('light-theme');
      }
      if (carousel) {
        carousel.render();
      }
    }

    // Helper to cycle through all weather units (temp, pressure, wind, visibility, humidity, air-quality)
    function cycleBubbleUnit(item, index) {
      // Cycle through all available units for this city
      const currentUnitIndex = item.units.indexOf(item.unit);
      const nextUnit = item.units[(currentUnitIndex + 1) % item.units.length];
      
      // Update the item
      item.unit = nextUnit;

      // Save to localStorage
      const savedUnits = JSON.parse(localStorage.getItem('weather_bubble_carousel_units') || '{}');
      savedUnits[item.id] = nextUnit;
      localStorage.setItem('weather_bubble_carousel_units', JSON.stringify(savedUnits));

      // Refresh carousel
      if (carousel) {
        carousel.updateItems(rawData);
        updateCenterBubble(index);
      }
    }

    // Helper to cycle sun bubble between date, time, and uv-index
    function cycleSunUnit() {
      if (!carousel || !carousel.config.centerBubble) return;
      const units = carousel.config.centerBubble.units || ["date", "time", "uv-index"];
      const currentUnit = carousel.config.centerBubble.unit || 'time';
      const currentIndex = units.indexOf(currentUnit);
      const nextUnit = units[(currentIndex + 1) % units.length];
      
      carousel.config.centerBubble.unit = nextUnit;
      updateCenterBubble(selectedCityIndex);
    }

    // Start auto-update every 10 minutes
    WeatherConfigHelper.startAutoUpdate(async (newConfig) => {
      console.log('Weather data updated');
      const newItems = newConfig.items;
      const savedUnits = JSON.parse(localStorage.getItem('weather_bubble_carousel_units') || '{}');
      rawData = newItems.map(item => ({
        ...item,
        unit: savedUnits[item.id] || item.unit
      }));
      
      if (carousel) {
        carousel.updateItems(rawData);
        updateCenterBubble(selectedCityIndex);
      }
    });

    // Start real-time ticking for the center bubble (Sun)
    const clockInterval = setInterval(() => {
      if (carousel) {
        updateCenterBubble(selectedCityIndex);
      }
    }, 1000);

  } catch (error) {
    console.error('Error initializing weather carousel:', error);
    container.innerHTML = `
      <div style="color: var(--text-secondary); text-align: center; padding: 2rem;">
        <p>Failed to load weather data</p>
        <p style="font-size: 0.9rem; opacity: 0.7;">${error.message}</p>
      </div>
    `;
  }
});
