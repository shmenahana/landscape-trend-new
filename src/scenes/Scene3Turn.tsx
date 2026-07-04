import React from 'react';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from 'remotion';
import { colors, fonts } from '../theme';
import { COPY } from '../video.config';
import { Eyebrow, RiseIn, SpringIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 3 — TURN / LOGO. Eyebrow, spring logo reveal with slight overshoot, a
 * hay rule that draws outward from center, then the tagline.
 */
export const Scene3Turn: React.FC = () => {
  const frame = useCurrentFrame();
  const { portrait } = useLayout();
  const c = COPY.turn;

  const logoSize = portrait ? 120 : 168;
  const ruleDelay = 28;
  const ruleWidth = interpolate(
    frame - ruleDelay,
    [0, 18],
    [0, portrait ? 360 : 520],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    }
  );

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Eyebrow delay={4} fontSize={portrait ? 20 : 22}>
        {c.eyebrow}
      </Eyebrow>

      <SpringIn delay={14} from={0.72} style={{ marginTop: portrait ? 40 : 44 }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: logoSize,
            color: colors.bone,
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}
        >
          {c.logo}
          <span style={{ fontStyle: 'italic', color: colors.leaf }}>
            {c.logoAccent}
          </span>
        </div>
      </SpringIn>

      {/* Hay rule drawing outward from center */}
      <div
        style={{
          height: 3,
          width: ruleWidth,
          backgroundColor: colors.hay,
          borderRadius: 3,
          marginTop: portrait ? 34 : 40,
          marginBottom: portrait ? 34 : 40,
        }}
      />

      <RiseIn delay={40}>
        <div
          style={{
            ...(portrait ? { maxWidth: 620 } : {}),
            fontFamily: fonts.body,
            fontWeight: 600,
            fontSize: portrait ? 22 : 26,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: colors.boneDim,
          }}
        >
          {c.tagline}
        </div>
      </RiseIn>
    </AbsoluteFill>
  );
};
