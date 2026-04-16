import { Mail, MapPin, Package, X, Building2, Camera, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Дані користувача з сервера
  const [profileData, setProfileData] = useState<any>(null);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стан модалки та форми
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    room: '',
    dormitory: '',
  });

  const dormitories = ['1', '2', '3', '4', '5', '6', '7', '8'];

 const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Отримуємо дані профілю
      const profileRes = await axios.get('http://127.0.0.1:8000/api/profile/', { headers });
      
      // Дані юзера зазвичай лежать в profileRes.data.profile (перевір структуру в консолі)
      const userData = profileRes.data.profile || profileRes.data; 
      
      // Додаємо повний шлях до фото, якщо бекенд шле відносний (/media/...)
      if (userData.photo && !userData.photo.startsWith('http')) {
        userData.photo = `http://127.0.0.1:8000${userData.photo}`;
      }
      
      setProfileData(userData);

      // ОНОВЛЮЄМО localStorage, щоб ім'я в хедері змінилося відразу після редагування
      localStorage.setItem('userName', userData.first_name || 'User');
      localStorage.setItem('userDormitory', userData.dormitory || '');
      localStorage.setItem('userRoom', userData.room_number || '');

      // 2. Отримуємо товари (Тут важливо фільтрувати правильно)
      if (profileRes.data.products) {
        setMyProducts(profileRes.data.products);
      } else {
        const productsRes = await axios.get('http://127.0.0.1:8000/api/products/', { headers });
        
        // Фільтруємо за ID або Email (дивлячись що повертає поле 'seller')
        const myItems = productsRes.data.filter((item: any) => 
          item.seller === userData.id || 
          item.seller === userData.email ||
          item.seller_email === userData.email // додано про всяк випадок
        );
        setMyProducts(myItems);
      }

      // 3. Синхронізуємо форму редагування
      setEditForm({
        name: userData.first_name || '',
        room: userData.room_number || '',
        dormitory: userData.dormitory?.toString() || '',
      });

    } catch (err: any) {
      console.error("Error fetching data:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate('/login');
      } else {
        toast.error("Failed to load profile data");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  // 2. Збереження змін
  // src/pages/Profile.tsx

const handleSaveProfile = async (e: React.FormEvent) => {
  e.preventDefault();
  setUpdating(true);
  
  const token = localStorage.getItem('accessToken');
  const formData = new FormData();
  
  // Надсилаємо поля, які очікує UserSerializer
  formData.append('first_name', editForm.name);
  formData.append('room_number', editForm.room);
  
  // Важливо: переконайся, що dormitory — це число або валідна строка
  if (editForm.dormitory) {
    formData.append('dormitory', editForm.dormitory);
  }
  
  if (fileInputRef.current?.files?.[0]) {
    formData.append('photo', fileInputRef.current.files[0]);
  }

  try {
    const response = await axios.patch('http://127.0.0.1:8000/api/profile/', formData, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    toast.success("Profile updated successfully!");
    
    // Оновлюємо дані в стейті та localStorage, щоб зміни з'явилися всюди відразу
    const updatedUser = response.data.profile;
    setProfileData(updatedUser);
    localStorage.setItem('userName', updatedUser.first_name);
    localStorage.setItem('userDormitory', updatedUser.dormitory);
    localStorage.setItem('userRoom', updatedUser.room_number);

    setIsEditModalOpen(false);
  } catch (err: any) {
    console.error("Update error:", err.response?.data);
    toast.error("Failed to update: " + JSON.stringify(err.response?.data));
  } finally {
    setUpdating(false);
  }
};
  if (loading) return <div className="flex justify-center p-20 text-blue-600"><Loader2 className="animate-spin w-10 h-10" /></div>;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your dormitory life and marketplace activity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative mb-6">
              <img 
                src={profileData.photo ? `http://127.0.0.1:8000${profileData.photo}` : `https://ui-avatars.com/api/?name=${profileData.first_name}&background=0D8ABC&color=fff`}
                className="w-32 h-32 rounded-3xl object-cover shadow-inner bg-gray-50 border-4 border-white"
                alt="Profile"
              />
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-4 border-white shadow-sm" title="Online"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profileData.first_name}</h2>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase tracking-wider mb-6">
              {profileData.role}
            </span>

            <div className="w-full space-y-4 border-t pt-6">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><Mail size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Email</span>
                  <span className="text-sm font-medium">{profileData.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><Building2 size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Dormitory</span>
                  <span className="text-sm font-medium">#{profileData.dormitory || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center"><MapPin size={18} /></div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-gray-400">Room</span>
                  <span className="text-sm font-medium">{profileData.room_number || '—'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditModalOpen(true)}
              className="w-full mt-8 px-4 py-3 bg-gray-900 text-white rounded-2xl hover:bg-black transition-all font-semibold shadow-lg shadow-gray-200"
            >
              Edit Settings
            </button>
          </div>
        </div>

        {/* Right Side: My Listings */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Your Listings</h2>
              </div>
              <span className="text-sm font-bold text-gray-400 bg-gray-50 px-4 py-1 rounded-full">
                {myProducts.length} Items
              </span>
            </div>

            {myProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProducts.map((item: any) => (
                  <div key={item.id} className="group relative bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300">
                    <img src={`http://127.0.0.1:8000${item.image}`} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900">{item.title}</h3>
                      <p className="text-blue-600 font-bold">${item.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p className="font-medium text-lg">No listings yet</p>
                <button 
                  onClick={() => navigate('/marketplace')}
                  className="mt-4 text-blue-600 font-bold hover:underline"
                >
                  Create your first listing →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDIT MODAL - Скляний ефект */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
            onClick={() => setIsEditModalOpen(false)}
          ></div>
          
          <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              {/* Photo Upload Area */}
              <div className="flex justify-center mb-8">
                <div 
                  className="relative group cursor-pointer" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="absolute inset-0 bg-black/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                    <Camera className="text-white" size={32} />
                  </div>
                  <img 
                    src={profileData.photo ? `http://127.0.0.1:8000${profileData.photo}` : 'https://via.placeholder.com/150'} 
                    className="w-28 h-28 rounded-3xl object-cover border-4 border-blue-50"
                  />
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Dormitory</label>
                  <select
                    value={editForm.dormitory}
                    onChange={(e) => setEditForm({...editForm, dormitory: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  >
                    {dormitories.map(d => <option key={d} value={d}>Dorm {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Room</label>
                  <input
                    type="text"
                    value={editForm.room}
                    onChange={(e) => setEditForm({...editForm, room: e.target.value})}
                    className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold mt-4 hover:bg-blue-700 transition-all disabled:opacity-50 flex justify-center gap-2 shadow-xl shadow-blue-100"
              >
                {updating ? <Loader2 className="animate-spin" /> : 'Apply Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}