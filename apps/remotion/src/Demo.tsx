import type { FC } from "react";
import { AbsoluteFill } from "remotion";

export type DemoVariant = "hero" | "social";

export type DemoProps = {
  variant: DemoVariant;
};

// shared scene for both compositions. real choreography lands in a later
// phase — for now, a centered dark frame with the wordmark.
export const Demo: FC<DemoProps> = ({ variant }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b0b0f",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          color: "#fafafa",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: variant === "hero" ? 96 : 72,
          fontWeight: 600,
          letterSpacing: "-0.02em",
        }}
      >
        onandemo.js
      </div>
    </AbsoluteFill>
  );
};
