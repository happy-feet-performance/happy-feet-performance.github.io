import { AccountSettings } from "../shared/index.js";

// Account settings page (/app/settings), opened from the header's user menu.
export default function Settings({ session }) {
  return (
    <>
      <div className="welcome-banner">
        <div>
          <div className="welcome-title">Settings</div>
          <div className="welcome-sub">Manage your sign-in details and account</div>
        </div>
      </div>
      <AccountSettings session={session} />
    </>
  );
}
