/**
 * Google Fonts loading via @remotion/google-fonts.
 *
 * loadFont() is idempotent and returns the exact family name to use, but we
 * pin the families in theme.ts so both stay in sync. Importing this module for
 * its side effect ensures the fonts are registered before the first frame.
 */
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadArchivo } from '@remotion/google-fonts/Archivo';

// Fraunces: display face. Load the weights + italic used across scenes.
export const fraunces = loadFraunces('normal', {
  weights: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
});
export const frauncesItalic = loadFraunces('italic', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

// Archivo: body / eyebrow face.
export const archivo = loadArchivo('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const ensureFonts = () => {
  // Touch the exports so bundlers keep the side-effecting imports.
  return [fraunces, frauncesItalic, archivo];
};
