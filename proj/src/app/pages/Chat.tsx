import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Send, MessageSquare, ShieldCheck, Users, ArrowLeft, Loader2, Building2, Trash2, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: string;
  sender_name: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  type: 'private' | 'group' | 'admin';
  product_title?: string;
  dormitory_number?: number;
  participants: any[];
  messages: Message[];
}

export function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchUsername, setSearchUsername] = useState(''); // Стан для пошуку
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('accessToken');
  const currentUserId = localStorage.getItem('userId');
  const BASE_URL = 'http://127.0.0.1:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Отримати всі чати
  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Fetch conv error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Отримати конкретний чат
  const fetchCurrentChat = async () => {
    if (!chatId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/${chatId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentChat(res.data);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 500) {
        navigate('/chat');
      }
    }
  };

  // 3. Пошук та створення чату з будь-яким юзером
const handleStartNewChat = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!searchUsername.trim()) return;

  try {
    const res = await axios.post(`${BASE_URL}/api/conversations/`, {
      username: searchUsername.trim(), // Або замініть на 'receiver' залежно від логіки створення у views.py
      type: 'private',
      product: null // Явно передаємо порожній товар
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setSearchUsername('');
    navigate(`/chat/${res.data.id}`);
    fetchConversations();
  } catch (err: any) {
    console.log("Error details:", err.response?.data);
    toast.error("Користувача не знайдено або помилка сервера");
  }
};

  // 4. Вхід у чат гуртожитку
  const joinDormChat = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/dormitory_chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat/${res.data.id}`);
      fetchConversations();
    } catch (err: any) {
      toast.error("Перевірте номер гуртожитку в налаштуваннях профілю!");
    }
  };

  // 5. Видалення чату
  const handleDeleteChat = async (idToDelete: string) => {
    if (!window.confirm("Видалити цей чат для вас?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/conversations/${idToDelete}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Чат видалено");
      setConversations(prev => prev.filter(c => c.id !== idToDelete));
      if (chatId === idToDelete) navigate('/chat');
    } catch (err) {
      toast.error("Не вдалося видалити");
    }
  };

  // 6. Відправка повідомлення
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;
    try {
      await axios.post(`${BASE_URL}/api/messages/`, {
        conversation: chatId,
        text: newMessage.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewMessage('');
      fetchCurrentChat();
    } catch (err) {
      toast.error("Помилка відправки");
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    fetchConversations();
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      fetchCurrentChat();
      const interval = setInterval(fetchCurrentChat, 4000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const getChatName = (conv: Conversation) => {
    if (conv.type === 'group') return `Гуртожиток №${conv.dormitory_number || '?'}`;
    if (conv.type === 'admin') return `Служба підтримки`;
    return conv.product_title || 'Приватна розмова';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`w-full lg:w-80 border-r flex flex-col ${chatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-black tracking-tight">Чати</h1>
        </div>

        {/* ПОШУК ЮЗЕРІВ */}
        <div className="p-3">
          <form onSubmit={handleStartNewChat} className="relative mb-2">
            <input
              type="text"
              placeholder="Знайти користувача..."
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="w-full p-3 pr-10 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all shadow-sm"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600">
              <Search size={18} />
            </button>
          </form>

          <button
            onClick={joinDormChat}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-3"
          >
            <Building2 size={20} />
            <div className="text-left">
              <p className="font-bold text-sm">Мій Гуртожиток</p>
              <p className="text-[10px] opacity-70 uppercase font-black">Спільнота</p>
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="relative group mb-2">
                <button
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full p-4 rounded-2xl text-left transition-all flex items-center gap-3 ${
                    chatId === conv.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-50 text-gray-900 border border-transparent'
                  }`}
                >
                  <div className={`p-2 rounded-xl ${chatId === conv.id ? 'bg-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                    {conv.type === 'group' ? <Building2 size={18} /> : <MessageSquare size={18} />}
                  </div>
                  <div className="overflow-hidden pr-6">
                    <p className="font-bold truncate text-sm">{getChatName(conv)}</p>
                    <p className={`text-[10px] uppercase font-bold opacity-60`}>{conv.type}</p>
                  </div>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(conv.id); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className={`flex-1 flex flex-col bg-[#f8fafc] ${!chatId ? 'hidden lg:flex' : 'flex'}`}>
        {chatId && currentChat ? (
          <>
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => navigate('/chat')} className="lg:hidden p-2 text-gray-500"><ArrowLeft size={20} /></button>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold">
                  {getChatName(currentChat)[0]}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{getChatName(currentChat)}</h2>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Онлайн</p>
                </div>
              </div>
              <button onClick={() => handleDeleteChat(chatId)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat.messages?.map((msg) => {
                const isMe = String(msg.sender) === String(currentUserId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
                    }`}>
                      {!isMe && <p className="text-[10px] font-black text-blue-500 uppercase mb-1">{msg.sender_name}</p>}
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-[9px] mt-1 text-right opacity-60`}>{msg.timestamp}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введіть повідомлення..."
                  className="flex-1 px-5 py-3 bg-gray-50 border rounded-2xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-md">
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={60} className="opacity-10 mb-4" />
            <p className="font-bold text-gray-500">Оберіть чат або знайдіть користувача</p>
          </div>
        )}
      </main>
    </div>
  );
}