import { Button } from '@/components/ui/button';
import { roleLanding } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

const Restricted = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const attempted = (location.state as any)?.attempted;

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-2xl font-bold">Access Restricted</h1>
        <p className="text-muted-foreground text-sm">
          {attempted ? (
            <>You are not allowed to view <code className="px-1 py-0.5 rounded bg-accent text-xs">{attempted}</code>.</>
          ) : (
            <>You don't have permission to view this page.</>
          )}
        </p>
        <div className="flex flex-col gap-3">
          {user && (
            <Button onClick={() => navigate(roleLanding(user.role))}>Go to my portal</Button>
          )}
          <Button variant="outline" onClick={() => navigate('/signin')}>Sign in as different user</Button>
        </div>
      </div>
    </div>
  );
};

export default Restricted;
