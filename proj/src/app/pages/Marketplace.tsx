import { useState } from 'react';
import { Link } from 'react-router';
import { Search, Plus, X, DollarSign } from 'lucide-react';
import { marketplaceItems as initialItems } from '../data/mockData';

export function Marketplace() {
  const [marketplaceItems, setMarketplaceItems] = useState(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    imageUrl: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories = ['all', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Other'];

  const filteredItems = marketplaceItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleProductChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProduct = () => {
    const errors: Record<string, string> = {};

    if (!newProduct.name.trim()) {
      errors.name = 'Product name is required';
    }

    if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
      errors.price = 'Please enter a valid price';
    }

    if (!newProduct.description.trim()) {
      errors.description = 'Description is required';
    }

    if (!newProduct.imageUrl.trim()) {
      errors.imageUrl = 'Image URL is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateProduct()) {
      return;
    }

    const userName = localStorage.getItem('userName') || 'Anonymous';
    
    const product = {
      id: marketplaceItems.length + 1,
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      category: newProduct.category,
      seller: userName,
      image: newProduct.imageUrl,
      description: newProduct.description,
    };

    setMarketplaceItems((prev) => [product, ...prev]);
    setIsAddModalOpen(false);
    setNewProduct({
      name: '',
      price: '',
      category: 'Electronics',
      description: '',
      imageUrl: '',
    });
    setFormErrors({});
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Marketplace</h1>
          <p className="text-gray-600">Buy and sell items with your dorm mates</p>
        </div>
        <button
          data-add-product
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-3 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <Link
            key={item.id}
            to={`/marketplace/${item.id}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg">{item.name}</h3>
                <span className="text-lg text-blue-600">${item.price}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {item.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {item.category}
                </span>
                <span className="text-xs text-gray-500">{item.seller}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No items found matching your search.</p>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl">Add New Product</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Add Product Form */}
            <form onSubmit={handleAddProduct} className="space-y-4">
              {/* Product Name */}
              <div>
                <label htmlFor="product-name" className="block text-sm mb-2 text-gray-700">
                  Product Name
                </label>
                <input
                  id="product-name"
                  name="name"
                  type="text"
                  value={newProduct.name}
                  onChange={handleProductChange}
                  placeholder="e.g., Mini Fridge"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                )}
              </div>

              {/* Price */}
              <div>
                <label htmlFor="product-price" className="block text-sm mb-2 text-gray-700">
                  Price
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={handleProductChange}
                    placeholder="0.00"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formErrors.price ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {formErrors.price && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.price}</p>
                )}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="product-category" className="block text-sm mb-2 text-gray-700">
                  Category
                </label>
                <select
                  id="product-category"
                  name="category"
                  value={newProduct.category}
                  onChange={handleProductChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.filter((c) => c !== 'all').map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="product-description" className="block text-sm mb-2 text-gray-700">
                  Description
                </label>
                <textarea
                  id="product-description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleProductChange}
                  placeholder="Describe your product..."
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    formErrors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.description && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="product-image" className="block text-sm mb-2 text-gray-700">
                  Image URL
                </label>
                <input
                  id="product-image"
                  name="imageUrl"
                  type="url"
                  value={newProduct.imageUrl}
                  onChange={handleProductChange}
                  placeholder="https://example.com/image.jpg"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formErrors.imageUrl ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.imageUrl && (
                  <p className="text-red-500 text-sm mt-1">{formErrors.imageUrl}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}