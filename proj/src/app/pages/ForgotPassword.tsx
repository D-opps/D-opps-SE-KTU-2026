import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Check if user exists
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      setError('No account found with this email address.');
      return;
    }

    // Generate a reset token (in real app, this would be done by backend)
    const resetToken = Math.random().toString(36).substring(2, 15);
    const resetExpiry = Date.now() + 3600000; // 1 hour from now

    // Store reset token in localStorage (in real app, this would be stored in database)
    const passwordResetTokens = JSON.parse(localStorage.getItem('passwordResetTokens') || '{}');
    passwordResetTokens[resetToken] = {
      email,
      expiry: resetExpiry,
    };
    localStorage.setItem('passwordResetTokens', JSON.stringify(passwordResetTokens));

    // In a real application, an email would be sent here
    // For now, we'll show the reset link in the UI
    console.log(`Password reset link: /reset-password/${resetToken}`);

    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl mb-2">Check Your Email</h2>
              <p className="text-gray-600">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Demo Mode:</strong> In a production environment, you would receive an email with a reset link. For this demo, the reset link has been logged to the console.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Link
                to="/login"
                className="block w-full text-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Login
              </Link>
            </div>
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
          <p className="text-gray-600">Reset your password</p>
        </div>

        {/* Forgot Password Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <Link
            to="/login"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </Link>

          <h2 className="text-2xl mb-2">Forgot Password?</h2>
          <p className="text-gray-600 mb-6">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Reset Link
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
