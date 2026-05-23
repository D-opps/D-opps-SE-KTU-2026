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
import { Events } from "./pages/Events";
import { Notifications } from "./pages/Notifications";
import ReportPage from "./pages/Report";
import ReportDashboard from "./pages/ReportDashboard";
import { VerifyEmail } from "./pages/VerifyEmail"; // Це очікує 'export const VerifyEmail'// 1. ІМПОРТУЙ ТУТ СВОЮ СТОРІНКУ АНАЛІТИКИ
import { AnalyticsDashboard } from "./pages/AnalyticsDashboard"; 

export const router = createBrowserRouter([
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/verify-email", 
    Component: VerifyEmail,
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
      { path: "chat", Component: Chat },
      { path: "chat/:chatId", Component: Chat },
      { path: "profile", Component: Profile },
      { path: "events", Component: Events },
      { path: "notifications", Component: Notifications },
      { path: "report/:type/:id", Component: ReportPage },
      { path: "admin/reports", Component: ReportDashboard },
      // 2. ДОДАЙ ЦЕЙ ШЛЯХ ТУТ
      { path: "admin/analytics", Component: AnalyticsDashboard },
    ],
  },
]);