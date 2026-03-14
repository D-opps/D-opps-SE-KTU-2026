import { useParams, Link, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Tag, MessageCircle } from 'lucide-react';
import { marketplaceItems } from '../data/mockData';

export function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const item = marketplaceItems.find((i) => i.id === Number(itemId));

  if (!item) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <p>Item not found</p>
        <Link to="/marketplace" className="text-blue-600 hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const handleContactSeller = () => {
    // Store the seller name to open chat with them
    localStorage.setItem('chatWithSeller', item.seller);
    navigate('/chat');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/marketplace"
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Marketplace</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Image */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-96 object-cover"
          />
        </div>

        {/* Details */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h1 className="text-3xl mb-2">{item.name}</h1>
            <div className="flex items-center gap-4 text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span className="text-sm">{item.category}</span>
              </div>
            </div>
            <div className="text-4xl text-blue-600 mb-6">${item.price}</div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl mb-3">Description</h2>
            <p className="text-gray-600">{item.description}</p>
          </div>

          <div className="mb-6 pb-6 border-b border-gray-200">
            <h2 className="text-xl mb-3">Seller Information</h2>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center">
                {item.seller.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{item.seller}</p>
                <p className="text-sm text-gray-500">Active seller</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContactSeller}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contact Seller</span>
            </button>
            <button
              onClick={handleContactSeller}
              className="w-full px-6 py-4 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Make an Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}