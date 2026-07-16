# Weather Bubble Carousel

An interactive 3D weather bubble carousel built with the **3D-Bubble-Carousel** package and the **Open-Meteo API**. This project displays real-time weather data for 7 major world cities with comprehensive metrics including temperature, humidity, wind speed, UV index, visibility, pressure, air quality, and local date/time.

## Features

🌍 **7 Global Cities**
- San Francisco (🌉)
- New York (🗽)
- London (🇬🇧)
- Antwerpen (🇧🇪)
- Almaty (🏔️)
- Basseterre, St Kitts (🏝️)
- Sydney (🦘)

📊 **Comprehensive Weather Metrics**
- **Temperature** (°C/°F) - Click bubble to toggle units
- **Humidity** (%) - Relative humidity
- **Wind Speed** (km/h) - 10m wind speed
- **UV Index** - Solar radiation intensity
- **Visibility** (km) - Horizontal visibility range
- **Pressure** (hPa) - Atmospheric pressure
- **Air Quality** - PM2.5 based air quality index
- **Local Date & Time** - Timezone-aware time display
- **Weather Condition** - Icon-based weather description

🎨 **Interactive Features**
- **3D Bubble Carousel** - Smooth rotation and scaling
- **Dynamic Sizing** - Bubbles grow/shrink based on temperature deviation
- **Hover Tooltips** - Detailed weather metrics on hover (keeping emojis for rich descriptions)
- **Emoji-Free Bubbles** - Bubbles themselves have a clean typography-focused look without symbols
- **Dynamic Sun Bubble** - The center bubble displays a ticking local clock, local date, or UV index of the active city, and cycles units on click
- **Sunrise/Sunset Sun Colors** - The Sun bubble color changes dynamically based on day, night, or golden hour in the active city
- **Theme Toggle** - Light/dark mode support
- **Data Caching** - 10-minute cache to minimize API calls
- **Auto-Refresh** - Manual refresh button to clear cache, custom cities, and settings

## Installation & Usage

### 1. Copy to your project
```bash
cp -r weather-bubble-example-frompackage /path/to/your/project/
```

### 2. Open in browser
```bash
# Simply open index.html in a web browser
# No build process required!

# Or use a local server (recommended):
python -m http.server 8000
# Then visit: http://localhost:8000/weather-bubble-example-frompackage/
```

## Project Structure

```
weather-bubble-example-frompackage/
├── index.html                 # Main HTML file
├── weather-index.js          # Carousel initialization & event handlers
├── weatherConfigHelper.js    # Weather data fetching & caching
├── weather-custom.css        # Custom styling
└── README.md                 # This file
```

## How It Works

