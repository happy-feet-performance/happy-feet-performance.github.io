// HTML-string builders still used by the classic-script code (router,
// coach dashboard). React code should use the components in
// src/react/components/shared instead. Delete entries here as their last
// legacy caller goes away.
import { initials } from "./utils.js";

export const avatarHTML = (
  name,
  avatarUrl,
  size = "md",
  color = "var(--gold)",
) => {
  const sizes = { sm: "32px", md: "40px", lg: "56px", xl: "72px" };
  const px = sizes[size] || sizes.md;
  const font = { sm: "12px", md: "14px", lg: "20px", xl: "26px" };
  const fs = font[size] || font.md;
  const url = avatarUrl ? `${avatarUrl}?cb=${Date.now()}` : null;

  if (url) {
    return `<div style="width:${px};height:${px};flex-shrink:0;overflow:hidden;">
      <img src="${url}" alt="${name}"
        style="width:100%;height:100%;object-fit:cover;"
        onerror="this.parentElement.innerHTML='${initials(name)}'">
    </div>`;
  }

  return `<div style="width:${px};height:${px};background:${color};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${fs};color:#fff;flex-shrink:0;">
    ${initials(name)}
  </div>`;
};

export const wdlHTML = (W, D, L) => {
  const total = W + D + L;
  if (total === 0)
    return `<span style="font-size:12px;color:var(--text3);">No matches logged</span>`;
  return `
    <div style="display:flex;gap:6px;align-items:center;">
      <div style="padding:3px 10px;background:rgba(26,122,46,.15);border:0.5px solid var(--green);">
        <span style="font-family:var(--font);font-size:13px;font-weight:700;color:var(--green);">${W}</span>
        <span style="font-size:10px;color:var(--text3);margin-left:2px;">W</span>
      </div>
      <div style="padding:3px 10px;background:rgba(196,154,10,.15);border:0.5px solid var(--gold);">
        <span style="font-family:var(--font);font-size:13px;font-weight:700;color:var(--gold);">${D}</span>
        <span style="font-size:10px;color:var(--text3);margin-left:2px;">D</span>
      </div>
      <div style="padding:3px 10px;background:rgba(200,16,46,.1);border:0.5px solid var(--red);">
        <span style="font-family:var(--font);font-size:13px;font-weight:700;color:var(--red);">${L}</span>
        <span style="font-size:10px;color:var(--text3);margin-left:2px;">L</span>
      </div>
      <span style="font-size:11px;color:var(--text3);">${total} played</span>
    </div>`;
};
