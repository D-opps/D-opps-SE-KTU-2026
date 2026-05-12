import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, WashingMachine, ShoppingBag, MessageSquare, User, LogOut, Calendar, Bell, Flag, TrendingUp, ShieldCheck } from 'lucide-react';
import { useUser } from '../pages/UserContext'; // Імпортуємо наш хук

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useUser(); // Отримуємо роль з контексту

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login'; // Повний релоад при виході для очищення стану
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/laundry', icon: WashingMachine, label: 'Laundry' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/chat', icon: MessageSquare, label: 'Chat' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/notifications', icon: Bell, label: 'Notifications' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const adminItems = [
    { path: '/admin/reports', icon: Flag, label: 'Complaints' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Statistics' },
  ];


  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  const getRoleBadgeColor = () => {
    if (userRole === 'admin') return 'bg-purple-100 text-purple-700 border-purple-200';
    if (userRole === 'doorkeeper') return 'bg-green-100 text-green-700 border-green-200';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col z-20">
        <div className="p-4 lg:p-6 border-b border-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">D</div>
            <h1 className="text-gray-900 text-xl font-black hidden lg:block tracking-tight">DormLife</h1>
          </div>
          <div className={`mt-3 px-3 py-0.5 rounded-full text-[10px] uppercase font-black border hidden lg:block text-center ${getRoleBadgeColor()}`}>
            {userRole}
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'}`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:inline font-semibold">{item.label}</span>
                  </Link>
                </li>
              );
            })}

            {userRole === 'admin' && adminItems.map(item => (
                <li key={item.path}>
                    <Link to={item.path} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="hidden lg:inline font-semibold">{item.label}</span>
                    </Link>
                </li>
            ))}

            
          </ul>
        </nav>

        <div className="p-3 border-t">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:inline font-bold">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}