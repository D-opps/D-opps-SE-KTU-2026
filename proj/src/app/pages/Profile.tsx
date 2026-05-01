import { Mail, MapPin, Package, X, Building2, Camera, Loader2, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';

export function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = 'http://127.0.0.1:8000';
  
  const [profileData, setProfileData] = useState<any>(null);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  const [editForm, setEditForm] = useState({
    name: '',
    room: '',
    dormitory: '',
  });

  const dormitories = ['1', '2', '3', '4', '5', '6', '7', '8'];

  const getPhotoUrl = (photoPath: string | null) => {
    if (!photoPath) return `https://ui-avatars.com/api/?name=${profileData?.first_name || 'User'}&background=0D8ABC&color=fff`;
    if (photoPath.startsWith('http')) return photoPath;
    return `${BASE_URL}${photoPath}`;
  };

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return navigate('/login');
      
      const res = await axios.get(`${BASE_URL}/api/profile/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProfileData(res.data.profile);
      setMyProducts(res.data.products || []);

      setEditForm({
        name: res.data.profile.first_name || '',
        room: res.data.profile.room_number || '',
        dormitory: res.data.profile.dormitory?.toString() || '',
      });
    } catch (err) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('first_name', editForm.name);
    formData.append('room_number', editForm.room);
    formData.append('dormitory', editForm.dormitory);
    
    if (fileInputRef.current?.files?.[0]) {
      formData.append('photo', fileInputRef.current.files[0]);
    }

    try {
      const response = await axios.patch(`${BASE_URL}/api/profile/`, formData, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Profile updated!");
      setProfileData(response.data.profile);
      localStorage.setItem('userName', response.data.profile.first_name);
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error("Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteProduct = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${BASE_URL}/api/products/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Listing deleted!");
      // Видаляємо товар зі стейту, щоб він зник з екрану
      setMyProducts(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      toast.error("Failed to delete product");
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  if (loading) return (
    <div className="flex justify-center p-20 text-blue-600">
      <Loader2 className="animate-spin w-10 h-10" />
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Картка профілю */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
            <div className="relative mb-6">
              <img 
                src={getPhotoUrl(profileData?.photo)}
                className="w-32 h-32 rounded-3xl object-cover border-4 border-white shadow-md"
                alt="Profile"
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900">{profileData?.first_name}</h2>
            <p className="text-blue-600 text-xs font-bold uppercase mb-6">{profileData?.role}</p>

            <div className="w-full space-y-4 border-t pt-6">
              <div className="flex items-center gap-4 text-gray-600">
                <Mail size={18} className="text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Email</p>
                  <p className="text-sm font-medium">{profileData?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <Building2 size={18} className="text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Dormitory</p>
                  <p className="text-sm font-medium">#{profileData?.dormitory || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-600">
                <MapPin size={18} className="text-gray-400" />
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Room</p>
                  <p className="text-sm font-medium">{profileData?.room_number || '—'}</p>
                </div>
              </div>
            </div>

            <button onClick={() => setIsEditModalOpen(true)} className="w-full mt-8 px-4 py-3 bg-gray-900 text-white rounded-2xl font-semibold hover:bg-black transition-all shadow-lg active:scale-95">
              Edit Settings
            </button>
          </div>
        </div>

        {/* Список моїх товарів */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">Your Listings</h2>
              </div>
              <span className="text-sm font-bold text-gray-400 bg-gray-50 px-4 py-1 rounded-full">{myProducts.length} Items</span>
            </div>

            {myProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myProducts.map((item: any) => (
                  <div key={item.id} className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all relative">
                    
                    {/* Кнопка видалення */}
                    <button 
                      onClick={(e) => handleDeleteProduct(e, item.id)}
                      className="absolute top-3 right-3 z-10 p-2.5 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white shadow-sm"
                      title="Delete listing"
                    >
                      <Trash2 size={18} />
                    </button>

                    <img 
                      src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image}`} 
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" 
                      alt={item.title}
                    />                    
                    <div className="p-5">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.title}</h3>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-blue-600 font-bold text-xl">${item.price}</p>
                        <span className="text-[10px] uppercase font-black text-gray-400 bg-gray-50 px-2 py-1 rounded tracking-wider">
                          ID: {item.id}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-100 rounded-3xl">
                <Package size={48} className="opacity-10 mb-2" />
                <p className="font-medium">No listings yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Модалка редагування */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            <h2 className="text-2xl font-bold mb-8">Edit Profile</h2>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex justify-center mb-6">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <img src={getPhotoUrl(profileData?.photo)} className="w-24 h-24 rounded-3xl object-cover border-2 border-blue-100" alt="Preview" />
                  <div className="absolute inset-0 bg-black/30 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="text-white" />
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase ml-1">Full Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Dorm</label>
                  <select value={editForm.dormitory} onChange={(e) => setEditForm({...editForm, dormitory: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                    {dormitories.map(d => <option key={d} value={d}>Dorm {d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">Room</label>
                  <input type="text" value={editForm.room} onChange={(e) => setEditForm({...editForm, room: e.target.value})} className="w-full px-5 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
              </div>

              <button type="submit" disabled={updating} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 disabled:opacity-50">
                {updating ? <Loader2 className="animate-spin" /> : 'Apply Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}