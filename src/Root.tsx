import React from 'react';
import { Composition } from 'remotion';
import { Promo } from './Promo';
import { FPS, computeTimeline } from './video.config';

/**
 * Two compositions share one <Promo>. The scenes reflow via useLayout() based
 * on orientation, so there is a single source of truth for content + timing.
 */
export const RemotionRoot: React.FC = () => {
  const { totalDuration } = computeTimeline();

  return (
    <>
      <Composition
        id="Promo-16x9"
        component={Promo}
        durationInFrames={totalDuration}
        fps={FPS}
        width={1920}
        height={1080}
      />
      <Composition
        id="Promo-9x16"
        component={Promo}
        durationInFrames={totalDuration}
        fps={FPS}
        width={1080}
        height={1920}
      />
    </>
  );
};
