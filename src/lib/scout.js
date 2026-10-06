// Scout dashboard: view routing, data loaders and actions. Each view
// component (src/react/components/scout/views.jsx) loads its own data.
import * as db from "./db/index.js";
import { toast } from "./dom.js";
import { buildSidenav, navTo } from "./router.js";
import { showView } from "./views.js";

// ─── Views ─────────────────────────────────────────────────
const VIEW_NAMES = {
  dashboard: "ScoutDashboard",
  profile: "ScoutProfile",
  discover: "ScoutDiscover",
  prospects: "ScoutProspects",
  reports: "ScoutReports",
  placements: "ScoutPlacements",
  messages: "ScoutMessages",
  findmytalent: "ScoutFindMyTalent",
};

export const render = (view, session) => showView(VIEW_NAMES[view] || VIEW_NAMES.dashboard, { session });
export const messages = (s) => render("messages", s);
export const editProfile = () => showView("ScoutEditProfile", { session: db.getSession() });
export const resubmitAgency = () => showView("ScoutResubmitAgency", { session: db.getSession() });
export const generateReport = (scoutId, playerId, playerName) =>
  showView("ScoutGenerateReport", { scoutId, playerId, playerName });
export const viewReport = (scoutId, playerId, playerName) =>
  showView("ScoutReport", { scoutId, playerId, playerName });
export const shareReportViaMessage = (scoutId, playerId, playerName) =>
  showView("ScoutShareReport", { scoutId, playerId, playerName });

// ─── Loaders ───────────────────────────────────────────────
export const loadDashboard = async (s) => {
  const [{ data: agentConvos }, { data: prospects }] = await Promise.all([
    db.getAgentConversations(s.userId),
    s.agencyStatus === "verified" ? db.getScoutProspects(s.userId) : Promise.resolve({ data: null }),
  ]);
  return { agentConvos, prospects };
};

// Refreshes the session's profile from the database before showing it.
export const loadProfileSession = async (s) => {
  const { data: freshUser } = await db.getUserById(s.userId);
  if (freshUser?.profile) {
    s.profile = freshUser.profile;
    db.saveSession(s);
  }
  return s;
};

export const loadDiscover = async (s) => {
  const [{ data: players }, { data: saved }] = await Promise.all([db.getAllPlayers(), db.getScoutProspects(s.userId)]);
  return { players, savedIds: saved?.map((p) => p.player_id) || [] };
};

export const loadProspects = async (s) => (await db.getScoutProspects(s.userId)).data;

export const loadMessages = async (s) => {
  const [{ data: msgs }, { data: archived }] = await Promise.all([
    db.getMessages(s.userId),
    db.getArchivedMessages(s.userId),
  ]);
  const senderNames = await db.getUserNamesByIds([...(msgs || []), ...(archived || [])].map((m) => m.from_id));
  const withSender = (m) => ({ ...m, senderName: senderNames[m.from_id] || "HappyFeet" });
  return { enriched: (msgs || []).map(withSender), enrichedArchived: (archived || []).map(withSender) };
};

export const loadFindMyTalent = async (s) => {
  const [{ data: coaches }, { data: approved }] = await Promise.all([
    db.getVerifiedCoaches(),
    db.getApprovedClubNetwork(s.userId),
  ]);
  const approvedIds = new Set(approved?.map((a) => a.coach_id) || []);
  return Promise.all(
    (coaches || []).map(async (c) => {
      const { data: req } = await db.getClubNetworkStatus(s.userId, c.id);
      return { ...c, networkRequest: req, isApproved: approvedIds.has(c.id) };
    }),
  );
};

