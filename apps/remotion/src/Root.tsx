import type { FC } from "react";
import { Composition } from "remotion";

import { Demo } from "./Demo";

export const Root: FC = () => {
  return (
    <>
      {/* hero: silent, landscape — rendered to the README gif */}
      <Composition
        id="hero"
        component={Demo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{ variant: "hero" }}
      />
      {/* social: portrait, sound + CTA end card (later phase) */}
      <Composition
        id="social"
        component={Demo}
        width={1080}
        height={1920}
        fps={30}
        durationInFrames={450}
        defaultProps={{ variant: "social" }}
      />
    </>
  );
};
