import { Config } from '@remotion/cli/config';

/**
 * Render defaults. Output is H.264 MP4 at CRF 18 (visually lossless) — the
 * render:169 / render:916 npm scripts also pass these so a bare `remotion
 * render` matches.
 */
Config.setVideoImageFormat('jpeg');
Config.setCodec('h264');
Config.setCrf(18);
Config.setEntryPoint('./src/index.ts');
Config.setPublicDir('./public');

// On CI / Linux boxes a system Chromium can be used instead of Remotion's own
// download by exporting REMOTION_BROWSER_EXECUTABLE. On the Windows render rig
// this is unset and Remotion manages its own browser automatically.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
