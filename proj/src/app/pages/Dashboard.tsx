import { Link } from 'react-router';
import { 
  WashingMachine, ShoppingBag, MessageSquare, ArrowRight, 
  Users, MessageCircle, Activity, TrendingUp
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { OnboardingModal } from '../components/OnboardingModal';

// Типізація для метрик (якщо ви адмін)
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

// --- Interfaces ---
interface StatItem { label: string; value: number; }
interface MetricsResponse { stats: StatItem[]; }

export function Dashboard() {
  const [userRole, setUserRole] = useState<string>('student');
  const [userName, setUserName] = useState<string>('User');
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsPeriod, setMetricsPeriod] = useState(7);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('accessToken');

  const fetchMetrics = async () => {
    try {
      if (localStorage.getItem('userRole') === 'admin') {
        const response = await fetch(`http://127.0.0.1:8000/api/metrics/?period=${metricsPeriod}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) setMetrics(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || 'student');
    setUserName(localStorage.getItem('userName') || 'User');
    fetchMetrics();
  }, [metricsPeriod]);

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto bg-[#f8fafc] min-h-screen">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Welcome back, {userName}!</h1>
          <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            {userRole === 'admin' ? 'Administrator Portal' : 'Student Dashboard'} • Dormitory #1
          </p>
        </div>
        
        <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
          <select 
            value={metricsPeriod}
            onChange={(e) => setMetricsPeriod(Number(e.target.value))}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold outline-none cursor-pointer hover:bg-slate-800 transition-colors"
          >
            <option value={7}>Last 7 Days</option>
            <option value={30}>Last 30 Days</option>
            <option value={90}>Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Top Metrics Grid (System Stats) */}
      {userRole === 'admin' && metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {metrics.stats.map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                {i === 0 ? <Users size={90} /> : i === 1 ? <ShoppingBag size={90} /> : <MessageCircle size={90} />}
              </div>
              
              {/* Force English Labels for Stats */}
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {i === 0 ? 'Total Students' : i === 1 ? 'Active Ads' : 'Daily Messages'}
              </p>
              
              <div className="flex items-end gap-3 mt-3">
                <h3 className="text-5xl font-black text-slate-900">{stat.value}</h3>
                <span className="text-green-500 font-bold text-sm mb-2 flex items-center gap-1">
                  <TrendingUp size={16} /> Live
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Navigation Cards (Bento Style) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Laundry Card */}
        <Link to="/laundry" className="group relative bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-[2.5rem] shadow-xl shadow-emerald-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="relative z-10 text-white">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <WashingMachine className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Laundry Room</h3>
            <p className="text-emerald-50/80 text-sm font-medium mb-8 leading-relaxed">
              Check machine status and book your slot instantly.
            </p>
            <div className="flex items-center gap-2 font-bold text-sm bg-white/20 w-fit px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white group-hover:text-emerald-600 transition-all">
              Check Status <ArrowRight size={16} />
            </div>
          </div>
          <WashingMachine className="absolute -bottom-10 -right-10 text-white/10 rotate-12" size={240} />
        </Link>

        {/* Marketplace Card */}
        <Link to="/marketplace" className="group relative bg-gradient-to-br from-blue-500 to-indigo-600 p-8 rounded-[2.5rem] shadow-xl shadow-blue-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="relative z-10 text-white">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <ShoppingBag className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Marketplace</h3>
            <p className="text-blue-50/80 text-sm font-medium mb-8 leading-relaxed">
              Find deals or sell items to your dorm community.
            </p>
            <div className="flex items-center gap-2 font-bold text-sm bg-white/20 w-fit px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white group-hover:text-blue-600 transition-all">
              Explore Shop <ArrowRight size={16} />
            </div>
          </div>
          <ShoppingBag className="absolute -bottom-10 -right-10 text-white/10 rotate-12" size={240} />
        </Link>

        {/* Chat Card */}
        <Link to="/chat" className="group relative bg-gradient-to-br from-purple-500 to-fuchsia-600 p-8 rounded-[2.5rem] shadow-xl shadow-purple-200/40 hover:-translate-y-2 transition-all duration-300 overflow-hidden">
          <div className="relative z-10 text-white">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
              <MessageSquare className="text-white" size={32} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Dorm Chat</h3>
            <p className="text-purple-50/80 text-sm font-medium mb-8 leading-relaxed">
              Chat with residents and stay up to date.
            </p>
            <div className="flex items-center gap-2 font-bold text-sm bg-white/20 w-fit px-5 py-2.5 rounded-full backdrop-blur-sm border border-white/10 group-hover:bg-white group-hover:text-purple-600 transition-all">
              Open Chat <ArrowRight size={16} />
            </div>
          </div>
          <MessageSquare className="absolute -bottom-10 -right-10 text-white/10 rotate-12" size={240} />
        </Link>

      </div>
    </div>
  );
}