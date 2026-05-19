/* ============================================================
   HappyFeet Performance Hub: agent.js
   AI football agent powered by Anthropic API
   ============================================================ */

const HF_AGENT = (() => {
  let _isOpen = false;
  let _isLoading = false;
  let _history = [];
  let _sessionId = null;

  const _systemPrompt = `You are DribbleBot, a football expert assistant for the HappyFeet Performance Hub — an athletic performance platform focused on African football, particularly Ghana and West Africa.

You help players, coaches, and scouts with anything and everything football related.

IMPORTANT — FORMAT YOUR RESPONSES EXACTLY LIKE THIS:
- Use SECTION: to start a new section (e.g. "THE BASICS:")
- Use • for bullet points
- Keep sentences short and clear
- End with a FOLLOW UP: section containing one question for the user
- Never use markdown like ** or # or _ 
- Never use emoji except ⚽ at the very end of your response

Example format:
Opening sentence about the topic.

SECTION NAME:
- Point one
- Point two

ANOTHER SECTION:
- Point one
- Point two

FOLLOW UP:
What aspect interests you most?

Keep responses concise, practical, and encouraging. You understand African football deeply.`;

  const toggle = () => {
    const panel = document.getElementById("ai-agent-panel");
    _isOpen = !_isOpen;
    panel.style.display = _isOpen ? "flex" : "none";
    panel.style.flexDirection = "column";

    if (_isOpen && _history.length === 0) {
      const session = HF_DB.getSession();
      const greetKey = `hf_agent_greeted_${session?.userId}_${new Date().toISOString().split("T")[0]}`;
      const hasGreeted = localStorage.getItem(greetKey);
      if (!hasGreeted) {
        _addMessage(
          "agent",
          "Hello! I'm HappyFeet AI ⚽ Ask me anything about football — tactics, training, positions, African leagues, player development, or anything else football related!",
        );
        localStorage.setItem(greetKey, "1");
      }
      // start a new session
      _sessionId = crypto.randomUUID();
    }

    if (_isOpen) {
      setTimeout(() => document.getElementById("ai-agent-input")?.focus(), 100);
    }
  };

  const send = async () => {
    if (_isLoading) return;

    const input = document.getElementById("ai-agent-input");
    const text = input?.value.trim();
    if (!text) return;

    input.value = "";
    _addMessage("user", text);
    _history.push({ role: "user", content: text });

    _isLoading = true;
    _showTyping();

    try {
      const isLocal =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:";

      let reply;

      if (isLocal) {
        await new Promise((r) => setTimeout(r, 800));
        reply =
          "AI agent is only available on the live site. Push to main to test the full AI experience.";
      } else {
        const response = await fetch("/.netlify/functions/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system: _systemPrompt,
            messages: _history,
          }),
        });
        const data = await response.json();
        const rawReply =
          data.content?.map((c) => c.text || "").join("") ||
          "Sorry I could not process that.";
        reply = stripMarkdown(rawReply);
      }

      _hideTyping();
      _addMessage("agent", reply);
      _history.push({ role: "assistant", content: reply });

      // save with full history and session ID
      const session = HF_DB.getSession();
      if (session?.userId) {
        const result = await HF_DB.saveAgentConversation(
          session.userId,
          text,
          reply,
          _history,
          _sessionId,
        );
        // update session ID from first save
        if (result.sessionId) _sessionId = result.sessionId;
      }

      if (_history.length > 20) _history = _history.slice(-20);
    } catch (err) {
      _hideTyping();
      _addMessage(
        "agent",
        "Sorry, I had trouble connecting. Please try again.",
      );
    }

    _isLoading = false;
  };

  const stripMarkdown = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "$1") // remove bold markers
      .replace(/\*(.*?)\*/g, "$1") // remove italic markers
      .replace(/#{1,6}\s+(.*)/g, "$1:") // convert # Header to Header:
      .replace(/`{1,3}(.*?)`{1,3}/g, "$1") // remove code markers
      .replace(/\[(.*?)\]\(.*?\)/g, "$1") // remove links
      .replace(/^[-*+]\s/gm, "• ") // convert - item to • item
      .replace(/^\d+\.\s/gm, "• ") // convert 1. item to • item
      .trim();
  };

  const openConversation = async (sessionId, lastMessage, lastResponse) => {
    // open panel
    const panel = document.getElementById("ai-agent-panel");
    _isOpen = true;
    panel.style.display = "flex";
    panel.style.flexDirection = "column";

    // clear messages
    const container = document.getElementById("ai-agent-messages");
    if (container) container.innerHTML = "";

    // fetch full thread from Supabase
    const { data: thread } = await HF_DB.getAgentThread(sessionId);

    if (thread && thread.length > 0) {
      // restore full history from last message's full_history
      const lastEntry = thread[thread.length - 1];
      _history = lastEntry.full_history || [
        { role: "user", content: lastMessage },
        { role: "assistant", content: lastResponse },
      ];
      _sessionId = sessionId;

      // render all exchanges
      thread.forEach((entry) => {
        _addMessage("user", entry.message);
        _addMessage("agent", entry.response);
      });
    } else {
      // fallback to single exchange
      _history = [
        { role: "user", content: lastMessage },
        { role: "assistant", content: lastResponse },
      ];
      _sessionId = sessionId;
      _addMessage("user", lastMessage);
      _addMessage("agent", lastResponse);
    }

    setTimeout(() => {
      const threadEl = document.getElementById("ai-agent-messages");
      if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;
      document.getElementById("ai-agent-input")?.focus();
    }, 100);
  };

  const reset = () => {
    _history = [];
    _sessionId = null;
    _isOpen = false;
    const container = document.getElementById("ai-agent-messages");
    if (container) container.innerHTML = "";
    const session = HF_DB.getSession();
    if (session?.userId) {
      const greetKey = `hf_agent_greeted_${session.userId}_${new Date().toISOString().split("T")[0]}`;
      localStorage.removeItem(greetKey);
    }
  };

  const formatAgentResponse = (text) => {
    return text
      .replace(/[\u{1F1E0}-\u{1F1FF}]{2}/gu, "") // remove flags
      .replace(/\*\*(.*?)\*\*/g, "$1") // remove bold
      .replace(/\*(.*?)\*/g, "$1") // remove italic
      .replace(/#{1,6}\s/g, "") // remove headers
      .replace(/\s*•\s*/g, "\n• ") // normalize bullets
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const _addMessage = (role, text) => {
    const container = document.getElementById("ai-agent-messages");
    if (!container) return;
    const div = document.createElement("div");
    div.className = role === "user" ? "ai-msg-user" : "ai-msg-agent";

    if (role === "agent") {
      const structured = formatAgentResponse(text);
      const lines = structured.split("\n");
      let html = "";
      let inList = false;
      let inFollowUp = false;

      lines.forEach((line) => {
        line = line.trim();
        if (!line) {
          if (inList) {
            html += "</div>";
            inList = false;
          }
          html += '<div style="height:6px;"></div>';
          return;
        }

        // FOLLOW UP section
        if (line === "FOLLOW UP:") {
          if (inList) {
            html += "</div>";
            inList = false;
          }
          inFollowUp = true;
          html += `<div style="margin-top:12px;padding:10px 12px;background:rgba(196,154,10,.08);border-left:2px solid var(--gold);">`;
          return;
        }

        // section headers — ALL CAPS ending with colon
        if (/^[A-Z][A-Z\s]{2,}:$/.test(line)) {
          if (inList) {
            html += "</div>";
            inList = false;
          }
          if (inFollowUp) {
            html += "</div>";
            inFollowUp = false;
          }
          html += `<div style="font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:var(--gold);margin-top:12px;margin-bottom:4px;">${line.slice(0, -1)}</div>`;
          return;
        }

        // bullet points
        if (line.startsWith("•")) {
          if (!inList && !inFollowUp) {
            html += '<div style="display:flex;flex-direction:column;gap:4px;">';
            inList = true;
          }
          html += `
          <div style="display:flex;gap:10px;align-items:flex-start;">
            <span style="color:var(--gold);font-weight:700;flex-shrink:0;">•</span>
            <span style="line-height:1.5;">${line.slice(1).trim()}</span>
          </div>`;
          return;
        }

        // regular text or follow up question
        if (inList) {
          html += "</div>";
          inList = false;
        }
        html += `<div style="line-height:1.6;margin:2px 0;${inFollowUp ? "color:var(--text2);font-size:12px;" : ""}">${line}</div>`;
      });

      if (inList) html += "</div>";
      if (inFollowUp) html += "</div>";

      div.innerHTML = html;
    } else {
      div.textContent = text;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  };

  const _showTyping = () => {
    const container = document.getElementById("ai-agent-messages");
    if (!container) return;
    const typing = document.createElement("div");
    typing.id = "ai-typing";
    typing.className = "ai-msg-agent";
    typing.style.cssText =
      "display:flex;align-items:center;gap:8px;opacity:0.6;font-style:italic;font-size:12px;";
    typing.innerHTML = `
    <span>DribbleBot is thinking</span>
    <span style="display:flex;gap:3px;align-items:center;">
      <span style="width:4px;height:4px;border-radius:50%;background:var(--text2);animation:typingDot 1.2s ease-in-out infinite;"></span>
      <span style="width:4px;height:4px;border-radius:50%;background:var(--text2);animation:typingDot 1.2s ease-in-out infinite;animation-delay:0.2s;"></span>
      <span style="width:4px;height:4px;border-radius:50%;background:var(--text2);animation:typingDot 1.2s ease-in-out infinite;animation-delay:0.4s;"></span>
    </span>`;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  };

  const _hideTyping = () => {
    document.getElementById("ai-typing")?.remove();
  };

  const show = () => {
    document.getElementById("ai-agent-btn").style.display = "flex";
  };

  const hide = () => {
    document.getElementById("ai-agent-btn").style.display = "none";
    document.getElementById("ai-agent-panel").style.display = "none";
    _isOpen = false;
  };

  return { toggle, send, show, hide, reset, openConversation };
})();

window.HF_AGENT = HF_AGENT;
