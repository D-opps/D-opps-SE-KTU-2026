import { useState } from 'react';
import { Link } from 'react-router-dom'; // Тільки react-router
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Переконайся, що в Django urls.py цей шлях саме такий
      await axios.post('http://127.0.0.1:8000/api/password_reset/', 
  { email: email },
  {
    headers: {
      'Accept-Language': 'en', // Це підкаже Django відправляти лист англійською
    }
  }
);

      setIsSubmitted(true);
      toast.success('Reset instructions sent to your email');
    } catch (err: any) {
      console.error('Reset error:', err);
      // Django зазвичай повертає помилку в полі detail або email
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Email not found.';
      setError(msg);
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
          <p className="text-gray-600 mb-6">Sent to <strong>{email}</strong></p>
          <Link to="/login" className="block w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <Link to="/login" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6">
            <ArrowLeft className="w-4 h-4" /> <span>Back to login</span>
          </Link>
          <h2 className="text-2xl font-bold mb-6">Forgot Password?</h2>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="University Email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50">
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}