import { Mail, MapPin, Package, X, Building2, Camera, Check } from 'lucide-react';
import { marketplaceItems } from '../data/mockData';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';

// Simple password hashing function
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState({
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    room: 'Room 305',
    dormitory: '1',
    initials: 'AJ',
    role: 'student',
    photo: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    room: '',
    dormitory: '1',
    photo: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const dormitories = ['1', '2', '3', '4', '5', '6', '7', '8'];

  // Predefined avatar options
  const avatarOptions = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
  ];

  useEffect(() => {
    // Get user data from localStorage
    const name = localStorage.getItem('userName') || 'Alex Johnson';
    const email = localStorage.getItem('userEmail') || 'alex.johnson@university.edu';
    const room = localStorage.getItem('userRoom') || 'Room 305';
    const dormitory = localStorage.getItem('userDormitory') || '1';
    const role = localStorage.getItem('userRole') || 'student';
    const photo = localStorage.getItem('userPhoto') || '';
    
    // Generate initials from name
    const initials = name
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    setUser({
      name,
      email,
      room,
      dormitory,
      initials,
      role,
      photo,
    });
  }, []);

  const openEditModal = () => {
    setEditForm({
      name: user.name,
      email: user.email,
      room: user.room,
      dormitory: user.dormitory,
      photo: user.photo,
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setEditErrors({});
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
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

  const validateEditForm = async () => {
    const newErrors: Record<string, string> = {};

    if (!editForm.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!editForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!editForm.email.includes('@')) {
      newErrors.email = 'Please enter a valid email';
    }

    if (user.role === 'student' && !editForm.room.trim()) {
      newErrors.room = 'Room number is required';
    }

    // Password validation (only if user is trying to change password)
    if (editForm.newPassword || editForm.confirmNewPassword) {
      if (!editForm.currentPassword) {
        newErrors.currentPassword = 'Current password is required to change password';
      } else {
        // Verify current password
        const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
        const hashedCurrentPassword = await hashPassword(editForm.currentPassword);
        const currentUser = users.find((u: any) => u.email === user.email);
        
        if (!currentUser || currentUser.password !== hashedCurrentPassword) {
          newErrors.currentPassword = 'Current password is incorrect';
        }
      }

      const passwordValidation = validatePassword(editForm.newPassword);
      if (!passwordValidation.valid) {
        newErrors.newPassword = 'Password does not meet requirements';
      }
      if (editForm.newPassword !== editForm.confirmNewPassword) {
        newErrors.confirmNewPassword = 'Passwords do not match';
      }
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!(await validateEditForm())) {
      return;
    }

    // Update in registeredUsers
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const userIndex = users.findIndex((u: any) => u.email === user.email);
    
    if (userIndex !== -1) {
      users[userIndex].fullName = editForm.name;
      users[userIndex].email = editForm.email;
      users[userIndex].dormitory = editForm.dormitory;
      users[userIndex].roomNumber = editForm.room;
      users[userIndex].photo = editForm.photo;
      
      // Update password if changed
      if (editForm.newPassword) {
        users[userIndex].password = await hashPassword(editForm.newPassword);
      }
      
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    }

    // Update current session localStorage
    localStorage.setItem('userName', editForm.name);
    localStorage.setItem('userEmail', editForm.email);
    localStorage.setItem('userDormitory', editForm.dormitory);
    localStorage.setItem('userPhoto', editForm.photo);
    if (user.role === 'student') {
      localStorage.setItem('userRoom', editForm.room);
    }

    // Update state
    const initials = editForm.name
      .split(' ')
      .map((n) => n.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    setUser({
      ...user,
      name: editForm.name,
      email: editForm.email,
      room: editForm.room,
      dormitory: editForm.dormitory,
      photo: editForm.photo,
      initials,
    });

    setIsEditModalOpen(false);
  };

  // Items posted by the current user
  const userItems = marketplaceItems.filter(
    (item) => item.seller === user.name
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and listings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl mb-4">
                {user.initials}
              </div>
              <h2 className="text-2xl mb-1">{user.name}</h2>
              <p className="text-gray-600 capitalize">{user.role}</p>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5" />
                <span className="text-sm break-all">{user.email}</span>
              </div>
              {user.role === 'student' && user.room && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5" />
                  <span className="text-sm">{user.room}</span>
                </div>
              )}
            </div>

            {/* Edit Profile Button */}
            <button
              onClick={openEditModal}
              className="w-full mt-6 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Items Listed</div>
              <div className="text-2xl text-blue-600">{userItems.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Views</div>
              <div className="text-2xl text-blue-600">127</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Messages</div>
              <div className="text-2xl text-blue-600">8</div>
            </div>
          </div>

          {/* Listed Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl">Your Listings</h2>
            </div>

            {userItems.length > 0 ? (
              <div className="space-y-4">
                {userItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg">{item.name}</h3>
                        <span className="text-lg text-blue-600">${item.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>You haven't listed any items yet.</p>
                <button
                  onClick={() => {
                    navigate('/marketplace');
                    setTimeout(() => {
                      const addButton = document.querySelector('[data-add-product]') as HTMLButtonElement;
                      addButton?.click();
                    }, 100);
                  }}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Edit Profile</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="edit-name" className="block text-sm mb-2 text-gray-700">
                  Full Name
                </label>
                <input
                  id="edit-name"
                  name="name"
                  type="text"
                  value={editForm.name}
                  onChange={handleEditChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="edit-email" className="block text-sm mb-2 text-gray-700">
                  Email
                </label>
                <input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.email && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.email}</p>
                )}
              </div>

              {/* Room Number (only for students) */}
              {user.role === 'student' && (
                <div>
                  <label htmlFor="edit-room" className="block text-sm mb-2 text-gray-700">
                    Room Number
                  </label>
                  <input
                    id="edit-room"
                    name="room"
                    type="text"
                    value={editForm.room}
                    onChange={handleEditChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editErrors.room ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.room && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.room}</p>
                  )}
                </div>
              )}

              {/* Dormitory (only for students) */}
              {user.role === 'student' && (
                <div>
                  <label htmlFor="edit-dormitory" className="block text-sm mb-2 text-gray-700">
                    Dormitory
                  </label>
                  <select
                    id="edit-dormitory"
                    name="dormitory"
                    value={editForm.dormitory}
                    onChange={handleEditChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editErrors.dormitory ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    {dormitories.map(dorm => (
                      <option key={dorm} value={dorm}>
                        Dormitory {dorm}
                      </option>
                    ))}
                  </select>
                  {editErrors.dormitory && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.dormitory}</p>
                  )}
                </div>
              )}

              {/* Photo */}
              <div>
                <label htmlFor="edit-photo" className="block text-sm mb-2 text-gray-700">
                  Photo
                </label>
                <div className="relative">
                  <input
                    id="edit-photo"
                    name="photo"
                    type="text"
                    value={editForm.photo}
                    onChange={handleEditChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      editErrors.photo ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {editErrors.photo && (
                    <p className="text-red-500 text-sm mt-1">{editErrors.photo}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setEditForm((prev) => ({ ...prev, photo: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {editForm.photo && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 mb-2">Choose an avatar:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {avatarOptions.map((avatar, index) => (
                        <div key={index} className="relative">
                          <img
                            src={avatar}
                            alt={`Avatar ${index + 1}`}
                            className="w-10 h-10 rounded-full cursor-pointer"
                            onClick={() => setEditForm((prev) => ({ ...prev, photo: avatar }))}
                          />
                          {editForm.photo === avatar && (
                            <Check className="absolute top-0 right-0 w-4 h-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-4">Change Password (Optional)</p>
              </div>

              {/* Current Password */}
              <div>
                <label htmlFor="edit-current-password" className="block text-sm mb-2 text-gray-700">
                  Current Password
                </label>
                <input
                  id="edit-current-password"
                  name="currentPassword"
                  type="password"
                  value={editForm.currentPassword}
                  onChange={handleEditChange}
                  placeholder="Enter current password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="edit-new-password" className="block text-sm mb-2 text-gray-700">
                  New Password
                </label>
                <input
                  id="edit-new-password"
                  name="newPassword"
                  type="password"
                  value={editForm.newPassword}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="edit-confirm-password" className="block text-sm mb-2 text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="edit-confirm-password"
                  name="confirmNewPassword"
                  type="password"
                  value={editForm.confirmNewPassword}
                  onChange={handleEditChange}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    editErrors.confirmNewPassword ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {editErrors.confirmNewPassword && (
                  <p className="text-red-500 text-sm mt-1">{editErrors.confirmNewPassword}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}