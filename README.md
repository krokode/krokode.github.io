# 3D Planetary Bubble Carousel (Vanilla HTML/CSS/JS Component)

A highly responsive, self-contained 3D elliptical carousel component built in pure Vanilla HTML, CSS, and JavaScript. 
Features smooth inertia transitions, 3D depth scaling, and touch/drag gestures. Decoupled from all framework state bindings and loaded dynamically via JSON configuration.

---

## File Structure

- `bubbleConfig.js` - Global JavaScript object configuration declaring the header title, sizing parameters, and bubble data.
- `bubble-carousel.css` - Component-specific stylesheet with responsive rules and self-contained variables.
- `bubble-carousel.js` - Standalone Vanilla JS Class (`BubbleCarousel`) managing coordinates, touch events, and resizing.
- `stats-editor.js` - Modular UI component (`StatsEditor`) that constructs the stats overlay editor interface.
- `stats-editor.css` - Dedicated stylesheet containing all styling rules for the overlay editor card.
- `add-bubble.js` - Modular UI component (`AddBubble`) that constructs the custom color picker and dynamic units form.
- `add-bubble.css` - Dedicated stylesheet containing styling rules for the add bubble form panels and sliders.
- `index.html` - Static sandbox page mounting and previewing the component.
- `index.css` - Layout styles and light theme transitions for the sandbox container page.
- `index.js` - Bootstrap script instantiating the carousel class and implementing metric-cycling callbacks.

---

## Getting Started & Integration

### Traditional Web Projects (WordPress, PHP, Django, Shopify, Static Websites)

Because this component is built using pure Vanilla JS and CSS, it has **zero external framework dependencies**. You can drop it directly into any traditional web project (WordPress, PHP, Django, Shopify, static websites, etc.) simply by adding standard `<script>` and `<link>` tags to your HTML templates.

#### 1. Include Stylesheet & Script
Load the Material Icons font, the stylesheet, and the script in your HTML template (e.g., in `header.php` for WordPress, base template for Django, or index file):

```html
<!-- Google Material Symbols Outlined -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">

<!-- Carousel CSS -->
<link rel="stylesheet" href="./bubble-carousel.css">

<!-- Configuration File -->
<script src="./bubbleConfig.js"></script>

<!-- Carousel Script -->
<script src="./bubble-carousel.js"></script>
```

#### 2. Add Mount Element
Place a container element where you want the carousel to render in your page/layout:

```html
<div id="my-carousel" style="width: 100%; max-width: 600px; height: 350px;"></div>
```

#### 3. Instantiate the Class
Add a script block to initialize the carousel after the DOM loads:

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const carousel = new BubbleCarousel('#my-carousel', {
    config: BUBBLE_CAROUSEL_CONFIG,
    
    onIndexChange: (index) => {
      console.log('Focused bubble index:', index);
    },
    
    onItemClick: (item, index, isFocused) => {
      console.log('Clicked item:', item.name);
    }
  });

  await carousel.init();
});
```

---

### React Integration

To integrate the vanilla 3D Bubble Carousel into a React application, you can wrap it in a functional React component using standard hooks (`useRef` and `useEffect`).

#### 1. Create a Wrapper Component

Create a file named `BubbleCarouselWrapper.jsx`:

```jsx
import React, { useEffect, useRef } from 'react';
import './bubble-carousel.css'; 
// If importing directly from your JS folder, import BubbleCarousel class
import BubbleCarousel from './bubble-carousel.js'; 

export default function BubbleCarouselWrapper({ config, onIndexChange, onItemClick }) {
  const containerRef = useRef(null);
  const carouselInstanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Instantiate Vanilla BubbleCarousel
    // Fall back to window.BubbleCarousel if loaded globally via script tags
    const CarouselClass = BubbleCarousel || window.BubbleCarousel;
    
    const carousel = new CarouselClass(containerRef.current, {
      config,
      onIndexChange,
      onItemClick
    });

    carousel.init().catch(console.error);
    carouselInstanceRef.current = carousel;

    // Clean up on unmount
    return () => {
      if (carouselInstanceRef.current) {
        carouselInstanceRef.current.destroy();
      }
    };
  }, [config]);

  // Synchronize changes to items list if updated dynamically
  useEffect(() => {
    if (carouselInstanceRef.current && config?.items) {
      carouselInstanceRef.current.updateItems(config.items);
    }
  }, [config?.items]);

  return (
    <div 
      ref={containerRef} 
      className="bubble-carousel-react-container" 
      style={{ width: '100%', height: '350px', position: 'relative' }}
    />
  );
}
```

#### 2. Use it in a React Component

```jsx
import React, { useState } from 'react';
import BubbleCarouselWrapper from './BubbleCarouselWrapper';

