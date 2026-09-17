import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B62F0",
          borderRadius: 8,
          fontFamily: "sans-serif",
          fontWeight: 700,
          fontSize: 20,
          color: "#ffffff",
        }}
      >
        S
      </div>
    ),
    size,
  );
}
