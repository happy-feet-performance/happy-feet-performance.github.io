/* ============================================================
   HappyFeet Performance Hub: roleutils.js
   Shared utilities across player, coach, scout, and admin roles
   ============================================================ */

const HF_ROLE_UTILS = (() => {
  // ── MESSAGING ──────────────────────────────────────────────
  const composeMessage = (role) => {
    const session = HF_DB.getSession();
    const setMain = _getSetMain(role);
    setMain(`
      <div class="card">
        <div class="card-title"><div class="card-dot"></div>New message</div>
        <div class="fg">
          <label class="required">To</label>
          <div id="compose-to-container" style="display:flex;flex-wrap:wrap;gap:4px;padding:8px;background:var(--bg2);border:0.5px solid var(--border);min-height:44px;cursor:text;"
            onclick="document.getElementById('compose-search').focus()">
            <div id="compose-tags" style="display:flex;flex-wrap:wrap;gap:4px;"></div>
            <input type="text" id="compose-search" placeholder="Search by name or email..."
              oninput="HF_ROLE_UTILS.searchRecipients(this.value, '${role}')"
              style="flex:1;min-width:150px;border:none;background:transparent;color:var(--text);font-size:13px;font-family:var(--font);outline:none;padding:2px 4px;">
          </div>
          <div id="compose-search-results" style="margin-top:2px;border:0.5px solid var(--border);background:var(--bg);display:none;"></div>
          <input type="hidden" id="compose-to-ids">
        </div>
        <div class="fg">
          <label class="required">Subject</label>
          <input type="text" id="compose-subject" placeholder="Message subject"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label class="required">Message</label>
          <textarea id="compose-body" rows="5" placeholder="Write your message..."
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="HF_ROLE_UTILS.sendComposedMessage('${role}')">
            <i class="ti ti-send"></i> Send
          </button>
          <button class="btn btn-outline" onclick="HF_ROUTER.navTo('messages')">Cancel</button>
        </div>
      </div>`);
    window._composeRecipients = [];
  };

  const sendMessage = async (
    toId,
    toName,
    backView,
    subjectId = "msg-subject",
    bodyId = "msg-body",
  ) => {
    const session = HF_DB.getSession();
    const subject = document.getElementById(subjectId)?.value.trim();
    const body = document.getElementById(bodyId)?.value.trim();

    if (!subject) {
      HF_UTILS.toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      HF_UTILS.toast("Please enter a message.", "error");
      return;
    }

    const { error } = await HF_DB._sendMessage(
      session.userId,
      toId,
      subject,
      body,
    );
    if (error) {
      HF_UTILS.toast(error, "error");
      return;
    }

    HF_UTILS.toast(`Message sent to ${toName}!`, "success");
    HF_ROUTER.navTo(backView);
  };

  const messageUser = (toId, toName, backView, role, sendFn) => {
    const setMain = _getSetMain(role);
    const safeName = toName.replace(/'/g, "\\'");

    setMain(`
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Message ${toName}</div>
      <div class="fg">
        <label class="required">Subject</label>
        <input type="text" id="msg-subject" placeholder="Message subject"
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
      </div>
      <div class="fg">
        <label class="required">Message</label>
        <textarea id="msg-body" rows="4" placeholder="Write your message..."
          style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary" onclick="HF_ROLE_UTILS.sendMessage('${toId}', '${safeName}', '${backView}')">
          <i class="ti ti-send"></i> Send message
        </button>
        <button class="btn btn-outline" onclick="HF_ROUTER.navTo('${backView}')">Cancel</button>
      </div>
    </div>`);
  };

  const searchRecipients = async (query, role) => {
    const results = document.getElementById("compose-search-results");
    if (!results) return;
    if (!query || query.length < 2) {
      results.style.display = "none";
      results.innerHTML = "";
      return;
    }

    const session = HF_DB.getSession();
    const { data } = await HF_DB.searchAllUsers(query, session.userId);
    const existing = window._composeRecipients?.map((r) => r.id) || [];
    const filtered = data?.filter((u) => !existing.includes(u.id)) || [];

    if (!filtered.length) {
      results.style.display = "none";
      return;
    }

    results.style.display = "block";
    results.innerHTML = filtered
      .map(
        (u) => `
      <div style="display:flex;align-items:center;gap:var(--sp-md);padding:10px;cursor:pointer;border-bottom:0.5px solid var(--border);"
        onmousedown="event.preventDefault();HF_ROLE_UTILS.selectRecipient('${u.id}', '${u.name.replace(/'/g, "\\'")}', '${u.role}', '${role}')">
        <div class="avatar avatar-sm" style="background:${u.role === "player" ? "var(--green)" : u.role === "coach" ? "var(--gold)" : u.role === "admin" ? "var(--red)" : "var(--blue)"}">
          ${HF_UTILS.initials(u.name)}
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;color:var(--text)">${u.name}</div>
          <div style="font-size:11px;color:var(--text2)">${u.role}</div>
        </div>
      </div>`,
      )
      .join("");
  };

  const selectRecipient = (userId, userName, userRole, role) => {
    if (!window._composeRecipients) window._composeRecipients = [];
    if (window._composeRecipients.find((r) => r.id === userId)) return;
    window._composeRecipients.push({
      id: userId,
      name: userName,
      role: userRole,
    });

    const tags = document.getElementById("compose-tags");
    const tag = document.createElement("div");
    tag.id = `tag-${userId}`;
    tag.style.cssText = `display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:var(--gold);color:#0f0f0d;font-size:12px;font-weight:600;font-family:var(--font);`;
    tag.innerHTML = `${userName}<span style="cursor:pointer;font-size:14px;font-weight:700;" onclick="HF_ROLE_UTILS.removeRecipient('${userId}')">×</span>`;
    tags?.appendChild(tag);

    const search = document.getElementById("compose-search");
    const results = document.getElementById("compose-search-results");
    if (search) {
      search.value = "";
      search.focus();
    }
    if (results) {
      results.style.display = "none";
      results.innerHTML = "";
    }
  };

  const removeRecipient = (userId) => {
    window._composeRecipients =
      window._composeRecipients?.filter((r) => r.id !== userId) || [];
    document.getElementById(`tag-${userId}`)?.remove();
  };

  const sendComposedMessage = async (role) => {
    const session = HF_DB.getSession();
    const recipients = window._composeRecipients || [];
    const subject = document.getElementById("compose-subject")?.value.trim();
    const body = document.getElementById("compose-body")?.value.trim();

    if (recipients.length === 0) {
      HF_UTILS.toast("Please select at least one recipient.", "error");
      return;
    }
    if (!subject) {
      HF_UTILS.toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      HF_UTILS.toast("Please enter a message.", "error");
      return;
    }

    const threadId = crypto.randomUUID();
    for (const recipient of recipients) {
      await HF_DB._sendMessage(
        session.userId,
        recipient.id,
        subject,
        body,
        threadId,
      );
    }
    if (recipients.length > 1) {
      await HF_DB._sendMessage(
        session.userId,
        session.userId,
        subject,
        `[Group message to ${recipients.map((r) => r.name).join(", ")}]\n\n${body}`,
        threadId,
      );
    }

    window._composeRecipients = [];
    HF_UTILS.toast(
      `Message sent to ${recipients.length} recipient${recipients.length > 1 ? "s" : ""}!`,
      "success",
    );
    HF_ROUTER.navTo("messages");
  };

  // ── THREAD VIEW ─────────────────────────────────────────────

  const viewThread = async (threadId, otherUserId, subject, role) => {
    const session = HF_DB.getSession();
    const setMain = _getSetMain(role);
    const { data: msgs } = await HF_DB.getThread(threadId, session.userId);

    const isEmojiOnly = (text) =>
      text
        .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "")
        .trim().length === 0;
    const renderMessageBody = (body) =>
      body.replace(
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
        `<span class="emoji-animate" style="font-size:1.3em;cursor:pointer;display:inline-block;"
        onclick="HF_UTILS.launchEmojiConfetti('$1');this.style.transform='scale(1.8)';setTimeout(()=>this.style.transform='scale(1)',200)">$1</span>`,
      );

    const unread =
      msgs?.filter((m) => !m.read && m.to_id === session.userId) || [];
    for (const m of unread) await HF_DB.markMessageRead(m.id);

    const allSenderIds = [...new Set((msgs || []).map((m) => m.from_id))];
    const senderNames = await HF_DB.getUserNamesByIds(allSenderIds);

    const enriched = (msgs || []).map((m) => ({
      ...m,
      senderName: senderNames[m.from_id] || "HappyFeet",
    }));

    setMain(`
      <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg);">
        <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('messages')">
          <i class="ti ti-arrow-left"></i> Back
        </button>
        <div style="font-family:var(--font-head);font-size:14px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:var(--text);">
          ${subject || "Conversation"}
        </div>
      </div>

      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-md);min-height:300px;max-height:60vh;overflow-y:auto;" id="thread-messages">
          ${enriched
            .map((m) => {
              const isMine = m.from_id === session.userId;
              const emojiOnly = isEmojiOnly(m.body);
              return `
              <div style="display:flex;flex-direction:column;align-items:${isMine ? "flex-end" : "flex-start"};">
                <div style="font-size:10px;color:var(--text3);margin-bottom:3px;font-family:var(--font-head);letter-spacing:0.04em;">
                  ${isMine ? "You" : m.senderName} · ${HF_UTILS.timeAgo(m.created_at)}
                </div>
                <div style="max-width:75%;padding:${emojiOnly ? "4px" : "10px 14px"};background:${emojiOnly ? "transparent" : isMine ? "var(--gold)" : "var(--bg2)"};color:${isMine && !emojiOnly ? "#0f0f0d" : "var(--text)"};font-size:${emojiOnly ? "32px" : "13px"};line-height:1.5;">
                  ${renderMessageBody(m.body)}
                </div>
              </div>`;
            })
            .join("")}
        </div>

        <div style="padding:var(--sp-md);border-top:0.5px solid var(--border);background:var(--bg);">
          <div id="emoji-picker" style="display:none;padding:var(--sp-sm);background:var(--bg2);border:0.5px solid var(--border);margin-bottom:8px;flex-wrap:wrap;gap:4px;">
            ${[
              "😀",
              "😂",
              "😍",
              "🔥",
              "👏",
              "💪",
              "⚽",
              "🏆",
              "🎯",
              "👊",
              "🙏",
              "❤️",
              "😤",
              "😭",
              "🤝",
              "✅",
              "💯",
              "🚀",
              "👋",
              "😎",
              "🤔",
              "😅",
              "🥅",
              "🎉",
              "👍",
              "👎",
              "❌",
              "⚡",
              "🌟",
              "😴",
            ]
              .map(
                (e) => `
              <span style="font-size:24px;cursor:pointer;width:42px;height:42px;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.15s ease;"
                onmouseover="this.style.transform='scale(1.3)'"
                onmouseout="this.style.transform='scale(1)'"
                onclick="document.getElementById('reply-body').value += '${e}';this.style.transform='scale(1.5)';setTimeout(()=>this.style.transform='scale(1)',150)">
                ${e}
              </span>`,
              )
              .join("")}
          </div>
          <div style="display:flex;gap:8px;align-items:center;">
            <input type="text" id="reply-body" placeholder="Write a reply..."
              style="flex:1;padding:0 12px;height:42px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;font-family:var(--font);outline:none;"
              onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();HF_ROLE_UTILS.sendReply('${otherUserId}','${(subject || "").replace(/'/g, "\\'")}','${threadId}','${role}');}">
            <button class="btn btn-outline" style="height:42px;width:42px;min-height:42px;padding:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
              title="Emoji"
              onclick="const p=document.getElementById('emoji-picker');p.style.display=p.style.display==='none'?'flex':'none'">
              <i class="ti ti-mood-smile"></i>
            </button>
            <button class="btn btn-primary" style="height:42px;width:42px;min-height:42px;padding:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;flex-shrink:0;"
              onclick="HF_ROLE_UTILS.sendReply('${otherUserId}','${(subject || "").replace(/'/g, "\\'")}','${threadId}','${role}')">
              <i class="ti ti-send"></i>
            </button>
          </div>
        </div>
      </div>`);

    setTimeout(() => {
      const threadEl = document.getElementById("thread-messages");
      if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
      const replyInput = document.getElementById("reply-body");
      if (replyInput) {
        replyInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendReply(otherUserId, subject, threadId, role);
          }
        });
      }
    }, 100);
  };

  const sendReply = async (toId, subject, threadId, role) => {
    const session = HF_DB.getSession();
    const body = document.getElementById("reply-body")?.value.trim();
    if (!body) {
      HF_UTILS.toast("Please enter a reply.", "error");
      return;
    }

    const emojiOnly =
      body
        .replace(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu, "")
        .trim().length === 0;
    if (emojiOnly) {
      const firstEmoji = body.match(
        /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu,
      )?.[0];
      if (firstEmoji) HF_UTILS.launchEmojiConfetti(firstEmoji);
    }

    const result = await HF_DB._sendMessage(
      session.userId,
      toId,
      subject,
      body,
      threadId,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    document.getElementById("reply-body").value = "";
    viewThread(threadId, toId, subject, role);
  };

  const toggleMsgActions = (messageId) => {
    const actions = document.getElementById(`msg-actions-${messageId}`);
    if (actions)
      actions.style.display =
        actions.style.display === "none" ? "block" : "none";
  };

  const replyToMessage = (
    messageId,
    fromId,
    senderName,
    subject,
    threadId,
    role,
  ) => {
    if (!fromId || fromId === "admin" || fromId === "system") {
      HF_UTILS.toast(
        "You cannot reply to system messages directly. Use Contact Support instead.",
        "error",
      );
      return;
    }
    viewThread(threadId || messageId, fromId, subject, role);
  };

  // ── PROFILE VIEWS ───────────────────────────────────────────

  const viewProfile = async (userId, backFn) => {
    const { data: user } = await HF_DB.getUserById(userId);
    if (!user) {
      toast("User not found.", "error");
      return;
    }

    const p = user.profile || {};
    const role = user.role;
    const overall = p.ratings
      ? Math.round(
          (p.ratings.speed + p.ratings.tech + p.ratings.tact + p.ratings.phys) /
            4,
        )
      : null;

    const sections = {
      player: `
      <div class="info-grid">
        ${p.pos ? `<div class="info-cell"><div class="info-label">Position</div><div class="info-val">${p.pos}</div></div>` : ""}
        ${p.tier ? `<div class="info-cell"><div class="info-label">Tier</div><div class="info-val">${p.tier}</div></div>` : ""}
        ${p.hometown ? `<div class="info-cell"><div class="info-label">Hometown</div><div class="info-val">${p.hometown}</div></div>` : ""}
        ${p.club ? `<div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club}</div></div>` : ""}
      </div>
      ${
        overall !== null
          ? `
        <div class="card" style="margin-top:var(--sp-md);">
          <div class="card-title"><div class="card-dot"></div>Performance ratings</div>
          <div class="metrics-grid" style="grid-template-columns:repeat(4,1fr)">
            ${["speed", "tech", "tact", "phys"]
              .map(
                (k) => `
              <div class="metric-card">
                <div class="metric-val" style="color:var(--gold)">${p.ratings[k]}</div>
                <div class="metric-label">${{ speed: "Speed", tech: "Technical", tact: "Tactical", phys: "Physical" }[k]}</div>
              </div>`,
              )
              .join("")}
          </div>
        </div>`
          : ""
      }
      <div class="card" style="margin-top:var(--sp-md);">
        <div class="card-title" style="justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:var(--sp-sm);">
            <div class="card-dot"></div>Highlight reel
          </div>
          <span style="font-family:var(--font);font-size:9px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">Coming soon</span>
        </div>
        <div style="text-align:center;padding:32px;background:var(--bg2);border:0.5px dashed var(--border);">
          <i class="ti ti-video" style="font-size:32px;margin-bottom:10px;display:block;color:var(--text3)"></i>
          <div style="font-size:14px;font-weight:600;color:var(--text);margin-bottom:6px">No highlights yet</div>
          <div style="font-size:13px;color:var(--text2)">This player hasn't uploaded any highlights yet.</div>
        </div>
      </div>`,
      coach: `
      <div class="info-grid">
        ${p.spec ? `<div class="info-cell"><div class="info-label">Specialisation</div><div class="info-val">${p.spec}</div></div>` : ""}
        ${p.licence ? `<div class="info-cell"><div class="info-label">Licence</div><div class="info-val">${p.licence}</div></div>` : ""}
        ${p.club ? `<div class="info-cell"><div class="info-label">Club</div><div class="info-val">${p.club}</div></div>` : ""}
        ${p.exp ? `<div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp} years</div></div>` : ""}
      </div>`,
      scout: `
      <div class="info-grid">
        ${p.org ? `<div class="info-cell"><div class="info-label">Agency</div><div class="info-val">${p.org}</div></div>` : ""}
        ${p.region ? `<div class="info-cell"><div class="info-label">Home region</div><div class="info-val">${p.region}</div></div>` : ""}
        ${p.regionsCovered ? `<div class="info-cell"><div class="info-label">Regions covered</div><div class="info-val">${Array.isArray(p.regionsCovered) ? p.regionsCovered.join(", ") : p.regionsCovered}</div></div>` : ""}
        ${p.targetLeagues ? `<div class="info-cell"><div class="info-label">Target leagues</div><div class="info-val">${Array.isArray(p.targetLeagues) ? p.targetLeagues.join(", ") : p.targetLeagues}</div></div>` : ""}
        ${p.exp ? `<div class="info-cell"><div class="info-label">Experience</div><div class="info-val">${p.exp} years</div></div>` : ""}
      </div>`,
    };

    return `
    ${backFn ? `<button class="btn btn-outline" onclick="${backFn}" style="margin-top:8px"><i class="ti ti-arrow-left"></i> Back</button>` : ""}
    <div style="background:#0f0f0d;padding:var(--sp-2xl);margin-top:var(--sp-lg);margin-bottom:var(--sp-lg);display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-lg);">
        <div style="width:72px;height:72px;background:${role === "player" ? "var(--green)" : role === "coach" ? "var(--gold)" : role === "admin" ? "var(--red)" : "var(--blue)"};display:flex;align-items:center;justify-content:center;font-family:var(--font);font-size:26px;font-weight:700;color:#fff;">
          ${HF_UTILS.initials(user.name)}
        </div>
        <div>
          <div style="font-family:var(--font);font-size:22px;font-weight:700;color:#fff;">${user.name}</div>
          <div style="font-size:13px;color:rgba(255,255,255,.55);margin-top:2px;">${p.pos || p.spec || p.org || "-"}</div>
          <div style="margin-top:8px;">${badgeHTML(role, role === "player" ? "green" : role === "coach" ? "gold" : "blue")}</div>
        </div>
      </div>
      ${
        overall !== null
          ? `
        <div style="text-align:right;">
          <div style="font-family:var(--font);font-size:42px;font-weight:700;color:var(--gold)">${overall}%</div>
          <div style="font-size:10px;color:rgba(255,255,255,.4);font-family:var(--font);text-transform:uppercase;letter-spacing:0.1em">Overall</div>
        </div>`
          : ""
      }
    </div>
    <div class="card">
      <div class="card-title"><div class="card-dot"></div>Profile details</div>
      ${sections[role] || ""}
    </div>`;
  };

  const viewSenderProfile = async (userId, role, backView = "messages") => {
    const setMain = _getSetMain(role);
    const html = await viewProfile(userId, `HF_ROUTER.navTo('${backView}')`);
    if (!html) return;
    setMain(html);
  };

  const reportToAdmin = async (fromId, senderName, role) => {
    const session = HF_DB.getSession();
    const reason = prompt(
      `Report ${senderName} to admin?\n\nPlease describe the issue:`,
    );
    if (!reason) return;

    const adminIds = await HF_DB.getAdminIds();
    for (const adminId of adminIds) {
      await HF_DB._sendMessage(
        session.userId,
        adminId,
        `[Report] User: ${senderName}`,
        `${session.name} has reported ${senderName}.\n\nReason: ${reason}`,
      );
    }
    HF_UTILS.toast(`${senderName} has been reported to admin.`, "success");
  };

  // ── MESSAGES ────────────────────────────────────────────────

  const archiveMessage = async (messageId, el, role) => {
    await HF_DB.archiveMessage(messageId);
    if (el) el.closest(".msg-item")?.remove();
    HF_UTILS.toast("Message archived.", "success");
  };

  const unarchiveMessage = async (messageId, role) => {
    await HF_DB.unarchiveMessage(messageId);
    HF_UTILS.toast("Message unarchived.", "success");
    const handler = _getHandler(role);
    handler?.messages?.(HF_DB.getSession());
  };

  const readMessage = async (messageId, el, role) => {
    const badge = document.getElementById(`badge-${messageId}`);
    if (badge) badge.remove();
    await HF_DB.markMessageRead(messageId);
    const session = HF_DB.getSession();
    const { data: msgs } = await HF_DB.getMessages(session.userId);
    const unreadCount = msgs?.filter((m) => !m.read).length || 0;
    HF_ROUTER.refreshSidenavBadge("messages", unreadCount, "var(--red)");

    const msg = msgs?.find((m) => m.id === messageId);
    if (msg) {
      const overlay = document.createElement("div");
      overlay.id = `msg-modal-${messageId}`;
      overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:200;display:flex;align-items:center;justify-content:center;padding:var(--sp-xl);`;
      overlay.innerHTML = `
        <div style="background:var(--bg);border-top:3px solid var(--gold);padding:var(--sp-2xl);max-width:480px;width:100%;">
          <div style="font-family:var(--font-head);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:var(--text3);margin-bottom:4px;">
            HappyFeet ${msg.from_id === "system" ? "System" : "Admin"}
          </div>
          <div style="font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--text);margin-bottom:var(--sp-md);">
            ${msg.subject || "Message"}
          </div>
          <div style="font-size:13px;color:var(--text2);line-height:1.6;margin-bottom:var(--sp-xl);">
            ${msg.body}
          </div>
          <button class="btn btn-primary" onclick="document.getElementById('msg-modal-${messageId}').remove();HF_ROUTER.navTo('messages');">
            <i class="ti ti-circle-check"></i> Got it
          </button>
        </div>`;
      document.body.appendChild(overlay);
    }

    const handler = _getHandler(role);
    handler?.messages?.(session);
  };

  // ── TICKETS ─────────────────────────────────────────────────

  const contactAdmin = (role) => {
    myTickets(HF_DB.getSession(), true, role);
  };

  const myTickets = async (s, fromMessages = false, role) => {
    const setMain = _getSetMain(role);
    const { data: tickets } = await HF_DB.getUserTickets(s.userId);

    const unread =
      tickets?.filter((t) => {
        const last = (t.messages || [])[t.messages?.length - 1];
        return last?.is_admin && t.status !== "resolved";
      }) || [];

    const replied =
      tickets?.filter((t) => {
        const last = (t.messages || [])[t.messages?.length - 1];
        return (
          !last?.is_admin &&
          (t.messages?.length || 0) > 1 &&
          t.status !== "resolved"
        );
      }) || [];

    const resolved = tickets?.filter((t) => t.status === "resolved") || [];

    const ticketCard = (t, isUnread = false) => {
      const statusColor =
        t.status === "open"
          ? "var(--red)"
          : t.status === "claimed"
            ? "var(--gold)"
            : "var(--green)";
      const statusLabel =
        t.status === "open"
          ? "Open"
          : t.status === "claimed"
            ? "In progress"
            : "Resolved";
      const msgCount = t.messages?.length || 0;
      const lastMsg = t.messages?.[t.messages.length - 1];

      return `
      <div style="background:var(--bg);border:0.5px solid ${isUnread ? "var(--gold)" : "var(--border)"};border-left:4px solid ${isUnread ? "var(--gold)" : statusColor};margin-bottom:var(--sp-sm);cursor:pointer;transition:background 0.15s ease;position:relative;"
        onmouseover="this.style.background='var(--bg2)'"
        onmouseout="this.style.background='var(--bg)'"
        onclick="HF_ROLE_UTILS.viewTicketThread('${t.id}','${t.subject.replace(/'/g, "\\'")}',${fromMessages},'${role}')">
        ${
          isUnread
            ? `
          <div style="position:absolute;top:0;right:0;background:var(--gold);padding:2px 8px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#0f0f0d;">
            New reply
          </div>`
            : ""
        }
        <div style="padding:var(--sp-md) var(--sp-lg);">

          <!-- subject + status + chevron -->
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:3px;">
            <div style="flex:1;min-width:0;font-size:13px;font-weight:${isUnread ? "700" : "600"};color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${t.subject}
            </div>
            <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 6px;background:${statusColor}22;color:${statusColor};flex-shrink:0;">
              ${statusLabel}
            </span>
            <i class="ti ti-chevron-right" style="color:var(--text3);font-size:16px;flex-shrink:0;"></i>
          </div>

          <!-- metadata -->
          <div style="font-size:11px;color:var(--text3);">
            ${[
              t.category
                ? t.category.charAt(0).toUpperCase() + t.category.slice(1)
                : "General",
              HF_UTILS.timeAgo(t.created_at),
              `${msgCount} message${msgCount !== 1 ? "s" : ""}`,
            ].join(" · ")}
          </div>

          <!-- claimed by -->
          ${
            t.status === "claimed"
              ? `
            <div style="font-size:11px;color:var(--text2);margin-top:6px;padding-top:6px;border-top:0.5px solid var(--border);display:flex;align-items:center;gap:4px;">
              <i class="ti ti-user" style="color:var(--gold)"></i>
              <span>Being handled by <strong style="color:var(--text)">${t.claimer?.name || "HappyFeet Support"}</strong></span>
            </div>`
              : ""
          }

          <!-- last message -->
          ${
            lastMsg
              ? `
            <div style="font-size:12px;color:var(--text2);margin-top:6px;padding:8px 12px;background:${isUnread ? "rgba(196,154,10,.06)" : "var(--bg2)"};border-left:${isUnread ? "2px solid var(--gold)" : "none"};">
              <span style="font-weight:600;color:${lastMsg.is_admin ? "var(--gold)" : "var(--text)"};">
                ${lastMsg.is_admin ? "Support" : "You"}:
              </span>
              ${lastMsg.body.slice(0, 100)}${lastMsg.body.length > 100 ? "..." : ""}
            </div>`
              : ""
          }

        </div>
      </div>`;
    };

    const section = (
      title,
      color,
      items,
      defaultOpen = true,
      isUnreadSection = false,
    ) => `
    <div class="card" style="margin-bottom:var(--sp-md);${isUnreadSection ? "border-top:3px solid var(--gold);" : ""}">
      <div class="card-title" style="cursor:pointer;justify-content:space-between;"
        onclick="const c=this.nextElementSibling;c.style.display=c.style.display==='none'?'block':'none';this.querySelector('i').className='ti '+(c.style.display==='none'?'ti-chevron-down':'ti-chevron-up');">
        <div style="display:flex;align-items:center;gap:var(--sp-sm);">
          <div class="card-dot" style="background:${color}"></div>${title}
          ${
            isUnreadSection
              ? `<span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:2px 6px;background:rgba(196,154,10,.15);color:var(--gold);">${items.length} new</span>`
              : `<span style="font-size:11px;color:var(--text3)">${items.length}</span>`
          }
        </div>
        <i class="ti ${defaultOpen ? "ti-chevron-up" : "ti-chevron-down"}" style="font-size:14px;color:var(--text3)"></i>
      </div>
      <div style="display:${defaultOpen ? "block" : "none"}">
        ${
          items.length === 0
            ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No tickets here.</div>`
            : items.map((t) => ticketCard(t, isUnreadSection)).join("")
        }
      </div>
    </div>`;

    setMain(`
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-lg);">
      <div style="display:flex;align-items:center;gap:var(--sp-md);">
        <button class="btn btn-outline btn-sm" onclick="HF_ROUTER.navTo('${fromMessages ? "messages" : "dashboard"}')">
          <i class="ti ti-arrow-left"></i> Back
        </button>
        <div style="font-size:14px;font-weight:700;color:var(--text);">My support tickets</div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="HF_ROLE_UTILS.newTicket(HF_DB.getSession(), ${fromMessages}, '${role}')">
        <i class="ti ti-plus"></i> New ticket
      </button>
    </div>

    ${
      !tickets || tickets.length === 0
        ? `
      <div class="card">
        <div style="text-align:center;padding:48px 32px;">
          <i class="ti ti-ticket" style="font-size:48px;margin-bottom:16px;display:block;color:var(--text3)"></i>
          <div style="font-size:16px;font-weight:700;color:var(--text);margin-bottom:8px">No tickets yet</div>
          <div style="font-size:13px;color:var(--text2);margin-bottom:24px">Submit a support ticket if you need help.</div>
          <button class="btn btn-primary btn-sm" onclick="HF_ROLE_UTILS.newTicket(HF_DB.getSession(), ${fromMessages}, '${role}')">
            <i class="ti ti-plus"></i> New ticket
          </button>
        </div>
      </div>`
        : `
      ${unread.length > 0 ? section("Needs your attention", "var(--gold)", unread, true, true) : ""}
      ${replied.length > 0 ? section("Awaiting response", "var(--blue)", replied, true, false) : ""}
      ${resolved.length > 0 ? section("Resolved", "var(--green)", resolved, false, false) : ""}
      ${
        unread.length === 0 && replied.length === 0 && resolved.length === 0
          ? section("All tickets", "var(--text3)", tickets, true, false)
          : ""
      }`
    }
  `);
  };

  const newTicket = (s, fromMessages = false, role) => {
    const setMain = _getSetMain(role);
    setMain(`
      <div style="display:flex;align-items:center;gap:var(--sp-md);margin-bottom:var(--sp-lg);">
        <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.myTickets(HF_DB.getSession(), ${fromMessages}, '${role}')">
          <i class="ti ti-arrow-left"></i> My tickets
        </button>
        <div style="font-size:14px;font-weight:700;color:var(--text);">New support ticket</div>
      </div>
      <div class="card">
        <div style="font-size:13px;color:var(--text2);margin-bottom:var(--sp-lg);">
          Submit a support ticket and an admin will respond shortly.
        </div>
        <div class="fg">
          <label class="required">Category</label>
          <select id="ticket-category"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
            <option value="general">General inquiry</option>
            <option value="verification">Verification issue</option>
            <option value="account">Account issue</option>
            <option value="technical">Technical problem</option>
            <option value="report">Report a user</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="fg">
          <label class="required">Subject</label>
          <input type="text" id="ticket-subject" placeholder="Brief description of your issue"
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);">
        </div>
        <div class="fg">
          <label class="required">Message</label>
          <textarea id="ticket-body" rows="5" placeholder="Describe your issue in detail..."
            style="padding:10px 14px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:14px;width:100%;outline:none;font-family:var(--font);resize:vertical;"></textarea>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-primary" onclick="HF_ROLE_UTILS.sendTicket(${fromMessages}, '${role}')">
            <i class="ti ti-send"></i> Submit ticket
          </button>
          <button class="btn btn-outline" onclick="HF_ROLE_UTILS.myTickets(HF_DB.getSession(), ${fromMessages}, '${role}')">
            Cancel
          </button>
        </div>
      </div>`);
  };

  const sendTicket = async (fromMessages = false, role) => {
    const session = HF_DB.getSession();
    const category = document.getElementById("ticket-category")?.value;
    const subject = document.getElementById("ticket-subject")?.value.trim();
    const body = document.getElementById("ticket-body")?.value.trim();

    if (!subject) {
      HF_UTILS.toast("Please enter a subject.", "error");
      return;
    }
    if (!body) {
      HF_UTILS.toast("Please enter a message.", "error");
      return;
    }

    const result = await HF_DB.createTicket(
      session.userId,
      subject,
      body,
      category,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    HF_UTILS.toast(
      "Ticket submitted! An admin will respond shortly.",
      "success",
    );
    myTickets(session, fromMessages, role);
  };

  const viewTicketThread = async (
    ticketId,
    subject,
    fromMessages = false,
    role,
  ) => {
    const s = HF_DB.getSession();
    const setMain = _getSetMain(role);
    const { data: msgs } = await HF_DB.getTicketMessages(ticketId);
    const { data: tickets } = await HF_DB.getUserTickets(s.userId);
    const ticket = tickets?.find((t) => t.id === ticketId);
    const statusColor =
      ticket?.status === "open"
        ? "var(--red)"
        : ticket?.status === "claimed"
          ? "var(--gold)"
          : "var(--green)";
    const statusLabel =
      ticket?.status === "open"
        ? "Open"
        : ticket?.status === "claimed"
          ? "In progress"
          : "Resolved";

    setMain(`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--sp-lg);">
        <div style="display:flex;align-items:center;gap:var(--sp-md);">
          <button class="btn btn-outline btn-sm" onclick="HF_ROLE_UTILS.myTickets(HF_DB.getSession(), ${fromMessages}, '${role}')">
            <i class="ti ti-arrow-left"></i> My tickets
          </button>
          <div>
            <div style="font-size:14px;font-weight:700;color:var(--text);">${subject}</div>
            <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;padding:1px 6px;background:${statusColor}22;color:${statusColor};">
                ${statusLabel}
              </span>
              <span style="font-size:11px;color:var(--text3);">${ticket?.category || ""}</span>
            </div>
          </div>
        </div>
      </div>

      ${
        ticket?.status === "claimed"
          ? `
        <div style="padding:10px 14px;background:rgba(196,154,10,.06);border-left:3px solid var(--gold);margin-bottom:var(--sp-lg);font-size:12px;color:var(--text2);">
          <i class="ti ti-user" style="margin-right:6px;color:var(--gold)"></i>
          Being handled by <strong style="color:var(--text)">${ticket.claimer?.name || "HappyFeet Support"}</strong>
        </div>`
          : ""
      }

      ${
        ticket?.status === "resolved"
          ? `
        <div style="padding:10px 14px;background:rgba(26,122,46,.06);border-left:3px solid var(--green);margin-bottom:var(--sp-lg);font-size:12px;color:var(--text2);">
          <i class="ti ti-circle-check" style="margin-right:6px;color:var(--green)"></i>
          This ticket has been resolved.
        </div>`
          : ""
      }

      <div class="card" style="padding:0;overflow:hidden;">
        <div style="padding:var(--sp-lg);display:flex;flex-direction:column;gap:var(--sp-md);min-height:200px;max-height:55vh;overflow-y:auto;" id="ticket-thread">
          ${(msgs || [])
            .map((m) => {
              const isMine = m.from_id === s.userId;
              return `
              <div style="display:flex;flex-direction:column;align-items:${isMine ? "flex-end" : "flex-start"};">
                <div style="font-size:10px;color:var(--text3);margin-bottom:3px;">
                  ${isMine ? "You" : "HappyFeet Support"} · ${HF_UTILS.timeAgo(m.created_at)}
                </div>
                <div style="max-width:75%;padding:10px 14px;background:${isMine ? "var(--gold)" : "var(--bg2)"};color:${isMine ? "#0f0f0d" : "var(--text)"};font-size:13px;line-height:1.5;">
                  ${m.body}
                </div>
              </div>`;
            })
            .join("")}
        </div>
        ${
          ticket?.status !== "resolved"
            ? `
          <div style="padding:var(--sp-md);border-top:0.5px solid var(--border);display:flex;flex-direction:column;gap:8px;background:var(--bg);">
            <div style="display:flex;gap:8px;align-items:center;">
              <input type="text" id="ticket-reply-input" placeholder="Add a message..."
                style="flex:1;padding:0 12px;height:42px;background:var(--bg2);border:0.5px solid var(--border);color:var(--text);font-size:13px;font-family:var(--font);outline:none;"
                onkeydown="if(event.key==='Enter')HF_ROLE_UTILS.sendUserTicketReply('${ticketId}','${subject.replace(/'/g, "\\'")}',${fromMessages},'${role}')">
              <button class="btn btn-primary" style="height:42px;width:42px;padding:0;box-sizing:border-box;display:flex;align-items:center;justify-content:center;"
                onclick="HF_ROLE_UTILS.sendUserTicketReply('${ticketId}','${subject.replace(/'/g, "\\'")}',${fromMessages},'${role}')">
                <i class="ti ti-send"></i>
              </button>
            </div>
            ${
              ticket?.status === "claimed"
                ? `
              <button class="btn btn-outline btn-sm" style="align-self:flex-end;"
                onclick="HF_ROLE_UTILS.markTicketResolved('${ticketId}','${subject.replace(/'/g, "\\'")}',${fromMessages},'${role}')">
                <i class="ti ti-circle-check"></i> Mark as resolved
              </button>`
                : ""
            }
          </div>`
            : `
          <div style="padding:var(--sp-md);border-top:0.5px solid var(--border);background:var(--bg);display:flex;justify-content:flex-end;">
            <button class="btn btn-outline btn-sm"
              onclick="HF_ROLE_UTILS.reopenUserTicket('${ticketId}','${subject.replace(/'/g, "\\'")}',${fromMessages},'${role}')">
              <i class="ti ti-arrow-back-up"></i> Reopen ticket
            </button>
          </div>`
        }
      </div>`);

    setTimeout(() => {
      const el = document.getElementById("ticket-thread");
      if (el) el.scrollTop = el.scrollHeight;
    }, 100);
  };

  const sendUserTicketReply = async (ticketId, subject, fromMessages, role) => {
    const s = HF_DB.getSession();
    const body = document.getElementById("ticket-reply-input")?.value.trim();
    if (!body) return;

    const result = await HF_DB.addTicketMessage(
      ticketId,
      s.userId,
      body,
      false,
    );
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }

    document.getElementById("ticket-reply-input").value = "";
    viewTicketThread(ticketId, subject, fromMessages, role);
  };

  const markTicketResolved = async (ticketId, subject, fromMessages, role) => {
    const result = await HF_DB.resolveTicket(ticketId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Ticket marked as resolved.", "success");
    viewTicketThread(ticketId, subject, fromMessages, role);
  };

  const reopenUserTicket = async (ticketId, subject, fromMessages, role) => {
    const result = await HF_DB.reopenTicket(ticketId);
    if (result.error) {
      HF_UTILS.toast(result.error, "error");
      return;
    }
    HF_UTILS.toast("Ticket reopened.", "success");
    viewTicketThread(ticketId, subject, fromMessages, role);
  };

  // ── AVATAR ──────────────────────────────────────────────────

  const previewAvatar = (input) => {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      HF_UTILS.toast("Image must be under 2MB.", "error");
      return;
    }
    window._pendingAvatarFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      ["avatar-preview", "avatar-banner"].forEach((id) => {
        const el = document.getElementById(id);
        if (el)
          el.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;">`;
      });
    };
    reader.readAsDataURL(file);
  };

  // ── TRACKING ────────────────────────────────────────────────

  const addDrill = () => {
    const name = document.getElementById("drill-name")?.value.trim();
    const dur = document.getElementById("drill-dur")?.value;
    const type = document.getElementById("drill-type")?.value;
    if (!name) {
      HF_UTILS.toast("Please enter a drill name.", "error");
      return;
    }
    if (!window._sessionDrills) window._sessionDrills = [];
    window._sessionDrills.push({ name, duration: parseInt(dur), type });
    _renderDrillsList();
    document.getElementById("drill-name").value = "";
    document.getElementById("drill-dur").value = "10";
    HF_UTILS.toast("Drill added!", "success");
  };

  const removeDrill = (index) => {
    window._sessionDrills.splice(index, 1);
    _renderDrillsList();
  };

  const _renderDrillsList = () => {
    const list = document.getElementById("drills-list");
    if (!list) return;
    if (!window._sessionDrills?.length) {
      list.innerHTML = `<div style="text-align:center;padding:24px;background:var(--bg2);border:0.5px dashed var(--border);color:var(--text3);font-size:13px;">No drills yet — add one below.</div>`;
      return;
    }
    list.innerHTML = window._sessionDrills
      .map(
        (d, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg2);border-left:2px solid var(--gold);margin-bottom:4px;">
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text)">${d.name}</div>
        <div style="font-size:11px;color:var(--text2)">${d.type} · ${d.duration} min</div>
      </div>
      <button class="btn btn-danger btn-sm" onclick="HF_ROLE_UTILS.removeDrill(${i})">
        <i class="ti ti-x"></i>
      </button>
    </div>`,
      )
      .join("");
  };

  // ── PRAYERS ─────────────────────────────────────────────────

  const togglePrayer = (prayerId, role) => {
    const session = HF_DB.getSession();
    const today = HF_DB.localDate();
    const key = `hf_faith_checklist_${session.userId}_${today}`;
    const checklist = JSON.parse(localStorage.getItem(key) || "{}");

    checklist[prayerId] = !checklist[prayerId];
    localStorage.setItem(key, JSON.stringify(checklist));

    const morningIds = ["morning", "prematch", "struggle"];
    const eveningIds = ["evening"];
    const allMorningDone = morningIds.every((id) => checklist[id]);
    const allEveningDone = eveningIds.every((id) => checklist[id]);

    if (allMorningDone) {
      const p = session.profile || {};
      const lastFaith = p.lastFaithDate;
      const yesterday = HF_DB.localDateOffset(-1);
      let newStreak = 1;
      if (lastFaith === yesterday) newStreak = (p.faithStreak || 0) + 1;
      else if (lastFaith === today) newStreak = p.faithStreak || 1;

      const updatedProfile = {
        ...p,
        faithStreak: newStreak,
        lastFaithDate: today,
      };
      HF_DB.updateUserProfile(session.userId, updatedProfile);
      session.profile = updatedProfile;
      HF_DB.saveSession(session);
    }

    if (allMorningDone && allEveningDone) {
      HF_UTILS.toast("Full day devotion complete! 🙏", "success");
      HF_UTILS.launchConfetti();
    } else if (allMorningDone) {
      HF_UTILS.toast("Morning devotion complete! 🙏", "success");
    }

    const handler = _getHandler(role);
    handler?.faith?.(session);
  };

  // ── FILTERING ──────────────────────────────────────────────

  const filterPlayers = (allPlayersKey, cardFn, listId, filters) => {
    const list = document.getElementById(listId);
    if (!list || !window[allPlayersKey]) return;

    const { pos, tier, search } = filters;
    const filtered = window[allPlayersKey].filter((p) => {
      const prof = p.profile || {};
      const matchPos = !pos || prof.pos === pos;
      const matchTier = !tier || prof.tier === tier;
      const matchSearch =
        !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchPos && matchTier && matchSearch;
    });

    list.innerHTML =
      filtered.length === 0
        ? `<div style="text-align:center;padding:24px;color:var(--text2);font-size:13px">No players match your filters.</div>`
        : filtered.map((p) => cardFn(p)).join("");
  };

  // ── PRIVATE HELPERS ─────────────────────────────────────────

  const _getSetMain = (role) => {
    const map = {
      player: () =>
        window.HF_PLAYER?._setMain ||
        ((html) => {
          const mc = document.getElementById("main-content");
          if (mc) mc.innerHTML = html;
        }),
      coach: () =>
        window.HF_COACH?._setMain ||
        ((html) => {
          const mc = document.getElementById("main-content");
          if (mc) mc.innerHTML = html;
        }),
      scout: () =>
        window.HF_SCOUT?._setMain ||
        ((html) => {
          const mc = document.getElementById("main-content");
          if (mc) mc.innerHTML = html;
        }),
      admin: () =>
        window.HF_ADMIN?._setMain ||
        ((html) => {
          const mc = document.getElementById("main-content");
          if (mc) mc.innerHTML = html;
        }),
    };
    return (html) => {
      const mc = document.getElementById("main-content");
      if (mc) mc.innerHTML = html;
    };
  };

  const _getHandler = (role) => {
    const map = {
      player: window.HF_PLAYER,
      coach: window.HF_COACH,
      scout: window.HF_SCOUT,
      admin: window.HF_ADMIN,
    };
    return map[role];
  };

  return {
    composeMessage,
    sendMessage,
    messageUser,
    searchRecipients,
    selectRecipient,
    removeRecipient,
    sendComposedMessage,
    viewThread,
    sendReply,
    toggleMsgActions,
    replyToMessage,
    viewProfile,
    viewSenderProfile,
    reportToAdmin,
    archiveMessage,
    unarchiveMessage,
    readMessage,
    contactAdmin,
    myTickets,
    newTicket,
    sendTicket,
    viewTicketThread,
    sendUserTicketReply,
    markTicketResolved,
    reopenUserTicket,
    addDrill,
    removeDrill,
    previewAvatar,
    togglePrayer,
    filterPlayers,
  };
})();

window.HF_ROLE_UTILS = HF_ROLE_UTILS;
