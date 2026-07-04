import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, fonts } from '../theme';
import { COPY, sec } from '../video.config';
import { Eyebrow, RiseIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 2 — PAIN. Four lines stagger in ~0.9s apart. The first three are
 * bone-dim; the last (the competitor line) lands full bone for emphasis. Paced
 * slightly slower per the motion rules.
 */
export const Scene2Pain: React.FC = () => {
  const { portrait, contentWidth } = useLayout();
  const c = COPY.pain;

  const lineSize = portrait ? 52 : 64;
  const stagger = sec(0.9);

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: portrait ? 'center' : 'flex-start',
      }}
    >
      <div
        style={{
          width: contentWidth,
          marginLeft: portrait ? 0 : '11%',
          textAlign: portrait ? 'center' : 'left',
        }}
      >
        <Eyebrow delay={4} style={{ marginBottom: portrait ? 48 : 44 }}>
          {c.eyebrow}
        </Eyebrow>

        {c.lines.map((line, i) => {
          const isLast = i === c.lines.length - 1;
          return (
            <RiseIn key={i} delay={16 + i * stagger}>
              <div
                style={{
                  fontFamily: fonts.display,
                  fontWeight: isLast ? 600 : 500,
                  fontSize: lineSize,
                  lineHeight: 1.22,
                  letterSpacing: '-0.01em',
                  color: isLast ? colors.bone : colors.boneDim,
                  marginBottom: portrait ? 26 : 20,
                }}
              >
                {line}
              </div>
            </RiseIn>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
