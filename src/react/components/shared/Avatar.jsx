import { useState } from "react";
import { initials } from "../../../lib/utils.js";

const SIZES = { sm: 32, md: 40, lg: 56, xl: 72 };
const FONT_SIZES = { sm: 12, md: 14, lg: 20, xl: 26 };

export default function Avatar({ name, src, size = "md", color = "var(--gold)" }) {
  // Cache-bust once per mount so a freshly uploaded avatar shows up,
  // without re-downloading the image on every re-render.
  const [cacheBust] = useState(() => Date.now());
  const [failed, setFailed] = useState(false);
  const px = SIZES[size] || SIZES.md;
  const box = { width: px, height: px, flexShrink: 0 };

  if (src && !failed) {
    return (
      <div style={{ ...box, overflow: "hidden" }}>
        <img
          src={`${src}?cb=${cacheBust}`}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...box,
        background: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: FONT_SIZES[size] || FONT_SIZES.md,
        color: "#fff",
      }}
    >
      {initials(name)}
    </div>
  );
}
