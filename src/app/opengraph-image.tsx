import { ImageResponse } from "next/og";
import { FleetLeverLogo } from "@/components/fleetlever/fleetlever-logo";

export const runtime = "edge";
export const alt = "FleetLever - έλεγχος ετοιμότητας στόλου";
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
          background: "#103d37",
          color: "#ffffff",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 72,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 34,
            height: "100%",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <FleetLeverLogo inverse />
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: "#73dce3", fontSize: 28, fontWeight: 700 }}>
              ΕΛΕΓΧΟΣ ΕΤΟΙΜΟΤΗΤΑΣ ΣΤΟΛΟΥ
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: 0, lineHeight: 1.02 }}>
              Ξέρεις τι μπορεί να βγει αύριο. Και τι όχι.
            </div>
          </div>
          <div style={{ color: "#d8e5e1", display: "flex", fontSize: 28, gap: 22 }}>
            <span>Αυριανή δουλειά</span>
            <span>•</span>
            <span>Φάκελος μηχανήματος</span>
            <span>•</span>
            <span>Ιστορικό αποφάσεων</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
