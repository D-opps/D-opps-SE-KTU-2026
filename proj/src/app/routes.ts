import { createBrowserRouter } from "react-router";
import { Login } from "./pages/Login";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Laundry } from "./pages/Laundry";
import { Marketplace } from "./pages/Marketplace";
import { ItemDetails } from "./pages/ItemDetails";
import { Chat } from "./pages/Chat";
import { Profile } from "./pages/Profile";

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "laundry", Component: Laundry },
      { path: "marketplace", Component: Marketplace },
      { path: "marketplace/:itemId", Component: ItemDetails },
      { path: "chat", Component: Chat },
      { path: "profile", Component: Profile },
    ],
  },
]);