### 1. **Data Fetching** (weatherConfigHelper.js)
- Fetches real-time weather data from [Open-Meteo API](https://open-meteo.com/)
- No API key required - completely free!
- Supports 7 cities simultaneously
- Caches data for 10 minutes to minimize API calls

### 2. **Carousel Initialization** (weather-index.js)
- Loads fetched weather data into the BubbleCarousel
- Initializes 3D bubble rendering with weather metrics
- Sets up event handlers for interactions

### 3. **Styling** (weather-custom.css)
- Responsive design for mobile & desktop
- Dark/light theme support
- Custom tooltip styling for weather metrics
- Smooth animations and transitions

## API Information

**API Used:** [Open-Meteo](https://open-meteo.com/)

### Key Parameters
```
latitude, longitude     → Location coordinates
current=              → Current weather variables
  temperature_2m      → Air temperature at 2m height
  relative_humidity   → Relative humidity
  wind_speed_10m      → Wind speed at 10m height
  visibility          → Horizontal visibility
  pressure_msl        → Sea level pressure
  uv_index            → UV radiation index
  weather_code        → WMO weather interpretation code
air_quality_api=cams → CAMS air quality data
timezone=auto        → Automatic timezone detection
```

## Features in Detail

### Temperature Unit Toggle
Click on any focused bubble to cycle between **Celsius** and **Fahrenheit**. Your preference is saved in localStorage.

### Dynamic Bubble Sizing
Bubbles scale based on temperature deviation from a baseline (25°C / 77°F):
- Hot cities → larger bubbles
- Cold cities → smaller bubbles
- Creates visual impact of thermal differences

### Air Quality Indicator
Color-coded air quality status:
- ✅ **Excellent** (PM2.5 ≤ 10)
- 🟢 **Good** (10 < PM2.5 ≤ 25)
- 🟡 **Moderate** (25 < PM2.5 ≤ 50)
- 🟠 **Poor** (50 < PM2.5 ≤ 100)
- 🔴 **Very Poor** (PM2.5 > 100)

### Ticking Clock & Local Time Display (Sun Bubble)
The Sun bubble in the center acts as a ticking clock and information display for the focused city. It will cycle between local time (updated in real-time every second), local date, and the UV index when clicked.

### Sunrise & Sunset Sun Colors
The Sun bubble changes its background color dynamically depending on the current time in the active city relative to its sunrise and sunset:
- ☀️ **Daytime**: Warm Golden Yellow (`oklch(85% 0.23 85)`)
- 🌅 **Golden Hour**: Sunset Orange/Red (`oklch(68% 0.22 40)`) within 45 minutes of sunrise or sunset
- 🌌 **Nighttime**: Deep Twilight Indigo (`oklch(35% 0.08 260)`)

## Customization

### Adding More Cities
You can add new cities directly from the UI without modifying source code:
1. Click the **+ ADD CITY** bubble in the carousel.
2. Enter the city name (e.g., `Paris` or `Tokyo`) and an optional symbol/emoji.
3. The system automatically searches the **Open-Meteo Geocoding API** to resolve its coordinates and local timezone under the hood and generates the new bubble!

Alternatively, to add default pre-loaded cities, edit the `DEFAULT_CITIES` array in `weatherConfigHelper.js`:
```javascript
const DEFAULT_CITIES = [
  { id: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522, symbol: '🗼' },
  // Add more default cities...
];
```

### Changing Metrics
Modify the `fetchWeatherData()` function to include/exclude metrics:
```javascript
// In the API URL, modify the 'current=' parameter
const url = `https://api.open-meteo.com/v1/forecast?...&current=temperature_2m,your_metric_here`;
```

### Customizing Colors
Edit the `generateUniqueColors()` function to use fixed colors:
```javascript
function generateUniqueColors() {
  return ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];
}
```

### Styling
All custom styles are in `weather-custom.css`. Modify:
- Colors via CSS variables (--text-primary, --bg-primary, etc.)
- Font sizes and families
- Animation durations
- Tooltip appearance

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- **API Calls:** Limited to once every 10 minutes (cached)
- **Bundle Size:** ~50KB total (HTML + CSS + JS)
- **Load Time:** ~2-3 seconds (including API fetch)
- **Memory:** Minimal - only 7 data items in memory

## Troubleshooting

### Weather data not loading
1. Check your internet connection
2. Verify Open-Meteo API is accessible: https://api.open-meteo.com/v1/forecast?latitude=51.5&longitude=-0.1
3. Clear cache: Click "Refresh Weather" button
4. Check browser console for error messages

### Tooltips not showing
- Hover over bubbles (not just clicking)
- Ensure CSS is fully loaded
- Check for JavaScript errors in console

### Theme not persisting
- Check that localStorage is enabled in your browser
- Clear browser cache if needed

### Units not toggling
- Click on the **focused** (centered) bubble
- Click the same bubble again to cycle units

## Credits

- **3D Bubble Carousel Package:** [3d-bubble-carousel](../package/3d-bubble-carousel/)
- **Weather Data:** [Open-Meteo.com](https://open-meteo.com/)
- **Icons:** Material Symbols by Google
- **Fonts:** Inter, Outfit from Google Fonts

## License

MIT License - Feel free to use and modify for your projects!

## Future Enhancements

- [ ] Historical weather trends (last 7 days)
- [ ] Weather alerts and warnings
- [ ] Custom city selection UI
- [ ] Animated weather transitions
- [ ] Pollen count data
- [ ] Solar radiation details
- [ ] Export weather data as CSV
- [ ] Multi-language support

---

**Last Updated:** July 2026  
**API Version:** Open-Meteo v1  
**Browser Support:** Modern browsers (ES6+)
