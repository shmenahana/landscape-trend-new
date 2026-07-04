import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  interpolate,
  random,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors } from '../theme';

/**
 * The signature element: a ground line of grass blades that spring up
 * left-to-right in lockstep with video progress, doubling as a progress bar.
 * A thin dirt-fill bar tracks underneath.
 *
 * Progress is driven by the *master* timeline frame (this overlay sits on top
 * of the whole video), so the line completes exactly as the last scene ends.
 */
export const GrassLine: React.FC<{
  bladeCount?: number;
  /** Height of the whole ground band (blades + dirt), in px. */
  bandHeight?: number;
  /**
   * Frames before the end at which the line reaches 100%. The last scene holds
   * its final frame ~1.5s; completing the grass at the *start* of that hold
   * lets the finished line sit on screen instead of landing on frame one.
   */
  settleFrames?: number;
}> = ({ bladeCount = 46, bandHeight = 60, settleFrames = 0 }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width } = useVideoConfig();

  // Frame at which the line is fully grown.
  const completeFrame = Math.max(1, durationInFrames - 1 - settleFrames);

  const progress = interpolate(frame, [0, completeFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Deterministic per-blade geometry so the line is identical every render.
  const blades = useMemo(() => {
    return Array.from({ length: bladeCount }, (_, i) => {
      const fraction = bladeCount === 1 ? 0 : i / (bladeCount - 1);
      const height = 14 + random(`h-${i}`) * (48 - 14); // 14–48px
      const rotation = (random(`r-${i}`) - 0.5) * 10; // ±5°
      const bladeWidth = 4 + random(`w-${i}`) * 3; // 4–7px, subtle variety
      const stagger = random(`s-${i}`) * 3; // small frame jitter
      return { fraction, height, rotation, bladeWidth, stagger };
    });
  }, [bladeCount]);

  const dirtHeight = 8;

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end' }}>
      <div style={{ position: 'relative', width: '100%', height: bandHeight }}>
        {/* Dirt-fill progress bar */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: dirtHeight,
            backgroundColor: 'rgba(23,28,20,0.9)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            height: dirtHeight,
            backgroundImage: `linear-gradient(90deg, ${colors.moss} 0%, ${colors.leaf} 100%)`,
            boxShadow: `0 0 12px rgba(143,191,77,0.35)`,
          }}
        />

        {/* Grass blades */}
        {blades.map((b, i) => {
          const activationFrame = b.fraction * completeFrame + b.stagger;
          const grow = spring({
            frame: frame - activationFrame,
            fps,
            config: { damping: 12, mass: 0.6, stiffness: 130 },
          });
          const h = b.height * grow;
          const x = b.fraction * width;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                bottom: dirtHeight - 1,
                width: b.bladeWidth,
                height: h,
                marginLeft: -b.bladeWidth / 2,
                borderRadius: b.bladeWidth,
                transformOrigin: 'bottom center',
                transform: `rotate(${b.rotation * grow}deg)`,
                backgroundImage: `linear-gradient(to top, ${colors.moss} 0%, ${colors.leaf} 100%)`,
                opacity: grow > 0.02 ? 1 : 0,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
