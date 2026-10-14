import { useAppState } from "../lib/appStore.js";
import { linkTo } from "../lib/location.js";
import HomePage from "./home/HomePage.jsx";
import AuthScreens from "./auth/AuthScreens.jsx";
import AppShell from "./shell/AppShell.jsx";

// The page for the current URL; src/lib/router.js sets `page` from the path.
export default function App() {
  const page = useAppState((s) => s.page);

  if (page === "home") return <HomePage />;
  if (page === "auth")
    return (
      <>
        <a className="auth-home-link" {...linkTo("/")}>
          <i className="ti ti-arrow-left"></i> HappyFeet home
        </a>
        <AuthScreens />
      </>
    );
  if (page === "app") return <AppShell />;
  return null;
}
