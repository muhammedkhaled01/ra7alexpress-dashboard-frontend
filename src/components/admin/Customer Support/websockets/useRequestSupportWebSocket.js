// src/pages/websockets/useRequestSupportWebSocket.js
import {useEffect, useRef, useCallback} from "react";
import Echo from "@/utils/echo";
import toast from "react-hot-toast";
import {useTranslation} from "react-i18next";

export const useRequestSupportWebSocket = (
    sessionId,
    onMessageReceived,
    onSessionStatusChanged
) => {
    const {t} = useTranslation();
    const activeChannelRef = useRef(null);
    const isConnectedRef = useRef(false);

    // Initialize Echo instance and setup connection listeners once
    useEffect(() => {
        if (!Echo) {
            console.error("Echo is not available");
            return;
        }

        const pusher = Echo.connector.pusher;

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

    // Setup and cleanup merchant-specific channel
    useEffect(() => {
        if (!Echo || !sessionId) {
            console.log("No session ID, skipping WebSocket channel setup.");
            return;
        }

        const channelName = `merchant-chat.${sessionId}`;

        // Cleanup existing channel before setting up a new one
        if (activeChannelRef.current) {
            Echo.leave(activeChannelRef.current.name);
            console.log(`🧹 Left channel: ${activeChannelRef.current.name}`);
        }

        console.log(`📡 Joining merchant channel: ${channelName}`);
        try {
            const merchantChannel = Echo.private(channelName)
                .subscribed(() => {
                    console.log(`✅ Successfully subscribed to ${channelName}`);
                })
                .error((error) => {
                    console.error(`❌ Failed to subscribe to ${channelName}:`, error);
                    toast.error(t("merchant_channel_error"));
                })
                .listen(".merchant.message.sent", (event) => {
                    console.log(`📨 Message received for session ${sessionId}:`, event);
                    onMessageReceived(event);
                })
                .listen(".merchant.session.status.changed", (event) => {
                    console.log(`🔄 Session status changed for session ${sessionId}:`, event);
                    onSessionStatusChanged(event);
                });

            activeChannelRef.current = merchantChannel;

            return () => {
                if (activeChannelRef.current) {
                    Echo.leave(activeChannelRef.current.name);
                    activeChannelRef.current = null;
                }
            };
        } catch (error) {
            console.error(`Error setting up merchant channel ${channelName}:`, error);
            return () => {
            };
        }
    }, [sessionId, onMessageReceived, onSessionStatusChanged, t]);

    return {
        isConnected: isConnectedRef.current,
    };
};