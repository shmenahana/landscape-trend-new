import React from 'react';
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { eyebrowStyle } from '../theme';

/**
 * Eased translateY(18px)+fade entrance — the default entrance per the motion
 * rules (never linear). `delay` is in frames; `distance` and `duration` are
 * tunable for scene-specific polish.
 */
export const RiseIn: React.FC<{
  delay?: number;
  distance?: number;
  duration?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, distance = 18, duration = 20, style, children }) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  });
  return (
    <div
      style={{
        ...style,
        opacity: t,
        transform: `translateY(${(1 - t) * distance}px)`,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Spring-based scale-in with a slight overshoot — used for the logo reveal.
 */
export const SpringIn: React.FC<{
  delay?: number;
  from?: number;
  style?: React.CSSProperties;
  children: React.ReactNode;
}> = ({ delay = 0, from = 0.7, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, mass: 0.7, stiffness: 120 },
  });
  const scale = interpolate(s, [0, 1], [from, 1]);
  return (
    <div
      style={{
        ...style,
        opacity: interpolate(s, [0, 0.4], [0, 1], {
          extrapolateRight: 'clamp',
        }),
        transform: `scale(${scale})`,
      }}
    >
      {children}
    </div>
  );
};

export const Eyebrow: React.FC<{
  children: React.ReactNode;
  delay?: number;
  fontSize?: number;
  style?: React.CSSProperties;
}> = ({ children, delay = 0, fontSize = 22, style }) => {
  return (
    <RiseIn delay={delay} distance={12}>
      <div style={{ ...eyebrowStyle, fontSize, ...style }}>{children}</div>
    </RiseIn>
  );
};
