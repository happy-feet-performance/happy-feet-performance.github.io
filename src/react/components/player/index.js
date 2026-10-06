import EditProfile from "./EditProfile.jsx";
import Highlights from "./Highlights.jsx";
import {
  AchievementsView,
  DashboardView,
  FaithView,
  FindMyTeamView,
  HealthView,
  MessagesView,
  ProfileView,
  StatsView,
  TrainingView,
} from "./views.jsx";

export default {
  PlayerDashboard: DashboardView,
  PlayerProfile: ProfileView,
  PlayerEditProfile: EditProfile,
  PlayerStats: StatsView,
  PlayerTraining: TrainingView,
  PlayerHealth: HealthView,
  PlayerAchievements: AchievementsView,
  PlayerHighlights: Highlights,
  PlayerMessages: MessagesView,
  PlayerFaith: FaithView,
  PlayerFindMyTeam: FindMyTeamView,
};
