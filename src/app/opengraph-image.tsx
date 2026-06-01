import { ImageResponse } from "next/og";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export const runtime = "edge";
export const alt = "FleetLever - prevent expensive construction downtime";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#edf1ee",
          color: "#13211f",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#f8faf8",
            border: "2px solid #d4ddd7",
            borderRadius: 28,
            display: "flex",
            flexDirection: "column",
            gap: 34,
            height: "100%",
            justifyContent: "space-between",
            padding: 54,
            width: "100%",
          }}
        >
          <FleetLeverLogo />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: "#007C89", fontSize: 28, fontWeight: 700 }}>
              Construction teams · machines · worksites
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: 0, lineHeight: 1.02 }}>
              Prevent Expensive Construction Downtime
            </div>
          </div>
          <div style={{ color: "#3a4d49", display: "flex", fontSize: 28, gap: 22 }}>
            <span>Release For Work</span>
            <span>•</span>
            <span>Machine Passport</span>
            <span>•</span>
            <span>Why Blocked</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
