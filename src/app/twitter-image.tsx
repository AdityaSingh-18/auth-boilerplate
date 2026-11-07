import { ImageResponse } from "next/og";

export const alt = "Auth Boilerplate — Explore and download reusable authentication implementations.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "64px",
          background:
            "radial-gradient(ellipse at 75% 20%, #352267 0%, transparent 45%), linear-gradient(135deg, #08070e 0%, #100d1c 60%, #17102a 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            border: "1px solid rgba(196,181,253,0.22)",
            borderRadius: "28px",
            padding: "54px",
            background: "rgba(255,255,255,0.025)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "42px",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 800,
              }}
            >
              A
            </div>

            <span
              style={{
                fontSize: "24px",
                fontWeight: 700,
              }}
            >
              Auth Boilerplate
            </span>
          </div>

          <div
            style={{
              fontSize: "62px",
              lineHeight: 1.1,
              fontWeight: 800,
              letterSpacing: "-2.5px",
            }}
          >
            Explore authentication.
            <span style={{ color: "#a78bfa" }}>
              {" "}Understand the code.
            </span>
            Download.
          </div>

          <div
            style={{
              marginTop: "28px",
              fontSize: "24px",
              lineHeight: 1.5,
              color: "#a1a1aa",
            }}
          >
            Reusable authentication implementations for your next project.
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "38px",
              flexWrap: "wrap",
            }}
          >
            {["Email & Password", "OAuth", "Passkeys", "Enterprise SSO"].map(
              (label) => (
                <div
                  key={label}
                  style={{
                    padding: "10px 17px",
                    borderRadius: "999px",
                    border: "1px solid rgba(196,181,253,0.25)",
                    background: "rgba(139,92,246,0.12)",
                    color: "#ddd6fe",
                    fontSize: "16px",
                  }}
                >
                  {label}
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
