# Automated Image Generation System

## Overview

The Fili Content System now includes **fully automated SVG graphic generation**. No external tools needed - graphics are created programmatically using pure JavaScript and saved to the `/graphics` folder.

## What It Creates

### ✅ Supported Graphic Types

1. **Quote Graphics** (1080x1080)
   - Forest green background
   - White text with proper line wrapping
   - Attribution line
   - Fili branding

2. **Checklist Graphics** (1080x1350)
   - Green header with title
   - Up to 6 checklist items with checkboxes
   - Green footer with contact info
   - Professional layout

3. **Info Graphics** (1080x1080)
   - Customizable background color
   - Title + subtitle + footer options
   - Clean, centered layout
   - Brand colors

### 📐 File Format

**SVG (Scalable Vector Graphics)**
- ✅ Perfect quality at any size
- ✅ Small file sizes (typically <10KB)
- ✅ Can be converted to PNG/JPG if needed
- ✅ Supported by GoHighLevel, Facebook, Instagram, LinkedIn
- ✅ Text remains crisp and readable

## Usage

### Command Line

```bash
# Quote graphic
node scripts/generate-graphic.js quote "Your quote here" graphics/output.svg

# Checklist graphic
node scripts/generate-graphic.js checklist "Title" graphics/output.svg "Item 1" "Item 2" "Item 3"

# Info graphic
node scripts/generate-graphic.js info "Main Title" "Subtitle" graphics/output.svg
```

### From JavaScript/Agent

```javascript
const { generateQuoteGraphic, generateChecklistGraphic, generateInfoGraphic } = require('./scripts/generate-graphic.js');

// Quote
await generateQuoteGraphic({
  quote: "January planning provides better scheduling...",
  attribution: "Fili Property Maintenance",
  output: "./graphics/january-quote.svg"
});

// Checklist
await generateChecklistGraphic({
  title: "PLAN NOW FOR:",
  items: [
    "Spring Cleanup (March-April)",
    "Fall Aeration ($150-300)",
    "Hardscape Projects",
    "Landscape Design"
  ],
  output: "./graphics/planning-checklist.svg"
});

// Info
await generateInfoGraphic({
  title: "September 15",
  subtitle: "Aeration Season Starts",
  footer: "(330) 904-4196",
  output: "./graphics/aeration-date.svg"
});
```

## Brand Colors

Automatically applied to all graphics:

- **Forest Green**: `#2C5F2D` (primary brand)
- **White**: `#FFFFFF` (text, backgrounds)
- **Charcoal**: `#333333` (accents, checkboxes)

## File Structure

```
landscape-trend-new/
├── scripts/
│   └── generate-graphic.js    # Main generator script
├── graphics/                  # Output folder for generated images
│   ├── test-quote.svg
│   └── test-checklist.svg
└── IMAGE_GENERATION_README.md # This file
```

## Integration with Content System

The Visual Content Generator agent (`/agents/visual-content-generator.md`) uses this system to automatically create graphics when you run:

```
Create content about [topic]
```

The full workflow:
1. Master Content Creator → writes blog post
2. Multi-Platform Distributor → adapts for each platform
3. **Visual Content Generator → creates 3 graphics automatically**
4. GHL Auto-Scheduler → posts everything with graphics attached

## Examples

### Quote Graphic
```svg
<!-- Forest green background with centered white quote text -->
"January planning provides better scheduling and
optimal project timing for the season ahead."

— Fili Property Maintenance
```

### Checklist Graphic
```
┌────────────────────────────────┐
│   PLAN NOW FOR:                │  <- Green header
├────────────────────────────────┤
│ ☐ Spring Cleanup (March-April)│
│ ☐ Fall Aeration ($150-300)    │
│ ☐ Hardscape Projects          │
│ ☐ Landscape Design            │
├────────────────────────────────┤
│ Fili Property Maintenance •   │  <- Green footer
│ (330) 904-4196                │
└────────────────────────────────┘
```

## Converting SVG to PNG/JPG

If a platform doesn't accept SVG (rare), convert using:

**Option 1: Online Tools**
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

**Option 2: Command Line (if imagemagick installed)**
```bash
convert input.svg output.png
```

**Option 3: Your VA in Canva**
- Upload SVG to Canva
- Export as PNG

## Advantages of This Approach

✅ **Zero dependencies** - Pure JavaScript, no npm packages needed
✅ **Fast** - Generates in milliseconds
✅ **Perfect text** - No AI garbling, exact fonts
✅ **Consistent branding** - Exact brand colors every time
✅ **Small files** - SVGs are tiny (<10KB typically)
✅ **Scalable** - Works at any resolution
✅ **Editable** - SVGs can be tweaked in code or tools

## Future Enhancements

Want to add:
- [ ] PNG export (requires imagemagick or sharp)
- [ ] Logo overlay (add Fili logo to graphics)
- [ ] More templates (comparison charts, timelines)
- [ ] Photo backgrounds (vs solid colors)
- [ ] AI image generation for realistic scenes

For now, text-based graphics cover 90% of your content needs!

## Support

Issues? Check:
1. Is Node.js installed? (`node --version`)
2. Does `/graphics` folder exist? (`ls graphics`)
3. Is the script executable? (`chmod +x scripts/generate-graphic.js`)
4. Run with `node scripts/generate-graphic.js` to see usage

---

**System Status:** ✅ Fully Operational - Creating graphics automatically!
