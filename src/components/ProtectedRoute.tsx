
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  
  // If still loading auth state, show nothing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    toast({
      title: "Authentication required",
      description: "Please log in to access this page",
      variant: "destructive"
    });
    return <Navigate to="/login" />;
  }
  
  // If authenticated, show children
  return <>{children}</>;
};

export default ProtectedRoute;