// Player data shown on (and fed into) the report generator.
export const loadReportInputs = async (scoutId, playerId) => {
  const [{ data: player }, { data: sessions }, { data: prospect }] = await Promise.all([
    db.getUserById(playerId),
    db.getPlayerSessionRatings(playerId),
    db.getProspectReport(scoutId, playerId),
  ]);
  const avgOverall = sessions?.length
    ? Math.round(sessions.reduce((sum, s) => sum + s.overall, 0) / sessions.length)
    : null;
  return { profile: player?.profile || {}, sessions: sessions || [], latest: sessions?.[0], avgOverall, prospect };
};

export const loadReport = async (scoutId, playerId) => (await db.getProspectReport(scoutId, playerId)).data;

// ─── Profile ───────────────────────────────────────────────
export const saveProfile = async ({ name, org, exp }) => {
  const session = db.getSession();
  const p = session.profile || {};
  name = name.trim();
  org = org.trim();
  if (!name) return toast("Please enter your full name.", "error");
  if (!org) return toast("Please enter your organisation name.", "error");
  if (!exp || parseInt(exp) < 0 || parseInt(exp) > 50)
    return toast("Please enter valid years of experience (0-50).", "error");

  // avatar chosen through roleUtils.previewAvatar
  const file = window._pendingAvatarFile || null;
  let avatarUrl = p.avatarUrl || null;
  if (file) {
    toast("Uploading photo...", "success");
    const uploadResult = await db.uploadAvatar(session.userId, file);
    if (uploadResult.error) return toast(uploadResult.error, "error");
    avatarUrl = uploadResult.url;
    window._pendingAvatarFile = null;
  }

  if (name !== session.name) {
    const nameResult = await db.updateUserName(session.userId, name);
    if (nameResult.error) return toast(nameResult.error, "error");
    session.name = name;
  }

  const updatedProfile = { ...p, org, exp, avatarUrl };
  const result = await db.updateUserProfile(session.userId, updatedProfile);
  if (result.error) return toast(result.error, "error");

  session.profile = updatedProfile;
  db.saveSession(session);
  buildSidenav(session);
  toast("Profile updated!", "success");
  navTo("profile");
};

// ─── Agency resubmission ───────────────────────────────────
export const submitAgencyResubmission = async ({ agencyName, regionsCovered, targetLeagues }) => {
  agencyName = agencyName.trim();
  if (!agencyName) return toast("Please enter your agency name.", "error");
  if (regionsCovered.length === 0) return toast("Please select at least one region.", "error");
  if (targetLeagues.length === 0) return toast("Please select at least one target league.", "error");

  const session = db.getSession();
  const result = await db.submitAgencyVerification({
    scoutId: session.userId,
    agencyName,
    regionsCovered,
    targetLeagues,
    website: null,
  });
  if (result.error) return toast(result.error, "error");

  await db.updateVerificationStatus(session.userId, "agency", "pending");
  session.agencyStatus = "pending";
  db.saveSession(session);
  toast("Agency resubmitted for verification!", "success");
  navTo("dashboard");
};

// ─── Scouting reports ──────────────────────────────────────
const reportPrompt = ({ playerName, profile: p, latest, sessions, avgOverall }, obs, org) =>
  `You are an expert football scout writing a professional scouting report for an African football talent platform called HappyFeet.

Generate a detailed, professional scouting report for the following player:

PLAYER DETAILS:
- Name: ${playerName}
- Position: ${p.pos || "Unknown"}
- Age tier: ${p.tier || "Unknown"}
- Hometown: ${p.hometown || "Unknown"}
- Club status: ${p.club || "Unattached"}

PERFORMANCE DATA:
- Sessions logged: ${sessions.length}
- Average overall rating: ${avgOverall ? avgOverall + "/100" : "No data"}
${
  latest
    ? `- Latest speed: ${latest.speed}/100