const INITIAL_CONFIG = {
  title: "My React Carousel",
  baseBubbleSize: 120,
  maxGrowth: 50,
  defaultIndex: 0,
  items: [
    { id: "bubble_steps", name: "Steps", color: "oklch(76% 0.25 142)", units: ["steps"], steps: 6000, unit: "steps" },
    { id: "bubble_cals", name: "Calories", color: "oklch(68% 0.22 220)", units: ["calories"], calories: 350, unit: "calories" }
  ]
};

export function App() {
  const [config, setConfig] = useState(INITIAL_CONFIG);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <BubbleCarouselWrapper 
        config={config}
        onIndexChange={(index) => console.log('Index changed to:', index)}
        onItemClick={(item) => console.log('Clicked item:', item.name)}
      />
    </div>
  );
}
```

---

## Configuration Schema (`bubbleConfig.js`)

Declare layout settings and initial items list as a JavaScript object. Each item can declare multiple measurement units (`units` array) along with their corresponding values (e.g., `steps`, `calories`, `meters`, `minutes`), defining the default starting active unit (`unit` key):

```javascript
// bubbleConfig.js
const BUBBLE_CAROUSEL_CONFIG = {
  "title": "Bubbles Summary",
  "baseBubbleSize": 120,
  "maxGrowth": 50,
  "defaultIndex": 0,
  "items": [
    {
      "id": "lime_green",
      "name": "Lime Green",
      "color": "oklch(76% 0.25 142)",
      "units": ["steps", "calories", "meters", "minutes"],
      "steps": 6542,
      "calories": 450,
      "meters": 1200,
      "minutes": 30,
      "unit": "steps"
    },
    {
      "id": "azure",
      "name": "Azure",
      "color": "oklch(68% 0.22 220)",
      "units": ["protein", "carbs", "fat", "fiber", "calories"],
      "protein": 45,
      "carbs": 60,
      "fat": 10,
      "fiber": 5,
      "calories": 400,
      "unit": "protein"
    }
  ]
};
```

---

## Constructor Options

When instantiating `new BubbleCarousel(selector, options)`, you can provide:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `configPath` | `string` | `null` | Path to load the JSON configuration file. |
| `config` | `object` | `null` | Direct configuration object (skips network fetch). |
| `onIndexChange` | `function` | `null` | Fired when focused bubble changes: `(index) => void` |
| `onItemClick` | `function` | `null` | Fired when a bubble is clicked: `(item, index, isFocused) => void` |
| `renderBubbleBadge` | `function` | `null` | Render badge overlays: `(item, index, isFocused) => HTMLElement \| string` |
| `renderBubbleContent` | `function` | `null` | Custom bubble inside content: `(item, isFocused) => HTMLElement \| string` |

---

## API Methods

- **`async init()`**: Fetches configuration, builds elements, registers resize listeners, binds touch/mouse drag gestures, and renders.
- **`updateItems(newItemsList)`**: Redraws the carousel with a new set of data (useful for swapping display modes).
- **`setHeaderActions(node)`**: Appends a custom element (like a play/stop tracking button) to the top right of the widget header.
- **`setOverlayContent(node)`**: Renders a custom overlay view (like an inline statistics editor form) directly covering the widget. Pass `null` to clear.
- **`selectIndex(index)`**: Programmatically focuses a specific bubble.
- **`destroy()`**: Cleans up event listeners and disconnects resize observers.

---

## Styling & Theme

Variables are encapsulated under `.bubble-carousel-widget-card`. Define these variables on any parent container to override the default dark theme palette:

```css
#my-carousel {
  --movemate-primary: #19e65e;
  --movemate-primary-cyan: #00d2ff;
  --movemate-error: #ff4b4b;
  --movemate-border: rgba(255, 255, 255, 0.12);
  --movemate-bg-deep: #121914;
  --movemate-text: #ffffff;
  --movemate-text-secondary: rgba(255, 255, 255, 0.7);
  --movemate-text-muted: rgba(255, 255, 255, 0.5);
  --movemate-dark-bg: #0b0e0c;
}
```

---

## License

This project is licensed under the MIT License:

```text
MIT License

Copyright (c) 2026 Yudayev Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
