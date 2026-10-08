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

import ProtectedRoute from "./ProtectedRoute";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ===================================================== */}
        {/* ПУБЛИЧНЫЕ СТРАНИЦЫ                                   */}
        {/* ===================================================== */}

        <Route
          path="/"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />


        {/* ===================================================== */}
        {/* ЗАЩИЩЁННЫЕ СТРАНИЦЫ                                  */}
        {/* ===================================================== */}

        <Route element={<ProtectedRoute />}>

          {/* =================================================== */}
          {/* ОБЩЕЕ                                             */}
          {/* =================================================== */}

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />


          {/* =================================================== */}
          {/* ЛОКАЦИИ                                           */}
          {/* =================================================== */}

          <Route
            path="/addresses"
            element={<AddressesPage />}
          />

          <Route
            path="/zones"
            element={<ZonesPage />}
          />


          {/* =================================================== */}
          {/* ПОЛЬЗОВАТЕЛИ                                      */}
          {/* =================================================== */}

          <Route
            path="/users"
            element={<UsersPage />}
          />


          {/* =================================================== */}
          {/* ОБОРУДОВАНИЕ — ADMIN                              */}
          {/* =================================================== */}

          <Route
            path="/equipment/types"
            element={<EquipmentTypesPage />}
          />

          <Route
            path="/equipment"
            element={<EquipmentPage />}
          />


          {/* =================================================== */}
          {/* МОЁ ОБОРУДОВАНИЕ — CLIENT                         */}
          {/* =================================================== */}

          <Route
            path="/my-equipment"
            element={<MyEquipmentPage />}
          />

        </Route>


        {/* ===================================================== */}
        {/* НЕИЗВЕСТНЫЙ МАРШРУТ                                  */}
        {/* ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}