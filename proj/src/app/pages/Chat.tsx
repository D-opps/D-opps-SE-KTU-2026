import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Send, MessageSquare, ShieldCheck, Users, ArrowLeft, Loader2, Building2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

// --- Interfaces ---
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
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem('accessToken');
  const currentUserId = localStorage.getItem('userId');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/conversations/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error("Fetch conv error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch specific chat details
  const fetchCurrentChat = async () => {
    if (!chatId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/conversations/${chatId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentChat(res.data);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  };

  // 3. Join or Create Dormitory Group Chat
  const joinDormChat = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/conversations/dormitory_chat/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/chat/${res.data.id}`);
      fetchConversations();
    } catch (err) {
      toast.error("Set your dormitory number in profile to join the community chat!");
    }
  };

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchConversations();
  }, []);

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

  // 4. Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !chatId) return;

    try {
      await axios.post('http://127.0.0.1:8000/api/messages/', {
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

  // 5. Helpers for UI
  const getChatName = (conv: Conversation) => {
    if (conv.type === 'group') return `Dormitory №${conv.dormitory_number || '?'}`;
    if (conv.type === 'admin') return `Support Service`;
    return conv.product_title || 'Marketplace Item';
  };

  const getChatIcon = (conv: Conversation) => {
    if (conv.type === 'group') return <Building2 size={18} />;
    if (conv.type === 'admin') return <ShieldCheck size={18} />;
    return <MessageSquare size={18} />;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className={`w-full lg:w-80 border-r flex flex-col ${chatId ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-6 border-b">
          <h1 className="text-2xl font-black tracking-tight">Messages</h1>
        </div>

        {/* Quick Access Dorm Chat */}
        <div className="p-3">
          <button 
            onClick={joinDormChat}
            className="w-full p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-3 mb-2"
          >
            <div className="p-2 bg-white/20 rounded-xl">
              <Building2 size={20} />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm leading-none mb-1">My Community</p>
              <p className="text-[10px] opacity-70 uppercase font-black tracking-wider">Join Dorm Chat</p>
            </div>
          </button>
          <div className="h-px bg-gray-100 my-4 mx-2" />
        </div>

        <div className="flex-1 overflow-y-auto p-3 pt-0">
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`w-full p-4 rounded-2xl text-left transition-all mb-2 flex items-center gap-3 ${
                  chatId === conv.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'hover:bg-gray-50 text-gray-900 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl ${chatId === conv.id ? 'bg-blue-500' : 'bg-blue-50 text-blue-600'}`}>
                  {getChatIcon(conv)}
                </div>
                <div className="overflow-hidden">
                  <p className="font-bold truncate text-sm">{getChatName(conv)}</p>
                  <p className={`text-[10px] uppercase font-bold ${chatId === conv.id ? 'text-blue-100' : 'text-gray-400'}`}>
                    {conv.type}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* CHAT AREA */}
      <main className={`flex-1 flex flex-col bg-[#f8fafc] ${!chatId ? 'hidden lg:flex' : 'flex'}`}>
        {chatId && currentChat ? (
          <>
            {/* Header */}
            <div className="bg-white border-b p-4 flex items-center gap-4 shadow-sm z-10">
              <button onClick={() => navigate('/chat')} className="lg:hidden p-2 text-gray-500"><ArrowLeft size={20} /></button>
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-inner">
                {currentChat.type === 'group' ? <Users size={20}/> : (getChatName(currentChat)[0])}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{getChatName(currentChat)}</h2>
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                   <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active Now</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
              {currentChat.messages?.map((msg) => {
                const isMe = String(msg.sender) === String(currentUserId);
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
                    }`}>
                      {!isMe && (
                        <p className="text-[10px] font-black text-blue-500 uppercase mb-1">{msg.sender_name}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[9px] mt-1 text-right font-medium opacity-60 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2 max-w-5xl mx-auto items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-3.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:bg-gray-100 disabled:text-gray-400 transition-all shadow-md active:scale-95"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6">
              <MessageSquare size={40} className="opacity-20" />
            </div>
            <p className="font-bold text-gray-500">Select a conversation</p>
            <p className="text-sm">Choose a chat to start messaging</p>
          </div>
        )}
      </main>
    </div>
  );
}