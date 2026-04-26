import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Send, ArrowLeft, Loader2, Globe, Building2, Trash2, Bell } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('accessToken');
  const currentUserId = localStorage.getItem('userId');
  const BASE_URL = 'http://127.0.0.1:8000';

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Помилка завантаження чатів", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentChat = async () => {
    if (!chatId) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/${chatId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentChat(res.data);
    } catch (err: any) {
      if (err.response?.status === 404) navigate('/chat');
    }
  };

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
      fetchConversations();
    } catch (err) {
      toast.error("Помилка відправки");
    }
  };

  // ✅ ВИДАЛЕННЯ ЧАТУ
  const handleDeleteChat = async (conversationId: number) => {
    try {
      await axios.delete(`${BASE_URL}/api/conversations/${conversationId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Чат видалено");

      if (chatId === String(conversationId)) {
        navigate("/chat");
        setCurrentChat(null);
      }

      fetchConversations();
    } catch (err) {
      toast.error("Не вдалося видалити чат");
      console.error(err);
    }
  };

  // ПЕРЕХІД В ГЛОБАЛ ТА ДОРМ
const goToSpecialChat = async (type: 'global' | 'dormitory') => {
  const backendType = type === 'global' ? 'global' : 'dormitory';

  const existingChat = conversations.find(c => c.type === backendType);

  if (existingChat) {
    navigate(`/chat/${existingChat.id}`);
  } else {
    try {
      const res = await axios.post(`${BASE_URL}/api/conversations/`, {
        type: backendType,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchConversations();
      navigate(`/chat/${res.data.id}`);
    } catch (err: any) {
      console.error("Деталі помилки:", err.response?.data);
      toast.error("Не вдалося створити чат");
    }
  }
};
  useEffect(() => {
    fetchConversations();
    const i = setInterval(fetchConversations, 4000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchCurrentChat();
      const i = setInterval(fetchCurrentChat, 3000);
      return () => clearInterval(i);
    }
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden text-gray-900">
      <aside className={`w-full lg:w-80 border-r flex flex-col ${chatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b flex justify-between items-center">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-blue-600">Messenger</h1>
          <div className="relative">
            <Bell size={20} className="text-gray-400" />
            {conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0) > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
            )}
          </div>
        </div>

        {/* КНОПКИ КАНАЛІВ */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b bg-gray-50">
          <button
            onClick={() => goToSpecialChat('global')}
            className="relative flex flex-col items-center p-3 bg-white border rounded-2xl hover:border-blue-500 transition-all"
          >
            <Globe size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-black uppercase">Global</span>

            {conversations.find(c => c.type === 'global')?.unread_count > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] px-1.5 rounded-full font-bold">
                {conversations.find(c => c.type === 'global')?.unread_count}
              </span>
            )}
          </button>

          <button
            onClick={() => goToSpecialChat('dormitory')}
            className="relative flex flex-col items-center p-3 bg-white border rounded-2xl hover:border-blue-500 transition-all"
          >
            <Building2 size={20} className="text-blue-500 mb-1" />
            <span className="text-[10px] font-black uppercase">My Dorm</span>

            {conversations.find(c => c.type === 'dormitory')?.unread_count > 0 && (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] px-1.5 rounded-full font-bold">
                {conversations.find(c => c.type === 'dormitory')?.unread_count}
              </span>
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[10px] font-black uppercase text-gray-400 mb-3 px-2">Messages</p>

          {loading ? (
            <div className="flex justify-center p-5">
              <Loader2 className="animate-spin text-blue-500" />
            </div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="group mb-1">
                <button
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full p-4 rounded-2xl text-left flex justify-between items-center transition-all ${
                    chatId === String(conv.id)
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="truncate">
                    <p className="font-bold text-sm truncate">{conv.display_name || `Chat #${conv.id}`}</p>
                    <p className="text-[9px] uppercase font-black opacity-60">{conv.type}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* ✅ КНОПКА ВИДАЛЕННЯ */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(conv.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 transition-all p-2 rounded-xl hover:bg-red-50 ${
                        chatId === String(conv.id) ? "text-white hover:bg-red-500/20" : "text-red-500"
                      }`}
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* КАУНТ ДЛЯ ПРИВАТНИХ ЧАТІВ */}
                    {conv.unread_count > 0 && chatId !== String(conv.id) && (
                      <span className="bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className={`flex-1 flex flex-col bg-white ${!chatId ? 'hidden lg:flex' : 'flex'}`}>
        {chatId && currentChat ? (
          <>
            <header className="border-b p-4 flex items-center gap-3 bg-white">
              <button onClick={() => navigate('/chat')} className="lg:hidden">
                <ArrowLeft size={20} />
              </button>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-xs font-black">
                {currentChat.display_name?.[0]}
              </div>
              <h2 className="font-black uppercase text-xs tracking-widest">{currentChat.display_name}</h2>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30">
              {currentChat.messages?.map((msg: any) => {
                const isMe = String(msg.sender) === String(currentUserId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white border rounded-tl-none'
                      }`}
                    >
                      {!isMe && (
                        <p className="text-[9px] font-black text-blue-500 uppercase mb-1">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="text-sm">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-3 bg-gray-100 rounded-xl outline-none text-sm"
                  placeholder="Напишіть щось..."
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300 font-black uppercase italic tracking-widest">
            Виберіть чат
          </div>
        )}
      </main>
    </div>
  );
}