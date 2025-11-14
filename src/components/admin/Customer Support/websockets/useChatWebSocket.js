import { useEffect, useRef, useCallback } from "react";
import Echo from "@/utils/echo";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useChatWebSocket = (
  selectedChat,
  onMessageReceived,
  onSessionStatusChanged
) => {
  const { t } = useTranslation();
  const activeChannelsRef = useRef(new Set());
  const isConnectedRef = useRef(false);

  // Connection status management
  const setupConnectionListeners = useCallback(() => {
    if (!Echo || !Echo.connector || !Echo.connector.pusher) {
      console.error("Echo is not available or not properly configured");
      return;
    }

    const pusher = Echo.connector.pusher;

    // Connection event listeners
    const handleConnected = () => {
      console.log("✅ WebSocket connected");
      isConnectedRef.current = true;
    };

    const handleDisconnected = () => {
      console.log("❌ WebSocket disconnected");
      isConnectedRef.current = false;
    };

    const handleError = (error) => {
      console.error("⚠️ WebSocket error:", error);
      isConnectedRef.current = false;
    };

    const handleAuthError = (error) => {
      console.error("🔐 WebSocket authentication error:", error);
      isConnectedRef.current = false;
    };

    // Bind event listeners
    pusher.connection.bind("connected", handleConnected);
    pusher.connection.bind("disconnected", handleDisconnected);
    pusher.connection.bind("error", handleError);
    pusher.connection.bind("auth_error", handleAuthError);

    // Return cleanup function
    return () => {
      pusher.connection.unbind("connected", handleConnected);
      pusher.connection.unbind("disconnected", handleDisconnected);
      pusher.connection.unbind("error", handleError);
      pusher.connection.unbind("auth_error", handleAuthError);
    };
  }, []);

  // Admin channel for general chat updates
  const setupAdminChannel = useCallback(() => {
    if (!Echo) {
      console.error("❌ Echo is not available for admin channel");
      return null;
    }

    console.log("📡 Setting up PRIVATE admin channel (chat-admin)...");

    const adminChannel = Echo.private("chat-admin")
      .subscribed(() => {
        console.log("✅ Successfully subscribed to PRIVATE chat-admin channel");
      })
      .error((error) => {
        console.error(
          "❌ Failed to subscribe to private chat-admin channel:",
          error
        );
        toast.error(t("websocket_connection_error"));
      })
      .listenToAll((eventName, data) => {
        console.log(
          "🌐 ALL EVENT RECEIVED on private chat-admin:",
          eventName,
          data
        );
      })
      .listen(".message.sent", (e) => {
        console.log("📨 New message received on private admin channel:", e);
        onMessageReceived(e);
      })
      .listen(".session.status.changed", (e) => {
        console.log(
          "🔄 Session status changed on private admin channel - EVENT RECEIVED!"
        );
        onSessionStatusChanged(e);
      });

    return adminChannel;
  }, [onMessageReceived, onSessionStatusChanged, t]);

  // Specific chat session channel
  const setupSessionChannel = useCallback(
    (sessionId) => {
      if (!Echo || !sessionId) return null;

      const channelName = `chat-session.${sessionId}`;

      // Leave previous channel if exists
      if (activeChannelsRef.current.has(channelName)) {
        Echo.leaveChannel(channelName);
        activeChannelsRef.current.delete(channelName);
      }

      console.log(`📡 Joining session channel: ${channelName}`);

      const sessionChannel = Echo.channel(channelName)
        .subscribed(() => {
          console.log(`✅ Successfully subscribed to ${channelName}`);
          activeChannelsRef.current.add(channelName);
        })
        .error((error) => {
          console.error(`❌ Failed to subscribe to ${channelName}:`, error);
          toast.error(t("session_channel_error"));
        })
        .listen(".message.sent", (e) => {
          console.log(`📨 Message received for session ${sessionId}:`, e);
          onMessageReceived(e);
        })
        .listen(".session.status.changed", (e) => {
          console.log(`🔄 Session status changed for ${sessionId}:`, e);
          onSessionStatusChanged(e);
        });

      return sessionChannel;
    },
    [onMessageReceived, onSessionStatusChanged, t]
  );

  // Cleanup function for channels
  const cleanupChannels = useCallback(() => {
    console.log("🧹 Cleaning up WebSocket channels...");
    activeChannelsRef.current.forEach((channelName) => {
      Echo.leaveChannel(channelName);
    });
    activeChannelsRef.current.clear();
  }, []);

  // Setup connection listeners
  useEffect(() => {
    const cleanupConnection = setupConnectionListeners();
    return cleanupConnection;
  }, [setupConnectionListeners]);

  // Setup admin channel
  useEffect(() => {
    const adminChannel = setupAdminChannel();

    return () => {
      if (adminChannel) {
        adminChannel.stopListening(".message.sent");
        adminChannel.stopListening(".session.status.changed");
        Echo.leaveChannel("chat-admin");
      }
    };
  }, [setupAdminChannel]);

  // Setup session-specific channel when chat is selected
  useEffect(() => {
    if (!selectedChat?.id) return;

    const sessionChannel = setupSessionChannel(selectedChat.id);

    return () => {
      if (sessionChannel) {
        sessionChannel.stopListening(".message.sent");
        sessionChannel.stopListening(".session.status.changed");
        Echo.leaveChannel(`chat-session.${selectedChat.id}`);
        activeChannelsRef.current.delete(`chat-session.${selectedChat.id}`);
      }
    };
  }, [selectedChat?.id, setupSessionChannel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupChannels();
    };
  }, [cleanupChannels]);

  return {
    isConnected: isConnectedRef.current,
    activeChannels: Array.from(activeChannelsRef.current),
  };
};
