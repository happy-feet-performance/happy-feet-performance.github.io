/* ============================================================
   HappyFeet Performance Hub: agent.js
   AI football agent powered by Anthropic API
   ============================================================ */

const HF_AGENT = (() => {
  let _isOpen = false;
  let _isLoading = false;
  let _history = [];

  const _systemPrompt = `You are DribbleBot, a football expert assistant for the HappyFeet Performance Hub, an athletic performance platform focused on African football, particularly Ghana and West Africa.

You help players, coaches, and scouts with anything and everything football related:
- Football rules, tactics, formations, and strategy
- Player development, training advice, and fitness tips
- Position-specific guidance (GK, CB, LB, RB, DM, CM, CAM, LW, RW, ST)
- Age tier development (U10 through Professional)
- African football leagues, clubs, and competitions (Ghana Premier League, CAF Champions League, etc.)
- Coaching methodology, session planning, and squad management
- Scouting techniques, player evaluation, and recruitment
- Football culture in Ghana, Nigeria, Senegal, and across Africa
- Injury prevention, recovery, and wellness
- Mental preparation and faith in sport

Keep responses concise, practical, and encouraging. You understand the African football context deeply. Use football terminology naturally. Be enthusiastic about African talent and its potential on the world stage.

If asked about something unrelated to football, gently redirect the conversation back to football topics.`;

  const toggle = () => {
    const panel = document.getElementById("ai-agent-panel");
    _isOpen = !_isOpen;
    panel.style.display = _isOpen ? "flex" : "none";
    panel.style.flexDirection = "column";

    if (_isOpen && _history.length === 0) {
      // only show greeting once per day
      const session = HF_DB.getSession();
      const greetKey = `hf_agent_greeted_${session?.userId}_${new Date().toISOString().split("T")[0]}`;
      const hasGreeted = localStorage.getItem(greetKey);

      if (!hasGreeted) {
        _addMessage(
          "agent",
          "Hello! I'm HappyFeet AI ⚽ Ask me anything about football (tactics, training, positions, African leagues, player development, or anything else football related)!",
        );
        localStorage.setItem(greetKey, "1");
      }
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
        reply =
          data.content?.map((c) => c.text || "").join("") ||
          "Sorry I could not process that.";
      }

      _hideTyping();
      _addMessage("agent", reply);
      _history.push({ role: "assistant", content: reply });

      // save conversation to Supabase
      const session = HF_DB.getSession();
      if (session?.userId) {
        await HF_DB.saveAgentConversation(session.userId, text, reply);
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

  const _addMessage = (role, text) => {
    const container = document.getElementById("ai-agent-messages");
    if (!container) return;

    const div = document.createElement("div");
    div.className = role === "user" ? "ai-msg-user" : "ai-msg-agent";
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  };

  const _showTyping = () => {
    const container = document.getElementById("ai-agent-messages");
    if (!container) return;
    const typing = document.createElement("div");
    typing.id = "ai-typing";
    typing.className = "ai-msg-typing";
    typing.innerHTML = "<span></span><span></span><span></span>";
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

  const reset = () => {
    _history = [];
    _isOpen = false;
    const container = document.getElementById("ai-agent-messages");
    if (container) container.innerHTML = "";
    // clear greeting key so it shows again next login
    const session = HF_DB.getSession();
    if (session?.userId) {
      const greetKey = `hf_agent_greeted_${session.userId}_${new Date().toISOString().split("T")[0]}`;
      localStorage.removeItem(greetKey);
    }
  };

  return { toggle, send, show, hide, reset };
})();

window.HF_AGENT = HF_AGENT;
