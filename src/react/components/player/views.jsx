// Player views as mounted by src/lib/player.js; each loads its own data and
// reloads after an action changes something.
import {
  editProfile,
  leaveTeam,
  loadAchievements,
  loadDashboard,
  loadFaithChecklist,
  loadFindMyTeam,
  loadHealth,
  loadMessages,
  loadProfile,
  loadStats,
  loadTraining,
  logHealthCheckin,
  messageCoach,
  requestTrial,
  respondInvite,
  toggleSessionComplete,
} from "../../../lib/player.js";
import { navTo } from "../../../lib/router.js";
import { Loaded } from "../shared/index.js";
import Achievements from "./Achievements.jsx";
import Dashboard from "./Dashboard.jsx";
import Faith from "./Faith.jsx";
import FindMyTeam from "./FindMyTeam.jsx";
import Health from "./Health.jsx";
import Messages from "./Messages.jsx";
import Profile from "./Profile.jsx";
import Stats from "./Stats.jsx";
import Training from "./Training.jsx";

// run an action, then reload if it changed anything
const thenReload = (reload, action) => async (...args) => (await action(...args)) && reload();

export const DashboardView = ({ session }) => (
  <Loaded load={() => loadDashboard(session)}>{(data) => <Dashboard session={session} {...data} />}</Loaded>
);

export const ProfileView = ({ session }) => (
  <Loaded load={() => loadProfile(session)}>
    {(data, reload) => (
      <Profile
        {...data}
        onEdit={editProfile}
        onSettings={() => navTo("profile#settings")}
        onLeaveTeam={thenReload(reload, leaveTeam)}
      />
    )}
  </Loaded>
);

export const StatsView = ({ session }) => (
  <Loaded load={() => loadStats(session)}>{(data) => <Stats session={session} {...data} />}</Loaded>
);

export const TrainingView = ({ session }) => (
  <Loaded load={() => loadTraining(session)}>
    {(data, reload) => (
      <Training session={session} {...data} onToggleComplete={thenReload(reload, toggleSessionComplete)} />
    )}
  </Loaded>
);

export const HealthView = ({ session }) => (
  <Loaded load={() => loadHealth(session)}>
    {(data, reload) => (
      // keyed on the saved log so a reload after logging remounts the view:
      // it shows the summary card and the form starts from the new values
      <Health
        key={JSON.stringify(data.todayLog || null)}
        session={session}
        {...data}
        onLogCheckin={thenReload(reload, logHealthCheckin)}
      />
    )}
  </Loaded>
);

export const AchievementsView = ({ session }) => (
  <Loaded load={() => loadAchievements(session)}>
    {(unlockedIds) => <Achievements session={session} unlockedIds={unlockedIds} />}
  </Loaded>
);

export const MessagesView = ({ session }) => (
  <Loaded load={() => loadMessages(session)}>
    {(data, reload) => <Messages session={session} {...data} onRespondInvite={thenReload(reload, respondInvite)} />}
  </Loaded>
);

export const FaithView = ({ session }) => <Faith session={session} checked={loadFaithChecklist(session)} />;

export const FindMyTeamView = ({ session }) => (
  <Loaded load={() => loadFindMyTeam(session)}>
    {(coaches, reload) => (
      <FindMyTeam
        session={session}
        coaches={coaches}
        onRequestTrial={thenReload(reload, (c) => requestTrial(c.id, c.name))}
        onMessageCoach={(c) => messageCoach(c.id, c.name)}
      />
    )}
  </Loaded>
);
