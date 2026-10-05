// Views shared by every role, mounted by src/lib/roleUtils.js.
import ComposeMessage from "./ComposeMessage.jsx";
import MessageThread from "./MessageThread.jsx";
import MessageUser from "./MessageUser.jsx";
import MyTickets from "./MyTickets.jsx";
import NewTicket from "./NewTicket.jsx";
import TicketThread from "./TicketThread.jsx";
import UserProfile from "./UserProfile.jsx";

export { default as ArchivedMessages } from "./ArchivedMessages.jsx";
export { default as MessageList } from "./MessageList.jsx";

export default {
  ComposeMessage,
  MessageThread,
  MessageUser,
  MyTickets,
  NewTicket,
  TicketThread,
  UserProfile,
};
