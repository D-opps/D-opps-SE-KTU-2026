import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MessageCircle, MapPin } from 'lucide-react';
import { marketplaceItems } from '../data/mockData';

export function ItemDetails() {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const item = marketplaceItems.find((i) => i.id === itemId);

  if (!item) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-6">
            The item you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/marketplace')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Marketplace</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Item Image */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <img
            src={item.image}
            alt={item.name}
            className="w-full aspect-square object-cover"
          />
        </div>

        {/* Item Information */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <h1 className="text-3xl flex-1">{item.name}</h1>
              <div className="text-3xl text-blue-600 ml-4">${item.price}</div>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full">
                {item.category}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-lg mb-2">Description</h2>
              <p className="text-gray-600">{item.description}</p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-lg mb-4">Seller Information</h2>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">
                    {item.seller.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="mb-1">{item.seller}</p>
                  {item.sellerRoom && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{item.sellerRoom}</span>
                    </div>
                  )}
                </div>
              </div>

              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <MessageCircle className="w-5 h-5" />
                <span>Contact Seller</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
