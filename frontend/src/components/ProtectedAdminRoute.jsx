import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext.jsx";

export default function ProtectedAdminRoute({ children }){
  const { currentUser } = useAuthContext();
  if (!currentUser || currentUser.role !== 'admin') return <Navigate to="/" />;
  return children;
}
