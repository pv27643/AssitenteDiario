import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/modules/dashboard/routes";
import Layout from "@/shared/components/Layout";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import { modules } from "@/modules.config";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registo" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          {modules.map((module) => (
            <Route key={module.id} path={module.path.slice(1)} element={<module.element />} />
          ))}
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
