import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  Search, Plus, X, DollarSign, SlidersHorizontal, 
  Upload, Heart, Loader2 
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

export function Marketplace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDorm, setSelectedDorm] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 9;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', price: '', category: 'Electronics', description: '', imageUrl: '', photos: [] as string[],
  });

  const categories = ['all', 'Favorites', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Appliances', 'Accessories', 'Transportation', 'Other'];
  const dormitories = ['all', '1', '2', '3', '4', '5', '6', '7', '8'];

  // 1. Отримання товарів (з токеном для перевірки лайків)
  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await axios.get('http://127.0.0.1:8000/api/products/', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      
      const items = response.data.results || response.data;

      if (Array.isArray(items)) {
        const formattedData = items.map((item: any) => ({
          id: item.id.toString(),
          name: item.title || "Untitled",
          price: parseFloat(item.price) || 0,
          category: item.category || "Other",
          description: item.description || "",
          seller: item.seller || 'Anonymous',
          image: item.image ? (item.image.startsWith('http') ? item.image : `http://127.0.0.1:8000${item.image}`) : 'https://via.placeholder.com/400x300',
          is_favorite: item.is_favorite || false // Це поле прийде з нашого SerializerMethodField
        }));
        
        setMarketplaceItems(formattedData);
        // Оновлюємо масив обраного тими ID, де is_favorite === true
        setFavorites(formattedData.filter(i => i.is_favorite).map(i => i.id));
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load products");
    } finally {
      setIsLoading(false); 
    }
  };

  // 2. Функція кліку по сердечку
  const toggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error("Please login to save favorites");
      return;
    }

    const isCurrentlyFav = favorites.includes(productId);
    
    // Optimistic UI: міняємо колір миттєво
    if (isCurrentlyFav) {
      setFavorites(prev => prev.filter(id => id !== productId));
    } else {
      setFavorites(prev => [...prev, productId]);
    }

    try {
      // Відправляємо на наш новий екшн у Django
      await axios.post(`http://127.0.0.1:8000/api/products/${productId}/favorite/`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success(isCurrentlyFav ? "Removed from favorites" : "Added to favorites");
    } catch (error) {
      // Якщо сервер видав помилку — повертаємо колір назад
      if (isCurrentlyFav) setFavorites(prev => [...prev, productId]);
      else setFavorites(prev => prev.filter(id => id !== productId));
      toast.error("Action failed. Try again.");
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // 3. Логіка фільтрації (враховуючи категорію Favorites)
  const filteredItems = marketplaceItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' ? true :
      selectedCategory === 'Favorites' ? favorites.includes(item.id) :
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    const minPrice = priceRange.min ? parseFloat(priceRange.min) : 0;
    const maxPrice = priceRange.max ? parseFloat(priceRange.max) : Infinity;
    const matchesPrice = item.price >= minPrice && item.price <= maxPrice;

    return matchesSearch && matchesCategory && matchesPrice;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    return parseInt(b.id) - parseInt(a.id);
  });

  const paginatedItems = sortedItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      await axios.post('http://127.0.0.1:8000/api/products/', formData, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Product listed!");
      setIsAddModalOpen(false);
      fetchProducts(); 
    } catch { toast.error("Error adding product"); }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/30">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Marketplace</h1>
          <p className="text-gray-500 font-medium">Find what you need or sell yours</p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-all active:scale-95">
          <Plus className="w-5 h-5" />
          <span>List Product</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col gap-5">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text" placeholder="Search..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`px-5 py-4 rounded-2xl flex items-center gap-2 font-bold transition-all ${showFilters ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filters</span>
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-2 block">Category</label>
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold outline-none">
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-black text-gray-400 uppercase mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} className="w-1/2 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" />
                  <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} className="w-1/2 px-4 py-3 bg-white border border-gray-200 rounded-xl font-bold" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24"><Loader2 className="w-10 h-10 text-blue-600 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {paginatedItems.map((item) => (
            <Link key={item.id} to={`/marketplace/${item.id}`} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all relative flex flex-col">
              <button
                onClick={(e) => toggleFavorite(e, item.id)}
                className="absolute top-5 right-5 z-20 p-3 rounded-2xl bg-white/90 backdrop-blur-md shadow-sm transition-all active:scale-75"
              >
                <Heart className={`w-5 h-5 transition-colors ${favorites.includes(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>

              <div className="h-64 overflow-hidden bg-gray-100">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">{item.name}</h3>
                  <span className="text-2xl font-black text-blue-600">${item.price}</span>
                </div>
                <p className="text-sm text-gray-500 font-medium mb-6 line-clamp-2 leading-relaxed">{item.description}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                   <span>{item.category}</span>
                   <span>Dorm {item.dormitory || '1'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal - без змін дизайну */}
      {isAddModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">List Product</h2>
              <button onClick={() => setIsAddModalOpen(false)}><X className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <input placeholder="Title" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
              <div className="flex gap-4">
                <input placeholder="Price" type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold" />
                <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-bold">
                  {categories.filter(c => c !== 'all' && c !== 'Favorites').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <textarea placeholder="Details" rows={3} value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none font-medium" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-8 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 font-bold uppercase text-xs flex flex-col items-center gap-2">
                <Upload size={24} /> Upload Photo
              </button>
              <input ref={fileInputRef} type="file" className="hidden" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-all">Publish</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}