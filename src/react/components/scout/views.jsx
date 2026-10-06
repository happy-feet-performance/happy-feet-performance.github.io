// Scout views as mounted by src/lib/scout.js; each loads its own data.
import {
  editProfile,
  loadDashboard,
  loadDiscover,
  loadFindMyTalent,
  loadMessages,
  loadProfileSession,
  loadProspects,
  loadReport,
  loadReportInputs,
} from "../../../lib/scout.js";
import { navTo } from "../../../lib/router.js";
import { Loaded } from "../shared/index.js";
import Dashboard from "./Dashboard.jsx";
import Discover from "./Discover.jsx";
import FindMyTalent from "./FindMyTalent.jsx";
import Messages from "./Messages.jsx";
import Placements from "./Placements.jsx";
import Prospects from "./Prospects.jsx";
import Reports from "./Reports.jsx";
import ScoutProfile from "./ScoutProfile.jsx";
import { GenerateReport, ReportView } from "./ReportScreens.jsx";

export const DashboardView = ({ session }) => (
  <Loaded load={() => loadDashboard(session)}>{(data) => <Dashboard session={session} {...data} />}</Loaded>
);

export const ProfileView = ({ session }) => (
  <Loaded load={() => loadProfileSession(session)}>
    {(s) => <ScoutProfile session={s} onEdit={editProfile} onSettings={() => navTo("profile#settings")} />}
  </Loaded>
);

export const DiscoverView = ({ session }) => (
  <Loaded load={() => loadDiscover(session)}>{(data) => <Discover session={session} {...data} />}</Loaded>
);

export const ProspectsView = ({ session }) => (
  <Loaded load={() => loadProspects(session)}>{(saved) => <Prospects session={session} saved={saved} />}</Loaded>
);

export const ReportsView = ({ session }) => (
  <Loaded load={() => loadProspects(session)}>
    {(saved) => <Reports shared={saved?.filter((p) => p.report_shared) || []} />}
  </Loaded>
);

export const PlacementsView = ({ session }) => (
  <Loaded load={() => loadProspects(session)}>
    {(saved) => <Placements placed={saved?.filter((p) => p.placed) || []} />}
  </Loaded>
);

export const MessagesView = ({ session }) => (
  <Loaded load={() => loadMessages(session)}>{(data) => <Messages {...data} />}</Loaded>
);

export const FindMyTalentView = ({ session }) => (
  <Loaded load={() => loadFindMyTalent(session)}>{(coaches) => <FindMyTalent session={session} coaches={coaches} />}</Loaded>
);

export const GenerateReportView = ({ scoutId, playerId, playerName }) => (
  <Loaded load={() => loadReportInputs(scoutId, playerId)} deps={[playerId]}>
    {(inputs) => <GenerateReport scoutId={scoutId} playerId={playerId} playerName={playerName} inputs={inputs} />}
  </Loaded>
);

export const ReportPageView = ({ scoutId, playerId, playerName }) => (
  <Loaded load={() => loadReport(scoutId, playerId)} deps={[playerId]}>
    {(data) => <ReportView scoutId={scoutId} playerId={playerId} playerName={playerName} data={data} />}
  </Loaded>
);
