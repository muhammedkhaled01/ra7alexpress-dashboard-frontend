
import { useEffect, useRef } from "react";
import Echo from "@/utils/echo";

export const useNotificationsWebSocket = (user, onNewNotification) => {
  const onNewNotificationRef = useRef(onNewNotification);

  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    if (!Echo || !user || !user.id) {
      console.error('❌ Echo is not initialized or user is not authenticated');
      return;
    }

    const privateChannelName = `notifications.${user.id}`;
    let privateChannelInstance;

    try {
      privateChannelInstance = Echo.private(privateChannelName);

      const listener = (event) => {
        console.log('🎯 New notification received via WebSocket:', event);
        if (event.notification) {
          onNewNotificationRef.current(event.notification);
        }
      };

      privateChannelInstance.listen(".NotificationCreated", listener);
      console.log('✅ Successfully subscribed to private channel:', privateChannelName);

      return () => {
        console.log('🧹 Cleaning up WebSocket channel:', privateChannelName);
        privateChannelInstance.stopListening(".NotificationCreated", listener);
        Echo.leaveChannel(privateChannelName);
      };
    } catch (error) {
      console.error('❌ Failed to setup WebSocket channel:', error);
      return () => {};
    }
  }, [user]);
};