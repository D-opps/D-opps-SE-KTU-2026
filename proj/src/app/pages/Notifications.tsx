import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Gift, Calendar, Filter } from 'lucide-react';
import axios from 'axios';

// Інтерфейс підлаштований під відповідь від Django
interface Notification {
  id: number;
  notification_type: 'message' | 'offer' | 'event' | 'system';
  title: string;
  description: string;
  target_id: string | null;
  is_read: boolean;
  created_at: string;
}

export function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Функція для безпечного відображення часу сповіщення
const formatTime = (dateString: string | null | undefined) => {
  if (!dateString) return '—';

  const parsedDate = new Date(dateString);
  if (isNaN(parsedDate.getTime())) return '—';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const itemDate = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate());
  
  // Форматуємо час: "23:30"
  const timeStr = parsedDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // Логіка перевірки Сьогодні / Вчора англійською
  if (itemDate.getTime() === today.getTime()) {
    return `Today, ${timeStr}`;
  } else if (itemDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeStr}`;
  } else {
    // Для старіших дат виведе: "May 21, 23:30"
    const dateStr = parsedDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${dateStr}, ${timeStr}`;
  }
};
  // Завантаження сповіщень з сервера
  const loadNotifications = async () => {
    setLoading(true); 
    try {
      const token = localStorage.getItem('accessToken'); 

      const response = await axios.get('http://127.0.0.1:8000/api/notifications/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log("ВІДПОВІДЬ СЕРВЕРА:", response.data);
      setNotifications(response.data);
    } catch (error) {
      console.error("Помилка при завантаженні сповіщень:", error);
    } finally {
      setLoading(false); 
    }
  };

  // Позначити всі як прочитані (для верхньої кнопки)
  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('accessToken'); 
      if (!token) {
        console.error("No token found in localStorage");
        return;
      }

      await axios.post(
        'http://127.0.0.1:8000/api/notifications/mark_all_as_read/', 
        {}, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Позначити тільки ОДНЕ сповіщення як прочитане
  const handleMarkSingleAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('accessToken'); 
      if (!token) return;

      // Шлемо PATCH запит на конкретний ID
      await axios.patch(
        `http://127.0.0.1:8000/api/notifications/${notificationId}/`, 
        { is_read: true }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Змінюємо статус в стейті тільки для цього ID
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking single notification as read:', error);
    }
  };

  // Клік на рядок сповіщення
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkSingleAsRead(notification.id);
    }

    // Навігація залежно від типу
    switch (notification.notification_type) {
      case 'message':
        navigate(`/chat?chatId=${notification.target_id}`);
        break;
      case 'offer':
        navigate('/marketplace');
        break;
      case 'event':
        navigate('/events');
        break;
      default:
        break;
    }
  };

  // Вибір іконки
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'offer': return <Gift className="w-5 h-5 text-purple-600" />;
      case 'event': return <Calendar className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  // Перший запуск + інтервал автооновлення (кожні 30 сек)
  useEffect(() => {
    loadNotifications(); 

    const interval = setInterval(() => {
      loadNotifications(); 
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Фільтрація списку на клієнті
  const filteredNotifications = notifications
    .filter(n => statusFilter === 'all' || !n.is_read)
    .filter(n => typeFilter === 'all' || n.notification_type === typeFilter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto min-h-screen">
      {/* Шапка сторінки */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <p className="text-gray-600">Stay updated with events in your dormitory</p>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Панель Фільтрів */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              <Filter className="w-3 h-3 inline mr-1" /> Status
            </label>
            <div className="flex gap-2">
              {(['all', 'unread'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === s ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {s === 'all' ? 'All' : 'Unread'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="message">Messages</option>
              <option value="offer">Exchange Offers</option>
              <option value="event">Events</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Список сповіщень */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>There are no notifications matching the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`bg-white rounded-xl p-4 cursor-pointer border transition-all hover:shadow-md flex gap-4 ${
                !n.is_read ? 'border-l-4 border-l-blue-600 border-gray-200' : 'border-gray-100 opacity-75'
              }`}
            >
              <div className="flex-shrink-0">{getNotificationIcon(n.notification_type)}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-semibold ${!n.is_read ? 'text-gray-900' : 'text-gray-600'}`}>{n.title}</h3>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {formatTime(n.created_at)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}