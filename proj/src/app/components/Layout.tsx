import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, WashingMachine, ShoppingBag, MessageSquare, 
  User, LogOut, Calendar, Bell, Flag, TrendingUp 
} from 'lucide-react';
import { useState, useEffect } from 'react';

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string>('student');
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'student';
    setUserRole(role);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Базові пункти меню для всіх
  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/laundry', icon: WashingMachine, label: 'Laundry' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/chat', icon: MessageSquare, label: 'Chat', badge: unreadCount },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  // Додаткові пункти лише для адміна
  const adminItems = [
    { path: '/admin/reports', icon: Flag, label: 'Complaints' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Statistics' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'doorkeeper': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  // Компонент для рендерингу одного пункту меню
  const NavLink = ({ item }: { item: any }) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    
    return (
      <li>
        <Link
          to={item.path}
          className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-xl transition-all relative group ${
            active
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'text-gray-500 hover:bg-gray-100 hover:text-blue-600'
          }`}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'animate-pulse' : ''}`} />
          <span className="hidden lg:inline font-semibold">{item.label}</span>
          
          {item.badge !== undefined && item.badge > 0 && (
            <span className={`absolute right-2 lg:right-4 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
              active ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
            }`}>
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col z-20 shadow-sm">
        {/* Logo Section */}
        <div className="p-4 lg:p-6 border-b border-gray-50 flex flex-col items-center lg:items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">D</div>
            <h1 className="text-gray-900 text-xl font-black hidden lg:block tracking-tight">DormLife</h1>
          </div>
          <div className={`mt-3 px-3 py-0.5 rounded-full text-[10px] uppercase font-black border hidden lg:block ${getRoleBadgeColor()}`}>
            {userRole}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
          <ul className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase px-4 mb-2 hidden lg:block tracking-widest">Main Menu</p>
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}

            {userRole === 'admin' && (
              <>
                <div className="my-4 border-t border-gray-100 mx-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase px-4 mb-2 hidden lg:block tracking-widest">Administration</p>
                {adminItems.map((item) => (
                  <NavLink key={item.path} item={item} />
                ))}
              </>
            )}
          </ul>
        </nav>

        {/* Footer / Logout */}
        <div className="p-3 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 lg:px-4 py-3 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0 group-hover:-translate-x-1 transition-transform" />
            <span className="hidden lg:inline font-bold">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-[#F8FAFC]">
        <div className="min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}