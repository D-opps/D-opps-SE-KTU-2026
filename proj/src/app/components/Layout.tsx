import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, WashingMachine, ShoppingBag, MessageSquare, User, LogOut, Calendar, Bell, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/laundry', icon: WashingMachine, label: 'Laundry' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
    { path: '/chat', icon: MessageSquare, label: 'Chat', badge: unreadCount },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getRoleBadgeColor = () => {
    switch (userRole) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'doorkeeper': return 'bg-green-100 text-green-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <aside className="w-20 lg:w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <h1 className="text-blue-600 text-xl lg:text-2xl font-bold hidden lg:block">DormLife</h1>
          <div className="text-blue-600 text-2xl lg:hidden text-center font-bold">DL</div>
          {/* Role Badge */}
          <div className={`mt-2 px-2 py-1 rounded text-[10px] text-center uppercase font-bold hidden lg:block ${getRoleBadgeColor()}`}>
            {userRole}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 lg:p-4 overflow-y-auto">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all relative ${
                      active
                        ? 'bg-blue-50 text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="hidden lg:inline font-medium">{item.label}</span>
                    
                    {/* Badge Rendering */}
                    {item.badge !== undefined && item.badge > 0 && (
                      <>
                        <span className="hidden lg:flex absolute right-4 w-5 h-5 bg-red-500 text-white text-[10px] items-center justify-center font-bold rounded-full">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                        <span className="lg:hidden absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                      </>
                    )}
                  </Link>
                </li>
              );
            })}

            {/* Доданий пункт "Скарги" тільки для адмінів */}
            {userRole === 'admin' && (
              <li>
                <Link
                  to="/admin/reports"
                  className={`flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg transition-all ${
                    isActive('/admin/reports')
                      ? 'bg-blue-50 text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-blue-500'
                  }`}
                >
                  <Flag className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline font-medium">Complaints</span>
                </Link>
              </li>
            )}
          </ul>
        </nav>

        {/* Logout Button */}
        <div className="p-2 lg:p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 lg:px-4 py-3 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="hidden lg:inline font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}