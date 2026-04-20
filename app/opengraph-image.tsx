import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "寵物專科診所搜尋 | 台北";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAF7F4",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 16 }}>🐾</div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#2D1B0E",
            marginBottom: 20,
            letterSpacing: "-2px",
          }}
        >
          寵物專科診所搜尋
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#7C5C3E",
            marginBottom: 48,
          }}
        >
          描述症狀，找到台北最合適的專科動物醫院
        </div>
        <div
          style={{
            display: "flex",
            gap: 24,
          }}
        >
          {["271 間診所", "12 個行政區", "14 個專科"].map((stat) => (
            <div
              key={stat}
              style={{
                background: "#E8927C",
                color: "#fff",
                padding: "12px 28px",
                borderRadius: 40,
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              {stat}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
