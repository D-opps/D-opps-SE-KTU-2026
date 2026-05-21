import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, ArrowLeft, Loader2,
  Globe, Building2, Trash2, Search, Bell,
  MoreVertical, UserPlus, MessageSquare, CheckCheck, User, Pin, PinOff, Clock
} from 'lucide-react'; 
import axios from 'axios';
import { toast } from 'sonner';

export function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  
  const [pinnedIds, setPinnedIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('pinnedChats');
    return saved ? JSON.parse(saved) : [];
  });

  const [newMessage, setNewMessage] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('userId');
  const BASE_URL = 'http://127.0.0.1:8000';
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('pinnedChats', JSON.stringify(pinnedIds));
  }, [pinnedIds]);

  const togglePin = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setPinnedIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const fetchChat = async () => {
    if (!chatId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/${chatId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentChat(res.data);
    } catch (e) { console.error(e); }
  };

  const deleteChat = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await axios.delete(`${BASE_URL}/api/conversations/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (String(chatId) === String(id)) navigate('/chat');
      setPinnedIds(prev => prev.filter(pId => pId !== id));
      fetchConversations();
      toast.success("Видалено");
    } catch (e) { toast.error("Помилка видалення"); }
  };

  // Оновлена функція відправки повідомлень (Оптимістичний та швидкий UI)
  const sendMessage = async (e: any) => {
    e.preventDefault();
    const messageText = newMessage.trim();
    if (!messageText || !chatId) return;

    // 1. МИТТЄВО очищаємо інпут, щоб юзер не чекав відповіді сервера
    setNewMessage('');

    // 2. Створюємо тимчасове оптимістичне повідомлення для миттєвого рендеру
    const temporaryId = Date.now(); // Тимчасовий id для списку
    const optMessage = {
      id: temporaryId,
      sender: userId,
      sender_name: "Me",
      text: messageText,
      created_at: new Date().toISOString(),
      isSending: true // прапорець для відображення статусу
    };

    // 3. Локально оновлюємо стейт поточного чату, щоб повідомлення з'явилося одразу
    setCurrentChat((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: prev.messages ? [...prev.messages, optMessage] : [optMessage]
      };
    });

    try {
      // 4. Відправляємо реальний запит на сервер паралельно у фоні
      await axios.post(`${BASE_URL}/api/messages/`, {
        conversation: chatId, text: messageText
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // 5. Синхронізуємо дані з сервером після успішної відправки
      fetchChat();
      fetchConversations();
    } catch (e) { 
      toast.error("Помилка відправки");
      // Якщо сервер відвалився — видаляємо тимчасове повідомлення і повертаємо текст назад в інпут
      setNewMessage(messageText);
      setCurrentChat((prev: any) => {
        if (!prev || !prev.messages) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m: any) => m.id !== temporaryId)
        };
      });
    }
  };

  // Обробник натискання на дзвіночок сповіщень
  const handleBellClick = () => {
    navigate('/notifications'); // Перенаправляє на сторінку сповіщень, яку ми лагодили
  };

  useEffect(() => {
    fetchConversations();
    const i = setInterval(fetchConversations, 5000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    fetchChat();
    const i = setInterval(fetchChat, 3000);
    return () => clearInterval(i);
  }, [chatId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat]);

  // Сортування: спочатку закріплені
  const sortedConversations = [...conversations].sort((a, b) => {
    const aPinned = pinnedIds.includes(a.id) ? 1 : 0;
    const bPinned = pinnedIds.includes(b.id) ? 1 : 0;
    return bPinned - aPinned;
  });

  return (
    <div className="flex h-[calc(100vh-65px)] bg-[#F8FAFC] overflow-hidden font-sans text-gray-900">
      
      {/* ЛІВА ПАНЕЛЬ */}
      <aside className="w-80 md:w-[400px] bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm">
        
        <div className="p-5 border-b border-gray-50 flex justify-between items-center">
          <h1 className="text-xl font-black text-blue-600 tracking-tighter italic">MESSAGES</h1>
          {/* Активний працюючий дзвіночок */}
          <Bell 
            onClick={handleBellClick} 
            className="text-gray-400 cursor-pointer hover:text-blue-500 transition-colors active:scale-90" 
            size={20} 
          />
        </div>

        {/* ПОШУК */}
        <div className="p-4 border-b border-gray-50 space-y-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (async () => {
                   try {
                     const res = await axios.get(`${BASE_URL}/api/users/search/?email=${searchEmail}`, {
                       headers: { Authorization: `Bearer ${token}` }
                     });
                     setFoundUser(res.data);
                   } catch (e) { setFoundUser(null); toast.error("Не знайдено"); }
                })()}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-100 text-sm"
                placeholder="Пошук за email..."
              />
           </div>
           {foundUser && (
             <div onClick={async () => {
                try {
                  const res = await axios.post(`${BASE_URL}/api/conversations/`, { username: foundUser.email }, { headers: { Authorization: `Bearer ${token}` } });
                  setFoundUser(null); setSearchEmail(''); fetchConversations(); navigate(`/chat/${res.data.id}`);
                } catch (e) { toast.error("Помилка"); }
             }} className="p-3 bg-blue-600 text-white rounded-xl flex items-center justify-between cursor-pointer hover:bg-blue-700 transition-all">
                <span className="text-xs font-bold truncate">{foundUser.email}</span>
                <UserPlus size={16} />
             </div>
           )}
        </div>

        {/* СПЕЦ ЧАТИ */}
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-gray-50">
          <button onClick={async () => {
             const exist = conversations.find(c => c.type === 'global');
             if (exist) navigate(`/chat/${exist.id}`);
             else {
               const res = await axios.post(`${BASE_URL}/api/conversations/`, { type: 'global' }, { headers: { Authorization: `Bearer ${token}` } });
               fetchConversations(); navigate(`/chat/${res.data.id}`);
             }
          }} className="flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-600 rounded-2xl font-bold text-xs hover:bg-blue-100 transition-all">
            <Globe size={18} /> Global
          </button>
          <button onClick={async () => {
             const exist = conversations.find(c => c.type === 'dormitory');
             if (exist) navigate(`/chat/${exist.id}`);
             else {
               const res = await axios.post(`${BASE_URL}/api/conversations/`, { type: 'dormitory' }, { headers: { Authorization: `Bearer ${token}` } });
               fetchConversations(); navigate(`/chat/${res.data.id}`);
             }
          }} className="flex items-center justify-center gap-2 py-3 bg-purple-50 text-purple-600 rounded-2xl font-bold text-xs hover:bg-purple-100 transition-all">
            <Building2 size={18} /> Dorm
          </button>
        </div>

        {/* СПИСОК ЧАТІВ */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
          {loading ? (
            <div className="flex justify-center mt-10 text-blue-500"><Loader2 className="animate-spin" /></div>
          ) : sortedConversations.map(c => {
            const isPinned = pinnedIds.includes(c.id);
            const isActive = String(chatId) === String(c.id);
            
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className={`relative flex items-center gap-3 p-4 mb-1 rounded-2xl cursor-pointer transition-all ${
                  isActive ? 'bg-blue-50 shadow-sm border-l-4 border-blue-600 rounded-l-none' : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                {/* Аватарка */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  c.type === 'global' ? 'bg-blue-100 text-blue-600' : c.type === 'dormitory' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.type === 'global' ? <Globe size={20} /> : c.type === 'dormitory' ? <Building2 size={20} /> : <User size={20} />}
                </div>
                
                {/* Інфо */}
                <div className="flex-1 min-w-0 pr-16">
                  <h3 className={`font-bold text-sm truncate ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                    {c.display_name}
                  </h3>
                  <p className="text-[11px] text-gray-400 truncate">Last message...</p>
                </div>

                {/* БЛОК КНОПОК */}
                <div className="absolute right-2 flex items-center gap-1 bg-inherit">
                  <button
                    onClick={(e) => togglePin(e, c.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isPinned ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-400 hover:bg-blue-50'
                    }`}
                  >
                    {isPinned ? <PinOff size={16} fill="currentColor" /> : <Pin size={16} />}
                  </button>
                  
                  <button
                    onClick={(e) => deleteChat(e, c.id)}
                    className="p-2 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Непрочитані */}
                {c.unread_count > 0 && !isActive && (
                  <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {c.unread_count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ПРАВА ПАНЕЛЬ (ЧАТ) */}
      <main className="flex-1 flex flex-col bg-white">
        {!chatId ? (
          <div className="m-auto text-center space-y-4">
             <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 mx-auto">
                <MessageSquare size={48} />
             </div>
             <h2 className="text-xl font-bold text-gray-800">Choose a chat to communicate</h2>
          </div>
        ) : (
          <>
            <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/chat')} className="md:hidden"><ArrowLeft /></button>
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
                   <User size={20} />
                </div>
                <div>
                  <h2 className="font-bold text-sm md:text-base">{currentChat?.display_name}</h2>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest flex items-center gap-1">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span> Online
                  </p>
                </div>
              </div>
              <MoreVertical className="text-gray-400" />
            </header>

            {/* ПОВІДОМЛЕННЯ */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#FBFDFF] custom-scrollbar space-y-4">
              {currentChat?.messages?.map((m: any) => {
                const isMe = String(m.sender) === String(userId);
                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
                    }`}>
                      {!isMe && <p className="text-[9px] font-black text-purple-500 uppercase mb-1">{m.sender_name}</p>}
                      <p className="text-sm">{m.text}</p>
                      <div className={`flex items-center gap-1 mt-1 opacity-50 ${isMe ? 'justify-end' : 'justify-start'}`}>
                         <span className="text-[8px] font-bold">
                           {new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                         </span>
                         {isMe && (
                           m.isSending ? (
                             <Clock size={10} className="animate-pulse" /> // Годинник під час відправки
                           ) : (
                             <CheckCheck size={10} /> // Пташечки, коли збережено
                           )
                         )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {/* ВВІД */}
            <footer className="p-4 border-t border-gray-100 bg-white">
              <form onSubmit={sendMessage} className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200 focus-within:border-blue-400 transition-all">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-transparent px-2 outline-none text-sm font-medium"
                  placeholder="Put message..."
                />
                <button disabled={!newMessage.trim()} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all active:scale-95 disabled:bg-gray-300 shadow-lg shadow-blue-100">
                  <Send size={18} />
                </button>
              </form>
            </footer>
          </>
        )}
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}