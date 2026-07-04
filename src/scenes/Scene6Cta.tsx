import React from 'react';
import { AbsoluteFill } from 'remotion';
import { colors, fonts } from '../theme';
import { COPY } from '../video.config';
import { Eyebrow, RiseIn, SpringIn } from '../components/motion';
import { useLayout } from '../components/layout';

/**
 * Scene 6 — CTA. Eyebrow, huge URL, and a closing line in Fraunces italic hay.
 * The scene includes a ~1.5s hold at the end; the grass line completes exactly
 * as this scene ends.
 */
export const Scene6Cta: React.FC = () => {
  const { portrait } = useLayout();
  const c = COPY.cta;

  const urlSize = portrait ? 118 : 180;
  const closingSize = portrait ? 40 : 48;

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <Eyebrow delay={4} fontSize={portrait ? 20 : 24}>
        {c.eyebrow}
      </Eyebrow>

      <SpringIn delay={14} from={0.78} style={{ marginTop: portrait ? 44 : 40 }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 600,
            fontSize: urlSize,
            color: colors.bone,
            lineHeight: 1,
            letterSpacing: '-0.025em',
          }}
        >
          {c.url}
          <span style={{ fontStyle: 'italic', color: colors.leaf }}>
            {c.urlAccent}
          </span>
        </div>
      </SpringIn>

      <RiseIn delay={40} style={{ marginTop: portrait ? 48 : 46 }}>
        <div
          style={{
            fontFamily: fonts.display,
            fontStyle: 'italic',
            fontWeight: 500,
            fontSize: closingSize,
            color: colors.hay,
            lineHeight: 1.25,
            maxWidth: portrait ? 640 : 1100,
          }}
        >
          {c.closing}
        </div>
      </RiseIn>
    </AbsoluteFill>
  );
};
