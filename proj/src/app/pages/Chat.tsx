import { useState, useEffect, useRef } from 'react';
import { Send, Hash } from 'lucide-react';
import { chatMessages as initialMessages } from '../data/mockData';

type ChatRoom = 'general' | 'marketplace' | 'events';

interface Message {
  id: number;
  sender: string;
  message: string;
  timestamp: Date;
  room: ChatRoom;
}

export function Chat() {
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom>('general');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = localStorage.getItem('userName') || 'Anonymous';

  // Check if coming from marketplace
  useEffect(() => {
    const chatWithSeller = localStorage.getItem('chatWithSeller');
    if (chatWithSeller) {
      setSelectedRoom('marketplace');
      localStorage.removeItem('chatWithSeller');
      
      // Add a system message about contacting seller
      const systemMessage: Message = {
        id: messages.length + 1,
        sender: 'System',
        message: `You're now chatting with ${chatWithSeller} about their listing.`,
        timestamp: new Date(),
        room: 'marketplace',
      };
      setMessages((prev) => [...prev, systemMessage]);
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedRoom]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const rooms: { id: ChatRoom; name: string; description: string }[] = [
    { id: 'general', name: 'General', description: 'General chat for all residents' },
    { id: 'marketplace', name: 'Marketplace', description: 'Discuss buying and selling items' },
    { id: 'events', name: 'Events', description: 'Upcoming dorm events and activities' },
  ];

  const filteredMessages = messages.filter((msg) => msg.room === selectedRoom);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    const message: Message = {
      id: messages.length + 1,
      sender: currentUser,
      message: newMessage,
      timestamp: new Date(),
      room: selectedRoom,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage('');

    // Simulate receiving a response after 2-5 seconds
    const responseDelay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      simulateResponse();
    }, responseDelay);
  };

  const simulateResponse = () => {
    const responses = [
      "That sounds great!",
      "I'm interested, when are you available?",
      "Can you send me more details?",
      "Thanks for sharing!",
      "Count me in!",
      "That's a good deal!",
      "Is it still available?",
      "I'll check it out, thanks!",
    ];

    const otherUsers = ['Sarah Chen', 'Mike Johnson', 'Emma Davis', 'James Wilson'];
    const randomUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    const responseMessage: Message = {
      id: messages.length + 2,
      sender: randomUser,
      message: randomResponse,
      timestamp: new Date(),
      room: selectedRoom,
    };

    setMessages((prev) => [...prev, responseMessage]);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Rooms Sidebar */}
      <aside className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl">Chat Rooms</h1>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={`w-full p-4 rounded-lg text-left transition-colors ${
                  selectedRoom === room.id
                    ? 'bg-blue-50 border-2 border-blue-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Hash className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">{room.name}</span>
                </div>
                <p className="text-sm text-gray-600 ml-8">{room.description}</p>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <Hash className="w-6 h-6 text-gray-600" />
            <div>
              <h2 className="text-xl">
                {rooms.find((r) => r.id === selectedRoom)?.name}
              </h2>
              <p className="text-sm text-gray-600">
                {rooms.find((r) => r.id === selectedRoom)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4">
          {filteredMessages.map((msg) => {
            const isCurrentUser = msg.sender === currentUser;
            const isSystem = msg.sender === 'System';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm">
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md lg:max-w-lg ${
                    isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white'
                  } rounded-2xl p-4 shadow-sm`}
                >
                  {!isCurrentUser && (
                    <p className="text-sm mb-1 text-gray-600">{msg.sender}</p>
                  )}
                  <p className={isCurrentUser ? 'text-white' : 'text-gray-900'}>
                    {msg.message}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {msg.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message #${selectedRoom}...`}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}