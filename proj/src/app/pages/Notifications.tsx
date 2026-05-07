// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router';
// import { Bell, MessageCircle, Gift, Calendar, Check, Filter } from 'lucide-react';
// import { toast } from 'sonner';

// interface Notification {
//   id: string;
//   userId: string;
//   type: string;
//   title: string;
//   message: string;
//   data: any;
//   read: boolean;
//   createdAt: string;
// }

// export function Notifications() {
//   const navigate = useNavigate();
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState<'all' | 'unread'>('all');
//   const [typeFilter, setTypeFilter] = useState<string>('all');

//   useEffect(() => {
//     loadNotifications();
//   }, []);

//   const loadNotifications = async () => {
//     try {
//       setLoading(true);
//       const result = await api.getNotifications();
//       if (result.success) {
//         setNotifications(result.notifications);
//       } else {
//         console.error('Error loading notifications:', result.error);
//       }
//     } catch (error) {
//       console.error('Error loading notifications:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleMarkAsRead = async (notificationId: string) => {
//     try {
//       const result = await api.markNotificationRead(notificationId);
//       if (result.success) {
//         setNotifications(notifications.map(n =>
//           n.id === notificationId ? { ...n, read: true } : n
//         ));
//       }
//     } catch (error) {
//       console.error('Error marking notification as read:', error);
//     }
//   };

//   const handleNotificationClick = async (notification: Notification) => {
//     // Mark as read
//     if (!notification.read) {
//       await handleMarkAsRead(notification.id);
//     }

//     // Navigate based on notification type
//     switch (notification.type) {
//       case 'new_message':
//         navigate(`/chat?chatId=${notification.data.chatId}`);
//         break;
//       case 'exchange_offer':
//       case 'exchange_response':
//         navigate('/marketplace');
//         break;
//       case 'event_rsvp':
//         navigate('/events');
//         break;
//       default:
//         break;
//     }
//   };

//   const getNotificationIcon = (type: string) => {
//     switch (type) {
//       case 'new_message':
//         return <MessageCircle className="w-5 h-5 text-blue-600" />;
//       case 'exchange_offer':
//       case 'exchange_response':
//         return <Gift className="w-5 h-5 text-purple-600" />;
//       case 'event_rsvp':
//         return <Calendar className="w-5 h-5 text-green-600" />;
//       default:
//         return <Bell className="w-5 h-5 text-gray-600" />;
//     }
//   };

//   const filteredNotifications = notifications
//     .filter(n => filter === 'all' || !n.read)
//     .filter(n => typeFilter === 'all' || n.type === typeFilter);

//   const unreadCount = notifications.filter(n => !n.read).length;

//   return (
//     <div className="p-4 sm:p-6 max-w-4xl mx-auto">
//       <div className="mb-6">
//         <div className="flex items-center gap-3 mb-2">
//           <Bell className="w-8 h-8 text-blue-600" />
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
//           {unreadCount > 0 && (
//             <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
//               {unreadCount}
//             </span>
//           )}
//         </div>
//         <p className="text-gray-600">Stay updated with your dorm community</p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-lg shadow-md p-4 mb-6">
//         <div className="flex flex-col sm:flex-row gap-4">
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               <Filter className="w-4 h-4 inline mr-1" />
//               Status
//             </label>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => setFilter('all')}
//                 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                   filter === 'all'
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 All
//               </button>
//               <button
//                 onClick={() => setFilter('unread')}
//                 className={`px-4 py-2 rounded-lg font-medium transition-colors ${
//                   filter === 'unread'
//                     ? 'bg-blue-600 text-white'
//                     : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                 }`}
//               >
//                 Unread ({unreadCount})
//               </button>
//             </div>
//           </div>

//           <div className="flex-1">
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Type
//             </label>
//             <select
//               value={typeFilter}
//               onChange={(e) => setTypeFilter(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Types</option>
//               <option value="new_message">Messages</option>
//               <option value="exchange_offer">Exchange Offers</option>
//               <option value="exchange_response">Exchange Responses</option>
//               <option value="event_rsvp">Events</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Notifications List */}
//       {loading ? (
//         <div className="text-center py-12">
//           <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
//           <p className="text-gray-600 mt-4">Loading notifications...</p>
//         </div>
//       ) : filteredNotifications.length === 0 ? (
//         <div className="text-center py-12 bg-white rounded-lg shadow">
//           <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
//           <h3 className="text-xl font-semibold text-gray-900 mb-2">No Notifications</h3>
//           <p className="text-gray-600">
//             {filter === 'unread' 
//               ? "You're all caught up!" 
//               : "You don't have any notifications yet"}
//           </p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {filteredNotifications.map((notification) => (
//             <div
//               key={notification.id}
//               onClick={() => handleNotificationClick(notification)}
//               className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all hover:shadow-lg ${
//                 !notification.read ? 'border-l-4 border-blue-600' : ''
//               }`}
//             >
//               <div className="flex gap-4">
//                 <div className="flex-shrink-0 mt-1">
//                   {getNotificationIcon(notification.type)}
//                 </div>
                
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-start justify-between gap-2 mb-1">
//                     <h3 className="font-semibold text-gray-900">{notification.title}</h3>
//                     {notification.read && (
//                       <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
//                     )}
//                   </div>
                  
