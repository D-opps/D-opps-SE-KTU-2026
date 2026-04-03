import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, User as UserIcon, UserCircle, MapPin, ArrowLeft, Building2, Check, X } from 'lucide-react';

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

export function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dormitory: '1',
    roomNumber: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const dormitories = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('One number');
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      errors.push('One special character');
    }

    return { valid: errors.length === 0, errors };
  };

  const checkEmailExists = (email: string): boolean => {
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    return users.some((user: any) => user.email === email);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    } else if (checkEmailExists(formData.email)) {
      newErrors.email = 'An account with this email already exists';
    }

    const passwordValidation = validatePassword(formData.password);
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!passwordValidation.valid) {
      newErrors.password = 'Password does not meet requirements';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.dormitory) {
      newErrors.dormitory = 'Please select a dormitory';
    }

    if (selectedRole === 'student' && !formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required for students';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Hash the password
    const hashedPassword = await hashPassword(formData.password);

    // Store user data in localStorage
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const newUser = {
      fullName: formData.fullName,
      email: formData.email,
      password: hashedPassword,
      role: selectedRole,
      dormitory: formData.dormitory,
      roomNumber: formData.roomNumber,
      photo: '',
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    localStorage.setItem('registeredUsers', JSON.stringify(users));

    // Set current user session
    localStorage.setItem('userRole', selectedRole);
    localStorage.setItem('userName', formData.fullName);
    localStorage.setItem('userEmail', formData.email);
    localStorage.setItem('userDormitory', formData.dormitory);
    if (formData.roomNumber) {
      localStorage.setItem('userRoom', formData.roomNumber);
    }

    // Navigate to dashboard
    navigate('/');
  };

  const passwordValidation = validatePassword(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to Login */}
        <Link
          to="/login"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </Link>

        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2 text-blue-600">DormLife</h1>
          <p className="text-gray-600">Join your dorm community</p>
        </div>

        {/* Registration Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <h2 className="text-2xl mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm mb-3 text-gray-700">
                Select Your Role
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
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
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 mb-2">
                      <UserCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{role.label}</span>
                    </div>
                    <p className="text-xs text-gray-600">{role.description}</p>
                  </label>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm mb-2 text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.fullName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm mb-2 text-gray-700">
                University Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="student@university.edu"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Dormitory Selection */}
            <div>
              <label htmlFor="dormitory" className="block text-sm mb-2 text-gray-700">
                Dormitory
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="dormitory"
                  name="dormitory"
                  value={formData.dormitory}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                    errors.dormitory ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {dormitories.map((dorm) => (
                    <option key={dorm} value={dorm}>
                      Dormitory {dorm}
                    </option>
                  ))}
                </select>
              </div>
              {errors.dormitory && (
                <p className="text-red-500 text-sm mt-1">{errors.dormitory}</p>
              )}
            </div>

            {/* Room Number (conditional for students) */}
            {selectedRole === 'student' && (
              <div>
                <label htmlFor="roomNumber" className="block text-sm mb-2 text-gray-700">
                  Room Number
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="roomNumber"
                    name="roomNumber"
                    type="text"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    placeholder="e.g., 305"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.roomNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.roomNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.roomNumber}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm mb-2 text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    {[
                      { label: 'At least 8 characters', valid: formData.password.length >= 8 },
                      { label: 'One uppercase letter', valid: /[A-Z]/.test(formData.password) },
                      { label: 'One lowercase letter', valid: /[a-z]/.test(formData.password) },
                      { label: 'One number', valid: /[0-9]/.test(formData.password) },
                      { label: 'One special character', valid: /[^A-Za-z0-9]/.test(formData.password) },
                    ].map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        {req.valid ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={req.valid ? 'text-green-600' : 'text-gray-600'}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm mb-2 text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}