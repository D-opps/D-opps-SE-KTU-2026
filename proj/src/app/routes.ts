import { createBrowserRouter } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { ForgotPassword } from "./pages/ForgotPassword";
import { ResetPassword } from "./pages/ResetPassword";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Laundry } from "./pages/Laundry";
import { Marketplace } from "./pages/Marketplace";
import { ItemDetails } from "./pages/ItemDetails";
import { Chat } from "./pages/Chat";
import { Profile } from "./pages/Profile";
// import App from "./App";
import { Events } from "./pages/Events";
import { Notifications } from "./pages/Notifications";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
  {
    path: "/forgot-password",
    Component: ForgotPassword,
  },
  {
    path: "/reset-password/:token",
    Component: ResetPassword,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "laundry", Component: Laundry },
      { path: "marketplace", Component: Marketplace },
      { path: "marketplace/:itemId", Component: ItemDetails },
      { path: "chat", Component: Chat },           // Відкриє список чатів
      { path: "chat/:chatId", Component: Chat },    // Відкриє конкретний чат за ID
      { path: "profile", Component: Profile },
      {path: "events", Component: Events},
      {path: "notifications", Component: Notifications},

    ],
  },
]);