//                   <p className="text-gray-700 mb-2">{notification.message}</p>
                  
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-500">
//                       {new Date(notification.createdAt).toLocaleString('en-US', {
//                         month: 'short',
//                         day: 'numeric',
//                         hour: 'numeric',
//                         minute: '2-digit',
//                       })}
//                     </span>
                    
//                     {!notification.read && (
//                       <button
//                         onClick={(e) => {
//                           e.stopPropagation();
//                           handleMarkAsRead(notification.id);
//                         }}
//                         className="text-sm text-blue-600 hover:underline"
//                       >
//                         Mark as read
//                       </button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageCircle, Gift, Calendar, Check, Filter } from 'lucide-react';
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

  // Екземпляр axios (краще винести в окремий файл api.ts)
  const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
  });

   //useEffect(() => {
     //loadNotifications();
   //}, []); mb uncomment later on !!!!!!!!!!!!!!!!!! 


//   const loadNotifications = async () => {
//   try {
//     // 1. Отримуємо токен, який ми зберегли при логіні
//     const token = localStorage.getItem('accessToken'); 

//     // 2. Якщо токена немає, можна відправити користувача на сторінку логіну
//     if (!token) {
//       console.error("Токен не знайдено");
//       return;
//     }

//     // 3. Робимо запит, додаючи заголовок Authorization
//     const response = await axios.get('http://127.0.0.1:8000/api/notifications/', {
//       headers: {
//         Authorization: `Bearer ${token}` // Важливо: слово Bearer + пробіл + токен
//       }
//     });

//     setNotifications(response.data);
//   } catch (error) {
//     console.error("Error loading notifications:", error);
    
//     // Якщо сервер каже, що токен прострочений (401)
//     if (axios.isAxiosError(error) && error.response?.status === 401) {
//        // Тут можна додати логіку перенаправлення на /login
//        console.warn("Сесія завершена. Потрібно увійти знову.");
//     }
//   }
// };

const loadNotifications = async () => {
  // 1. Починаємо завантаження
  setLoading(true); 
  
  try {
    const token = localStorage.getItem('accessToken'); 

    if (!token) {
      console.error("Токен не знайдено");
      setLoading(false); // Зупиняємо лоадер, якщо токена немає
      return;
    }

    const response = await axios.get('http://127.0.0.1:8000/api/notifications/', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    setNotifications(response.data);
  } catch (error) {
    console.error("Error loading notifications:", error);
    
    if (axios.isAxiosError(error) && error.response?.status === 401) {
       console.warn("Сесія завершена.");
       // navigate('/login');
    }
  } finally {
    // 2. Цей блок виконується ЗАВЖДИ: і при успіху, і при помилці
    setLoading(false); 
  }
};

const handleMarkAllAsRead = async () => {
  try {
    // Отримуємо актуальний токен прямо зараз
    const token = localStorage.getItem('accessToken'); 

    if (!token) {
      console.error("No token found in localStorage");
      return;
    }

    // Використовуємо звичайний axios з явним заголовком
    await axios.post(
      'http://127.0.0.1:8000/api/notifications/mark_all_as_read/', 
      {}, // Порожнє тіло запиту
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    // Якщо сервер відповів 200 OK, оновлюємо UI
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await handleMarkAllAsRead();
    }

    // Навігація за допомогою нашого target_id
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

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'offer': return <Gift className="w-5 h-5 text-purple-600" />;
      case 'event': return <Calendar className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  useEffect(() => {
  loadNotifications(); 

  const interval = setInterval(() => {
    loadNotifications(); // Перевіряти кожні 30 сек
  }, 30000);

  return () => clearInterval(interval); // Очистити при закритті сторінки
}, []);

  const filteredNotifications = notifications
    .filter(n => statusFilter === 'all' || !n.is_read)
    .filter(n => typeFilter === 'all' || n.notification_type === typeFilter);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto min-h-screen">
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

      {/* Фільтри */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Status</label>
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
            </select>
          </div>
        </div>
      </div>

      {/* Список */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
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
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
