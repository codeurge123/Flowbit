import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../context/useApp";

export function ProtectedRoute() {
  const { user, booting } = useApp();
  const location = useLocation();

  if (booting) return <main className="loading-screen">Loading Flowbit...</main>;
  if (!user) return <Navigate to="/signin" replace state={{ from: location }} />;

  return <Outlet />;
}
