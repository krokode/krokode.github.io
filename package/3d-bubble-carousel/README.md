# 3d-bubble-carousel

A standalone, vanilla JavaScript-based 3D Planetary Bubble Carousel. Shows interactive bubbles floating in 3D orbit depth projection with built-in swipe dragging, dynamic size scaling based on target values, and overlay editor sheets.

## Installation

Add it as a dependency in your `package.json`:

```json
"dependencies": {
  "3d-bubble-carousel": "file:../3d-bubble-carousel"
}
```

Or run:

```bash
npm install /path/to/3d-bubble-carousel
```

## Features

- **3D Orbital Layout:** Floating planet bubble coordinate placement calculated on dynamic ellipse tilt axes.
- **Drag & Swipe Gestures:** Physics-supported mouse and touch drag scrolling.
- **Dynamic Bubble Progress Sizing:** Automatically expands focused bubble dimensions proportional to target goals.
- **Built-in Editor Panels:** Interactive Add Bubble plane color-picker overlay and inline quick-adjust stepper.

## API Reference

### `BubbleCarousel` Class

#### `new BubbleCarousel(elementOrSelector, options)`
- `elementOrSelector`: DOM element or CSS selector string to mount the carousel.
- `options` properties:
  - `config`: Configuration object with items, base sizes, and title.
  - `persistKey`: String key to automatically save/load state via `localStorage`.
  - `onIndexChange`: Callback `(index) => void` fired when swipe focused item shifts.
  - `onItemClick`: Callback `(item, index, isFocused) => void` triggered on mouse select.
  - `renderBubbleBadge`: Callback `(item, index, isFocused) => HTMLElement | string | null` to inject visual badge indicators.
  - `renderBubbleContent`: Callback `(item, isFocused, dynamicSize) => HTMLElement | string | null` to customize internal bubble layout.

---

## Example Usage

```javascript
import { BubbleCarousel } from '3d-bubble-carousel';

const carousel = new BubbleCarousel('#my-mount-point', {
  config: {
    title: "Metrics Summary",
    baseBubbleSize: 120,
    maxGrowth: 50,
    items: [
      { id: 'walk', name: 'Walk', color: 'var(--walking)', steps: 6000, goal: 10000, unit: 'steps', units: ['steps'] }
    ]
  },
  onIndexChange: (idx) => console.log('focused item:', idx)
});

await carousel.init();
```
