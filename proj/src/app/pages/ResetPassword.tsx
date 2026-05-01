import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Валідація сили пароля
  const passwordStrength = {
    hasMinLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasLowerCase: /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Перевірка вимог
    const allRequirementsMet = Object.values(passwordStrength).every(val => val === true);
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Запит до Django
      // django-rest-passwordreset очікує 'password' та 'token'
      await axios.post('http://127.0.0.1:8000/api/password_reset/confirm/', {
        password: newPassword,
        token: token,
      });

      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      // Автоматичний редирект через 3 секунди
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      console.error('Reset confirm error:', err);
      const msg = err.response?.data?.detail || err.response?.data?.password?.[0] || 'Invalid or expired token.';
      setError(msg);
      toast.error('Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Success!</h2>
          <p className="text-gray-600 mb-6">Your password has been updated. Redirecting to login...</p>
          <Link to="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold">
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-blue-600">DormLife</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-2">New Password</h2>
          <p className="text-gray-600 mb-6 text-sm">Please enter and confirm your new password.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Strength Box */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs">
              <div className={`flex items-center gap-2 ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-3 h-3" /> 8+ characters
              </div>
              <div className={`flex items-center gap-2 ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-3 h-3" /> One uppercase
              </div>
              <div className={`flex items-center gap-2 ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                <CheckCircle className="w-3 h-3" /> One number
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}