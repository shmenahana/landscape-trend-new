import { useVideoConfig } from 'remotion';

/**
 * Orientation-aware layout helper. The 16:9 and 9:16 comps share every scene
 * component; this hook is how each scene reflows. `portrait` drives stacking
 * decisions (e.g. feature cards go vertical) and `pad` gives a safe content
 * inset that scales with the frame.
 */
export const useLayout = () => {
  const { width, height } = useVideoConfig();
  const portrait = height > width;
  return {
    width,
    height,
    portrait,
    // Horizontal safe-area padding.
    pad: portrait ? width * 0.09 : width * 0.11,
    // Content max width so lines don't run edge-to-edge on 16:9.
    contentWidth: portrait ? width * 0.86 : Math.min(width * 0.72, 1300),
  };
};
