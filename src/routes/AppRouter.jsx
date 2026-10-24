import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";

import DashboardPage from "../pages/DashboardPage";
import ProfilePage from "../pages/ProfilePage";
import AddressesPage from "../pages/AddressesPage";
import ZonesPage from "../pages/ZonesPage";
import UsersPage from "../pages/UsersPage";

import EquipmentTypesPage from "../pages/EquipmentTypesPage";
import EquipmentPage from "../pages/EquipmentPage";
import MyEquipmentPage from "../pages/MyEquipmentPage";
import MyRequestsPage from "../pages/MyRequestsPage";

// Отдельная страница управления заявками
import RequestManagementPage from "../pages/RequestManagementPage";

import SpecializationsPage from "../pages/SpecializationsPage";
import SpecializationAssignmentPage from "../pages/SpecializationAssignmentPage";
import AssignMasterZonesPage from "../pages/AssignMasterZonesPage";

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
          {/* Общее */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Заявки клиента */}
          <Route path="/my-requests" element={<MyRequestsPage />} />

          {/* Управление заявками для ADMIN и DISPATCHER */}
          <Route
            path="/requests"
            element={<RequestManagementPage />}
          />

          {/* Локации */}
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/zones" element={<ZonesPage />} />

          {/* Пользователи */}
          <Route path="/users" element={<UsersPage />} />

          {/* Оборудование */}
          <Route
            path="/equipment/types"
            element={<EquipmentTypesPage />}
          />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/my-equipment" element={<MyEquipmentPage />} />

          {/* Специализации */}
          <Route
            path="/specializations"
            element={<SpecializationsPage />}
          />
          <Route
            path="/specializations/assign"
            element={<SpecializationAssignmentPage />}
          />

          {/* Назначение зон мастерам */}
          <Route
            path="/zones/assign"
            element={<AssignMasterZonesPage />}
          />
        </Route>

        {/* Неизвестный маршрут */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}