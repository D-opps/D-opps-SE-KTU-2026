import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Send, MessageSquare, ArrowLeft, Loader2, Building2, Trash2, Search } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchUsername, setSearchUsername] = useState('');
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
      console.error(err);
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

  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    try {
      const res = await axios.post(`${BASE_URL}/api/conversations/`, {
        username: searchUsername.trim(),
        type: 'private',
        product_id: null 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSearchUsername('');
      fetchConversations();
      navigate(`/chat/${res.data.id}`);
      toast.success("Chat created");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "User not found");
    }
  };

  const handleGlobalChat = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/global_chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat/${res.data.id}`);
      fetchConversations();
    } catch (err) {
      toast.error("Failed to access global chat");
    }
  };

  const handleDormitoryChat = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/dormitory_chat/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat/${res.data.id}`);
      fetchConversations();
    } catch (err) {
      toast.error("Failed to access dormitory chat");
    }
  };

  const handleDeleteChat = async (id: string | number) => {
    if (!window.confirm("Are you sure you want to delete this chat?")) return;
    try {
      await axios.delete(`${BASE_URL}/api/conversations/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (chatId === String(id)) navigate('/chat');
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
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
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  useEffect(() => { fetchConversations(); }, []);
  useEffect(() => { 
    if (chatId) {
      fetchCurrentChat();
      const interval = setInterval(fetchCurrentChat, 5000);
      return () => clearInterval(interval);
    }
  }, [chatId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentChat?.messages]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      {/* SIDEBAR */}
      <aside className={`w-full lg:w-80 border-r flex flex-col ${chatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter text-blue-600">Messenger</h1>
        </div>
        
        <div className="p-3 space-y-2">
          <form onSubmit={handleStartNewChat} className="relative mb-3">
            <input 
              type="text" 
              placeholder="Search by username..." 
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              className="w-full p-3 pr-10 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:scale-110 transition-transform">
              <Search size={18}/>
            </button>
          </form>

          {/* GLOBAL CHAT BUTTON */}
          <button 
            onClick={handleGlobalChat}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white font-bold flex items-center gap-3 shadow-lg hover:shadow-purple-200 transition-all"
          >
            <MessageSquare size={20}/> Global Chat
          </button>

          <button 
            onClick={handleDormitoryChat}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold flex items-center gap-3 shadow-lg hover:shadow-blue-200 transition-all"
          >
            <Building2 size={20}/> My Dormitory
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0">
          {loading ? (
            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>
          ) : (
            conversations.map((conv) => (
              <div key={conv.id} className="relative group mb-2">
                <button 
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`w-full p-4 rounded-2xl text-left border transition-all flex flex-col ${
                    chatId === String(conv.id) 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                      : 'bg-white text-gray-900 border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-bold truncate text-sm pr-6">
                    {conv.type === 'group' 
                      ? `Dormitory №${conv.dormitory_number}` 
                      : (conv.display_name || conv.product_title || 'Direct Message')}
                  </span>
                  <span className={`text-[10px] uppercase font-black opacity-50 ${chatId === String(conv.id) ? 'text-white' : 'text-blue-600'}`}>
                    {conv.type}
                  </span>
                </button>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteChat(conv.id); }}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100 ${
                    chatId === String(conv.id) ? 'text-white hover:bg-blue-500' : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                  }`}
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`flex-1 flex flex-col bg-[#fcfdfe] ${!chatId ? 'hidden lg:flex' : 'flex'}`}>
        {chatId && currentChat ? (
          <>
            <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => navigate('/chat')} className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  <ArrowLeft size={20}/>
                </button>
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                  {/* SAFE INITIALS */}
                  {(currentChat?.display_name?.[0] || currentChat?.product_title?.[0] || 'C').toUpperCase()}
                </div>
                <div>
                  <h2 className="font-black uppercase text-xs tracking-widest text-gray-900 leading-none mb-1">
                    {currentChat?.display_name || currentChat?.product_title || 'Private Chat'}
                  </h2>
                  <p className="text-[10px] text-green-500 font-bold uppercase">Online</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteChat(chatId)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              >
                <Trash2 size={20}/>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat.messages?.map((msg: any) => {
                const isMe = String(msg.sender) === String(currentUserId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                    }`}>
                      {!isMe && <p className="text-[9px] font-black uppercase text-blue-500 mb-1">{msg.sender_name}</p>}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] text-right mt-1 font-bold opacity-40`}>{msg.timestamp}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-2">
                <input 
                  type="text" 
                  value={newMessage} 
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 p-4 bg-gray-50 border-none rounded-2xl outline-none text-sm focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all"
                  placeholder="Type a message..."
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim()}
                  className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                  <Send size={20}/>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
            <MessageSquare size={80} className="mb-4 opacity-10" />
            <p className="font-black text-xl italic uppercase tracking-widest opacity-20">Select a conversation</p>
          </div>
        )}
      </main>
    </div>
  );
}