#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Brand colors
const BRAND_GREEN = '#2C5F2D';
const WHITE = '#FFFFFF';
const CHARCOAL = '#333333';

/**
 * Generate SVG quote graphic
 */
function generateQuoteGraphic(options) {
  const {
    quote,
    attribution = 'Fili Property Maintenance',
    output,
    width = 1080,
    height = 1080
  } = options;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${BRAND_GREEN}"/>

  <!-- Quote text -->
  <text x="${width/2}" y="${height/2 - 50}"
        font-family="Arial, sans-serif"
        font-size="56"
        font-weight="bold"
        fill="${WHITE}"
        text-anchor="middle"
        dominant-baseline="middle">
    <tspan x="${width/2}" dy="0">${wrapText(quote, 30)[0] || ''}</tspan>
    ${wrapText(quote, 30).slice(1).map((line, i) =>
      `<tspan x="${width/2}" dy="70">${line}</tspan>`
    ).join('\n    ')}
  </text>

  <!-- Attribution -->
  <text x="${width/2}" y="${height - 150}"
        font-family="Arial, sans-serif"
        font-size="28"
        fill="${WHITE}"
        text-anchor="middle">
    — ${attribution}
  </text>
</svg>`;

  fs.writeFileSync(output, svg);
  console.log(`✓ Quote graphic generated: ${output}`);
  return output;
}

/**
 * Generate checklist graphic
 */
function generateChecklistGraphic(options) {
  const {
    title,
    items = [],
    output,
    width = 1080,
    height = 1350
  } = options;

  const headerHeight = 200;
  const footerHeight = 150;
  const itemSpacing = 120;
  const startY = headerHeight + 80;

  const itemElements = items.slice(0, 6).map((item, i) => {
    const y = startY + (i * itemSpacing);
    return `
    <!-- Item ${i + 1} -->
    <rect x="50" y="${y + 10}" width="40" height="40"
          fill="none" stroke="${CHARCOAL}" stroke-width="3"/>
    <text x="120" y="${y + 35}"
          font-family="Arial, sans-serif"
          font-size="28"
          fill="${CHARCOAL}">
      ${escapeXml(item)}
    </text>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- White background -->
  <rect width="${width}" height="${height}" fill="${WHITE}"/>

  <!-- Green header -->
  <rect width="${width}" height="${headerHeight}" fill="${BRAND_GREEN}"/>
  <text x="${width/2}" y="${headerHeight/2 + 20}"
        font-family="Arial, sans-serif"
        font-size="56"
        font-weight="bold"
        fill="${WHITE}"
        text-anchor="middle">
    ${escapeXml(title)}
  </text>

  ${itemElements}

  <!-- Green footer -->
  <rect y="${height - footerHeight}" width="${width}" height="${footerHeight}" fill="${BRAND_GREEN}"/>
  <text x="${width/2}" y="${height - footerHeight + 85}"
        font-family="Arial, sans-serif"
        font-size="28"
        fill="${WHITE}"
        text-anchor="middle">
    Fili Property Maintenance • (330) 904-4196
  </text>
</svg>`;

  fs.writeFileSync(output, svg);
  console.log(`✓ Checklist graphic generated: ${output}`);
  return output;
}

/**
 * Generate simple info graphic
 */
function generateInfoGraphic(options) {
  const {
    title,
    subtitle = '',
    footer = '',
    output,
    width = 1080,
    height = 1080,
    backgroundColor = BRAND_GREEN
  } = options;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${width}" height="${height}" fill="${backgroundColor}"/>

  <!-- Title -->
  <text x="${width/2}" y="${height/2 - 80}"
        font-family="Arial, sans-serif"
        font-size="64"
        font-weight="bold"
        fill="${WHITE}"
        text-anchor="middle">
    <tspan x="${width/2}" dy="0">${wrapText(title, 20)[0] || ''}</tspan>
    ${wrapText(title, 20).slice(1).map((line, i) =>
      `<tspan x="${width/2}" dy="80">${line}</tspan>`
    ).join('\n    ')}
  </text>

  ${subtitle ? `
  <!-- Subtitle -->
  <text x="${width/2}" y="${height/2 + 150}"
        font-family="Arial, sans-serif"
        font-size="32"
        fill="${WHITE}"
        text-anchor="middle">
    ${escapeXml(subtitle)}
  </text>` : ''}

  ${footer ? `
  <!-- Footer -->
  <text x="${width/2}" y="${height - 100}"
        font-family="Arial, sans-serif"
        font-size="28"
        fill="${WHITE}"
        text-anchor="middle">
    ${escapeXml(footer)}
  </text>` : ''}
</svg>`;

  fs.writeFileSync(output, svg);
  console.log(`✓ Info graphic generated: ${output}`);
  return output;
}

/**
 * Wrap text to fit within character limit
 */
function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    if ((currentLine + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Escape XML special characters
 */
function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// CLI handling
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.log('Usage: node generate-graphic.js [command] [options]');
    console.log('Commands: quote, checklist, info');
    console.log('\nExamples:');
    console.log('  node generate-graphic.js quote "Your quote here" output.svg');
    console.log('  node generate-graphic.js checklist "Title" output.svg "Item 1" "Item 2" "Item 3"');
    console.log('  node generate-graphic.js info "Title" "Subtitle" output.svg');
    process.exit(1);
  }

  try {
    if (command === 'quote') {
      generateQuoteGraphic({
        quote: args[1] || 'Test quote',
        output: args[2] || './graphics/test-quote.svg'
      });
    } else if (command === 'checklist') {
      const title = args[1] || 'Test Checklist';
      const output = args[2] || './graphics/test-checklist.svg';
      const items = args.slice(3);

      generateChecklistGraphic({
        title,
        output,
        items: items.length > 0 ? items : ['Item 1', 'Item 2', 'Item 3']
      });
    } else if (command === 'info') {
      generateInfoGraphic({
        title: args[1] || 'Test Title',
        subtitle: args[2] || '',
        output: args[3] || './graphics/test-info.svg'
      });
    } else {
      console.error(`Unknown command: ${command}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export functions for use as module
module.exports = {
  generateQuoteGraphic,
  generateChecklistGraphic,
  generateInfoGraphic,
  BRAND_GREEN,
  WHITE,
  CHARCOAL
};
