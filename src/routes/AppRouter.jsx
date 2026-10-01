import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";

import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import AddressesPage from "../pages/AddressesPage";
import ZonesPage from "../pages/ZonesPage";
import UsersPage from "../pages/UsersPage";

import ProtectedRoute from "./ProtectedRoute";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Публичные страницы */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Защищённые страницы */}
        <Route element={<ProtectedRoute />}>

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/addresses"
            element={<AddressesPage />}
          />

          <Route
            path="/zones"
            element={<ZonesPage />}
          />

          <Route
            path="/users"
            element={<UsersPage />}
          />

        </Route>

        {/* Неизвестный маршрут */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}