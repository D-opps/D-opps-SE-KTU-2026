import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { api } from '../utils/supabaseClient';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const result = await api.verifyEmail(token!);
      if (result.success) {
        setStatus('success');
        setMessage(result.message || 'Email verified successfully!');
      } else {
        setStatus('error');
        setMessage(result.error || 'Verification failed');
        if (emailParam) {
          setEmail(emailParam);
        }
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage('An error occurred during verification');
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;

    setResending(true);
    try {
      const result = await api.resendVerification(email);
      if (result.success) {
        setMessage('Verification email sent! Please check your inbox.');
      } else {
        setMessage(result.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Resend error:', error);
      setMessage('Failed to resend verification email');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-blue-600">DormLife</h1>
          <p className="text-gray-600">Email Verification</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying...</h2>
              <p className="text-gray-600">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-600 mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
                <ArrowRight className="w-5 h-5" />
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-gray-600 mb-6">{message}</p>

              {email && (
                <div className="mb-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {resending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-5 h-5" />
                        Resend Verification Email
                      </>
                    )}
                  </button>
                </div>
              )}

              <Link
                to="/login"
                className="text-sm text-blue-600 hover:underline"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
