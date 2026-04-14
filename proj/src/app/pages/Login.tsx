import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useGoogleLogin } from '@react-oauth/google';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveAuthData = (access: string, refresh: string, user: any) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.full_name || 'User');
    localStorage.setItem('userRole', user.role || 'student');
  };

 const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ОСЬ ТУТ ЗМІНА: Django каже, що поле 'email' обов'язкове
    const loginData = {
      email: email.trim(),    // Змінили 'username' на 'email'
      password: password,
    };

    console.log("Sending to server:", loginData);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', loginData);

      if (response.status === 200) {
        const { access, refresh } = response.data;
        
        const profileRes = await axios.get('http://127.0.0.1:8000/api/profile/', {
          headers: { Authorization: `Bearer ${access}` }
        });

        const realUser = {
          email: profileRes.data.profile.email,
          full_name: profileRes.data.profile.first_name,
          role: profileRes.data.profile.role
        };

        saveAuthData(access, refresh, realUser);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (error: any) {
      console.error("FULL ERROR DATA:", error.response?.data);
      setError('Invalid email or password');
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const response = await axios.post('http://127.0.0.1:8000/api/auth/google/', {
          token: tokenResponse.access_token,
        });
        const { access, refresh, user } = response.data;
        saveAuthData(access, refresh, user);
        toast.success(`Logged in as ${user.full_name}`);
        navigate('/');
      } catch (err) {
        toast.error('Failed to login with Google');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-blue-600">DormLife</h1>
          <p className="text-gray-600">Welcome back to your dorm community</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl font-semibold mb-6">Sign In</h2>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <button onClick={() => handleGoogleSignIn()} type="button" className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all">
             <span className="font-medium text-gray-700">Sign in with Google</span>
          </button>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account? <Link to="/register" className="text-blue-600 font-bold hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}