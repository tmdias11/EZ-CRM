
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="screen-loader">
        Загрузка CRM...
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (adminOnly && user.role !== 'admin') {
    return (
      <Navigate
        to="/403"
        replace
      />
    );
  }

  return children;
}


export default ProtectedRoute;
