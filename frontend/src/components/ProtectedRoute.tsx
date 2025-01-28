import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Если нет токена или роль не соответствует, перенаправляем на главную
  if (!token || !allowedRoles.includes(role || '')) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
