import { Navigate } from "react-router-dom";
import { useAppSelector } from "../hooks/useRedux";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);

  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== "admin")
    return <Navigate to="/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
