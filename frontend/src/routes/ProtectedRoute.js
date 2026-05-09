import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProtectedRoute.scss';

const ProtectedRoute = ({ element: Element, allowedRoles, ...rest }) => {
  const { user, isAuthenticated, isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center protected-route-loader">
        <img
          src="/connectin-logo.png"
          alt="ConnectIn Logo"
          className="pulsing-logo"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <Element {...rest} />;
};

export default ProtectedRoute;
