import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const userStr = localStorage.getItem('user');
  let role = null;

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      role = user?.role;
    } catch {
      role = null;
    }
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/" />; 
  }

  return children;
};

export default ProtectedRoute;
