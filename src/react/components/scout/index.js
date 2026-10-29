import EditProfile from "./EditProfile.jsx";
import ResubmitAgency from "./ResubmitAgency.jsx";
import { ShareReport } from "./ReportScreens.jsx";
import {
  DashboardView,
  DiscoverView,
  FindMyTalentView,
  GenerateReportView,
  MessagesView,
  PlacementsView,
  ProfileView,
  ProspectsView,
  ReportPageView,
  ReportsView,
} from "./views.jsx";

export default {
  ScoutDashboard: DashboardView,
  ScoutProfile: ProfileView,
  ScoutEditProfile: EditProfile,
  ScoutDiscover: DiscoverView,
  ScoutProspects: ProspectsView,
  ScoutReports: ReportsView,
  ScoutPlacements: PlacementsView,
  ScoutMessages: MessagesView,
  ScoutFindMyTalent: FindMyTalentView,
  ScoutResubmitAgency: ResubmitAgency,
  ScoutGenerateReport: GenerateReportView,
  ScoutReport: ReportPageView,
  ScoutShareReport: ShareReport,
};
