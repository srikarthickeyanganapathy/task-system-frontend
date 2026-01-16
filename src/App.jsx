import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

const Loader = () => <div className="h-screen bg-[#0F1117] flex items-center justify-center text-violet-500">Loading...</div>;

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? children : <Navigate to="/login" />;
};

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}