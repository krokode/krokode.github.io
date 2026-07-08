// 3DBubbleCarousel/bubbleConfig.js

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
      "units": ["steps", "calories", "meters", "minutes"], // default index 0
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
      "units": ["protein", "carbs", "fat", "fiber", "calories"], // default index 0
      "protein": 45,
      "carbs": 60,
      "fat": 10,
      "fiber": 5,
      "calories": 400,
      "unit": "protein"
    },
    {
      "id": "orange_red",
      "name": "Orange Red",
      "color": "oklch(70% 0.23 45)",
      "units": ["vitamin D", "vitamin C", "vitamin A"], // default index 0
      "vitamin D": 8000,
      "vitamin C": 8000,
      "vitamin A": 5000,
      "unit": "vitamin D"
    },
    {
      "id": "honey",
      "name": "Honey",
      "color": "oklch(80% 0.18 85)",
      "units": ["kilograms", "liters"], // default index 0
      "kilograms": 12,
      "liters": 5,
      "unit": "kilograms"
    },
    {
      "id": "saturn",
      "name": "Saturn",
      "color": "hsl(338, 90%, 48%)",
      "units": [
        "mass",
        "radius",
        "distance",
        "gravity"
      ],
      "unit": "distance",
      "mass": 5.6846e+26,
      "radius": 60268,
      "distance": 1.43,
      "gravity": 10.44,
    },
    {
      "id": "moon",
      "name": "Moon",
      "color": "hsl(180, 7%, 62%)",
      "units": [
        "mass",
        "radius",
        "distance",
        "gravity"
      ],
      "unit": "gravity",
      "mass": 7.35e+22,
      "radius": 1738,
      "distance": 384400,
      "gravity": 1.62,
    },
    {
      "id": "add-activity",
      "name": "Add New",
      "color": "rgba(255,255,255,0.08)",
      "units": [],
      "value": 0,
      "goal": 1,
      "unit": "",
      "isAddButton": true
    }
  ]
};
