import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import axiosMerchant from '@/axios';
import { toast as hotToast } from 'react-hot-toast';
import Echo from '@/utils/echo';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {useSelector} from "react-redux";

// Create the Notifications context
const NotificationContext = createContext();

// Provider component to wrap your entire app
export const NotificationProvider = ({ children }) => {
    const user = useSelector((store) => store.auth.user);
    const [notifications, setNotifications] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const activeChannelRef = useRef(null);
    const { t } = useTranslation();
    const location = useLocation();
    // Fetch initial notifications from the API
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const userId = user?.id;
                const params = { user_id: userId };
                const response = await axiosMerchant.get('notifications', { params });
                setNotifications(response.data.data.data);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };
        fetchNotifications();
    }, []);

    // Function to subscribe to the notifications channel
    const subscribeToNotifications = useCallback(() => {
        if (!Echo) {
            console.error('Echo merchant not initialized');
            return;
        }

        // Subscribe to private notifications channel
        const channel = Echo.private('notifications');

        channel.subscribed(() => {
            console.log('✅ Subscribed to private notifications channel');
            setIsConnected(true);
        })
            .error(error => {
                console.error('❌ Subscription to notifications channel failed:', error);
                setIsConnected(false);
            })
            .listen('.message.sent', (event) => {
                if (location.pathname.startsWith('/live-chat')) return;
                console.log('🔔 New notification received:', event);
                hotToast.success(
                    <div>
                        <span style={{ fontWeight: 'bold' }}>{event.sender_name}</span> {t("sent a new message")}:{' '}
                        <span style={{ fontWeight: 'bold' }}>
                            {event.message && event.message.length > 50
                                ? event.message.slice(0, 50) + '...'
                                : event.message}
                        </span>
                        {' '}
                        <a className='text-blue-500' href={`/live-chat/${event.chat_session_id}`}>{t("read more...")}</a>
                    </div>,
                    {
                        position: 'bottom-right',
                        style: {
                            minWidth: '250px',
                            fontSize: '1rem',
                        },
                        icon: '💬',
                    }
                );
                const newNotification = {
                    id: Date.now().toString(),
                    type: event.type || 'notification',
                    data: event.data,
                    created_at: new Date().toISOString(),
                    read_at: null,
                    sender_name: event.sender_name,
                };
                setNotifications(prev => [newNotification, ...prev]);
            })
            .listen('.session.status.changed', (event) => {
                console.log('🔄 Session status changed:', event);
                hotToast.success(
                    <div>
                        {t("A new chat has been created by: ")} <span style={{ fontWeight: 'bold' }}>{event.session?.customer_name}</span>
                        {' '}
                        <a className='text-blue-500' href={`/live-chat/${event.session?.id}`}>{t("read more...")}</a>
                    </div>,
                    {
                        position: 'bottom-right',
                        style: {
                            minWidth: '250px',
                            fontSize: '1rem',
                        },
                        icon: '💬',
                    }
                );
                const sessionNotification = {
                    id: Date.now().toString(),
                    type: event.type || 'session_status',
                    data: event,
                    created_at: new Date().toISOString(),
                    read_at: null,
                    sender_name: event.sender_name,
                };
                setNotifications(prev => [sessionNotification, ...prev]);
            });

        activeChannelRef.current = channel;
    }, []);

    useEffect(() => {
        subscribeToNotifications();

        return () => {
            if (activeChannelRef.current) {
                activeChannelRef.current.stopListening('.message.sent');
                activeChannelRef.current.stopListening('session.status.changed');
                Echo.leaveChannel('private-notifications');
                activeChannelRef.current = null;
                console.log('🧹 Disconnected from notifications channel');
            }
        };
    }, [subscribeToNotifications]);

    // Compute unread count
    const unreadCount = notifications.filter(n => !n.read_at).length;

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isConnected }}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook for consuming notifications easily
export const useNotifications = () => useContext(NotificationContext);