- Latest technical: ${latest.technical}/100
- Latest tactical: ${latest.tactical}/100
- Latest physical: ${latest.physical}/100`
    : "- No session data available"
}

SCOUT OBSERVATIONS:
- Strengths: ${obs.strengths || "Not provided"}
- Areas for development: ${obs.weaknesses || "Not provided"}
- Additional context: ${obs.context || "Not provided"}
- Target clubs/leagues: ${obs.targets || "Not specified"}

SCOUT AGENCY: ${org}

Write a professional scouting report with the following sections:
1. PLAYER OVERVIEW
2. TECHNICAL ANALYSIS
3. PHYSICAL ANALYSIS
4. TACTICAL AWARENESS
5. KEY STRENGTHS
6. AREAS FOR IMPROVEMENT
7. SCOUT RECOMMENDATION
8. POTENTIAL RATING (score out of 10 with brief justification)

Be specific, professional, and constructive. Focus on the African football context and potential for development. Format each section clearly.`;

// Stand-in report for local development, where the Netlify function
// isn't available.
const mockReport = ({ playerName, profile: p, latest, avgOverall }, obs, org) =>
  `SCOUTING REPORT FOR ${playerName.toUpperCase()}

1. PLAYER OVERVIEW
${playerName} is a ${p.tier || "youth"} ${p.pos || "field"} player from ${p.hometown || "Ghana"}. Currently ${p.club ? "signed to " + p.club : "unattached and available"}.

2. TECHNICAL ANALYSIS
Based on available session data, the player shows ${avgOverall ? (avgOverall >= 75 ? "strong" : avgOverall >= 60 ? "developing" : "early-stage") : "unmeasured"} technical ability${latest ? ` with a technical rating of ${latest.technical}/100` : ""}.

3. PHYSICAL ANALYSIS
${latest ? `Physical rating of ${latest.physical}/100 with speed at ${latest.speed}/100.` : "Physical data not yet available (further sessions required)."}

4. TACTICAL AWARENESS
${latest ? `Tactical rating of ${latest.tactical}/100.` : "Tactical assessment pending further observation."}

5. KEY STRENGTHS
${obs.strengths || "To be assessed in further sessions."}

6. AREAS FOR IMPROVEMENT
${obs.weaknesses || "Comprehensive assessment required."}

7. SCOUT RECOMMENDATION
${avgOverall && avgOverall >= 70 ? "RECOMMEND for trial: player shows significant promise." : "MONITOR: continue observation before making placement recommendation."}

8. POTENTIAL RATING
${avgOverall ? Math.round(avgOverall / 10) : 6}/10: ${avgOverall && avgOverall >= 75 ? "High potential with right development pathway." : "Developing talent requiring structured support."}

Report generated by ${org}.
[LOCAL MOCK: Deploy to see real AI report]`;

const isLocal = () =>
  ["localhost", "127.0.0.1"].includes(window.location.hostname) || window.location.protocol === "file:";

// Generates and saves an AI report from the scout's observations, then
// opens it. Returns false if generation failed.
export const submitGenerateReport = async (scoutId, playerId, playerName, observations) => {
  const inputs = { playerName, ...(await loadReportInputs(scoutId, playerId)) };
  const org = db.getSession().profile?.org || "HappyFeet Scouting";
  try {
    let reportText;
    if (isLocal()) {
      await new Promise((r) => setTimeout(r, 1500));
      reportText = mockReport(inputs, observations, org);
    } else {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: "You are an expert football scout writing professional scouting reports for African football talent.",
          messages: [{ role: "user", content: reportPrompt(inputs, observations, org) }],
        }),
      });
      const data = await response.json();
      reportText = data.content?.map((c) => c.text || "").join("") || "Report generation failed.";
    }

    await db.saveProspectReport(scoutId, playerId, {
      text: reportText,
      playerName,
      position: inputs.profile.pos,
      tier: inputs.profile.tier,
      generatedBy: org,
      avgOverall: inputs.avgOverall,
    });
    toast("Report generated!", "success");
    viewReport(scoutId, playerId, playerName);
    return true;
  } catch {
    toast("Failed to generate report. Please try again.", "error");
    return false;
  }
};

