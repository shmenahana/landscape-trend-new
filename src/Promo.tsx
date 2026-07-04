import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';

import { Background } from './components/Background';
import { GrassLine } from './components/GrassLine';
import { useLayout } from './components/layout';
import {
  MUSIC_SRC,
  SCENES,
  TRANSITION_FRAMES,
  computeTimeline,
  sec,
} from './video.config';
import { ensureFonts } from './fonts';

import { Scene1Hook } from './scenes/Scene1Hook';
import { Scene2Pain } from './scenes/Scene2Pain';
import { Scene3Turn } from './scenes/Scene3Turn';
import { Scene4Features } from './scenes/Scene4Features';
import { Scene5Credibility } from './scenes/Scene5Credibility';
import { Scene6Cta } from './scenes/Scene6Cta';

ensureFonts();

const SCENE_COMPONENTS: Record<string, React.FC> = {
  hook: Scene1Hook,
  pain: Scene2Pain,
  turn: Scene3Turn,
  features: Scene4Features,
  credibility: Scene5Credibility,
  cta: Scene6Cta,
};

export const Promo: React.FC = () => {
  const { durations } = computeTimeline();
  const { portrait } = useLayout();

  return (
    <AbsoluteFill>
      <Background />

      <TransitionSeries>
        {SCENES.map((scene, i) => {
          const Comp = SCENE_COMPONENTS[scene.id];
          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={durations[i]}>
                <Comp />
              </TransitionSeries.Sequence>
              {i < SCENES.length - 1 ? (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </TransitionSeries>

      {/* Signature grass line + progress bar, spanning the whole timeline. It
          completes at the start of the CTA's ~1.5s hold so the finished line
          holds on screen through the closing frame. */}
      <GrassLine
        bladeCount={46}
        bandHeight={portrait ? 70 : 64}
        settleFrames={sec(1.5)}
      />

      {/* Music bed — silent placeholder until the real track is supplied.
          Swap is one line in video.config.ts (see MUSIC_SRC). */}
      {MUSIC_SRC ? <Audio src={staticFile(MUSIC_SRC)} /> : null}
    </AbsoluteFill>
  );
};
