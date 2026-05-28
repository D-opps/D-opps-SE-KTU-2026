import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');
  
  const BASE_URL = 'http://172.20.10.3:8000'; 

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Invalid verification link (token missing)');
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/verify-email/`, {
        params: { token: token }
      });

      setStatus('success');
      setMessage(res.data.message || 'Email verified successfully!');
      toast.success("Account activated!");
    } catch (error: any) {
      console.error('Verification error:', error);
      setStatus('error');
      setMessage(error.response?.data?.error || 'Verification failed or link expired');
    }
  };

  const handleResendVerification = async () => {
    if (!emailParam) return;

    setResending(true);
    try {
      await axios.post(`${BASE_URL}/api/resend-verification/`, {
        email: emailParam
      });
      toast.success("Verification email sent!");
      setMessage('A new verification email has been sent to your inbox.');
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-blue-600">DormLife</h1>
          <p className="text-gray-600 font-bold uppercase text-xs tracking-widest mt-2">Email Verification</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 text-center border border-white">
          {status === 'loading' && (
            <div className="py-10">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto mb-4 animate-spin" />
              <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase">Verifying...</h2>
              <p className="text-gray-500">Please wait while we check your credentials.</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase">Success!</h2>
              <p className="text-gray-600 mb-8">{message}</p>
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200"
              >
                SIGN IN
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase">Failed</h2>
              <p className="text-gray-600 mb-8">{message}</p>

              {emailParam && (
                <button
                  onClick={handleResendVerification}
                  disabled={resending}
                  className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2 mb-4"
                >
                  {resending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mail className="w-5 h-5" />}
                  RESEND EMAIL
                </button>
              )}

              <Link
                to="/login"
                className="text-xs font-black text-blue-600 hover:underline uppercase tracking-widest"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}