import { ImageResponse } from "next/og";

export const alt = "FlyerMint — Créez des visuels qui marquent.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #111827 0%, #312E81 55%, #0F766E 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #20C997, #3B82F6, #20C997)",
            marginBottom: 28,
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>FlyerMint</div>
        <div style={{ marginTop: 16, fontSize: 34, color: "#A7F3D0" }}>Créez des visuels qui marquent.</div>
        <div style={{ marginTop: 28, fontSize: 22, color: "#CBD5E1" }}>
          Des affiches professionnelles sans designer, sans prompt.
        </div>
      </div>
    ),
    size,
  );
}
