import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

// Simple password hashing function
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  useEffect(() => {
    // Validate token on mount
    const passwordResetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
    const tokenData = passwordResetTokens[token || ''];

    if (!tokenData || Date.now() > tokenData.expiry) {
      setIsValidToken(false);
    }
  }, [token]);

  useEffect(() => {
    // Update password strength indicators
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    const allRequirementsMet = Object.values(passwordStrength).every((val) => val === true);
    if (!allRequirementsMet) {
      setError('Password does not meet all requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Get token data
    const passwordResetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
    const tokenData = passwordResetTokens[token || ''];

    if (!tokenData) {
      setError('Invalid reset token.');
      return;
    }

    // Update user password
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === tokenData.email);

    if (userIndex !== -1) {
      users[userIndex].password = await hashPassword(newPassword);
      localStorage.setItem('registeredUsers', JSON.stringify(users));

      // Remove used token
      delete passwordResetTokens[token || ''];
      localStorage.setItem('passwordResetTokens', JSON.stringify(passwordResetTokens));

      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError('User not found.');
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-2xl mb-2">Invalid or Expired Link</h2>
              <p className="text-gray-600">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
            </div>
            <Link
              to="/forgot-password"
              className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl mb-2">Password Reset Successful</h2>
              <p className="text-gray-600">
                Your password has been reset successfully. Redirecting to login...
              </p>
            </div>
            <Link
              to="/login"
              className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-blue-600">DormLife</h1>
          <p className="text-gray-600">Create a new password</p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl mb-2">Reset Password</h2>
          <p className="text-gray-600 mb-6">Please enter your new password below.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-sm mb-2 text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm text-gray-700 mb-2">Password must contain:</p>
              <div className="space-y-1">
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>At least 8 characters</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>One uppercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>One lowercase letter</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>One number</span>
                </div>
                <div
                  className={`flex items-center gap-2 text-sm ${
                    passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>One special character</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm-password" className="block text-sm mb-2 text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
