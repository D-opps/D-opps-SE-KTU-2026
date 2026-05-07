import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, ArrowLeft, Loader2,
  Globe, Building2, Trash2, Search, Bell
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Chat() {
  const { chatId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<any[]>([]);
  const [currentChat, setCurrentChat] = useState<any>(null);

  const [newMessage, setNewMessage] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');
  const userId = localStorage.getItem('userId');
  const BASE_URL = 'http://127.0.0.1:8000';

  const endRef = useRef<HTMLDivElement>(null);

  /* ================= FETCH ================= */

  const fetchConversations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchChat = async () => {
    if (!chatId) return;

    try {
      const res = await axios.get(`${BASE_URL}/api/conversations/${chatId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentChat(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  /* ================= SEND ================= */

  const sendMessage = async (e: any) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${BASE_URL}/api/messages/`, {
        conversation: chatId,
        text: newMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNewMessage('');
      fetchChat();
      fetchConversations();
    } catch (e) {
      toast.error("Message error");
    }
  };

  /* ================= DELETE ================= */

  const deleteChat = async (id: number) => {
    try {
      await axios.delete(`${BASE_URL}/api/conversations/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Deleted");

      if (String(chatId) === String(id)) {
        navigate('/chat');
      }

      fetchConversations();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  /* ================= SPECIAL CHATS ================= */

  const openSpecial = async (type: 'global' | 'dormitory') => {
    const exist = conversations.find(c => c.type === type);

    if (exist) {
      navigate(`/chat/${exist.id}`);
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/api/conversations/`, {
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchConversations();
      navigate(`/chat/${res.data.id}`);
    } catch (e) {
      toast.error("Can't create chat");
    }
  };

  /* ================= SEARCH ================= */

  const searchUser = async () => {
    if (!searchEmail) return;

    try {
      const res = await axios.get(
        `${BASE_URL}/api/users/search/?email=${searchEmail}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFoundUser(res.data);
    } catch (e: any) {
      setFoundUser(null);
      toast.error(e?.response?.data?.error || "User not found");
    }
  };

  const startChat = async (user: any) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/conversations/`, {
        username: user.email   // 👈 ВАЖЛИВО
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchConversations();
      navigate(`/chat/${res.data.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || "Chat error");
    }
  };

  /* ================= EFFECTS ================= */

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

  const totalUnread = conversations.reduce(
    (acc, c) => acc + (c.unread_count || 0),
    0
  );
  useEffect(() => {
    const trackChatActivity = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        // Шлемо запит на новий ендпоїнт ручного трекінгу
        await axios.post('http://127.0.0.1:8000/api/analytics/track/', 
          { event_type: 'chat_session' }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (e) {
        console.error("Analytics error", e);
      }
    };

    trackChatActivity();
  }, []);

  /* ================= UI ================= */

  return (
    <div className="flex h-screen bg-gray-50">

      {/* LEFT */}
      <aside className="w-80 bg-white border-r flex flex-col">

        {/* HEADER */}
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className="font-black text-blue-600">MESSAGES</h1>

          <div className="relative">
            <Bell size={18} />
            {totalUnread > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </div>
        </div>

        {/* SPECIAL */}
        <div className="p-3 grid grid-cols-2 gap-2 border-b">
          <button onClick={() => openSpecial('global')} className="p-3 border rounded-xl">
            <Globe size={18} />
            Global
          </button>

          <button onClick={() => openSpecial('dormitory')} className="p-3 border rounded-xl">
            <Building2 size={18} />
            Dorm
          </button>
        </div>

        {/* SEARCH */}
        <div className="p-3 border-b space-y-2">
          <div className="flex gap-2">
            <input
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="flex-1 p-2 bg-gray-100 rounded"
              placeholder="email..."
            />

            <button onClick={searchUser} className="bg-blue-600 text-white px-3 rounded">
              <Search size={16} />
            </button>
          </div>

          {foundUser && (
            <div
              onClick={() => startChat(foundUser)}
              className="p-2 bg-blue-50 rounded cursor-pointer"
            >
              {foundUser.email}
            </div>
          )}
        </div>

        {/* LIST */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <Loader2 className="animate-spin mx-auto mt-10" />
          ) : conversations.map(c => (
            <div
              key={c.id}
              onClick={() => navigate(`/chat/${c.id}`)}
              className="p-3 flex justify-between hover:bg-gray-100 rounded"
            >
              <div>
                <p className="font-bold">{c.display_name}</p>
              </div>

              {c.unread_count > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 rounded-full">
                  {c.unread_count}
                </span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(c.id);
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </aside>

      {/* CHAT */}
      <main className="flex-1 flex flex-col">
        {!chatId ? (
          <div className="m-auto text-gray-400">Select chat</div>
        ) : (
          <>
            <div className="p-3 border-b font-bold">
              {currentChat?.display_name}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {currentChat?.messages?.map((m: any) => {
                const isMe = String(m.sender) === String(userId);

                return (
                  <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 rounded-xl max-w-[70%] ${
                      isMe ? 'bg-blue-600 text-white' : 'bg-white border'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })}

              <div ref={endRef} />
            </div>

            <form onSubmit={sendMessage} className="p-3 flex gap-2 border-t">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 p-2 bg-gray-100 rounded"
              />

              <button className="bg-blue-600 text-white px-4 rounded">
                <Send size={18} />
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
}