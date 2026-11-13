import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import ClientDashboard from "./pages/client/ClientDashboard";
import AgentDashboard from "./pages/agent/AgentDashboard";

function RoleRedirect() {
  const { user, role, loading } = useAuth();
  if (loading) return <p className="p-8">Chargement...</p>;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${role}`} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route
            path="/client"
            element={
              <ProtectedRoute allowedRoles={["client"]}>
                <ClientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
                  path="/agent"
                  element={
                    <ProtectedRoute allowedRoles={["agent"]}>
                      <AgentDashboard />
                    </ProtectedRoute>
                  }
                />
        <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}