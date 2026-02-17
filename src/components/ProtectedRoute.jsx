import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES } from "../utils/constants";

const ProtectedRoute = ({ children, requiredRole = null, allowedRoles = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Normalize role for comparison (handle underscore/hyphen variations)
  const normalizeRole = (role) => {
    if (!role) return role;
    return role.replace(/_/g, "-");
  };

  const userRoleNormalized = normalizeRole(user.role);

  // Check role access
  if (allowedRoles && Array.isArray(allowedRoles)) {
    // Multiple roles allowed - normalize all roles for comparison
    const normalizedAllowedRoles = allowedRoles.map(normalizeRole);
    if (!normalizedAllowedRoles.includes(userRoleNormalized)) {
      return <Navigate to="/dashboard" replace />;
    }
  } else if (requiredRole) {
    // For ADMIN role, also allow OWNER (owner has admin privileges)
    if (requiredRole === USER_ROLES.ADMIN) {
      const normalizedAdmin = normalizeRole(USER_ROLES.ADMIN);
      const normalizedOwner = normalizeRole(USER_ROLES.OWNER);
      if (userRoleNormalized !== normalizedAdmin && userRoleNormalized !== normalizedOwner) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      // For other roles, check exact match (normalized)
      const normalizedRequired = normalizeRole(requiredRole);
      if (userRoleNormalized !== normalizedRequired) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
