import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, fonts } from '../theme';
import { COPY } from '../video.config';
import { RiseIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 5 — CREDIBILITY. Headline (emphasis clause italic/leaf), supporting
 * sub, and a small hay caps line.
 */
export const Scene5Credibility: React.FC = () => {
  const { portrait, contentWidth } = useLayout();
  const c = COPY.credibility;

  const headlineSize = portrait ? 70 : 88;
  const subSize = portrait ? 32 : 36;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ width: contentWidth }}>
        <RiseIn delay={4}>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: headlineSize,
              color: colors.bone,
              lineHeight: 1.08,
              letterSpacing: '-0.015em',
            }}
          >
            {c.headline[0]}
            <span style={{ fontStyle: 'italic', color: colors.leaf }}>
              {c.headline[1]}
            </span>
          </div>
        </RiseIn>

        <RiseIn delay={24}>
          <div
            style={{
              fontFamily: fonts.body,
              fontWeight: 400,
              fontSize: subSize,
              lineHeight: 1.45,
              color: colors.boneDim,
              marginTop: portrait ? 40 : 34,
            }}
          >
            {c.sub}
          </div>
        </RiseIn>

        <RiseIn delay={42}>
          <div
            style={{
              fontFamily: fonts.body,
              fontWeight: 600,
              fontSize: portrait ? 20 : 22,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: colors.hay,
              marginTop: portrait ? 46 : 40,
            }}
          >
            {c.caps}
          </div>
        </RiseIn>
      </div>
    </AbsoluteFill>
  );
};
