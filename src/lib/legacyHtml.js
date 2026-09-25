// HTML-string builders still used by the classic-script code (router,
// dashboards, roleutils). React code should use the components in
// src/react/components/shared instead. Delete entries here as their last
// legacy caller goes away.
import { initials, timeAgo } from "./utils.js";

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

// Still rendered via dangerouslySetInnerHTML by the role Messages views,
// because its click handlers call HF_ROLE_UTILS functions that mutate the
// DOM directly. Convert to a component together with roleutils.js.
export const messageListHTML = (msgs, role) => {
  if (!msgs || msgs.length === 0) return "";

  const unread = msgs.filter((m) => !m.read);
  const read = msgs.filter((m) => m.read);

  const msgRow = (m) => `
        <div class="msg-item" id="msg-${m.id}" onclick="${
          m.from_id === "admin" || m.from_id === "system"
            ? `HF_ROLE_UTILS.readMessage('${m.id}', document.getElementById('msg-${m.id}'), '${role}')`
            : `HF_ROLE_UTILS.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}', '${role}')`
        }">
          <div class="avatar avatar-md" style="background:var(--bg2);display:flex;align-items:center;justify-content:center;">
            <i class="ti ti-shield" style="font-size:16px;color:${!m.read ? "var(--gold)" : "var(--text2)"}"></i>
          </div>
          <div style="flex:1">
            <div style="font-size:11px;font-family:var(--font);font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:var(--text3);margin-bottom:2px;">
              From: ${m.senderName || (m.from_id === "system" ? "HappyFeet System" : m.from_id === "admin" ? "HappyFeet Admin" : "HappyFeet")}
            </div>
            <div class="msg-name">${m.subject || "Message"}</div>
            <div class="msg-preview">${m.body}</div>
            <div class="msg-time">${timeAgo(m.created_at)}</div>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-shrink:0;">
            ${!m.read ? `<div class="msg-unread" id="badge-${m.id}">1</div>` : ""}
            <div style="display:flex;flex-direction:column;gap:4px;">
              <button class="btn btn-outline btn-sm"
                title="Archive message"
                onclick="event.stopPropagation();HF_ROLE_UTILS.archiveMessage('${m.id}', this, '${role}')">
                <i class="ti ti-archive"></i>
              </button>
              ${
                m.from_id !== "system" && m.from_id !== "admin"
                  ? `
                <button class="btn btn-outline btn-sm"
                  title="More options"
                  onclick="event.stopPropagation();HF_ROLE_UTILS.toggleMsgActions('${m.id}')">
                  <i class="ti ti-dots-vertical"></i>
                </button>`
                  : ""
              }
            </div>
          </div>
        </div>
        <div id="msg-actions-${m.id}" style="display:none;padding:var(--sp-sm);background:var(--bg2);border-left:2px solid var(--border);margin-bottom:4px;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            ${
              m.from_id && m.from_id !== "admin" && m.from_id !== "system"
                ? `
              <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.viewThread('${m.thread_id || m.id}', '${m.from_id}', '${(m.subject || "").replace(/'/g, "\\'")}', '${role}')">
                <i class="ti ti-arrow-back-up"></i> Reply
              </button>
              <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.viewSenderProfile('${m.from_id}', '${role}', 'messages')">
                <i class="ti ti-user"></i> View profile
              </button>
              <button class="btn btn-danger btn-sm" onclick="HF_ROLE_UTILS.reportToAdmin('${m.from_id}', '${(m.senderName || "").replace(/'/g, "\\'")}', '${role}')">
                <i class="ti ti-flag"></i> Report
              </button>`
                : `
              <div style="font-size:12px;color:var(--text2);padding:4px">
                <i class="ti ti-info-circle" style="margin-right:4px"></i>
                System message: no actions available.
              </div>`
            }
          </div>
        </div>`;

  return `
    ${
      unread.length > 0
        ? `
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--red);margin-bottom:8px;">
        Unread (${unread.length})
      </div>
      ${unread.map(msgRow).join("")}
      <div style="height:1px;background:var(--border);margin:var(--sp-md) 0;"></div>`
        : ""
    }

    ${
      read.length > 0
        ? `
      <div style="font-family:var(--font);font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text3);margin-bottom:8px;">
        Read (${read.length})
      </div>
      ${read.map(msgRow).join("")}`
        : ""
    }`;
};
