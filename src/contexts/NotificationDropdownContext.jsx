import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import axiosMerchant from '@/axios';
import { toast } from 'react-hot-toast';
import NotificationContext from './NotificationContext';
import { humanizeText } from "@/utils/helpers";
import { Bell, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSelector } from "react-redux";

export const NotificationDropdownProvider = ({ children }) => {
  const user = useSelector((store) => store.auth.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const processedNotificationsRef = useRef(new Set());

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sound.mp3');
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(error => {
          console.log('Audio play failed:', error);
        });
      });
      audio.addEventListener('error', (e) => {
        console.log('Audio loading error:', e);
      });
    } catch (error) {
      console.log('Audio error:', error);
    }
  };

  const showNewNotificationToast = useCallback((notification) => {
    const contentLines = notification.content?.split('\n') || [];
    const mainContent = contentLines.length > 0 ? contentLines[0] : notification.content;
    toast(
      (t) => (
        <div
          onClick={() => {
            // هنا يمكنك إضافة منطق التوجيه إذا لزم الأمر
            toast.dismiss(t.id);
          }}
          className="max-w-sm bg-white w-96 md:w-[500px] dark:bg-gray-800 rounded-lg shadow-lg border-l-4 border-blue-500 p-3 relative z-10 cursor-pointer"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(t.id);
            }}
            className="absolute top-2 right-9 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
            aria-label="Close notification"
          >
            <XIcon className="h-4 w-4" />
          </button>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Bell className="h-4 w-4 text-blue-500" />
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0 mr-4">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {notification.title || 'New Notification'}
              </p>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                {mainContent || 'No content'}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                  {humanizeText(notification.type || 'general')}
                </Badge>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(notification.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: 5000,
        position: 'top-right',
        className: 'p-0 bg-transparent shadow-none',
      }
    );
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const { data } = await axiosMerchant.get(`notifications?limit=5&user_id=${user.id}`);
      const notificationsData = data.data?.data || [];
      setNotifications(notificationsData);
      const currentUnreadCount = notificationsData.filter(n => !n.read_at).length;
      setUnreadCount(currentUnreadCount);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [user?.id, toast]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await axiosMerchant.patch(`notifications/${notificationId}/read`);
      setNotifications(prev => prev.map(n =>
        n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast.error("Failed to mark notification as read");
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosMerchant.patch("notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      toast.error("Failed to mark all notifications as read");
    }
  }, []);

  const addNewNotification = useCallback((notification) => {
    // منع إضافة إشعارات مكررة
    if (processedNotificationsRef.current.has(notification.id)) {
      return;
    }

    processedNotificationsRef.current.add(notification.id);

    setNotifications(prev => {
      // إضافة الإشعار الجديد في الأعلى وإزالة التكرارات
      const newNotifications = [notification, ...prev.filter(n => n.id !== notification.id)];
      return newNotifications.slice(0, 5); // الحد الأقصى 5 إشعارات
    });

    // زيادة العداد فقط إذا كان الإشعار غير مقروء
    if (!notification.read_at) {
      setUnreadCount(prev => prev + 1);
      playNotificationSound();
      showNewNotificationToast(notification);
    }
  }, [showNewNotificationToast]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loading,
        unreadCount,
        isDropdownOpen,
        setIsDropdownOpen,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        addNewNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

NotificationDropdownProvider.propTypes = {
  children: PropTypes.node.isRequired
};