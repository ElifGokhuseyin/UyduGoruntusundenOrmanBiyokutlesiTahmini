# Forest Theme Redesign Guide

## Overview
Redesign this React + Tailwind CSS biomass estimation web app with a Forest/Tree theme. Replace dark AI-style design with clean light theme using green accents.

---

## Color Palette

- Primary: #22c55e (green-500)
- Primary Dark: #16a34a (green-600)
- Primary Darker: #15803d (green-700)
- Background: #ffffff (white)
- Background Alt: #f0fdf4 (green-50)
- Text Primary: #14532d (green-900)
- Text Secondary: #4b5563 (gray-600)
- Border: #bbf7d0 (green-200)
- Hover: #dcfce7 (green-100)

---

## File Changes

### 1. src/index.css

Remove gradient-bg animation. Update these classes:

```css
.gradient-text {
  @apply bg-clip-text text-transparent bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500;
}

.card-hover {
  @apply transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1;
}
```

Scrollbar color: `rgba(34, 197, 94, 0.4)`

---

### 2. src/App.jsx

Change background class:
- FROM: `gradient-bg`
- TO: `bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50`

Set darkMode default to `false`.

---

### 3. src/components/Navbar.jsx

- Background: `bg-white/90 backdrop-blur-lg border-b border-green-200`
- Logo text: `text-green-700`
- Nav links: `text-gray-700 hover:bg-green-50`
- Active link: `bg-green-100 text-green-700`

---

### 4. src/pages/Home.jsx

Replace colors:
- `text-white` to `text-gray-800`
- `text-gray-300` to `text-gray-700`
- `text-gray-400` to `text-gray-600`
- `bg-white/5` to `bg-white border border-green-100`
- `from-indigo-500 to-purple-600` to `from-green-500 to-emerald-600`
- `shadow-indigo-500` to `shadow-green-500`

---

### 5. src/pages/Predict.jsx

- Cards: `bg-white border border-green-200 shadow-sm`
- Headings: `text-green-800`
- Descriptions: `text-gray-600`
- Dropzone: `border-green-300 hover:border-green-400 bg-green-50/50`
- Buttons: `from-green-500 to-emerald-600`

---

### 6. src/pages/Results.jsx

- Cards: `bg-white shadow-md border border-green-100`
- Headings: `text-green-800`
- Text: `text-gray-600`

---

### 7. src/pages/About.jsx

- Model cards: `bg-white border border-green-200 shadow-sm`
- Headings: `text-green-800`
- Descriptions: `text-gray-600`

---

### 8. src/components/ComparisonCard.jsx

- Card: `bg-white border border-green-200 shadow-lg`
- Heading: `text-green-800`
- Subtext: `text-gray-600`
- Metrics boxes: `bg-green-50 border border-green-200`

---

### 9. src/components/MetricsDisplay.jsx

- Container: `bg-white border border-green-200 rounded-2xl`
- Table header: `bg-green-50`
- Table text: `text-gray-700`
- Chart colors: use green shades `#22c55e, #16a34a, #15803d`

---

## Summary

1. REMOVE: Dark mode, purple/blue/pink colors, dark glassmorphism
2. BACKGROUND: White with subtle green tints
3. TEXT: Dark green and gray (not white)
4. BUTTONS: Green gradients
5. CARDS: White with green borders
6. ICONS: Green color
