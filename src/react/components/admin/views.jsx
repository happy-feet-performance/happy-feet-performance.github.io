// Admin views as mounted by src/lib/admin.js. Each loads its own data and
// provides `reload` (via AdminReload) so actions deeper in the tree can
// refresh the view after they change something.
import { createContext, useContext } from "react";
import { loadDashboard, loadMessages, loadTicketMessages, loadTickets, loadUsers, loadVerifications } from "../../../lib/admin.js";
import { Loaded as LoadedData } from "../shared/index.js";
import Dashboard from "./Dashboard.jsx";
import Messages from "./Messages.jsx";
import TicketThread from "./TicketThread.jsx";
import Tickets from "./Tickets.jsx";
import Users from "./Users.jsx";
import Verifications from "./Verifications.jsx";

const AdminReload = createContext(() => {});
export const useAdminReload = () => useContext(AdminReload);

// Shared Loaded, plus `reload` provided to rows deeper in the tree.
const Loaded = ({ load, deps, children }) => (
  <LoadedData load={load} deps={deps}>
    {(data, reload) => <AdminReload.Provider value={reload}>{children(data)}</AdminReload.Provider>}
  </LoadedData>
);

export const DashboardView = ({ session }) => (
  <Loaded load={loadDashboard}>{(data) => <Dashboard session={session} {...data} />}</Loaded>
);

export const VerificationsView = ({ session, kind }) => (
  <Loaded load={() => loadVerifications(kind)} deps={[kind]}>
    {(list) => <Verifications session={session} kind={kind} list={list} />}
  </Loaded>
);

export const UsersView = ({ session }) => (
  <Loaded load={loadUsers}>{(users) => <Users session={session} users={users} />}</Loaded>
);

export const TicketsView = ({ session }) => (
  <Loaded load={() => loadTickets(session.userId)}>{(data) => <Tickets session={session} {...data} />}</Loaded>
);

export const MessagesView = ({ session }) => (
  <Loaded load={() => loadMessages(session.userId)}>{(data) => <Messages session={session} {...data} />}</Loaded>
);

export const TicketThreadView = ({ ticketId, subject, session }) => (
  <Loaded load={() => loadTicketMessages(ticketId)} deps={[ticketId]}>
    {(messages) => <TicketThread ticketId={ticketId} subject={subject} session={session} messages={messages} />}
  </Loaded>
);
