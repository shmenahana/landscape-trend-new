# AI-Powered Image Generation System

## Overview

The Fili Content System now uses **AI-powered image generation** via OpenAI's DALL-E 3 to create professional, engaging social media graphics. No more bland text-on-background - these are realistic, high-quality images that stop the scroll.

## Why AI Image Generation?

After testing programmatic SVG graphics, we found they were "very bland" and wouldn't work for viral social media content. Research showed:

- **77% of creators** use AI as an "essential partner" in their workflows (2026)
- [Canva dominates](https://www.canva.com/newsroom/news/design-trends-2026/) with 260M users, but their API is Enterprise-only
- [DALL-E 3 wins for social media graphics](https://desinance.com/design/best-ai-image-generators/) - 95% text accuracy, realistic images
- [Before/after transformations](https://insidea.com/blog/marketing/landscapers/content-ideas-for-instagram-and-facebook/) and educational content drive 21.2% more engagement

**Solution:** Use OpenAI's DALL-E 3 API to generate professional graphics with realistic landscape photography, professional layouts, and engaging visuals.

## What It Creates

### ✅ AI-Generated Graphic Types

1. **Quote Graphics** (1024x1024)
   - Realistic landscape backgrounds (lawn textures, gardens, tools)
   - Professional typography with brand colors
   - Attribution and company info
   - Forest green (#2C5F2D) branding

2. **Educational Tip Graphics** (1024x1792 vertical)
   - Numbered tip lists with icons
   - Seasonal photography backgrounds
   - Clean, professional infographic layout
   - Contact information footer

3. **Seasonal Reminder Graphics** (1024x1024)
   - Authentic Northeast Ohio seasonal imagery
   - Service timing and benefits
   - Eye-catching "IT'S TIME FOR..." headers
   - Clear call-to-action with phone number

4. **Before/After Templates** (1792x1024 landscape)
   - Split-screen comparisons
   - Realistic project transformations
   - Professional portfolio quality
   - Branding and contact info

### 📐 File Format

**PNG (High-Quality)**
- ✅ HD quality from DALL-E 3
- ✅ Professional, realistic imagery
- ✅ Supported by all social platforms
- ✅ 1024x1024 or larger resolution
- ✅ Engaging visuals that stop the scroll

## Setup

### 1. Install Dependencies

```bash
npm install openai
```

### 2. Set OpenAI API Key

```bash
export OPENAI_API_KEY="your-api-key-here"
```

Or add to `.env` file:
```
OPENAI_API_KEY=sk-proj-...
```

### 3. Verify Setup

```bash
node scripts/generate-ai-graphic.js
```

Should show usage instructions if setup is correct.

## Usage

### Command Line

```bash
# Quote graphic
node scripts/generate-ai-graphic.js quote "Fall aeration beats spring every time" graphics/quote.png

# Educational tip list
node scripts/generate-ai-graphic.js tips "5 Signs Your Retaining Wall is Failing" graphics/tips.png "Visible bowing" "Cracks wider than 1/4 inch" "Water pooling behind wall"

# Seasonal reminder
node scripts/generate-ai-graphic.js seasonal "Aeration" "September 15 - October 31" graphics/aeration.png fall "Thicker grass by spring" "Better water absorption"

# Before/after template
node scripts/generate-ai-graphic.js beforeafter "Retaining Wall Replacement" graphics/template.png
```

### From JavaScript/Agent

```javascript
const {
  generateQuoteGraphic,
  generateTipGraphic,
  generateSeasonalGraphic,
  generateBeforeAfterTemplate
} = require('./scripts/generate-ai-graphic.js');

// Quote
await generateQuoteGraphic({
  quote: "A retaining wall without drainage is just expensive firewood waiting to happen",
  attribution: "Fili Property Maintenance",
  output: "./graphics/retaining-wall-quote.png"
});

// Educational tips
await generateTipGraphic({
  title: "5 Signs Your Retaining Wall is Failing",
  tips: [
    "Visible bowing or leaning",
    "Cracks wider than 1/4 inch",
    "Water pooling behind wall",
    "Soil erosion at base",
    "Rotting wood (railroad ties)"
  ],
  output: "./graphics/wall-tips.png",
  season: "fall"
});

// Seasonal reminder
await generateSeasonalGraphic({
  service: "Fall Aeration",
  timing: "September 15 - October 31",
  benefits: [
    "Thicker grass by spring",
    "Better water absorption",
    "Reduced soil compaction"
  ],
  output: "./graphics/aeration-reminder.png",
  season: "fall"
});

// Before/after
await generateBeforeAfterTemplate({
  projectType: "Retaining Wall Replacement",
  output: "./graphics/beforeafter.png"
});
```

## Brand Consistency

All AI-generated graphics automatically include:

- **Forest Green**: #2C5F2D (primary brand color)
- **Professional aesthetic** - upscale, trustworthy, local business
- **Northeast Ohio authenticity** - realistic for the region
- **Contact info**: (330) 904-4196
- **Location**: North Canton, Ohio
- **Company name**: Fili Property Maintenance

## File Structure

```
landscape-trend-new/
├── scripts/
│   ├── generate-ai-graphic.js    # AI image generator
│   └── generate-graphic.js       # (Old SVG system - deprecated)
├── graphics/                     # Output folder for images
│   ├── quote.png
│   ├── tips.png
│   └── seasonal.png
└── IMAGE_GENERATION_README.md    # This file
```

## Integration with Content System

The Visual Content Generator agent (`/agents/visual-content-generator.md`) uses this system to automatically create graphics when you run:

```
Create content about [topic]
```

The full workflow:
1. Master Content Creator → writes blog post
2. Multi-Platform Distributor → adapts for each platform
3. **Visual Content Generator → creates 3 AI graphics automatically**
4. GHL Auto-Scheduler → posts everything with graphics attached

## Cost Considerations

**DALL-E 3 Pricing (as of Jan 2026):**
- HD quality (1024x1024): ~$0.040 per image
- HD quality (1024x1792): ~$0.080 per image

**Typical usage:**
- 3 graphics per blog post = ~$0.16
- 12 blog posts per month = ~$1.92/month
- Much cheaper than hiring a designer or VA for each graphic

**Alternative considered:**
- Bannerbear: $49/mo for 1000 credits
- Placid: $19/mo for 500 credits
- Canva API: Enterprise-only pricing

**Winner:** OpenAI DALL-E 3 - better quality, lower cost, API access

## Examples of Generated Graphics

### Quote Graphic
Professional landscape background with overlay:
```
"Fall aeration in clay soil beats spring aeration every time.
Here's why..."

— Fili Property Maintenance
North Canton, Ohio
```
Realistic lawn texture, forest green branding, professional typography

### Educational Tip Graphic
```
┌────────────────────────────────┐
│ 5 SIGNS YOUR RETAINING WALL   │  <- Professional header
│ IS FAILING                     │     with landscape background
├────────────────────────────────┤
│ 1. Visible bowing or leaning   │
│ 2. Cracks wider than 1/4 inch  │
│ 3. Water pooling behind wall   │
│ 4. Soil erosion at base        │
│ 5. Rotting wood (ties)         │
├────────────────────────────────┤
│ Fili Property Maintenance      │  <- Contact footer
│ (330) 904-4196                 │
└────────────────────────────────┘
```
Seasonal photography, numbered icons, professional layout

### Seasonal Reminder
```
[Beautiful fall leaves on lawn background]

IT'S TIME FOR
FALL AERATION

September 15 - October 31

• Thicker grass by spring
• Better water absorption
• Reduced soil compaction

Book Your North Canton Service
(330) 904-4196
```
Authentic Northeast Ohio seasonal imagery, clear CTA

## What Makes These Graphics Work

✅ **Realistic imagery** - Actual landscape photos, not generic stock
✅ **Professional design** - Clean layouts, good typography
✅ **Brand colors** - Forest green, consistent branding
✅ **Mobile-optimized** - Text readable on phones
✅ **Seasonal authenticity** - Looks like Northeast Ohio
✅ **Clear CTAs** - Phone number, service info
✅ **Engaging visuals** - Stop the scroll, drive engagement

## Research Sources

Based on extensive research of viral social media graphics in 2026:

- [Canva's 2026 design trends](https://www.canva.com/newsroom/news/design-trends-2026/) - "Imperfect by Design"
- [Best AI image generators](https://desinance.com/design/best-ai-image-generators/) - DALL-E 3 comparison
- [Landscape business social media](https://insidea.com/blog/marketing/landscapers/content-ideas-for-instagram-and-facebook/) - 21.2% more engagement with videos/graphics
- [Bannerbear alternatives](https://templated.io/blog/best-bannerbear-alternatives/) - Cost comparison

## Troubleshooting

**Error: OPENAI_API_KEY not set**
```bash
export OPENAI_API_KEY="sk-proj-..."
```

**Error: OpenAI API Error**
- Check API key is valid
- Verify billing is set up on OpenAI account
- Check rate limits (default: 5 requests/min)

**Graphics look different than expected**
- AI generates unique images each time
- Prompts can be adjusted in `generate-ai-graphic.js`
- Regenerate if first result isn't perfect

**File size too large**
- DALL-E 3 generates high-quality PNGs
- Compress if needed: `convert input.png -quality 85 output.jpg`
- Or use online compressor: https://tinypng.com

## Future Enhancements

Want to add:
- [ ] Batch generation for monthly content calendar
- [ ] Custom logo overlay on AI-generated images
- [ ] Video generation using AI (DALL-E video beta)
- [ ] Integration with MidJourney when API becomes available
- [ ] A/B testing of different graphic styles

---

**System Status:** ✅ Fully Operational - Creating professional AI graphics that stop the scroll!
