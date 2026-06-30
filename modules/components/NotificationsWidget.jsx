import React, { useState, useEffect } from 'react';
import { Smartphone, Bell, BellRing, Clock, RefreshCw } from 'lucide-react';

const NotificationsWidget = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/phone/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Odświeżaj co 15 sekund
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex flex-col p-2 space-y-4 font-mono">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-accentPrimary" />
          <h3 className="font-bold text-accentPrimary uppercase tracking-widest text-sm">Signal Intercept</h3>
        </div>
        <button 
          onClick={fetchNotifications}
          className="text-textMuted hover:text-accentPrimary transition-colors"
          title="Odśwież"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 px-1 pb-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-textMuted opacity-50 space-y-2">
            <Bell className="w-8 h-8" />
            <span className="text-xs uppercase">Brak sygnałów</span>
          </div>
        ) : (
          notifications.map(notif => (
            <div 
              key={notif.id} 
              className={`p-3 rounded-lg border ${
                notif.is_read 
                  ? 'bg-surface border-border/50 text-textMuted' 
                  : 'bg-accentPrimary/5 border-accentPrimary text-textPrimary shadow-[0_0_10px_rgba(var(--color-accent-primary-hex),0.1)]'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-1.5">
                  {notif.is_read ? <Bell className="w-3 h-3 opacity-50" /> : <BellRing className="w-3 h-3 text-accentPrimary" />}
                  <span className={`text-xs font-bold ${notif.is_read ? 'text-textMuted' : 'text-accentSecondary'}`}>
                    {notif.app_name}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-50 text-[10px]">
                  <Clock className="w-3 h-3" />
                  <span>
                    {new Date(notif.created_at).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              <div className={`text-sm font-bold mb-1 truncate ${notif.is_read ? '' : 'text-accentPrimary'}`}>
                {notif.title}
              </div>
              <div className="text-xs opacity-80 line-clamp-3">
                {notif.content}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsWidget;
