import { Mail, MapPin, Package } from 'lucide-react';
import { marketplaceItems } from '../data/mockData';

export function Profile() {
  // Mock user data
  const user = {
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    room: 'Room 305',
    initials: 'AJ',
  };

  // Items posted by the current user
  const userItems = marketplaceItems.filter(
    (item) => item.seller === user.name
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and listings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            {/* Profile Picture */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 bg-blue-600 text-white rounded-full flex items-center justify-center text-3xl mb-4">
                {user.initials}
              </div>
              <h2 className="text-2xl mb-1">{user.name}</h2>
              <p className="text-gray-600">Student</p>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="w-5 h-5" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="w-5 h-5" />
                <span className="text-sm">{user.room}</span>
              </div>
            </div>

            {/* Edit Profile Button */}
            <button className="w-full mt-6 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              Edit Profile
            </button>
          </div>
        </div>

        {/* Activity Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Items Listed</div>
              <div className="text-2xl text-blue-600">{userItems.length}</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total Views</div>
              <div className="text-2xl text-blue-600">127</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Messages</div>
              <div className="text-2xl text-blue-600">8</div>
            </div>
          </div>

          {/* Listed Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
              <Package className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl">Your Listings</h2>
            </div>

            {userItems.length > 0 ? (
              <div className="space-y-4">
                {userItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <h3 className="text-lg">{item.name}</h3>
                        <span className="text-lg text-blue-600">${item.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {item.description}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {item.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>You haven't listed any items yet.</p>
                <button className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
