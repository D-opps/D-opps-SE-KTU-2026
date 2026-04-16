import { Link } from 'react-router';
import { 
  WashingMachine, ShoppingBag, MessageSquare, Users, 
  MessageCircle, Calendar, MessageSquare as ChatIcon, TrendingUp, Loader2, Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';

// --- Interfaces ---
interface Metrics {
  totalUsers: number;
  verifiedUsers: number;
  totalMessages: number;
  recentMessages: number;
  totalListings: number;
  activeListings: number;
  totalEvents: number;
  recentEvents: number;
}

interface Machine {
  id: number;
  status: 'free' | 'occupied' | 'out-of-order'; // Змінено під твій Django models.py
}

interface ChatMessage {
  id: number;
  sender_name: string;
  text: string;
  timestamp: string;
}

export function Dashboard() {
  const [userRole, setUserRole] = useState<string>(localStorage.getItem('userRole') || 'student');
  const [userName, setUserName] = useState<string>(localStorage.getItem('userName') || 'User');
  
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [metricsPeriod, setMetricsPeriod] = useState(7);

  const token = localStorage.getItem('accessToken');

  useEffect(() => {
    // 1. Спочатку беремо те, що є в пам'яті
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);

    // 2. Оновлюємо дані з сервера
    fetchAllData();
  }, [metricsPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      const [metricsRes, machinesRes, messagesRes, profileRes] = await Promise.all([
        fetch(`http://127.0.0.1:8000/api/metrics/?period=${metricsPeriod}`, { headers }),
        fetch(`http://127.0.0.1:8000/api/machines/`, { headers }),
        fetch(`http://127.0.0.1:8000/api/recent_messages/`, { headers }), // Твій новий ендпоінт
        fetch(`http://127.0.0.1:8000/api/profile/`, { headers }) // ДЛЯ ПЕРЕВІРКИ РОЛІ
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (machinesRes.ok) setMachines(await machinesRes.json());
      if (messagesRes.ok) setMessages(await messagesRes.json());
      
      // СИНХРОНІЗАЦІЯ РОЛІ
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        const realRole = profileData.profile.role;
        const realName = profileData.profile.first_name;
        
        if (realRole !== userRole) {
          setUserRole(realRole);
          localStorage.setItem('userRole', realRole);
        }
        setUserName(realName);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Рахуємо вільні машинки (статус 'free' з твого models.py)
  const availableMachinesCount = machines.filter((m) => m.status === 'free').length;

  if (loading && !metrics) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
            {userRole}
          </span>
          <h1 className="text-4xl font-black mt-4 mb-2">Hey, {userName}! 👋</h1>
          <p className="text-blue-100 text-lg opacity-90">Welcome back to your dormitory portal.</p>
        </div>
        <Zap className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-white/10 rotate-12" />
      </div>

      {/* ADMIN ANALYTICS - Показуємо тільки якщо роль admin */}
      {userRole === 'admin' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <TrendingUp className="text-blue-600" /> System Analytics
            </h2>
            <select
              value={metricsPeriod}
              onChange={(e) => setMetricsPeriod(Number(e.target.value))}
              className="bg-white border-none shadow-sm rounded-xl px-4 py-2 font-bold text-sm"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last Month</option>
            </select>
          </div>
          
          {metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard title="Total Users" value={metrics.totalUsers} sub={metrics.verifiedUsers} label="Verified" icon={<Users />} color="blue" />
              <MetricCard title="Chat Activity" value={metrics.totalMessages} sub={metrics.recentMessages} label="New" icon={<MessageCircle />} color="purple" />
              <MetricCard title="Marketplace" value={metrics.totalListings} sub={metrics.activeListings} label="Active" icon={<ShoppingBag />} color="green" />
              <MetricCard title="Events" value={metrics.totalEvents} sub={metrics.recentEvents} label="Upcoming" icon={<Calendar />} color="pink" />
            </div>
          )}
        </section>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DashboardCard to="/laundry" title="Laundry Room" value={`${availableMachinesCount} Free`} desc="Check machines availability" icon={<WashingMachine />} color="bg-emerald-50 text-emerald-600" />
        <DashboardCard to="/chat" title="Community Chat" value="Active" desc="Talk with neighbors" icon={<ChatIcon />} color="bg-purple-50 text-purple-600" />
      </div>

      {/* RECENT MESSAGES FEED */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <h2 className="text-xl font-black mb-6">Community Buzz</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {messages.length > 0 ? messages.map((msg) => (
            <div key={msg.id} className="p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                  {msg.sender_name[0]}
                </div>
                <span className="text-sm font-bold">{msg.sender_name}</span>
                <span className="text-[10px] text-gray-400 ml-auto">{msg.timestamp}</span>
              </div>
              <p className="text-sm text-gray-600 italic">"{msg.text}"</p>
            </div>
          )) : (
            <div className="col-span-3 text-center py-10 text-gray-400">No recent messages yet</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Помічники (Cards)
function MetricCard({ title, value, sub, label, icon, color }: any) {
    const colors: any = {
      blue: "text-blue-600 bg-blue-50",
      purple: "text-purple-600 bg-purple-50",
      green: "text-green-600 bg-green-50",
      pink: "text-pink-600 bg-pink-50"
    };
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
          <span className="text-[10px] font-black uppercase text-gray-400">{title}</span>
        </div>
        <p className="text-3xl font-black text-gray-900 mb-1">{value}</p>
        <div className="flex items-center gap-1 text-sm font-bold">
          <span className="text-green-600">+{sub}</span>
          <span className="text-gray-400">{label}</span>
        </div>
      </div>
    );
}

function DashboardCard({ to, title, value, desc, icon, color }: any) {
    return (
      <Link to={to} className="group bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:border-blue-200 transition-all hover:shadow-lg">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${color}`}>
          {icon}
        </div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-2xl font-black text-gray-900 mb-2">{value}</p>
        <p className="text-sm text-gray-400">{desc}</p>
      </Link>
    );
}