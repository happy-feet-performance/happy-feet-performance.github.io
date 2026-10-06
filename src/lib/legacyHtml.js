// HTML-string builders still used by the classic-script code (coach
// dashboard). React code should use the components in
// src/react/components/shared instead. Delete entries here as their last
// legacy caller goes away.
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
