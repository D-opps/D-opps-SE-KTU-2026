import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, User as UserIcon, UserCircle, MapPin, ArrowLeft, Building2, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';

type UserRole = 'student' | 'admin' | 'doorkeeper';

export function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    { value: 'student', label: 'Student', description: 'Access marketplace, laundry, and chat' },
    { value: 'admin', label: 'Admin', description: 'Full system access and management' },
    { value: 'doorkeeper', label: 'Doorkeeper', description: 'Building access and security' },
  ];

  const dormitories = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Функція перевірки пароля (для UI та валідації)
  const getPasswordRequirements = (pass: string) => [
    { label: 'At least 8 characters', valid: pass.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(pass) },
    { label: 'One number', valid: /[0-9]/.test(pass) },
    { label: 'One special character', valid: /[^A-Za-z0-9]/.test(pass) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.includes('@')) newErrors.email = 'Enter a valid university email';
    
    // Перевірка вимог пароля
    const requirements = getPasswordRequirements(formData.password);
    const isPasswordValid = requirements.every(req => req.valid);
    
    if (!isPasswordValid) {
      newErrors.password = 'Password is too weak';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (selectedRole === 'student' && !formData.roomNumber.trim()) {
      newErrors.roomNumber = 'Room number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register/', {
        username: formData.email, // Використовуємо email як username для Django
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: selectedRole,
        dormitory: formData.dormitory,
        room_number: formData.roomNumber,
      });

      if (response.status === 201 || response.status === 200) {
        // Зберігаємо дані в сесію (як у твоєму початковому коді)
        localStorage.setItem('userRole', selectedRole);
        localStorage.setItem('userName', formData.fullName);
        localStorage.setItem('userEmail', formData.email);
        
        alert("Registration successful!");
        // ВАРІАНТ 1: Одразу на головну (якщо сервер відразу логінить)
        // navigate('/'); 
        
        // ВАРІАНТ 2: На вхід (безпечніше для Django)
        navigate('/login');
      }
    } catch (error: any) {
      const serverErrors = error.response?.data;
      setErrors(serverErrors || {});
      alert("Registration failed: " + JSON.stringify(serverErrors || "Server error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link to="/login" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Login</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((role) => (
                <div
                  key={role.value}
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedRole === role.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className={`w-5 h-5 ${selectedRole === role.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-sm">{role.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{role.description}</p>
                </div>
              ))}
            </div>

            {/* Inputs Group */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">University Email</label>
                <input
                  name="email" type="email" value={formData.email} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Dormitory</label>
                <select
                  name="dormitory" value={formData.dormitory} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dormitories.map(d => <option key={d} value={d}>Dormitory {d}</option>)}
                </select>
              </div>
              {selectedRole === 'student' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    name="roomNumber" type="text" value={formData.roomNumber} onChange={handleChange}
                    className={`w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 ${errors.roomNumber ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
              )}
            </div>

            {/* Password Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  name="password" type="password" value={formData.password} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg mt-1 outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
            </div>

            {/* Password Indicators */}
            {formData.password && (
              <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-2">
                {getPasswordRequirements(formData.password).map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs ${req.valid ? 'text-green-600' : 'text-gray-400'}`}>
                    {req.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}