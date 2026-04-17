import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Search, Plus, X, SlidersHorizontal, 
  Upload, Heart, Loader2, Trash2, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Marketplace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = 'http://127.0.0.1:8000';
  
  // States
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: 'Electronics', description: '',
  });

  const categories = ['all', 'Favorites', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Appliances', 'Accessories', 'Transportation', 'Other'];

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BASE_URL}/api/products/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const items = response.data.results || response.data;

      if (Array.isArray(items)) {
        const formattedData = items.map((item: any) => ({
          id: item.id.toString(),
          seller_id: item.seller_id?.toString(),
          name: item.title || "Untitled",
          price: parseFloat(item.price) || 0,
          category: item.category || "Other",
          description: item.description || "",
          image: item.image ? (item.image.startsWith('http') ? item.image : `${BASE_URL}${item.image}`) : 'https://via.placeholder.com/400x300',
          is_favorite: item.is_favorite || false
        }));
        
        setMarketplaceItems(formattedData);
        setFavorites(formattedData.filter(i => i.is_favorite).map(i => i.id));
      }
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false); 
    }
  };

  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('accessToken');
    if (!token) return toast.error("Please login");

    const isCurrentlyFav = favorites.includes(productId);
    setFavorites(prev => isCurrentlyFav ? prev.filter(id => id !== productId) : [...prev, productId]);

    try {
      await axios.post(`${BASE_URL}/api/products/${productId}/favorite/`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      setFavorites(prev => isCurrentlyFav ? [...prev, productId] : prev.filter(id => id !== productId));
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Filter & Sort Logic
  const filteredItems = marketplaceItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = 
      selectedCategory === 'all' ? true :
      selectedCategory === 'Favorites' ? favorites.includes(item.id) :
      item.category.toLowerCase() === selectedCategory.toLowerCase();
    
    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    
    return matchesSearch && matchesCategory && (item.price >= minPrice && item.price <= maxPrice);
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    // Сортування UUID або ID як рядків (від новіших до старіших)
    return b.id.localeCompare(a.id);
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    formData.append('title', newProduct.name);
    formData.append('price', newProduct.price);
    formData.append('description', newProduct.description);
    formData.append('category', newProduct.category);
    if (fileInputRef.current?.files?.[0]) formData.append('image', fileInputRef.current.files[0]);

    try {
      await axios.post(`${BASE_URL}/api/products/`, formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Product listed!");
      setIsAddModalOpen(false);
      setNewProduct({ name: '', price: '', category: 'Electronics', description: '' });
      fetchProducts(); 
    } catch { toast.error("Error adding product"); }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
      {/* HEADER */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketplace</h1>
          <p className="text-gray-500 font-medium">Your dormitory shop</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)} 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>List Product</span>
        </button>
      </div>

      {/* SEARCH/FILTERS SECTION */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text" 
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className={`px-5 py-4 rounded-2xl flex items-center gap-2 font-bold transition-all ${
              showFilters ? 'bg-blue-600 text-white shadow-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </button>
        </div>

        {/* EXPANDABLE FILTERS */}
        {showFilters && (
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-all">
            {/* Category Filter */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Categories</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      selectedCategory === cat 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Price Range ($)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                />
                <span className="text-gray-300 font-bold">to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none"
                />
              </div>
            </div>

            {/* Sort Order */}
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-wider ml-1">Sort By</label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 font-bold outline-none appearance-none"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ITEMS GRID */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="font-bold text-gray-400">Loading treasures...</p>
        </div>
      ) : sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sortedItems.map((item) => (
            <div key={item.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative flex flex-col">
              
              {/* Actions Overlay */}
              <div className="absolute top-5 right-5 z-20">
                <button
                  onClick={(e) => toggleFavorite(e, item.id)}
                  className="p-3 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm transition-all active:scale-75 hover:bg-white"
                >
                  <Heart className={`w-5 h-5 transition-colors ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>

              <Link to={`/marketplace/${item.id}`} className="flex-1 flex flex-col">
                <div className="h-64 overflow-hidden bg-gray-100">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                </div>
                <div className="p-7 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="text-xl font-bold text-gray-900 truncate leading-tight group-hover:text-blue-600 transition-colors">{item.name}</h3>
                    <span className="text-2xl font-black text-blue-600">${item.price}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-6 leading-relaxed flex-1">{item.description}</p>
                  <div className="mt-auto pt-5 border-t border-gray-50 flex items-center justify-between">
                     <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-500 tracking-widest">{item.category}</span>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-gray-100">
          <p className="text-xl font-bold text-gray-400">No items found matching your filters.</p>
        </div>
      )}

      {/* MODAL ADD PRODUCT (Keep as is but slightly improved styles) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-xl bg-black/30 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-gray-900">List Product</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Product Name</label>
                <input required placeholder="e.g. Mechanical Keyboard" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-500 border-none" />
              </div>
              <div className="flex gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Price ($)</label>
                  <input required placeholder="0.00" type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-none" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Category</label>
                  <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold border-none appearance-none">
                    {categories.filter(c => c !== 'all' && c !== 'Favorites').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Description</label>
                <textarea required placeholder="Tell us about the condition..." rows={3} value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-medium border-none" />
              </div>
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold uppercase text-xs flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-500 transition-all">
                <Upload size={24} /> Upload Photo
              </button>
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" />
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all">Publish Listing</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}