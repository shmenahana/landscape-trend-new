#!/usr/bin/env node

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Brand colors for reference in prompts
const BRAND_GREEN = '#2C5F2D';
const EARTH_BROWN = '#8B4513';
const WHITE = '#FFFFFF';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generate AI-powered quote graphic
 */
async function generateQuoteGraphic(options) {
  const {
    quote,
    attribution = 'Fili Property Maintenance',
    output,
    style = 'professional'
  } = options;

  const prompt = `Create a professional social media graphic for a landscaping company called Fili Property Maintenance in North Canton, Ohio.

Style: Clean, modern, professional landscaping business aesthetic with forest green (#2C5F2D) as the primary brand color.

Content to include:
- Quote text: "${quote}"
- Attribution: "— ${attribution}"
- Subtle landscaping elements in background (lawn texture, leaves, or garden tools)
- Professional typography with the quote as the main focus
- Format: Square (1080x1080) Instagram/Facebook post

Design approach: Upscale, trustworthy, local business feel. NOT corporate or generic. Think high-end landscape design firm, not big box store. The background should be tasteful - either a subtle texture, blurred landscape photo, or solid forest green with elegant accents.

Text should be clearly readable, professionally laid out, with good contrast. Modern sans-serif font.`;

  console.log('🎨 Generating AI quote graphic...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
    style: 'natural'
  });

  const imageUrl = response.data[0].url;
  await downloadImage(imageUrl, output);

  console.log(`✓ AI quote graphic generated: ${output}`);
  return output;
}

/**
 * Generate educational/tip list graphic
 */
async function generateTipGraphic(options) {
  const {
    title,
    tips = [],
    output,
    season = 'general'
  } = options;

  const tipsText = tips.slice(0, 5).map((tip, i) => `${i + 1}. ${tip}`).join('\n');

  const prompt = `Create a professional, engaging social media graphic for a landscaping company called Fili Property Maintenance.

Style: Modern, clean, educational infographic style with forest green (#2C5F2D) branding.

Content:
- Header: "${title}"
- Tips/Points:
${tipsText}
- Footer: "Fili Property Maintenance • (330) 904-4196"

Design elements:
- Clean numbered list with icons or checkmarks
- Professional layout with good spacing
- Seasonal theme: ${season === 'spring' ? 'fresh green grass, new growth' : season === 'fall' ? 'autumn leaves, rich browns' : season === 'winter' ? 'snow, evergreens' : 'lush green lawn'}
- Modern typography
- Format: Vertical (1080x1350) for Instagram feed

The graphic should look like something a professional landscaping company would post - trustworthy, informative, and visually appealing. Include subtle landscape photography or illustrations as background, not just text on solid color.`;

  console.log('🎨 Generating AI tip list graphic...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1792',
    quality: 'hd',
    style: 'natural'
  });

  const imageUrl = response.data[0].url;
  await downloadImage(imageUrl, output);

  console.log(`✓ AI tip graphic generated: ${output}`);
  return output;
}

/**
 * Generate seasonal reminder graphic
 */
async function generateSeasonalGraphic(options) {
  const {
    service,
    timing,
    benefits = [],
    output,
    season = 'fall'
  } = options;

  const benefitsText = benefits.map(b => `• ${b}`).join('\n');

  const seasonalBackgrounds = {
    spring: 'vibrant green grass starting to grow, cherry blossoms, fresh landscaping',
    summer: 'lush green lawn in full sun, bright flowers, healthy landscape',
    fall: 'autumn leaves falling on a lawn, rich fall colors, golden light',
    winter: 'light snow on evergreens, dormant lawn preparation, winter landscape prep'
  };

  const prompt = `Create a professional seasonal reminder social media graphic for a landscaping service.

Company: Fili Property Maintenance
Location: North Canton, Ohio
Brand color: Forest green (#2C5F2D)

Main content:
- Large, eye-catching text: "IT'S TIME FOR ${service.toUpperCase()}"
- Timing: "${timing}"
- Benefits:
${benefitsText}
- Call to action: "Book Your North Canton Service" with phone (330) 904-4196

Background: Beautiful ${seasonalBackgrounds[season] || seasonalBackgrounds.fall}

Design style: Professional but approachable, like something you'd see from a high-end local landscaping company. The image should feel authentic to Northeast Ohio, not generic stock photo. Show actual lawn/landscape elements relevant to the season.

Format: Square (1080x1080) for Instagram/Facebook/Google Business Profile

The graphic should stop the scroll - visually striking, seasonal colors, clear message, professional branding.`;

  console.log('🎨 Generating AI seasonal graphic...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1024x1024',
    quality: 'hd',
    style: 'natural'
  });

  const imageUrl = response.data[0].url;
  await downloadImage(imageUrl, output);

  console.log(`✓ AI seasonal graphic generated: ${output}`);
  return output;
}

