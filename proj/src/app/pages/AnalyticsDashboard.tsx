import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, ShoppingBag, MessageSquare, TrendingUp, 
  ShieldAlert, WashingMachine, AlertTriangle, Bell 
} from 'lucide-react';

// --- Інтерфейс для отриманих даних від Django API ---
interface DashboardMetrics {
  total_users: number;
  signups_today: number;
  total_listings: number;
  listings_today: number;
  
  // Нові поля, які ми тягнемо з Conversation та Message
  total_conversations: number;
  messages_today: number;
  active_chats_today?: number; // На випадок використання старого логу подій

  // Додаткові моделі з admin.py
  total_machines: number;
  free_machines: number;
  total_reports: number;
  pending_reports: number;
  total_notifications: number;
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        
        // Якщо токена взагалі немає в браузері — одразу блокуємо
        if (!token) {
          setError("Unauthorized: Please log in as an Admin.");
          return;
        }

        // Робимо запит на правильний ендпоінт
        const response = await axios.get<DashboardMetrics>('http://127.0.0.1:8000/api/admin/metrics/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMetrics(response.data);
      } catch (err: any) {
        console.error("API Error:", err);
        if (err.response && (err.response.status === 403 || err.response.status === 401)) {
          setError("Access Denied: Only administrators can view this dashboard.");
        } else {
          setError("Failed to load metrics. Please try again later.");
        }
      }
    };
    
    fetchMetrics();
  }, []);

  // Якщо сталася помилка доступу (наприклад, зайшов звичайний студент)
  if (error) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center gap-4 min-h-[50vh]">
        <ShieldAlert size={64} className="text-red-500 animate-pulse" />
        <h2 className="text-2xl font-black text-gray-800">Restricted Access</h2>
        <p className="text-gray-500 max-w-md">{error}</p>
      </div>
    );
  }

  // Поки дані вантажаться
  if (!metrics) return <div className="p-10 text-center font-bold text-gray-400">Loading Metrics...</div>;

  // Компонент картки з чіткими типами пропсів
  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: number | string; icon: any; color: string }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-all">
      <div className={`p-4 rounded-2xl ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      
      {/* ЗАГОЛОВОК СТОРІНКИ */}
      <h1 className="text-3xl font-black mb-8 flex items-center gap-3">
        <TrendingUp className="text-blue-600" /> Platform Growth & Statistics
      </h1>

      {/* ОСНОВНА СІТКА КАРТОК АНАЛІТИКИ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* КАРТКИ КОРИСТУВАЧІВ */}
        <StatCard 
          title="Total Residents" 
          value={metrics.total_users} 
          icon={Users} 
          color="bg-blue-600" 
        />
        <StatCard 
          title="Signups (Today)" 
          value={metrics.signups_today} 
          icon={TrendingUp} 
          color="bg-orange-500" 
        />
        
        {/* КАРТКИ МАРКЕТПЛЕЙСУ */}
        <StatCard 
          title="Marketplace Size" 
          value={metrics.total_listings} 
          icon={ShoppingBag} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="New Listings (Today)" 
          value={metrics.listings_today} 
          icon={ShoppingBag} 
          color="bg-pink-500" 
        />

        {/* КАРТКИ СТАНУ ПРАЛЬНІ (Модель Machine з вашої адмінки) */}
        <StatCard 
          title="Laundry Units" 
          value={`${metrics.free_machines} Free / ${metrics.total_machines}`} 
          icon={WashingMachine} 
          color="bg-teal-600" 
        />

        {/* КАРТКА МОДЕРАЦІЇ ТА СКАРГ (Модель Report з вашої адмінки) */}
        <StatCard 
          title="Active Reports" 
          value={metrics.pending_reports} 
          icon={AlertTriangle} 
          color={metrics.pending_reports > 0 ? "bg-rose-500 animate-pulse" : "bg-slate-500"} 
        />

        {/* СИСТЕМНІ СПОВІЩЕННЯ (Модель Notification з вашої адмінки) */}
        <StatCard 
          title="Total Notifications" 
          value={metrics.total_notifications} 
          icon={Bell} 
          color="bg-cyan-600" 
        />

      </div>
    </div>
  );
}