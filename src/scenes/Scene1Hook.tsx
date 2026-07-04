import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, fonts } from '../theme';
import { COPY } from '../video.config';
import { RiseIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 1 — HOOK. A large clock ticks 7:04 PM → 7:09 PM across the scene while
 * the headline and sub fade up beneath it.
 */
export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { portrait, contentWidth } = useLayout();
  const c = COPY.hook;

  // Tick through 7:04 → 7:09 (six discrete minutes) over the scene.
  const minuteFloat = interpolate(frame, [0, durationInFrames - 1], [4, 9], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const minute = Math.min(9, Math.floor(minuteFloat));
  const clock = `7:0${minute} PM`;

  const clockSize = portrait ? 150 : 190;
  const headlineSize = portrait ? 88 : 108;
  const subSize = portrait ? 36 : 40;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ width: contentWidth }}>
        <RiseIn delay={4} distance={10}>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 300,
              fontSize: clockSize,
              color: colors.hay,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: portrait ? 56 : 48,
            }}
          >
            {clock}
          </div>
        </RiseIn>

        <RiseIn delay={22}>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: headlineSize,
              color: colors.bone,
              lineHeight: 1.05,
              letterSpacing: '-0.015em',
            }}
          >
            {c.headline[0]}
            <span
              style={{
                fontStyle: 'italic',
                color: colors.leaf,
              }}
            >
              {c.headline[1]}
            </span>
          </div>
        </RiseIn>

        <RiseIn delay={40}>
          <div
            style={{
              fontFamily: fonts.body,
              fontWeight: 400,
              fontSize: subSize,
              color: colors.boneDim,
              marginTop: portrait ? 40 : 34,
            }}
          >
            {c.sub}
          </div>
        </RiseIn>
      </div>
    </AbsoluteFill>
  );
};
