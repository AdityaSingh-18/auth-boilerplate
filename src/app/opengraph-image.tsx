import { ImageResponse } from "next/og";

export const alt = "Auth Boilerplate — Authentication boilerplates, ready for your next project.";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "radial-gradient(ellipse at 80% 15%, #31205f 0%, transparent 42%), linear-gradient(135deg, #08070e 0%, #100d1c 55%, #17102a 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <div
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "15px",
              background: "linear-gradient(135deg, #a78bfa, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "30px",
              fontWeight: 800,
              color: "#ffffff",
            }}
          >
            A
          </div>

          <span
            style={{
              fontSize: "25px",
              fontWeight: 700,
              letterSpacing: "-0.5px",
            }}
          >
            Auth Boilerplate
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            maxWidth: "1000px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: "#c4b5fd",
              fontSize: "18px",
              fontWeight: 600,
              letterSpacing: "3px",
              textTransform: "uppercase",
            }}
          >
            Authentication implementations
          </div>

          <div
            style={{
              fontSize: "68px",
              lineHeight: 1.08,
              fontWeight: 800,
              letterSpacing: "-3px",
            }}
          >
            Authentication boilerplates,
            <span style={{ color: "#a78bfa" }}>
              {" "}ready for your next project.
            </span>
          </div>

          <div
            style={{
              maxWidth: "850px",
              fontSize: "25px",
              lineHeight: 1.5,
              color: "#a1a1aa",
            }}
          >
            Explore, inspect, and download reusable authentication
            implementations. From email and password to OAuth,
            passkeys, and enterprise SSO.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            paddingTop: "22px",
            color: "#a1a1aa",
            fontSize: "18px",
          }}
        >
          <span>Explore the code. Understand the implementation.</span>
          <span style={{ color: "#c4b5fd" }}>
            Auth Boilerplate
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
