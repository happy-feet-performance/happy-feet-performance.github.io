// Supabase data layer. Re-exports the public API that used to be
// window.HF_DB; src/lib/legacyBridge.js still exposes it under that name
// for the classic scripts.
export {
  _localDate as localDate,
  _localDateOffset as localDateOffset,
  getSession,
  saveSession,
  clearSession,
} from "./core.js";
export {
  createUser,
  findUser,
  findUserByContact,
  checkContactExists,
  updateUserName,
  updateUserProfile,
  getUserStatus,
  uploadAvatar,
  updateUserAccount,
} from "./auth.js";
export {
  incrementLoginAttempts,
  resetLoginAttempts,
  updateLoginStreak,
  getLoginStreak,
  setSecurityQuestion,
  getUserSecurityQuestion,
  verifySecurityAnswer,
  resetPassword,
} from "./security.js";
export {
  getAdminIds,
  getAllUsers,
  getUserById,
  searchAllUsers,
  searchPlayers,
  getAllPlayers,
  getUnattachedPlayers,
  kickUser,
  banUser,
  unbanUser,
  removeUser,
} from "./users.js";
export {
  setJerseyNumber,
  submitSquadVerification,
  submitAgencyVerification,
  checkTeamExists,
  getPendingVerifications,
  claimVerification,
  unclaimVerification,
  getAllVerifications,
  approveVerification,
  rejectVerification,
  getCoachVerification,
  acceptVerificationEdits,
  declineVerificationEdits,
  saveVerificationEdits,
  deleteAdminVerificationMessage,
  updateTeamSize,
  toggleRecruitment,
  updateVerificationStatus,
} from "./verifications.js";
export {
  getSquadPlayers,
  getCoachSquadDetails,
  getSquadReadiness,
  removePlayerFromSquad,
  sendSquadInvite,
  getSquadInvites,
  getCoachInvites,
  respondToInvite,
  getPlayerCurrentCoach,
  leaveSquad,
  getVerifiedCoaches,
  getVerifiedCoachesRaw,
  getVerifiedTeams,
  submitUnverifiedOpponent,
  getFlaggedProspects,
} from "./squad.js";
export {
  requestTrial,
  respondToTrialRequest,
  getTrialRequestStatus,
  getPendingTrialRequests,
  getTrialPlayers,
  requestClubNetwork,
  respondClubRequest,
  getClubNetworkStatus,
  getPendingClubRequests,
  getApprovedClubNetwork,
} from "./trials.js";
export {
  _sendMessage,
  getMessages,
  getArchivedMessages,
  getThread,
  getUnreadCount,
  archiveMessage,
  unarchiveMessage,
  markMessageRead,
  getUserNameById,
  getUserNamesByIds,
} from "./messages.js";
export {
  createTicket,
  getTickets,
  getUserTickets,
  claimTicket,
  resolveTicket,
  reopenTicket,
  getMyTickets,
  addTicketMessage,
  getTicketMessages,
} from "./tickets.js";
export {
  getTraining,
  saveTraining,
  logTrainingSession,
  getTrainingLogs,
  getTodayTrainingLog,
  getCoachTrainingForPlayer,
  getTrainingCached,
} from "./training.js";
export {
  getHealth,
  saveHealthLog,
  getHealthLogs,
  getTodayHealthLog,
  getPlayerHealthLogs,
} from "./health.js";
export {
  saveSessionRating,
  getTodaySessionRating,
  _updateSessionRating,
  getPlayerSessionRatings,
  getSquadSessionRatings,
} from "./ratings.js";
export {
  getScoutProspects,
  saveProspect,
  unsaveProspect,
  updateProspectStatus,
  saveProspectReport,
  getProspectReport,
} from "./scouting.js";
export {
  getAchievements,
  unlockAchievement,
  checkAndUnlockAchievements,
} from "./achievements.js";
export {
  createMatch,
  getCoachMatches,
  getPlayerMatches,
  logMatchResult,
  updateMatchPlayerStats,
  getCoachWDL,
  adminVerifyMatch,
  getPendingMatchVerifications,
  sendMatchRequest,
  respondMatchRequest,
  confirmMatchAsCoach,
  getPendingMatchRequests,
  getOpponentSquad,
  getAccurateTeamSize,
  saveMatchLineup,
  saveMatchPostStats,
  getMatchById,
  submitLineup,
  cancelMatch,
  checkLineupDeadlines,
  getMatchForOpponentCoach,
  getIncomingMatchesForCoach,
} from "./matches.js";
export {
  saveAgentConversation,
  getAgentConversations,
  getAgentThread,
} from "./agent.js";
export {
  getTracker,
} from "./tracker.js";
export {
  subscribeToMessages,
  subscribeToUserStatus,
  subscribeToVerifications,
  subscribeToTickets,
  subscribeToUserTickets,
  subscribeToMatchRequests,
  subscribeToCoachTraining,
  removeAllChannels,
} from "./realtime.js";