/**
 * Generate before/after template graphic
 */
async function generateBeforeAfterTemplate(options) {
  const {
    projectType,
    output
  } = options;

  const prompt = `Create a professional before/after template graphic for a landscaping company.

Company: Fili Property Maintenance
Brand: Forest green (#2C5F2D), professional, trustworthy

Design:
- Split screen layout with "BEFORE" and "AFTER" labels
- Left side: Show a typical "before" state for ${projectType} - overgrown, damaged, or neglected
- Right side: Show the "after" transformation - professional, beautiful, well-maintained
- Include subtle branding elements in forest green
- Bottom section with: "Fili Property Maintenance | North Canton, OH | (330) 904-4196"

The graphic should look like a professional portfolio piece from a high-end landscaping company. Realistic, authentic Northeast Ohio landscape, NOT generic or stock-looking.

Project type: ${projectType}

Format: Landscape (1200x675) for Facebook/LinkedIn sharing

Style: Clean, professional, with clear before/after comparison that showcases transformation quality.`;

  console.log('🎨 Generating AI before/after template...');

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: '1792x1024',
    quality: 'hd',
    style: 'natural'
  });

  const imageUrl = response.data[0].url;
  await downloadImage(imageUrl, output);

  console.log(`✓ AI before/after template generated: ${output}`);
  return output;
}

/**
 * Download image from URL to file
 */
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download image: ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
    }).on('error', reject);
  });
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable not set');
    console.log('\nSet it with:');
    console.log('  export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }

  if (!command) {
    console.log('Usage: node generate-ai-graphic.js [command] [options]');
    console.log('\nCommands:');
    console.log('  quote       - Generate quote graphic');
    console.log('  tips        - Generate educational tip list');
    console.log('  seasonal    - Generate seasonal service reminder');
    console.log('  beforeafter - Generate before/after template');
    console.log('\nExamples:');
    console.log('  node generate-ai-graphic.js quote "Fall aeration beats spring every time" graphics/quote.png');
    console.log('  node generate-ai-graphic.js seasonal "Aeration" "September 15 - October 31" graphics/aeration.png fall');
    console.log('  node generate-ai-graphic.js tips "5 Signs Your Retaining Wall is Failing" graphics/tips.png');
    console.log('  node generate-ai-graphic.js beforeafter "Retaining Wall Replacement" graphics/template.png');
    process.exit(1);
  }

  (async () => {
    try {
      if (command === 'quote') {
        await generateQuoteGraphic({
          quote: args[1] || 'Fall aeration in clay soil beats spring aeration every time.',
          output: args[2] || './graphics/ai-quote.png'
        });
      } else if (command === 'tips') {
        const title = args[1] || '5 Lawn Care Tips';
        const output = args[2] || './graphics/ai-tips.png';
        const tips = args.slice(3);

        await generateTipGraphic({
          title,
          output,
          tips: tips.length > 0 ? tips : [
            'Aerate in fall for clay soil',
            'Mulch in spring (2-3 inches)',
            'Check retaining walls for bowing',
            'Plan hardscape projects in winter',
            'Book spring cleanup by February'
          ],
          season: 'fall'
        });
      } else if (command === 'seasonal') {
        await generateSeasonalGraphic({
          service: args[1] || 'Aeration',
          timing: args[2] || 'September 15 - October 31',
          output: args[3] || './graphics/ai-seasonal.png',
          season: args[4] || 'fall',
          benefits: args.slice(5).length > 0 ? args.slice(5) : [
            'Thicker grass by spring',
            'Better water absorption',
            'Reduced soil compaction'
          ]
        });
      } else if (command === 'beforeafter') {
        await generateBeforeAfterTemplate({
          projectType: args[1] || 'Retaining Wall Replacement',
          output: args[2] || './graphics/ai-beforeafter.png'
        });
      } else {
        console.error(`❌ Unknown command: ${command}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      if (error.response) {
        console.error('OpenAI API Error:', error.response.data);
      }
      process.exit(1);
    }
  })();
}

// Export functions for use as module
module.exports = {
  generateQuoteGraphic,
  generateTipGraphic,
  generateSeasonalGraphic,
  generateBeforeAfterTemplate
};
