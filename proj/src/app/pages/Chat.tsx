import { useState } from 'react';
import { Send } from 'lucide-react';
import { chatRooms, chatMessages } from '../data/mockData';

export function Chat() {
  const [selectedRoom, setSelectedRoom] = useState('general');
  const [messageInput, setMessageInput] = useState('');

  const roomMessages = chatMessages.filter((msg) => msg.room === selectedRoom);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    // In a real app, this would send the message to the server
    setMessageInput('');
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Chat Rooms */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl">Chat Rooms</h2>
        </div>
        <div className="p-2">
          {chatRooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setSelectedRoom(room.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors mb-1 ${
                selectedRoom === room.id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{room.name}</span>
                {room.unread > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {room.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <h2 className="text-xl capitalize">{selectedRoom}</h2>
          <p className="text-sm text-gray-600">
            {chatRooms.find((r) => r.id === selectedRoom)?.name} chat room
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {roomMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md ${
                  msg.isOwn ? 'bg-blue-600 text-white' : 'bg-white text-gray-900'
                } rounded-2xl px-4 py-3 shadow-sm`}
              >
                {!msg.isOwn && (
                  <div className="text-sm mb-1 opacity-75">{msg.sender}</div>
                )}
                <p className="mb-1">{msg.message}</p>
                <div
                  className={`text-xs ${
                    msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      </div>
    </div>
  );
}
