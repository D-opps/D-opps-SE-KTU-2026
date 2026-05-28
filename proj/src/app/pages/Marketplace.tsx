import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Plus, SlidersHorizontal,
  Upload, Heart, Loader2, X
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

type MarketplaceItem = {
  id: string;
  seller_id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
  is_favorite: boolean;
  is_used: boolean;
};

const DB_CATEGORIES = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'furniture', name: 'Furniture' },
  { id: 'books', name: 'Books' },
  { id: 'clothing', name: 'Clothing' },
  { id: 'appliances', name: 'Appliances' },
  { id: 'other', name: 'Other' }
];

const FILTER_CATEGORIES = ['All', 'Favorites', 'Electronics', 'Furniture', 'Books', 'Clothing', 'Appliances', 'Other'];

export function Marketplace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = 'http://127.0.0.1:8000';

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'electronics', 
    description: '',
    is_used: false,
  });

  const [preview, setPreview] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const res = await axios.get(`${BASE_URL}/api/products/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = res.data.results || res.data;

      const formatted: MarketplaceItem[] = Array.isArray(data) ? data.map((item: any) => ({
        id: item.id.toString(),
        seller_id: item.seller_id?.toString(),
        name: item.title || '',
        price: Number(item.price) || 0,
        category: item.category || 'Other',
        description: item.description || '',
        image: item.image?.startsWith('http')
          ? item.image
          : `${BASE_URL}${item.image || ''}`,
        is_favorite: item.is_favorite || false,
        is_used: item.is_used || false,
      })) : [];

      setItems(formatted);
      setFavorites(formatted.filter(i => i.is_favorite).map(i => i.id));

    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();

    const token = localStorage.getItem('accessToken');
    if (!token) return toast.error('Login required');

    const isFav = favorites.includes(id);

    setFavorites(prev =>
      isFav ? prev.filter(x => x !== id) : [...prev, id]
    );

    try {
      await axios.post(`${BASE_URL}/api/products/${id}/favorite/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch {
      toast.error('Error updating favorite');
    }
  };

  const filtered = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      category === 'All'
        ? true
        : category === 'Favorites'
          ? favorites.includes(item.id)
          : item.category.toLowerCase() === category.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const handleImageChange = (file?: File) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem('accessToken');
    if (!token) {
      toast.error('You must be logged in');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.name);
    formData.append('price', form.price);
    const cleanCategory = form.category.replace(/^["']|["']$/g, '').trim();
    formData.append('category', cleanCategory);
    formData.append('description', form.description);
    formData.append('is_used', String(form.is_used));

    if (fileInputRef.current?.files?.[0]) {
      formData.append('image', fileInputRef.current.files[0]);
    }

    try {
      await axios.post(`${BASE_URL}/api/products/`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Item created!');
      setIsModalOpen(false);
      setForm({
        name: '',
        price: '',
        category: 'electronics',
        description: '',
        is_used: false,
      });
      setPreview(null);

      fetchItems();

    } catch (err: any) {
      console.error('Server response error:', err.response?.data);
      
      if (err.response?.data) {
        const errors = Object.entries(err.response.data)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
        toast.error(`Error: ${errors}`);
      } else {
        toast.error('Failed to create item');
      }
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-black">Marketplace</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex gap-2"
        >
          <Plus size={18} /> Add item
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          className="flex-1 p-3 bg-gray-100 rounded-xl"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-3 bg-gray-100 rounded-xl"
        >
          <SlidersHorizontal />
        </button>
      </div>

      {showFilters && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {FILTER_CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1 rounded-xl ${
                category === c ? 'bg-blue-600 text-white' : 'bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : (
        <>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No products found.</div>
          ) : (
            <div className="grid grid-cols-3 gap-6">
              {filtered.map(item => (
                <Link key={item.id} to={`/marketplace/${item.id}`} className="bg-white rounded-2xl overflow-hidden border relative block hover:shadow-md transition">
                  {item.is_used && (
                    <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded z-10">
                      USED
                    </span>
                  )}

                  <img src={item.image} className="h-56 w-full object-cover" alt={item.name} />

                  <div className="p-4">
                    <h3 className="font-bold text-gray-900">{item.name}</h3>
                    <p className="text-blue-600 font-black">${item.price}</p>
                  </div>

                  <button
                    onClick={(e) => toggleFavorite(e, item.id)}
                    className="absolute top-3 right-3 z-10 p-1 bg-white/80 rounded-full backdrop-blur-sm"
                  >
                    <Heart className={favorites.includes(item.id) ? "fill-red-500 text-red-500" : "text-gray-600"} size={20} />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleSubmit} className="bg-white w-[420px] p-6 rounded-2xl space-y-4 shadow-xl">

            <div className="flex justify-between items-center">
              <h2 className="font-bold text-xl">Create item</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl"
              required
            />

            <input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl"
              required
            />

            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 pl-1">Select Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full p-3 bg-gray-100 rounded-xl cursor-pointer"
              >
                {DB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl h-24 resize-none"
              required
            />

            <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_used}
                onChange={(e) => setForm({ ...form, is_used: e.target.checked })}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              This is a used item
            </label>

            <div className="border-2 border-dashed p-4 rounded-xl text-center border-gray-300 hover:border-blue-500 transition">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 mx-auto text-gray-500 font-medium hover:text-blue-600 transition"
              >
                <Upload size={18} /> Upload image
              </button>

              {preview && (
                <img src={preview} className="mt-3 rounded-xl h-40 w-full object-cover mx-auto shadow-sm" alt="Preview" />
              )}
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
              Publish
            </button>

          </form>
        </div>
      )}

    </div>
  );
}