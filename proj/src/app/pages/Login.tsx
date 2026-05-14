import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { Mail, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useUser } from './UserContext';
import { useGoogleLogin } from '@react-oauth/google';

export function Login() {
  const navigate = useNavigate();
  const { updateRole } = useUser(); // Отримуємо функцію оновлення
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const saveAuthData = (access: string, refresh: string, user: any) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('userId', user.id); 
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userName', user.full_name || 'User');
    updateRole(user.role || 'student'); // Використовуємо контекст замість простого localStorage
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/token/', {
        email: email,
        password: password,
      });

      if (response.status === 200) {
        const { access, refresh } = response.data;
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);

        // Отримуємо дані про юзера
        try {
          const userResponse = await axios.get('http://127.0.0.1:8000/api/users/me/', {
            headers: { 'Authorization': `Bearer ${access}` }
          });
          
          const userData = userResponse.data;
          localStorage.setItem('userId', userData.id); 
          localStorage.setItem('userName', userData.full_name || email.split('@')[0]);
          
          // ЦЕ КЛЮЧОВИЙ МОМЕНТ:
          updateRole(userData.role || 'student'); 
          
        } catch (userErr) {
          console.error("Profile fetch failed");
          updateRole('student'); // фолбек
        }

        toast.success('Welcome back!');
        navigate('/'); 
      }
    } catch (error: any) {
      setError('Invalid email or password.');
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
        toast.success('Welcome back!');
        navigate('/');
      } catch (err: any) {
        // ЦЕ ТЕ, ЩО ТРЕБА ДОДАТИ ЗАРАЗ:
        if (err.response && err.response.status === 403) {
          toast.error('Account not found. Please register manually first!');
          setError('User not registered. Go to Register page.');
        } else {
          toast.error('Google Login Failed');
        }
      } finally {
        setLoading(false);
      }
    },
  });
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-blue-600 text-center mb-8">DormLife</h1>
        <h2 className="text-xl font-semibold mb-6">Sign In</h2>
        
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Email or Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="text-right">
            <Link to="/forgot-password" size-sm="true" className="text-sm text-blue-600 hover:underline">Forgot password?</Link>
          </div>
          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all">
            {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <button onClick={() => handleGoogleSignIn()} className="w-full py-3 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-all">
            <img src="https://www.svgrepo.com/show/355037/google.svg" className="w-5 h-5" alt="G" />
            <span>Continue with Google</span>
          </button>
        </div>

        <p className="text-center mt-6 text-sm text-gray-600">
          Don't have an account? <Link to="/register" className="text-blue-600 font-bold">Register</Link>
        </p>
      </div>
    </div>
  );
}