import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Building2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in both username and password.');
      return;
    }
    
    setIsLoading(true);
    setError('');

    const res = await adminLogin(username.trim(), password.trim(), remember);
    
    setIsLoading(false);
    if (res.success) {
      navigate('/admin/dashboard', { replace: true });
    } else {
      setError(res.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="dark min-h-screen bg-slate-950 flex items-center justify-center px-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {/* Logo / Brand */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-600/30 animate-pulse">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Nestora<span className="text-blue-400">Hub</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Business Operating Console</p>
          </div>

          {/* Security badge */}
          <div className="flex items-start gap-2 bg-slate-850 rounded-lg px-3 py-2.5 mb-6 border border-slate-800/80">
            <ShieldCheck className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-300 text-xs leading-normal">
              Secure authentication layer. Future ready for Supabase Auth migration.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold">Username</Label>
              <Input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="superadmin"
                className="!bg-slate-950 border-slate-700/80 !text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 py-5 rounded-lg"
                disabled={isLoading}
                autoFocus
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-xs font-semibold">Password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="••••••••"
                className="!bg-slate-950 border-slate-700/80 !text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 py-5 rounded-lg"
                disabled={isLoading}
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-600 focus:ring-blue-500 bg-slate-800"
              />
              <label htmlFor="remember" className="text-xs text-slate-400 cursor-pointer select-none">
                Remember session on this device
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 text-red-400 bg-red-950/20 border border-red-900/50 rounded-lg p-3 text-xs leading-normal">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl py-6 font-semibold mt-2 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </span>
              ) : (
                'Login to Console'
              )}
            </Button>
          </form>

          {/* Hint */}
          <div className="bg-slate-850/40 p-3 rounded-lg border border-slate-800/40 text-center text-slate-600 text-xs mt-5 leading-normal">
            Demo Login:<br />
            Username: <span className="text-slate-400 font-mono">superadmin</span> &nbsp;
            Password: <span className="text-slate-400 font-mono">admin123</span>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-4">
          <a href="/" className="text-slate-500 hover:text-slate-300 text-xs transition-colors">
            ← Back to public website
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
