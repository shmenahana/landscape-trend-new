import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors } from '../theme';

/**
 * Radial gradient base: soil-2 at top center fading to soil at the edges.
 * A faint second radial adds depth without reading as a shimmer.
 */
export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.soil,
        backgroundImage: `radial-gradient(120% 90% at 50% 0%, ${colors.soil2} 0%, ${colors.soil} 60%)`,
      }}
    >
      <AbsoluteFill
        style={{
          backgroundImage: `radial-gradient(60% 50% at 50% 8%, rgba(143,191,77,0.06) 0%, rgba(23,28,20,0) 70%)`,
        }}
      />
    </AbsoluteFill>
  );
};
