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

export function Marketplace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const BASE_URL = 'http://127.0.0.1:8000';

  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Electronics',
    description: '',
    is_used: false,
  });

  const [preview, setPreview] = useState<string | null>(null);

  const categories = [
    'all', 'Favorites', 'Electronics', 'Furniture',
    'Books', 'Clothing', 'Appliances', 'Other'
  ];

  const fetchItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');

      const res = await axios.get(`${BASE_URL}/api/products/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      const data = res.data.results || res.data;

      const formatted: MarketplaceItem[] = data.map((item: any) => ({
        id: item.id.toString(),
        seller_id: item.seller_id?.toString(),
        name: item.title,
        price: Number(item.price),
        category: item.category || 'Other',
        description: item.description,
        image: item.image?.startsWith('http')
          ? item.image
          : `${BASE_URL}${item.image}`,
        is_favorite: item.is_favorite || false,
        is_used: item.is_used || false,
      }));

      setItems(formatted);
      setFavorites(formatted.filter(i => i.is_favorite).map(i => i.id));

    } catch {
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
      category === 'all'
        ? true
        : category === 'Favorites'
          ? favorites.includes(item.id)
          : item.category === category;

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

    const formData = new FormData();
    formData.append('title', form.name);
    formData.append('price', form.price);
    formData.append('category', form.category);
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
        category: 'Electronics',
        description: '',
        is_used: false,
      });
      setPreview(null);

      fetchItems();

    } catch {
      toast.error('Failed to create item');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-black">Marketplace</h1>

        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex gap-2"
        >
          <Plus size={18} /> Add item
        </button>
      </div>

      {/* SEARCH */}
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

      {/* FILTERS */}
      {showFilters && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {categories.map(c => (
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

      {/* LIST */}
      {loading ? (
        <Loader2 className="animate-spin mx-auto" />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filtered.map(item => (
            <Link key={item.id} to={`/marketplace/${item.id}`} className="bg-white rounded-2xl overflow-hidden border relative">

              {item.is_used && (
                <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded">
                  USED
                </span>
              )}

              <img src={item.image} className="h-56 w-full object-cover" />

              <div className="p-4">
                <h3 className="font-bold">{item.name}</h3>
                <p className="text-blue-600 font-black">${item.price}</p>
              </div>

              <button
                onClick={(e) => toggleFavorite(e, item.id)}
                className="absolute top-3 right-3"
              >
                <Heart className={favorites.includes(item.id) ? "fill-red-500 text-red-500" : ""} />
              </button>

            </Link>
          ))}
        </div>
      )}

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">

          <form onSubmit={handleSubmit} className="bg-white w-[420px] p-6 rounded-2xl space-y-4">

            <div className="flex justify-between">
              <h2 className="font-bold text-xl">Create item</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X />
              </button>
            </div>

            <input
              placeholder="Item name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl"
            />

            <input
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl"
            />

            <textarea
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full p-3 bg-gray-100 rounded-xl"
            />

            {/* USED TOGGLE */}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_used}
                onChange={(e) =>
                  setForm({ ...form, is_used: e.target.checked })
                }
              />
              This is a used item
            </label>

            {/* IMAGE UPLOAD */}
            <div className="border-2 border-dashed p-4 rounded-xl text-center">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleImageChange(e.target.files?.[0])}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 mx-auto text-gray-500"
              >
                <Upload /> Upload image
              </button>

              {preview && (
                <img src={preview} className="mt-3 rounded-xl h-40 object-cover mx-auto" />
              )}
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">
              Publish
            </button>

          </form>

        </div>
      )}

    </div>
  );
}