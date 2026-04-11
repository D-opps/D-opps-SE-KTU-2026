import { Link } from 'react-router';
import { WashingMachine, ShoppingBag, MessageSquare, ArrowRight, Users, MessageCircle, Calendar } from 'lucide-react';
import { machines, marketplaceItems, chatMessages } from '../data/mockData';
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

export function Dashboard() {
  const [userRole, setUserRole] = useState<string>('student');
  const [userName, setUserName] = useState<string>('User');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricsPeriod, setMetricsPeriod] = useState(7);

  useEffect(() => {
    // Беремо дані з localStorage (вони там з'являться після логіну/реєстрації)
    const role = localStorage.getItem('userRole') || 'student';
    const name = localStorage.getItem('userName') || 'User';
    setUserRole(role);
    setUserName(name);

    // Перевірка онбордингу
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }

    if (role === 'admin') {
      loadMetrics();
    }
  }, []);

  // Оновлюємо метрики при зміні періоду
  useEffect(() => {
    if (userRole === 'admin') {
      loadMetrics();
    }
  }, [metricsPeriod]);

  // ФУНКЦІЯ ЗАПИТУ ДО DJANGO
  const loadMetrics = async () => {
    try {
      setMetricsLoading(true);
      // Замініть URL на ваш реальний ендпоінт в Django
      const response = await fetch(`http://127.0.0.1:8000/api/metrics/?period=${metricsPeriod}`);
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      } else {
        console.warn('Metrics endpoint not found or error. Using null.');
        setMetrics(null);
      }
    } catch (error) {
      console.error('Error connecting to Django:', error);
      setMetrics(null);
    } finally {
      setMetricsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  // Розрахунок даних з моків (тимчасово)
  const availableMachines = machines.filter((m) => m.status === 'available').length;
  const recentItems = marketplaceItems.slice(0, 3);
  const recentMessages = chatMessages.filter((m) => m.room === 'general').slice(-3);

  const getRoleGreeting = () => {
    switch (userRole) {
      case 'admin': return 'Admin Dashboard';
      case 'doorkeeper': return 'Doorkeeper Dashboard';
      default: return 'Student Dashboard';
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
        <p className="text-gray-600">{getRoleGreeting()}</p>
        {userRole !== 'admin' && (
          <button
            onClick={() => setShowOnboarding(true)}
            className="mt-2 text-sm text-blue-600 hover:underline"
          >
            View tutorial again
          </button>
        )}
      </div>

      {/* Admin Metrics Section */}
      {userRole === 'admin' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">System Metrics</h2>
            <select
              value={metricsPeriod}
              onChange={(e) => setMetricsPeriod(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>

          {metricsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Total Users</p>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalUsers}</p>
                <p className="text-sm text-green-600 mt-1">{metrics.verifiedUsers} verified</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Messages</p>
                  <MessageCircle className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalMessages}</p>
                <p className="text-sm text-blue-600 mt-1">+{metrics.recentMessages} recent</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Listings</p>
                  <ShoppingBag className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalListings}</p>
                <p className="text-sm text-orange-600 mt-1">{metrics.activeListings} active</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">Events</p>
                  <Calendar className="w-5 h-5 text-pink-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.totalEvents}</p>
                <p className="text-sm text-blue-600 mt-1">+{metrics.recentEvents} recent</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              Metrics API not connected. Please check your Django backend.
            </div>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/laundry" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <WashingMachine className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Available Machines</p>
              <p className="text-2xl font-bold text-green-600">{availableMachines}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Check laundry status</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link to="/marketplace" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">New Items</p>
              <p className="text-2xl font-bold text-blue-600">{marketplaceItems.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Browse marketplace</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link to="/chat" className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md border border-gray-100">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Community Chat</p>
              <p className="text-2xl font-bold text-purple-600">Active</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Open chat</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Latest Marketplace</h2>
            <Link to="/marketplace" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentItems.map((item) => (
              <Link key={item.id} to={`/marketplace/${item.id}`} className="flex gap-4 p-3 rounded-lg hover:bg-gray-50">
                <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.seller}</p>
                </div>
                <div className="text-blue-600 font-bold">${item.price}</div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Recent Messages</h2>
            <Link to="/chat" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-4">
            {recentMessages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{msg.sender}</span>
                  <span className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}