import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; 
import { UserCircle, ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

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
    
    // Якщо користувач почав змінювати поле, знімаємо з нього червоне підсвічування помилки
    if (errors[name] || (name === 'email' && errors['username'])) {
      setErrors((prev) => {
        const newErrs = { ...prev };
        delete newErrs[name];
        delete newErrs['username']; // Також чистимо помилку юзернейму, бо вони пов'язані
        return newErrs;
      });
    }
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
        username: formData.email, 
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        role: selectedRole,
        dormitory: formData.dormitory,
        room_number: formData.roomNumber,
      });

      if (response.status === 201 || response.status === 200) {
        toast.success("Account created! Please sign in.");
        navigate('/login');
      }
    } catch (error: any) {
      console.log('--- DJANGO ERROR BODY ---', JSON.stringify(error.response?.data, null, 2));
      
      const serverErrors = error.response?.data;
      const clientErrors: Record<string, string> = {};

      if (serverErrors) {
        // 1. Пряма перевірка твого кастомного ключа "error" від Django
        if (serverErrors.error && typeof serverErrors.error === 'string') {
          const rawError = serverErrors.error;
          
          // Якщо там написано про UNIQUE constraint для email
          if (rawError.includes('api_user.email') || rawError.includes('UNIQUE constraint')) {
            toast.error("User with this email already exists!");
            clientErrors.email = "This email is already taken";
          } else {
            toast.error(rawError);
          }
        } else {
          // 2. Стандартний сканер на випадок, якщо прилетять інші помилки (наприклад, по паролю)
          Object.entries(serverErrors).forEach(([key, value]) => {
            const rawMessage = Array.isArray(value) ? value[0] : value;
            const msgString = String(rawMessage);
            const targetKey = key === 'username' ? 'email' : key;
            clientErrors[targetKey] = msgString;
          });
          
          toast.error("Registration failed. Check details.");
        }
        
        setErrors(clientErrors);
      } else {
        toast.error("Server connection lost. Try again later.");
        setErrors({ general: "Server error" });
      }
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
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  {errors.fullName && <span className="text-xs text-red-500 font-medium">{errors.fullName}</span>}
                </div>
                <input
                  name="fullName" type="text" value={formData.fullName} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500 bg-red-50/30' : 'border-gray-300'}`}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  {errors.email && <span className="text-xs text-red-500 font-medium">{errors.email}</span>}
                </div>
                <input
                  name="email" type="email" value={formData.email} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-300'}`}
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
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Room Number</label>
                    {errors.roomNumber && <span className="text-xs text-red-500 font-medium">{errors.roomNumber}</span>}
                  </div>
                  <input
                    name="roomNumber" type="text" value={formData.roomNumber} onChange={handleChange}
                    className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.roomNumber ? 'border-red-500 bg-red-50/30' : 'border-gray-300'}`}
                    placeholder="101A"
                  />
                </div>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  {errors.password && <span className="text-xs text-red-500 font-medium">{errors.password}</span>}
                </div>
                <input
                  name="password" type="password" value={formData.password} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500 bg-red-50/30' : 'border-gray-300'}`}
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                  {errors.confirmPassword && <span className="text-xs text-red-500 font-medium">{errors.confirmPassword}</span>}
                </div>
                <input
                  name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                  className={`w-full p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500 bg-red-50/30' : 'border-gray-300'}`}
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