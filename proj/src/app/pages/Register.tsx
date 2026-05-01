import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { UserCircle, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner'; // Додаємо нормальні нотифікації

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
    { value: 'student', label: 'Student', description: 'Marketplace & Chat' },
    { value: 'admin', label: 'Admin', description: 'System Management' },
    { value: 'doorkeeper', label: 'Doorkeeper', description: 'Security Access' },
  ];

  const getPasswordRequirements = (pass: string) => [
    { label: '8+ characters', valid: pass.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(pass) },
    { label: 'One number', valid: /[0-9]/.test(pass) },
    { label: 'Special char', valid: /[^A-Za-z0-9]/.test(pass) },
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => {
      const newErrs = { ...prev };
      delete newErrs[name];
      return newErrs;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Required';
    if (!formData.email.includes('@')) newErrors.email = 'Invalid email';
    
    const requirements = getPasswordRequirements(formData.password);
    if (!requirements.every(req => req.valid)) newErrors.password = 'Weak password';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Mismatch';
    if (selectedRole === 'student' && !formData.roomNumber.trim()) newErrors.roomNumber = 'Required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register/', {
        username: formData.email, // Django вимагає username
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName, // snake_case для Django
        role: selectedRole,
        dormitory: formData.dormitory,
        room_number: formData.roomNumber, // snake_case для Django
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("Account created! Please sign in.");
        navigate('/login');
      }
    } catch (error: any) {
      console.error('Reg error:', error.response?.data);
      // Якщо Django повертає помилку унікальності username/email
      const serverErrors = error.response?.data;
      if (serverErrors?.username || serverErrors?.email) {
        toast.error("User with this email already exists");
      } else {
        toast.error("Registration failed. Check details.");
      }
      setErrors(serverErrors || { general: "Server error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl">
        <Link to="/login" className="flex items-center gap-2 text-gray-600 mb-6 hover:text-blue-600 transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Login</span>
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Roles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {roles.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={`p-4 border-2 rounded-xl text-left transition-all ${
                    selectedRole === role.value ? 'border-blue-600 bg-blue-50' : 'border-gray-100 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <UserCircle className={`w-5 h-5 ${selectedRole === role.value ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-semibold text-sm">{role.label}</span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500">{role.description}</p>
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input
                  name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  name="email" type="email" value={formData.email} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="name@university.edu"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Dormitory</label>
                <select
                  name="dormitory" value={formData.dormitory} onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(d => <option key={d} value={d}>Dormitory {d}</option>)}
                </select>
              </div>
              {selectedRole === 'student' && (
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700">Room Number</label>
                  <input
                    name="roomNumber" type="text" value={formData.roomNumber} onChange={handleChange}
                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.roomNumber ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="101A"
                  />
                </div>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  name="password" type="password" value={formData.password} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                <input
                  name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
            </div>

            {/* Password Validation UI */}
            {formData.password && (
              <div className="bg-gray-50 p-3 rounded-lg grid grid-cols-2 gap-x-4 gap-y-1 border border-gray-100">
                {getPasswordRequirements(formData.password).map((req, i) => (
                  <div key={i} className={`flex items-center gap-2 text-[11px] ${req.valid ? 'text-green-600' : 'text-gray-400'}`}>
                    {req.valid ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    <span>{req.label}</span>
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}