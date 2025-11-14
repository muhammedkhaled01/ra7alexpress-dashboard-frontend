import { useEffect, useRef, useCallback } from "react";
import Echo from "@/utils/echo";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export const useMerchantChatWebSocket = (
    selectedMerchant,
    onMessageReceived,
    onSessionStatusChanged
) => {
    const { t } = useTranslation();
    const activeChannelsRef = useRef(new Map());
    const isConnectedRef = useRef(false);
    const echoInstanceRef = useRef(null);

    // Initialize Echo instance
    const initializeEcho = useCallback(() => {
        if (!Echo) {
            console.error("Echo is not available");
            return null;
        }

        echoInstanceRef.current = Echo;
        return echoInstanceRef.current;
    }, []);

    // Connection status management
    const setupConnectionListeners = useCallback((echo) => {
        if (!echo || !echo.connector || !echo.connector.pusher) {
            console.error("Echo connector is not available");
            return;
        }

        const pusher = echo.connector.pusher;

        const handleConnected = () => {
            console.log("✅ WebSocket connected successfully");
            isConnectedRef.current = true;
        };

        const handleDisconnected = () => {
            console.log("❌ WebSocket disconnected");
            isConnectedRef.current = false;
        };

        const handleError = (error) => {
            console.error("⚠️ WebSocket error:", error);
            isConnectedRef.current = false;
            toast.error(t("websocket_connection_error"));
        };

        pusher.connection.bind("connected", handleConnected);
        pusher.connection.bind("disconnected", handleDisconnected);
        pusher.connection.bind("error", handleError);

        return () => {
            pusher.connection.unbind("connected", handleConnected);
            pusher.connection.unbind("disconnected", handleDisconnected);
            pusher.connection.unbind("error", handleError);
        };
    }, [t]);

    // Admin channel for global merchant chat updates
    const setupAdminChannel = useCallback((echo) => {
        if (!echo) {
            console.error("Echo is not available for admin channel");
            return null;
        }

        console.log("📡 Setting up admin channel...");

        try {
            const adminChannel = echo.private("chat-admin")
                .subscribed(() => {
                    console.log("✅ Successfully subscribed to admin channel");
                })
                .error((error) => {
                    console.error("❌ Failed to subscribe to admin channel:", error);
                    toast.error(t("admin_channel_error"));
                })
                .listen(".merchant.message.sent", (event) => {
                    console.log("📨 Message received via admin channel:", event);
                    onMessageReceived(event);
                })
                .listen(".merchant.session.status.changed", (event) => {
                    console.log("🔄 Session status changed via admin channel:", event);
                    onSessionStatusChanged(event);
                });

            activeChannelsRef.current.set('admin-channel', adminChannel);
            return adminChannel;
        } catch (error) {
            console.error("Error setting up admin channel:", error);
            return null;
        }
    }, [onMessageReceived, onSessionStatusChanged, t]);


    // Cleanup all channels
    const cleanupChannels = useCallback((echo) => {
        console.log("🧹 Cleaning up all WebSocket channels...");

        activeChannelsRef.current.forEach((channel, channelName) => {
            try {
                channel.stopListening(".merchant.message.sent");
                channel.stopListening(".merchant.session.status.changed");
                if (echo) {
                    echo.leave(channelName);
                }
            } catch (error) {
                console.error(`Error cleaning up channel ${channelName}:`, error);
            }
        });

        activeChannelsRef.current.clear();
    }, []);

    // Main setup effect
    useEffect(() => {
        const echo = initializeEcho();
        if (!echo) return;

        const cleanupConnection = setupConnectionListeners(echo);
        const adminChannel = setupAdminChannel(echo);

        return () => {
            if (adminChannel) {
                adminChannel.stopListening(".merchant.message.sent");
                adminChannel.stopListening(".merchant.session.status.changed");
            }
            cleanupChannels(echo);
            if (cleanupConnection) cleanupConnection();
        };
    }, [initializeEcho, setupConnectionListeners, setupAdminChannel, cleanupChannels]);

    // Setup merchant-specific channel when merchant is selected

    return {
        isConnected: isConnectedRef.current,
        activeChannels: Array.from(activeChannelsRef.current.keys()),
        echoInstance: echoInstanceRef.current,
    };
};