
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().min(1, { message: 'Please enter your email address or admin username' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // If already authenticated, redirect to home
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    const rawInput = data.email.trim();
    // Detect if user is attempting to log into admin console with admin username
    if (!rawInput.includes('@') || rawInput.toLowerCase() === 'superadmin' || rawInput.toLowerCase() === 'admin') {
      toast({
        title: "Redirecting to Admin Portal",
        description: "Admin & staff accounts log in via the NestoraHub Admin Console.",
      });
      navigate('/admin/login', { replace: true });
      return;
    }
    await login(rawInput, data.password);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="py-6 px-6 md:px-12 max-w-7xl mx-auto w-full">
        <Link to="/">
          <Button variant="ghost" className="pl-0 hover:bg-Nestora-blue/10 hover:text-Nestora-blue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <div className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-6 bg-white p-8 rounded-xl shadow-subtle border border-slate-100">
          {/* Admin Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left flex items-center justify-between shadow-md">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                Staff & Admin Portal
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Managing listings, CMS & operations?</p>
            </div>
            <Link to="/admin/login">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-3.5 h-8 gap-1">
                Admin Login →
              </Button>
            </Link>
          </div>

          <div className="text-center pt-2">
            <h2 className="text-3xl font-bold text-Nestora-dark">Welcome Back</h2>
            <p className="text-gray-600 mt-2 text-sm">Sign in to access your saved properties and wishlist</p>
          </div>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address or Admin Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="user@nestora.in or superadmin" 
                        type="text" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="Enter your password" 
                          type={showPassword ? "text" : "password"} 
                          {...field} 
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-Nestora-blue hover:bg-Nestora-blue/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>
          
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link to="/register" className="text-Nestora-blue hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;