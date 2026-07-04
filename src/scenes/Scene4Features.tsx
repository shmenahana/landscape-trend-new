import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, fonts } from '../theme';
import { COPY, sec } from '../video.config';
import { RiseIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 4 — FEATURES. Headline, then three cards stagger in 0.6s apart. Cards
 * lay out in a row on 16:9 and stack vertically on 9:16.
 */
export const Scene4Features: React.FC = () => {
  const { portrait, contentWidth } = useLayout();
  const c = COPY.features;

  const headlineSize = portrait ? 72 : 92;
  const stagger = sec(0.6);

  return (
    <AbsoluteFill
      style={{ justifyContent: 'center', alignItems: 'center' }}
    >
      <div style={{ width: contentWidth, textAlign: 'center' }}>
        <RiseIn delay={4}>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 600,
              fontSize: headlineSize,
              color: colors.bone,
              lineHeight: 1.05,
              letterSpacing: '-0.015em',
              marginBottom: portrait ? 52 : 64,
            }}
          >
            {c.headline[0]}
            <span style={{ fontStyle: 'italic', color: colors.leaf }}>
              {c.headline[1]}
            </span>
          </div>
        </RiseIn>

        <div
          style={{
            display: 'flex',
            flexDirection: portrait ? 'column' : 'row',
            gap: portrait ? 22 : 28,
            alignItems: 'stretch',
          }}
        >
          {c.cards.map((card, i) => (
            <RiseIn
              key={i}
              delay={20 + i * stagger}
              style={{ flex: 1, display: 'flex' }}
            >
              <div
                style={{
                  flex: 1,
                  textAlign: 'left',
                  padding: portrait ? '30px 34px' : '34px 32px',
                  borderRadius: 18,
                  border: '1px solid rgba(143,191,77,0.22)',
                  backgroundColor: 'rgba(35,43,30,0.55)',
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.display,
                    fontWeight: 600,
                    fontSize: portrait ? 36 : 34,
                    color: colors.leaf,
                    lineHeight: 1.1,
                    marginBottom: 14,
                  }}
                >
                  {card.title}
                </div>
                <div
                  style={{
                    fontFamily: fonts.body,
                    fontWeight: 400,
                    fontSize: portrait ? 27 : 24,
                    lineHeight: 1.4,
                    color: colors.boneDim,
                  }}
                >
                  {card.body}
                </div>
              </div>
            </RiseIn>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