export const searchCoaches = async (query) => {
  const { data } = await db.searchAllUsers(query, db.getSession().userId);
  return data?.filter((u) => u.role === "coach") || [];
};

export const sendReportMessage = async (scoutId, playerId, playerName, toId, note) => {
  if (!toId) return toast("Please select a recipient.", "error");
  const session = db.getSession();
  const { data } = await db.getProspectReport(scoutId, playerId);
  if (!data?.report) return toast("No report to share.", "error");

  note = note.trim();
  await db._sendMessage(
    session.userId,
    toId,
    `Scouting report: ${playerName}`,
    `${note ? note + "\n\n" : ""}--- SCOUTING REPORT: ${playerName} ---\n\n${data.report.text}`,
  );
  await db._sendMessage(
    "system",
    playerId,
    "Your scouting report has been shared",
    `${session.name} from ${session.profile?.org || "HappyFeet Scouting"} has shared your scouting report with a coach. Your profile is being actively considered for opportunities.`,
  );
  await db.updateProspectStatus(scoutId, playerId, { report_shared: true, status: "shared" });
  toast("Report shared with coach!", "success");
  navTo("prospects");
};

// ─── Report downloads ──────────────────────────────────────
const fileDate = () => new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
const fileName = (playerName, date, ext) =>
  `scouting-report-${playerName.toLowerCase().replace(/\s+/g, "-")}-${date.replace(/\//g, "-")}.${ext}`;

const saveFile = (blob, name) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadReport = (playerName, report) => {
  if (!report?.text) return toast("No report to download.", "error");
  const date = fileDate();
  const agency = db.getSession().profile?.org || "HappyFeet Scouting";
  const md = `# Scouting Report for ${playerName}

**Generated by:** ${agency}
**Date:** ${date}
**Platform:** HappyFeet Performance Hub

---

${report.text.trim()}

---

*This report was generated by HappyFeet AI and reviewed by ${agency}.*
`;
  saveFile(new Blob([md], { type: "text/markdown" }), fileName(playerName, date, "md"));
  toast("Report downloaded!", "success");
};

export const downloadReportPDF = (playerName, report) => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const agency = db.getSession().profile?.org || "HappyFeet Scouting";
  const date = fileDate();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const gold = [196, 154, 10];

  // header bar, title and agency
  doc.setFillColor(...gold);
  doc.rect(0, 0, pageWidth, 56, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(15, 15, 13);
  doc.text("SCOUTING REPORT", margin, 36);
  doc.setFontSize(10);
  doc.text(agency, pageWidth - margin, 36, { align: "right" });

  // player name, date and position
  let y = 80;
  doc.setFontSize(22);
  doc.text(playerName.toUpperCase(), margin, y);
  y += 20;
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${date}  |  ${report.position || "-"}  |  ${report.tier || "-"}`, margin, y);
  y += 8;
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;

  if (report.avgOverall) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("AVERAGE OVERALL RATING", pageWidth - margin - 80, y - 12, { align: "right" });
    doc.setFontSize(28);
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.text(`${report.avgOverall}/100`, pageWidth - margin, y + 4, { align: "right" });
    y += 20;
  }

  // body; section headings in gold
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.setFont("helvetica", "normal");
  for (const line of doc.splitTextToSize(report.text || "", pageWidth - margin * 2)) {
    if (y > pageHeight - margin) {
      doc.addPage();
      doc.setFillColor(...gold);
      doc.rect(0, 0, pageWidth, 8, "F");
      y = 32;
    }
    if (/^\d+\.\s+[A-Z\s]+$/.test(line) || /^[A-Z\s]{4,}$/.test(line)) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...gold);
      doc.text(line, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
    } else {
      doc.text(line, margin, y);
    }
    y += 16;
  }

  // footer on every page
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`HappyFeet Performance Hub  |  ${agency}  |  Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 24, {
      align: "center",
    });
  }

  doc.save(fileName(playerName, date, "pdf"));
  toast("PDF downloaded!", "success");
};
