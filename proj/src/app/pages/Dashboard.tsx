import { Link } from 'react-router';
import { WashingMachine, ShoppingBag, MessageSquare, ArrowRight } from 'lucide-react';
import { machines, marketplaceItems, chatMessages } from '../data/mockData';

export function Dashboard() {
  const availableMachines = machines.filter((m) => m.status === 'available').length;
  const recentItems = marketplaceItems.slice(0, 3);
  const recentMessages = chatMessages.filter((m) => m.room === 'general').slice(-3);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Welcome to DormLife</h1>
        <p className="text-gray-600">Your dorm community dashboard</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Laundry Card */}
        <Link
          to="/laundry"
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <WashingMachine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Machines</p>
              <p className="text-2xl text-green-600">{availableMachines}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Check laundry status</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Marketplace Card */}
        <Link
          to="/marketplace"
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Items</p>
              <p className="text-2xl text-blue-600">{marketplaceItems.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Browse marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        {/* Chat Card */}
        <Link
          to="/chat"
          className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unread Messages</p>
              <p className="text-2xl text-purple-600">4</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Open chat</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latest Marketplace Items */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Latest Marketplace</h2>
            <Link to="/marketplace" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentItems.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="flex gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.seller}</p>
                </div>
                <div className="text-blue-600">${item.price}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Chat Messages */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Recent Messages</h2>
            <Link to="/chat" className="text-sm text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{msg.sender}</span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
