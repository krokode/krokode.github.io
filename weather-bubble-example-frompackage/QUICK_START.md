/* weather-bubble-example-frompackage/QUICK_START.md */

# Quick Start Guide - Weather Bubble Carousel

## 🚀 Get Running in 30 Seconds

### Option 1: Python HTTP Server (Recommended)
```bash
cd weather-bubble-example-frompackage
python -m http.server 8000
# Open browser: http://localhost:8000
```

### Option 2: Node.js HTTP Server
```bash
npx http-server -p 8000
# Open browser: http://localhost:8000
```

### Option 3: VS Code Live Server
1. Install "Live Server" extension
2. Right-click `index.html`
3. Select "Open with Live Server"

### Option 4: Direct File Open
Simply open `index.html` in your browser (but some features may be limited)

---

## 📍 Cities & Coordinates

| City | Emoji | Latitude | Longitude |
|------|-------|----------|-----------|
| San Francisco | 🌉 | 37.7749 | -122.4194 |
| New York | 🗽 | 40.7128 | -74.0060 |
| London | 🇬🇧 | 51.5074 | -0.1278 |
| Antwerpen | 🇧🇪 | 51.2194 | 4.4024 |
| Almaty | 🏔️ | 43.2380 | 76.9464 |
| Basseterre | 🏝️ | 17.3010 | -62.7330 |
| Sydney | 🦘 | -33.8688 | 151.2093 |

---

## 📊 Metrics Displayed

### Primary Metric (Inside Bubble)
- 🌡️ **Temperature** (°C/°F) - Click to toggle

### Hover Tooltip (All Details)
| Metric | Unit | Symbol |
|--------|------|--------|
| Temperature | °C or °F | 🌡️ |
| Wind Speed | km/h | 💨 |
| UV Index | 0-20+ | ☀️ |
| Visibility | km | 👁️ |
| Pressure | hPa | 🔽 |
| Humidity | % | 💧 |
| Air Quality | PM2.5 µg/m³ | 🌫️ |
| Local Date & Time | HH:MM:SS | 📍 |
| Weather Condition | Icon text | ⛅ |

---

## 🎮 How to Interact

### Mouse/Touch
- **Drag/Rotate:** Click and drag to rotate carousel
- **Focus Bubble:** Click any bubble to center it
- **Toggle Unit:** Click focused bubble again to toggle °C/°F
- **View Details:** Hover over any bubble to see tooltip

### Buttons
- **🔄 Refresh Weather:** Clear cache and fetch fresh data
- **💡 Theme Toggle:** Switch between light/dark mode

---

## 🔧 File Descriptions

### `index.html`
- Main HTML structure
- Loads all CSS and JavaScript files
- Sets up mount point for carousel

### `weatherConfigHelper.js`
- Fetches data from Open-Meteo API
- Caches data for 10 minutes
- Formats data for carousel consumption
- Handles temperature conversions

### `weather-index.js`
- Initializes BubbleCarousel with weather data
- Handles user interactions (click, hover)
- Manages theme toggle and refresh button
- Renders bubble content and tooltips
- Updates header with current city info

### `weather-custom.css`
- Custom styling for weather bubbles
- Tooltip appearance
- Theme variables (light/dark)
- Responsive design
- Animations

### `README.md`
- Comprehensive documentation
- Feature explanations
- Customization guide
- Troubleshooting

---

## 🎨 Customization Examples

### Change Temperature Baseline for Sizing
**File:** `weatherConfigHelper.js`, line ~93
```javascript
// Default: 25°C / 77°F baseline
// Change to:
goals: {
  celsius: 20,    // New baseline
  fahrenheit: 68
}
```

### Add a New City
**File:** `weatherConfigHelper.js`, line ~5
```javascript
const CITIES = [
  // ... existing cities ...
  { id: 'tokyo', name: 'Tokyo', lat: 35.6762, lng: 139.6503, symbol: '🗾' },
];
```

### Change Colors
**File:** `weatherConfigHelper.js`, line ~23
```javascript
return hues.map(hue => `hsl(${Math.round(hue)}, 90%, 60%)`);
// Adjust saturation (75%) and lightness (55%) values
```

### Hide a Metric from Tooltip
**File:** `weather-index.js`, search `renderBubbleTooltip`
```javascript
// Comment out any metric row:
/*
<div class="metric-row">
  <span class="metric-label">💧 Humidity:</span>
  <span class="metric-value">${item.humidity}%</span>
</div>
*/
```

---

## 🐛 Common Issues

### Weather data not loading
```
❌ Error: "Failed to fetch from Open-Meteo API"
✅ Solution: Check internet connection and that open-meteo.com is accessible
```

### Tooltips not visible
```
❌ Tooltips don't appear on hover
✅ Solution: Ensure you're hovering (not clicking), check CSS is loaded
```

### Units don't toggle
```
❌ Clicking bubble doesn't change units
✅ Solution: Must click the FOCUSED (centered) bubble, then click again
```

### Browser console errors
```
❌ "Cannot find BubbleCarousel"
✅ Solution: Ensure bubble-carousel.js is in parent directory and loaded
```

---

## 🌐 API Endpoints

### Current Weather Data
```
https://api.open-meteo.com/v1/forecast
  ?latitude={lat}
  &longitude={lng}
  &current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,visibility,pressure_msl,uv_index
  &timezone=auto
  &air_quality_api=cams
```

### Response Example
```json
{
  "current": {
    "temperature_2m": 18.5,
    "relative_humidity_2m": 65,
    "weather_code": 2,
    "wind_speed_10m": 12.3,
    "visibility": 9500,
    "pressure_msl": 1013.25,
    "uv_index": 4.2
  },
  "timezone": "Europe/London"
}
```

---

## 📱 Mobile Tips

- The carousel is fully responsive
- Touch/drag to rotate bubbles
- On mobile, the theme toggle shows as icon only
- Tooltips work on tap/hold
- Try landscape orientation for best view

---

## 🚀 Performance Tips

1. **Reduce Cities:** Remove unused cities from CITIES array
2. **Increase Cache Duration:** Change CACHE_DURATION in weatherConfigHelper.js
3. **Disable Animations:** Set animation durations to 0 in CSS
4. **Lazy Load:** Defer loading until needed

---

## 📚 Learn More

- [Open-Meteo API Docs](https://open-meteo.com/en/docs)
- [3D Bubble Carousel](https://www.npmjs.com/package/3d-bubble-carousel)
- [Material Symbols](https://fonts.google.com/icons)

---

**Ready?** Open `index.html` and start exploring! 🌍
