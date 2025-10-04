import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/constants/roles';

interface ProtectedRouteProps {
  allow: Role[];
  redirectTo?: string; // default /signin
}

// Usage: <ProtectedRoute allow={['admin']} /> wraps admin routes
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allow, redirectTo = '/signin' }) => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authorized, setAuthorized] = useState<boolean>(false);

  useEffect(() => {
    // decide immediately
    if (!token || !user) {
      if (location.pathname !== redirectTo) {
        navigate(redirectTo, { replace: true, state: { from: location.pathname } });
      }
      return;
    }
    if (!allow.includes(user.role as Role)) {
      navigate('/restricted', { replace: true, state: { attempted: location.pathname } });
      return;
    }
    setAuthorized(true);
  }, [token, user, allow, navigate, redirectTo, location.pathname]);

  if (!authorized) {
    return <div className="p-6 text-center text-sm text-muted-foreground">Checking access...</div>;
  }
  return <Outlet />;
};

export function roleLanding(role?: string | null) {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'manager':
      return '/manager';
    case 'employee':
      return '/employee';
    default:
      return '/signin';
  }
}

// Optional reusable top bar with logout
export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="w-full border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="max-w-7xl mx-auto h-12 flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold">ExpenseFlow</span>
          {user && (
            <span className="text-muted-foreground">/ {user.role}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={() => {
                logout();
                navigate('/signin');
              }}
              className="text-xs rounded-md border px-3 py-1 hover:bg-accent"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
