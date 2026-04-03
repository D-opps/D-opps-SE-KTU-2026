import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { Search, Plus, X, DollarSign, SlidersHorizontal, Upload } from 'lucide-react';
import axios from 'axios';

export function Marketplace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for Data
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for UI/Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDorm, setSelectedDorm] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  // States for Modal/Form
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    imageUrl: '',
    dormVisibility: 'all' as 'all' | 'own-dorm',
    photos: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const categories = ['all', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Appliances', 'Accessories', 'Transportation', 'Other'];
  const dormitories = ['all', '1', '2', '3', '4', '5', '6', '7', '8'];

  // --- DATA FETCHING ---
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('http://127.0.0.1:8000/api/products/');
      
      const items = response.data.results || response.data;

      if (Array.isArray(items)) {
        const formattedData = items.map((item: any) => {
          // Default placeholder image
          let imageUrl = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop';
          
          // SAFE CHECK: Check if photos exists AND has at least one item AND that item has an image property
          if (item.photos && item.photos.length > 0 && item.photos[0].image) {
            const photoPath = item.photos[0].image;
            // Now we check startsWith safely
            imageUrl = photoPath.startsWith('http') ? photoPath : `http://127.0.0.1:8000${photoPath}`;
          }

          return {
            id: item.id.toString(),
            name: item.title || "Untitled Product", 
            price: parseFloat(item.price) || 0,
            category: item.category || "Other",
            description: item.description || "",
            seller: item.seller || 'Anonymous',
            image: imageUrl,
            dormitory: "all" // Hardcoded for now to bypass your dorm filter
          };
        });
        
        setMarketplaceItems(formattedData);
      }
    } catch (error) {
      console.error("Connection Failed:", error);
    } finally {
      setIsLoading(false); 
    }
  };


  // Trigger fetch on load
  useEffect(() => {
    fetchProducts();
  }, []);

  // --- LOGIC ---
  // Replace your entire filteredItems logic with this:

  const filteredItems = marketplaceItems.filter((item) => {
    // 1. Search filter (works on name and description)
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Category filter (handle case sensitivity)
    const matchesCategory = 
      selectedCategory === 'all' || 
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    
    // 3. Price filter
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = item.price >= minPrice && item.price <= maxPrice;

    // 4. Dorm filter (Neutralized for now to ensure items show)
    const matchesDorm = true; 

    return matchesSearch && matchesCategory && matchesPrice && matchesDorm;
  });


    const sortedItems = [...filteredItems].sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        case 'newest':
        default: return parseInt(b.id) - parseInt(a.id);
      }
    });

  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = () => setCurrentPage(1);

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateProduct = () => {
    const errors: Record<string, string> = {};
    if (!newProduct.name.trim()) errors.name = 'Product name is required';
    if (!newProduct.price || parseFloat(newProduct.price) <= 0) errors.price = 'Please enter a valid price';
    if (!newProduct.description.trim()) errors.description = 'Description is required';

    const hasFile = fileInputRef.current?.files && fileInputRef.current.files.length > 0;
    const hasUrl = newProduct.imageUrl.trim().length > 0;
    if (!hasFile && !hasUrl) errors.imageUrl = 'Upload a photo OR provide an image URL';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateProduct()) return;

    const formData = new FormData();
    formData.append('title', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('description', newProduct.description);
    formData.append('category', newProduct.category.toLowerCase());
    
    const visibilityMap = { 'all': 'all_dorms', 'own-dorm': 'my_dorm' };
    formData.append('visibility', visibilityMap[newProduct.dormVisibility] || 'all_dorms');

    if (fileInputRef.current?.files?.[0]) {
      formData.append('photos', fileInputRef.current.files[0]); 
    }

    try {
      await axios.post('http://127.0.0.1:8000/api/products/', formData);
      alert("Product successfully added!");
      setIsAddModalOpen(false);
      setNewProduct({ 
        name: '', price: '', category: 'Electronics', 
        description: '', imageUrl: '', dormVisibility: 'all', photos: [] 
      });
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      alert("Error: " + JSON.stringify(error.response?.data || error.message));
    }
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
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Product</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); handleFilterChange(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Dormitory</label>
                <select
                  value={selectedDorm}
                  onChange={(e) => { setSelectedDorm(e.target.value); handleFilterChange(); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dormitories.map((dorm) => (
                    <option key={dorm} value={dorm}>{dorm === 'all' ? 'All Dorms' : `Dorm ${dorm}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm mb-2 text-gray-700">Price Range</label>
                <div className="flex gap-2">
                  <input
                    type="number" placeholder="Min" value={priceRange.min}
                    onChange={(e) => { setPriceRange({ ...priceRange, min: e.target.value }); handleFilterChange(); }}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number" placeholder="Max" value={priceRange.max}
                    onChange={(e) => { setPriceRange({ ...priceRange, max: e.target.value }); handleFilterChange(); }}
                    className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t">
            <p className="text-sm text-gray-600">{sortedItems.length} items found</p>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Items Grid / Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-500">Connecting to database...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {paginatedItems.map((item) => (
            <Link
              key={item.id}
              to={`/marketplace/${item.id}`}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
            >
              <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium">{item.name}</h3>
                  <span className="text-lg text-blue-600 font-semibold">${item.price}</span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-1">{item.description}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{item.category}</span>
                  <span className="text-xs text-gray-500">{item.seller}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && paginatedItems.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No items found matching your filters.</p>
        </div>
      )}

      {/* Pagination omitted for brevity, same as your original */}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Add New Product</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm mb-1 text-gray-700">Product Name</label>
                <input
                  name="name" type="text" value={newProduct.name} onChange={handleProductChange}
                  placeholder="e.g., Mini Fridge"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Price</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    name="price" type="number" step="0.01" value={newProduct.price} onChange={handleProductChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.price ? 'border-red-500' : 'border-gray-300'}`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Category</label>
                <select
                  name="category" value={newProduct.category} onChange={handleProductChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {categories.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Description</label>
                <textarea
                  name="description" value={newProduct.description} onChange={handleProductChange}
                  rows={3} className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 ${formErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-700">Photos</label>
                <div className="space-y-3">
                  <button
                    type="button" onClick={() => fileInputRef.current?.click()}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 flex items-center justify-center gap-2 text-gray-500"
                  >
                    <Upload className="w-5 h-5" /> <span>Upload File</span>
                  </button>
                  <input
                    ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setNewProduct(p => ({ ...p, photos: [reader.result as string] }));
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {newProduct.photos.length > 0 && (
                    <div className="relative w-24 h-24">
                      <img src={newProduct.photos[0]} className="w-full h-full object-cover rounded-lg border" alt="Preview" />
                      <button type="button" onClick={() => setNewProduct(p => ({ ...p, photos: [] }))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 px-4 py-3 border rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">Add Item</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}