import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, Tag as TagIcon, MessageCircle as ChatIcon, Loader2 as LoaderIcon, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    // Отримуємо ID поточного юзера з профілю або localStorage, щоб знати, чи це не наш товар
    const fetchUserData = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const res = await axios.get(`${BASE_URL}/api/profile/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setCurrentUserId(res.data.profile.id);
        } catch (e) {
          console.error("User not logged in or token expired");
        }
      }
    };

    const fetchItem = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/products/${itemId}/`);
        setItem(response.data);
      } catch (err) {
        toast.error("Could not load item details");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    fetchItem();
  }, [itemId]);

  const startConversation = async (initialMessage?: string, isExchange: boolean = false) => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      toast.error("Please login to contact the seller");
      navigate('/login');
      return;
    }

    // Перевірка, чи не намагається юзер написати сам собі
    const sellerId = item.seller_id || item.seller;
    if (currentUserId === sellerId) {
      toast.error("This is your own listing!");
      return;
    }

    try {
      // 1. Створюємо або отримуємо існуючий чат
      const res = await axios.post(`${BASE_URL}/api/conversations/`, {
        product_id: item.id,
        receiver_id: sellerId,
        is_exchange: isExchange 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const chatId = res.data.id;

      // 2. Якщо це перший контакт і є повідомлення — відправляємо його
      if (initialMessage) {
        try {
          await axios.post(`${BASE_URL}/api/messages/`, {
            conversation: chatId, 
            text: initialMessage
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } catch (msgErr) {
          console.error("Message not sent, maybe already exists");
        }
      }
      
      // 3. Перехід у чат
      navigate(`/chat/${chatId}`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Could not start chat");
    }
  };

  const handleContactSeller = () => {
    const message = `Hi! I'm interested in "${item.title}".`;
    startConversation(message, false);
  };

  const handleProposeExchange = () => {
    const message = `👋 Hi! I want to propose an exchange for your "${item.title}". What are you looking for?`;
    startConversation(message, true);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <LoaderIcon className="animate-spin text-blue-600 w-10 h-10" />
    </div>
  );

  if (!item) return <div className="p-10 text-center text-gray-500">Item not found</div>;

  const isOwner = currentUserId === (item.seller_id || item.seller);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <Link to="/marketplace" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors w-fit">
        <ArrowLeft className="w-5 h-5" /> <span className="font-medium">Back to Marketplace</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image Section */}
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 h-fit">
          <img 
            src={item.image?.startsWith('http') ? item.image : `${BASE_URL}${item.image}`} 
            alt={item.title} 
            className="w-full h-auto max-h-[600px] object-cover" 
          />
        </div>

        {/* Info Section */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-xs font-bold rounded-full uppercase">
                {item.category}
              </span>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${item.status === 'sold' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {item.status || 'available'}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.title}</h1>
            <div className="text-3xl font-black text-blue-600 mb-6">${item.price}</div>

            <div className="mb-8">
              <h2 className="text-lg font-bold text-gray-900 mb-2 border-b pb-2">Description</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{item.description}</p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white text-xl shadow-inner uppercase">
                {item.seller_name?.[0] || 'U'}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Seller</p>
                <p className="text-lg font-bold text-gray-900">
                  {item.seller_name || "Dorm Resident"} {isOwner && <span className="text-blue-500 text-sm">(You)</span>}
                </p>
              </div>
            </div>

            {isOwner ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl text-gray-500 italic">
                <AlertCircle size={20} />
                <span>You cannot contact yourself for your own item.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={handleContactSeller}
                  disabled={item.status === 'sold'}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-900 text-white rounded-2xl hover:bg-black disabled:bg-gray-300 transition-all font-bold shadow-lg shadow-gray-200"
                >
                  <ChatIcon size={20} />
                  Contact Seller
                </button>
                
                <button
                  onClick={handleProposeExchange}
                  disabled={item.status === 'sold'}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-white text-gray-900 border-2 border-gray-900 rounded-2xl hover:bg-gray-50 disabled:opacity-50 transition-all font-bold"
                >
                  <TagIcon size={20} />
                  Propose Exchange
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}