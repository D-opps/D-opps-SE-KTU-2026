import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, UserCircle } from 'lucide-react';

type UserRole = 'student' | 'admin' | 'doorkeeper';

// Simple password hashing function
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [error, setError] = useState('');

  const roles: { value: UserRole; label: string; description: string }[] = [
    {
      value: 'student',
      label: 'Student',
      description: 'Access marketplace, laundry, and chat',
    },
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full system access and management',
    },
    {
      value: 'doorkeeper',
      label: 'Doorkeeper',
      description: 'Building access and security',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Get registered users
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Hash the entered password
    const hashedPassword = await hashPassword(password);
    
    // Find user with matching email and password
    const user = users.find(
      (u: any) => u.email === email && u.password === hashedPassword && u.role === selectedRole
    );

    if (!user) {
      setError('Invalid email, password, or role. Please try again.');
      return;
    }

    // Store user role and info in localStorage
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.fullName);
    localStorage.setItem('userEmail', user.email);
    localStorage.setItem('userDormitory', user.dormitory);
    if (user.roomNumber) {
      localStorage.setItem('userRoom', user.roomNumber);
    }
    if (user.photo) {
      localStorage.setItem('userPhoto', user.photo);
    }

    // Navigate to dashboard
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-blue-600">DormLife</h1>
          <p className="text-gray-600">Welcome back to your dorm community</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl mb-6">Sign In</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selection */}
            <div>
              <label className="block text-sm mb-3 text-gray-700">
                Select Your Role
              </label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedRole === role.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <UserCircle className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">{role.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

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

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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
              Sign In as {roles.find((r) => r.value === selectedRole)?.label}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}