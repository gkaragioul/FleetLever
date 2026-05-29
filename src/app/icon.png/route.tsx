import { ImageResponse } from "next/og";
import { FleetLeverIconImage } from "@/components/fleetlever/fleetlever-icon-image";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(<FleetLeverIconImage />, {
    width: 192,
    height: 192,
  });
}
