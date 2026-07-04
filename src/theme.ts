/**
 * Brand tokens for Groundswork.ai.
 *
 * Single source of truth for colors, typography and spacing. Both the 16:9
 * and 9:16 compositions read from here, and — per the Phase 2 note — this file
 * is intended to remain the reference palette when the same copy/timing config
 * is reused as a caption track over real footage.
 */

export const colors = {
  soil: '#171c14', // bg base
  soil2: '#232b1e', // bg radial highlight
  moss: '#4a5d3a',
  leaf: '#8fbf4d', // primary accent
  hay: '#d9a441', // warm / secondary accent
  bone: '#efeae0', // text
  boneDim: 'rgba(239,234,224,0.62)',
} as const;

export const fonts = {
  display: 'Fraunces', // headlines
  body: 'Archivo', // body / eyebrows
} as const;

/**
 * Eyebrow styling helper — uppercase, wide tracking, hay color.
 */
export const eyebrowStyle = {
  fontFamily: fonts.body,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.3em',
  color: colors.hay,
  fontWeight: 600,
};

export type Colors = typeof colors;
